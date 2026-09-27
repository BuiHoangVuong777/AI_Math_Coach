/** Optional demonstration content. Each string is submitted only by the learner. */
export const DEMO_SCENARIOS = [
  {
    id: 'radius-double', title: 'Bán kính tăng gấp đôi', subtitle: '2 → 4 cm · chiều cao 5 cm',
    problem: 'Một hình trụ có bán kính r = 2 cm, chiều cao h = 5 cm. Nếu bán kính tăng thành 4 cm và chiều cao giữ nguyên, thể tích tăng gấp bao nhiêu lần?',
    steps: ['A₁ = π·2² = 4π cm².', 'A₂ = π·4² = 16π cm².', 'V₁ = 4π·5 = 20π cm³.', 'V₂ = 16π·5 = 80π cm³.', 'V₂/V₁ = 80π/20π = 4, gấp 4 lần vì chiều cao không đổi.'],
    answer: 'Thể tích ban đầu là 20π cm³, thể tích mới là 80π cm³. Thể tích tăng gấp 4 lần: bán kính gấp đôi làm diện tích đáy gấp 2² = 4 lần, còn chiều cao không đổi.', ratio: { n: 4, d: 1, piPow: 0 },
  },
  {
    id: 'height-half', title: 'Chiều cao giảm một nửa', subtitle: '12 → 6 cm · bán kính 3 cm',
    problem: 'Một lon nước hình trụ có bán kính đáy 3 cm và chiều cao 12 cm. Người ta làm một lon mới có cùng bán kính đáy nhưng chiều cao chỉ bằng một nửa lon cũ. Tính thể tích lon mới và cho biết thể tích lon mới bằng mấy phần thể tích lon cũ.',
    steps: ['Chiều cao lon mới là 12 : 2 = 6 cm.', 'Diện tích đáy A₁ = π·3² = 9π cm².', 'Lon mới cùng bán kính nên A₂ = A₁ = 9π cm².', 'V₁ = 9π·12 = 108π cm³.', 'V₂ = 9π·6 = 54π cm³.', 'Vậy V₂ : V₁ = 54π : 108π = 1/2, lon mới bằng một nửa lon cũ vì cùng đáy mà chiều cao chỉ bằng một nửa.'],
    answer: 'Thể tích lon mới là 54π cm³, bằng 1/2 thể tích lon cũ (108π cm³). Cùng diện tích đáy nên thể tích thay đổi cùng tỉ lệ với chiều cao.', ratio: { n: 1, d: 2, piPow: 0 },
  },
  {
    id: 'diameter-double', title: 'Từ đường kính đến bán kính', subtitle: '6 → 12 cm · cùng chiều cao 10 cm',
    problem: 'Một cốc hình trụ có đường kính đáy 6 cm và chiều cao 10 cm. Người ta thay bằng một cốc có đường kính đáy 12 cm, cùng chiều cao. Thể tích cốc mới gấp mấy lần thể tích cốc cũ?',
    steps: ['r₁ = 6 : 2 = 3 cm vì 6 cm là đường kính.', 'r₂ = 12 : 2 = 6 cm.', 'A₁ = π·3² = 9π cm².', 'A₂ = π·6² = 36π cm².', 'V₁ = 9π·10 = 90π cm³.', 'V₂ = 36π·10 = 360π cm³.', 'V₂ : V₁ = (36π·10) : (9π·10) = 4. Vậy cốc mới gấp 4 lần cốc cũ vì chiều cao như nhau.'],
    answer: 'Hai bán kính là 3 cm và 6 cm. Hai thể tích là 90π cm³ và 360π cm³; cốc mới có thể tích gấp 4 lần cốc cũ.', ratio: { n: 4, d: 1, piPow: 0 },
  },
  {
    id: 'radius-triple', title: 'Bán kính tăng gấp ba', subtitle: '5 → 15 dm · chiều cao 8 dm',
    problem: 'Một bể nước hình trụ có bán kính đáy 5 dm và chiều cao 8 dm. Nếu bán kính đáy tăng thành 15 dm và giữ nguyên chiều cao thì thể tích bể tăng gấp bao nhiêu lần?',
    steps: ['A₁ = π·5² = 25π dm².', 'A₂ = π·15² = 225π dm².', 'V₁ = 25π·8 = 200π dm³.', 'V₂ = 225π·8 = 1800π dm³.', 'V₂ : V₁ = 1800π : 200π = 9. Vậy thể tích gấp 9 lần vì chiều cao không đổi.'],
    answer: 'Thể tích ban đầu là 200π dm³, thể tích mới là 1800π dm³. Bán kính gấp 3 lần làm diện tích đáy và thể tích gấp 3² = 9 lần khi chiều cao không đổi.', ratio: { n: 9, d: 1, piPow: 0 },
  },
] as const;
