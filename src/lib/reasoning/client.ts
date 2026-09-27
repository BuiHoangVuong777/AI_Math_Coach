/**
 * Browser client for /api/reasoning/*. Never throws: when the server is
 * unreachable, slow or returns an error, the SAME deterministic engine runs
 * locally with no LLM (offline mode, §8.8).
 */
import { interpretProblem, mergeResult, runTurn, toWire } from './orchestrator.ts';
import type { DegradedFlags, ProblemSpec, TurnRequest, TurnResult } from './types.ts';

export const TURN_TIMEOUT_MS = 20_000;
export const PROBLEM_TIMEOUT_MS = 12_000;

export interface ServerStatus {
  parserLLM: boolean;
  tutorLLM: boolean;
  model: string | null;
  reachable: boolean;
}

async function postJson(path: string, body: unknown, timeoutMs: number): Promise<{ status: number; json: unknown } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { status: res.status, json };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchStatus(): Promise<ServerStatus> {
  try {
    const res = await fetch('/api/reasoning/status');
    if (!res.ok) return { parserLLM: false, tutorLLM: false, model: null, reachable: false };
    const j = (await res.json()) as Omit<ServerStatus, 'reachable'>;
    return { ...j, reachable: true };
  } catch {
    return { parserLLM: false, tutorLLM: false, model: null, reachable: false };
  }
}

export async function requestProblem(problemText: string): Promise<{ spec: ProblemSpec; degraded: DegradedFlags }> {
  const r = await postJson('/api/reasoning/problem', { problemText }, PROBLEM_TIMEOUT_MS);
  if (r && r.status === 200 && r.json && typeof r.json === 'object' && 'problemSpec' in r.json) {
    const j = r.json as { problemSpec: ProblemSpec; degraded: DegradedFlags };
    return { spec: j.problemSpec, degraded: j.degraded };
  }
  const local = await interpretProblem(problemText);
  return { spec: local.spec, degraded: { ...local.degraded, offline: true } };
}

export type TurnOutcome = { kind: 'ok'; result: TurnResult } | { kind: 'stale' };

/** Sends one operation. The returned context is already merged with the local one. */
export async function requestTurn(req: TurnRequest, { localOnly = false } = {}): Promise<TurnOutcome> {
  if (!localOnly) {
    const r = await postJson('/api/reasoning/turn', { ...req, context: toWire(req.context) }, TURN_TIMEOUT_MS);
    if (r?.status === 409) return { kind: 'stale' };
    if (r && r.status === 200 && r.json && typeof r.json === 'object' && 'context' in r.json) {
      const result = r.json as TurnResult;
      return { kind: 'ok', result: { ...result, context: mergeResult(req.context, result) } };
    }
  }
  const result = await runTurn(req, {});
  return { kind: 'ok', result: { ...result, degraded: { ...result.degraded, ...(localOnly ? {} : { offline: true }) } } };
}
