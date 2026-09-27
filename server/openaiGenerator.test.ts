/** Checks the Responses API call shape with a fake SDK client (no network). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ModelOutputError, createOpenAIGenerator, type ResponsesClient } from './openaiGenerator.ts';
import { COACH_REPLY_JSON_SCHEMA } from '../src/lib/cylinder/coachContract.ts';

function fakeClient(result: { status?: string; output_text: string }) {
  const calls: { body: Record<string, unknown>; options: Record<string, unknown> | undefined }[] = [];
  const client: ResponsesClient = {
    responses: {
      create: async (body, options) => {
        calls.push({ body: body as unknown as Record<string, unknown>, options: options as Record<string, unknown> });
        return result;
      },
    },
  };
  return { client, calls };
}

const settings = { apiKey: 'test-key', model: 'gpt-4.1-mini', timeoutMs: 5_000, maxOutputTokens: 600 };

test('calls Responses API with strict JSON schema, store:false, no retries and the timeout', async () => {
  const { client, calls } = fakeClient({ status: 'completed', output_text: '{"ok":true}' });
  const generate = createOpenAIGenerator(settings, client);
  const signal = new AbortController().signal;
  const text = await generate({ instructions: 'INSTR', input: 'INPUT' }, signal);

  assert.equal(text, '{"ok":true}');
  assert.equal(calls.length, 1);
  const { body, options } = calls[0];
  assert.equal(body.model, 'gpt-4.1-mini');
  assert.equal(body.instructions, 'INSTR');
  assert.equal(body.input, 'INPUT');
  assert.equal(body.store, false);
  assert.equal(body.max_output_tokens, 600);
  assert.deepEqual(body.text, {
    format: { type: 'json_schema', name: 'coach_reply', strict: true, schema: COACH_REPLY_JSON_SCHEMA },
  });
  assert.ok(!('apiKey' in body), 'key never appears in the request body');
  assert.deepEqual(options, { signal, timeout: 5_000, maxRetries: 0 });
});

test('incomplete or empty responses are treated as model errors', async () => {
  const signal = new AbortController().signal;
  await assert.rejects(
    createOpenAIGenerator(settings, fakeClient({ status: 'incomplete', output_text: '{"a"' }).client)({ instructions: '', input: '' }, signal),
    ModelOutputError,
  );
  await assert.rejects(
    createOpenAIGenerator(settings, fakeClient({ status: 'completed', output_text: '' }).client)({ instructions: '', input: '' }, signal),
    ModelOutputError,
  );
});
