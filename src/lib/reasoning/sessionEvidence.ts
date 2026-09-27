/**
 * Session evidence for Learning Motivation & Evidence-based Progress (PRODUCT_SPEC §24).
 *
 * One pure extraction step turns the recomputed graph and the append-only event log
 * into typed, traceable facts. Scores, badges, mission milestones, the next challenge
 * and the completion message read ONLY this structure — never Tutor/LLM text, never a
 * score sent by a client.
 *
 * The extraction uses only data that survives `toEvidenceWire` (current node state,
 * which the server recomputes, plus a text-free subset of events), so the browser and
 * the Voice route derive identical evidence (tested).
 */
import { familyOf, type Family } from './analog.ts';
import { equals } from './exact.ts';
import { learnerNodes } from './graph.ts';
import { solveProblem } from './facts.ts';
import { evaluateIndependent, toWire } from './orchestrator.ts';
import type {
  DisclosureLevel, GraphEvent, IndependentEvaluation, Kind, ReasoningGraph, ReasoningNode, SessionContext, SymbolId, ValidationStatus,
} from './types.ts';

export const EVIDENCE_VERSION = 'evidence-1';

/** Pointer from a derived fact back to graph nodes and event sequence numbers. */
export interface EvidenceRef {
  graph: 'main' | 'independent';
  nodeIds: string[];
  rows: number[];
  eventSeqs: number[];
}

export interface GenuineMistake {
  nodeId: string;
  row: number;
  /** First `node_validated` event that recorded the learner's own error. */
  seq: number;
  reasonCodes: string[];
  /** The mistake concerns problem data (r/d/h) or contradicts the problem text. */
  dataMisreading: boolean;
  retracted: boolean;
  correction: { kind: 'learner_edit' | 'marked_revised_by'; byNodeId: string; eventSeqs: number[] } | null;
  /** The learner edited the row after the mistake, but it is not valid yet. */
  attemptedEdit: boolean;
}

export interface CrossCheck {
  symbol: SymbolId;
  nodeIds: [string, string];
  rows: [number, number];
}

export interface TestedPrediction {
  hypothesisNodeId: string;
  hypothesisRow: number;
  via: 'experiment_observation' | 'later_reasoning';
  testNodeId: string;
  testRow: number;
  eventSeqs: number[];
}

export interface ConclusionEvidence {
  /** F8 classification (§7.8) applied to the coached problem over premise dependencies; best-supported conclusion. */
  answer: IndependentEvaluation['answer'];
  reasoning: IndependentEvaluation['reasoning'];
  answerNodeId: string | null;
  answerRow: number | null;
  answerStatus: ValidationStatus | null;
  /** The answer row itself follows from its premises (even if a premise is wrong). */
  inferenceFollows: boolean;
  /** Bare claim with no supporting step (`missing_premise`). */
  bare: boolean;
  pathNodeIds: string[];
}

export interface SupportUsed {
  hints: { nodeId: string; row: number | null; count: number; maxLevel: DisclosureLevel; eventSeqs: number[] }[];
  coach: { total: number; ai: number; ruleBased: number; eventSeqs: number[] };
  experiments: { runs: number; eventSeqs: number[] };
  revisions: { count: number; eventSeqs: number[] };
}

export interface SessionEvidence {
  version: typeof EVIDENCE_VERSION;
  problemId: string;
  problemType: SessionContext['problemSpec']['problemType'];
  family: Family;
  unknowns: SymbolId[];
  phase: SessionContext['phase'];
  graphVersion: number;
  confirmation: { seq: number; contradictions: number } | null;
  /** Learner rows that are active (for display only — never scored by count). */
  activeRows: number;
  dataUse: {
    /** Valid learner rows that use data, conditions or relations of the problem. */
    nodeIds: string[];
    /** The problem has a relation, an unchanged-quantity condition or a diameter. */
    importantDataPresent: boolean;
    /** Valid learner rows that use such important data. */
    importantNodeIds: string[];
  };
  conclusion: ConclusionEvidence;
  mistakes: GenuineMistake[];
  crossChecks: CrossCheck[];
  testedPredictions: TestedPrediction[];
  predictions: { nodeId: string; row: number; status: ValidationStatus | null }[];
  strategies: { nodeId: string; row: number }[];
  observations: { nodeId: string; row: number; valid: boolean }[];
  justifications: { supported: string[]; attempted: string[] };
  support: SupportUsed;
  /** Rows marked `demo_script` exist; they are never counted as learner evidence. */
  demoRowsIgnored: number;
  endedEarly: boolean;
  rowOf: Record<string, number>;
}

export interface FinalAssessment {
  status: 'not_started' | 'in_progress' | 'not_evaluated' | 'evaluated';
  problemText: string | null;
  evaluation: IndependentEvaluation | null;
  answerRow: number | null;
  /** The self-check answer is a bare claim without a supporting row. */
  answerBare: boolean;
  eventSeqs: number[];
}

// ------------------------------------------------------------------ event subset (wire-safe)

const EVIDENCE_EVENTS = new Set<GraphEvent['type']>([
  'problem_confirmed', 'row_submitted', 'node_revised', 'node_retracted', 'revised_by_marked', 'conflict_resolved',
  'experiment', 'hint_shown', 'coach_exchange', 'phase_changed', 'independent_submitted', 'independent_evaluated', 'node_validated',
]);

/**
 * Events that scoring may read. Learner text is dropped (`row_submitted.text`) and only
 * `invalid` validations are kept: current statuses come from the recomputed nodes.
 */
export function evidenceEvents(events: GraphEvent[]): GraphEvent[] {
  return events
    .filter((e) => EVIDENCE_EVENTS.has(e.type) && (e.type !== 'node_validated' || e.status === 'invalid'))
    .map((e) => (e.type === 'row_submitted' ? { ...e, text: '' } : e));
}

/**
 * Wire form for requests that must recompute evidence (completion Voice): the slim
 * `toWire` context plus the evidence event subset of both graphs.
 */
export function toEvidenceWire(ctx: SessionContext): SessionContext {
  const w = toWire(ctx);
  return {
    ...w,
    graph: { ...w.graph, events: evidenceEvents(ctx.graph.events) },
    independent: w.independent && ctx.independent ? { ...w.independent, graph: { ...w.independent.graph, events: evidenceEvents(ctx.independent.graph.events) } } : null,
  };
}

// ------------------------------------------------------------------ helpers

/** Invalid only because of another step (cascade), not the learner's own error in this row. */
const CASCADE = new Set(['depends_on_invalid', 'depends_on_ambiguous', 'depends_on_insufficient', 'premise_changed', 'missing_premise']);
const LENGTH_KINDS = new Set<Kind>(['r', 'd', 'h']);
const isProblemNode = (id: string) => /^(g|c|rel|u):/.test(id);
const isImportantData = (id: string) => id.startsWith('c:') || id.startsWith('rel:') || /^g:d[12]$/.test(id);
const valid = (n: ReasoningNode) => n.validation?.status === 'valid';

function claimSymbol(n: ReasoningNode): SymbolId | null {
  if (n.validation?.producedSymbol) return n.validation.producedSymbol;
  const st = n.interpretation.normalized;
  if (st?.kind === 'scaling') return st.claim.symbol;
  if (st && (st.kind === 'equation' || st.kind === 'conclusion')) return st.target;
  return null;
}

function isHypothesis(n: ReasoningNode): boolean {
  return n.interpretation.semanticType === 'hypothesis' || n.history.some((h) => h.interpretation.semanticType === 'hypothesis') || !!n.keptAsHypothesis;
}

function hasSupportedJustification(n: ReasoningNode): boolean {
  const j = n.interpretation.justification;
  const st = n.interpretation.normalized;
  if (st?.kind === 'justification') return true;
  if (st?.kind === 'scaling' && st.fixed.length > 0) return true;
  return !!j && !j.vague && (j.citesConstraintIds.length > 0 || j.citesRelationIds.length > 0 || j.ruleIds.length > 0);
}

/** Learner-node premises reachable from `n`, ignoring other producers of the same symbol. */
function premiseClosure(g: ReasoningGraph, n: ReasoningNode, sym: SymbolId): Set<string> {
  const out = new Set<string>();
  const stack = [n.id];
  while (stack.length) {
    const cur = g.nodes[stack.pop()!];
    for (const d of cur?.dependsOn ?? []) {
      const dn = g.nodes[d.nodeId];
      if (!dn || dn.source === 'problem' || out.has(dn.id) || dn.id === n.id) continue;
      if (claimSymbol(dn) === sym) continue;
      out.add(dn.id);
      stack.push(dn.id);
    }
  }
  return out;
}

const seqsOf = (events: GraphEvent[], pred: (e: GraphEvent) => boolean) => events.filter(pred).map((e) => e.seq);

// ------------------------------------------------------------------ main extraction

export function collectSessionEvidence(ctx: SessionContext): SessionEvidence {
  const g = ctx.graph;
  const spec = ctx.problemSpec;
  const events = evidenceEvents(g.events);
  const all = learnerNodes(g);
  const learner = all.filter((n) => n.source === 'learner');
  const demo = all.filter((n) => n.source === 'demo_script');
  const rows = learner.filter((n) => n.lifecycle === 'active' && n.rowIndex > 0);
  const rowOf: Record<string, number> = Object.fromEntries(all.map((n) => [n.id, n.rowIndex]));
  const firstSubmit = (id: string) => events.find((e) => e.type === 'row_submitted' && e.nodeId === id)?.seq ?? 0;

  // Problem understanding --------------------------------------------------------
  const confirmed = events.find((e): e is Extract<GraphEvent, { type: 'problem_confirmed' }> => e.type === 'problem_confirmed');
  const dataNodes = rows.filter((n) => valid(n) && n.dependsOn.some((d) => isProblemNode(d.nodeId)));
  const importantDataPresent = spec.relations.length > 0 || spec.constraints.length > 0 || spec.givens.some((x) => x.symbol.startsWith('d'));
  const importantNodes = rows.filter((n) => valid(n) && n.dependsOn.some((d) => isImportantData(d.nodeId)));

  // Conclusion: graded with the F8 rules (§7.8) over PREMISE dependencies only — an
  // explicit mention of an earlier row ("không phải 3 lần như em đoán ở bước 1") is not a
  // premise, as for the validator. If several rows conclude the unknown, the best-supported
  // one counts (maximum, never a sum), so an extra checking row can never lower the score.
  const primary = (spec.unknowns.find((u) => u.symbol.startsWith('k')) ?? spec.unknowns[spec.unknowns.length - 1]).symbol;
  const expected = solveProblem(spec)[primary]?.value ?? null;
  const targets = (n: ReasoningNode) => claimSymbol(n) === primary;
  const premisePath = (start: ReasoningNode) => {
    const path = new Set<string>();
    const stack = [start.id];
    while (stack.length) {
      const id = stack.pop()!;
      if (path.has(id) || !g.nodes[id] || g.nodes[id].source === 'problem') continue;
      path.add(id);
      for (const d of g.nodes[id].dependsOn) if (d.via !== 'explicit_reference' && d.via !== 'llm_suggested') stack.push(d.nodeId);
    }
    return path;
  };
  const needsCondition = spec.constraints.length > 0 && primary.startsWith('k');
  const grade = (n: ReasoningNode): ConclusionEvidence => {
    const v = n.validation!;
    const path = premisePath(n);
    const pathNodes = [...path].map((id) => g.nodes[id]);
    const statesCondition = (x: ReasoningNode) => x.dependsOn.some((d) => d.via === 'constraint') || (x.interpretation.justification?.citesConstraintIds.length ?? 0) > 0
      || (x.interpretation.normalized?.kind === 'scaling' && x.interpretation.normalized.fixed.length > 0);
    let reasoning: ConclusionEvidence['reasoning'];
    if (pathNodes.some((x) => x.validation?.status === 'invalid' || x.source === 'demo_script')) reasoning = 'contains_invalid';
    else if (v.status === 'insufficient_evidence' && v.reasonCodes.includes('missing_premise')) reasoning = 'insufficient_evidence';
    else if (pathNodes.some((x) => x.validation?.status !== 'valid')) reasoning = 'partial';
    else reasoning = !needsCondition || pathNodes.some(statesCondition) ? 'sufficient' : 'partial';
    return {
      answer: expected && v.claimedValue && equals(v.claimedValue, expected) ? 'correct' : 'incorrect',
      reasoning, answerNodeId: n.id, answerRow: n.rowIndex, answerStatus: v.status,
      inferenceFollows: v.checks.inference === 'follows', bare: v.reasonCodes.includes('missing_premise'), pathNodeIds: [...path],
    };
  };
  const rank = (c: ConclusionEvidence) => (c.answer === 'correct' ? (c.answerStatus === 'valid' ? 2 : c.inferenceFollows && !c.bare ? 1 : 0) : 0) * 10
    + ({ sufficient: 3, partial: 2, insufficient_evidence: 0, contains_invalid: 0 } as const)[c.reasoning];
  const graded = rows.filter((n) => targets(n) && !isHypothesis(n) && n.validation?.claimedValue).map(grade);
  const conclusion: ConclusionEvidence = graded.sort((x, y) => rank(y) - rank(x) || (y.answerRow ?? 0) - (x.answerRow ?? 0))[0] ?? {
    answer: rows.some((n) => targets(n) || n.validation?.status === 'ambiguous') ? 'unreadable' : 'missing',
    reasoning: 'insufficient_evidence', answerNodeId: null, answerRow: null, answerStatus: null, inferenceFollows: false, bare: false, pathNodeIds: [],
  };

  // Genuine mistakes and learner-authored corrections -----------------------------
  const mistakes: GenuineMistake[] = [];
  for (const n of learner) {
    // A genuine mistake is the learner's OWN text judged invalid when it was written or
    // edited: the node_validated event of the same graph version as that submission
    // (F1 contradictions: the confirmation). Later knock-on changes caused by other rows
    // happen at other versions and are never counted.
    const submissions = n.id.startsWith('f1-')
      ? events.filter((e) => e.type === 'problem_confirmed').map((e) => ({ version: e.graphVersion, revision: 1 }))
      : events.filter((e): e is Extract<GraphEvent, { type: 'row_submitted' }> => e.type === 'row_submitted' && e.nodeId === n.id).map((e) => ({ version: e.graphVersion, revision: e.revision }));
    let first: Extract<GraphEvent, { type: 'node_validated' }> | undefined;
    let firstRevision = 1;
    for (const sub of submissions) {
      first = events.find((e): e is Extract<GraphEvent, { type: 'node_validated' }> => e.type === 'node_validated' && e.nodeId === n.id && e.graphVersion === sub.version && e.reasonCodes.some((c) => !CASCADE.has(c)));
      if (first) {
        firstRevision = sub.revision;
        break;
      }
    }
    // A row that was already valid and is broken later on purpose is a regression, not a
    // first mistake: it can never earn self-correction credit.
    if (!first || n.history.slice(0, firstRevision - 1).some((h) => h.validation?.status === 'valid')) continue;
    const mistake = first;
    const sym = claimSymbol(n);
    const dataMisreading = mistake.reasonCodes.includes('contradicts_problem_text') || (!!sym && LENGTH_KINDS.has(sym[0] as Kind));
    const editsAfter = seqsOf(events, (e) => e.type === 'node_revised' && e.nodeId === n.id && e.seq > mistake.seq);
    const reviser = n.revisedBy.map((id) => g.nodes[id]).find((r) => r && r.lifecycle === 'active' && valid(r) && r.source === 'learner');
    let correction: GenuineMistake['correction'] = null;
    if (n.lifecycle === 'active' && valid(n) && editsAfter.length) correction = { kind: 'learner_edit', byNodeId: n.id, eventSeqs: editsAfter };
    else if (reviser) correction = { kind: 'marked_revised_by', byNodeId: reviser.id, eventSeqs: seqsOf(events, (e) => (e.type === 'revised_by_marked' || e.type === 'conflict_resolved') && (e.nodeId === n.id || e.nodeId === reviser.id)) };
    mistakes.push({
      nodeId: n.id, row: n.rowIndex, seq: mistake.seq, reasonCodes: mistake.reasonCodes, dataMisreading, retracted: n.lifecycle === 'retracted',
      correction, attemptedEdit: !correction && editsAfter.length > 0,
    });
  }

  // Verification: independent confirmation of an unknown ---------------------------
  const unknowns = spec.unknowns.map((u) => u.symbol);
  const claims = rows.filter((n) => valid(n) && !isHypothesis(n) && n.interpretation.semanticType !== 'justification' && unknowns.includes(claimSymbol(n) as SymbolId) && n.validation?.claimedValue);
  const crossChecks: CrossCheck[] = [];
  for (let i = 0; i < claims.length; i++) {
    for (let j = i + 1; j < claims.length; j++) {
      const [a, b] = [claims[i], claims[j]];
      const sym = claimSymbol(a)!;
      if (claimSymbol(b) !== sym || !equals(a.validation!.claimedValue!, b.validation!.claimedValue!)) continue;
      const ca = premiseClosure(g, a, sym);
      const cb = premiseClosure(g, b, sym);
      const differentRoute = a.interpretation.normalized?.kind !== b.interpretation.normalized?.kind;
      const disjoint = ca.size > 0 && cb.size > 0 && ![...ca].some((x) => cb.has(x));
      if ((differentRoute || disjoint) && !ca.has(b.id) && !cb.has(a.id)) crossChecks.push({ symbol: sym, nodeIds: [a.id, b.id], rows: [a.rowIndex, b.rowIndex] });
    }
  }

  // Predictions and how they were tested ----------------------------------------------
  const predictionNodes = learner.filter((n) => n.lifecycle === 'active' && n.rowIndex > 0 && isHypothesis(n));
  const observations = rows.filter((n) => n.interpretation.normalized?.kind === 'observation');
  const expStarts = events.filter((e): e is Extract<GraphEvent, { type: 'experiment' }> => e.type === 'experiment' && e.event === 'start');
  const testedPredictions: TestedPrediction[] = [];
  for (const h of predictionNodes) {
    const hSeq = firstSubmit(h.id);
    const start = expStarts.find((e) => e.seq > hSeq);
    const obs = start && observations.find((o) => valid(o) && firstSubmit(o.id) > start.seq);
    if (start && obs) {
      testedPredictions.push({ hypothesisNodeId: h.id, hypothesisRow: h.rowIndex, via: 'experiment_observation', testNodeId: obs.id, testRow: obs.rowIndex, eventSeqs: [start.seq, firstSubmit(obs.id)] });
      continue;
    }
    const sym = claimSymbol(h);
    const later = sym && rows.find((n) => n.rowIndex > h.rowIndex && valid(n) && !isHypothesis(n) && claimSymbol(n) === sym);
    if (later) testedPredictions.push({ hypothesisNodeId: h.id, hypothesisRow: h.rowIndex, via: 'later_reasoning', testNodeId: later.id, testRow: later.rowIndex, eventSeqs: [hSeq, firstSubmit(later.id)] });
  }

  // Own-words explanations -----------------------------------------------------------
  const supported = rows.filter((n) => valid(n) && hasSupportedJustification(n)).map((n) => n.id);
  const attempted = rows.filter((n) => !supported.includes(n.id) && (n.interpretation.justification || n.interpretation.normalized?.kind === 'justification')).map((n) => n.id);

  // Support used (logged, never penalised) -------------------------------------------
  const hintEvents = events.filter((e): e is Extract<GraphEvent, { type: 'hint_shown' }> => e.type === 'hint_shown');
  const hintNodes = [...new Set(hintEvents.map((h) => h.nodeId))];
  // Invitations to the self-check are flow prompts, not help.
  const coach = events.filter((e): e is Extract<GraphEvent, { type: 'coach_exchange' }> => e.type === 'coach_exchange' && e.replyType !== 'invitation');
  const support: SupportUsed = {
    hints: hintNodes.map((id) => {
      const hs = hintEvents.filter((h) => h.nodeId === id);
      return { nodeId: id, row: g.nodes[id]?.rowIndex ?? null, count: hs.length, maxLevel: Math.max(...hs.map((h) => h.level)) as DisclosureLevel, eventSeqs: hs.map((h) => h.seq) };
    }),
    coach: { total: coach.length, ai: coach.filter((c) => c.source === 'ai').length, ruleBased: coach.filter((c) => c.source === 'rule_based').length, eventSeqs: coach.map((c) => c.seq) },
    experiments: { runs: expStarts.length, eventSeqs: seqsOf(events, (e) => e.type === 'experiment') },
    revisions: { count: events.filter((e) => e.type === 'node_revised').length, eventSeqs: seqsOf(events, (e) => e.type === 'node_revised') },
  };

  return {
    version: EVIDENCE_VERSION,
    problemId: spec.id,
    problemType: spec.problemType,
    family: familyOf(spec),
    unknowns,
    phase: ctx.phase,
    graphVersion: g.version,
    confirmation: confirmed ? { seq: confirmed.seq, contradictions: confirmed.contradictions } : null,
    activeRows: rows.length,
    dataUse: { nodeIds: dataNodes.map((n) => n.id), importantDataPresent, importantNodeIds: importantNodes.map((n) => n.id) },
    conclusion,
    mistakes,
    crossChecks,
    testedPredictions,
    predictions: predictionNodes.map((n) => ({ nodeId: n.id, row: n.rowIndex, status: n.validation?.status ?? null })),
    strategies: rows.filter((n) => n.interpretation.semanticType === 'strategy').map((n) => ({ nodeId: n.id, row: n.rowIndex })),
    observations: observations.map((n) => ({ nodeId: n.id, row: n.rowIndex, valid: valid(n) })),
    justifications: { supported, attempted },
    support,
    demoRowsIgnored: demo.length,
    endedEarly: ctx.phase === 'summary' && !ctx.independent?.submitted,
    rowOf,
  };
}

/**
 * The independent self-check (F8), always re-evaluated from its own graph by the same
 * deterministic grader — never read from a stored or client-supplied verdict.
 */
export function collectFinalAssessment(ctx: SessionContext): FinalAssessment {
  const ind = ctx.independent;
  const base = { problemText: ind?.problemSpec.text ?? null, evaluation: null, answerRow: null, answerBare: false };
  if (!ind) return { ...base, status: 'not_started', eventSeqs: [] };
  const eventSeqs = seqsOf(ind.graph.events, (e) => e.type === 'independent_submitted' || e.type === 'independent_evaluated');
  if (!ind.submitted) return { ...base, status: 'in_progress', eventSeqs };
  if (ind.evaluationError && !ind.evaluation) return { ...base, status: 'not_evaluated', eventSeqs };
  try {
    const evaluation = evaluateIndependent(ind);
    const node = evaluation.answerNodeId ? ind.graph.nodes[evaluation.answerNodeId] : null;
    return { problemText: ind.problemSpec.text, status: 'evaluated', evaluation, answerRow: node?.rowIndex ?? null, answerBare: !!node?.validation?.reasonCodes.includes('missing_premise'), eventSeqs };
  } catch {
    return { ...base, status: 'not_evaluated', eventSeqs };
  }
}
