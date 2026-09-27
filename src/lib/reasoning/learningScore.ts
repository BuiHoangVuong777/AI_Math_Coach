/**
 * Evidence-based Learning Score and badges (PRODUCT_SPEC §24.4–24.5).
 *
 * Pure, deterministic and auditable: every point comes from `SessionEvidence` /
 * `FinalAssessment` (verified graph state + event log), never from Tutor/LLM text or
 * a client-supplied score. Weights are an initial product HYPOTHESIS (rubric LS-1),
 * not a validated measure of learning. Score = this session only.
 *
 * Anti-farming by construction: every part is a threshold on the existence of one
 * qualifying piece of evidence — row counts, repeated edits, hints, slider moves and
 * duplicated events never add points.
 */
import type { EvidenceRef, FinalAssessment, SessionEvidence } from './sessionEvidence.ts';

export const RUBRIC_VERSION = 'LS-1';

export type CriterionId = 'problem_understanding' | 'evidence_reasoning' | 'verification' | 'independent_transfer' | 'own_explanation';

/** Maximum points per criterion (sum 100) and per part. */
export const RUBRIC = {
  problem_understanding: { max: 15, parts: { confirmation: 5, data_use: 10 } },
  evidence_reasoning: { max: 30, parts: { supported_answer: 10, reasoning_chain: 20 } },
  verification: { max: 20, parts: { check_or_correction: 20 } },
  independent_transfer: { max: 25, parts: { answer: 10, reasoning: 15 } },
  own_explanation: { max: 10, parts: { justification: 10 } },
} as const;

export type CriterionStatus = 'full' | 'partial' | 'none' | 'incomplete';

export interface ScoreEvidence extends EvidenceRef {
  kind: string;
  note: string;
}

export interface ScorePart {
  id: string;
  label: string;
  max: number;
  points: number;
  /** Exact rule that produced the points (auditable). */
  rule: string;
}

export interface ScoreCriterion {
  id: CriterionId;
  label: string;
  max: number;
  points: number;
  status: CriterionStatus;
  parts: ScorePart[];
  /** Child-friendly Vietnamese: why points were awarded or withheld. */
  explanation: string;
  /** e.g. "5 + 10 = 15/15". */
  calculation: string;
  evidence: ScoreEvidence[];
  /** What would count as evidence, stated neutrally (never a judgement). */
  missingEvidence: string[];
}

export interface LearningScore {
  rubricVersion: typeof RUBRIC_VERSION;
  total: number;
  max: 100;
  criteria: ScoreCriterion[];
  complete: boolean;
  incompleteCriteria: CriterionId[];
  disclaimer: string;
}

export type BadgeId = 'data_detective' | 'little_scientist' | 'explainer' | 'independent_explorer';

export interface Badge {
  id: BadgeId;
  name: string;
  icon: string;
  reason: string;
  evidence: ScoreEvidence[];
}

export const SCORE_DISCLAIMER =
  'Điểm này chỉ tính cho phiên học hôm nay, dựa trên các bước em đã viết và đã được kiểm tra. Đây không phải điểm đánh giá trí thông minh hay năng lực lâu dài.';

export const BADGE_INFO: Record<BadgeId, { name: string; icon: string; rule: string }> = {
  data_detective: { name: 'Thám tử dữ kiện', icon: '🔎', rule: 'Dùng đúng dữ kiện quan trọng của đề (quan hệ, điều kiện giữ nguyên, đường kính) trong một bước đã khớp, hoặc tự sửa một bước từng đọc nhầm dữ kiện.' },
  little_scientist: { name: 'Nhà khoa học nhỏ', icon: '🧪', rule: 'Ghi một dự đoán rồi tự kiểm tra nó: bằng một dòng quan sát khớp trên mô hình, hoặc bằng một bước suy luận khớp sau đó cho cùng đại lượng.' },
  explainer: { name: 'Người giải thích', icon: '💬', rule: 'Nêu lý do toán học cụ thể (điều kiện, quan hệ hoặc quy tắc) trong một bước đã khớp.' },
  independent_explorer: { name: 'Tự mình khám phá', icon: '🧭', rule: 'Bài tự kiểm tra: đáp án khớp, có bước dẫn tới, và lập luận đủ bằng chứng.' },
};

// ------------------------------------------------------------------ helpers

const ref = (e: SessionEvidence, kind: string, nodeIds: string[], eventSeqs: number[], note: string, graph: 'main' | 'independent' = 'main'): ScoreEvidence => ({
  graph, kind, nodeIds, rows: graph === 'main' ? nodeIds.map((id) => e.rowOf[id]).filter((r) => typeof r === 'number') : [], eventSeqs, note,
});
const rowsText = (rows: number[]) => [...new Set(rows)].filter((r) => r > 0).sort((a, b) => a - b).map((r) => `bước ${r}`).join(', ');
const status = (points: number, max: number, incomplete = false): CriterionStatus => (incomplete ? 'incomplete' : points >= max ? 'full' : points > 0 ? 'partial' : 'none');
const calc = (parts: ScorePart[], max: number) => `${parts.map((p) => p.points).join(' + ')} = ${parts.reduce((s, p) => s + p.points, 0)}/${max}`;

function criterion(id: CriterionId, label: string, parts: ScorePart[], explanation: string, evidence: ScoreEvidence[], missing: string[], incomplete = false): ScoreCriterion {
  const max = RUBRIC[id].max;
  const points = parts.reduce((s, p) => s + p.points, 0);
  return { id, label, max, points, status: status(points, max, incomplete), parts, explanation, calculation: calc(parts, max), evidence, missingEvidence: missing };
}

// ------------------------------------------------------------------ criteria

function problemUnderstanding(e: SessionEvidence): ScoreCriterion {
  const P = RUBRIC.problem_understanding.parts;
  const confirmed = !!e.confirmation;
  const uncorrectedMisread = e.mistakes.filter((m) => m.dataMisreading && !m.correction && !m.retracted);
  const importantOk = !e.dataUse.importantDataPresent || e.dataUse.importantNodeIds.length > 0;
  const dataPts = e.dataUse.nodeIds.length === 0 ? 0 : importantOk && uncorrectedMisread.length === 0 ? P.data_use : P.data_use / 2;
  const parts: ScorePart[] = [
    { id: 'confirmation', label: 'Tự xác nhận cách hiểu đề', max: P.confirmation, points: confirmed ? P.confirmation : 0, rule: 'Có sự kiện problem_confirmed (em đã xác nhận 4 nhóm Dữ kiện/Ẩn số/Điều kiện/Cần tìm).' },
    {
      id: 'data_use', label: 'Dùng đúng dữ kiện của đề', max: P.data_use, points: dataPts,
      rule: 'Đủ điểm: có ≥ 1 bước khớp dùng dữ kiện của đề; nếu đề có quan hệ, điều kiện giữ nguyên hoặc đường kính thì có ≥ 1 bước khớp dùng chúng; và không còn bước đọc nhầm dữ kiện chưa sửa. Một nửa: có dùng dữ kiện nhưng thiếu một trong hai điều sau. 0: chưa có bước khớp nào dùng dữ kiện.',
    },
  ];
  const evidence: ScoreEvidence[] = [];
  if (e.confirmation) evidence.push(ref(e, 'problem_confirmed', [], [e.confirmation.seq], 'Em đã xác nhận cách hệ thống hiểu đề.'));
  if (e.dataUse.nodeIds.length) evidence.push(ref(e, 'data_use', e.dataUse.nodeIds, [], 'Các bước khớp có dùng dữ kiện của đề.'));
  if (e.dataUse.importantNodeIds.length) evidence.push(ref(e, 'important_data', e.dataUse.importantNodeIds, [], 'Các bước khớp dùng quan hệ, điều kiện hoặc đường kính của đề.'));
  const missing: string[] = [];
  let explanation: string;
  if (dataPts === P.data_use) explanation = `Em đã xác nhận đề và dùng đúng dữ kiện của đề ở ${rowsText(e.dataUse.nodeIds.map((id) => e.rowOf[id]))}.`;
  else if (dataPts > 0) {
    if (uncorrectedMisread.length) missing.push(`Bước ${uncorrectedMisread.map((m) => m.row).join(', ')} có dữ kiện chưa khớp với đề và chưa được sửa.`);
    if (!importantOk) missing.push('Chưa có bước khớp nào dùng quan hệ hoặc điều kiện quan trọng của đề (ví dụ đại lượng được giữ nguyên).');
    explanation = 'Em đã dùng dữ kiện của đề, nhưng còn một điểm về dữ kiện chưa được làm rõ — nên em nhận một nửa số điểm phần này.';
  } else {
    missing.push('Chưa có bước nào đã khớp mà dùng dữ kiện của đề.');
    explanation = confirmed ? 'Em đã xác nhận đề. Phần dùng dữ kiện chưa có bằng chứng vì chưa có bước khớp nào dùng dữ kiện của đề.' : 'Chưa có bằng chứng.';
  }
  return criterion('problem_understanding', 'Hiểu đề', parts, explanation, evidence, missing, !confirmed);
}

function evidenceReasoning(e: SessionEvidence): ScoreCriterion {
  const P = RUBRIC.evidence_reasoning.parts;
  const c = e.conclusion;
  const answerPts = c.answer === 'correct' && c.answerStatus === 'valid' ? P.supported_answer : c.answer === 'correct' && c.inferenceFollows && !c.bare ? P.supported_answer / 2 : 0;
  const chainPts = c.reasoning === 'sufficient' ? P.reasoning_chain : c.reasoning === 'partial' ? P.reasoning_chain / 2 : 0;
  const parts: ScorePart[] = [
    { id: 'supported_answer', label: 'Kết luận có cơ sở cho điều đề hỏi', max: P.supported_answer, points: answerPts, rule: 'Đủ điểm: kết luận khớp kết quả kiểm chứng và bước kết luận “Khớp”. Một nửa: kết luận khớp và suy ra được từ các bước trước nhưng một bước trước chưa khớp. 0: kết luận chưa khớp, chưa có, hoặc chỉ là đáp án không có bước dẫn tới (đoán).' },
    { id: 'reasoning_chain', label: 'Chuỗi suy luận từ dữ kiện tới kết luận', max: P.reasoning_chain, points: chainPts, rule: 'Theo cùng quy tắc chấm lập luận của bài độc lập (§7.8): đủ bằng chứng = mọi bước trên đường tới kết luận đều khớp và (bài tỉ số) có nêu điều kiện; một phần = có bước cần làm rõ/chưa kiểm tra được hoặc thiếu điều kiện; 0 = có bước chưa khớp hoặc không có đường dẫn.' },
  ];
  const evidence: ScoreEvidence[] = c.answerNodeId ? [ref(e, 'conclusion', [c.answerNodeId], [], 'Bước kết luận cho điều đề hỏi.'), ref(e, 'reasoning_path', c.pathNodeIds, [], 'Các bước của em dẫn tới kết luận.')] : [];
  const missing: string[] = [];
  let explanation: string;
  if (!c.answerNodeId) {
    missing.push('Chưa có bước kết luận cho điều đề hỏi.');
    explanation = 'Chưa có bằng chứng: em chưa viết bước kết luận cho điều đề hỏi.';
  } else if (answerPts + chainPts === RUBRIC.evidence_reasoning.max) {
    explanation = `Kết luận ở bước ${c.answerRow} khớp và mọi bước dẫn tới nó đều đã được kiểm tra là khớp.`;
  } else if (c.bare && c.answer === 'correct') {
    missing.push(`Bước ${c.answerRow} nêu đáp án nhưng chưa có bước nào dẫn tới.`);
    explanation = `Đáp án ở bước ${c.answerRow} khớp, nhưng chưa có các bước dẫn tới nên chưa tính là suy luận có cơ sở. Em thử viết các bước để chứng minh nhé.`;
  } else if (c.reasoning === 'contains_invalid') {
    missing.push('Trên đường tới kết luận còn bước chưa khớp.');
    explanation = `Kết luận ở bước ${c.answerRow} dựa trên một bước còn chưa khớp. Khi em sửa bước đó, điểm phần này được tính lại.`;
  } else if (c.reasoning === 'partial') {
    missing.push('Trên đường tới kết luận có bước chưa rõ hoặc chưa nêu điều kiện của đề.');
    explanation = 'Em đã có kết luận và phần lớn các bước, nhưng còn bước chưa rõ hoặc chưa nêu điều kiện — nên nhận một phần điểm.';
  } else if (c.answer === 'incorrect') {
    missing.push(`Kết luận ở bước ${c.answerRow} chưa khớp với kết quả kiểm chứng.`);
    explanation = `Kết luận ở bước ${c.answerRow} chưa khớp. Sai là một phần của việc học — em có thể xem lại bước đó.`;
  } else {
    missing.push('Kết luận chưa đọc được rõ ràng.');
    explanation = 'Hệ thống chưa đọc chắc chắn được kết luận, nên không tự tính là đúng.';
  }
  return criterion('evidence_reasoning', 'Suy luận có bằng chứng', parts, explanation, evidence, missing, !c.answerNodeId && e.endedEarly);
}

function verification(e: SessionEvidence): ScoreCriterion {
  const P = RUBRIC.verification.parts;
  const corrected = e.mistakes.filter((m) => m.correction);
  const attempted = e.mistakes.filter((m) => m.attemptedEdit);
  const routes = corrected.length + e.crossChecks.length + e.testedPredictions.length;
  const points = routes > 0 ? P.check_or_correction : attempted.length ? P.check_or_correction / 2 : 0;
  const parts: ScorePart[] = [{
    id: 'check_or_correction', label: 'Tự kiểm tra hoặc tự sửa', max: P.check_or_correction, points,
    rule: 'Đủ điểm khi có ÍT NHẤT MỘT trong ba con đường tương đương: (a) tự sửa một lỗi thật của chính em (sửa dòng hoặc tự đánh dấu “đã sửa bởi”) và bước sửa nay khớp; (b) kiểm tra lại điều đề hỏi bằng một cách khác độc lập, cả hai đều khớp; (c) ghi dự đoán rồi kiểm tra bằng quan sát khớp trên mô hình hoặc bằng bước suy luận khớp. Một nửa: đã sửa lại một lỗi thật nhưng chưa khớp. Không cần mắc lỗi hay dùng thanh trượt để đạt đủ điểm; làm nhiều lần không cộng thêm.',
  }];
  const evidence: ScoreEvidence[] = [
    ...corrected.map((m) => ref(e, 'self_correction', [m.nodeId, m.correction!.byNodeId], [m.seq, ...m.correction!.eventSeqs], `Bước ${m.row} từng chưa khớp; em đã tự ${m.correction!.kind === 'learner_edit' ? 'sửa lại' : `sửa ở bước ${e.rowOf[m.correction!.byNodeId]}`}.`)),
    ...e.crossChecks.map((x) => ref(e, 'cross_check', [...x.nodeIds], [], `Bước ${x.rows[0]} và bước ${x.rows[1]} tới cùng kết quả bằng hai cách độc lập.`)),
    ...e.testedPredictions.map((t) => ref(e, 'tested_prediction', [t.hypothesisNodeId, t.testNodeId], t.eventSeqs, `Dự đoán ở bước ${t.hypothesisRow} được em kiểm tra ở bước ${t.testRow}${t.via === 'experiment_observation' ? ' trên mô hình' : ''}.`)),
    ...attempted.map((m) => ref(e, 'attempted_correction', [m.nodeId], [m.seq], `Em đã sửa lại bước ${m.row}, bước này chưa khớp.`)),
  ];
  const missing: string[] = [];
  let explanation: string;
  if (routes > 0) {
    const how = [corrected.length ? 'tự sửa lỗi của mình' : '', e.crossChecks.length ? 'kiểm tra lại bằng một cách khác' : '', e.testedPredictions.length ? 'kiểm tra dự đoán của mình' : ''].filter(Boolean);
    explanation = `Em đã ${how.join(' và ')} — đó là cách kiểm chứng của người làm toán.`;
  } else if (attempted.length) {
    missing.push(`Bước ${attempted.map((m) => m.row).join(', ')} đã được sửa lại nhưng chưa khớp.`);
    explanation = 'Em đã quay lại sửa bước chưa khớp — rất tốt. Bước đó chưa khớp nên em nhận một nửa số điểm phần này.';
  } else {
    missing.push('Chưa có lần tự kiểm tra: kiểm tra lại kết quả bằng một cách khác, hoặc ghi dự đoán rồi kiểm tra nó.');
    if (e.support.experiments.runs && !e.observations.some((o) => o.valid)) missing.push('Thử nghiệm đã chạy nhưng chưa có dòng quan sát được kiểm tra là khớp (chỉ kéo thanh trượt thì chưa tính).');
    const open = e.mistakes.filter((m) => !m.correction && !m.retracted);
    if (open.length) missing.push(`Bước ${open.map((m) => m.row).join(', ')} chưa khớp và chưa được sửa.`);
    explanation = 'Chưa có bằng chứng tự kiểm tra hay tự sửa trong phiên này. Em không cần mắc lỗi để có điểm: kiểm tra lại kết quả bằng một cách khác cũng được tính đủ.';
  }
  return criterion('verification', 'Kiểm chứng và tự sửa', parts, explanation, evidence, missing);
}

function independentTransfer(e: SessionEvidence, a: FinalAssessment): ScoreCriterion {
  const P = RUBRIC.independent_transfer.parts;
  const ev = a.evaluation;
  const answerPts = ev && ev.answer === 'correct' && !a.answerBare ? P.answer : 0;
  const reasoningPts = ev?.reasoning === 'sufficient' ? P.reasoning : ev?.reasoning === 'partial' ? Math.floor(P.reasoning / 2) : 0;
  const parts: ScorePart[] = [
    { id: 'answer', label: 'Đáp án bài tự kiểm tra', max: P.answer, points: answerPts, rule: 'Đủ điểm: đáp án khớp kết quả kiểm chứng và có bước dẫn tới (không phải đáp án trần). 0: chưa khớp, chưa có, chưa đọc được hoặc đáp án trần.' },
    { id: 'reasoning', label: 'Lập luận bài tự kiểm tra', max: P.reasoning, points: reasoningPts, rule: 'Đủ bằng chứng = 15; một phần = 7; có bước chưa khớp hoặc chưa đủ bằng chứng = 0. Chỉ dựa trên bài độc lập, không dùng kết quả bài chính.' },
  ];
  const evidence: ScoreEvidence[] = a.eventSeqs.length ? [{ graph: 'independent', kind: 'independent_assessment', nodeIds: ev?.answerNodeId ? [ev.answerNodeId] : [], rows: a.answerRow ? [a.answerRow] : [], eventSeqs: a.eventSeqs, note: 'Bài tương tự em tự làm, không có gợi ý.' }] : [];
  const missing: string[] = [];
  let explanation: string;
  const incomplete = a.status !== 'evaluated';
  if (a.status === 'not_started') {
    missing.push('Em chưa làm bài tự kiểm tra.');
    explanation = 'Chưa có bằng chứng: phiên kết thúc trước khi em làm bài tự kiểm tra, nên phần này chưa được tính.';
  } else if (a.status === 'in_progress') {
    missing.push('Bài tự kiểm tra chưa được nộp.');
    explanation = 'Chưa có bằng chứng: bài tự kiểm tra chưa được nộp.';
  } else if (a.status === 'not_evaluated') {
    missing.push('Bài đã nộp nhưng chưa đánh giá được.');
    explanation = 'Bài đã nộp nhưng hệ thống chưa đánh giá được — không tự tính là đúng hay sai.';
  } else if (answerPts + reasoningPts === RUBRIC.independent_transfer.max) {
    explanation = 'Ở bài tự kiểm tra, em tự làm đúng và lập luận đủ bằng chứng — không có gợi ý nào.';
  } else {
    if (ev?.answer === 'correct' && a.answerBare) missing.push('Đáp án khớp nhưng chưa có bước dẫn tới.');
    else if (ev?.answer !== 'correct') missing.push(ev?.answer === 'missing' ? 'Chưa có dòng kết luận.' : ev?.answer === 'unreadable' ? 'Chưa đọc được kết luận.' : 'Đáp án chưa khớp.');
    if (ev?.reasoning !== 'sufficient') missing.push(ev?.reasoning === 'partial' ? 'Lập luận còn thiếu một phần (ví dụ chưa nêu điều kiện).' : 'Lập luận chưa đủ bằng chứng.');
    explanation = `Bài tự kiểm tra được chấm riêng: ${missing.join(' ').toLowerCase()} Đây là thông tin để em luyện tiếp, không phải nhận xét về khả năng của em.`;
  }
  return criterion('independent_transfer', 'Tự làm bài tương tự', parts, explanation, evidence, missing, incomplete);
}

function ownExplanation(e: SessionEvidence): ScoreCriterion {
  const P = RUBRIC.own_explanation.parts;
  const s = e.justifications.supported;
  const t = e.justifications.attempted;
  const points = s.length ? P.justification : t.length ? P.justification / 2 : 0;
  const parts: ScorePart[] = [{
    id: 'justification', label: 'Giải thích bằng lời của em', max: P.justification, points,
    rule: 'Đủ điểm: có ≥ 1 bước khớp nêu lý do cụ thể bằng lời của em (điều kiện giữ nguyên, quan hệ trong đề hoặc quy tắc). Một nửa: có viết lý do nhưng lý do còn chung chung hoặc bước đó chưa khớp. Viết nhiều lý do không cộng thêm.',
  }];
  const evidence: ScoreEvidence[] = [
    ...(s.length ? [ref(e, 'supported_justification', s, [], 'Bước có lý do cụ thể và đã khớp.')] : []),
    ...(t.length ? [ref(e, 'attempted_justification', t, [], 'Bước có lý do nhưng lý do chưa cụ thể hoặc bước chưa khớp.')] : []),
  ];
  const missing: string[] = [];
  let explanation: string;
  if (s.length) explanation = `Em đã tự giải thích lý do ở ${rowsText(s.map((id) => e.rowOf[id]))}.`;
  else if (t.length) {
    missing.push('Lý do cần nêu rõ điều kiện hoặc quan hệ cụ thể (ví dụ “vì chiều cao giữ nguyên”).');
    explanation = 'Em đã thử giải thích — lý do còn chung chung hoặc bước đó chưa khớp, nên em nhận một nửa số điểm phần này.';
  } else {
    missing.push('Chưa có bước nào nêu lý do bằng lời của em (ví dụ “… vì …”).');
    explanation = 'Chưa có bằng chứng: em chưa viết lý do cho bước nào.';
  }
  return criterion('own_explanation', 'Giải thích bằng lời của em', parts, explanation, evidence, missing);
}

// ------------------------------------------------------------------ public API

export function calculateLearningScore(evidence: SessionEvidence, finalAssessment: FinalAssessment): LearningScore {
  const criteria = [
    problemUnderstanding(evidence),
    evidenceReasoning(evidence),
    verification(evidence),
    independentTransfer(evidence, finalAssessment),
    ownExplanation(evidence),
  ];
  const incomplete = criteria.filter((c) => c.status === 'incomplete').map((c) => c.id);
  return {
    rubricVersion: RUBRIC_VERSION,
    total: criteria.reduce((s, c) => s + c.points, 0),
    max: 100,
    criteria,
    complete: incomplete.length === 0,
    incompleteCriteria: incomplete,
    disclaimer: SCORE_DISCLAIMER,
  };
}

export function awardBadges(evidence: SessionEvidence, finalAssessment: FinalAssessment): Badge[] {
  const e = evidence;
  const badges: Badge[] = [];
  const add = (id: BadgeId, reason: string, ev: ScoreEvidence[]) => {
    if (!badges.some((b) => b.id === id)) badges.push({ id, name: BADGE_INFO[id].name, icon: BADGE_INFO[id].icon, reason, evidence: ev });
  };
  const fixedMisread = e.mistakes.find((m) => m.dataMisreading && m.correction);
  if (fixedMisread) add('data_detective', `Em đã tự phát hiện và sửa dữ kiện ở bước ${fixedMisread.row}.`, [ref(e, 'self_correction', [fixedMisread.nodeId, fixedMisread.correction!.byNodeId], [fixedMisread.seq, ...fixedMisread.correction!.eventSeqs], 'Dữ kiện được em sửa.')]);
  else if (e.dataUse.importantDataPresent && e.dataUse.importantNodeIds.length) add('data_detective', `Em đã dùng đúng dữ kiện quan trọng của đề ở ${rowsText(e.dataUse.importantNodeIds.map((id) => e.rowOf[id]))}.`, [ref(e, 'important_data', e.dataUse.importantNodeIds, [], 'Bước khớp dùng quan hệ/điều kiện/đường kính của đề.')]);
  const tested = e.testedPredictions[0];
  if (tested) add('little_scientist', `Em đã ghi dự đoán ở bước ${tested.hypothesisRow} và tự kiểm tra nó ở bước ${tested.testRow}${tested.via === 'experiment_observation' ? ' trên mô hình' : ''}.`, [ref(e, 'tested_prediction', [tested.hypothesisNodeId, tested.testNodeId], tested.eventSeqs, 'Dự đoán và bước kiểm tra.')]);
  if (e.justifications.supported.length) add('explainer', `Em đã nêu lý do toán học cụ thể ở ${rowsText(e.justifications.supported.map((id) => e.rowOf[id]))}.`, [ref(e, 'supported_justification', e.justifications.supported, [], 'Bước có lý do cụ thể và đã khớp.')]);
  const ev = finalAssessment.evaluation;
  if (finalAssessment.status === 'evaluated' && ev?.answer === 'correct' && !finalAssessment.answerBare && ev.reasoning === 'sufficient') {
    add('independent_explorer', 'Em đã tự làm bài tương tự, không gợi ý, với đáp án khớp và lập luận đủ bằng chứng.', [{ graph: 'independent', kind: 'independent_assessment', nodeIds: ev.answerNodeId ? [ev.answerNodeId] : [], rows: finalAssessment.answerRow ? [finalAssessment.answerRow] : [], eventSeqs: finalAssessment.eventSeqs, note: 'Bài tự kiểm tra.' }]);
  }
  return badges;
}
