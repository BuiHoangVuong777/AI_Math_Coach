/**
 * Learning Motivation & Evidence-based Progress (PRODUCT_SPEC §24): deterministic score,
 * badges, mission, next challenge and completion message through the real engine (runTurn,
 * no LLM). Covers the required cases 1–14 of the task and AC-MOT-01…12.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Session } from './testkit.ts';
import * as F from './fixtures.ts';
import { runTurn } from './orchestrator.ts';
import { buildScoringResult, UNSUPPORTED_CLAIM, type ScoringResult } from './completion.ts';
import { RUBRIC, calculateLearningScore, awardBadges } from './learningScore.ts';
import { collectFinalAssessment, collectSessionEvidence, toEvidenceWire } from './sessionEvidence.ts';
import { deriveMissionProgress } from './mission.ts';
import { selectNextChallenge } from './nextChallenge.ts';
import { completionVoicePlan } from '../voice/plan.ts';
import type { GraphEvent, SessionContext } from './types.ts';

const ANALOG_A = 'Một hình trụ có bán kính đáy 4 cm và chiều cao 9 cm. Một hình trụ khác có cùng bán kính đáy nhưng chiều cao chỉ bằng một phần ba. Thể tích hình trụ khác bằng mấy phần thể tích hình trụ ban đầu?';
const ROWS_ANALOG_A = ['h₂ = 9 : 3 = 3 cm.', 'V₁ = π·4²·9 = 144π cm³.', 'V₂ = π·4²·3 = 48π cm³.', 'V₂ : V₁ = 48π : 144π = 1/3 vì cùng bán kính đáy.'];
const ANALOG_B = 'Một hình trụ có bán kính đáy 2 dm và chiều cao 6 dm. Nếu bán kính đáy tăng thành 8 dm và giữ nguyên chiều cao thì thể tích tăng gấp bao nhiêu lần?';
const ROWS_ANALOG_B = ['r gấp 8 : 2 = 4 lần.', 'Chiều cao không đổi nên V gấp 4² = 16 lần.'];
const CROSS_CHECK_A = 'Chiều cao bằng một nửa, bán kính giữ nguyên nên thể tích bằng một nửa.';
const COMPUTE = 'Một hình trụ có bán kính đáy 3 cm và chiều cao 5 cm. Tính thể tích hình trụ.';

const points = (r: ScoringResult) => Object.fromEntries(r.score.criteria.map((c) => [c.id, c.points]));
const badgeIds = (r: ScoringResult) => r.badges.map((b) => b.id).sort();

async function caseB(opts: { hints?: number; finishF8?: boolean } = {}) {
  const s = new Session(F.PROBLEM_B, { allowAnalogOverride: true });
  await s.add(F.ROWS_B.hypothesis);
  for (let i = 0; i < (opts.hints ?? 0); i++) await s.op({ type: 'request_hint', nodeId: 'n1' });
  await s.op({ type: 'experiment', event: 'start', nodeId: 'n1' });
  await s.op({ type: 'experiment', event: 'set', value: 10 });
  await s.add(F.ROWS_B.observation);
  await s.op({ type: 'experiment', event: 'set', value: 15 });
  await s.op({ type: 'experiment', event: 'end' });
  await s.add(F.ROWS_B.area);
  await s.add(F.ROWS_B.conclusion);
  await s.op({ type: 'mark_revised_by', nodeId: 'n1', byNodeId: s.row(4).id, accept: true });
  if (opts.finishF8 !== false) {
    await s.op({ type: 'start_independent', analogText: ANALOG_B });
    for (const r of ROWS_ANALOG_B) await s.add(r);
    await s.op({ type: 'submit_independent' });
  }
  return s;
}

test('rubric: five criteria sum to 100 and every part sums to its criterion', () => {
  const total = Object.values(RUBRIC).reduce((s, c) => s + c.max, 0);
  assert.equal(total, 100);
  for (const c of Object.values(RUBRIC)) assert.equal(Object.values(c.parts).reduce((s, p) => s + p, 0), c.max);
  assert.deepEqual(Object.fromEntries(Object.entries(RUBRIC).map(([k, v]) => [k, v.max])), { problem_understanding: 15, evidence_reasoning: 30, verification: 20, independent_transfer: 25, own_explanation: 10 });
});

test('(1) fully correct reasoning WITHOUT any mistake can earn full points (independent cross-check route)', async () => {
  const s = new Session(F.PROBLEM_A, { allowAnalogOverride: true });
  for (const r of F.ROWS_A) await s.add(r);
  const before = buildScoringResult(s.ctx);
  assert.equal(before.evidence.mistakes.length, 0);
  assert.equal(points(before).verification, 0, 'no check yet: verification is not free');
  assert.equal(before.mission.nextAction.kind, 'verify_optional');
  await s.add(CROSS_CHECK_A);
  await s.op({ type: 'start_independent', analogText: ANALOG_A });
  for (const r of ROWS_ANALOG_A) await s.add(r);
  await s.op({ type: 'submit_independent' });
  const r = buildScoringResult(s.ctx);
  assert.equal(r.evidence.mistakes.length, 0, 'no mistake was needed');
  assert.equal(r.evidence.crossChecks.length > 0, true);
  assert.equal(r.score.total, 100);
  assert.equal(r.score.complete, true);
  assert.ok(r.mission.complete);
  assert.deepEqual(badgeIds(r), ['data_detective', 'explainer', 'independent_explorer']);
});

test('(2) genuine incorrect reasoning followed by learner-authored revision earns the same verification credit', async () => {
  const s = new Session(F.PROBLEM_C);
  for (const r of F.ROWS_C) await s.add(r);
  const before = buildScoringResult(s.ctx);
  assert.deepEqual(before.evidence.mistakes.map((m) => [m.row, m.dataMisreading, m.correction]), [[1, true, null], [2, true, null]]);
  assert.equal(points(before).verification, 0);
  await s.edit(1, F.EDITS_C[0]);
  const partial = buildScoringResult(s.ctx);
  assert.equal(partial.evidence.mistakes[0].correction?.kind, 'learner_edit');
  assert.equal(points(partial).verification, RUBRIC.verification.max, 'one corrected genuine mistake is enough');
  for (let i = 1; i < 5; i++) await s.edit(i + 1, F.EDITS_C[i]);
  const after = buildScoringResult(s.ctx);
  assert.equal(points(after).verification, 20, 'more corrections do not add points');
  assert.ok(after.badges.some((b) => b.id === 'data_detective' && b.reason.includes('sửa')));
  // Case B: correction by a new row + the learner-accepted "revised by" link.
  const b = await caseB();
  assert.equal(buildScoringResult(b.ctx).evidence.mistakes[0].correction?.kind, 'marked_revised_by');
});

test('(3) fake edits, slider moves, repeated hints and duplicated events cannot farm points', async () => {
  // A correct row broken on purpose and restored is a regression, not a genuine mistake.
  const s = new Session(F.PROBLEM_A);
  for (const r of F.ROWS_A) await s.add(r);
  const base = buildScoringResult(s.ctx).score.total;
  for (let i = 0; i < 3; i++) {
    await s.edit(2, 'Diện tích đáy A₁ = π·3² = 6π cm².');
    await s.edit(2, F.ROWS_A[1]);
  }
  const farmed = buildScoringResult(s.ctx);
  assert.equal(farmed.evidence.mistakes.length, 0, 'valid → invalid → valid is not a first mistake');
  assert.equal(farmed.score.total, base);
  // Extra valid rows (duplicates) add nothing; a duplicated computation is not an independent check.
  for (let i = 0; i < 5; i++) await s.add(F.ROWS_A[5]);
  const dup = buildScoringResult(s.ctx);
  assert.equal(dup.evidence.crossChecks.length, 0);
  assert.equal(dup.score.total, base);
  // Slider movement alone (no observation row) never counts; many runs add nothing.
  const e = new Session(F.PROBLEM_B);
  await e.add(F.ROWS_B.hypothesis);
  for (let k = 0; k < 3; k++) {
    await e.op({ type: 'experiment', event: 'start', nodeId: 'n1' });
    for (const v of [6, 9, 12, 15]) await e.op({ type: 'experiment', event: 'set', value: v });
    await e.op({ type: 'experiment', event: 'end' });
  }
  const slider = buildScoringResult(e.ctx);
  assert.equal(points(slider).verification, 0);
  assert.equal(slider.support.experiments.runs, 3);
  assert.ok(slider.score.criteria.find((c) => c.id === 'verification')!.missingEvidence.some((m) => m.includes('thanh trượt')));
  // Duplicating evidence events (forged or replayed) changes nothing.
  const b = await caseB();
  const ref = buildScoringResult(b.ctx);
  const g = b.ctx.graph;
  let seq = g.events[g.events.length - 1].seq;
  const copies = g.events.filter((x) => ['experiment', 'hint_shown', 'revised_by_marked', 'node_revised', 'coach_exchange'].includes(x.type)).map((x) => ({ ...x, seq: ++seq })) as GraphEvent[];
  const forged: SessionContext = { ...b.ctx, graph: { ...g, events: [...g.events, ...copies, ...copies] } };
  const again = buildScoringResult(forged);
  assert.deepEqual(points(again), points(ref));
  assert.deepEqual(badgeIds(again), badgeIds(ref));
});

test('(4) a correct final answer without supporting reasoning does not earn reasoning credit (guessing)', async () => {
  const s = new Session(F.PROBLEM_B);
  await s.add('Thể tích gấp 9 lần.');
  const r = buildScoringResult(s.ctx);
  assert.equal(r.evidence.conclusion.answer, 'correct');
  assert.equal(r.evidence.conclusion.bare, true);
  assert.equal(points(r).evidence_reasoning, 0);
  assert.equal(points(r).own_explanation, 0);
  assert.ok(r.score.criteria.find((c) => c.id === 'evidence_reasoning')!.explanation.includes('chưa có các bước dẫn tới'));
  // Correct ratio computed from wrong premises (Case C before edits): half of the answer part only.
  const c = new Session(F.PROBLEM_C);
  for (const row of F.ROWS_C) await c.add(row);
  const rc = buildScoringResult(c.ctx);
  assert.equal(points(rc).evidence_reasoning, RUBRIC.evidence_reasoning.parts.supported_answer / 2);
  assert.equal(rc.evidence.conclusion.reasoning, 'contains_invalid');
});

test('(5) different valid solution paths with equivalent evidence get equivalent scores', async () => {
  const lawPath = new Session(F.PROBLEM_B);
  await lawPath.add('Bán kính gấp 15 : 5 = 3 lần.');
  await lawPath.add('Chiều cao giữ nguyên nên thể tích gấp 3² = 9 lần.');
  const volumePath = new Session(F.PROBLEM_B);
  await volumePath.add('V₁ = π·5²·8 = 200π dm³.');
  await volumePath.add('V₂ = π·15²·8 = 1800π dm³.');
  await volumePath.add('V₂ : V₁ = 1800π : 200π = 9 vì chiều cao giữ nguyên.');
  const [a, b] = [buildScoringResult(lawPath.ctx), buildScoringResult(volumePath.ctx)];
  assert.deepEqual(points(a), points(b));
  assert.deepEqual(badgeIds(a), badgeIds(b));
  assert.equal(points(a).evidence_reasoning, 30);
  // Doing both routes is an independent confirmation (verification), in either order.
  for (const row of ['V₁ = π·5²·8 = 200π dm³.', 'V₂ = π·15²·8 = 1800π dm³.', 'V₂ : V₁ = 1800π : 200π = 9.']) await lawPath.add(row);
  assert.equal(points(buildScoringResult(lawPath.ctx)).verification, 20);
});

test('(6) missing and ambiguous evidence is reported, never silently counted as correct', async () => {
  const s = new Session(F.PROBLEM_B);
  await s.add('V = π·5²·8 = 200π dm³.');
  const r = buildScoringResult(s.ctx);
  const st = s.row(1).validation!.status;
  assert.ok(st === 'ambiguous' || st === 'valid', `row status ${st}`);
  assert.equal(points(r).evidence_reasoning, 0, 'no conclusion → no reasoning points');
  assert.equal(r.evidence.conclusion.answerNodeId, null);
  const crit = r.score.criteria.find((c) => c.id === 'evidence_reasoning')!;
  assert.equal(crit.status, 'none');
  assert.ok(crit.missingEvidence.length > 0);
  // Out-of-scope content is unverified and earns nothing, but is not called wrong.
  await s.add('S_xq = 2πrh = 80π');
  const u = buildScoringResult(s.ctx);
  assert.equal(u.evidence.mistakes.length, 0, 'unverified is never a mistake');
  assert.ok(!JSON.stringify(u.message).includes('sai'), 'no "sai" verdict for unverified content');
});

test('(7) hints are logged as support used but never reduce the score', async () => {
  const [plain, helped] = [await caseB(), await caseB({ hints: 3 })];
  const [p, h] = [buildScoringResult(plain.ctx), buildScoringResult(helped.ctx)];
  assert.deepEqual(points(h), points(p));
  assert.deepEqual(badgeIds(h), badgeIds(p));
  assert.equal(h.support.hints.length, 1);
  assert.equal(h.support.hints[0].count, 3);
  assert.equal(h.support.hints[0].row, 1);
  assert.ok(h.support.hints[0].maxLevel >= 1);
  assert.equal(p.support.hints.length, 0);
});

test('(8) the independent assessment is scored separately from the coached problem', async () => {
  // Strong coached work, weak self-check.
  const strong = new Session(F.PROBLEM_REG, { allowAnalogOverride: true });
  for (const r of F.ROWS_REG) await strong.add(r);
  const coached = points(buildScoringResult(strong.ctx));
  await strong.op({ type: 'start_independent', analogText: F.ANALOG_REG });
  await strong.add('Thể tích gấp 3 lần vì bán kính gấp 3 lần.');
  await strong.op({ type: 'submit_independent' });
  const s1 = buildScoringResult(strong.ctx);
  assert.equal(points(s1).independent_transfer, 0);
  for (const k of ['problem_understanding', 'evidence_reasoning', 'verification', 'own_explanation']) assert.equal(points(s1)[k], coached[k], `${k} unchanged by F8`);
  // Weak coached work, strong self-check: F8 cannot lift the coached criteria.
  const weak = new Session(F.PROBLEM_REG, { allowAnalogOverride: true });
  await weak.add('Thể tích gấp 4 lần.');
  const weakCoached = points(buildScoringResult(weak.ctx));
  await weak.op({ type: 'start_independent', analogText: F.ANALOG_REG });
  await weak.add('Bán kính gấp 9 : 3 = 3 lần.');
  await weak.add('Chiều cao giữ nguyên nên thể tích gấp 3² = 9 lần.');
  await weak.op({ type: 'submit_independent' });
  const s2 = buildScoringResult(weak.ctx);
  assert.equal(points(s2).independent_transfer, 25);
  for (const k of ['problem_understanding', 'evidence_reasoning', 'verification', 'own_explanation']) assert.equal(points(s2)[k], weakCoached[k]);
  // A bare correct answer in the self-check is recorded but not credited as an answer with reasoning.
  const bare = new Session(F.PROBLEM_REG, { allowAnalogOverride: true });
  await bare.op({ type: 'start_independent', analogText: F.ANALOG_REG });
  await bare.add('Thể tích gấp 9 lần.');
  await bare.op({ type: 'submit_independent' });
  const s3 = buildScoringResult(bare.ctx);
  assert.equal(s3.assessment.evaluation?.answer, 'correct');
  assert.equal(s3.assessment.answerBare, true);
  assert.equal(points(s3).independent_transfer, 0);
  assert.ok(!s3.badges.some((b) => b.id === 'independent_explorer'));
});

test('(9) each badge requires real qualifying evidence; Tutor/LLM text cannot award one', async () => {
  // Positive: all four in the full Case B journey.
  const b = await caseB();
  assert.deepEqual(badgeIds(buildScoringResult(b.ctx)), ['data_detective', 'explainer', 'independent_explorer', 'little_scientist']);
  // Negative: plain compute problem, no important data, no prediction, no reason, no F8.
  const c = new Session(COMPUTE);
  await c.add('V = π·3²·5 = 45π cm³.');
  const rc = buildScoringResult(c.ctx);
  assert.deepEqual(badgeIds(rc), []);
  // Experiment without an observation row and without later reasoning: no scientist badge.
  const e = new Session(F.PROBLEM_B);
  await e.add(F.ROWS_B.hypothesis);
  await e.op({ type: 'experiment', event: 'start', nodeId: 'n1' });
  await e.op({ type: 'experiment', event: 'set', value: 15 });
  await e.op({ type: 'experiment', event: 'end' });
  assert.ok(!badgeIds(buildScoringResult(e.ctx)).includes('little_scientist'));
  // A vague reason: half the explanation points, no explainer badge.
  const v = new Session(F.PROBLEM_B);
  await v.add('Bán kính gấp 15 : 5 = 3 lần vì nó to hơn.');
  const rv = buildScoringResult(v.ctx);
  assert.ok(!badgeIds(rv).includes('explainer'));
  // A tutor port claiming the learner experimented/explained changes nothing.
  const claim = { source: 'ai', replyType: 'feedback', question: '', explanation: 'Em đã thử nghiệm, giải thích và tự làm bài tương tự rất tốt.', hint: null, relevantNodeIds: ['n1'], relevantElementIds: [], disclosureLevel: 0, misconception: { detected: false, code: '', evidence: '', status: 'possible' } };
  const t = new Session(F.PROBLEM_B, { tutor: async () => claim });
  await t.add(F.ROWS_B.hypothesis);
  await t.op({ type: 'ask_coach', message: 'Em làm đúng chưa?' });
  const rt = buildScoringResult(t.ctx);
  assert.deepEqual(badgeIds(rt), []);
  assert.equal(points(rt).verification, 0);
  // At most once each, whatever the evidence count.
  const many = buildScoringResult(b.ctx).badges;
  assert.equal(new Set(many.map((x) => x.id)).size, many.length);
});

test('(10) early termination: incomplete criteria are marked, only supported evidence counts', async () => {
  const s = new Session(F.PROBLEM_C);
  for (const r of F.ROWS_C) await s.add(r);
  await s.edit(1, F.EDITS_C[0]);
  await s.op({ type: 'finish' });
  const r = buildScoringResult(s.ctx);
  assert.equal(r.evidence.endedEarly, true);
  assert.equal(r.score.complete, false);
  assert.ok(r.score.incompleteCriteria.includes('independent_transfer'));
  assert.equal(r.score.criteria.find((c) => c.id === 'independent_transfer')!.status, 'incomplete');
  assert.match(r.message.headline, /kết thúc sớm/);
  assert.ok(!r.mission.complete);
  // Finished before writing anything: nothing is invented.
  const empty = new Session(F.PROBLEM_B);
  await empty.op({ type: 'finish' });
  const re = buildScoringResult(empty.ctx);
  assert.equal(re.score.total, RUBRIC.problem_understanding.parts.confirmation);
  assert.equal(re.score.criteria.find((c) => c.id === 'evidence_reasoning')!.status, 'incomplete');
  assert.deepEqual(re.badges, []);
});

test('(11) completion messages never claim mastery/ability, never judge, never leak a hidden value', async () => {
  const sessions: Session[] = [];
  sessions.push(await caseB(), await caseB({ finishF8: false }));
  const c = new Session(F.PROBLEM_C);
  for (const r of F.ROWS_C) await c.add(r);
  await c.op({ type: 'finish' });
  sessions.push(c);
  const g = new Session(F.PROBLEM_B);
  await g.add(F.ROWS_B.hypothesis);
  await g.op({ type: 'finish' });
  sessions.push(g);
  for (const s of sessions) {
    const r = buildScoringResult(s.ctx);
    for (const t of [...r.message.spoken, ...r.score.criteria.flatMap((x) => [x.explanation, ...x.missingEvidence]), ...r.badges.map((b) => b.reason), r.mission.nextAction.text]) {
      assert.ok(!UNSUPPORTED_CLAIM.test(t), `unsupported claim: ${t}`);
      for (const m of t.matchAll(/bước (\d+)/g)) assert.ok(Object.values(s.ctx.graph.nodes).some((n) => n.rowIndex === Number(m[1])), `cites a real row: ${t}`);
    }
    assert.equal(r.message.spoken.at(-1), 'Tóm tắt này chỉ phản ánh phiên học này; không phải đánh giá năng lực lâu dài.');
  }
  // Unsolved Case B (only the wrong hypothesis): the true factor never appears.
  const unsolved = buildScoringResult(g.ctx);
  assert.ok(!/9 lần|gấp 9|1800π/.test(JSON.stringify(unsolved)), 'no hidden answer in any completion text');
});

test('(12) scores and badges follow upstream graph revisions (recomputed, never cached)', async () => {
  const s = new Session(F.PROBLEM_C);
  for (const r of F.ROWS_C) await s.add(r);
  for (let i = 0; i < 5; i++) await s.edit(i + 1, F.EDITS_C[i]);
  const fixed = buildScoringResult(s.ctx);
  assert.equal(points(fixed).evidence_reasoning, 30);
  // The learner edits row 1 back to a wrong value: dependents revalidate and credit drops.
  await s.edit(1, 'r₁ = 6 cm.');
  const broken = buildScoringResult(s.ctx);
  assert.ok(points(broken).evidence_reasoning < 30);
  assert.notEqual(broken.evidence.conclusion.reasoning, 'sufficient');
  assert.equal(broken.mission.milestones.find((m) => m.id === 'reason')!.state, 'in_progress');
  await s.edit(1, F.EDITS_C[0]);
  assert.equal(points(buildScoringResult(s.ctx)).evidence_reasoning, 30);
});

test('(13) completion Voice speaks exactly the approved, evidence-based message; server rebuild is identical', async () => {
  const b = await caseB();
  const r = buildScoringResult(b.ctx);
  const plan = completionVoicePlan(b.ctx)!;
  assert.equal(plan.kind, 'completion');
  assert.deepEqual(plan.segments.map((x) => x.text), r.message.spoken);
  assert.equal(plan.approvedText, r.message.spoken.join('\n'));
  // The wire form the Voice route receives yields the same evidence, score and plan.
  const wire = toEvidenceWire(b.ctx);
  assert.ok(JSON.stringify(wire).length < 64 * 1024);
  const res = await runTurn({ context: { ...wire, processedOpIds: [] }, expectedGraphVersion: wire.graph.version, opId: 'voice-completion', op: { type: 'select_node', nodeId: null } }, {});
  assert.equal(res.error, null);
  assert.deepEqual(collectSessionEvidence(res.context), collectSessionEvidence(b.ctx));
  assert.deepEqual(buildScoringResult(res.context).score, r.score);
  assert.equal(completionVoicePlan(res.context)!.id, plan.id);
  // Not available during reasoning/F8.
  const s = new Session(F.PROBLEM_A);
  await s.add(F.ROWS_A[0]);
  assert.equal(completionVoicePlan(s.ctx), null);
});

test('(14) Cases A, B, C and REG-01: expected scores, badges and missions', async () => {
  const a = new Session(F.PROBLEM_A);
  for (const r of F.ROWS_A) await a.add(r);
  const ra = buildScoringResult(a.ctx);
  assert.deepEqual(points(ra), { problem_understanding: 15, evidence_reasoning: 30, verification: 0, independent_transfer: 0, own_explanation: 10 });
  assert.deepEqual(ra.mission.milestones.map((m) => m.state), ['achieved', 'not_yet', 'achieved', 'not_yet']);

  const b = await caseB();
  const rb = buildScoringResult(b.ctx);
  assert.equal(rb.score.total, 100);
  assert.deepEqual(rb.evidence.testedPredictions.map((t) => [t.hypothesisRow, t.testRow, t.via]), [[1, 2, 'experiment_observation']]);
  assert.equal(rb.nextChallenge?.rule, 'stretch_after_independent_success');

  const c = new Session(F.PROBLEM_C);
  for (const r of F.ROWS_C) await c.add(r);
  assert.equal(buildScoringResult(c.ctx).score.total, 10);
  for (let i = 0; i < 5; i++) await c.edit(i + 1, F.EDITS_C[i]);
  const rc = buildScoringResult(c.ctx);
  assert.deepEqual(points(rc), { problem_understanding: 15, evidence_reasoning: 30, verification: 20, independent_transfer: 0, own_explanation: 10 });
  assert.equal(rc.nextChallenge?.family, 'diameter_change');

  const reg = new Session(F.PROBLEM_REG, { allowAnalogOverride: true });
  for (const r of F.ROWS_REG) await reg.add(r);
  await reg.op({ type: 'mark_revised_by', nodeId: reg.row(1).id, byNodeId: reg.row(6).id, accept: true });
  await reg.op({ type: 'start_independent', analogText: F.ANALOG_REG });
  await reg.add('Bán kính gấp 9 : 3 = 3 lần.');
  await reg.add('Chiều cao giữ nguyên nên thể tích gấp 3² = 9 lần.');
  await reg.op({ type: 'submit_independent' });
  const rr = buildScoringResult(reg.ctx);
  assert.equal(rr.score.total, 100);
  assert.deepEqual(badgeIds(rr), ['data_detective', 'explainer', 'independent_explorer', 'little_scientist']);
});

test('pure and deterministic: no context mutation, identical results, next challenge never exposes an answer', async () => {
  const b = await caseB();
  const before = JSON.stringify(b.ctx);
  const x = buildScoringResult(b.ctx);
  const y = buildScoringResult(b.ctx);
  assert.equal(JSON.stringify(b.ctx), before);
  assert.deepEqual(x, y);
  const ev = collectSessionEvidence(b.ctx);
  const fa = collectFinalAssessment(b.ctx);
  assert.deepEqual(calculateLearningScore(ev, fa), x.score);
  assert.deepEqual(awardBadges(ev, fa), x.badges);
  assert.deepEqual(deriveMissionProgress(ev, fa), x.mission);
  const nc = selectNextChallenge(b.ctx.problemSpec, ev, fa)!;
  assert.ok(nc.problemText && nc.problemText !== F.PROBLEM_B && nc.problemText !== ANALOG_B);
  assert.deepEqual(Object.keys(nc).sort(), ['family', 'label', 'problemText', 'reason', 'rule']);
  assert.ok(!/đáp án|gấp \d+ lần|= \d/.test(nc.problemText), 'problem text only, no answer');
});

test('mission milestones are observational: no fixed order, optional prediction, next action never names a hidden value', async () => {
  const s = new Session(F.PROBLEM_B);
  const m0 = buildScoringResult(s.ctx).mission;
  assert.deepEqual(m0.milestones.map((m) => [m.id, m.optional, m.state]), [['understand', false, 'achieved'], ['predict_or_plan', true, 'not_yet'], ['reason', false, 'not_yet'], ['independent', false, 'not_yet']]);
  assert.equal(m0.nextAction.kind, 'write_step');
  await s.add(F.ROWS_B.hypothesis);
  const m1 = buildScoringResult(s.ctx).mission;
  assert.equal(m1.nextAction.kind, 'fix_row');
  assert.ok(!/9|chín|bình phương/.test(m1.nextAction.text + m1.objective + m1.subtitle + m1.milestones.map((m) => m.detail).join(' ')), 'no rule or value before the learner finds it');
  // Solving without predicting is fine: the optional milestone never blocks.
  const d = new Session(F.PROBLEM_B, { allowAnalogOverride: true });
  await d.add('Bán kính gấp 15 : 5 = 3 lần.');
  await d.add('Chiều cao giữ nguyên nên thể tích gấp 3² = 9 lần.');
  await d.op({ type: 'start_independent', analogText: ANALOG_B });
  for (const r of ROWS_ANALOG_B) await d.add(r);
  await d.op({ type: 'submit_independent' });
  const md = buildScoringResult(d.ctx).mission;
  assert.equal(md.milestones[1].state, 'not_yet');
  assert.equal(md.complete, true);
});

test('evidence wire stays under the 64 KB request limit for a long session', async () => {
  const s = new Session(F.PROBLEM_A);
  for (let i = 0; i < 20; i++) await s.add(F.ROWS_A[i % 6]);
  for (let i = 1; i <= 20; i++) await s.edit(i, F.ROWS_A[(i + 1) % 6]);
  for (let i = 21; i <= 40; i++) await s.add(F.ROWS_A[i % 6]);
  await s.op({ type: 'finish' });
  const size = JSON.stringify(toEvidenceWire(s.ctx)).length;
  assert.ok(size < 64 * 1024, `evidence wire ${size} bytes`);
  assert.ok(!JSON.stringify(toEvidenceWire(s.ctx).graph.events).includes(F.ROWS_A[0]), 'learner text is not repeated in evidence events');
});
