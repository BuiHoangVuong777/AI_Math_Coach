import { FieldNode } from '@/types';

export const geometryFields: FieldNode[] = [
  // ==================== 几何学主星系 ====================
  {
    id: 'geometry', slug: 'geometry',
    names: { zh: '几何学', en: 'Geometry', vi: "Hình học" },
    descriptions: {
      zh: '研究空间结构、形状、大小及相对位置的数学分支。从欧几里得的公理化体系到现代的微分与代数几何，几何学始终是理解空间本质的核心工具。',
      en: 'The mathematical study of space structure, shape, size, and relative position. From Euclidean axiomatic systems to modern differential and algebraic geometry, it remains central to understanding the nature of space.', vi: "Nghiên cứu cấu trúc không gian, hình dạng, kích thước và vị trí tương đối; từ tiên đề Euclid tới hình học vi phân và đại số hiện đại."
    },
    level: 1, parentId: null,
    childIds: ['euclidean-geometry', 'non-euclidean', 'projective-geometry', 'analytic-geometry', 'differential-geometry', 'algebraic-geometry', 'discrete-geometry', 'convex-geometry', 'computational-geometry'],
    position: [16, 8, -12], size: 'huge', color: '#06b6d4',
    tags: ['geometry', 'space', 'shape'],
    basics: {
      definition: { zh: '几何学研究点、线、面、体等基本图形及其相互关系，是数学最古老的分支之一。', en: 'Geometry studies basic figures like points, lines, surfaces, and solids and their relationships. One of the oldest branches of mathematics.', vi: "Nghiên cứu điểm, đường, mặt, khối và quan hệ giữa chúng; một trong những nhánh Toán lâu đời nhất." },
      scope: { zh: '包含欧氏几何、非欧几何、射影几何、解析几何、微分几何、代数几何、离散几何、凸几何、计算几何等多个分支。', en: 'Includes Euclidean geometry, non-Euclidean geometry, projective geometry, analytic geometry, differential geometry, algebraic geometry, discrete geometry, convex geometry, and computational geometry.', vi: "Hình học Euclid, phi Euclid, xạ ảnh, giải tích, vi phân, đại số, rời rạc, lồi và tính toán." },
      importance: 5, difficulty: 3,
      history: [
        { year: -300, event: { zh: '欧几里得《几何原本》— 公理化几何奠基', en: "Euclid's Elements — foundation of axiomatic geometry", vi: "Cơ sở của Euclid — nền tảng hình học tiên đề" }, figure: 'euclid' },
        { year: 1637, event: { zh: '笛卡尔创立解析几何', en: 'Descartes founds analytic geometry', vi: "Descartes sáng lập hình học giải tích" }, figure: 'descartes' },
        { year: 1829, event: { zh: '罗巴切夫斯基/波尔约发现双曲几何', en: 'Lobachevsky/Bolyai discover hyperbolic geometry', vi: "Lobachevsky và Bolyai phát hiện hình học hyperbolic" } },
        { year: 1854, event: { zh: '黎曼创立黎曼几何', en: 'Riemann founds Riemannian geometry', vi: "Riemann sáng lập hình học Riemann" }, figure: 'riemann' }
      ],
      tags: ['geometry']
    },
    principles: [
      { id: 'gp1', title: { zh: '公理化方法', en: 'Axiomatic Method', vi: "Phương pháp tiên đề" }, description: { zh: '从不证自明的公理出发，通过逻辑推理导出所有定理。', en: 'Derive all theorems through logical reasoning from self-evident axioms.', vi: "Suy ra định lý bằng lập luận lô-gic từ các tiên đề được chấp nhận" }, importance: 3 },
      { id: 'gp2', title: { zh: '对偶原理', en: 'Duality Principle', vi: "Nguyên lý đối ngẫu" }, description: { zh: '在射影几何中，点和线具有对称的对偶关系。', en: 'In projective geometry, points and lines have symmetric dual relationships.', vi: "Trong hình học xạ ảnh, điểm và đường có quan hệ đối ngẫu đối xứng" }, importance: 2 },
      { id: 'gp3', title: { zh: '不变量理论', en: 'Invariant Theory', vi: "Lý thuyết bất biến" }, description: { zh: '研究在特定变换群下保持不变的几何量。', en: 'Studies geometric quantities that remain unchanged under specific transformation groups.', vi: "Nghiên cứu đại lượng hình học không đổi dưới nhóm biến đổi nhất định" }, importance: 3 }
    ],
    formulas: [
      { id: 'pythagorean', name: { zh: '勾股定理', en: 'Pythagorean Theorem', vi: "Định lý Pythagore" }, latex: 'a^2 + b^2 = c^2', description: { zh: '直角三角形两直角边平方和等于斜边平方', en: 'In a right triangle, the square of the hypotenuse equals the sum of squares of the legs', vi: "Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông" }, variables: [
        { symbol: 'a', description: { zh: '直角边a', en: 'Leg a', vi: "Cạnh góc vuông a" } },
        { symbol: 'b', description: { zh: '直角边b', en: 'Leg b', vi: "Cạnh góc vuông b" } },
        { symbol: 'c', description: { zh: '斜边', en: 'Hypotenuse', vi: "Cạnh huyền" } }
      ], applications: [{ zh: '三角测量、距离计算', en: 'Triangulation, distance calculation', vi: "Đo đạc tam giác, tính khoảng cách" }], difficulty: 1 },
      { id: 'euler-formula-polyhedron', name: { zh: '欧拉多面体公式', en: "Euler's Polyhedron Formula", vi: "Công thức đa diện Euler" }, latex: 'V - E + F = 2', description: { zh: '凸多面体的顶点数减棱数加面数恒为2', en: 'For any convex polyhedron: vertices minus edges plus faces equals 2', vi: "Đa diện lồi có số đỉnh trừ số cạnh cộng số mặt bằng 2" }, variables: [
        { symbol: 'V', description: { zh: '顶点数', en: 'Number of vertices', vi: "Số đỉnh" } },
        { symbol: 'E', description: { zh: '棱数', en: 'Number of edges', vi: "Số cạnh" } },
        { symbol: 'F', description: { zh: '面数', en: 'Number of faces', vi: "Số mặt" } }
      ], applications: [{ zh: '拓扑学基础、多面体分类', en: 'Topology foundations, polyhedron classification', vi: "Nền tảng tô pô, phân loại đa diện" }], difficulty: 2 }
    ],
    pioneers: [
      { id: 'euclid', name: 'Euclid of Alexandria', nameZh: '欧几里得', birthYear: -325, deathYear: -265, nationality: '古希腊/埃及', nationalityNames: {"zh": "古希腊/埃及", "en": "Ancient Greece / Egypt", "vi": "Hy Lạp cổ đại / Ai Cập"}, contributions: { zh: '"几何之父"，《几何原本》建立公理化体系', en: '"Father of Geometry", Elements established axiomatic system', vi: "Được gọi là cha đẻ hình học; tác phẩm Cơ sở xây dựng hệ tiên đề" } },
      { id: 'descartes', name: 'René Descartes', nameZh: '勒内·笛卡尔', birthYear: 1596, deathYear: 1650, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '创立解析几何，将代数方法引入几何', en: 'Founded analytic geometry, introduced algebraic methods to geometry', vi: "Sáng lập hình học giải tích, đưa phương pháp đại số vào hình học" } },
      { id: 'riemann', name: 'Bernhard Riemann', nameZh: '波恩哈德·黎曼', birthYear: 1826, deathYear: 1866, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '黎曼几何创始人，奠定现代微分几何基础', en: 'Founder of Riemannian geometry, laid foundations for modern differential geometry', vi: "Sáng lập hình học Riemann, đặt nền tảng hình học vi phân hiện đại" } },
      { id: 'poincare', name: 'Henri Poincaré', nameZh: '亨利·庞加莱', birthYear: 1854, deathYear: 1912, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '拓扑学先驱，庞加莱猜想，动力系统几何方法', en: 'Pioneer of topology, Poincaré conjecture, geometric methods in dynamics', vi: "Tiên phong tô pô, giả thuyết Poincaré, phương pháp hình học trong động lực học" } },
      { id: 'grothendieck', name: 'Alexander Grothendieck', nameZh: '亚历山大·格罗滕迪克', birthYear: 1928, deathYear: 2014, nationality: '法国/德国', nationalityNames: {"zh": "法国/德国", "en": "France / Germany", "vi": "Pháp / Đức"}, contributions: { zh: '现代代数几何重建者，概型理论，上同调方法', en: 'Rebuilder of modern algebraic geometry, scheme theory, cohomological methods', vi: "Xây dựng lại hình học đại số hiện đại, lược đồ và phương pháp đối đồng điều" } }
    ],
    figures: [], references: [],
    relatedFields: ['algebra', 'analysis', 'topology', 'physics'], applications: ['physics', 'engineering', 'computer-graphics', 'architecture', 'navigation'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 欧几里得几何 ====================
  {
    id: 'euclidean-geometry', slug: 'euclidean-geometry',
    names: { zh: '欧几里得几何', en: 'Euclidean Geometry', vi: "Hình học Euclid" },
    descriptions: {
      zh: '基于欧几里得《几何原本》公理体系的经典几何学，研究平直空间中的点、线、面及其关系。',
      en: 'Classical geometry based on Euclid\'s Elements axiom system, studying points, lines, surfaces and their relations in flat space.', vi: "Hình học cổ điển dựa trên tiên đề trong Cơ sở của Euclid, nghiên cứu điểm, đường, mặt trong không gian phẳng."
    },
    level: 2, parentId: 'geometry', childIds: [],
    position: [0, 0, 0], size: 'large', color: '#22d3ee',
    tags: ['euclidean', 'classical', 'axiomatic'],
    basics: {
      definition: { zh: '建立在五条公设之上的平面和立体几何体系，其中平行公设（第五公设）是其核心特征。', en: 'Plane and solid geometry built on five postulates, with the parallel postulate (5th) as its defining feature.', vi: "Hình học phẳng và không gian dựa trên năm định đề, đặc trưng bởi định đề song song thứ năm." },
      scope: { zh: '平面几何、立体几何、三角形全等与相似、圆的性质、面积与体积计算。', en: 'Plane geometry, solid geometry, triangle congruence & similarity, circle properties, area and volume calculations.', vi: "Hình học phẳng và không gian, tam giác bằng nhau và đồng dạng, đường tròn, tính diện tích và thể tích." },
      importance: 5, difficulty: 2,
      history: [
        { year: -300, event: { zh: '《几何原本》成书', en: "Elements compiled", vi: "Biên soạn tác phẩm Cơ sở" }, figure: 'euclid' },
        { year: 1794, event: { zh: '勒让德《几何原理》', en: "Legendre's Elements of Geometry", vi: "Cơ sở hình học của Legendre" } }
      ],
      tags: ['euclidean']
    },
    principles: [
      { id: 'egp1', title: { zh: '平行公设', en: 'Parallel Postulate', vi: "Định đề song song" }, description: { zh: '过直线外一点有且只有一条平行线', en: 'Given a line and a point not on it, exactly one parallel line exists', vi: "Qua điểm ngoài một đường thẳng có đúng một đường thẳng song song với đường đó" }, importance: 3 },
      { id: 'egp2', title: { zh: '全等公理', en: 'Congruence Axioms', vi: "Tiên đề về hình bằng nhau" }, description: { zh: 'SAS、ASA、SSS等三角形全等判定准则', en: 'Triangle congruence criteria: SAS, ASA, SSS', vi: "Tiêu chí tam giác bằng nhau: cạnh–góc–cạnh, góc–cạnh–góc, cạnh–cạnh–cạnh" }, importance: 2 }
    ],
    formulas: [
      { id: 'triangle-area', name: { zh: '三角形面积（海伦公式）', en: "Heron's Formula", vi: "Công thức Heron" }, latex: 'S = \\sqrt{s(s-a)(s-b)(s-c)}, \\quad s=\\frac{a+b+c}{2}', description: { zh: '已知三边长求三角形面积', en: 'Area of triangle given three side lengths', vi: "Diện tích tam giác theo độ dài ba cạnh" }, variables: [
        { symbol: 'a,b,c', description: { zh: '三边长', en: 'Side lengths', vi: "Độ dài các cạnh" } },
        { symbol: 's', description: { zh: '半周长', en: 'Semiperimeter', vi: "Nửa chu vi" } }
      ], applications: [{ zh: '测量、工程制图', en: 'Surveying, engineering drawing', vi: "Trắc địa, bản vẽ kỹ thuật" }], difficulty: 2 },
      { id: 'circle-area', name: { zh: '圆的面积公式', en: 'Circle Area', vi: "Diện tích hình tròn" }, latex: 'S = \\pi r^2', description: { zh: '圆面积等于圆周率乘以半径平方', en: 'Area of a circle equals pi times radius squared', vi: "Diện tích hình tròn bằng π nhân bình phương bán kính" }, variables: [
        { symbol: 'r', description: { zh: '半径', en: 'Radius', vi: "Bán kính" } }
      ], applications: [{ zh: '圆形设计、面积计算', en: 'Circular design, area calculation', vi: "Thiết kế hình tròn, tính diện tích" }], difficulty: 1 }
    ],
    pioneers: [
      { id: 'euclid', name: 'Euclid of Alexandria', nameZh: '欧几里得', birthYear: -325, deathYear: -265, nationality: '古希腊/埃及', nationalityNames: {"zh": "古希腊/埃及", "en": "Ancient Greece / Egypt", "vi": "Hy Lạp cổ đại / Ai Cập"}, contributions: { zh: '系统化希腊几何知识，建立公理演绎体系', en: 'Systematized Greek geometric knowledge, established axiomatic deductive system', vi: "Hệ thống hóa hình học Hy Lạp, xây dựng hệ suy diễn tiên đề" } },
      { id: 'archimedes', name: 'Archimedes', nameZh: '阿基米德', birthYear: -287, deathYear: -212, nationality: '古希腊/叙拉古', nationalityNames: {"zh": "古希腊/叙拉古", "en": "Ancient Greece / Syracuse", "vi": "Hy Lạp cổ đại / Syracuse"}, contributions: { zh: '穷竭法求面积体积，圆周率近似', en: 'Method of exhaustion for areas/volumes, pi approximation', vi: "Phương pháp vét cạn tính diện tích và thể tích, xấp xỉ π" } }
    ],
    figures: [], references: [],
    relatedFields: ['non-euclidean', 'analytic-geometry'], applications: ['education', 'architecture', 'surveying'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 非欧几何 ====================
  {
    id: 'non-euclidean', slug: 'non-euclidean',
    names: { zh: '非欧几何', en: 'Non-Euclidean Geometry', vi: "Hình học phi Euclid" },
    descriptions: {
      zh: '修改或放弃欧几里得平行公设而产生的几何体系，包括双曲几何和椭圆几何（黎曼几何），是广义相对论的数学基础。',
      en: 'Geometries arising from modifying or rejecting Euclid\'s parallel postulate, including hyperbolic and elliptic geometries. The mathematical foundation of general relativity.', vi: "Hình học từ thay đổi hoặc bác bỏ định đề song song, gồm hyperbolic và elliptic; nền tảng toán của thuyết tương đối rộng."
    },
    level: 2, parentId: 'geometry', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#0891b2',
    tags: ['non-euclidean', 'hyperbolic', 'elliptic'],
    basics: {
      definition: { zh: '否定欧几里得第五公设（平行公设）而建立的几何体系。双曲几何中过直线外一点有无穷多条平行线；椭圆几何中没有平行线。', en: 'Geometric systems that negate Euclid\'s fifth (parallel) postulate. Hyperbolic geometry has infinitely many parallels; elliptic has none.', vi: "Hệ phủ định định đề song song thứ năm: hyperbolic có vô số đường song song qua điểm ngoài, elliptic không có." },
      scope: { zh: '罗巴切夫斯基几何（双曲）、黎曼几何（椭圆/球面）、常曲率空间模型。', en: 'Lobachevskian geometry (hyperbolic), Riemannian geometry (elliptic/spherical), constant curvature models.', vi: "Hình học Lobachevsky (hyperbolic), Riemann (elliptic và cầu), mô hình độ cong hằng." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1829, event: { zh: '罗巴切夫斯基发表非欧几何', en: 'Lobachevsky publishes non-Euclidean geometry', vi: "Lobachevsky công bố hình học phi Euclid" } },
        { year: 1832, event: { zh: '波尔约独立发现双曲几何', en: 'Bolyai independently discovers hyperbolic geometry', vi: "Bolyai độc lập phát hiện hình học hyperbolic" } },
        { year: 1854, event: { zh: '黎曼演讲——扩展到任意维流形', en: "Riemann's lecture — extends to arbitrary manifolds", vi: "Bài giảng Riemann mở rộng sang đa tạp bất kỳ" }, figure: 'riemann' },
        { year: 1915, event: { zh: '爱因斯坦用黎曼几何构建广义相对论', en: 'Einstein uses Riemannian geometry for GR', vi: "Einstein dùng hình học Riemann cho thuyết tương đối rộng" } }
      ],
      tags: ['non-euclidean']
    },
    principles: [
      { id: 'negp1', title: { zh: '角度亏缺与过剩', en: 'Angle Deficit & Excess', vi: "Độ thiếu và độ dư góc" }, description: { zh: '双曲几何中三角形内角和小于180°，椭圆几何中大于180°', en: 'Triangle angle sum < 180° in hyperbolic, > 180° in elliptic', vi: "Tổng góc tam giác nhỏ hơn 180° trong hyperbolic, lớn hơn 180° trong elliptic" }, importance: 3 }
    ],
    formulas: [
      { id: 'gauss-bonnet', name: { zh: '高斯-博内定理', en: 'Gauss-Bonnet Theorem', vi: "Định lý Gauss–Bonnet" }, latex: '\\int_M K\\,dA + \\int_{\\partial M} k_g\\,ds = 2\\pi\\chi(M)', description: { zh: '曲面上的高斯曲率积分与欧拉示性数相关', en: 'Integral of Gaussian curvature over a surface relates to Euler characteristic', vi: "Tích phân độ cong Gauss trên mặt liên hệ với đặc trưng Euler" }, variables: [
        { symbol: 'K', description: { zh: '高斯曲率', en: 'Gaussian curvature', vi: "Độ cong Gauss" } },
        { symbol: 'k_g', description: { zh: '测地曲率', en: 'Geodesic curvature', vi: "Độ cong trắc địa" } },
        { symbol: '\\chi(M)', description: { zh: '欧拉示性数', en: 'Euler characteristic', vi: "Đặc trưng Euler" } }
      ], applications: [{ zh: '拓扑学、微分几何', en: 'Topology, differential geometry', vi: "Tô pô, hình học vi phân" }], difficulty: 4 }
    ],
    pioneers: [
      { id: 'lobachevsky', name: 'Nikolai Lobachevsky', nameZh: '尼古拉·罗巴切夫斯基', birthYear: 1792, deathYear: 1856, nationality: '俄国', nationalityNames: {"zh": "俄国", "en": "Russia", "vi": "Nga"}, contributions: { zh: '双曲几何的独立发现者之一', en: 'Independent co-discoverer of hyperbolic geometry', vi: "Đồng phát hiện độc lập hình học hyperbolic" } },
      { id: 'bolyai', name: 'János Bolyai', nameZh: '亚诺什·波尔约', birthYear: 1802, deathYear: 1860, nationality: '匈牙利', nationalityNames: {"zh": "匈牙利", "en": "Hungary", "vi": "Hungary"}, contributions: { zh: '绝对空间的科学——双曲几何', en: 'The Science of Absolute Space — hyperbolic geometry', vi: "Khoa học về không gian tuyệt đối — hình học hyperbolic" } },
      { id: 'riemann', name: 'Bernhard Riemann', nameZh: '波恩哈德·黎曼', birthYear: 1826, deathYear: 1866, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '将非欧几何推广到n维流形', en: 'Extended non-Euclidean geometry to n-dimensional manifolds', vi: "Mở rộng hình học phi Euclid sang đa tạp n chiều" } }
    ],
    figures: [], references: [],
    relatedFields: ['differential-geometry', 'topology', 'physics'], applications: ['relativity', 'cosmology'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 射影几何 ====================
  {
    id: 'projective-geometry', slug: 'projective-geometry',
    names: { zh: '射影几何', en: 'Projective Geometry', vi: "Hình học xạ ảnh" },
    descriptions: {
      zh: '研究图形在射影变换下不变性质的几何分支，引入无穷远点和齐次坐标，统一处理多种几何。',
      en: 'Branch studying properties invariant under projective transformations. Introduces points at infinity and homogeneous coordinates, unifying multiple geometries.', vi: "Nghiên cứu tính chất bất biến qua biến đổi xạ ảnh; dùng điểm ở vô hạn và tọa độ thuần nhất để thống nhất nhiều hình học."
    },
    level: 2, parentId: 'geometry', childIds: [],
    position: [0, 0, 0], size: 'small', color: '#06b6d4',
    tags: ['projective', 'invariant', 'homogeneous'],
    basics: {
      definition: { zh: '通过中心投影研究几何图形性质的学科，核心概念包括交比、对偶性、无穷远元素。', en: 'Study of geometric properties via central projection. Key concepts: cross-ratio, duality, elements at infinity.', vi: "Nghiên cứu tính chất hình học qua phép chiếu xuyên tâm; khái niệm chính: tỷ số kép, đối ngẫu, yếu tố ở vô hạn." },
      scope: { zh: '射影平面、交比不变量、对偶原理、帕斯卡/布里昂香定理、齐次坐标。', en: 'Projective planes, cross-ratio invariance, duality principle, Pascal/Brianchon theorems, homogeneous coordinates.', vi: "Mặt phẳng xạ ảnh, bất biến tỷ số kép, đối ngẫu, định lý Pascal và Brianchon, tọa độ thuần nhất." },
      importance: 4, difficulty: 3,
      history: [
        { year: 1639, event: { zh: '德萨格《圆锥曲线论稿》— 射影几何萌芽', en: "Desargues' Brouillon Project — origins of projective geometry", vi: "Brouillon Project của Desargues — khởi nguồn hình học xạ ảnh" } },
        { year: 1822, event: { zh: '彭赛列《论图形的射影性质》', en: "Poncelet's Traité des propriétés projectives", vi: "Traité des propriétés projectives của Poncelet" } },
        { year: 1872, event: { zh: '克莱因埃尔朗根纲领——用变换群分类几何', en: "Klein's Erlangen Program — classifies geometries by transformation groups", vi: "Chương trình Erlangen của Klein — phân loại hình học theo nhóm biến đổi" } }
      ],
      tags: []
    },
    principles: [
      { id: 'prjp1', title: { zh: '交比不变性', en: 'Cross-Ratio Invariance', vi: "Bất biến tỷ số kép" }, description: { zh: '四个共线的点的交比在射影变换下保持不变', en: 'The cross-ratio of four collinear points is invariant under projective transformations', vi: "Tỷ số kép của bốn điểm thẳng hàng bất biến qua phép biến đổi xạ ảnh" }, importance: 3 },
      { id: 'prjp2', title: { zh: '点线对偶', en: 'Point-Line Duality', vi: "Đối ngẫu điểm – đường" }, description: { zh: '射影几何中的任何定理都有其对偶命题', en: 'Every theorem in projective geometry has a dual statement', vi: "Mỗi định lý hình học xạ ảnh có phát biểu đối ngẫu" }, importance: 3 }
    ],
    formulas: [
      { id: 'cross-ratio', name: { zh: '交比', en: 'Cross-Ratio', vi: "Tỷ số kép" }, latex: '(A,B;C,D) = \\frac{AC \\cdot BD}{AD \\cdot BC}', description: { zh: '四点交比的定义式', en: 'Definition of cross-ratio for four points', vi: "Định nghĩa tỷ số kép của bốn điểm" }, variables: [
        { symbol: 'A,B,C,D', description: { zh: '共线四点', en: 'Four collinear points', vi: "Bốn điểm thẳng hàng" } }
      ], applications: [{ zh: '计算机视觉、摄影测量', en: 'Computer vision, photogrammetry', vi: "Thị giác máy tính, trắc ảnh" }], difficulty: 3 }
    ],
    pioneers: [
      { id: 'desargues', name: 'Girard Desargues', nameZh: '吉拉德·德萨格', birthYear: 1591, deathYear: 1661, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '射影几何创始人，德萨格定理', en: 'Founder of projective geometry, Desargues theorem', vi: "Sáng lập hình học xạ ảnh, định lý Desargues" } },
      { id: 'poncelet', name: 'Jean-Victor Poncelet', nameZh: '让-维克托·彭赛列', birthYear: 1788, deathYear: 1867, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '射影几何的系统化发展', en: 'Systematic development of projective geometry', vi: "Phát triển hình học xạ ảnh có hệ thống" } },
      { id: 'klein', name: 'Felix Klein', nameZh: '菲利克斯·克莱因', birthYear: 1849, deathYear: 1925, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '埃尔朗根纲领，用群论统一几何', en: "Erlangen Program, unified geometry via group theory", vi: "Chương trình Erlangen, thống nhất hình học bằng lý thuyết nhóm" } }
    ],
    figures: [], references: [],
    relatedFields: ['algebraic-geometry', 'computer-vision'], applications: ['computer-graphics', 'vision', 'architecture'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 解析几何 ====================
  {
    id: 'analytic-geometry', slug: 'analytic-geometry',
    names: { zh: '解析几何', en: 'Analytic Geometry', vi: "Hình học giải tích" },
    descriptions: {
      zh: '通过坐标系用代数方程描述几何图形的方法论，由笛卡尔和费马创立，实现了几何与代数的统一。',
      en: 'Methodology describing geometric figures with algebraic equations via coordinate systems. Founded by Descartes and Fermat, achieving unification of geometry and algebra.', vi: "Mô tả hình bằng phương trình đại số qua hệ tọa độ; Descartes và Fermat xây dựng phương pháp thống nhất hình học với đại số."
    },
    level: 2, parentId: 'geometry', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#22d3ee',
    tags: ['geometry', 'analytic', 'coordinate', 'algebraic-method'],
    basics: {
      definition: { zh: '利用坐标系（直角坐标、极坐标等）将几何问题转化为代数问题求解的方法。', en: 'Method that transforms geometric problems into algebraic problems using coordinate systems (Cartesian, polar, etc.).', vi: "Chuyển bài toán hình học sang đại số bằng hệ tọa độ như Descartes hoặc cực." },
      scope: { zh: '平面/空间坐标系、二次曲线与曲面、向量法、参数方程、坐标变换。', en: 'Planar/spatial coordinate systems, conics & quadrics, vector methods, parametric equations, coordinate transformations.', vi: "Tọa độ phẳng và không gian, đường conic và mặt bậc hai, vectơ, phương trình tham số, đổi tọa độ." },
      importance: 5, difficulty: 2,
      history: [
        { year: 1637, event: { zh: '笛卡尔《几何学》— 坐标方法诞生', en: "Descartes' La Géométrie — birth of coordinate method", vi: "La Géométrie của Descartes — phương pháp tọa độ ra đời" }, figure: 'descartes' },
        { year: 1670, event: { zh: '费马的工作（死后发表）', en: "Fermat's work (posthumous)", vi: "Công trình của Fermat được công bố sau khi ông mất" } },
        { year: 1797, event: { zh: '卡西尼卵形线等特殊曲线研究', en: 'Study of special curves like Cassini ovals', vi: "Nghiên cứu đường cong đặc biệt như đường oval Cassini" } }
      ],
      tags: ['analytic']
    },
    principles: [
      { id: 'agp1', title: { zh: '坐标映射', en: 'Coordinate Mapping', vi: "Ánh xạ tọa độ" }, description: { zh: '空间中的点一一对应于有序数组', en: 'Points in space correspond bijectively to ordered tuples', vi: "Điểm trong không gian tương ứng song ánh với bộ tọa độ có thứ tự" }, importance: 3 }
    ],
    formulas: [
      { id: 'line-equation', name: { zh: '直线方程', en: 'Line Equation', vi: "Phương trình đường thẳng" }, latex: 'y = kx + b \\quad \\text{或} \\quad \\frac{x-x_0}{m} = \\frac{y-y_0}{n} = \\frac{z-z_0}{p}', latexLocales: {"zh": "y = kx + b \\quad \\text{或} \\quad \\frac{x-x_0}{m} = \\frac{y-y_0}{n} = \\frac{z-z_0}{p}", "en": "y = kx + b \\quad \\text{or} \\quad \\frac{x-x_0}{m} = \\frac{y-y_0}{n} = \\frac{z-z_0}{p}", "vi": "y = kx + b \\quad \\text{hoặc} \\quad \\frac{x-x_0}{m} = \\frac{y-y_0}{n} = \\frac{z-z_0}{p}"}, description: { zh: '平面和空间中直线的代数表示', en: 'Algebraic representation of lines in plane and space', vi: "Biểu diễn đại số của đường thẳng trong mặt phẳng và không gian" }, variables: [
        { symbol: 'k,b', description: { zh: '斜率和截距', en: 'Slope and intercept', vi: "Hệ số góc và tung độ gốc" } },
        { symbol: '(x_0,y_0,z_0)', description: { zh: '定点', en: 'Point on line', vi: "Điểm trên đường thẳng" } }
      ], applications: [{ zh: '线性规划、路径规划', en: 'Linear programming, path planning', vi: "Quy hoạch tuyến tính, lập đường đi" }], difficulty: 1 },
      { id: 'conic-general', name: { zh: '一般二次曲线', en: 'General Conic Section', vi: "Phương trình conic tổng quát" }, latex: 'Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0', description: { zh: '圆锥曲线的一般方程（判别式决定类型）', en: 'General equation of conic sections (discriminant determines type)', vi: "Phương trình tổng quát của đường conic; biệt thức xác định loại đường" }, variables: [
        { symbol: '\\Delta=B^2-4AC', description: { zh: '判别式', en: 'Discriminant', vi: "Biệt thức" } }
      ], applications: [{ zh: '轨道力学、光学设计', en: 'Orbital mechanics, optical design', vi: "Cơ học quỹ đạo, thiết kế quang học" }], difficulty: 2 }
    ],
    pioneers: [
      { id: 'descartes', name: 'René Descartes', nameZh: '勒内·笛卡尔', birthYear: 1596, deathYear: 1650, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '解析几何创始人，直角坐标系', en: 'Founder of analytic geometry, Cartesian coordinates', vi: "Sáng lập hình học giải tích, tọa độ Descartes" } },
      { id: 'fermat', name: 'Pierre de Fermat', nameZh: '皮埃尔·德·费马', birthYear: 1607, deathYear: 1665, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '独立发明坐标几何方法', en: 'Independently invented coordinate geometry', vi: "Độc lập phát minh hình học tọa độ" } }
    ],
    figures: [], references: [],
    relatedFields: ['linear-algebra', 'algebra', 'calculus'], applications: ['physics', 'engineering', 'graphics', 'robotics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 微分几何（作为geometry子节点，简化版） ====================
  {
    id: 'differential-geometry-child', slug: 'differential-geometry-intro',
    names: { zh: '微分几何入门', en: 'Differential Geometry (Intro)', vi: "Hình học vi phân (nhập môn)" },
    descriptions: {
      zh: '用微积分方法研究曲线、曲面及流形的局部与整体性质的几何分支。详见微分几何主星系。',
      en: 'Branch using calculus to study local/global properties of curves, surfaces, and manifolds. See main differential galaxy.', vi: "Dùng vi tích phân nghiên cứu tính chất địa phương và toàn cục của đường, mặt và đa tạp; xem nút hình học vi phân chính."
    },
    level: 2, parentId: 'geometry', childIds: [],
    position: [0, 0, 0], size: 'small', color: '#0e7490',
    tags: ['differential-geometry', 'differential', 'curvature', 'manifold'],
    basics: {
      definition: { zh: '应用微积分工具分析光滑曲线和曲面的几何性质，如曲率、挠率、第一/第二基本形式等。', en: 'Applies calculus tools to analyze geometric properties of smooth curves and surfaces: curvature, torsion, first/second fundamental forms.', vi: "Dùng vi tích phân phân tích đường và mặt trơn: độ cong, độ xoắn, dạng cơ bản thứ nhất và thứ hai." },
      scope: { zh: '曲线论、曲面论、流形初步、联络与协变导数。', en: 'Curve theory, surface theory, manifold introduction, connections and covariant derivatives.', vi: "Lý thuyết đường, mặt, nhập môn đa tạp, liên thông và đạo hàm hiệp biến." },
      importance: 4, difficulty: 4,
      history: [
        { year: 1827, event: { zh: '高斯《关于曲面的一般研究》', en: "Gauss' Disquisitiones generales circa superficies curvas", vi: "Disquisitiones generales circa superficies curvas của Gauss" } },
        { year: 1854, event: { zh: '黎曼《论几何基础的假设》', en: "Riemann's Über die Hypothesen", vi: "Über die Hypothesen của Riemann" } }
      ],
      tags: []
    },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['differential-geometry', 'topology', 'analysis'], applications: ['general-relativity', 'string-theory'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 代数几何（作为geometry子节点，简化版） ====================
  {
    id: 'algebraic-geometry-child', slug: 'algebraic-geometry-intro',
    names: { zh: '代数几何入门', en: 'Algebraic Geometry (Intro)', vi: "Hình học đại số (nhập môn)" },
    descriptions: {
      zh: '用代数方法（多项式、环、域）研究几何对象的分支。详见代数几何主星系。',
      en: 'Branch studying geometric objects using algebraic methods (polynomials, rings, fields). See main algebraic geometry galaxy.', vi: "Dùng đa thức, vành, trường nghiên cứu đối tượng hình học; xem nút hình học đại số chính."
    },
    level: 2, parentId: 'geometry', childIds: [],
    position: [0, 0, 0], size: 'small', color: '#155e75',
    tags: ['algebraic', 'variety', 'scheme'],
    basics: {
      definition: { zh: '研究多项式方程组的解集（代数簇）的几何性质，是代数与几何的深度交叉领域。', en: 'Studies geometric properties of solution sets (varieties) of polynomial equation systems. Deep intersection of algebra and geometry.', vi: "Nghiên cứu tập nghiệm (đa tạp đại số) của hệ phương trình đa thức; giao điểm sâu sắc giữa đại số và hình học." },
      scope: { zh: '仿射与射影簇、代数曲线与曲面、交换代数工具、概型初步。', en: 'Affine & projective varieties, algebraic curves & surfaces, commutative algebra tools, scheme introduction.', vi: "Đa tạp đại số afin và xạ ảnh, đường cong và mặt đại số, đại số giao hoán, nhập môn lược đồ." },
      importance: 4, difficulty: 5,
      history: [
        { year: 1946, event: { zh: '韦伊猜想的提出', en: 'Weil conjectures formulated', vi: "Phát biểu các giả thuyết Weil" } },
        { year: 1960, event: { zh: '格罗滕迪克重建代数几何', en: 'Grothendieck rebuilds algebraic geometry', vi: "Grothendieck xây dựng lại hình học đại số" }, figure: 'grothendieck' }
      ],
      tags: []
    },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['algebraic-geometry', 'commutative-algebra', 'numbertheory'], applications: ['cryptography', 'coding-theory', 'string-theory'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 离散几何 ====================
  {
    id: 'discrete-geometry', slug: 'discrete-geometry',
    names: { zh: '离散几何', en: 'Discrete / Combinatorial Geometry', vi: "Hình học rời rạc và tổ hợp" },
    descriptions: {
      zh: '研究离散点集、组合结构和凸性的几何分支，与组合数学深度交叉。',
      en: 'Branch studying discrete point sets, combinatorial structures, and convexity. Deeply intersects with combinatorics.', vi: "Nghiên cứu tập điểm rời rạc, cấu trúc tổ hợp và tính lồi; liên hệ sâu với tổ hợp."
    },
    level: 2, parentId: 'geometry', childIds: [],
    position: [0, 0, 0], size: 'small', color: '#06b6d4',
    tags: ['geometry', 'discrete', 'combinatorial', 'packing'],
    basics: {
      definition: { zh: '研究由有限或可数个离散元素构成的几何对象及其排列、覆盖等问题。', en: 'Studies geometric objects composed of finite or countably many discrete elements and their arrangements, coverings, etc.', vi: "Nghiên cứu đối tượng gồm hữu hạn hoặc đếm được các phần tử rời rạc, cách sắp xếp và phủ chúng." },
      scope: { zh: '密铺问题、堆积问题、欧拉图、拉姆塞几何、几何计数。', en: 'Tessellations, packing problems, Eulerian graphs, geometric Ramsey theory, geometric enumeration.', vi: "Lát kín, xếp chặt, đồ thị Euler, lý thuyết Ramsey hình học, phép đếm hình học." },
      importance: 3, difficulty: 3,
      history: [
        { year: 1890, event: { zh: '希尔伯特第18问题：密铺与球堆积', en: "Hilbert's 18th problem: tessellations and sphere packing", vi: "Bài toán 18 của Hilbert: lát kín và xếp cầu" } },
        { year: 1998, event: { zh: '黑尔斯证明开普勒猜想', en: 'Hales proves Kepler conjecture', vi: "Hales chứng minh giả thuyết Kepler" } }
      ],
      tags: []
    },
    principles: [
      { id: 'dgp1', title: { zh: '密铺条件', en: 'Tessellation Condition', vi: "Điều kiện lát kín" }, description: { zh: '正n边形能密铺平面的充要条件：360/n为整数', en: 'Regular n-gon tessellates iff 360/n is an integer', vi: "Đa giác đều n cạnh lát kín khi và chỉ khi 360/n là số nguyên" }, importance: 2 }
    ],
    formulas: [
      { id: 'pick-theorem', name: { zh: 'Pick定理', en: "Pick's Theorem", vi: "Định lý Pick" }, latex: 'S = I + \\frac{B}{2} - 1', description: { zh: '格点多边形面积的简单计算公式', en: 'Simple area formula for lattice polygons', vi: "Công thức diện tích đơn giản cho đa giác có đỉnh trên lưới nguyên" }, variables: [
        { symbol: 'I', description: { zh: '内部格点数', en: 'Interior lattice points', vi: "Điểm lưới bên trong" } },
        { symbol: 'B', description: { zh: '边界格点数', en: 'Boundary lattice points', vi: "Điểm lưới trên biên" } }
      ], applications: [{ zh: '格点几何、离散优化', en: 'Lattice geometry, discrete optimization', vi: "Hình học lưới, tối ưu rời rạc" }], difficulty: 2 }
    ],
    pioneers: [
      { id: 'pick', name: 'Georg Alexander Pick', nameZh: '乔治·亚历山大·皮克', birthYear: 1859, deathYear: 1942, nationality: '奥地利', nationalityNames: {"zh": "奥地利", "en": "Austria", "vi": "Áo"}, contributions: { zh: 'Pick定理——格点多边形面积', en: "Pick's theorem — area of lattice polygons", vi: "Định lý Pick — diện tích đa giác lưới" } }
    ],
    figures: [], references: [],
    relatedFields: ['combinatorics', 'convex-geometry', 'computational-geometry'], applications: ['coding', 'crystallography', 'materials-science'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 凸几何 ====================
  {
    id: 'convex-geometry', slug: ' convex-geometry',
    names: { zh: '凸几何', en: 'Convex Geometry', vi: "Hình học lồi" },
    descriptions: {
      zh: '研究凸集合及其性质的几何分支，在优化理论和泛函分析中有重要应用。',
      en: 'Branch studying convex sets and their properties. Important applications in optimization theory and functional analysis.', vi: "Nghiên cứu tập lồi và tính chất của chúng; ứng dụng trong tối ưu và giải tích hàm."
    },
    level: 2, parentId: 'geometry', childIds: [],
    position: [0, 0, 0], size: 'small', color: '#0891b2',
    tags: ['geometry', 'convex', 'optimization', 'polytope'],
    basics: {
      definition: { zh: '研究凸集（对任意两点连线仍含于该集的集合）、凸函数和多面体的性质。', en: 'Studies convex sets (sets containing all line segments between any two points), convex functions, and polytopes.', vi: "Nghiên cứu tập chứa mọi đoạn nối hai điểm của nó, hàm lồi và đa diện lồi." },
      scope: { zh: '凸集分离定理、Minkowski和、Brunn-Minkowski理论、多面体组合。', en: 'Convex separation theorems, Minkowski sum, Brunn-Minkowski theory, polytope combinatorics.', vi: "Định lý tách lồi, tổng Minkowski, lý thuyết Brunn–Minkowski, tổ hợp đa diện." },
      importance: 4, difficulty: 3,
      history: [
        { year: 1896, event: { zh: '闵可夫斯基《数的几何》', en: "Minkowski's Geometrie der Zahlen", vi: "Geometrie der Zahlen của Minkowski" } },
        { year: 1934, event: { zh: 'Brunn-Minkowski不等式的严格证明', en: 'Rigorous proof of Brunn-Minkowski inequality', vi: "Chứng minh chặt chẽ bất đẳng thức Brunn–Minkowski" } }
      ],
      tags: []
    },
    principles: [
      { id: 'cgp1', title: { zh: '超平面分离定理', en: 'Separating Hyperplane Theorem', vi: "Định lý siêu phẳng tách" }, description: { zh: '两个不交凸集可用超平面分离', en: 'Two disjoint convex sets can be separated by a hyperplane', vi: "Các tập lồi rời nhau có thể được tách bằng siêu phẳng dưới điều kiện thích hợp" }, importance: 3 }
    ],
    formulas: [
      { id: 'brunn-minkowski', name: { zh: 'Brunn-Minkowski不等式', en: 'Brunn-Minkowski Inequality', vi: "Bất đẳng thức Brunn–Minkowski" }, latex: 'Vol(A+B)^{1/n} \\geq Vol(A)^{1/n} + Vol(B)^{1/n}', description: { zh: '两个紧凸集Minkowski和的体积下界', en: 'Volume lower bound for Minkowski sum of two compact convex sets', vi: "Chặn dưới thể tích tổng Minkowski của hai tập lồi compact" }, variables: [
        { symbol: 'A,B', description: { zh: '紧凸集', en: 'Compact convex sets', vi: "Các tập lồi compact" } },
        { symbol: 'A+B', description: { zh: 'Minkowski和', en: 'Minkowski sum', vi: "Tổng Minkowski" } }
      ], applications: [{ zh: '等周不等式、几何测度论', en: 'Isoperimetric inequality, geometric measure theory', vi: "Bất đẳng thức đẳng chu, lý thuyết độ đo hình học" }], difficulty: 4 }
    ],
    pioneers: [
      { id: 'minkowski', name: 'Hermann Minkowski', nameZh: '赫尔曼·闵可夫斯基', birthYear: 1864, deathYear: 1909, nationality: '德国/立陶宛', nationalityNames: {"zh": "德国/立陶宛", "en": "Germany / Lithuania", "vi": "Đức / Litva"}, contributions: { zh: '凸几何与数的几何奠基人，闵可夫斯基时空', en: 'Founder of convex geometry and geometry of numbers, Minkowski spacetime', vi: "Sáng lập hình học lồi và hình học các số, không–thời gian Minkowski" } }
    ],
    figures: [], references: [],
    relatedFields: ['discrete-geometry', 'optimization', 'functional-analysis'], applications: ['optimization', 'economics', 'computer-graphics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 计算几何 ====================
  {
    id: 'computational-geometry', slug: 'computational-geometry',
    names: { zh: '计算几何', en: 'Computational Geometry', vi: "Hình học tính toán" },
    descriptions: {
      zh: '用算法解决几何问题的交叉学科，是计算机图形学、机器人和地理信息系统的核心支撑技术。',
      en: 'Interdisciplinary field solving geometric problems with algorithms. Core technology for computer graphics, robotics, and GIS.', vi: "Giải bài toán hình học bằng thuật toán; công nghệ cốt lõi cho đồ họa, robot và hệ thông tin địa lý."
    },
    level: 2, parentId: 'geometry', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#06b6d4',
    tags: ['geometry', 'algorithm', 'computational', 'gis'],
    basics: {
      definition: { zh: '设计和分析处理几何数据的算法，关注效率（时间/空间复杂度）和数值稳定性。', en: 'Designing and analyzing algorithms for processing geometric data, focusing on efficiency (time/space complexity) and numerical stability.', vi: "Thiết kế, phân tích thuật toán xử lý dữ liệu hình học, chú trọng thời gian, bộ nhớ và ổn định số." },
      scope: { zh: '凸包算法、Voronoi图/Delaunay三角剖分、线段相交、最近邻查询、多边形操作、运动规划。', en: 'Convex hull algorithms, Voronoi diagrams/Delaunay triangulation, segment intersection, nearest neighbor queries, polygon operations, motion planning.', vi: "Bao lồi, Voronoi, tam giác hóa Delaunay, giao đoạn thẳng, láng giềng gần nhất, đa giác, lập kế hoạch chuyển động." },
      importance: 4, difficulty: 3,
      history: [
        { year: 1975, event: { zh: 'Shamos和Hoey开创计算几何领域', en: 'Shamos and Hoey found computational geometry', vi: "Shamos và Hoey sáng lập hình học tính toán" } },
        { year: 1985, event: { zh: 'Preparata-Shamos经典教材', en: "Preparata-Shamos classic textbook", vi: "Giáo trình kinh điển Preparata–Shamos" } },
        { year: 2000, event: { zh: 'CGAL库发布——通用计算几何算法库', en: 'CGAL library release — Computational Geometry Algorithms Library', vi: "Phát hành thư viện thuật toán hình học CGAL" } }
      ],
      tags: ['cs', 'algorithm']
    },
    principles: [
      { id: 'cgp1', title: { zh: '计算复杂度', en: 'Computational Complexity', vi: "Độ phức tạp tính toán" }, description: { zh: '几何算法通常追求O(n log n)时间复杂度', en: 'Geometric algorithms typically aim for O(n log n) time complexity', vi: "Thuật toán hình học thường hướng tới độ phức tạp O(n log n)" }, importance: 3 },
      { id: 'cgp2', title: { zh: '数值鲁棒性', en: 'Numerical Robustness', vi: "Độ bền vững số" }, description: { zh: '浮点误差可能导致算法失败，需精确算术或符号计算', en: 'Floating-point errors can break algorithms; exact arithmetic or symbolic computation may be needed', vi: "Sai số dấu phẩy động có thể làm hỏng thuật toán; có thể cần số học chính xác hoặc tính toán ký hiệu" }, importance: 2 }
    ],
    formulas: [
      { id: 'convex-hull-complexity', name: { zh: '凸包复杂度下界', en: 'Convex Hull Lower Bound', vi: "Chặn dưới cho thuật toán bao lồi" }, latex: '\\Omega(n \\log n)', description: { zh: '基于排序归约，凸包算法的最坏情况下界', en: 'Worst-case lower bound for convex hull algorithms via sorting reduction', vi: "Chặn dưới trường hợp xấu nhất của bao lồi qua quy dẫn từ sắp xếp" }, variables: [
        { symbol: 'n', description: { zh: '输入点数', en: 'Number of input points', vi: "Số điểm đầu vào" } }
      ], applications: [{ zh: '算法设计基准', en: 'Algorithm design benchmark', vi: "Chuẩn so sánh thiết kế thuật toán" }], difficulty: 2 }
    ],
    pioneers: [
      { id: 'shamos', name: 'Michael Ian Shamos', nameZh: '迈克尔·伊恩·沙莫斯', birthYear: 1947, nationality: '美国', nationalityNames: {"zh": "美国", "en": "United States", "vi": "Hoa Kỳ"}, contributions: { zh: '计算几何领域的开创者', en: 'Founder of computational geometry field', vi: "Sáng lập lĩnh vực hình học tính toán" } }
    ],
    figures: [], references: [],
    relatedFields: ['computer-graphics', 'robotics', 'gis'], applications: ['cad/cam', 'gis', 'robotics', 'cg', 'pattern-recognition'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 代数几何主星系 ====================
  {
    id: 'algebraic-geometry', slug: 'algebraic-geometry',
    names: { zh: '代数几何', en: 'Algebraic Geometry', vi: "Hình học đại số" },
    descriptions: {
     zh: '研究多项式零点集（代数簇）的几何性质，是现代数学最深刻活跃的分支之一，与数论、拓扑学和理论物理深度交织。',
      en: 'Studies geometric properties of zero sets of polynomials (algebraic varieties). One of modern mathematics\' most profound and active fields, deeply intertwined with number theory, topology, and theoretical physics.', vi: "Nghiên cứu hình học của tập nghiệm đa thức; lĩnh vực sâu sắc, sôi động, gắn với lý thuyết số, tô pô và vật lý lý thuyết."
    },
    level: 1, parentId: null,
    childIds: ['scheme-theory', 'birational-geometry'],
    position: [20, 14, -8], size: 'large', color: '#155e75',
    tags: ['algebraic-geometry', 'variety', 'scheme'],
    basics: {
      definition: { zh: '用代数（特别是交换代数）工具研究几何对象。核心对象包括仿射簇、射影簇、概型和层。', en: 'Studies geometric objects using algebra (especially commutative algebra). Core objects: affine/projective varieties, schemes, sheaves.', vi: "Nghiên cứu hình học bằng đại số, đặc biệt đại số giao hoán; đối tượng chính: đa tạp đại số afin, xạ ảnh, lược đồ và bó." },
      scope: { zh: '代数曲线、代数曲面、阿贝尔簇、概型理论、层上同调、 motivic homotopy、 tropical几何。', en: 'Algebraic curves, surfaces, Abelian varieties, scheme theory, sheaf cohomology, motivic homotopy, tropical geometry.', vi: "Đường cong, mặt và đa tạp Abel, lược đồ, đối đồng điều bó, đồng luân motivic, hình học nhiệt đới." },
      importance: 5, difficulty: 5,
      history: [
        { year: 1849, event: { zh: '黎曼研究代数函数与黎曼曲面', en: 'Riemann studies algebraic functions and Riemann surfaces', vi: "Riemann nghiên cứu hàm đại số và mặt Riemann" }, figure: 'riemann' },
        { year: 1946, event: { zh: '韦伊猜想——联系几何与有限域', en: 'Weil conjectures — connects geometry with finite fields', vi: "Giả thuyết Weil liên hệ hình học với trường hữu hạn" } },
        { year: 1960, event: { zh: '格罗滕迪克的概型革命', en: "Grothendieck's scheme revolution", vi: "Cuộc cách mạng lược đồ của Grothendieck" }, figure: 'grothendieck' },
        { year: 1974, event: { zh: 'Deligne证明韦伊猜想', en: 'Deligne proves Weil conjectures', vi: "Deligne chứng minh giả thuyết Weil" } }
      ],
      tags: ['algebraic-geometry']
    },
    principles: [
      { id: 'agp1', title: { zh: '代数-几何对应', en: 'Algebra-Geometry Correspondence', vi: "Tương ứng đại số – hình học" }, description: { zh: '代数簇的理想与坐标环之间存在反变函子关系', en: 'Contravariant functorial relationship between ideal of variety and its coordinate ring', vi: "Quan hệ hàm tử phản biến giữa đa tạp đại số và vành tọa độ của nó" }, importance: 3 },
      { id: 'agp2', title: { zh: '层的上同调', en: 'Sheaf Cohomology', vi: "Đối đồng điều bó" }, description: { zh: '用层和上同调理论捕捉代数簇的全局信息', en: 'Use sheaves and cohomology to capture global information about varieties', vi: "Dùng bó và đối đồng điều nắm thông tin toàn cục của đa tạp đại số" }, importance: 3 }
    ],
    formulas: [
      { id: 'bezout', name: { zh: '贝祖定理', en: "Bézout's Theorem", vi: "Định lý Bézout" }, latex: '\\sum_{i} m_i(P_i) = \\deg(C_1) \\cdot \\deg(C_2)', description: { zh: '射影平面上两条代数曲线的交点个数（计重数）等于其次数之积', en: 'Intersection count (with multiplicity) of two projective plane curves equals product of their degrees', vi: "Số giao điểm kể cả bội của hai đường cong phẳng xạ ảnh không có thành phần chung bằng tích bậc" }, variables: [
        { symbol: 'C_1, C_2', description: { zh: '两条代数曲线', en: 'Two algebraic curves', vi: "Hai đường cong đại số" } },
        { symbol: 'm_i(P_i)', description: { zh: '交点重数', en: 'Intersection multiplicity', vi: "Bội giao điểm" } }
      ], applications: [{ zh: '曲线交点计算、奇点分析', en: 'Curve intersection calculation, singularity analysis', vi: "Tính giao điểm đường cong, phân tích kỳ dị" }], difficulty: 3 },
      { id: 'riemann-roch', name: { zh: 'Riemann-Roch定理', en: 'Riemann-Roch Theorem', vi: "Định lý Riemann–Roch" }, latex: '\\dim H^0(D) - \\dim H^1(D) = \\deg(D) + 1 - g', description: { zh: '紧黎曼曲线上亚纯函数空间的维数公式', en: 'Dimension formula for meromorphic function spaces on compact Riemann surfaces', vi: "Công thức chiều của không gian hàm phân hình trên mặt Riemann compact" }, variables: [
        { symbol: 'D', description: { zh: '除子', en: 'Divisor', vi: "Ước" } },
        { symbol: 'g', description: { zh: '亏格', en: 'Genus', vi: "Giống" } }
      ], applications: [{ zh: '代数曲线分类、编码理论', en: 'Algebraic curve classification, coding theory', vi: "Phân loại đường cong đại số, lý thuyết mã hóa" }], difficulty: 5 }
    ],
    pioneers: [
      { id: 'riemann', name: 'Bernhard Riemann', nameZh: '波恩哈德·黎曼', birthYear: 1826, deathYear: 1866, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '黎曼曲面理论——代数几何的起源之一', en: 'Riemann surface theory — one origin of algebraic geometry', vi: "Lý thuyết mặt Riemann — một nguồn gốc của hình học đại số" } },
      { id: 'noether', name: 'Emmy Noether', nameZh: '艾米·诺特', birthYear: 1882, deathYear: 1935, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '抽象代数奠基人，代数几何的代数基础', en: 'Founder of abstract algebra, algebraic foundation of algebraic geometry', vi: "Sáng lập đại số trừu tượng, nền tảng đại số cho hình học đại số" } },
      { id: 'zariski', name: 'Oscar Zariski', nameZh: '奥斯卡·扎里斯基', birthYear: 1899, deathYear: 1986, nationality: '美国/俄罗斯', nationalityNames: {"zh": "美国/俄罗斯", "en": "United States / Russia", "vi": "Hoa Kỳ / Nga"}, contributions: { zh: '代数几何的代数化，Zariski拓扑', en: 'Algebraization of algebraic geometry, Zariski topology', vi: "Đại số hóa hình học đại số, tô pô Zariski" } },
      { id: 'weil', name: 'André Weil', nameZh: '安德烈·韦伊', birthYear: 1906, deathYear: 1998, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '韦伊猜想，代数几何基础工作', en: 'Weil conjectures, foundational work in algebraic geometry', vi: "Giả thuyết Weil, công trình nền tảng về hình học đại số" } },
      { id: 'serre', name: 'Jean-Pierre Serre', nameZh: '让-皮埃尔·塞尔', birthYear: 1926, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '层上同调、GAGA原理、菲尔兹奖最年轻得主', en: 'Sheaf cohomology, GAGA principle, youngest Fields medalist', vi: "Đối đồng điều bó, nguyên lý GAGA, người nhận Huy chương Fields trẻ nhất" } },
      { id: 'grothendieck', name: 'Alexander Grothendieck', nameZh: '亚历山大·格罗滕迪克', birthYear: 1928, deathYear: 2014, nationality: '法国/德国', nationalityNames: {"zh": "法国/德国", "en": "France / Germany", "vi": "Pháp / Đức"}, contributions: { zh: '概型理论、上同调理论、Motives、20世纪代数几何革命', en: 'Scheme theory, cohomology theories, Motives, 20th century AG revolution', vi: "Lược đồ, đối đồng điều, motive, đổi mới hình học đại số thế kỷ 20" } },
      { id: 'deligne', name: 'Pierre Deligne', nameZh: '皮埃尔·德利涅', birthYear: 1944, nationality: '比利时', nationalityNames: {"zh": "比利时", "en": "Belgium", "vi": "Bỉ"}, contributions: { zh: '证明韦伊猜想，霍奇理论', en: 'Proved Weil conjectures, Hodge theory', vi: "Chứng minh giả thuyết Weil, lý thuyết Hodge" } }
    ],
    figures: [], references: [],
    relatedFields: ['numbertheory', 'commutative-algebra', 'topology', 'complex-analysis'], applications: ['cryptography', 'coding-theory', 'string-theory', 'mirror-symmetry'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 概型理论 ====================
  {
    id: 'scheme-theory', slug: 'scheme-theory',
    names: { zh: '概型理论', en: 'Scheme Theory', vi: "Lý thuyết lược đồ" },
    descriptions: {
      zh: '格罗滕迪克创立的现代代数几何基础框架，将代数几何推广到最一般的交换环情形，实现几何与代数的完美统一。',
      en: "Grothendieck's foundational framework for modern algebraic geometry, extending it to arbitrary commutative rings, achieving perfect unity of geometry and algebra.", vi: "Khuôn khổ Grothendieck cho hình học đại số hiện đại, mở rộng sang vành giao hoán bất kỳ, thống nhất hình học với đại số."
    },
    level: 2, parentId: 'algebraic-geometry', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#155e75',
    tags: ['algebraic-geometry', 'scheme', 'sheaf', 'cohomology'],
    basics: {
      definition: { zh: '概型是带环层结构的局部环谱空间。仿射概型对应交换环的素谱，是最基本的几何对象。', en: 'A scheme is a locally ringed space with a structure sheaf. Affine schemes correspond to spectra of commutative rings.', vi: "Lược đồ là không gian vành địa phương có bó cấu trúc, cục bộ tương ứng phổ của vành giao hoán; lược đồ afin tương ứng với phổ này." },
      scope: { zh: '仿射概型与射影概型、态射、纤维积、可分/平坦态射、上同调理论。', en: 'Affine & projective schemes, morphisms, fiber products, separable/flat morphisms, cohomology theories.', vi: "Lược đồ afin và xạ ảnh, cấu xạ, tích thớ, cấu xạ tách và phẳng, lý thuyết đối đồng điều." },
      importance: 5, difficulty: 5,
      history: [
        { year: 1960, event: { zh: '《代数几何基础》(EGA)开始出版', en: 'Éléments de Géométrie Algébrique (EGA) publication begins', vi: "Bắt đầu công bố Éléments de Géométrie Algébrique (EGA)" }, figure: 'grothendieck' },
        { year: 1967, event: { zh: '《凝聚代数层》(SGA)系列', en: 'Séminaire de Géométrie Algébrique (SGA) series', vi: "Loạt Séminaire de Géométrie Algébrique (SGA)" } }
      ],
      tags: []
    },
    principles: [
      { id: 'stp1', title: { zh: '函子性观点', en: 'Functorial Viewpoint', vi: "Quan điểm hàm tử" }, description: { zh: '通过概型的点函子（取值于所有环）来研究概型', en: 'Study schemes via their functor of points (valued in all rings)', vi: "Nghiên cứu lược đồ qua hàm tử điểm nhận giá trị trên các vành" }, importance: 3 },
      { id: 'stp2', title: { zh: '层与上同调', en: 'Sheaves and Cohomology', vi: "Bó và đối đồng điều" }, description: { zh: '凝聚上同调和étale上同调是研究概型的核心工具', en: 'Coherent and étale cohomologies are core tools for studying schemes', vi: "Đối đồng điều bó coherent và étale là công cụ cốt lõi nghiên cứu lược đồ" }, importance: 3 }
    ],
    formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['commutative-algebra', 'category-theory', 'topology'], applications: ['numbertheory-arithmetic', 'representation-theory'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 双有理几何 ====================
  {
    id: 'birational-geometry', slug: 'birational-geometry',
    names: { zh: '双有理几何', en: 'Birational Geometry', vi: "Hình học song hữu tỷ" },
    descriptions: {
      zh: '研究代数簇之间双有理映射的分类与极小模型问题，极小模型纲领(MMP)是该领域的核心框架。',
      en: 'Studies classification and minimal model problems of birational maps between varieties. Minimal Model Program (MMP) is the core framework.', vi: "Nghiên cứu phân loại và mô hình tối thiểu qua ánh xạ song hữu tỷ; khuôn khổ chính là chương trình mô hình tối thiểu MMP."
    },
    level: 2, parentId: 'algebraic-geometry', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#164e63',
    tags: ['algebraic-geometry', 'birational', 'mmp', 'classification'],
    basics: {
      definition: { zh: '双有理映射是有理映射的同构限制在某个开稠子集上。双有理等价的簇具有相同的有理函数域。', en: 'Birational maps are rational maps that are isomorphisms on some open dense subset. Birationally equivalent varieties share the same function field.', vi: "Ánh xạ song hữu tỷ là ánh xạ hữu tỷ đẳng cấu trên tập con mở trù mật; các đa tạp tương đương có cùng trường hàm." },
      scope: { zh: '极小模型纲领(MMP)、翻转、终止定理、Fano簇、一般型簇、丰沛除子。', en: 'Minimal Model Program (MMP), flips, termination theorem, Fano varieties, varieties of general type, ample divisors.', vi: "MMP, phép lật, định lý kết thúc, đa tạp Fano, loại tổng quát và ước ample." },
      importance: 4, difficulty: 5,
      history: [
        { year: 1980, event: { zh: 'Mori的极小模型理论突破', en: "Mori's breakthrough in minimal model theory", vi: "Đột phá của Mori về mô hình tối thiểu" } },
        { year: 2006, event: { zh: '三维MMP完成', en: '3-fold MMP completed', vi: "Hoàn thành MMP cho đa tạp ba chiều" } },
        { year: 2019, event: { zh: 'Birkar因MMP获菲尔兹奖', en: 'Birkar awarded Fields Medal for MMP', vi: "Birkar nhận Huy chương Fields cho MMP" } }
      ],
      tags: []
    },
    principles: [
      { id: 'bgp1', title: { zh: '锥定理', en: 'Cone Theorem', vi: "Định lý nón" }, description: { zh: '代数簇的 nef 锥可以用极值射线逼近', en: 'Nef cone can be approximated by extremal rays', vi: "Nón nef có thể được xấp xỉ bằng các tia cực biên" }, importance: 3 }
    ],
    formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['complex-geometry', 'differential-geometry', 'singularity-theory'], applications: ['classification', 'string-theory-compactification'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 微分几何主星系 ====================
  {
    id: 'differential-geometry-main', slug: 'differential-geometry',
    names: { zh: '微分几何', en: 'Differential Geometry', vi: "Hình học vi phân" },
    descriptions: {
      zh: '用微积分和分析工具研究光滑流形的几何性质，是广义相对论、规范场论和弦理论的数学语言。',
      en: 'Studies geometric properties of smooth manifolds using calculus and analysis. Mathematical language of general relativity, gauge theory, and string theory.', vi: "Dùng vi tích phân và giải tích nghiên cứu đa tạp trơn; ngôn ngữ của tương đối rộng, lý thuyết gauge và dây."
    },
    level: 1, parentId: null,
    childIds: ['riemannian-geometry', 'symplectic-geometry', 'complex-manifolds'],
    position: [18, 2, -15], size: 'large', color: '#0e7490',
    tags: ['differential-geometry', 'manifold', 'curvature'],
    basics: {
      definition: { zh: '研究光滑流形（局部像欧氏空间的拓扑空间）及其上的附加结构（度量、联络、张量场）。核心概念包括曲率、联络、测地线。', en: 'Studies smooth manifolds (locally Euclidean spaces) with additional structures (metrics, connections, tensor fields). Core concepts: curvature, connection, geodesics.', vi: "Nghiên cứu đa tạp trơn, cục bộ giống không gian Euclid, với metric, liên thông, trường tensor; khái niệm chính: độ cong, liên thông, trắc địa." },
      scope: { zh: '黎曼几何、辛几何、复几何、芬斯勒几何、次黎曼几何、Kähler几何。', en: 'Riemannian geometry, symplectic geometry, complex geometry, Finsler geometry, sub-Riemannian geometry, Kähler geometry.', vi: "Hình học Riemann, symplectic, phức, Finsler, dưới Riemann và Kähler." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1827, event: { zh: '高斯《曲面论》——内在曲率的绝妙定理', en: "Gauss' Theorema Egregrium — intrinsic curvature", vi: "Theorema Egregium của Gauss — độ cong nội tại" } },
        { year: 1854, event: { zh: '黎曼就职演说——n维流形基础', en: "Riemann's habilitation lecture — n-manifold foundations", vi: "Bài giảng habilitation của Riemann — nền tảng đa tạp n chiều" }, figure: 'riemann' },
        { year: 1915, event: { zh: '爱因斯坦用黎曼几何建立广义相对论', en: 'Einstein uses Riemannian geometry for General Relativity', vi: "Einstein dùng hình học Riemann cho tương đối rộng" } },
        { year: 1970, event: { zh: '阿蒂亚-辛格指标定理', en: 'Atiyah-Singer index theorem', vi: "Định lý chỉ số Atiyah–Singer" } }
      ],
      tags: ['differential-geometry']
    },
    principles: [
      { id: 'dgp1', title: { zh: '曲率张量', en: 'Curvature Tensor', vi: "Tensor độ cong" }, description: { zh: '刻画空间弯曲程度的核心对象，包括黎曼张量、里奇张量和标量曲率', en: 'Core object measuring space curvature: Riemann tensor, Ricci tensor, scalar curvature', vi: "Đối tượng đo độ cong không gian: tensor Riemann, Ricci và độ cong vô hướng" }, importance: 3 },
      { id: 'dgp2', title: { zh: '测地线', en: 'Geodesic', vi: "Đường trắc địa" }, description: { zh: '流形上"最短"路径的推广，满足测地线方程', en: 'Generalization of shortest paths; satisfies geodesic equation', vi: "Mở rộng ý niệm đường ngắn nhất; thỏa phương trình trắc địa" }, importance: 3 },
      { id: 'dgp3', title: { zh: '联络', en: 'Connection', vi: "Liên thông" }, description: { zh: '定义流形上矢量场的平行移动和协变导数', en: 'Defines parallel transport and covariant derivative of vector fields', vi: "Định nghĩa vận chuyển song song và đạo hàm hiệp biến của trường vectơ" }, importance: 3 }
    ],
    formulas: [
      { id: 'geodesic-eq', name: { zh: '测地线方程', en: 'Geodesic Equation', vi: "Phương trình trắc địa" }, latex: '\\ddot{x}^k + \\Gamma^k_{ij}\\dot{x}^i\\dot{x}^j = 0', description: { zh: '黎曼流形上测地线的微分方程', en: 'Differential equation for geodesics on Riemannian manifolds', vi: "Phương trình vi phân của đường trắc địa trên đa tạp Riemann" }, variables: [
        { symbol: '\\Gamma^k_{ij}', description: { zh: 'Christoffel符号', en: 'Christoffel symbols', vi: "Ký hiệu Christoffel" } },
        { symbol: 'x^k(t)', description: { zh: '测地线路径参数', en: 'Geodesic path parameter', vi: "Tham số đường trắc địa" } }
      ], applications: [{ zh: 'GPS导航、广义相对论', en: 'GPS navigation, general relativity', vi: "Định vị GPS, tương đối rộng" }], difficulty: 4 },
      { id: 'ricci-flow', name: { zh: '里奇流', en: 'Ricci Flow', vi: "Dòng Ricci" }, latex: '\\frac{\\partial g}{\\partial t} = -2\\text{Ric}(g)', description: { zh: '按里奇曲率演化黎曼度量，用于庞加莱猜想证明', en: 'Evolves Riemannian metric by Ricci curvature; used in Poincaré conjecture proof', vi: "Cho metric Riemann tiến triển theo độ cong Ricci; dùng chứng minh giả thuyết Poincaré" }, variables: [
        { symbol: 'g(t)', description: { zh: '随时间变化的度量', en: 'Time-dependent metric', vi: "Metric phụ thuộc thời gian" } },
        { symbol: '\\text{Ric}(g)', description: { zh: '里奇曲率张量', en: 'Ricci curvature tensor', vi: "Tensor độ cong Ricci" } }
      ], applications: [{ zh: '拓扑分类、几何分析', en: 'Topological classification, geometric analysis', vi: "Phân loại tô pô, giải tích hình học" }], difficulty: 5 }
    ],
    pioneers: [
      { id: 'gauss', name: 'Carl Friedrich Gauss', nameZh: '卡尔·弗里德里希·高斯', birthYear: 1777, deathYear: 1855, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '微分几何之父，绝妙定理(Theorema Egregrium)', en: 'Father of differential geometry, Theorema Egregrium', vi: "Đặt nền móng hình học vi phân, định lý Theorema Egregium" } },
      { id: 'riemann', name: 'Bernhard Riemann', nameZh: '波恩哈德·黎曼', birthYear: 1826, deathYear: 1866, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '黎曼几何创始人，黎曼流形，张量微积分', en: 'Founder of Riemannian geometry, Riemannian manifold, tensor calculus', vi: "Sáng lập hình học Riemann, đa tạp Riemann, phép tính tensor" } },
      { id: 'levi-civita', name: 'Tullio Levi-Civita', nameZh: '图利奥·列维-奇维塔', birthYear: 1873, deathYear: 1941, nationality: '意大利', nationalityNames: {"zh": "意大利", "en": "Italy", "vi": "Ý"}, contributions: { zh: '平行移动概念，张量微积分系统化', en: 'Concept of parallel transport, systematic tensor calculus', vi: "Khái niệm vận chuyển song song, hệ thống hóa phép tính tensor" } },
      { id: 'cartan', name: 'Élie Cartan', nameZh: '埃利·嘉当', birthYear: 1869, deathYear: 1951, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '外微分形式、活动标架法、联络理论', en: 'Differential forms, moving frame method, connection theory', vi: "Dạng vi phân, phương pháp mục tiêu di động, lý thuyết liên thông" } },
      { id: 'chern', name: 'Shing-Shen Chern', nameZh: '陈省身', birthYear: 1911, deathYear: 2004, nationality: '中国/美国', nationalityNames: {"zh": "中国/美国", "en": "China / United States", "vi": "Trung Quốc / Hoa Kỳ"}, contributions: { zh: '陈类、陈-西蒙斯理论，整体微分几何奠基人', en: 'Chern classes, Chern-Simons theory, founder of global differential geometry', vi: "Lớp Chern, lý thuyết Chern–Simons, sáng lập hình học vi phân toàn cục" } },
      { id: 'perelman', name: 'Grigori Perelman', nameZh: '格里戈里·佩雷尔曼', birthYear: 1966, nationality: '俄罗斯', nationalityNames: {"zh": "俄罗斯", "en": "Russia", "vi": "Nga"}, contributions: { zh: '用里奇流证明庞加莱猜想和几何化猜想', en: 'Proved Poincaré conjecture and geometrization via Ricci flow', vi: "Chứng minh giả thuyết Poincaré và hình học hóa bằng dòng Ricci" } }
    ],
    figures: [], references: [],
    relatedFields: ['topology', 'analysis', 'physics', 'lie-groups'], applications: ['general-relativity', 'gauge-theory', 'string-theory', 'robotics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 黎曼几何 ====================
  {
    id: 'riemannian-geometry', slug: 'riemannian-geometry',
    names: { zh: '黎曼几何', en: 'Riemannian Geometry', vi: "Hình học Riemann" },
    descriptions: {
      zh: '研究带有黎曼度量（正定对称张量）的光滑流形，是弯曲空间研究的核心框架，广义相对论的四维时空采用洛伦兹度量（伪黎曼几何）。',
      en: 'Studies smooth manifolds with Riemannian metrics (positive-definite symmetric tensors). Core framework for curved space; GR uses Lorentzian metric (pseudo-Riemannian).', vi: "Nghiên cứu đa tạp trơn có metric Riemann (tensor đối xứng xác định dương); tương đối rộng dùng metric Lorentz giả Riemann."
    },
    level: 2, parentId: 'differential-geometry-main', childIds: [],
    position: [0, 0, 0], size: 'large', color: '#0e7490',
    tags: ['riemannian', 'metric', 'curvature'],
    basics: {
      definition: { zh: '在光滑流形上赋予正定度量张量后形成的几何结构。距离、角度、体积均可由此度量定义。', en: 'Geometric structure arising from endowing a smooth manifold with a positive-definite metric tensor. Distance, angles, volume all defined from this metric.', vi: "Gán tensor metric xác định dương cho đa tạp trơn để định nghĩa khoảng cách, góc và thể tích." },
      scope: { zh: '黎曼度量与联络、截面曲率、比较定理、完备性与Hopf-Rinow、谱几何、 Ricci流。', en: 'Riemannian metrics & connections, sectional curvature, comparison theorems, completeness & Hopf-Rinow, spectral geometry, Ricci flow.', vi: "Metric, liên thông Riemann, độ cong tiết diện, định lý so sánh, tính đầy đủ, Hopf–Rinow, hình học phổ và dòng Ricci." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1854, event: { zh: '黎曼历史性演讲《论几何基础的假设》', en: "Riemann's landmark lecture Über die Hypothesen", vi: "Bài giảng quan trọng Über die Hypothesen của Riemann" }, figure: 'riemann' },
        { year: 1900, event: { zh: '希尔伯特第23问题涉及变分法和微分几何', en: "Hilbert's 23rd problem involves calculus of variations & DG", vi: "Bài toán 23 của Hilbert liên quan biến phân và hình học vi phân" } },
        { year: 1915, event: { zh: '爱因斯坦场方程——黎曼几何的物理应用巅峰', en: 'Einstein field equations — pinnacle of physical application of Riemannian geometry', vi: "Phương trình trường Einstein — ứng dụng vật lý nổi bật của hình học Riemann" } },
        { year: 2003, event: { zh: '佩雷尔曼公布里奇流证明', en: 'Perelman publishes Ricci flow proof', vi: "Perelman công bố chứng minh bằng dòng Ricci" } }
      ],
      tags: []
    },
    principles: [
      { id: 'rgp1', title: { zh: '比较几何', en: 'Comparison Geometry', vi: "Hình học so sánh" }, description: { zh: '通过与常曲率空间模型（球面/欧氏/双曲）比较获得曲率约束下的拓扑信息', en: 'Obtain curvature-constrained topological info by comparing with constant-curvature models (sphere/Euclidean/hyperbolic)', vi: "So sánh với mô hình độ cong hằng (cầu, Euclid, hyperbolic) để suy ra thông tin tô pô dưới ràng buộc độ cong" }, importance: 3 },
      { id: 'rgp2', title: { zh: 'Hopf-Rinow定理', en: 'Hopf-Rinow Theorem', vi: "Định lý Hopf–Rinow" }, description: { zh: '完备黎曼流形上测地完备性等同于度量完备性', en: 'On complete Riemannian manifolds, geodesic completeness equals metric completeness', vi: "Trên đa tạp Riemann, đầy đủ trắc địa tương đương đầy đủ metric" }, importance: 2 }
    ],
    formulas: [
      { id: 'einstein-field', name: { zh: '爱因斯坦场方程', en: 'Einstein Field Equations', vi: "Phương trình trường Einstein" }, latex: 'R_{\\mu\\nu} - \\frac{1}{2}R g_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}', description: { zh: '描述引力如何由物质能量分布引起时空弯曲', en: 'Describes how gravity arises from matter-energy causing spacetime curvature', vi: "Mô tả hấp dẫn phát sinh do vật chất và năng lượng làm cong không–thời gian" }, variables: [
        { symbol: 'R_{\\mu\\nu}', description: { zh: '里奇曲率张量', en: 'Ricci curvature tensor', vi: "Tensor độ cong Ricci" } },
        { symbol: 'T_{\\mu\\nu}', description: { zh: '应力-能量张量', en: 'Stress-energy tensor', vi: "Tensor năng lượng – động lượng" } },
        { symbol: '\\Lambda', description: { zh: '宇宙常数', en: 'Cosmological constant', vi: "Hằng số vũ trụ" } }
      ], applications: [{ zh: '广义相对论、宇宙学、黑洞物理', en: 'General relativity, cosmology, black hole physics', vi: "Tương đối rộng, vũ trụ học, vật lý lỗ đen" }], difficulty: 5 }
    ],
    pioneers: [
      { id: 'riemann', name: 'Bernhard Riemann', nameZh: '波恩哈德·黎曼', birthYear: 1826, deathYear: 1866, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '黎曼几何创始人，n维弯曲空间理论', en: 'Founder of Riemannian geometry, theory of n-dimensional curved space', vi: "Sáng lập hình học Riemann, lý thuyết không gian cong n chiều" } },
      { id: 'perelman', name: 'Grigori Perelman', nameZh: '格里戈里·佩雷尔曼', birthYear: 1966, nationality: '俄罗斯', nationalityNames: {"zh": "俄罗斯", "en": "Russia", "vi": "Nga"}, contributions: { zh: '里奇流与手术技巧证明庞加莱猜想', en: 'Proved Poincaré conjecture using Ricci flow with surgery', vi: "Chứng minh giả thuyết Poincaré bằng dòng Ricci có phẫu thuật" } }
    ],
    figures: [], references: [],
    relatedFields: ['general-relativity', 'topology', 'geometric-analysis'], applications: ['physics-gravity', 'cosmology', 'gps'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 辛几何 ====================
  {
    id: 'symplectic-geometry', slug: 'symplectic-geometry',
    names: { zh: '辛几何', en: 'Symplectic Geometry', vi: "Hình học symplectic" },
    descriptions: {
      zh: '研究辛流形（偶数维流形上闭的非退化2-形式）的几何学，是经典力学的自然数学框架，也是镜像对称和量子化的关键。',
      en: 'Geometry of symplectic manifolds (closed nondegenerate 2-forms on even-dim manifolds). Natural framework for classical mechanics, key for mirror symmetry and quantization.', vi: "Hình học đa tạp với 2-dạng đóng không suy biến ở chiều chẵn; khuôn khổ cơ học cổ điển, đối xứng gương và lượng tử hóa."
    },
    level: 2, parentId: 'differential-geometry-main', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#0e7490',
    tags: ['differential-geometry', 'symplectic', 'hamiltonian', 'mechanics'],
    basics: {
      definition: { zh: '偶数维光滑流形上配备闭的非退化反对称2-形式（辛形式）后的几何结构。', en: 'Geometric structure on even-dimensional smooth manifolds equipped with closed nondegenerate antisymmetric 2-form (symplectic form).', vi: "Cấu trúc trên đa tạp trơn chẵn chiều có 2-dạng phản đối xứng, đóng và không suy biến (dạng symplectic)." },
      scope: { zh: '辛形式与达布定理、辛拓扑、Hamilton力学、Lagrangian子流形、Gromov-Witten不变量、Fukaya范畴。', en: 'Symplectic forms & Darboux theorem, symplectic topology, Hamiltonian mechanics, Lagrangian submanifolds, Gromov-Witten invariants, Fukaya category.', vi: "Dạng symplectic, định lý Darboux, tô pô symplectic, cơ học Hamilton, đa tạp con Lagrange, bất biến Gromov–Witten, phạm trù Fukaya." },
      importance: 4, difficulty: 5,
      history: [
        { year: 1800, event: { zh: '拉格朗日和哈密顿的分析力学', en: "Lagrange and Hamilton's analytical mechanics", vi: "Cơ học giải tích của Lagrange và Hamilton" } },
        { year: 1950, event: { zh: '辛几何作为独立学科形成', en: 'Symplectic geometry emerges as independent discipline', vi: "Hình học symplectic trở thành ngành độc lập" } },
        { year: 1985, event: { zh: 'Gromov拟全纯曲线与非挤压定理', en: "Gromov's pseudo-holomorphic curves & non-squeezing theorem", vi: "Đường cong giả chỉnh hình và định lý không ép của Gromov" } }
      ],
      tags: []
    },
    principles: [
      { id: 'sgp1', title: { zh: 'Darboux定理', en: 'Darboux Theorem', vi: "Định lý Darboux" }, description: { zh: '辛流形局部上都是标准的：ω=∑dxᵢ∧dyᵢ', en: 'All symplectic manifolds are locally standard: ω = Σ dx_i ∧ dy_i', vi: "Mọi đa tạp symplectic có dạng chuẩn cục bộ: ω = Σ dx_i ∧ dy_i" }, importance: 3 },
      { id: 'sgp2', title: { zh: '非挤压定理', en: 'Non-Squeezing Theorem', vi: "Định lý không ép" }, description: { zh: '辛映射不能将球体压入半径更小的圆柱——区别于体积保持', en: 'Symplectomorphisms cannot squeeze a ball into a thinner cylinder — unlike volume-preserving', vi: "Phép biến đổi symplectic không thể ép quả cầu vào hình trụ hẹp hơn, khác với biến đổi chỉ bảo toàn thể tích" }, importance: 3 }
    ],
    formulas: [
      { id: 'hamilton-eq', name: { zh: 'Hamilton正则方程', en: "Hamilton's Canonical Equations", vi: "Phương trình chính tắc Hamilton" }, latex: '\\dot{q}^i = \\frac{\\partial H}{\\partial p_i}, \\quad \\dot{p}_i = -\\frac{\\partial H}{\\partial q^i}', description: { zh: '辛流形上由哈密顿函数生成的时间演化方程', en: 'Time evolution equations generated by Hamiltonian function on symplectic manifold', vi: "Phương trình tiến triển theo thời gian do hàm Hamilton sinh ra trên đa tạp symplectic" }, variables: [
        { symbol: 'H(q,p)', description: { zh: '哈密顿函数（总能量）', en: 'Hamiltonian function (total energy)', vi: "Hàm Hamilton (tổng năng lượng)" } },
        { symbol: '(q,p)', description: { zh: '正则坐标（位置-动量）', en: 'Canonical coordinates (position-momentum)', vi: "Tọa độ chính tắc (vị trí – động lượng)" } }
      ], applications: [{ zh: '经典力学、天体力学、等离子体物理', en: 'Classical mechanics, celestial mechanics, plasma physics', vi: "Cơ học cổ điển, cơ học thiên thể, vật lý plasma" }], difficulty: 3 }
    ],
    pioneers: [
      { id: 'gromov', name: 'Mikhail Gromov', nameZh: '米哈伊尔·格罗莫夫', birthYear: 1943, nationality: '俄/法', nationalityNames: {"zh": "俄/法", "en": "Russia / France", "vi": "Nga / Pháp"}, contributions: { zh: 'h原理、辛刚性、拟全纯曲线、阿贝尔奖得主', en: 'h-principle, symplectic rigidity, pseudo-holomorphic curves, Abel Prize winner', vi: "Nguyên lý h, tính cứng symplectic, đường cong giả chỉnh hình, nhận giải Abel" } },
      { id: 'arnold', name: 'Vladimir Arnold', nameZh: '弗拉基米尔·阿诺尔德', birthYear: 1937, deathYear: 2010, nationality: '俄罗斯', nationalityNames: {"zh": "俄罗斯", "en": "Russia", "vi": "Nga"}, contributions: { zh: 'KAM理论、辛拓扑基础、 Arnold扩散', en: 'KAM theory, foundations of symplectic topology, Arnold diffusion', vi: "Lý thuyết KAM, nền tảng tô pô symplectic, khuếch tán Arnold" } }
    ],
    figures: [], references: [],
    relatedFields: ['classical-mechanics', 'lie-groups', 'low-dimensional-topology'], applications: ['mechanics', 'optics', 'control-theory'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 复几何 / 复流形 ====================
  {
    id: 'complex-manifolds', slug: 'complex-manifolds',
    names: { zh: '复几何', en: 'Complex Geometry / Complex Manifolds', vi: "Hình học phức và đa tạp phức" },
    descriptions: {
      zh: '研究复结构（满足J²=-I的线性变换）的流形，连接复分析、代数几何和微分几何的重要桥梁。',
      en: 'Study of manifolds with complex structures (linear operators J satisfying J²=-I). Key bridge between complex analysis, algebraic geometry, and differential geometry.', vi: "Nghiên cứu đa tạp có cấu trúc phức (toán tử J thỏa J²=-I); liên hệ giải tích phức, hình học đại số và vi phân."
    },
    level: 2, parentId: 'differential-geometry-main', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#0891b2',
    tags: ['differential-geometry', 'complex', 'kahler', 'hermitian'],
    basics: {
      definition: { zh: '复流形是带有全纯转移函数图的微分流形。Kähler流形同时具有复、黎曼和辛三种结构。', en: 'Complex manifold is a differentiable manifold with holomorphic transition maps. Kähler manifolds simultaneously carry complex, Riemannian, and symplectic structures.', vi: "Đa tạp phức có ánh xạ chuyển tọa độ chỉnh hình; đa tạp Kähler đồng thời mang cấu trúc phức, Riemann và symplectic." },
      scope: { zh: '几乎复结构与可积性、Hermite度量、Kähler几何、Hodge理论、复芒福德理论、Calabi-Yau流形。', en: 'Almost complex structures & integrability, Hermitian metrics, Kähler geometry, Hodge theory, complex Monge-Ampère, Calabi-Yau manifolds.', vi: "Cấu trúc gần phức, tính khả tích, metric Hermite, hình học Kähler, Hodge, Monge–Ampère phức, đa tạp Calabi–Yau." },
      importance: 4, difficulty: 5,
      history: [
        { year: 1930, event: { zh: 'Hodge理论诞生', en: 'Hodge theory born', vi: "Lý thuyết Hodge ra đời" } },
        { year: 1950, event: { zh: 'Kähler几何的系统化', en: 'Systematization of Kähler geometry', vi: "Hệ thống hóa hình học Kähler" } },
        { year: 1977, event: { zh: 'Yau证明卡拉比猜想', en: 'Yau proves Calabi conjecture', vi: "Yau chứng minh giả thuyết Calabi" } },
        { year: 1980, event: { zh: '弦理论中Calabi-Yau流形的关键作用', en: 'Crucial role of Calabi-Yau manifolds in string theory', vi: "Vai trò quan trọng của đa tạp Calabi–Yau trong lý thuyết dây" } }
      ],
      tags: []
    },
    principles: [
      { id: 'cgp1', title: { zh: 'Newlander-Nirenberg定理', en: 'Newlander-Nirenberg Theorem', vi: "Định lý Newlander–Nirenberg" }, description: { zh: '几乎复结构可积当且仅当Nijenhuis张量为零', en: 'Almost complex structure is integrable iff Nijenhuis tensor vanishes', vi: "Cấu trúc gần phức khả tích khi và chỉ khi tensor Nijenhuis bằng 0" }, importance: 3 },
      { id: 'cgp2', title: { zh: 'Hodge分解', en: 'Hodge Decomposition', vi: "Phân rã Hodge" }, description: { zh: '紧Kähler流形上de Rham上同调分解为(p,q)型分量', en: 'de Rham cohomology on compact Kähler decomposes into (p,q) components', vi: "Đối đồng điều de Rham trên đa tạp Kähler compact phân rã thành các thành phần (p,q)" }, importance: 3 }
    ],
    formulas: [
      { id: 'kahler-condition', name: { zh: 'Kähler条件', en: 'Kähler Condition', vi: "Điều kiện Kähler" }, latex: 'd\\omega = 0, \\quad \\omega = i\\partial\\bar\\partial K', description: { zh: 'Kähler形式闭且等于某势函数的(1,1)-型形式', en: 'Kähler form is closed and equals (1,1)-form of some potential function', vi: "Dạng Kähler đóng và cục bộ là (1,1)-dạng sinh bởi hàm thế" }, variables: [
        { symbol: '\\omega', description: { zh: 'Kähler形式', en: 'Kähler form', vi: "Dạng Kähler" } },
        { symbol: 'K', description: { zh: 'Kähler势函数', en: 'Kähler potential', vi: "Thế Kähler" } }
      ], applications: [{ zh: '弦论紧致化、镜像对称', en: 'String compactification, mirror symmetry', vi: "Compact hóa trong lý thuyết dây, đối xứng gương" }], difficulty: 5 }
    ],
    pioneers: [
      { id: 'hodge', name: 'W. V. D. Hodge', nameZh: 'W.V.D. 霍奇', birthYear: 1903, deathYear: 1975, nationality: '英国', nationalityNames: {"zh": "英国", "en": "United Kingdom", "vi": "Anh"}, contributions: { zh: 'Hodge理论——调和形式与复结构的关系', en: 'Hodge theory — relation between harmonic forms and complex structure', vi: "Lý thuyết Hodge liên hệ dạng điều hòa với cấu trúc phức" } },
      { id: 'yau', name: 'Shing-Tung Yau', nameZh: '丘成桐', birthYear: 1949, nationality: '中国/美国', nationalityNames: {"zh": "中国/美国", "en": "China / United States", "vi": "Trung Quốc / Hoa Kỳ"}, contributions: { zh: '证明卡拉比猜想，卡拉比-丘流形，菲尔兹奖', en: 'Proved Calabi conjecture, Calabi-Yau manifolds, Fields Medalist', vi: "Chứng minh giả thuyết Calabi, đa tạp Calabi–Yau, nhận Huy chương Fields" } },
      { id: 'calabi', name: 'Eugenio Calabi', nameZh: '欧金尼奥·卡拉比', birthYear: 1923, deathYear: 2024, nationality: '意大利/美国', nationalityNames: {"zh": "意大利/美国", "en": "Italy / United States", "vi": "Ý / Hoa Kỳ"}, contributions: { zh: '提出卡拉比猜想——唯一性定理', en: 'Formulated Calabi conjecture — uniqueness theorem', vi: "Phát biểu giả thuyết Calabi, định lý duy nhất" } }
    ],
    figures: [], references: [],
    relatedFields: ['algebraic-geometry', 'complex-analysis', 'theoretical-physics'], applications: ['string-theory', 'mirror-symmetry', 'moduli-spaces'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  }
];
