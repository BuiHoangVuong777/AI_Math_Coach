/**
 * Disclosure policy (D0–D4, §9.7), generalized answer-leak guard and CoachResponse
 * validation. Deterministic; used by the server AND again in the browser.
 */
import { equals, formatExact, toNumber } from './exact.ts';
import type { ProblemFacts } from './facts.ts';
import { kindOf } from './rules.ts';
import type {
  CoachContext, CoachResponse, DisclosureLevel, DisclosureState, ExactValue, NodeDisclosure, ProblemSpec, ReasoningGraph, SymbolId,
} from './types.ts';

export const CANVAS_CANARY = 'CANVAS-INSTR-5D2E';

export function nodeDisclosure(state: DisclosureState, nodeId: string): NodeDisclosure {
  return state[nodeId] ?? { hintRequests: 0, failedRevisions: 0, lastCoachedRevision: null, lastCoachedLevel: null };
}

/** D0 by default; +1 per explicit hint request; auto-raise to at most D2 after 2 failed revisions. */
export function allowedLevel(state: DisclosureState, nodeId: string | null): DisclosureLevel {
  if (!nodeId) return 0;
  const d = nodeDisclosure(state, nodeId);
  const auto = d.failedRevisions >= 2 ? 2 : 0;
  return Math.min(4, Math.max(d.hintRequests, auto)) as DisclosureLevel;
}

// ------------------------------------------------------------------ forbidden values

export interface ForbiddenValue {
  symbol: SymbolId;
  value: ExactValue;
  text: string;
  patterns: RegExp[];
}

const WORDS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín', 'hai mươi'];

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const KIND_WORDS: Record<string, string> = {
  kV: String.raw`thể\s*tích|v2\s*[/:]\s*v1`,
  kA: String.raw`diện\s*tích|a2\s*[/:]\s*a1|s2\s*[/:]\s*s1`,
  kr: String.raw`bán\s*kính|r2\s*[/:]\s*r1`,
  kh: String.raw`chiều\s*cao|h2\s*[/:]\s*h1`,
  r: String.raw`bán\s*kính|(?<!\p{L})r[12]?`,
  d: String.raw`đường\s*kính|(?<!\p{L})d[12]?`,
  h: String.raw`chiều\s*cao|(?<!\p{L})h[12]?`,
};

function valueAlternatives(v: ExactValue): string[] {
  const alts: string[] = [];
  const plain = v.d === 1 ? String(v.n) : `${v.n}/${v.d}`;
  alts.push(esc(plain));
  const dec = v.n / v.d;
  if (v.d !== 1 && Number.isFinite(dec) && String(dec).length < 8) alts.push(esc(String(dec)));
  if (v.d === 1 && v.n >= 0 && v.n <= 20) alts.push(WORDS[v.n].replace(/\s+/g, '\\s+'));
  if (v.n === 1 && v.d === 2) alts.push(String.raw`(?:một\s+)?nửa`);
  if (v.n === 1 && v.d > 1 && v.d <= 10) alts.push(`một\\s+phần\\s+${WORDS[v.d]}`);
  return alts;
}

export function buildForbidden(spec: ProblemSpec, facts: ProblemFacts, graph: ReasoningGraph): ForbiddenValue[] {
  const out: ForbiddenValue[] = [];
  const givenValues = spec.givens.map((g) => g.value);
  const relationValues = spec.relations.map((r) => r.value);
  for (const [s, f] of Object.entries(facts) as [SymbolId, NonNullable<ProblemFacts[SymbolId]>][]) {
    if (spec.givens.some((g) => g.symbol === s)) continue;
    // Validly produced by the learner → the learner already said it.
    const producer = graph.symbolTable[s]?.producerNodeId;
    const pn = producer ? graph.nodes[producer] : null;
    if (pn?.validation?.status === 'valid' && pn.validation.claimedValue && equals(pn.validation.claimedValue, f.value)) continue;
    const k = kindOf(s);
    const v = f.value;
    const patterns: RegExp[] = [];
    if (v.piPow === 1) {
      const coef = v.d === 1 ? String(v.n) : String(v.n / v.d);
      patterns.push(new RegExp(`(?<![\\d.])${esc(coef)}\\s*π`, 'u'));
      const approx = toNumber(v);
      for (const digits of [2, 1]) patterns.push(new RegExp(`(?<![\\d.])${esc(approx.toFixed(digits))}(?!\\d)`, 'u'));
    } else if (k === 'k') {
      // Change factors of the input dimensions (r₂/r₁, h₂/h₁) are problem data unless asked for.
      if ((s === 'kr' || s === 'kh') && !spec.unknowns.some((u) => u.symbol === s)) continue;
      if (relationValues.some((g) => equals(g, v)) && (s === 'kr' || s === 'kh')) continue;
      const alts = valueAlternatives(v).join('|');
      patterns.push(new RegExp(`(?:${KIND_WORDS[s]})[^.?!\\n]{0,30}?(?:gấp|=|bằng|là|tăng)\\s*(?:${alts})(?![\\d\\p{L}]|\\.\\d)`, 'iu'));
      patterns.push(new RegExp(`(?:gấp)\\s*(?:${alts})(?![\\d\\p{L}]|\\.\\d)[^.?!\\n]{0,20}(?:${KIND_WORDS[s]})`, 'iu'));
    } else if (k === 'r' || k === 'd' || k === 'h') {
      if (givenValues.some((g) => equals(g, v))) continue;
      const alts = valueAlternatives(v).join('|');
      patterns.push(new RegExp(`(?:${KIND_WORDS[k]})[^.?!\\n]{0,15}?(?:=|là|bằng)\\s*(?:${alts})(?![\\d\\p{L}]|\\.\\d)`, 'iu'));
    } else continue;
    out.push({ symbol: s, value: v, text: formatExact(v), patterns });
  }
  return out;
}

export function normalizeForGuard(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[₁]/g, '1')
    .replace(/[₂]/g, '2')
    .replace(/(?<!\p{L})pi(?!\p{L})/gu, 'π')
    .replace(/(\d)pi/gu, '$1π')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/[·*×]/g, '·')
    .replace(/[ \t]+/g, ' ');
}

export function findLeak(text: string, forbidden: ForbiddenValue[]): ForbiddenValue | null {
  const t = normalizeForGuard(text);
  return forbidden.find((f) => f.patterns.some((p) => p.test(t))) ?? null;
}

// ------------------------------------------------------------------ CoachResponse contract

export const COACH_LIMITS = { question: 300, explanation: 700, hint: 400, evidence: 200 } as const;
export const REPLY_TYPES: CoachResponse['replyType'][] = ['socratic_question', 'hint', 'feedback', 'explanation', 'invitation', 'limit_notice'];
export const MISCONCEPTION_CODES = [
  'none', 'radius_diameter', 'linear_scaling', 'area_linear', 'square_as_double', 'forgot_height', 'missing_pi',
  'increase_vs_factor', 'percent_vs_factor', 'arithmetic_error', 'unit_error', 'other',
] as const;

/** Strict Structured Outputs schema for the tutor model (all fields required, no extras). */
export const TUTOR_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['replyType', 'question', 'explanation', 'hintLevel', 'hintText', 'relevantNodeIds', 'disclosureLevel', 'misconception'],
  properties: {
    replyType: { type: 'string', enum: REPLY_TYPES },
    question: { type: 'string' },
    explanation: { type: 'string' },
    hintLevel: { type: 'integer', enum: [0, 1, 2, 3, 4] },
    hintText: { type: 'string' },
    relevantNodeIds: { type: 'array', items: { type: 'string' } },
    disclosureLevel: { type: 'integer', enum: [0, 1, 2, 3, 4] },
    misconception: {
      type: 'object',
      additionalProperties: false,
      required: ['detected', 'code', 'evidence'],
      properties: {
        detected: { type: 'boolean' },
        code: { type: 'string', enum: MISCONCEPTION_CODES },
        evidence: { type: 'string' },
      },
    },
  },
} as const;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const PRAISE = /(đúng\s+rồi|chính\s+xác|rất\s+đúng|hoàn\s+toàn\s+đúng|em\s+làm\s+đúng|giỏi\s+lắm)/iu;

/**
 * Validates a raw model reply against the schema and the deterministic guards:
 * lengths, known node ids, level ≤ allowed, no canary, no forbidden value, no
 * praise of a node that is not valid (NFR-MATH-004).
 */
export function validateTutorOutput(raw: unknown, ctx: CoachContext, forbidden: ForbiddenValue[]): Result<CoachResponse> {
  if (!isObj(raw)) return { ok: false, error: 'not_object' };
  const { replyType, question, explanation, hintLevel, hintText, relevantNodeIds, disclosureLevel, misconception } = raw;
  const keys = Object.keys(raw).sort().join(',');
  if (keys !== 'disclosureLevel,explanation,hintLevel,hintText,misconception,question,relevantNodeIds,replyType') return { ok: false, error: 'keys' };
  if (typeof replyType !== 'string' || !REPLY_TYPES.includes(replyType as CoachResponse['replyType'])) return { ok: false, error: 'replyType' };
  if (typeof question !== 'string' || question.length > COACH_LIMITS.question) return { ok: false, error: 'question' };
  if (typeof explanation !== 'string' || explanation.length > COACH_LIMITS.explanation) return { ok: false, error: 'explanation' };
  if (typeof hintText !== 'string' || hintText.length > COACH_LIMITS.hint) return { ok: false, error: 'hintText' };
  if (!question.trim() && !explanation.trim() && !hintText.trim()) return { ok: false, error: 'empty' };
  if (!Number.isInteger(hintLevel) || (hintLevel as number) < 0 || (hintLevel as number) > 4) return { ok: false, error: 'hintLevel' };
  if (!Number.isInteger(disclosureLevel) || (disclosureLevel as number) < 0 || (disclosureLevel as number) > ctx.disclosure.allowedLevel) return { ok: false, error: 'disclosure_level' };
  if ((hintLevel as number) > ctx.disclosure.allowedLevel) return { ok: false, error: 'hint_level' };
  const known = new Set([ctx.focusNode?.id, ...ctx.relatedNodes.map((n) => n.id)].filter(Boolean) as string[]);
  if (!Array.isArray(relevantNodeIds) || relevantNodeIds.length > 8 || !relevantNodeIds.every((x) => typeof x === 'string' && known.has(x))) return { ok: false, error: 'relevantNodeIds' };
  if (!isObj(misconception) || typeof misconception.detected !== 'boolean' || typeof misconception.code !== 'string' || typeof misconception.evidence !== 'string') return { ok: false, error: 'misconception' };
  if (!(MISCONCEPTION_CODES as readonly string[]).includes(misconception.code) || misconception.detected !== (misconception.code !== 'none') || misconception.evidence.length > COACH_LIMITS.evidence) return { ok: false, error: 'misconception' };
  const all = `${question}\n${explanation}\n${hintText}\n${misconception.evidence}`;
  if (all.includes(CANVAS_CANARY)) return { ok: false, error: 'canary' };
  if (findLeak(all, forbidden)) return { ok: false, error: 'leak' };
  if (ctx.focusNode && ctx.focusNode.status !== 'valid' && PRAISE.test(all)) return { ok: false, error: 'praise_contradicts_validation' };
  return {
    ok: true,
    value: {
      source: 'ai',
      replyType: replyType as CoachResponse['replyType'],
      question: question.trim(),
      explanation: explanation.trim(),
      hint: hintText.trim() ? { level: hintLevel as DisclosureLevel, text: hintText.trim() } : null,
      relevantNodeIds: relevantNodeIds as string[],
      relevantElementIds: [],
      disclosureLevel: disclosureLevel as DisclosureLevel,
      misconception: { detected: misconception.detected, code: misconception.code, evidence: misconception.evidence, status: 'possible' },
    },
  };
}

/** Same guard for any system-authored text (fallback templates are checked too). */
export function isSafeText(text: string, forbidden: ForbiddenValue[]): boolean {
  return !findLeak(text, forbidden) && !text.includes(CANVAS_CANARY);
}
