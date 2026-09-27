import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_SCENARIOS } from './demoScenarios.ts';
import { Session } from '../../lib/reasoning/testkit.ts';
const expected = [
  [[4,1], [16,1], [20,1], [80,1], [4,0]],
  [[6,0], [9,1], [9,1], [108,1], [54,1], [1,0,2]],
  [[3,0], [6,0], [9,1], [36,1], [90,1], [360,1], [4,0]],
  [[25,1], [225,1], [200,1], [1800,1], [9,0]],
];
for (const [scenarioIndex, demo] of DEMO_SCENARIOS.entries()) test(`Demo ${demo.id}: parser, ordered steps, exact ratio`, async () => {
  const s = new Session(demo.problem);
  assert.equal(s.ctx.problemSpec.interpretationStatus, 'confirmed');
  assert.ok(demo.problem.length <= 600);
  for (const [i, text] of demo.steps.entries()) {
    await s.add(text);
    assert.equal(s.status(i + 1), 'valid', text);
    assert.equal(s.row(i + 1).originalText, text);
    const [n, piPow, d = 1] = expected[scenarioIndex][i];
    assert.deepEqual(s.row(i + 1).validation?.claimedValue, { n, d, piPow }, 'exact intermediate value');
  }
  assert.deepEqual(s.row(demo.steps.length).validation?.claimedValue, demo.ratio);
});
