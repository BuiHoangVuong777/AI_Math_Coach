/**
 * F8 — deterministic analogous problem (§7.8). Same problem family, different
 * numbers, answer different from the main problem. No LLM. The generated text is
 * parsed by the same problem parser, so every analog is a problem the engine
 * really supports (tested round-trip).
 */
import { equals } from './exact.ts';
import { solveProblem } from './facts.ts';
import { confirmProblem, hash, parseProblem } from './problemParser.ts';
import type { ProblemSpec } from './types.ts';

function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}
const pick = <T>(r: () => number, xs: T[]): T => xs[Math.floor(r() * xs.length) % xs.length];

export type Family = 'radius_change' | 'diameter_change' | 'height_change_down' | 'height_change_up' | 'both_change' | 'compute_V' | 'compute_A' | 'inverse_h' | 'inverse_r';

export function familyOf(spec: ProblemSpec): Family {
  const unk = spec.unknowns.map((u) => u.symbol);
  if (spec.problemType === 'inverse') return unk.some((u) => u.startsWith('r')) ? 'inverse_r' : 'inverse_h';
  if (spec.problemType === 'compute') return unk.some((u) => u.startsWith('A')) && !unk.some((u) => u.startsWith('V')) ? 'compute_A' : 'compute_V';
  const hFixed = spec.constraints.some((c) => c.symbols[0][0] === 'h');
  const rFixed = spec.constraints.some((c) => c.symbols[0][0] === 'r' || c.symbols[0][0] === 'd');
  if (rFixed) {
    const rel = spec.relations.find((r) => r.target.startsWith('h'));
    return rel && rel.op === 'mul' && rel.value.n < rel.value.d ? 'height_change_down' : 'height_change_up';
  }
  if (hFixed) return spec.givens.some((g) => g.symbol.startsWith('d')) ? 'diameter_change' : 'radius_change';
  return 'both_change';
}

function render(f: Family, r: () => number, unit: string): string {
  const u = unit;
  const a = pick(r, [2, 3, 4, 5, 6]);
  const h = pick(r, [3, 4, 5, 6, 7, 8, 9]);
  const k = pick(r, [2, 3, 4, 5]);
  const m = pick(r, [2, 3]);
  const words: Record<number, string> = { 2: 'hai', 3: 'ba', 4: 'tư', 5: 'năm' };
  switch (f) {
    case 'radius_change':
      return `Một hình trụ có bán kính đáy ${a} ${u} và chiều cao ${h} ${u}. Nếu bán kính đáy tăng thành ${a * k} ${u} và giữ nguyên chiều cao thì thể tích tăng gấp bao nhiêu lần?`;
    case 'diameter_change':
      return `Một hình trụ có đường kính đáy ${2 * a} ${u} và chiều cao ${h} ${u}. Một hình trụ mới có đường kính đáy ${2 * a * k} ${u}, cùng chiều cao. Thể tích hình trụ mới gấp mấy lần hình trụ ban đầu?`;
    case 'height_change_down':
      return `Một hình trụ có bán kính đáy ${a} ${u} và chiều cao ${h * k} ${u}. Một hình trụ khác có cùng bán kính đáy nhưng chiều cao chỉ bằng một phần ${words[k]}. Thể tích hình trụ khác bằng mấy phần thể tích hình trụ ban đầu?`;
    case 'height_change_up':
      return `Một hình trụ có bán kính đáy ${a} ${u} và chiều cao ${h} ${u}. Nếu giữ nguyên bán kính đáy và chiều cao tăng thành ${h * k} ${u} thì thể tích tăng gấp bao nhiêu lần?`;
    case 'both_change':
      return `Một hình trụ có bán kính đáy ${a} ${u} và chiều cao ${h} ${u}. Nếu bán kính đáy tăng thành ${a * k} ${u} và chiều cao tăng thành ${h * m} ${u} thì thể tích tăng gấp bao nhiêu lần?`;
    case 'compute_V':
      return `Một hình trụ có bán kính đáy ${a} ${u} và chiều cao ${h} ${u}. Tính thể tích hình trụ.`;
    case 'compute_A':
      return `Một hình trụ có bán kính đáy ${a} ${u} và chiều cao ${h} ${u}. Tính diện tích đáy.`;
    case 'inverse_h':
      return `Một hình trụ có thể tích ${a * a * h}π ${u}³ và bán kính đáy ${a} ${u}. Tính chiều cao.`;
    case 'inverse_r':
      return `Một hình trụ có thể tích ${a * a * h}π ${u}³ và chiều cao ${h} ${u}. Tính bán kính đáy.`;
  }
}

/** Generates a confirmed analogous ProblemSpec, or null if no candidate passes the checks. */
export function generateAnalog(spec: ProblemSpec, seedExtra = 0): ProblemSpec | null {
  const family = familyOf(spec);
  const facts = solveProblem(spec);
  const main = spec.unknowns[spec.unknowns.length - 1]?.symbol;
  const r = rng(Number.parseInt(hash(spec.text), 36) + seedExtra);
  for (let attempt = 0; attempt < 40; attempt++) {
    const text = render(family, r, spec.unit ?? 'cm');
    const parsed = confirmProblem(parseProblem(text), []).spec;
    if (parsed.interpretationStatus !== 'confirmed') continue;
    const f2 = solveProblem(parsed);
    const u2 = parsed.unknowns[parsed.unknowns.length - 1]?.symbol;
    if (!u2 || !f2[u2]) continue;
    if (main && facts[main] && u2 === main && equals(f2[u2]!.value, facts[main]!.value)) continue;
    if (text === spec.text) continue;
    return { ...parsed, id: `${parsed.id}-analog` };
  }
  return null;
}

/**
 * A confirmed problem of the requested family (used for the optional next challenge,
 * §24.7). Same generator and round-trip checks as `generateAnalog`; texts in `avoid`
 * (the main problem, the self-check) are never repeated. Null if no candidate passes.
 */
export function generateForFamily(family: Family, seed: number, unit: string, avoid: string[] = []): ProblemSpec | null {
  const r = rng(seed);
  for (let attempt = 0; attempt < 40; attempt++) {
    const text = render(family, r, unit);
    if (avoid.includes(text)) continue;
    const parsed = confirmProblem(parseProblem(text), []).spec;
    if (parsed.interpretationStatus !== 'confirmed') continue;
    const u = parsed.unknowns[parsed.unknowns.length - 1]?.symbol;
    if (!u || !solveProblem(parsed)[u]) continue;
    return { ...parsed, id: `${parsed.id}-next` };
  }
  return null;
}
