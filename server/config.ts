/** Server-only configuration. Secrets never leave this process. */
export interface ServerConfig {
  /** undefined when OPENAI_API_KEY is missing → AI disabled, clients use the rule-based fallback. */
  apiKey: string | undefined;
  model: string;
  port: number;
  host: string;
  timeoutMs: number;
  /** Reasoning Parser model timeout (spec §8.8: 8 s). */
  parserTimeoutMs: number;
  maxOutputTokens: number;
  rateLimitPerMinute: number;
  globalRateLimitPerMinute: number;
}

export const DEFAULT_MODEL = 'gpt-4.1-mini';

function intFrom(value: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const apiKey = env.OPENAI_API_KEY?.trim();
  return {
    apiKey: apiKey && !apiKey.startsWith('sk-your') ? apiKey : undefined,
    model: env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
    port: intFrom(env.COACH_SERVER_PORT, 8787, 1, 65535),
    host: env.COACH_SERVER_HOST?.trim() || '127.0.0.1',
    timeoutMs: intFrom(env.COACH_TIMEOUT_MS, 12_000, 1_000, 60_000),
    parserTimeoutMs: intFrom(env.REASONING_PARSER_TIMEOUT_MS, 8_000, 1_000, 60_000),
    maxOutputTokens: intFrom(env.COACH_MAX_OUTPUT_TOKENS, 600, 100, 4_000),
    rateLimitPerMinute: intFrom(env.COACH_RATE_LIMIT_PER_MIN, 20, 1, 1_000),
    globalRateLimitPerMinute: intFrom(env.COACH_GLOBAL_RATE_LIMIT_PER_MIN, 120, 1, 10_000),
  };
}
