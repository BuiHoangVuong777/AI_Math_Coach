/**
 * Cylinder-volume coaching session (PRODUCT_SPEC §9, scenes S1–S6).
 *
 * A pure reducer: every learner action is evaluated deterministically and
 * appended to an ordered evidence log. The UI store wraps this module; tests
 * drive it directly.
 */
import {
  MAIN_PROBLEM,
  TRANSFER_PROBLEM,
  baseAreaPiCoef,
  snapRadius,
  volumePiCoef,
  volumeRatio,
} from './math.ts';
import { foldVietnamese, nearlyEqual, parseAnswer } from './parse.ts';

export type Stage = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6';
export const STAGES: Stage[] = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

export type CalcStep = 'area' | 'volume' | 'ratio';
export type S4Step = 'experiment' | CalcStep;
export const CALC_STEPS: CalcStep[] = ['area', 'volume', 'ratio'];

export const MAX_HINT_LEVEL = 3;

export type Verdict = 'correct' | 'partial' | 'incorrect';
export type ReasonVerdict = 'sufficient' | 'partial' | 'insufficient_evidence';

/** Machine codes for feedback; Vietnamese wording lives in the lesson content. */
export type FeedbackCode =
  | 'ok'
  | 'invalid_number'
  | 'diameter_confusion'
  | 'wrong_value'
  | 'wrong_unit'
  | 'fixed_is_height'
  | 'target_is_ratio'
  | 'set_radius_to_4'
  | 'missing_pi'
  | 'use_exact_pi'
  | 'area_linear'
  | 'forgot_height'
  | 'volume_linear'
  | 'increase_vs_factor'
  | 'percent_vs_factor'
  | 'ratio_linear'
  | 'wrong_reason';

export interface AnalysisInput {
  r1: string;
  r2: string;
  h: string;
  unit: string;
  fixed: string;
  target: string;
}
export type AnalysisField = keyof AnalysisInput;

export type FigureChoice = 'radius' | 'diameter' | 'height';

export interface PredictionRecord {
  seq: number;
  raw: string;
  value: number | null;
  /** 'demo' marks the scripted "2 lần" input so it is never mistaken for real learner data (S3-AC-03). */
  source: 'learner' | 'demo';
  verdict: Verdict;
  /** A single answer is only ever a *possible* misconception (FR-COACH-004). */
  misconception: { code: 'linear_radius_volume'; status: 'possible' } | null;
}

export interface StepProgress {
  calcCorrect: boolean;
  reasonCorrect: boolean;
  hintLevel: number;
  calcAttempts: number;
  reasonAttempts: number;
  calcFeedback: FeedbackCode[] | null;
  reasonFeedback: FeedbackCode | null;
}

export interface TransferEvaluation {
  answerVerdict: 'correct' | 'incorrect' | 'unreadable';
  answerValue: number | null;
  reasonVerdict: ReasonVerdict;
  reasonSignals: string[];
  method: string;
  expectedFactor: number;
}

export type EvidenceEvent = { seq: number; at: number; stage: Stage } & (
  | { type: 'analysis_submitted'; input: AnalysisInput; fieldResults: Record<AnalysisField, FeedbackCode>; allCorrect: boolean }
  | { type: 'figure_answered'; choice: FigureChoice; correct: boolean }
  | { type: 'prediction_submitted'; prediction: PredictionRecord }
  | { type: 'radius_changed'; from: number; to: number }
  | { type: 'experiment_confirmed'; radius: number }
  | { type: 'hint_requested'; step: S4Step; level: number }
  | { type: 'calc_submitted'; step: CalcStep; inputs: string[]; verdict: Verdict; feedback: FeedbackCode[]; hintLevel: number }
  | { type: 'reason_submitted'; step: CalcStep; choice: string; correct: boolean; hintLevel: number }
  | { type: 'step_completed'; step: CalcStep }
  | { type: 'coach_exchange'; step: CalcStep; exchange: CoachExchange }
  | { type: 'transfer_submitted'; answerRaw: string; reasonRaw: string }
  | { type: 'transfer_evaluated'; evaluation: TransferEvaluation }
  | { type: 'session_completed' }
);

/**
 * One "Hỏi Coach" turn in S4. Recorded as evidence only: it never changes
 * grading, stage transitions or completion (those stay deterministic).
 * Kept in memory only, like the rest of the session.
 */
export interface CoachExchange {
  learnerText: string;
  source: 'ai' | 'fallback';
  replyType: string;
  /** Model/rule signal; always a *possible* misconception, never a diagnosis. */
  possibleMisconception: string | null;
  hintLevel: number;
}

/** Distributes Omit over the union so each event keeps its own fields. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type NewEvent = DistributiveOmit<EvidenceEvent, 'seq' | 'at' | 'stage'>;

export interface SessionState {
  stage: Stage;
  events: EvidenceEvent[];
  analysisFeedback: Record<AnalysisField, FeedbackCode> | null;
  figureFeedback: 'ok' | 'wrong' | null;
  predictionError: FeedbackCode | null;
  prediction: PredictionRecord | null;
  comparisonRadius: number;
  s4Step: S4Step;
  experimentFeedback: FeedbackCode | null;
  experimentHintLevel: number;
  steps: Record<CalcStep, StepProgress>;
  transfer: { answerRaw: string; reasonRaw: string } | null;
  transferError: FeedbackCode | null;
  transferEvaluation: TransferEvaluation | null;
}

export type SessionAction =
  | { type: 'SUBMIT_ANALYSIS'; input: AnalysisInput }
  | { type: 'ANSWER_FIGURE'; choice: FigureChoice }
  | { type: 'SUBMIT_PREDICTION'; raw: string; source: 'learner' | 'demo' }
  | { type: 'SET_RADIUS'; value: number }
  | { type: 'CONFIRM_EXPERIMENT' }
  | { type: 'REQUEST_HINT'; step: S4Step }
  | { type: 'SUBMIT_CALC'; step: CalcStep; inputs: string[] }
  | { type: 'SUBMIT_REASON'; step: CalcStep; choice: string }
  | { type: 'NEXT_STEP' }
  | { type: 'LOG_COACH_EXCHANGE'; step: CalcStep; exchange: Omit<CoachExchange, 'hintLevel'> }
  | { type: 'SUBMIT_TRANSFER'; answerRaw: string; reasonRaw: string }
  | { type: 'FINISH' }
  | { type: 'RESET' };

const emptyStep = (): StepProgress => ({
  calcCorrect: false,
  reasonCorrect: false,
  hintLevel: 0,
  calcAttempts: 0,
  reasonAttempts: 0,
  calcFeedback: null,
  reasonFeedback: null,
});

export function createInitialSession(): SessionState {
  return {
    stage: 'S1',
    events: [],
    analysisFeedback: null,
    figureFeedback: null,
    predictionError: null,
    prediction: null,
    comparisonRadius: MAIN_PROBLEM.r1,
    s4Step: 'experiment',
    experimentFeedback: null,
    experimentHintLevel: 0,
    steps: { area: emptyStep(), volume: emptyStep(), ratio: emptyStep() },
    transfer: null,
    transferError: null,
    transferEvaluation: null,
  };
}

function append(state: SessionState, event: NewEvent, now: number): SessionState {
  const full = { ...event, seq: state.events.length + 1, at: now, stage: state.stage } as EvidenceEvent;
  return { ...state, events: [...state.events, full] };
}

// ---------------------------------------------------------------- S1

function checkLength(raw: string, expected: number, field: 'r1' | 'r2' | 'h'): FeedbackCode {
  const parsed = parseAnswer(raw);
  if (parsed.kind !== 'number') return 'invalid_number';
  if (nearlyEqual(parsed.value, expected)) return 'ok';
  // Doubling a radius is the classic radius/diameter mix-up (S1-AC-02).
  if (field !== 'h' && nearlyEqual(parsed.value, expected * 2)) return 'diameter_confusion';
  return 'wrong_value';
}

export function evaluateAnalysis(input: AnalysisInput): Record<AnalysisField, FeedbackCode> {
  return {
    r1: checkLength(input.r1, MAIN_PROBLEM.r1, 'r1'),
    r2: checkLength(input.r2, MAIN_PROBLEM.r2, 'r2'),
    h: checkLength(input.h, MAIN_PROBLEM.h, 'h'),
    unit: input.unit === MAIN_PROBLEM.unit ? 'ok' : 'wrong_unit',
    fixed: input.fixed === 'height' ? 'ok' : 'fixed_is_height',
    target: input.target === 'volume_ratio' ? 'ok' : 'target_is_ratio',
  };
}

// ---------------------------------------------------------------- S3

export function evaluatePrediction(raw: string): Pick<PredictionRecord, 'value' | 'verdict' | 'misconception'> | null {
  const parsed = parseAnswer(raw);
  if (parsed.kind !== 'number' || parsed.value <= 0) return null;
  const expected = volumeRatio({ r: MAIN_PROBLEM.r1, h: MAIN_PROBLEM.h }, { r: MAIN_PROBLEM.r2, h: MAIN_PROBLEM.h });
  const radiusFactor = MAIN_PROBLEM.r2 / MAIN_PROBLEM.r1;
  if (nearlyEqual(parsed.value, expected)) return { value: parsed.value, verdict: 'correct', misconception: null };
  return {
    value: parsed.value,
    verdict: 'incorrect',
    misconception: nearlyEqual(parsed.value, radiusFactor)
      ? { code: 'linear_radius_volume', status: 'possible' }
      : null,
  };
}

// ---------------------------------------------------------------- S4

/** Expected exact answers for each calculation step, derived only from math.ts. */
export function expectedCalc(step: CalcStep): number[] {
  const before = { r: MAIN_PROBLEM.r1, h: MAIN_PROBLEM.h };
  const after = { r: MAIN_PROBLEM.r2, h: MAIN_PROBLEM.h };
  switch (step) {
    case 'area':
      return [baseAreaPiCoef(before.r), baseAreaPiCoef(after.r)];
    case 'volume':
      return [volumePiCoef(before), volumePiCoef(after)];
    case 'ratio':
      return [volumeRatio(before, after)];
  }
}

/** Correct option id of each "why" question (content in the lesson file). */
export const CORRECT_REASON: Record<CalcStep, string> = {
  area: 'square',
  volume: 'base_times_height',
  ratio: 'ratio_squared',
};

function evaluatePiValue(step: 'area' | 'volume', index: number, raw: string, expected: number): FeedbackCode {
  const parsed = parseAnswer(raw);
  if (parsed.kind === 'invalid') return 'invalid_number';
  if (parsed.kind === 'number') {
    if (nearlyEqual(parsed.value, expected)) return 'missing_pi';
    if (nearlyEqual(parsed.value, expected * Math.PI, expected * Math.PI * 0.01)) return 'use_exact_pi';
    return 'wrong_value';
  }
  if (nearlyEqual(parsed.coef, expected)) return 'ok';
  const r = index === 0 ? MAIN_PROBLEM.r1 : MAIN_PROBLEM.r2;
  if (step === 'area' && nearlyEqual(parsed.coef, 2 * r)) return 'area_linear';
  if (step === 'volume' && nearlyEqual(parsed.coef, baseAreaPiCoef(r))) return 'forgot_height';
  if (step === 'volume' && index === 1 && nearlyEqual(parsed.coef, 2 * volumePiCoef({ r: MAIN_PROBLEM.r1, h: MAIN_PROBLEM.h }))) {
    return 'volume_linear';
  }
  return 'wrong_value';
}

function evaluateRatio(raw: string, expected: number): FeedbackCode {
  const parsed = parseAnswer(raw);
  if (parsed.kind !== 'number') return 'invalid_number';
  if (nearlyEqual(parsed.value, expected)) return 'ok';
  if (nearlyEqual(parsed.value, expected - 1)) return 'increase_vs_factor';
  if (nearlyEqual(parsed.value, expected * 100) || nearlyEqual(parsed.value, (expected - 1) * 100)) return 'percent_vs_factor';
  if (nearlyEqual(parsed.value, MAIN_PROBLEM.r2 / MAIN_PROBLEM.r1)) return 'ratio_linear';
  return 'wrong_value';
}

export function evaluateCalc(step: CalcStep, inputs: string[]): { verdict: Verdict; feedback: FeedbackCode[] } {
  const expected = expectedCalc(step);
  const feedback = expected.map((value, i) =>
    step === 'ratio' ? evaluateRatio(inputs[i] ?? '', value) : evaluatePiValue(step, i, inputs[i] ?? '', value),
  );
  const okCount = feedback.filter((f) => f === 'ok').length;
  const verdict: Verdict = okCount === feedback.length ? 'correct' : okCount > 0 ? 'partial' : 'incorrect';
  return { verdict, feedback };
}

const NEXT_S4_STEP: Record<S4Step, S4Step | null> = {
  experiment: 'area',
  area: 'volume',
  volume: 'ratio',
  ratio: null,
};

export function isStepComplete(state: SessionState, step: S4Step): boolean {
  if (step === 'experiment') return state.events.some((e) => e.type === 'experiment_confirmed');
  return state.steps[step].calcCorrect && state.steps[step].reasonCorrect;
}

// ---------------------------------------------------------------- S5

export function evaluateTransfer(answerRaw: string, reasonRaw: string): TransferEvaluation {
  const before = { r: TRANSFER_PROBLEM.r1, h: TRANSFER_PROBLEM.h };
  const after = { r: TRANSFER_PROBLEM.r2, h: TRANSFER_PROBLEM.h };
  const expectedFactor = volumeRatio(before, after);
  const radiusFactor = TRANSFER_PROBLEM.r2 / TRANSFER_PROBLEM.r1;

  const parsed = parseAnswer(answerRaw);
  const answerValue = parsed.kind === 'number' ? parsed.value : null;
  const answerVerdict =
    answerValue === null ? 'unreadable' : nearlyEqual(answerValue, expectedFactor) ? 'correct' : 'incorrect';

  // Reasoning is free text; its automatic check is a transparent keyword rule,
  // never an "incorrect" verdict (FR-EVAL-006). The rubric accepts both methods
  // in §9.6: squared radius ratio with fixed height, or the two exact volumes.
  const text = foldVietnamese(reasonRaw).replace(/\s+/g, ' ');
  const compact = text.replace(/\s+/g, '');
  const v1 = volumePiCoef(before);
  const v2 = volumePiCoef(after);
  const signals: string[] = [];
  const squared = /binhphuong|\^2|²|3[x×*·.]3/.test(compact);
  const radiusRatio = new RegExp(`${TRANSFER_PROBLEM.r2}/${TRANSFER_PROBLEM.r1}|gap${radiusFactor}|tang${radiusFactor}lan|${radiusFactor}lan|tiso|tyso`).test(compact);
  const fixedHeight = /chieu cao|\bh\b|khong doi|giu nguyen/.test(text);
  const volumes = compact.includes(String(v1)) && compact.includes(String(v2));
  if (squared) signals.push('squared');
  if (radiusRatio) signals.push('radius_ratio');
  if (fixedHeight) signals.push('fixed_height');
  if (volumes) signals.push('two_volumes');

  const reasonVerdict: ReasonVerdict =
    volumes || (squared && radiusRatio && fixedHeight)
      ? 'sufficient'
      : signals.length > 0
        ? 'partial'
        : 'insufficient_evidence';

  return {
    answerVerdict,
    answerValue,
    reasonVerdict,
    reasonSignals: signals,
    method: `Tính xác định: V₂/V₁ = (r₂/r₁)² = (${TRANSFER_PROBLEM.r2}/${TRANSFER_PROBLEM.r1})² = ${expectedFactor}; kiểm tra chéo ${v2}π/${v1}π = ${v2 / v1}.`,
    expectedFactor,
  };
}

// ---------------------------------------------------------------- reducer

export function sessionReducer(state: SessionState, action: SessionAction, now: number = Date.now()): SessionState {
  switch (action.type) {
    case 'SUBMIT_ANALYSIS': {
      if (state.stage !== 'S1') return state;
      const fieldResults = evaluateAnalysis(action.input);
      const allCorrect = Object.values(fieldResults).every((f) => f === 'ok');
      const next = append(state, { type: 'analysis_submitted', input: action.input, fieldResults, allCorrect }, now);
      return { ...next, analysisFeedback: fieldResults, stage: allCorrect ? 'S2' : 'S1' };
    }

    case 'ANSWER_FIGURE': {
      if (state.stage !== 'S2') return state;
      const correct = action.choice === 'radius';
      const next = append(state, { type: 'figure_answered', choice: action.choice, correct }, now);
      return { ...next, figureFeedback: correct ? 'ok' : 'wrong', stage: correct ? 'S3' : 'S2' };
    }

    case 'SUBMIT_PREDICTION': {
      // A prediction is recorded once and never overwritten (S3-AC-01).
      if (state.stage !== 'S3' || state.prediction) return state;
      const evaluated = evaluatePrediction(action.raw);
      if (!evaluated) return { ...state, predictionError: 'invalid_number' };
      const prediction: PredictionRecord = {
        seq: state.events.length + 1,
        raw: action.raw.trim(),
        source: action.source,
        ...evaluated,
      };
      const next = append(state, { type: 'prediction_submitted', prediction }, now);
      return { ...next, prediction, predictionError: null, stage: 'S4' };
    }

    case 'SET_RADIUS': {
      // The slider is locked before the prediction and during S5/S6 (S2-AC-03).
      if (state.stage !== 'S4') return state;
      const to = snapRadius(action.value);
      if (to === state.comparisonRadius) return state;
      const next = append(state, { type: 'radius_changed', from: state.comparisonRadius, to }, now);
      return { ...next, comparisonRadius: to };
    }

    case 'CONFIRM_EXPERIMENT': {
      if (state.stage !== 'S4' || state.s4Step !== 'experiment' || isStepComplete(state, 'experiment')) return state;
      if (state.comparisonRadius !== MAIN_PROBLEM.r2) return { ...state, experimentFeedback: 'set_radius_to_4' };
      const next = append(state, { type: 'experiment_confirmed', radius: state.comparisonRadius }, now);
      return { ...next, experimentFeedback: 'ok' };
    }

    case 'REQUEST_HINT': {
      if (state.stage !== 'S4' || state.s4Step !== action.step) return state;
      if (action.step === 'experiment') {
        const level = Math.min(MAX_HINT_LEVEL, state.experimentHintLevel + 1);
        if (level === state.experimentHintLevel) return state;
        const next = append(state, { type: 'hint_requested', step: action.step, level }, now);
        return { ...next, experimentHintLevel: level };
      }
      const current = state.steps[action.step];
      const level = Math.min(MAX_HINT_LEVEL, current.hintLevel + 1);
      if (level === current.hintLevel) return state;
      const next = append(state, { type: 'hint_requested', step: action.step, level }, now);
      return { ...next, steps: { ...state.steps, [action.step]: { ...current, hintLevel: level } } };
    }

    case 'SUBMIT_CALC': {
      if (state.stage !== 'S4' || state.s4Step !== action.step) return state;
      const current = state.steps[action.step];
      if (current.calcCorrect) return state;
      const { verdict, feedback } = evaluateCalc(action.step, action.inputs);
      const next = append(
        state,
        { type: 'calc_submitted', step: action.step, inputs: action.inputs, verdict, feedback, hintLevel: current.hintLevel },
        now,
      );
      return {
        ...next,
        steps: {
          ...state.steps,
          [action.step]: {
            ...current,
            calcCorrect: verdict === 'correct',
            calcAttempts: current.calcAttempts + 1,
            calcFeedback: feedback,
          },
        },
      };
    }

    case 'SUBMIT_REASON': {
      if (state.stage !== 'S4' || state.s4Step !== action.step) return state;
      const current = state.steps[action.step];
      // The "why" check opens only after the learner's own calculation (S4-AC-04).
      if (!current.calcCorrect || current.reasonCorrect) return state;
      const correct = action.choice === CORRECT_REASON[action.step];
      let next = append(
        state,
        { type: 'reason_submitted', step: action.step, choice: action.choice, correct, hintLevel: current.hintLevel },
        now,
      );
      if (correct) next = append(next, { type: 'step_completed', step: action.step }, now);
      return {
        ...next,
        steps: {
          ...state.steps,
          [action.step]: {
            ...current,
            reasonCorrect: correct,
            reasonAttempts: current.reasonAttempts + 1,
            reasonFeedback: correct ? 'ok' : 'wrong_reason',
          },
        },
      };
    }

    case 'LOG_COACH_EXCHANGE': {
      if (state.stage !== 'S4' || state.s4Step !== action.step) return state;
      const exchange: CoachExchange = { ...action.exchange, hintLevel: state.steps[action.step].hintLevel };
      return append(state, { type: 'coach_exchange', step: action.step, exchange }, now);
    }

    case 'NEXT_STEP': {
      if (state.stage !== 'S4' || !isStepComplete(state, state.s4Step)) return state;
      const following = NEXT_S4_STEP[state.s4Step];
      return following ? { ...state, s4Step: following } : { ...state, stage: 'S5' };
    }

    case 'SUBMIT_TRANSFER': {
      // Submitted once; stored verbatim before it is evaluated (S5-AC-01, FR-REC-002).
      if (state.stage !== 'S5' || state.transfer) return state;
      if (!action.answerRaw.trim()) return { ...state, transferError: 'invalid_number' };
      const transfer = { answerRaw: action.answerRaw, reasonRaw: action.reasonRaw };
      let next = append(state, { type: 'transfer_submitted', ...transfer }, now);
      next = { ...next, transfer, transferError: null };
      const evaluation = evaluateTransfer(transfer.answerRaw, transfer.reasonRaw);
      next = append(next, { type: 'transfer_evaluated', evaluation }, now);
      return { ...next, transferEvaluation: evaluation };
    }

    case 'FINISH': {
      if (state.stage !== 'S5' || !state.transferEvaluation) return state;
      const next = append(state, { type: 'session_completed' }, now);
      return { ...next, stage: 'S6' };
    }

    case 'RESET':
      return createInitialSession();
  }
}

// ---------------------------------------------------------------- S6

export interface SummaryItem {
  id: string;
  label: string;
  /** null renders as "chưa có bằng chứng" (FR-EVID-002). */
  value: string | null;
  /** Evidence-log sequence numbers this line is traced to (FR-EVID-001). */
  sources: number[];
}

const HINT_STEP_LABEL: Record<S4Step, string> = {
  experiment: 'thử nghiệm',
  area: 'diện tích đáy',
  volume: 'thể tích',
  ratio: 'hệ số tăng',
};

const REASON_LABEL: Record<ReasonVerdict, string> = {
  sufficient: 'đủ bằng chứng theo quy tắc chấm',
  partial: 'một phần / chưa đủ bằng chứng',
  insufficient_evidence: 'chưa có bằng chứng',
};

export function buildSummary(state: SessionState): SummaryItem[] {
  const ev = state.events;
  const items: SummaryItem[] = [];

  const analysis = ev.filter((e) => e.type === 'analysis_submitted');
  items.push({
    id: 'analysis',
    label: 'Hiểu đề (S1)',
    value: analysis.some((e) => e.type === 'analysis_submitted' && e.allCorrect)
      ? `Xác định đúng dữ kiện sau ${analysis.length} lần gửi`
      : null,
    sources: analysis.map((e) => e.seq),
  });

  const pred = state.prediction;
  items.push({
    id: 'prediction',
    label: 'Dự đoán ban đầu (S3)',
    value: pred
      ? `"${pred.raw}" — ${pred.verdict === 'correct' ? 'khớp kết quả' : 'chưa khớp kết quả'}` +
        (pred.misconception ? ' · dấu hiệu hiểu lầm có thể có: bán kính và thể tích tăng cùng tỷ lệ' : '') +
        (pred.source === 'demo' ? ' · (dự đoán minh họa của demo, không phải dữ liệu học sinh thật)' : '')
      : null,
    sources: pred ? [pred.seq] : [],
  });

  const radiusEvents = ev.filter((e) => e.type === 'radius_changed');
  const lastRadius = radiusEvents[radiusEvents.length - 1];
  items.push({
    id: 'radius',
    label: 'Thao tác bán kính (S4)',
    value:
      radiusEvents.length && lastRadius?.type === 'radius_changed'
        ? `Từ ${MAIN_PROBLEM.r1} cm đến ${lastRadius.to} cm sau ${radiusEvents.length} lần thay đổi; chiều cao giữ ${MAIN_PROBLEM.h} cm`
        : null,
    sources: radiusEvents.map((e) => e.seq),
  });

  for (const step of CALC_STEPS) {
    const calcs = ev.filter((e) => e.type === 'calc_submitted' && e.step === step);
    const reasons = ev.filter((e) => e.type === 'reason_submitted' && e.step === step);
    const progress = state.steps[step];
    const lastCalc = calcs[calcs.length - 1];
    items.push({
      id: `step-${step}`,
      label: `Bước ${HINT_STEP_LABEL[step]} (S4)`,
      value: calcs.length
        ? `Phép tính: ${progress.calcCorrect ? 'đúng' : 'chưa đúng'} sau ${calcs.length} lần` +
          (lastCalc?.type === 'calc_submitted' ? ` (lần cuối: ${lastCalc.inputs.join('; ')})` : '') +
          ` · Lý do: ${progress.reasonCorrect ? 'đúng' : reasons.length ? 'chưa đúng' : 'chưa trả lời'}` +
          (reasons.length ? ` sau ${reasons.length} lần` : '')
        : null,
      sources: [...calcs, ...reasons].map((e) => e.seq).sort((a, b) => a - b),
    });
  }

  const hints = ev.filter((e) => e.type === 'hint_requested');
  const maxLevelByStep = new Map<S4Step, number>();
  for (const h of hints) {
    if (h.type === 'hint_requested') maxLevelByStep.set(h.step, Math.max(maxLevelByStep.get(h.step) ?? 0, h.level));
  }
  items.push({
    id: 'hints',
    label: 'Gợi ý đã dùng (S4)',
    value: hints.length
      ? [...maxLevelByStep].map(([step, level]) => `${HINT_STEP_LABEL[step]}: mức ${level}`).join(' · ')
      : 'Không dùng gợi ý',
    sources: hints.map((e) => e.seq),
  });

  const exchanges = ev.filter((e) => e.type === 'coach_exchange');
  const aiCount = exchanges.filter((e) => e.type === 'coach_exchange' && e.exchange.source === 'ai').length;
  const signals = [
    ...new Set(
      exchanges.flatMap((e) => (e.type === 'coach_exchange' && e.exchange.possibleMisconception ? [e.exchange.possibleMisconception] : [])),
    ),
  ];
  items.push({
    id: 'coach',
    label: 'Trao đổi với Coach (S4)',
    value: exchanges.length
      ? `${exchanges.length} lượt (AI: ${aiCount}, cơ bản: ${exchanges.length - aiCount})` +
        (signals.length ? ` · dấu hiệu hiểu lầm có thể có: ${signals.join(', ')}` : '')
      : 'Không dùng',
    sources: exchanges.map((e) => e.seq),
  });

  const submitted = ev.find((e) => e.type === 'transfer_submitted');
  const evaluated = ev.find((e) => e.type === 'transfer_evaluated');
  const evaluation = state.transferEvaluation;
  items.push({
    id: 'transfer-answer',
    label: 'Bài độc lập — đáp án (S5)',
    value:
      evaluation && state.transfer
        ? `"${state.transfer.answerRaw.trim()}" — ${
            evaluation.answerVerdict === 'correct' ? 'đúng' : evaluation.answerVerdict === 'incorrect' ? 'chưa đúng' : 'không đọc được số'
          } (kiểm chứng: gấp ${evaluation.expectedFactor} lần)`
        : null,
    sources: [submitted?.seq, evaluated?.seq].filter((s): s is number => s !== undefined),
  });
  items.push({
    id: 'transfer-reason',
    label: 'Bài độc lập — lập luận (S5)',
    value: evaluation ? REASON_LABEL[evaluation.reasonVerdict] : null,
    sources: [submitted?.seq, evaluated?.seq].filter((s): s is number => s !== undefined),
  });

  return items;
}

/** Fixed limitation statement shown with every summary (S6-AC-03, FR-EVAL-005). */
export const SUMMARY_LIMITATION =
  'Tóm tắt này chỉ phản ánh bằng chứng quan sát được trong phiên học này. Nó không khẳng định em đã thành thạo hay sẽ ghi nhớ lâu dài.';
