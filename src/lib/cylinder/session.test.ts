import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  type SessionAction,
  type SessionState,
  buildSummary,
  createInitialSession,
  evaluateTransfer,
  sessionReducer,
} from './session.ts';
import { CYLINDER_LESSON } from '../../data/lessons/cylinderLesson.ts';

const CORRECT_ANALYSIS = { r1: '2', r2: '4', h: '5', unit: 'cm', fixed: 'height', target: 'volume_ratio' };

function run(actions: SessionAction[], from: SessionState = createInitialSession()): SessionState {
  return actions.reduce((s, a, i) => sessionReducer(s, a, 1_000 + i), from);
}

function toS4WithDemoPrediction(): SessionState {
  return run([
    { type: 'SUBMIT_ANALYSIS', input: CORRECT_ANALYSIS },
    { type: 'ANSWER_FIGURE', choice: 'radius' },
    { type: 'SUBMIT_PREDICTION', raw: '2', source: 'demo' },
  ]);
}

test('S1: diameter confusion is flagged and the learner cannot leave S1 (S1-AC-01/02)', () => {
  const s = run([{ type: 'SUBMIT_ANALYSIS', input: { ...CORRECT_ANALYSIS, r2: '8' } }]);
  assert.equal(s.stage, 'S1');
  assert.equal(s.analysisFeedback?.r2, 'diameter_confusion');
  const fixed = run([{ type: 'SUBMIT_ANALYSIS', input: CORRECT_ANALYSIS }], s);
  assert.equal(fixed.stage, 'S2');
  assert.equal(fixed.events.filter((e) => e.type === 'analysis_submitted').length, 2);
});

test('S2–S3: slider is locked until a prediction is stored (S2-AC-03, FR-PRED-001)', () => {
  let s = run([{ type: 'SUBMIT_ANALYSIS', input: CORRECT_ANALYSIS }]);
  s = run([{ type: 'SET_RADIUS', value: 4 }], s);
  assert.equal(s.comparisonRadius, 2, 'radius must not change in S2');
  s = run([{ type: 'ANSWER_FIGURE', choice: 'diameter' }], s);
  assert.equal(s.stage, 'S2');
  s = run([{ type: 'ANSWER_FIGURE', choice: 'radius' }, { type: 'SET_RADIUS', value: 4 }], s);
  assert.equal(s.stage, 'S3');
  assert.equal(s.comparisonRadius, 2, 'radius must not change in S3');
});

test('S3: invalid prediction is rejected without a record; "2" is stored verbatim as a possible misconception', () => {
  let s = run([
    { type: 'SUBMIT_ANALYSIS', input: CORRECT_ANALYSIS },
    { type: 'ANSWER_FIGURE', choice: 'radius' },
    { type: 'SUBMIT_PREDICTION', raw: 'không biết', source: 'learner' },
  ]);
  assert.equal(s.stage, 'S3');
  assert.equal(s.prediction, null);
  assert.equal(s.predictionError, 'invalid_number');

  s = run([{ type: 'SUBMIT_PREDICTION', raw: 'gấp 2 lần', source: 'learner' }], s);
  assert.equal(s.stage, 'S4');
  assert.equal(s.prediction?.raw, 'gấp 2 lần');
  assert.equal(s.prediction?.verdict, 'incorrect');
  assert.deepEqual(s.prediction?.misconception, { code: 'linear_radius_volume', status: 'possible' });

  // A second submission cannot overwrite the stored prediction (S3-AC-01).
  const again = run([{ type: 'SUBMIT_PREDICTION', raw: '4', source: 'learner' }], s);
  assert.equal(again.prediction?.raw, 'gấp 2 lần');
});

test('S4: prediction is logged before the first radius change (S3-AC-01)', () => {
  const s = run([{ type: 'SET_RADIUS', value: 3 }, { type: 'SET_RADIUS', value: 4 }], toS4WithDemoPrediction());
  const predSeq = s.events.find((e) => e.type === 'prediction_submitted')!.seq;
  const firstRadius = s.events.find((e) => e.type === 'radius_changed')!.seq;
  assert.ok(predSeq < firstRadius);
  assert.equal(s.comparisonRadius, 4);
});

test('S4: step order and gating — no step result before the learner attempts it (S4-AC-04)', () => {
  let s = toS4WithDemoPrediction();
  s = run([{ type: 'CONFIRM_EXPERIMENT' }], s);
  assert.equal(s.experimentFeedback, 'set_radius_to_4');
  s = run([{ type: 'SUBMIT_CALC', step: 'area', inputs: ['4π', '16π'] }], s);
  assert.equal(s.steps.area.calcAttempts, 0, 'cannot answer area before experiment');

  s = run([{ type: 'SET_RADIUS', value: 4 }, { type: 'CONFIRM_EXPERIMENT' }, { type: 'NEXT_STEP' }], s);
  assert.equal(s.s4Step, 'area');
  // "Why" is only accepted after the calculation is correct.
  s = run([{ type: 'SUBMIT_REASON', step: 'area', choice: 'square' }], s);
  assert.equal(s.steps.area.reasonAttempts, 0);
  // NEXT_STEP is refused until both parts are correct.
  s = run([{ type: 'NEXT_STEP' }], s);
  assert.equal(s.s4Step, 'area');
});

test('S4: targeted feedback for common errors', () => {
  let s = run([{ type: 'SET_RADIUS', value: 4 }, { type: 'CONFIRM_EXPERIMENT' }, { type: 'NEXT_STEP' }], toS4WithDemoPrediction());
  s = run([{ type: 'SUBMIT_CALC', step: 'area', inputs: ['4', '8π'] }], s);
  assert.deepEqual(s.steps.area.calcFeedback, ['missing_pi', 'area_linear']);
  s = run([{ type: 'SUBMIT_CALC', step: 'area', inputs: ['12.57', '16π'] }], s);
  assert.deepEqual(s.steps.area.calcFeedback, ['use_exact_pi', 'ok']);
  assert.equal(s.steps.area.calcCorrect, false);
});

test('hints escalate one level at a time, are logged, and level 1 never reveals the step answer (J-AC-07)', () => {
  let s = run([{ type: 'SET_RADIUS', value: 4 }, { type: 'CONFIRM_EXPERIMENT' }, { type: 'NEXT_STEP' }], toS4WithDemoPrediction());
  s = run([{ type: 'SUBMIT_CALC', step: 'area', inputs: ['8π', '8π'] }], s);
  s = run(Array.from({ length: 5 }, () => ({ type: 'REQUEST_HINT', step: 'area' }) as SessionAction), s);
  assert.equal(s.steps.area.hintLevel, 3);
  assert.equal(s.events.filter((e) => e.type === 'hint_requested').length, 3);

  const answers: Record<string, string[]> = { area: ['4π', '16π'], volume: ['20π', '80π'], ratio: ['gấp 4', '= 4'] };
  for (const step of ['area', 'volume', 'ratio'] as const) {
    const hint1 = CYLINDER_LESSON.steps[step].hints[0];
    for (const answer of answers[step]) assert.ok(!hint1.includes(answer), `${step} hint 1 leaks ${answer}`);
  }
});

test('happy path S1 → S6 with the demo prediction and a correct independent answer', () => {
  let s = toS4WithDemoPrediction();
  s = run(
    [
      { type: 'SET_RADIUS', value: 3 },
      { type: 'SET_RADIUS', value: 4 },
      { type: 'CONFIRM_EXPERIMENT' },
      { type: 'NEXT_STEP' },
      { type: 'SUBMIT_CALC', step: 'area', inputs: ['4π', '16π'] },
      { type: 'SUBMIT_REASON', step: 'area', choice: 'square' },
      { type: 'NEXT_STEP' },
      { type: 'SUBMIT_CALC', step: 'volume', inputs: ['20pi', '80 π'] },
      { type: 'SUBMIT_REASON', step: 'volume', choice: 'base_times_height' },
      { type: 'NEXT_STEP' },
      { type: 'SUBMIT_CALC', step: 'ratio', inputs: ['4'] },
      { type: 'SUBMIT_REASON', step: 'ratio', choice: 'ratio_squared' },
      { type: 'NEXT_STEP' },
    ],
    s,
  );
  assert.equal(s.stage, 'S5');
  // Slider is locked again during independent verification.
  assert.equal(run([{ type: 'SET_RADIUS', value: 2 }], s).comparisonRadius, 4);

  s = run([{ type: 'SUBMIT_TRANSFER', answerRaw: '9', reasonRaw: 'Chiều cao không đổi, bán kính gấp 9/3 = 3 nên thể tích gấp 3² = 9 lần' }], s);
  // Double submit creates one logical record (FR-REC-002).
  s = run([{ type: 'SUBMIT_TRANSFER', answerRaw: '3', reasonRaw: '' }], s);
  assert.equal(s.events.filter((e) => e.type === 'transfer_submitted').length, 1);
  const submitted = s.events.find((e) => e.type === 'transfer_submitted')!;
  const evaluated = s.events.find((e) => e.type === 'transfer_evaluated')!;
  assert.ok(submitted.seq < evaluated.seq, 'response stored before evaluation (S5-AC-01)');
  assert.equal(s.transferEvaluation?.answerVerdict, 'correct');
  assert.equal(s.transferEvaluation?.reasonVerdict, 'sufficient');

  s = run([{ type: 'FINISH' }], s);
  assert.equal(s.stage, 'S6');

  const summary = buildSummary(s);
  const byId = Object.fromEntries(summary.map((i) => [i.id, i]));
  // Demo prediction is kept verbatim and labelled as demo (S6-AC-02).
  assert.match(byId.prediction.value!, /"2"/);
  assert.match(byId.prediction.value!, /minh họa/);
  assert.doesNotMatch(byId.prediction.value!, /"4"/);
  assert.match(byId.radius.value!, /đến 4 cm sau 2 lần/);
  assert.equal(byId.hints.value, 'Không dùng gợi ý');
  assert.match(byId['transfer-answer'].value!, /đúng/);
  for (const item of summary) assert.ok(item.value === null || item.sources.length > 0 || item.id === 'hints' || item.id === 'coach');
  // Event log is strictly ordered.
  s.events.forEach((e, i) => assert.equal(e.seq, i + 1));
});

test('S5 reasoning: two accepted methods, and vague text is never marked wrong (FR-EVAL-006)', () => {
  assert.equal(evaluateTransfer('9', 'V1 = 72π, V2 = 648π, 648π/72π = 9').reasonVerdict, 'sufficient');
  assert.equal(evaluateTransfer('9', 'vi binh phuong ti so ban kinh 3, chieu cao giu nguyen').reasonVerdict, 'sufficient');
  assert.equal(evaluateTransfer('9', 'em đoán vậy').reasonVerdict, 'insufficient_evidence');
  assert.equal(evaluateTransfer('9', 'vì bình phương').reasonVerdict, 'partial');
  const wrong = evaluateTransfer('3 lần', 'bán kính gấp 3');
  assert.equal(wrong.answerVerdict, 'incorrect');
  assert.equal(wrong.expectedFactor, 9);
});

test('S6: missing evidence is reported as null, never invented (FR-EVID-002)', () => {
  const s = run([{ type: 'SUBMIT_ANALYSIS', input: CORRECT_ANALYSIS }]);
  const summary = buildSummary(s);
  const byId = Object.fromEntries(summary.map((i) => [i.id, i]));
  assert.equal(byId.prediction.value, null);
  assert.equal(byId['transfer-answer'].value, null);
  assert.equal(byId['transfer-reason'].value, null);
});
