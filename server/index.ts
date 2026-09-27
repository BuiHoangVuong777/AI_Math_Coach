/**
 * Entry point: `node server/index.ts` (Node ≥ 22.18 runs TypeScript natively).
 * Reads server-only settings from the environment or the repo-root `.env`.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createOpenAISpeech } from './openaiSpeech.ts';
import { loadConfig } from './config.ts';
import { createCoachServer } from './app.ts';
import { createOpenAIGenerator } from './openaiGenerator.ts';
import { createRateLimiter } from './rateLimit.ts';
import { PARSER_JSON_SCHEMA, PROBLEM_JSON_SCHEMA } from '../src/lib/reasoning/grounding.ts';
import { TUTOR_JSON_SCHEMA } from '../src/lib/reasoning/disclosure.ts';

const envFile = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const config = loadConfig();
const generator = config.apiKey
  ? createOpenAIGenerator({
      apiKey: config.apiKey,
      model: config.model,
      timeoutMs: config.timeoutMs,
      maxOutputTokens: config.maxOutputTokens,
    })
  : null;

const reasoningGenerator = (name: string, schema: object, timeoutMs: number) =>
  config.apiKey
    ? createOpenAIGenerator({ apiKey: config.apiKey, model: config.model, timeoutMs, maxOutputTokens: config.maxOutputTokens, format: { name, schema: schema as Record<string, unknown> } })
    : null;

const server = createCoachServer({
  generator,
  speech: config.apiKey ? createOpenAISpeech(config.apiKey) : null,
  model: config.model,
  timeoutMs: config.timeoutMs,
  perClientLimiter: createRateLimiter({ windowMs: 60_000, max: config.rateLimitPerMinute }),
  globalLimiter: createRateLimiter({ windowMs: 60_000, max: config.globalRateLimitPerMinute }),
  log: (entry) => console.log(`[coach] ${JSON.stringify(entry)}`),
  reasoning: {
    generators: {
      parser: reasoningGenerator('row_parse', PARSER_JSON_SCHEMA, config.parserTimeoutMs),
      tutor: reasoningGenerator('canvas_coach', TUTOR_JSON_SCHEMA, config.timeoutMs),
      problem: reasoningGenerator('problem_mentions', PROBLEM_JSON_SCHEMA, config.parserTimeoutMs),
    },
    model: config.model,
    parserTimeoutMs: config.parserTimeoutMs,
    tutorTimeoutMs: config.timeoutMs,
    perClientLimiter: createRateLimiter({ windowMs: 60_000, max: config.rateLimitPerMinute * 3 }),
    globalLimiter: createRateLimiter({ windowMs: 60_000, max: config.globalRateLimitPerMinute * 3 }),
  },
});

server.listen(config.port, config.host, () => {
  // Never print the key itself — only whether one is configured.
  console.log(
    `[coach] listening on http://${config.host}:${config.port} · AI ${generator ? `enabled (model ${config.model})` : 'DISABLED: OPENAI_API_KEY not set — clients use rule-based fallback'}`,
  );
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
