/**
 * Engine tests: F1 parsing and scope, validator semantics over many values,
 * graph invariants (RG-C1…C7), disclosure/leak guard, planner traceability,
 * LLM ports (mocked — never a paid call), duplicates and stale versions.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exact, formatExact, mul, PI, pow } from './exact.ts';
import { solveProblem } from './facts.ts';
import { applyClarification, buildProblemFromForm, confirmProblem, parseProblem } from './problemParser.ts';
import { parseRow } from './rowParser.ts';
import { generateAnalog } from './analog.ts';
import { buildForbidden, findLeak, validateTutorOutput, allowedLevel } from './disclosure.ts';
import { fallbackResponse } from './tutorFallback.ts';
import { confirmAndStart, interpretProblem, runTurn, type Ports } from './orchestrator.ts';
import { validateVisualSpec } from './visualPlanner.ts';
import { groundRowParse } from './grounding.ts';
import { buildSummary, SUMMARY_LIMITATION } from './summary.ts';
import { Session } from './testkit.ts';
import * as F from './fixtures.ts';
import type { CoachContext, TurnOp } from './types.ts';
import { readFileSync } from 'node:fs';

// ------------------------------------------------------------------ F1

test('F1-AC-01/02: every given is grounded in a span of the problem text', () => {
  for (const t of [F.PROBLEM_A, F.PROBLEM_B, F.PROBLEM_C, F.PROBLEM_REG]) {
    const s = parseProblem(t);
    assert.equal(s.interpretationStatus, 'draft');
    for (const g of s.givens) {
      const span = t.slice(g.sourceSpan!.start, g.sourceSpan!.end);
      assert.ok(span.includes(formatExact(g.value)), `${g.symbol} span "${span}"`);
    }
  }
  const c = parseProblem(F.PROBLEM_C);
  assert.deepEqual(c.givens.map((g) => [g.symbol, g.sourceSpan]), [
    ['d1', { start: 20, end: 39 }], ['h1', { start: 43, end: 58 }], ['d2', { start: 90, end: 110 }],
  ], 'spans equal PRODUCT_SPEC §9.2 example');
  assert.deepEqual(c.constraints[0].sourceSpan, { start: 112, end: 126 });
  assert.deepEqual(c.unknowns[0].sourceSpan, { start: 145, end: 156 });
});

test('F1 branches: clarification, insufficient, unsupported (E-01…E-05, E-18, E-19)', () => {
  const e01 = parseProblem('Một hình trụ có bán kính 3 cm, chiều cao 5 cm. Nếu bán kính tăng 2 cm và giữ nguyên chiều cao thì thể tích tăng gấp bao nhiêu lần?');
  assert.equal(e01.interpretationStatus, 'needs_clarification');
  const thêm = applyClarification(e01, e01.clarifications[0].id, 0);
  assert.equal(thêm.interpretationStatus, 'draft');
  assert.deepEqual(solveProblem(thêm).kV!.value, exact(25, 9));
  const thành = applyClarification(e01, e01.clarifications[0].id, 1);
  assert.deepEqual(solveProblem(thành).kV!.value, exact(4, 9));
  assert.deepEqual(parseProblem('Một hình trụ có bán kính 3 cm. Tính thể tích.').statusReasons, ['missing:h1']);
  assert.equal(parseProblem('Một hình trụ có bán kính 3 cm. Tính thể tích.').interpretationStatus, 'insufficient');
  const e03 = parseProblem('Nếu bán kính đáy của một hình trụ tăng gấp 3 lần và chiều cao giữ nguyên thì thể tích tăng gấp mấy lần?');
  assert.equal(e03.interpretationStatus, 'draft', 'E-03 symbolic height');
  assert.deepEqual(solveProblem(e03).kV!.value, exact(9));
  assert.equal(solveProblem(e03).V1, undefined, 'V₁ not determined');
  assert.deepEqual(parseProblem('Một hình trụ có bán kính 30 mm, chiều cao 5 cm. Tính thể tích.').statusReasons, ['mixed_units']);
  assert.ok(parseProblem('Một hình nón có bán kính 3 cm, chiều cao 4 cm. Tính thể tích.').statusReasons.includes('shape:cone'));
  assert.ok(parseProblem('Hình trụ có bán kính 3 cm, cao 4 cm. Tính diện tích xung quanh.').statusReasons.includes('quantity:surface_area'));
  assert.deepEqual(parseProblem('Hình trụ có thể tích 50π cm³, chiều cao 3 cm. Tính bán kính.').statusReasons, ['irrational_result']);
  const inv = parseProblem('Hình trụ có thể tích 72π cm³, bán kính 3 cm. Tính chiều cao.');
  assert.equal(inv.problemType, 'inverse');
  assert.deepEqual(solveProblem(inv).h1!.value, exact(8));
  assert.equal(parseProblem('Một hình trụ có bán kính 1.000 cm, chiều cao 5 cm. Tính thể tích.').interpretationStatus, 'needs_clarification');
});

test('F1: learner edits — grounded edits accepted, contradictions kept as invalid learner claims', () => {
  const draft = parseProblem(F.PROBLEM_C);
  const { spec, contradictions } = confirmProblem(draft, [{ symbol: 'd1', kind: 'r', value: exact(6) }]);
  assert.equal(spec.interpretationStatus, 'confirmed');
  assert.ok(spec.givens.some((g) => g.symbol === 'd1'), 'text-grounded interpretation stays');
  assert.equal(contradictions.length, 1);
  const ctx = confirmAndStart(draft, [{ symbol: 'd1', kind: 'r', value: exact(6) }]);
  const f1 = ctx.graph.nodes['f1-1'];
  assert.equal(f1.provenance, 'learner_claim');
  assert.equal(f1.validation!.status, 'invalid');
  assert.ok(f1.validation!.reasonCodes.includes('contradicts_problem_text'));
});

test('F1-AC-05: structured form fallback without any LLM', () => {
  const s = buildProblemFromForm({ text: 'đề của em', unit: 'cm', twoCylinders: true, values: { r1: 2, r2: 6, h1: 5 }, fixed: ['h'], unknown: 'kV' });
  const c = confirmProblem(s, []).spec;
  assert.equal(c.interpretationStatus, 'confirmed');
  assert.equal(c.interpretationProvenance, 'learner_form');
  assert.deepEqual(solveProblem(c).kV!.value, exact(9));
});

// ------------------------------------------------------------------ math over many values (F3-AC-04)

test('F3-AC-04: validator agrees with independent float math on ≥ 30 (r, h) pairs', async () => {
  let n = 0;
  for (const r of [1, 2, 2.5, 3, 4, 6, 7.5]) {
    for (const h of [1, 4, 5.5, 9, 12]) {
      const text = `Một hình trụ có bán kính đáy ${String(r).replace('.', ',')} cm và chiều cao ${String(h).replace('.', ',')} cm. Tính thể tích hình trụ.`;
      const s = new Session(text);
      const V = mul(mul(PI, pow(exact(r * 2, 2), 2)), exact(h * 2, 2));
      await s.add(`V₁ = π·${String(r).replace('.', ',')}²·${String(h).replace('.', ',')} = ${formatExact(V)} cm³`);
      assert.equal(s.status(1), 'valid', text);
      assert.ok(Math.abs(Math.PI * r * r * h - (V.n / V.d) * Math.PI) < 1e-9);
      await s.add(`V₁ = ${formatExact(mul(V, exact(2)))} cm³`);
      assert.equal(s.status(2), 'ambiguous', 'different redefinition of V₁ waits for the learner (RG-C2)');
      n++;
    }
  }
  assert.ok(n >= 30);
});

// ------------------------------------------------------------------ rows, validator semantics

test('rows: approximations, units, formulas, strategies, out of scope, questions', async () => {
  const s = new Session('Một hình trụ có bán kính đáy 3 cm và chiều cao 10 cm. Tính thể tích hình trụ.');
  for (const row of ['V₁ = π·3²·10 = 90π ≈ 282,74 cm³', 'V₁ = π·3²·10 = 90π ≈ 282,7 cm³', 'V₁ = π·3²·10 = 90π ≈ 283 cm³']) {
    await s.add(row);
  }
  assert.equal(s.status(1), 'valid');
  assert.ok(s.row(1).validation!.reasonCodes.includes('approximation'));
  assert.equal(s.status(2), 'valid', 'same value restated → no conflict');
  await s.add('V₁ = π·3²·10 = 90π ≈ 282,8 cm³');
  assert.equal(s.status(4), 'invalid');
  assert.equal(s.status(3), 'valid', '283 with 0 decimals');
  const bare = new Session('Một hình trụ có bán kính đáy 3 cm và chiều cao 10 cm. Tính thể tích hình trụ.');
  await bare.add('V₁ = 90π cm³');
  assert.equal(bare.status(1), 'insufficient_evidence', 'a bare value for the unknown has no supporting step');
  assert.ok(bare.row(1).validation!.reasonCodes.includes('missing_premise'));
  await s.add('A₁ = 9π cm³');
  assert.equal(s.status(5), 'invalid');
  assert.ok(s.row(5).validation!.reasonCodes.includes('unit_error'));
  await s.add('V = πr²h');
  assert.equal(s.status(6), 'valid');
  await s.add('V = 2πrh');
  assert.equal(s.status(7), 'invalid');
  assert.ok(s.row(7).validation!.reasonCodes.includes('wrong_formula'));
  await s.add('Em sẽ tính diện tích đáy rồi nhân với chiều cao để ra thể tích.');
  assert.equal(s.status(8), 'valid');
  await s.add('Em làm như bài trước');
  assert.equal(s.status(9), 'ambiguous');
  await s.add('S_xq = 2πrh = 60π');
  assert.equal(s.status(10), 'unverified', 'F5-AC-03: outside scope is never invalid');
  assert.ok(s.row(10).validation!.reasonCodes.includes('outside_poc_scope'));
  await s.add('Đáp án là bao nhiêu ạ?');
  assert.equal(s.row(11).interpretation.semanticType, 'question');
  assert.ok(s.last.coach, 'question gets a tutor reply');
  assert.ok(!/90π|282/.test(JSON.stringify(s.last.coach)), 'E-20: no answer disclosed');
  await s.add('A₁ = π·3² = 6π cm²');
  assert.deepEqual(s.row(12).validation!.possibleMisconceptions.map((m) => m.code), ['square_as_double'], 'E-11');
  await s.add('A₁ = 9 cm²');
  assert.deepEqual(s.row(13).validation!.possibleMisconceptions.map((m) => m.code), ['missing_pi']);
});

test('F5: two-cylinder ambiguity offers readings bound to the learner text; choosing validates', async () => {
  const s = new Session(F.PROBLEM_REG);
  await s.add('V = 4π·5');
  assert.equal(s.status(1), 'ambiguous');
  assert.equal(s.last.clarification?.kind, 'ambiguity');
  const alts = s.row(1).interpretation.alternatives;
  assert.equal(alts.length, 2);
  assert.ok(s.last.clarification!.options.some((o) => o.value === 'reject'));
  await s.op({ type: 'resolve_ambiguity', nodeId: s.row(1).id, choiceIndex: 0 });
  assert.equal(s.status(1), 'valid');
  assert.equal(s.row(1).originalText, 'V = 4π·5', 'text unchanged by clarification');
  await s.add('V = 16π·5');
  await s.op({ type: 'reject_interpretation', nodeId: s.row(2).id });
  assert.equal(s.status(2), 'ambiguous');
  assert.ok(s.row(2).validation!.reasonCodes.includes('rejected_by_learner'));
  await s.add('A₁ = 4π, V₁ = 20π');
  assert.equal(s.last.clarification?.kind, 'split');
});

test('E-17 percent vs factor; increase vs factor; false justification', async () => {
  const s = new Session(F.PROBLEM_REG);
  await s.add('Vậy thể tích tăng 400%');
  assert.equal(s.status(1), 'invalid');
  assert.deepEqual(s.row(1).validation!.possibleMisconceptions.map((m) => m.code), ['percent_vs_factor']);
  const s2 = new Session(F.PROBLEM_REG);
  await s2.add('Vậy thể tích tăng thêm 300%');
  assert.equal(s2.status(1), 'insufficient_evidence', 'true but bare');
  const s3 = new Session(F.PROBLEM_REG);
  await s3.add('Thể tích gấp 3 lần');
  assert.ok(s3.row(1).validation!.possibleMisconceptions.some((m) => m.code === 'increase_vs_factor'));
  const a = new Session(F.PROBLEM_A);
  await a.add('V₂ = 9π·6 = 54π cm³ vì chiều cao giữ nguyên');
  assert.equal(a.status(1), 'invalid');
  assert.ok(a.row(1).validation!.reasonCodes.includes('false_justification'));
});

// ------------------------------------------------------------------ graph invariants

test('RG-C1: an explicit forward reference that closes a cycle is rejected', async () => {
  const s = new Session(F.PROBLEM_REG);
  await s.add('A₁ = π·2² = 4π cm²');
  await s.add('V₁ = 4π·5 = 20π cm³');
  await s.edit(1, 'A₁ = π·2² = 4π cm², từ bước 2');
  assert.equal(s.status(1), 'ambiguous');
  assert.ok(s.row(1).validation!.reasonCodes.includes('cyclic_reference'));
  assert.ok(!s.graph().edges.some((e) => e.from === s.row(2).id && e.to === s.row(1).id));
});

test('RG-C2: conflicting redefinition — replace or keep both, decided by the learner', async () => {
  const s = new Session(F.PROBLEM_C);
  await s.add('r₁ = 6 cm');
  await s.add('r₁ = 3 cm');
  assert.equal(s.status(2), 'ambiguous');
  assert.equal(s.last.clarification?.kind, 'conflict');
  await s.op({ type: 'resolve_conflict', nodeId: s.row(2).id, action: 'replace' });
  assert.equal(s.status(2), 'valid');
  assert.deepEqual(s.row(1).revisedBy, [s.row(2).id]);
  assert.equal(s.status(1), 'invalid', 'the replaced claim keeps its status');
  await s.add('A₁ = π·3² = 9π cm²');
  assert.deepEqual(s.deps(3), [s.row(2).id]);
  const k = new Session(F.PROBLEM_C);
  await k.add('r₁ = 6 cm');
  await k.add('r₁ = 3 cm');
  await k.op({ type: 'resolve_conflict', nodeId: k.row(2).id, action: 'keep_both' });
  assert.equal(k.row(2).keptAsHypothesis, true);
  assert.equal(k.graph().symbolTable.r1?.producerNodeId, k.row(1).id);
});

test('retraction: dependents lose the premise (missing_premise), history kept', async () => {
  const s = new Session(F.PROBLEM_REG);
  await s.add('A₁ = π·2² = 4π cm²');
  await s.add('V₁ = A₁·5 = 20π cm³');
  assert.equal(s.status(2), 'valid');
  await s.op({ type: 'retract_row', nodeId: s.row(1).id });
  assert.equal(s.row(1).lifecycle, 'retracted');
  assert.equal(s.status(2), 'insufficient_evidence');
  assert.ok(s.row(2).validation!.reasonCodes.includes('missing_premise'));
  assert.ok(s.graph().events.some((e) => e.type === 'node_retracted'));
});

test('POC-AC-04: random operation sequences never modify original text, history or event order', async () => {
  let seed = 7;
  const rand = (n: number) => ((seed = (seed * 48271) % 2147483647) % n);
  const pool = [...F.ROWS_C, ...F.EDITS_C, 'V = 4π·5', 'r gấp 2 lần', 'Em đoán thể tích gấp 2 lần.', 'vì chiều cao như nhau', 'xyz', 'A₁ = π·3² = 9π cm²'];
  for (let run = 0; run < 200; run++) {
    const s = new Session(F.PROBLEM_C);
    const texts = new Map<string, string[]>();
    for (let step = 0; step < 6; step++) {
      const rows = Object.values(s.graph().nodes).filter((n) => n.source !== 'problem' && n.lifecycle === 'active');
      const choice = rand(4);
      const text = pool[rand(pool.length)];
      let op: TurnOp;
      if (choice === 0 || !rows.length) op = { type: 'add_row', rowText: text };
      else if (choice === 1) op = { type: 'edit_row', nodeId: rows[rand(rows.length)].id, rowText: text };
      else if (choice === 2) op = { type: 'retract_row', nodeId: rows[rand(rows.length)].id };
      else op = { type: 'request_hint', nodeId: rows[rand(rows.length)].id };
      const r = await s.op(op);
      assert.ok(r.visualSpecs.every((v) => validateVisualSpec(v).ok), 'FR-VIS-006 traceable specs');
      for (const n of Object.values(s.graph().nodes)) {
        if (n.source === 'problem') continue;
        const versions = [...n.history.map((h) => h.originalText), n.originalText];
        const prev = texts.get(n.id) ?? [];
        assert.deepEqual(versions.slice(0, prev.length), prev, 'history is append-only');
        texts.set(n.id, versions);
      }
      const seqs = s.graph().events.map((e) => e.seq);
      assert.deepEqual(seqs, [...seqs].sort((a, b) => a - b));
      assert.equal(new Set(seqs).size, seqs.length);
    }
  }
});

test('RG-C7 and row limits', async () => {
  const s = new Session(F.PROBLEM_REG);
  for (let i = 0; i < 40; i++) await s.add(`A₁ = 4π`);
  await assert.rejects(() => s.add('A₁ = 4π'), /too_many_rows/);
  await assert.rejects(() => s.add('x'.repeat(301)), /row_too_long/);
});

// ------------------------------------------------------------------ duplicates, stale results

test('FR-REC-002 / FR-REC-003: duplicate opId is a no-op; stale version is rejected', async () => {
  const s = new Session(F.PROBLEM_REG);
  const req = { context: s.ctx, expectedGraphVersion: s.ctx.graph.version, opId: 'dup', op: { type: 'add_row', rowText: 'A₁ = 4π' } as TurnOp };
  const r1 = await runTurn(req);
  const r2 = await runTurn({ ...req, context: r1.context, expectedGraphVersion: r1.context.graph.version });
  assert.equal(Object.values(r2.context.graph.nodes).filter((n) => n.source !== 'problem').length, 1);
  const stale = await runTurn({ ...req, opId: 'other', context: r1.context, expectedGraphVersion: s.ctx.graph.version });
  assert.equal(stale.error?.code, 'version_conflict');
  assert.equal(stale.context, r1.context, 'nothing changed');
});

// ------------------------------------------------------------------ disclosure & leak guard

test('leak guard: forbidden values in many forms, incl. Vietnamese number words (BL-16)', () => {
  const spec = confirmProblem(parseProblem(F.PROBLEM_B), []).spec;
  const ctx = confirmAndStart(parseProblem(F.PROBLEM_B));
  const forbidden = buildForbidden(spec, solveProblem(spec), ctx.graph);
  for (const leak of ['Thể tích gấp 9 lần', 'thể tích tăng gấp chín lần', 'V₂/V₁ = 9', 'V2 = 1800π', 'V₁ = 200 pi', 'diện tích đáy gấp 9', 'Gấp 9 lần thể tích ban đầu', 'khoảng 628.32', 'Đáp án là V₂/V₁ = 9.', 'thể tích tăng gấp 9.', 'Vậy V₂ : V₁ = 9, xong']) {
    assert.ok(findLeak(leak, forbidden), leak);
  }
  for (const ok of ['Bán kính gấp 3 lần', 'r₁ = 5 dm, r₂ = 15 dm', 'Ví dụ: bán kính gấp 5 thì diện tích gấp 25 lần', 'h = 8 dm', 'thể tích gấp 9.5 lần']) {
    assert.equal(findLeak(ok, forbidden), null, ok);
  }
});

test('leak guard: lengths not stated in the problem, followed by punctuation', () => {
  const ctx = confirmAndStart(parseProblem(F.PROBLEM_REG));
  const forbidden = buildForbidden(ctx.problemSpec, solveProblem(ctx.problemSpec), ctx.graph);
  assert.ok(findLeak('Đáp án là d₂ = 8.', forbidden));
  assert.ok(findLeak('đường kính mới bằng 8.', forbidden));
  assert.equal(findLeak('Bán kính mới là 4 cm.', forbidden), null, 'given value');
});

test('disclosure levels: D0 default, +1 per request, auto D2 after 2 failed revisions', () => {
  assert.equal(allowedLevel({}, 'n1'), 0);
  assert.equal(allowedLevel({ n1: { hintRequests: 3, failedRevisions: 0, lastCoachedRevision: null, lastCoachedLevel: null } }, 'n1'), 3);
  assert.equal(allowedLevel({ n1: { hintRequests: 0, failedRevisions: 2, lastCoachedRevision: null, lastCoachedLevel: null } }, 'n1'), 2);
});

test('hint ladder D0→D4 never discloses a forbidden value; D4 is an intermediate step only', async () => {
  const s = new Session(F.PROBLEM_C);
  await s.add('Bán kính cốc cũ r₁ = 6 cm.');
  const forbidden = buildForbidden(s.ctx.problemSpec, solveProblem(s.ctx.problemSpec), s.ctx.graph);
  const levels: number[] = [];
  for (let i = 0; i < 4; i++) {
    const r = await s.op({ type: 'request_hint', nodeId: s.row(1).id });
    levels.push(r.coach!.disclosureLevel);
    const text = [r.coach!.question, r.coach!.explanation, r.coach!.hint?.text ?? ''].join(' ');
    assert.equal(findLeak(text, forbidden), null, text);
  }
  assert.deepEqual(levels, [1, 2, 3, 4]);
  assert.ok(s.graph().events.filter((e) => e.type === 'hint_shown').length >= 4);
});

const CTX: CoachContext = {
  problemText: F.PROBLEM_B, trigger: 'invalid_node',
  focusNode: { id: 'n1', row: 1, originalText: 'x', displayText: 'x', status: 'invalid', reasonCodes: ['scaling_claim_false'], possibleMisconceptions: ['linear_scaling'] },
  relatedNodes: [], disclosure: { allowedLevel: 0, forbiddenValues: [], disclosableFacts: [] }, learnerMessage: null, rootCauseRows: [],
};
const OK_REPLY = { replyType: 'socratic_question', question: 'Khi bán kính tăng, diện tích đáy thay đổi thế nào?', explanation: '', hintLevel: 0, hintText: '', relevantNodeIds: ['n1'], disclosureLevel: 0, misconception: { detected: true, code: 'linear_scaling', evidence: 'bước 1' } };

test('validateTutorOutput: schema, level, node ids, leak, praise of an invalid node', () => {
  const spec = confirmProblem(parseProblem(F.PROBLEM_B), []).spec;
  const forbidden = buildForbidden(spec, solveProblem(spec), confirmAndStart(parseProblem(F.PROBLEM_B)).graph);
  assert.equal(validateTutorOutput(OK_REPLY, CTX, forbidden).ok, true);
  const bad = (patch: object) => validateTutorOutput({ ...OK_REPLY, ...patch }, CTX, forbidden);
  assert.equal(bad({ question: 'Thể tích gấp 9 lần nhé' }).ok, false);
  assert.equal(bad({ disclosureLevel: 2 }).ok, false);
  assert.equal(bad({ relevantNodeIds: ['n99'] }).ok, false);
  assert.equal(bad({ question: 'Đúng rồi, em làm đúng!' }).ok, false);
  assert.equal(bad({ extra: 1 }).ok, false);
  assert.equal(bad({ question: 'CANVAS-INSTR-5D2E' }).ok, false);
});

test('rule-based fallback is always safe and Vietnamese', () => {
  for (const code of ['radius_diameter', 'linear_scaling', 'square_as_double', 'forgot_height', 'premise_changed', 'depends_on_invalid']) {
    for (const lv of [0, 1, 2, 3, 4] as const) {
      const spec = confirmProblem(parseProblem(F.PROBLEM_C), []).spec;
      const forbidden = buildForbidden(spec, solveProblem(spec), confirmAndStart(parseProblem(F.PROBLEM_C)).graph);
      const r = fallbackResponse({ ...CTX, disclosure: { ...CTX.disclosure, allowedLevel: lv }, focusNode: { ...CTX.focusNode!, possibleMisconceptions: [code], reasonCodes: [code] } }, spec, forbidden);
      assert.equal(r.source, 'rule_based');
      assert.ok(r.disclosureLevel <= lv);
      assert.equal(findLeak([r.question, r.explanation, r.hint?.text ?? ''].join(' '), forbidden), null);
    }
  }
});

// ------------------------------------------------------------------ LLM ports (mocked)

test('parser LLM: used only after rules fail; grounded reading accepted; "corrected" number rejected (G1)', async () => {
  let calls = 0;
  const ports: Ports = {
    parser: async (input) => {
      calls++;
      if (input.rowText.includes('diện tích mặt đáy của lon mới')) {
        return { semanticType: 'computation', target: 'A2', chain: ['pi*3^2', '9pi'], changes: [], claimKind: '', claimFactor: '', justification: '', ambiguous: false, question: '' };
      }
      return { semanticType: 'computation', target: 'A1', chain: ['pi*3^2', '9pi'], changes: [], claimKind: '', claimFactor: '', justification: '', ambiguous: false, question: '' };
    },
  };
  const s = new Session(F.PROBLEM_A, ports);
  for (const row of F.ROWS_A) await s.add(row);
  assert.equal(calls, 0, 'FR-PARSE-001: demo rows never reach the LLM');
  await s.add('diện tích mặt đáy của lon mới thì em lấy pi nhân 3 bình phương bằng 9 pi');
  assert.equal(calls, 1);
  assert.equal(s.row(7).interpretation.provenance, 'llm_interpretation');
  await s.add('em nghĩ là tầm sáu pi');
  assert.equal(s.row(8).validation!.status, 'ambiguous', 'G1: 9 and 3 are not in the text');
  const report = groundRowParse('em nghĩ là tầm sáu pi', { kind: 'equation', target: 'A1', chain: ['9pi'], unit: null }, s.ctx.problemSpec, null);
  assert.deepEqual(report.failures, ['G1', 'G2']);
});

test('parser LLM failures: schema-invalid retried once, timeout → rules only; tutor errors → rule-based', async () => {
  let calls = 0;
  const s = new Session(F.PROBLEM_REG, {
    parser: async () => {
      calls++;
      return { nope: true };
    },
    tutor: async () => {
      throw new Error('timeout');
    },
  });
  const r = await s.add('một câu không có toán học nào cả');
  assert.equal(calls, 2, 'one retry for schema-invalid output');
  assert.equal(r.degraded.parser, 'failed');
  assert.equal(s.status(1), 'unverified');
  await s.add('Em đoán thể tích gấp 2 lần.');
  assert.equal(s.last.coach?.source, 'rule_based');
  assert.equal(s.last.degraded.tutor, 'rule_based');
  assert.ok(s.graph().events.some((e) => e.type === 'turn_degraded'));
});

test('tutor LLM: a valid reply is used; a leaking reply is replaced by the rule-based coach', async () => {
  const good = new Session(F.PROBLEM_B, { tutor: async (c) => ({ ...OK_REPLY, relevantNodeIds: [c.focusNode!.id] }) });
  await good.add(F.ROWS_B.hypothesis);
  assert.equal(good.last.coach?.source, 'ai');
  const leak = new Session(F.PROBLEM_B, { tutor: async (c) => ({ ...OK_REPLY, relevantNodeIds: [c.focusNode!.id], question: 'Thể tích gấp 9 lần đấy.' }) });
  await leak.add(F.ROWS_B.hypothesis);
  assert.equal(leak.last.coach?.source, 'rule_based');
  // The model never changes validation (NFR-AI-003).
  assert.deepEqual(good.row(1).validation!.status, leak.row(1).validation!.status);
});

test('problem LLM: used only when rules find nothing; quotes must be verbatim', async () => {
  const text = 'Có một hình trụ với độ dài bán kính đáy chừng 4 cm, còn độ cao là 6 cm. Hãy tính thể tích.';
  const det = await interpretProblem(text);
  assert.ok(det.spec.givens.length >= 1);
  const odd = 'Hình trụ: R bốn phân, H sáu phân. Thể tích?';
  const res = await interpretProblem(odd, { problem: async () => ({ mentions: [{ type: 'given', kind: 'r', cylinder: 1, value: '4', unit: 'cm', quote: 'R = 4 cm' }] }) });
  assert.equal(res.spec.givens.length, 0, 'ungrounded quote dropped');
});

// ------------------------------------------------------------------ F8, summary, analog

test('F8-AC-03: analog problems parse, are confirmed and differ from the main answer', () => {
  for (const t of [F.PROBLEM_A, F.PROBLEM_B, F.PROBLEM_C, F.PROBLEM_REG,
    'Một hình trụ có bán kính đáy 3 cm và chiều cao 10 cm. Tính thể tích hình trụ.',
    'Hình trụ có thể tích 72π cm³, bán kính 3 cm. Tính chiều cao.',
    'Một hình trụ có bán kính đáy 2 cm và chiều cao 3 cm. Nếu bán kính đáy tăng thành 4 cm và chiều cao tăng thành 6 cm thì thể tích tăng gấp bao nhiêu lần?']) {
    const spec = confirmProblem(parseProblem(t), []).spec;
    const a = generateAnalog(spec);
    assert.ok(a, t);
    assert.equal(a!.interpretationStatus, 'confirmed');
    assert.equal(a!.problemType, spec.problemType);
  }
});

test('F8-AC-01/02: independent mode hides support; submission stored once before evaluation', async () => {
  const s = new Session(F.PROBLEM_REG);
  await s.add('Em đoán thể tích gấp 2 lần.');
  await s.op({ type: 'start_independent' });
  await s.add('Em đoán thể tích gấp 2 lần.');
  assert.equal(s.last.coach, null);
  assert.equal(s.last.clarification, null);
  await assert.rejects(() => s.op({ type: 'request_hint', nodeId: s.row(1).id }), /not_allowed/);
  await assert.rejects(() => s.op({ type: 'ask_coach', message: 'giúp em' }), /not_allowed/);
  await assert.rejects(() => s.op({ type: 'experiment', event: 'start' }), /not_allowed/);
  await s.op({ type: 'submit_independent' });
  const ev = s.ctx.independent!.graph.events;
  const sub = ev.findIndex((e) => e.type === 'independent_submitted');
  const evald = ev.findIndex((e) => e.type === 'independent_evaluated');
  assert.ok(sub >= 0 && evald > sub);
  await assert.rejects(() => s.op({ type: 'submit_independent' }), /not_allowed|already_submitted/);
});

test('summary: traces sources, keeps hypotheses verbatim, flags demo data, states limits', async () => {
  const s = new Session(F.PROBLEM_B);
  await s.op({ type: 'add_row', rowText: F.ROWS_B.hypothesis, source: 'demo_script' });
  await s.op({ type: 'finish' });
  const items = buildSummary(s.ctx.graph, s.ctx.independent, s.ctx.problemSpec.text);
  const hyp = items.find((i) => i.key === 'hypotheses')!;
  assert.ok(hyp.lines[0].includes(`“${F.ROWS_B.hypothesis}”`));
  assert.ok(hyp.lines[0].includes('[dữ liệu minh họa]'));
  assert.ok(hyp.sourceSeqs.length > 0);
  const seqs = new Set(s.ctx.graph.events.map((e) => e.seq));
  for (const it of items) for (const q of it.sourceSeqs) assert.ok(seqs.has(q) || it.key === 'independent');
  assert.equal(items.find((i) => i.key === 'independent')!.missing, true);
  assert.ok(SUMMARY_LIMITATION.includes('không phải đánh giá năng lực lâu dài'));
});

test('unsupported visualization requests get a limit notice and no new renderer (FR-VIS-009)', async () => {
  const s = new Session(F.PROBLEM_REG);
  const r = await s.op({ type: 'ask_coach', message: 'Coach vẽ hình nón cho em xem với' });
  assert.equal(r.coach?.replyType, 'limit_notice');
  assert.ok(r.visualSpecs.find((v) => v.renderer === 'reasoning_graph')?.unsupported);
});

test('FR-ORCH-003: tampered validation from a client is recomputed before use', async () => {
  const s = new Session(F.PROBLEM_B);
  await s.add('Thể tích gấp 3 lần.');
  const n = s.row(1);
  assert.equal(n.validation!.status, 'invalid');
  const forged = structuredClone(s.ctx);
  forged.graph.nodes[n.id].validation = { ...n.validation!, status: 'valid', claimedValue: { n: 9, d: 1, piPow: 0 } };
  const r = await runTurn({ context: forged, expectedGraphVersion: forged.graph.version, opId: 'x', op: { type: 'request_hint', nodeId: n.id } });
  assert.equal(r.context.graph.nodes[n.id].validation!.status, 'invalid');
  assert.ok(!/gấp 9|9 lần/.test(JSON.stringify(r.coach)));
});

test('validateTurnRequest rejects malformed or oversized requests', async () => {
  const { validateTurnRequest } = await import('./contract.ts');
  const s = new Session(F.PROBLEM_REG);
  const good = { context: s.ctx, expectedGraphVersion: s.ctx.graph.version, opId: 'a', op: { type: 'add_row', rowText: 'A₁ = 4π' } };
  assert.equal(validateTurnRequest(JSON.parse(JSON.stringify(good))).ok, true);
  assert.equal(validateTurnRequest({ ...good, op: { type: 'eval', code: 'x' } }).ok, false);
  assert.equal(validateTurnRequest({ ...good, op: { type: 'edit_row', nodeId: '__proto__', rowText: 'x' } }).ok, false);
  assert.equal(validateTurnRequest({ ...good, context: { ...s.ctx, problemSpec: { ...s.ctx.problemSpec, interpretationStatus: 'draft' } } }).ok, false);
});

test('F2-AC-01/F2-AC-02: two different sufficient plans are both valid; plans create no nodes or values', async () => {
  for (const plan of ['Em sẽ tính thể tích hai hình rồi chia cho nhau.', 'Em dùng tỉ số bán kính bình phương vì chiều cao không đổi.']) {
    const s = new Session(F.PROBLEM_REG);
    await s.add(plan);
    assert.equal(s.status(1), 'valid', plan);
    assert.equal(Object.values(s.graph().nodes).filter((n) => n.source !== 'problem').length, 1);
    assert.equal(s.row(1).validation!.producedSymbol ?? null, null);
  }
  const d = new Session(F.PROBLEM_C);
  await d.add('Em sẽ tính diện tích đáy rồi tính thể tích hai cốc rồi chia.');
  assert.equal(d.status(1), 'insufficient_evidence', 'diameter problem without deriving r');
  assert.ok(d.row(1).validation!.reasonCodes.includes('plan_missing_step'));
  const w = new Session(F.PROBLEM_REG);
  await w.add('Em sẽ tính chu vi đáy rồi nhân chiều cao.');
  assert.equal(w.status(1), 'invalid');
});

test('F3-AC-03: two different correct chains for the same problem both reach a valid conclusion', async () => {
  const viaVolumes = new Session(F.PROBLEM_C);
  for (const r of F.EDITS_C) await viaVolumes.add(r);
  assert.equal(viaVolumes.status(5), 'valid');
  const viaLaw = new Session(F.PROBLEM_C);
  await viaLaw.add('Bán kính gấp 12 : 6 = 2 lần');
  await viaLaw.add('Chiều cao như nhau nên thể tích gấp 2² = 4 lần');
  assert.equal(viaLaw.status(1), 'valid');
  assert.equal(viaLaw.status(2), 'valid');
  assert.equal(viaLaw.row(2).interpretation.semanticType, 'conclusion');
});

test('POC-AC-09: exactly the documented fields reach the LLM ports (NFR-PRIV-005)', async () => {
  const seen: { parser?: object; tutor?: object } = {};
  const s = new Session(F.PROBLEM_REG, {
    parser: async (input) => ((seen.parser = input), { nope: 1 }),
    tutor: async (ctx) => ((seen.tutor = ctx), { nope: 1 }),
  });
  await s.add('A₁ = π·2² = 4π cm²');
  await s.add('một dòng mà quy tắc không đọc được');
  await s.add('Em đoán thể tích gấp 2 lần.');
  assert.deepEqual(Object.keys(seen.parser!).sort(), ['activeNodes', 'cylinderLabels', 'problemText', 'rowText', 'symbols']);
  const others = (seen.parser as { activeNodes: object[] }).activeNodes;
  assert.ok(others.every((o) => Object.keys(o).sort().join() === 'displayText,row'), 'other rows only as system summaries, never originalText');
  assert.deepEqual(Object.keys(seen.tutor!).sort(), ['disclosure', 'focusNode', 'learnerMessage', 'problemText', 'relatedNodes', 'rootCauseRows', 'trigger']);
  assert.ok(!JSON.stringify((seen.tutor as { relatedNodes: unknown }).relatedNodes).includes('originalText'));
});

test('POC-AC-10 / FR-VIS-010: no eval, new Function or raw HTML injection in Canvas code', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const dirs = ['src/lib/reasoning', 'src/components/canvas', 'src/pages', 'server'];
  for (const d of dirs) {
    for (const f of readdirSync(d)) {
      if (!/\.(ts|tsx)$/.test(f) || f.endsWith('.test.ts')) continue;
      const src = readFileSync(`${d}/${f}`, 'utf8');
      assert.ok(!/\beval\(|new Function\(|dangerouslySetInnerHTML/.test(src), `${d}/${f}`);
    }
  }
  assert.ok(readFileSync('src/components/canvas/Visuals.tsx', 'utf8').includes('trust={false}'));
});

test('NFR-PERF-003 (PROPOSED budget): deterministic turn with 40 nodes stays under 200 ms', async () => {
  const s = new Session(F.PROBLEM_C);
  for (let i = 0; i < 39; i++) await s.add(F.EDITS_C[i % 5]);
  const t0 = performance.now();
  await s.add('A₁ = π·3² = 9π cm²');
  const ms = performance.now() - t0;
  assert.ok(ms < 200, `${ms.toFixed(1)} ms`);
});
