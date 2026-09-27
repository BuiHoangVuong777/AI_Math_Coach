import { create } from 'zustand';
import { requestProblem, requestTurn, fetchStatus, type ServerStatus } from '@/lib/reasoning/client';
import { confirmAndStart, planForContext } from '@/lib/reasoning/orchestrator';
import { applyClarification, buildProblemFromForm, type GivenEdit, type ProblemForm } from '@/lib/reasoning/problemParser';
import type { Clarification, CoachResponse, DegradedFlags, ProblemSpec, SessionContext, TurnOp, VisualSpec } from '@/lib/reasoning/types';

export type UiPhase = 'problem_input' | 'problem_review' | 'session';
export type Group = 'givens' | 'unknowns' | 'conditions' | 'target';

/** v0.5 graph presentation state — UI only; never sent to the orchestrator (FR-XM-001). */
export type GraphMode = 'learner' | 'presenter' | 'debug';
export type GraphView = 'map' | 'list';
export type VisualTab = 'graph' | '3d' | 'chart';

export interface CoachEntry {
  id: number;
  coach: CoachResponse;
}

interface CanvasStore {
  ui: UiPhase;
  problemText: string;
  draft: ProblemSpec | null;
  edits: Record<string, GivenEdit>;
  confirmedGroups: Group[];
  ctx: SessionContext | null;
  specs: VisualSpec[];
  coachLog: CoachEntry[];
  clarification: Clarification | null;
  selected: string[];
  pending: boolean;
  error: string | null;
  degraded: DegradedFlags;
  status: ServerStatus | null;
  /** Nodes whose dependencies are being re-checked (shown as "đang kiểm tra lại"). */
  staleIds: string[];
  recentlyChanged: string[];
  graphMode: GraphMode;
  graphView: GraphView | null;
  selectedEdgeId: string | null;
  visualTab: VisualTab;
  editingNodeId: string | null;
  setGraphMode(m: GraphMode): void;
  setGraphView(v: GraphView): void;
  selectEdge(edgeId: string | null, nodeIds?: string[]): void;
  setVisualTab(t: VisualTab): void;
  setEditing(nodeId: string | null): void;

  loadStatus(): Promise<void>;
  setProblemText(t: string): void;
  submitProblem(): Promise<void>;
  clarifyProblem(id: string, option: number): void;
  editGiven(e: GivenEdit): void;
  toggleGroup(g: Group): void;
  confirm(): void;
  useForm(form: ProblemForm): void;
  turn(op: TurnOp, opts?: { localOnly?: boolean; stale?: string[] }): Promise<boolean>;
  select(ids: string[]): void;
  backToInput(): void;
  reset(): void;
}

let opCounter = 0;
let sessionEpoch = 0;
const newOpId = () => `${Date.now().toString(36)}-${(++opCounter).toString(36)}`;

const initial = {
  ui: 'problem_input' as UiPhase,
  problemText: '',
  draft: null,
  edits: {},
  confirmedGroups: [] as Group[],
  ctx: null,
  specs: [] as VisualSpec[],
  coachLog: [] as CoachEntry[],
  clarification: null,
  selected: [] as string[],
  pending: false,
  error: null,
  degraded: {} as DegradedFlags,
  staleIds: [] as string[],
  recentlyChanged: [] as string[],
  graphMode: 'learner' as GraphMode,
  graphView: null as GraphView | null,
  selectedEdgeId: null as string | null,
  visualTab: '3d' as VisualTab,
  editingNodeId: null as string | null,
};

/**
 * In-memory Canvas session (no persistence: storage, retention and consent are TBD,
 * NFR-PRIV-002/007). Every learner operation goes through the orchestrator.
 */
export const useCanvas = create<CanvasStore>((set, get) => ({
  ...initial,
  status: null,

  async loadStatus() {
    set({ status: await fetchStatus() });
  },
  setProblemText(t) {
    set({ problemText: t });
  },
  async submitProblem() {
    const text = get().problemText.trim();
    if (!text || get().pending) return;
    set({ pending: true, error: null });
    const epoch = sessionEpoch;
    const { spec, degraded } = await requestProblem(text);
    if (epoch !== sessionEpoch) return;
    set({ pending: false, draft: spec, degraded, edits: {}, confirmedGroups: [], ui: 'problem_review' });
  },
  clarifyProblem(id, option) {
    const d = get().draft;
    if (d) set({ draft: applyClarification(d, id, option) });
  },
  editGiven(e) {
    set({ edits: { ...get().edits, [e.symbol]: e } });
  },
  toggleGroup(g) {
    const cur = get().confirmedGroups;
    set({ confirmedGroups: cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g] });
  },
  confirm() {
    const d = get().draft;
    if (!d) return;
    try {
      const ctx = confirmAndStart(d, Object.values(get().edits));
      set({ ctx, ui: 'session', specs: planForContext(ctx), coachLog: [], clarification: null, selected: [], visualTab: '3d', error: null });
    } catch {
      set({ error: 'Đề chưa được xác nhận đầy đủ.' });
    }
  },
  useForm(form) {
    const spec = buildProblemFromForm(form);
    set({ draft: spec, ui: 'problem_review', edits: {}, confirmedGroups: [] });
  },
  async turn(op, opts = {}) {
    const { ctx, pending } = get();
    if (!ctx || pending) return false; // FR-REC-002: one request at a time
    const g = ctx.phase === 'independent' && ctx.independent ? ctx.independent.graph : ctx.graph;
    const version = g.version;
    set({ pending: true, error: null, staleIds: opts.stale ?? [] });
    const outcome = await requestTurn({ context: ctx, expectedGraphVersion: version, opId: newOpId(), op, selectedNodeIds: get().selected }, { localOnly: opts.localOnly });
    // FR-REC-003: drop a result computed for an older state.
    const now = get().ctx;
    const nowG = now && (now.phase === 'independent' && now.independent ? now.independent.graph : now.graph);
    if (now !== ctx) return false; // logout/reset/new session: never change the new store
    if (outcome.kind === 'stale' || !nowG || nowG.version !== version) {
      set({ pending: false, staleIds: [], error: outcome.kind === 'stale' ? 'Kết quả cũ đã bị bỏ qua. Em thử lại nhé.' : null });
      return false;
    }
    const r = outcome.result;
    if (r.error) {
      set({ pending: false, staleIds: [], error: r.error.message });
      return false;
    }
    const coachLog = r.coach ? [...get().coachLog, { id: Date.now() + Math.random(), coach: r.coach }] : get().coachLog;
    set({
      ctx: r.context,
      specs: r.visualSpecs,
      coachLog,
      clarification: r.clarification,
      pending: false,
      staleIds: [],
      degraded: { ...r.degraded },
      recentlyChanged: r.changedNodeIds,
    });
    window.setTimeout(() => {
      // An earlier turn's timer must not erase a more recent update.
      if (get().recentlyChanged === r.changedNodeIds) set({ recentlyChanged: [] });
    }, 3000);
    return true;
  },
  select(ids) {
    const ctx = get().ctx;
    set({ selected: ids, selectedEdgeId: null, specs: ctx ? planForContext(ctx, ids) : get().specs });
  },
  setGraphMode(m) {
    set({ graphMode: m });
  },
  setGraphView(v) {
    set({ graphView: v });
  },
  selectEdge(edgeId, nodeIds = []) {
    const ctx = get().ctx;
    set({ selectedEdgeId: edgeId, selected: nodeIds, specs: ctx ? planForContext(ctx, nodeIds) : get().specs });
  },
  setVisualTab(t) {
    set({ visualTab: t });
  },
  setEditing(nodeId) {
    set({ editingNodeId: nodeId });
  },
  backToInput() {
    sessionEpoch++;
    set({ ...initial, problemText: get().problemText, status: get().status });
  },
  reset() {
    sessionEpoch++;
    set({ ...initial, status: get().status });
  },
}));
