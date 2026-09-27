import { FieldNode } from '@/types';

export const analysisFields: FieldNode[] = [
  // ==================== 主星系：数学分析 (Analysis) ====================
  {
    id: 'analysis', slug: 'analysis',
    names: { zh: '数学分析', en: 'Mathematical Analysis', vi: "Giải tích toán học" },
    descriptions: {
      zh: '研究函数的极限、微分、积分、无穷级数及其推广的数学分支，是现代数学的核心基础学科。',
      en: 'The branch of mathematics dealing with limits, differentiation, integration, infinite series and their generalizations, forming the core foundation of modern mathematics.', vi: "Ngành Toán nghiên cứu giới hạn, đạo hàm, tích phân, chuỗi vô hạn và các mở rộng; nền tảng cốt lõi của toán học hiện đại."
    },
    level: 1, parentId: null,
    childIds: ['real-analysis', 'multivariable-analysis', 'complex-analysis-node', 'measure-theory-node', 'functional-analysis-node', 'fourier-analysis', 'special-functions', 'approximation-theory'],
    position: [0, 14, -5], size: 'huge', color: '#f59e0b',
    tags: ['analysis', 'calculus', 'limits'],
    basics: {
      definition: { zh: '数学分析以极限为工具，研究函数的连续性、可微性、可积性等性质。它是微积分的严格化与推广。', en: 'Mathematical analysis uses limits as tools to study properties of functions such as continuity, differentiability, and integrability. It is the rigorous extension of calculus.', vi: "Giải tích dùng giới hạn để nghiên cứu tính liên tục, khả vi và khả tích của hàm số; phát triển chặt chẽ từ phép tính vi tích phân." },
      scope: { zh: '包括实分析、复分析、泛函分析、测度论、傅里叶分析、变分法等众多分支。', en: 'Includes real analysis, complex analysis, functional analysis, measure theory, Fourier analysis, calculus of variations, and many more branches.', vi: "Giải tích thực, phức, hàm, lý thuyết độ đo, giải tích Fourier, phép tính biến phân và các nhánh khác." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1687, event: { zh: '牛顿《自然哲学的数学原理》— 微积分诞生', en: "Newton's Principia — birth of calculus", vi: "Principia của Newton — sự ra đời của vi tích phân" } },
        { year: 1684, event: { zh: '莱布尼茨发表首篇微积分论文', en: "Leibniz publishes first calculus paper", vi: "Leibniz công bố bài báo đầu tiên về vi tích phân" } },
        { year: 1821, event: { zh: '柯西《分析教程》— 严格化开端', en: "Cauchy's Cours d'Analyse — beginning of rigorization", vi: "Cours d'Analyse của Cauchy — bắt đầu xây dựng nền tảng chặt chẽ" } },
        { year: 1872, event: { zh: '魏尔斯特拉斯 ε-δ 语言', en: "Weierstrass's ε-δ language", vi: "Ngôn ngữ ε-δ của Weierstrass" } },
        { year: 1902, event: { zh: '勒贝格创立勒贝格积分', en: "Lebesgue creates Lebesgue integration", vi: "Lebesgue xây dựng tích phân Lebesgue" } }
      ],
      tags: ['calculus', 'limits', 'continuity', 'integration']
    },
    principles: [
      { id: 'p1', title: { zh: 'ε-δ 语言', en: 'ε-δ Language', vi: "Ngôn ngữ ε-δ" }, description: { zh: '用严格的量词描述极限过程，是现代分析的基石', en: 'Rigorous description of limit processes using quantifiers, the cornerstone of modern analysis', vi: "Mô tả chặt chẽ quá trình giới hạn bằng lượng từ; nền tảng của giải tích hiện đại" }, importance: 3 },
      { id: 'p2', title: { zh: '一致收敛性', en: 'Uniform Convergence', vi: "Hội tụ đều" }, description: { zh: '函数列收敛的一种强形式，保证极限运算可交换次序', en: 'A strong form of convergence allowing interchange of limit operations', vi: "Dạng hội tụ mạnh cho phép đổi thứ tự các phép lấy giới hạn" }, importance: 3 },
      { id: 'p3', title: { zh: '紧致性', en: 'Compactness', vi: "Tính compact" }, description: { zh: '有限性的推广，在分析学中具有根本重要性', en: 'Generalization of finiteness, of fundamental importance in analysis', vi: "Mở rộng ý niệm hữu hạn, có vai trò cơ bản trong giải tích" }, importance: 3 }
    ],
    formulas: [
      {
        id: 'ftc', name: { zh: '微积分基本定理', en: 'Fundamental Theorem of Calculus', vi: "Định lý cơ bản của vi tích phân" },
        latex: '\\int_a^b f(x)\\,dx = F(b) - F(a), \\quad F\'(x) = f(x)',
        description: { zh: '建立了微分与积分之间的互逆关系，是微积分理论的核心定理', en: 'Establishes the inverse relationship between differentiation and integration, the core theorem of calculus', vi: "Liên hệ ngược nhau giữa đạo hàm và tích phân; định lý cốt lõi của vi tích phân" },
        variables: [
          { symbol: 'f(x)', description: { zh: '被积函数', en: 'Integrand function', vi: "Hàm dưới dấu tích phân" } },
          { symbol: 'F(x)', description: { zh: '原函数（不定积分）', en: 'Antiderivative (indefinite integral)', vi: "Nguyên hàm (tích phân bất định)" } },
          { symbol: 'a, b', description: { zh: '积分区间端点', en: 'Endpoints of interval', vi: "Hai đầu mút của khoảng" } }
        ],
        applications: [{ zh: '计算定积分、物理中的功与能量', en: 'Computing definite integrals, work & energy in physics', vi: "Tính tích phân xác định, công và năng lượng trong vật lý" }],
        difficulty: 2
      },
      {
        id: 'taylor-series', name: { zh: '泰勒级数', en: 'Taylor Series', vi: "Chuỗi Taylor" },
        latex: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n',
        description: { zh: '将光滑函数表示为无穷多项式级数的形式', en: 'Represents a smooth function as an infinite polynomial series', vi: "Biểu diễn hàm bằng chuỗi lũy thừa khi các điều kiện khai triển được thỏa mãn" },
        variables: [
          { symbol: 'f^{(n)}(a)', description: { zh: '函数在a点的n阶导数', en: 'n-th derivative at point a', vi: "Đạo hàm bậc n tại điểm a" } },
          { symbol: '(x-a)^n', description: { zh: '幂项', en: 'Power term', vi: "Hạng tử lũy thừa" } }
        ],
        applications: [{ zh: '函数逼近、误差估计、物理学近似计算', en: 'Function approximation, error estimation, physics approximations', vi: "Xấp xỉ hàm, ước lượng sai số, xấp xỉ trong vật lý" }],
        difficulty: 3
      }
    ],
    pioneers: [
      { id: 'newton', name: 'Isaac Newton', nameZh: '艾萨克·牛顿', birthYear: 1643, deathYear: 1727, nationality: '英国', nationalityNames: {"zh": "英国", "en": "United Kingdom", "vi": "Anh"}, contributions: { zh: '发明流数术（微积分）、万有引力定律、经典力学体系', en: 'Invented fluxions (calculus), law of universal gravitation, classical mechanics', vi: "Phát minh phép tính thông lượng (vi tích phân), định luật vạn vật hấp dẫn và cơ học cổ điển" } },
      { id: 'leibniz', name: 'Gottfried Wilhelm Leibniz', nameZh: '戈特弗里德·威廉·莱布尼茨', birthYear: 1646, deathYear: 1716, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '独立发明微积分、引入d/dx记号、二进制系统', en: 'Independently invented calculus, introduced d/dx notation, binary system', vi: "Độc lập phát minh vi tích phân, đưa ra ký hiệu d/dx và hệ nhị phân" } },
      { id: 'cauchy', name: 'Augustin-Louis Cauchy', nameZh: '奥古斯丁-路易·柯西', birthYear: 1789, deathYear: 1857, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '严格化微积分理论、柯西准则、复变函数论奠基人', en: 'Rigorized calculus theory, Cauchy criterion, founder of complex function theory', vi: "Xây dựng vi tích phân chặt chẽ, tiêu chuẩn Cauchy, sáng lập lý thuyết hàm phức" } },
      { id: 'weierstrass', name: 'Karl Weierstrass', nameZh: '卡尔·魏尔斯特拉斯', birthYear: 1815, deathYear: 1897, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: 'ε-δ语言、连续但处处不可导函数例子、一致收敛理论', en: 'ε-δ language, continuous nowhere-differentiable function, uniform convergence theory', vi: "Ngôn ngữ ε-δ, hàm liên tục không khả vi tại mọi điểm, lý thuyết hội tụ đều" } },
      { id: 'riemann', name: 'Bernhard Riemann', nameZh: '伯恩哈德·黎曼', birthYear: 1826, deathYear: 1866, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '黎曼积分、黎曼几何、黎曼ζ函数、黎曼曲面', en: 'Riemann integral, Riemann geometry, Riemann zeta function, Riemann surfaces', vi: "Tích phân Riemann, hình học Riemann, hàm zeta Riemann, mặt Riemann" } },
      { id: 'lebesgue', name: 'Henri Lebesgue', nameZh: '亨利·勒贝格', birthYear: 1875, deathYear: 1941, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '勒贝格积分与测度论、彻底改变现代分析的面貌', en: 'Lebesgue integral and measure theory, revolutionized modern analysis', vi: "Tích phân Lebesgue và lý thuyết độ đo, đổi mới giải tích hiện đại" } }
    ],
    figures: [], references: [],
    relatedFields: ['algebra', 'geometry', 'topology', 'physics'],
    applications: ['physics', 'engineering', 'economics', 'cs'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 实分析 (Real Analysis) ====================
  {
    id: 'real-analysis', slug: 'real-analysis',
    names: { zh: '实分析', en: 'Real Analysis', vi: "Giải tích thực" },
    descriptions: {
      zh: '研究实数集上函数的性质，包括极限、连续性、微分、积分和无穷级数的严格理论基础。',
      en: 'Studies properties of functions on the real numbers, providing rigorous foundations for limits, continuity, differentiation, integration, and infinite series.', vi: "Nghiên cứu hàm trên số thực, xây dựng nền tảng chặt chẽ cho giới hạn, liên tục, đạo hàm, tích phân và chuỗi vô hạn."
    },
    level: 2, parentId: 'analysis', childIds: [],
    position: [-2, 12, -8], size: 'large', color: '#fbbf24',
    tags: ['analysis', 'real-numbers', 'calculus'],
    basics: {
      definition: { zh: '实分析是数学分析的基础部分，在实数域上建立严格的微积分理论。核心工具包括完备性公理、确界原理等。', en: 'Real analysis is the foundational part of mathematical analysis, establishing rigorous calculus theory over the real numbers. Key tools include the completeness axiom, supremum principle, etc.', vi: "Giải tích thực xây dựng vi tích phân chặt chẽ trên số thực, dựa vào tiên đề đầy đủ và nguyên lý cận trên đúng." },
      scope: { zh: '实数理论、数列与级数、函数极限与连续、黎曼积分、一致收敛、多元函数微积分入门。', en: 'Real number theory, sequences and series, limits and continuity of functions, Riemann integral, uniform convergence, introduction to multivariable calculus.', vi: "Số thực, dãy và chuỗi, giới hạn và liên tục, tích phân Riemann, hội tụ đều, nhập môn vi tích phân nhiều biến." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1872, event: { zh: '戴德金分割定义实数', en: 'Dedekind cut defines real numbers', vi: "Lát cắt Dedekind định nghĩa số thực" } },
        { year: 1892, event: { zh: '若尔当容度理论', en: 'Jordan content theory', vi: "Lý thuyết dung tích Jordan" } },
        { year: 1901, event: { zh: '勒博斯格《积分、长度、面积》', en: "Lebesgue's Intégrale, longueur, aire", vi: "Intégrale, longueur, aire của Lebesgue" } }
      ],
      tags: ['real-numbers', 'limits', 'continuity']
    },
    principles: [
      { id: 'p1', title: { zh: '完备性公理', en: 'Completeness Axiom', vi: "Tiên đề đầy đủ" }, description: { zh: '有上界的非空实数集必有最小上界（确界）', en: 'Every non-empty set of reals bounded above has a least upper bound (supremum)', vi: "Mỗi tập số thực không rỗng bị chặn trên đều có cận trên đúng (supremum)" }, importance: 3 },
      { id: 'p2', title: { zh: '介值定理', en: 'Intermediate Value Theorem', vi: "Định lý giá trị trung gian" }, description: { zh: '连续函数在两点之间取遍一切中间值', en: 'A continuous function takes every intermediate value between two points', vi: "Hàm liên tục nhận mọi giá trị trung gian giữa hai giá trị đầu mút" }, importance: 2 },
      { id: 'p3', title: { zh: '极值定理', en: 'Extreme Value Theorem', vi: "Định lý giá trị lớn nhất và nhỏ nhất" }, description: { zh: '闭区间上的连续函数必有最大值和最小值', en: 'A continuous function on a closed interval attains its maximum and minimum', vi: "Hàm liên tục trên đoạn đóng đạt giá trị lớn nhất và nhỏ nhất" }, importance: 2 }
    ],
    formulas: [
      {
        id: 'mean-value-theorem', name: { zh: '中值定理', en: 'Mean Value Theorem', vi: "Định lý giá trị trung bình" },
        latex: '\\exists c \\in (a,b): f\'(c) = \\frac{f(b)-f(a)}{b-a}',
        description: { zh: '连接平均变化率与瞬时变化率的桥梁定理', en: 'Bridge theorem connecting average rate of change with instantaneous rate', vi: "Liên hệ tốc độ biến thiên trung bình với tốc độ tức thời" },
        variables: [
          { symbol: 'c', description: { zh: '中间点', en: 'Intermediate point', vi: "Điểm trung gian" } },
          { symbol: "f'(c)", description: { zh: '瞬时变化率（导数）', en: 'Instantaneous rate (derivative)', vi: "Tốc độ tức thời (đạo hàm)" } }
        ],
        applications: [{ zh: '证明不等式、判断函数单调性、洛必达法则的基础', en: 'Proving inequalities, determining monotonicity, basis for L\'Hôpital\'s rule', vi: "Chứng minh bất đẳng thức, xét tính đơn điệu, cơ sở quy tắc L'Hôpital" }],
        difficulty: 2
      },
      {
        id: 'riemann-integral', name: { zh: '黎曼积分', en: 'Riemann Integral', vi: "Tích phân Riemann" },
        latex: '\\int_a^b f(x)\\,dx = \\lim_{\\|P\\|\\to 0} \\sum_{i=1}^n f(\\xi_i)\\Delta x_i',
        description: { zh: '通过划分区间求和取极限来定义定积分', en: 'Defines definite integral by partitioning intervals, summing, and taking limit', vi: "Định nghĩa tích phân xác định bằng chia khoảng, lấy tổng và lấy giới hạn" },
        variables: [
          { symbol: 'P', description: { zh: '区间的划分（partition）', en: 'Partition of interval', vi: "Phân hoạch của khoảng" } },
          { symbol: '\\|P\\|', description: { zh: '划分的模（最小区间长度）', en: 'Mesh of partition', vi: "Độ mịn của phân hoạch" } },
          { symbol: '\\xi_i', description: { zh: '第i个子区间的采样点', en: 'Sample point in i-th subinterval', vi: "Điểm lấy mẫu trong khoảng con thứ i" } }
        ],
        applications: [{ zh: '计算面积、物理量（质量、质心、转动惯量）', en: 'Computing area, physical quantities (mass, center of mass, moment of inertia)', vi: "Tính diện tích, khối lượng, trọng tâm và mômen quán tính" }],
        difficulty: 2
      },
      {
        id: 'squeeze-theorem', name: { zh: '夹逼定理/ squeeze theorem', en: 'Squeeze Theorem', vi: "Định lý kẹp" },
        latex: 'g(x) \\leq f(x) \\leq h(x), \\lim g = \\lim h = L \\Rightarrow \\lim f = L',
        description: { zh: '通过两个收敛到同一值的函数夹逼来确定第三个函数的极限', en: 'Determines limit of a function by squeezing between two functions with same limit', vi: "Tìm giới hạn bằng cách kẹp hàm giữa hai hàm có cùng giới hạn" },
        variables: [
          { symbol: 'g(x), h(x)', description: { zh: '上下界函数', en: 'Lower and upper bound functions', vi: "Hàm chặn dưới và chặn trên" } },
          { symbol: 'L', description: { zh: '公共极限值', en: 'Common limit value', vi: "Giá trị giới hạn chung" } }
        ],
        applications: [{ zh: '证明三角函数重要极限 sin(x)/x→1 等', en: 'Proving important trigonometric limits like sin(x)/x→1', vi: "Chứng minh giới hạn lượng giác quan trọng như sin(x)/x→1" }],
        difficulty: 2
      }
    ],
    pioneers: [
      { id: 'dedekind', name: 'Richard Dedekind', nameZh: '理查德·戴德金', birthYear: 1831, deathYear: 1916, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '用戴德金分割构造实数系、理想理论', en: 'Constructed real numbers via Dedekind cuts, ideal theory', vi: "Xây dựng số thực bằng lát cắt Dedekind, lý thuyết iđêan" } },
      { id: 'cantor-analysis', name: 'Georg Cantor', nameZh: '格奥尔格·康托尔', birthYear: 1845, deathYear: 1918, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '实数的康托尔构造、集合论、对角线论证', en: 'Cantor construction of reals, set theory, diagonal argument', vi: "Xây dựng số thực của Cantor, lý thuyết tập hợp, lập luận đường chéo" } }
    ],
    figures: [], references: [],
    relatedFields: ['analysis', 'measure-theory', 'functional-analysis'], applications: ['probability', 'statistics', 'physics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 多元分析 (Multivariable Analysis) ====================
  {
    id: 'multivariable-analysis', slug: 'multivariable-analysis',
    names: { zh: '多元微积分', en: 'Multivariable Calculus / Analysis', vi: "Giải tích nhiều biến" },
    descriptions: {
      zh: '将单变量微积分推广到多个自变量的情形，研究多元函数的极限、偏导数、重积分和向量分析。',
      en: 'Extends single-variable calculus to multiple independent variables, studying limits, partial derivatives, multiple integrals, and vector analysis of multivariable functions.', vi: "Mở rộng vi tích phân một biến sang nhiều biến độc lập: giới hạn, đạo hàm riêng, tích phân bội và giải tích vectơ."
    },
    level: 2, parentId: 'analysis', childIds: [],
    position: [3, 13, -6], size: 'medium', color: '#f59e0b',
    tags: ['analysis', 'multivariable', 'vector-calculus'],
    basics: {
      definition: { zh: '多元分析处理定义在 ℝⁿ 上的函数的微积分问题。包括偏导数、方向导数、梯度、重积分、曲线曲面积分等。', en: 'Multivariable analysis deals with calculus problems for functions defined on ℝⁿ. Includes partial derivatives, directional derivatives, gradients, multiple integrals, line and surface integrals.', vi: "Nghiên cứu vi tích phân của hàm trên ℝⁿ: đạo hàm riêng, đạo hàm theo hướng, gradient, tích phân bội, đường và mặt." },
      scope: { zh: '偏微分与全微分、重积分（二重、三重）、向量场、格林公式、斯托克斯公式、散度定理。', en: 'Partial and total derivatives, multiple integrals (double, triple), vector fields, Green\'s theorem, Stokes\' theorem, divergence theorem.', vi: "Đạo hàm riêng và toàn phần, tích phân kép và ba lớp, trường vectơ, định lý Green, Stokes và phân kỳ." },
      importance: 4, difficulty: 3,
      history: [
        { year: 1740, event: { zh: '克莱罗开始研究偏微分', en: 'Clairaut begins studying partial derivatives', vi: "Clairaut bắt đầu nghiên cứu đạo hàm riêng" } },
        { year: 1854, event: { zh: '斯托克斯定理发表', en: 'Stokes theorem published', vi: "Công bố định lý Stokes" } },
        { year: 1880, event: { zh: '吉布斯发展向量分析符号', en: 'Gibbs develops vector analysis notation', vi: "Gibbs phát triển ký hiệu giải tích vectơ" } }
      ],
      tags: ['partial-derivatives', 'vector-calculus', 'integrals']
    },
    principles: [
      { id: 'p1', title: { zh: '链式法则', en: 'Chain Rule', vi: "Quy tắc dây chuyền" }, description: { zh: '复合函数的偏导数可以通过各层偏导数的乘积之和求得', en: 'Partial derivatives of composite functions can be found by summing products of layer-wise partial derivatives', vi: "Đạo hàm riêng của hàm hợp được tính bằng tổng các tích đạo hàm riêng qua từng lớp hàm" }, importance: 3 },
      { id: 'p2', title: { zh: '隐函数定理', en: 'Implicit Function Theorem', vi: "Định lý hàm ẩn" }, description: { zh: '在一定条件下，方程组可以局部地确定某些变量为其他变量的函数', en: 'Under certain conditions, systems of equations can locally determine some variables as functions of others', vi: "Dưới các điều kiện thích hợp, hệ phương trình xác định cục bộ một số biến như hàm của các biến còn lại" }, importance: 3 }
    ],
    formulas: [
      {
        id: 'gradient', name: { zh: '梯度', en: 'Gradient', vi: "Gradient" },
        latex: '\\nabla f = \\left(\\frac{\\partial f}{\\partial x_1}, \\frac{\\partial f}{\\partial x_2}, \\ldots, \\frac{\\partial f}{\\partial x_n}\\right)',
        description: { zh: '标量场的梯度指向函数增长最快的方向', en: 'The gradient of a scalar field points in the direction of fastest increase', vi: "Gradient của trường vô hướng chỉ hướng tăng nhanh nhất" },
        variables: [
          { symbol: '\\nabla f', description: { zh: '梯度向量', en: 'Gradient vector', vi: "Vectơ gradient" } },
          { symbol: '\\frac{\\partial f}{\\partial x_i}', description: { zh: '第i个方向的偏导数', en: 'Partial derivative in i-th direction', vi: "Đạo hàm riêng theo hướng thứ i" } }
        ],
        applications: [{ zh: '优化算法（梯度下降）、物理中场强计算', en: 'Optimization algorithms (gradient descent), field strength calculations in physics', vi: "Thuật toán tối ưu (hạ gradient), tính cường độ trường trong vật lý" }],
        difficulty: 2
      },
      {
        id: 'divergence-theorem', name: { zh: '高斯散度定理', en: 'Gauss Divergence Theorem', vi: "Định lý phân kỳ Gauss" },
        latex: '\\iiint_V (\\nabla \\cdot \\mathbf{F})\\,dV = \\iint_S \\mathbf{F} \\cdot \\mathbf{n}\\,dS',
        description: { zh: '体积分转化为封闭曲面积分，描述源的净流量', en: 'Converts volume integral to closed surface integral, describing net flux of sources', vi: "Đổi tích phân thể tích thành tích phân trên mặt kín, mô tả thông lượng tổng của nguồn" },
        variables: [
          { symbol: '\\nabla \\cdot \\mathbf{F}', description: { zh: '向量场的散度', en: 'Divergence of vector field', vi: "Phân kỳ của trường vectơ" } },
          { symbol: '\\mathbf{n}', description: { zh: '单位外法向量', en: 'Unit outward normal vector', vi: "Vectơ pháp tuyến đơn vị hướng ra ngoài" } }
        ],
        applications: [{ zh: '电磁学（麦克斯韦方程组）、流体力学', en: 'Electromagnetism (Maxwell equations), fluid dynamics', vi: "Điện từ học (phương trình Maxwell), động lực học chất lưu" }],
        difficulty: 3
      },
      {
        id: 'stokes-theorem', name: { zh: '斯托克斯定理', en: 'Stokes Theorem', vi: "Định lý Stokes" },
        latex: '\\iint_S (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S} = \\oint_C \\mathbf{F} \\cdot d\\mathbf{r}',
        description: { zh: '旋度的曲面积分等于沿边界的环量', en: 'Surface integral of curl equals circulation along boundary', vi: "Tích phân mặt của xoáy bằng lưu thông dọc đường biên" },
        variables: [
          { symbol: '\\nabla \\times \\mathbf{F}', description: { zh: '向量场的旋度', en: 'Curl of vector field', vi: "Xoáy của trường vectơ" } },
          { symbol: 'C = \\partial S', description: { zh: '曲面S的边界曲线', en: 'Boundary curve of surface S', vi: "Đường biên của mặt S" } }
        ],
        applications: [{ zh: '电磁感应定律、流体涡量分析', en: 'Faraday\'s law of induction, fluid vorticity analysis', vi: "Định luật cảm ứng Faraday, phân tích độ xoáy chất lưu" }],
        difficulty: 3
      }
    ],
    pioneers: [
      { id: 'clairaut', name: 'Alexis Clairaut', nameZh: '亚历克西·克莱罗', birthYear: 1713, deathYear: 1765, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '偏微分理论的先驱、克莱罗方程', en: 'Pioneer of partial differential theory, Clairaut equation', vi: "Tiên phong về đạo hàm riêng, phương trình Clairaut" } },
      { id: 'gibbs', name: 'Josiah Willard Gibbs', nameZh: '乔赛亚·威拉德·吉布斯', birthYear: 1839, deathYear: 1903, nationality: '美国', nationalityNames: {"zh": "美国", "en": "United States", "vi": "Hoa Kỳ"}, contributions: { zh: '向量分析符号系统的创立者、统计力学奠基人', en: 'Founder of vector analysis notation system, founder of statistical mechanics', vi: "Xây dựng hệ ký hiệu giải tích vectơ, sáng lập cơ học thống kê" } }
    ],
    figures: [], references: [],
    relatedFields: ['analysis', 'differential-equations', 'differential-geometry'], applications: ['physics', 'engineering', 'ml', 'optimization'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 复变函数 (Complex Analysis) — 独立主星系 ====================
  {
    id: 'complex-analysis', slug: 'complex-analysis',
    names: { zh: '复变函数', en: 'Complex Analysis', vi: "Giải tích phức" },
    descriptions: {
      zh: '研究复变函数的分析性质，具有远比实分析优美和强大的理论结构，被誉为"数学家的魔术"。',
      en: 'Studies analytic properties of complex-valued functions, possessing far more elegant and powerful theoretical structures than real analysis, often called "the magician\'s math".', vi: "Nghiên cứu tính chất giải tích của hàm giá trị phức, với cấu trúc lý thuyết mạnh mẽ và thanh nhã; đôi khi được ví như toán học của nhà ảo thuật."
    },
    level: 1, parentId: null,
    childIds: ['holomorphic-functions', 'conformal-mapping', 'residue-theory'],
    position: [5, 10, -8], size: 'large', color: '#f59e0b',
    tags: ['complex', 'analytic-functions', 'contour-integration'],
    basics: {
      definition: { zh: '复变函数论研究定义在复平面上的函数。核心概念包括解析函数（全纯函数）、柯西-黎曼条件、留数理论等。', en: 'Complex analysis studies functions defined on the complex plane. Core concepts include holomorphic functions, Cauchy-Riemann conditions, residue theory, etc.', vi: "Nghiên cứu hàm trên mặt phẳng phức: hàm chỉnh hình, điều kiện Cauchy–Riemann, thặng dư và các khái niệm liên quan." },
      scope: { zh: '解析函数、柯西积分公式、洛朗级数、留数计算、共形映射、黎曼映射定理、多值函数（支割线）。', en: 'Holomorphic functions, Cauchy integral formula, Laurent series, residue computation, conformal mapping, Riemann mapping theorem, multi-valued functions (branch cuts).', vi: "Hàm chỉnh hình, công thức tích phân Cauchy, chuỗi Laurent, thặng dư, ánh xạ bảo giác, định lý ánh xạ Riemann, hàm đa trị và nhát cắt." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1750, event: { zh: '欧拉建立复数指数公式 e^(ix)=cos x + i sin x', en: "Euler establishes complex exponential formula e^(ix)=cos x + i sin x", vi: "Euler thiết lập e^(ix)=cos x + i sin x" } },
        { year: 1814, event: { zh: '柯西提出复变积分理论', en: 'Cauchy proposes complex integration theory', vi: "Cauchy đề xuất lý thuyết tích phân phức" } },
        { year: 1851, event: { zh: '黎曼博士论文奠定几何方法', en: "Riemann's dissertation establishes geometric approach", vi: "Luận án Riemann xây dựng cách tiếp cận hình học" } },
        { year: 1896, event: { zh: '阿达马和普桑独立证明素数定理', en: 'Hadamard and de la Vallée Poussin independently prove prime number theorem', vi: "Hadamard và de la Vallée Poussin độc lập chứng minh định lý số nguyên tố" } }
      ],
      tags: ['complex-numbers', 'holomorphic', 'residues']
    },
    principles: [
      { id: 'p1', title: { zh: '柯西-黎曼条件', en: 'Cauchy-Riemann Equations', vi: "Phương trình Cauchy–Riemann" }, description: { zh: '复函数可解析（全纯）的充要条件：u_x=v_y 且 u_y=-v_x', en: 'Necessary and sufficient condition for complex differentiability: u_x=v_y and u_y=-v_x', vi: "Điều kiện Cauchy–Riemann: u_x=v_y và u_y=-v_x; cùng điều kiện chính quy thích hợp, bảo đảm khả vi phức" }, importance: 3 },
      { id: 'p2', title: { zh: '解析延拓', en: 'Analytic Continuation', vi: "Thác triển giải tích" }, description: { zh: '解析函数由其在任一开子集上的值唯一确定', en: 'A holomorphic function is uniquely determined by its values on any open subset', vi: "Hàm chỉnh hình trên miền liên thông được xác định duy nhất bởi giá trị trên một tập con mở không rỗng" }, importance: 3 },
      { id: 'p3', title: { zh: '最大模原理', en: 'Maximum Modulus Principle', vi: "Nguyên lý môđun cực đại" }, description: { zh: '非常数解析函数在区域内部不能达到最大模', en: 'A non-constant holomorphic function cannot attain maximum modulus inside a domain', vi: "Hàm chỉnh hình không hằng không đạt môđun lớn nhất ở bên trong miền" }, importance: 2 }
    ],
    formulas: [
      {
        id: 'cauchy-integral-formula', name: { zh: '柯西积分公式', en: 'Cauchy Integral Formula', vi: "Công thức tích phân Cauchy" },
        latex: 'f(a) = \\frac{1}{2\\pi i} \\oint_\\gamma \\frac{f(z)}{z-a}\\,dz',
        description: { zh: '解析函数在闭路径内部的任意点的值可用该函数在边界上的积分完全确定', en: 'The value of a holomorphic function at any interior point is completely determined by its boundary integral', vi: "Giá trị của hàm chỉnh hình tại điểm trong miền được xác định bởi tích phân trên biên" },
        variables: [
          { symbol: '\\gamma', description: { zh: '包围点a的简单闭曲线', en: 'Simple closed curve enclosing point a', vi: "Đường cong kín đơn bao quanh a" } },
          { symbol: 'f(z)', description: { zh: '解析函数', en: 'Holomorphic function', vi: "Hàm chỉnh hình" } }
        ],
        applications: [{ zh: '计算定积分（实积分化为复积分）、物理中的响应函数', en: 'Evaluating definite integrals (converting real to complex), response functions in physics', vi: "Tính tích phân xác định bằng chuyển sang biến phức, hàm đáp ứng trong vật lý" }],
        difficulty: 3
      },
      {
        id: 'residue-theorem', name: { zh: '留数定理', en: 'Residue Theorem', vi: "Định lý thặng dư" },
        latex: '\\oint_\\gamma f(z)\\,dz = 2\\pi i \\sum_k \\text{Res}(f, z_k)',
        description: { zh: '沿闭路径的积分等于路径内所有奇点处留数之和乘以2πi', en: 'Integral around closed path equals 2πi times sum of residues at all singularities inside', vi: "Tích phân dọc đường kín bằng 2πi nhân tổng các thặng dư bên trong" },
        variables: [
          { symbol: '\\text{Res}(f, z_k)', description: { zh: 'f在奇点z_k处的留数', en: 'Residue of f at singularity z_k', vi: "Thặng dư của f tại điểm kỳ dị z_k" } },
          { symbol: 'z_k', description: { zh: '路径内的孤立奇点', en: 'Isolated singularities inside path', vi: "Các điểm kỳ dị cô lập bên trong đường tích phân" } }
        ],
        applications: [{ zh: '快速计算复杂定积分、拉普拉斯逆变换、量子场论', en: 'Rapid evaluation of complex definite integrals, inverse Laplace transform, quantum field theory', vi: "Tính tích phân phức nhanh, biến đổi Laplace ngược, lý thuyết trường lượng tử" }],
        difficulty: 4
      },
      {
        id: 'euler-formula', name: { zh: '欧拉公式', en: "Euler's Formula", vi: "Công thức Euler" },
        latex: 'e^{ix} = \\cos x + i\\sin x, \\quad e^{i\\pi} + 1 = 0',
        description: { zh: '连接指数函数与三角函数的最美数学公式之一，将五个最重要的常数联系在一起', en: 'One of the most beautiful formulas connecting exponential and trigonometric functions, linking five most important constants', vi: "Công thức liên hệ hàm mũ với lượng giác; đồng nhất thức Euler kết nối năm hằng số quan trọng" },
        variables: [
          { symbol: 'e', description: { zh: '自然对数的底', en: 'Base of natural logarithm', vi: "Cơ số logarit tự nhiên" } },
          { symbol: 'i', description: { zh: '虚数单位', en: 'Imaginary unit', vi: "Đơn vị ảo" } }
        ],
        applications: [{ zh: '信号处理、量子力学、交流电路分析', en: 'Signal processing, quantum mechanics, AC circuit analysis', vi: "Xử lý tín hiệu, cơ học lượng tử, mạch điện xoay chiều" }],
        difficulty: 2
      }
    ],
    pioneers: [
      { id: 'euler-complex', name: 'Leonhard Euler', nameZh: '莱昂哈德·欧拉', birthYear: 1707, deathYear: 1783, nationality: '瑞士/俄国', nationalityNames: {"zh": "瑞士/俄国", "en": "Switzerland / Russia", "vi": "Thụy Sĩ / Nga"}, contributions: { zh: '欧拉公式、复分析先驱、最多产的数学家之一', en: "Euler's formula, pioneer of complex analysis, one of the most prolific mathematicians", vi: "Công thức Euler, tiên phong giải tích phức, nhà toán học có nhiều công trình" } },
      { id: 'riemann-complex', name: 'Bernhard Riemann', nameZh: '伯恩哈德·黎曼', birthYear: 1826, deathYear: 1866, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '黎曼曲面、黎曼ζ函数与素数猜想、黎曼映射定理', en: 'Riemann surfaces, Riemann zeta function and prime conjecture, Riemann mapping theorem', vi: "Mặt Riemann, hàm zeta và giả thuyết Riemann, định lý ánh xạ Riemann" } },
      { id: 'weierstrass-complex', name: 'Karl Weierstrass', nameZh: '卡尔·魏尔斯特拉斯', birthYear: 1815, deathYear: 1897, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '魏尔斯特拉斯因式分解定理、一致收敛理论、椭圆函数', en: 'Weierstrass factorization theorem, uniform convergence theory, elliptic functions', vi: "Định lý phân tích Weierstrass, hội tụ đều, hàm elliptic" } }
    ],
    figures: [], references: [],
    relatedFields: ['analysis', 'numbertheory', 'topology', 'physics'],
    applications: ['fluid-dynamics', 'electromagnetism', 'quantum-mechanics', 'signal-processing', 'control-theory'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 复分析子节点：全纯函数
  {
    id: 'holomorphic-functions', slug: 'holomorphic-functions',
    names: { zh: '全纯/解析函数', en: 'Holomorphic / Analytic Functions', vi: "Hàm chỉnh hình và hàm giải tích" },
    descriptions: { zh: '复平面上处处可微的函数，拥有无穷阶可导、可展开为幂级数等强大性质。', en: 'Functions that are everywhere differentiable on the complex plane, possessing infinitely differentiable and power series expandable properties.', vi: "Hàm khả vi phức trên miền xét, có đạo hàm mọi bậc và khai triển chuỗi lũy thừa cục bộ." },
    level: 2, parentId: 'complex-analysis', childIds: [],
    position: [7, 9, -6], size: 'small', color: '#fbbf24',
    tags: ['complex-analysis', 'complex', 'holomorphic'],
    basics: {
      definition: { zh: '全纯函数是在某开集内每一点都可复微分的函数。它自动无穷次可导且可展成幂级数。', en: 'A holomorphic function is complex-differentiable at every point in an open set. It is automatically infinitely differentiable and can be expanded into power series.', vi: "Hàm chỉnh hình khả vi phức tại mọi điểm của tập mở; tự động khả vi vô hạn lần và khai triển được thành chuỗi lũy thừa." },
      scope: { zh: '整函数、亚纯函数、幂级数展开、零点与奇点分类。', en: 'Entire functions, meromorphic functions, power series expansion, classification of zeros and singularities.', vi: "Hàm nguyên, hàm phân hình, khai triển chuỗi lũy thừa, phân loại nghiệm và điểm kỳ dị." },
      importance: 4, difficulty: 4,
      history: [
        { year: 1851, event: { zh: '黎曼博士论文', en: "Riemann's doctoral thesis", vi: "Luận án tiến sĩ của Riemann" } }
      ],
      tags: []
    },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['complex-analysis', 'functional-analysis'], applications: ['physics', 'engineering'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 复分析子节点：共形映射
  {
    id: 'conformal-mapping', slug: 'conformal-mapping',
    names: { zh: '共形映射', en: 'Conformal Mapping', vi: "Ánh xạ bảo giác" },
    descriptions: { zh: '保持角度不变的复函数映射，广泛应用于流体力学、静电学和空气动力学等领域。', en: 'Angle-preserving complex mappings, widely used in fluid mechanics, electrostatics, aerodynamics, and other fields.', vi: "Ánh xạ phức bảo toàn góc, dùng trong cơ học chất lưu, tĩnh điện và khí động học." },
    level: 2, parentId: 'complex-analysis', childIds: [],
    position: [7, 11, -4], size: 'small', color: '#f59e0b',
    tags: ['complex', 'mapping', 'geometry'],
    basics: {
      definition: { zh: '共形映射是保持局部角度和定向的双射全纯函数。黎曼映射定理保证任意单连通区域可共形映为单位圆盘。', en: 'Conformal mapping is a bijective holomorphic function preserving local angles and orientation. Riemann mapping theorem guarantees any simply connected region can be conformally mapped to the unit disk.', vi: "Ánh xạ bảo giác bảo toàn góc và hướng cục bộ. Định lý Riemann bảo đảm miền đơn liên thực sự của mặt phẳng phức tương đương bảo giác với đĩa đơn vị." },
      scope: { zh: '分式线性变换、茹科夫斯基变换、施瓦茨-克里斯托费尔变换、黎曼映射定理。', en: 'Möbius transformations, Joukowski transformation, Schwarz-Christoffel transformation, Riemann mapping theorem.', vi: "Biến đổi Möbius, Joukowski, Schwarz–Christoffel và định lý ánh xạ Riemann." },
      importance: 3, difficulty: 4,
      history: [
        { year: 1867, event: { zh: '黎曼映射定理首次陈述', en: 'Riemann mapping theorem first stated', vi: "Phát biểu đầu tiên của định lý ánh xạ Riemann" } }
      ],
      tags: []
    },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['complex-analysis', 'differential-geometry', 'fluid-dynamics'], applications: ['airfoil-design', 'heat-transfer', 'electrostatics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 复分析子节点：留数理论
  {
    id: 'residue-theory', slug: 'residue-theory',
    names: { zh: '留数理论', en: 'Residue Theory', vi: "Lý thuyết thặng dư" },
    descriptions: { zh: '利用函数在奇点附近的行为计算围道积分的强大技术，可将困难的实积分化为简单的代数计算。', en: 'Powerful technique for computing contour integrals using behavior near singularities, reducing difficult real integrals to simple algebraic computations.', vi: "Dùng hành vi gần điểm kỳ dị để tính tích phân đường, chuyển nhiều tích phân thực khó thành tính toán đại số." },
    level: 2, parentId: 'complex-analysis', childIds: [],
    position: [4, 8, -10], size: 'small', color: '#d97706',
    tags: ['complex', 'integration', 'singularities'],
    basics: {
      definition: { zh: '留数是洛朗级数展开中(z-z₀)⁻¹项的系数。留数定理将围道积分简化为各奇点留数的求和。', en: 'The residue is the coefficient of (z-z₀)⁻¹ term in Laurent series expansion. Residue theorem reduces contour integrals to summing residues at singularities.', vi: "Thặng dư là hệ số của (z-z₀)⁻¹ trong chuỗi Laurent; định lý thặng dư đưa tích phân đường về tổng thặng dư." },
      scope: { zh: '极点分类（一阶、m阶、本性奇点）、留数计算方法、定积分应用、辐角原理。', en: 'Classification of poles (simple, m-order, essential), residue computation methods, application to definite integrals, argument principle.', vi: "Phân loại cực đơn và cực bậc m, kỳ dị cốt yếu, tính thặng dư, tích phân xác định, nguyên lý đối số." },
      importance: 4, difficulty: 4,
      history: [
        { year: 1846, event: { zh: '柯西系统发展留数理论', en: 'Cauchy systematically develops residue theory', vi: "Cauchy phát triển lý thuyết thặng dư có hệ thống" } }
      ],
      tags: []
    },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['complex-analysis', 'fourier-analysis', 'special-functions'], applications: ['integral-evaluation', 'control-theory', 'signal-processing'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 测度论 (Measure Theory) — 独立主星系 ====================
  {
    id: 'measure-theory', slug: 'measure-theory',
    names: { zh: '测度论', en: 'Measure Theory', vi: "Lý thuyết độ đo" },
    descriptions: {
      zh: '为集合赋予"大小"或"体积"的严格数学理论，是现代概率论和实分析的理论基础。',
      en: 'The rigorous mathematical theory of assigning "size" or "volume" to sets, serving as the theoretical foundation of modern probability theory and real analysis.', vi: "Lý thuyết gán kích thước hay thể tích cho tập hợp một cách chặt chẽ; nền tảng của xác suất hiện đại và giải tích thực."
    },
    level: 1, parentId: null,
    childIds: ['lebesgue-measure', 'abstract-measure', 'integration-theory'],
    position: [-2, 20, 0], size: 'medium', color: '#b45309',
    tags: ['measure', 'integration', 'sigma-algebra'],
    basics: {
      definition: { zh: '测度论研究如何给集合分配一个数值（称为测度），满足可加性和σ-可加性。勒贝格测度推广了长度、面积和体积的概念。', en: 'Measure theory studies how to assign numerical values (measures) to sets, satisfying additivity and σ-additivity. Lebesgue measure generalizes length, area, and volume concepts.', vi: "Gán độ đo cho tập hợp, thỏa tính cộng và σ-cộng; độ đo Lebesgue mở rộng độ dài, diện tích và thể tích." },
      scope: { zh: 'σ-代数、外测度与卡拉泰奥多里扩张定理、勒贝格测度与积分、L^p空间、绝对连续性、Radon-Nikodym定理。', en: 'σ-algebras, outer measure and Carathéodory extension theorem, Lebesgue measure and integration, L^p spaces, absolute continuity, Radon-Nikodym theorem.', vi: "σ-đại số, độ đo ngoài, định lý mở rộng Carathéodory, độ đo và tích phân Lebesgue, không gian L^p, liên tục tuyệt đối, định lý Radon–Nikodym." },
      importance: 5, difficulty: 5,
      history: [
        { year: 1902, event: { zh: '勒贝格论文《积分、长度、面积》', en: "Lebesgue's Intégrale, longueur, aire", vi: "Intégrale, longueur, aire của Lebesgue" } },
        { year: 1914, event: { zh: '卡拉泰奥多里提出外测度方法', en: 'Carathéodory proposes outer measure method', vi: "Carathéodory đề xuất phương pháp độ đo ngoài" } },
        { year: 1930, event: { zh: '科尔莫哥洛夫基于测度建立概率公理', en: 'Kolmogorov axioms based on measure theory', vi: "Tiên đề Kolmogorov dựa trên lý thuyết độ đo" } }
      ],
      tags: ['sigma-algebra', 'lebesgue', 'lp-spaces']
    },
    principles: [
      { id: 'p1', title: { zh: 'σ-可加性', en: 'σ-Additivity', vi: "Tính σ-cộng" }, description: { zh: '可数多个不相交集合之并的测度等于各集合测度之和', en: 'Measure of countable union of disjoint sets equals sum of individual measures', vi: "Độ đo của hợp đếm được các tập đôi một rời nhau bằng tổng độ đo của chúng" }, importance: 3 },
      { id: 'p2', title: { zh: '单调收敛定理', en: 'Monotone Convergence Theorem', vi: "Định lý hội tụ đơn điệu" }, description: { zh: '递增可测函数列的极限可以逐项积分', en: 'Limit of increasing sequence of measurable functions can be integrated termwise', vi: "Dãy tăng các hàm đo được không âm cho phép đổi giới hạn và tích phân" }, importance: 3 },
      { id: 'p3', title: { zh: '控制收敛定理', en: 'Dominated Convergence Theorem', vi: "Định lý hội tụ bị chặn" }, description: { zh: '被可积函数控制的函数列可以在积分号下取极限', en: 'Sequence of functions dominated by an integrable function can have limit taken under integral sign', vi: "Dãy hàm bị chặn bởi một hàm khả tích cho phép lấy giới hạn dưới dấu tích phân" }, importance: 3 }
    ],
    formulas: [
      {
        id: 'lebesgue-integral', name: { zh: '勒贝格积分', en: 'Lebesgue Integral', vi: "Tích phân Lebesgue" },
        latex: '\\int_E f\\,d\\mu = \\int_0^\\infty \\mu(\\{x: f(x) > t\\})\\,dt',
        description: { zh: '通过水平集测度来定义积分，克服了黎曼积分的诸多局限', en: 'Defines integral through measures of level sets, overcoming many limitations of Riemann integral', vi: "Định nghĩa tích phân bằng độ đo của tập mức, khắc phục nhiều hạn chế của tích phân Riemann" },
        variables: [
          { symbol: '\\mu', description: { zh: '测度', en: 'Measure', vi: "Độ đo" } },
          { symbol: 'E', description: { zh: '可测集', en: 'Measurable set', vi: "Tập đo được" } },
          { symbol: '\\{x: f(x) > t\\}', description: { zh: '水平集（超集）', en: 'Level set (superlevel set)', vi: "Tập mức (tập trên mức)" } }
        ],
        applications: [{ zh: '概率论、调和分析、泛函分析、偏微分方程', en: 'Probability theory, harmonic analysis, functional analysis, PDEs', vi: "Xác suất, giải tích điều hòa, giải tích hàm, phương trình đạo hàm riêng" }],
        difficulty: 5
      },
      {
        id: 'fatou-lemma', name: { zh: 'Fatou引理', en: "Fatou's Lemma", vi: "Bổ đề Fatou" },
        latex: '\\int \\liminf f_n\\,d\\mu \\leq \\liminf \\int f_n\\,d\\mu',
        description: { zh: '函数列下极限的积分不超过积分的下极限', en: 'Integral of liminf of functions does not exceed liminf of integrals', vi: "Tích phân của liminf không vượt quá liminf của các tích phân" },
        variables: [
          { symbol: 'f_n', description: { zh: '非负可测函数列', en: 'Non-negative measurable function sequence', vi: "Dãy hàm đo được không âm" } },
          { symbol: '\\liminf', description: { zh: '下极限', en: 'Limit inferior', vi: "Giới hạn dưới" } }
        ],
        applications: [{ zh: '证明单调收敛和控制收敛定理的关键引理', en: 'Key lemma for proving MCT and DCT', vi: "Bổ đề quan trọng để chứng minh định lý hội tụ đơn điệu và hội tụ bị chặn" }],
        difficulty: 4
      }
    ],
    pioneers: [
      { id: 'lebesgue-measure', name: 'Henri Lebesgue', nameZh: '亨利·勒贝格', birthYear: 1875, deathYear: 1941, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '勒贝格积分与测度论的创始人', en: 'Creator of Lebesgue integral and measure theory', vi: "Xây dựng tích phân Lebesgue và lý thuyết độ đo" } },
      { id: 'caratheodory', name: 'Constantin Carathéodory', nameZh: '康斯坦丁·卡拉泰奥多里', birthYear: 1873, deathYear: 1950, nationality: '希腊/德国', nationalityNames: {"zh": "希腊/德国", "en": "Greece / Germany", "vi": "Hy Lạp / Đức"}, contributions: { zh: '外测度方法、变分法的严格化', en: 'Outer measure method, rigorous variational calculus', vi: "Phương pháp độ đo ngoài, phép tính biến phân chặt chẽ" } },
      { id: 'kolmogorov-measure', name: 'Andrey Kolmogorov', nameZh: '安德雷·科尔莫哥洛夫', birthYear: 1903, deathYear: 1987, nationality: '苏联', nationalityNames: {"zh": "苏联", "en": "Soviet Union", "vi": "Liên Xô"}, contributions: { zh: '概率论的公理化基础、湍流理论、复杂性理论', en: 'Axiomatization of probability, turbulence theory, complexity theory', vi: "Tiên đề hóa xác suất, lý thuyết nhiễu loạn, lý thuyết độ phức tạp" } }
    ],
    figures: [], references: [],
    relatedFields: ['analysis', 'probability', 'functional-analysis', 'topology'],
    applications: ['probability', 'statistics', 'ergodic-theory', 'finance'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 测度论子节点（作为analysis下的引用节点）
  {
    id: 'measure-theory-node', slug: 'measure-theory-ref',
    names: { zh: '测度论（引用）', en: 'Measure Theory (Reference)', vi: "Lý thuyết độ đo (tham chiếu)" },
    descriptions: { zh: '见主星系 measure-theory', en: 'See main galaxy measure-theory', vi: "Xem nút chính về lý thuyết độ đo" },
    level: 2, parentId: 'analysis', childIds: [],
    position: [-1, 16, -2], size: 'medium', color: '#b45309',
    tags: ['measure', 'reference'],
    basics: { definition: { zh: '测度论——见主星系', en: 'Measure theory — see main galaxy', vi: "Lý thuyết độ đo — xem nút chính" }, scope: { zh: '', en: '', vi: "" }, importance: 5, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['measure-theory', 'functional-analysis'], applications: ['probability', 'analysis'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 泛函分析 (Functional Analysis) — 独立主星系 ====================
  {
    id: 'functional-analysis', slug: 'functional-analysis',
    names: { zh: '泛函分析', en: 'Functional Analysis', vi: "Giải tích hàm" },
    descriptions: {
      zh: '研究无穷维线性空间（如函数空间）及上线性算子的数学分支，是现代数学和量子力学的基石。',
      en: 'The branch of mathematics studying infinite-dimensional linear spaces (such as function spaces) and linear operators thereon, cornerstone of modern mathematics and quantum mechanics.', vi: "Nghiên cứu không gian tuyến tính vô hạn chiều (như không gian hàm) và toán tử trên đó; nền tảng của toán học hiện đại và cơ học lượng tử."
    },
    level: 1, parentId: null,
    childIds: ['operator-theory', 'banach-spaces', 'distribution-theory', 'hilbert-spaces'],
    position: [4, 18, 2], size: 'large', color: '#d97706',
    tags: ['functional-analysis', 'functional', 'banach', 'hilbert', 'operators'],
    basics: {
      definition: { zh: '泛函分析将函数视为空间中的点，研究这些空间的结构以及其上的算子（即函数的函数）。核心对象包括巴拿赫空间和希尔伯特空间。', en: 'Functional analysis treats functions as points in spaces, studying structure of these spaces and operators on them (functions of functions). Core objects include Banach and Hilbert spaces.', vi: "Xem hàm như điểm trong không gian, nghiên cứu cấu trúc không gian và toán tử; đối tượng chính là không gian Banach và Hilbert." },
      scope: { zh: '赋范线性空间、巴拿赫空间、希尔伯特空间、有界线性算子、谱理论、弱拓扑、分布理论。', en: 'Normed linear spaces, Banach spaces, Hilbert spaces, bounded linear operators, spectral theory, weak topologies, distribution theory.', vi: "Không gian định chuẩn, Banach, Hilbert, toán tử tuyến tính bị chặn, lý thuyết phổ, tô pô yếu, lý thuyết phân phối." },
      importance: 5, difficulty: 5,
      history: [
        { year: 1906, event: { zh: '弗雷歇引入抽象度量空间', en: 'Fréchet introduces abstract metric spaces', vi: "Fréchet đưa ra không gian metric trừu tượng" } },
        { year: 1920, event: { zh: '巴拿赫空间理论形成', en: 'Banach space theory takes shape', vi: "Lý thuyết không gian Banach hình thành" } },
        { year: 1929, event: { zh: '冯·诺依曼建立希尔伯特空间谱理论', en: 'von Neumann builds Hilbert space spectral theory', vi: "von Neumann xây dựng lý thuyết phổ trên không gian Hilbert" } },
        { year: 1932, event: { zh: '巴拿赫《线性算子理论》出版', en: "Banach's Théorie des opérations linéaires published", vi: "Công bố Théorie des opérations linéaires của Banach" } },
        { year: 1945, event: { zh: '施瓦兹创立分布（广义函数）理论', en: 'Schwartz creates distribution (generalized function) theory', vi: "Schwartz xây dựng lý thuyết phân phối (hàm suy rộng)" } }
      ],
      tags: ['banach-space', 'hilbert-space', 'spectral-theory', 'operators']
    },
    principles: [
      { id: 'p1', title: { zh: '哈恩-巴拿赫定理', en: 'Hahn-Banach Theorem', vi: "Định lý Hahn–Banach" }, description: { zh: '线性泛函可在不增加范数的情况下从子空间延拓到整个空间', en: 'Linear functionals can be extended from subspace to whole space without increasing norm', vi: "Phiếm hàm tuyến tính có thể mở rộng từ không gian con ra toàn không gian mà không tăng chuẩn" }, importance: 3 },
      { id: 'p2', title: { zh: '开映射定理', en: 'Open Mapping Theorem', vi: "Định lý ánh xạ mở" }, description: { zh: '巴拿赫空间间的有界满算子是开映射', en: 'Bounded surjective operator between Banach spaces is an open map', vi: "Toán tử bị chặn toàn ánh giữa hai không gian Banach là ánh xạ mở" }, importance: 3 },
      { id: 'p3', title: { zh: '一致有界原理', en: 'Uniform Boundedness Principle', vi: "Nguyên lý bị chặn đều" }, description: { zh: '巴拿赫空间上点点有界的算子族一致有界', en: 'Pointwise bounded family of operators on Banach space is uniformly bounded', vi: "Họ toán tử bị chặn tại từng điểm trên không gian Banach thì bị chặn đều" }, importance: 3 }
    ],
    formulas: [
      {
        id: 'inner-product', name: { zh: '内积', en: 'Inner Product', vi: "Tích vô hướng" },
        latex: '\\langle x, y \\rangle = \\int_\\Omega x(t)\\overline{y(t)}\\,dt, \\quad \\|x\\|^2 = \\langle x, x \\rangle',
        description: { zh: '希尔伯特空间的内积诱导范数和几何结构', en: 'Inner product in Hilbert space induces norm and geometric structure', vi: "Tích vô hướng trên không gian Hilbert sinh ra chuẩn và cấu trúc hình học" },
        variables: [
          { symbol: '\\langle x, y \\rangle', description: { zh: 'x和y的内积', en: 'Inner product of x and y', vi: "Tích vô hướng của x và y" } },
          { symbol: '\\|x\\|', description: { zh: 'x的范数（由内积诱导）', en: 'Norm of x (induced by inner product)', vi: "Chuẩn của x do tích vô hướng sinh ra" } }
        ],
        applications: [{ zh: '量子力学态空间、Fourier分析、正交多项式', en: 'Quantum mechanical state space, Fourier analysis, orthogonal polynomials', vi: "Không gian trạng thái lượng tử, giải tích Fourier, đa thức trực giao" }],
        difficulty: 3
      },
      {
        id: 'spectral-theorem', name: { zh: '谱定理', en: 'Spectral Theorem', vi: "Định lý phổ" },
        latex: 'A = U\\Lambda U^*, \\quad \\Lambda = \\text{diag}(\\lambda_1, \\lambda_2, \\ldots)',
        description: { zh: '正规算子（特别是自伴算子）可以对角化，其特征值构成算子的谱', en: 'Normal operators (especially self-adjoint ones) can be diagonalized; eigenvalues form the spectrum', vi: "Toán tử chuẩn tắc, đặc biệt toán tử tự liên hợp, có biểu diễn phổ; trong hữu hạn chiều có thể chéo hóa" },
        variables: [
          { symbol: 'A', description: { zh: '正规/自伴算子', en: 'Normal/self-adjoint operator', vi: "Toán tử chuẩn tắc hoặc tự liên hợp" } },
          { symbol: '\\lambda_i', description: { zh: '特征值（谱点）', en: 'Eigenvalues (spectral points)', vi: "Trị riêng (điểm phổ)" } }
        ],
        applications: [{ zh: '量子力学可观测量、振动分析、主成分分析', en: 'Quantum observables, vibration analysis, principal component analysis', vi: "Đại lượng quan sát lượng tử, dao động, phân tích thành phần chính" }],
        difficulty: 5
      }
    ],
    pioneers: [
      { id: 'hilbert', name: 'David Hilbert', nameZh: '大卫·希尔伯特', birthYear: 1862, deathYear: 1943, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '希尔伯特空间、谱理论雏形、23个问题、无限维空间理论的奠基人', en: 'Hilbert spaces, spectral theory precursor, 23 problems, founder of infinite-dimensional space theory', vi: "Không gian Hilbert, tiền đề lý thuyết phổ, 23 bài toán, nền tảng không gian vô hạn chiều" } },
      { id: 'banach', name: 'Stefan Banach', nameZh: '斯特凡·巴拿赫', birthYear: 1892, deathYear: 1945, nationality: '波兰', nationalityNames: {"zh": "波兰", "en": "Poland", "vi": "Ba Lan"}, contributions: { zh: '巴拿赫空间、不动点定理、线性算子理论', en: 'Banach spaces, fixed point theorem, linear operator theory', vi: "Không gian Banach, định lý điểm bất động, lý thuyết toán tử tuyến tính" } },
      { id: 'von-neumann', name: 'John von Neumann', nameZh: '约翰·冯·诺伊曼', birthYear: 1903, deathYear: 1957, nationality: '匈牙利/美国', nationalityNames: {"zh": "匈牙利/美国", "en": "Hungary / United States", "vi": "Hungary / Hoa Kỳ"}, contributions: { zh: '量子力学的数学基础、算子代数、博弈论、计算机科学先驱', en: 'Mathematical foundation of QM, operator algebras, game theory, computer science pioneer', vi: "Nền tảng toán của cơ học lượng tử, đại số toán tử, lý thuyết trò chơi, tiên phong khoa học máy tính" } },
      { id: 'schwartz', name: 'Laurent Schwartz', nameZh: '洛朗·施瓦兹', birthYear: 1915, deathYear: 2002, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '广义函数（分布）理论创始人，菲尔兹奖得主', en: 'Creator of distribution (generalized function) theory, Fields Medalist', vi: "Xây dựng lý thuyết phân phối, nhận Huy chương Fields" } }
    ],
    figures: [], references: [],
    relatedFields: ['analysis', 'topology', 'linear-algebra', 'quantum-physics'],
    applications: ['quantum-mechanics', 'pde', 'signal-processing', 'optimization', 'ml'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 泛函分析子节点（作为analysis下的引用）
  {
    id: 'functional-analysis-node', slug: 'functional-analysis-ref',
    names: { zh: '泛函分析（引用）', en: 'Functional Analysis (Reference)', vi: "Giải tích hàm (tham chiếu)" },
    descriptions: { zh: '见主星系 functional-analysis', en: 'See main galaxy functional-analysis', vi: "Xem nút chính về giải tích hàm" },
    level: 2, parentId: 'analysis', childIds: [],
    position: [2, 15, 1], size: 'medium', color: '#d97706',
    tags: ['functional-analysis', 'functional', 'reference'],
    basics: { definition: { zh: '泛函分析——见主星系', en: 'Functional analysis — see main galaxy', vi: "Giải tích hàm — xem nút chính" }, scope: { zh: '', en: '', vi: "" }, importance: 5, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['functional-analysis', 'measure-theory'], applications: ['qm', 'pde', 'optimization'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 算子理论
  {
    id: 'operator-theory', slug: 'operator-theory',
    names: { zh: '算子理论', en: 'Operator Theory', vi: "Lý thuyết toán tử" },
    descriptions: { zh: '研究无穷维空间上线性（及非线性）算子的性质，是泛函分析的核心内容。', en: 'Studies properties of linear (and non-linear) operators on infinite-dimensional spaces, core content of functional analysis.', vi: "Nghiên cứu toán tử tuyến tính và phi tuyến trên không gian vô hạn chiều; nội dung cốt lõi của giải tích hàm." },
    level: 2, parentId: 'functional-analysis', childIds: [],
    position: [6, 20, 4], size: 'medium', color: '#f59e0b',
    tags: ['functional-analysis', 'operators', 'spectral', 'functional'],
    basics: {
      definition: { zh: '算子理论研究赋范空间之间的线性映射，重点关注有界算子、紧算子、自伴算子和它们的谱性质。', en: 'Operator theory studies linear mappings between normed spaces, focusing on bounded operators, compact operators, self-adjoint operators and their spectral properties.', vi: "Nghiên cứu ánh xạ tuyến tính giữa các không gian định chuẩn: toán tử bị chặn, compact, tự liên hợp và tính chất phổ." },
      scope: { zh: '有界算子、紧算子、谱分解、Fredholm理论、算子代数（C*-代数）。', en: 'Bounded operators, compact operators, spectral decomposition, Fredholm theory, operator algebras (C*-algebras).', vi: "Toán tử bị chặn, compact, phân rã phổ, lý thuyết Fredholm, đại số toán tử (C*-đại số)." },
      importance: 4, difficulty: 5,
      history: [
        { year: 1929, event: { zh: '冯·诺依曼建立自伴算子谱理论', en: 'von Neumann establishes spectral theory of self-adjoint operators', vi: "von Neumann xây dựng lý thuyết phổ của toán tử tự liên hợp" } },
        { year: 1943, event: { zh: '盖尔范德：交换C*-代数的Gelfand表示', en: 'Gelfand representation of commutative C*-algebras', vi: "Biểu diễn Gelfand của C*-đại số giao hoán" }, figure: 'Israel Gelfand' }
      ],
      tags: []
    },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['functional-analysis', 'quantum-mechanics', 'pde'], applications: ['qm', 'control-theory', 'numerical-analysis'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 巴拿赫空间
  {
    id: 'banach-spaces', slug: 'banach-spaces',
    names: { zh: '巴拿赫空间', en: 'Banach Spaces', vi: "Không gian Banach" },
    descriptions: { zh: '完备的赋范线性空间，是泛函分析中最基本的研究对象之一。', en: 'Complete normed linear spaces, one of the most fundamental objects of study in functional analysis.', vi: "Không gian tuyến tính định chuẩn đầy đủ; đối tượng cơ bản của giải tích hàm." },
    level: 2, parentId: 'functional-analysis', childIds: [],
    position: [2, 21, 0], size: 'medium', color: '#d97706',
    tags: ['functional-analysis', 'banach', 'normed', 'complete'],
    basics: {
      definition: { zh: '巴拿赫空间是关于范数完备的线性空间。每个柯西列都收敛于空间内的元素。', en: 'Banach spaces are complete linear spaces with respect to the norm. Every Cauchy sequence converges to an element within the space.', vi: "Không gian Banach đầy đủ theo chuẩn: mọi dãy Cauchy hội tụ tới phần tử thuộc không gian." },
      scope: { zh: 'L^p空间、ℓ^p空间、C(K)空间、对偶空间、弱收敛、 reflexivity。', en: 'L^p spaces, ℓ^p spaces, C(K) spaces, dual spaces, weak convergence, reflexivity.', vi: "Không gian L^p, ℓ^p, C(K), không gian đối ngẫu, hội tụ yếu, tính phản xạ." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1922, event: { zh: '巴拿赫引入完备赋范空间概念', en: 'Banach introduces complete normed space concept', vi: "Banach đưa ra khái niệm không gian định chuẩn đầy đủ" } },
        { year: 1932, event: { zh: '《线性算子理论》出版', en: 'Théorie des opérations linéaires published', vi: "Công bố Théorie des opérations linéaires" } }
      ],
      tags: []
    },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['functional-analysis', 'measure-theory', 'harmonic-analysis'], applications: ['pde', 'approximation', 'optimization'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 分布/广义函数理论
  {
    id: 'distribution-theory', slug: 'distribution-theory',
    names: { zh: '分布理论（广义函数）', en: 'Distribution Theory (Generalized Functions)', vi: "Lý thuyết phân phối (hàm suy rộng)" },
    descriptions: { zh: '将函数概念推广为更一般的"分布"，使得δ函数等奇异对象获得严格的数学意义。', en: 'Generalizes function concept to "distributions", giving rigorous meaning to singular objects like δ function.', vi: "Mở rộng khái niệm hàm thành phân phối, tạo ý nghĩa chặt chẽ cho đối tượng kỳ dị như hàm δ." },
    level: 2, parentId: 'functional-analysis', childIds: [],
    position: [6, 17, -1], size: 'medium', color: '#b45309',
    tags: ['functional-analysis', 'distributions', 'generalized-functions', 'schwartz'],
    basics: {
      definition: { zh: '分布是检验函数空间上的连续线性泛函。它允许对不可微甚至不连续的对象做微分操作。', en: 'Distributions are continuous linear functionals on test function spaces. They allow differentiation of non-differentiable or even discontinuous objects.', vi: "Phân phối là phiếm hàm tuyến tính liên tục trên không gian hàm thử, cho phép lấy đạo hàm của đối tượng không khả vi hoặc gián đoạn." },
      scope: { zh: '速降函数空间S(Rⁿ)、Schwartz分布空间S′、缓增分布、卷积、Fourier变换的推广。', en: 'Schwartz space S(Rⁿ), distribution space S′, tempered distributions, convolution, generalized Fourier transform.', vi: "Không gian Schwartz S(Rⁿ), không gian phân phối S′, phân phối tăng chậm, tích chập, biến đổi Fourier suy rộng." },
      importance: 4, difficulty: 5,
      history: [
        { year: 1945, event: { zh: '施瓦兹《分布理论》', en: "Schwartz's Théorie des distributions", vi: "Théorie des distributions của Schwartz" } },
        { year: 1950, event: { zh: '施瓦兹获菲尔兹奖', en: 'Schwartz receives Fields Medal', vi: "Schwartz nhận Huy chương Fields" } }
      ],
      tags: []
    },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['functional-analysis', 'pde', 'fourier-analysis'], applications: ['pde', 'signal-processing', 'quantum-field-theory'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 希尔伯特空间
  {
    id: 'hilbert-spaces', slug: 'hilbert-spaces',
    names: { zh: '希尔伯特空间', en: 'Hilbert Spaces', vi: "Không gian Hilbert" },
    descriptions: { zh: '具有内积结构的完备线性空间，是量子力学和Fourier分析的天然舞台。', en: 'Complete linear spaces equipped with inner product structure, the natural setting for quantum mechanics and Fourier analysis.', vi: "Không gian tuyến tính đầy đủ có tích vô hướng; môi trường tự nhiên của cơ học lượng tử và giải tích Fourier." },
    level: 2, parentId: 'functional-analysis', childIds: [],
    position: [0, 21, 4], size: 'medium', color: '#f59e0b',
    tags: ['functional-analysis', 'hilbert', 'inner-product', 'orthogonal'],
    basics: {
      definition: { zh: '希尔伯特空间是具有内积的完备线性空间。内积诱导范数，从而产生距离和几何结构（正交投影、最佳逼近等）。', en: 'Hilbert spaces are complete linear spaces with inner products. Inner product induces norms, yielding distance and geometry (orthogonal projection, best approximation, etc.).', vi: "Không gian Hilbert đầy đủ theo chuẩn sinh bởi tích vô hướng, có khoảng cách và hình học: phép chiếu trực giao, xấp xỉ tốt nhất." },
      scope: { zh: 'L²空间、正交基（如傅里叶基）、射影定理、Riesz表示定理、自伴算子谱定理。', en: 'L² spaces, orthonormal bases (like Fourier bases), projection theorem, Riesz representation theorem, spectral theorem for self-adjoint operators.', vi: "Không gian L², cơ sở trực chuẩn (như Fourier), định lý phép chiếu, biểu diễn Riesz, định lý phổ của toán tử tự liên hợp." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1906, event: { zh: '希尔伯特研究积分方程引入ℓ²空间', en: 'Hilbert studies integral equations introducing ℓ² spaces', vi: "Hilbert nghiên cứu phương trình tích phân và đưa ra không gian ℓ²" } },
        { year: 1927, event: { zh: '冯·诺依曼将其形式化并用于量子力学', en: 'von Neumann formalizes it and applies to quantum mechanics', vi: "von Neumann hình thức hóa và ứng dụng vào cơ học lượng tử" } }
      ],
      tags: []
    },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['functional-analysis', 'quantum-mechanics', 'fourier-analysis'], applications: ['qm', 'signal-processing', 'machine-learning'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 微分方程 (Differential Equations) — 独立主星系 ====================
  {
    id: 'differential-equations', slug: 'differential-equations',
    names: { zh: '微分方程', en: 'Differential Equations', vi: "Phương trình vi phân" },
    descriptions: {
      zh: '研究包含未知函数及其导数的方程，是自然科学和工程中建模现象的主要数学工具。',
      en: 'Studies equations involving unknown functions and their derivatives, the primary mathematical tool for modeling phenomena in natural sciences and engineering.', vi: "Nghiên cứu phương trình chứa hàm chưa biết và đạo hàm của chúng; công cụ mô hình hóa khoa học tự nhiên và kỹ thuật."
    },
    level: 1, parentId: null,
    childIds: ['ode', 'pde', 'integral-equations', 'dynamical-systems'],
    position: [-4, 16, -2], size: 'large', color: '#92400e',
    tags: ['differential-equations', 'ode', 'pde', 'dynamical-systems', 'modeling'],
    basics: {
      definition: { zh: '微分方程是联系未知函数与其各阶导数的方程。按未知函数个数分为常微分方程（ODE）和偏微分方程（PDE）。', en: 'Differential equations relate unknown functions to their derivatives of various orders. Classified by number of independent variables into ODE and PDE.', vi: "Liên hệ hàm chưa biết với đạo hàm các bậc; theo số biến độc lập chia thành phương trình vi phân thường và đạo hàm riêng." },
      scope: { zh: '常微分方程（初值/边值问题）、偏微分方程（椭圆型、抛物型、双曲型）、积分方程、动力系统、稳定性理论、数值解法。', en: 'ODE (initial/boundary value problems), PDE (elliptic, parabolicic, hyperbolic), integral equations, dynamical systems, stability theory, numerical methods.', vi: "Bài toán đầu và biên của phương trình vi phân thường; phương trình đạo hàm riêng elliptic, parabolic, hyperbolic; phương trình tích phân, hệ động lực, ổn định và phương pháp số." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1671, event: { zh: '牛顿研究天体运动的微分方程', en: 'Newton studies differential equations for celestial motion', vi: "Newton nghiên cứu phương trình vi phân cho chuyển động thiên thể" } },
        { year: 1739, event: { zh: '欧拉求解常系数线性ODE', en: 'Euler solves constant-coefficient linear ODEs', vi: "Euler giải phương trình vi phân tuyến tính hệ số hằng" } },
        { year: 1807, event: { zh: '傅里叶热传导方程', en: 'Fourier heat equation', vi: "Phương trình nhiệt Fourier" } },
        { year: 1822, event: { zh: '傅里叶《热的解析理论》出版', en: "Fourier's Théorie analytique de la chaleur published", vi: "Công bố Théorie analytique de la chaleur của Fourier" } },
        { year: 1960, event: { zh: '非线性动力系统和混沌理论兴起', en: 'Nonlinear dynamical systems and chaos theory emerge', vi: "Hệ động lực phi tuyến và lý thuyết hỗn loạn xuất hiện" } }
      ],
      tags: ['modeling', 'simulation', 'stability']
    },
    principles: [
      { id: 'p1', title: { zh: '存在唯一性定理', en: 'Existence and Uniqueness Theorem', vi: "Định lý tồn tại và duy nhất" }, description: { zh: '李普希茨条件下初值问题的解存在且唯一', en: 'Under Lipschitz condition, solution to IVP exists and is unique', vi: "Dưới điều kiện Lipschitz thích hợp, bài toán giá trị ban đầu có nghiệm tồn tại và duy nhất" }, importance: 3 },
      { id: 'p2', title: { zh: '叠加原理', en: 'Superposition Principle', vi: "Nguyên lý chồng chất" }, description: { zh: '线性方程的任意解的线性组合仍是解', en: 'Linear combination of any solutions to linear equation is also a solution', vi: "Tổ hợp tuyến tính của nghiệm phương trình tuyến tính thuần nhất cũng là nghiệm" }, importance: 3 },
      { id: 'p3', title: { zh: '最大值原理', en: 'Maximum Principle', vi: "Nguyên lý cực đại" }, description: { zh: '椭圆/抛物型方程的解在其定义域边界上取得极值', en: 'Solution to elliptic/parabolic equation attains extrema on domain boundary', vi: "Nghiệm phương trình elliptic/parabolic thỏa nguyên lý cực trị trên biên miền tương ứng" }, importance: 2 }
    ],
    formulas: [
      {
        id: 'heat-equation', name: { zh: '热方程', en: 'Heat Equation', vi: "Phương trình nhiệt" },
        latex: '\\frac{\\partial u}{\\partial t} = \\kappa \\nabla^2 u',
        description: { zh: '描述热量随时间扩散的基本偏微分方程，是抛物型PDE的原型', en: 'Fundamental PDE describing heat diffusion over time, prototype of parabolic PDE', vi: "Phương trình đạo hàm riêng mô tả khuếch tán nhiệt theo thời gian; mẫu của phương trình parabolic" },
        variables: [
          { symbol: 'u(x,t)', description: { zh: '温度分布', en: 'Temperature distribution', vi: "Phân bố nhiệt độ" } },
          { symbol: '\\kappa', description: { zh: '热扩散率', en: 'Thermal diffusivity', vi: "Hệ số khuếch tán nhiệt" } },
          { symbol: '\\nabla^2', description: { zh: '拉普拉斯算子', en: 'Laplacian operator', vi: "Toán tử Laplace" } }
        ],
        applications: [{ zh: '热传导、扩散过程、金融期权定价（Black-Scholes）', en: 'Heat conduction, diffusion processes, option pricing (Black-Scholes)', vi: "Dẫn nhiệt, khuếch tán, định giá quyền chọn (Black–Scholes)" }],
        difficulty: 4
      },
      {
        id: 'wave-equation', name: { zh: '波动方程', en: 'Wave Equation', vi: "Phương trình sóng" },
        latex: '\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u',
        description: { zh: '描述波传播现象的基本偏微分方程，是双曲型PDE的代表', en: 'Fundamental PDE describing wave propagation, representative of hyperbolic PDE', vi: "Phương trình đạo hàm riêng mô tả truyền sóng; đại diện của phương trình hyperbolic" },
        variables: [
          { symbol: 'c', description: { zh: '波速', en: 'Wave speed', vi: "Tốc độ truyền sóng" } },
          { symbol: 'u(x,t)', description: { zh: '波的位移', en: 'Wave displacement', vi: "Li độ của sóng" } }
        ],
        applications: [{ zh: '声波、电磁波、弦振动、地震波', en: 'Sound waves, electromagnetic waves, string vibration, seismic waves', vi: "Sóng âm, sóng điện từ, dao động dây, sóng địa chấn" }],
        difficulty: 4
      },
      {
        id: 'laplace-equation', name: { zh: '拉普拉斯方程', en: "Laplace's Equation", vi: "Phương trình Laplace" },
        latex: '\\nabla^2 u = 0, \\quad \\text{或} \\quad \\Delta u = 0', latexLocales: {"zh": "\\nabla^2 u = 0, \\quad \\text{或} \\quad \\Delta u = 0", "en": "\\nabla^2 u = 0, \\quad \\text{or} \\quad \\Delta u = 0", "vi": "\\nabla^2 u = 0, \\quad \\text{hoặc} \\quad \\Delta u = 0"},
        description: { zh: '描述稳态（平衡）状态的椭圆型偏微分方程，在势论中至关重要', en: 'Elliptic PDE describing steady-state (equilibrium) conditions, crucial in potential theory', vi: "Phương trình elliptic mô tả trạng thái cân bằng; quan trọng trong lý thuyết thế" },
        variables: [
          { symbol: 'u', description: { zh: '势函数', en: 'Potential function', vi: "Hàm thế" } },
          { symbol: '\\Delta', description: { zh: '拉普拉斯算子', en: 'Laplacian operator', vi: "Toán tử Laplace" } }
        ],
        applications: [{ zh: '静电势、引力势、流体势流、稳态温度场', en: 'Electrostatic potential, gravitational potential, fluid potential flow, steady-state temperature', vi: "Thế tĩnh điện, thế hấp dẫn, dòng thế chất lưu, nhiệt độ ổn định" }],
        difficulty: 3
      }
    ],
    pioneers: [
      { id: 'newton-de', name: 'Isaac Newton', nameZh: '艾萨克·牛顿', birthYear: 1643, deathYear: 1727, nationality: '英国', nationalityNames: {"zh": "英国", "en": "United Kingdom", "vi": "Anh"}, contributions: { zh: '利用微积分研究天体运动，开创微分方程领域', en: 'Used calculus to study celestial motion, pioneered differential equations', vi: "Dùng vi tích phân nghiên cứu thiên thể, tiên phong phương trình vi phân" } },
      { id: 'euler-de', name: 'Leonhard Euler', nameZh: '莱昂哈德·欧拉', birthYear: 1707, deathYear: 1783, nationality: '瑞士/俄国', nationalityNames: {"zh": "瑞士/俄国", "en": "Switzerland / Russia", "vi": "Thụy Sĩ / Nga"}, contributions: { zh: '常微分方程解法、变分法、大量特殊函数', en: 'ODE solution methods, calculus of variations, numerous special functions', vi: "Phương pháp giải vi phân thường, biến phân, nhiều hàm đặc biệt" } },
      { id: 'fourier-de', name: 'Joseph Fourier', nameZh: '约瑟夫·傅里叶', birthYear: 1768, deathYear: 1830, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '傅里叶级数与变换、热传导方程', en: 'Fourier series and transforms, heat equation', vi: "Chuỗi và biến đổi Fourier, phương trình nhiệt" } },
      { id: 'poisson', name: 'Siméon Denis Poisson', nameZh: '西梅翁·德尼·泊松', birthYear: 1781, deathYear: 1840, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '泊松方程、概率论（泊松分布）', en: 'Poisson equation, probability theory (Poisson distribution)', vi: "Phương trình Poisson, xác suất (phân phối Poisson)" } }
    ],
    figures: [], references: [],
    relatedFields: ['analysis', 'applied', 'numerical', 'physics'],
    applications: ['physics', 'engineering', 'biology', 'finance', 'climate-modeling'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 常微分方程
  {
    id: 'ode', slug: 'ordinary-differential-equations',
    names: { zh: '常微分方程 (ODE)', en: 'Ordinary Differential Equations', vi: "Phương trình vi phân thường" },
    descriptions: { zh: '只含有一个自变量的未知函数及其导数的微分方程。', en: 'Differential equations containing unknown functions of only one variable and their derivatives.', vi: "Phương trình chứa hàm chưa biết của một biến cùng các đạo hàm của nó." },
    level: 2, parentId: 'differential-equations', childIds: [],
    position: [-6, 14, -3], size: 'medium', color: '#92400e',
    tags: ['differential-equations', 'ode', 'initial-value', 'boundary-value'],
    basics: {
      definition: { zh: '常微分方程（ODE）是只涉及一个自变量的微分方程。标准形式为F(t, y, y\', ..., y⁽ⁿ⁾)=0。', en: 'Ordinary differential equation involves only one independent variable. Standard form: F(t, y, y\', ..., y⁽ⁿ⁾)=0.', vi: "Chỉ có một biến độc lập; dạng tổng quát F(t, y, y', ..., y⁽ⁿ⁾)=0." },
      scope: { zh: '一阶ODE（可分离变量、线性、恰当）、高阶线性ODE、ODE组、定性理论、稳定性分析、相平面分析、分岔理论。', en: 'First-order ODE (separable, linear, exact), higher-order linear ODEs, ODE systems, qualitative theory, stability analysis, phase plane, bifurcation theory.', vi: "Phương trình bậc nhất tách biến, tuyến tính, toàn phần; bậc cao tuyến tính, hệ phương trình, định tính, ổn định, mặt phẳng pha, phân nhánh." },
      importance: 5, difficulty: 3,
      history: [
        { year: 1690, event: { zh: '雅各布·伯努利求解伯努利方程', en: 'Jacob Bernoulli solves Bernoulli equation', vi: "Jacob Bernoulli giải phương trình Bernoulli" } },
        { year: 1890, event: { zh: '庞加莱开创定性理论', en: 'Poincaré pioneers qualitative theory', vi: "Poincaré tiên phong lý thuyết định tính" } }
      ],
      tags: []
    },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['differential-equations', 'dynamical-systems', 'control-theory'], applications: ['population-models', 'circuit-theory', 'mechanical-vibrations'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 偏微分方程
  {
    id: 'pde', slug: 'partial-differential-equations',
    names: { zh: '偏微分方程 (PDE)', en: 'Partial Differential Equations', vi: "Phương trình đạo hàm riêng" },
    descriptions: { zh: '含有多个自变量的未知函数及其偏导数的微分方程，是现代数学最具挑战性的领域之一。', en: 'Differential equations involving unknown functions of multiple variables and their partial derivatives, among the most challenging areas of modern mathematics.', vi: "Phương trình chứa hàm nhiều biến chưa biết và đạo hàm riêng; một lĩnh vực khó của toán học hiện đại." },
    level: 2, parentId: 'differential-equations', childIds: [],
    position: [-5, 18, 0], size: 'large', color: '#78350f',
    tags: ['differential-equations', 'pde', 'elliptic', 'parabolic', 'hyperbolic'],
    basics: {
      definition: { zh: '偏微分方程（PDE）涉及多个自变量的偏导数。主要分为三类：椭圆型（如拉普拉斯方程）、抛物型（如热方程）、双曲型（如波动方程）。', en: 'PDEs involve partial derivatives w.r.t. multiple variables. Three main types: elliptic (e.g., Laplace), parabolic (e.g., heat), hyperbolic (e.g., wave).', vi: "Chứa đạo hàm riêng theo nhiều biến; ba loại chính: elliptic (Laplace), parabolic (nhiệt), hyperbolic (sóng)." },
      scope: { zh: '经典三类PDE、索伯列夫空间、弱解、能量方法、先验估计、Navier-Stokes方程、薛定谔方程、KdV方程。', en: 'Classical three types, Sobolev spaces, weak solutions, energy method, a priori estimates, Navier-Stokes equation, Schrödinger equation, KdV equation.', vi: "Ba loại cổ điển, không gian Sobolev, nghiệm yếu, phương pháp năng lượng, đánh giá tiên nghiệm, phương trình Navier–Stokes, Schrödinger và KdV." },
      importance: 5, difficulty: 5,
      history: [
        { year: 1822, event: { zh: '傅里叶《热的解析理论》', en: "Fourier's Théorie analytique de la chaleur", vi: "Théorie analytique de la chaleur của Fourier" } },
        { year: 1934, event: { zh: '索伯列夫引入弱导数', en: 'Sobolev introduces weak derivatives', vi: "Sobolev đưa ra đạo hàm yếu" } },
        { year: 2000, event: { zh: 'Navier-Stokes存在光滑解列为千禧年七大难题', en: 'Smooth existence of Navier-Stokes listed as a Millennium Prize problem', vi: "Sự tồn tại nghiệm trơn Navier–Stokes được chọn làm Bài toán Thiên niên kỷ" } }
      ],
      tags: []
    },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['differential-equations', 'functional-analysis', 'numerical'], applications: ['fluid-dynamics', 'quantum-physics', 'finance', 'image-processing'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 积分方程
  {
    id: 'integral-equations', slug: 'integral-equations',
    names: { zh: '积分方程', en: 'Integral Equations', vi: "Phương trình tích phân" },
    descriptions: { zh: '未知函数出现在积分号下的方程，常可通过微分或变换方法与微分方程相互转化。', en: 'Equations where the unknown function appears under an integral sign, often convertible to/from differential equations.', vi: "Phương trình có hàm chưa biết dưới dấu tích phân, thường có thể chuyển đổi với phương trình vi phân." },
    level: 2, parentId: 'differential-equations', childIds: [],
    position: [-7, 18, 2], size: 'small', color: '#b45309',
    tags: ['differential-equations', 'integral-equations', 'fredholm', 'volterra'],
    basics: {
      definition: { zh: '积分方程的一般形式为φ(x)f(x)+∫K(x,y)f(y)dy=g(x)，其中K称为核函数。分为第一类、第二类Fredholm/Volterra方程。', en: 'General form: φ(x)f(x) + ∫K(x,y)f(y)dy = g(x), where K is kernel. Divided into first/second kind Fredholm/Volterra equations.', vi: "Dạng φ(x)f(x) + ∫K(x,y)f(y)dy = g(x), K là hạch; gồm phương trình Fredholm và Volterra loại một, loại hai." },
      scope: { zh: 'Fredholm方程、Volterra方程、奇异积分方程、Wiener-Hopf方法。', en: 'Fredholm equations, Volterra equations, singular integral equations, Wiener-Hopf technique.', vi: "Phương trình Fredholm, Volterra, tích phân kỳ dị, kỹ thuật Wiener–Hopf." },
      importance: 3, difficulty: 4,
      history: [
        { year: 1900, event: { zh: '弗雷德霍姆建立积分方程理论', en: 'Fredholm establishes integral equation theory', vi: "Fredholm xây dựng lý thuyết phương trình tích phân" } },
        { year: 1903, event: { zh: '希尔伯特关于对称核的谱理论', en: 'Hilbert spectral theory for symmetric kernels', vi: "Lý thuyết phổ Hilbert cho hạch đối xứng" } }
      ],
      tags: []
    },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['differential-equations', 'functional-analysis'], applications: ['scattering-theory', 'radiative-transfer', 'inverse-problems'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 动力系统
  {
    id: 'dynamical-systems', slug: 'dynamical-systems',
    names: { zh: '动力系统', en: 'Dynamical Systems', vi: "Hệ động lực" },
    descriptions: { zh: '研究随时间演化的系统的长期行为，涵盖从规则运动到混沌的广泛现象。', en: 'Studies long-term behavior of time-evolving systems, covering phenomena ranging from regular motion to chaos.', vi: "Nghiên cứu hành vi dài hạn của hệ thay đổi theo thời gian, từ chuyển động đều đặn đến hỗn loạn." },
    level: 2, parentId: 'differential-equations', childIds: [],
    position: [-3, 19, 3], size: 'medium', color: '#d97706',
    tags: ['differential-equations', 'chaos', 'bifurcation', 'attractors'],
    basics: {
      definition: { zh: '动力系统研究状态随时间演化规律的数学模型。核心概念包括不动点、周期轨道、吸引子、Lyapunov稳定性、分岔和混沌。', en: 'Dynamical systems studies mathematical models of state evolution over time. Key concepts include fixed points, periodic orbits, attractors, Lyapunov stability, bifurcation, and chaos.', vi: "Mô hình hóa sự tiến triển trạng thái theo thời gian: điểm bất động, quỹ đạo tuần hoàn, tập hút, ổn định Lyapunov, phân nhánh và hỗn loạn." },
      scope: { zh: '自治与非自治系统、离散与连续动力系统、混沌理论、奇怪吸引子、分岔理论、遍历理论、KAM定理。', en: 'Autonomous vs non-autonomous, discrete vs continuous systems, chaos theory, strange attractors, bifurcation theory, ergodic theory, KAM theorem.', vi: "Hệ tự trị và không tự trị, rời rạc và liên tục, hỗn loạn, tập hút lạ, phân nhánh, ergodic và định lý KAM." },
      importance: 4, difficulty: 5,
      history: [
        { year: 1890, event: { zh: '庞加莱《三体问题》发现混沌萌芽', en: "Poincaré's On the Three-Body Problem discovers chaos seeds", vi: "Công trình về bài toán ba vật thể của Poincaré hé lộ hỗn loạn" } },
        { year: 1963, event: { zh: '洛伦兹发现蝴蝶效应（ Lorenz attractor ）', en: 'Lorenz discovers butterfly effect (Lorenz attractor)', vi: "Lorenz phát hiện hiệu ứng cánh bướm (tập hút Lorenz)" } },
        { year: 1975, event: { zh: '李天岩和约克发表"周期三意味着混沌"', en: 'Li and Yorke publish "Period three implies chaos"', vi: "Li và Yorke công bố Chu kỳ ba kéo theo hỗn loạn" } }
      ],
      tags: []
    },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['differential-equations', 'topology', 'ergodic-theory'], applications: ['weather-prediction', 'ecology', 'economics', 'cardiology'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 傅里叶分析 (Fourier Analysis) ====================
  {
    id: 'fourier-analysis', slug: 'fourier-analysis',
    names: { zh: '傅里叶分析', en: 'Fourier Analysis', vi: "Giải tích Fourier" },
    descriptions: {
      zh: '将函数分解为不同频率的正弦和余弦波的和（或积分），是信号处理、偏微分方程和量子力学的核心工具。',
      en: 'Decomposes functions into sums (or integrals) of sine and cosine waves of different frequencies, a core tool in signal processing, PDEs, and quantum mechanics.', vi: "Phân tích hàm thành tổng hoặc tích phân các sóng sin, cos có tần số khác nhau; công cụ cho tín hiệu, phương trình đạo hàm riêng và lượng tử."
    },
    level: 2, parentId: 'analysis', childIds: ['fourier-series', 'fourier-transform', 'time-frequency-analysis'],
    position: [-3, 11, -4], size: 'medium', color: '#f59e0b',
    tags: ['harmonic-analysis', 'fourier', 'frequency', 'signal-processing'],
    basics: {
      definition: { zh: '傅里叶分析的核心思想是任何（适当条件的）函数都可以表示为基函数（正弦/余弦或复指数）的线性组合。这实现了时域和频域之间的转换。', en: 'Core idea of Fourier analysis: any (suitably conditioned) function can be represented as a linear combination of basis functions (sines/cosines or complex exponentials). This enables time-frequency domain conversion.', vi: "Hàm thỏa điều kiện thích hợp được biểu diễn qua các hàm cơ sở sin, cos hoặc hàm mũ phức, cho phép chuyển giữa miền thời gian và tần số." },
      scope: { zh: '傅里叶级数（周期函数）、傅里叶积分变换（非周期函数）、离散傅里叶变换(DFT)、快速傅里叶变换(FFT)、小波变换。', en: 'Fourier series (periodic functions), Fourier integral transform (non-periodic), DFT, FFT, wavelet transform.', vi: "Chuỗi Fourier cho hàm tuần hoàn, biến đổi Fourier cho hàm không tuần hoàn, DFT, FFT, biến đổi sóng con." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1807, event: { zh: '傅里叶向法兰西科学院提交热传导论文', en: 'Fourier submits heat conduction paper to French Academy', vi: "Fourier gửi bài báo dẫn nhiệt tới Viện Hàn lâm Pháp" } },
        { year: 1822, event: { zh: '傅里叶《热的解析理论》出版', en: "Fourier's Analytical Theory of Heat published", vi: "Công bố Lý thuyết giải tích về nhiệt của Fourier" } },
        { year: 1910, event: { zh: '普朗切勒建立L²理论', en: 'Plancherel establishes L² theory', vi: "Plancherel xây dựng lý thuyết L²" } },
        { year: 1965, event: { zh: 'Cooley-Tukey FFT算法', en: 'Cooley-Tukey FFT algorithm', vi: "Thuật toán FFT Cooley–Tukey" } }
      ],
      tags: ['frequency-domain', 'harmonic', 'transform']
    },
    principles: [
      { id: 'p1', title: { zh: '傅里叶级数收敛性', en: 'Fourier Series Convergence', vi: "Hội tụ chuỗi Fourier" }, description: { zh: '分段光滑的周期函数的傅里叶级数逐点收敛到函数本身', en: 'Fourier series of piecewise smooth periodic function converges pointwise to the function itself', vi: "Chuỗi Fourier của hàm tuần hoàn trơn từng khúc hội tụ tới giá trị hàm tại điểm liên tục và trung bình hai giới hạn tại điểm nhảy" }, importance: 3 },
      { id: 'p2', title: { zh: '不确定性原理', en: 'Uncertainty Principle', vi: "Nguyên lý bất định" }, description: { zh: '信号不可能同时在时域和频域上高度局域化', en: 'A signal cannot be highly localized simultaneously in both time and frequency domains', vi: "Tín hiệu không thể đồng thời tập trung cao trong cả miền thời gian lẫn tần số" }, importance: 3 }
    ],
    formulas: [
      {
        id: 'fourier-series', name: { zh: '傅里叶级数', en: 'Fourier Series', vi: "Chuỗi Fourier" },
        latex: 'f(x) = \\frac{a_0}{2} + \\sum_{n=1}^{\\infty} \\left[ a_n \\cos(nx) + b_n \\sin(nx) \\right]',
        description: { zh: '将周期函数表示为不同频率正弦和余弦波的叠加', en: 'Represents periodic function as superposition of sines and cosines of different frequencies', vi: "Biểu diễn hàm tuần hoàn bằng chồng chất sóng sin và cos có tần số khác nhau" },
        variables: [
          { symbol: 'a_n', description: { zh: '余弦分量系数', en: 'Cosine component coefficients', vi: "Hệ số thành phần cos" } },
          { symbol: 'b_n', description: { zh: '正弦分量系数', en: 'Sine component coefficients', vi: "Hệ số thành phần sin" } },
          { symbol: 'n', description: { zh: '频率（谐波次数）', en: 'Frequency (harmonic number)', vi: "Tần số (bậc họa âm)" } }
        ],
        applications: [{ zh: '音频合成、乐器音色分析、AC电路分析、图像压缩（JPEG）', en: 'Audio synthesis, timbre analysis, AC circuit analysis, image compression (JPEG)', vi: "Tổng hợp âm thanh, phân tích âm sắc, mạch xoay chiều, nén ảnh JPEG" }],
        difficulty: 3
      },
      {
        id: 'fourier-transform', name: { zh: '傅里叶变换', en: 'Fourier Transform', vi: "Biến đổi Fourier" },
        latex: '\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x)e^{-2\\pi i x\\xi}\\,dx',
        description: { zh: '将时域（空域）信号转换为频域表示，揭示信号的频率成分', en: 'Converts time/space domain signal to frequency domain representation, revealing frequency components', vi: "Chuyển tín hiệu từ miền thời gian hoặc không gian sang miền tần số, làm rõ các thành phần tần số" },
        variables: [
          { symbol: '\\hat{f}(\\xi)', description: { zh: '频率ξ处的频域幅值', en: 'Frequency domain amplitude at frequency ξ', vi: "Biên độ trong miền tần số tại ξ" } },
          { symbol: 'ξ', description: { zh: '频率变量', en: 'Frequency variable', vi: "Biến tần số" } }
        ],
        applications: [{ zh: '通信系统、医学成像(MRI/CT)、地震数据处理、光谱分析', en: 'Communication systems, medical imaging (MRI/CT), seismic data processing, spectroscopy', vi: "Viễn thông, ảnh y khoa MRI/CT, dữ liệu địa chấn, quang phổ" }],
        difficulty: 4
      },
      {
        id: 'convolution-theorem', name: { zh: '卷积定理', en: 'Convolution Theorem', vi: "Định lý tích chập" },
        latex: '\\widehat{f * g} = \\hat{f} \\cdot \\hat{g}',
        description: { zh: '时域卷积对应频域乘法，极大地简化了许多计算', en: 'Time-domain convolution corresponds to frequency-domain multiplication, greatly simplifying many computations', vi: "Tích chập trong miền thời gian tương ứng phép nhân trong miền tần số, đơn giản hóa tính toán" },
        variables: [
          { symbol: '* ', description: { zh: '卷积运算符', en: 'Convolution operator', vi: "Toán tử tích chập" } },
          { symbol: '\\hat{}', description: { zh: '傅里叶变换', en: 'Fourier transform', vi: "Biến đổi Fourier" } }
        ],
        applications: [{ zh: '线性系统分析、滤波器设计、去卷积、图像处理', en: 'Linear system analysis, filter design, deconvolution, image processing', vi: "Phân tích hệ tuyến tính, thiết kế bộ lọc, khử chập, xử lý ảnh" }],
        difficulty: 4
      }
    ],
    pioneers: [
      { id: 'fourier', name: 'Joseph Fourier', nameZh: '约瑟夫·傅里叶', birthYear: 1768, deathYear: 1830, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '傅里叶级数与变换的创始人、热传导方程', en: 'Creator of Fourier series and transforms, heat equation', vi: "Xây dựng chuỗi và biến đổi Fourier, phương trình nhiệt" } },
      { id: 'dirichlet-fourier', name: 'Johann Dirichlet', nameZh: '约翰·狄利克雷', birthYear: 1805, deathYear: 1859, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '傅里叶级数收敛的充分条件（Dirichlet条件）', en: 'Sufficient conditions for Fourier series convergence (Dirichlet conditions)', vi: "Điều kiện đủ cho hội tụ chuỗi Fourier (điều kiện Dirichlet)" } },
      { id: 'plancherel', name: 'Michel Plancherel', nameZh: '米歇尔·普朗谢', birthYear: 1885, deathYear: 1967, nationality: '瑞士', nationalityNames: {"zh": "瑞士", "en": "Switzerland", "vi": "Thụy Sĩ"}, contributions: { zh: '普朗谢定理（傅里叶变换保范性）', en: 'Plancherel theorem (Fourier transform isometry)', vi: "Định lý Plancherel: biến đổi Fourier là đẳng cự" } }
    ],
    figures: [], references: [],
    relatedFields: ['analysis', 'harmonic-analysis', 'signal-processing', 'pde'],
    applications: ['telecommunications', 'audio-engineering', 'medical-imaging', 'data-compression', 'quantum-physics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 傅里叶子节点
  {
    id: 'fourier-series', slug: 'fourier-series',
    names: { zh: '傅里叶级数', en: 'Fourier Series', vi: "Chuỗi Fourier" },
    descriptions: { zh: '周期函数分解为三角函数（或复指数函数）的无穷级数展开。', en: 'Infinite series expansion of periodic functions into trigonometric (or complex exponential) functions.', vi: "Khai triển hàm tuần hoàn thành chuỗi vô hạn các hàm lượng giác hoặc hàm mũ phức." },
    level: 3, parentId: 'fourier-analysis', childIds: [],
    position: [-5, 10, -3], size: 'small', color: '#fbbf24',
    tags: ['harmonic-analysis', 'series', 'periodic', 'harmonics'],
    basics: { definition: { zh: '傅里叶级数将周期函数表示为正弦和余弦的加权和', en: 'Fourier series expresses periodic functions as weighted sums of sines and cosines', vi: "Chuỗi Fourier biểu diễn hàm tuần hoàn bằng tổng có trọng số của sin và cos" }, scope: { zh: '', en: '', vi: "" }, importance: 4, difficulty: 3, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['fourier-analysis'], applications: ['audio', 'acoustics', 'electronics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  {
    id: 'fourier-transform', slug: 'fourier-transform',
    names: { zh: '傅里叶变换', en: 'Fourier Transform', vi: "Biến đổi Fourier" },
    descriptions: { zh: '将非周期函数从时域（空域）转换到频域的积分变换。', en: 'Integral transform converting non-periodic functions from time/space domain to frequency domain.', vi: "Biến đổi tích phân chuyển hàm không tuần hoàn từ miền thời gian hoặc không gian sang miền tần số." },
    level: 3, parentId: 'fourier-analysis', childIds: [],
    position: [-4, 9, -6], size: 'small', color: '#f59e0b',
    tags: ['harmonic-analysis', 'transform', 'frequency-domain'],
    basics: { definition: { zh: '连续傅里叶变换及其逆变换', en: 'Continuous Fourier transform and its inverse', vi: "Biến đổi Fourier liên tục và biến đổi ngược" }, scope: { zh: '', en: '', vi: "" }, importance: 5, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['fourier-analysis', 'harmonic-analysis'], applications: ['signal-processing', 'optics', 'quantum-mechanics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  {
    id: 'time-frequency-analysis', slug: 'time-frequency-analysis',
    names: { zh: '时频分析', en: 'Time-Frequency Analysis', vi: "Phân tích thời gian – tần số" },
    descriptions: { zh: '同时分析信号的时间和频率信息的方法，弥补传统傅里叶变换丢失时间定位信息的不足。', en: 'Methods analyzing both time and frequency information simultaneously, addressing time-localization loss of traditional Fourier transform.', vi: "Phân tích đồng thời thời gian và tần số, khắc phục mất thông tin định vị thời gian của biến đổi Fourier truyền thống." },
    level: 3, parentId: 'fourier-analysis', childIds: [],
    position: [-2, 9, -2], size: 'small', color: '#d97706',
    tags: ['harmonic-analysis', 'wavelet', 'gabor', 'short-time-ft'],
    basics: { definition: { zh: '短时傅里叶变换、小波变换、Wigner-Ville分布等方法', en: 'STFT, wavelet transform, Wigner-Ville distribution, etc.', vi: "Biến đổi Fourier thời gian ngắn (STFT), sóng con, phân bố Wigner–Ville và các phương pháp khác." }, scope: { zh: '', en: '', vi: "" }, importance: 3, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['fourier-analysis', 'signal-processing'], applications: ['speech-recognition', 'radar', 'seismology'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 特殊函数 (Special Functions) ====================
  {
    id: 'special-functions', slug: 'special-functions',
    names: { zh: '特殊函数', en: 'Special Functions', vi: "Hàm đặc biệt" },
    descriptions: {
      zh: '在数学物理和应用中出现的重要函数类，它们不是初等函数但在解决特定类型问题时不可或缺。',
      en: 'Important classes of functions appearing in mathematical physics and applications, not elementary but indispensable for solving specific types of problems.', vi: "Các lớp hàm không sơ cấp quan trọng trong vật lý toán và ứng dụng, cần thiết để giải những loại bài toán nhất định."
    },
    level: 2, parentId: 'analysis', childIds: ['gamma-function', 'bessel-functions', 'orthogonal-polynomials', 'hypergeometric'],
    position: [4, 11, -3], size: 'medium', color: '#d97706',
    tags: ['special-functions', 'gamma', 'bessel', 'legendre'],
    basics: {
      definition: { zh: '特殊函数是指那些在微分方程解、积分表示、级数展开等问题中反复出现、具有良好性质的函数。包括Γ函数、Bessel函数、Legendre多项式等。', en: 'Special functions are those that repeatedly appear in differential equation solutions, integral representations, series expansions, etc., with good properties. Include Γ function, Bessel functions, Legendre polynomials, etc.', vi: "Hàm xuất hiện nhiều trong nghiệm phương trình vi phân, biểu diễn tích phân và khai triển chuỗi; như Γ, hàm Bessel, đa thức Legendre." },
      scope: { zh: 'Γ函数与Beta函数、Bessel函数（各类）、Legendre/Hermite/Laguerre多项式、超几何函数、椭圆积分、误差函数、Airy函数、Mathieu函数。', en: 'Gamma & Beta functions, Bessel functions (various), Legendre/Hermite/Laguerre polynomials, hypergeometric functions, elliptic integrals, erf, Airy function, Mathieu function.', vi: "Hàm Gamma, Beta, Bessel; đa thức Legendre, Hermite, Laguerre; hàm siêu bội, tích phân elliptic, erf, Airy và Mathieu." },
      importance: 4, difficulty: 4,
      history: [
        { year: 1729, event: { zh: '欧拉引入Gamma函数', en: 'Euler introduces Gamma function', vi: "Euler đưa ra hàm Gamma" } },
        { year: 1817, event: { zh: '贝塞尔研究圆柱函数', en: 'Bessel studies cylinder functions', vi: "Bessel nghiên cứu hàm trụ" } },
        { year: 1784, event: { zh: '勒让德引入勒让德多项式', en: 'Legendre introduces Legendre polynomials', vi: "Legendre đưa ra đa thức Legendre" } }
      ],
      tags: ['gamma', 'bessel', 'orthogonal', 'hypergeometric']
    },
    principles: [
      { id: 'p1', title: { zh: '函数方程', en: 'Functional Equation', vi: "Phương trình hàm" }, description: { zh: '大多数特殊函数满足某种函数方程或递推关系', en: 'Most special functions satisfy some functional equation or recurrence relation', vi: "Hầu hết hàm đặc biệt thỏa phương trình hàm hoặc hệ thức truy hồi" }, importance: 2 },
      { id: 'p2', title: { zh: '渐近行为', en: 'Asymptotic Behavior', vi: "Hành vi tiệm cận" }, description: { zh: '了解特殊函数在大参数时的渐近展开对实际计算至关重要', en: 'Asymptotic expansion for large parameters is crucial for practical computation', vi: "Khai triển tiệm cận khi tham số lớn rất quan trọng cho tính toán thực tế" }, importance: 2 }
    ],
    formulas: [
      {
        id: 'gamma-function', name: { zh: '伽玛函数 (Γ函数)', en: 'Gamma Function', vi: "Hàm Gamma" },
        latex: '\\Gamma(z) = \\int_0^\\infty t^{z-1}e^{-t}\\,dt, \\quad \\Gamma(n+1) = n!',
        description: { zh: '阶乘到复数的推广，在概率论、组合数学和分析中有广泛应用', en: 'Extension of factorial to complex numbers, widely used in probability, combinatorics, and analysis', vi: "Mở rộng giai thừa sang số phức; dùng trong xác suất, tổ hợp và giải tích" },
        variables: [
          { symbol: 'z', description: { zh: '复参数（Re(z)>0时积分收敛）', en: 'Complex parameter (converges when Re(z)>0)', vi: "Tham số phức (tích phân hội tụ khi Re(z)>0)" } }
        ],
        applications: [{ zh: '概率密度归一化、β函数、黎曼ζ函数、分数阶微积分', en: 'PDF normalization, beta function, Riemann ζ function, fractional calculus', vi: "Chuẩn hóa mật độ xác suất, hàm Beta, hàm ζ Riemann, vi tích phân phân số" }],
        difficulty: 3
      },
      {
        id: 'bessel-function', name: { zh: '贝塞尔函数', en: 'Bessel Function', vi: "Hàm Bessel" },
        latex: 'J_\\nu(x) = \\sum_{m=0}^\\infty \\frac{(-1)^m}{m!\\Gamma(m+\\nu+1)}\\left(\\frac{x}{2}\\right)^{2m+\\nu}',
        description: { zh: '贝塞尔微分方程的解，在圆柱坐标系下的波动和热传导问题中自然出现', en: 'Solution to Bessel differential equation, naturally appears in cylindrical coordinate wave and heat conduction problems', vi: "Nghiệm phương trình Bessel, xuất hiện trong bài toán sóng và dẫn nhiệt ở tọa độ trụ" },
        variables: [
          { symbol: '\\nu', description: { zh: '阶数（order）', en: 'Order', vi: "Bậc" } },
          { symbol: 'J_\\nu(x)', description: { zh: '第一类贝塞尔函数', en: 'Bessel function of first kind', vi: "Hàm Bessel loại một" } }
        ],
        applications: [{ zh: '电磁波传播、鼓膜振动、天线设计、声学', en: 'EM wave propagation, drumhead vibrations, antenna design, acoustics', vi: "Truyền sóng điện từ, dao động mặt trống, thiết kế anten, âm học" }],
        difficulty: 4
      }
    ],
    pioneers: [
      { id: 'euler-sf', name: 'Leonhard Euler', nameZh: '莱昂哈德·欧拉', birthYear: 1707, deathYear: 1783, nationality: '瑞士/俄国', nationalityNames: {"zh": "瑞士/俄国", "en": "Switzerland / Russia", "vi": "Thụy Sĩ / Nga"}, contributions: { zh: 'Γ函数、超几何级数、椭圆积分理论先驱', en: 'Gamma function, hypergeometric series, pioneer of elliptic integral theory', vi: "Hàm Gamma, chuỗi siêu bội, tiên phong lý thuyết tích phân elliptic" } },
      { id: 'gauss-sf', name: 'Carl Friedrich Gauss', nameZh: '卡尔·弗里德里希·高斯', birthYear: 1777, deathYear: 1855, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '超几何函数的系统研究、高斯超几何定理', en: 'Systematic study of hypergeometric functions, Gauss hypergeometric theorem', vi: "Nghiên cứu có hệ thống hàm siêu bội, định lý siêu bội Gauss" } },
      { id: 'legendre-sf', name: 'Adrien-Marie Legendre', nameZh: '阿德里安-马里·勒让德', birthYear: 1752, deathYear: 1833, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '勒让德多项式、勒让德变换、椭圆积分', en: 'Legendre polynomials, Legendre transform, elliptic integrals', vi: "Đa thức Legendre, biến đổi Legendre, tích phân elliptic" } }
    ],
    figures: [], references: [],
    relatedFields: ['analysis', 'pde', 'mathematical-physics', 'combinatorics'],
    applications: ['quantum-mechanics', 'electromagnetics', 'statistical-mechanics', 'antenna-design'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 特殊函数子节点
  {
    id: 'gamma-function', slug: 'gamma-function',
    names: { zh: '伽玛函数', en: 'Gamma Function', vi: "Hàm Gamma" },
    descriptions: { zh: '阶乘到复数域的自然推广，满足Γ(z+1)=zΓ(z)。', en: 'Natural extension of factorial to complex domain, satisfying Γ(z+1)=zΓ(z).', vi: "Mở rộng tự nhiên của giai thừa sang miền phức, thỏa Γ(z+1)=zΓ(z)." },
    level: 3, parentId: 'special-functions', childIds: [],
    position: [6, 10, -2], size: 'tiny', color: '#f59e0b',
    tags: ['factorial', 'integral'],
    basics: { definition: { zh: 'Γ函数是阶乘的插值推广', en: 'Gamma function extends factorial via interpolation', vi: "Hàm Gamma mở rộng giai thừa bằng nội suy" }, scope: { zh: '', en: '', vi: "" }, importance: 4, difficulty: 3, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['special-functions', 'numbertheory'], applications: ['probability', 'combinatorics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  {
    id: 'bessel-functions', slug: 'bessel-functions',
    names: { zh: '贝塞尔函数', en: 'Bessel Functions', vi: "Các hàm Bessel" },
    descriptions: { zh: '贝塞尔微分方程的解族，包括第一类J_ν、第二类Y_ν等。', en: 'Family of solutions to Bessel DE, including first kind J_ν, second kind Y_ν, etc.', vi: "Họ nghiệm phương trình Bessel, gồm loại một J_ν, loại hai Y_ν và các dạng khác." },
    level: 3, parentId: 'special-functions', childIds: [],
    position: [6, 12, -1], size: 'small', color: '#d97706',
    tags: ['cylindrical', 'oscillatory'],
    basics: { definition: { zh: '贝塞尔函数是圆柱坐标下拉普拉斯/亥姆霍兹方程的径向解', en: 'Bessel functions are radial solutions to Laplace/Helmholtz eq in cylindrical coordinates', vi: "Hàm Bessel là nghiệm theo bán kính của phương trình Laplace/Helmholtz trong tọa độ trụ" }, scope: { zh: '', en: '', vi: "" }, importance: 4, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['special-functions', 'pde'], applications: ['waves', 'vibrations', 'em-theory'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  {
    id: 'orthogonal-polynomials', slug: 'orthogonal-polynomials',
    names: { zh: '正交多项式', en: 'Orthogonal Polynomials', vi: "Đa thức trực giao" },
    descriptions: { zh: '在某内积意义下两两正交的多项式序列，如Legendre、Hermite、Laguerre多项式等。', en: 'Polynomial sequences pairwise orthogonal under some inner product, like Legendre, Hermite, Laguerre polynomials, etc.', vi: "Dãy đa thức đôi một trực giao theo một tích vô hướng, như Legendre, Hermite và Laguerre." },
    level: 3, parentId: 'special-functions', childIds: [],
    position: [5, 9, -1], size: 'small', color: '#b45309',
    tags: ['legendre', 'hermite', 'laguerre', 'chebyshev'],
    basics: { definition: { zh: '正交多项式在数值积分、逼近论和量子力学中广泛应用', en: 'Orthogonal polynomials widely used in quadrature, approximation, and QM', vi: "Dùng rộng rãi trong tính tích phân số, xấp xỉ và cơ học lượng tử" }, scope: { zh: '', en: '', vi: "" }, importance: 3, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['special-functions', 'numerical', 'quantum-mechanics'], applications: ['gaussian-quadrature', 'qm-harmonic-oscillator', 'filter-design'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  {
    id: 'hypergeometric', slug: 'hypergeometric-functions',
    names: { zh: '超几何函数', en: 'Hypergeometric Functions', vi: "Hàm siêu bội" },
    descriptions: { zh: '一类广泛的特殊函数，许多常见特殊函数都是其特例或退化形式。', en: 'A broad class of special functions; many common special functions are special cases or degenerations.', vi: "Lớp hàm đặc biệt rộng; nhiều hàm quen thuộc là trường hợp riêng hoặc dạng suy biến." },
    level: 3, parentId: 'special-functions', childIds: [],
    position: [7, 10, 0], size: 'small', color: '#92400e',
    tags: ['pFq', 'generalized-hypergeometric'],
    basics: { definition: { zh: '超几何函数 _pF_q 是许多特殊函数的统一框架', en: 'Hypergeometric function _pF_q unifies many special functions', vi: "Hàm siêu bội _pF_q thống nhất nhiều hàm đặc biệt" }, scope: { zh: '', en: '', vi: "" }, importance: 3, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['special-functions', 'numbertheory'], applications: ['integrals', 'series', 'physics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 逼近理论 (Approximation Theory) ====================
  {
    id: 'approximation-theory', slug: 'approximation-theory',
    names: { zh: '逼近理论', en: 'Approximation Theory', vi: "Lý thuyết xấp xỉ" },
    descriptions: {
      zh: '研究如何用简单函数（如多项式、三角多项式）近似复杂函数，以及逼近的精度界限和最优方法。',
      en: 'Studies how to approximate complicated functions by simpler ones (polynomials, trigonometric polynomials), and the accuracy limits and optimal methods.', vi: "Nghiên cứu xấp xỉ hàm phức tạp bằng hàm đơn giản (đa thức, đa thức lượng giác), giới hạn độ chính xác và phương pháp tối ưu."
    },
    level: 2, parentId: 'analysis', childIds: ['polynomial-approximation', 'best-approximation', 'interpolation'],
    position: [2, 10, -10], size: 'medium', color: '#b45309',
    tags: ['approximation', 'interpolation', 'chebyshev'],
    basics: {
      definition: { zh: '逼近理论研究用简单函数类（通常为多项式或有理函数）逼近一般函数的可能性、方法和误差界。核心问题是最优逼近的存在性、唯一性和特征刻画。', en: 'Approximation theory studies possibility, methods and error bounds of approximating general functions with simple classes (usually polynomials or rational functions). Core questions: existence, uniqueness, and characterization of best approximation.', vi: "Nghiên cứu khả năng, phương pháp và sai số khi xấp xỉ hàm bằng đa thức hoặc hàm hữu tỷ; xét tồn tại, duy nhất và đặc trưng của xấp xỉ tốt nhất." },
      scope: { zh: '多项式逼近（Weierstrass定理）、最佳一致逼近（Chebyshev理论）、最佳平方逼近（L²逼近）、样条函数、有理逼近、Padé逼近、小波逼近。', en: 'Polynomial approximation (Weierstrass theorem), best uniform approximation (Chebyshev theory), best L² approximation, spline functions, rational approximation, Padé approximation, wavelet approximation.', vi: "Xấp xỉ đa thức (Weierstrass), xấp xỉ đều tốt nhất (Chebyshev), xấp xỉ L², spline, hữu tỷ, Padé và sóng con." },
      importance: 3, difficulty: 4,
      history: [
        { year: 1885, event: { zh: '魏尔斯特拉斯逼近定理', en: 'Weierstrass approximation theorem', vi: "Định lý xấp xỉ Weierstrass" } },
        { year: 1854, event: { zh: '切比雪夫研究最佳一致逼近', en: 'Chebyshev studies best uniform approximation', vi: "Chebyshev nghiên cứu xấp xỉ đều tốt nhất" } },
        { year: 1900, event: { zh: '龙格发现高次多项式插值的振荡现象', en: 'Runge discovers oscillation phenomenon in high-degree polynomial interpolation', vi: "Runge phát hiện dao động khi nội suy đa thức bậc cao" } }
      ],
      tags: ['polynomial', 'minimax', 'error-bounds']
    },
    principles: [
      { id: 'p1', title: { zh: '魏尔斯特拉斯逼近定理', en: 'Weierstrass Approximation Theorem', vi: "Định lý xấp xỉ Weierstrass" }, description: { zh: '闭区间上的任何连续函数都可以被多项式一致逼近到任意精度', en: 'Any continuous function on closed interval can be uniformly approximated by polynomials to arbitrary precision', vi: "Hàm liên tục trên đoạn đóng có thể được xấp xỉ đều bằng đa thức với độ chính xác tùy ý" }, importance: 3 },
      { id: 'p2', title: { zh: '交替定理', en: 'Alternation Theorem', vi: "Định lý luân phiên" }, description: { zh: '最佳一致逼近的特征是误差函数至少在n+2个点上交替达到极值', en: 'Best uniform approximation characterized by error alternating between extremes at ≥ n+2 points', vi: "Xấp xỉ đều tốt nhất được đặc trưng bởi sai số luân phiên giữa các cực trị tại ít nhất n+2 điểm" }, importance: 2 }
    ],
    formulas: [
      {
        id: 'weierstrass-theorem', name: { zh: '魏尔斯特拉斯逼近定理', en: 'Weierstrass Approximation Theorem', vi: "Định lý xấp xỉ Weierstrass" },
        latex: '\\forall \\varepsilon > 0, \\exists p \\in \\mathbb{P}: \\max_{x\\in[a,b]} |f(x)-p(x)| < \\varepsilon',
        description: { zh: '闭区间[a,b]上连续的函数f可以被多项式p任意精确地一致逼近', en: 'Continuous function f on [a,b] can be uniformly approximated by polynomial p to any precision', vi: "Hàm liên tục f trên [a,b] có thể được xấp xỉ đều bằng đa thức p với độ chính xác tùy ý" },
        variables: [
          { symbol: '\\mathbb{P}', description: { zh: '多项式空间', en: 'Polynomial space', vi: "Không gian đa thức" } },
          { symbol: '\\varepsilon', description: { zh: '任意小的误差容忍度', en: 'Arbitrarily small tolerance', vi: "Sai số cho phép nhỏ tùy ý" } }
        ],
        applications: [{ zh: '数值分析基础、函数逼近、计算机图形学', en: 'Foundation of numerical analysis, function approximation, computer graphics', vi: "Nền tảng giải tích số, xấp xỉ hàm, đồ họa máy tính" }],
        difficulty: 3
      }
    ],
    pioneers: [
      { id: 'chebyshev', name: 'Pafnuty Chebyshev', nameZh: '帕夫努季·切比雪夫', birthYear: 1821, deathYear: 1894, nationality: '俄国', nationalityNames: {"zh": "俄国", "en": "Russia", "vi": "Nga"}, contributions: { zh: '切比雪夫多项式、最佳一致逼近理论、概率论不等式', en: 'Chebyshev polynomials, best uniform approximation theory, probability inequalities', vi: "Đa thức Chebyshev, xấp xỉ đều tốt nhất, bất đẳng thức xác suất" } },
      { id: 'bernstein', name: 'Sergei Bernstein', nameZh: '谢尔盖·伯恩斯坦', birthYear: 1880, deathYear: 1968, nationality: '苏联', nationalityNames: {"zh": "苏联", "en": "Soviet Union", "vi": "Liên Xô"}, contributions: { zh: '伯恩斯坦多项式（魏尔斯特拉斯定理的构造性证明）', en: 'Bernstein polynomials (constructive proof of Weierstrass theorem)', vi: "Đa thức Bernstein: chứng minh xây dựng của định lý Weierstrass" } }
    ],
    figures: [], references: [],
    relatedFields: ['analysis', 'numerical', 'computer-science'],
    applications: ['numerical-methods', 'computer-graphics', 'data-fitting', 'compression'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 逼近理论子节点
  {
    id: 'polynomial-approximation', slug: 'polynomial-approximation',
    names: { zh: '多项式逼近', en: 'Polynomial Approximation', vi: "Xấp xỉ đa thức" },
    descriptions: { zh: '用多项式近似表示函数的理论与方法。', en: 'Theory and methods of representing functions approximately by polynomials.', vi: "Lý thuyết và phương pháp biểu diễn gần đúng hàm bằng đa thức." },
    level: 3, parentId: 'approximation-theory', childIds: [],
    position: [4, 9, -11], size: 'small', color: '#f59e0b',
    tags: ['taylor', 'bernstein', 'minimax'],
    basics: { definition: { zh: '多项式逼近是最基本的逼近方式', en: 'Polynomial approximation is the most fundamental type of approximation', vi: "Xấp xỉ đa thức là dạng xấp xỉ cơ bản nhất" }, scope: { zh: '', en: '', vi: "" }, importance: 3, difficulty: 3, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['approximation-theory', 'numerical'], applications: ['computing', 'graphics', 'cad'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  {
    id: 'best-approximation', slug: 'best-approximation',
    names: { zh: '最佳逼近', en: 'Best Approximation', vi: "Xấp xỉ tốt nhất" },
    descriptions: { zh: '在给定范数下使逼近误差最小的函数逼近问题。', en: 'Function approximation minimizing error under given norm.', vi: "Xấp xỉ hàm sao cho sai số nhỏ nhất theo chuẩn đã cho." },
    level: 3, parentId: 'approximation-theory', childIds: [],
    position: [0, 9, -12], size: 'small', color: '#d97706',
    tags: ['minimax', 'least-squares'],
    basics: { definition: { zh: '寻找在给定度量下的最优逼近元', en: 'Finding optimal approximating element under given metric', vi: "Tìm phần tử xấp xỉ tối ưu theo khoảng cách đã cho" }, scope: { zh: '', en: '', vi: "" }, importance: 3, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['approximation-theory', 'functional-analysis'], applications: ['filter-design', 'curve-fitting'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  {
    id: 'interpolation', slug: 'interpolation',
    names: { zh: '插值理论', en: 'Interpolation Theory', vi: "Lý thuyết nội suy" },
    descriptions: { zh: '根据已知数据点构造经过所有给定点的逼近函数的方法。', en: 'Methods of constructing approximating functions passing through all given data points.', vi: "Xây dựng hàm xấp xỉ đi qua toàn bộ điểm dữ liệu đã cho." },
    level: 3, parentId: 'approximation-theory', childIds: [],
    position: [1, 8, -13], size: 'small', color: '#b45309',
    tags: ['lagrange', 'newton', 'spline'],
    basics: { definition: { zh: '插值是数据拟合和数值计算的基础技术', en: 'Interpolation is fundamental to data fitting and numerical computation', vi: "Nội suy là nền tảng của khớp dữ liệu và tính toán số" }, scope: { zh: '', en: '', vi: "" }, importance: 3, difficulty: 3, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['approximation-theory', 'numerical'], applications: ['data-fitting', 'numerical-integration', 'computer-graphics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 变分法 (Calculus of Variations) ====================
  {
    id: 'calculus-of-variations', slug: 'calculus-of-variations',
    names: { zh: '变分法', en: 'Calculus of Variations', vi: "Phép tính biến phân" },
    descriptions: {
      zh: '研究泛函（函数的函数）的极值问题，寻找使某个积分取极大值或极小值的函数，在物理和工程中有广泛应用。',
      en: 'Studies extremal problems of functionals (functions of functions), seeking functions that maximize or minimize certain integrals, widely applied in physics and engineering.', vi: "Nghiên cứu cực trị của phiếm hàm, tìm hàm làm cực đại hoặc cực tiểu tích phân; ứng dụng trong vật lý và kỹ thuật."
    },
    level: 1, parentId: null,
    childIds: ['euler-lagrange', 'noether-theorem', 'direct-method'],
    position: [-5, 22, 4], size: 'medium', color: '#d97706',
    tags: ['variational', 'functional-extrema', 'optimal-control'],
    basics: {
      definition: { zh: '变分法研究泛函J[y] = ∫ L(x,y,y\') dx 的极值问题，即寻找使该积分取极值的函数 y(x)。核心工具是欧拉-拉格朗日方程。', en: 'Calculus of variations studies extremum of functional J[y] = ∫ L(x,y,y\') dx, seeking function y(x) extremizing the integral. Core tool is Euler-Lagrange equation.', vi: "Tìm hàm y(x) làm cực trị J[y] = ∫ L(x,y,y') dx; công cụ chính là phương trình Euler–Lagrange." },
      scope: { zh: '欧拉-拉格朗日方程、约束变分（拉格朗日乘子）、多重积分泛函、Noether定理、直接法（Tonelli法）、最优控制理论。', en: 'Euler-Lagrange equation, constrained variation (Lagrange multipliers), multiple integral functionals, Noether theorem, direct method (Tonelli), optimal control theory.', vi: "Phương trình Euler–Lagrange, biến phân có ràng buộc (nhân tử Lagrange), phiếm hàm tích phân bội, định lý Noether, phương pháp trực tiếp Tonelli, điều khiển tối ưu." },
      importance: 4, difficulty: 5,
      history: [
        { year: 1696, event: { zh: '约翰·伯努利提出最速降线问题', en: 'John Bernoulli proposes brachistochrone problem', vi: "Johann Bernoulli đề xuất bài toán đường rơi nhanh nhất" } },
        { year: 1744, event: { zh: '欧拉发表《求具有某种极大或极小性质的曲线的方法》', en: 'Euler publishes Methodus Inveniendi', vi: "Euler công bố Methodus Inveniendi" } },
        { year: 1760, event: { zh: '拉格朗日推导出欧拉-拉格朗日方程', en: 'Lagrange derives Euler-Lagrange equation', vi: "Lagrange suy ra phương trình Euler–Lagrange" } },
        { year: 1918, event: { zh: '诺特发表对称性与守恒律的关系', en: 'Noether publishes symmetry-conservation law relation', vi: "Noether công bố quan hệ đối xứng – bảo toàn" } }
      ],
      tags: ['extremal', 'euler-lagrange', 'noether']
    },
    principles: [
      { id: 'p1', title: { zh: '欧拉-拉格朗日方程', en: 'Euler-Lagrange Equation', vi: "Phương trình Euler–Lagrange" }, description: { zh: '泛函取极值的必要条件，是变分法最基本的方程', en: 'Necessary condition for functional extremum, most basic equation in calculus of variations', vi: "Điều kiện cần cho cực trị phiếm hàm; phương trình cơ bản của phép tính biến phân" }, importance: 3 },
      { id: 'p2', title: { zh: '诺特定理', en: "Noether's Theorem", vi: "Định lý Noether" }, description: { zh: '连续对称性对应守恒量，是理论物理的基石之一', en: 'Continuous symmetries correspond to conserved quantities, cornerstone of theoretical physics', vi: "Đối xứng liên tục tương ứng với đại lượng bảo toàn; nền tảng của vật lý lý thuyết" }, importance: 3 }
    ],
    formulas: [
      {
        id: 'euler-lagrange-eq', name: { zh: '欧拉-拉格朗日方程', en: 'Euler-Lagrange Equation', vi: "Phương trình Euler–Lagrange" },
        latex: '\\frac{\\partial L}{\\partial y} - \\frac{d}{dx}\\left(\\frac{\\partial L}{\\partial y\'}\\right) = 0',
        description: { zh: '泛函 J[y] = ∫ L(x,y,y\') dx 取极值的必要条件，其中L称为拉格朗日量', en: 'Necessary condition for functional J[y] = ∫ L(x,y,y\') dx to achieve extremum, where L is Lagrangian', vi: "Điều kiện cần để J[y] = ∫ L(x,y,y') dx đạt cực trị; L là hàm Lagrange" },
        variables: [
          { symbol: 'L(x,y,y\')', description: { zh: '拉格朗日量（Lagrangian）', en: 'Lagrangian', vi: "Hàm Lagrange" } },
          { symbol: 'y(x)', description: { zh: '待优化的函数', en: 'Function to optimize', vi: "Hàm cần tối ưu" } },
          { symbol: "y'", description: { zh: "y的导数", en: "Derivative of y", vi: "Đạo hàm của y" } }
        ],
        applications: [{ zh: '经典力学（最小作用量原理）、光学（费马原理）、弹性力学、广义相对论', en: 'Classical mechanics (least action principle), optics (Fermat principle), elasticity, general relativity', vi: "Cơ học cổ điển (tác dụng tối thiểu), quang học (Fermat), đàn hồi, thuyết tương đối rộng" }],
        difficulty: 4
      },
      {
        id: 'brachistochrone', name: { zh: '最速降线问题', en: 'Brachistochrone Problem', vi: "Bài toán đường rơi nhanh nhất" },
        latex: 'T[y] = \\int_0^a \\sqrt{\\frac{1+(y\')^2}{2gy}}\\,dx \\rightarrow \\min',
        description: { zh: '寻找连接两点的曲线，使物体仅在重力作用下沿此曲线下滑所需时间最短', en: 'Find curve connecting two points minimizing descent time under gravity alone', vi: "Tìm đường nối hai điểm để thời gian rơi chỉ dưới trọng lực là nhỏ nhất" },
        variables: [
          { symbol: 'T[y]', description: { zh: '下降时间（泛函）', en: 'Descent time (functional)', vi: "Thời gian rơi (phiếm hàm)" } },
          { symbol: 'g', description: { zh: '重力加速度', en: 'Gravitational acceleration', vi: "Gia tốc trọng trường" } }
        ],
        applications: [{ zh: '变分法的起源问题，解为摆线（旋轮线）', en: 'Origin problem of calculus of variations, solution is cycloid (brachistochrone)', vi: "Bài toán khởi nguồn của biến phân; nghiệm là đường cycloid" }],
        difficulty: 4
      }
    ],
    pioneers: [
      { id: 'bernoulli-cv', name: 'Johann Bernoulli', nameZh: '约翰·伯努利', birthYear: 1667, deathYear: 1748, nationality: '瑞士', nationalityNames: {"zh": "瑞士", "en": "Switzerland", "vi": "Thụy Sĩ"}, contributions: { zh: '提出最速降线问题、推动变分法发展', en: 'Proposed brachistochrone problem, drove development of calculus of variations', vi: "Đề xuất bài toán đường rơi nhanh nhất, thúc đẩy phép tính biến phân" } },
      { id: 'lagrange-cv', name: 'Joseph-Louis Lagrange', nameZh: '约瑟夫-路易·拉格朗日', birthYear: 1736, deathYear: 1813, nationality: '意大利/法国', nationalityNames: {"zh": "意大利/法国", "en": "Italy / France", "vi": "Ý / Pháp"}, contributions: { zh: '欧拉-拉格朗日方程、分析力学、数论、天体力学', en: 'Euler-Lagrange equation, analytical mechanics, number theory, celestial mechanics', vi: "Phương trình Euler–Lagrange, cơ học giải tích, lý thuyết số, cơ học thiên thể" } },
      { id: 'noether', name: 'Emmy Noether', nameZh: '埃米·诺特', birthYear: 1882, deathYear: 1935, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '诺特定理、抽象代数之父、不变量理论', en: "Noether's theorem, father of abstract algebra, invariant theory", vi: "Định lý Noether, nền tảng đại số trừu tượng, lý thuyết bất biến" } }
    ],
    figures: [], references: [],
    relatedFields: ['analysis', 'optimization', 'physics', 'differential-equations'],
    applications: ['classical-mechanics', 'quantum-field-theory', 'optimal-control', 'structural-engineering', 'economics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 变分法子节点
  {
    id: 'euler-lagrange', slug: 'euler-lagrange',
    names: { zh: '欧拉-拉格朗日方程', en: 'Euler-Lagrange Equation', vi: "Phương trình Euler–Lagrange" },
    descriptions: { zh: '变分法的基本微分方程，给出了泛函取驻值的必要条件。', en: 'Fundamental differential equation of calculus of variations, giving necessary condition for stationary functional.', vi: "Phương trình vi phân cơ bản của biến phân, cho điều kiện cần để phiếm hàm dừng." },
    level: 2, parentId: 'calculus-of-variations', childIds: [],
    position: [-7, 23, 5], size: 'small', color: '#f59e0b',
    tags: ['stationary-point', 'necessary-condition'],
    basics: { definition: { zh: 'EL方程是变分问题的核心工具', en: 'EL equation is core tool of variational problems', vi: "Phương trình Euler–Lagrange là công cụ cốt lõi của bài toán biến phân" }, scope: { zh: '', en: '', vi: "" }, importance: 5, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['calculus-of-variations', 'classical-mechanics'], applications: ['physics', 'optimal-control'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  {
    id: 'noether-theorem', slug: 'noether-theorem',
    names: { zh: '诺特定理', en: "Noether's Theorem", vi: "Định lý Noether" },
    descriptions: { zh: '连续对称性与守恒量一一对应的深刻定理，是现代理论物理的基石。', en: 'Profound theorem establishing one-to-one correspondence between continuous symmetries and conserved quantities, cornerstone of modern theoretical physics.', vi: "Định lý thiết lập tương ứng giữa đối xứng liên tục và đại lượng bảo toàn; nền tảng vật lý lý thuyết hiện đại." },
    level: 2, parentId: 'calculus-of-variations', childIds: [],
    position: [-3, 24, 6], size: 'medium', color: '#d97706',
    tags: ['symmetry', 'conservation-law'],
    basics: { definition: { zh: '每种连续对称性都对应一个守恒量', en: 'Each continuous symmetry corresponds to a conserved quantity', vi: "Mỗi đối xứng liên tục tương ứng với một đại lượng bảo toàn" }, scope: { zh: '', en: '', vi: "" }, importance: 5, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['calculus-of-variations', 'theoretical-physics', 'field-theory'], applications: ['qm', 'qft', 'general-relativity', 'gauge-theory'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  {
    id: 'direct-method', slug: 'direct-method-cv',
    names: { zh: '直接法', en: 'Direct Method', vi: "Phương pháp trực tiếp" },
    descriptions: { zh: '通过紧致性论证直接证明变分问题解的存在性，无需先写出欧拉-拉格朗日方程。', en: 'Directly proves existence of solutions to variational problems via compactness arguments, without writing EL equation first.', vi: "Chứng minh tồn tại nghiệm biến phân qua tính compact, không cần viết phương trình Euler–Lagrange trước." },
    level: 2, parentId: 'calculus-of-variations', childIds: [],
    position: [-5, 21, 3], size: 'small', color: '#b45309',
    tags: ['existence', 'tonelli', 'compactness'],
    basics: { definition: { zh: 'Tonelli直接法利用下半连续性和 coercivity 证明解的存在', en: "Tonelli direct method uses lower semicontinuity and coercivity to prove existence", vi: "Phương pháp Tonelli dùng tính nửa liên tục dưới và tính bức để chứng minh tồn tại nghiệm" }, scope: { zh: '', en: '', vi: "" }, importance: 3, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['calculus-of-variations', 'functional-analysis', 'sobolev-spaces'], applications: ['pde-existence', 'minimal-surfaces', 'elasticity'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 调和分析 (Harmonic Analysis) ====================
  {
    id: 'harmonic-analysis', slug: 'harmonic-analysis',
    names: { zh: '调和分析', en: 'Harmonic Analysis', vi: "Giải tích điều hòa" },
    descriptions: {
      zh: '傅里叶分析的推广与深化，研究将函数和信号表示为基本波（调和函数）的叠加的现代数学分支，与PDE、数论和表示论紧密相连。',
      en: 'Generalization and deepening of Fourier analysis, studies representing functions and signals as superposition of basic waves (harmonic functions), closely connected with PDE, number theory, and representation theory.', vi: "Mở rộng giải tích Fourier, nghiên cứu biểu diễn hàm và tín hiệu bằng các sóng cơ bản; liên hệ phương trình đạo hàm riêng, lý thuyết số và biểu diễn."
    },
    level: 1, parentId: null,
    childIds: ['abstract-harmonic', 'littlewood-paley', 'singular-integrals', 'wavelets'],
    position: [-6, 8, 2], size: 'medium', color: '#78350f',
    tags: ['harmonic-analysis', 'harmonic', 'fourier-generalization', 'representation-theory'],
    basics: {
      definition: { zh: '调和分析是研究函数如何分解为基本波形（"谐波"）的数学分支。它从经典的傅里叶级数/变换出发，发展为抽象群上的调和分析和各种现代技术（如Littlewood-Paley理论、 Calderón-Zygmund理论）。', en: 'Harmonic analysis is the branch studying how functions decompose into basic waveforms ("harmonics"). From classical Fourier series/transforms, it evolved to harmonic analysis on abstract groups and modern techniques (Littlewood-Paley, Calderón-Zygmund theories).', vi: "Nghiên cứu phân rã hàm thành sóng cơ bản; từ chuỗi và biến đổi Fourier tới nhóm trừu tượng và kỹ thuật Littlewood–Paley, Calderón–Zygmund." },
      scope: { zh: '经典调和分析（傅里叶分析）、抽象调和分析（局部紧群的表示论）、奇异积分算子、Hardy空间、BMO空间、Littlewood-Paley理论、小波分析。', en: 'Classical harmonic analysis (Fourier), abstract harmonic analysis (representations of locally compact groups), singular integrals, Hardy spaces, BMO, Littlewood-Paley, wavelet analysis.', vi: "Giải tích điều hòa cổ điển, giải tích trên nhóm compact địa phương, tích phân kỳ dị, không gian Hardy, BMO, Littlewood–Paley, sóng con." },
      importance: 4, difficulty: 5,
      history: [
        { year: 1807, event: { zh: '傅里叶级数诞生', en: 'Fourier series born', vi: "Chuỗi Fourier ra đời" } },
        { year: 1930, event: { zh: '维纳推广调和分析到局部紧阿贝尔群', en: 'Wiener generalizes harmonic analysis to LCA groups', vi: "Wiener mở rộng giải tích điều hòa sang nhóm Abel compact địa phương" } },
        { year: 1952, event: { zh: 'Calderón-Zygmund奇异积分理论', en: 'Calderón-Zygmund singular integral theory', vi: "Lý thuyết tích phân kỳ dị Calderón–Zygmund" } },
        { year: 1980, event: { zh: '小波分析兴起', en: 'Wavelet analysis emerges', vi: "Giải tích sóng con xuất hiện" } }
      ],
      tags: ['fourier', 'group-representation', 'singular-integrals', 'hardy-space']
    },
    principles: [
      { id: 'p1', title: { zh: 'Plancherel定理', en: 'Plancherel Theorem', vi: "Định lý Plancherel" }, description: { zh: '傅里叶变换在L²上是酉算子（保范同构）', en: 'Fourier transform is unitary on L² (norm-preserving isomorphism)', vi: "Biến đổi Fourier là toán tử unita trên L² (đẳng cấu bảo toàn chuẩn)" }, importance: 3 },
      { id: 'p2', title: { zh: 'Poisson求和公式', en: 'Poisson Summation Formula', vi: "Công thức tổng Poisson" }, description: { zh: '连接函数及其傅里叶变换在整数格点上的取值之和', en: 'Connects sums of function values at integer lattice points with sums of its FT values', vi: "Liên hệ tổng giá trị hàm trên lưới nguyên với tổng giá trị biến đổi Fourier" }, importance: 3 }
    ],
    formulas: [
      {
        id: 'hilbert-transform', name: { zh: '希尔伯特变换', en: 'Hilbert Transform', vi: "Biến đổi Hilbert" },
        latex: '(Hf)(x) = \\frac{1}{\\pi} p.v. \\int_{-\\infty}^{\\infty} \\frac{f(t)}{x-t}\\,dt',
        description: { zh: '最基本的奇异积分算子，是解析信号理论和复分析之间的桥梁', en: 'Most fundamental singular integral operator, bridge between analytic signal theory and complex analysis', vi: "Toán tử tích phân kỳ dị cơ bản, liên hệ tín hiệu giải tích với giải tích phức" },
        variables: [
          { symbol: 'p.v.', description: { zh: '柯西主值（principal value）', en: 'Cauchy principal value', vi: "Giá trị chính Cauchy" } },
          { symbol: '1/(x-t)', description: { zh: '奇异核', en: 'Singular kernel', vi: "Hạch kỳ dị" } }
        ],
        applications: [{ zh: '解析信号、Kramers-Kronig关系、边缘检测', en: 'Analytic signal, Kramers-Kronig relations, edge detection', vi: "Tín hiệu giải tích, quan hệ Kramers–Kronig, phát hiện biên" }],
        difficulty: 5
      },
      {
        id: 'poisson-sum', name: { zh: 'Poisson求和公式', en: 'Poisson Summation Formula', vi: "Công thức tổng Poisson" },
        latex: '\\sum_{n\\in\\mathbb{Z}} f(n) = \\sum_{k\\in\\mathbb{Z}} \\hat{f}(k)',
        description: { zh: '函数在整数格点上的求和等于其傅里叶变换在对偶格点上的求和', en: 'Sum of function at integer lattice equals sum of FT at dual lattice', vi: "Tổng giá trị hàm trên lưới nguyên bằng tổng biến đổi Fourier trên lưới đối ngẫu" },
        variables: [
          { symbol: '\\hat{f}', description: { zh: 'f的傅里叶变换', en: 'Fourier transform of f', vi: "Biến đổi Fourier của f" } },
          { symbol: '\\mathbb{Z}', description: { zh: '整数集', en: 'Set of integers', vi: "Tập số nguyên" } }
        ],
        applications: [{ zh: '数论（θ函数）、晶体学、采样理论', en: 'Number theory (theta functions), crystallography, sampling theory', vi: "Lý thuyết số (hàm theta), tinh thể học, lý thuyết lấy mẫu" }],
        difficulty: 4
      }
    ],
    pioneers: [
      { id: 'wiener-ha', name: 'Norbert Wiener', nameZh: '诺伯特·维纳', birthYear: 1894, deathYear: 1964, nationality: '美国', nationalityNames: {"zh": "美国", "en": "United States", "vi": "Hoa Kỳ"}, contributions: { zh: '广义调和分析、控制论创始人、布朗运动的严格理论', en: 'General harmonic analysis, founder of cybernetics, rigorous Brownian motion theory', vi: "Giải tích điều hòa tổng quát, sáng lập điều khiển học, lý thuyết chặt chẽ về chuyển động Brown" } },
      { id: 'calderon', name: 'Alberto Calderón', nameZh: '阿尔贝托·卡尔德龙', birthYear: 1920, deathYear: 1998, nationality: '阿根廷/美国', nationalityNames: {"zh": "阿根廷/美国", "en": "Argentina / United States", "vi": "Argentina / Hoa Kỳ"}, contributions: { zh: 'Calderón-Zygmund奇异积分理论、拟微分算子', en: 'Calderón-Zygmund singular integral theory, pseudodifferential operators', vi: "Tích phân kỳ dị Calderón–Zygmund, toán tử giả vi phân" } },
      { id: 'zygmund', name: 'Antoni Zygmund', nameZh: '安东尼·齐格蒙德', birthYear: 1900, deathYear: 1992, nationality: '波兰/美国', nationalityNames: {"zh": "波兰/美国", "en": "Poland / United States", "vi": "Ba Lan / Hoa Kỳ"}, contributions: { zh: '经典著作《三角级数》、Calderón-Zygmund理论共同创建者', en: 'Classic work Trigonometric Series, co-founder of Calderón-Zygmund theory', vi: "Tác phẩm Chuỗi lượng giác, đồng sáng lập lý thuyết Calderón–Zygmund" } }
    ],
    figures: [], references: [],
    relatedFields: ['fourier-analysis', 'pde', 'numbertheory', 'representation-theory'],
    applications: ['signal-processing', 'image-compression', 'pde-regularity', 'automorphic-forms'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 调和分析子节点
  {
    id: 'abstract-harmonic', slug: 'abstract-harmonic-analysis',
    names: { zh: '抽象调和分析', en: 'Abstract Harmonic Analysis', vi: "Giải tích điều hòa trừu tượng" },
    descriptions: { zh: '在局部紧拓扑群上发展的调和分析，以群表示论为核心工具。', en: 'Harmonic analysis developed on locally compact groups, centered on group representation theory.', vi: "Giải tích điều hòa trên nhóm compact địa phương, lấy lý thuyết biểu diễn nhóm làm trọng tâm." },
    level: 2, parentId: 'harmonic-analysis', childIds: [],
    position: [-8, 7, 3], size: 'small', color: '#92400e',
    tags: ['harmonic-analysis', 'groups', 'representation', 'dual-group'],
    basics: { definition: { zh: '将傅里叶分析推广到抽象群上', en: 'Extends Fourier analysis to abstract groups', vi: "Mở rộng giải tích Fourier sang nhóm trừu tượng" }, scope: { zh: '', en: '', vi: "" }, importance: 3, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['harmonic-analysis', 'representation-theory', 'abstract-algebra'], applications: ['quantum-mechanics', 'coding-theory'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  {
    id: 'littlewood-paley', slug: 'littlewood-paley-theory',
    names: { zh: 'Littlewood-Paley理论', en: 'Littlewood-Paley Theory', vi: "Lý thuyết Littlewood–Paley" },
    descriptions: { zh: '通过将函数分解到不同频率尺度上来分析函数性质的强大技术。', en: 'Powerful technique analyzing function properties by decomposing into different frequency scales.', vi: "Phân tích tính chất hàm bằng phân rã theo các thang tần số." },
    level: 2, parentId: 'harmonic-analysis', childIds: [],
    position: [-7, 6, 0], size: 'small', color: '#b45309',
    tags: ['harmonic-analysis', 'frequency-decomposition', 'square-function'],
    basics: { definition: { zh: 'LP理论将函数分解为二进频率块', en: 'LP theory decomposes functions into dyadic frequency blocks', vi: "Phân rã hàm thành các khối tần số theo lũy thừa hai" }, scope: { zh: '', en: '', vi: "" }, importance: 3, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['harmonic-analysis', 'pde', 'sobolev-spaces'], applications: ['pde-regularity', 'hardy-space', 'multiparameter'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  {
    id: 'singular-integrals', slug: 'singular-integrals',
    names: { zh: '奇异积分算子', en: 'Singular Integral Operators', vi: "Toán tử tích phân kỳ dị" },
    descriptions: { zh: '核具有奇异性但仍具有良好有界性的积分算子理论，是现代PDE的核心工具。', en: 'Theory of integral operators with singular kernels yet good boundedness, core tool of modern PDEs.', vi: "Toán tử có hạch kỳ dị nhưng có tính bị chặn tốt; công cụ của phương trình đạo hàm riêng hiện đại." },
    level: 2, parentId: 'harmonic-analysis', childIds: [],
    position: [-5, 5, 1], size: 'small', color: '#78350f',
    tags: ['harmonic-analysis', 'cz-theory', 'hilbert', 'riedez'],
    basics: { definition: { zh: 'Calderón-Zygmund理论处理奇异积分算子的L^p有界性', en: 'CZ theory handles L^p boundedness of singular integral operators', vi: "Lý thuyết Calderón–Zygmund xét tính bị chặn L^p của toán tử tích phân kỳ dị" }, scope: { zh: '', en: '', vi: "" }, importance: 4, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['harmonic-analysis', 'pde', 'potential-theory'], applications: ['elliptic-pde', 'boundary-value-problems'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  {
    id: 'wavelets', slug: 'wavelets',
    names: { zh: '小波分析', en: 'Wavelet Analysis', vi: "Giải tích sóng con" },
    descriptions: { zh: '使用具有局部化性质的"小波"基进行信号分解与分析的方法。', en: 'Method of signal decomposition and analysis using localized "wavelet" bases.', vi: "Phân rã và phân tích tín hiệu bằng cơ sở sóng con định vị cục bộ." },
    level: 2, parentId: 'harmonic-analysis', childIds: [],
    position: [-4, 7, -1], size: 'small', color: '#d97706',
    tags: ['harmonic-analysis', 'daubechies', 'mallat', 'multiresolution'],
    basics: { definition: { zh: '小波提供时频局部化优于傅里叶基的工具', en: 'Wavelets provide better time-frequency localization than Fourier bases', vi: "Sóng con định vị thời gian – tần số tốt hơn cơ sở Fourier" }, scope: { zh: '', en: '', vi: "" }, importance: 4, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['harmonic-analysis', 'signal-processing', 'image-compression'], applications: ['jpeg2000', 'denoising', 'feature-extraction'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  }
];
