/**
 * Approved Vietnamese templates for the Explainable Reasoning Graph (§10.8.4).
 * Content only — selection and disclosure rules live in explanations.ts.
 * Wording may be edited (NFR-MATH-001) without changing template ids.
 */

export const STATUS_BADGE: Record<string, { icon: string; label: string }> = {
  valid: { icon: '✓', label: 'Khớp' },
  invalid: { icon: '✗', label: 'Chưa khớp' },
  ambiguous: { icon: '?', label: 'Cần làm rõ' },
  unverified: { icon: '–', label: 'Chưa kiểm tra được' },
  insufficient_evidence: { icon: '…', label: 'Thiếu cơ sở' },
  stale: { icon: '⟳', label: 'Đang kiểm tra lại' },
  given: { icon: '📄', label: 'Dữ kiện đề' },
  hidden: { icon: '•', label: 'Chưa đánh giá' },
};

/** Short rule statements used in confirmations of VALID nodes (the learner used the rule). */
export const RULE_SHORT: Record<string, string> = {
  'R-A': 'Áp dụng A = πr²',
  'R-V1': 'Áp dụng V = A·h',
  'R-V2': 'Áp dụng V = πr²h',
  'R-D': 'Áp dụng r = d : 2',
  'R-KA': 'Bán kính gấp k thì diện tích đáy gấp k²',
  'R-KV': 'Hệ số thể tích = hệ số diện tích đáy × hệ số chiều cao',
  'R-KV-h': 'Chiều cao giữ nguyên nên thể tích gấp như diện tích đáy',
  'R-KV-r': 'Bán kính giữ nguyên nên thể tích gấp như chiều cao',
  'R-INV-h': 'Áp dụng h = V : (πr²)',
  'R-INV-r': 'Áp dụng r = √(V : (πh))',
  'R-INC': 'Tăng thêm p% nghĩa là gấp (1 + p/100) lần',
  'R-RATIO': 'Hệ số = đại lượng sau : đại lượng trước',
  'R-REL': 'Theo quan hệ trong đề',
  'R-FIX': 'Theo điều kiện giữ nguyên của đề',
};

/** What to check at D0 for a root invalid node — never the correct rule or value. */
export const CHECK_ASPECT: Record<string, string> = {
  wrong_value: 'giá trị so với dữ kiện đề',
  arithmetic_error: 'các dấu “=” trong phép tính',
  unit_error: 'đơn vị',
  scaling_claim_false: 'quy luật thay đổi em nêu',
  wrong_formula: 'công thức đã dùng',
  premise_mismatch: 'các số được thay vào',
  false_justification: 'lý do em nêu',
  contradicts_problem_text: 'cách đọc đề',
};

export const WHY = {
  valid: 'Suy ra được từ các tiền đề em dùng, và khớp với đề.',
  invalid_exact: 'So với dữ kiện đề và các bước trước, giá trị này không khớp (giá trị đúng chưa hiển thị).',
  invalid_arith: 'Có một dấu “=” mà hai vế chưa bằng nhau.',
  invalid_unit: 'Đơn vị chưa khớp với loại đại lượng.',
  invalid_scaling: 'Hệ thống so quy luật em nêu với công thức trong danh mục đã duyệt; hai bên chưa khớp. (Công thức và kết quả đúng chưa hiển thị ở mức này.)',
  invalid_formula: 'Công thức em viết không cho ra đại lượng này.',
  invalid_justification: 'Lý do em nêu có một điều kiện không có trong đề.',
  inherited: 'Phép tính khớp tiền đề em dùng; kết quả chưa khớp đề vì tiền đề ở bước trước.',
  stale: 'Một bước trước đã được sửa; bước này vẫn dùng số của phiên bản cũ.',
  insufficient_invalid: 'Đáp án và lập luận được đánh giá riêng: lập luận dựa trên bước chưa khớp.',
  insufficient_missing: 'Chưa có bước nào dẫn tới kết quả này, nên chưa đủ bằng chứng.',
  ambiguous: 'Chưa có một cách hiểu duy nhất nên hệ thống chưa kiểm tra.',
  unverified: 'Nội dung này nằm ngoài những gì hệ thống kiểm tra được; không có nghĩa là sai.',
  observation: 'Giá trị em đọc được so với mô hình tại tham số em đã chọn.',
  plan: 'Kế hoạch được so với các quy tắc để xem có dẫn tới đại lượng cần tìm không.',
  hidden: 'Bài tự kiểm tra: kết quả chỉ hiển thị sau khi em nộp bài.',
  given: 'Dữ kiện của đề — em đã xác nhận ở bước đọc đề.',
  question: 'Đây là câu hỏi, không phải một mệnh đề cần kiểm tra.',
};

export const REASON_SHORT: Record<string, string> = {
  outside_poc_scope: 'nội dung ngoài phạm vi hình trụ của POC',
  outside_grammar: 'hệ thống chưa đọc được cách viết này',
  outside_rule_catalog: 'ngoài danh mục quy tắc đã duyệt',
  grounding_failed: 'cách đọc của máy chưa bám đúng chữ em viết',
  numeric_overflow: 'số quá lớn để kiểm tra chính xác',
  irrational_result: 'kết quả không phải số hữu tỉ',
  parser_unavailable: 'chưa đọc được dòng này',
  question: 'đây là câu hỏi',
};

export const KIND_WORD: Record<string, string> = {
  r: 'bán kính', d: 'đường kính', h: 'chiều cao', A: 'diện tích đáy', V: 'thể tích', k: 'hệ số',
};
