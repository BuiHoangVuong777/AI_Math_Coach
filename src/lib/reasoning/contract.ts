/**
 * Structural validation of untrusted requests to /api/reasoning/* (server side).
 * Validation results inside the context are never trusted: runTurn recomputes them.
 */
import type { TurnOp, TurnRequest } from './types.ts';
import { LIMITS } from './types.ts';

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number) => typeof v === 'string' && v.length <= max;
const int = (v: unknown, min = 0, max = 1e9) => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const ID = /^(n\d{1,4}|f1-\d{1,2}|g:[rdhAV][12]|c:c\d{1,2}|rel:rel\d{1,2}|u:(?:[rdhAV][12]|k[rhAV]))$/;

const OPS: TurnOp['type'][] = [
  'add_row', 'edit_row', 'retract_row', 'resolve_ambiguity', 'reject_interpretation', 'resolve_conflict', 'mark_revised_by',
  'experiment', 'request_hint', 'ask_coach', 'select_node', 'start_independent', 'submit_independent', 'retry_independent_evaluation', 'finish',
];

function checkOp(op: unknown): string | null {
  if (!isObj(op) || !OPS.includes(op.type as TurnOp['type'])) return 'op';
  const idOk = (k: string) => typeof op[k] === 'string' && ID.test(op[k] as string);
  switch (op.type) {
    case 'add_row':
      return str(op.rowText, LIMITS.rowText * 2) && (op.source === undefined || op.source === 'learner' || op.source === 'demo_script') ? null : 'rowText';
    case 'edit_row':
      return idOk('nodeId') && str(op.rowText, LIMITS.rowText * 2) ? null : 'edit_row';
    case 'retract_row':
    case 'reject_interpretation':
    case 'request_hint':
      return idOk('nodeId') ? null : 'nodeId';
    case 'resolve_ambiguity':
      return idOk('nodeId') && (op.choiceIndex === 'reject' || int(op.choiceIndex, 0, 5)) ? null : 'resolve_ambiguity';
    case 'resolve_conflict':
      return idOk('nodeId') && (op.action === 'replace' || op.action === 'keep_both') ? null : 'resolve_conflict';
    case 'mark_revised_by':
      return idOk('nodeId') && idOk('byNodeId') && typeof op.accept === 'boolean' ? null : 'mark_revised_by';
    case 'experiment':
      return ['start', 'set', 'end'].includes(op.event as string) && (op.value === undefined || (typeof op.value === 'number' && Number.isFinite(op.value))) && (op.symbol === undefined || op.symbol === 'r2' || op.symbol === 'h2') && (op.nodeId === undefined || idOk('nodeId')) ? null : 'experiment';
    case 'ask_coach':
      return str(op.message, LIMITS.coachMessage * 2) && (op.nodeId === undefined || op.nodeId === null || idOk('nodeId')) ? null : 'ask_coach';
    case 'select_node':
      return op.nodeId === null || idOk('nodeId') ? null : 'select_node';
    case 'start_independent':
      // analogText is honoured only by test harnesses (ports.allowAnalogOverride); the server ignores it.
      return op.analogText === undefined || str(op.analogText, LIMITS.problemText) ? null : 'start_independent';
    default:
      return null;
  }
}

function checkGraph(g: unknown): string | null {
  if (!isObj(g) || !isObj(g.nodes) || !Array.isArray(g.edges) || !Array.isArray(g.events) || !int(g.version, 1) || !int(g.nextNodeNumber, 1, 10_000)) return 'graph';
  if (g.graphId !== 'main' && g.graphId !== 'independent') return 'graphId';
  const nodes = Object.entries(g.nodes);
  if (nodes.length > LIMITS.maxLearnerNodes + 40) return 'too_many_nodes';
  for (const [id, n] of nodes) {
    if (!ID.test(id) || !isObj(n) || n.id !== id) return 'node_id';
    if (!str(n.originalText, 700) || !int(n.revision, 1, 1000) || !int(n.rowIndex, -1, 1000) || !Array.isArray(n.history) || n.history.length > 50) return 'node';
    if (!isObj(n.interpretation) || !Array.isArray(n.dependsOn) || !Array.isArray(n.revisedBy)) return 'node';
    if (!['active', 'stale', 'retracted'].includes(n.lifecycle as string)) return 'lifecycle';
  }
  return null;
}

function checkSpec(s: unknown): string | null {
  if (!isObj(s) || s.domain !== 'cylinder_geometry' || !str(s.text, LIMITS.problemText) || !Array.isArray(s.givens) || !Array.isArray(s.cylinders)) return 'problemSpec';
  if (s.givens.length > 8 || (s.cylinders as unknown[]).length > 2 || !Array.isArray(s.relations) || !Array.isArray(s.constraints) || !Array.isArray(s.unknowns)) return 'problemSpec';
  for (const gv of s.givens as unknown[]) {
    if (!isObj(gv) || !isObj(gv.value) || !int(gv.value.n, 1, 1_000_000) || !int(gv.value.d, 1, 1_000_000)) return 'given';
  }
  if (s.interpretationStatus !== 'confirmed') return 'problem_not_confirmed';
  return null;
}

export function validateTurnRequest(body: unknown): Result<TurnRequest> {
  if (!isObj(body)) return { ok: false, error: 'body' };
  const { context, expectedGraphVersion, opId, op, selectedNodeIds } = body;
  if (!int(expectedGraphVersion, 1) || !str(opId, 64) || !(opId as string)) return { ok: false, error: 'meta' };
  const opErr = checkOp(op);
  if (opErr) return { ok: false, error: opErr };
  if (selectedNodeIds !== undefined && (!Array.isArray(selectedNodeIds) || selectedNodeIds.length > 5 || !selectedNodeIds.every((x) => typeof x === 'string' && ID.test(x)))) return { ok: false, error: 'selected' };
  if (!isObj(context)) return { ok: false, error: 'context' };
  if (!['reasoning', 'independent', 'summary'].includes(context.phase as string)) return { ok: false, error: 'phase' };
  const e = checkSpec(context.problemSpec) ?? checkGraph(context.graph);
  if (e) return { ok: false, error: e };
  if (!isObj(context.disclosure) || !Array.isArray(context.processedOpIds)) return { ok: false, error: 'context' };
  if (context.independent !== null) {
    const ind = context.independent;
    if (!isObj(ind) || typeof ind.submitted !== 'boolean') return { ok: false, error: 'independent' };
    const ie = checkSpec(ind.problemSpec) ?? checkGraph(ind.graph);
    if (ie) return { ok: false, error: `independent_${ie}` };
  }
  if (context.experiment !== null && (!isObj(context.experiment) || !Array.isArray(context.experiment.visited) || context.experiment.visited.length > 200)) return { ok: false, error: 'experiment' };
  return { ok: true, value: body as unknown as TurnRequest };
}

export function validateProblemRequest(body: unknown): Result<{ problemText: string }> {
  if (!isObj(body) || Object.keys(body).join() !== 'problemText' || typeof body.problemText !== 'string') return { ok: false, error: 'body' };
  const t = body.problemText.normalize('NFC').trim();
  if (!t || t.length > LIMITS.problemText) return { ok: false, error: 'problemText' };
  return { ok: true, value: { problemText: t } };
}
