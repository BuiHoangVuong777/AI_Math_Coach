/**
 * Visual Planner (§8.6, §10) — deterministic, no LLM. Turns the graph and the
 * confirmed problem into validated VisualSpecs:
 *   - geometry (mesh sizes) comes only from confirmed givens or learner-chosen
 *     experiment parameters;
 *   - learner claims appear as annotations with their own epistemic status, never
 *     replaced by the correct value;
 *   - derived values are only labelled once the learner has written them.
 */
import { coefNumber, formatExact, fromNumber, toNumber } from './exact.ts';
import { displaySymbol } from './expr.ts';
import type { ProblemFacts } from './facts.ts';
import { learnerNodes, problemNodeLabel } from './graph.ts';
import { RULES, kindOf, indexOf } from './rules.ts';
import { experimentValues, unitOf } from './validator.ts';
import type {
  ChartParams, CylIndex, CylinderAnnotation, CylinderParams, Epistemic, ExperimentState, FormulaParams, GraphParams, Phase,
  ProblemSpec, ReasoningGraph, ReasoningNode, SymbolId, TableCell, TableParams, VisualElement, VisualSpec,
} from './types.ts';
import { RENDERERS } from './types.ts';
import type { DisclosureState } from './types.ts';
import { buildGraphViewModel, explanationForbidden, viewModelTexts, type ExplainContext } from './explanations.ts';
import { allowedLevel, findLeak } from './disclosure.ts';

export interface PlanInput {
  spec: ProblemSpec;
  facts: ProblemFacts;
  graph: ReasoningGraph;
  phase: Phase;
  experiment: ExperimentState | null;
  selectedNodeIds: string[];
  focusNodeId: string | null;
  submitted?: boolean;
  unsupportedRequest?: { request: string; reason: string } | null;
  /** v0.5: disclosure state, so graph explanations respect D0–D4. */
  disclosure?: DisclosureState;
}

export function epistemicOf(n: ReasoningNode): Epistemic {
  const v = n.validation;
  if (!v) return 'learner_unverified';
  if (v.status === 'invalid') return 'learner_invalid';
  if (n.interpretation.semanticType === 'hypothesis' || n.keptAsHypothesis) return 'learner_hypothesis';
  return ({ valid: 'learner_valid', ambiguous: 'learner_ambiguous', unverified: 'learner_unverified', insufficient_evidence: 'learner_insufficient' } as const)[v.status];
}

export const STATUS_WORD: Record<string, string> = {
  valid: 'khớp', invalid: 'chưa khớp', ambiguous: 'cần làm rõ', unverified: 'chưa kiểm tra được', insufficient_evidence: 'thiếu cơ sở',
};

const clip = (s: string, n = 64) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

/** Slider domain (§10.4): exact given values must be selectable. */
export function sliderDomain(spec: ProblemSpec, facts: ProblemFacts, symbol: 'r2' | 'h2'): { min: number; max: number; step: number } {
  const kind = symbol[0];
  const vals = spec.givens.filter((g) => g.symbol[0] === kind || (kind === 'r' && g.symbol[0] === 'd')).map((g) => (g.symbol[0] === 'd' ? coefNumber(g.value) / 2 : coefNumber(g.value)));
  for (const s of [`${kind}1`, `${kind}2`] as SymbolId[]) if (facts[s]) vals.push(coefNumber(facts[s]!.value));
  const step = vals.every((v) => Math.abs(v * 2 - Math.round(v * 2)) < 1e-9) ? 0.5 : 0.1;
  const max = Math.max(1, Math.ceil(1.5 * Math.max(...vals, 1)));
  return { min: step, max, step };
}

export function snapTo(value: number, d: { min: number; max: number; step: number }): number {
  if (!Number.isFinite(value)) return d.min;
  const s = Math.round((value - d.min) / d.step) * d.step + d.min;
  return Math.min(d.max, Math.max(d.min, Math.round(s * 1000) / 1000));
}

/** Latest active learner node that claims a value for `s` (valid or not). */
function claimNode(g: ReasoningGraph, s: SymbolId): ReasoningNode | null {
  const rows = learnerNodes(g).filter((n) => n.lifecycle === 'active' && n.rowIndex > 0 || (n.rowIndex === 0));
  let found: ReasoningNode | null = null;
  for (const n of rows) {
    if (n.lifecycle !== 'active') continue;
    const st = n.interpretation.normalized;
    const target = n.validation?.producedSymbol ?? (st && (st.kind === 'equation' || st.kind === 'conclusion') ? st.target : null);
    if (target === s && n.validation?.claimedValue && n.interpretation.semanticType !== 'hypothesis') found = n;
  }
  return found;
}

function label(n: ReasoningNode): string {
  const tag = n.rowIndex === 0 ? 'khai báo của em' : `bước ${n.rowIndex}`;
  return `${tag} · ${STATUS_WORD[n.validation?.status ?? 'unverified']}`;
}

// ------------------------------------------------------------------ reasoning graph

function planGraph(p: PlanInput, neutral: boolean): VisualSpec {
  const g = p.graph;
  const nodes: GraphParams['nodes'] = [];
  const elements: VisualElement[] = [];
  for (const n of Object.values(g.nodes)) {
    if (n.lifecycle === 'retracted') continue;
    if (n.source === 'problem') {
      nodes.push({ id: n.id, label: problemNodeLabel(p.spec, n.id), row: null, semanticType: n.interpretation.semanticType, status: 'given', epistemic: 'problem_given', revisedBy: [] });
      elements.push({ elementId: `rg-${n.id}`, kind: 'problem_node', label: problemNodeLabel(p.spec, n.id), sourceNodeIds: [n.id], factIds: [], epistemic: 'problem_given' });
      continue;
    }
    const ep = neutral ? 'learner_unverified' : epistemicOf(n);
    const text = `${n.rowIndex === 0 ? 'F1' : n.rowIndex}. ${clip(n.interpretation.displayText || n.originalText, 48)}`;
    nodes.push({ id: n.id, label: text, row: n.rowIndex, semanticType: n.interpretation.semanticType, status: neutral ? 'none' : n.validation?.status ?? 'unverified', epistemic: ep, revisedBy: n.revisedBy });
    elements.push({ elementId: `rg-${n.id}`, kind: 'reasoning_node', label: text, sourceNodeIds: [n.id], factIds: [], epistemic: ep });
  }
  const edges: GraphParams['edges'] = g.edges.map((e) => ({
    from: e.from, to: e.to, suggested: e.provenance === 'llm_interpretation',
    kind: e.kind === 'depends_on' && e.from.startsWith('c:') ? 'constraint' : e.kind === 'depends_on' && e.from.startsWith('rel:') ? 'relation' : e.kind,
  }));
  const learnerCount = nodes.filter((n) => n.row !== null).length;
  return {
    specId: `vs-graph-${g.graphId}`, graphVersion: g.version, renderer: 'reasoning_graph', purpose: 'map_reasoning',
    sourceNodeIds: nodes.map((n) => n.id),
    params: (() => {
      const vm = buildGraphViewModel({ spec: p.spec, facts: p.facts, graph: g, phase: p.phase, disclosure: p.disclosure ?? {}, submitted: p.submitted });
      return { neutral, nodes, edges, nodeViews: vm.nodes, edgeViews: vm.edges } satisfies GraphParams;
    })(),
    elements,
    interaction: { selectable: true },
    fallback: { kind: 'text', content: `Bản đồ suy luận: ${nodes.filter((n) => n.row === null).length} dữ kiện của đề, ${learnerCount} dòng suy luận của em. ${nodes.filter((n) => n.row !== null).map((n) => `${n.label}${neutral ? '' : ` (${STATUS_WORD[n.status] ?? n.status})`}`).join('; ')}` },
    ...(p.unsupportedRequest ? { unsupported: p.unsupportedRequest } : {}),
  };
}

// ------------------------------------------------------------------ 3D cylinders

function planCylinders(p: PlanInput): VisualSpec | null {
  const { spec, facts, graph, experiment } = p;
  const exp = experiment && experiment.active ? experiment : null;
  const ev = exp ? experimentValues(spec, facts, { symbol: exp.symbol, value: fromNumber(exp.value) }) : null;
  const dims: { index: CylIndex; r: number; h: number }[] = [];
  for (const c of spec.cylinders) {
    const r = ev?.[`r${c.index}` as SymbolId] ?? facts[`r${c.index}` as SymbolId]?.value;
    const h = ev?.[`h${c.index}` as SymbolId] ?? facts[`h${c.index}` as SymbolId]?.value;
    if (!r || !h) return null; // symbolic dimension → no faithful geometry (text fallback elsewhere)
    dims.push({ index: c.index, r: coefNumber(r), h: coefNumber(h) });
  }
  const unit = spec.unit;
  const u = unit ?? '';
  const annotations: CylinderAnnotation[] = [];
  const addAnn = (a: CylinderAnnotation) => annotations.push(a);
  // Givens exactly as the problem states them.
  for (const gv of spec.givens) {
    const k = kindOf(gv.symbol);
    const i = indexOf(gv.symbol);
    if (!i || !(k === 'r' || k === 'd' || k === 'h')) continue;
    if (exp && i === 2 && gv.symbol[0] === exp.symbol[0]) continue;
    addAnn({ elementId: `a-g-${gv.symbol}`, kind: k === 'r' ? 'radius' : k === 'd' ? 'diameter' : 'height', cylinder: i, value: coefNumber(gv.value), text: `${displaySymbol(gv.symbol)} = ${formatExact(gv.value)} ${u} (đề)`, epistemic: 'problem_given' });
  }
  // Relations / constraints about cylinder 2, as stated.
  for (const rel of spec.relations) {
    const k = kindOf(rel.target);
    if (exp && rel.target === exp.symbol) continue;
    if (k === 'h' || k === 'r' || k === 'd') {
      const val = facts[rel.target];
      addAnn({ elementId: `a-rel-${rel.id}`, kind: k === 'h' ? 'height' : k === 'd' ? 'diameter' : 'radius', cylinder: 2, value: val ? coefNumber(val.value) : 0, text: `${rel.expr.replace(/([rdhAV])([12])/g, (_, a, b) => displaySymbol(a + b))} (đề)`, epistemic: 'problem_given' });
    }
  }
  for (const c of spec.constraints) {
    const k = c.symbols[0][0];
    if (exp && exp.symbol[0] === k) continue;
    if (k === 'h' || k === 'r' || k === 'd') {
      const val = facts[`${k === 'd' ? 'r' : k}2` as SymbolId];
      addAnn({ elementId: `a-c-${c.id}`, kind: k === 'h' ? 'height' : 'radius', cylinder: 2, value: val ? coefNumber(val.value) : 0, text: `${displaySymbol(`${k}2`)} = ${displaySymbol(`${k}1`)} (đề)`, epistemic: 'problem_given' });
    }
  }
  // Learner claims (including incorrect ones), linked to their rows.
  const nodeFor: Record<string, string> = {};
  if (!exp) {
    for (const s of ['r1', 'r2', 'd1', 'd2', 'h1', 'h2', 'A1', 'A2', 'V1', 'V2'] as SymbolId[]) {
      const n = claimNode(graph, s);
      if (!n || !n.validation?.claimedValue) continue;
      if (!spec.cylinders.some((c) => c.index === indexOf(s))) continue;
      const k = kindOf(s);
      const kind = k === 'r' ? 'radius' : k === 'd' ? 'diameter' : k === 'h' ? 'height' : k === 'A' ? 'base_area' : 'volume';
      const id = `a-${n.id}-${s}`;
      nodeFor[id] = n.id;
      addAnn({ elementId: id, kind, cylinder: indexOf(s)!, value: coefNumber(n.validation.claimedValue), text: `${displaySymbol(s)} = ${formatExact(n.validation.claimedValue)} ${unitOf(s, spec) ?? ''} (${label(n)})`.replace('  ', ' '), epistemic: epistemicOf(n) });
    }
  } else {
    for (const s of ['r2', 'h2', 'A2', 'V2'] as SymbolId[]) {
      const v = ev?.[s];
      if (!v) continue;
      const k = kindOf(s);
      addAnn({ elementId: `a-x-${s}`, kind: k === 'r' ? 'radius' : k === 'h' ? 'height' : k === 'A' ? 'base_area' : 'volume', cylinder: 2, value: coefNumber(v), text: `${displaySymbol(s)} = ${formatExact(v)} ${unitOf(s, spec) ?? ''} (thử nghiệm)`, epistemic: 'experiment_value' });
    }
  }
  // During an experiment the scale is fixed by the slider range, so dragging never rescales the scene.
  const sliderMax = exp ? sliderDomain(spec, facts, exp.symbol).max : 0;
  const expExtent = exp ? (exp.symbol === 'r2' ? 2 * sliderMax : sliderMax) : 0;
  const maxDim = Math.max(expExtent, ...dims.filter((d) => !exp || d.index === 1).map((d) => Math.max(2 * d.r, d.h)), ...dims.map((d) => (exp && exp.symbol === 'r2' ? d.h : exp ? 2 * d.r : 0)));
  // Learner annotations never change the scale: a revision must not resize the scene (an over-long claimed radius may extend past the view).
  const cmPerSceneUnit = maxDim > 12 ? maxDim / 12 : 1;
  const hasInvalid = annotations.some((a) => a.epistemic === 'learner_invalid');
  const elements: VisualElement[] = annotations.map((a) => ({
    elementId: a.elementId, kind: a.kind, label: a.text,
    sourceNodeIds: nodeFor[a.elementId] ? [nodeFor[a.elementId]] : a.elementId.startsWith('a-g-') ? [`g:${a.elementId.slice(4)}`] : a.elementId.startsWith('a-rel-') ? [`rel:${a.elementId.slice(6)}`] : a.elementId.startsWith('a-c-') ? [`c:${a.elementId.slice(4)}`] : [],
    factIds: a.epistemic === 'experiment_value' ? [`x:${a.elementId.slice(4)}`] : [],
    epistemic: a.epistemic,
  }));
  const cylinders: CylinderParams['cylinders'] = dims.map((d) => ({
    index: d.index, r: d.r, h: d.h, role: spec.cylinders.length === 1 ? 'single' : d.index === 1 ? 'reference' : 'comparison',
    label: spec.cylinders.find((c) => c.index === d.index)!.label,
  }));
  const slider = exp ? { symbol: exp.symbol, ...sliderDomain(spec, facts, exp.symbol), locked: false } : undefined;
  return {
    specId: 'vs-3d', graphVersion: graph.version, renderer: 'cylinder_3d',
    purpose: exp ? 'test_hypothesis' : hasInvalid ? 'investigate_invalid' : 'relate_given_to_shape',
    sourceNodeIds: [...new Set(elements.flatMap((e) => e.sourceNodeIds))],
    params: { mode: exp ? 'experiment' : 'static', cylinders, annotations, unit } satisfies CylinderParams,
    elements,
    interaction: { selectable: true, rotate: true, zoom: true, ...(slider ? { slider } : {}) },
    scale: { cmPerSceneUnit, uniform: true },
    fallback: {
      kind: 'text',
      content: `${cylinders.map((c) => `${c.label}: kích thước dựng từ đề`).join('. ')}. Chú thích: ${annotations.map((a) => a.text).join('; ')}.${annotations.filter((a) => a.kind === 'radius' && a.epistemic === 'learner_invalid').map((a) => ` Đoạn bán kính theo ${a.text} dài hơn bán kính của hình nên vượt ra ngoài mép đáy.`).join('')}`,
    },
  };
}

// ------------------------------------------------------------------ comparison table

function planTable(p: PlanInput): VisualSpec | null {
  const { spec, facts, graph, experiment } = p;
  if (spec.cylinders.length < 2) return null;
  const exp = experiment && experiment.active ? experiment : null;
  const claimSyms = ['A1', 'A2', 'V1', 'V2', 'kV', 'kA'] as SymbolId[];
  const hasClaims = claimSyms.some((s) => claimNode(graph, s));
  if (!exp && !hasClaims) return null;
  const columns = spec.cylinders.map((c) => ({ index: c.index, label: c.label }));
  const rows: TableParams['rows'] = [];
  const elements: VisualElement[] = [];
  const cell = (s: SymbolId): TableCell | null => {
    if (exp) {
      const ev = experimentValues(spec, facts, { symbol: exp.symbol, value: fromNumber(exp.value) });
      const v = ev[s];
      if (!v) return null;
      return { elementId: `t-x-${s}`, text: `${formatExact(v)}`, epistemic: 'experiment_value', sourceNodeIds: [] };
    }
    const n = claimNode(graph, s);
    if (n && n.validation?.claimedValue) return { elementId: `t-${n.id}-${s}`, text: `${formatExact(n.validation.claimedValue)} (${label(n)})`, epistemic: epistemicOf(n), sourceNodeIds: [n.id] };
    const gv = spec.givens.find((x) => x.symbol === s);
    if (gv) return { elementId: `t-g-${s}`, text: `${formatExact(gv.value)} (đề)`, epistemic: 'problem_given', sourceNodeIds: [`g:${s}`] };
    const k = s[0];
    const c = spec.constraints.find((x) => x.symbols[0][0] === k);
    if (c && s.endsWith('2')) return { elementId: `t-c-${s}`, text: `= ${displaySymbol(`${k}1`)} (đề)`, epistemic: 'problem_given', sourceNodeIds: [`c:${c.id}`] };
    const rel = spec.relations.find((x) => x.target === s);
    if (rel) return { elementId: `t-rel-${s}`, text: `${rel.expr.replace(/([rdhAV])([12])/g, (_, a, b) => displaySymbol(a + b)).replace(/^\S+ = /, '= ')} (đề)`, epistemic: 'problem_given', sourceNodeIds: [`rel:${rel.id}`] };
    return null;
  };
  const kinds: ('r' | 'd' | 'h' | 'A' | 'V')[] = spec.givens.some((g) => g.symbol[0] === 'd') && !exp ? ['d', 'r', 'h', 'A', 'V'] : ['r', 'h', 'A', 'V'];
  const names = { r: 'Bán kính r', d: 'Đường kính d', h: 'Chiều cao h', A: 'Diện tích đáy A', V: 'Thể tích V' };
  for (const k of kinds) {
    const cells = columns.map((c) => cell(`${k}${c.index}` as SymbolId));
    rows.push({ quantity: k, label: names[k], unit: unitOf(`${k}1` as SymbolId, spec) ?? '', cells });
  }
  if (!exp) {
    for (const s of ['kA', 'kV'] as SymbolId[]) {
      const n = claimNode(graph, s);
      if (n?.validation?.claimedValue) {
        rows.push({ quantity: 'k', label: `Hệ số ${displaySymbol(s)}`, unit: '', cells: [null, { elementId: `t-${n.id}-${s}`, text: `${formatExact(n.validation.claimedValue)} (${label(n)})`, epistemic: epistemicOf(n), sourceNodeIds: [n.id] }] });
      }
    }
  }
  for (const r of rows) for (const c of r.cells) if (c) elements.push({ elementId: c.elementId, kind: 'table_cell', label: `${r.label}: ${c.text}`, sourceNodeIds: c.sourceNodeIds, factIds: c.epistemic === 'experiment_value' ? [c.elementId.replace('t-x-', 'x:')] : [], epistemic: c.epistemic });
  return {
    specId: 'vs-table', graphVersion: graph.version, renderer: 'comparison_table', purpose: 'compare_quantities',
    sourceNodeIds: [...new Set(elements.flatMap((e) => e.sourceNodeIds))],
    params: { mode: exp ? 'experiment' : 'reasoning', columns, rows } satisfies TableParams, elements,
    interaction: { selectable: true },
    fallback: { kind: 'table', content: rows.map((r) => `${r.label}: ${r.cells.map((c) => c?.text ?? '?').join(' | ')}`).join('\n') },
  };
}

// ------------------------------------------------------------------ scaling chart

function scalingNodes(g: ReasoningGraph): { node: ReasoningNode; changeSym: SymbolId; change: number | null; claimSym: SymbolId; claim: number }[] {
  const out: { node: ReasoningNode; changeSym: SymbolId; change: number | null; claimSym: SymbolId; claim: number }[] = [];
  for (const n of learnerNodes(g)) {
    if (n.lifecycle !== 'active') continue;
    const st = n.interpretation.normalized;
    if (st?.kind === 'scaling') {
      const ch = st.changes.find((c) => c.symbol === 'kr' || c.symbol === 'kh');
      out.push({ node: n, changeSym: ch?.symbol ?? 'kr', change: ch ? coefNumber(ch.factor) : null, claimSym: st.claim.symbol, claim: coefNumber(st.claim.factor) });
    } else if ((st?.kind === 'equation' || st?.kind === 'conclusion') && n.interpretation.semanticType === 'hypothesis' && st.target && st.target.startsWith('k') && n.validation?.claimedValue) {
      out.push({ node: n, changeSym: 'kr', change: null, claimSym: st.target, claim: coefNumber(n.validation.claimedValue) });
    }
  }
  return out;
}

function planChart(p: PlanInput): VisualSpec | null {
  const { spec, facts, graph, experiment } = p;
  const nodes = scalingNodes(graph).filter((s) => s.claimSym === 'kV' || s.claimSym === 'kA');
  const exp = experiment ?? null;
  const relevant = nodes.filter((s) => s.node.validation?.status === 'invalid' || !!exp);
  if (!relevant.length && !(exp && exp.active && nodes.length)) return null;
  const axis: 'r' | 'h' = exp?.symbol === 'h2' || nodes.some((s) => s.changeSym === 'kh') ? 'h' : 'r';
  const x0 = facts[`${axis}1` as SymbolId];
  const y0 = facts.V1;
  if (!x0 || !y0) return null;
  const refX = coefNumber(x0.value);
  const refY = coefNumber(y0.value);
  const problemChange = facts[axis === 'r' ? 'kr' : 'kh'];
  const curves: ChartParams['curves'] = [];
  for (const s of nodes) {
    const change = s.change ?? (problemChange ? coefNumber(problemChange.value) : null);
    if (!change || change === 1 || s.claim <= 0) continue;
    // Implied exponent of the learner's claim: claim = change^p (for V; A follows the same axis).
    const exponent = Math.log(s.claim) / Math.log(change);
    const ep = epistemicOf(s.node);
    curves.push({ elementId: `c-${s.node.id}`, exponent, label: ep === 'learner_valid' ? `bước ${s.node.rowIndex} · khớp` : `giả thuyết của em (bước ${s.node.rowIndex})${ep === 'learner_invalid' ? ' · chưa khớp' : ''}`, epistemic: ep, sourceNodeIds: [s.node.id] });
  }
  const points: ChartParams['points'] = [];
  for (const x of exp?.visited ?? []) {
    if (Math.abs(x - refX) < 1e-9) continue;
    const ev = experimentValues(spec, facts, { symbol: `${axis}2` as SymbolId, value: fromNumber(x) });
    if (ev.V2) points.push({ elementId: `pt-${x}`, x, y: coefNumber(ev.V2), label: `${axis} = ${String(x).replace('.', ',')}: V = ${formatExact(ev.V2)}` });
  }
  const dom = sliderDomain(spec, facts, `${axis}2` as 'r2' | 'h2');
  const elements: VisualElement[] = [
    ...curves.map((c) => ({ elementId: c.elementId, kind: 'curve', label: c.label, sourceNodeIds: c.sourceNodeIds, factIds: [], epistemic: c.epistemic })),
    ...points.map((pt) => ({ elementId: pt.elementId, kind: 'point', label: pt.label, sourceNodeIds: [] as string[], factIds: [`x:V2@${pt.x}`], epistemic: 'experiment_value' as Epistemic })),
    { elementId: 'pt-ref', kind: 'point', label: `Hình ban đầu: ${axis} = ${formatExact(x0.value)}, V = ${formatExact(y0.value)}`, sourceNodeIds: [`g:${axis}1`].filter((id) => graph.nodes[id]), factIds: ['f:V1'], epistemic: 'verified_fact' },
  ];
  if (!curves.length && !points.length) return null;
  return {
    specId: 'vs-chart', graphVersion: graph.version, renderer: 'scaling_chart', purpose: 'test_hypothesis',
    sourceNodeIds: [...new Set(curves.flatMap((c) => c.sourceNodeIds))],
    params: { axis, unit: spec.unit, xMax: dom.max, reference: { x: refX, y: refY }, curves, points } satisfies ChartParams,
    elements, interaction: { selectable: true },
    fallback: { kind: 'text', content: `Biểu đồ thể tích theo ${axis === 'r' ? 'bán kính' : 'chiều cao'}. ${curves.map((c) => c.label).join('; ')}. Điểm đã thử: ${points.map((pt) => pt.label).join('; ') || 'chưa có'}.` },
  };
}

// ------------------------------------------------------------------ formula highlight

function ruleFor(n: ReasoningNode): string | null {
  const st = n.interpretation.normalized;
  if (!st) return null;
  if (st.kind === 'formula') return st.lhs === 'A' ? 'R-A' : st.lhs === 'V' ? 'R-V2' : st.lhs === 'd' || st.lhs === 'r' ? 'R-D' : null;
  if (st.kind === 'scaling') return st.claim.symbol === 'kA' ? 'R-KA' : 'R-KV';
  const t = st.kind === 'equation' || st.kind === 'conclusion' ? st.target : null;
  if (!t) return null;
  const k = kindOf(t);
  if (k === 'A') return 'R-A';
  if (k === 'V') return 'R-V1';
  if (k === 'r' && st.kind === 'equation' && st.chain.length > 1) return 'R-D';
  if (t === 'kA') return 'R-KA';
  if (t === 'kV') return 'R-KV';
  return null;
}

function planFormula(p: PlanInput): VisualSpec | null {
  const id = p.selectedNodeIds[0] ?? p.focusNodeId;
  const n = id ? p.graph.nodes[id] : null;
  if (!n || n.source === 'problem') return null;
  const rule = ruleFor(n);
  if (!rule || !RULES[rule].latex) return null;
  // v0.5 disclosure: a formula for a node that is not valid is a D2 hint (rule name) — never shown earlier.
  if (n.validation?.status !== 'valid' && allowedLevel(p.disclosure ?? {}, n.id) < 2) return null;
  return {
    specId: 'vs-formula', graphVersion: p.graph.version, renderer: 'formula_highlight', purpose: 'show_formula_structure',
    sourceNodeIds: [n.id], params: { ruleId: rule, latex: RULES[rule].latex, highlight: RULES[rule].highlight } satisfies FormulaParams,
    elements: [{ elementId: `f-${n.id}`, kind: 'formula', label: RULES[rule].name, sourceNodeIds: [n.id], factIds: [], epistemic: 'verified_fact' }],
    interaction: { selectable: true },
    fallback: { kind: 'text', content: `Công thức liên quan đến bước ${n.rowIndex}: ${RULES[rule].name}` },
  };
}

// ------------------------------------------------------------------ entry

export function planVisuals(p: PlanInput): VisualSpec[] {
  const evidence: ExplainContext = { spec: p.spec, facts: p.facts, graph: p.graph, phase: p.phase, disclosure: p.disclosure ?? {}, submitted: p.submitted };
  if (p.phase === 'independent' && !p.submitted) {
    const neutral = planGraph(p, true);
    return validateVisualSpec(neutral, evidence).ok ? [neutral] : [];
  }
  if (p.phase === 'problem_input' || p.phase === 'problem_review') return [];
  const specs = [planGraph(p, false), planCylinders(p), planTable(p), planChart(p), planFormula(p)].filter((s): s is VisualSpec => !!s);
  // v0.5: each graph node lists the visual elements generated from it (bidirectional selection).
  const graph = specs[0].params as GraphParams;
  for (const nv of graph.nodeViews ?? []) {
    nv.linkedElementIds = specs.slice(1).flatMap((s) => s.elements.filter((e) => e.sourceNodeIds.includes(nv.nodeId)).map((e) => e.elementId));
  }
  return specs.filter((s) => validateVisualSpec(s, evidence).ok);
}

export function validateVisualSpec(s: VisualSpec, evidence?: ExplainContext): { ok: true } | { ok: false; error: string } {
  if (!RENDERERS.includes(s.renderer)) return { ok: false, error: 'renderer' };
  if (!s.fallback?.content) return { ok: false, error: 'fallback' };
  for (const e of s.elements) if (!e.sourceNodeIds.length && !e.factIds.length) return { ok: false, error: `untraceable:${e.elementId}` };
  if (s.renderer === 'cylinder_3d') {
    const pr = s.params as CylinderParams;
    if (!pr.cylinders.every((c) => c.r > 0 && c.h > 0 && c.r <= 1000 && c.h <= 1000)) return { ok: false, error: 'range' };
    if (!s.scale || !(s.scale.cmPerSceneUnit > 0)) return { ok: false, error: 'scale' };
  }
  if (s.renderer === 'reasoning_graph') {
    const gp = s.params as GraphParams;
    if (evidence && evidence.graph.version !== s.graphVersion) return { ok: false, error: 'stale_graph' };
    for (const nv of gp.nodeViews ?? []) {
      if (nv.graphVersion !== s.graphVersion) return { ok: false, error: `stale_view:${nv.nodeId}` };
      if (evidence && evidence.graph.nodes[nv.nodeId]?.revision !== nv.nodeRevision) return { ok: false, error: `stale_revision:${nv.nodeId}` };
      const e = nv.explanation;
      if (e && (e.graphVersion !== s.graphVersion || e.nodeRevision !== nv.nodeRevision || e.explanationId !== `${nv.nodeId}@r${nv.nodeRevision}@v${s.graphVersion}@D${e.disclosureLevel}`)) return { ok: false, error: `untraceable_explanation:${nv.nodeId}` };
    }
    for (const ev of gp.edgeViews ?? []) if (ev.graphVersion !== s.graphVersion) return { ok: false, error: `stale_edge:${ev.edgeId}` };
    if (evidence) {
      const forbidden = explanationForbidden(evidence);
      for (const text of viewModelTexts({ nodes: gp.nodeViews ?? [], edges: gp.edgeViews ?? [] })) {
        if (findLeak(text, forbidden)) return { ok: false, error: 'explanation_leak' };
      }
    }
  }
  const sl = s.interaction.slider;
  if (sl && !(sl.min > 0 && sl.max > sl.min && sl.step > 0)) return { ok: false, error: 'slider' };
  return { ok: true };
}

export { toNumber };
