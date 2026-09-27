/**
 * Explanation Builder (PRODUCT_SPEC v0.5 §8.10). Pure and deterministic.
 *
 * Turns the validated graph of ONE graphVersion into node/edge view models for the
 * Explainable Reasoning Graph. It never validates mathematics, never changes a node,
 * a status or the disclosure level, and every string passes the answer-leak guard.
 * Values it may print: the learner's own text/claims, problem givens, experiment values.
 */
import { equals, formatExact } from './exact.ts';
import { displayExpr, displaySymbol, exprToLatex } from './expr.ts';
import { allowedLevel, buildForbidden, findLeak, type ForbiddenValue } from './disclosure.ts';
import type { ProblemFacts } from './facts.ts';
import { learnerNodes, problemNodeLabel, transitiveDependents } from './graph.ts';
import { RULES, kindOf } from './rules.ts';
import { CHECK_ASPECT, KIND_WORD, REASON_SHORT, RULE_SHORT, STATUS_BADGE, WHY } from './explanationTemplates.ts';
import { D0 as D0_QUESTIONS, exampleD3, stepD4 } from './tutorFallback.ts';
import type {
  DisclosureLevel, DisclosureState, Epistemic, ExplanationKind, ExplanationViewModel, GraphEdgeViewModel, GraphNodeViewModel,
  Phase, ProblemSpec, ReasoningGraph, ReasoningNode, SymbolId, ValidationResult,
} from './types.ts';

export interface ExplainContext {
  spec: ProblemSpec;
  facts: ProblemFacts;
  graph: ReasoningGraph;
  phase: Phase;
  disclosure: DisclosureState;
  /** Independent graph after submission: statuses shown at D0, no escalation. */
  submitted?: boolean;
  /** Nodes being revalidated right now (client-side). */
  staleIds?: string[];
}

export interface GraphViewModel {
  graphVersion: number;
  neutral: boolean;
  nodes: GraphNodeViewModel[];
  edges: GraphEdgeViewModel[];
}

const LEVEL_TEXT = ['D0', 'D1', 'D2', 'D3', 'D4'];

// ------------------------------------------------------------------ helpers

function epistemicOf(n: ReasoningNode): Epistemic {
  const v = n.validation;
  if (n.source === 'problem') return 'problem_given';
  if (!v) return 'learner_unverified';
  if (v.status === 'invalid') return 'learner_invalid';
  if (n.interpretation.semanticType === 'hypothesis' || n.keptAsHypothesis) return 'learner_hypothesis';
  return ({ valid: 'learner_valid', ambiguous: 'learner_ambiguous', unverified: 'learner_unverified', insufficient_evidence: 'learner_insufficient' } as const)[v.status];
}

const rowOf = (g: ReasoningGraph, id: string) => (g.nodes[id]?.rowIndex === 0 ? 'F1' : String(g.nodes[id]?.rowIndex ?? '?'));
const rows = (g: ReasoningGraph, ids: string[]) => [...new Set(ids)].sort((a, b) => (g.nodes[a]?.rowIndex ?? 0) - (g.nodes[b]?.rowIndex ?? 0)).map((id) => rowOf(g, id)).join(', ');
const isLearner = (id: string) => /^n\d+$|^f1-/.test(id);

/** Values the learner has written themselves are never "hidden" from them (§9.9 value policy). */
export function explanationForbidden(ctx: ExplainContext): ForbiddenValue[] {
  const written = learnerNodes(ctx.graph).filter((n) => n.lifecycle === 'active').map((n) => n.validation?.claimedValue).filter((v): v is NonNullable<typeof v> => !!v);
  return buildForbidden(ctx.spec, ctx.facts, ctx.graph).filter((f) => !written.some((w) => equals(w, f.value)));
}

function safe(text: string, forbidden: ForbiddenValue[], fallback: string): { text: string; ok: boolean } {
  return findLeak(text, forbidden) ? { text: fallback, ok: false } : { text, ok: true };
}

function valueOf(n: ReasoningNode | undefined, sym?: SymbolId): string | null {
  const v = n?.validation;
  if (!v?.claimedValue || !v.producedSymbol || (sym && v.producedSymbol !== sym)) return null;
  return formatExact(v.claimedValue);
}

function unitOfGiven(spec: ProblemSpec, sym: SymbolId): string {
  const g = spec.givens.find((x) => x.symbol === sym);
  return g?.unit ? ` ${g.unit}` : '';
}

function notationOf(n: ReasoningNode): string | null {
  const st = n.interpretation.normalized;
  if (!st) return null;
  if (st.kind === 'equation' && st.chain.length) {
    const parts = st.chain.map((c) => (c.startsWith('~') ? `\\approx ${exprToLatex(c) ?? ''}` : `= ${exprToLatex(c) ?? ''}`));
    const lhs = st.target ? (exprToLatex(st.target) ?? st.target) : '';
    return `${lhs} ${parts.join(' ')}`.replace(/^ = /, '');
  }
  if (st.kind === 'conclusion') return `${exprToLatex(st.target) ?? st.target} = ${formatExact(st.value).replace(',', '{,}')}`;
  return null;
}

/** Rules that explain a target kind (named only when disclosure allows, §10.8.4). */
function rulesForNode(n: ReasoningNode, v: ValidationResult): string[] {
  if (v.ruleIds?.length) return v.ruleIds.filter((r) => RULES[r]);
  const st = n.interpretation.normalized;
  const t = st && (st.kind === 'equation' || st.kind === 'conclusion') ? st.target : st?.kind === 'scaling' ? st.claim.symbol : null;
  if (!t) return [];
  const k = kindOf(t);
  return k === 'r' || k === 'd' ? ['R-D'] : k === 'A' ? ['R-A'] : k === 'V' ? ['R-V1'] : t === 'kA' ? ['R-KA'] : t === 'kV' ? ['R-KV'] : [];
}

function primaryRule(ids: string[]): string | null {
  return ids.find((r) => !['R-RATIO', 'R-FIX', 'R-REL'].includes(r)) ?? ids[0] ?? null;
}

function sourcePhrase(ctx: ExplainContext, n: ReasoningNode): string[] {
  const g = ctx.graph;
  const out: string[] = [];
  for (const d of n.dependsOn) {
    if (d.depth === 'indirect' || d.via === 'explicit_reference') continue;
    if (isLearner(d.nodeId)) out.push(`${d.symbol ? displaySymbol(d.symbol) : 'kết quả'} ở bước ${rowOf(g, d.nodeId)}`);
    else if (d.nodeId.startsWith('g:')) out.push(`${displaySymbol(d.nodeId.slice(2))} của đề`);
    else if (d.origin !== 'justification') out.push(d.nodeId.startsWith('rel:') ? `quan hệ ${problemNodeLabel(ctx.spec, d.nodeId)}` : `điều kiện “${problemNodeLabel(ctx.spec, d.nodeId)}”`);
  }
  return [...new Set(out)];
}

function questionFor(code: string, n: ReasoningNode, roots: string): string {
  const t = D0_QUESTIONS[code] ?? D0_QUESTIONS.wrong_value;
  return t.split('{row}').join(String(n.rowIndex)).split('{root}').join(roots || String(n.rowIndex));
}

// ------------------------------------------------------------------ node explanation

interface Draft {
  kind: ExplanationKind;
  short: string;
  detailed: string | null;
  why: string;
  prompt: string | null;
  templateId: string;
  shownRules: string[];
}

function draftFor(ctx: ExplainContext, n: ReasoningNode, v: ValidationResult, level: DisclosureLevel): Draft {
  const g = ctx.graph;
  const sem = n.interpretation.semanticType;
  const st = n.interpretation.normalized;
  const reasons = v.reasonCodes;
  const rules = rulesForNode(n, v);
  const sources = sourcePhrase(ctx, n);
  const hyp = sem === 'hypothesis' || !!n.keptAsHypothesis;

  if (sem === 'question') {
    return { kind: 'question_note', short: 'Câu hỏi của em — xem trả lời của Coach.', detailed: null, why: WHY.question, prompt: null, templateId: 'XT-QUESTION', shownRules: [] };
  }

  if (v.status === 'ambiguous') {
    const conflict = reasons.find((r) => r.startsWith('conflict_with:'));
    const short = conflict
      ? `Bước này cho một giá trị khác bước ${rowOf(g, conflict.slice('conflict_with:'.length))} — em chọn giữ bước nào?`
      : reasons.includes('cyclic_reference')
        ? 'Bước này tham chiếu tới một bước lại dựa vào chính nó — em sửa lại tham chiếu nhé.'
        : reasons.includes('rejected_by_learner')
          ? 'Em đã bác cách hiểu này — em viết lại dòng này nhé.'
          : n.interpretation.ambiguities[0]?.question ?? 'Hệ thống chưa hiểu chắc dòng này — em làm rõ nhé.';
    return { kind: 'clarification', short, detailed: null, why: WHY.ambiguous, prompt: null, templateId: conflict ? 'XT-AMB-CONFLICT' : 'XT-AMB', shownRules: [] };
  }

  if (v.status === 'unverified') {
    const r = reasons.find((x) => REASON_SHORT[x]) ?? 'outside_grammar';
    return { kind: 'limit', short: `Hệ thống chưa kiểm tra được: ${REASON_SHORT[r]}.`, detailed: null, why: WHY.unverified, prompt: null, templateId: `XT-UNVERIFIED-${r}`, shownRules: [] };
  }

  if (v.status === 'valid') {
    if (st?.kind === 'observation') {
      const setting = st.setting ? `${displaySymbol(st.setting.symbol[0])} = ${formatExact(st.setting.value)}` : 'tham số em chọn';
      return { kind: 'observation_note', short: `Em đọc đúng giá trị trên mô hình tại ${setting}.`, detailed: null, why: WHY.observation, prompt: null, templateId: 'XT-OBS-VALID', shownRules: [] };
    }
    if (st?.kind === 'strategy') return { kind: 'plan_note', short: 'Kế hoạch dẫn tới đại lượng cần tìm.', detailed: null, why: WHY.plan, prompt: null, templateId: 'XT-PLAN-VALID', shownRules: [] };
    if (st?.kind === 'justification') return { kind: 'confirmation', short: 'Lý do khớp điều kiện của đề.', detailed: null, why: WHY.valid, prompt: null, templateId: 'XT-JUST-VALID', shownRules: rules };
    // A ratio computed directly from X₂ and X₁ is explained as a ratio, not by the scaling law.
    const directSyms = n.dependsOn.filter((d) => d.depth === 'direct' && d.symbol).map((d) => d.symbol!);
    const target = v.producedSymbol;
    const ratioKind = target?.startsWith('k') ? target[1] : null;
    const isRatio = !!ratioKind && ((directSyms.includes(`${ratioKind}2` as SymbolId) && directSyms.includes(`${ratioKind}1` as SymbolId)) || (st?.kind === 'equation' && st.chain[0]?.includes('/')));
    const rule = isRatio ? 'R-RATIO' : primaryRule(rules);
    const conditionSources = n.dependsOn.filter((d) => d.depth === 'direct' && d.origin !== 'justification' && (d.nodeId.startsWith('c:') || d.nodeId.startsWith('rel:')));
    let short: string;
    if (isRatio) short = `Hệ số = ${displaySymbol(`${ratioKind}2`)} : ${displaySymbol(`${ratioKind}1`)} với ${sources.join(', ')}.`;
    else if ((rule === 'R-REL' || rule === 'R-FIX') && (conditionSources.length || n.interpretation.justification)) {
      const cond = conditionSources.map((d) => problemNodeLabel(ctx.spec, d.nodeId)).join('; ') || n.interpretation.justification?.text || '';
      const rest = sources.filter((x) => !x.startsWith('quan hệ') && !x.startsWith('điều kiện'));
      short = `${rule === 'R-REL' ? 'Theo quan hệ trong đề' : 'Theo điều kiện của đề'} (${cond})${rest.length ? `, dùng ${rest.join(', ')}` : ''}.`;
    } else {
      const lead = rule ? RULE_SHORT[rule] ?? RULES[rule]?.name : 'Khớp với dữ kiện của đề';
      short = sources.length ? `${lead} với ${sources.join(', ')}.` : `${lead}.`;
    }
    const chain = st?.kind === 'equation' ? `${st.target ? displaySymbol(st.target) + ' = ' : ''}${st.chain.map((c) => displayExpr(c.replace(/^~/, ''))).join(' = ')}` : n.interpretation.displayText;
    const detailed = [
      `Em viết: ${chain}.`,
      rule ? `Quy tắc: ${RULE_SHORT[rule] ?? RULES[rule]?.name ?? rule}.` : null,
      'Các phép tính đã được kiểm tra chính xác' + (v.checks.units === 'ok' ? '; đơn vị đúng.' : '.'),
      n.interpretation.justification && !n.interpretation.justification.vague ? `Lý do em nêu: “${n.interpretation.justification.text}” — khớp điều kiện của đề.` : null,
    ].filter(Boolean).join(' ');
    const isUnknown = !!v.producedSymbol && ctx.spec.unknowns.some((u) => u.symbol === v.producedSymbol);
    return {
      kind: 'confirmation', short, detailed, why: WHY.valid,
      prompt: isUnknown && sem === 'conclusion' && ctx.phase === 'reasoning' ? 'Em có thể bấm “Tự kiểm tra” để làm một bài tương tự.' : null,
      templateId: hyp ? 'XT-VALID-HYP' : 'XT-VALID', shownRules: rules,
    };
  }

  const directInvalid = n.dependsOn.filter((d) => isLearner(d.nodeId) && d.depth === 'direct' && g.nodes[d.nodeId]?.validation?.status === 'invalid').map((d) => d.nodeId);
  const rootIds = v.rootCauseNodeIds;

  if (v.status === 'invalid' && reasons.includes('premise_changed')) {
    const broken = n.dependsOn.filter((d) => d.broken).map((d) => d.nodeId);
    const b = broken[0];
    const bn = b ? g.nodes[b] : undefined;
    const newVal = bn?.validation?.status === 'valid' && bn.validation.producedSymbol ? ` (${displaySymbol(bn.validation.producedSymbol)} = ${valueOf(bn)})` : '';
    const first = st?.kind === 'equation' ? displayExpr(st.chain[0] ?? '') : '';
    return {
      kind: 'stale_premise',
      short: broken.length ? `Bước ${rows(g, broken)} đã đổi${broken.length === 1 ? newVal : ''}; bước này vẫn dùng số cũ.` : 'Một bước trước đã đổi; bước này vẫn dùng số cũ.',
      detailed: first ? `Số em đã thay: ${first}.` : null,
      why: WHY.stale,
      prompt: `Em cập nhật lại bước ${n.rowIndex} nhé?`,
      templateId: 'XT-STALE-PREMISE', shownRules: level >= 2 ? rules : [],
    };
  }

  if (v.status === 'invalid' && v.checks.inference === 'follows' && rootIds.length) {
    const src = directInvalid.length ? directInvalid : rootIds;
    return {
      kind: 'inherited_issue',
      short: `Tính đúng từ bước ${rows(g, src)}, nhưng bước ${rows(g, rootIds)} chưa khớp đề.`,
      detailed: null, why: WHY.inherited,
      prompt: `Em xem lại bước ${rows(g, rootIds)} trước nhé?`,
      templateId: 'XT-INVALID-INHERITED', shownRules: level >= 2 ? rules : [],
    };
  }

  if (v.status === 'insufficient_evidence') {
    if (reasons.includes('depends_on_invalid')) {
      const srcs = n.dependsOn.filter((d) => isLearner(d.nodeId) && g.nodes[d.nodeId]?.validation?.status === 'invalid' && d.depth === 'direct').map((d) => d.nodeId).sort((x, y) => g.nodes[x].rowIndex - g.nodes[y].rowIndex);
      const list = srcs.map((id) => `${rowOf(g, id)}${g.nodes[id]?.validation?.reasonCodes.includes('premise_changed') ? ' (dùng số cũ)' : ''}`).join(', ');
      const rootsText = rootIds.length && rows(g, rootIds) !== rows(g, srcs) ? ` (gốc: bước ${rows(g, rootIds)})` : '';
      return {
        kind: 'inherited_issue',
        short: `Kết quả của em ${v.checks.groundTruth === 'true' ? 'khớp đề' : 'chưa kết luận được'}, nhưng dựa trên bước ${list || rows(g, rootIds)} chưa khớp${rootsText}.`,
        detailed: null, why: WHY.insufficient_invalid,
        prompt: rootIds.length ? `Em xem lại bước ${rows(g, rootIds)} nhé?` : null,
        templateId: 'XT-INSUFF-DEPENDS-INVALID', shownRules: [],
      };
    }
    const retracted = learnerNodes(g).filter((x) => x.lifecycle === 'retracted' && x.validation?.producedSymbol && st?.kind === 'equation' && st.chain.some((c) => c.includes(x.validation!.producedSymbol!)));
    const short = reasons.includes('vague_justification')
      ? 'Lý do chưa nêu điều kiện cụ thể của đề — điều kiện nào giúp em?'
      : reasons.includes('plan_missing_step')
        ? 'Kế hoạch còn thiếu một bước — em cần tìm đại lượng nào trước?'
        : reasons.includes('depends_on_ambiguous')
          ? 'Bước này dựa trên một bước cần làm rõ.'
          : reasons.includes('depends_on_insufficient')
            ? 'Bước này dựa trên một bước còn thiếu cơ sở.'
            : retracted.length
              ? `Tiền đề ở bước ${rows(g, retracted.map((x) => x.id))} đã được rút — em dựa vào đâu?`
              : 'Chưa có bước nào dẫn tới kết quả này — em dựa vào đâu?';
    return {
      kind: 'support_missing', short, why: WHY.insufficient_missing, prompt: null,
      detailed: escalation(ctx, n, level, rules, 'missing'),
      templateId: 'XT-INSUFF-MISSING', shownRules: level >= 2 ? rules : [],
    };
  }

  // Root invalid node (or hypothesis): neutral check prompt at D0, more only as disclosure allows.
  const main = reasons.find((r) => CHECK_ASPECT[r]) ?? 'wrong_value';
  const aspect = CHECK_ASPECT[main];
  const code = v.possibleMisconceptions[0]?.code ?? main;
  const why = main === 'scaling_claim_false' ? (level >= 2 ? WHY.invalid_scaling.replace(/ \(Công thức.*$/, '') : WHY.invalid_scaling) : main === 'arithmetic_error' ? WHY.invalid_arith : main === 'unit_error' ? WHY.invalid_unit : main === 'wrong_formula' ? WHY.invalid_formula : main === 'false_justification' ? WHY.invalid_justification : WHY.invalid_exact;
  if (n.revisedBy.length) {
    const fixer = g.nodes[n.revisedBy[0]];
    const found = fixer?.validation?.status === 'valid' && fixer.validation.producedSymbol && fixer.validation.claimedValue
      ? `Ở bước ${rowOf(g, fixer.id)} em tìm được ${displaySymbol(fixer.validation.producedSymbol)} = ${formatExact(fixer.validation.claimedValue)}.`
      : null;
    return {
      kind: hyp ? 'hypothesis_note' : 'check_prompt',
      short: `${hyp ? 'Dự đoán ban đầu' : 'Bước ban đầu'} của em; em đã sửa ở bước ${rows(g, n.revisedBy)}.`,
      detailed: found, why, prompt: null, templateId: 'XT-INVALID-REVISED', shownRules: level >= 2 ? rules : [],
    };
  }
  return {
    kind: hyp ? 'hypothesis_note' : 'check_prompt',
    short: hyp ? `Dự đoán của em chưa khớp khi hệ thống kiểm tra. Cần kiểm tra: ${aspect}.` : `Bước này chưa khớp. Cần kiểm tra: ${aspect}.`,
    detailed: escalation(ctx, n, level, rules, code),
    why,
    prompt: questionFor(code, n, rows(g, rootIds)),
    templateId: `XT-INVALID-ROOT-D${level}`,
    shownRules: level >= 2 ? rules : [],
  };
}

/** Details allowed by the disclosure level (D1 pointer, D2 rule, D3 example, D4 unevaluated step). */
function escalation(ctx: ExplainContext, n: ReasoningNode, level: DisclosureLevel, rules: string[], code: string): string | null {
  if (level < 1) return null;
  const parts: string[] = [];
  const spec = ctx.spec;
  const d = spec.givens.find((x) => x.symbol.startsWith('d') && x.sourceSpan);
  if (code === 'radius_diameter' && d?.sourceSpan) parts.push(`Xem cụm từ “${spec.text.slice(d.sourceSpan.start, d.sourceSpan.end)}” trong đề.`);
  else {
    const givens = spec.givens.map((x) => `${displaySymbol(x.symbol)} = ${formatExact(x.value)}${x.unit ? ' ' + x.unit : ''}`).join('; ');
    const conds = spec.constraints.map((c) => `${KIND_WORD[c.symbols[0][0]]} giữ nguyên`).join('; ');
    parts.push(`Xem lại dữ kiện của đề: ${givens}${conds ? '; ' + conds : ''}.`);
  }
  if (level >= 2 && rules.length) parts.push(`Quy tắc liên quan: ${rules.map((r) => RULES[r]?.name ?? r).join('; ')}.`);
  if (level >= 3) parts.push(exampleD3(code, explanationForbidden(ctx)));
  if (level >= 4) parts.push(stepD4(code, spec));
  void n;
  return parts.join(' ');
}

/** Compact labels retain their full approved content in the detailed explanation. */
function compactText(text: string, max: number): string {
  if (text.length <= max) return text;
  const prefix = text.slice(0, max - 1);
  const boundary = prefix.lastIndexOf(' ');
  return (boundary > 0 ? prefix.slice(0, boundary) : prefix) + '…';
}

export function buildGraphExplanation(ctx: ExplainContext, n: ReasoningNode, forbidden: ForbiddenValue[]): ExplanationViewModel | null {
  const v = n.validation;
  if (!v) return null;
  const level = ctx.graph.graphId === 'independent' ? 0 : allowedLevel(ctx.disclosure, n.id);
  const d = draftFor(ctx, n, v, level);
  const neutral = 'Bước này cần được kiểm tra lại.';
  const short = safe(d.short, forbidden, neutral);
  const detailed = d.detailed ? safe(d.detailed, forbidden, '') : { text: '', ok: true };
  const why = safe(d.why, forbidden, WHY.invalid_exact);
  const prompt = d.prompt ? safe(d.prompt, forbidden, '') : { text: '', ok: true };
  const leaked = !short.ok || !detailed.ok || !why.ok || !prompt.ok;
  return {
    explanationId: `${n.id}@r${n.revision}@v${ctx.graph.version}@D${level}`,
    nodeId: n.id,
    nodeRevision: n.revision,
    graphVersion: ctx.graph.version,
    disclosureLevel: level,
    kind: d.kind,
    explanationShort: compactText(short.text, 120),
    explanationDetailed: short.text.length > 120 ? [short.text, detailed.text].filter(Boolean).join(' ') : detailed.text || null,
    whyStatus: why.text,
    prompt: prompt.text || null,
    evidence: {
      reasonCodes: v.reasonCodes,
      ruleIds: d.shownRules,
      factIds: v.facts.filter((f) => f.disclosable).map((f) => f.id),
      sourceNodeIds: n.dependsOn.filter((x) => x.depth !== 'indirect').map((x) => x.nodeId),
    },
    templateId: leaked ? `${d.templateId}-SAFE` : d.templateId,
    source: 'deterministic_template',
    leakChecked: true,
  };
}

// ------------------------------------------------------------------ edges (§9.9)

function edgeView(ctx: ExplainContext, e: Omit<GraphEdgeViewModel, 'graphVersion' | 'sourceEpistemic' | 'edgeId'>): GraphEdgeViewModel {
  const src = ctx.graph.nodes[e.from];
  return { ...e, edgeId: `${e.from}->${e.to}:${e.relation}`, graphVersion: ctx.graph.version, sourceEpistemic: src ? epistemicOf(src) : 'problem_given' };
}

export function explainEdges(ctx: ExplainContext, forbidden: ForbiddenValue[], neutral: boolean): GraphEdgeViewModel[] {
  const g = ctx.graph;
  const spec = ctx.spec;
  const out: GraphEdgeViewModel[] = [];
  const unsettled = (id: string) => {
    const n = g.nodes[id];
    return !!n && (n.validation?.status === 'ambiguous' || n.interpretation.status === 'rejected_by_learner');
  };
  const push = (e: Omit<GraphEdgeViewModel, 'graphVersion' | 'sourceEpistemic' | 'edgeId'>) => {
    const label = safe(e.labelShort, forbidden, '');
    const expl = safe(e.explanation, forbidden, 'Liên kết giữa hai bước.');
    out.push(edgeView(ctx, { ...e, labelShort: compactText(label.ok ? e.labelShort : e.relation === 'depends_on' ? 'dùng kết quả' : 'liên kết', 40), explanation: expl.text }));
  };

  for (const edge of g.edges) {
    const from = g.nodes[edge.from];
    const to = g.nodes[edge.to];
    if (!from || !to || from.lifecycle === 'retracted' || to.lifecycle === 'retracted') continue;
    const toRow = rowOf(g, to.id);
    if (neutral) {
      out.push(edgeView(ctx, { from: edge.from, to: edge.to, relation: edge.kind === 'revised_by' ? 'corrects' : edge.kind === 'justifies' ? 'supports' : edge.kind === 'tests' ? 'tests' : edge.kind === 'implements' ? 'implements' : 'depends_on', storedKind: edge.kind, ruleIds: [], status: 'established', depth: 'direct', labelShort: '', explanation: 'Liên kết giữa hai bước (chưa đánh giá).' }));
      continue;
    }
    if (edge.kind === 'depends_on') {
      const dep = to.dependsOn.find((d) => d.nodeId === edge.from);
      if (!dep) continue;
      const provisional = dep.via === 'llm_suggested' || unsettled(edge.from) || unsettled(edge.to);
      const status: GraphEdgeViewModel['status'] = dep.broken ? 'broken' : provisional ? 'provisional' : 'established';
      const sym = dep.symbol;
      let labelShort = '';
      let explanation = '';
      let relation: GraphEdgeViewModel['relation'] = dep.origin === 'justification' ? 'supports' : 'depends_on';
      if (dep.via === 'explicit_reference') {
        labelShort = `em nhắc tới bước ${rowOf(g, from.id)}`;
        explanation = `Bước ${toRow} nhắc tới bước ${rowOf(g, from.id)}; đây là tham chiếu em viết, không phải tiền đề tính toán.`;
      } else if (isLearner(edge.from)) {
        const val = valueOf(from, sym);
        const srcOk = from.validation?.status === 'valid';
        const kindWord = sym ? KIND_WORD[kindOf(sym)] ?? '' : 'kết quả';
        labelShort = `dùng ${sym ? displaySymbol(sym) : 'kết quả'}${val ? ` = ${val}` : ''} (bước ${rowOf(g, from.id)})`;
        explanation = `Bước ${toRow} sử dụng ${kindWord}${sym ? ' ' + displaySymbol(sym) : ''} em viết ở bước ${rowOf(g, from.id)}${val ? ` (${displaySymbol(sym!)} = ${val})` : ''}${srcOk ? '.' : ` — bước ${rowOf(g, from.id)} ${from.validation?.status === 'invalid' ? 'chưa khớp đề' : 'chưa được xác nhận'}.`}`;
        if (dep.broken) {
          labelShort = `bước ${rowOf(g, from.id)} đã đổi; vẫn dùng số cũ`;
          explanation = `Bước ${rowOf(g, from.id)} đã được sửa${val ? ` (nay ${displaySymbol(sym!)} = ${val})` : ''}, nhưng bước ${toRow} vẫn dùng số của phiên bản cũ.`;
        }
      } else if (edge.from.startsWith('g:')) {
        const gv = spec.givens.find((x) => x.symbol === edge.from.slice(2));
        labelShort = `dữ kiện ${displaySymbol(edge.from.slice(2))}${gv ? ` = ${formatExact(gv.value)}${unitOfGiven(spec, gv.symbol)}` : ''}`;
        explanation = `Bước ${toRow} dùng ${labelShort} của đề.`;
      } else {
        const label = problemNodeLabel(spec, edge.from);
        const isRel = edge.from.startsWith('rel:');
        if (relation === 'supports') {
          labelShort = `lý do: ${label}`;
          explanation = `Em nêu lý do “${label}” ở bước ${toRow}; lý do này khớp ${isRel ? 'quan hệ' : 'điều kiện'} của đề.`;
        } else {
          labelShort = `${isRel ? 'quan hệ' : 'điều kiện'}: ${label}`;
          explanation = `Bước ${toRow} dùng ${isRel ? 'quan hệ' : 'điều kiện'} của đề: ${label}.`;
        }
      }
      if (status === 'provisional') {
        labelShort = `Chưa xác nhận: ${labelShort}`;
        explanation = `Chưa xác nhận — ${explanation}`;
        relation = relation === 'supports' ? 'supports' : 'depends_on';
      }
      push({ from: edge.from, to: edge.to, relation, storedKind: 'depends_on', via: dep.via, symbol: sym, ruleIds: to.validation?.ruleIds ?? [], status, depth: dep.depth ?? 'direct', labelShort, explanation });
    } else if (edge.kind === 'justifies') {
      push({ from: edge.from, to: edge.to, relation: 'supports', storedKind: 'justifies', ruleIds: [], status: unsettled(edge.from) ? 'provisional' : 'established', depth: 'direct', labelShort: `lý do cho bước ${toRow}`, explanation: `Dòng ${rowOf(g, from.id)} là lý do em đưa ra cho bước ${toRow}.` });
    } else if (edge.kind === 'tests') {
      push({ from: edge.from, to: edge.to, relation: 'tests', storedKind: 'tests', ruleIds: [], status: 'established', depth: 'direct', labelShort: `thử nghiệm kiểm tra bước ${toRow}`, explanation: `Quan sát ở bước ${rowOf(g, from.id)} (trên mô hình) kiểm tra dự đoán ở bước ${toRow}.` });
    } else if (edge.kind === 'revised_by') {
      push({ from: edge.from, to: edge.to, relation: 'corrects', storedKind: 'revised_by', ruleIds: [], status: 'established', depth: 'direct', labelShort: `bước ${toRow} sửa bước ${rowOf(g, from.id)}`, explanation: `Em đã đánh dấu bước ${toRow} là bản sửa của bước ${rowOf(g, from.id)}; bước ${rowOf(g, from.id)} vẫn được giữ nguyên văn.` });
    } else if (edge.kind === 'implements') {
      push({ from: edge.from, to: edge.to, relation: 'implements', storedKind: 'implements', ruleIds: [], status: 'established', depth: 'direct', labelShort: `thực hiện kế hoạch (bước ${rowOf(g, from.id)})`, explanation: `Bước ${toRow} thực hiện một bước trong kế hoạch ở bước ${rowOf(g, from.id)}.` });
    }
  }
  if (neutral) return out;

  // Derived, provisional relations (never stored): unresolved RG-C2 conflicts and rejected cyclic references.
  for (const n of learnerNodes(g)) {
    if (n.lifecycle !== 'active' || !n.validation) continue;
    const conflict = n.validation.reasonCodes.find((r) => r.startsWith('conflict_with:'));
    if (conflict) {
      const other = conflict.slice('conflict_with:'.length);
      const st = n.interpretation.normalized;
      const sym = st && (st.kind === 'equation' || st.kind === 'conclusion') ? st.target ?? undefined : undefined;
      if (g.nodes[other]) push({ from: other, to: n.id, relation: 'contradicts', storedKind: 'derived_conflict', symbol: sym, ruleIds: [], status: 'provisional', depth: 'direct', labelShort: `Chưa xác nhận: hai giá trị cho ${sym ? displaySymbol(sym) : 'một đại lượng'}`, explanation: `Bước ${rowOf(g, n.id)} cho ${sym ? displaySymbol(sym) : 'đại lượng này'} một giá trị khác bước ${rowOf(g, other)}. Em chọn thay thế hoặc giữ cả hai.` });
    }
    if (n.validation.reasonCodes.includes('cyclic_reference')) {
      for (const ref of n.interpretation.explicitRefs) {
        const target = learnerNodes(g).find((x) => x.rowIndex === ref && x.lifecycle === 'active');
        if (target && target.id !== n.id) push({ from: target.id, to: n.id, relation: 'depends_on', storedKind: 'rejected_reference', via: 'explicit_reference', ruleIds: [], status: 'provisional', depth: 'direct', labelShort: `Chưa xác nhận: tham chiếu vòng tới bước ${ref}`, explanation: `Chưa xác nhận — bước ${rowOf(g, n.id)} nhắc tới bước ${ref}, nhưng bước ${ref} lại dựa vào bước ${rowOf(g, n.id)}.` });
      }
    }
  }
  return out;
}

// ------------------------------------------------------------------ graph view model

function learnerTextOf(spec: ProblemSpec, n: ReasoningNode): string {
  if (n.source !== 'problem') return n.originalText;
  const [kind, key] = n.id.split(':');
  const span =
    kind === 'g' ? spec.givens.find((x) => x.symbol === key)?.sourceSpan :
    kind === 'c' ? spec.constraints.find((x) => x.id === key)?.sourceSpan :
    kind === 'rel' ? spec.relations.find((x) => x.id === key)?.sourceSpan :
    kind === 'u' ? spec.unknowns.find((x) => x.symbol === key)?.sourceSpan : null;
  return span ? spec.text.slice(span.start, span.end) : n.originalText;
}

export function buildGraphViewModel(ctx: ExplainContext): GraphViewModel {
  const g = ctx.graph;
  const neutral = g.graphId === 'independent' && !ctx.submitted;
  const forbidden = explanationForbidden(ctx);
  const edges = explainEdges(ctx, forbidden, neutral);
  const stale = new Set(ctx.staleIds ?? []);
  const nodes: GraphNodeViewModel[] = [];
  for (const n of Object.values(g.nodes)) {
    if (n.lifecycle === 'retracted') continue;
    const problem = n.source === 'problem';
    const v = n.validation;
    const incoming = edges.filter((e) => e.to === n.id);
    const status: GraphNodeViewModel['validationStatus'] = problem ? 'given' : neutral ? 'hidden' : stale.has(n.id) ? 'stale' : v?.status ?? 'unverified';
    const explanation = problem || neutral || stale.has(n.id) ? null : buildGraphExplanation(ctx, n, forbidden);
    const unavailable: GraphNodeViewModel['unavailableReason'] = problem ? 'problem_node' : neutral ? 'independent_hidden' : stale.has(n.id) ? 'pending_revalidation' : explanation ? null : 'no_template';
    const badge = STATUS_BADGE[status] ?? STATUS_BADGE.unverified;
    const extra = !problem && !neutral && v ? [n.interpretation.semanticType === 'hypothesis' ? 'giả thuyết' : null, n.revisedBy.length ? `đã được em sửa ở bước ${rows(g, n.revisedBy)}` : null].filter(Boolean) : [];
    const summaryRaw = problem ? WHY.given : neutral ? WHY.hidden : `${badge.label}${extra.length ? ' · ' + extra.join(' · ') : ''}${explanation ? ' — ' + explanation.explanationShort : ''}`;
    nodes.push({
      nodeId: n.id,
      nodeRevision: n.revision,
      graphVersion: g.version,
      row: problem ? null : n.rowIndex,
      learnerText: learnerTextOf(ctx.spec, n),
      interpretedMeaning: problem ? problemNodeLabel(ctx.spec, n.id) : n.interpretation.displayText,
      interpretationProvenance: problem ? 'problem_given' : n.interpretation.provenance,
      validationStatus: status,
      statusBadge: badge,
      validationSummary: summaryRaw.length > 90 ? summaryRaw.slice(0, 89) + '…' : summaryRaw,
      explanation,
      unavailableReason: unavailable,
      relevantRuleIds: explanation?.evidence.ruleIds ?? [],
      sourceNodeIds: incoming.filter((e) => e.status !== 'provisional' && e.depth === 'direct').map((e) => e.from),
      indirectSourceNodeIds: incoming.filter((e) => e.depth === 'indirect').map((e) => e.from),
      provisionalSourceNodeIds: incoming.filter((e) => e.status === 'provisional').map((e) => e.from),
      affectedNodeIds: problem ? [] : transitiveDependents(g, n.id),
      linkedElementIds: [],
      disclosureLevel: (g.graphId === 'independent' ? 0 : allowedLevel(ctx.disclosure, n.id)) as DisclosureLevel,
      provenance: n.provenance,
      epistemic: neutral && !problem ? 'learner_unverified' : epistemicOf(n),
      notation: problem || neutral ? null : notationOf(n),
      possibleMisconceptions: neutral ? [] : v?.possibleMisconceptions.map((m) => m.code) ?? [],
      revisionCount: n.history.length,
      semanticType: n.interpretation.semanticType,
      isHypothesis: n.interpretation.semanticType === 'hypothesis' || !!n.keptAsHypothesis,
      revisedByRows: n.revisedBy.map((id) => g.nodes[id]?.rowIndex ?? 0),
    });
  }
  nodes.sort((a, b) => (a.row ?? -1) - (b.row ?? -1));
  // Edges only carry the rules their target node is allowed to show (D0–D4).
  const shown = new Map(nodes.map((n) => [n.nodeId, n.relevantRuleIds]));
  for (const e of edges) e.ruleIds = shown.get(e.to) ?? [];
  return { graphVersion: g.version, neutral, nodes, edges };
}

/** Every text of a view model (for leak/traceability tests and spec validation). */
export function viewModelTexts(vm: Pick<GraphViewModel, 'nodes' | 'edges'>): string[] {
  const out: string[] = [];
  for (const n of vm.nodes) {
    if (n.row === null) continue;
    out.push(n.validationSummary);
    const e = n.explanation;
    if (e) out.push(e.explanationShort, e.explanationDetailed ?? '', e.whyStatus, e.prompt ?? '');
  }
  for (const e of vm.edges) out.push(e.labelShort, e.explanation);
  return out.filter(Boolean);
}

export { LEVEL_TEXT };
