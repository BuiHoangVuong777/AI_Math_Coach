import { test } from 'node:test';
import assert from 'node:assert/strict';
import { askCoach } from './coachClient.ts';
import { buildFallbackReply } from './coachContract.ts';
import { VALID_REPLY, VALID_REQUEST } from './coachFixtures.ts';

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('valid AI response is returned as source "ai"', async () => {
  let sent: RequestInit | undefined;
  const result = await askCoach(VALID_REQUEST, {
    fetchImpl: async (_url, init) => {
      sent = init;
      return json(200, { source: 'ai', model: 'gpt-4.1-mini', reply: VALID_REPLY });
    },
  });
  assert.equal(result.source, 'ai');
  assert.deepEqual(result.reply, VALID_REPLY);
  assert.deepEqual(JSON.parse(String(sent?.body)), VALID_REQUEST, 'sends exactly the minimal request');
});

test('missing credentials (503 ai_not_configured) → rule-based fallback', async () => {
  const result = await askCoach(VALID_REQUEST, { fetchImpl: async () => json(503, { error: { code: 'ai_not_configured' } }) });
  assert.equal(result.source, 'fallback');
  assert.ok(result.source === 'fallback' && result.reason === 'http_error' && result.errorCode === 'ai_not_configured');
  assert.deepEqual(result.reply, buildFallbackReply(VALID_REQUEST));
});

test('invalid or answer-leaking AI payload is never rendered → fallback', async () => {
  const payloads = [
    { source: 'ai', model: 'm', reply: { ...VALID_REPLY, replyType: 'answer' } },
    { source: 'ai', model: 'm', reply: { ...VALID_REPLY, message: 'A₂ = 16π cm²' } },
    { source: 'other', model: 'm', reply: VALID_REPLY },
    'not json at all',
  ];
  for (const p of payloads) {
    const result = await askCoach(VALID_REQUEST, {
      fetchImpl: async () => (typeof p === 'string' ? new Response(p, { status: 200 }) : json(200, p)),
    });
    assert.equal(result.source, 'fallback');
    assert.ok(result.source === 'fallback' && result.reason === 'invalid_response');
  }
});

test('network failure (backend down) → fallback', async () => {
  const result = await askCoach(VALID_REQUEST, {
    fetchImpl: async () => {
      throw new TypeError('fetch failed');
    },
  });
  assert.ok(result.source === 'fallback' && result.reason === 'network');
});

test('client timeout aborts the request → fallback without blocking', async () => {
  const started = Date.now();
  const result = await askCoach(VALID_REQUEST, {
    timeoutMs: 50,
    fetchImpl: (_url, init) =>
      new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))),
  });
  assert.ok(result.source === 'fallback' && result.reason === 'timeout');
  assert.ok(Date.now() - started < 1_000);
});
