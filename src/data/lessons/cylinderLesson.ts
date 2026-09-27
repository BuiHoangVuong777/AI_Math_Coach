/**
 * Approved lesson content for the MVP cylinder scenario (PRODUCT_SPEC §9).
 * Learning content is Vietnamese (NFR-LANG-001). Numbers shown to the learner
 * as results are never hard-coded here: they come from src/lib/cylinder/math.ts.
 *
 * Hints follow the proposed tiers in §11.4: 1 = goal/data reminder,
 * 2 = strategy question, 3 = step frame without the step's final answer.
 */
import type { AnalysisField, CalcStep, FeedbackCode, FigureChoice } from '../../lib/cylinder/session.ts';

export interface ReasonOption {
  id: string;
  text: string;
}

export interface CalcStepContent {
  title: string;
  goal: string;
  prompt: string;
  fields: { label: string; placeholder: string; unit: string }[];
  hints: string[];
  /** Socratic follow-up used by the rule-based coach reply (fallback when AI is unavailable). */
  socratic: string;
  reasonQuestion: string;
  reasonOptions: ReasonOption[];
  /** Shown once the step is complete: "làm gì" and "vì sao đúng" (FR-STEP-002). */
  what: string;
  why: string;
}

export const CYLINDER_LESSON = {
  title: 'Thể tích hình trụ — bán kính tăng, thể tích tăng bao nhiêu?',
  grade: 'Lớp 9',
  /** Problem statement split into segments; `key` marks important phrases (J-AC stage 1). */
  problem: [
    { text: 'Một hình trụ có ' },
    { text: 'bán kính r = 2 cm', key: true },
    { text: ', ' },
    { text: 'chiều cao h = 5 cm', key: true },
    { text: '. Nếu ' },
    { text: 'bán kính tăng thành 4 cm', key: true },
    { text: ' và ' },
    { text: 'chiều cao giữ nguyên', key: true },
    { text: ', thể tích ' },
    { text: 'tăng gấp bao nhiêu lần', key: true },
    { text: '?' },
  ] as { text: string; key?: boolean }[],

  analysis: {
    intro: 'Trước khi giải, mình cùng đọc kỹ đề nhé. Em hãy điền lại những gì đề cho và đề hỏi.',
    questions: 'Đề cho bán kính nào? Đại lượng nào giữ nguyên? Cần tìm thể tích hay số lần thay đổi?',
    unknowns: 'V₁, V₂ — thể tích hình trụ trước và sau khi đổi bán kính (chưa biết).',
    fixedOptions: [
      { id: '', text: '— Chọn —' },
      { id: 'height', text: 'Chiều cao' },
      { id: 'radius', text: 'Bán kính' },
      { id: 'volume', text: 'Thể tích' },
    ],
    targetOptions: [
      { id: '', text: '— Chọn —' },
      { id: 'volume_ratio', text: 'Thể tích mới gấp bao nhiêu lần thể tích cũ (V₂/V₁)' },
      { id: 'volume', text: 'Thể tích của hình trụ mới (V₂)' },
      { id: 'radius', text: 'Bán kính mới' },
    ],
    unitOptions: [
      { id: '', text: '— Chọn —' },
      { id: 'cm', text: 'cm' },
      { id: 'm', text: 'm' },
      { id: 'cm2', text: 'cm²' },
    ],
    done: 'Em đã tách đúng dữ kiện, điều kiện và yêu cầu. Giờ mình xem hình nhé!',
  },

  analysisFeedback: {
    ok: 'Đúng rồi.',
    invalid_number: 'Hãy nhập một số, ví dụ 3.',
    diameter_confusion: 'Số này gấp đôi số trong đề. Đề cho bán kính, không phải đường kính — em đọc lại nhé.',
    wrong_value: 'Chưa khớp với đề. Em tìm lại con số này trong đề nhé.',
    wrong_unit: 'Các độ dài trong đề đo bằng đơn vị nào? Em đọc lại phần có số nhé.',
    fixed_is_height: 'Đề nói đại lượng nào "giữ nguyên"? Em tìm cụm từ đó trong đề.',
    target_is_ratio: 'Câu hỏi là "tăng gấp bao nhiêu lần" — đó là so sánh hai thể tích, không phải một thể tích.',
  } as Partial<Record<FeedbackCode, string>>,

  analysisLabels: {
    r1: 'Bán kính ban đầu r₁',
    r2: 'Bán kính mới r₂',
    h: 'Chiều cao h',
    unit: 'Đơn vị độ dài',
    fixed: 'Đại lượng giữ nguyên',
    target: 'Đề hỏi gì?',
  } as Record<AnalysisField, string>,

  figure: {
    intro:
      'Hai hình trụ đặt cạnh nhau, cùng một thang đo (mỗi ô lưới là 1 cm). Em có thể xoay, phóng to hoặc thu nhỏ để quan sát — kích thước thật không thay đổi.',
    question: 'Trên hình "Tham chiếu", đoạn màu cam nối tâm đáy trên với mép đáy. Đoạn đó là gì?',
    options: [
      { id: 'radius', text: 'Bán kính r = 2 cm' },
      { id: 'diameter', text: 'Đường kính = 2 cm' },
      { id: 'height', text: 'Chiều cao h' },
    ] as { id: FigureChoice; text: string }[],
    wrong: 'Chưa đúng. Đường kính đi qua tâm từ mép này sang mép kia; chiều cao thì vuông góc với đáy. Em nhìn lại đoạn màu cam nhé.',
  },

  prediction: {
    question: 'Nếu bán kính tăng gấp đôi (2 cm → 4 cm) và chiều cao giữ nguyên, em đoán thể tích sẽ gấp bao nhiêu lần?',
    note: 'Chưa cần tính — cứ đoán theo cảm nhận. Dự đoán giúp em so sánh với kết quả thử nghiệm sau này.',
    demoLabel: 'Điền dự đoán minh họa (demo): 2',
    demoNote: 'Dự đoán minh họa được đánh dấu là dữ liệu demo, không phải câu trả lời thật của học sinh.',
    invalid: 'Hãy nhập một số dương, ví dụ 3 hoặc 1,5.',
    saved: 'Đã lưu dự đoán của em. Giờ mình thử nghiệm để kiểm tra nhé!',
  },

  experiment: {
    title: 'Thử nghiệm',
    goal: 'Đổi bán kính hình "So sánh" từ 2 cm thành 4 cm, giữ nguyên chiều cao.',
    prompt: 'Kéo thanh trượt (hoặc dùng phím mũi tên) để đặt bán kính hình So sánh bằng 4 cm. Quan sát: chiều cao có đổi không?',
    confirm: 'Em đã đặt r = 4 cm và thấy chiều cao vẫn là 5 cm',
    notYet: 'Bán kính hình So sánh chưa bằng 4 cm. Em kéo thanh trượt đến đúng 4 nhé.',
    hints: [
      'Thanh trượt nằm dưới mô hình 3D, có nhãn "Bán kính hình So sánh".',
      'Mỗi nấc là 0,5 cm. Từ 2 cm cần tăng 4 nấc.',
      'Đặt thanh trượt ở giá trị 4 rồi nhìn nhãn "r = 4 cm" trên hình So sánh.',
    ],
    done: 'Hình So sánh có đường kính gấp đôi, nhưng cao bằng hình Tham chiếu. Nó "to" hơn bao nhiêu? Mình tính nhé.',
  },

  steps: {
    area: {
      title: 'Bước 1 · Diện tích đáy',
      goal: 'Tính diện tích đáy của hai hình trụ.',
      prompt: 'Đáy hình trụ là hình tròn. Tính diện tích đáy của hình Tham chiếu (r = 2 cm) và hình So sánh (r = 4 cm). Viết kết quả dạng chính xác theo π, ví dụ 9π.',
      fields: [
        { label: 'A₁ (r = 2 cm)', placeholder: 'vd: 9π', unit: 'cm²' },
        { label: 'A₂ (r = 4 cm)', placeholder: 'vd: 9π', unit: 'cm²' },
      ],
      hints: [
        'Mục tiêu bước này là diện tích hình tròn ở đáy. Em nhớ công thức diện tích hình tròn theo bán kính không?',
        'Trong công thức A = πr², bán kính được nhân với chính nó. Vậy với r = 2 thì r² là bao nhiêu?',
        'Khung tính: A₁ = π · 2 · 2 = ?π và A₂ = π · 4 · 4 = ?π. Em điền nốt nhé.',
      ],
      socratic: 'Trong công thức diện tích hình tròn, bán kính xuất hiện mấy lần?',
      reasonQuestion: 'Bán kính gấp 2 lần. Vì sao diện tích đáy lại gấp nhiều hơn 2 lần?',
      reasonOptions: [
        { id: 'square', text: 'Vì A = πr²: bán kính được bình phương, nên gấp 2 lần thì diện tích gấp 2² = 4 lần.' },
        { id: 'double', text: 'Vì diện tích luôn gấp đôi bán kính.' },
        { id: 'pi', text: 'Vì π ≈ 3,14 làm kết quả lớn hơn.' },
      ],
      what: 'Tính diện tích hình tròn đáy bằng A = πr² cho từng hình.',
      why: 'Đáy hình trụ là hình tròn bán kính r. Vì r nằm trong bình phương, bán kính gấp 2 thì diện tích đáy gấp 2² = 4.',
    },
    volume: {
      title: 'Bước 2 · Thể tích',
      goal: 'Tính thể tích hai hình trụ từ diện tích đáy và chiều cao.',
      prompt: 'Dùng diện tích đáy em vừa tính và chiều cao h = 5 cm để tính thể tích hai hình.',
      fields: [
        { label: 'V₁ (Tham chiếu)', placeholder: 'vd: 9π', unit: 'cm³' },
        { label: 'V₂ (So sánh)', placeholder: 'vd: 9π', unit: 'cm³' },
      ],
      hints: [
        'Thể tích hình trụ liên quan đến diện tích đáy và một kích thước nữa. Kích thước nào vuông góc với đáy?',
        'Hãy tưởng tượng xếp chồng nhiều lớp đáy mỏng lên nhau cho đến khi đủ chiều cao. Vậy phép tính là gì?',
        'Khung tính: V = A · h. V₁ = (A₁) · 5, V₂ = (A₂) · 5. Giữ π trong kết quả.',
      ],
      socratic: 'Nếu xếp chồng các đáy hình tròn cao đến 5 cm, em cần nhân diện tích đáy với số nào?',
      reasonQuestion: 'Vì sao được tính thể tích bằng V = A · h?',
      reasonOptions: [
        { id: 'base_times_height', text: 'Thể tích hình trụ bằng diện tích đáy nhân chiều cao; hai hình cùng h = 5 cm.' },
        { id: 'perimeter', text: 'Thể tích bằng chu vi đáy nhân chiều cao.' },
        { id: 'sum', text: 'Thể tích bằng bán kính cộng chiều cao.' },
      ],
      what: 'Nhân diện tích đáy với chiều cao: V = A · h.',
      why: 'Hình trụ gồm các lớp tròn giống hệt đáy chồng lên nhau đến độ cao h. Cùng h = 5 cm nên thể tích tỷ lệ với diện tích đáy.',
    },
    ratio: {
      title: 'Bước 3 · Hệ số tăng',
      goal: 'So sánh hai thể tích để biết thể tích mới gấp bao nhiêu lần.',
      prompt: 'Thể tích mới gấp bao nhiêu lần thể tích ban đầu? Hãy chia V₂ cho V₁.',
      fields: [{ label: 'V₂ / V₁', placeholder: 'một số', unit: 'lần' }],
      hints: [
        '"Gấp bao nhiêu lần" nghĩa là lấy thể tích mới chia cho thể tích cũ.',
        'Khi chia hai số cùng có π, π có triệt tiêu không? Thử chia hai hệ số trước π.',
        'Khung tính: V₂ / V₁ = (hệ số của V₂)π / (hệ số của V₁)π. Chú ý: "gấp" khác "tăng thêm".',
      ],
      socratic: 'Khi chia hai thể tích cho nhau, những thừa số nào giống nhau ở cả tử và mẫu?',
      reasonQuestion: 'Khi chiều cao giữ nguyên, hệ số V₂/V₁ bằng gì?',
      reasonOptions: [
        { id: 'ratio_squared', text: '(r₂/r₁)² — bình phương tỷ số bán kính.' },
        { id: 'ratio', text: 'r₂/r₁ — đúng bằng tỷ số bán kính.' },
        { id: 'difference', text: 'r₂ − r₁ — hiệu hai bán kính.' },
      ],
      what: 'Chia V₂ cho V₁ để tìm số lần thay đổi (không có đơn vị).',
      why: 'Cùng chiều cao, V₂/V₁ = (πr₂²h)/(πr₁²h) = (r₂/r₁)². Bán kính gấp 2 thì thể tích gấp 2² = 4.',
    },
  } as Record<CalcStep, CalcStepContent>,

  calcFeedback: {
    ok: 'Đúng.',
    invalid_number: 'Chưa đọc được câu trả lời. Viết dạng như 9π (hoặc 9pi), với hệ số tăng thì chỉ cần một số.',
    wrong_value: 'Chưa đúng. Em kiểm tra lại phép tính nhé.',
    missing_pi: 'Hệ số đúng rồi, nhưng thiếu π. Kết quả chính xác cần viết kèm π.',
    use_exact_pi: 'Giá trị gần đúng này khớp, nhưng bài yêu cầu kết quả chính xác theo π (ví dụ 9π).',
    area_linear: 'Có thể em đã nhân bán kính với 2 thay vì bình phương nó. Diện tích dùng r².',
    forgot_height: 'Đây là diện tích đáy. Thể tích còn cần thêm chiều cao.',
    volume_linear: 'Có vẻ em đã nhân đôi thể tích ban đầu. Hãy tính V₂ trực tiếp từ A₂.',
    increase_vs_factor: 'Số này là phần tăng thêm (so với V₁), chưa phải số lần. "Gấp bao nhiêu lần" là V₂ chia V₁.',
    percent_vs_factor: 'Đây là cách viết phần trăm. Hệ số "gấp bao nhiêu lần" là một số không có đơn vị.',
    ratio_linear: 'Đây là tỷ số bán kính. Em chia hai thể tích đã tính nhé.',
    wrong_reason: 'Lý do này chưa đúng. Em thử liên hệ với công thức vừa dùng.',
  } as Partial<Record<FeedbackCode, string>>,

  coach: {
    title: 'Hỏi Coach',
    intro: 'Viết lập luận hoặc câu hỏi của em về bước này. Coach sẽ hỏi lại hoặc gợi ý, không giải hộ.',
    privacy: 'Đừng viết họ tên hay thông tin cá nhân.',
    placeholder: 'Ví dụ: Em nghĩ bán kính gấp 2 thì diện tích cũng gấp 2, đúng không?',
    submit: 'Hỏi Coach',
    loading: 'Coach đang suy nghĩ…',
    sourceAi: 'Coach AI',
    sourceFallback: 'Coach cơ bản (gợi ý soạn sẵn)',
    possibleMisconception: 'Có thể em đang nhầm',
    reasonPending: 'Phép tính đã đúng. Giờ hãy nghĩ vì sao cách tính đó hợp lệ.',
  },

  transfer: {
    intro:
      'Bài kiểm chứng độc lập: lần này không có mô hình và không có gợi ý. Em tự làm và giải thích nhé. Câu trả lời được lưu trước khi chấm.',
    problem:
      'Một hình trụ có bán kính 3 cm, chiều cao 8 cm. Nếu bán kính tăng thành 9 cm và chiều cao giữ nguyên, thể tích tăng gấp bao nhiêu lần? Giải thích.',
    answerLabel: 'Thể tích gấp bao nhiêu lần?',
    reasonLabel: 'Giải thích của em',
    reasonPlaceholder: 'Vì sao em ra kết quả này?',
    empty: 'Hãy nhập đáp án trước khi gửi.',
    reasonRule:
      'Lập luận được chấm bằng quy tắc từ khóa minh bạch (bình phương tỷ số bán kính kèm chiều cao không đổi, hoặc hai thể tích 72π và 648π). Quy tắc này không kết luận "sai"; khi không chắc, kết quả là "chưa đủ bằng chứng".',
  },
} as const;

export const STAGE_LABELS: Record<string, string> = {
  S1: 'Đọc đề',
  S2: 'Quan sát',
  S3: 'Dự đoán',
  S4: 'Thử nghiệm & giải',
  S5: 'Tự kiểm chứng',
  S6: 'Tổng kết',
};
