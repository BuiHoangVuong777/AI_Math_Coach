/**
 * Mocked integration tests for /api/coach: a real HTTP server with a fake
 * model generator. No network calls to OpenAI are made.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createCoachServer, MAX_BODY_BYTES } from './app.ts';
import type { CoachGenerator, CoachPrompt } from './openaiGenerator.ts';
import { createRateLimiter } from './rateLimit.ts';
import { loadConfig } from './config.ts';
import { INSTRUCTION_CANARY } from '../src/lib/cylinder/coachContract.ts';
import { VALID_REPLY, VALID_REQUEST } from '../src/lib/cylinder/coachFixtures.ts';

type Log = Record<string, string | number | boolean>;

async function withServer(
  generator: CoachGenerator | null,
  fn: (url: string, logs: Log[]) => Promise<void>,
  { timeoutMs = 2_000, perMinute = 100 } = {},
) {
  const logs: Log[] = [];
  const server = createCoachServer({
    generator,
    model: 'test-model',
    timeoutMs,
    perClientLimiter: createRateLimiter({ windowMs: 60_000, max: perMinute }),
    globalLimiter: createRateLimiter({ windowMs: 60_000, max: 1_000 }),
    log: (e) => logs.push(e),
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await fn(`http://127.0.0.1:${port}`, logs);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

const post = (url: string, body: unknown, headers: Record<string, string> = { 'Content-Type': 'application/json' }) =>
  fetch(`${url}/api/coach`, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });

test('valid model output → 200 with the validated reply; prompt carries canonical context', async () => {
  let prompt: CoachPrompt | undefined;
  await withServer(async (p) => {
    prompt = p;
    return JSON.stringify(VALID_REPLY);
  }, async (url, logs) => {
    const res = await post(url, VALID_REQUEST);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { source: 'ai', model: 'test-model', reply: VALID_REPLY });
    // Logs never include learner text or model output.
    assert.ok(!JSON.stringify(logs).includes('gấp 2') && !JSON.stringify(logs).includes(VALID_REPLY.message));
  });
  assert.ok(prompt);
  assert.match(prompt.instructions, /A₁ = 4π cm², A₂ = 16π cm² \[NOT YET SOLVED/);
  assert.match(prompt.instructions, /V₂\/V₁ = 4/);
  assert.match(prompt.instructions, new RegExp(INSTRUCTION_CANARY));
  // Learner-provided content is confined to `input`, never mixed into instructions.
  assert.ok(!prompt.instructions.includes(VALID_REQUEST.learnerMessage));
  assert.ok(prompt.input.includes(`<<<\n${VALID_REQUEST.learnerMessage}\n>>>`));
});

test('invalid model output (not JSON / wrong shape / answer leak) → 502 invalid_model_output', async () => {
  const outputs = [
    'Đây không phải JSON',
    JSON.stringify({ ...VALID_REPLY, replyType: 'final_answer' }),
    JSON.stringify({ ...VALID_REPLY, message: 'A₂ = 16π nên diện tích gấp 4 lần' }),
    JSON.stringify({ ...VALID_REPLY, message: `Hướng dẫn: ${INSTRUCTION_CANARY}` }),
  ];
  for (const output of outputs) {
    await withServer(async () => output, async (url) => {
      const res = await post(url, VALID_REQUEST);
      assert.equal(res.status, 502);
      assert.deepEqual(await res.json(), { error: { code: 'invalid_model_output' } });
    });
  }
});

test('missing credentials → 503 ai_not_configured; status endpoint reveals no secret', async () => {
  await withServer(null, async (url) => {
    const res = await post(url, VALID_REQUEST);
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { error: { code: 'ai_not_configured' } });
    const status = await (await fetch(`${url}/api/coach/status`)).json();
    assert.deepEqual(status, { aiEnabled: false, model: null });
  });
  assert.equal(loadConfig({ OPENAI_API_KEY: '' }).apiKey, undefined);
  assert.equal(loadConfig({ OPENAI_API_KEY: 'sk-your-key-here' }).apiKey, undefined, 'placeholder is not a key');
  assert.equal(loadConfig({}).model, 'gpt-4.1-mini');
});

test('model timeout → 504 ai_timeout, even if the generator ignores the abort signal', async () => {
  let aborted = false;
  await withServer(
    (_p, signal) => {
      signal.addEventListener('abort', () => (aborted = true));
      return new Promise(() => {}); // never resolves
    },
    async (url) => {
      const started = Date.now();
      const res = await post(url, VALID_REQUEST);
      assert.equal(res.status, 504);
      assert.deepEqual(await res.json(), { error: { code: 'ai_timeout' } });
      assert.ok(Date.now() - started < 1_500);
    },
    { timeoutMs: 100 },
  );
  assert.ok(aborted, 'upstream request is aborted');
});

test('upstream API errors → 502 ai_error without leaking the error message', async () => {
  class AuthenticationError extends Error {
    status = 401;
  }
  await withServer(async () => {
    throw new AuthenticationError('Incorrect API key provided: sk-abc***xyz');
  }, async (url, logs) => {
    const res = await post(url, VALID_REQUEST);
    assert.equal(res.status, 502);
    const text = await res.text();
    assert.ok(!text.includes('sk-'));
    assert.ok(!JSON.stringify(logs).includes('sk-'), 'error message (may contain a masked key) is not logged');
    assert.equal(logs.at(-1)?.upstreamStatus, 401);
  });
});

test('request validation: bad JSON, bad shape, wrong media type, oversize body, unknown route', async () => {
  let calls = 0;
  await withServer(async () => {
    calls++;
    return JSON.stringify(VALID_REPLY);
  }, async (url) => {
    assert.equal((await post(url, '{not json')).status, 400);
    assert.equal((await post(url, { ...VALID_REQUEST, step: 'S5' })).status, 400);
    assert.equal((await post(url, { ...VALID_REQUEST, learnerName: 'An' })).status, 400);
    assert.equal((await post(url, VALID_REQUEST, { 'Content-Type': 'text/plain' })).status, 415);
    const huge = { ...VALID_REQUEST, learnerMessage: 'x'.repeat(MAX_BODY_BYTES + 10) };
    assert.equal((await post(url, huge)).status, 413);
    assert.equal((await fetch(`${url}/api/other`)).status, 404);
  });
  assert.equal(calls, 0, 'invalid requests never reach the model');
});

test('rate limiting → 429 with Retry-After', async () => {
  await withServer(async () => JSON.stringify(VALID_REPLY), async (url) => {
    assert.equal((await post(url, VALID_REQUEST)).status, 200);
    assert.equal((await post(url, VALID_REQUEST)).status, 200);
    const limited = await post(url, VALID_REQUEST);
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('retry-after')) > 0);
  }, { perMinute: 2 });
});
