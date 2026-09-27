/**
 * Mission-based learning (PRODUCT_SPEC §24.3). Milestones are OBSERVATIONS of what the
 * learner has done, derived from `SessionEvidence` — never a mandatory solution order
 * (P-05, F1–F8 stay learner-led). Mission texts never name the rule or a value that
 * the disclosure policy (§9.7) still hides.
 */
import type { Family } from './analog.ts';
import type { FinalAssessment, SessionEvidence } from './sessionEvidence.ts';

export type MilestoneId = 'understand' | 'predict_or_plan' | 'reason' | 'independent';
export type MilestoneState = 'achieved' | 'in_progress' | 'not_yet';

export interface Milestone {
  id: MilestoneId;
  label: string;
  optional: boolean;
  state: MilestoneState;
  detail: string;
  rows: number[];
}

export interface MissionProgress {
  title: string;
  subtitle: string;
  objective: string;
  milestones: Milestone[];
  /** Required milestones (understand, reason, independent) achieved. */
  complete: boolean;
  /** Some verification route (self-correction, cross-check, tested prediction) exists. */
  verified: boolean;
  nextAction: { kind: 'fix_row' | 'clarify_row' | 'write_step' | 'explain' | 'verify_optional' | 'self_check' | 'submit_self_check' | 'next_challenge' | 'done'; text: string; row: number | null };
}

export const MISSION_TITLE = 'Bí mật của hình trụ';

const MISSION_BY_FAMILY: Record<Family, { subtitle: string; objective: string }> = {
  radius_change: { subtitle: 'Khi bán kính thay đổi, thể tích thay đổi thế nào?', objective: 'Tự tìm ra và giải thích được thể tích thay đổi thế nào khi bán kính đáy thay đổi, bằng các bước suy luận của riêng em.' },
  diameter_change: { subtitle: 'Đường kính thay đổi — thể tích thay đổi ra sao?', objective: 'Đọc đúng dữ kiện về đường kính, rồi tự tìm ra và giải thích sự thay đổi của thể tích.' },
  height_change_down: { subtitle: 'Khi chiều cao thay đổi, thể tích thay đổi thế nào?', objective: 'Tự tìm ra và giải thích được thể tích thay đổi thế nào khi chiều cao thay đổi, bằng các bước suy luận của riêng em.' },
  height_change_up: { subtitle: 'Khi chiều cao thay đổi, thể tích thay đổi thế nào?', objective: 'Tự tìm ra và giải thích được thể tích thay đổi thế nào khi chiều cao thay đổi, bằng các bước suy luận của riêng em.' },
  both_change: { subtitle: 'Khi cả bán kính và chiều cao cùng thay đổi', objective: 'Tự tìm ra và giải thích được thể tích thay đổi thế nào khi hai kích thước cùng thay đổi.' },
  compute_V: { subtitle: 'Từ kích thước tới thể tích', objective: 'Tự tính và giải thích được thể tích của hình trụ từ các dữ kiện của đề.' },
  compute_A: { subtitle: 'Diện tích mặt đáy', objective: 'Tự tính và giải thích được diện tích đáy của hình trụ từ các dữ kiện của đề.' },
  inverse_h: { subtitle: 'Đi ngược từ thể tích', objective: 'Từ thể tích và một kích thước, tự tìm ra kích thước còn lại và giải thích cách làm.' },
  inverse_r: { subtitle: 'Đi ngược từ thể tích', objective: 'Từ thể tích và một kích thước, tự tìm ra kích thước còn lại và giải thích cách làm.' },
};

export function missionFor(family: Family): { title: string; subtitle: string; objective: string } {
  return { title: MISSION_TITLE, ...MISSION_BY_FAMILY[family] };
}

export function deriveMissionProgress(evidence: SessionEvidence, finalAssessment: FinalAssessment | null = null): MissionProgress {
  const e = evidence;
  const m = missionFor(e.family);
  const c = e.conclusion;
  const verified = e.mistakes.some((x) => x.correction) || e.crossChecks.length > 0 || e.testedPredictions.length > 0;
  const reasonDone = c.answer === 'correct' && c.answerStatus === 'valid' && c.reasoning === 'sufficient';
  const a = finalAssessment;
  const independentDone = a?.status === 'evaluated' || a?.status === 'not_evaluated';
  const inIndependent = e.phase === 'independent' || a?.status === 'in_progress';

  const milestones: Milestone[] = [
    { id: 'understand', label: 'Hiểu và xác nhận đề', optional: false, state: e.confirmation ? 'achieved' : 'in_progress', detail: e.confirmation ? 'Em đã xác nhận dữ kiện, ẩn số và điều kiện.' : 'Xác nhận cách hệ thống hiểu đề.', rows: [] },
    {
      id: 'predict_or_plan', label: 'Dự đoán hoặc nêu hướng giải', optional: true,
      state: e.predictions.length || e.strategies.length ? 'achieved' : 'not_yet',
      detail: e.predictions.length ? `Em đã ghi dự đoán ở bước ${e.predictions[0].row}${e.testedPredictions.length ? ' và đã kiểm tra nó' : ''}.` : e.strategies.length ? `Em đã nêu hướng giải ở bước ${e.strategies[0].row}.` : 'Tùy chọn: ghi một dự đoán (“Em đoán …”) hoặc kế hoạch (“Em sẽ …”).',
      rows: [...e.predictions.map((p) => p.row), ...e.strategies.map((s) => s.row)],
    },
    {
      id: 'reason', label: 'Suy luận có cơ sở tới điều đề hỏi', optional: false,
      state: reasonDone ? 'achieved' : e.activeRows > 0 ? 'in_progress' : 'not_yet',
      detail: reasonDone ? `Kết luận ở bước ${c.answerRow} khớp, có cơ sở${verified ? ' và em đã tự kiểm tra lại' : ''}.` : e.activeRows > 0 ? 'Đang xây dựng các bước suy luận.' : 'Viết từng bước suy luận của em.',
      rows: reasonDone && c.answerRow ? [c.answerRow] : [],
    },
    {
      id: 'independent', label: 'Tự giải bài tương tự', optional: false,
      state: independentDone ? 'achieved' : inIndependent ? 'in_progress' : 'not_yet',
      detail: independentDone ? 'Em đã nộp bài tương tự tự làm.' : inIndependent ? 'Đang làm bài tương tự — không có gợi ý.' : 'Bấm “Tự kiểm tra” khi em sẵn sàng (em chọn thời điểm).',
      rows: [],
    },
  ];

  // A prediction the learner already tested is not "open" work.
  const tested = new Set(e.testedPredictions.map((t) => t.hypothesisNodeId));
  const openMistakes = e.mistakes.filter((x) => !x.correction && !x.retracted && !tested.has(x.nodeId));
  const open = openMistakes.find((x) => !x.attemptedEdit) ?? openMistakes[0];
  let nextAction: MissionProgress['nextAction'];
  if (independentDone || e.phase === 'summary') nextAction = { kind: 'next_challenge', text: 'Xem bài luyện tiếp theo gợi ý cho em (tùy chọn).', row: null };
  else if (inIndependent) nextAction = { kind: 'submit_self_check', text: 'Viết lời giải bài tương tự rồi bấm “Nộp bài”.', row: null };
  else if (open) nextAction = { kind: 'fix_row', text: `Xem lại bước ${open.row}: em có thể sửa dòng, bấm “Điều tra” hoặc xin gợi ý.`, row: open.row };
  else if (c.answerStatus === 'ambiguous' || c.answer === 'unreadable') nextAction = { kind: 'clarify_row', text: c.answerRow ? `Làm rõ bước ${c.answerRow} để hệ thống đọc đúng ý em.` : 'Làm rõ dòng kết luận để hệ thống đọc đúng ý em.', row: c.answerRow };
  else if (!reasonDone && c.answer === 'correct' && c.reasoning === 'partial') nextAction = { kind: 'explain', text: 'Thử nêu rõ lý do hoặc điều kiện của đề dẫn tới kết luận của em.', row: c.answerRow };
  else if (!reasonDone) nextAction = { kind: 'write_step', text: 'Viết bước tiếp theo hướng tới điều đề hỏi.', row: null };
  else if (!verified) nextAction = { kind: 'verify_optional', text: 'Tùy chọn: kiểm tra lại kết quả bằng một cách khác hoặc thử trên mô hình — rồi bấm “Tự kiểm tra”.', row: null };
  else nextAction = { kind: 'self_check', text: 'Em đã sẵn sàng: bấm “Tự kiểm tra” để tự giải một bài tương tự.', row: null };

  return { ...m, milestones, complete: !!e.confirmation && reasonDone && independentDone, verified, nextAction };
}
