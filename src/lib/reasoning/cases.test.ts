/**
 * PRODUCT_SPEC v0.4 §15 end-to-end cases through runTurn (no LLM: ports null).
 * POC-AC-01: statuses, reason codes, edges, versions, renderers and epistemic markings.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Session } from './testkit.ts';
import * as F from './fixtures.ts';
import type { CylinderParams, TableParams, ChartParams } from './types.ts';

const allText = (s: Session) => JSON.stringify(s.last.visualSpecs) + JSON.stringify(s.last.coach ?? '');

test('Case A — correct step-by-step reasoning (height halved, ratio 1/2)', async () => {
  const s = new Session(F.PROBLEM_A);
  assert.equal(s.ctx.problemSpec.interpretationStatus, 'confirmed');
  const v0 = s.graph().version;
  for (const row of F.ROWS_A) await s.add(row);
  for (let i = 1; i <= 6; i++) assert.equal(s.status(i), 'valid', `row ${i}`);
  assert.equal(s.graph().version, v0 + 6, 'RG-C4: one version per add');
  assert.deepEqual(s.deps(1), ['g:h1', 'rel:rel1']);
  assert.deepEqual(s.deps(2), ['g:r1']);
  assert.deepEqual(s.deps(3), [s.row(2).id, 'c:c1'].sort());
  assert.deepEqual(s.deps(5), [s.row(1).id, s.row(3).id].sort());
  assert.deepEqual(s.row(6).validation!.claimedValue, { n: 1, d: 2, piPow: 0 }, 'A-AC-04 exact 1/2');
  // A-AC-03: the tutor speaks only at row 6 (invitation); no scaling chart.
  const coached = s.results.map((r) => r.coach?.replyType ?? null);
  assert.deepEqual(coached, [null, null, null, null, null, 'invitation']);
  assert.ok(s.results.every((r) => !r.visualSpecs.some((v) => v.renderer === 'scaling_chart')));
  // Row 1 is pure arithmetic: only the map changes, 3D gains the learner's h₂ label.
  const d3 = s.results[0].visualSpecs.find((v) => v.renderer === 'cylinder_3d')!.params as CylinderParams;
  assert.ok(d3.annotations.some((a) => a.text.startsWith('h₂ = 6 cm (bước 1 · khớp)') && a.epistemic === 'learner_valid'));
  assert.ok(!s.results[0].visualSpecs.some((v) => v.renderer === 'comparison_table'));
  assert.ok(s.results[2].visualSpecs.some((v) => v.renderer === 'comparison_table'), 'table appears with A₂');
});

test('Case B — incorrect hypothesis → visual investigation → learner revision → F8', async () => {
  const s = new Session(F.PROBLEM_B);
  await s.add(F.ROWS_B.hypothesis);
  const n1 = s.row(1);
  assert.equal(n1.validation!.status, 'invalid');
  assert.equal(n1.interpretation.semanticType, 'hypothesis');
  assert.deepEqual(n1.validation!.possibleMisconceptions.map((m) => m.code), ['linear_scaling']);
  assert.equal(n1.validation!.possibleMisconceptions[0].status, 'possible');
  assert.equal(s.last.coach?.disclosureLevel, 0);
  assert.ok(s.spec('scaling_chart'), 'chart for the invalid hypothesis');
  // B-AC-03: experiment needs the stored hypothesis; slider hits 5 and 15 exactly.
  await s.op({ type: 'experiment', event: 'start', nodeId: n1.id });
  const slider = s.spec('cylinder_3d')!.interaction.slider!;
  assert.deepEqual([slider.min, slider.max, slider.step], [0.5, 23, 0.5]);
  const table = s.spec('comparison_table')!.params as TableParams;
  assert.ok(!table.rows.some((r) => r.quantity === 'k'), 'F6-AC-03: no factor column during experiment');
  const scale0 = s.spec('cylinder_3d')!.scale!.cmPerSceneUnit;
  await s.op({ type: 'experiment', event: 'set', value: 10 });
  assert.equal(s.spec('cylinder_3d')!.scale!.cmPerSceneUnit, scale0, 'scale stable while dragging');
  await s.add(F.ROWS_B.observation);
  assert.equal(s.status(2), 'valid');
  assert.ok(s.graph().edges.some((e) => e.kind === 'tests' && e.from === s.row(2).id && e.to === n1.id));
  await s.op({ type: 'experiment', event: 'set', value: 15 });
  await s.op({ type: 'experiment', event: 'end' });
  const exps = s.graph().events.filter((e) => e.type === 'experiment');
  assert.deepEqual(exps.map((e) => e.type === 'experiment' && [e.event, e.from, e.to]), [['start', 5, 5], ['end', 5, 15]], 'S4-AC-05: start/end only');
  // B-AC-02: nothing system-authored says the answer before the learner writes it.
  for (const r of s.results) {
    const t = JSON.stringify(r.coach ?? '') + JSON.stringify(r.visualSpecs.filter((v) => v.renderer !== 'comparison_table' && v.renderer !== 'cylinder_3d'));
    assert.ok(!/9 lần|gấp 9|gấp chín/.test(t), 'no factor 9 before learner');
  }
  await s.add(F.ROWS_B.area);
  assert.equal(s.status(3), 'valid');
  await s.add(F.ROWS_B.conclusion);
  assert.equal(s.status(4), 'valid');
  assert.equal(s.last.clarification?.kind, 'revised_by');
  assert.equal(s.last.coach?.replyType, 'invitation');
  await s.op({ type: 'mark_revised_by', nodeId: n1.id, byNodeId: s.row(4).id, accept: true });
  // B-AC-01: the hypothesis keeps its text and status; only the learner's link is added.
  const n1b = s.row(1);
  assert.equal(n1b.originalText, F.ROWS_B.hypothesis);
  assert.equal(n1b.validation!.status, 'invalid');
  assert.deepEqual(n1b.revisedBy, [s.row(4).id]);
  // F8
  await s.op({ type: 'start_independent' });
  assert.equal(s.ctx.phase, 'independent');
  assert.deepEqual(s.last.visualSpecs.map((v) => v.renderer), ['reasoning_graph'], 'J-AC-13: only the neutral map');
  assert.equal((s.last.visualSpecs[0].params as { neutral: boolean }).neutral, true);
  const analog = s.ctx.independent!.problemSpec;
  assert.notEqual(analog.text, F.PROBLEM_B);
  assert.equal(analog.interpretationStatus, 'confirmed');
});

test('Case C — diameter misread, edits revalidate dependents; system never rewrites rows', async () => {
  const s = new Session(F.PROBLEM_C);
  for (const row of F.ROWS_C) await s.add(row);
  const [n1, n2, n3, n4, n5] = [1, 2, 3, 4, 5].map((i) => s.row(i));
  assert.equal(n1.validation!.status, 'invalid');
  assert.deepEqual(n1.validation!.possibleMisconceptions.map((m) => m.code), ['radius_diameter']);
  assert.deepEqual(n1.dependsOn, [], 'bare claim cites no premise');
  assert.equal(n3.validation!.status, 'invalid');
  assert.equal(n3.validation!.checks.inference, 'follows');
  assert.equal(n3.validation!.checks.groundTruth, 'false');
  assert.deepEqual(n3.validation!.rootCauseNodeIds, [n1.id]);
  assert.deepEqual(n3.validation!.possibleMisconceptions, []);
  // C-AC-04: correct ratio on wrong premises is not "valid".
  assert.equal(n5.validation!.status, 'insufficient_evidence');
  assert.equal(n5.validation!.checks.groundTruth, 'true');
  assert.deepEqual(n5.validation!.rootCauseNodeIds, [n1.id, n2.id]);
  // Tutor: speaks at row 1 and row 5 only (earliest root, then the unsupported conclusion).
  assert.deepEqual(s.results.map((r) => !!r.coach), [true, false, false, false, true]);
  // C-AC-03: before the fix, the 3D view shows the diameter (given) and the learner's overlong radius, not r = 3.
  let d3 = s.spec('cylinder_3d')!.params as CylinderParams;
  assert.ok(d3.annotations.some((a) => a.text.startsWith('d₁ = 6 cm (đề)')));
  const wrongR = d3.annotations.find((a) => a.kind === 'radius' && a.cylinder === 1 && a.epistemic === 'learner_invalid')!;
  assert.equal(wrongR.value, 6);
  assert.ok(wrongR.value > d3.cylinders[0].r, 'drawn beyond the rim');
  assert.ok(!allText(s).includes('r₁ = 3'), 'no derived radius label before the learner writes it');

  const originals = [n3, n4, n5].map((n) => n.originalText);
  await s.edit(1, F.EDITS_C[0]);
  assert.equal(s.status(1), 'valid');
  assert.deepEqual(s.row(3).validation!.reasonCodes, ['premise_changed']);
  assert.equal(s.status(5), 'insufficient_evidence');
  const revised = s.graph().events.find((e) => e.type === 'node_revised');
  assert.ok(revised && revised.type === 'node_revised' && revised.affected.includes(n3.id) && revised.affected.includes(n5.id));
  // F7-AC-01 / C-AC-01: affected nodes carry the new graph version.
  for (const id of [n3.id, n5.id]) assert.equal(s.graph().nodes[id].validation!.graphVersion, s.graph().version);
  d3 = s.spec('cylinder_3d')!.params as CylinderParams;
  assert.ok(d3.annotations.some((a) => a.text.startsWith('r₁ = 3 cm (bước 1 · khớp)') && a.epistemic === 'learner_valid'));
  await s.edit(2, F.EDITS_C[1]);
  await s.edit(3, F.EDITS_C[2]);
  assert.equal(s.status(5), 'invalid', 'n5 still uses 144π → premise_changed, never auto-upgraded');
  assert.deepEqual(s.row(5).validation!.reasonCodes, ['premise_changed']);
  await s.edit(4, F.EDITS_C[3]);
  assert.equal(s.status(5), 'invalid');
  assert.deepEqual([3, 4, 5].map((i) => s.row(i).originalText).slice(2), [originals[2]], 'C-AC-02: n5 text untouched');
  await s.edit(5, F.EDITS_C[4]);
  for (let i = 1; i <= 5; i++) assert.equal(s.status(i), 'valid');
  assert.equal(s.row(1).history.length, 1, 'C-AC-05');
  assert.equal(s.row(1).history[0].originalText, F.ROWS_C[0]);
  assert.equal(s.last.coach?.replyType, 'invitation');
  assert.ok(s.graph().edges.every((e) => s.graph().nodes[e.from] && s.graph().nodes[e.to]));
});

test('REG-01 — the v0.3 S1–S6 lesson as one user-entered problem', async () => {
  const s = new Session(F.PROBLEM_REG, { allowAnalogOverride: true });
  const facts = await import('./facts.ts').then((m) => m.solveProblem(s.ctx.problemSpec));
  assert.deepEqual([facts.A1, facts.A2, facts.V1, facts.V2, facts.kV].map((f) => f!.value), [
    { n: 4, d: 1, piPow: 1 }, { n: 16, d: 1, piPow: 1 }, { n: 20, d: 1, piPow: 1 }, { n: 80, d: 1, piPow: 1 }, { n: 4, d: 1, piPow: 0 },
  ]);
  await s.add(F.ROWS_REG[0]);
  assert.equal(s.status(1), 'invalid');
  assert.equal(s.row(1).validation!.possibleMisconceptions[0].code, 'linear_scaling');
  await s.op({ type: 'experiment', event: 'start' });
  await s.op({ type: 'experiment', event: 'set', value: 4 });
  const t = s.spec('comparison_table')!.params as TableParams;
  assert.deepEqual(t.rows.find((r) => r.quantity === 'V')!.cells.map((c) => c!.text), ['20π', '80π']);
  await s.op({ type: 'experiment', event: 'end' });
  for (const row of F.ROWS_REG.slice(1)) await s.add(row);
  for (let i = 2; i <= 6; i++) assert.equal(s.status(i), 'valid', `row ${i}`);
  // S4-AC-02: at r = 4 the comparison has twice the diameter and the same height (from the problem).
  const cyl = (s.spec('cylinder_3d')!.params as CylinderParams).cylinders;
  assert.deepEqual(cyl.map((c) => [c.r, c.h]), [[2, 5], [4, 5]]);
  await s.op({ type: 'mark_revised_by', nodeId: s.row(1).id, byNodeId: s.row(6).id, accept: true });
  await s.op({ type: 'start_independent', analogText: F.ANALOG_REG });
  const ind = s.ctx.independent!;
  const f2 = (await import('./facts.ts')).solveProblem(ind.problemSpec);
  assert.deepEqual([f2.V1!.value, f2.V2!.value, f2.kV!.value], [{ n: 72, d: 1, piPow: 1 }, { n: 648, d: 1, piPow: 1 }, { n: 9, d: 1, piPow: 0 }]);
  await s.add('Bán kính gấp 9 : 3 = 3 lần.');
  await s.add('Chiều cao giữ nguyên nên thể tích gấp 3² = 9 lần.');
  await s.op({ type: 'submit_independent' });
  assert.equal(s.ctx.phase, 'summary');
  assert.equal(s.ctx.independent!.evaluation!.answer, 'correct');
  assert.equal(s.ctx.independent!.evaluation!.reasoning, 'sufficient');
});

test('REG-01 transfer: "3 lần" is incorrect with a possible linear_scaling; answer and reasoning separate', async () => {
  const s = new Session(F.PROBLEM_REG, { allowAnalogOverride: true });
  await s.op({ type: 'start_independent', analogText: F.ANALOG_REG });
  await s.add('Thể tích gấp 3 lần vì bán kính gấp 3 lần.');
  await s.op({ type: 'submit_independent' });
  const e = s.ctx.independent!.evaluation!;
  assert.equal(e.answer, 'incorrect');
  assert.equal(e.reasoning, 'contains_invalid');
  assert.deepEqual(e.possibleMisconceptions, ['linear_scaling']);
});

test('F8: correct answer without reasoning is not "understood" (FR-EVAL-001)', async () => {
  const s = new Session(F.PROBLEM_REG, { allowAnalogOverride: true });
  await s.op({ type: 'start_independent', analogText: F.ANALOG_REG });
  await s.add('Thể tích gấp 9 lần.');
  await s.op({ type: 'submit_independent' });
  assert.deepEqual([s.ctx.independent!.evaluation!.answer, s.ctx.independent!.evaluation!.reasoning], ['correct', 'insufficient_evidence']);
});

test('scaling chart curves come from the learner claims, points only from visited slider values', async () => {
  const s = new Session(F.PROBLEM_B);
  await s.add(F.ROWS_B.hypothesis);
  await s.op({ type: 'experiment', event: 'start' });
  await s.op({ type: 'experiment', event: 'set', value: 10 });
  const c = s.spec('scaling_chart')!.params as ChartParams;
  assert.equal(c.curves.length, 1);
  assert.ok(Math.abs(c.curves[0].exponent - 1) < 1e-9, 'learner implied V ∝ r');
  assert.deepEqual(c.points.map((p) => p.x), [10]);
});
