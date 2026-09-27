/**
 * /api/reasoning/* integration tests: real HTTP server, fake model generators.
 * No network call to OpenAI is ever made.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createCoachServer } from './app.ts';
import type { CoachGenerator } from './openaiGenerator.ts';
import { createRateLimiter } from './rateLimit.ts';
import { confirmAndStart } from '../src/lib/reasoning/orchestrator.ts';
import { parseProblem } from '../src/lib/reasoning/problemParser.ts';
import * as F from '../src/lib/reasoning/fixtures.ts';
import { CANVAS_CANARY } from '../src/lib/reasoning/disclosure.ts';
import type { SessionContext, TurnResult } from '../src/lib/reasoning/types.ts';

type Log = Record<string, string | number | boolean>;
const REPLY = (ids: string[], question = 'Em xem lại bước này nhé?') =>
  JSON.stringify({ replyType: 'socratic_question', question, explanation: '', hintLevel: 0, hintText: '', relevantNodeIds: ids, disclosureLevel: 0, misconception: { detected: false, code: 'none', evidence: '' } });

async function withServer(gens: { parser?: CoachGenerator | null; tutor?: CoachGenerator | null; problem?: CoachGenerator | null }, fn: (url: string, logs: Log[]) => Promise<void>, perMinute = 1000) {
  const logs: Log[] = [];
  const server = createCoachServer({
    generator: null, model: 'test-model', timeoutMs: 500,
    perClientLimiter: createRateLimiter({ windowMs: 60_000, max: 1000 }),
    globalLimiter: createRateLimiter({ windowMs: 60_000, max: 1000 }),
    log: (e) => logs.push(e),
    reasoning: {
      generators: { parser: gens.parser ?? null, tutor: gens.tutor ?? null, problem: gens.problem ?? null },
      model: 'test-model', parserTimeoutMs: 300, tutorTimeoutMs: 300,
      perClientLimiter: createRateLimiter({ windowMs: 60_000, max: perMinute }),
      globalLimiter: createRateLimiter({ windowMs: 60_000, max: 1000 }),
    },
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address() as AddressInfo;
  try {
    await fn(`http://127.0.0.1:${port}`, logs);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
}

const post = (url: string, path: string, body: unknown) =>
  fetch(`${url}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });

async function turn(url: string, ctx: SessionContext, op: object, opId: string): Promise<{ status: number; body: TurnResult }> {
  const g = ctx.phase === 'independent' && ctx.independent ? ctx.independent.graph : ctx.graph;
  const res = await post(url, '/api/reasoning/turn', { context: ctx, expectedGraphVersion: g.version, opId, op });
  return { status: res.status, body: (await res.json()) as TurnResult };
}

test('status reports configured capabilities without secrets', async () => {
  await withServer({}, async (url) => {
    const res = await fetch(`${url}/api/reasoning/status`);
    assert.deepEqual(await res.json(), { parserLLM: false, tutorLLM: false, model: null });
  });
});

test('problem + turn in deterministic mode (no generators)', async () => {
  await withServer({}, async (url, logs) => {
    const p = await post(url, '/api/reasoning/problem', { problemText: F.PROBLEM_C });
    assert.equal(p.status, 200);
    const { problemSpec } = (await p.json()) as { problemSpec: ReturnType<typeof parseProblem> };
    assert.equal(problemSpec.interpretationStatus, 'draft');
    let ctx = confirmAndStart(problemSpec);
    let n = 0;
    for (const row of F.ROWS_C) {
      const r = await turn(url, ctx, { type: 'add_row', rowText: row }, `o${++n}`);
      assert.equal(r.status, 200);
      ctx = r.body.context;
    }
    const statuses = Object.values(ctx.graph.nodes).filter((x) => x.rowIndex > 0).map((x) => x.validation!.status);
    assert.deepEqual(statuses, ['invalid', 'invalid', 'invalid', 'invalid', 'insufficient_evidence']);
    assert.ok(!JSON.stringify(logs).includes('Bán kính cốc cũ'), 'logs never contain learner text');
  });
});

test('errors: 400 invalid body, 409 stale version, 413 oversized, 415 media type, 404, 429', async () => {
  await withServer({}, async (url) => {
    assert.equal((await post(url, '/api/reasoning/turn', '{bad')).status, 400);
    assert.equal((await post(url, '/api/reasoning/turn', { context: {}, op: { type: 'add_row' } })).status, 400);
    const ctx = confirmAndStart(parseProblem(F.PROBLEM_REG));
    const stale = await post(url, '/api/reasoning/turn', { context: ctx, expectedGraphVersion: ctx.graph.version + 5, opId: 'x', op: { type: 'add_row', rowText: 'A₁ = 4π' } });
    assert.equal(stale.status, 409);
    assert.equal((await post(url, '/api/reasoning/turn', { pad: 'x'.repeat(70 * 1024) })).status, 413);
    const wrongType = await fetch(`${url}/api/reasoning/turn`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' });
    assert.equal(wrongType.status, 415);
    assert.equal((await fetch(`${url}/api/reasoning/nope`)).status, 404);
  });
  await withServer({}, async (url) => {
    await post(url, '/api/reasoning/problem', { problemText: F.PROBLEM_A });
    const r = await post(url, '/api/reasoning/problem', { problemText: F.PROBLEM_A });
    assert.equal(r.status, 429);
    assert.ok(r.headers.get('retry-after'));
  }, 1);
});

test('tutor generator: valid reply used; leaking or timing-out reply → rule-based; prompts carry canary, never reach client', async () => {
  let prompt = '';
  const good: CoachGenerator = async (p) => {
    prompt = p.instructions + p.input;
    const id = /relevantNodeIds may only contain: (n\d+)/.exec(p.instructions)![1];
    return REPLY([id]);
  };
  await withServer({ tutor: good }, async (url) => {
    const ctx = confirmAndStart(parseProblem(F.PROBLEM_B));
    const r = await turn(url, ctx, { type: 'add_row', rowText: F.ROWS_B.hypothesis }, 'a');
    assert.equal(r.body.coach?.source, 'ai');
    assert.ok(prompt.includes(CANVAS_CANARY) && prompt.includes('NEVER STATE'));
    assert.ok(prompt.includes('V₂/V₁ = 9'), 'forbidden values are listed for the model');
    assert.ok(!JSON.stringify(r.body).includes(CANVAS_CANARY), 'instructions never returned');
  });
  const leak: CoachGenerator = async (p) => REPLY([/may only contain: (n\d+)/.exec(p.instructions)![1]], 'Thể tích gấp 9 lần đó!');
  const slow: CoachGenerator = () => new Promise(() => {});
  for (const gen of [leak, slow]) {
    await withServer({ tutor: gen }, async (url) => {
      const ctx = confirmAndStart(parseProblem(F.PROBLEM_B));
      const r = await turn(url, ctx, { type: 'add_row', rowText: F.ROWS_B.hypothesis }, 'a');
      assert.equal(r.status, 200);
      assert.equal(r.body.coach?.source, 'rule_based');
      assert.ok(!JSON.stringify(r.body.coach).includes('gấp 9'));
    });
  }
});

test('parser generator: only for unrecognised rows; learner text is delimited data', async () => {
  let calls = 0;
  let input = '';
  const parser: CoachGenerator = async (p) => {
    calls++;
    input = p.input;
    return JSON.stringify({ semanticType: 'computation', target: 'A1', chain: ['pi*2^2', '4pi'], changes: [], claimKind: '', claimFactor: '', justification: '', ambiguous: false, question: '' });
  };
  await withServer({ parser }, async (url) => {
    let ctx = confirmAndStart(parseProblem(F.PROBLEM_REG));
    ctx = (await turn(url, ctx, { type: 'add_row', rowText: 'A₁ = π·2² = 4π cm²' }, 'a')).body.context;
    assert.equal(calls, 0);
    const r = await turn(url, ctx, { type: 'add_row', rowText: 'diện tích đáy lúc đầu thì lấy pi nhân 2 bình phương bằng 4 pi' }, 'b');
    assert.equal(calls, 1);
    assert.ok(input.includes('<<<') && input.includes('untrusted learner data'));
    const node = Object.values(r.body.context.graph.nodes).find((x) => x.rowIndex === 2)!;
    assert.equal(node.interpretation.provenance, 'llm_interpretation');
    assert.equal(node.originalText, 'diện tích đáy lúc đầu thì lấy pi nhân 2 bình phương bằng 4 pi');
  });
});

test('server ignores the test-only analog override', async () => {
  await withServer({}, async (url) => {
    const ctx = confirmAndStart(parseProblem(F.PROBLEM_REG));
    const r = await turn(url, ctx, { type: 'start_independent', analogText: F.ANALOG_REG }, 'a');
    assert.equal(r.status, 200);
    assert.notEqual(r.body.context.independent!.problemSpec.text, F.ANALOG_REG);
  });
});

test('a 40-row session with 20 edits fits the 64 KB turn body limit (slim wire format)', async () => {
  const { toWire, mergeResult } = await import('../src/lib/reasoning/orchestrator.ts');
  await withServer({}, async (url) => {
    let ctx = confirmAndStart(parseProblem(F.PROBLEM_C));
    let n = 0;
    const send = async (op: object) => {
      const res = await post(url, '/api/reasoning/turn', { context: toWire(ctx), expectedGraphVersion: ctx.graph.version, opId: `o${++n}`, op });
      assert.equal(res.status, 200, JSON.stringify(op));
      ctx = mergeResult(ctx, (await res.json()) as TurnResult);
    };
    for (let i = 0; i < 40; i++) await send({ type: 'add_row', rowText: F.ROWS_C[i % 5] });
    for (let i = 1; i <= 20; i++) await send({ type: 'edit_row', nodeId: `n${i}`, rowText: F.EDITS_C[i % 5] });
    const size = Buffer.byteLength(JSON.stringify({ context: toWire(ctx), expectedGraphVersion: 1, opId: 'x', op: { type: 'add_row', rowText: 'x' } }));
    assert.ok(size < 64 * 1024, `payload ${size} bytes`);
  });
});

test('wire round trip: slim requests + merge reproduce the local engine exactly (Case C with edits)', async () => {
  const { toWire, mergeResult, runTurn } = await import('../src/lib/reasoning/orchestrator.ts');
  await withServer({}, async (url) => {
    let remote = confirmAndStart(parseProblem(F.PROBLEM_C), [], 1);
    let local = remote;
    const ops = [...F.ROWS_C.map((t) => ({ type: 'add_row', rowText: t })), { type: 'retract_row', nodeId: 'n2' }, ...F.EDITS_C.map((t, i) => ({ type: 'edit_row', nodeId: `n${i + 1}`, rowText: t })).filter((o) => o.nodeId !== 'n2')];
    let i = 0;
    for (const op of ops) {
      const opId = `w${++i}`;
      const res = await post(url, '/api/reasoning/turn', { context: toWire(remote), expectedGraphVersion: remote.graph.version, opId, op });
      assert.equal(res.status, 200);
      remote = mergeResult(remote, (await res.json()) as TurnResult);
      local = (await runTurn({ context: local, expectedGraphVersion: local.graph.version, opId, op: op as never })).context;
    }
    const view = (c: SessionContext) => Object.values(c.graph.nodes).map((n) => [n.id, n.revision, n.lifecycle, n.validation?.status, n.validation?.reasonCodes, n.history.length, n.history.map((h) => h.validation?.possibleMisconceptions.length)]);
    assert.deepEqual(view(remote), view(local));
    assert.deepEqual(remote.graph.events.map((e) => [e.seq, e.type]), local.graph.events.map((e) => [e.seq, e.type]));
  });
});
