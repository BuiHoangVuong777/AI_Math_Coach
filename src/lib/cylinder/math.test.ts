import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAIN_PROBLEM,
  RADIUS_SLIDER,
  TRANSFER_PROBLEM,
  baseAreaPiCoef,
  formatPi,
  snapRadius,
  volumePiCoef,
  volumeRatio,
} from './math.ts';
import { parseAnswer } from './parse.ts';

test('main problem: exact areas, volumes and factor (NFR-MATH-007)', () => {
  const { r1, r2, h } = MAIN_PROBLEM;
  assert.equal(baseAreaPiCoef(r1), 4);
  assert.equal(baseAreaPiCoef(r2), 16);
  assert.equal(volumePiCoef({ r: r1, h }), 20);
  assert.equal(volumePiCoef({ r: r2, h }), 80);
  assert.equal(volumeRatio({ r: r1, h }, { r: r2, h }), 4);
  assert.equal(formatPi(16), '16π');
  assert.equal(formatPi(80), '80π');
});

test('transfer problem: 3 → 9 cm with h = 8 gives factor 9', () => {
  const { r1, r2, h } = TRANSFER_PROBLEM;
  assert.equal(volumePiCoef({ r: r1, h }), 72);
  assert.equal(volumePiCoef({ r: r2, h }), 648);
  assert.equal(volumeRatio({ r: r1, h }, { r: r2, h }), 9);
});

test('rejects non-positive dimensions (NFR-MATH-006)', () => {
  assert.throws(() => baseAreaPiCoef(0), RangeError);
  assert.throws(() => volumePiCoef({ r: 2, h: -1 }), RangeError);
});

test('slider snaps to exact steps and can hit exactly 2 and 4 cm (S4-AC-01)', () => {
  assert.equal(snapRadius(2), 2);
  assert.equal(snapRadius(4), 4);
  assert.equal(snapRadius(3.9), 4);
  assert.equal(snapRadius(100), RADIUS_SLIDER.max);
  assert.equal(snapRadius(-3), RADIUS_SLIDER.min);
  assert.equal(snapRadius(Number.NaN), RADIUS_SLIDER.min);
});

test('parses common ways of writing exact π multiples and plain numbers', () => {
  assert.deepEqual(parseAnswer('16π'), { kind: 'pi', coef: 16 });
  assert.deepEqual(parseAnswer(' 16 pi cm² '), { kind: 'pi', coef: 16 });
  assert.deepEqual(parseAnswer('π·4'), { kind: 'pi', coef: 4 });
  assert.deepEqual(parseAnswer('4*π'), { kind: 'pi', coef: 4 });
  assert.deepEqual(parseAnswer('π'), { kind: 'pi', coef: 1 });
  assert.deepEqual(parseAnswer('gấp 4 lần'), { kind: 'number', value: 4 });
  assert.deepEqual(parseAnswer('12,57'), { kind: 'number', value: 12.57 });
  assert.deepEqual(parseAnswer('abc'), { kind: 'invalid' });
  assert.deepEqual(parseAnswer(''), { kind: 'invalid' });
});
