/**
 * /api/reasoning/* — Math Reasoning Canvas orchestrator endpoints (§8.8).
 *
 *   GET  /api/reasoning/status  → { parserLLM, tutorLLM, model }
 *   POST /api/reasoning/problem → { problemSpec, degraded }         (F1 interpretation)
 *   POST /api/reasoning/turn    → TurnResult                         (one learner operation)
 *
 * Stateless: the client sends the session context; every validation is recomputed
 * here. LLM output is untrusted and only reaches runTurn through its validators.
 * Logs contain event codes and timings only — never learner text or model output.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { validateProblemRequest, validateTurnRequest } from '../src/lib/reasoning/contract.ts';
import { interpretProblem, runTurn, type Ports } from '../src/lib/reasoning/orchestrator.ts';
import { LIMITS } from '../src/lib/reasoning/types.ts';
import type { CoachGenerator } from './openaiGenerator.ts';
import { buildParserPrompt, buildProblemPrompt, buildTutorPrompt } from './reasoningPrompts.ts';
import type { RateLimiter } from './rateLimit.ts';

export interface ReasoningGenerators {
  parser: CoachGenerator | null;
  tutor: CoachGenerator | null;
  problem: CoachGenerator | null;
}

export interface ReasoningOptions {
  generators: ReasoningGenerators;
  model: string;
  parserTimeoutMs: number;
  tutorTimeoutMs: number;
  perClientLimiter: RateLimiter;
  globalLimiter: RateLimiter;
  log: (entry: Record<string, string | number | boolean>) => void;
}

class RouteError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage, limit: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (Number(req.headers['content-length'] ?? 0) > limit) return reject(new RouteError(413, 'payload_too_large'));
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new RouteError(413, 'payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Runs a generator with a hard timeout (race, so an ignoring generator cannot hang the request). */
async function generate(gen: CoachGenerator, prompt: { instructions: string; input: string }, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('timeout'));
    }, timeoutMs);
  });
  try {
    const raw = await Promise.race([gen(prompt, controller.signal), timeout]);
    return JSON.parse(raw);
  } finally {
    clearTimeout(timer);
  }
}

export function buildPorts(o: ReasoningOptions, counters: Record<string, number>): Ports {
  const wrap = <I>(name: string, gen: CoachGenerator | null, build: (i: I) => { instructions: string; input: string }, timeoutMs: number) =>
    gen
      ? async (input: I) => {
          counters[name] = (counters[name] ?? 0) + 1;
          try {
            return await generate(gen, build(input), timeoutMs);
          } catch (err) {
            counters[`${name}_error`] = (counters[`${name}_error`] ?? 0) + 1;
            throw err;
          }
        }
      : null;
  return {
    parser: wrap('parser', o.generators.parser, buildParserPrompt, o.parserTimeoutMs),
    tutor: wrap('tutor', o.generators.tutor, buildTutorPrompt, o.tutorTimeoutMs),
    problem: wrap('problem', o.generators.problem, (i: { problemText: string }) => buildProblemPrompt(i.problemText), o.parserTimeoutMs),
  };
}

/** Returns true when the request was handled (path under /api/reasoning/). */
export async function handleReasoning(req: IncomingMessage, res: ServerResponse, url: URL, o: ReasoningOptions): Promise<boolean> {
  if (!url.pathname.startsWith('/api/reasoning/')) return false;
  const started = Date.now();
  const counters: Record<string, number> = {};
  const done = (status: number, event: string, extra: Record<string, string | number | boolean> = {}) =>
    o.log({ event, status, ms: Date.now() - started, ...counters, ...extra });
  try {
    if (req.method === 'GET' && url.pathname === '/api/reasoning/status') {
      send(res, 200, { parserLLM: !!o.generators.parser, tutorLLM: !!o.generators.tutor, model: o.generators.tutor || o.generators.parser ? o.model : null });
      return true;
    }
    if (req.method !== 'POST' || !['/api/reasoning/problem', '/api/reasoning/turn'].includes(url.pathname)) throw new RouteError(404, 'not_found');
    const retryAfter = o.globalLimiter.take('global') || o.perClientLimiter.take(req.socket.remoteAddress ?? 'unknown');
    if (retryAfter) {
      send(res, 429, { error: { code: 'rate_limited' } }, { 'Retry-After': String(retryAfter) });
      done(429, 'rate_limited');
      return true;
    }
    if (!String(req.headers['content-type'] ?? '').includes('application/json')) throw new RouteError(415, 'unsupported_media_type');
    const isTurn = url.pathname.endsWith('/turn');
    let body: unknown;
    try {
      body = JSON.parse(await readBody(req, isTurn ? LIMITS.turnBodyBytes : 8 * 1024));
    } catch (err) {
      throw err instanceof RouteError ? err : new RouteError(400, 'invalid_request');
    }
    const ports = buildPorts(o, counters);
    if (!isTurn) {
      const v = validateProblemRequest(body);
      if (!v.ok) throw new RouteError(400, 'invalid_request');
      const result = await interpretProblem(v.value.problemText, ports);
      send(res, 200, { problemSpec: result.spec, degraded: result.degraded });
      done(200, 'problem', { interpretation: result.spec.interpretationStatus });
      return true;
    }
    const v = validateTurnRequest(body);
    if (!v.ok) {
      done(400, 'invalid_request', { reason: v.error });
      throw new RouteError(400, 'invalid_request');
    }
    // The server never honours test-only overrides.
    const result = await runTurn(v.value, { ...ports, allowAnalogOverride: false });
    if (result.error?.code === 'version_conflict') {
      send(res, 409, { error: { code: 'version_conflict' } });
      done(409, 'version_conflict');
      return true;
    }
    send(res, 200, result);
    done(200, 'turn', { op: v.value.op.type, coach: result.coach?.source ?? 'none', parser: result.degraded.parser ?? 'ok' });
    return true;
  } catch (err) {
    if (err instanceof RouteError) {
      send(res, err.status, { error: { code: err.code } });
      if (err.status !== 400) done(err.status, err.code);
      return true;
    }
    if (!res.headersSent) send(res, 500, { error: { code: 'internal_error' } });
    done(500, 'internal_error', { errorType: (err as { constructor?: { name?: string } })?.constructor?.name ?? 'unknown' });
    return true;
  }
}
