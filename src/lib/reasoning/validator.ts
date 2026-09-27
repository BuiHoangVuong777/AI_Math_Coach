/**
 * Math Validator (§8.5). Deterministic only — no LLM input is ever consulted.
 *
 * For each node it separates
 *   inference   — does the step follow from the learner's own premises?
 *   groundTruth — is the claim true for the confirmed problem?
 * and never rewrites what the learner claimed.
 */
import { ExactError, approxMatches, decimalsOf, div, equals, exact, formatExact, fromDecimal, mul, pow, sqrt, sub, ONE, PI } from './exact.ts';
import { ExprError, evaluate, literalValues, parseExpr, symbolsIn, type Ast, type Env } from './expr.ts';
import type { ProblemFacts } from './facts.ts';
import { RULES, containsValue, factorSymbol, indexOf, kindOf, lengthPower, resolve, type Provider, type Resolution } from './rules.ts';
import { SYMBOLS } from './types.ts';
import type {
  ExactValue, ExperimentState, Fact, Kind, MathStatement, ProblemSpec, ReasoningNode, SymbolId, ValidationResult,
} from './types.ts';
import { ENGINE_VERSION } from './types.ts';

export interface ProducerInfo {
  nodeId: string;
  value: ExactValue;
  rowIndex: number;
}

export interface ValidationContext {
  spec: ProblemSpec;
  facts: ProblemFacts;
  graphVersion: number;
  /** Active learner producers of each symbol from rows before the node being validated. */
  producers: Partial<Record<SymbolId, ProducerInfo>>;
  /** Symbols whose only learner producer before this node was retracted. */
  blocked: Set<SymbolId>;
  /** Status of already-validated nodes (earlier rows) and problem nodes. */
  statusOf: (nodeId: string) => ValidationResult['status'] | 'given' | undefined;
  /** Earlier revisions' claimed values of producer nodes (premise_changed detection). */
  previousValues: (nodeId: string) => ExactValue[];
  experiment: ExperimentState | null;
}

interface Partial0 {
  status?: ValidationResult['status'];
  inference: ValidationResult['checks']['inference'];
  groundTruth: ValidationResult['checks']['groundTruth'];
  units: ValidationResult['checks']['units'];
  reasons: string[];
  misconceptions: { code: string; evidence: string }[];
  deps: string[];
  facts: Fact[];
  method: ValidationResult['method'];
  producedSymbol: SymbolId | null;
  claimedValue: ExactValue | null;
  learnerDeps: string[];
  /** v0.5 dependency metadata (symbol, direct/indirect, origin, broken) keyed by dep id. */
  depMeta: Record<string, DepMeta>;
  ruleIds: string[];
}

export interface DepMeta {
  symbol?: SymbolId;
  direct?: boolean;
  origin?: 'premise' | 'justification';
  broken?: boolean;
}

const blank = (): Partial0 => ({
  inference: 'not_checked', groundTruth: 'unknown', units: 'not_applicable', reasons: [], misconceptions: [], deps: [],
  facts: [], method: 'none', producedSymbol: null, claimedValue: null, learnerDeps: [], depMeta: {}, ruleIds: [],
});

function meta(out: Partial0, dep: string, patch: DepMeta): void {
  const cur = out.depMeta[dep] ?? {};
  out.depMeta[dep] = {
    ...cur,
    ...patch,
    symbol: cur.symbol ?? patch.symbol,
    direct: cur.direct || patch.direct,
    origin: cur.origin === 'justification' || patch.origin === 'justification' ? 'justification' : 'premise',
    broken: cur.broken || patch.broken,
  };
}

/** Records the premises of a resolution: symbols of base values, and which ones are direct. */
function recordUses(out: Partial0, r: Resolution, directDepth: number): void {
  for (const u of r.uses) {
    const isCondition = u.dep.startsWith('c:') || u.dep.startsWith('rel:');
    meta(out, u.dep, { symbol: u.value ? u.symbol : undefined, direct: isCondition || u.depth <= directDepth });
  }
}

// ------------------------------------------------------------------ providers

export function learnerProvider(ctx: ValidationContext, override?: { nodeId: string; value: ExactValue }): Provider {
  return {
    base: (s) => {
      const p = ctx.producers[s];
      if (p) return { value: override && override.nodeId === p.nodeId ? override.value : p.value, dep: p.nodeId, learnerNodeId: p.nodeId };
      if (ctx.blocked.has(s)) return 'blocked';
      const g = ctx.spec.givens.find((x) => x.symbol === s);
      if (g) return { value: g.value, dep: `g:${s}` };
      return undefined;
    },
    relations: ctx.spec.relations,
    constraints: ctx.spec.constraints,
  };
}

function envFrom(p: Provider): { env: Env; used: Resolution[] } {
  const used: Resolution[] = [];
  const env: Env = (s) => {
    const r = resolve(s as SymbolId, p);
    if (r) used.push(r);
    return r?.value;
  };
  return { env, used };
}

/** All learner-premise values of the problem's quantities (allowed substitution literals). */
function premiseValues(ctx: ValidationContext, p: Provider): ExactValue[] {
  const out: ExactValue[] = [];
  const syms: SymbolId[] = ['r1', 'r2', 'd1', 'd2', 'h1', 'h2', 'A1', 'A2', 'V1', 'V2', 'kr', 'kh', 'kA', 'kV'];
  for (const s of syms) {
    const r = resolve(s, p);
    if (r) out.push(r.value);
  }
  for (const rel of ctx.spec.relations) out.push(rel.value, div(ONE, rel.value));
  out.push(exact(1), exact(2), exact(100));
  return out;
}

// ------------------------------------------------------------------ helpers

function isBareLiteral(ast: Ast): boolean {
  return ast.t === 'num' || ast.t === 'pi' || (ast.t === 'mul' && ((ast.a.t === 'num' && ast.b.t === 'pi') || (ast.a.t === 'pi' && ast.b.t === 'num')));
}

/** "~283" (written after ≈) or a decimal "282.74" is compared as an approximation. */
function isDecimalLiteral(src: string): { value: number; decimals: number } | null {
  const t = src.trim();
  const approx = /^~(\d+(?:\.\d+)?)$/.exec(t);
  if (approx) return { value: Number(approx[1]), decimals: decimalsOf(approx[1]) };
  const m = /^\d+\.\d+$/.exec(t);
  return m ? { value: Number(t), decimals: decimalsOf(t) } : null;
}

const PERCENT_CHAIN = /^1\+\d+(?:\.\d+)?\/100$/;

const UNIT_POW: Record<string, number> = { '': 1, '²': 2, '³': 3 };

function checkUnit(target: SymbolId, unit: string | null, spec: ProblemSpec): ValidationResult['checks']['units'] {
  if (!unit) return 'not_applicable';
  const m = /^(mm|cm|dm|m)([²³]?)$/.exec(unit);
  if (!m) return 'mismatch';
  if (spec.unit && m[1] !== spec.unit) return 'mismatch';
  const expected = lengthPower(target);
  if (expected === 0) return 'mismatch';
  return UNIT_POW[m[2]] === expected ? 'ok' : 'mismatch';
}

function factFor(ctx: ValidationContext, s: SymbolId): Fact | null {
  const f = ctx.facts[s];
  if (!f) return null;
  return { id: `f:${s}`, symbol: s, value: f.value, unit: unitOf(s, ctx.spec), derivation: f.derivation, provenance: 'verified_fact', disclosable: false };
}

export function unitOf(s: SymbolId, spec: ProblemSpec): string | null {
  if (!spec.unit) return null;
  const p = lengthPower(s);
  return p === 0 ? null : spec.unit + (p === 2 ? '²' : p === 3 ? '³' : '');
}

// ------------------------------------------------------------------ probes (possible misconceptions)

function probeEquation(target: SymbolId, claimed: ExactValue, ctx: ValidationContext, p: Provider, chainSrc: string[]): { code: string; evidence: string }[] {
  const out: { code: string; evidence: string }[] = [];
  const k = kindOf(target);
  const i = indexOf(target);
  const val = (s: SymbolId) => resolve(s, p)?.value ?? null;
  const tryV = (f: () => ExactValue) => {
    try {
      return f();
    } catch (e) {
      if (e instanceof ExactError) return null;
      throw e;
    }
  };
  const same = (x: ExactValue | null) => !!x && equals(x, claimed);
  if (i) {
    const d = val(`d${i}` as SymbolId);
    const r = val(`r${i}` as SymbolId);
    const h = val(`h${i}` as SymbolId);
    const A = val(`A${i}` as SymbolId);
    if (k === 'r' && same(d)) out.push({ code: 'radius_diameter', evidence: 'Giá trị bán kính bằng đường kính trong đề.' });
    if (k === 'A' && d && same(tryV(() => mul(PI, pow(d, 2))))) out.push({ code: 'radius_diameter', evidence: 'Diện tích đáy tính bằng đường kính thay cho bán kính.' });
    if (k === 'V' && d && h && same(tryV(() => mul(mul(PI, pow(d, 2)), h)))) out.push({ code: 'radius_diameter', evidence: 'Thể tích tính bằng đường kính thay cho bán kính.' });
    if (k === 'A' && r && same(tryV(() => mul(PI, mul(exact(2), r))))) out.push({ code: 'square_as_double', evidence: 'r² được tính như 2·r.' });
    if (k === 'A' && r && same(tryV(() => pow(r, 2)))) out.push({ code: 'missing_pi', evidence: 'Kết quả thiếu thừa số π.' });
    if (k === 'V' && r && h && same(tryV(() => mul(pow(r, 2), h)))) out.push({ code: 'missing_pi', evidence: 'Kết quả thiếu thừa số π.' });
    if (k === 'V' && A && same(A)) out.push({ code: 'forgot_height', evidence: 'Thể tích bằng diện tích đáy (chưa nhân chiều cao).' });
    if (k === 'V' && r && h && same(tryV(() => mul(mul(PI, mul(exact(2), r)), h)))) out.push({ code: 'square_as_double', evidence: 'r² được tính như 2·r.' });
  } else {
    const kr = val('kr');
    const truth = ctx.facts[target]?.value ?? val(target);
    if ((target === 'kV' || target === 'kA') && kr && same(kr) && !(truth && equals(truth, kr))) out.push({ code: 'linear_scaling', evidence: 'Hệ số em nêu bằng hệ số của bán kính.' });
    if (truth && same(tryV(() => sub(truth, ONE)))) out.push({ code: 'increase_vs_factor', evidence: 'Có thể em tính phần tăng thêm thay cho số lần.' });
    const pct = chainSrc.map((c) => /^1\+(\d+(?:\.\d+)?)\/100$/.exec(c)).find(Boolean);
    if (pct && truth && equals(div(fromDecimal(pct[1]), exact(100)), truth)) {
      out.push({ code: 'percent_vs_factor', evidence: `Tăng ${pct[1]}% nghĩa là gấp ${formatExact(claimed)} lần.` });
    }
  }
  return out;
}

// ------------------------------------------------------------------ equation / conclusion

function validateEquation(node: ReasoningNode, st: { target: SymbolId | null; chain: string[]; unit: string | null }, ctx: ValidationContext): Partial0 {
  const out = blank();
  out.method = 'exact_rational_pi';
  const target = st.target;
  if (!target) {
    out.status = 'ambiguous';
    out.reasons.push('missing_quantity');
    return out;
  }
  const p = learnerProvider(ctx);
  let asts: Ast[];
  try {
    asts = st.chain.map((c) => parseExpr(c.replace(/^~/, '')));
  } catch {
    out.status = 'unverified';
    out.reasons.push('outside_grammar');
    return out;
  }
  const { env, used } = envFrom(p);
  const values: (ExactValue | null)[] = [];
  const approx: ({ value: number; decimals: number } | null)[] = [];
  for (let idx = 0; idx < asts.length; idx++) {
    const dec = isDecimalLiteral(st.chain[idx]);
    approx.push(dec && idx > 0 ? dec : null);
    try {
      values.push(evaluate(asts[idx], env));
    } catch (e) {
      if (e instanceof ExprError && e.code === 'unknown_symbol') {
        out.status = 'insufficient_evidence';
        out.reasons.push('missing_premise');
        return out;
      }
      if (e instanceof ExactError) {
        out.status = 'unverified';
        out.reasons.push(e.code === 'irrational_result' ? 'irrational_result' : e.code === 'numeric_overflow' ? 'numeric_overflow' : 'outside_grammar');
        return out;
      }
      throw e;
    }
  }
  // Symbols the learner used explicitly in the chain are premises.
  for (const r of used) {
    out.learnerDeps.push(...r.learnerNodeIds);
    out.deps.push(...r.deps);
    recordUses(out, r, 1);
  }

  // (1) every "=" in the chain
  let lastExact: ExactValue | null = values[0];
  let arithmeticOk = true;
  for (let idx = 1; idx < values.length; idx++) {
    const a = approx[idx];
    const prev = lastExact!;
    if (a) {
      if (!approxMatches(prev, a.value, a.decimals)) arithmeticOk = false;
      else out.reasons.push('approximation');
      continue;
    }
    if (!equals(values[idx]!, prev)) arithmeticOk = false;
    lastExact = values[idx];
  }
  const claimed = lastExact!;
  out.claimedValue = claimed;
  out.producedSymbol = target;
  if (!arithmeticOk) out.reasons.push('arithmetic_error');

  // (2)(3) formula application with the learner's current premises
  const first = asts[0];
  // A percent claim ("tăng thêm 300%") is a stated value, not a substitution.
  const bare = (isBareLiteral(first) || PERCENT_CHAIN.test(st.chain[0])) && asts.length === 1;
  const lv = resolve(target, p);
  if (lv) {
    out.deps.push(...lv.deps);
    out.learnerDeps.push(...lv.learnerNodeIds);
    out.ruleIds.push(...lv.ruleIds);
    recordUses(out, lv, -1); // symbols/indirect by default; direct ones are decided below
  }
  if (!bare && first.t !== 'sym' && !isBareLiteral(first)) {
    const allowed = [...premiseValues(ctx, p), ...(lv ? [...lv.values, ...lv.constants] : [])];
    const lits = literalValues(first);
    const litsOk = lits.every((l) => containsValue(allowed, l));
    const valueOk = !!lv && equals(values[0]!, lv.value);
    out.inference = litsOk && valueOk && arithmeticOk ? 'follows' : 'does_not_follow';
    // Outside the derivation path a literal is attributed only when the step really follows.
    markSubstitutedSources(out, lits, lv, ctx, p, out.inference === 'follows');
    if (out.inference === 'does_not_follow' && arithmeticOk) {
      const changed = premiseChanged(target, values[0]!, lits, ctx);
      if (changed) {
        out.reasons.push('premise_changed');
        for (const id of changed) {
          out.learnerDeps.push(id);
          out.deps.push(id);
          const sym = (Object.entries(ctx.producers).find(([, v]) => v?.nodeId === id)?.[0] ?? undefined) as SymbolId | undefined;
          meta(out, id, { symbol: sym, direct: true, broken: true });
        }
      } else out.reasons.push('premise_mismatch');
    }
    out.method = lv?.ruleIds.some((r) => r.startsWith('R-K')) ? 'scaling_law' : 'exact_rational_pi';
  } else if (first.t === 'sym') {
    // "A₂ = A₁ = 9π": the first element is a premise itself; check it equals the derived value.
    out.inference = lv && equals(values[0]!, lv.value) && arithmeticOk ? 'follows' : arithmeticOk ? 'does_not_follow' : 'does_not_follow';
    if (lv && !equals(values[0]!, lv.value)) out.reasons.push('premise_mismatch');
  } else if (asts.length > 1 && isBareLiteral(first)) {
    // "V₁ = 108π ≈ 339,29": a direct value then an approximation.
    out.inference = arithmeticOk ? 'not_applicable' : 'does_not_follow';
  } else {
    // Bare claim ("r₁ = 6 cm", "thể tích gấp 9 lần"): it follows only through learner premises, if any.
    if (lv && lv.learnerNodeIds.length) {
      out.inference = equals(claimed, lv.value) ? 'follows' : 'does_not_follow';
      recordUses(out, lv, 1);
    } else {
      out.inference = 'not_applicable';
      out.deps = [];
      out.learnerDeps = [];
      out.depMeta = {};
      out.ruleIds = [];
    }
  }

  // (4) units
  out.units = checkUnit(target, st.unit, ctx.spec);
  if (out.units === 'mismatch') out.reasons.push('unit_error');

  // (5) ground truth against verified facts
  const truth = factFor(ctx, target);
  if (truth) {
    out.facts.push(truth);
    const lastApprox = approx[approx.length - 1];
    const trueNow = equals(claimed, truth.value) && (!lastApprox || approxMatches(truth.value, lastApprox.value, lastApprox.decimals));
    out.groundTruth = trueNow ? 'true' : 'false';
  }
  if (out.groundTruth === 'false' && out.inference !== 'follows' && !out.reasons.includes('premise_changed')) {
    out.misconceptions = probeEquation(target, claimed, ctx, p, st.chain);
    if (!out.reasons.length || out.reasons.every((r) => r === 'approximation')) out.reasons.push('wrong_value');
  }
  if (node.rowIndex === 0) out.reasons.push('contradicts_problem_text');
  return out;
}

/**
 * Direct premises of a substitution: each literal the learner substituted is matched
 * to the premise that holds that value — first on the derivation path of the target,
 * then among all the learner's premises (a learner producer before a given).
 */
function markSubstitutedSources(out: Partial0, lits: ExactValue[], lv: Resolution | null, ctx: ValidationContext, p: Provider, allowGlobal: boolean): void {
  const global: { symbol: SymbolId; dep: string; value: ExactValue; learner: boolean }[] = [];
  for (const s of SYMBOLS) {
    const b = p.base(s);
    if (b && b !== 'blocked') global.push({ symbol: s, dep: b.dep, value: b.value, learner: !!b.learnerNodeId });
  }
  global.sort((a, b) => Number(b.learner) - Number(a.learner));
  for (const l of lits) {
    const onPath = lv?.uses.filter((u) => u.value && equals(u.value, l)).sort((a, b) => a.depth - b.depth)[0];
    const hit = onPath ? { symbol: onPath.symbol, dep: onPath.dep } : allowGlobal ? global.find((g) => equals(g.value, l)) : undefined;
    if (!hit) continue;
    if (!out.deps.includes(hit.dep)) out.deps.push(hit.dep);
    if (/^n\d+$|^f1-/.test(hit.dep) && !out.learnerDeps.includes(hit.dep)) out.learnerDeps.push(hit.dep);
    meta(out, hit.dep, { symbol: hit.symbol, direct: true });
  }
  void ctx;
}

function premiseChanged(target: SymbolId, firstValue: ExactValue, lits: ExactValue[], ctx: ValidationContext): string[] | null {
  const producers = Object.values(ctx.producers).filter((p): p is ProducerInfo => !!p);
  const trial = (overrides: Map<string, ExactValue>): boolean => {
    const prov: Provider = {
      ...learnerProvider(ctx),
      base: (s) => {
        const p = ctx.producers[s];
        if (p && overrides.has(p.nodeId)) return { value: overrides.get(p.nodeId)!, dep: p.nodeId, learnerNodeId: p.nodeId };
        return learnerProvider(ctx).base(s);
      },
    };
    const lv = resolve(target, prov);
    if (!lv || !lv.learnerNodeIds.some((id) => overrides.has(id))) return false;
    const allowed = [...premiseValues(ctx, prov), ...lv.values, ...lv.constants];
    return equals(lv.value, firstValue) && lits.every((l) => containsValue(allowed, l));
  };
  // One changed premise…
  for (const p of producers) {
    for (const old of ctx.previousValues(p.nodeId)) if (trial(new Map([[p.nodeId, old]]))) return [p.nodeId];
  }
  // …or several premises revised since this row was written (their latest previous values together).
  const all = new Map<string, ExactValue>();
  for (const p of producers) {
    const prev = ctx.previousValues(p.nodeId);
    if (prev.length) all.set(p.nodeId, prev[prev.length - 1]);
  }
  if (all.size > 1) {
    const firstPrev = new Map<string, ExactValue>();
    for (const p of producers) {
      const prev = ctx.previousValues(p.nodeId);
      if (prev.length) firstPrev.set(p.nodeId, prev[0]);
    }
    for (const combo of [all, firstPrev]) {
      if (!trial(combo)) continue;
      // Blame the sources whose old value the learner actually substituted.
      const used = [...combo.entries()].filter(([, old]) => lits.some((l) => equals(l, old))).map(([id]) => id);
      return used.length ? used : [...combo.keys()];
    }
  }
  return null;
}

// ------------------------------------------------------------------ scaling law

function solveFactors(known: Partial<Record<SymbolId, ExactValue>>, target: SymbolId): ExactValue | null {
  const k = { ...known };
  try {
    for (let pass = 0; pass < 3; pass++) {
      if (!k.kA && k.kr) k.kA = pow(k.kr, 2);
      if (!k.kr && k.kA) k.kr = sqrt(k.kA);
      if (!k.kV && k.kA && k.kh) k.kV = mul(k.kA, k.kh);
      if (!k.kh && k.kV && k.kA) k.kh = div(k.kV, k.kA);
      if (!k.kA && k.kV && k.kh) k.kA = div(k.kV, k.kh);
    }
  } catch (e) {
    if (!(e instanceof ExactError)) throw e;
  }
  return k[target] ?? null;
}

function validateScaling(node: ReasoningNode, st: Extract<MathStatement, { kind: 'scaling' }>, ctx: ValidationContext): Partial0 {
  const out = blank();
  out.method = 'scaling_law';
  const known: Partial<Record<SymbolId, ExactValue>> = {};
  for (const c of st.changes) known[c.symbol] = c.factor;
  for (const s of st.fixed) known[s] ??= ONE;
  const p = learnerProvider(ctx);
  // Missing factors come from the problem (implicit premise), e.g. "giữ nguyên chiều cao".
  for (const s of ['kr', 'kh'] as SymbolId[]) {
    if (known[s]) continue;
    const needed = st.claim.symbol === 'kV' || (st.claim.symbol === 'kA' && s === 'kr');
    if (!needed) continue;
    const r = resolve(s, p);
    if (r) {
      known[s] = r.value;
      out.deps.push(...r.deps);
      out.learnerDeps.push(...r.learnerNodeIds);
      recordUses(out, r, 1);
    }
  }
  // chain of the claimed factor ("3² = 9") must be consistent
  let chainOk = true;
  try {
    const vals = st.chain.map((c) => evaluate(parseExpr(c)));
    for (let i = 1; i < vals.length; i++) if (!equals(vals[i], vals[i - 1])) chainOk = false;
    if (vals.length && !equals(vals[vals.length - 1], st.claim.factor)) chainOk = false;
  } catch {
    chainOk = st.chain.length === 0;
  }
  if (!chainOk) out.reasons.push('arithmetic_error');
  const expected = solveFactors(known, st.claim.symbol);
  if (!expected) {
    out.status = 'insufficient_evidence';
    out.reasons.push('missing_premise');
    return out;
  }
  const holds = equals(expected, st.claim.factor) && chainOk;
  out.ruleIds.push(st.claim.symbol === 'kA' ? 'R-KA' : st.fixed.includes('kh') || known.kh && equals(known.kh, ONE) ? 'R-KV-h' : 'R-KV');
  out.inference = holds ? 'follows' : 'does_not_follow';
  out.groundTruth = holds ? 'true' : 'false';
  out.claimedValue = st.claim.factor;
  // It speaks about this problem when its changes match the problem's actual changes.
  const matches = st.changes.every((c) => {
    const f = ctx.facts[c.symbol];
    return f && equals(f.value, c.factor);
  });
  if (matches) {
    out.producedSymbol = st.claim.symbol;
    for (const c of st.changes) {
      for (const d of ctx.facts[c.symbol]?.deps ?? []) {
        out.deps.push(d);
        meta(out, d, { symbol: d.startsWith('g:') ? (d.slice(2) as SymbolId) : undefined, direct: true });
      }
    }
    const truth = factFor(ctx, st.claim.symbol);
    if (truth) out.facts.push(truth);
  }
  out.facts.push({
    id: `f:law:${node.id}`, symbol: st.claim.symbol, value: expected, unit: null,
    derivation: `${RULES[st.claim.symbol === 'kA' ? 'R-KA' : 'R-KV'].name}`, provenance: 'verified_fact', disclosable: false,
  });
  if (!holds) {
    const kr = known.kr;
    if (kr && equals(st.claim.factor, kr) && (st.claim.symbol === 'kA' || st.claim.symbol === 'kV')) {
      out.misconceptions.push({ code: 'linear_scaling', evidence: 'Hệ số em nêu bằng hệ số của bán kính.' });
    }
    try {
      if (equals(st.claim.factor, sub(expected, ONE))) out.misconceptions.push({ code: 'increase_vs_factor', evidence: 'Có thể em tính phần tăng thêm thay cho số lần.' });
    } catch {
      /* non-monomial */
    }
    out.reasons.push('scaling_claim_false');
  }
  return out;
}

// ------------------------------------------------------------------ observation (F6)

export function experimentValues(spec: ProblemSpec, facts: ProblemFacts, setting: { symbol: SymbolId; value: ExactValue }): Partial<Record<SymbolId, ExactValue>> {
  const r1 = facts.r1?.value;
  const h1 = facts.h1?.value;
  const r2 = setting.symbol === 'r2' ? setting.value : facts.r2?.value ?? r1;
  const h2 = setting.symbol === 'h2' ? setting.value : facts.h2?.value ?? h1;
  const out: Partial<Record<SymbolId, ExactValue>> = {};
  if (r1) out.r1 = r1;
  if (h1) out.h1 = h1;
  if (r2) out.r2 = r2;
  if (h2) out.h2 = h2;
  try {
    if (r1) out.A1 = mul(PI, pow(r1, 2));
    if (r2) out.A2 = mul(PI, pow(r2, 2));
    if (out.A1 && h1) out.V1 = mul(out.A1, h1);
    if (out.A2 && h2) out.V2 = mul(out.A2, h2);
  } catch (e) {
    if (!(e instanceof ExactError)) throw e;
  }
  void spec;
  return out;
}

function validateObservation(st: Extract<MathStatement, { kind: 'observation' }>, ctx: ValidationContext): Partial0 {
  const out = blank();
  out.method = 'exact_rational_pi';
  if (!st.setting) {
    out.status = 'ambiguous';
    out.reasons.push('missing_quantity');
    return out;
  }
  const ev = experimentValues(ctx.spec, ctx.facts, st.setting);
  let ok = true;
  let last: ExactValue | null = null;
  try {
    for (const c of st.claims) {
      if (c.symbol) {
        const vals = c.chain.map((x) => evaluate(parseExpr(x), (s) => ev[s as SymbolId]));
        const truth = ev[c.symbol];
        const v = vals[vals.length - 1];
        if (!truth || !equals(v, truth)) ok = false;
        last = v;
        if (truth) out.facts.push({ id: `x:${c.symbol}`, symbol: c.symbol, value: truth, unit: unitOf(c.symbol, ctx.spec), derivation: `giá trị thử nghiệm với ${st.setting.symbol} = ${formatExact(st.setting.value)}`, provenance: 'experiment_value', disclosable: true });
      } else if (c.ofValue && last) {
        const ratio = div(last, evaluate(parseExpr(c.ofValue)));
        const k = evaluate(parseExpr(c.chain[0]));
        if (c.negated ? equals(ratio, k) : !equals(ratio, k)) ok = false;
      } else if (c.negated && last) {
        const base = ev.A1 && last.piPow === 1 && ev.A2 && equals(last, ev.A2) ? ev.A1 : null;
        if (base && equals(div(last, base), evaluate(parseExpr(c.chain[0])))) ok = false;
      }
    }
  } catch (e) {
    if (!(e instanceof ExprError || e instanceof ExactError)) throw e;
    out.status = 'unverified';
    out.reasons.push('outside_grammar');
    return out;
  }
  out.inference = ok ? 'follows' : 'does_not_follow';
  out.groundTruth = ok ? 'true' : 'false';
  const visited = ctx.experiment?.visited ?? [];
  if (!visited.some((v) => Math.abs(v - st.setting!.value.n / st.setting!.value.d) < 1e-9)) out.reasons.push('value_not_visited');
  if (!ok) out.reasons.push('wrong_value');
  return out;
}

// ------------------------------------------------------------------ formula / strategy / justification

const POINTS: Record<string, ExactValue>[] = [
  { r: exact(2), h: exact(3) },
  { r: exact(3, 2), h: exact(7) },
  { r: exact(5), h: exact(11, 3) },
];

function validateFormula(st: Extract<MathStatement, { kind: 'formula' }>): Partial0 & { ruleId?: string } {
  const out: Partial0 & { ruleId?: string } = { ...blank(), method: 'rule_catalog' };
  const canon: Record<Kind, (e: Record<string, ExactValue>) => ExactValue> = {
    A: (e) => mul(PI, pow(e.r, 2)),
    V: (e) => mul(mul(PI, pow(e.r, 2)), e.h),
    d: (e) => mul(exact(2), e.r),
    r: (e) => e.r,
    h: (e) => e.h,
  };
  try {
    const ast = parseExpr(st.rhs);
    const vars = new Set(symbolsIn(ast));
    let ok = true;
    for (const pt of POINTS) {
      const env: Record<string, ExactValue> = { r: pt.r, h: pt.h, d: mul(exact(2), pt.r), A: mul(PI, pow(pt.r, 2)), V: mul(mul(PI, pow(pt.r, 2)), pt.h) };
      if (vars.has(st.lhs)) return { ...out, status: 'unverified', reasons: ['outside_rule_catalog'] };
      if (!equals(evaluate(ast, (s) => env[s]), canon[st.lhs](env))) ok = false;
    }
    out.inference = ok ? 'follows' : 'does_not_follow';
    out.groundTruth = ok ? 'true' : 'false';
    out.ruleId = st.lhs === 'A' ? 'R-A' : st.lhs === 'V' ? (vars.has('A') ? 'R-V1' : 'R-V2') : st.lhs === 'd' || st.lhs === 'r' ? 'R-D' : 'R-INV-h';
    if (!ok) out.reasons.push('wrong_formula');
  } catch (e) {
    if (!(e instanceof ExprError || e instanceof ExactError)) throw e;
    out.status = 'unverified';
    out.reasons.push('outside_rule_catalog');
  }
  return out;
}

function validateStrategy(st: Extract<MathStatement, { kind: 'strategy' }>, ctx: ValidationContext): Partial0 {
  const out: Partial0 = { ...blank(), method: 'plan_check' };
  const plan = new Set(st.plan);
  if (plan.has('outside:calculus')) return { ...out, status: 'unverified', reasons: ['outside_rule_catalog'] };
  if (plan.has('wrong:perimeter')) return { ...out, inference: 'does_not_follow', groundTruth: 'false', reasons: ['wrong_formula'] };
  const unknowns = ctx.spec.unknowns.map((u) => u.symbol);
  const hasDiameter = ctx.spec.givens.some((g) => g.symbol.startsWith('d'));
  let reaches = true;
  for (const u of unknowns) {
    if (u === 'kV' || u === 'kA') reaches &&= plan.has('ratio_of_volumes') || plan.has('ratio_scaling_law') || (u === 'kA' && plan.has('compute_A'));
    else if (u.startsWith('V')) reaches &&= plan.has('compute_V');
    else if (u.startsWith('A')) reaches &&= plan.has('compute_A') || plan.has('compute_V');
    else reaches &&= plan.size > 0;
  }
  const missingR = hasDiameter && (plan.has('compute_A') || plan.has('compute_V')) && !plan.has('derive_r_from_d') && !plan.has('ratio_scaling_law');
  if (!reaches || missingR) return { ...out, status: 'insufficient_evidence', inference: 'not_applicable', reasons: ['plan_missing_step'] };
  return { ...out, inference: 'follows', groundTruth: 'true', reasons: ['plan_reaches_unknown'] };
}

function validateJustification(node: ReasoningNode, ctx: ValidationContext): Partial0 {
  const out: Partial0 = { ...blank(), method: 'rule_catalog' };
  const j = node.interpretation.justification;
  if (!j) return { ...out, status: 'insufficient_evidence', reasons: ['vague_justification'] };
  const falseFixed = (j.claimsFixed ?? []).filter((k) => !ctx.spec.constraints.some((c) => c.symbols[0][0] === k || (k === 'r' && c.symbols[0][0] === 'd')));
  if (falseFixed.length) return { ...out, inference: 'does_not_follow', groundTruth: 'false', reasons: ['false_justification'] };
  if (j.vague) return { ...out, status: 'insufficient_evidence', reasons: ['vague_justification'] };
  out.deps.push(...j.citesConstraintIds.map((c) => `c:${c}`), ...j.citesRelationIds.map((r) => `rel:${r}`));
  for (const d of out.deps) meta(out, d, { direct: true, origin: 'justification' });
  out.ruleIds.push(...j.ruleIds);
  return { ...out, inference: 'follows', groundTruth: 'true' };
}

// ------------------------------------------------------------------ entry point

export function validateNode(node: ReasoningNode, ctx: ValidationContext): NodeCheck {
  const interp = node.interpretation;
  let r: Partial0;
  let ruleIds: string[] = [];
  if (interp.status === 'ambiguous' || interp.status === 'rejected_by_learner') {
    r = { ...blank(), status: 'ambiguous', reasons: interp.status === 'rejected_by_learner' ? ['rejected_by_learner'] : interp.ambiguities.map((a) => a.code) };
  } else if (interp.status === 'unparsed' || !interp.normalized) {
    r = { ...blank(), status: 'unverified', reasons: [interp.provenance === 'llm_interpretation' ? 'grounding_failed' : 'outside_grammar'] };
  } else if (interp.outOfScope) {
    r = { ...blank(), status: 'unverified', reasons: ['outside_poc_scope'] };
  } else {
    const st = interp.normalized;
    switch (st.kind) {
      case 'equation':
        r = validateEquation(node, st, ctx);
        break;
      case 'conclusion':
        r = validateEquation(node, { target: st.target, chain: [valueExpr(st.value)], unit: st.unit }, ctx);
        break;
      case 'scaling':
        r = validateScaling(node, st, ctx);
        break;
      case 'observation':
        r = validateObservation(st, ctx);
        break;
      case 'formula': {
        const f = validateFormula(st);
        r = f;
        if (f.ruleId) ruleIds = [f.ruleId];
        r.ruleIds.push(...ruleIds);
        break;
      }
      case 'strategy':
        r = validateStrategy(st, ctx);
        break;
      case 'justification':
        r = validateJustification(node, ctx);
        break;
      case 'question':
        r = { ...blank(), status: 'unverified', reasons: ['question'] };
        break;
      default:
        r = { ...blank(), status: 'unverified', reasons: ['outside_grammar'] };
    }
  }

  // Inline justification ("… vì …"): cited constraints/relations are premises; a false "unchanged" claim is an error.
  const j = interp.justification;
  if (j && interp.normalized?.kind !== 'justification' && !r.status) {
    const cited = [...j.citesConstraintIds.map((c) => `c:${c}`), ...j.citesRelationIds.map((x) => `rel:${x}`)];
    r.deps.push(...cited);
    for (const d of cited) meta(r, d, { direct: true, origin: 'justification' });
    r.ruleIds.push(...j.ruleIds);
    const falseFixed = (j.claimsFixed ?? []).filter((k) => !ctx.spec.constraints.some((c) => c.symbols[0][0] === k || (k === 'r' && c.symbols[0][0] === 'd')));
    if (falseFixed.length) r.reasons.push('false_justification');
  }

  // Hypotheses are recorded but never become symbol producers.
  if (interp.semanticType === 'hypothesis' || node.keptAsHypothesis) r.producedSymbol = null;

  // ------------------------------------------------ status resolution (§8.5 order)
  const learnerDeps = [...new Set(r.learnerDeps.concat(r.deps.filter((d) => /^n\d+$|^f1-/.test(d))))];
  const depStatuses = learnerDeps.map((d) => [d, ctx.statusOf(d)] as const);
  let status: ValidationResult['status'];
  if (r.status) status = r.status;
  else if (r.groundTruth === 'false' || r.inference === 'does_not_follow' || r.units === 'mismatch' || r.reasons.includes('false_justification')) status = 'invalid';
  else if (depStatuses.some(([, s]) => s === 'invalid')) status = 'insufficient_evidence';
  else if (depStatuses.some(([, s]) => s === 'ambiguous' || s === 'unverified' || s === 'insufficient_evidence')) status = 'insufficient_evidence';
  else status = 'valid';

  const invalidDeps = depStatuses.filter(([, s]) => s === 'invalid').map(([d]) => d);
  if (invalidDeps.length && r.inference === 'follows') r.reasons.push('depends_on_invalid');
  else if (invalidDeps.length && status === 'insufficient_evidence') r.reasons.push('depends_on_invalid');
  if (status === 'insufficient_evidence' && !invalidDeps.length && depStatuses.some(([, s]) => s === 'ambiguous')) r.reasons.push('depends_on_ambiguous');
  if (status === 'insufficient_evidence' && !r.reasons.length) r.reasons.push('depends_on_insufficient');

  // Support rule: a bare claim of an unknown with no premise and no reason is not enough evidence.
  const target = r.producedSymbol ?? (interp.normalized && 'target' in interp.normalized ? (interp.normalized.target as SymbolId | null) : null);
  if (
    status === 'valid' && r.inference === 'not_applicable' && target && ctx.spec.unknowns.some((u) => u.symbol === target) &&
    !(j && !j.vague)
  ) {
    status = 'insufficient_evidence';
    r.reasons.push('missing_premise');
  }

  // A valid claim of the learner makes its own value disclosable; nothing else is.
  const facts = r.facts.map((f) => ({ ...f, disclosable: f.provenance === 'experiment_value' || (status === 'valid' && f.symbol === r.producedSymbol) }));

  const validation: ValidationResult = {
    nodeId: node.id,
    nodeRevision: node.revision,
    graphVersion: ctx.graphVersion,
    problemSpecVersion: ctx.spec.version,
    status,
    checks: { inference: r.inference, groundTruth: r.groundTruth, units: r.units },
    reasonCodes: [...new Set(r.reasons)],
    possibleMisconceptions: r.misconceptions.map((m) => ({ ...m, status: 'possible' as const })),
    rootCauseNodeIds: [],
    facts,
    method: r.method,
    engineVersion: ENGINE_VERSION,
    producedSymbol: r.producedSymbol,
    claimedValue: r.claimedValue,
    ruleIds: [...new Set(r.ruleIds)],
  };
  return { validation, deps: [...new Set(r.deps)], learnerDeps, ruleIds, depMeta: r.depMeta };
}

export interface NodeCheck {
  validation: ValidationResult;
  /** Premises used: node ids, 'g:*', 'c:*', 'rel:*'. */
  deps: string[];
  learnerDeps: string[];
  ruleIds: string[];
  depMeta: Record<string, DepMeta>;
}

function valueExpr(v: ExactValue): string {
  const base = v.d === 1 ? String(v.n) : `${v.n}/${v.d}`;
  return v.piPow ? (v.d === 1 ? `${v.n}π` : `(${base})π`) : base;
}

export { factorSymbol };
