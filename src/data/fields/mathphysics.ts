import { FieldNode } from '@/types';

export const mathphysicsFields: FieldNode[] = [
  // ==================== 数学物理 ====================
  {
    id: 'mathphysics', slug: 'math-physics',
    names: { zh: '数学物理', en: 'Mathematical Physics', vi: "Vật lý toán" },
    descriptions: { zh: '物理学与数学的交叉领域，用严格数学方法研究物理问题。', en: 'Intersection of physics and mathematics, studying physical problems with rigorous mathematical methods.', vi: "Giao thoa vật lý và toán, nghiên cứu bài toán vật lý bằng phương pháp toán chặt chẽ." },
    level: 1, parentId: null,
    childIds: ['classical-mechanics-math', 'quantum-math', 'relativity-math', 'statistical-physics-math', 'string-theory-math', 'field-theory-math', 'fluid-mechanics-math'],
    position: [6, 10, 18], size: 'large', color: '#f43f5e',
    tags: ['mathphysics'],
    basics: {
      definition: { zh: '数学物理研究物理现象背后的数学结构和规律，是理论物理学的核心工具。', en: 'Mathematical physics studies the mathematical structures and laws behind physical phenomena, core tool of theoretical physics.', vi: "Nghiên cứu cấu trúc và quy luật toán sau hiện tượng vật lý; công cụ của vật lý lý thuyết." },
      scope: { zh: '经典力学数学表述、量子力学公理化、相对论数学基础、统计力学、量子场论、弦理论数学框架。', en: 'Math formulations of classical mechanics, QM axiomatization, relativity foundations, statistical mechanics, QFT, string theory framework.', vi: "Cơ học cổ điển, tiên đề lượng tử, nền tảng tương đối, cơ học thống kê, trường lượng tử, khuôn khổ lý thuyết dây." },
      importance: 5, difficulty: 5,
      history: [
        { year: 1687, event: { zh: '牛顿《自然哲学的数学原理》', en: "Newton's Principia Mathematica", vi: "Principia Mathematica của Newton" } },
        { year: 1905, event: { zh: '狭义相对论', en: 'Special relativity', vi: "Thuyết tương đối hẹp" } },
        { year: 1915, event: { zh: '广义相对论场方程', en: 'Einstein field equations', vi: "Phương trình trường Einstein" } },
        { year: 1925, event: { zh: '量子力学矩阵力学/波动力学', en: 'Matrix/wave mechanics of QM', vi: "Cơ học ma trận và sóng của lượng tử" } }
      ],
      tags: ['mathphysics']
    },
    principles: [
      { id: 'p1', title: { zh: '诺特定理', en: "Noether's Theorem", vi: "Định lý Noether" }, description: { zh: '每个连续对称性对应一个守恒量', en: 'Each continuous symmetry corresponds to a conserved quantity', vi: "Mỗi đối xứng liên tục tương ứng với một đại lượng bảo toàn" }, importance: 3 },
      { id: 'p2', title: { zh: '最小作用量原理', en: 'Principle of Least Action', vi: "Nguyên lý tác dụng tối thiểu" }, description: { zh: '物理系统的真实路径使作用量取极值', en: 'The true path of a physical system extremizes the action', vi: "Quỹ đạo thực của hệ vật lý làm dừng phiếm hàm tác dụng" }, importance: 3 }
    ],
    formulas: [
      { id: 'schrodinger', name: { zh: '薛定谔方程', en: "Schrodinger Equation", vi: "Phương trình Schrödinger" }, latex: 'i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi', description: { zh: '非相对论量子力学的核心方程', en: 'Core equation of non-relativistic QM', vi: "Phương trình cốt lõi của cơ học lượng tử phi tương đối tính" }, variables: [], applications: [{ zh: '原子物理学', en: 'Atomic physics', vi: "Vật lý nguyên tử" }], difficulty: 5 },
      { id: 'einstein-eq', name: { zh: '爱因斯坦场方程', en: 'Einstein Field Equation', vi: "Phương trình trường Einstein" }, latex: 'G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4}T_{\\mu\\nu}', description: { zh: '广义相对论的核心方程', en: 'Core equation of general relativity', vi: "Phương trình cốt lõi của tương đối rộng" }, variables: [], applications: [{ zh: '宇宙学/黑洞', en: 'Cosmology/black holes', vi: "Vũ trụ học và lỗ đen" }], difficulty: 5 }
    ],
    pioneers: [
      { id: 'newton-mp', name: 'Isaac Newton', nameZh: '牛顿', birthYear: 1643, deathYear: 1727, nationality: '英国', nationalityNames: {"zh": "英国", "en": "United Kingdom", "vi": "Anh"}, contributions: { zh: '经典力学与万有引力', en: 'Classical mechanics & gravity', vi: "Cơ học cổ điển và hấp dẫn" } },
      { id: 'einstein-mp', name: 'Albert Einstein', nameZh: '爱因斯坦', birthYear: 1879, deathYear: 1955, nationality: '德国/美国', nationalityNames: {"zh": "德国/美国", "en": "Germany / United States", "vi": "Đức / Hoa Kỳ"}, contributions: { zh: '相对论', en: 'Theory of relativity', vi: "Thuyết tương đối" } },
      { id: 'dirac-mp', name: 'Paul Dirac', nameZh: '保罗·狄拉克', birthYear: 1902, deathYear: 1984, nationality: '英国', nationalityNames: {"zh": "英国", "en": "United Kingdom", "vi": "Anh"}, contributions: { zh: '量子力学与狄拉克方程', en: 'QM and Dirac equation', vi: "Cơ học lượng tử và phương trình Dirac" } }
    ], figures: [], references: [],
    relatedFields: ['analysis', 'geometry', 'algebra'], applications: ['physics', 'cosmology', 'quantum-computing', 'materials-science'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 经典力学的数学
  { id: 'classical-mechanics-math', slug: 'classical-mechanics-math',
    names: { zh: '经典力学数学', en: 'Mathematical Classical Mechanics', vi: "Cơ học cổ điển toán học" },
    descriptions: { zh: '经典力学的严谨数学表述：拉格朗日力学和哈密顿力学。', en: 'Rigorous mathematical formulation: Lagrangian and Hamiltonian mechanics.', vi: "Diễn đạt toán chặt chẽ bằng cơ học Lagrange và Hamilton." },
    level: 2, parentId: 'mathphysics', childIds: [],
    position: [4, 14, 16], size: 'medium', color: '#f43f5e',
    tags: ['mathphysics'],
    basics: { definition: { zh: '用变分法和辛几何的语言重新表述牛顿力学。', en: 'Reformulating Newtonian mechanics using variational calculus and symplectic geometry.', vi: "Viết lại cơ học Newton bằng biến phân và hình học symplectic." }, scope: { zh: '拉格朗日量、欧拉-拉格朗日方程、哈密顿正则方程、辛结构、Noether定理。', en: 'Lagrangian, Euler-Lagrange equations, Hamilton canonical equations, symplectic structure, Noether theorem.', vi: "Hàm Lagrange, Euler–Lagrange, phương trình chính tắc Hamilton, cấu trúc symplectic, định lý Noether." }, importance: 4, difficulty: 4, history: [
      { year: 1788, event: { zh: '拉格朗日《分析力学》', en: "Lagrange's Analytique Mécanique", vi: "Mécanique analytique của Lagrange" } },
      { year: 1833, event: { zh: '哈密顿正则方程', en: 'Hamilton canonical equations', vi: "Phương trình chính tắc Hamilton" } }
    ], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['mathphysics', 'variational-calculus', 'symplectic-geometry'], applications: ['celestial-mechanics', 'robotics', 'molecular-dynamics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 量子力学数学
  { id: 'quantum-math', slug: 'quantum-math',
    names: { zh: '量子力学数学基础', en: 'Foundations of Quantum Mechanics', vi: "Nền tảng cơ học lượng tử" },
    descriptions: { zh: '量子力学的数学基础：希尔伯特空间、算子理论、谱理论。', en: 'Mathematical foundations of QM: Hilbert spaces, operator theory, spectral theory.', vi: "Nền tảng toán của lượng tử: không gian Hilbert, toán tử, lý thuyết phổ." },
    level: 2, parentId: 'mathphysics', childIds: [],
    position: [8, 13, 21], size: 'large', color: '#e11d48',
    tags: ['mathphysics'],
    basics: { definition: { zh: '量子力学的数学框架建立在泛函分析和算子理论基础之上。', en: 'The mathematical framework of QM is built on functional analysis and operator theory.', vi: "Khuôn khổ toán của lượng tử dựa trên giải tích hàm và toán tử." }, scope: { zh: '希尔伯特空间、自伴算子、谱分解、路径积分、密度矩阵、纠缠理论。', en: 'Hilbert space, self-adjoint operators, spectral decomposition, path integrals, density matrices, entanglement.', vi: "Không gian Hilbert, toán tử tự liên hợp, phân rã phổ, tích phân đường, ma trận mật độ, rối lượng tử." }, importance: 5, difficulty: 5, history: [
      { year: 1925, event: { zh: '海森堡矩阵力学', en: 'Heisenberg matrix mechanics', vi: "Cơ học ma trận Heisenberg" } },
      { year: 1926, event: { zh: '薛定谔波动力学', en: "Schrodinger wave mechanics", vi: "Cơ học sóng Schrödinger" } },
      { year: 1932, event: { zh: '冯·诺依曼量子力学公理化', en: "von Neumann's axioms of QM", vi: "Tiên đề lượng tử của von Neumann" }, figure: 'von Neumann' }
    ], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['mathphysics', 'functional-analysis'], applications: ['quantum-computing', 'condensed-matter', 'particle-physics', 'quantum-info'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 相对论数学
  { id: 'relativity-math', slug: 'relativity-math',
    names: { zh: '相对论数学', en: 'Mathematics of Relativity', vi: "Toán học của thuyết tương đối" },
    descriptions: { zh: '狭义和广义相对论的几何基础：闵可夫斯基时空、黎曼几何。', en: 'Geometric foundations of special/general relativity: Minkowski spacetime, Riemannian geometry.', vi: "Nền tảng hình học của tương đối hẹp và rộng: không–thời gian Minkowski, hình học Riemann." },
    level: 2, parentId: 'mathphysics', childIds: [],
    position: [2, 7, 22], size: 'medium', color: '#f43f5e',
    tags: ['mathphysics'],
    basics: { definition: { zh: '相对论的数学基础涉及伪黎曼几何和张量分析。', en: 'The math foundation of relativity involves pseudo-Riemannian geometry and tensor analysis.', vi: "Nền tảng toán gồm hình học giả Riemann và giải tích tensor." }, scope: { zh: '洛伦兹变换、张量分析、黎曼度量、爱因斯坦场方程、测地线、黑洞数学。', en: 'Lorentz transformation, tensor analysis, Riemann metric, Einstein field equations, geodesics, black hole mathematics.', vi: "Biến đổi Lorentz, giải tích tensor, metric Riemann, phương trình Einstein, trắc địa, toán lỗ đen." }, importance: 5, difficulty: 5, history: [
      { year: 1908, event: { zh: '闵可夫斯基四维时空', en: "Minkowski's four-dimensional spacetime", vi: "Không–thời gian bốn chiều Minkowski" } },
      { year: 1915, event: { zh: '广义相对论完整理论', en: 'Complete general relativity theory', vi: "Hoàn thiện thuyết tương đối rộng" } }
    ], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['mathphysics', 'differential-geometry'], applications: ['cosmology', 'gps-navigation', 'gravitational-waves', 'black-holes'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 统计物理数学
  { id: 'statistical-physics-math', slug: 'statistical-physics-math',
    names: { zh: '统计力学数学', en: 'Mathematical Statistical Mechanics', vi: "Cơ học thống kê toán học" },
    descriptions: { zh: '从微观规律推导宏观热力学性质的数学理论。', en: 'Mathematical theory deriving macroscopic thermodynamics from microscopic laws.', vi: "Suy ra nhiệt động lực học vĩ mô từ quy luật vi mô." },
    level: 2, parentId: 'mathphysics', childIds: [],
    position: [10, 5, 15], size: 'medium', color: '#f43f5e',
    tags: ['mathphysics'],
    basics: { definition: { zh: '统计力学用概率论和统计方法解释大量粒子系统的宏观行为。', en: 'Statistical mechanics uses probability and statistics to explain macroscopic behavior of many-particle systems.', vi: "Dùng xác suất và thống kê giải thích hành vi vĩ mô của hệ nhiều hạt." }, scope: { zh: '系综理论、配分函数、刘维尔定理、遍历理论、相变临界现象、重整化群。', en: 'Ensemble theory, partition function, Liouville theorem, ergodic theory, phase transitions, renormalization group.', vi: "Lý thuyết tập hợp thống kê, hàm phân hoạch, định lý Liouville, ergodic, chuyển pha, nhóm tái chuẩn hóa." }, importance: 4, difficulty: 5, history: [
      { year: 1860, event: { zh: '麦克斯韦速度分布', en: 'Maxwell velocity distribution', vi: "Phân bố vận tốc Maxwell" } },
      { year: 1902, event: { zh: '吉布斯统计系综', en: "Gibbs's statistical ensembles", vi: "Các tập hợp thống kê Gibbs" } }
    ], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['mathphysics', 'probability', 'measure-theory'], applications: ['thermodynamics', 'materials-science', 'plasma-physics', 'complex-systems'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 弦理论数学
  { id: 'string-theory-math', slug: 'string-theory-math',
    names: { zh: '弦理论的数学框架', en: 'Mathematics of String Theory', vi: "Toán học của lý thuyết dây" },
    descriptions: { zh: '弦理论所涉及的复杂数学结构：共形场论、模形式、Calabi-Yau流形。', en: 'Complex math structures in string theory: CFT, modular forms, Calabi-Yau manifolds.', vi: "Cấu trúc toán trong lý thuyết dây: trường bảo giác, dạng modular, đa tạp Calabi–Yau." },
    level: 2, parentId: 'mathphysics', childIds: [],
    position: [0, 15, 20], size: 'medium', color: '#db2777',
    tags: ['mathphysics'],
    basics: { definition: { zh: '弦理论的数学基础涉及高维几何、代数几何和拓扑学的深刻联系。', en: 'String theory involves deep connections between high-dimensional geometry, algebraic geometry, and topology.', vi: "Liên hệ sâu giữa hình học nhiều chiều, hình học đại số và tô pô." }, scope: { zh: '共形场论、拓扑弦论、镜像对称性、Calabi-Yau流形、AdS/CFT对应。', en: 'Conformal field theory, topological string theory, mirror symmetry, Calabi-Yau manifolds, AdS/CFT correspondence.', vi: "Lý thuyết trường bảo giác, dây tô pô, đối xứng gương, Calabi–Yau, tương ứng AdS/CFT." }, importance: 4, difficulty: 5, history: [
      { year: 1984, event: { zh: '第一次弦论革命', en: 'First string revolution', vi: "Cuộc cách mạng dây lần thứ nhất" } },
      { year: 1995, event: { zh: '第二次弦论革命/M理论', en: 'Second string revolution / M-theory', vi: "Cuộc cách mạng dây lần thứ hai và lý thuyết M" } }
    ], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['mathphysics', 'algebraic-geometry', 'topology'], applications: ['theoretical-physics', 'unified-field-theory'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 场论数学
  { id: 'field-theory-math', slug: 'field-theory-math',
    names: { zh: '量子场论数学', en: 'Quantum Field Theory Mathematics', vi: "Toán học của lý thuyết trường lượng tử" },
    descriptions: { zh: 'QFT的数学基础：路径积分、重整化、规范理论。', en: 'Mathematical foundations of QFT: path integrals, renormalization, gauge theory.', vi: "Nền tảng toán: tích phân đường, tái chuẩn hóa và lý thuyết gauge." },
    level: 2, parentId: 'mathphysics', childIds: [],
    position: [12, 11, 18], size: 'medium', color: '#e11d48',
    tags: ['mathphysics'],
    basics: { definition: { zh: 'QFT结合了量子力学和狭义相对论，其数学基础仍在发展中。', en: 'QFT combines quantum mechanics and special relativity; its mathematical foundations are still developing.', vi: "Kết hợp cơ học lượng tử với tương đối hẹp; nền tảng toán vẫn đang phát triển." }, scope: { zh: '路径积分形式体系、费曼图、重整化群、规范场论、标准模型数学。', en: 'Path integral formulation, Feynman diagrams, renormalization groups, gauge field theory, Standard Model mathematics.', vi: "Tích phân đường, sơ đồ Feynman, nhóm tái chuẩn hóa, trường gauge, toán của Mô hình chuẩn." }, importance: 5, difficulty: 5, history: [
      { year: 1949, event: { zh: '费曼路径积分', en: "Feynman's path integral", vi: "Tích phân đường Feynman" } },
      { year: 1954, event: { zh: '杨-Mills规范场论', en: 'Yang-Mills gauge theory', vi: "Lý thuyết gauge Yang–Mills" } }
    ], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['mathphysics', 'quantum-math'], applications: ['particle-physics', 'condensed-matter', 'qft-cosmology'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 流体力学数学
  { id: 'fluid-mechanics-math', slug: 'fluid-mechanics-math',
    names: { zh: '流体力学数学', en: 'Mathematical Fluid Mechanics', vi: "Cơ học chất lưu toán học" },
    descriptions: { zh: '流体运动的PDE数学理论：Navier-Stokes方程的存在性与光滑性。', en: 'PDE theory of fluid motion: existence and smoothness of Navier-Stokes equations.', vi: "Phương trình đạo hàm riêng của dòng chảy: tồn tại và tính trơn của Navier–Stokes." },
    level: 2, parentId: 'mathphysics', childIds: [],
    position: [4, 6, 24], size: 'small', color: '#f43f5e',
    tags: ['mathphysics', 'pde'],
    basics: { definition: { zh: '流体力学数学研究Navier-Stokes方程组的适定性及解的性质。', en: 'Studies well-posedness and solution properties of Navier-Stokes equation systems.', vi: "Nghiên cứu tính đặt đúng và tính chất nghiệm hệ Navier–Stokes." }, scope: { zh: 'NS方程存在唯一性问题(千禧年难题)、Euler方程、湍流数学理论、边界层理论。', en: 'NS uniqueness (Millennium Problem), Euler equations, turbulence math theory, boundary layer theory.', vi: "Tính duy nhất Navier–Stokes, Bài toán Thiên niên kỷ, phương trình Euler, toán nhiễu loạn, lớp biên." }, importance: 5, difficulty: 5, history: [
      { year: 1822, event: { zh: 'Navier-Stokes方程', en: 'Navier-Stokes equations', vi: "Phương trình Navier–Stokes" } },
      { year: 2000, event: { zh: '列为千禧年七大难题', en: 'Listed among Millennium Prize Problems', vi: "Được chọn vào các Bài toán Thiên niên kỷ" } }
    ], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['mathphysics', 'pde'], applications: ['aerodynamics', 'oceanography', 'meteorology', 'blood-flow'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 天体物理数学
  { id: 'astrophysics-math', slug: 'astrophysics-math',
    names: { zh: '天体物理数学', en: 'Mathematical Astrophysics', vi: "Vật lý thiên văn toán học" },
    descriptions: { zh: '天体和宇宙尺度物理现象的数学描述。', en: 'Mathematical description of astrophysical and cosmological phenomena.', vi: "Mô tả toán về hiện tượng thiên văn và vũ trụ học." },
    level: 2, parentId: 'mathphysics', childIds: [],
    position: [-2, 14, 25], size: 'small', color: '#f43f5e',
    tags: ['mathphysics'],
    basics: { definition: { zh: '应用微分方程、数值方法和统计方法于天文学问题。', en: 'Applies differential equations, numerical methods, and statistics to astronomical problems.', vi: "Dùng phương trình vi phân, phương pháp số và thống kê giải bài toán thiên văn." }, scope: { zh: '恒星结构与演化、黑洞数学、宇宙学方程、引力波、暗物质/暗能量模型。', en: 'Stellar structure & evolution, black hole math, cosmological equations, gravitational waves, dark matter/energy models.', vi: "Cấu trúc và tiến hóa sao, toán lỗ đen, phương trình vũ trụ, sóng hấp dẫn, vật chất và năng lượng tối." }, importance: 4, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['relativity-math', 'statistical-physics-math', 'numerical-analysis'], applications: ['astronomy', 'cosmology', 'space-mission-planning'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 凝聚态物理数学
  { id: 'condensed-matter-math', slug: 'condensed-matter-math',
    names: { zh: '凝聚态物理数学', en: 'Mathematical Condensed Matter Physics', vi: "Vật lý vật chất ngưng tụ toán học" },
    descriptions: { zh: '固体和液体材料性质的数学理论。', en: 'Mathematical theory of solid and liquid material properties.', vi: "Lý thuyết toán về tính chất vật liệu rắn và lỏng." },
    level: 2, parentId: 'mathphysics', childIds: [],
    position: [14, 8, 20], size: 'small', color: '#e11d48',
    tags: ['mathphysics'],
    basics: { definition: { zh: '凝聚态物理的数学框架包括能带理论和多体物理。', en: 'Mathematical framework includes band theory and many-body physics.', vi: "Khuôn khổ toán gồm lý thuyết vùng năng lượng và vật lý nhiều hạt." }, scope: { zh: 'Bloch定理、能带理论、拓扑绝缘体、Bose-Einstein凝聚、超导BCS理论数学。', en: "Bloch's theorem, band theory, topological insulators, BEC, BCS superconductivity.", vi: "Định lý Bloch, vùng năng lượng, chất cách điện tô pô, ngưng tụ Bose–Einstein, siêu dẫn BCS." }, importance: 4, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['quantum-math', 'mathphysics'], applications: ['semiconductors', 'superconductors', 'novel-materials', 'quantum-devices'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 辛几何与数学物理
  { id: 'symplectic-physics', slug: 'symplectic-physics',
    names: { zh: '辛几何与数学物理', en: 'Symplectic Geometry & Mathematical Physics', vi: "Hình học symplectic và vật lý toán" },
    descriptions: { zh: '辛几何在哈密顿力学和量子化中的应用。', en: 'Applications of symplectic geometry in Hamiltonian mechanics and quantization.', vi: "Ứng dụng symplectic trong cơ học Hamilton và lượng tử hóa." },
    level: 2, parentId: 'mathphysics', childIds: [],
    position: [8, 16, 26], size: 'small', color: '#f43f5e',
    tags: ['mathphysics', 'differential-geometry'],
    basics: { definition: { zh: '辛几何提供哈密顿力学的自然几何框架，也是量子化和规范场论的重要工具。', en: 'Symplectic geometry provides natural geometric framework for Hamiltonian mechanics, important in quantization and gauge theory.', vi: "Cung cấp khuôn khổ tự nhiên cho cơ học Hamilton, quan trọng trong lượng tử hóa và gauge." }, scope: { zh: '辛流形、辛叶层、正则坐标、几何量化、辛拓扑。', en: 'Symplectic manifolds, foliation, canonical coordinates, geometric quantization, symplectic topology.', vi: "Đa tạp symplectic, phân lá, tọa độ chính tắc, lượng tử hóa hình học, tô pô symplectic." }, importance: 3, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['mathphysics', 'differential-geometry'], applications: ['theoretical-physics', 'mechanics', 'optics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  }
];
