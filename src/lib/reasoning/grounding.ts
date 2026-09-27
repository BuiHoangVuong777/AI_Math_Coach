/**
 * LLM interpretation contracts and deterministic grounding checks G1–G4 (§8.4).
 * An LLM may only re-express what the learner wrote in the closed grammar; it can
 * never add numbers, symbols or equalities that are not in the text.
 */
import { exact, fromDecimal } from './exact.ts';
import { numberTexts, parseExpr, symbolsIn } from './expr.ts';
import { symbolsFor } from './facts.ts';
import { NUMBER_WORDS, factorWord, findKinds, indexCue } from './lexicon.ts';
import type { Mention } from './problemParser.ts';
import { normalizeMath, type RowParse } from './rowParser.ts';
import { factorSymbol } from './rules.ts';
import type { FactorChange, Kind, MathStatement, ProblemSpec, SemanticType, SymbolId, Unit } from './types.ts';

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

// ------------------------------------------------------------------ row parser schema

const SEMANTICS: SemanticType[] = ['strategy', 'formula', 'computation', 'relation_claim', 'hypothesis', 'justification', 'conclusion', 'question', 'free_text'];
const TARGETS = ['', 'r1', 'r2', 'd1', 'd2', 'h1', 'h2', 'A1', 'A2', 'V1', 'V2', 'kr', 'kh', 'kA', 'kV'];

export const PARSER_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['semanticType', 'target', 'chain', 'changes', 'claimKind', 'claimFactor', 'justification', 'ambiguous', 'question'],
  properties: {
    semanticType: { type: 'string', enum: SEMANTICS },
    target: { type: 'string', enum: TARGETS },
    chain: { type: 'array', items: { type: 'string' } },
    changes: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['kind', 'factor'], properties: { kind: { type: 'string', enum: ['r', 'd', 'h', 'A', 'V'] }, factor: { type: 'string' } } },
    },
    claimKind: { type: 'string', enum: ['', 'r', 'd', 'h', 'A', 'V'] },
    claimFactor: { type: 'string' },
    justification: { type: 'string' },
    ambiguous: { type: 'boolean' },
    question: { type: 'string' },
  },
} as const;

export interface LLMRowParse {
  semanticType: SemanticType;
  target: string;
  chain: string[];
  changes: { kind: Kind; factor: string }[];
  claimKind: '' | Kind;
  claimFactor: string;
  justification: string;
  ambiguous: boolean;
  question: string;
}

export function validateLLMRowParse(raw: unknown): Result<LLMRowParse> {
  if (!isObj(raw)) return { ok: false, error: 'not_object' };
  const keys = Object.keys(raw).sort().join(',');
  if (keys !== 'ambiguous,chain,changes,claimFactor,claimKind,justification,question,semanticType,target') return { ok: false, error: 'keys' };
  const r = raw as Record<string, unknown>;
  if (!SEMANTICS.includes(r.semanticType as SemanticType)) return { ok: false, error: 'semanticType' };
  if (!TARGETS.includes(r.target as string)) return { ok: false, error: 'target' };
  if (!Array.isArray(r.chain) || r.chain.length > 6 || !r.chain.every((c) => typeof c === 'string' && c.length <= 80)) return { ok: false, error: 'chain' };
  if (!Array.isArray(r.changes) || r.changes.length > 3 || !r.changes.every((c) => isObj(c) && ['r', 'd', 'h', 'A', 'V'].includes(c.kind as string) && typeof c.factor === 'string' && (c.factor as string).length <= 30)) return { ok: false, error: 'changes' };
  if (!['', 'r', 'd', 'h', 'A', 'V'].includes(r.claimKind as string) || typeof r.claimFactor !== 'string' || (r.claimFactor as string).length > 30) return { ok: false, error: 'claim' };
  if (typeof r.justification !== 'string' || (r.justification as string).length > 300) return { ok: false, error: 'justification' };
  if (typeof r.ambiguous !== 'boolean' || typeof r.question !== 'string' || (r.question as string).length > 300) return { ok: false, error: 'ambiguous' };
  return { ok: true, value: r as unknown as LLMRowParse };
}

/** Converts a validated LLM reading into the same MathStatement shapes as the rules. */
export function llmToStatement(p: LLMRowParse): MathStatement | null {
  if (p.semanticType === 'question') return { kind: 'question' };
  if (p.semanticType === 'free_text') return { kind: 'free_text' };
  const toFactor = (k: Kind, f: string): FactorChange | null => {
    const v = factorWord(f.trim().replace(',', '.'));
    const symbol = factorSymbol(k);
    return v && symbol ? { symbol, factor: v } : null;
  };
  if (p.claimKind && p.claimFactor && p.changes.length) {
    const changes = p.changes.map((c) => toFactor(c.kind, c.factor));
    const claim = toFactor(p.claimKind, p.claimFactor);
    if (changes.some((c) => !c) || !claim) return null;
    return { kind: 'scaling', changes: changes as FactorChange[], fixed: [], claim, chain: [] };
  }
  if (p.target && p.chain.length) {
    const chain = p.chain.map((c) => normalizeMath(c).replace(/\s+/g, ''));
    try {
      chain.forEach((c) => parseExpr(c));
    } catch {
      return null;
    }
    return { kind: 'equation', target: p.target as SymbolId, chain, unit: null };
  }
  return null;
}

// ------------------------------------------------------------------ G1–G4

function textNumbers(text: string): Set<string> {
  const m = normalizeMath(text);
  const out = new Set<string>((m.match(/\d+(?:\.\d+)?/g) ?? []).map((n) => String(Number(n))));
  for (const [w, v] of Object.entries(NUMBER_WORDS)) if (new RegExp(`(?<!\\p{L})${w}(?!\\p{L})`, 'iu').test(text)) out.add(String(v));
  if (/nửa/iu.test(text)) out.add('1').add('2');
  if (/[²]|\^2|bình\s+phương/iu.test(text)) out.add('2');
  if (/[³]|\^3|lập\s+phương/iu.test(text)) out.add('3');
  return out;
}

function statementNumbers(st: MathStatement): string[] {
  const fromExpr = (e: string) => {
    try {
      return numberTexts(parseExpr(e.replace(/^~/, ''))).map((n) => String(Number(n)));
    } catch {
      return ['NaN'];
    }
  };
  const fromValue = (v: { n: number; d: number }) => (v.d === 1 ? [String(v.n)] : [String(v.n), String(v.d)]);
  switch (st.kind) {
    case 'equation':
      return st.chain.flatMap(fromExpr);
    case 'scaling':
      return [...st.changes.flatMap((c) => fromValue(c.factor)), ...fromValue(st.claim.factor)];
    case 'conclusion':
      return fromValue(st.value);
    default:
      return [];
  }
}

function statementSymbols(st: MathStatement): SymbolId[] {
  if (st.kind === 'equation') {
    const s = new Set<string>(st.target ? [st.target] : []);
    for (const e of st.chain) {
      try {
        symbolsIn(parseExpr(e.replace(/^~/, ''))).forEach((x) => s.add(x));
      } catch {
        s.add('?');
      }
    }
    return [...s] as SymbolId[];
  }
  if (st.kind === 'conclusion') return [st.target];
  return [];
}

function equalityCount(st: MathStatement): number {
  if (st.kind === 'equation') return Math.max(1, st.chain.length);
  if (st.kind === 'scaling') return 1 + Math.max(0, st.chain.length - 1);
  return st.kind === 'conclusion' ? 1 : 0;
}

export interface GroundingReport {
  ok: boolean;
  failures: ('G1' | 'G2' | 'G3' | 'G4')[];
}

export function groundRowParse(text: string, st: MathStatement, spec: ProblemSpec, deterministic: RowParse | null): GroundingReport {
  const failures: GroundingReport['failures'] = [];
  const nums = textNumbers(text);
  if (!statementNumbers(st).every((n) => nums.has(n))) failures.push('G1');
  const allowed = new Set<string>(symbolsFor(spec));
  const syms = statementSymbols(st);
  const indexed = syms.filter((s) => s.length === 2 && /[12]$/.test(s));
  const hasIndexCue = /[₁₂]|[rdhAVS]\s*_?[12]/u.test(text) || indexCue(text) !== null || spec.cylinders.some((c) => text.toLowerCase().includes(c.label.toLowerCase()));
  if (!syms.every((s) => allowed.has(s)) || (spec.cylinders.length > 1 && indexed.length && !hasIndexCue)) failures.push('G2');
  const eqInText = (normalizeMath(text).match(/=|(?<!\p{L})(bằng|là|gấp|lần)(?!\p{L})/giu) ?? []).length;
  if (equalityCount(st) > eqInText) failures.push('G3');
  if (deterministic?.normalized && deterministic.status !== 'unparsed' && JSON.stringify(deterministic.normalized) !== JSON.stringify(st)) failures.push('G4');
  return { ok: failures.length === 0, failures };
}

// ------------------------------------------------------------------ problem interpretation schema

export const PROBLEM_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['mentions'],
  properties: {
    mentions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'kind', 'cylinder', 'value', 'unit', 'quote'],
        properties: {
          type: { type: 'string', enum: ['given', 'relation', 'constraint', 'unknown'] },
          kind: { type: 'string', enum: ['r', 'd', 'h', 'A', 'V'] },
          cylinder: { type: 'integer', enum: [1, 2] },
          value: { type: 'string' },
          unit: { type: 'string', enum: ['', 'mm', 'cm', 'dm', 'm'] },
          quote: { type: 'string' },
        },
      },
    },
  },
} as const;

/**
 * Grounds LLM-proposed problem mentions: each quote must be a verbatim substring of
 * the problem text containing a kind keyword (and the number for givens). Ungrounded
 * mentions are dropped.
 */
export function groundProblemMentions(text: string, raw: unknown): Result<Mention[]> {
  if (!isObj(raw) || !Array.isArray(raw.mentions) || raw.mentions.length > 12) return { ok: false, error: 'schema' };
  const out: Mention[] = [];
  for (const m of raw.mentions) {
    if (!isObj(m) || typeof m.quote !== 'string' || typeof m.value !== 'string' || typeof m.kind !== 'string') return { ok: false, error: 'schema' };
    const quote = m.quote.trim();
    const at = quote ? text.indexOf(quote) : -1;
    if (at < 0) continue;
    const span = { start: at, end: at + quote.length };
    const kinds = findKinds(quote);
    const kind = m.kind as Kind;
    if (m.type === 'given') {
      const num = m.value.replace(',', '.');
      if (!/^\d+(?:\.\d+)?$/.test(num) || !quote.replace(',', '.').includes(num) || !kinds.some((k) => k.k === kind)) continue;
      out.push({ type: 'given', k: kind, index: m.cylinder === 2 ? 2 : 1, value: fromDecimal(num), unit: (m.unit || null) as Unit | null, span });
    } else if (m.type === 'constraint') {
      if (!/giữ\s+nguyên|không\s+đổi|cùng|như\s+nhau|bằng\s+nhau/iu.test(quote)) continue;
      out.push({ type: 'constraint', k: kind === 'd' ? 'r' : kind, span });
    } else if (m.type === 'unknown') {
      if (!/tính|tìm|bao\s+nhiêu|mấy|\?/iu.test(quote)) continue;
      const ratio = /lần|phần/iu.test(quote);
      const symbol = (ratio ? factorSymbol(kind) : `${kind}${m.cylinder === 2 ? 2 : 1}`) as SymbolId;
      out.push({ type: 'unknown', symbol, span, askedAs: quote });
    } else if (m.type === 'relation') {
      const f = /gấp\s+(\d+)|một\s+nửa|một\s+phần\s+(\S+)/iu.exec(quote);
      if (!f) continue;
      const v = f[1] ? exact(Number(f[1])) : f[2] ? exact(1, NUMBER_WORDS[f[2]] ?? Number(f[2])) : exact(1, 2);
      out.push({ type: 'relation', k: kind, op: 'mul', value: v, span, phrase: quote });
    }
  }
  return { ok: true, value: out };
}
