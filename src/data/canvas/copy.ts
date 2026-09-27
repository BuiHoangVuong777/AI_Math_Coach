/** Vietnamese copy for the Math Reasoning Canvas (learning content, like data/lessons). */
import type { Epistemic, ValidationStatus } from '@/lib/reasoning/types';
import { PROBLEM_A, PROBLEM_B, PROBLEM_C, PROBLEM_REG } from '@/lib/reasoning/fixtures';

export const STATUS_UI: Record<ValidationStatus | 'stale' | 'question', { icon: string; label: string; cls: string }> = {
  valid: { icon: '✓', label: 'Khớp', cls: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200' },
  invalid: { icon: '✗', label: 'Chưa khớp', cls: 'border-rose-400/60 bg-rose-500/10 text-rose-200' },
  ambiguous: { icon: '?', label: 'Cần làm rõ', cls: 'border-amber-400/60 bg-amber-500/10 text-amber-200' },
  unverified: { icon: '–', label: 'Chưa kiểm tra được', cls: 'border-slate-400/40 bg-slate-500/10 text-slate-300' },
  insufficient_evidence: { icon: '…', label: 'Thiếu cơ sở', cls: 'border-sky-400/50 bg-sky-500/10 text-sky-200' },
  stale: { icon: '⟳', label: 'Đang kiểm tra lại', cls: 'border-slate-400/40 bg-slate-500/10 text-slate-300' },
  question: { icon: '💬', label: 'Câu hỏi', cls: 'border-indigo-400/50 bg-indigo-500/10 text-indigo-200' },
};

export const EPISTEMIC_UI: Record<Epistemic, { icon: string; word: string; color: string; dash: string | null }> = {
  problem_given: { icon: '📄', word: 'đề', color: '#cbd5e1', dash: null },
  verified_fact: { icon: '✓', word: 'đã kiểm chứng', color: '#86efac', dash: null },
  experiment_value: { icon: '⚗', word: 'thử nghiệm', color: '#67e8f9', dash: null },
  learner_valid: { icon: '✓', word: 'khớp', color: '#34d399', dash: null },
  learner_invalid: { icon: '✗', word: 'chưa khớp', color: '#fb7185', dash: '6 4' },
  learner_hypothesis: { icon: '?', word: 'giả thuyết', color: '#fbbf24', dash: '10 5' },
  learner_ambiguous: { icon: '?', word: 'cần làm rõ', color: '#fcd34d', dash: '2 4' },
  learner_unverified: { icon: '–', word: 'chưa kiểm tra được', color: '#94a3b8', dash: '2 4' },
  learner_insufficient: { icon: '…', word: 'thiếu cơ sở', color: '#7dd3fc', dash: '2 4' },
};

export const REASON_TEXT: Record<string, string> = {
  approximation: 'Số gần đúng nằm trong sai số cho phép.',
  arithmetic_error: 'Có một dấu “=” mà hai vế chưa bằng nhau.',
  premise_changed: 'Một bước trước đã thay đổi; bước này vẫn dùng số cũ.',
  premise_mismatch: 'Số được thay vào chưa khớp với các bước trước hoặc với đề.',
  depends_on_invalid: 'Bước này dựa trên một bước chưa khớp.',
  depends_on_ambiguous: 'Bước này dựa trên một bước cần làm rõ.',
  depends_on_insufficient: 'Bước này dựa trên một bước còn thiếu cơ sở.',
  missing_premise: 'Chưa có bước nào dẫn tới kết quả này (hoặc bước đó đã bị rút).',
  wrong_value: 'Giá trị chưa khớp với đề.',
  unit_error: 'Đơn vị chưa khớp với loại đại lượng.',
  wrong_formula: 'Công thức chưa đúng với đại lượng cần tính.',
  scaling_claim_false: 'Quy luật thay đổi này chưa khớp với công thức.',
  false_justification: 'Lý do nêu một điều kiện không có trong đề.',
  contradicts_problem_text: 'Khác với cụm từ trong đề.',
  outside_poc_scope: 'Nội dung ngoài phạm vi (POC chỉ gồm hình trụ).',
  outside_grammar: 'Hệ thống chưa đọc được cách viết này.',
  outside_rule_catalog: 'Ngoài danh mục quy tắc đã duyệt.',
  grounding_failed: 'Cách đọc của máy chưa bám đúng chữ em viết.',
  multiple_statements: 'Dòng có nhiều mệnh đề — tách mỗi ý một dòng.',
  unresolved_symbol: 'Chưa rõ ký hiệu thuộc hình nào.',
  missing_quantity: 'Chưa rõ đại lượng cần tính.',
  symbol_redefined: 'Đại lượng này đã có giá trị khác ở bước trước.',
  cyclic_reference: 'Tham chiếu vòng giữa các bước.',
  rejected_by_learner: 'Em đã bác cách hiểu của hệ thống.',
  vague_justification: 'Lý do chưa nêu điều kiện cụ thể.',
  vague_strategy: 'Kế hoạch chưa rõ.',
  plan_missing_step: 'Kế hoạch còn thiếu một bước.',
  plan_reaches_unknown: 'Kế hoạch dẫn tới đại lượng cần tìm.',
  question: 'Câu hỏi — Coach sẽ trả lời.',
  value_not_visited: 'Em chưa thử giá trị này trên thanh trượt.',
  numeric_overflow: 'Số quá lớn để kiểm tra chính xác.',
  irrational_result: 'Kết quả không phải số hữu tỉ (ngoài phạm vi POC).',
  parser_unavailable: 'Chưa đọc được dòng này.',
};

export const MISCONCEPTION_TEXT: Record<string, string> = {
  radius_diameter: 'có thể nhầm bán kính với đường kính',
  linear_scaling: 'có thể nghĩ thể tích/diện tích tăng cùng tỉ lệ với bán kính',
  area_linear: 'có thể nghĩ diện tích tăng cùng tỉ lệ với bán kính',
  square_as_double: 'có thể tính r² như 2·r',
  missing_pi: 'có thể quên π',
  forgot_height: 'có thể quên nhân chiều cao',
  increase_vs_factor: 'có thể nhầm “tăng thêm” với “gấp”',
  percent_vs_factor: 'có thể nhầm phần trăm tăng với số lần',
};

export const PROBLEM_STATUS_TEXT: Record<string, string> = {
  'shape:cone': 'Đề nói về hình nón — POC chỉ hỗ trợ hình trụ.',
  'shape:sphere': 'Đề nói về hình cầu — POC chỉ hỗ trợ hình trụ.',
  'shape:prism': 'Đề nói về lăng trụ — POC chỉ hỗ trợ hình trụ.',
  'shape:box': 'Đề nói về hình hộp — POC chỉ hỗ trợ hình trụ.',
  'shape:pyramid': 'Đề nói về hình chóp — POC chỉ hỗ trợ hình trụ.',
  'shape:not_cylinder': 'Chưa thấy hình trụ trong đề.',
  'quantity:surface_area': 'Diện tích xung quanh/toàn phần chưa thuộc POC.',
  'quantity:perimeter': 'Chu vi chưa thuộc POC.',
  'unit:liter': 'Đơn vị lít/ml chưa thuộc POC.',
  mixed_units: 'Đề dùng nhiều đơn vị khác nhau — POC chưa đổi đơn vị trong một bài.',
  too_many_cylinders: 'POC chỉ hỗ trợ tối đa 2 hình trụ.',
  value_out_of_range: 'Có giá trị không dương hoặc quá lớn.',
  non_positive: 'Một kích thước tính ra không dương.',
  irrational_result: 'Kết quả không phải số hữu tỉ — ngoài phạm vi POC.',
  missing_unknown: 'Chưa thấy đề hỏi đại lượng nào.',
};

export const SAMPLE_PROBLEMS = [
  { label: 'Lon nước: chiều cao giảm một nửa', text: PROBLEM_A },
  { label: 'Bể nước: bán kính 5 → 15 dm', text: PROBLEM_B },
  { label: 'Cốc: đường kính 6 → 12 cm', text: PROBLEM_C },
  { label: 'Bài gốc v0.3: r 2 → 4 cm, h = 5 cm', text: PROBLEM_REG },
];

export const LIMITATION = 'Tóm tắt này chỉ phản ánh phiên học này; không phải đánh giá năng lực lâu dài.';

/** Mission milestones (§24.3): icon + word, never colour alone (NFR-A11Y-002). */
export const MILESTONE_STATE_UI: Record<'achieved' | 'in_progress' | 'not_yet', { icon: string; label: string; cls: string }> = {
  achieved: { icon: '✓', label: 'Đã xong', cls: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100' },
  in_progress: { icon: '◐', label: 'Đang làm', cls: 'border-indigo-400/40 bg-indigo-500/10 text-indigo-100' },
  not_yet: { icon: '○', label: 'Chưa', cls: 'border-white/10 bg-slate-800/60 text-slate-300' },
};

/** Learning-score criterion status (§24.4). */
export const CRITERION_STATUS_UI: Record<'full' | 'partial' | 'none' | 'incomplete', { icon: string; label: string; cls: string }> = {
  full: { icon: '✓', label: 'Đủ bằng chứng', cls: 'bg-emerald-500/15 text-emerald-200' },
  partial: { icon: '◐', label: 'Một phần', cls: 'bg-sky-500/15 text-sky-200' },
  none: { icon: '○', label: 'Chưa có bằng chứng', cls: 'bg-slate-700/60 text-slate-300' },
  incomplete: { icon: '…', label: 'Chưa hoàn thành', cls: 'bg-amber-500/15 text-amber-200' },
};
