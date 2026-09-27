/**
 * Orchestrator (§8.8): one deterministic pipeline behind which the four logical
 * capabilities run — Reasoning Parser (rules → optional LLM → grounding), Math
 * Validator, Visual Planner and Tutor (optional LLM → validated, else rule-based).
 *
 * `runTurn` is pure apart from the injected LLM ports; with ports = null it runs
 * fully offline (used by the browser when the server is unreachable).
 * The LLM never decides correctness, never writes learner text and never changes
 * the session phase.
 */
import { generateAnalog } from './analog.ts';
import { buildForbidden, allowedLevel, nodeDisclosure, validateTutorOutput, type ForbiddenValue } from './disclosure.ts';
import { equals, formatExact, fromNumber } from './exact.ts';
import { displaySymbol } from './expr.ts';
import { solveProblem, type ProblemFacts } from './facts.ts';
import {
  GraphError, addRow, appendEvent, conflictOf, createGraph, learnerNodes, retractRow, revalidate, reviseRow, toInterpretation,
  transitiveDependents, updateNode,
} from './graph.ts';
import { groundProblemMentions, groundRowParse, llmToStatement, validateLLMRowParse } from './grounding.ts';
import { assembleSpec, confirmProblem, needsLLMHelp, parseProblem, type Contradiction } from './problemParser.ts';
import { analyzeJustification, parseRow } from './rowParser.ts';
import { fallbackResponse } from './tutorFallback.ts';
import { planVisuals, sliderDomain, snapTo } from './visualPlanner.ts';
import type {
  Clarification, CoachContext, CoachResponse, DegradedFlags, DisclosureLevel, ExperimentState, GraphEvent, IndependentEvaluation,
  IndependentState, Interpretation, ProblemSpec, ReasoningGraph, ReasoningNode, SessionContext, SymbolId, TurnOp, TurnRequest,
  TurnResult, TutorTrigger, VisualSpec,
} from './types.ts';
import { LIMITS } from './types.ts';

// ------------------------------------------------------------------ ports

export interface ParserInput {
  problemText: string;
  rowText: string;
  symbols: string[];
  cylinderLabels: string[];
  /** Normalised summaries of other rows — never their original text (NFR-PRIV-005). */
  activeNodes: { row: number; displayText: string }[];
}
export type ParserPort = (input: ParserInput) => Promise<unknown>;
export type TutorPort = (ctx: CoachContext) => Promise<unknown>;
export type ProblemPort = (input: { problemText: string }) => Promise<unknown>;

export interface Ports {
  parser?: ParserPort | null;
  tutor?: TutorPort | null;
  problem?: ProblemPort | null;
  now?: () => number;
  /** Test-only: allow `start_independent.analogText` (REG-01). The server never sets it. */
  allowAnalogOverride?: boolean;
}

// ------------------------------------------------------------------ session start (F1)

export async function interpretProblem(text: string, ports: Ports = {}): Promise<{ spec: ProblemSpec; degraded: DegradedFlags }> {
  const det = parseProblem(text);
  const degraded: DegradedFlags = {};
  if (!needsLLMHelp(det) || det.text.length > LIMITS.problemText) return { spec: det, degraded };
  if (!ports.problem) return { spec: det, degraded: { parser: 'rules_only' } };
  try {
    const raw = await ports.problem({ problemText: det.text });
    const grounded = groundProblemMentions(det.text, raw);
    if (!grounded.ok || !grounded.value.length) return { spec: det, degraded: { parser: 'failed' } };
    const spec = assembleSpec(det.text, grounded.value, 'llm_interpretation');
    return { spec, degraded };
  } catch {
    return { spec: det, degraded: { parser: 'failed' } };
  }
}

export function startSession(spec: ProblemSpec, contradictions: Contradiction[] = [], now = Date.now()): SessionContext {
  if (spec.interpretationStatus !== 'confirmed') throw new GraphError('problem_not_confirmed');
  let graph = createGraph(spec, 'main', now, contradictions);
  graph = revalidate(graph, { spec, facts: solveProblem(spec), experiment: null, now }).graph;
  return {
    problemSpec: spec, graph, phase: 'reasoning', disclosure: {}, experiment: null, independent: null, processedOpIds: [], pendingRevisedBy: null,
  };
}

/** Convenience used by tests and the client: confirm (with edits) and start. */
export function confirmAndStart(spec: ProblemSpec, edits: Parameters<typeof confirmProblem>[1] = [], now = Date.now()): SessionContext {
  const { spec: confirmed, contradictions } = confirmProblem(spec, edits, now);
  return startSession(confirmed, contradictions, now);
}

// ------------------------------------------------------------------ helpers

function active(ctx: SessionContext): { spec: ProblemSpec; graph: ReasoningGraph; independent: boolean } {
  if (ctx.phase === 'independent' && ctx.independent) return { spec: ctx.independent.problemSpec, graph: ctx.independent.graph, independent: true };
  return { spec: ctx.problemSpec, graph: ctx.graph, independent: false };
}

function withGraph(ctx: SessionContext, g: ReasoningGraph, independent: boolean): SessionContext {
  if (independent && ctx.independent) return { ...ctx, independent: { ...ctx.independent, graph: g } };
  return { ...ctx, graph: g };
}

function fail(req: TurnRequest, code: string, message: string, specs: VisualSpec[] = []): TurnResult {
  return { context: req.context, changedNodeIds: [], visualSpecs: specs, removedSpecIds: [], coach: null, clarification: null, events: [], degraded: {}, error: { code, message } };
}

const ERR: Record<string, string> = {
  version_conflict: 'Phiên bản đồ thị đã thay đổi; kết quả cũ bị bỏ qua.',
  empty_row: 'Dòng trống.',
  row_too_long: `Mỗi dòng tối đa ${LIMITS.rowText} ký tự.`,
  too_many_rows: `Tối đa ${LIMITS.maxLearnerNodes} dòng.`,
  not_allowed: 'Thao tác này không dùng được ở giai đoạn hiện tại.',
  not_found: 'Không tìm thấy dòng.',
  hypothesis_required: 'Em ghi một dự đoán (một dòng) trước khi thử nghiệm nhé.',
  experiment_unavailable: 'Bài này chưa có đủ kích thước để dựng thử nghiệm.',
  analog_unavailable: 'Chưa tạo được bài tương tự cho dạng bài này.',
  already_submitted: 'Bài độc lập đã được gửi.',
  message_too_long: `Tin nhắn tối đa ${LIMITS.coachMessage} ký tự.`,
};

async function interpretRow(text: string, spec: ProblemSpec, g: ReasoningGraph, experiment: boolean, ports: Ports, degraded: DegradedFlags): Promise<Interpretation> {
  const det = parseRow(text, { spec, experiment });
  const base = toInterpretation(det);
  if (det.status !== 'unparsed') return base;
  if (!ports.parser) {
    degraded.parser = 'rules_only';
    return base;
  }
  const input: ParserInput = {
    problemText: spec.text, rowText: text,
    symbols: Object.keys(solveProblem(spec)),
    cylinderLabels: spec.cylinders.map((c) => c.label),
    activeNodes: learnerNodes(g).filter((n) => n.lifecycle === 'active' && n.rowIndex > 0).slice(-10).map((n) => ({ row: n.rowIndex, displayText: n.interpretation.displayText })),
  };
  let parsed: ReturnType<typeof validateLLMRowParse> | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      parsed = validateLLMRowParse(await ports.parser(input));
    } catch {
      degraded.parser = 'rules_only';
      return base;
    }
    if (parsed.ok) break; // retry once only for schema-invalid output
  }
  if (!parsed || !parsed.ok) {
    degraded.parser = 'failed';
    return base;
  }
  const v = parsed.value;
  const st = llmToStatement(v);
  if (!st) return { ...base, provenance: 'llm_interpretation' };
  const display = st.kind === 'equation' ? `${st.target ? displaySymbol(st.target) + ' = ' : ''}${st.chain.join(' = ')}` : st.kind === 'scaling' ? `Nếu ${st.changes.map((c) => `${displaySymbol(c.symbol)} = ${formatExact(c.factor)}`).join(', ')} thì ${displaySymbol(st.claim.symbol)} = ${formatExact(st.claim.factor)}` : v.semanticType;
  const report = groundRowParse(text, st, spec, det);
  const interp: Interpretation = {
    ...base,
    provenance: 'llm_interpretation',
    semanticType: v.semanticType,
    normalized: st,
    displayText: display,
    justification: v.justification ? analyzeJustification(v.justification, spec) : null,
  };
  if (!report.ok || v.ambiguous) {
    return {
      ...interp,
      status: 'ambiguous',
      alternatives: [{ statement: st, semanticType: v.semanticType, displayText: `Có phải ý em là: ${display}?` }],
      ambiguities: [{ code: report.ok ? 'multiple_readings' : 'grounding_failed', span: null, question: v.question && report.ok ? v.question : `Hệ thống chưa chắc cách đọc dòng này (${report.failures.join(', ') || 'mơ hồ'}). Có phải ý em là: ${display}?` }],
    };
  }
  return { ...interp, status: 'interpreted' };
}

// ------------------------------------------------------------------ coach policy

interface CoachPlan {
  trigger: TutorTrigger;
  focusId: string | null;
  rootRows: number[];
  message: string | null;
}

function earliestInvalidRoot(g: ReasoningGraph): ReasoningNode | null {
  const roots = learnerNodes(g).filter((n) => n.lifecycle === 'active' && n.validation?.status === 'invalid' && !n.validation.rootCauseNodeIds.length && !n.revisedBy.length);
  return roots[0] ?? null;
}

function decideCoach(ctx: SessionContext, nodeId: string, op: TurnOp['type']): CoachPlan | null {
  const g = ctx.graph;
  const n = g.nodes[nodeId];
  if (!n || n.lifecycle !== 'active' || !n.validation) return null;
  const v = n.validation;
  const coached = (id: string) => {
    const d = nodeDisclosure(ctx.disclosure, id);
    return d.lastCoachedRevision === g.nodes[id]?.revision;
  };
  if (n.interpretation.semanticType === 'question') {
    const root = earliestInvalidRoot(g);
    return { trigger: 'learner_question', focusId: root?.id ?? null, rootRows: [], message: n.originalText };
  }
  if (v.status === 'ambiguous') return null;
  if (op === 'edit_row' && v.status === 'valid') {
    // The edit may leave later rows with stale premises: coach the earliest one once.
    const stale = learnerNodes(g).find((x) => x.lifecycle === 'active' && x.validation?.reasonCodes.includes('premise_changed'));
    if (stale && !coached(stale.id)) return { trigger: 'invalid_node', focusId: stale.id, rootRows: [n.rowIndex], message: null };
  }
  const conclusionOnInvalid = v.status === 'insufficient_evidence' && v.reasonCodes.includes('depends_on_invalid') && n.interpretation.semanticType === 'conclusion';
  if (v.status === 'invalid' || conclusionOnInvalid) {
    let focus = v.status === 'invalid' ? (v.rootCauseNodeIds[0] ?? n.id) : n.id;
    const earliest = earliestInvalidRoot(g);
    if (v.status === 'invalid' && earliest && g.nodes[focus].rowIndex > earliest.rowIndex) focus = earliest.id;
    if (coached(focus)) return null;
    const rootRows = (conclusionOnInvalid ? v.rootCauseNodeIds : g.nodes[focus].validation?.rootCauseNodeIds ?? []).map((id) => g.nodes[id]?.rowIndex).filter((x): x is number => typeof x === 'number');
    return { trigger: 'invalid_node', focusId: focus, rootRows, message: null };
  }
  const isUnknown = !!v.producedSymbol && ctx.problemSpec.unknowns.some((u) => u.symbol === v.producedSymbol);
  if ((n.interpretation.semanticType === 'conclusion' || n.interpretation.semanticType === 'relation_claim') && v.reasonCodes.includes('missing_premise')) {
    return coached(n.id) ? null : { trigger: 'missing_justification', focusId: n.id, rootRows: [], message: null };
  }
  if (v.status === 'valid' && isUnknown && n.interpretation.semanticType === 'conclusion') return { trigger: 'valid_conclusion', focusId: n.id, rootRows: [], message: null };
  if (v.status === 'valid' && n.interpretation.normalized?.kind === 'observation') {
    const hyp = ctx.experiment?.hypothesisNodeId ? g.nodes[ctx.experiment.hypothesisNodeId] : null;
    return { trigger: 'observation', focusId: n.id, rootRows: hyp ? [hyp.rowIndex] : [], message: null };
  }
  return null;
}

function coachContext(ctx: SessionContext, plan: CoachPlan, forbidden: ForbiddenValue[]): CoachContext {
  const g = ctx.graph;
  const f = plan.focusId ? g.nodes[plan.focusId] : null;
  const level = allowedLevel(ctx.disclosure, plan.focusId);
  const related = learnerNodes(g)
    .filter((n) => n.lifecycle === 'active' && n.rowIndex > 0 && n.id !== f?.id && n.validation)
    .slice(-8)
    .map((n) => ({ id: n.id, row: n.rowIndex, displayText: n.interpretation.displayText, status: n.validation!.status }));
  return {
    problemText: ctx.problemSpec.text,
    trigger: plan.trigger,
    focusNode: f && f.validation
      ? { id: f.id, row: f.rowIndex, originalText: f.originalText, displayText: f.interpretation.displayText, status: f.validation.status, reasonCodes: f.validation.reasonCodes, possibleMisconceptions: f.validation.possibleMisconceptions.map((m) => m.code) }
      : null,
    relatedNodes: related,
    disclosure: {
      allowedLevel: level,
      forbiddenValues: forbidden.map((x) => `${displaySymbol(x.symbol)} = ${x.text}`),
      disclosableFacts: learnerNodes(g).filter((n) => n.validation?.status === 'valid' && n.validation.producedSymbol && n.validation.claimedValue).map((n) => `${displaySymbol(n.validation!.producedSymbol!)} = ${formatExact(n.validation!.claimedValue!)}`),
    },
    learnerMessage: plan.message,
    rootCauseRows: plan.rootRows,
  };
}

async function runCoach(ctx: SessionContext, plan: CoachPlan, facts: ProblemFacts, ports: Ports, degraded: DegradedFlags, now: number): Promise<{ ctx: SessionContext; coach: CoachResponse }> {
  const forbidden = buildForbidden(ctx.problemSpec, facts, ctx.graph);
  const cctx = coachContext(ctx, plan, forbidden);
  let coach: CoachResponse | null = null;
  // Flow prompts (offering the self-check, stating a scope limit) are fixed system text, not tutoring.
  const systemPrompt = plan.trigger === 'valid_conclusion' || plan.trigger === 'unsupported_request';
  if (systemPrompt) coach = fallbackResponse(cctx, ctx.problemSpec, forbidden);
  if (!coach && ports.tutor) {
    try {
      const out = validateTutorOutput(await ports.tutor(cctx), cctx, forbidden);
      if (out.ok) coach = out.value;
    } catch {
      /* fall through to the rule-based coach */
    }
  }
  if (!coach) {
    degraded.tutor = 'rule_based';
    coach = fallbackResponse(cctx, ctx.problemSpec, forbidden);
  }
  let g = ctx.graph;
  let disclosure = ctx.disclosure;
  if (plan.focusId) {
    const d = nodeDisclosure(disclosure, plan.focusId);
    disclosure = { ...disclosure, [plan.focusId]: { ...d, lastCoachedRevision: g.nodes[plan.focusId].revision, lastCoachedLevel: coach.disclosureLevel } };
  }
  g = appendEvent(g, { type: 'coach_exchange', nodeId: plan.focusId, source: coach.source, replyType: coach.replyType, level: coach.disclosureLevel, misconception: coach.misconception.code }, now);
  if (coach.hint && plan.focusId) g = appendEvent(g, { type: 'hint_shown', nodeId: plan.focusId, level: coach.hint.level }, now);
  return { ctx: { ...ctx, graph: g, disclosure }, coach };
}

// ------------------------------------------------------------------ clarifications

function clarificationFor(ctx: SessionContext, nodeId: string | null): Clarification | null {
  if (ctx.phase !== 'reasoning') return null;
  if (ctx.pendingRevisedBy) {
    const { nodeId: m, byNodeId } = ctx.pendingRevisedBy;
    return {
      nodeId: m, kind: 'revised_by',
      question: `Em có muốn đánh dấu bước ${ctx.graph.nodes[m]?.rowIndex} là đã được sửa bởi bước ${ctx.graph.nodes[byNodeId]?.rowIndex} không?`,
      options: [{ label: 'Có, đánh dấu đã sửa', value: 'accept' }, { label: 'Không', value: 'decline' }],
    };
  }
  if (!nodeId) return null;
  const n = ctx.graph.nodes[nodeId];
  if (!n || n.validation?.status !== 'ambiguous') return null;
  const conflict = conflictOf(n);
  if (conflict) {
    return {
      nodeId, kind: 'conflict',
      question: `Bước ${n.rowIndex} cho ${displaySymbol(n.interpretation.normalized && 'target' in n.interpretation.normalized ? String(n.interpretation.normalized.target) : '')} một giá trị khác bước ${ctx.graph.nodes[conflict]?.rowIndex}. Em muốn thay bước ${ctx.graph.nodes[conflict]?.rowIndex} bằng bước này, hay giữ cả hai?`,
      options: [{ label: `Thay bước ${ctx.graph.nodes[conflict]?.rowIndex}`, value: 'replace' }, { label: 'Giữ cả hai (bước này là giả thuyết)', value: 'keep_both' }],
    };
  }
  const amb = n.interpretation.ambiguities[0];
  if (n.validation.reasonCodes.includes('cyclic_reference')) {
    return { nodeId, kind: 'ambiguity', question: `Bước ${n.rowIndex} tham chiếu tới một bước lại dựa vào chính nó. Em sửa lại tham chiếu nhé.`, options: [] };
  }
  if (amb?.code === 'multiple_statements') return { nodeId, kind: 'split', question: amb.question, options: [] };
  return {
    nodeId, kind: 'ambiguity',
    question: amb?.question ?? 'Hệ thống chưa hiểu chắc dòng này. Em làm rõ nhé.',
    options: [...n.interpretation.alternatives.map((a, i) => ({ label: a.displayText, value: String(i) })), { label: 'Em sẽ sửa dòng này', value: 'reject' }],
  };
}

function suggestRevisedBy(g: ReasoningGraph, nodeId: string): { nodeId: string; byNodeId: string } | null {
  const n = g.nodes[nodeId];
  if (!n || n.validation?.status !== 'valid') return null;
  const sym = n.validation.producedSymbol;
  const candidates = learnerNodes(g).filter((m) => m.id !== n.id && m.rowIndex < n.rowIndex && m.lifecycle === 'active' && m.validation?.status === 'invalid' && !m.revisedBy.includes(n.id));
  const byRef = candidates.find((m) => n.interpretation.explicitRefs.includes(m.rowIndex));
  if (byRef) return { nodeId: byRef.id, byNodeId: n.id };
  const sameSym = candidates.find((m) => {
    const st = m.interpretation.normalized;
    const t = st?.kind === 'scaling' ? st.claim.symbol : st && (st.kind === 'equation' || st.kind === 'conclusion') ? st.target : null;
    return !!sym && t === sym && m.interpretation.semanticType === 'hypothesis';
  });
  return sameSym ? { nodeId: sameSym.id, byNodeId: n.id } : null;
}

// ------------------------------------------------------------------ F8 evaluation

export function evaluateIndependent(state: IndependentState): IndependentEvaluation {
  const spec = state.problemSpec;
  const facts = solveProblem(spec);
  const g = state.graph;
  const unknown = (spec.unknowns.find((u) => u.symbol.startsWith('k')) ?? spec.unknowns[spec.unknowns.length - 1]).symbol;
  const expected = facts[unknown]?.value ?? null;
  const rows = learnerNodes(g).filter((n) => n.lifecycle === 'active' && n.rowIndex > 0);
  const targets = (n: ReasoningNode) => {
    const st = n.interpretation.normalized;
    return n.validation?.producedSymbol === unknown || (st && (st.kind === 'equation' || st.kind === 'conclusion') && st.target === unknown) || (st?.kind === 'scaling' && st.claim.symbol === unknown);
  };
  const answerNode = [...rows].reverse().find((n) => targets(n) && n.interpretation.semanticType !== 'hypothesis' && n.validation?.claimedValue) ?? null;
  const method = expected ? `Tính xác định: ${displaySymbol(unknown)} = ${formatExact(expected)} (${facts[unknown]!.derivation})` : 'Không có kết quả kiểm chứng';
  if (!answerNode) {
    const unreadable = rows.some((n) => targets(n) || n.validation?.status === 'ambiguous' || n.validation?.status === 'unverified');
    return { answer: unreadable ? 'unreadable' : 'missing', reasoning: 'insufficient_evidence', answerNodeId: null, expected, method, possibleMisconceptions: [] };
  }
  const v = answerNode.validation!;
  const answer = expected && v.claimedValue && equals(v.claimedValue, expected) ? 'correct' : 'incorrect';
  // Dependency path of learner nodes behind the answer.
  const path = new Set<string>([answerNode.id]);
  const stack = [answerNode.id];
  while (stack.length) {
    const cur = g.nodes[stack.pop()!];
    for (const d of cur.dependsOn) if (g.nodes[d.nodeId]?.source !== 'problem' && !path.has(d.nodeId)) path.add(d.nodeId), stack.push(d.nodeId);
  }
  const pathNodes = [...path].map((id) => g.nodes[id]);
  let reasoning: IndependentEvaluation['reasoning'];
  if (pathNodes.some((n) => n.validation?.status === 'invalid')) reasoning = 'contains_invalid';
  else if (v.status === 'insufficient_evidence' && v.reasonCodes.includes('missing_premise')) reasoning = 'insufficient_evidence';
  else if (pathNodes.some((n) => n.validation?.status !== 'valid')) reasoning = 'partial';
  else {
    const needsCondition = spec.constraints.length > 0 && unknown.startsWith('k');
    const citesCondition = pathNodes.some((n) => n.dependsOn.some((d) => d.via === 'constraint') || (n.interpretation.justification?.citesConstraintIds.length ?? 0) > 0);
    reasoning = !needsCondition || citesCondition ? 'sufficient' : 'partial';
  }
  return { answer, reasoning, answerNodeId: answerNode.id, expected, method, possibleMisconceptions: v.possibleMisconceptions.map((m) => m.code) };
}

// ------------------------------------------------------------------ runTurn

/**
 * Slim wire form of a context for POST /api/reasoning/turn: derived data (validations,
 * dependencies, edges, symbol table, old events) is dropped because the server
 * recomputes it; only the last event is kept for sequence continuity.
 */
export function toWire(ctx: SessionContext): SessionContext {
  const slim = (g: ReasoningGraph): ReasoningGraph => ({
    ...g,
    edges: [],
    symbolTable: {},
    events: g.events.slice(-1),
    nodes: Object.fromEntries(Object.entries(g.nodes).map(([id, n]) => [id, {
      ...n,
      // Retracted producers keep their validation: it tells the server which symbol is now blocked.
      validation: n.lifecycle === 'retracted' ? n.validation : null,
      dependsOn: [],
      history: n.history.map((h) => ({ ...h, validation: h.validation && { ...h.validation, checks: h.validation.checks, reasonCodes: [], possibleMisconceptions: [] } })),
    }])),
  });
  return { ...ctx, graph: slim(ctx.graph), independent: ctx.independent ? { ...ctx.independent, graph: slim(ctx.independent.graph) } : null };
}

/**
 * Merges a server result into the full local context: events are appended by
 * sequence number and the local (richer) revision history is kept.
 */
export function mergeResult(local: SessionContext, result: TurnResult): SessionContext {
  const mergeGraph = (mine: ReasoningGraph | null, theirs: ReasoningGraph): ReasoningGraph => {
    if (!mine) return theirs;
    const last = mine.events[mine.events.length - 1]?.seq ?? 0;
    const nodes = Object.fromEntries(Object.entries(theirs.nodes).map(([id, n]) => {
      const old = mine.nodes[id];
      return [id, old ? { ...n, history: [...old.history, ...n.history.slice(old.history.length)] } : n];
    }));
    return { ...theirs, nodes, events: [...mine.events, ...theirs.events.filter((e) => e.seq > last)] };
  };
  const next = result.context;
  const sameIndependent = local.independent && next.independent && local.independent.problemSpec.id === next.independent.problemSpec.id;
  return {
    ...next,
    graph: mergeGraph(local.graph, next.graph),
    independent: next.independent ? { ...next.independent, graph: mergeGraph(sameIndependent ? local.independent!.graph : null, next.independent.graph) } : null,
  };
}

export function planForContext(ctx: SessionContext, selectedNodeIds: string[] = [], focusNodeId: string | null = null, unsupported: { request: string; reason: string } | null = null): VisualSpec[] {
  const a = active(ctx);
  return planVisuals({
    spec: a.spec, facts: solveProblem(a.spec), graph: a.graph, phase: ctx.phase, experiment: a.independent ? null : ctx.experiment,
    selectedNodeIds, focusNodeId, submitted: ctx.independent?.submitted, unsupportedRequest: unsupported, disclosure: ctx.disclosure,
  });
}

const UNSUPPORTED_VISUAL = /(vẽ|hiển\s+thị|cho\s+em\s+xem)[^.?!]*(hình\s+nón|nón|hình\s+cầu|cầu|lăng\s+trụ|hình\s+hộp|mặt\s+cắt|thiết\s+diện|mọi\s+bước|3d\s+khác|đồ\s+thị\s+hàm)/iu;

export async function runTurn(req: TurnRequest, ports: Ports = {}): Promise<TurnResult> {
  const now = ports.now?.() ?? Date.now();
  let ctx = req.context;
  const a0 = active(ctx);
  if (req.expectedGraphVersion !== a0.graph.version) return fail(req, 'version_conflict', ERR.version_conflict);
  if (ctx.processedOpIds.includes(req.opId)) {
    return { context: ctx, changedNodeIds: [], visualSpecs: planForContext(ctx, req.selectedNodeIds ?? []), removedSpecIds: [], coach: null, clarification: null, events: [], degraded: {}, error: null };
  }
  // FR-ORCH-003: never trust validation state sent by a client — recompute it first.
  {
    const mainFacts = solveProblem(ctx.problemSpec);
    ctx = { ...ctx, graph: revalidate(ctx.graph, { spec: ctx.problemSpec, facts: mainFacts, experiment: ctx.experiment, now, silent: true }).graph };
    if (ctx.independent) {
      const ind = ctx.independent;
      ctx = { ...ctx, independent: { ...ind, graph: revalidate(ind.graph, { spec: ind.problemSpec, facts: solveProblem(ind.problemSpec), experiment: null, now, silent: true }).graph } };
    }
  }
  const startSeqMain = ctx.graph.events[ctx.graph.events.length - 1]?.seq ?? 0;
  const startSeqInd = ctx.independent?.graph.events[ctx.independent.graph.events.length - 1]?.seq ?? 0;
  const degraded: DegradedFlags = {};
  const op = req.op;
  const spec = a0.spec;
  const facts = solveProblem(spec);
  let g = active(ctx).graph;
  let focusNodeId: string | null = null;
  let coachPlan: CoachPlan | null = null;
  let unsupported: { request: string; reason: string } | null = null;
  const reval = (graph: ReasoningGraph) => revalidate(graph, { spec, facts, experiment: a0.independent ? null : ctx.experiment, now });
  const phaseOk = (...phases: SessionContext['phase'][]) => phases.includes(ctx.phase);

  try {
    switch (op.type) {
      case 'add_row':
      case 'edit_row': {
        if (!phaseOk('reasoning', 'independent')) return fail(req, 'not_allowed', ERR.not_allowed);
        if (a0.independent && ctx.independent?.submitted) return fail(req, 'already_submitted', ERR.already_submitted);
        const text = op.rowText.normalize('NFC').trim();
        if (!text) return fail(req, 'empty_row', ERR.empty_row);
        if (text.length > LIMITS.rowText) return fail(req, 'row_too_long', ERR.row_too_long);
        const interp = await interpretRow(text, spec, g, !a0.independent && !!ctx.experiment?.active, ports, degraded);
        let affectedBefore: string[] = [];
        if (op.type === 'add_row') {
          const r = addRow(g, text, interp, op.source ?? 'learner', now);
          g = r.graph;
          focusNodeId = r.nodeId;
        } else {
          affectedBefore = transitiveDependents(g, op.nodeId);
          g = reviseRow(g, op.nodeId, text, interp, now);
          focusNodeId = op.nodeId;
        }
        const res = reval(g);
        g = res.graph;
        if (op.type === 'edit_row') {
          const affected = [...new Set([...affectedBefore, ...transitiveDependents(g, op.nodeId)])];
          const n = g.nodes[op.nodeId];
          g = appendEvent(g, { type: 'node_revised', nodeId: op.nodeId, from: n.revision - 1, to: n.revision, affected }, now);
          if (!a0.independent && n.validation?.status === 'invalid') {
            const d = nodeDisclosure(ctx.disclosure, op.nodeId);
            ctx = { ...ctx, disclosure: { ...ctx.disclosure, [op.nodeId]: { ...d, failedRevisions: d.failedRevisions + 1 } } };
          }
        }
        ctx = withGraph(ctx, g, a0.independent);
        if (!a0.independent) {
          const pending = suggestRevisedBy(g, focusNodeId);
          if (pending) ctx = { ...ctx, pendingRevisedBy: pending };
          coachPlan = decideCoach(ctx, focusNodeId, op.type);
        }
        break;
      }
      case 'retract_row': {
        if (!phaseOk('reasoning', 'independent')) return fail(req, 'not_allowed', ERR.not_allowed);
        g = reval(retractRow(g, op.nodeId, now)).graph;
        ctx = withGraph(ctx, g, a0.independent);
        break;
      }
      case 'resolve_ambiguity':
      case 'reject_interpretation': {
        if (!phaseOk('reasoning', 'independent')) return fail(req, 'not_allowed', ERR.not_allowed);
        const n = g.nodes[op.nodeId];
        if (!n) return fail(req, 'not_found', ERR.not_found);
        const choice = op.type === 'reject_interpretation' ? 'reject' : op.choiceIndex;
        let interp: Interpretation;
        if (choice === 'reject') interp = { ...n.interpretation, status: 'rejected_by_learner', learnerConfirmed: false };
        else {
          const alt = n.interpretation.alternatives[choice];
          if (!alt) return fail(req, 'not_found', ERR.not_found);
          interp = { ...n.interpretation, status: 'interpreted', normalized: alt.statement, semanticType: alt.semanticType, displayText: alt.displayText.replace(/^Có phải ý em là: |\?$/g, ''), ambiguities: [], alternatives: [], learnerConfirmed: true };
        }
        g = updateNode(g, op.nodeId, { interpretation: interp }, now);
        g = appendEvent(g, { type: 'ambiguity_resolved', nodeId: op.nodeId, choice }, now);
        g = reval(g).graph;
        focusNodeId = op.nodeId;
        ctx = withGraph(ctx, g, a0.independent);
        if (!a0.independent) coachPlan = decideCoach(ctx, op.nodeId, 'add_row');
        break;
      }
      case 'resolve_conflict': {
        if (!phaseOk('reasoning')) return fail(req, 'not_allowed', ERR.not_allowed);
        const n = g.nodes[op.nodeId];
        const other = n ? conflictOf(n) : null;
        if (!n || !other) return fail(req, 'not_found', ERR.not_found);
        if (op.action === 'replace') g = updateNode(g, other, { revisedBy: [...g.nodes[other].revisedBy, op.nodeId] }, now);
        else g = updateNode(g, op.nodeId, { keptAsHypothesis: true }, now);
        g = appendEvent(g, { type: 'conflict_resolved', nodeId: op.nodeId, action: op.action }, now);
        g = reval(g).graph;
        focusNodeId = op.nodeId;
        ctx = withGraph(ctx, g, false);
        break;
      }
      case 'mark_revised_by': {
        if (!phaseOk('reasoning')) return fail(req, 'not_allowed', ERR.not_allowed);
        if (op.accept) {
          const m = g.nodes[op.nodeId];
          if (!m || !g.nodes[op.byNodeId]) return fail(req, 'not_found', ERR.not_found);
          g = updateNode(g, op.nodeId, { revisedBy: [...new Set([...m.revisedBy, op.byNodeId])] }, now);
          g = appendEvent(g, { type: 'revised_by_marked', nodeId: op.nodeId, byNodeId: op.byNodeId }, now);
          g = reval(g).graph;
        }
        ctx = { ...withGraph(ctx, g, false), pendingRevisedBy: null };
        focusNodeId = op.byNodeId;

        break;
      }
      case 'experiment': {
        if (!phaseOk('reasoning')) return fail(req, 'not_allowed', ERR.not_allowed);
        if (op.event === 'start') {
          if (spec.cylinders.length < 2 || !facts.r1 || !facts.h1) return fail(req, 'experiment_unavailable', ERR.experiment_unavailable);
          const hyps = learnerNodes(g).filter((n) => n.lifecycle === 'active' && (n.interpretation.semanticType === 'hypothesis' || n.interpretation.normalized?.kind === 'scaling'));
          const hyp = op.nodeId ? g.nodes[op.nodeId] : hyps[hyps.length - 1];
          if (!hyp || !hyps.some((h) => h.id === hyp.id)) return fail(req, 'hypothesis_required', ERR.hypothesis_required);
          const st = hyp.interpretation.normalized;
          const symbol: 'r2' | 'h2' = op.symbol ?? (st?.kind === 'scaling' && st.changes.some((c) => c.symbol === 'kh') && !st.changes.some((c) => c.symbol === 'kr') ? 'h2' : 'r2');
          const start = Number((facts[symbol === 'r2' ? 'r1' : 'h1']!.value.n / facts[symbol === 'r2' ? 'r1' : 'h1']!.value.d).toFixed(3));
          const exp: ExperimentState = { active: true, symbol, value: start, start, visited: [start], hypothesisNodeId: hyp.id };
          ctx = { ...ctx, experiment: exp };
          g = appendEvent(g, { type: 'experiment', event: 'start', symbol, from: start, to: start }, now);
          ctx = withGraph(ctx, g, false);
          focusNodeId = hyp.id;
        } else {
          const exp = ctx.experiment;
          if (!exp || !exp.active) return fail(req, 'not_allowed', ERR.not_allowed);
          if (op.event === 'set') {
            const dom = sliderDomain(spec, facts, exp.symbol);
            const value = snapTo(op.value ?? exp.value, dom);
            ctx = { ...ctx, experiment: { ...exp, value, visited: exp.visited.includes(value) ? exp.visited : [...exp.visited, value] } };
          } else {
            g = appendEvent(g, { type: 'experiment', event: 'end', symbol: exp.symbol, from: exp.start, to: exp.value }, now);
            ctx = withGraph({ ...ctx, experiment: { ...exp, active: false } }, g, false);
          }
          // re-validate observations against the (possibly new) visited values
          g = revalidate(ctx.graph, { spec, facts, experiment: ctx.experiment, now }).graph;
          ctx = withGraph(ctx, g, false);
        }
        break;
      }
      case 'request_hint': {
        if (!phaseOk('reasoning')) return fail(req, 'not_allowed', ERR.not_allowed);
        const n = g.nodes[op.nodeId];
        if (!n) return fail(req, 'not_found', ERR.not_found);
        const d = nodeDisclosure(ctx.disclosure, op.nodeId);
        ctx = { ...ctx, disclosure: { ...ctx.disclosure, [op.nodeId]: { ...d, hintRequests: Math.min(4, d.hintRequests + 1), lastCoachedRevision: null } } };
        coachPlan = { trigger: 'hint_request', focusId: op.nodeId, rootRows: (n.validation?.rootCauseNodeIds ?? []).map((id) => g.nodes[id]?.rowIndex ?? 0), message: null };
        focusNodeId = op.nodeId;
        break;
      }
      case 'ask_coach': {
        if (!phaseOk('reasoning')) return fail(req, 'not_allowed', ERR.not_allowed);
        const msg = op.message.normalize('NFC').trim();
        if (!msg) return fail(req, 'empty_row', ERR.empty_row);
        if (msg.length > LIMITS.coachMessage) return fail(req, 'message_too_long', ERR.message_too_long);
        const focus = op.nodeId ? g.nodes[op.nodeId] : earliestInvalidRoot(g);
        if (UNSUPPORTED_VISUAL.test(msg)) {
          unsupported = { request: msg.slice(0, 120), reason: 'Chỉ có hình trụ, bảng so sánh, biểu đồ theo r/h, công thức và bản đồ suy luận.' };
          coachPlan = { trigger: 'unsupported_request', focusId: focus?.id ?? null, rootRows: [], message: msg };
        } else coachPlan = { trigger: 'learner_question', focusId: focus?.id ?? null, rootRows: [], message: msg };
        if (coachPlan.focusId) {
          const d = nodeDisclosure(ctx.disclosure, coachPlan.focusId);
          ctx = { ...ctx, disclosure: { ...ctx.disclosure, [coachPlan.focusId]: { ...d, lastCoachedRevision: null } } };
        }
        focusNodeId = focus?.id ?? null;
        break;
      }
      case 'select_node': {
        focusNodeId = op.nodeId;
        break;
      }
      case 'start_independent': {
        if (!phaseOk('reasoning')) return fail(req, 'not_allowed', ERR.not_allowed);
        let analog: ProblemSpec | null;
        if (op.analogText && ports.allowAnalogOverride) analog = confirmProblem(parseProblem(op.analogText), [], now).spec;
        else analog = generateAnalog(ctx.problemSpec);
        if (!analog || analog.interpretationStatus !== 'confirmed') return fail(req, 'analog_unavailable', ERR.analog_unavailable);
        let ig = createGraph(analog, 'independent', now);
        ig = revalidate(ig, { spec: analog, facts: solveProblem(analog), experiment: null, now }).graph;
        g = appendEvent(ctx.graph, { type: 'phase_changed', from: 'reasoning', to: 'independent' }, now);
        ctx = { ...ctx, graph: g, phase: 'independent', experiment: ctx.experiment ? { ...ctx.experiment, active: false } : null, pendingRevisedBy: null, independent: { problemSpec: analog, graph: ig, submitted: false, evaluation: null, evaluationError: null } };
        break;
      }
      case 'submit_independent':
      case 'retry_independent_evaluation': {
        if (!phaseOk('independent', 'summary') || !ctx.independent) return fail(req, 'not_allowed', ERR.not_allowed);
        let ind = ctx.independent;
        if (op.type === 'submit_independent') {
          if (ind.submitted) return fail(req, 'already_submitted', ERR.already_submitted);
          // Stored before evaluation (NFR-REL-001).
          ind = { ...ind, submitted: true, graph: appendEvent(ind.graph, { type: 'independent_submitted', rows: learnerNodes(ind.graph).filter((n) => n.lifecycle === 'active').length }, now) };
        } else if (!ind.submitted || ind.evaluation) return fail(req, 'not_allowed', ERR.not_allowed);
        try {
          const evaluation = evaluateIndependent(ind);
          ind = { ...ind, evaluation, evaluationError: null, graph: appendEvent(ind.graph, { type: 'independent_evaluated', answer: evaluation.answer, reasoning: evaluation.reasoning }, now) };
        } catch (e) {
          ind = { ...ind, evaluationError: e instanceof Error ? e.message : 'evaluation_failed' };
        }
        g = appendEvent(ctx.graph, { type: 'phase_changed', from: 'independent', to: 'summary' }, now);
        ctx = { ...ctx, graph: g, independent: ind, phase: 'summary' };
        break;
      }
      case 'finish': {
        if (!phaseOk('reasoning', 'independent')) return fail(req, 'not_allowed', ERR.not_allowed);
        g = appendEvent(ctx.graph, { type: 'phase_changed', from: ctx.phase, to: 'summary' }, now);
        ctx = { ...ctx, graph: g, phase: 'summary', experiment: ctx.experiment ? { ...ctx.experiment, active: false } : null };
        break;
      }
    }
  } catch (e) {
    if (e instanceof GraphError) return fail(req, e.code, ERR[e.code] ?? e.message);
    throw e;
  }

  let coach: CoachResponse | null = null;
  if (coachPlan && ctx.phase === 'reasoning') {
    const r = await runCoach(ctx, coachPlan, solveProblem(ctx.problemSpec), ports, degraded, now);
    ctx = r.ctx;
    coach = r.coach;
  }
  if (degraded.parser || degraded.tutor) {
    const target = ctx.phase === 'independent' && ctx.independent ? ctx.independent.graph : ctx.graph;
    const withEv = appendEvent(target, { type: 'turn_degraded', ...(degraded.parser ? { parser: degraded.parser } : {}), ...(degraded.tutor ? { tutor: degraded.tutor } : {}) }, now);
    ctx = ctx.phase === 'independent' && ctx.independent ? { ...ctx, independent: { ...ctx.independent, graph: withEv } } : { ...ctx, graph: withEv };
  }
  ctx = { ...ctx, processedOpIds: [...ctx.processedOpIds, req.opId].slice(-50) };

  const specs = planForContext(ctx, req.selectedNodeIds ?? [], focusNodeId, unsupported);
  if (coach) {
    const ids = new Set(coach.relevantNodeIds);
    coach = { ...coach, relevantElementIds: specs.flatMap((s) => s.elements.filter((e) => e.sourceNodeIds.some((x) => ids.has(x))).map((e) => e.elementId)) };
  }
  const newEvents: GraphEvent[] = [
    ...ctx.graph.events.filter((e) => e.seq > startSeqMain),
    ...(ctx.independent?.graph.events.filter((e) => e.seq > startSeqInd) ?? []),
  ];
  const changed = newEvents.filter((e): e is Extract<GraphEvent, { type: 'node_validated' }> => e.type === 'node_validated').map((e) => e.nodeId);
  return {
    context: ctx,
    changedNodeIds: [...new Set([...(focusNodeId ? [focusNodeId] : []), ...changed])],
    visualSpecs: specs,
    removedSpecIds: [],
    coach,
    clarification: clarificationFor(ctx, focusNodeId),
    events: newEvents,
    degraded,
    error: null,
  };
}

export { fromNumber };
export type { DisclosureLevel, SymbolId };
