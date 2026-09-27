/**
 * ReasoningGraph reducer (§9.5). Pure and deterministic.
 *
 * RG-C1 acyclic (explicit forward references that create a cycle are rejected)
 * RG-C2 one active producer per symbol; a different redefinition waits for the learner
 * RG-C3 problem nodes are never edited from rows
 * RG-C4 each mutating operation bumps `version` by exactly one
 * RG-C5 every turn revalidates all nodes in row (topological) order — nothing keeps a stale status
 * RG-C6 originalText, history and events are append-only
 * RG-C7 at most LIMITS.maxLearnerNodes learner nodes
 */
import { equals, formatExact } from './exact.ts';
import type { ProblemFacts } from './facts.ts';
import type { Contradiction } from './problemParser.ts';
import type { RowParse } from './rowParser.ts';
import { displaySymbol } from './expr.ts';
import { KIND_LABEL } from './rules.ts';
import { validateNode, type ProducerInfo, type ValidationContext } from './validator.ts';
import type {
  Dependency, Edge, ExperimentState, GraphEvent, Interpretation, Kind, ProblemSpec, ReasoningGraph, ReasoningNode, SymbolId, ValidationResult,
} from './types.ts';
import { LIMITS } from './types.ts';

type EventBody = GraphEvent extends infer E ? (E extends GraphEvent ? Omit<E, 'seq' | 'at' | 'graphVersion'> : never) : never;

export function appendEvent(g: ReasoningGraph, body: EventBody, now: number): ReasoningGraph {
  const seq = (g.events[g.events.length - 1]?.seq ?? 0) + 1;
  return { ...g, events: [...g.events, { ...body, seq, at: now, graphVersion: g.version } as GraphEvent] };
}

function problemNode(id: string, text: string, semantic: ReasoningNode['interpretation']['semanticType'], graphId: ReasoningGraph['graphId'], now: number): ReasoningNode {
  return {
    id, graphId, rowIndex: -1, revision: 1, originalText: text, source: 'problem', provenance: 'problem_given',
    interpretation: {
      status: 'interpreted', provenance: 'deterministic_parse', semanticType: semantic, normalized: null, displayText: text,
      justification: null, explicitRefs: [], alternatives: [], ambiguities: [], learnerConfirmed: true,
    },
    dependsOn: [], validation: null, lifecycle: 'active', revisedBy: [], history: [], createdAt: now, updatedAt: now,
  };
}

export function problemNodeLabel(spec: ProblemSpec, id: string): string {
  const [kind, key] = id.split(':');
  if (kind === 'g') {
    const g = spec.givens.find((x) => x.symbol === key);
    return g ? `${displaySymbol(key)} = ${formatExact(g.value)}${g.unit ? ' ' + g.unit : ''}` : id;
  }
  if (kind === 'c') {
    const c = spec.constraints.find((x) => x.id === key);
    return c ? `${KIND_LABEL[c.symbols[0][0] as Kind]} giữ nguyên` : id;
  }
  if (kind === 'rel') return (spec.relations.find((x) => x.id === key)?.expr ?? id).replace(/([rdhAV])([12])/g, (_, a, b) => displaySymbol(a + b));
  if (kind === 'u') return `Cần tìm: ${displaySymbol(key)}`;
  return id;
}

export function createGraph(spec: ProblemSpec, graphId: ReasoningGraph['graphId'], now: number, contradictions: Contradiction[] = [], parseFn?: (text: string) => RowParse): ReasoningGraph {
  const nodes: Record<string, ReasoningNode> = {};
  const add = (id: string, sem: ReasoningNode['interpretation']['semanticType']) => {
    nodes[id] = problemNode(id, problemNodeLabel(spec, id), sem, graphId, now);
  };
  for (const g of spec.givens) add(`g:${g.symbol}`, 'given');
  for (const c of spec.constraints) add(`c:${c.id}`, 'constraint');
  for (const r of spec.relations) add(`rel:${r.id}`, 'constraint');
  for (const u of spec.unknowns) add(`u:${u.symbol}`, 'unknown');
  let g: ReasoningGraph = { graphId, version: 1, problemSpecVersion: spec.version, nodes, edges: [], symbolTable: {}, events: [], nextNodeNumber: 1 };
  contradictions.forEach((c, i) => {
    const id = `f1-${i + 1}`;
    const text = c.text;
    g.nodes[id] = {
      ...problemNode(id, text, 'given', graphId, now),
      rowIndex: 0, source: 'learner', provenance: 'learner_claim',
      interpretation: {
        status: 'interpreted', provenance: 'learner_form', semanticType: 'given',
        normalized: { kind: 'equation', target: c.symbol, chain: [valueToExpr(c)], unit: null },
        displayText: `Em khai báo: ${displaySymbol(c.symbol)} = ${formatExact(c.value)}`, justification: null, explicitRefs: [], alternatives: [], ambiguities: [], learnerConfirmed: true,
      },
    };
  });
  void parseFn;
  g = appendEvent(g, { type: 'problem_confirmed', problemId: spec.id, learnerEdits: 0, contradictions: contradictions.length }, now);
  return g;
}

function valueToExpr(c: Contradiction): string {
  const v = c.value;
  const base = v.d === 1 ? String(v.n) : `${v.n}/${v.d}`;
  return v.piPow ? `(${base})π` : base;
}

export function learnerNodes(g: ReasoningGraph): ReasoningNode[] {
  return Object.values(g.nodes).filter((n) => n.source !== 'problem').sort((a, b) => a.rowIndex - b.rowIndex);
}

export function toInterpretation(p: RowParse, provenance: Interpretation['provenance'] = 'deterministic_parse'): Interpretation {
  return {
    status: p.status, provenance, semanticType: p.semanticType, normalized: p.normalized, displayText: p.displayText,
    justification: p.justification, explicitRefs: p.explicitRefs, alternatives: p.alternatives, ambiguities: p.ambiguities,
    learnerConfirmed: null, outOfScope: p.outOfScope || undefined,
  };
}

export class GraphError extends Error {
  readonly code: string;
  constructor(code: string, message: string = code) {
    super(message);
    this.code = code;
  }
}

export function addRow(g: ReasoningGraph, text: string, interp: Interpretation, source: 'learner' | 'demo_script', now: number): { graph: ReasoningGraph; nodeId: string } {
  const rows = learnerNodes(g).filter((n) => n.rowIndex > 0);
  if (rows.length >= LIMITS.maxLearnerNodes) throw new GraphError('too_many_rows', `Tối đa ${LIMITS.maxLearnerNodes} dòng.`);
  const id = `n${g.nextNodeNumber}`;
  const rowIndex = (rows[rows.length - 1]?.rowIndex ?? 0) + 1;
  const node: ReasoningNode = {
    id, graphId: g.graphId, rowIndex, revision: 1, originalText: text, source, provenance: 'learner_claim', interpretation: interp,
    dependsOn: [], validation: null, lifecycle: 'active', revisedBy: [], history: [], createdAt: now, updatedAt: now,
  };
  let next: ReasoningGraph = { ...g, version: g.version + 1, nextNodeNumber: g.nextNodeNumber + 1, nodes: { ...g.nodes, [id]: node } };
  next = appendEvent(next, { type: 'row_submitted', nodeId: id, revision: 1, text, source }, now);
  next = appendEvent(next, { type: 'node_interpreted', nodeId: id, status: interp.status, provenance: interp.provenance }, now);
  return { graph: next, nodeId: id };
}

function requireLearner(g: ReasoningGraph, nodeId: string): ReasoningNode {
  const n = g.nodes[nodeId];
  if (!n) throw new GraphError('not_found');
  if (n.source === 'problem') throw new GraphError('problem_node_readonly', 'Dữ kiện của đề chỉ sửa được ở bước xác nhận đề.');
  return n;
}

export function reviseRow(g: ReasoningGraph, nodeId: string, text: string, interp: Interpretation, now: number): ReasoningGraph {
  const n = requireLearner(g, nodeId);
  if (n.lifecycle === 'retracted') throw new GraphError('retracted');
  const prev = { revision: n.revision, originalText: n.originalText, interpretation: compactInterpretation(n.interpretation), validation: compactValidation(n.validation), at: n.updatedAt };
  const node: ReasoningNode = { ...n, revision: n.revision + 1, originalText: text, interpretation: interp, history: [...n.history, prev], updatedAt: now };
  let next: ReasoningGraph = { ...g, version: g.version + 1, nodes: { ...g.nodes, [nodeId]: node } };
  next = appendEvent(next, { type: 'row_submitted', nodeId, revision: node.revision, text, source: n.source === 'demo_script' ? 'demo_script' : 'learner' }, now);
  next = appendEvent(next, { type: 'node_interpreted', nodeId, status: interp.status, provenance: interp.provenance }, now);
  return next;
}

/** History keeps what the summary and premise_changed detection need, not the full payload. */
function compactInterpretation(i: Interpretation): Interpretation {
  return { status: i.status, provenance: i.provenance, semanticType: i.semanticType, normalized: null, displayText: i.displayText, justification: null, explicitRefs: [], alternatives: [], ambiguities: [], learnerConfirmed: i.learnerConfirmed };
}
function compactValidation(v: ValidationResult | null): ValidationResult | null {
  return v ? { ...v, facts: [], rootCauseNodeIds: [] } : null;
}

export function updateNode(g: ReasoningGraph, nodeId: string, patch: Partial<ReasoningNode>, now: number): ReasoningGraph {
  const n = requireLearner(g, nodeId);
  return { ...g, version: g.version + 1, nodes: { ...g.nodes, [nodeId]: { ...n, ...patch, updatedAt: now } } };
}

export function retractRow(g: ReasoningGraph, nodeId: string, now: number): ReasoningGraph {
  const n = requireLearner(g, nodeId);
  if (n.lifecycle === 'retracted') return g;
  const affected = transitiveDependents(g, nodeId);
  let next = updateNode(g, nodeId, { lifecycle: 'retracted' }, now);
  next = appendEvent(next, { type: 'node_retracted', nodeId, affected }, now);
  return next;
}

/** Nodes that (transitively) depend on `nodeId` through dependency edges. */
export function transitiveDependents(g: ReasoningGraph, nodeId: string): string[] {
  const out = new Set<string>();
  const stack = [nodeId];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const e of g.edges) {
      if (e.kind === 'depends_on' && e.from === cur && !out.has(e.to)) {
        out.add(e.to);
        stack.push(e.to);
      }
    }
  }
  return [...out];
}

function transitiveDeps(dependsOn: Map<string, string[]>, nodeId: string): Set<string> {
  const out = new Set<string>();
  const stack = [nodeId];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const d of dependsOn.get(cur) ?? []) if (!out.has(d)) out.add(d), stack.push(d);
  }
  return out;
}

export interface RevalidateOptions {
  spec: ProblemSpec;
  facts: ProblemFacts;
  experiment: ExperimentState | null;
  now: number;
  /** Recompute without emitting node_validated events (baseline for untrusted input). */
  silent?: boolean;
}

/**
 * Validates every learner node in row order with the premises available at that row,
 * recomputes dependencies, edges, symbol table and root causes (RG-C5).
 */
export function revalidate(g: ReasoningGraph, o: RevalidateOptions): { graph: ReasoningGraph; changed: string[] } {
  let cyclic = new Set<string>();
  let result = revalidateOnce(g, o, cyclic);
  // RG-C1: explicit references that close a cycle are rejected, then validate again.
  const deps = new Map<string, string[]>();
  for (const n of Object.values(result.graph.nodes)) deps.set(n.id, n.dependsOn.map((d) => d.nodeId));
  const found = new Set<string>();
  for (const n of Object.values(result.graph.nodes)) {
    for (const d of n.dependsOn) {
      if (d.via === 'explicit_reference' && transitiveDeps(deps, d.nodeId).has(n.id)) found.add(n.id);
    }
  }
  if (found.size) {
    cyclic = found;
    result = revalidateOnce(g, o, cyclic);
  }
  return result;
}

function revalidateOnce(g: ReasoningGraph, o: RevalidateOptions, cyclic: Set<string>): { graph: ReasoningGraph; changed: string[] } {
  const nodes: Record<string, ReasoningNode> = { ...g.nodes };
  const producers: Partial<Record<SymbolId, ProducerInfo>> = {};
  const blocked = new Set<SymbolId>();
  const status: Record<string, ValidationResult['status'] | 'given'> = {};
  for (const n of Object.values(nodes)) if (n.source === 'problem') status[n.id] = 'given';
  const changed: string[] = [];
  const rows = learnerNodes(g);
  const byRow = new Map(rows.filter((n) => n.lifecycle !== 'retracted').map((n) => [n.rowIndex, n.id]));
  const producedBy: Record<string, SymbolId | null> = {};

  for (const node of rows) {
    if (node.lifecycle === 'retracted') {
      const ps = node.validation?.producedSymbol;
      if (ps && !producers[ps]) blocked.add(ps);
      continue;
    }
    const ctx: ValidationContext = {
      spec: o.spec, facts: o.facts, graphVersion: g.version,
      producers: { ...producers }, blocked: new Set(blocked),
      statusOf: (id) => status[id],
      previousValues: (id) => (nodes[id]?.history ?? []).map((h) => h.validation?.claimedValue).filter((v): v is NonNullable<typeof v> => !!v),
      experiment: o.experiment,
    };
    const check = validateNode(node, ctx);
    let v = check.validation;
    const dependsOn: Dependency[] = [];
    for (const d of check.deps) {
      if (d.startsWith('free:')) continue;
      const via: Dependency['via'] = d.startsWith('c:') ? 'constraint' : d.startsWith('rel:') ? 'relation' : 'symbol';
      if (nodes[d] && d !== node.id && !dependsOn.some((x) => x.nodeId === d)) {
        const m = check.depMeta[d] ?? {};
        const symbol = m.symbol ?? (d.startsWith('g:') ? (d.slice(2) as SymbolId) : undefined);
        dependsOn.push({
          nodeId: d, via,
          ...(symbol ? { symbol } : {}),
          origin: m.origin ?? 'premise',
          depth: m.direct || d.startsWith('c:') || d.startsWith('rel:') ? 'direct' : 'indirect',
          ...(m.broken ? { broken: true } : {}),
        });
      }
    }
    for (const ref of node.interpretation.explicitRefs) {
      const target = byRow.get(ref);
      if (!target || target === node.id) continue;
      if (cyclic.has(node.id) && (nodes[target].rowIndex > node.rowIndex)) continue;
      if (!dependsOn.some((x) => x.nodeId === target)) dependsOn.push({ nodeId: target, via: 'explicit_reference', origin: 'premise', depth: 'direct' });
    }
    if (cyclic.has(node.id)) {
      v = { ...v, status: 'ambiguous', reasonCodes: [...new Set([...v.reasonCodes, 'cyclic_reference'])], producedSymbol: null };
    }

    // RG-C2: a different redefinition of an already produced symbol waits for the learner.
    const ps = v.producedSymbol;
    if (ps && producers[ps] && v.claimedValue && !equals(producers[ps]!.value, v.claimedValue) && !node.keptAsHypothesis && node.revisedBy.length === 0) {
      v = { ...v, status: 'ambiguous', reasonCodes: [...new Set([...v.reasonCodes, 'symbol_redefined', `conflict_with:${producers[ps]!.nodeId}`])], producedSymbol: null };
    }
    // Root causes: invalid premises (or their own roots).
    if (v.status === 'invalid' || v.status === 'insufficient_evidence') {
      const roots = new Set<string>();
      for (const d of dependsOn) {
        const dn = nodes[d.nodeId];
        if (dn && dn.source !== 'problem' && dn.validation?.status === 'invalid') {
          const r = dn.validation.rootCauseNodeIds;
          (r.length ? r : [dn.id]).forEach((x) => roots.add(x));
        } else if (dn && dn.source !== 'problem' && dn.validation?.rootCauseNodeIds.length && dn.validation.status === 'insufficient_evidence') {
          dn.validation.rootCauseNodeIds.forEach((x) => roots.add(x));
        }
      }
      v = { ...v, rootCauseNodeIds: [...roots].sort((a, b) => nodes[a].rowIndex - nodes[b].rowIndex) };
    }
    const prod = v.producedSymbol ?? null;
    if (prod && v.status !== 'ambiguous' && v.status !== 'unverified' && node.revisedBy.length === 0 && !node.keptAsHypothesis && v.claimedValue) {
      producers[prod] = { nodeId: node.id, value: v.claimedValue, rowIndex: node.rowIndex };
      blocked.delete(prod);
    }
    producedBy[node.id] = prod;
    status[node.id] = v.status;
    const before = node.validation;
    if (!before || before.status !== v.status || before.reasonCodes.join() !== v.reasonCodes.join() || before.nodeRevision !== v.nodeRevision) changed.push(node.id);
    nodes[node.id] = { ...node, validation: v, dependsOn };
  }

  // Edges (derived, never stored independently of nodes).
  const edges: Edge[] = [];
  for (const n of Object.values(nodes)) {
    if (n.lifecycle === 'retracted') continue;
    for (const d of n.dependsOn) edges.push({ from: d.nodeId, to: n.id, kind: 'depends_on', provenance: n.interpretation.provenance === 'llm_interpretation' ? 'llm_interpretation' : 'deterministic_parse' });
    for (const by of n.revisedBy) if (nodes[by]) edges.push({ from: n.id, to: by, kind: 'revised_by', provenance: 'learner_claim' });
    if (n.interpretation.normalized?.kind === 'justification') {
      const prev = [...rows].reverse().find((x) => x.rowIndex < n.rowIndex && x.lifecycle !== 'retracted' && x.interpretation.normalized?.kind !== 'justification');
      if (prev) edges.push({ from: n.id, to: prev.id, kind: 'justifies', provenance: 'deterministic_parse' });
    }
    if (n.interpretation.normalized?.kind === 'observation' && o.experiment?.hypothesisNodeId && nodes[o.experiment.hypothesisNodeId]) {
      edges.push({ from: n.id, to: o.experiment.hypothesisNodeId, kind: 'tests', provenance: 'experiment_value' });
    }
  }
  const symbolTable: ReasoningGraph['symbolTable'] = {};
  for (const gv of o.spec.givens) symbolTable[gv.symbol] = { producerNodeId: null, status: 'given' };
  for (const [s, p] of Object.entries(producers)) if (p) symbolTable[s as SymbolId] = { producerNodeId: p.nodeId, status: nodes[p.nodeId].validation!.status };

  let next: ReasoningGraph = { ...g, nodes, edges, symbolTable, problemSpecVersion: o.spec.version };
  for (const id of o.silent ? [] : changed) {
    const v = nodes[id].validation!;
    next = appendEvent(next, { type: 'node_validated', nodeId: id, status: v.status, reasonCodes: v.reasonCodes }, o.now);
  }
  return { graph: next, changed };
}

/** The node that currently produces `s` (for UI/visuals). */
export function producerOf(g: ReasoningGraph, s: SymbolId): ReasoningNode | null {
  const id = g.symbolTable[s]?.producerNodeId;
  return id ? g.nodes[id] : null;
}

export function conflictOf(n: ReasoningNode): string | null {
  const code = n.validation?.reasonCodes.find((r) => r.startsWith('conflict_with:'));
  return code ? code.slice('conflict_with:'.length) : null;
}
