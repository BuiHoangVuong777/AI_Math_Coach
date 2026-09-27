import { FieldNode } from '@/types';

export const numbertheoryFields: FieldNode[] = [
  // ==================== 数论 (主星系) ====================
  {
    id: 'numbertheory', slug: 'numbertheory',
    names: { zh: '数论', en: 'Number Theory', vi: "Lý thuyết số" },
    descriptions: {
      zh: '研究整数性质的数学分支，被誉为"数学皇后"，涉及素数分布、丢番图方程、算术函数等核心问题。',
      en: 'The branch of mathematics studying properties of integers, known as the "Queen of Mathematics," involving prime distribution, Diophantine equations, arithmetic functions.', vi: "Ngành Toán nghiên cứu tính chất số nguyên, đặc biệt số nguyên tố, tính chia hết, đồng dư và hàm số học."
    },
    level: 1, parentId: null,
    childIds: ['elementary-number-theory', 'analytic-number-theory', 'algebraic-number-theory', 'computational-number-theory', 'additive-number-theory'],
    position: [-12, -10, -18], size: 'large', color: '#a855f7',
    tags: ['number-theory', 'arithmetic', 'pure-math'],
    basics: {
      definition: { zh: '数论研究整数（尤其是自然数）的结构、性质和相互关系，是最古老又最具活力的纯数学领域之一。', en: 'Number theory studies the structure, properties, and relationships of integers (especially naturals); one of the oldest yet most vibrant pure math fields.', vi: "Nghiên cứu cấu trúc, tính chất và quan hệ của số nguyên, nhất là số tự nhiên; một lĩnh vực Toán lâu đời và sôi động." },
      scope: { zh: '包括初等数论、解析数论、代数数论、计算数论、加性数论等分支。', en: 'Includes elementary, analytic, algebraic, computational, and additive number theory branches.', vi: "Lý thuyết số sơ cấp, giải tích, đại số, tính toán và cộng tính." },
      importance: 5, difficulty: 4,
      history: [
        { year: -300, event: { zh: '欧几里得《原本》— 素数无限性证明', en: "Euclid's Elements — proof of infinitude of primes", vi: "Cơ sở của Euclid — chứng minh có vô hạn số nguyên tố" } },
        { year: 1640, event: { zh: '费马小定理', en: "Fermat's little theorem", vi: "Định lý nhỏ Fermat" } },
        { year: 1801, event: { zh: '高斯《算术研究》— 现代数论诞生', en: "Gauss's Disquisitiones Arithmeticae — birth of modern number theory", vi: "Disquisitiones Arithmeticae của Gauss — lý thuyết số hiện đại ra đời" } },
        { year: 1859, event: { zh: '黎曼假设提出', en: 'Riemann hypothesis posed', vi: "Phát biểu giả thuyết Riemann" } },
        { year: 1995, event: { zh: '怀尔斯证明费马大定理', en: 'Wiles proves Fermat\'s Last Theorem', vi: "Wiles chứng minh định lý cuối cùng Fermat" } }
      ],
      tags: ['numbertheory']
    },
    principles: [
      { id: 'nt1', title: { zh: '算术基本定理', en: 'Fundamental Theorem of Arithmetic', vi: "Định lý cơ bản của số học" }, description: { zh: '每个大于1的整数可以唯一地表示为素数的乘积', en: 'Every integer > 1 can be uniquely expressed as a product of primes', vi: "Mỗi số nguyên lớn hơn 1 phân tích duy nhất thành tích số nguyên tố, không kể thứ tự" }, importance: 3 },
      { id: 'nt2', title: { zh: '模运算', en: 'Modular Arithmetic', vi: "Số học modulo" }, description: { zh: '整数在模n意义下形成环ℤ/nℤ，是同余理论的基础', en: 'Integers mod n form ring ℤ/nℤ, foundation of congruence theory', vi: "Số nguyên modulo n tạo thành vành ℤ/nℤ, nền tảng lý thuyết đồng dư" }, importance: 3 },
      { id: 'nt3', title: { zh: '素数分布', en: 'Prime Distribution', vi: "Phân bố số nguyên tố" }, description: { zh: '素数的分布规律是数论中最深刻的问题', en: 'Distribution law of primes is the deepest problem in number theory', vi: "Quy luật phân bố số nguyên tố là bài toán sâu sắc của lý thuyết số" }, importance: 3 }
    ],
    formulas: [
      {
        id: 'fermat-little', name: { zh: '费马小定理', en: "Fermat's Little Theorem", vi: "Định lý nhỏ Fermat" },
        latex: 'a^{p-1} \\equiv 1 \\pmod p, \\quad \\gcd(a,p)=1',
        description: { zh: '若p为素数且a不被p整除，则a^(p-1) ≡ 1 (mod p)。模运算的基础定理之一。', en: 'If p is prime and a not divisible by p, then a^(p-1) ≡ 1 (mod p). One of the foundations of modular arithmetic.', vi: "Nếu p nguyên tố và a không chia hết cho p thì a^(p-1) ≡ 1 (mod p); nền tảng của số học modulo." },
        variables: [{ symbol: 'p', description: { zh: '素数', en: 'Prime', vi: "Số nguyên tố" } }, { symbol: 'a', description: { zh: '整数', en: 'Integer', vi: "Số nguyên" } }],
        applications: [{ zh: '素性测试、RSA加密', en: 'Primality testing, RSA encryption', vi: "Kiểm tra tính nguyên tố, mật mã RSA" }],
        difficulty: 2
      },
      {
        id: 'prime-number-thm', name: { zh: '素数定理', en: 'Prime Number Theorem', vi: "Định lý số nguyên tố" },
        latex: '\\pi(x) \\sim \\frac{x}{\\ln x}, \\quad x \\to \\infty',
        description: { zh: '不超过x的素数个数π(x)渐近于x/ln x，描述了素数的平均分布密度', en: 'Number of primes ≤ x, denoted π(x), asymptotically equals x/ln x, describing average prime density', vi: "Số nguyên tố ≤ x, ký hiệu π(x), tương đương tiệm cận x/ln x, mô tả mật độ trung bình của số nguyên tố" },
        variables: [{ symbol: '\\pi(x)', description: { zh: '素数计数函数', en: 'Prime-counting function', vi: "Hàm đếm số nguyên tố" } }, { symbol: 'x', description: { zh: '实数', en: 'Real number', vi: "Số thực" } }],
        applications: [{ zh: '素数估计、密码学参数选择', en: 'Prime estimation, cryptography parameter selection', vi: "Ước lượng số nguyên tố, chọn tham số mật mã" }],
        difficulty: 4
      },
      {
        id: 'wilson-theorem', name: { zh: '威尔逊定理', en: "Wilson's Theorem", vi: "Định lý Wilson" },
        latex: '(p-1)! \\equiv -1 \\pmod p',
        description: { zh: 'p为素数当且仅当(p-1)! ≡ -1 (mod p)，是素数的充要条件', en: 'p is prime if and only if (p-1)! ≡ -1 (mod p), necessary and sufficient condition for primality', vi: "p nguyên tố khi và chỉ khi (p-1)! ≡ -1 (mod p); điều kiện cần và đủ của tính nguyên tố" },
        variables: [{ symbol: 'p', description: { zh: '正整数', en: 'Positive integer', vi: "Số nguyên dương" } }],
        applications: [{ zh: '素性判定（理论上）', en: 'Primality testing (theoretical)', vi: "Kiểm tra tính nguyên tố về mặt lý thuyết" }],
        difficulty: 2
      }
    ],
    pioneers: [
      { id: 'fermat', name: 'Pierre de Fermat', nameZh: '皮埃尔·德·费马', birthYear: 1607, deathYear: 1665, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '费马小定理、费马大定理、无穷递降法', en: "Fermat's little theorem, Last Theorem, infinite descent method", vi: "Định lý nhỏ, định lý cuối cùng Fermat, phương pháp xuống thang vô hạn" } },
      { id: 'euler-nt', name: 'Leonhard Euler', nameZh: '莱昂哈德·欧拉', birthYear: 1707, deathYear: 1783, nationality: '瑞士/俄国', nationalityNames: {"zh": "瑞士/俄国", "en": "Switzerland / Russia", "vi": "Thụy Sĩ / Nga"}, contributions: { zh: '欧拉φ函数、二次互反律先驱、分拆函数', en: "Euler φ(totient) function, quadratic reciprocity pioneer, partition function", vi: "Hàm φ Euler, tiên phong luật tương hỗ bậc hai, hàm phân hoạch" } },
      { id: 'gauss', name: 'Carl Friedrich Gauss', nameZh: '卡尔·弗里德里希·高斯', birthYear: 1777, deathYear: 1855, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '《算术研究》、二次互反律、同余记号', en: 'Disquisitiones Arithmeticae, quadratic reciprocity, congruence notation', vi: "Disquisitiones Arithmeticae, tương hỗ bậc hai, ký hiệu đồng dư" } },
      { id: 'riemann', name: 'Bernhard Riemann', nameZh: '伯恩哈德·黎曼', birthYear: 1826, deathYear: 1866, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: 'ζ函数、黎曼假设', en: 'Zeta function, Riemann Hypothesis', vi: "Hàm zeta, giả thuyết Riemann" } },
      { id: 'wiles', name: 'Andrew Wiles', nameZh: '安德鲁·怀尔斯', birthYear: 1953, nationality: '英国', nationalityNames: {"zh": "英国", "en": "United Kingdom", "vi": "Anh"}, contributions: { zh: '证明费马大定理（椭圆曲线与模形式）', en: 'Proved FLT via elliptic curves and modular forms', vi: "Chứng minh định lý cuối cùng Fermat qua đường cong elliptic và dạng modular" } }
    ],
    figures: [], references: [],
    relatedFields: ['algebra', 'analysis', 'cryptography', 'discrete'], applications: ['cryptography', 'coding-theory', 'cs'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 初等数论 ====================
  {
    id: 'elementary-number-theory', slug: 'elementary-number-theory',
    names: { zh: '初等数论', en: 'Elementary Number Theory', vi: "Lý thuyết số sơ cấp" },
    descriptions: { zh: '不依赖高等分析方法，仅用整数本身的性质研究整除性、素数、同余、算术函数等问题。', en: 'Studies divisibility, primes, congruences, arithmetic functions using only intrinsic integer properties without advanced analysis.', vi: "Nghiên cứu chia hết, nguyên tố, đồng dư, hàm số học chỉ dựa trên tính chất số nguyên, không dùng giải tích nâng cao." },
    level: 2, parentId: 'numbertheory', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#c084fc',
    tags: ['numbertheory'],
    basics: {
      definition: { zh: '初等数论以整除理论和同余理论为核心，涵盖素数、最大公约数、算术函数等基本内容。', en: 'Elementary number theory centers on divisibility and congruence theories, covering primes, GCD, arithmetic functions.', vi: "Tập trung vào chia hết và đồng dư, số nguyên tố, ước chung lớn nhất và hàm số học." },
      scope: { zh: '整除性与最大公约数、素数与因式分解、同余与中国剩余定理、算术函数（φ、σ、μ）、原根与指数。', en: 'Divisibility & GCD, primes & factorization, CRT & congruences, arithmetic functions (φ, σ, μ), primitive roots & indices.', vi: "Chia hết, ước chung lớn nhất, nguyên tố và phân tích thừa số, định lý số dư Trung Hoa, đồng dư, hàm φ, σ, μ, căn nguyên thủy và chỉ số." },
      importance: 5, difficulty: 2, history: [
        { year: -300, event: { zh: '欧几里得算法与素数无限性', en: 'Euclidean algorithm & infinitude of primes', vi: "Thuật toán Euclid và tính vô hạn của số nguyên tố" } },
        { year: 1202, event: { zh: '斐波那契《计算之书》', en: "Fibonacci's Liber Abaci", vi: "Liber Abaci của Fibonacci" } },
        { year: 1801, event: { zh: '高斯《算术研究》系统化', en: "Gauss's Disquisitiones Arithmeticae systematizes field", vi: "Disquisitiones Arithmeticae của Gauss hệ thống hóa lĩnh vực" } }
      ], tags: []
    },
    principles: [],
    formulas: [
      {
        id: 'euclidean-algorithm', name: { zh: '欧几里得算法', en: 'Euclidean Algorithm', vi: "Thuật toán Euclid" },
        latex: '\\gcd(a,b) = \\gcd(b, a \\bmod b)',
        description: { zh: '辗转相除法求最大公约数：gcd(a,b) = gcd(b, a mod b)，直到余数为0', en: 'GCD by successive division: gcd(a,b) = gcd(b, a mod b) until remainder is zero', vi: "Tìm ước chung lớn nhất bằng chia liên tiếp: gcd(a,b) = gcd(b, a mod b) đến khi dư bằng 0" },
        variables: [{ symbol: 'a,b', description: { zh: '正整数', en: 'Positive integers', vi: "Các số nguyên dương" } }, { symbol: '\\gcd', description: { zh: '最大公约数', en: 'Greatest common divisor', vi: "Ước chung lớn nhất" } }],
        applications: [{ zh: '密码学、简化分数', en: 'Cryptography, fraction reduction', vi: "Mật mã, rút gọn phân số" }],
        difficulty: 1
      },
      {
        id: 'euler-totient', name: { zh: '欧拉函数 φ(n)', en: "Euler's Totient Function", vi: "Hàm phi Euler" },
        latex: '\\varphi(n) = n \\prod_{p|n}\\left(1-\\frac{1}{p}\\right)',
        description: { zh: 'φ(n)统计小于n且与n互素的整数个数。若gcd(a,n)=1，则a^φ(n)≡1(mod n)', en: 'φ(n) counts integers ≤ n that are coprime to n. If gcd(a,n)=1 then a^φ(n)≡1(mod n).', vi: "φ(n) đếm số nguyên dương ≤ n nguyên tố cùng nhau với n; nếu gcd(a,n)=1 thì a^φ(n)≡1(mod n)." },
        variables: [{ symbol: 'n', description: { zh: '正整数', en: 'Positive integer', vi: "Số nguyên dương" } }, { symbol: 'p', description: { zh: 'n的素因子', en: 'Prime factors of n', vi: "Các thừa số nguyên tố của n" } }, { symbol: '\\varphi', description: { zh: '欧拉函数', en: "Euler's totient function", vi: "Hàm phi Euler" } }],
        applications: [{ zh: 'RSA加密、循环群阶', en: 'RSA encryption, cyclic group order', vi: "Mật mã RSA, cấp nhóm cyclic" }],
        difficulty: 2
      }
    ],
    pioneers: [
      { id: 'euclid-nt', name: 'Euclid of Alexandria', nameZh: '亚历山大里亚的欧几里得', birthYear: -325, deathYear: -265, nationality: '古希腊', nationalityNames: {"zh": "古希腊", "en": "Ancient Greece", "vi": "Hy Lạp cổ đại"}, contributions: { zh: '欧几里得算法、素数无限性证明', en: 'Euclidean algorithm, proof of infinite primes', vi: "Thuật toán Euclid, chứng minh vô hạn số nguyên tố" } },
      { id: 'gauss-elem', name: 'Carl Friedrich Gauss', nameZh: '卡尔·弗里德里希·高斯', birthYear: 1777, deathYear: 1855, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '二次互反律、同余符号', en: 'Quadratic reciprocity, congruence notation', vi: "Tương hỗ bậc hai, ký hiệu đồng dư" } }
    ],
    figures: [], references: [],
    relatedFields: ['algebra', 'combinatorics'], applications: ['cryptography', 'competitive-math'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 解析数论 ====================
  {
    id: 'analytic-number-theory', slug: 'analytic-number-theory',
    names: { zh: '解析数论', en: 'Analytic Number Theory', vi: "Lý thuyết số giải tích" },
    descriptions: { zh: '使用分析学工具（特别是复分析和调和分析）来解决关于整数的问题，核心是素数分布。', en: 'Uses analysis tools (especially complex and harmonic analysis) to solve problems about integers; core focus is prime distribution.', vi: "Dùng giải tích, đặc biệt phức và điều hòa, giải bài toán số nguyên; trọng tâm là phân bố nguyên tố." },
    level: 2, parentId: 'numbertheory', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#a855f7',
    tags: ['numbertheory', 'analysis'],
    basics: {
      definition: { zh: '解析数论通过黎曼ζ函数、狄利克雷级数等解析工具研究素数分布、加性问题等深刻的整数性质。', en: 'Analytic number theory studies profound integer properties—prime distribution, additive problems—via ζ-functions, Dirichlet series, etc.', vi: "Nghiên cứu phân bố nguyên tố và bài toán cộng tính qua hàm ζ, chuỗi Dirichlet và các công cụ giải tích." },
      scope: { zh: '黎曼ζ函数、素数定理、黎曼猜想、狄利克雷定理、筛法、指数和方法、模形式。', en: 'Riemann zeta, Prime Number Theorem, Riemann Hypothesis, Dirichlet\'s theorem, sieve methods, circle method, modular forms.', vi: "Zeta Riemann, định lý số nguyên tố, giả thuyết Riemann, định lý Dirichlet, phương pháp sàng, đường tròn, dạng modular." },
      importance: 5, difficulty: 5, history: [
        { year: 1737, event: { zh: '欧拉乘积公式', en: 'Euler product formula', vi: "Công thức tích Euler" } },
        { year: 1837, event: { zh: '狄利克雷算术级数定理', en: "Dirichlet's theorem on arithmetic progressions", vi: "Định lý Dirichlet về cấp số cộng" } },
        { year: 1859, event: { zh: '黎曼《论小于给定值的素数个数》', en: "Riemann's On the Number of Primes Less Than a Given Magnitude", vi: "Công trình Riemann về số lượng số nguyên tố nhỏ hơn một đại lượng cho trước" } },
        { year: 1896, event: { zh: '阿达玛和德·拉·瓦利·普桑分别证明素数定理', en: "Hadamard & de la Vallée Poussin prove PNT independently", vi: "Hadamard và de la Vallée Poussin độc lập chứng minh định lý số nguyên tố" } },
        { year: 1948, event: { zh: '塞尔伯格初等方法证明素数定理', en: 'Selberg gives elementary proof of PNT', vi: "Selberg đưa ra chứng minh sơ cấp định lý số nguyên tố" } }
      ], tags: []
    },
    principles: [],
    formulas: [
      {
        id: 'riemann-zeta', name: { zh: '黎曼ζ函数', en: 'Riemann Zeta Function', vi: "Hàm zeta Riemann" },
        latex: '\\zeta(s) = \\sum_{n=1}^{\\infty} \\frac{1}{n^s} = \\prod_{p}(1-p^{-s})^{-1}, \\quad \\Re(s)>1',
        description: { zh: 'ζ函数通过欧拉乘积连接分析与素数，所有非平凡零点的实部均为1/2（黎曼假设）', en: 'Zeta connects analysis to primes via Euler product. All non-trivial zeros have real part 1/2 (RH)', vi: "Zeta liên hệ giải tích với số nguyên tố qua tích Euler; giả thuyết Riemann nói mọi nghiệm không tầm thường có phần thực 1/2" },
        variables: [{ symbol: 's', description: { zh: '复变量', en: 'Complex variable', vi: "Biến phức" } }, { symbol: '\\zeta(s)', description: { zh: '黎曼ζ函数', en: 'Riemann zeta function', vi: "Hàm zeta Riemann" } }, { symbol: 'p', description: { zh: '素数', en: 'Prime', vi: "Số nguyên tố" } }],
        applications: [{ zh: '素数分布、物理学（量子混沌、统计力学）', en: 'Prime distribution, physics (quantum chaos, statistical mechanics)', vi: "Phân bố nguyên tố, hỗn loạn lượng tử, cơ học thống kê" }],
        difficulty: 5
      }
    ],
    pioneers: [
      { id: 'dirichlet', name: 'Johann Dirichlet', nameZh: '约翰·狄利克雷', birthYear: 1805, deathYear: 1859, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '算术级数的狄利克雷定理、狄利克雷L函数', en: "Dirichlet's theorem on APs, Dirichlet L-functions", vi: "Định lý Dirichlet về cấp số cộng, hàm L Dirichlet" } },
      { id: 'riemann-an', name: 'Bernhard Riemann', nameZh: '伯恩哈德·黎曼', birthYear: 1826, deathYear: 1866, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: 'ζ函数解析延拓、零点分布猜想', en: 'Zeta function analytic continuation, zero distribution hypothesis', vi: "Thác triển giải tích zeta, giả thuyết phân bố nghiệm" } },
      { id: 'hardy', name: 'G.H. Hardy', nameZh: '戈弗雷·哈代', birthYear: 1877, deathYear: 1947, nationality: '英国', nationalityNames: {"zh": "英国", "en": "United Kingdom", "vi": "Anh"}, contributions: { zh: 'ζ函数零点研究、解析数论奠基', en: 'Zeta zero research, analytical NT foundation', vi: "Nghiên cứu nghiệm zeta, nền tảng lý thuyết số giải tích" } }
    ],
    figures: [], references: [],
    relatedFields: ['complex-analysis', 'algebraic-geometry'], applications: ['cryptography', 'physics', 'random-matrix-theory'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 代数数论 ====================
  {
    id: 'algebraic-number-theory', slug: 'algebraic-number-theory',
    names: { zh: '代数数论', en: 'Algebraic Number Theory', vi: "Lý thuyết số đại số" },
    descriptions: { zh: '将代数数（有理系数多项式的根）作为研究对象，推广整数的概念到代数整数环的理想理论。', en: 'Studies algebraic numbers (roots of rational-coefficient polynomials), extending integer concepts to ideals in rings of algebraic integers.', vi: "Nghiên cứu số đại số (nghiệm đa thức hệ số hữu tỷ), mở rộng khái niệm số nguyên sang iđêan trong vành số nguyên đại số." },
    level: 2, parentId: 'numbertheory', childIds: [],
    position: [0, 0, 0], size: 'medium', color: '#9333ea',
    tags: ['numbertheory', 'algebra'],
    basics: {
      definition: { zh: '代数数论在有理数域Q的扩张（代数数域）上研究"整数"的推广（代数整数），以及理想类群、单位群、伽罗瓦作用等。', en: 'Algebraic number theory studies "integers" generalized to algebraic integers over extensions K/Q, plus ideal class groups, unit groups, Galois action.', vi: "Nghiên cứu số nguyên đại số trên mở rộng K/Q, nhóm lớp iđêan, nhóm đơn vị và tác động Galois." },
      scope: { zh: '代数数域、代数整数、理想分解、理想类群、单位定理、类域论、伽罗瓦表示。', en: 'Number fields, algebraic integers, ideal decomposition, class group, unit theorem, class field theory, Galois representations.', vi: "Trường số, số nguyên đại số, phân tích iđêan, nhóm lớp, định lý đơn vị, trường lớp, biểu diễn Galois." },
      importance: 5, difficulty: 5, history: [
        { year: 1797, event: { zh: '高斯研究高斯整数ℤ[i]', en: 'Gauss studies Gaussian integers ℤ[i]', vi: "Gauss nghiên cứu số nguyên Gauss ℤ[i]" } },
        { year: 1847, event: { zh: '库默尔引入理想数解决费马大定理', en: 'Kummer introduces ideal numbers for FLT', vi: "Kummer đưa ra số lý tưởng để nghiên cứu định lý cuối cùng Fermat" } },
        { year: 1871, event: { zh: '戴德金创立理想理论', en: 'Dedekind creates ideal theory', vi: "Dedekind xây dựng lý thuyết iđêan" } },
        { year: 1897-1898, event: { zh: '希尔伯特建立类域论基础', en: 'Hilbert establishes class field theory foundations', vi: "Hilbert đặt nền tảng lý thuyết trường lớp" } }
      ], tags: []
    },
    principles: [],
    formulas: [
      {
        id: 'ideal-class-group', name: { zh: '理想类群', en: 'Ideal Class Group', vi: "Nhóm lớp iđêan" },
        latex: 'Cl(K) = I_K / P_K',
        description: { zh: '代数数域K的所有非零分式理想模主理想的商群，衡量唯一分解因子性的偏离程度', en: 'Quotient of all nonzero fractional ideals of K modulo principal ideals; measures deviation from unique factorization', vi: "Nhóm thương của iđêan phân khác 0 của K theo iđêan chính; đo sự lệch khỏi phân tích duy nhất" },
        variables: [{ symbol: 'K', description: { zh: '代数数域', en: 'Number field', vi: "Trường số" } }, { symbol: 'I_K', description: { zh: '分式理想群', en: 'Fractional ideal group', vi: "Nhóm iđêan phân" } }, { symbol: 'P_K', description: { zh: '主理想群', en: 'Principal ideal group', vi: "Nhóm iđêan chính" } }, { symbol: 'Cl(K)', description: { zh: '理想类群', en: 'Ideal class group', vi: "Nhóm lớp iđêan" } }],
        applications: [{ zh: '唯一分解性判定、费马大定理', en: 'UFD criterion, FLT proof', vi: "Tiêu chí miền phân tích duy nhất, chứng minh định lý cuối cùng Fermat" }],
        difficulty: 5
      }
    ],
    pioneers: [
      { id: 'kummer', name: 'Ernst Kummer', nameZh: '恩斯特·库默尔', birthYear: 1810, deathYear: 1893, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '理想数、正则素数、费马大定理部分解', en: 'Ideal numbers, regular primes, partial FLT solution', vi: "Số lý tưởng, nguyên tố chính quy, kết quả riêng của định lý cuối cùng Fermat" } },
      { id: 'dedekind', name: 'Richard Dedekind', nameZh: '理查德·戴德金', birthYear: 1831, deathYear: 1916, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '理想理论、戴德金ζ函数', en: 'Ideal theory, Dedekind zeta function', vi: "Lý thuyết iđêan, hàm zeta Dedekind" } },
      { id: 'hilbert-ant', name: 'David Hilbert', nameZh: '大卫·希尔伯特', birthYear: 1862, deathYear: 1943, nationality: '德国', nationalityNames: {"zh": "德国", "en": "Germany", "vi": "Đức"}, contributions: { zh: '类域论、希尔伯特12问题', en: 'Class field theory, Hilbert\'s 12th problem', vi: "Lý thuyết trường lớp, bài toán 12 của Hilbert" } }
    ],
    figures: [], references: [],
    relatedFields: ['algebra', 'algebraic-geometry', 'representation-theory'], applications: ['cryptography', 'elliptic-curve-crypto', 'langlands-program'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 计算数论 ====================
  {
    id: 'computational-number-theory', slug: 'computational-number-theory',
    names: { zh: '计算数论', en: 'Computational Number Theory', vi: "Lý thuyết số tính toán" },
    descriptions: { zh: '研究数论问题的高效算法实现，包括素数测试、大整数分解、离散对数等，是现代密码学的基石。', en: 'Studies efficient algorithms for number theory problems: primality testing, integer factorization, discrete logs — foundation of modern cryptography.', vi: "Thuật toán hiệu quả cho kiểm tra nguyên tố, phân tích thừa số, logarit rời rạc; nền tảng mật mã hiện đại." },
    level: 2, parentId: 'numbertheory', childIds: [],
    position: [0, 0, 0], size: 'small', color: '#7e22ce',
    tags: ['numbertheory', 'cs', 'cryptography'],
    basics: {
      definition: { zh: '计算数论致力于设计高效的算法来解决数论中的判定和搜索问题，其成果直接支撑着公钥密码系统的安全。', en: 'Computational number theory designs efficient algorithms for decision/search problems in NT; results directly underpin public-key crypto security.', vi: "Thiết kế thuật toán quyết định và tìm kiếm trong lý thuyết số; trực tiếp hỗ trợ an toàn mật mã khóa công khai." },
      scope: { zh: '素性测试（Miller-Rabin、AKS）、因式分解算法（Pollard ρ、GNFS）、离散对数、椭圆曲线算法、格基规约。', en: 'Primality tests (Miller-Rabin, AKS), factorization (Pollard ρ, GNFS), discrete log, elliptic curve algorithms, lattice reduction.', vi: "Kiểm tra Miller–Rabin, AKS; phân tích Pollard ρ, GNFS; logarit rời rạc, đường cong elliptic, rút gọn lưới." },
      importance: 4, difficulty: 4, history: [
        { year: 1976, event: { zh: 'Diffie-Hellman密钥交换（基于离散对数）', en: 'Diffie-Hellman key exchange (based on discrete log)', vi: "Trao đổi khóa Diffie–Hellman dựa trên logarit rời rạc" } },
        { year: 1977, event: { zh: 'RSA公钥加密（基于大数分解）', en: 'RSA public key crypto (based on factoring)', vi: "Mật mã khóa công khai RSA dựa trên phân tích thừa số" } },
        { year: 1985, event: { zh: '米勒-罗宾概率测试广泛采用', en: 'Miller-Rabin probabilistic test widely adopted', vi: "Kiểm tra xác suất Miller–Rabin được dùng rộng rãi" } },
        { year: 2002, event: { zh: 'AKS确定性多项式时间素数测试', en: 'AKS deterministic polynomial-time primality test', vi: "AKS kiểm tra nguyên tố xác định trong thời gian đa thức" } }
      ], tags: []
    },
    principles: [],
    formulas: [
      {
        id: 'miller-rabin', name: { zh: 'Miller-Rabin 素性测试', en: 'Miller-Rabin Primality Test', vi: "Kiểm tra nguyên tố Miller–Rabin" },
        latex: 'a^{d} \\not\\equiv 1 \\pmod n \\quad\\text{and}\\quad a^{2^r d} \\not\\equiv -1 \\pmod n \\quad \\forall r', latexLocales: {"zh": "a^{d} \\not\\equiv 1 \\pmod n \\quad\\text{and}\\quad a^{2^r d} \\not\\equiv -1 \\pmod n \\quad \\forall r", "en": "a^{d} \\not\\equiv 1 \\pmod n \\quad\\text{and}\\quad a^{2^r d} \\not\\equiv -1 \\pmod n \\quad \\forall r", "vi": "a^{d} \\not\\equiv 1 \\pmod n \\quad\\text{và}\\quad a^{2^r d} \\not\\equiv -1 \\pmod n \\quad \\forall r"},
        description: { zh: '若存在a使得上述条件成立，则n必为合数；多次随机选取a可通过提高置信度', en: 'If exists a satisfying above, n is composite; repeated random a increases confidence', vi: "Nếu có cơ sở a thỏa điều kiện trên thì n hợp số; thử nhiều a ngẫu nhiên làm tăng độ tin cậy" },
        variables: [{ symbol: 'n', description: { zh: '待测数', en: 'Candidate', vi: "Số cần kiểm tra" } }, { symbol: 'a', description: { zh: '随机基', en: 'Random base', vi: "Cơ sở ngẫu nhiên" } }, { symbol: 'd', description: { zh: '奇数因子', en: 'Odd factor', vi: "Thừa số lẻ" } }],
        applications: [{ zh: '快速素数筛选、密钥生成', en: 'Fast prime screening, key generation', vi: "Sàng lọc nguyên tố nhanh, sinh khóa" }],
        difficulty: 3
      }
    ],
    pioneers: [],
    figures: [], references: [],
    relatedFields: ['cryptography', 'algorithm', 'complexity'], applications: ['rsa', 'ecc', 'blockchain', 'ssl-tls'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // ==================== 加性数论 ====================
  {
    id: 'additive-number-theory', slug: 'additive-number-theory',
    names: { zh: '加性数论', en: 'Additive Number Theory', vi: "Lý thuyết số cộng tính" },
    descriptions: { zh: '研究整数按加法表示的性质，如哥德巴赫猜想、华林问题和分拆函数。', en: 'Studies properties of integers expressed by addition, such as Goldbach conjecture, Waring problem, partition function.', vi: "Nghiên cứu biểu diễn số nguyên bằng phép cộng: giả thuyết Goldbach, bài toán Waring, hàm phân hoạch." },
    level: 2, parentId: 'numbertheory', childIds: [],
    position: [0, 0, 0], size: 'small', color: '#6b21a8',
    tags: ['numbertheory', 'combinatorics', 'analysis'],
    basics: {
      definition: { zh: '加性数论关注整数能否表示为某种形式的和，以及表示方式的计数问题。', en: 'Additive number theory concerns whether integers can be expressed as sums of certain forms, and counting representations.', vi: "Xét số nguyên có thể viết thành tổng theo dạng cho trước hay không và đếm cách biểu diễn." },
      scope: { zh: '哥德巴赫猜想、华林问题、分拆函数、哥德巴赫-维诺格拉多夫定理、筛法应用。', en: 'Goldbach conjecture, Waring problem, partition function, Vinogradov theorem, sieve applications.', vi: "Goldbach, Waring, hàm phân hoạch, định lý Vinogradov, ứng dụng phương pháp sàng." },
      importance: 4, difficulty: 5, history: [
        { year: 1742, event: { zh: '哥德巴赫猜想提出', en: 'Goldbach conjecture posed', vi: "Phát biểu giả thuyết Goldbach" } },
        { year: 1770, event: { zh: '华林问题提出（后由希尔伯特解决）', en: 'Waring problem posed (later solved by Hilbert)', vi: "Đề xuất bài toán Waring, sau được Hilbert giải" } },
        { year: 1937, event: { zh: '维诺格拉多夫证明充分大奇数的哥德巴赫弱猜想', en: 'Vinogradov proves weak Goldbach for sufficiently large odds', vi: "Vinogradov chứng minh Goldbach yếu cho số lẻ đủ lớn" } },
        { year: 2013, event: { zh: 'Helfgott完全证明弱哥德巴赫猜想', en: 'Helfgott completes weak Goldbach proof', vi: "Helfgott hoàn thành chứng minh Goldbach yếu" } }
      ], tags: []
    },
    principles: [],
    formulas: [
      {
        id: 'goldbach-conjecture', name: { zh: '哥德巴赫猜想', en: 'Goldbach Conjecture', vi: "Giả thuyết Goldbach" },
        latex: '2n = p_1 + p_2, \\quad n > 1',
        description: { zh: '强猜想：任何大于2的偶数都可以写成两个素数之和（至今未完全证明）', en: 'Strong form: Every even number > 2 is sum of two primes (still unproven)', vi: "Dạng mạnh: mọi số chẵn lớn hơn 2 là tổng hai số nguyên tố; vẫn chưa được chứng minh" },
        variables: [{ symbol: 'n', description: { zh: '大于1的整数', en: 'Integer > 1', vi: "Số nguyên lớn hơn 1" } }, { symbol: 'p_1,p_2', description: { zh: '素数', en: 'Primes', vi: "Các số nguyên tố" } }],
        applications: [{ zh: '加性组合、解析数论核心问题', en: 'Additive combinatorics, core analytic NT problem', vi: "Tổ hợp cộng tính, bài toán cốt lõi của lý thuyết số giải tích" }],
        difficulty: 5
      },
      {
        id: 'partition-function', name: { zh: '分拆函数 p(n)', en: 'Partition Function p(n)', vi: "Hàm phân hoạch p(n)" },
        latex: 'p(n) \\sim \\frac{1}{4n\\sqrt{3}} e^{\\pi\\sqrt{2n/3}}',
        description: { zh: '正整数n的分拆方式数量p(n)的渐进公式（哈代-拉马努金公式）', en: 'Asymptotic formula for number of partitions of n (Hardy-Ramanujan formula)', vi: "Công thức tiệm cận số phân hoạch của n (Hardy–Ramanujan)" },
        variables: [{ symbol: 'p(n)', description: { zh: '分拆数', en: 'Partition number', vi: "Số phân hoạch" } }, { symbol: 'n', description: { zh: '正整数', en: 'Positive integer', vi: "Số nguyên dương" } }],
        applications: [{ zh: '统计力学、表示论', en: 'Statistical mechanics, representation theory', vi: "Cơ học thống kê, lý thuyết biểu diễn" }],
        difficulty: 4
      }
    ],
    pioneers: [
      { id: 'hardy-add', name: 'G.H. Hardy', nameZh: '戈弗雷·哈代', birthYear: 1877, deathYear: 1947, nationality: '英国', nationalityNames: {"zh": "英国", "en": "United Kingdom", "vi": "Anh"}, contributions: { zh: '圆法、哈代-拉马努金分拆公式、加性数论奠基', en: 'Circle method, Hardy-Ramanujan partition formula, additive NT foundation', vi: "Phương pháp đường tròn, công thức phân hoạch Hardy–Ramanujan, nền tảng lý thuyết số cộng tính" } },
      { id: 'ramanujan', name: 'Srinivasa Ramanujan', nameZh: '斯里尼瓦瑟·拉马努金', birthYear: 1887, deathYear: 1920, nationality: '印度', nationalityNames: {"zh": "印度", "en": "India", "vi": "Ấn Độ"}, contributions: { zh: '分拆恒等式、模形式、τ函数', en: 'Partition identities, modular forms, tau function', vi: "Đồng nhất thức phân hoạch, dạng modular, hàm tau" } },
      { id: 'vinogradov', name: 'Ivan Matveyevich Vinogradov', nameZh: '伊万·维诺格拉多夫', birthYear: 1891, deathYear: 1983, nationality: '苏联', nationalityNames: {"zh": "苏联", "en": "Soviet Union", "vi": "Liên Xô"}, contributions: { zh: '三素数定理、指数和方法改进', en: 'Three-primes theorem, exponential method improvements', vi: "Định lý ba số nguyên tố, cải tiến phương pháp tổng mũ" } }
    ],
    figures: [], references: [],
    relatedFields: ['analytic-number-theory', 'combinatorics'], applications: ['coding-theory', 'statistical-physics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  }

];
