/**
 * Contract between the S4 "Hỏi Coach" panel, the /api/coach server and the
 * language model. Pure and shared by browser and server.
 *
 * The model is never the mathematical source of truth: it only produces
 * coaching text. Grading, stage transitions and completion stay in
 * session.ts. Every model reply is validated here before it is rendered,
 * including a deterministic guard that rejects replies revealing a canonical
 * answer the learner has not solved yet.
 */
import { CYLINDER_LESSON } from '../../data/lessons/cylinderLesson.ts';
import { MAIN_PROBLEM, baseAreaPiCoef, volumePiCoef, volumeRatio } from './math.ts';
import { CALC_STEPS, type CalcStep, type FeedbackCode, MAX_HINT_LEVEL } from './session.ts';

// ---------------------------------------------------------------- request

export const LEARNER_MESSAGE_MAX = 500;
const ATTEMPT_INPUT_MAX = 40;
const PREDICTION_MAX = 40;

const FEEDBACK_CODES: readonly FeedbackCode[] = [
  'ok', 'invalid_number', 'diameter_confusion', 'wrong_value', 'wrong_unit', 'fixed_is_height',
  'target_is_ratio', 'set_radius_to_4', 'missing_pi', 'use_exact_pi', 'area_linear', 'forgot_height',
  'volume_linear', 'increase_vs_factor', 'percent_vs_factor', 'ratio_linear', 'wrong_reason',
];

/** The minimum the coach needs; no names, ids or session history beyond the current step. */
export interface CoachRequest {
  step: CalcStep;
  learnerMessage: string;
  hintLevel: number;
  /** Steps whose calculation the learner has already solved (their values are revealed). */
  solvedSteps: CalcStep[];
  /** Whether the learner has also answered this step's "why" question correctly. */
  stepReasonCorrect: boolean;
  lastAttempt: { inputs: string[]; feedback: FeedbackCode[] } | null;
  prediction: string | null;
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isCalcStep = (v: unknown): v is CalcStep => typeof v === 'string' && (CALC_STEPS as string[]).includes(v);

function exactKeys(obj: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(obj);
  return actual.length === keys.length && keys.every((k) => k in obj);
}

export function validateCoachRequest(body: unknown): Result<CoachRequest> {
  if (!isObject(body)) return { ok: false, error: 'body must be an object' };
  const keys = ['step', 'learnerMessage', 'hintLevel', 'solvedSteps', 'stepReasonCorrect', 'lastAttempt', 'prediction'];
  if (!exactKeys(body, keys)) return { ok: false, error: `body must have exactly: ${keys.join(', ')}` };

  const { step, learnerMessage, hintLevel, solvedSteps, stepReasonCorrect, lastAttempt, prediction } = body;
  if (!isCalcStep(step)) return { ok: false, error: 'invalid step' };
  if (typeof learnerMessage !== 'string') return { ok: false, error: 'learnerMessage must be a string' };
  const message = learnerMessage.trim();
  if (!message || message.length > LEARNER_MESSAGE_MAX) {
    return { ok: false, error: `learnerMessage must be 1–${LEARNER_MESSAGE_MAX} characters` };
  }
  if (!Number.isInteger(hintLevel) || (hintLevel as number) < 0 || (hintLevel as number) > MAX_HINT_LEVEL) {
    return { ok: false, error: 'invalid hintLevel' };
  }
  if (!Array.isArray(solvedSteps) || !solvedSteps.every(isCalcStep) || new Set(solvedSteps).size !== solvedSteps.length) {
    return { ok: false, error: 'invalid solvedSteps' };
  }
  if (typeof stepReasonCorrect !== 'boolean') return { ok: false, error: 'invalid stepReasonCorrect' };

  let attempt: CoachRequest['lastAttempt'] = null;
  if (lastAttempt !== null) {
    if (!isObject(lastAttempt) || !exactKeys(lastAttempt, ['inputs', 'feedback'])) return { ok: false, error: 'invalid lastAttempt' };
    const { inputs, feedback } = lastAttempt;
    if (
      !Array.isArray(inputs) || inputs.length > 2 ||
      !inputs.every((i) => typeof i === 'string' && i.length <= ATTEMPT_INPUT_MAX) ||
      !Array.isArray(feedback) || feedback.length > 2 ||
      !feedback.every((f) => (FEEDBACK_CODES as unknown[]).includes(f))
    ) {
      return { ok: false, error: 'invalid lastAttempt' };
    }
    attempt = { inputs: inputs as string[], feedback: feedback as FeedbackCode[] };
  }
  if (prediction !== null && (typeof prediction !== 'string' || prediction.length > PREDICTION_MAX)) {
    return { ok: false, error: 'invalid prediction' };
  }

  return {
    ok: true,
    value: {
      step,
      learnerMessage: message,
      hintLevel: hintLevel as number,
      solvedSteps: solvedSteps as CalcStep[],
      stepReasonCorrect,
      lastAttempt: attempt,
      prediction: prediction as string | null,
    },
  };
}

// ---------------------------------------------------------------- reply

export const REPLY_TYPES = ['socratic_question', 'hint', 'feedback', 'explanation'] as const;
export const MISCONCEPTION_CODES = [
  'none', 'radius_diameter', 'linear_scaling', 'area_linear', 'forgot_height', 'missing_pi', 'increase_vs_factor', 'other',
] as const;
export type ReplyType = (typeof REPLY_TYPES)[number];
export type MisconceptionCode = (typeof MISCONCEPTION_CODES)[number];

export interface CoachReply {
  replyType: ReplyType;
  /** Main Vietnamese coaching text. */
  message: string;
  /** Optional Socratic follow-up question ('' when none). */
  question: string;
  /** Always a *possible* misconception (FR-COACH-004); never a diagnosis. */
  misconception: { detected: boolean; code: MisconceptionCode; evidence: string };
}

export const REPLY_LIMITS = { message: 700, question: 300, evidence: 200 } as const;

/** JSON Schema for OpenAI Structured Outputs (strict mode: all keys required, no extras). */
export const COACH_REPLY_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['replyType', 'message', 'question', 'misconception'],
  properties: {
    replyType: { type: 'string', enum: [...REPLY_TYPES] },
    message: { type: 'string', description: 'Vietnamese coaching text for a 11–15 year old learner.' },
    question: { type: 'string', description: 'One Socratic follow-up question in Vietnamese, or empty string.' },
    misconception: {
      type: 'object',
      additionalProperties: false,
      required: ['detected', 'code', 'evidence'],
      properties: {
        detected: { type: 'boolean' },
        code: { type: 'string', enum: [...MISCONCEPTION_CODES] },
        evidence: { type: 'string', description: 'Short quote or paraphrase of what suggests it, or empty string.' },
      },
    },
  },
} as const;

/** Marker placed in the hidden instructions; a reply containing it is rejected as a prompt leak. */
export const INSTRUCTION_CANARY = 'COACH-INSTR-7F3A';

function normalizeForGuard(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/pi/g, 'π')
    .replace(/[·*×]/g, '')
    .replace(/,/g, '.');
}

/**
 * Deterministic answer-leak patterns, derived from math.ts. A step's final
 * values stay forbidden until the learner has solved that step's calculation.
 */
export function forbiddenRevealPatterns(solvedSteps: readonly CalcStep[]): { step: CalcStep; pattern: RegExp }[] {
  const before = { r: MAIN_PROBLEM.r1, h: MAIN_PROBLEM.h };
  const after = { r: MAIN_PROBLEM.r2, h: MAIN_PROBLEM.h };
  const piValue = (coef: number) => new RegExp(`(?<![\\d.])${coef}π`);
  const ratio = volumeRatio(before, after);
  const patterns: { step: CalcStep; pattern: RegExp }[] = [];
  if (!solvedSteps.includes('area')) {
    patterns.push({ step: 'area', pattern: piValue(baseAreaPiCoef(before.r)) }, { step: 'area', pattern: piValue(baseAreaPiCoef(after.r)) });
  }
  if (!solvedSteps.includes('volume')) {
    patterns.push({ step: 'volume', pattern: piValue(volumePiCoef(before)) }, { step: 'volume', pattern: piValue(volumePiCoef(after)) });
  }
  if (!solvedSteps.includes('ratio')) {
    patterns.push(
      { step: 'ratio', pattern: new RegExp(`gấp${ratio}(?![\\d.])`) },
      { step: 'ratio', pattern: new RegExp(`(?<![\\d.²^])${ratio}lần`) },
      { step: 'ratio', pattern: new RegExp(`v(₂|2)/v(₁|1)=${ratio}(?![\\d.])`) },
    );
  }
  return patterns;
}

export function findAnswerLeak(text: string, solvedSteps: readonly CalcStep[]): CalcStep | null {
  const normalized = normalizeForGuard(text);
  return forbiddenRevealPatterns(solvedSteps).find(({ pattern }) => pattern.test(normalized))?.step ?? null;
}

const asText = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.length <= max ? v.trim() : null;

export function validateCoachReply(raw: unknown, solvedSteps: readonly CalcStep[]): Result<CoachReply> {
  if (!isObject(raw) || !exactKeys(raw, ['replyType', 'message', 'question', 'misconception'])) {
    return { ok: false, error: 'reply shape' };
  }
  const replyType = raw.replyType;
  if (typeof replyType !== 'string' || !(REPLY_TYPES as readonly string[]).includes(replyType)) {
    return { ok: false, error: 'replyType' };
  }
  const message = asText(raw.message, REPLY_LIMITS.message);
  const question = asText(raw.question, REPLY_LIMITS.question);
  if (!message) return { ok: false, error: 'message' };
  if (question === null) return { ok: false, error: 'question' };

  const m = raw.misconception;
  if (!isObject(m) || !exactKeys(m, ['detected', 'code', 'evidence'])) return { ok: false, error: 'misconception shape' };
  const code = m.code;
  const evidence = asText(m.evidence, REPLY_LIMITS.evidence);
  if (typeof m.detected !== 'boolean' || typeof code !== 'string' || !(MISCONCEPTION_CODES as readonly string[]).includes(code) || evidence === null) {
    return { ok: false, error: 'misconception fields' };
  }
  if (m.detected !== (code !== 'none')) return { ok: false, error: 'misconception detected/code mismatch' };

  const visible = `${message}\n${question}\n${evidence}`;
  if (visible.includes(INSTRUCTION_CANARY)) return { ok: false, error: 'instruction leak' };
  const leak = findAnswerLeak(visible, solvedSteps);
  if (leak) return { ok: false, error: `reveals unsolved ${leak} answer` };

  return {
    ok: true,
    value: {
      replyType: replyType as ReplyType,
      message,
      question,
      misconception: { detected: m.detected, code: code as MisconceptionCode, evidence },
    },
  };
}

// ---------------------------------------------------------------- server response

export type CoachErrorCode =
  | 'invalid_request'
  | 'payload_too_large'
  | 'unsupported_media_type'
  | 'rate_limited'
  | 'ai_not_configured'
  | 'ai_timeout'
  | 'ai_error'
  | 'invalid_model_output'
  | 'not_found';

export type CoachApiResponse = { source: 'ai'; model: string; reply: CoachReply } | { error: { code: CoachErrorCode } };

// ---------------------------------------------------------------- deterministic fallback

const MISCONCEPTION_BY_FEEDBACK: Partial<Record<FeedbackCode, MisconceptionCode>> = {
  diameter_confusion: 'radius_diameter',
  area_linear: 'area_linear',
  forgot_height: 'forgot_height',
  missing_pi: 'missing_pi',
  volume_linear: 'linear_scaling',
  ratio_linear: 'linear_scaling',
  increase_vs_factor: 'increase_vs_factor',
  percent_vs_factor: 'increase_vs_factor',
};

/**
 * The pre-existing rule-based coaching, used whenever the AI is unavailable,
 * slow or returns an invalid reply. Built only from approved lesson content.
 */
export function buildFallbackReply(req: Pick<CoachRequest, 'step' | 'hintLevel' | 'solvedSteps' | 'stepReasonCorrect' | 'lastAttempt'>): CoachReply {
  const content = CYLINDER_LESSON.steps[req.step];
  const none = { detected: false, code: 'none' as MisconceptionCode, evidence: '' };
  const calcSolved = req.solvedSteps.includes(req.step);

  if (calcSolved && req.stepReasonCorrect) {
    return { replyType: 'explanation', message: `${content.what} ${content.why}`, question: '', misconception: none };
  }
  if (calcSolved) {
    return { replyType: 'socratic_question', message: CYLINDER_LESSON.coach.reasonPending, question: content.reasonQuestion, misconception: none };
  }

  const firstError = req.lastAttempt?.feedback.find((f) => f !== 'ok');
  if (firstError) {
    const mapped = MISCONCEPTION_BY_FEEDBACK[firstError];
    return {
      replyType: 'feedback',
      message: CYLINDER_LESSON.calcFeedback[firstError] ?? CYLINDER_LESSON.calcFeedback.wrong_value ?? '',
      question: content.socratic,
      misconception: mapped ? { detected: true, code: mapped, evidence: '' } : none,
    };
  }

  const hintIndex = Math.min(Math.max(req.hintLevel, 1), content.hints.length) - 1;
  return { replyType: 'hint', message: content.hints[hintIndex], question: content.socratic, misconception: none };
}
