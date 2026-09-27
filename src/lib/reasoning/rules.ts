/**
 * Approved rule catalog (§8.5) and a deterministic derivation resolver.
 *
 * The same resolver computes
 *   - verified problem facts (base values = confirmed givens), and
 *   - values "under the learner's premises" (base values = the learner's own
 *     claims, then givens), which is how the Validator decides whether a step
 *     follows from what the learner wrote without ever correcting it.
 */
import { ExactError, ONE, PI, div, equals, exact, formatExact, mul, pow, sqrt, add, sub } from './exact.ts';
import type { Constraint, CylIndex, ExactValue, Kind, Relation, SymbolId } from './types.ts';

export const RULES: Record<string, { name: string; latex: string; highlight: string[] }> = {
  'R-A': { name: 'Diện tích đáy A = πr²', latex: 'A = \\pi r^{2}', highlight: ['r^{2}'] },
  'R-V1': { name: 'Thể tích V = A·h', latex: 'V = A \\cdot h', highlight: ['A', 'h'] },
  'R-V2': { name: 'Thể tích V = πr²h', latex: 'V = \\pi r^{2} h', highlight: ['r^{2}'] },
  'R-D': { name: 'Đường kính d = 2r', latex: 'd = 2r', highlight: ['2r'] },
  'R-KA': { name: 'A₂/A₁ = (r₂/r₁)²', latex: '\\frac{A_2}{A_1} = \\left(\\frac{r_2}{r_1}\\right)^{2}', highlight: ['^{2}'] },
  'R-KV': { name: 'V₂/V₁ = (r₂/r₁)²·(h₂/h₁)', latex: '\\frac{V_2}{V_1} = \\left(\\frac{r_2}{r_1}\\right)^{2} \\cdot \\frac{h_2}{h_1}', highlight: ['^{2}'] },
  'R-KV-h': { name: 'h không đổi: V₂/V₁ = (r₂/r₁)²', latex: '\\frac{V_2}{V_1} = \\left(\\frac{r_2}{r_1}\\right)^{2}', highlight: ['^{2}'] },
  'R-KV-r': { name: 'r không đổi: V₂/V₁ = h₂/h₁', latex: '\\frac{V_2}{V_1} = \\frac{h_2}{h_1}', highlight: ['h_2', 'h_1'] },
  'R-INV-h': { name: 'h = V/(πr²)', latex: 'h = \\frac{V}{\\pi r^{2}}', highlight: ['r^{2}'] },
  'R-INV-r': { name: 'r = √(V/(πh))', latex: 'r = \\sqrt{\\frac{V}{\\pi h}}', highlight: ['\\sqrt'] },
  'R-INC': { name: 'Tăng thêm p% ⇔ hệ số 1 + p/100', latex: 'k = 1 + \\frac{p}{100}', highlight: ['1'] },
  'R-RATIO': { name: 'Hệ số = đại lượng sau : đại lượng trước', latex: 'k = \\frac{X_2}{X_1}', highlight: [] },
  'R-REL': { name: 'Quan hệ trong đề', latex: '', highlight: [] },
  'R-FIX': { name: 'Đại lượng giữ nguyên', latex: 'X_2 = X_1', highlight: [] },
};

// ------------------------------------------------------------------ symbols

export function kindOf(s: SymbolId): Kind | 'k' {
  return s[0] === 'k' ? 'k' : (s[0] as Kind);
}
export function indexOf(s: SymbolId): CylIndex | null {
  return s[1] === '1' ? 1 : s[1] === '2' ? 2 : null;
}
export function sym(kind: Kind, index: CylIndex): SymbolId {
  return `${kind}${index}` as SymbolId;
}
export function factorSymbol(kind: Kind): SymbolId | null {
  return kind === 'r' || kind === 'd' ? 'kr' : kind === 'h' ? 'kh' : kind === 'A' ? 'kA' : kind === 'V' ? 'kV' : null;
}
/** Power of length: r,d,h → 1, A → 2, V → 3, factors → 0. */
export function lengthPower(s: SymbolId): 0 | 1 | 2 | 3 {
  const k = kindOf(s);
  return k === 'A' ? 2 : k === 'V' ? 3 : k === 'k' ? 0 : 1;
}
export const KIND_LABEL: Record<Kind | 'k', string> = {
  r: 'bán kính', d: 'đường kính', h: 'chiều cao', A: 'diện tích đáy', V: 'thể tích', k: 'hệ số',
};

// ------------------------------------------------------------------ resolver

export interface BaseValue {
  value: ExactValue;
  /** Graph node id this value comes from ('g:r1', 'n3', …). */
  dep: string;
  learnerNodeId?: string;
}

export interface Provider {
  /** Returns a base value, 'blocked' (e.g. producer retracted), or undefined (derive). */
  base(s: SymbolId): BaseValue | 'blocked' | undefined;
  relations: Relation[];
  constraints: Constraint[];
}

export interface Resolution {
  value: ExactValue;
  deps: string[];
  learnerNodeIds: string[];
  /** Every value on the derivation tree (premise values a learner may substitute). */
  values: ExactValue[];
  /** Constants introduced by rules/relations (2 in d/2, 1/2 in h2 = h1/2, …). */
  constants: ExactValue[];
  ruleIds: string[];
  derivation: string;
  /**
   * Premises actually used, with their depth in the derivation tree (0 = the value
   * itself). Base values carry the symbol; constraints/relations carry the symbol
   * they determined. Used to tell direct premises from indirect ones (§9.8).
   */
  uses: { symbol: SymbolId; value: ExactValue | null; dep: string; depth: number }[];
}

type Candidate = { rule: string; inputs: SymbolId[]; constants: ExactValue[]; deps: string[]; compute: (v: ExactValue[]) => ExactValue; text: (v: ExactValue[]) => string };

const TWO = exact(2);
const f = formatExact;

function candidates(s: SymbolId, p: Provider): Candidate[] {
  const out: Candidate[] = [];
  const k = kindOf(s);
  const i = indexOf(s);
  if (i) {
    const r = sym('r', i), d = sym('d', i), h = sym('h', i), A = sym('A', i), V = sym('V', i);
    if (k === 'r') {
      out.push({ rule: 'R-D', inputs: [d], constants: [TWO], deps: [], compute: ([x]) => div(x, TWO), text: ([x]) => `r = d : 2 = ${f(x)} : 2` });
      out.push({ rule: 'R-INV-r', inputs: [A], constants: [], deps: [], compute: ([a]) => sqrt(div(a, PI)), text: ([a]) => `r = √(A/π), A = ${f(a)}` });
    }
    if (k === 'd') out.push({ rule: 'R-D', inputs: [r], constants: [TWO], deps: [], compute: ([x]) => mul(TWO, x), text: ([x]) => `d = 2r = 2·${f(x)}` });
    if (k === 'A') {
      out.push({ rule: 'R-A', inputs: [r], constants: [], deps: [], compute: ([x]) => mul(PI, pow(x, 2)), text: ([x]) => `A = πr² với r = ${f(x)}` });
      out.push({ rule: 'R-INV-h', inputs: [V, h], constants: [], deps: [], compute: ([v, hh]) => div(v, hh), text: ([v, hh]) => `A = V : h = ${f(v)} : ${f(hh)}` });
    }
    if (k === 'V') {
      out.push({ rule: 'R-V1', inputs: [A, h], constants: [], deps: [], compute: ([a, hh]) => mul(a, hh), text: ([a, hh]) => `V = A·h = ${f(a)}·${f(hh)}` });
    }
    if (k === 'h') out.push({ rule: 'R-INV-h', inputs: [V, A], constants: [], deps: [], compute: ([v, a]) => div(v, a), text: ([v, a]) => `h = V : A = ${f(v)} : ${f(a)}` });
    // Relations and constraints of the problem, both directions.
    for (const rel of p.relations) {
      if (rel.target === s) {
        out.push({ rule: 'R-REL', inputs: [rel.source], constants: [rel.value], deps: [`rel:${rel.id}`], compute: ([x]) => (rel.op === 'mul' ? mul(x, rel.value) : add(x, rel.value)), text: ([x]) => `${rel.expr} (${f(x)})` });
      }
      if (rel.source === s) {
        out.push({ rule: 'R-REL', inputs: [rel.target], constants: [rel.value], deps: [`rel:${rel.id}`], compute: ([x]) => (rel.op === 'mul' ? div(x, rel.value) : sub(x, rel.value)), text: ([x]) => `${rel.expr} (${f(x)})` });
      }
    }
    for (const c of p.constraints) {
      if (constraintGroup(c).includes(k as Kind)) {
        const other = sym(k as Kind, i === 1 ? 2 : 1);
        out.push({ rule: 'R-FIX', inputs: [other], constants: [], deps: [`c:${c.id}`], compute: ([x]) => x, text: ([x]) => `giữ nguyên = ${f(x)}` });
      }
    }
  } else {
    const ratio = (kind: Kind): Candidate => ({
      rule: 'R-RATIO', inputs: [sym(kind, 2), sym(kind, 1)], constants: [], deps: [],
      compute: ([b, a]) => div(b, a), text: ([b, a]) => `${f(b)} : ${f(a)}`,
    });
    const fixedDep = (kind: 'r' | 'h') => p.constraints.find((c) => constraintGroup(c).includes(kind));
    if (s === 'kr') {
      out.push(ratio('r'), ratio('d'));
      const c = fixedDep('r');
      if (c) out.push({ rule: 'R-FIX', inputs: [], constants: [], deps: [`c:${c.id}`], compute: () => ONE, text: () => 'bán kính giữ nguyên' });
    }
    if (s === 'kh') {
      out.push(ratio('h'));
      const c = fixedDep('h');
      if (c) out.push({ rule: 'R-FIX', inputs: [], constants: [], deps: [`c:${c.id}`], compute: () => ONE, text: () => 'chiều cao giữ nguyên' });
    }
    if (s === 'kA') {
      out.push(ratio('A'));
      out.push({ rule: 'R-KA', inputs: ['kr'], constants: [], deps: [], compute: ([x]) => pow(x, 2), text: ([x]) => `(${f(x)})²` });
    }
    if (s === 'kV') {
      out.push(ratio('V'));
      out.push({ rule: 'R-KV', inputs: ['kA', 'kh'], constants: [], deps: [], compute: ([a, hh]) => mul(a, hh), text: ([a, hh]) => `${f(a)}·${f(hh)}` });
    }
  }
  return out;
}

/**
 * Resolves `s` from the provider. Among computable candidates, prefers the one
 * that uses the most learner-produced values (so a learner's premise is used
 * whenever it is on some derivation path).
 */
export function resolve(s: SymbolId, p: Provider, visited: ReadonlySet<SymbolId> = new Set()): Resolution | null {
  const b = p.base(s);
  if (b === 'blocked') return null;
  if (b) {
    return {
      value: b.value, deps: [b.dep], learnerNodeIds: b.learnerNodeId ? [b.learnerNodeId] : [],
      values: [b.value], constants: [], ruleIds: [], derivation: `${s} = ${f(b.value)}`,
      uses: [{ symbol: s, value: b.value, dep: b.dep, depth: 0 }],
    };
  }
  if (visited.has(s)) return null;
  const next = new Set(visited).add(s);
  let best: Resolution | null = null;
  for (const c of candidates(s, p)) {
    const inputs: Resolution[] = [];
    let ok = true;
    for (const inp of c.inputs) {
      const r = resolve(inp, p, next);
      if (!r) {
        ok = false;
        break;
      }
      inputs.push(r);
    }
    if (!ok) continue;
    let value: ExactValue;
    try {
      value = c.compute(inputs.map((x) => x.value));
    } catch (err) {
      if (err instanceof ExactError) continue;
      throw err;
    }
    const res: Resolution = {
      value,
      deps: uniq([...c.deps, ...inputs.flatMap((x) => x.deps)]),
      learnerNodeIds: uniq(inputs.flatMap((x) => x.learnerNodeIds)),
      values: [value, ...inputs.flatMap((x) => x.values)],
      constants: [...c.constants, ...inputs.flatMap((x) => x.constants)],
      ruleIds: uniq([c.rule, ...inputs.flatMap((x) => x.ruleIds)]),
      derivation: c.text(inputs.map((x) => x.value)),
      uses: [
        ...c.deps.map((d) => ({ symbol: s, value: null, dep: d, depth: 0 })),
        ...inputs.flatMap((x) => x.uses.map((u) => ({ ...u, depth: u.depth + 1 }))),
      ],
    };
    if (!best || res.learnerNodeIds.length > best.learnerNodeIds.length) best = res;
  }
  return best;
}

/** Kinds held equal by a "fixed" constraint: a fixed radius also fixes d and A. */
export function constraintGroup(c: Constraint): Kind[] {
  const k = kindOf(c.symbols[0]);
  return k === 'r' || k === 'd' ? ['r', 'd', 'A'] : k === 'h' ? ['h'] : [];
}

function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

export function containsValue(list: readonly ExactValue[], v: ExactValue): boolean {
  return list.some((x) => equals(x, v));
}
