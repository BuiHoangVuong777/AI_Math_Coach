/**
 * Browser client for POST /api/coach. It never throws and never blocks the
 * lesson: any failure (server down, missing key, rate limit, timeout, invalid
 * or answer-leaking reply) resolves to the deterministic rule-based reply.
 */
import {
  type CoachReply,
  type CoachRequest,
  buildFallbackReply,
  validateCoachReply,
} from './coachContract.ts';

export type FallbackReason = 'network' | 'timeout' | 'http_error' | 'invalid_response';

export type CoachResult =
  | { source: 'ai'; model: string; reply: CoachReply }
  | { source: 'fallback'; reason: FallbackReason; errorCode?: string; reply: CoachReply };

export const CLIENT_TIMEOUT_MS = 15_000;
export const COACH_ENDPOINT = '/api/coach';

export async function askCoach(
  request: CoachRequest,
  options: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<CoachResult> {
  const { fetchImpl = fetch, timeoutMs = CLIENT_TIMEOUT_MS } = options;
  const fallback = (reason: FallbackReason, errorCode?: string): CoachResult => ({
    source: 'fallback',
    reason,
    errorCode,
    reply: buildFallbackReply(request),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(COACH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const code = (body as { error?: { code?: unknown } } | null)?.error?.code;
      return fallback('http_error', typeof code === 'string' ? code : `http_${res.status}`);
    }
    const data = body as { source?: unknown; model?: unknown; reply?: unknown } | null;
    if (!data || data.source !== 'ai' || typeof data.model !== 'string') return fallback('invalid_response');
    // Re-validate in the browser: never render an unchecked model reply.
    const checked = validateCoachReply(data.reply, request.solvedSteps);
    if (!checked.ok) return fallback('invalid_response');
    return { source: 'ai', model: data.model, reply: checked.value };
  } catch {
    return fallback(controller.signal.aborted ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }
}
