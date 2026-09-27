/**
 * Explainable Reasoning Graph (PRODUCT_SPEC v0.5): Explanation Builder, edge semantics,
 * disclosure/leak safety, revision consistency and the §15.6 case states.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGraphViewModel, explanationForbidden, viewModelTexts, type ExplainContext, type GraphViewModel } from './explanations.ts';
import { findLeak } from './disclosure.ts';
import { solveProblem } from './facts.ts';
import { formatExact } from './exact.ts';
import { validateVisualSpec } from './visualPlanner.ts';
import { planForContext } from './orchestrator.ts';
import { Session } from './testkit.ts';
import * as F from './fixtures.ts';
import type { GraphParams, SessionContext, TurnOp } from './types.ts';

function ctxOf(s: Session, extra: Partial<ExplainContext> = {}): ExplainContext {
  const c = s.ctx;
  const ind = c.phase === 'independent' && c.independent;
  return {
    spec: ind ? c.independent!.problemSpec : c.problemSpec,
    facts: solveProblem(ind ? c.independent!.problemSpec : c.problemSpec),
    graph: ind ? c.independent!.graph : c.graph,
    phase: c.phase, disclosure: c.disclosure, submitted: c.independent?.submitted, ...extra,
  };
}
const vmOf = (s: Session, extra: Partial<ExplainContext> = {}) => buildGraphViewModel(ctxOf(s, extra));
const node = (vm: GraphViewModel, s: Session, row: number) => vm.nodes.find((n) => n.nodeId === s.row(row).id)!;
const into = (vm: GraphViewModel, s: Session, row: number) => vm.edges.filter((e) => e.to === s.row(row).id && e.depth === 'direct');
const graphSpec = (s: Session) => s.last.visualSpecs.find((v) => v.renderer === 'reasoning_graph')!.params as GraphParams;

// ------------------------------------------------------------------ §15.6 Case A

test('§15.6 Case A: valid confirmations with sources and meaningful edge labels', async () => {
  const s = new Session(F.PROBLEM_A);
  for (const r of F.ROWS_A) await s.add(r);
  const vm = vmOf(s);
  for (let i = 1; i <= 6; i++) {
    const n = node(vm, s, i);
    assert.equal(n.validationStatus, 'valid');
    assert.deepEqual(n.statusBadge, { icon: '✓', label: 'Khớp' });
    assert.equal(n.explanation?.kind, 'confirmation');
    assert.equal(n.learnerText, F.ROWS_A[i - 1], 'FR-XG-003 verbatim');
  }
  assert.match(node(vm, s, 2).explanation!.explanationShort, /A = πr² với r₁ của đề/);
  assert.deepEqual(into(vm, s, 1).map((e) => e.labelShort).sort(), ['dữ kiện h₁ = 12 cm', 'quan hệ: h₂ = 0,5·h₁']);
  assert.deepEqual(into(vm, s, 5).map((e) => e.labelShort).sort(), ['dùng A₂ = 9π (bước 3)', 'dùng h₂ = 6 (bước 1)']);
  const e6 = into(vm, s, 6);
  assert.deepEqual(e6.filter((e) => e.relation === 'depends_on').map((e) => e.from).sort(), [s.row(4).id, s.row(5).id].sort(), 'only direct sources drawn');
  assert.deepEqual(e6.filter((e) => e.relation === 'supports').map((e) => e.from).sort(), ['c:c1', 'rel:rel1']);
  assert.match(node(vm, s, 6).explanation!.explanationShort, /^Hệ số = V₂ : V₁/);
  assert.ok(node(vm, s, 6).indirectSourceNodeIds.includes(s.row(1).id), 'indirect premises listed, not drawn');
  assert.match(node(vm, s, 6).explanation!.prompt ?? '', /Tự kiểm tra/);
  const planned = graphSpec(s).nodeViews!.find((n) => n.nodeId === s.row(1).id)!;
  assert.deepEqual(planned.linkedElementIds.sort(), ['a-n1-h2', 't-n1-h2'], 'FR-XN-005 linked visuals (filled by the planner)');
});

// ------------------------------------------------------------------ §15.6 Case B

test('§15.6 Case B: hypothesis explanation reveals nothing at D0; details follow D1–D4; correction edge after revision', async () => {
  const s = new Session(F.PROBLEM_B);
  await s.add(F.ROWS_B.hypothesis);
  const n1 = s.row(1).id;
  let vm = vmOf(s);
  let v = node(vm, s, 1);
  assert.equal(v.validationStatus, 'invalid');
  assert.equal(v.explanation?.kind, 'hypothesis_note');
  assert.equal(v.explanation?.templateId, 'XT-INVALID-ROOT-D0');
  assert.equal(v.explanation?.explanationDetailed, null);
  assert.deepEqual(v.relevantRuleIds, [], 'no rule at D0');
  assert.equal(v.learnerText, F.ROWS_B.hypothesis);
  assert.ok(!s.last.visualSpecs.some((x) => x.renderer === 'formula_highlight'), 'formula hidden for an invalid node at D0');
  const banned = /9|chín|1800|225|r²|bình phương/;
  for (const t of viewModelTexts(vm).filter((x) => !/^dữ kiện|Bước 1 dùng/.test(x))) assert.ok(!banned.test(t), `D0 text leaks: ${t}`);
  const levels: string[] = [];
  for (let i = 1; i <= 4; i++) {
    await s.op({ type: 'request_hint', nodeId: n1 });
    vm = vmOf(s);
    v = node(vm, s, 1);
    levels.push(v.explanation!.templateId);
    const forbidden = explanationForbidden(ctxOf(s));
    for (const t of viewModelTexts(vm)) assert.equal(findLeak(t, forbidden), null, t);
    assert.ok(!/gấp 9|9 lần|chín/.test(v.explanation!.explanationDetailed ?? ''));
    for (const e of vm.edges.filter((x) => x.to === n1)) assert.deepEqual(e.ruleIds, v.relevantRuleIds, 'edge rules follow the node disclosure');
    if (i === 1) assert.deepEqual(v.relevantRuleIds, []);
    if (i >= 2) assert.ok(v.relevantRuleIds.length > 0, 'rules from D2');
    if (i === 2) assert.ok(s.last.visualSpecs.some((x) => x.renderer === 'formula_highlight' && x.sourceNodeIds.includes(n1)), 'formula from D2');
  }
  assert.deepEqual(levels, ['XT-INVALID-ROOT-D1', 'XT-INVALID-ROOT-D2', 'XT-INVALID-ROOT-D3', 'XT-INVALID-ROOT-D4']);
  // Investigation, revision, correction
  await s.op({ type: 'experiment', event: 'start', nodeId: n1 });
  await s.op({ type: 'experiment', event: 'set', value: 10 });
  await s.add(F.ROWS_B.observation);
  vm = vmOf(s);
  const tests = vm.edges.find((e) => e.relation === 'tests');
  assert.ok(tests && tests.from === s.row(2).id && tests.to === n1 && tests.status === 'established');
  await s.op({ type: 'experiment', event: 'end' });
  await s.add(F.ROWS_B.area);
  await s.add(F.ROWS_B.conclusion);
  await s.op({ type: 'mark_revised_by', nodeId: n1, byNodeId: s.row(4).id, accept: true });
  vm = vmOf(s);
  v = node(vm, s, 1);
  assert.equal(v.validationStatus, 'invalid', 'still invalid, never auto-corrected');
  assert.equal(v.learnerText, F.ROWS_B.hypothesis);
  assert.equal(v.explanation?.templateId, 'XT-INVALID-REVISED');
  assert.match(v.explanation?.explanationDetailed ?? '', /bước 4 em tìm được V₂\/V₁ = 9/, 'the value is the learner\'s own now');
  const corr = vm.edges.find((e) => e.relation === 'corrects');
  assert.ok(corr && corr.from === n1 && corr.to === s.row(4).id && corr.labelShort === 'bước 4 sửa bước 1');
  assert.ok(into(vm, s, 4).some((e) => e.relation === 'supports' && e.labelShort === 'lý do: chiều cao giữ nguyên'));
});

// ------------------------------------------------------------------ §15.6 Case C

test('§15.6 Case C: correct ratio lacks support; edits produce broken edges and fresh explanations', async () => {
  const s = new Session(F.PROBLEM_C);
  for (const r of F.ROWS_C) await s.add(r);
  let vm = vmOf(s);
  assert.equal(node(vm, s, 1).explanation?.kind, 'check_prompt');
  assert.match(node(vm, s, 1).explanation!.prompt!, /bán kính hay đường kính/);
  assert.equal(node(vm, s, 3).explanation?.kind, 'inherited_issue');
  assert.equal(node(vm, s, 3).explanation?.explanationShort, 'Tính đúng từ bước 1, nhưng bước 1 chưa khớp đề.');
  const n5 = node(vm, s, 5);
  assert.equal(n5.validationStatus, 'insufficient_evidence');
  assert.equal(n5.explanation?.templateId, 'XT-INSUFF-DEPENDS-INVALID');
  assert.equal(n5.explanation?.explanationShort, 'Kết quả của em khớp đề, nhưng dựa trên bước 3, 4 chưa khớp (gốc: bước 1, 2).');
  assert.ok(into(vm, s, 3).some((e) => e.labelShort === 'dùng r₁ = 6 (bước 1)' && e.sourceEpistemic === 'learner_invalid'));
  for (const t of viewModelTexts(vm)) assert.ok(!/r₁ = 3|r₂ = 6|9π/.test(t), `derived value shown early: ${t}`);
  const oldIds = vm.nodes.map((n) => n.explanation?.explanationId).filter(Boolean) as string[];

  await s.edit(1, F.EDITS_C[0]);
  vm = vmOf(s);
  const version = s.graph().version;
  assert.ok(vm.nodes.every((n) => n.graphVersion === version), 'XG-AC-08');
  const newIds = vm.nodes.map((n) => n.explanation?.explanationId).filter(Boolean) as string[];
  assert.ok(!newIds.some((id) => oldIds.includes(id)), 'no obsolete explanation survives');
  assert.equal(node(vm, s, 1).explanation?.kind, 'confirmation');
  assert.equal(node(vm, s, 3).explanation?.kind, 'stale_premise');
  assert.equal(node(vm, s, 3).explanation?.explanationShort, 'Bước 1 đã đổi (r₁ = 3); bước này vẫn dùng số cũ.');
  const broken = into(vm, s, 3).find((e) => e.from === s.row(1).id)!;
  assert.equal(broken.status, 'broken');
  assert.equal(node(vm, s, 3).learnerText, F.ROWS_C[2], 'never rewritten');
  assert.match(node(vm, s, 5).explanation!.explanationShort, /bước 3 \(dùng số cũ\), 4 chưa khớp/);
  for (let i = 1; i < 4; i++) await s.edit(i + 1, F.EDITS_C[i]);
  vm = vmOf(s);
  assert.equal(node(vm, s, 5).explanation?.explanationShort, 'Bước 3, 4 đã đổi; bước này vẫn dùng số cũ.');
  assert.deepEqual(into(vm, s, 5).filter((e) => e.status === 'broken').map((e) => e.from).sort(), [s.row(3).id, s.row(4).id].sort());
  await s.edit(5, F.EDITS_C[4]);
  vm = vmOf(s);
  assert.ok(vm.nodes.filter((n) => n.row !== null).every((n) => n.validationStatus === 'valid'));
  assert.ok(!vm.edges.some((e) => e.status === 'broken'));
});

// ------------------------------------------------------------------ edges

test('FR-XE-002/003: contradicts only from RG-C2, cyclic references and ambiguous endpoints are provisional', async () => {
  const s = new Session(F.PROBLEM_C);
  await s.add('r₁ = 6 cm');
  let vm = vmOf(s);
  assert.equal(vm.edges.filter((e) => e.relation === 'contradicts' || e.relation === 'implements').length, 0);
  await s.add('r₁ = 3 cm');
  vm = vmOf(s);
  const c = vm.edges.find((e) => e.relation === 'contradicts')!;
  assert.equal(c.status, 'provisional');
  assert.match(c.labelShort, /^Chưa xác nhận/);
  assert.equal(node(vm, s, 2).explanation?.kind, 'clarification');
  await s.op({ type: 'resolve_conflict', nodeId: s.row(2).id, action: 'replace' });
  vm = vmOf(s);
  assert.ok(!vm.edges.some((e) => e.relation === 'contradicts'), 'resolved → no contradicts');
  assert.ok(vm.edges.some((e) => e.relation === 'corrects'));

  const r = new Session(F.PROBLEM_REG);
  await r.add('A₁ = π·2² = 4π cm²');
  await r.add('V₁ = 4π·5 = 20π cm³');
  await r.edit(1, 'A₁ = π·2² = 4π cm², từ bước 2');
  vm = vmOf(r);
  assert.ok(vm.edges.some((e) => e.storedKind === 'rejected_reference' && e.status === 'provisional'));
});

test('FR-XE-002: an LLM-suggested dependency is displayed as provisional, never established', async () => {
  const s = new Session(F.PROBLEM_REG);
  await s.add('A₁ = π·2² = 4π cm²');
  await s.add('V₁ = 4π·5 = 20π cm³');
  const ctx = ctxOf(s);
  const g = structuredClone(ctx.graph);
  const n2 = g.nodes[s.row(2).id];
  n2.dependsOn.push({ nodeId: 'g:r2', via: 'llm_suggested', origin: 'premise', depth: 'direct' });
  g.edges.push({ from: 'g:r2', to: n2.id, kind: 'depends_on', provenance: 'llm_interpretation' });
  const vm = buildGraphViewModel({ ...ctx, graph: g });
  const e = vm.edges.find((x) => x.from === 'g:r2' && x.to === n2.id)!;
  assert.equal(e.status, 'provisional');
  assert.match(e.labelShort, /^Chưa xác nhận/);
  assert.ok(!vm.nodes.find((n) => n.nodeId === n2.id)!.sourceNodeIds.includes('g:r2'));
});

test('XG-AC-05: every established edge has a label and an explanation', async () => {
  for (const [p, rows] of [[F.PROBLEM_A, F.ROWS_A], [F.PROBLEM_C, F.ROWS_C], [F.PROBLEM_REG, F.ROWS_REG]] as const) {
    const s = new Session(p);
    for (const r of rows) await s.add(r);
    for (const e of vmOf(s).edges.filter((x) => x.status === 'established')) {
      assert.ok(e.labelShort.length > 0 && e.labelShort.length <= 40, e.edgeId);
      assert.ok(e.explanation.length > 10, e.edgeId);
    }
  }
});

// ------------------------------------------------------------------ statuses, retraction, stale, independent

test('statuses: ambiguous, unverified, question, retracted, stale, insufficient', async () => {
  const s = new Session(F.PROBLEM_REG);
  await s.add('V = 4π·5');
  await s.add('S_xq = 2πrh = 20π');
  await s.add('Đáp án là bao nhiêu ạ?');
  await s.add('A₁ = π·2² = 4π cm²');
  await s.add('V₁ = A₁·5 = 20π cm³');
  let vm = vmOf(s);
  assert.equal(node(vm, s, 1).explanation?.kind, 'clarification');
  assert.equal(node(vm, s, 2).explanation?.kind, 'limit');
  assert.ok(!/sai/.test(node(vm, s, 2).explanation!.explanationShort), 'unverified is never called wrong');
  assert.equal(node(vm, s, 3).explanation?.kind, 'question_note');
  await s.op({ type: 'retract_row', nodeId: s.row(4).id });
  vm = vmOf(s);
  assert.ok(!vm.nodes.some((n) => n.nodeId === s.row(4).id), 'retracted node not drawn');
  assert.match(node(vm, s, 5).explanation!.explanationShort, /đã được rút/);
  vm = vmOf(s, { staleIds: [s.row(5).id] });
  assert.equal(node(vm, s, 5).validationStatus, 'stale');
  assert.equal(node(vm, s, 5).explanation, null);
  assert.equal(node(vm, s, 5).unavailableReason, 'pending_revalidation');
  const b = new Session(F.PROBLEM_REG);
  await b.add('Thể tích gấp 4 lần.');
  assert.equal(node(vmOf(b), b, 1).explanation?.kind, 'support_missing');
  assert.ok(!/khớp đề|đúng/.test(node(vmOf(b), b, 1).explanation!.explanationShort), 'a bare answer is not confirmed by the explanation');
});

test('XG-AC-13 (unit): independent assessment exposes no explanation, status, rule or edge label before submission', async () => {
  const s = new Session(F.PROBLEM_REG);
  await s.op({ type: 'start_independent' });
  await s.add('Em đoán thể tích gấp 2 lần.');
  await s.add('A₁ = π·3² = 9π cm²');
  const gp = graphSpec(s);
  for (const n of gp.nodeViews!.filter((x) => x.row !== null)) {
    assert.equal(n.explanation, null);
    assert.equal(n.unavailableReason, 'independent_hidden');
    assert.equal(n.validationStatus, 'hidden');
    assert.deepEqual([n.relevantRuleIds, n.possibleMisconceptions, n.notation], [[], [], null]);
  }
  assert.ok(gp.edgeViews!.every((e) => e.labelShort === ''));
  await s.op({ type: 'submit_independent' });
  const after = vmOf(s, { spec: s.ctx.independent!.problemSpec, facts: solveProblem(s.ctx.independent!.problemSpec), graph: s.ctx.independent!.graph, submitted: true });
  assert.ok(after.nodes.filter((n) => n.row !== null).every((n) => n.explanation && n.explanation.disclosureLevel === 0), 'after submission: D0 only');
});

// ------------------------------------------------------------------ property tests: coverage, truthfulness, leaks, versions

function allowedNumbers(ctx: SessionContext): Set<string> {
  const out = new Set<string>(['0', '1', '2', '100']);
  const add = (t: string) => (t.match(/\d+(?:[.,]\d+)?/g) ?? []).forEach((x) => out.add(x.replace('.', ',')));
  for (const n of Object.values(ctx.graph.nodes)) {
    add(n.originalText);
    add(n.interpretation.displayText);
    if (n.validation?.claimedValue) add(formatExact(n.validation.claimedValue));
    for (const f of n.validation?.facts ?? []) if (f.disclosable) add(formatExact(f.value));
  }
  for (const g of ctx.problemSpec.givens) add(formatExact(g.value));
  for (const r of ctx.problemSpec.relations) add(r.expr);
  add(ctx.problemSpec.text);
  return out;
}

test('XG-AC-01/02/04/08/14: over random sessions every node is explained, truthful, leak-free and current', async () => {
  let seed = 11;
  const rand = (n: number) => ((seed = (seed * 48271) % 2147483647) % n);
  const pool = [...F.ROWS_C, ...F.EDITS_C, 'V = 4π·5', 'r gấp 2 lần', 'Em đoán thể tích gấp 2 lần.', 'vì chiều cao như nhau', 'xyz', 'Thể tích gấp 4 lần.', 'A₁ = π·3² = 6π cm²', 'Em sẽ tính thể tích hai cốc rồi chia.'];
  for (let run = 0; run < 200; run++) {
    const s = new Session(F.PROBLEM_C);
    for (let step = 0; step < 6; step++) {
      const rows = Object.values(s.graph().nodes).filter((n) => n.source !== 'problem' && n.lifecycle === 'active');
      const c = rand(5);
      const text = pool[rand(pool.length)];
      const op: TurnOp = c <= 1 || !rows.length ? { type: 'add_row', rowText: text } : c === 2 ? { type: 'edit_row', nodeId: rows[rand(rows.length)].id, rowText: text } : c === 3 ? { type: 'retract_row', nodeId: rows[rand(rows.length)].id } : { type: 'request_hint', nodeId: rows[rand(rows.length)].id };
      await s.op(op);
      const gp = graphSpec(s);
      const g = s.graph();
      const forbidden = explanationForbidden(ctxOf(s));
      const allowed = allowedNumbers(s.ctx);
      for (const nv of gp.nodeViews!) {
        assert.equal(nv.graphVersion, g.version, 'XG-AC-08');
        if (nv.row === null) continue;
        const n = g.nodes[nv.nodeId];
        assert.equal(nv.learnerText, n.originalText, 'XG-AC-02 verbatim');
        assert.ok(nv.explanation || nv.unavailableReason, 'XG-AC-01');
        const e = nv.explanation!;
        assert.ok(e.explanationShort.length <= 120, 'NFR-LANG-002');
        assert.equal(e.explanationId, `${n.id}@r${n.revision}@v${g.version}@D${e.disclosureLevel}`, 'XG-AC-14');
        assert.match(e.templateId, /^XT-/);
        for (const t of [e.explanationShort, e.whyStatus, e.prompt ?? '', e.disclosureLevel <= 2 ? e.explanationDetailed ?? '' : '']) {
          assert.equal(findLeak(t, forbidden), null, `XG-AC-04: ${t}`);
          const stripped = t.replace(/bước \d+(?:, \d+)*/giu, '').replace(/D\d/g, '');
          for (const num of stripped.match(/\d+(?:,\d+)?/g) ?? []) assert.ok(allowed.has(num), `XG-AC-02 invented number ${num} in "${t}"`);
        }
      }
      for (const ev of gp.edgeViews!) {
        assert.ok(ev.labelShort.length <= 40, 'all edge labels are bounded');
        assert.equal(findLeak(ev.labelShort + ' ' + ev.explanation, forbidden), null, ev.explanation);
      }
    }
  }
});

test('XG-AC-03: incorrect reasoning is distinguishable from verified statements without colour', async () => {
  const s = new Session(F.PROBLEM_C);
  await s.add(F.EDITS_C[0]);
  await s.add(F.ROWS_C[1]);
  const vm = vmOf(s);
  const [a, b] = [node(vm, s, 1), node(vm, s, 2)];
  assert.notEqual(a.statusBadge.icon, b.statusBadge.icon);
  assert.notEqual(a.statusBadge.label, b.statusBadge.label);
  assert.notEqual(a.epistemic, b.epistemic);
});

test('XG-AC-12 (integration): planning is pure — rebuilding view models never changes the session', async () => {
  const s = new Session(F.PROBLEM_B);
  await s.add(F.ROWS_B.hypothesis);
  const before = structuredClone(s.ctx);
  const a = planForContext(s.ctx, [s.row(1).id]);
  const b = planForContext(s.ctx, [s.row(1).id]);
  assert.deepEqual(a, b);
  assert.deepEqual(s.ctx, before);
});

test('XG-AC-15: building view models for 40 nodes takes < 50 ms', async () => {
  const s = new Session(F.PROBLEM_C);
  for (let i = 0; i < 40; i++) await s.add(F.EDITS_C[i % 5]);
  const ctx = ctxOf(s);
  buildGraphViewModel(ctx);
  const t0 = performance.now();
  buildGraphViewModel(ctx);
  const ms = performance.now() - t0;
  assert.ok(ms < 50, `${ms.toFixed(1)} ms`);
});


test('BL-24: VisualSpec independently rejects leaked explanations and forged current revisions', async () => {
  const s = new Session(F.PROBLEM_B);
  await s.add(F.ROWS_B.hypothesis);
  const original = s.last.visualSpecs.find(v => v.renderer === 'reasoning_graph')!;
  const evidence = ctxOf(s);
  assert.equal(validateVisualSpec(original, evidence).ok, true);
  const leaked = structuredClone(original);
  const gp = leaked.params as GraphParams;
  const nv = gp.nodeViews!.find(n => n.row === 1)!;
  nv.explanation!.explanationShort = 'Thể tích gấp 9 lần.';
  assert.deepEqual(validateVisualSpec(leaked, evidence), { ok: false, error: 'explanation_leak' });
  const forged = structuredClone(original);
  const changed = (forged.params as GraphParams).nodeViews!.find(n => n.row === 1)!;
  changed.nodeRevision += 1;
  changed.explanation!.nodeRevision = changed.nodeRevision;
  changed.explanation!.explanationId = `${changed.nodeId}@r${changed.nodeRevision}@v${forged.graphVersion}@D0`;
  assert.deepEqual(validateVisualSpec(forged, evidence), { ok: false, error: `stale_revision:${changed.nodeId}` });
});


test('XG-AC-04: Case C root and unsupported conclusion remain leak-free at each level D0–D4', async () => {
  for (const row of [1, 5]) {
    const s = new Session(F.PROBLEM_C);
    for (const text of F.ROWS_C) await s.add(text);
    const id = s.row(row).id;
    for (let level = 0; level <= 4; level++) {
      if (level) await s.op({ type: 'request_hint', nodeId: id });
      const vm = vmOf(s);
      assert.equal(node(vm, s, row).explanation!.disclosureLevel, level);
      for (const text of viewModelTexts(vm)) assert.equal(findLeak(text, explanationForbidden(ctxOf(s))), null, text);
      assert.equal(s.row(row).originalText, F.ROWS_C[row - 1]);
    }
  }
});
