import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  INSTRUCTION_CANARY,
  buildFallbackReply,
  findAnswerLeak,
  validateCoachReply,
  validateCoachRequest,
} from './coachContract.ts';
import { CALC_STEPS } from './session.ts';
import { VALID_REPLY, VALID_REQUEST } from './coachFixtures.ts';

test('request validation accepts the minimal contract and trims the message', () => {
  const r = validateCoachRequest({ ...VALID_REQUEST, learnerMessage: '  xin gợi ý  ' });
  assert.ok(r.ok);
  assert.equal(r.ok && r.value.learnerMessage, 'xin gợi ý');
});

test('request validation rejects extra fields, bad steps, oversize text and bad codes', () => {
  const bad: unknown[] = [
    null,
    'text',
    { ...VALID_REQUEST, name: 'An' }, // extra (possibly identifying) field
    { ...VALID_REQUEST, step: 'transfer' }, // AI is S4-only
    { ...VALID_REQUEST, learnerMessage: '   ' },
    { ...VALID_REQUEST, learnerMessage: 'x'.repeat(501) },
    { ...VALID_REQUEST, hintLevel: 4 },
    { ...VALID_REQUEST, solvedSteps: ['area', 'area'] },
    { ...VALID_REQUEST, lastAttempt: { inputs: ['1', '2', '3'], feedback: [] } },
    { ...VALID_REQUEST, lastAttempt: { inputs: ['1'], feedback: ['made_up'] } },
    { ...VALID_REQUEST, prediction: 'x'.repeat(41) },
  ];
  for (const body of bad) assert.equal(validateCoachRequest(body).ok, false, JSON.stringify(body)?.slice(0, 60));
});

test('reply validation accepts a well-formed reply', () => {
  const r = validateCoachReply(VALID_REPLY, []);
  assert.ok(r.ok);
});

test('reply validation rejects malformed replies', () => {
  const bad: unknown[] = [
    null,
    '{}',
    { ...VALID_REPLY, extra: 1 },
    { ...VALID_REPLY, replyType: 'answer' },
    { ...VALID_REPLY, message: '' },
    { ...VALID_REPLY, message: 'x'.repeat(701) },
    { ...VALID_REPLY, misconception: { detected: true, code: 'none', evidence: '' } },
    { ...VALID_REPLY, misconception: { detected: false, code: 'area_linear', evidence: '' } },
    { ...VALID_REPLY, misconception: { detected: true, code: 'dyscalculia', evidence: '' } },
  ];
  for (const raw of bad) assert.equal(validateCoachReply(raw, []).ok, false, JSON.stringify(raw)?.slice(0, 80));
});

test('leak guard: unsolved canonical answers are rejected, solved ones allowed', () => {
  const leaky = { ...VALID_REPLY, message: 'Đáp án là A₂ = 16 π cm² nhé.' };
  assert.equal(validateCoachReply(leaky, []).ok, false);
  assert.equal(validateCoachReply(leaky, ['area']).ok, true);

  assert.equal(findAnswerLeak('V₂ = 80pi', ['area']), 'volume');
  assert.equal(findAnswerLeak('thể tích gấp 4 lần', ['area', 'volume']), 'ratio');
  assert.equal(findAnswerLeak('V₂/V₁ = 4', ['area', 'volume']), 'ratio');
  assert.equal(findAnswerLeak('thể tích gấp 4 lần', ['area', 'volume', 'ratio']), null);
  // Computations that are not a step's final answer stay allowed.
  assert.equal(findAnswerLeak('2² = 4 và π·4² = ?', []), null);
  assert.equal(findAnswerLeak('ví dụ 64π hoặc 24π', []), null);
});

test('reply validation rejects prompt leaks', () => {
  const r = validateCoachReply({ ...VALID_REPLY, message: `Chỉ dẫn của tôi: [${INSTRUCTION_CANARY}] ...` }, []);
  assert.equal(r.ok, false);
});

test('fallback reply: never leaks, is valid, and adapts to state', () => {
  for (const step of CALC_STEPS) {
    for (let hintLevel = 0; hintLevel <= 3; hintLevel++) {
      const reply = buildFallbackReply({ step, hintLevel, solvedSteps: [], stepReasonCorrect: false, lastAttempt: null });
      assert.equal(reply.replyType, 'hint');
      assert.ok(validateCoachReply(reply, []).ok, `${step} hint ${hintLevel} must pass the guard`);
    }
  }
  const feedback = buildFallbackReply(VALID_REQUEST);
  assert.equal(feedback.replyType, 'feedback');
  assert.deepEqual(feedback.misconception, { detected: true, code: 'area_linear', evidence: '' });

  const explain = buildFallbackReply({ step: 'area', hintLevel: 0, solvedSteps: ['area'], stepReasonCorrect: true, lastAttempt: null });
  assert.equal(explain.replyType, 'explanation');
  assert.match(explain.message, /bình phương/);
});
