/**
 * Verified problem facts (`verified_fact`): everything derivable from the confirmed
 * ProblemSpec with the rule catalog. Symbols that depend on a quantity the problem
 * leaves unspecified (e.g. "giữ nguyên chiều cao" without a value) are resolved with
 * two different free-parameter assignments; a symbol is determined only when both
 * assignments agree (so V₂/V₁ is determined while V₁ is not).
 */
import { equals, exact, formatExact } from './exact.ts';
import { resolve, type Provider } from './rules.ts';
import type { ExactValue, ProblemSpec, SymbolId } from './types.ts';
import { SYMBOLS } from './types.ts';

export interface ProblemFact {
  value: ExactValue;
  derivation: string;
  deps: string[];
  ruleIds: string[];
}
export type ProblemFacts = Partial<Record<SymbolId, ProblemFact>>;

const FREE_ORDER: SymbolId[] = ['r1', 'h1', 'r2', 'h2'];
const FREE_RUNS: Record<string, ExactValue>[] = [
  { r1: exact(2), h1: exact(3), r2: exact(3, 7), h2: exact(4, 11) },
  { r1: exact(5), h1: exact(7), r2: exact(5, 13), h2: exact(6, 17) },
];

export function symbolsFor(spec: Pick<ProblemSpec, 'cylinders'>): SymbolId[] {
  const two = spec.cylinders.length > 1;
  return SYMBOLS.filter((s) => (two ? true : !s.endsWith('2') && !s.startsWith('k')));
}

function givenProvider(spec: ProblemSpec, free: Record<string, ExactValue> = {}): Provider {
  return {
    base: (s) => {
      const g = spec.givens.find((x) => x.symbol === s);
      if (g) return { value: g.value, dep: `g:${s}` };
      if (free[s]) return { value: free[s], dep: `free:${s}` };
      return undefined;
    },
    relations: spec.relations,
    constraints: spec.constraints,
  };
}

export function solveProblem(spec: ProblemSpec): ProblemFacts {
  const facts: ProblemFacts = {};
  const syms = symbolsFor(spec);
  const plain = givenProvider(spec);
  for (const s of syms) {
    const r = resolve(s, plain);
    if (r) facts[s] = { value: r.value, derivation: r.derivation, deps: r.deps, ruleIds: r.ruleIds };
  }
  const missing = syms.filter((s) => !facts[s]);
  if (!missing.length) return facts;

  const runs = FREE_RUNS.map((values) => {
    const free: Record<string, ExactValue> = {};
    for (const s of FREE_ORDER) {
      if (!syms.includes(s)) continue;
      if (!resolve(s, givenProvider(spec, free))) free[s] = values[s];
    }
    return givenProvider(spec, free);
  });
  for (const s of missing) {
    const [a, b] = runs.map((p) => resolve(s, p));
    if (a && b && equals(a.value, b.value)) {
      facts[s] = { value: a.value, derivation: `${a.derivation} (không phụ thuộc giá trị chưa cho)`, deps: a.deps.filter((d) => !d.startsWith('free:')), ruleIds: a.ruleIds };
    }
  }
  return facts;
}

/** Base quantities the problem leaves unresolved (for `insufficient` reasons). */
export function missingBases(spec: ProblemSpec): SymbolId[] {
  const p = givenProvider(spec);
  const out: SymbolId[] = [];
  for (const i of spec.cylinders.map((c) => c.index)) {
    for (const k of ['r', 'h'] as const) {
      const s = `${k}${i}` as SymbolId;
      if (!resolve(s, p)) out.push(s);
    }
  }
  return out;
}

export function describeFact(s: SymbolId, f: ProblemFact): string {
  return `${s} = ${formatExact(f.value)} (${f.derivation})`;
}
