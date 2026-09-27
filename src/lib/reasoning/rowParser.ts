/**
 * Reasoning Parser — deterministic rules (§8.3). Turns one learner row into a
 * MathStatement that keeps the learner's own values (never computes or corrects
 * them). Unrecognised rows are `unparsed`; the orchestrator may then ask the LLM.
 */
import { exact, formatExact, fromDecimal, mul, div, add, PI } from './exact.ts';
import { displayExpr, displaySymbol, parseExpr, symbolsIn, numberTexts, tryEval, type Ast } from './expr.ts';
import { NUMBER_WORDS, findKinds, fold, fractionWord, indexCue, kindBefore } from './lexicon.ts';
import { sym, factorSymbol, KIND_LABEL, constraintGroup } from './rules.ts';
import { symbolsFor } from './facts.ts';
import type {
  Ambiguity, CylIndex, ExactValue, FactorChange, Interpretation, Justification, Kind, MathStatement, ProblemSpec, SemanticType, SymbolId,
} from './types.ts';

export interface RowParse {
  status: Interpretation['status'];
  semanticType: SemanticType;
  normalized: MathStatement | null;
  displayText: string;
  justification: Justification | null;
  explicitRefs: number[];
  ambiguities: Ambiguity[];
  alternatives: Interpretation['alternatives'];
  outOfScope: boolean;
  /** Factor of a percent claim ("tăng 300%") so probes can detect percent_vs_factor. */
  percent?: ExactValue;
  /** Changes were written by the learner (true) or taken from the problem (false). */
  explicitChanges?: boolean;
}

export interface RowContext {
  spec: ProblemSpec;
  experiment: boolean;
}

// ------------------------------------------------------------------ normalisation

const SUBS: Record<string, string> = { '₁': '1', '₂': '2', '²': '^2', '³': '^3' };

export function normalizeMath(raw: string): string {
  let s = raw.normalize('NFC');
  s = s.replace(/[₁₂²³]/g, (c) => SUBS[c]);
  s = s.replace(/(?<!\p{L})pi(?!\p{L})/giu, 'π').replace(/(\d)pi(?!\p{L})/giu, '$1π');
  // "≈" keeps an approximation marker: "90π ≈ 283" → "90π =~283".
  s = s.replace(/[×·∙⋅*]/g, '*').replace(/÷/g, '/').replace(/\s*(?:≈|~)\s*/g, ' =~');
  s = s.replace(/(\d),(\d)/g, '$1.$2');
  // "9π.12", "(…).(…)": a dot after π/")" or before "(" is multiplication; between digits it stays a decimal point.
  s = s.replace(/(?<=[π)])\s*\.\s*(?=[\d(π])/g, '*').replace(/(?<=\d)\s*\.\s*(?=[(π])/g, '*');
  // ":" between math terms is division.
  s = s.replace(/(?<=[\dπ)\p{L}₁₂12])\s*:\s*(?=[\d(πrdhAVS])/gu, '/');
  s = s.replace(/(?<!\p{L})S(?=\s*[12=\s(]|_?đ)/gu, 'A').replace(/A_?đ(?!\p{L})/gu, 'A');
  s = s.replace(/r_(?=[12])|h_(?=[12])|V_(?=[12])|A_(?=[12])|d_(?=[12])/g, (m) => m[0]);
  return s;
}

const UNIT_RE = /(?<![\p{L}])(mm|cm|dm|m)(\^[23])?(?!\p{L})/gu;

interface Run {
  text: string;
  start: number;
  end: number;
  unit: string | null;
}

/** Maximal runs of math tokens (numbers, π, symbols, operators); words break a run. */
export function mathRuns(m: string): Run[] {
  const units: { start: number; end: number; unit: string }[] = [];
  const stripped = m.replace(UNIT_RE, (u, base: string, p: string | undefined, off: number) => {
    units.push({ start: off, end: off + u.length, unit: base + (p === '^2' ? '²' : p === '^3' ? '³' : '') });
    return ' '.repeat(u.length);
  });
  // Letter clusters made only of math atoms ("πr", "r1", "πrh", "V2") are math; other words break runs.
  const tok = /\d+(?:\.\d+)?|[\p{L}][\p{L}\d]*|√|[+\-*/^()=~]|\s+|./gu;
  const MATH_CLUSTER = /^(?:π|k[rhAV]|[rdhAV][12]?)+$/u;
  const runs: Run[] = [];
  let cur: { start: number; end: number } | null = null;
  const flush = () => {
    if (!cur) return;
    const raw = stripped.slice(cur.start, cur.end);
    const lead = raw.length - raw.trimStart().length;
    const text = raw.trim();
    if (text && /[\dπrdhAV]/.test(text)) {
      const start = cur.start + lead;
      const end = start + text.length;
      const unit = units.find((u) => u.start >= end && /^\s*$/.test(stripped.slice(end, u.start)))?.unit ?? null;
      runs.push({ text, start, end, unit });
    }
    cur = null;
  };
  for (const t of stripped.matchAll(tok)) {
    const v = t[0];
    const isMath = /^\d/.test(v) || MATH_CLUSTER.test(v) || v === '√' || /^[+\-*/^()=~]$/.test(v) || (/^\s+$/.test(v) && cur !== null);
    if (isMath) {
      if (!cur) cur = { start: t.index!, end: t.index! + v.length };
      else cur.end = t.index! + v.length;
    } else flush();
  }
  flush();
  // trim dangling operators/parens left by prose ("= 6 ." → "= 6")
  return runs.map((r) => ({ ...r, text: r.text.replace(/^[=*/+]+|[=*/+\-]+$/g, '').trim() })).filter((r) => r.text);
}

// ------------------------------------------------------------------ cues

const RE = {
  question: /\?\s*$|^(tại\s+sao|vì\s+sao|làm\s+sao|làm\s+thế\s+nào|có\s+phải|đáp\s+án|coach\s+ơi)/iu,
  hypothesis: /(?<!\p{L})(em\s+đoán|em\s+nghĩ|có\s+lẽ|dự\s+đoán|chắc\s+là|em\s+cho\s+rằng|em\s+tin)(?!\p{L})/iu,
  conclusion: /^(vậy|do\s+đó|kết\s+luận|đáp\s+số|suy\s+ra)(?!\p{L})|(?<!\p{L})(vậy|do\s+đó|kết\s+luận|suy\s+ra)(?!\p{L})/iu,
  observation: /(?<!\p{L})(em\s+thử|em\s+thấy|khi\s+kéo|trên\s+mô\s+hình|thử\s+nghiệm)(?!\p{L})/iu,
  strategy: /(?<!\p{L})(em\s+sẽ|em\s+dùng|em\s+định|cách\s+làm|kế\s+hoạch|trước\s+hết|đầu\s+tiên|em\s+làm\s+như)(?!\p{L})/iu,
  outOfScope: /xung\s+quanh|toàn\s+phần|S_?xq|Sxq|S_?tp|tích\s+phân|đạo\s+hàm|hình\s+nón|hình\s+cầu|(?<!\p{L})nón(?!\p{L})/iu,
  justificationStart: /(?<!\p{L})(bởi\s+vì|tại\s+vì|vì|do(?!\s+đó))(?!\p{L})/iu,
  negation: /,?\s*(?:chứ\s+)?không\s+phải[^.;]*/iu,
  connector: /(?<!\p{L})(nên|thì|do\s+đó|suy\s+ra)(?!\p{L})|→|=>/iu,
  fixed: /(giữ\s+nguyên|không\s+(?:thay\s+)?đổi|như\s+nhau|bằng\s+nhau|cùng)/iu,
};

function explicitRefs(text: string): number[] {
  return [...text.matchAll(/(?<!\p{L})(?:bước|dòng|hàng)\s+(\d+)/giu)].map((m) => Number(m[1]));
}

// ------------------------------------------------------------------ symbols

function twoCylinders(spec: ProblemSpec): boolean {
  return spec.cylinders.length > 1;
}

/** Index from the words around a mention: explicit labels ("lon mới") or cue words. */
function indexFromWords(text: string, spec: ProblemSpec): CylIndex | null {
  const f = fold(text);
  for (const c of spec.cylinders) if (c.label && f.includes(fold(c.label))) return c.index;
  return indexCue(text);
}

type SymbolFix = { ast: Ast; ambiguous: string[] };

/** Adds indices to unindexed symbols (single cylinder → 1, experiment → comparison 2). */
function indexSymbols(src: string, spec: ProblemSpec, defaultIndex: CylIndex | null): { expr: string; ambiguous: string[] } {
  const ambiguous: string[] = [];
  const expr = src.replace(/(?<![\p{L}\d])([rdhAV])(?![12\p{L}])/gu, (m) => {
    if (!twoCylinders(spec)) return `${m}1`;
    if (defaultIndex) return `${m}${defaultIndex}`;
    ambiguous.push(m);
    return m;
  });
  return { expr, ambiguous };
}

function parseChain(parts: string[]): { asts: Ast[]; ok: boolean } {
  const asts: Ast[] = [];
  for (const p of parts) {
    try {
      asts.push(parseExpr(p.replace(/^~/, '')));
    } catch {
      return { asts, ok: false };
    }
  }
  return { asts, ok: true };
}

function ratioTarget(a: Ast): SymbolId | null {
  if (a.t === 'div' && a.a.t === 'sym' && a.b.t === 'sym' && a.a.s.length === 2 && a.b.s.length === 2 && a.a.s[0] === a.b.s[0] && a.a.s[1] === '2' && a.b.s[1] === '1') {
    return factorSymbol(a.a.s[0] as Kind);
  }
  return null;
}

// ------------------------------------------------------------------ factor phrases

interface FactorHit {
  kind: Kind | null;
  /** subject was a cylinder label ("cốc mới gấp 4 lần cốc cũ") */
  objectSubject: boolean;
  chain: string[];
  value: ExactValue;
  percent?: ExactValue;
  start: number;
  end: number;
}

const FACTOR_RE = /gấp\s+(đôi|ba|bốn|năm|(?:[\d.π+\-*/^()=\s]+?))(?=\s*lần|\s*$|[,.;]|\s+(?:thì|nên|và|vì)(?!\p{L}))(?:\s*lần)?|(?:chỉ\s+)?bằng\s+(một\s+nửa|nửa|một\s+phần\s+[\p{L}\d]+|\d+\s*\/\s*\d+)|(tăng|giảm)\s+(\d+(?:\.\d+)?)\s+lần|tăng\s+(?:thêm\s+)?(\d+(?:\.\d+)?)\s*%/giu;

function factorHits(m: string, spec: ProblemSpec): FactorHit[] {
  const out: FactorHit[] = [];
  for (const x of m.matchAll(FACTOR_RE)) {
    const start = x.index!;
    const end = start + x[0].length;
    let chain: string[] = [];
    let value: ExactValue | null = null;
    let percent: ExactValue | undefined;
    if (x[1]) {
      const w = x[1].trim();
      if (NUMBER_WORDS[w]) {
        value = exact(NUMBER_WORDS[w]);
        chain = [String(NUMBER_WORDS[w])];
      } else {
        chain = w.split('=').map((p) => p.trim()).filter(Boolean);
        const v = chain.length ? tryEval(chain[chain.length - 1]) : null;
        value = v;
      }
    } else if (x[2]) {
      value = fractionWord(x[2]);
      if (value) chain = [value.d === 1 ? String(value.n) : `${value.n}/${value.d}`];
    } else if (x[3]) {
      const k = fromDecimal(x[4]);
      value = /tăng/iu.test(x[3]) ? k : div(exact(1), k);
      chain = [value.d === 1 ? String(value.n) : `${value.n}/${value.d}`];
    } else if (x[5]) {
      const p = fromDecimal(x[5]);
      value = add(exact(1), div(p, exact(100)));
      percent = value;
      chain = [`1+${x[5]}/100`];
    }
    if (!value) continue;
    // Subject: a symbol right before ("r gấp"), a kind keyword, or a cylinder label.
    const before = m.slice(Math.max(0, start - 40), start);
    const symHit = /(?<!\p{L})([rdhAV])[12]?\s*(?:cũng\s+)?(?:tăng\s+)?$/u.exec(before);
    const kb = kindBefore(m, start, 40, /[.?!;,]|(?<!\p{L})(?:nên|thì|vì|và)(?!\p{L})/u);
    let kind: Kind | null = symHit ? (symHit[1] as Kind) : kb?.k ?? null;
    const objectSubject = !kind && spec.cylinders.some((c) => fold(before).includes(fold(c.label))) || (!kind && /(?<!\p{L})(lon|cốc|bể|hình|hộp|ống)\s+\S+\s*$/u.test(before));
    if (kind === 'd') kind = 'r';
    out.push({ kind, objectSubject, chain, value, percent, start, end });
  }
  return out;
}

// ------------------------------------------------------------------ justification

export function analyzeJustification(text: string, spec: ProblemSpec): Justification {
  const f = text.toLowerCase();
  const cites: string[] = [];
  const rels: string[] = [];
  const rules: string[] = [];
  const fixedKinds = new Set<Kind>();
  if (/cùng\s+(đáy|bán\s+kính|đường\s+kính)|(bán\s+kính|đáy|đường\s+kính)[^,.;]{0,15}(giữ\s+nguyên|không\s+đổi|như\s+nhau|bằng\s+nhau)|giữ\s+nguyên\s+(bán\s+kính|đáy)/u.test(f)) fixedKinds.add('r');
  if (/cùng\s+chiều\s+cao|chiều\s+cao[^,.;]{0,15}(giữ\s+nguyên|không\s+đổi|như\s+nhau|bằng\s+nhau)|giữ\s+nguyên\s+chiều\s+cao/u.test(f)) fixedKinds.add('h');
  for (const c of spec.constraints) if (constraintGroup(c).some((k) => fixedKinds.has(k))) cites.push(c.id);
  for (const r of spec.relations) {
    const k = r.target[0] as Kind;
    const word = KIND_LABEL[k === 'd' ? 'r' : k];
    if (f.includes(word) && /(bằng|gấp|một\s+nửa|phần|tăng|giảm)/u.test(f)) rels.push(r.id);
  }
  if (/bình\s+phương|\^2|²/u.test(f)) rules.push('R-KA');
  if (/đường\s+kính/u.test(f)) rules.push('R-D');
  if (/diện\s+tích\s+đáy\s+nhân|nhân\s+(với\s+)?chiều\s+cao/u.test(f)) rules.push('R-V1');
  const vague = !cites.length && !rels.length && !rules.length && !fixedKinds.size;
  // A cited "fixed" fact that is not a constraint of this problem is still recorded (the validator judges it).
  return { text: text.trim(), citesConstraintIds: cites, citesRelationIds: rels, ruleIds: rules, vague, claimsFixed: [...fixedKinds] };
}

// ------------------------------------------------------------------ main

function result(partial: Partial<RowParse> & Pick<RowParse, 'status' | 'semanticType'>): RowParse {
  return {
    normalized: null, displayText: '', justification: null, explicitRefs: [], ambiguities: [], alternatives: [], outOfScope: false, ...partial,
  };
}

function eqDisplay(target: SymbolId | null, chain: string[], unit: string | null): string {
  const lhs = target ? displaySymbol(target) : null;
  const parts = chain.map((c) => (c.startsWith('~') ? '≈ ' + displayExpr(c.slice(1)) : '= ' + displayExpr(c)));
  return `${lhs ? lhs + ' ' : ''}${parts.join(' ').replace(/^= /, lhs ? '= ' : '')}${unit ? ' ' + unit : ''}`;
}

function factorDisplay(s: SymbolId, v: ExactValue): string {
  return `${KIND_LABEL[(s[1] === 'r' ? 'r' : s[1]) as Kind] ?? s} ×${formatExact(v)}`;
}

export function parseRow(raw: string, ctx: RowContext): RowParse {
  const text = raw.normalize('NFC').trim();
  const refs = explicitRefs(text);
  const { spec } = ctx;
  if (!text) return result({ status: 'unparsed', semanticType: 'free_text' });

  if (RE.question.test(text)) {
    return result({ status: 'interpreted', semanticType: 'question', normalized: { kind: 'question' }, displayText: 'Câu hỏi của em', explicitRefs: refs });
  }

  // Negated tails ("không phải 3 lần như em đoán…") are kept in the text but never parsed as claims.
  const negation = RE.negation.exec(text);
  let analysis = negation ? text.slice(0, negation.index) + text.slice(negation.index + negation[0].length) : text;

  const isObservation = ctx.experiment && RE.observation.test(analysis);
  if (isObservation) return parseObservation(text, analysis, negation?.[0] ?? '', ctx, refs);

  // Justification: "… vì …" (the part after vì) — or a row that starts with "vì".
  let justification: Justification | null = null;
  const j = RE.justificationStart.exec(analysis);
  if (j) {
    const jText = analysis.slice(j.index + j[0].length);
    justification = analyzeJustification(jText, spec);
    analysis = analysis.slice(0, j.index);
    if (!analysis.replace(/[\s,.;]/g, '')) {
      return result({
        status: 'interpreted', semanticType: 'justification', justification, explicitRefs: refs,
        normalized: { kind: 'justification', forNodeId: null, citesConstraintIds: justification.citesConstraintIds, ruleIds: justification.ruleIds },
        displayText: `Lý do: ${justification.text}`,
      });
    }
  }

  const hypothesis = RE.hypothesis.test(analysis);
  const m = normalizeMath(analysis);

  if (RE.outOfScope.test(analysis)) {
    return result({ status: 'interpreted', semanticType: 'free_text', normalized: { kind: 'free_text' }, outOfScope: true, displayText: 'Nội dung ngoài phạm vi POC (chỉ hình trụ: r, d, h, diện tích đáy, thể tích)', justification, explicitRefs: refs });
  }

  const runs = mathRuns(m);
  const factors = factorHits(m, spec);
  const insideFactor = (r: Run) => factors.some((f) => r.start >= f.start && r.start < f.end);
  const eqRuns = runs.filter((r) => r.text.includes('=') && !insideFactor(r));

  // Strategy: plan words, no equation and no numeric factor claim.
  if (!eqRuns.length && !factors.length && RE.strategy.test(analysis)) return parseStrategy(analysis, spec, refs, justification);

  // Formula row: "V = πr²h", "A = S·h" (unindexed symbols, no substituted numbers).
  if (eqRuns.length === 1 && !factors.length) {
    const f = asFormula(eqRuns[0].text);
    if (f) return result({ status: 'interpreted', semanticType: 'formula', normalized: f, displayText: `Công thức: ${eqRuns[0].text.replace(/\*/g, '·').replace(/\^2/g, '²')}`, justification, explicitRefs: refs });
  }

  if (eqRuns.length > 1) {
    return result({
      status: 'ambiguous', semanticType: 'computation', justification, explicitRefs: refs,
      displayText: 'Dòng này có nhiều mệnh đề',
      ambiguities: [{ code: 'multiple_statements', span: null, question: 'Dòng này có nhiều phép tính. Em tách mỗi phép tính thành một dòng nhé.' }],
    });
  }

  // Scaling / factor claims.
  const connector = RE.connector.exec(m);
  const left = connector ? factors.filter((f) => f.end <= connector.index) : [];
  const right = connector ? factors.filter((f) => f.start >= connector.index) : factors;
  const fixed = fixedSymbols(m, spec);
  if (!justification && connector && !left.length && RE.fixed.test(m.slice(0, connector.index))) {
    justification = analyzeJustification(m.slice(0, connector.index), spec);
  }

  if (!eqRuns.length && factors.length) {
    if (left.length && right.length === 1) {
      const claimHit = right[0];
      const claimKind = claimHit.kind ?? inferredKind(spec);
      const changes: FactorChange[] = left.filter((f) => f.kind).map((f) => ({ symbol: factorSymbol(f.kind!)!, factor: f.value }));
      const claim: FactorChange = { symbol: factorSymbol(claimKind)!, factor: claimHit.value };
      const st: MathStatement = { kind: 'scaling', changes, fixed, claim, chain: claimHit.chain };
      return result({
        status: 'interpreted', semanticType: hypothesis ? 'hypothesis' : semanticFor(claim.symbol, analysis, spec, 'relation_claim'),
        normalized: st, justification, explicitRefs: refs, percent: claimHit.percent, explicitChanges: true,
        displayText: `Nếu ${changes.map((c) => factorDisplay(c.symbol, c.factor)).join(', ')}${fixed.length ? ` (${fixed.map((s) => KIND_LABEL[s[0] as Kind]).join(', ')} giữ nguyên)` : ''} thì ${factorDisplay(claim.symbol, claim.factor)}`,
      });
    }
    const main = right.length ? right : factors;
    const kinds = new Set(main.map((f) => f.kind ?? inferredKind(spec)));
    if (kinds.size === 1) {
      const f = main[main.length - 1];
      const target = factorSymbol([...kinds][0])!;
      return factorClaim(target, f.chain, f.value, analysis, spec, { refs, justification, hypothesis, percent: f.percent, fixed });
    }
    return result({ status: 'ambiguous', semanticType: 'relation_claim', justification, explicitRefs: refs, displayText: 'Dòng có nhiều hệ số', ambiguities: [{ code: 'multiple_statements', span: null, question: 'Dòng này nêu hệ số của nhiều đại lượng. Em tách thành từng dòng nhé.' }] });
  }

  if (eqRuns.length === 1) {
    const run = eqRuns[0];
    const parts = run.text.split('=').map((p) => p.trim()).filter(Boolean);
    let target: SymbolId | null = null;
    let chain = parts;
    const ambiguities: Ambiguity[] = [];
    const firstAst = safeParse(parts[0]);
    const experimentIndex: CylIndex | null = null;
    let unresolvedKind: Kind | null = null;
    if (firstAst && firstAst.t === 'sym') {
      const s = firstAst.s;
      if (s.length === 2 || s.startsWith('k')) target = s as SymbolId;
      else {
        const idx = !twoCylinders(spec) ? 1 : indexFromWords(m.slice(Math.max(0, run.start - 30), run.start), spec) ?? experimentIndex;
        if (idx) target = sym(s as Kind, idx);
        else {
          unresolvedKind = s as Kind;
          ambiguities.push({ code: 'unresolved_symbol', span: null, question: `“${s}” là của hình nào: ${spec.cylinders.map((c) => c.label).join(' hay ')}?` });
        }
      }
      chain = parts.slice(1);
    } else if (firstAst && ratioTarget(firstAst)) {
      target = ratioTarget(firstAst);
      chain = parts.slice(1);
    } else {
      // "Chiều cao lon mới là 12 : 2 = 6 cm": target from the words before the run.
      const kb = kindBefore(m, run.start, 60, /[.?!;]/u);
      if (kb) {
        const idx = !twoCylinders(spec) ? 1 : indexFromWords(m.slice(kb.start, run.start + 1), spec);
        if (idx) target = sym(kb.k, idx);
        else unresolvedKind = kb.k, ambiguities.push({ code: 'unresolved_symbol', span: null, question: `${KIND_LABEL[kb.k]} này là của hình nào: ${spec.cylinders.map((c) => c.label).join(' hay ')}?` });
      }
    }
    // Indexing of bare symbols inside the chain.
    const idxDefault = !twoCylinders(spec) ? 1 : target && target.length === 2 ? (Number(target[1]) as CylIndex) : null;
    const fixedChain: string[] = [];
    for (const p of chain) {
      const r = indexSymbols(p, spec, idxDefault);
      if (r.ambiguous.length) ambiguities.push({ code: 'unresolved_symbol', span: null, question: `Ký hiệu “${r.ambiguous[0]}” là của hình nào?` });
      fixedChain.push(r.expr);
    }
    const parsed = parseChain(fixedChain);
    if (!parsed.ok || !fixedChain.length) {
      return result({ status: 'unparsed', semanticType: 'computation', justification, explicitRefs: refs, displayText: 'Chưa đọc được phép tính' });
    }
    const unknownSyms = new Set(parsed.asts.flatMap(symbolsIn));
    const allowed = new Set<string>(symbolsFor(spec));
    const foreign = [...unknownSyms].filter((s) => !allowed.has(s) && s.length === 2);
    if (foreign.length) ambiguities.push({ code: 'unresolved_symbol', span: null, question: `Bài này không có ${foreign.map(displaySymbol).join(', ')}. Em kiểm tra lại ký hiệu nhé.` });

    // A trailing factor phrase ("… = 4, gấp 4 lần") restates the same claim.
    if (factors.length && target && target.startsWith('k')) {
      const last = tryEval(fixedChain[fixedChain.length - 1]);
      if (last && factors.some((f) => !(f.value.n === last.n && f.value.d === last.d))) {
        ambiguities.push({ code: 'multiple_statements', span: null, question: 'Phép tính và câu kết luận trong dòng này cho hai hệ số khác nhau. Em muốn giữ số nào?' });
      }
    } else if (factors.length && target && !target.startsWith('k')) {
      ambiguities.push({ code: 'multiple_statements', span: null, question: 'Dòng này vừa có phép tính vừa có hệ số. Em tách thành hai dòng nhé.' });
    }
    if (!target) {
      if (!ambiguities.length) ambiguities.push({ code: 'missing_quantity', span: null, question: 'Phép tính này tìm đại lượng nào (ví dụ A₁, V₂, V₂/V₁)?' });
    }
    const st: MathStatement = { kind: 'equation', target, chain: fixedChain, unit: run.unit };
    const semantic: SemanticType = hypothesis ? 'hypothesis' : target ? semanticFor(target, analysis, spec, 'computation') : 'computation';
    if (ambiguities.length) {
      return result({ status: 'ambiguous', semanticType: semantic, normalized: st, justification, explicitRefs: refs, ambiguities, displayText: eqDisplay(target, fixedChain, run.unit), alternatives: alternativesFor(st, spec, unresolvedKind) });
    }
    return result({ status: 'interpreted', semanticType: semantic, normalized: st, justification, explicitRefs: refs, displayText: eqDisplay(target, fixedChain, run.unit) });
  }

  if (justification && !justification.vague) {
    return result({ status: 'interpreted', semanticType: 'justification', justification, explicitRefs: refs, normalized: { kind: 'justification', forNodeId: null, citesConstraintIds: justification.citesConstraintIds, ruleIds: justification.ruleIds }, displayText: `Lý do: ${justification.text}` });
  }
  if (RE.strategy.test(analysis)) return parseStrategy(analysis, spec, refs, justification);
  return result({ status: 'unparsed', semanticType: 'free_text', justification, explicitRefs: refs, displayText: 'Chưa đọc được ý toán học của dòng này' });
}

function safeParse(src: string): Ast | null {
  try {
    return parseExpr(src);
  } catch {
    return null;
  }
}

function inferredKind(spec: ProblemSpec): Kind {
  const k = spec.unknowns.find((u) => u.symbol.startsWith('k'))?.symbol;
  return k === 'kA' ? 'A' : k === 'kr' ? 'r' : k === 'kh' ? 'h' : 'V';
}

function semanticFor(target: SymbolId, text: string, spec: ProblemSpec, fallback: SemanticType): SemanticType {
  const isUnknown = spec.unknowns.some((u) => u.symbol === target);
  if (isUnknown && (RE.conclusion.test(text) || target.startsWith('k'))) return 'conclusion';
  return fallback;
}

function fixedSymbols(m: string, spec: ProblemSpec): SymbolId[] {
  const out: SymbolId[] = [];
  const f = m.toLowerCase();
  if (/chiều\s+cao[^,.;]{0,15}(giữ\s+nguyên|không\s+đổi|như\s+nhau)|giữ\s+nguyên\s+chiều\s+cao|cùng\s+chiều\s+cao/u.test(f)) out.push('kh');
  if (/(bán\s+kính|đáy)[^,.;]{0,15}(giữ\s+nguyên|không\s+đổi|như\s+nhau)|cùng\s+(đáy|bán\s+kính)|giữ\s+nguyên\s+(bán\s+kính|đáy)/u.test(f)) out.push('kr');
  void spec;
  return out;
}

function factorClaim(
  target: SymbolId, chain: string[], value: ExactValue, text: string, spec: ProblemSpec,
  o: { refs: number[]; justification: Justification | null; hypothesis: boolean; percent?: ExactValue; fixed: SymbolId[] },
): RowParse {
  const bare = chain.length <= 1 && !/[*/^+]/.test(chain[0] ?? '');
  const semantic: SemanticType = o.hypothesis ? 'hypothesis' : semanticFor(target, text, spec, 'relation_claim');
  const normalized: MathStatement = bare && semantic === 'conclusion'
    ? { kind: 'conclusion', target, value, unit: null }
    : { kind: 'equation', target, chain: chain.length ? chain : [formatExact(value)], unit: null };
  return result({
    status: 'interpreted', semanticType: semantic, normalized, justification: o.justification, explicitRefs: o.refs, percent: o.percent,
    displayText: `${displaySymbol(target)} = ${chain.length > 1 ? chain.map(displayExpr).join(' = ') : formatExact(value)}${o.percent ? ' (từ phần trăm tăng)' : ''}`,
  });
}

function asFormula(run: string): MathStatement | null {
  const parts = run.split('=').map((p) => p.trim());
  if (parts.length !== 2) return null;
  const lhs = /^([rdhAV])$/.exec(parts[0]);
  if (!lhs) return null;
  const ast = safeParse(parts[1]);
  if (!ast) return null;
  const syms = symbolsIn(ast);
  if (!syms.length || syms.some((s) => s.length !== 1)) return null;
  const nums = numberTexts(ast).filter((n) => !['2', '3', '4'].includes(n));
  if (nums.length) return null;
  return { kind: 'formula', ruleId: '', lhs: lhs[1] as Kind, rhs: parts[1] };
}

function parseStrategy(text: string, spec: ProblemSpec, refs: number[], justification: Justification | null): RowParse {
  const f = text.toLowerCase();
  const plan: string[] = [];
  if (/đường\s+kính/u.test(f) && /(bán\s+kính|chia\s+(cho\s+)?2|: ?2)/u.test(f)) plan.push('derive_r_from_d');
  if (/diện\s+tích\s+đáy/u.test(f)) plan.push('compute_A');
  if (/thể\s+tích/u.test(f)) plan.push('compute_V');
  if (/(chia|tỉ\s+số|tỷ\s+số|so\s+sánh)/u.test(f) && /thể\s+tích/u.test(f)) plan.push('ratio_of_volumes');
  if (/bình\s+phương/u.test(f)) plan.push('ratio_scaling_law');
  if (/chu\s+vi/u.test(f)) plan.push('wrong:perimeter');
  if (/tích\s+phân|đạo\s+hàm/u.test(f)) plan.push('outside:calculus');
  if (/chiều\s+cao/u.test(f) && /(chia|nhân|một\s+nửa|gấp)/u.test(f) && spec.relations.some((r) => r.target.startsWith('h'))) plan.push('derive_h_from_relation');
  const status = plan.length ? 'interpreted' : 'ambiguous';
  return result({
    status, semanticType: 'strategy', normalized: { kind: 'strategy', plan }, justification, explicitRefs: refs,
    displayText: plan.length ? `Kế hoạch: ${plan.map(planLabel).join(' → ')}` : 'Kế hoạch chưa rõ',
    ambiguities: plan.length ? [] : [{ code: 'vague_strategy', span: null, question: 'Em định tính đại lượng nào trước, rồi dùng nó để tìm gì?' }],
  });
}

export function planLabel(code: string): string {
  return ({
    derive_r_from_d: 'suy ra bán kính từ đường kính', compute_A: 'tính diện tích đáy', compute_V: 'tính thể tích',
    ratio_of_volumes: 'chia hai thể tích', ratio_scaling_law: 'dùng bình phương tỉ số bán kính',
    derive_h_from_relation: 'tìm chiều cao từ quan hệ trong đề', 'wrong:perimeter': 'dùng chu vi đáy', 'outside:calculus': 'dùng tích phân/đạo hàm',
  } as Record<string, string>)[code] ?? code;
}

/** Alternative readings for an unresolved index: the same expression attributed to each cylinder. */
function alternativesFor(st: MathStatement, spec: ProblemSpec, unresolvedKind: Kind | null): Interpretation['alternatives'] {
  if (st.kind !== 'equation' || !twoCylinders(spec)) return [];
  const out: Interpretation['alternatives'] = [];
  for (const c of spec.cylinders) {
    const i = c.index;
    const target = st.target ?? null;
    const chain = st.chain.map((p) => p.replace(/(?<![\p{L}\d])([rdhAV])(?![12\p{L}])/gu, `$1${i}`));
    const t = target ?? (unresolvedKind ? sym(unresolvedKind, i) : null);
    if (!chain.every((p) => safeParse(p))) continue;
    out.push({
      statement: { kind: 'equation', target: t, chain, unit: st.unit },
      semanticType: 'computation',
      displayText: `${c.label}: ${eqDisplay(t, chain, st.unit)}`,
    });
  }
  // Only readings with a target are real alternatives ("V = 4π·5" → V₁ or V₂).
  return out.filter((a) => a.statement.kind === 'equation' && a.statement.target);
}

// ------------------------------------------------------------------ observation (F6)

function parseObservation(text: string, analysis: string, negated: string, ctx: RowContext, refs: number[]): RowParse {
  const m = normalizeMath(analysis);
  const setting = /(?<!\p{L})([rh])[12]?\s*=\s*(\d+(?:\.\d+)?)/u.exec(m);
  const claims: { symbol: SymbolId | null; chain: string[]; ofValue?: string; negated?: boolean }[] = [];
  const runs = mathRuns(m).filter((r) => r.text.includes('=') && (!setting || r.start > setting.index + 2));
  for (const r of runs) {
    const parts = r.text.split('=').map((p) => p.trim()).filter(Boolean);
    const head = /^([rdhAV])[12]?$/.exec(parts[0]);
    if (head) claims.push({ symbol: sym(head[1] as Kind, 2), chain: parts.slice(1).map((p) => indexSymbols(p, ctx.spec, 2).expr) });
  }
  for (const x of m.matchAll(/gấp\s+(\d+(?:\.\d+)?)\s*lần\s+(\d+(?:\.\d+)?π?)/gu)) {
    claims.push({ symbol: null, chain: [x[1]], ofValue: x[2] });
  }
  const neg = /gấp\s+(\d+(?:\.\d+)?)/u.exec(normalizeMath(negated));
  if (neg) claims.push({ symbol: null, chain: [neg[1]], negated: true });
  const st: MathStatement = {
    kind: 'observation',
    setting: setting ? { symbol: `${setting[1]}2` as SymbolId, value: fromDecimal(setting[2]) } : null,
    claims,
  };
  if (!claims.length) {
    return result({ status: 'ambiguous', semanticType: 'observation', normalized: st, explicitRefs: refs, displayText: 'Quan sát chưa có số liệu', ambiguities: [{ code: 'missing_quantity', span: null, question: 'Em thấy đại lượng nào bằng bao nhiêu trên mô hình?' }] });
  }
  const shown = [
    setting ? `Thử ${setting[1]} = ${setting[2].replace('.', ',')}` : 'Quan sát',
    ...claims.map((c) => (c.negated ? `không phải gấp ${c.chain[0]}` : c.ofValue ? `gấp ${c.chain[0]} lần ${c.ofValue}` : `${displaySymbol(c.symbol!)} = ${c.chain.map(displayExpr).join(' = ')}`)),
  ];
  void text;
  return result({ status: 'interpreted', semanticType: 'observation', normalized: st, explicitRefs: refs, displayText: shown.join('; ') });
}

export { findKinds, PI, mul };
