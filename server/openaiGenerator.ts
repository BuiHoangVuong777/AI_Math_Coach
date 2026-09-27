/**
 * OpenAI Responses API adapter. Returns the model's raw JSON text; validation
 * happens in the HTTP layer via coachContract.validateCoachReply.
 */
import OpenAI from 'openai';
import { COACH_REPLY_JSON_SCHEMA } from '../src/lib/cylinder/coachContract.ts';

export interface CoachPrompt {
  instructions: string;
  input: string;
}

/** Produces raw model text for a prompt; must honour `signal` for timeouts. */
export type CoachGenerator = (prompt: CoachPrompt, signal: AbortSignal) => Promise<string>;

/** The slice of the SDK we use, so tests can inject a fake without network access. */
export interface ResponsesClient {
  responses: {
    create(
      body: OpenAI.Responses.ResponseCreateParamsNonStreaming,
      options?: { signal?: AbortSignal; timeout?: number; maxRetries?: number },
    ): Promise<{ status?: string | null; output_text: string }>;
  };
}

export class ModelOutputError extends Error {}

export interface OutputFormat {
  name: string;
  schema: Record<string, unknown>;
}

export function createOpenAIGenerator(
  { apiKey, model, timeoutMs, maxOutputTokens, format }: { apiKey: string; model: string; timeoutMs: number; maxOutputTokens: number; format?: OutputFormat },
  client: ResponsesClient = new OpenAI({ apiKey, timeout: timeoutMs, maxRetries: 0 }),
): CoachGenerator {
  const fmt = format ?? { name: 'coach_reply', schema: COACH_REPLY_JSON_SCHEMA as unknown as Record<string, unknown> };
  return async ({ instructions, input }, signal) => {
    const response = await client.responses.create(
      {
        model,
        instructions,
        input,
        max_output_tokens: maxOutputTokens,
        // Learner text must not be retained for later retrieval (NFR-PRIV-003).
        store: false,
        text: {
          format: {
            type: 'json_schema',
            name: fmt.name,
            strict: true,
            schema: fmt.schema,
          },
        },
      },
      { signal, timeout: timeoutMs, maxRetries: 0 },
    );
    if (response.status && response.status !== 'completed') {
      throw new ModelOutputError(`response status ${response.status}`);
    }
    if (!response.output_text) throw new ModelOutputError('empty output');
    return response.output_text;
  };
}
