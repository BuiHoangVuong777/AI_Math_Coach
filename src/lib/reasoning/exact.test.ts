import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ExactError, approxMatches, div, exact, formatExact, fromDecimal, mul, pow, sqrt, add, equals, PI } from './exact.ts';
import { evalExpr, literalValues, parseExpr, numberTexts, toDisplay, tryEval, ExprError } from './expr.ts';

test('exact rationals reduce and keep π exactly', () => {
  assert.deepEqual(exact(6, 4), { n: 3, d: 2, piPow: 0 });
  assert.deepEqual(exact(3, -6), { n: -1, d: 2, piPow: 0 });
  assert.deepEqual(mul(exact(9), PI), { n: 9, d: 1, piPow: 1 });
  assert.deepEqual(div(exact(54, 1, 1), exact(108, 1, 1)), { n: 1, d: 2, piPow: 0 });
  assert.deepEqual(fromDecimal('12.5'), { n: 25, d: 2, piPow: 0 });
  assert.equal(formatExact(exact(25, 2)), '12,5');
  assert.equal(formatExact(exact(1, 3)), '1/3');
  assert.equal(formatExact(exact(16, 1, 1)), '16π');
  assert.equal(formatExact(exact(25, 2, 1)), '12,5π');
});

test('unsupported arithmetic raises typed errors, never silent floats', () => {
  assert.throws(() => mul(PI, PI), (e: unknown) => e instanceof ExactError && e.code === 'pi_power');
  assert.throws(() => add(PI, exact(1)), (e: unknown) => e instanceof ExactError && e.code === 'non_monomial');
  assert.throws(() => div(exact(1), exact(0)), (e: unknown) => e instanceof ExactError && e.code === 'division_by_zero');
  assert.throws(() => sqrt(exact(50, 3)), (e: unknown) => e instanceof ExactError && e.code === 'irrational_result');
  assert.deepEqual(sqrt(exact(9, 4)), exact(3, 2));
  assert.throws(() => pow(exact(10 ** 6), 3), (e: unknown) => e instanceof ExactError && e.code === 'numeric_overflow');
});

test('approximation rule |x − v| ≤ 0.5·10^−d (E-07)', () => {
  const v = exact(90, 1, 1); // 282.743…
  assert.ok(approxMatches(v, 282.74, 2));
  assert.ok(approxMatches(v, 282.7, 1));
  assert.ok(approxMatches(v, 283, 0));
  assert.ok(!approxMatches(v, 282.8, 1));
});

test('grammar: juxtaposition binds tighter, π folds into literals', () => {
  assert.ok(equals(evalExpr('80pi/20pi'), exact(4)));
  assert.ok(equals(evalExpr('pi*6^2'), exact(36, 1, 1)));
  assert.ok(equals(evalExpr('(144pi*10)/(36pi*10)'), exact(4)));
  assert.ok(equals(evalExpr('9pi*12'), exact(108, 1, 1)));
  assert.ok(equals(evalExpr('12/2'), exact(6)));
  assert.ok(equals(evalExpr('A1*h1', (s) => ({ A1: exact(9, 1, 1), h1: exact(12) })[s]), exact(108, 1, 1)));
  assert.ok(equals(evalExpr('√(9/4)'), exact(3, 2)));
  assert.deepEqual(literalValues(parseExpr('(144pi*10)/(36pi*10)')), [exact(144, 1, 1), exact(10), exact(36, 1, 1), exact(10)]);
  assert.deepEqual(literalValues(parseExpr('pi*6^2')), [exact(6)]);
  assert.deepEqual(numberTexts(parseExpr('4pi*5')), ['4', '5']);
  assert.equal(toDisplay(parseExpr('pi*6^2')), 'π·6²');
  assert.equal(toDisplay(parseExpr('80pi/20pi')), '80π : 20π');
});

test('grammar rejects anything outside the closed set', () => {
  for (const bad of ['2^4', 'x+1', 'alert(1)', '(2', 'pi**2', '']) {
    assert.throws(() => parseExpr(bad), ExprError, bad);
  }
  assert.equal(tryEval('r1*2'), null, 'unknown symbol → null');
  assert.equal(tryEval('pi*pi'), null, 'π² unsupported → null');
});
