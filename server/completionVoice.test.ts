import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createCoachServer } from './app.ts';
import { createRateLimiter } from './rateLimit.ts';
import { demoAuthConfig } from './demoAuth.ts';
import { Session } from '../src/lib/reasoning/testkit.ts';
import * as F from '../src/lib/reasoning/fixtures.ts';
import { toWire } from '../src/lib/reasoning/orchestrator.ts';
import { toEvidenceWire } from '../src/lib/reasoning/sessionEvidence.ts';
import { buildScoringResult } from '../src/lib/reasoning/completion.ts';
import { completionVoicePlan } from '../src/lib/voice/plan.ts';

/** §24.8: the completion Voice route rebuilds the approved text from recomputed evidence only. */
test('HTTP completion Voice: server recomputes evidence; only the approved message reaches the provider', async () => {
  const spoken: string[] = [];
  const server = createCoachServer({
    generator: null, model: 'test', timeoutMs: 1000,
    perClientLimiter: createRateLimiter({ windowMs: 60000, max: 100 }), globalLimiter: createRateLimiter({ windowMs: 60000, max: 100 }),
    demoAuth: demoAuthConfig({}),
    speech: { name: 'mock', async speak(text) { spoken.push(text); return { bytes: Buffer.from('fixture'), type: 'audio/wav' }; } },
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const post = (body: unknown, cookie = '') => fetch(url + '/api/voice/speech', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(body) });
  try {
    const login = await fetch(url + '/api/demo-auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'student@mathcoach.demo', password: 'Demo@123456' }) });
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    const s = new Session(F.PROBLEM_C);
    for (const r of F.ROWS_C) await s.add(r);
    await s.edit(1, F.EDITS_C[0]);
    await s.op({ type: 'finish' });
    const plan = completionVoicePlan(s.ctx)!;
    const request = { context: toEvidenceWire(s.ctx), expectedGraphVersion: s.ctx.graph.version, opId: 'voice-completion', op: { type: 'select_node', nodeId: null } };
    const body = { kind: 'completion', request, segmentIndex: 1 };
    assert.equal((await post(body)).status, 401, 'demo login required');
    const ok = await post(body, cookie);
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get('X-Voice-Plan'), plan.id);
    assert.equal(spoken[0], plan.segments[1].text);
    assert.equal(spoken[0], buildScoringResult(s.ctx).message.spoken[1]);
    // Client-supplied text or scores are never accepted.
    assert.equal((await post({ ...body, text: 'Em đạt 100/100 và rất giỏi.' }, cookie)).status, 400);
    const forged = structuredClone(request);
    forged.context.processedOpIds = ['voice-completion'];
    const replay = await post({ kind: 'completion', request: forged, segmentIndex: 1 }, cookie);
    assert.equal(replay.status, 200, 'processed op ids cannot skip revalidation');
    assert.equal(spoken[1], plan.segments[1].text);
    // Completion speech only in summary; unknown kinds and out-of-range segments are refused.
    const reasoning = new Session(F.PROBLEM_A);
    await reasoning.add(F.ROWS_A[0]);
    assert.equal((await post({ kind: 'completion', request: { ...request, context: toWire(reasoning.ctx), expectedGraphVersion: reasoning.ctx.graph.version }, segmentIndex: 0 }, cookie)).status, 400);
    assert.equal((await post({ kind: 'score', request, segmentIndex: 0 }, cookie)).status, 400);
    assert.equal((await post({ kind: 'completion', request, segmentIndex: 99 }, cookie)).status, 400);
    assert.equal(spoken.length, 2);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});
