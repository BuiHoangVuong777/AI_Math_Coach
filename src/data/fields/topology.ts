import { FieldNode } from '@/types';

export const topologyFields: FieldNode[] = [
  // ==================== 拓扑学 (主星系) ====================
  {
    id: 'topology', slug: 'topology',
    names: { zh: '拓扑学', en: 'Topology', vi: "Tô pô" },
    descriptions: {
      zh: '研究几何图形在连续形变（拉伸、弯曲但不撕裂或粘合）下保持不变的性质的数学分支。',
      en: 'The branch of mathematics studying properties of geometric shapes preserved under continuous deformations (stretching, bending, but not tearing or gluing).', vi: "Nghiên cứu tính chất hình giữ nguyên qua biến dạng liên tục như kéo giãn, uốn cong, không cắt hay dán."
    },
    level: 1, parentId: null,
    childIds: ['general-topology', 'algebraic-topology', 'differential-topology', 'geometric-topology', 'knot-theory', 'low-dimensional-topology', 'set-theoretic-topology'],
    position: [-8, -2, 14], size: 'large', color: '#ec4899',
    tags: ['topology', 'geometry', 'analysis'],
    basics: {
      definition: { zh: '拓扑学研究空间在连续变换下的不变性质，如连通性、紧致性、同伦型等，被称为"橡皮膜几何"。', en: 'Topology studies properties invariant under continuous transformations — connectivity, compactness, homotopy type — often called "rubber-sheet geometry".', vi: "Nghiên cứu tính chất bất biến qua biến đổi liên tục: liên thông, compact, kiểu đồng luân; thường gọi là hình học màng cao su." },
      scope: { zh: '包括一般拓扑、代数拓扑、微分拓扑、几何拓扑、纽结理论等分支。', en: 'Includes general topology, algebraic topology, differential topology, geometric topology, knot theory, etc.', vi: "Tô pô đại cương, đại số, vi phân, hình học và lý thuyết nút." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1736, event: { zh: '欧拉解决柯尼斯堡七桥问题——图论与拓扑学的萌芽', en: "Euler solves Königsberg seven bridges problem — dawn of graph theory and topology", vi: "Euler giải bài toán bảy cầu Königsberg — khởi nguồn đồ thị và tô pô" } },
        { year: 1895, event: { zh: '庞加莱《位置分析》— 代数拓扑的奠基之作', en: "Poincaré's Analysis Situs — foundation of algebraic topology", vi: "Analysis Situs của Poincaré — nền tảng tô pô đại số" } },
        { year: 1904, event: { zh: '庞加莱猜想提出', en: 'Poincaré conjecture posed', vi: "Phát biểu giả thuyết Poincaré" } },
        { year: 2003, event: { zh: '佩雷尔曼证明庞加莱猜想', en: 'Perelman proves Poincaré conjecture', vi: "Perelman chứng minh giả thuyết Poincaré" } }
      ],
      tags: ['topology']
    },
    principles: [
      { id: 'tp1', title: { zh: '连续性', en: 'Continuity', vi: "Tính liên tục" }, description: { zh: '映射的连续性是拓扑学的核心概念', en: 'Continuity of maps is the central concept of topology', vi: "Tính liên tục của ánh xạ là khái niệm trung tâm của tô pô" }, importance: 3 },
      { id: 'tp2', title: { zh: '同胚不变性', en: 'Homeomorphism Invariance', vi: "Bất biến qua đồng phôi" }, description: { zh: '同胚的空间具有相同的拓扑性质', en: 'Homeomorphic spaces share the same topological properties', vi: "Không gian đồng phôi có cùng tính chất tô pô" }, importance: 3 },
      { id: 'tp3', title: { zh: '紧致性', en: 'Compactness', vi: "Tính compact" }, description: { zh: '有限子覆盖性质，分析学中关键工具', en: 'Finite subcover property, crucial tool in analysis', vi: "Tính chất phủ con hữu hạn, công cụ quan trọng trong giải tích" }, importance: 3 }
    ],
    formulas: [
      {
        id: 'euler-characteristic', name: { zh: '欧拉示性数公式', en: 'Euler Characteristic Formula', vi: "Công thức đặc trưng Euler" },
        latex: '\\chi = V - E + F = 2 - 2g',
        description: { zh: '对于凸多面体或闭曲面：χ = 顶点数 - 棱数 + 面数 = 2 - 2g（g为亏格）', en: 'For convex polyhedra or closed surfaces: χ = V - E + F = 2 - 2g (g = genus)', vi: "Với đa diện lồi hoặc mặt đóng: χ = V - E + F = 2 - 2g, trong đó g là giống của mặt" },
        variables: [{ symbol: 'V', description: { zh: '顶点数', en: 'Vertices', vi: "Các đỉnh" } }, { symbol: 'E', description: { zh: '棱数', en: 'Edges', vi: "Các cạnh" } }, { symbol: 'F', description: { zh: '面数', en: 'Faces', vi: "Các mặt" } }, { symbol: 'g', description: { zh: '亏格', en: 'Genus', vi: "Giống" } }, { symbol: '\\chi', description: { zh: '欧拉示性数', en: 'Euler characteristic', vi: "Đặc trưng Euler" } }],
        applications: [{ zh: '多面体分类、曲面拓扑分类', en: 'Polyhedron classification, surface topological classification', vi: "Phân loại đa diện và phân loại tô pô của mặt" }],
        difficulty: 3
      }
    ],
    pioneers: [
      { id: 'euler', name: 'Leonhard Euler', nameZh: '莱昂哈德·欧拉', birthYear: 1707, deathYear: 1783, nationality: '瑞士/俄国', nationalityNames: {"zh": "瑞士/俄国", "en": "Switzerland / Russia", "vi": "Thụy Sĩ / Nga"}, contributions: { zh: '柯尼斯堡七桥问题、欧拉示性数、多面体公式', en: 'Königsberg bridges, Euler characteristic, polyhedral formula', vi: "Bảy cầu Königsberg, đặc trưng Euler, công thức đa diện" } },
      { id: 'poincare', name: 'Henri Poincaré', nameZh: '亨利·庞加莱', birthYear: 1854, deathYear: 1912, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '代数拓扑创始人、庞加莱猜想、基本群', en: 'Founder of algebraic topology, Poincaré conjecture, fundamental group', vi: "Sáng lập tô pô đại số, giả thuyết Poincaré, nhóm cơ bản" } },
      { id: 'noether', name: 'Emmy Noether', nameZh: '艾米·诺特', birthYear: 1882, deathYear: 1935, nationality: '德国/美国', nationalityNames: {"zh": "德国/美国", "en": "Germany / United States", "vi": "Đức / Hoa Kỳ"}, contributions: { zh: '诺特同调代数基础、群与拓扑的关系', en: 'Homological algebra foundations, group-topology relations', vi: "Nền tảng đại số đồng điều, quan hệ giữa nhóm và tô pô" } },
      { id: 'perelman', name: 'Grigori Perelman', nameZh: '格里戈里·佩雷尔曼', birthYear: 1966, nationality: '俄罗斯', nationalityNames: {"zh": "俄罗斯", "en": "Russia", "vi": "Nga"}, contributions: { zh: '证明庞加莱猜想（里奇流方法）', en: 'Proved Poincaré conjecture via Ricci flow', vi: "Chứng minh giả thuyết Poincaré bằng dòng Ricci" } }
    ],
    figures: [], references: [],
    relatedFields: ['geometry', 'analysis', 'algebra'], applications: ['physics', 'cs', 'data-analysis', 'materials-science'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 一般拓扑 ====================
  {
    id: 'general-topology', slug: 'general-topology',
    names: { zh: '一般拓扑学', en: 'General Topology / Point-Set Topology', vi: "Tô pô đại cương (tô pô tập điểm)" },
    descriptions: { zh: '以集合论为基础建立拓扑空间的公理体系，研究连续性、收敛性、紧致性等基本概念。', en: 'Establishes the axiomatic framework of topological spaces based on set theory; studies continuity, convergence, compactness.', vi: "Xây dựng tiên đề không gian tô pô từ tập hợp, nghiên cứu liên tục, hội tụ và compact." },
    level: 2, parentId: 'topology', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#f472b6',
    tags: ['topology', 'set-theory'],
    basics: {
      definition: { zh: '一般拓扑用开集公理定义拓扑空间，是整个拓扑学的语言基础。', en: 'General topology defines topological spaces via open set axioms, serving as the language foundation for all of topology.', vi: "Định nghĩa không gian tô pô bằng tiên đề tập mở, tạo ngôn ngữ nền tảng cho toàn bộ tô pô." },
      scope: { zh: '拓扑空间定义、分离公理、紧致性、连通性、乘积空间、商空间。', en: 'Topological space definitions, separation axioms, compactness, connectedness, product & quotient spaces.', vi: "Không gian tô pô, tiên đề tách, compact, liên thông, không gian tích và thương." },
      importance: 5, difficulty: 3, history: [
        { year: 1906, event: { zh: '弗雷歇引入度量空间', en: 'Fréchet introduces metric spaces', vi: "Fréchet đưa ra không gian metric" } },
        { year: 1914, event: { zh: '豪斯多夫《集合论纲要》— 分离公理', en: "Hausdorff's Mengenlehre — separation axioms", vi: "Mengenlehre của Hausdorff — tiên đề tách" } },
        { year: 1922, event: { zh: '库拉托夫斯基闭包公理', en: 'Kuratowski closure axioms', vi: "Tiên đề bao đóng Kuratowski" } }
      ], tags: []
    },
    principles: [
      { id: 'gt1', title: { zh: '开集公理', en: 'Open Set Axioms', vi: "Tiên đề tập mở" }, description: { zh: '空集和全集为开；任意并集为开；有限交集为开', en: 'Empty set and whole space are open; arbitrary unions are open; finite intersections are open', vi: "Tập rỗng và toàn không gian là mở; hợp tùy ý và giao hữu hạn các tập mở là mở" }, importance: 3 }
    ],
    formulas: [
      { id: 'hausdorff-separation', name: { zh: '豪斯多夫分离性', en: 'Hausdorff Separation', vi: "Tính tách Hausdorff" }, latex: '\\forall x \\neq y, \\exists U_x, U_y: x \\in U_x, y \\in U_y, U_x \\cap U_y = \\emptyset', description: { zh: 'T₂分离公理：不同两点有不相交的开邻域', en: 'T₂ axiom: any two distinct points have disjoint open neighborhoods', vi: "Tiên đề T₂: hai điểm phân biệt có các lân cận mở rời nhau" }, variables: [], applications: [{ zh: '唯一极限保证', en: 'Unique limit guarantee', vi: "Bảo đảm giới hạn duy nhất" }], difficulty: 3 }
    ],
    pioneers: [
      { id: 'hausdorff', name: 'Felix Hausdorff', nameZh: '费利克斯·豪斯多夫', birthYear: 1868, deathYear: 1942, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '分离公理、一般拓扑学奠基人', en: 'Separation axioms, founder of general topology', vi: "Tiên đề tách, sáng lập tô pô đại cương" } }
    ],
    figures: [], references: [],
    relatedFields: ['set-theory', 'analysis'], applications: ['functional-analysis', 'probability'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 代数拓扑 ====================
  {
    id: 'algebraic-topology', slug: 'algebraic-topology',
    names: { zh: '代数拓扑', en: 'Algebraic Topology', vi: "Tô pô đại số" },
    descriptions: { zh: '用代数对象（群、环、模）来刻画和研究拓扑空间的性质，是20世纪数学的核心领域之一。', en: 'Uses algebraic objects (groups, rings, modules) to characterize and study properties of topological spaces.', vi: "Dùng nhóm, vành và môđun mô tả, nghiên cứu tính chất không gian tô pô." },
    level: 1, parentId: null,
    childIds: ['homotopy-theory', 'homology-theory', 'cohomology'],
    position: [-6, 2, 18], size: 'medium', color: '#db2777',
    tags: ['topology', 'algebra'],
    basics: {
      definition: { zh: '代数拓扑将拓扑空间对应到代数不变量（如同调群、同伦群），把几何问题转化为可计算的代数问题。', en: 'Algebraic topology assigns algebraic invariants (homology groups, homotopy groups) to topological spaces, turning geometry into computable algebra.', vi: "Gán bất biến đại số như nhóm đồng điều và đồng luân cho không gian, chuyển bài toán hình học sang tính toán đại số." },
      scope: { zh: '基本群、覆盖空间、同调论、上同调论、同伦论、纤维丛。', en: 'Fundamental group, covering spaces, homology theory, cohomology theory, homotopy theory, fiber bundles.', vi: "Nhóm cơ bản, không gian phủ, đồng điều, đối đồng điều, đồng luân, phân thớ." },
      importance: 5, difficulty: 5, history: [
        { year: 1895, event: { zh: '庞加莱创立基本群与单纯复形', en: 'Poincaré founds fundamental group and simplicial complexes', vi: "Poincaré xây dựng nhóm cơ bản và phức đơn hình" } },
        { year: 1928, event: { zh: '霍普夫映射发现', en: 'Hopf fibration discovery', vi: "Phát hiện phân thớ Hopf" } },
        { year: 1935, event: { zh: '亚历山大-斯潘尼尔-切赫上同调统一', en: 'Alexander-Spanier-Čech cohomology unification', vi: "Thống nhất đối đồng điều Alexander–Spanier–Čech" } },
        { year: 1945, event: { zh: '艾伦伯格-麦克莱恩范畴化工作', en: 'Eilenberg-MacLane categorical work', vi: "Công trình phạm trù của Eilenberg–Mac Lane" } }
      ], tags: []
    },
    principles: [],
    formulas: [
      {
        id: 'fundamental-group-pi1', name: { zh: '基本群 π₁', en: 'Fundamental Group π₁', vi: "Nhóm cơ bản π₁" },
        latex: '\\pi_1(X, x_0) = \\{[\\gamma] : \\gamma: [0,1] \\to X, \\gamma(0)=\\gamma(1)=x_0\\}',
        description: { zh: '空间X在基点x₀处的环路同伦类构成的群，反映空间的基本"孔洞"结构', en: 'Group of homotopy classes of loops in X at basepoint x₀, capturing basic "hole" structure', vi: "Nhóm các lớp đồng luân của vòng trong X tại x₀, mô tả cấu trúc lỗ cơ bản" },
        variables: [{ symbol: 'X', description: { zh: '拓扑空间', en: 'Topological space', vi: "Không gian tô pô" } }, { symbol: 'x_0', description: { zh: '基点', en: 'Base point', vi: "Điểm gốc" } }, { symbol: '\\gamma', description: { zh: '环路', en: 'Loop', vi: "Vòng kín" } }, { symbol: '\\pi_1', description: { zh: '基本群', en: 'Fundamental group', vi: "Nhóm cơ bản" } }],
        applications: [{ zh: '空间分类、覆盖空间、不动点定理', en: 'Space classification, covering spaces, fixed-point theorems', vi: "Phân loại không gian, không gian phủ, định lý điểm bất động" }],
        difficulty: 4
      }
    ],
    pioneers: [
      { id: 'poincare-at', name: 'Henri Poincaré', nameZh: '亨利·庞加莱', birthYear: 1854, deathYear: 1912, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '代数拓扑之父、基本群、贝蒂数', en: 'Father of algebraic topology, fundamental group, Betti numbers', vi: "Đặt nền móng tô pô đại số, nhóm cơ bản, số Betti" } },
      { id: 'hopf', name: 'Heinz Hopf', nameZh: '海因茨·霍普夫', birthYear: 1894, deathYear: 1971, nationality: '德国/瑞士', nationalityNames: {"zh": "德国/瑞士", "en": "Germany / Switzerland", "vi": "Đức / Thụy Sĩ"}, contributions: { zh: '霍普夫不变量、霍普夫映射、纤维丛理论', en: 'Hopf invariant, Hopf fibration, fiber bundle theory', vi: "Bất biến Hopf, phân thớ Hopf, lý thuyết phân thớ" } },
      { id: 'eilenberg', name: 'Samuel Eilenberg', nameZh: '塞缪尔·艾伦伯格', birthYear: 1913, deathYear: 1998, nationality: '波兰/美国', nationalityNames: {"zh": "波兰/美国", "en": "Poland / United States", "vi": "Ba Lan / Hoa Kỳ"}, contributions: { zh: '范畴论、奇异同调、艾伦伯格-麦克莱恩空间', en: 'Category theory, singular homology, Eilenberg-MacLane spaces', vi: "Phạm trù, đồng điều kỳ dị, không gian Eilenberg–Mac Lane" } }
    ],
    figures: [], references: [],
    relatedFields: ['algebra', 'topology', 'geometry'], applications: ['theoretical-physics', 'string-theory', 'data-analysis'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 微分拓扑 ====================
  {
    id: 'differential-topology', slug: 'differential-topology',
    names: { zh: '微分拓扑', en: 'Differential Topology', vi: "Tô pô vi phân" },
    descriptions: { zh: '研究微分流形及其间的光滑映射的性质，关注微分结构的整体性质而非局部计算。', en: 'Studies differentiable manifolds and smooth maps between them, focusing on global differential structures rather than local calculus.', vi: "Nghiên cứu đa tạp khả vi và ánh xạ trơn, chú trọng cấu trúc vi phân toàn cục thay vì vi tích phân địa phương." },
    level: 2, parentId: 'topology', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#ec4899',
    tags: ['topology', 'analysis', 'geometry'],
    basics: {
      definition: { zh: '微分拓扑处理具有光滑结构的流形上的全局问题，如嵌入、浸入、横截性和莫尔斯理论。', en: 'Differential topology deals with global problems on smoothly structured manifolds: embeddings, immersions, transversality, Morse theory.', vi: "Bài toán toàn cục trên đa tạp trơn: nhúng, dìm, tính ngang và lý thuyết Morse." },
      scope: { zh: '光滑流形、切丛与余切丛、向量场、莫尔斯理论、横截性、协边理论。', en: 'Smooth manifolds, tangent/cotangent bundles, vector fields, Morse theory, transversality, cobordism theory.', vi: "Đa tạp trơn, bó tiếp xúc và đối tiếp xúc, trường vectơ, Morse, tính ngang, lý thuyết đối biên." },
      importance: 4, difficulty: 5, history: [
        { year: 1930, event: { zh: '惠特尼嵌入定理', en: "Whitney embedding theorem", vi: "Định lý nhúng Whitney" } },
        { year: 1934, event: { zh: '莫斯函数理论', en: 'Morse function theory', vi: "Lý thuyết hàm Morse" } },
        { year: 1956, event: { zh: '米尔诺发现怪球（28号球面）', en: "Milnor's exotic sphere S⁷ (exotic smooth structure)", vi: "Mặt cầu ngoại lai S⁷ của Milnor với cấu trúc trơn ngoại lai" } }
      ], tags: []
    },
    principles: [
      { id: 'dt1', title: { zh: '萨德引理', en: "Sard's Theorem", vi: "Định lý Sard" }, description: { zh: '光滑映射的临界值集测度为零', en: 'Critical values of a smooth map form a measure-zero set', vi: "Giá trị tới hạn của ánh xạ trơn tạo thành tập có độ đo 0" }, importance: 3 },
      { id: 'dt2', title: { zh: '横截性定理', en: 'Transversality Theorem', vi: "Định lý tính ngang" }, description: { zh: '映射可被小摄动使其与某子流形横截', en: 'Maps can be slightly perturbed to become transverse to a given submanifold', vi: "Có thể nhiễu nhỏ ánh xạ để nó ngang với đa tạp con cho trước" }, importance: 3 }
    ],
    formulas: [],
    pioneers: [
      { id: 'whitney', name: 'Hassler Whitney', nameZh: '哈斯勒·惠特尼', birthYear: 1907, deathYear: 1989, nationality: '美国', nationalityNames: {"zh": "美国", "en": "United States", "vi": "Hoa Kỳ"}, contributions: { zh: '微分拓扑奠基人、嵌入定理、纤维丛', en: 'Founder of differential topology, embedding theorem, fiber bundles', vi: "Sáng lập tô pô vi phân, định lý nhúng, phân thớ" } },
      { id: 'milnor', name: 'John Milnor', nameZh: '约翰·米尔诺', birthYear: 1931, deathYear: undefined, nationality: '美国', nationalityNames: {"zh": "美国", "en": "United States", "vi": "Hoa Kỳ"}, contributions: { zh: '怪球发现、微分拓扑、动力系统', en: 'Exotic spheres, differential topology, dynamical systems', vi: "Mặt cầu ngoại lai, tô pô vi phân, hệ động lực" } },
      { id: 'morse', name: 'Marston Morse', nameZh: '马斯顿·莫尔斯', birthYear: 1892, deathYear: 1977, nationality: '美国', nationalityNames: {"zh": "美国", "en": "United States", "vi": "Hoa Kỳ"}, contributions: { zh: '莫尔斯理论、临界点理论', en: 'Morse theory, critical point theory', vi: "Lý thuyết Morse, điểm tới hạn" } }
    ],
    figures: [], references: [],
    relatedFields: ['differential-geometry', 'analysis', 'physics'], applications: ['mechanics', 'general-relativity', 'robotics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 几何拓扑 ====================
  {
    id: 'geometric-topology', slug: 'geometric-topology',
    names: { zh: '几何拓扑', en: 'Geometric Topology', vi: "Tô pô hình học" },
    descriptions: { zh: '综合运用几何、拓扑和分析的方法研究低维流形的分类与结构，是低维拓扑的重要组成部分。', en: 'Combines geometric, topological, and analytic methods to study classification and structure of low-dimensional manifolds.', vi: "Kết hợp hình học, tô pô và giải tích để phân loại, nghiên cứu đa tạp thấp chiều." },
    level: 2, parentId: 'topology', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#f472b6',
    tags: ['topology', 'geometry'],
    basics: {
      definition: { zh: '几何拓扑关注低维流形（尤其三维及以下）的具体几何结构与分解方式。', en: 'Geometric topology focuses on concrete geometric structures and decomposition methods for low-dimensional manifolds (≤3D).', vi: "Chú trọng cấu trúc hình học cụ thể và phân rã của đa tạp từ ba chiều trở xuống." },
      scope: { zh: '三维流形几何化、双曲几何、海加德分裂、曲面映射类群、四维流形。', en: '3-manifold geometrization, hyperbolic geometry, Heegaard splittings, mapping class groups, 4-manifolds.', vi: "Hình học hóa đa tạp 3 chiều, hình học hyperbolic, phân rã Heegaard, nhóm lớp ánh xạ, đa tạp 4 chiều." },
      importance: 4, difficulty: 5, history: [
        { year: 1978, event: { zh: '瑟斯顿几何化猜想', en: 'Thurston geometrization conjecture', vi: "Giả thuyết hình học hóa Thurston" } },
        { year: 1982, event: { zh: '唐纳森规范场论应用于四维流形', en: "Donaldson uses gauge theory on 4-manifolds", vi: "Donaldson dùng gauge nghiên cứu đa tạp 4 chiều" } },
        { year: 2003, event: { zh: '哈密尔顿-佩雷尔曼完成几何化证明', en: 'Hamilton-Perelman complete geometrization proof', vi: "Hamilton và Perelman hoàn thành chứng minh hình học hóa" } }
      ], tags: []
    },
    principles: [],
    formulas: [],
    pioneers: [
      { id: 'thurston', name: 'William Thurston', nameZh: '威廉·瑟斯顿', birthYear: 1946, deathYear: 2012, nationality: '美国', nationalityNames: {"zh": "美国", "en": "United States", "vi": "Hoa Kỳ"}, contributions: { zh: '几何化猜想、双曲三维流形、叶状结构', en: 'Geometrization conjecture, hyperbolic 3-manifolds, foliations', vi: "Giả thuyết hình học hóa, đa tạp hyperbolic 3 chiều, phân lá" } },
      { id: 'donaldson', name: 'Simon Donaldson', nameZh: '西蒙·唐纳森', birthYear: 1957, nationality: '英国', nationalityNames: {"zh": "英国", "en": "United Kingdom", "vi": "Anh"}, contributions: { zh: '四维流形的唐纳森理论', en: "Donaldson theory of 4-manifolds", vi: "Lý thuyết Donaldson về đa tạp 4 chiều" } }
    ],
    figures: [], references: [],
    relatedFields: ['differential-geometry', 'low-dimensional-topology'], applications: ['quantum-field-theory', 'condensed-matter'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 纽结理论 ====================
  {
    id: 'knot-theory', slug: 'knot-theory',
    names: { zh: '纽结理论', en: 'Knot Theory', vi: "Lý thuyết nút" },
    descriptions: { zh: '研究三维空间中闭曲线（纽结）的分类与不变量，是连接拓扑学与分子生物学的桥梁。', en: 'Studies classification and invariants of closed curves (knots) in ℝ³, bridging topology with molecular biology.', vi: "Nghiên cứu phân loại và bất biến của đường cong kín (nút) trong ℝ³, liên hệ tô pô với sinh học phân tử." },
    level: 2, parentId: 'topology', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#f9a8d4',
    tags: ['topology', 'applied-math'],
    basics: {
      definition: { zh: '纽结理论研究圆周S¹在R³中的嵌入的同痕分类，核心问题是区分不等价的纽结。', en: 'Knot theory studies isotopy classes of embeddings of S¹ in ℝ³; the central problem is distinguishing inequivalent knots.', vi: "Nghiên cứu lớp đồng vị của phép nhúng S¹ vào ℝ³; trọng tâm là phân biệt nút không tương đương." },
      scope: { zh: '纽结与链环、亚历山大多项式、琼斯多项式、纽结群、辫子群。', en: 'Knots & links, Alexander polynomial, Jones polynomial, knot groups, braid groups.', vi: "Nút và liên kết, đa thức Alexander và Jones, nhóm nút, nhóm bện." },
      importance: 4, difficulty: 4, history: [
        { year: 1867, event: { zh: '泰特列表式表（物理中的纽结）', en: "Tait's tables (knots in physics)", vi: "Bảng nút của Tait trong vật lý" } },
        { year: 1928, event: { zh: '亚历山大多项式发明', en: 'Alexander polynomial invented', vi: "Phát minh đa thức Alexander" } },
        { year: 1984, event: { zh: '琼斯多项式革命性发现', en: 'Jones polynomial revolutionary discovery', vi: "Phát hiện đột phá đa thức Jones" } },
        { year: 1988, event: { zh: '瓦夫里克-菲尔德曼不变量', en: 'Vassiliev invariants / finite-type invariants', vi: "Bất biến Vassiliev và bất biến loại hữu hạn" } }
      ], tags: []
    },
    principles: [],
    formulas: [
      {
        id: 'jones-polynomial', name: { zh: '琼斯多项式 skein 关系', en: 'Jones Polynomial Skein Relation', vi: "Quan hệ skein của đa thức Jones" },
        latex: 't^{-1}V(L_+) - tV(L_-) + (t^{-1/2}-t^{1/2})V(L_0) = 0',
        description: { zh: '琼斯多项式的skein关系，通过三种局部变化递归定义多项式', en: 'The skein relation defining Jones polynomial recursively through three local changes', vi: "Quan hệ xác định đệ quy đa thức Jones qua ba thay đổi cục bộ" },
        variables: [{ symbol: 'L_+', description: { zh: '正交叉', en: 'Positive crossing', vi: "Giao cắt dương" } }, { symbol: 'L_-', description: { zh: '负交叉', en: 'Negative crossing', vi: "Giao cắt âm" } }, { symbol: 'L_0', description: { zh: '消交叉', en: 'Smoothing', vi: "Làm trơn giao cắt" } }],
        applications: [{ zh: '纽结分类、DNA拓扑学、量子统计力学', en: 'Knot classification, DNA topology, quantum statistical mechanics', vi: "Phân loại nút, tô pô DNA, cơ học thống kê lượng tử" }],
        difficulty: 4
      }
    ],
    pioneers: [
      { id: 'tait', name: 'Peter Guthrie Tait', nameZh: '彼得·格斯里·泰特', birthYear: 1831, deathYear: 1901, nationality: '英国', nationalityNames: {"zh": "英国", "en": "United Kingdom", "vi": "Anh"}, contributions: { zh: '早期纽结列表、交替纽结猜想', en: 'Early knot tables, alternating knot conjecture', vi: "Bảng nút đầu tiên, giả thuyết về nút luân phiên" } },
      { id: 'jones', name: 'Vaughan Jones', nameZh: '沃恩·琼斯', birthYear: 1952, nationality: '新西兰', nationalityNames: {"zh": "新西兰", "en": "New Zealand", "vi": "New Zealand"}, contributions: { zh: '琼斯多项式（菲尔兹奖）', en: 'Jones polynomial (Fields Medal)', vi: "Đa thức Jones, Huy chương Fields" } }
    ],
    figures: [], references: [],
    relatedFields: ['low-dimensional-topology', 'algebra'], applications: ['molecular-biology', 'chemistry', 'cryptography'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 低维拓扑 ====================
  {
    id: 'low-dimensional-topology', slug: 'low-dimensional-topology',
    names: { zh: '低维拓扑', en: 'Low-Dimensional Topology', vi: "Tô pô thấp chiều" },
    descriptions: { zh: '专门研究一维、二维、三维和四维流形，这些维度展现出独特的丰富现象和高难度。', en: 'Specializes in 1D, 2D, 3D, and 4D manifolds, which exhibit uniquely rich phenomena and exceptional difficulty.', vi: "Nghiên cứu đa tạp 1, 2, 3, 4 chiều có hiện tượng phong phú và độ khó đặc biệt." },
    level: 2, parentId: 'topology', childIds: [],
    position: [0, 0, 0], size: 'small', color: '#fbcfe8',
    tags: ['topology', 'geometry'],
    basics: {
      definition: { zh: '低维拓扑研究维数≤4的流形，其中二维已完备、三维由几何化解决、四维最为复杂。', en: 'Low-dimensional topology studies manifolds of dimension ≤4: 2D is complete, 3D solved by geometrization, 4D is most complex.', vi: "Nghiên cứu đa tạp chiều ≤4: phân loại 2 chiều hoàn chỉnh, 3 chiều bằng hình học hóa, 4 chiều phức tạp nhất." },
      scope: { zh: '曲面分类、三维流形几何化、四维流形（怪R⁴）、映射类群、辛流形。', en: 'Surface classification, 3-manifold geometrization, 4-manifolds (exotic R⁴), mapping class groups, symplectic manifolds.', vi: "Phân loại mặt, hình học hóa 3 chiều, đa tạp 4 chiều (R⁴ ngoại lai), nhóm lớp ánh xạ, đa tạp symplectic." },
      importance: 4, difficulty: 5, history: [
        { year: 1880, event: { zh: '克莱因瓶与射影平面发现', en: 'Klein bottle & projective plane discovered', vi: "Phát hiện chai Klein và mặt phẳng xạ ảnh" } },
        { year: 2003, event: { zh: '佩雷尔曼证明庞加莱猜想（三维）', en: 'Perelman proves Poincaré conjecture (3D)', vi: "Perelman chứng minh giả thuyết Poincaré 3 chiều" } },
        { year: 2010, event: { zh: '怪R⁴的研究持续深入', en: 'Exotic R⁴ research deepens', vi: "Nghiên cứu R⁴ ngoại lai phát triển" } }
      ], tags: []
    },
    principles: [],
    formulas: [],
    pioneers: [
      { id: 'thurston-ldt', name: 'William Thurston', nameZh: '威廉·瑟斯顿', birthYear: 1946, deathYear: 2012, nationality: '美国', nationalityNames: {"zh": "美国", "en": "United States", "vi": "Hoa Kỳ"}, contributions: { zh: '八种三维几何模型、几何化纲领', en: 'Eight Thurston geometries, geometrization program', vi: "Tám hình học Thurston, chương trình hình học hóa" } },
      { id: 'freedman', name: 'Michael Freedman', nameZh: '迈克尔·弗里德曼', birthYear: 1951, nationality: '美国', nationalityNames: {"zh": "美国", "en": "United States", "vi": "Hoa Kỳ"}, contributions: { zh: '四维庞加莱猜想证明', en: 'Proof of 4D Poincaré conjecture', vi: "Chứng minh giả thuyết Poincaré 4 chiều" } }
    ],
    figures: [], references: [],
    relatedFields: ['geometric-topology', 'knot-theory', 'differential-topology'], applications: ['cosmology', 'quantum-computing'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 集合论拓扑 ====================
  {
    id: 'set-theoretic-topology', slug: 'set-theoretic-topology',
    names: { zh: '集合论拓扑', en: 'Set-Theoretic Topology', vi: "Tô pô tập hợp" },
    descriptions: { zh: '利用集合论的强力工具（基数、序数、选择公理等）研究拓扑空间的各种极端性质。', en: 'Uses powerful tools from set theory (cardinals, ordinals, axiom of choice) to study extreme properties of topological spaces.', vi: "Dùng lực lượng, số thứ tự và tiên đề chọn nghiên cứu tính chất đặc biệt của không gian tô pô." },
    level: 2, parentId: 'topology', childIds: [],
    position: [0, 0, 0], size: 'small', color: '#fce7f3',
    tags: ['topology', 'set-theory', 'logic'],
    basics: {
      definition: { zh: '集合论拓扑探索拓扑空间在ZFC独立命题下的行为，涉及不可度量空间、各种基数的拓扑构造。', en: 'Set-theoretic topology explores behavior of topological spaces under ZFC-independent statements, non-metrizable spaces, cardinal constructions.', vi: "Nghiên cứu không gian dưới mệnh đề độc lập với ZFC, không gian không metric hóa được, phép xây dựng bằng lực lượng." },
      scope: { zh: 'Moore空间、Souslin假设、马丁公理、大基数与拓扑、P-空间、实直线拓扑。', en: 'Moore space, Suslin hypothesis, Martin\'s axiom, large cardinals & topology, P-spaces, real line topology.', vi: "Không gian Moore, giả thuyết Suslin, tiên đề Martin, lực lượng lớn, P-không gian, tô pô đường thẳng thực." },
      importance: 3, difficulty: 5, history: [
        { year: 1948, event: { zh: '杜德克提出Souslin线问题', en: 'Suslin line problem posed', vi: "Đề xuất bài toán đường thẳng Suslin" } },
        { year: 1970, event: { zh: '马丁公理广泛应用', en: "Martin's axiom widely applied", vi: "Tiên đề Martin được dùng rộng rãi" } }
      ], tags: []
    },
    principles: [],
    formulas: [],
    pioneers: [],
    figures: [], references: [],
    relatedFields: ['set-theory', 'general-topology', 'logic'], applications: ['foundations'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 同伦论 ====================
  {
    id: 'homotopy-theory', slug: 'homotopy-theory',
    names: { zh: '同伦论', en: 'Homotopy Theory', vi: "Lý thuyết đồng luân" },
    descriptions: { zh: '研究空间之间连续映射在同伦变形下的等价分类，是现代代数拓扑的核心框架。', en: 'Studies equivalence classes of continuous mappings under homotopic deformation, core framework of modern algebraic topology.', vi: "Nghiên cứu lớp tương đương của ánh xạ liên tục qua biến dạng đồng luân; khuôn khổ cốt lõi của tô pô đại số." },
    level: 2, parentId: 'algebraic-topology', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#be185d',
    tags: ['topology', 'algebra'],
    basics: {
      definition: { zh: '同伦论通过高阶同伦群πₙ来探测空间的孔洞结构，是理解空间形状最精细的工具之一。', en: 'Homotopy theory probes hole structure of spaces via higher homotopy groups πₙ, one of the finest tools for understanding shape.', vi: "Khảo sát cấu trúc lỗ bằng nhóm đồng luân bậc cao πₙ, công cụ tinh tế để hiểu hình dạng." },
      scope: { zh: '同伦群πₙ、CW复形、纤维化、上同伦群、谱、无穷范畴。', en: 'Homotopy groups πₙ, CW complexes, fibrations, cohomotopy, spectra, ∞-categories.', vi: "Nhóm đồng luân πₙ, phức CW, phân thớ, đối đồng luân, phổ, ∞-phạm trù." },
      importance: 5, difficulty: 5, history: [
        { year: 1895, event: { zh: '庞加莱定义基本群π₁', en: 'Poincaré defines fundamental group π₁', vi: "Poincaré định nghĩa nhóm cơ bản π₁" } },
        { year: 1932, event: { zh: '胡列维奇定理', en: 'Hurewicz theorem', vi: "Định lý Hurewicz" } },
        { year: 1945, event: { zh: '艾伦伯格-麦克莱恩空间K(G,n)', en: 'Eilenberg-MacLane spaces K(G,n)', vi: "Không gian Eilenberg–Mac Lane K(G,n)" } },
        { year: 1960, event: { zh: '稳定同伦论发展', en: 'Stable homotopy theory development', vi: "Phát triển đồng luân ổn định" } }
      ], tags: []
    },
    principles: [],
    formulas: [
      {
        id: 'hurewicz-thm', name: { zh: '胡列维奇定理', en: 'Hurewicz Theorem', vi: "Định lý Hurewicz" },
        latex: '\\pi_n(X) \\cong H_n(X), \\quad n \\leq k \\text{ 当 } \\pi_1=\\cdots=\\pi_{k-1}=0', latexLocales: {"zh": "\\pi_n(X) \\cong H_n(X), \\quad n \\leq k \\text{ 当 } \\pi_1=\\cdots=\\pi_{k-1}=0", "en": "\\pi_n(X) \\cong H_n(X), \\quad n \\leq k \\text{ when } \\pi_1=\\cdots=\\pi_{k-1}=0", "vi": "\\pi_n(X) \\cong H_n(X), \\quad n \\leq k \\text{ khi } \\pi_1=\\cdots=\\pi_{k-1}=0"},
        description: { zh: '若前k-1个同伦群平凡，则第k个同伦群同构于第k个同调群', en: 'If first k-1 homotopy groups are trivial, then k-th homotopy ≅ k-th homology', vi: "Nếu k-1 nhóm đồng luân đầu tầm thường thì đồng luân bậc k đẳng cấu với đồng điều bậc k theo điều kiện định lý" },
        variables: [{ symbol: '\\pi_n', description: { zh: 'n阶同伦群', en: 'n-th homotopy group', vi: "Nhóm đồng luân bậc n" } }, { symbol: 'H_n', description: { zh: 'n阶同调群', en: 'n-th homology group', vi: "Nhóm đồng điều bậc n" } }],
        applications: [{ zh: '同伦与同调的联系桥梁', en: 'Bridge between homotopy and homology', vi: "Cầu nối giữa đồng luân và đồng điều" }],
        difficulty: 5
      }
    ],
    pioneers: [
      { id: 'hurewicz', name: 'Witold Hurewicz', nameZh: '维托尔德·胡列维奇', birthYear: 1904, deathYear: 1956, nationality: '波兰/美国', nationalityNames: {"zh": "波兰/美国", "en": "Poland / United States", "vi": "Ba Lan / Hoa Kỳ"}, contributions: { zh: '胡列维奇定理、高阶同伦群', en: 'Hurewicz theorem, higher homotopy groups', vi: "Định lý Hurewicz, nhóm đồng luân bậc cao" } }
    ],
    figures: [], references: [],
    relatedFields: ['homology-theory', 'category-theory'], applications: ['algebraic-k-theory', 'string-theory'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 同调论 ====================
  {
    id: 'homology-theory', slug: 'homology-theory',
    names: { zh: '同调论', en: 'Homology Theory', vi: "Lý thuyết đồng điều" },
    descriptions: { zh: '为每个拓扑空间分配一系列阿贝尔群（同调群），用于计数和描述空间中各维度的"洞"。', en: 'Assigns a sequence of abelian groups (homology groups) to each topological space, counting/describing holes of each dimension.', vi: "Gán dãy nhóm Abel (nhóm đồng điều) cho mỗi không gian tô pô để mô tả lỗ ở từng chiều." },
    level: 2, parentId: 'algebraic-topology', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#9d174d',
    tags: ['topology', 'algebra'],
    basics: {
      definition: { zh: '同调论通过链复形的边界运算构建同调群Hₙ，贝蒂数直接给出各维孔洞的数量。', en: 'Homology theory constructs Hₙ via boundary operators on chain complexes; Betti numbers directly count holes per dimension.', vi: "Xây dựng Hₙ bằng toán tử biên trên phức dây chuyền; số Betti mô tả số lỗ độc lập theo chiều." },
      scope: { zh: '单纯同调、奇异同调、胞腔同调、贝蒂数、欧拉示性数、万有系数定理。', en: 'Simplicial homology, singular homology, cellular homology, Betti numbers, Euler characteristic, universal coefficient theorem.', vi: "Đồng điều đơn hình, kỳ dị, tế bào, số Betti, đặc trưng Euler, định lý hệ số phổ dụng." },
      importance: 5, difficulty: 4, history: [
        { year: 1895, event: { zh: '庞加莱定义单纯同调', en: 'Poincaré defines simplicial homology', vi: "Poincaré định nghĩa đồng điều đơn hình" } },
        { year: 1944, event: { zh: '艾伦伯格-麦克莱恩：奇异同调公理化', en: 'Singular homology axiomatized', vi: "Tiên đề hóa đồng điều kỳ dị" }, figure: 'Eilenberg-MacLane' }
      ], tags: []
    },
    principles: [],
    formulas: [
      {
        id: 'betti-numbers', name: { zh: '贝蒂数与秩', en: 'Betti Numbers and Ranks', vi: "Số Betti và hạng" },
        latex: 'b_n = \\text{rank}(H_n(X)) = \\text{number of } n\\text{-dimensional holes}', latexLocales: {"zh": "b_n = \\text{rank}(H_n(X)) = \\text{number of } n\\text{-dimensional holes}", "en": "b_n = \\text{rank}(H_n(X)) = \\text{number of } n\\text{-dimensional holes}", "vi": "b_n = \\text{rank}(H_n(X)) = \\text{số lỗ } n\\text{ chiều}"},
        description: { zh: 'n阶贝蒂数等于n维同调群的秩，即空间中n维孔洞的数目', en: 'n-th Betti number equals rank of n-th homology group, i.e., number of n-dimensional holes', vi: "Số Betti bậc n bằng hạng nhóm đồng điều bậc n, tức số lỗ độc lập n chiều" },
        variables: [{ symbol: 'b_n', description: { zh: 'n阶贝蒂数', en: 'n-th Betti number', vi: "Số Betti bậc n" } }, { symbol: 'H_n', description: { zh: 'n阶同调群', en: 'n-th homology group', vi: "Nhóm đồng điều bậc n" } }],
        applications: [{ zh: '曲面分类、欧拉特征数计算', en: 'Surface classification, Euler characteristic computation', vi: "Phân loại mặt, tính đặc trưng Euler" }],
        difficulty: 3
      }
    ],
    pioneers: [
      { id: 'bettib', name: 'Enrico Betti', nameZh: '恩里科·贝蒂', birthYear: 1823, deathYear: 1892, nationality: '意大利', nationalityNames: {"zh": "意大利", "en": "Italy", "vi": "Ý"}, contributions: { zh: '贝蒂数命名来源、早期同调思想', en: 'Namesake of Betti numbers, early homology ideas', vi: "Số Betti mang tên ông, tư tưởng đồng điều ban đầu" } }
    ],
    figures: [], references: [],
    relatedFields: ['cohomology', 'homotopy-theory'], applications: ['data-analysis', 'computational-geometry'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 上同调 ====================
  {
    id: 'cohomology', slug: 'cohomology',
    names: { zh: '上同调', en: 'Cohomology', vi: "Đối đồng điều" },
    descriptions: { zh: '同调的对偶理论，赋予额外的环结构和乘积操作（杯积），在现代数学中有更广泛的应用。', en: 'Dual theory to homology, equipped with extra ring structure and cup products; more widely applicable in modern math.', vi: "Lý thuyết đối ngẫu với đồng điều, có thêm cấu trúc vành và tích cup; ứng dụng rộng trong toán hiện đại." },
    level: 2, parentId: 'algebraic-topology', childIds: [],
    position: [0, 0, 0], size: 'small', color: '#831843',
    tags: ['topology', 'algebra'],
    basics: {
      definition: { zh: '上同调群Hⁿ是从链复形对偶化的共链复形导出的函子，天然带有杯积环结构。', en: 'Cohomology groups Hⁿ are functors derived from cochain complexes dualizing chain complexes; naturally carry a cup product ring structure.', vi: "Nhóm Hⁿ từ phức đối dây chuyền, đối ngẫu hóa phức dây chuyền, có cấu trúc vành qua tích cup." },
      scope: { zh: '奇异上同调、切赫上同调、德拉姆上同调、杯积、庞加莱对偶性、上同调运算。', en: 'Singular cohomology, Čech cohomology, de Rham cohomology, cup product, Poincaré duality, cohomology operations.', vi: "Đối đồng điều kỳ dị, Čech, de Rham, tích cup, đối ngẫu Poincaré, phép toán đối đồng điều." },
      importance: 4, difficulty: 5, history: [
        { year: 1935, event: { zh: '亚历山大-斯潘尼尔-切赫上同调', en: 'Alexander-Spanier-Čech cohomology', vi: "Đối đồng điều Alexander–Spanier–Čech" } },
        { year: 1940, event: { zh: '斯廷罗德方幂与上同调运算', en: 'Steenrod squares and cohomology operations', vi: "Bình phương Steenrod và phép toán đối đồng điều" } }
      ], tags: []
    },
    principles: [],
    formulas: [
      {
        id: 'poincare-duality', name: { zh: '庞加莱对偶性', en: 'Poincaré Duality', vi: "Đối ngẫu Poincaré" },
        latex: 'H^k(M) \\cong H_{n-k}(M)',
        description: { zh: 'n维定向闭流形M的第k阶上同调群同构于第(n-k)阶同调群', en: 'For an oriented closed n-manifold M, Hᵏ ≅ H_{n−k}', vi: "Với đa tạp đóng định hướng n chiều M: Hᵏ ≅ H_{n−k}" },
        variables: [{ symbol: 'M', description: { zh: '定向闭流形', en: 'Oriented closed manifold', vi: "Đa tạp đóng định hướng" } }, { symbol: 'n', description: { zh: '流形维数', en: 'Manifold dimension', vi: "Số chiều đa tạp" } }],
        applications: [{ zh: '流形拓扑约束、组合拓扑', en: 'Manifold topological constraints, combinatorial topology', vi: "Ràng buộc tô pô của đa tạp, tô pô tổ hợp" }],
        difficulty: 4
      }
    ],
    pioneers: [],
    figures: [], references: [],
    relatedFields: ['homology-theory', 'differential-geometry'], applications: ['deformation-theory', 'mathematical-physics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  }

];
