/** Shared test fixtures for the coach contract (not imported by the app). */
import type { CoachReply, CoachRequest } from './coachContract.ts';

export const VALID_REQUEST: CoachRequest = {
  step: 'area',
  learnerMessage: 'Em nghĩ bán kính gấp 2 thì diện tích cũng gấp 2.',
  hintLevel: 0,
  solvedSteps: [],
  stepReasonCorrect: false,
  lastAttempt: { inputs: ['4π', '8π'], feedback: ['ok', 'area_linear'] },
  prediction: '2',
};

export const VALID_REPLY: CoachReply = {
  replyType: 'socratic_question',
  message: 'Có thể em đang nghĩ diện tích tăng cùng tỷ lệ với bán kính. Mình kiểm tra nhé.',
  question: 'Trong A = πr², bán kính được nhân với chính nó mấy lần?',
  misconception: { detected: true, code: 'area_linear', evidence: 'diện tích cũng gấp 2' },
};
