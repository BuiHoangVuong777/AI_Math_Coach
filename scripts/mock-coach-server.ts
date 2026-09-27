/**
 * E2E helper: the real coach HTTP server (server/app.ts) with a FAKE model
 * generator, so browser tests exercise proxy → server → validation → render
 * without any paid OpenAI call. Not used by the app.
 *
 *   node scripts/mock-coach-server.ts            # listens on COACH_SERVER_PORT or 8787
 *
 * A learner message containing "LEAK" makes the fake model reveal an unsolved
 * answer, which the server must reject (→ client falls back).
 */
import { mockSpeech } from '../server/mockSpeech.ts';
import { createCoachServer } from '../server/app.ts';
import { createRateLimiter } from '../server/rateLimit.ts';
import type { CoachReply } from '../src/lib/cylinder/coachContract.ts';
import type { CoachGenerator } from '../server/openaiGenerator.ts';

/** Fake Canvas tutor: a Socratic question; "LEAK" in the focus row makes it reveal a forbidden value (must be rejected). */
const canvasTutor: CoachGenerator = async ({ instructions, input }) => {
  const ids = /relevantNodeIds may only contain: ([^\n.]+)/.exec(instructions)?.[1]?.split(',').map((x) => x.trim()).filter((x) => /^n\d+$/.test(x)) ?? [];
  // "LEAK" in the learner's row makes the fake model repeat the first value the prompt forbids.
  const forbidden = /NEVER STATE these values[^:]*: ([^;\n]+)/.exec(instructions)?.[1]?.trim() ?? 'none';
  const leak = input.includes('LEAK') && forbidden !== 'none';
  return JSON.stringify({
    replyType: 'socratic_question',
    question: leak ? `Đáp án là ${forbidden}.` : 'MOCK-AI: Em nhìn lại bước này trên hình nhé — nó dựa trên dữ kiện nào?',
    explanation: '', hintLevel: 0, hintText: '', relevantNodeIds: ids.slice(0, 1), disclosureLevel: 0,
    misconception: { detected: false, code: 'none', evidence: '' },
  });
};
/** Fake parser: transcribes "A1 bằng pi nhân 3 bình phương bằng 9 pi" style rows. */
const canvasParser: CoachGenerator = async ({ input }) => {
  const row = /Row to transcribe[^<]*<<<\n([\s\S]*?)\n>>>/.exec(input)?.[1] ?? '';
  const m = /pi nhân (\d+) bình phương bằng (\d+) pi/.exec(row);
  return JSON.stringify(m
    ? { semanticType: 'computation', target: 'A1', chain: [`pi*${m[1]}^2`, `${m[2]}pi`], changes: [], claimKind: '', claimFactor: '', justification: '', ambiguous: false, question: '' }
    : { semanticType: 'free_text', target: '', chain: [], changes: [], claimKind: '', claimFactor: '', justification: '', ambiguous: false, question: '' });
};

const port = Number(process.env.COACH_SERVER_PORT ?? 8787);

const server = createCoachServer({
  speech: mockSpeech,
  model: 'mock-model',
  timeoutMs: 5_000,
  perClientLimiter: createRateLimiter({ windowMs: 60_000, max: 1_000 }),
  globalLimiter: createRateLimiter({ windowMs: 60_000, max: 1_000 }),
  reasoning: {
    generators: { parser: canvasParser, tutor: canvasTutor, problem: null },
    model: 'mock-model', parserTimeoutMs: 5_000, tutorTimeoutMs: 5_000,
    perClientLimiter: createRateLimiter({ windowMs: 60_000, max: 1_000 }),
    globalLimiter: createRateLimiter({ windowMs: 60_000, max: 1_000 }),
  },
  generator: async ({ input }) => {
    const reply: CoachReply = input.includes('LEAK')
      ? {
          replyType: 'hint',
          message: 'Đáp án: A₂ = 16π cm².',
          question: '',
          misconception: { detected: false, code: 'none', evidence: '' },
        }
      : {
          replyType: 'socratic_question',
          message: 'MOCK-AI: Có thể em đang nghĩ diện tích tăng cùng tỷ lệ với bán kính.',
          question: 'Trong A = πr², bán kính được nhân với chính nó mấy lần?',
          misconception: { detected: true, code: 'area_linear', evidence: 'diện tích gấp 2' },
        };
    return JSON.stringify(reply);
  },
});

server.listen(port, '127.0.0.1', () => console.log(`[mock-coach] listening on :${port}`));
