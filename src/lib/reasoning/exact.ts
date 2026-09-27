/**
 * Exact arithmetic for the Math Validator (§8.5): reduced rationals times π^0 or π^1.
 * Generalises the π-coefficient representation of src/lib/cylinder/math.ts so that
 * results never depend on floating-point π or on a language model.
 */
import type { ExactValue } from './types.ts';

export class ExactError extends Error {
  readonly code: 'numeric_overflow' | 'non_monomial' | 'pi_power' | 'division_by_zero' | 'irrational_result' | 'invalid_number';
  constructor(code: ExactError['code'], message: string = code) {
    super(message);
    this.code = code;
  }
}

const SAFE = Number.MAX_SAFE_INTEGER;

function checkInt(x: number): number {
  if (!Number.isFinite(x) || !Number.isInteger(x) || Math.abs(x) > SAFE) throw new ExactError('numeric_overflow');
  return x;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function exact(n: number, d = 1, piPow: 0 | 1 = 0): ExactValue {
  checkInt(n);
  checkInt(d);
  if (d === 0) throw new ExactError('division_by_zero');
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g + 0, d: d / g, piPow };
}

export const ZERO = exact(0);
export const ONE = exact(1);
export const PI = exact(1, 1, 1);

/** Parses a decimal literal ("12.5", "3") into an exact rational. */
export function fromDecimal(text: string): ExactValue {
  const m = /^(\d+)(?:\.(\d+))?$/.exec(text);
  if (!m) throw new ExactError('invalid_number', text);
  const frac = m[2] ?? '';
  if (frac.length > 6) throw new ExactError('numeric_overflow');
  return exact(Number(m[1] + frac), 10 ** frac.length);
}

export function decimalsOf(text: string): number {
  const i = text.indexOf('.');
  return i < 0 ? 0 : text.length - i - 1;
}

export function isZero(a: ExactValue): boolean {
  return a.n === 0;
}

export function add(a: ExactValue, b: ExactValue): ExactValue {
  if (isZero(a)) return b;
  if (isZero(b)) return a;
  if (a.piPow !== b.piPow) throw new ExactError('non_monomial');
  return exact(checkInt(a.n * b.d + b.n * a.d), checkInt(a.d * b.d), a.piPow);
}

export function neg(a: ExactValue): ExactValue {
  return exact(-a.n, a.d, a.piPow);
}

export function sub(a: ExactValue, b: ExactValue): ExactValue {
  return add(a, neg(b));
}

export function mul(a: ExactValue, b: ExactValue): ExactValue {
  const p = a.piPow + b.piPow;
  if (p > 1) throw new ExactError('pi_power');
  const g1 = gcd(a.n, b.d);
  const g2 = gcd(b.n, a.d);
  return exact(checkInt((a.n / g1) * (b.n / g2)), checkInt((a.d / g2) * (b.d / g1)), p as 0 | 1);
}

export function div(a: ExactValue, b: ExactValue): ExactValue {
  if (isZero(b)) throw new ExactError('division_by_zero');
  const p = a.piPow - b.piPow;
  if (p < 0 || p > 1) throw new ExactError('pi_power');
  return { ...mul({ ...a, piPow: 0 }, exact(b.d, b.n)), piPow: p as 0 | 1 };
}

export function pow(a: ExactValue, e: number): ExactValue {
  if (!Number.isInteger(e) || e < 0 || e > 3) throw new ExactError('non_monomial');
  let r = ONE;
  for (let i = 0; i < e; i++) r = mul(r, a);
  return r;
}

function isqrt(x: number): number | null {
  if (x < 0) return null;
  const s = Math.round(Math.sqrt(x));
  return s * s === x ? s : null;
}

export function sqrt(a: ExactValue): ExactValue {
  if (a.piPow !== 0 || a.n < 0) throw new ExactError('irrational_result');
  const n = isqrt(a.n);
  const d = isqrt(a.d);
  if (n === null || d === null) throw new ExactError('irrational_result');
  return exact(n, d);
}

export function equals(a: ExactValue, b: ExactValue): boolean {
  if (a.n === 0 && b.n === 0) return true;
  return a.n === b.n && a.d === b.d && a.piPow === b.piPow;
}

export function toNumber(a: ExactValue): number {
  return (a.n / a.d) * (a.piPow ? Math.PI : 1);
}

/** Coefficient of π (or the plain value when piPow = 0) as a float, for rendering only. */
export function coefNumber(a: ExactValue): number {
  return a.n / a.d;
}

export function isPositive(a: ExactValue): boolean {
  return a.n > 0;
}

/**
 * Approximation rule (§8.5): a decimal written with `decimals` digits matches the exact
 * value when |x − value| ≤ 0.5·10^(−decimals).
 */
export function approxMatches(exactValue: ExactValue, written: number, decimals: number): boolean {
  const tol = 0.5 * 10 ** -decimals + 1e-12;
  return Math.abs(toNumber(exactValue) - written) <= tol;
}

function formatRational(n: number, d: number): string {
  if (d === 1) return String(n);
  // Terminating decimals with ≤ 3 digits read better than fractions ("12,5").
  let dd = d;
  while (dd % 2 === 0) dd /= 2;
  while (dd % 5 === 0) dd /= 5;
  if (dd === 1) {
    const s = String(n / d);
    if ((s.split('.')[1] ?? '').length <= 3) return s.replace('.', ',');
  }
  return `${n}/${d}`;
}

/** Vietnamese display: "16π", "π", "1/2", "12,5", "25π/2". */
export function formatExact(a: ExactValue): string {
  if (a.piPow === 0) return formatRational(a.n, a.d);
  if (a.n === 0) return '0';
  if (a.d === 1) return a.n === 1 ? 'π' : a.n === -1 ? '-π' : `${a.n}π`;
  const r = formatRational(a.n, a.d);
  return r.includes('/') ? `${a.n}π/${a.d}` : `${r}π`;
}

/** Grammar form of a value, parseable by expr.ts ("16*pi", "1/2"). */
export function exactToExpr(a: ExactValue): string {
  const base = a.d === 1 ? String(a.n) : `${a.n}/${a.d}`;
  if (a.piPow === 0) return base;
  return a.d === 1 ? `${a.n}pi` : `(${a.n}/${a.d})pi`;
}

/** A slider/float value (≤ 3 decimals) as an exact rational. */
export function fromNumber(v: number): ExactValue {
  return fromDecimal(String(Number(Math.abs(v).toFixed(3))));
}
