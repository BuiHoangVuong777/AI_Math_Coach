/**
 * Minimal HTTP server for the AI coach (node:http, no framework).
 *
 *   GET  /api/coach/status → { aiEnabled, model }
 *   POST /api/coach        → { source: 'ai', model, reply } | { error: { code } }
 *   /api/reasoning/*       → Math Reasoning Canvas (see reasoningRoutes.ts)
 *
 * Nothing is persisted. Logs contain only event codes, HTTP status and timing —
 * never learner text, prompts, model output or secrets.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import {
  type CoachApiResponse,
  type CoachErrorCode,
  validateCoachReply,
  validateCoachRequest,
} from '../src/lib/cylinder/coachContract.ts';
import type { CoachGenerator } from './openaiGenerator.ts';
import { buildCoachPrompt } from './prompt.ts';
import type { RateLimiter } from './rateLimit.ts';
import { handleVoice, type SpeechProvider } from './voiceRoutes.ts';
import { createRateLimiter } from './rateLimit.ts';
import { createDemoAuth, demoAuthConfig, type DemoAuthConfig } from './demoAuth.ts';
import { handleReasoning, type ReasoningOptions } from './reasoningRoutes.ts';

export const MAX_BODY_BYTES = 8 * 1024;

export interface CoachServerOptions {
  /** null when no API key is configured. */
  generator: CoachGenerator | null;
  model: string;
  timeoutMs: number;
  perClientLimiter: RateLimiter;
  globalLimiter: RateLimiter;
  log?: (entry: Record<string, string | number | boolean>) => void;
  /** Math Reasoning Canvas routes (/api/reasoning/*); omitted → those paths return 404. */
  demoAuth?: DemoAuthConfig;
  speech?: SpeechProvider | null;
  reasoning?: Omit<ReasoningOptions, 'log'>;
}

const STATUS: Record<CoachErrorCode, number> = {
  invalid_request: 400,
  not_found: 404,
  payload_too_large: 413,
  unsupported_media_type: 415,
  rate_limited: 429,
  invalid_model_output: 502,
  ai_error: 502,
  ai_not_configured: 503,
  ai_timeout: 504,
};

class HttpError extends Error {
  readonly code: CoachErrorCode;
  constructor(code: CoachErrorCode) {
    super(code);
    this.code = code;
  }
}

function send(res: ServerResponse, status: number, body: CoachApiResponse | Record<string, unknown>, headers: Record<string, string> = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length'] ?? 0);
    if (declared > MAX_BODY_BYTES) return reject(new HttpError('payload_too_large'));
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError('payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new HttpError('ai_timeout'));
    }, timeoutMs);
  });
  try {
    // Race so a generator that ignores the signal still cannot hold the request open.
    return await Promise.race([run(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function classifyModelError(err: unknown): CoachErrorCode {
  if (err instanceof HttpError) return err.code;
  const name = (err as { constructor?: { name?: string } })?.constructor?.name ?? '';
  if (name === 'APIConnectionTimeoutError' || name === 'APIUserAbortError') return 'ai_timeout';
  return 'ai_error';
}

export function createCoachServer(options: CoachServerOptions): Server {
  const { generator, model, timeoutMs, perClientLimiter, globalLimiter, log = () => {} } = options;

  const auth = createDemoAuth(options.demoAuth ?? demoAuthConfig());
  const voiceLimiter = createRateLimiter({windowMs:60000,max:30});
  return createServer(async (req, res) => {
    const started = Date.now();
    const url = new URL(req.url ?? '/', 'http://localhost');
    const done = (status: number, event: string, extra: Record<string, string | number | boolean> = {}) =>
      log({ event, status, ms: Date.now() - started, ...extra });

    const fail = (code: CoachErrorCode, extra: Record<string, string | number | boolean> = {}, headers: Record<string, string> = {}) => {
      send(res, STATUS[code], { error: { code } }, headers);
      done(STATUS[code], code, extra);
    };

    try {
      if (await auth.handle(req, res, url)) return;
      if (await handleVoice(req,res,url,options.speech ?? null,!!auth.session(req),voiceLimiter)) return;
      if (options.reasoning && (await handleReasoning(req, res, url, { ...options.reasoning, log: (e) => log({ route: 'reasoning', ...e }) }))) return;
      if (req.method === 'GET' && url.pathname === '/api/coach/status') {
        send(res, 200, { aiEnabled: generator !== null, model: generator ? model : null });
        return;
      }
      if (url.pathname !== '/api/coach' || req.method !== 'POST') return fail('not_found');

      const retryAfter = globalLimiter.take('global') || perClientLimiter.take(req.socket.remoteAddress ?? 'unknown');
      if (retryAfter) return fail('rate_limited', {}, { 'Retry-After': String(retryAfter) });

      if (!String(req.headers['content-type'] ?? '').includes('application/json')) return fail('unsupported_media_type');
      let parsed: unknown;
      try {
        parsed = JSON.parse(await readBody(req));
      } catch (err) {
        return fail(err instanceof HttpError ? err.code : 'invalid_request');
      }
      const request = validateCoachRequest(parsed);
      if (!request.ok) return fail('invalid_request');

      if (!generator) return fail('ai_not_configured');

      let raw: string;
      try {
        raw = await withTimeout((signal) => generator(buildCoachPrompt(request.value), signal), timeoutMs);
      } catch (err) {
        const code = classifyModelError(err);
        const errorType = (err as { constructor?: { name?: string } })?.constructor?.name ?? 'unknown';
        const upstreamStatus = (err as { status?: unknown })?.status;
        return fail(code, {
          step: request.value.step,
          errorType,
          ...(typeof upstreamStatus === 'number' ? { upstreamStatus } : {}),
        });
      }

      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch {
        return fail('invalid_model_output', { step: request.value.step, reason: 'not_json' });
      }
      const reply = validateCoachReply(json, request.value.solvedSteps);
      if (!reply.ok) return fail('invalid_model_output', { step: request.value.step, reason: reply.error });

      send(res, 200, { source: 'ai', model, reply: reply.value });
      done(200, 'ai_reply', { step: request.value.step, replyType: reply.value.replyType });
    } catch {
      if (!res.headersSent) fail('ai_error', { reason: 'unhandled' });
    }
  });
}
