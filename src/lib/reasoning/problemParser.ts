/**
 * F1 — deterministic problem interpretation (§7.1, §8.3). Produces a draft
 * ProblemSpec whose every given is grounded in a source span of the problem text.
 * The same assembly path is used for LLM-proposed mentions (after grounding) and
 * for the structured learner form (fallback).
 */
import { exact, formatExact, isPositive, mul, sqrt, div, PI } from './exact.ts';
import { missingBases, solveProblem } from './facts.ts';
import {
  NUM, OBJECT_NOUN, factorWord, findKinds, fractionWord, indexCue, kindAfter, kindBefore, numValue, fold,
} from './lexicon.ts';
import { sym, factorSymbol } from './rules.ts';
import type {
  Constraint, CylIndex, ExactValue, Given, Kind, ProblemClarification, ProblemSpec, Relation, Span, SymbolId, Unit, Unknown,
} from './types.ts';
import { LIMITS } from './types.ts';

export type Mention =
  | { type: 'given'; k: Kind; index: CylIndex | null; value: ExactValue; unit: Unit | null; span: Span; piValue?: boolean }
  | { type: 'relation'; k: Kind; op: 'mul' | 'add'; value: ExactValue; span: Span; phrase: string }
  | { type: 'constraint'; k: Kind; span: Span }
  | { type: 'unknown'; symbol: SymbolId; span: Span; askedAs: string }
  | { type: 'ambiguous'; code: string; question: string; span: Span; options: ProblemClarification['options'] };

const UNIT_RE = String.raw`(mm|cm|dm|m)(?:\^?([23])|([²³]))?(?!\p{L})`;

// ------------------------------------------------------------------ unsupported / scope checks

export function scopeProblems(text: string): string[] {
  const t = text.toLowerCase();
  const reasons: string[] = [];
  const shapes: [RegExp, string][] = [
    [/hình\s+nón|khối\s+nón|(?<!\p{L})nón(?!\p{L})/u, 'shape:cone'],
    [/cầu(?!\s+thang)/u, 'shape:sphere'],
    [/lăng\s+trụ/u, 'shape:prism'],
    [/hình\s+hộp|lập\s+phương/u, 'shape:box'],
    [/chóp/u, 'shape:pyramid'],
  ];
  for (const [re, code] of shapes) if (re.test(t)) reasons.push(code);
  if (!/trụ/u.test(t) && !reasons.length) reasons.push('shape:not_cylinder');
  if (/xung\s+quanh|toàn\s+phần/u.test(t)) reasons.push('quantity:surface_area');
  if (/chu\s+vi/u.test(t)) reasons.push('quantity:perimeter');
  if (/(?<!\p{L})(lít|ml|mi-li-lít)(?!\p{L})/u.test(t)) reasons.push('unit:liter');
  return reasons;
}

// ------------------------------------------------------------------ mention extraction

export function extractMentions(text: string): Mention[] {
  const out: Mention[] = [];
  const kindCount: Partial<Record<string, number>> = {};
  const group = (k: Kind) => (k === 'd' ? 'd' : k);

  // 1) number (+π) + unit, attributed to the nearest preceding kind keyword or "x =".
  const re = new RegExp(String.raw`(?<![\d.,])(${NUM})\s*(π|pi)?\s*${UNIT_RE}`, 'giu');
  for (const m of text.matchAll(re)) {
    const start = m.index!;
    const end = start + m[0].length;
    const before = text.slice(Math.max(0, start - 50), start);
    const symbolAssign = /(?<!\p{L})([rdhSV])\s*[₁₂12]?\s*=\s*$/u.exec(before);
    let hit = kindBefore(text, start);
    let k: Kind | null = hit?.k ?? null;
    if (symbolAssign) k = ({ r: 'r', d: 'd', h: 'h', S: 'A', V: 'V' } as Record<string, Kind>)[symbolAssign[1]];
    if (!k) continue;
    const between = hit ? text.slice(hit.end, start).toLowerCase() : '';
    const unit = m[3] as Unit;
    const value = numValue(m[1]);
    const spanStart = hit && !symbolAssign ? hit.start : start - (symbolAssign ? symbolAssign[0].length : 0);
    const span = { start: Math.min(spanStart, start), end };
    if (hit && /tăng\s+thêm|thêm\s+/u.test(between)) {
      out.push({ type: 'relation', k, op: 'add', value, span, phrase: `${k}2 = ${k}1 + ${formatExact(value)}` });
      continue;
    }
    if (hit && /giảm\s+(đi|bớt)?\s*$/u.test(between.trim() + ' ') && !/còn/u.test(between)) {
      out.push({ type: 'relation', k, op: 'add', value: exact(-value.n, value.d), span, phrase: `${k}2 = ${k}1 − ${formatExact(value)}` });
      continue;
    }
    if (hit && /(tăng|tăng\s+lên)\s*$/u.test(between.trim()) && !/thành|đến|tới/u.test(between)) {
      out.push({
        type: 'ambiguous', code: 'increase_ambiguous', span,
        question: `“${text.slice(span.start, span.end)}”: tăng thêm ${formatExact(value)} ${unit} hay tăng thành ${formatExact(value)} ${unit}?`,
        options: [
          { label: `Tăng thêm ${formatExact(value)} ${unit}`, relation: { expr: `${k}2 = ${k}1 + ${formatExact(value)}`, target: sym(k, 2), source: sym(k, 1), op: 'add', value, sourceSpan: span } },
          { label: `Tăng thành ${formatExact(value)} ${unit}`, given: { symbol: sym(k, 2), value, unit, sourceSpan: span, provenance: 'problem_given' } },
        ],
      });
      kindCount[group(k)] = (kindCount[group(k)] ?? 0) + 1;
      continue;
    }
    const n = (kindCount[group(k)] ?? 0) + 1;
    kindCount[group(k)] = n;
    out.push({ type: 'given', k, index: n > 2 ? null : (n as CylIndex), value: m[2] ? mul(value, PI) : value, unit, span, piValue: !!m[2] });
    hit = null;
  }

  // 2) factor relations: "gấp 3 lần", "bằng một nửa", "tăng 2 lần", "tăng thêm 50%".
  const factorRe = /(?:(?:tăng|giảm)\s+(?:lên\s+)?)?gấp\s+(đôi|ba|bốn|năm|\d+(?:[.,]\d+)?)(?!\p{L}|\d)(?:\s+lần)?|(?:chỉ\s+)?bằng\s+(một\s+nửa|nửa|một\s+phần\s+[\p{L}\d]+|\d+\s*\/\s*\d+)|(tăng|giảm)\s+(\d+(?:[.,]\d+)?)\s+lần|(tăng\s+thêm|giảm)\s+(\d+(?:[.,]\d+)?)\s*%/giu;
  for (const m of text.matchAll(factorRe)) {
    const start = m.index!;
    const end = start + m[0].length;
    const hit = kindBefore(text, start, 45, /[.?!;]|(?<!\p{L})và(?!\p{L})/u);
    if (!hit) continue;
    let value: ExactValue | null = null;
    if (m[1]) value = factorWord(m[1]);
    else if (m[2]) value = fractionWord(m[2]);
    else if (m[3]) value = m[3].toLowerCase() === 'tăng' ? numValue(m[4]) : div(exact(1), numValue(m[4]));
    else if (m[5]) {
      const p = numValue(m[6]);
      value = /tăng/iu.test(m[5]) ? div(exact(p.n + 100 * p.d, p.d), exact(100)) : div(exact(100 * p.d - p.n, p.d), exact(100));
    }
    if (!value) continue;
    out.push({ type: 'relation', k: hit.k, op: 'mul', value, span: { start: hit.start, end }, phrase: m[0] });
  }

  // 3) constraints: "giữ nguyên chiều cao", "chiều cao không đổi", "cùng bán kính đáy", "cùng chiều cao".
  const fixedRe = /giữ\s+nguyên|không\s+(?:thay\s+)?đổi|như\s+nhau|bằng\s+nhau/giu;
  for (const m of text.matchAll(fixedRe)) {
    const after = kindAfter(text, m.index! + m[0].length);
    const before = kindBefore(text, m.index!, 25);
    const dAfter = after ? after.start - (m.index! + m[0].length) : Infinity;
    const dBefore = before ? m.index! - before.end : Infinity;
    const hit = dBefore <= dAfter ? before : after;
    if (hit) out.push({ type: 'constraint', k: hit.k === 'd' ? 'r' : hit.k, span: { start: Math.min(hit.start, m.index!), end: Math.max(hit.end, m.index! + m[0].length) } });
  }
  for (const m of text.matchAll(/cùng\s+(chiều\s+cao|bán\s+kính(?:\s+đáy)?|đường\s+kính(?:\s+đáy)?|đáy)/giu)) {
    const k: Kind = /cao/u.test(m[1]) ? 'h' : 'r';
    out.push({ type: 'constraint', k, span: { start: m.index!, end: m.index! + m[0].length } });
  }

  // 4) unknowns in question sentences.
  const sentences = [...text.matchAll(/[^.?!]+[.?!]?/gu)];
  for (const s of sentences) {
    const sText = s[0];
    const off = s.index!;
    const isQuestion = /\?/.test(sText) || /(?<!\p{L})(tính|tìm|cho\s+biết|hỏi)(?!\p{L})/iu.test(sText);
    if (!isQuestion) continue;
    const ratioRe = /(?:tăng\s+|giảm\s+)?(?:lên\s+)?(?:gấp\s+)?(?:bao\s+nhiêu|mấy)\s+lần|bằng\s+(?:mấy|bao\s+nhiêu)\s+phần/giu;
    for (const m of sText.matchAll(ratioRe)) {
      const hit = kindBefore(sText, m.index!, 60, /[.?!;]/u) ?? findKinds(sText)[0] ?? null;
      const k = hit?.k ?? 'V';
      const fs = factorSymbol(k);
      if (fs) out.push({ type: 'unknown', symbol: fs, span: { start: off + m.index!, end: off + m.index! + m[0].length }, askedAs: m[0] });
    }
    const computeRe = /(?<!\p{L})(tính|tìm)\s+(?:(?:giá\s+trị|độ\s+dài)\s+)?(thể\s+tích|diện\s+tích(?:\s+mặt)?\s+đáy|chiều\s+cao|bán\s+kính(?:\s+đáy)?|đường\s+kính(?:\s+đáy)?)([^,.?!;]*?)(?=\s+và\s|[,.?!;]|$)/giu;
    for (const m of sText.matchAll(computeRe)) {
      const kinds = findKinds(m[2]);
      if (!kinds.length) continue;
      const cue = indexCue(m[3]);
      out.push({ type: 'unknown', symbol: sym(kinds[0].k, cue ?? 1), span: { start: off + m.index!, end: off + m.index! + m[0].length }, askedAs: m[0].trim() });
      // "Tính thể tích lon mới và cho biết …": further kinds after "và" are separate unknowns handled by ratioRe.
    }
  }
  return out;
}

// ------------------------------------------------------------------ assembly

function labels(text: string, two: boolean): ProblemSpec['cylinders'] {
  const find = (re: RegExp) => {
    const m = re.exec(text);
    return m ? { label: m[0].replace(/\s+/g, ' '), labelSpan: { start: m.index, end: m.index + m[0].length } } : null;
  };
  const one = find(new RegExp(String.raw`${OBJECT_NOUN}\s+(?:cũ|ban\s+đầu|thứ\s+nhất)`, 'iu'));
  const second = find(new RegExp(String.raw`${OBJECT_NOUN}\s+(?:mới|thứ\s+hai|khác)`, 'iu'));
  const c1 = { index: 1 as const, label: one?.label ?? (two ? 'Hình ban đầu' : 'Hình trụ'), labelSpan: one?.labelSpan ?? null };
  if (!two) return [c1];
  return [c1, { index: 2 as const, label: second?.label ?? 'Hình sau thay đổi', labelSpan: second?.labelSpan ?? null }];
}

export function assembleSpec(
  text: string,
  mentions: Mention[],
  provenance: ProblemSpec['interpretationProvenance'],
  id = `p-${hash(text)}`,
): ProblemSpec {
  const givens: Given[] = [];
  const relations: Relation[] = [];
  const constraints: Constraint[] = [];
  const unknowns: Unknown[] = [];
  const clarifications: ProblemClarification[] = [];
  const reasons: string[] = [];
  const units = new Set<Unit>();

  for (const m of mentions) {
    if (m.type === 'given') {
      if (m.index === null) {
        reasons.push('too_many_cylinders');
        continue;
      }
      const s = sym(m.k, m.index);
      if (givens.some((g) => g.symbol === s)) continue;
      givens.push({ symbol: s, value: m.value, unit: m.unit, sourceSpan: m.span, provenance: 'problem_given' });
      if (m.unit) units.add(m.unit);
    } else if (m.type === 'relation') {
      const target = sym(m.k, 2);
      if (relations.some((r) => r.target === target) || givens.some((g) => g.symbol === target)) continue;
      relations.push({
        id: `rel${relations.length + 1}`,
        expr: m.op === 'mul' ? `${target} = ${formatExact(m.value)}·${sym(m.k, 1)}` : `${target} = ${sym(m.k, 1)} ${m.value.n < 0 ? '−' : '+'} ${formatExact({ ...m.value, n: Math.abs(m.value.n) })}`,
        target, source: sym(m.k, 1), op: m.op, value: m.value, sourceSpan: m.span,
      });
    } else if (m.type === 'constraint') {
      const s1 = sym(m.k, 1);
      if (constraints.some((c) => c.symbols[0] === s1)) continue;
      constraints.push({ id: `c${constraints.length + 1}`, kind: 'fixed', symbols: [s1, sym(m.k, 2)], sourceSpan: m.span });
    } else if (m.type === 'unknown') {
      if (!unknowns.some((u) => u.symbol === m.symbol)) unknowns.push({ symbol: m.symbol, askedAs: m.askedAs, sourceSpan: m.span });
    } else {
      clarifications.push({ id: `q${clarifications.length + 1}`, code: m.code, question: m.question, span: m.span, options: m.options });
    }
  }
  // A relation or constraint about a quantity that is also given for cylinder 2 is redundant; keep the given.
  const two =
    givens.some((g) => g.symbol.endsWith('2')) || relations.length > 0 || constraints.length > 0 ||
    unknowns.some((u) => u.symbol.endsWith('2') || u.symbol.startsWith('k')) || clarifications.length > 0;
  if (units.size > 1) reasons.push('mixed_units');

  const spec: ProblemSpec = {
    id, version: 1, text, domain: 'cylinder_geometry', problemType: 'compute',
    unit: units.size === 1 ? [...units][0] : null,
    cylinders: labels(text, two), givens, relations, constraints, unknowns,
    interpretationStatus: 'draft', statusReasons: reasons, interpretationProvenance: provenance,
    clarifications, confirmedAt: null,
  };
  return finalizeSpec(spec);
}

/** Recomputes problemType and interpretationStatus (after parsing, clarification or edits). */
export function finalizeSpec(input: ProblemSpec): ProblemSpec {
  const spec: ProblemSpec = { ...input, statusReasons: input.statusReasons.filter((r) => !r.startsWith('missing:') && r !== 'irrational_result' && r !== 'non_positive' && r !== 'missing_unknown' && r !== 'value_out_of_range') };
  const reasons = spec.statusReasons;
  const unk = spec.unknowns.map((u) => u.symbol);
  spec.problemType = unk.some((s) => s.startsWith('k'))
    ? 'scaling_ratio'
    : unk.some((s) => /^[rhd]/.test(s)) && spec.givens.some((g) => /^[AV]/.test(g.symbol))
      ? 'inverse'
      : 'compute';

  for (const g of spec.givens) {
    const v = g.value.n / g.value.d;
    if (!isPositive(g.value) || v > 1000 || g.value.d > 100) reasons.push('value_out_of_range');
  }
  const scope = scopeProblems(spec.text).filter((r) => !reasons.includes(r));
  if (spec.interpretationProvenance !== 'learner_form') reasons.push(...scope);

  const hardUnsupported = reasons.some((r) => /^(shape|quantity|unit):|mixed_units|too_many_cylinders|value_out_of_range/.test(r));
  if (hardUnsupported) return { ...spec, interpretationStatus: 'unsupported', statusReasons: [...new Set(reasons)] };
  if (/\d\.\d{3}(?!\d)/.test(spec.text) && !spec.clarifications.some((c) => c.code === 'multiple_readings')) {
    spec.clarifications = [...spec.clarifications, { id: `q${spec.clarifications.length + 1}`, code: 'multiple_readings', question: 'Số có dấu chấm như “1.000” có thể là một nghìn hoặc số thập phân. Em viết lại đề với dấu phẩy thập phân (ví dụ 1,5) nhé.', span: null, options: [] }];
  }
  if (spec.clarifications.length) return { ...spec, interpretationStatus: 'needs_clarification', statusReasons: [...new Set(reasons)] };
  if (!unk.length) return { ...spec, interpretationStatus: 'insufficient', statusReasons: [...new Set([...reasons, 'missing_unknown'])] };

  const facts = solveProblem(spec);
  for (const f of Object.values(facts)) {
    if (f && !isPositive(f.value)) return { ...spec, interpretationStatus: 'unsupported', statusReasons: [...new Set([...reasons, 'non_positive'])] };
  }
  const undetermined = unk.filter((s) => !facts[s]);
  if (undetermined.length) {
    // Inverse radius with an irrational result is outside the POC (E-18).
    if (undetermined.some((s) => s.startsWith('r') || s.startsWith('d')) && irrationalRadius(spec)) {
      return { ...spec, interpretationStatus: 'unsupported', statusReasons: [...new Set([...reasons, 'irrational_result'])] };
    }
    return { ...spec, interpretationStatus: 'insufficient', statusReasons: [...new Set([...reasons, ...missingBases(spec).map((s) => `missing:${s}`)])] };
  }
  return { ...spec, interpretationStatus: spec.confirmedAt ? 'confirmed' : 'draft', statusReasons: [...new Set(reasons)] };
}

function irrationalRadius(spec: ProblemSpec): boolean {
  for (const i of [1, 2] as const) {
    const V = spec.givens.find((g) => g.symbol === `V${i}`);
    const h = spec.givens.find((g) => g.symbol === `h${i}`);
    if (V && h) {
      try {
        sqrt(div(div(V.value, PI), h.value));
      } catch {
        return true;
      }
    }
  }
  return false;
}

export function parseProblem(rawText: string): ProblemSpec {
  const text = rawText.normalize('NFC').trim();
  if (!text || text.length > LIMITS.problemText) {
    return assembleSpec(text.slice(0, LIMITS.problemText), [], 'deterministic_parse');
  }
  return assembleSpec(text, extractMentions(text), 'deterministic_parse');
}

/** True when the deterministic parser found too little to be useful (LLM may help). */
export function needsLLMHelp(spec: ProblemSpec): boolean {
  const scope = spec.statusReasons.some((r) => /^(shape|quantity|unit):|mixed_units/.test(r));
  return !scope && (spec.givens.length === 0 || spec.unknowns.length === 0);
}

// ------------------------------------------------------------------ clarification, learner edits, form

export function applyClarification(spec: ProblemSpec, clarificationId: string, optionIndex: number): ProblemSpec {
  const c = spec.clarifications.find((x) => x.id === clarificationId);
  const opt = c?.options[optionIndex];
  if (!c || !opt) return spec;
  const next: ProblemSpec = { ...spec, clarifications: spec.clarifications.filter((x) => x.id !== clarificationId), version: spec.version + 1 };
  if (opt.relation) next.relations = [...spec.relations, { ...opt.relation, id: `rel${spec.relations.length + 1}` }];
  if (opt.given) next.givens = [...spec.givens, opt.given];
  return finalizeSpec(next);
}

export interface GivenEdit {
  /** Symbol of the draft given being edited. */
  symbol: SymbolId;
  /** New kind chosen by the learner (e.g. 'r' for something the draft read as 'd'). */
  kind: Kind;
  value: ExactValue;
}

export interface Contradiction {
  text: string;
  symbol: SymbolId;
  value: ExactValue;
  sourceSpan: Span | null;
}

/**
 * Confirmation with learner edits (F1). An edit that is grounded in a span of the
 * problem text (same kind keyword + same number) is accepted; one that contradicts
 * the text is kept verbatim as a learner claim (returned as a contradiction) and the
 * text-grounded interpretation stays in the spec. Never silently resolved.
 */
export function confirmProblem(spec: ProblemSpec, edits: GivenEdit[], now = Date.now()): { spec: ProblemSpec; contradictions: Contradiction[]; acceptedEdits: number } {
  let givens = [...spec.givens];
  const contradictions: Contradiction[] = [];
  let acceptedEdits = 0;
  for (const e of edits) {
    const idx = givens.findIndex((g) => g.symbol === e.symbol);
    if (idx < 0) continue;
    const g = givens[idx];
    const newSymbol = sym(e.kind, (Number(g.symbol[1]) || 1) as CylIndex);
    if (newSymbol === g.symbol && e.value.n === g.value.n && e.value.d === g.value.d) continue;
    const span = groundedSpan(spec.text, e.kind, e.value);
    if (span) {
      givens[idx] = { ...g, symbol: newSymbol, value: e.value, sourceSpan: span };
      acceptedEdits++;
    } else {
      contradictions.push({
        text: `${kindWord(e.kind)} ${newSymbol.endsWith('2') ? '(hình 2) ' : ''}= ${formatExact(e.value)}${g.unit ? ' ' + g.unit : ''}`,
        symbol: newSymbol, value: e.value, sourceSpan: g.sourceSpan,
      });
    }
  }
  givens = givens.filter((g, i) => givens.findIndex((x) => x.symbol === g.symbol) === i);
  const next = finalizeSpec({ ...spec, givens, confirmedAt: now });
  return {
    spec: next.interpretationStatus === 'draft' || next.interpretationStatus === 'confirmed' ? { ...next, interpretationStatus: 'confirmed' } : next,
    contradictions,
    acceptedEdits,
  };
}

function kindWord(k: Kind): string {
  return { r: 'Bán kính', d: 'Đường kính', h: 'Chiều cao', A: 'Diện tích đáy', V: 'Thể tích' }[k];
}

/** A span of the text mentioning `kind` with `value` (deterministic grounding for learner edits). */
export function groundedSpan(text: string, kind: Kind, value: ExactValue): Span | null {
  for (const m of extractMentions(text)) {
    if (m.type === 'given' && m.k === kind && m.value.n === value.n && m.value.d === value.d) return m.span;
  }
  return null;
}

export interface ProblemForm {
  text: string;
  unit: Unit;
  twoCylinders: boolean;
  values: Partial<Record<'r1' | 'd1' | 'h1' | 'r2' | 'd2' | 'h2' | 'V1' | 'A1', number>>;
  fixed: ('r' | 'h')[];
  unknown: SymbolId;
}

/** Fallback when the text cannot be interpreted: learner declares the data (provenance learner_form). */
export function buildProblemFromForm(form: ProblemForm): ProblemSpec {
  const givens: Given[] = Object.entries(form.values)
    .filter(([, v]) => typeof v === 'number' && Number.isFinite(v))
    .map(([s, v]) => ({ symbol: s as SymbolId, value: numValue(String(v)), unit: form.unit, sourceSpan: null, provenance: 'learner_form' as const }));
  const constraints: Constraint[] = form.twoCylinders
    ? form.fixed.map((k, i) => ({ id: `c${i + 1}`, kind: 'fixed' as const, symbols: [sym(k, 1), sym(k, 2)] as [SymbolId, SymbolId], sourceSpan: null }))
    : [];
  const spec: ProblemSpec = {
    id: `p-form-${hash(form.text + JSON.stringify(form.values))}`, version: 1, text: form.text.normalize('NFC').trim(),
    domain: 'cylinder_geometry', problemType: 'compute', unit: form.unit,
    cylinders: labels('', form.twoCylinders), givens, relations: [], constraints,
    unknowns: [{ symbol: form.unknown, askedAs: 'khai báo trong biểu mẫu', sourceSpan: null }],
    interpretationStatus: 'draft', statusReasons: [], interpretationProvenance: 'learner_form', clarifications: [], confirmedAt: null,
  };
  return finalizeSpec(spec);
}

export function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** Labels used by the UI and prompts. */
export function symbolLabel(spec: Pick<ProblemSpec, 'cylinders'>, s: SymbolId): string {
  const k = s[0] === 'k' ? null : (s[0] as Kind);
  if (!k) return { kr: 'hệ số bán kính', kh: 'hệ số chiều cao', kA: 'hệ số diện tích đáy', kV: 'hệ số thể tích' }[s as 'kr'] ?? s;
  const c = spec.cylinders.find((x) => x.index === Number(s[1]));
  return `${kindWord(k).toLowerCase()} (${c?.label ?? s})`;
}

export { fold };
