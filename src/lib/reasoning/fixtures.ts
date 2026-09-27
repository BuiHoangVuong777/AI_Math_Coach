/**
 * Demo and regression problems from PRODUCT_SPEC §15 (test/E2E fixtures only —
 * the engine never special-cases them).
 */
export const PROBLEM_A =
  'Một lon nước hình trụ có bán kính đáy 3 cm và chiều cao 12 cm. Người ta làm một lon mới có cùng bán kính đáy nhưng chiều cao chỉ bằng một nửa lon cũ. Tính thể tích lon mới và cho biết thể tích lon mới bằng mấy phần thể tích lon cũ.';
export const ROWS_A = [
  'Chiều cao lon mới là 12 : 2 = 6 cm.',
  'Diện tích đáy A₁ = π·3² = 9π cm².',
  'Lon mới cùng bán kính nên A₂ = A₁ = 9π cm².',
  'V₁ = 9π·12 = 108π cm³.',
  'V₂ = 9π·6 = 54π cm³.',
  'Vậy V₂ : V₁ = 54π : 108π = 1/2, lon mới bằng một nửa lon cũ vì cùng đáy mà chiều cao chỉ bằng một nửa.',
];

export const PROBLEM_B =
  'Một bể nước hình trụ có bán kính đáy 5 dm và chiều cao 8 dm. Nếu bán kính đáy tăng thành 15 dm và giữ nguyên chiều cao thì thể tích bể tăng gấp bao nhiêu lần?';
export const ROWS_B = {
  hypothesis: 'Em nghĩ bán kính gấp 3 lần nên thể tích cũng gấp 3 lần.',
  observation: 'Em thử r = 10 dm thì A = 100π, gấp 4 lần 25π chứ không phải gấp 2.',
  area: 'Vậy bán kính gấp 3 thì diện tích đáy gấp 3² = 9 lần.',
  conclusion: 'Chiều cao giữ nguyên nên thể tích cũng gấp 9 lần, không phải 3 lần như em đoán ở bước 1.',
};

export const PROBLEM_C =
  'Một cốc hình trụ có đường kính đáy 6 cm và chiều cao 10 cm. Người ta thay bằng một cốc có đường kính đáy 12 cm, cùng chiều cao. Thể tích cốc mới gấp mấy lần thể tích cốc cũ?';
export const ROWS_C = [
  'Bán kính cốc cũ r₁ = 6 cm.',
  'r₂ = 12 cm.',
  'A₁ = π·6² = 36π cm².',
  'A₂ = π·12² = 144π cm².',
  'V₂ : V₁ = (144π·10) : (36π·10) = 4. Vậy cốc mới gấp 4 lần cốc cũ.',
];
export const EDITS_C = [
  'r₁ = 6 : 2 = 3 cm vì 6 cm là đường kính.',
  'r₂ = 12 : 2 = 6 cm.',
  'A₁ = π·3² = 9π cm².',
  'A₂ = π·6² = 36π cm².',
  'V₂ : V₁ = (36π·10) : (9π·10) = 4. Vậy cốc mới gấp 4 lần cốc cũ vì chiều cao như nhau.',
];

export const PROBLEM_REG =
  'Một hình trụ có bán kính r = 2 cm, chiều cao h = 5 cm. Nếu bán kính tăng thành 4 cm và chiều cao giữ nguyên, thể tích tăng gấp bao nhiêu lần?';
export const ROWS_REG = [
  'Em đoán thể tích gấp 2 lần.',
  'A₁ = π·2² = 4π cm²',
  'A₂ = π·4² = 16π cm²',
  'V₁ = 4π·5 = 20π cm³',
  'V₂ = 16π·5 = 80π cm³',
  'V₂/V₁ = 80π/20π = 4, gấp 4 lần vì chiều cao không đổi.',
];
export const ANALOG_REG =
  'Một hình trụ có bán kính 3 cm, chiều cao 8 cm. Nếu bán kính tăng thành 9 cm và chiều cao giữ nguyên, thể tích tăng gấp bao nhiêu lần?';
