import { FieldNode } from '@/types';

export const discreteFields: FieldNode[] = [
  // ==================== 离散数学 ====================
  {
    id: 'discrete', slug: 'discrete',
    names: { zh: '离散数学', en: 'Discrete Mathematics', vi: "Toán rời rạc" },
    descriptions: { zh: '研究离散（不连续）结构的数学分支，是计算机科学的核心基础。', en: 'Branch studying discrete (non-continuous) structures, core foundation of computer science.', vi: "Nghiên cứu cấu trúc rời rạc, không liên tục; nền tảng của khoa học máy tính." },
    level: 1, parentId: null,
    childIds: ['combinatorics', 'graph-theory', 'coding-theory', 'cryptography', 'automata-theory', 'computational-complexity'],
    position: [12, -8, 16], size: 'large', color: '#3b82f6',
    tags: ['discrete'],
    basics: {
      definition: { zh: '离散数学研究可数或有限的结构，与连续数学相对。', en: 'Discrete mathematics studies countable or finite structures, as opposed to continuous mathematics.', vi: "Nghiên cứu cấu trúc đếm được hoặc hữu hạn, khác với toán liên tục." },
      scope: { zh: '组合学、图论、算法理论、编码理论、密码学等。', en: 'Combinatorics, graph theory, algorithmics, coding theory, cryptography.', vi: "Tổ hợp, lý thuyết đồ thị, thuật toán, mã hóa và mật mã học." },
      importance: 5, difficulty: 3,
      history: [
        { year: 1736, event: { zh: '欧拉图论起源', en: "Euler's graph theory origin", vi: "Khởi nguồn lý thuyết đồ thị của Euler" } },
        { year: 1936, event: { zh: '图灵机理论', en: 'Turing machine theory', vi: "Lý thuyết máy Turing" } },
        { year: 1977, event: { zh: 'RSA密码系统', en: 'RSA cryptosystem', vi: "Hệ mật mã RSA" } }
      ],
      tags: ['discrete']
    },
    principles: [
      { id: 'p1', title: { zh: '鸽巢原理', en: 'Pigeonhole Principle', vi: "Nguyên lý Dirichlet (nguyên lý chuồng bồ câu)" }, description: { zh: 'n+1个物体放入n个盒子，至少一个盒子有多个物体', en: 'n+1 objects in n boxes means one box has multiple objects', vi: "Xếp n+1 đối tượng vào n hộp thì có ít nhất một hộp chứa nhiều đối tượng" }, importance: 2 },
      { id: 'p2', title: { zh: '容斥原理', en: 'Inclusion-Exclusion', vi: "Nguyên lý bù trừ" }, description: { zh: '计算集合并集大小的基础工具', en: 'Fundamental tool for computing union sizes', vi: "Công cụ tính số phần tử của hợp các tập" }, importance: 3 }
    ],
    formulas: [{ id: 'binomial', name: { zh: '二项式定理', en: 'Binomial Theorem', vi: "Định lý nhị thức" }, latex: '(x+y)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^{n-k} y^k', description: { zh: '多项式展开', en: 'Polynomial expansion', vi: "Khai triển đa thức" }, variables: [], applications: [{ zh: '概率论/计数', en: 'Probability/counting', vi: "Xác suất và đếm" }], difficulty: 2 }],
    pioneers: [{ id: 'erdos-d', name: 'Paul Erdős', nameZh: '保罗·埃尔德什', birthYear: 1913, deathYear: 1996, nationality: '匈牙利', nationalityNames: {"zh": "匈牙利", "en": "Hungary", "vi": "Hungary"}, contributions: { zh: '组合数学大师', en: 'Master of combinatorics', vi: "Nhà toán học có đóng góp lớn về tổ hợp" } }],
    figures: [], references: [],
    relatedFields: ['probability', 'algebra', 'cs'], applications: ['cs', 'cryptography', 'networks', 'ai'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 组合数学
  { id: 'combinatorics', slug: 'combinatorics',
    names: { zh: '组合数学', en: 'Combinatorics', vi: "Tổ hợp" },
    descriptions: { zh: '研究有限离散结构的计数、排列和组合的学科。', en: 'Study of counting, arrangement, and combination of finite discrete structures.', vi: "Nghiên cứu đếm, sắp xếp và chọn các cấu trúc rời rạc hữu hạn." },
    level: 1, parentId: null,
    childIds: ['enumerative-combinatorics', 'extremal-combinatorics', 'algebraic-combinatorics', 'probabilistic-combinatorics'],
    position: [16, -12, 20], size: 'medium', color: '#2563eb',
    tags: ['combinatorics'],
    basics: {
      definition: { zh: '组合数学研究有限集合中对象的排列、组合和计数问题。', en: 'Combinatorics studies arrangements, combinations, and counting in finite sets.', vi: "Nghiên cứu hoán vị, tổ hợp và phép đếm trong tập hữu hạn." },
      scope: { zh: '枚举组合、极值组合、代数组合、设计理论、拉姆齐理论、生成函数。', en: 'Enumerative, extremal, algebraic combinatorics, design theory, Ramsey theory, generating functions.', vi: "Tổ hợp đếm, cực trị, đại số; lý thuyết thiết kế, Ramsey và hàm sinh." },
      importance: 4, difficulty: 4,
      history: [
        { year: 1666, event: { zh: '莱布尼茨组合论文', en: "Leibniz's combinatorics dissertation", vi: "Luận án tổ hợp của Leibniz" } },
        { year: 1929, event: { zh: '拉姆齐理论诞生', en: 'Birth of Ramsey theory', vi: "Lý thuyết Ramsey ra đời" } },
        { year: 1972, event: { zh: '概率方法兴起', en: 'Rise of probabilistic method', vi: "Phương pháp xác suất phát triển" } }
      ], tags: []
    },
    principles: [],
    formulas: [{ id: 'fibonacci', name: { zh: '斐波那契数列', en: 'Fibonacci Sequence', vi: "Dãy Fibonacci" }, latex: 'F_n = F_{n-1} + F_{n-2}', description: { zh: '每个数是前两个之和', en: 'Each number is sum of two preceding', vi: "Mỗi số bằng tổng hai số liền trước" }, variables: [], applications: [{ zh: '自然现象建模', en: 'Modeling natural phenomena', vi: "Mô hình hóa hiện tượng tự nhiên" }], difficulty: 2 }],
    pioneers: [], figures: [], references: [],
    relatedFields: ['discrete', 'probability', 'algebra'], applications: ['cs', 'optimization', 'statistics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 图论
  { id: 'graph-theory', slug: 'graph-theory',
    names: { zh: '图论', en: 'Graph Theory', vi: "Lý thuyết đồ thị" },
    descriptions: { zh: '由顶点和边组成的图的性质研究的数学分支。', en: 'Branch studying properties of graphs composed of vertices and edges.', vi: "Nghiên cứu tính chất của đồ thị gồm các đỉnh và cạnh." },
    level: 1, parentId: null,
    childIds: ['algorithmic-graph-theory', 'spectral-graph-theory', 'random-graphs'],
    position: [10, -14, 22], size: 'medium', color: '#1d4ed8',
    tags: ['graph-theory'],
    basics: {
      definition: { zh: '图论研究顶点和边的抽象结构及其性质（连通性、着色、匹配等）。', en: 'Graph theory studies abstract structures of vertices/edges and properties like connectivity, coloring, matching.', vi: "Nghiên cứu cấu trúc đỉnh, cạnh và tính liên thông, tô màu, ghép cặp." },
      scope: { zh: '连通性、着色理论、匹配与覆盖、平面性、树结构、网络流、随机图。', en: 'Connectivity, coloring, matching & coverings, planarity, trees, network flows, random graphs.', vi: "Liên thông, tô màu, ghép cặp và phủ, tính phẳng, cây, luồng mạng, đồ thị ngẫu nhiên." },
      importance: 5, difficulty: 3,
      history: [
        { year: 1736, event: { zh: '欧拉七桥问题', en: "Euler's Seven Bridges", vi: "Bài toán bảy cây cầu của Euler" } },
        { year: 1852, event: { zh: '四色猜想', en: 'Four color conjecture', vi: "Giả thuyết bốn màu" } },
        { year: 1976, event: { zh: '四色定理证明', en: 'Four Color Theorem proved', vi: "Chứng minh định lý bốn màu" } }
      ], tags: []
    },
    principles: [],
    formulas: [{ id: 'handshaking', name: { zh: '握手定理', en: 'Handshaking Lemma', vi: "Bổ đề bắt tay" }, latex: '\\sum_{v\\in V} \\deg(v) = 2|E|', description: { zh: '度数之和等于两倍边数', en: 'Sum of degrees = twice edges', vi: "Tổng bậc các đỉnh bằng hai lần số cạnh" }, variables: [], applications: [{ zh: '网络分析', en: 'Network analysis', vi: "Phân tích mạng" }], difficulty: 1 }],
    pioneers: [], figures: [], references: [],
    relatedFields: ['discrete', 'combinatorics'], applications: ['social-networks', 'cs', 'transportation', 'biology', 'linguistics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 编码理论
  { id: 'coding-theory', slug: 'coding-theory',
    names: { zh: '编码理论', en: 'Coding Theory', vi: "Lý thuyết mã hóa" },
    descriptions: { zh: '研究数据可靠传输和存储的错误纠正码。', en: 'Study of error-correcting codes for reliable data transmission and storage.', vi: "Nghiên cứu mã sửa lỗi để truyền và lưu dữ liệu đáng tin cậy." },
    level: 2, parentId: 'discrete', childIds: [],
    position: [14, -5, 20], size: 'medium', color: '#3b82f6',
    tags: ['discrete'],
    basics: { definition: { zh: '编码理论研究在噪声信道上可靠传输信息的数学方法。', en: 'Coding theory studies mathematical methods for reliable information transmission over noisy channels.', vi: "Phương pháp toán giúp truyền thông tin tin cậy qua kênh có nhiễu." }, scope: { zh: '线性码、循环码、BCH码、LDPC码、Turbo码、卷积码、代数几何码。', en: 'Linear codes, cyclic codes, BCH, LDPC, Turbo codes, convolutional codes, AG codes.', vi: "Mã tuyến tính, vòng, BCH, LDPC, Turbo, tích chập và mã hình học đại số." }, importance: 4, difficulty: 5, history: [
      { year: 1948, event: { zh: '香农信息论奠基', en: "Shannon's information theory", vi: "Lý thuyết thông tin của Shannon" } },
      { year: 1950, event: { zh: '汉明码发明', en: 'Hamming code invented', vi: "Phát minh mã Hamming" } }
    ], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['discrete', 'algebra', 'information-theory'], applications: ['telecommunications', 'data-storage', 'satellite', 'qr-codes'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 密码学
  { id: 'cryptography', slug: 'cryptography',
    names: { zh: '密码学', en: 'Cryptography', vi: "Mật mã học" },
    descriptions: { zh: '研究安全通信和信息保护的数学技术。', en: 'Mathematical techniques for secure communication and information protection.', vi: "Kỹ thuật toán bảo đảm truyền thông an toàn và bảo vệ thông tin." },
    level: 2, parentId: 'discrete', childIds: [],
    position: [18, -10, 14], size: 'medium', color: '#4f46e5',
    tags: ['cryptography'],
    basics: { definition: { zh: '密码学研究信息加密、解密、认证和安全协议的数学基础。', en: 'Cryptography studies the math foundations of encryption, decryption, authentication, and secure protocols.', vi: "Nền tảng toán của mã hóa, giải mã, xác thực và giao thức an toàn." }, scope: { zh: '对称/非对称加密、哈希函数、数字签名、零知识证明、同态加密、后量子密码。', en: 'Symmetric/asymmetric crypto, hash functions, digital signatures, ZKP, homomorphic encryption, post-quantum crypto.', vi: "Mật mã đối xứng và bất đối xứng, hàm băm, chữ ký số, chứng minh không tiết lộ, mã hóa đồng cấu, mật mã hậu lượng tử." }, importance: 5, difficulty: 5, history: [
      { year: 1976, event: { zh: 'Diffie-Hellman密钥交换', en: 'Diffie-Hellman key exchange', vi: "Trao đổi khóa Diffie–Hellman" } },
      { year: 1977, event: { zh: 'RSA公钥密码', en: 'RSA public-key crypto', vi: "Mật mã khóa công khai RSA" } },
      { year: 1985, event: { zh: '椭圆曲线密码', en: 'Elliptic curve cryptography', vi: "Mật mã đường cong elliptic" } }
    ], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['numbertheory', 'discrete', 'algebra'], applications: ['cybersecurity', 'blockchain', 'e-commerce', 'privacy'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 自动机与形式语言
  { id: 'automata-theory', slug: 'automata-theory',
    names: { zh: '自动机理论与形式语言', en: 'Automata Theory & Formal Languages', vi: "Lý thuyết ôtômát và ngôn ngữ hình thức" },
    descriptions: { zh: '抽象计算模型及其识别的语言类的研究。', en: 'Study of abstract computational models and their recognized language classes.', vi: "Nghiên cứu mô hình tính toán trừu tượng và các lớp ngôn ngữ chúng nhận dạng." },
    level: 2, parentId: 'discrete', childIds: [],
    position: [8, -6, 18], size: 'small', color: '#3b82f6',
    tags: ['computer-science'],
    basics: { definition: { zh: '自动机理论用数学模型描述计算的极限能力。', en: 'Automata theory uses mathematical models to describe computational limits.', vi: "Dùng mô hình toán mô tả giới hạn của tính toán." }, scope: { zh: '有穷自动机、下推自动机、图灵机、乔姆斯基层次、正则表达式。', en: 'Finite automata, pushdown automata, Turing machines, Chomsky hierarchy, regular expressions.', vi: "Ôtômát hữu hạn, ôtômát ngăn xếp, máy Turing, phân cấp Chomsky, biểu thức chính quy." }, importance: 5, difficulty: 4, history: [
      { year: 1936, event: { zh: '图灵机模型', en: 'Turing machine model', vi: "Mô hình máy Turing" } },
      { year: 1956, event: { zh: '乔姆斯基层次', en: 'Chomsky hierarchy', vi: "Phân cấp Chomsky" } }
    ], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['computability', 'cs', 'logic'], applications: ['compiler-design', 'pattern-matching', 'formal-verification', 'natural-language-processing'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 计算复杂性
  { id: 'computational-complexity', slug: 'computational-complexity',
    names: { zh: '计算复杂性理论', en: 'Computational Complexity Theory', vi: "Lý thuyết độ phức tạp tính toán" },
    descriptions: { zh: '分类问题的计算难度，研究P/NP等核心问题。', en: 'Classifies computational difficulty of problems, studying P/NP and other core questions.', vi: "Phân loại độ khó tính toán, nghiên cứu P/NP và các câu hỏi cốt lõi khác." },
    level: 2, parentId: 'discrete', childIds: [],
    position: [6, -12, 20], size: 'small', color: '#3b82f6',
    tags: ['computer-science'],
    basics: { definition: { zh: '计算复杂性理论根据解决问题所需的资源对问题进行分类。', en: 'Complexity theory classifies problems based on resources needed to solve them.', vi: "Phân loại bài toán theo tài nguyên cần để giải." }, scope: { zh: '时间复杂度、空间复杂度、P vs NP、NP完全、多项式层次、近似算法。', en: 'Time/space complexity, P vs NP, NP-complete, polynomial hierarchy, approximation algorithms.', vi: "Độ phức tạp thời gian và bộ nhớ, P so với NP, NP-đầy đủ, phân cấp đa thức, thuật toán xấp xỉ." }, importance: 5, difficulty: 5, history: [
      { year: 1971, event: { zh: 'Cook-Levin定理', en: 'Cook-Levin theorem', vi: "Định lý Cook–Levin" } },
      { year: 1972, event: { zh: 'Karp的21个NP完全问题', en: "Karp's 21 NP-complete problems", vi: "21 bài toán NP-đầy đủ của Karp" } }
    ], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['automata-theory', 'cs', 'logic'], applications: ['algorithm-design', 'cryptography', 'optimization'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 枚举组合
  { id: 'enumerative-combinatorics', slug: 'enumerative-combinatorics',
    names: { zh: '枚举组合学', en: 'Enumerative Combinatorics', vi: "Tổ hợp đếm" },
    descriptions: { zh: '精确计数满足特定条件的对象数量。', en: 'Precise counting of objects satisfying specific conditions.', vi: "Đếm chính xác các đối tượng thỏa điều kiện." },
    level: 2, parentId: 'combinatorics', childIds: [],
    position: [18, -15, 22], size: 'small', color: '#2563eb',
    tags: ['combinatorics'],
    basics: { definition: { zh: '枚举组合学关注于计算满足特定条件的离散结构的数目。', en: 'Enumerative combinatorics focuses on counting discrete structures that satisfy given conditions.', vi: "Đếm cấu trúc rời rạc thỏa các điều kiện đã cho." }, scope: { zh: '排列组合、容斥原理、生成函数、Polya计数、递推关系。', en: 'Permutations/combinations, inclusion-exclusion, generating functions, Polya counting, recurrences.', vi: "Hoán vị, tổ hợp, bù trừ, hàm sinh, phép đếm Pólya, hệ thức truy hồi." }, importance: 3, difficulty: 3, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['combinatorics', 'probability'], applications: ['probability', 'statistical-physics', 'algorithm-analysis'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 极值组合
  { id: 'extremal-combinatorics', slug: 'extremal-combinatorics',
    names: { zh: '极值组合学', en: 'Extremal Combinatorics', vi: "Tổ hợp cực trị" },
    descriptions: { zh: '研究在给定约束下离散结构的极值问题。', en: 'Studies extremum problems of discrete structures under given constraints.', vi: "Nghiên cứu cực trị của cấu trúc rời rạc dưới ràng buộc." },
    level: 2, parentId: 'combinatorics', childIds: [],
    position: [20, -9, 18], size: 'small', color: '#2563eb',
    tags: ['combinatorics'],
    basics: { definition: { zh: '极值组合学研究在一定条件下离散结构能达到的最大或最小值。', en: 'Extremal combinatorics studies maximum or minimum values achievable under constraints.', vi: "Tìm giá trị lớn nhất hoặc nhỏ nhất có thể đạt dưới ràng buộc." }, scope: { zh: 'Turan定理、Ramsey理论、极值图论、Sperner定理、Dilworth定理。', en: "Turan's theorem, Ramsey theory, extremal graph theory, Sperner's theorem, Dilworth's theorem.", vi: "Định lý Turán, lý thuyết Ramsey, đồ thị cực trị, định lý Sperner và Dilworth." }, importance: 4, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['combinatorics', 'graph-theory', 'probability'], applications: ['theoretical-cs', 'network-design', 'combinatorial-optimization'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 代数组合
  { id: 'algebraic-combinatorics', slug: 'algebraic-combinatorics',
    names: { zh: '代数组合学', en: 'Algebraic Combinatorics', vi: "Tổ hợp đại số" },
    descriptions: { zh: '运用代数方法解决组合问题，或将代数结构进行组合解释。', en: 'Uses algebraic methods to solve combinatorial problems, or gives algebraic structures combinatorial interpretations.', vi: "Dùng đại số giải bài toán tổ hợp, hoặc diễn giải cấu trúc đại số bằng tổ hợp." },
    level: 2, parentId: 'combinatorics', childIds: [],
    position: [14, -17, 24], size: 'small', color: '#2563eb',
    tags: ['combinatorics', 'algebra'],
    basics: { definition: { zh: '代数组合学结合了代数和组合方法来研究对称性和枚举。', en: 'Algebraic combinatorics combines algebraic and combinatorial methods to study symmetry and enumeration.', vi: "Kết hợp đại số và tổ hợp để nghiên cứu đối xứng và phép đếm." }, scope: { zh: '对称群表示、Young表、组合设计、关联方案、超图。', en: 'Symmetric group representations, Young tableaux, combinatorial designs, association schemes, hypergraphs.', vi: "Biểu diễn nhóm đối xứng, bảng Young, thiết kế tổ hợp, lược đồ liên kết, siêu đồ thị." }, importance: 3, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['combinatorics', 'algebra', 'representation-theory'], applications: ['physics', 'chemistry', 'quantum-info'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 概率组合
  { id: 'probabilistic-combinatorics', slug: 'probabilistic-combinatorics',
    names: { zh: '概率组合方法', en: 'Probabilistic Method', vi: "Phương pháp xác suất" },
    descriptions: { zh: '使用概率论工具证明组合对象的存在性。', en: 'Uses probability tools to prove existence of combinatorial objects.', vi: "Dùng xác suất chứng minh sự tồn tại đối tượng tổ hợp." },
    level: 2, parentId: 'combinatorics', childIds: [],
    position: [12, -18, 26], size: 'small', color: '#2563eb',
    tags: ['combinatorics', 'probability'],
    basics: { definition: { zh: '埃尔德什开创的概率方法：若某事件概率大于零则该对象存在。', en: "Erdős's probabilistic method: if an event has positive probability, the object exists.", vi: "Phương pháp Erdős: nếu biến cố có xác suất dương thì đối tượng tương ứng tồn tại." }, scope: { zh: ' Lovasz局部引理、随机图、阈值现象、概率存在性论证。', en: "Lovász local lemma, random graphs, threshold phenomena, probabilistic existence arguments.", vi: "Bổ đề địa phương Lovász, đồ thị ngẫu nhiên, hiện tượng ngưỡng, lập luận tồn tại bằng xác suất." }, importance: 4, difficulty: 5, history: [
      { year: 1959, event: { zh: 'Erdős-Renyi随机图模型', en: 'Erdős–Rényi random graph model', vi: "Mô hình đồ thị ngẫu nhiên Erdős–Rényi" } }
    ], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['combinatorics', 'probability', 'graph-theory'], applications: ['cs', 'randomized-algorithms', 'network-science'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 算法图论
  { id: 'algorithmic-graph-theory', slug: 'algorithmic-graph-theory',
    names: { zh: '算法图论', en: 'Algorithmic Graph Theory', vi: "Lý thuyết thuật toán đồ thị" },
    descriptions: { zh: '图上的高效算法设计与分析。', en: 'Design and analysis of efficient algorithms on graphs.', vi: "Thiết kế và phân tích thuật toán hiệu quả trên đồ thị." },
    level: 2, parentId: 'graph-theory', childIds: [],
    position: [8, -16, 25], size: 'small', color: '#1d4ed8',
    tags: ['graph-theory', 'cs'],
    basics: { definition: { zh: '算法图论研究图问题的有效算法及计算复杂度。', en: 'Algorithmic graph theory studies efficient algorithms and complexity of graph problems.', vi: "Nghiên cứu thuật toán hiệu quả và độ phức tạp bài toán đồ thị." }, scope: { zh: '最短路径、最大流、最小割、连通分量、图着色算法、NP困难图问题。', en: 'Shortest paths, max flow/min cut, connected components, graph coloring, NP-hard graph problems.', vi: "Đường đi ngắn nhất, luồng cực đại và lát cắt cực tiểu, thành phần liên thông, tô màu, bài toán đồ thị NP-khó." }, importance: 4, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['graph-theory', 'cs'], applications: ['navigation-apps', 'social-networks', 'logistics', 'vlsi-design'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 谱图论
  { id: 'spectral-graph-theory', slug: 'spectral-graph-theory',
    names: { zh: '谱图论', en: 'Spectral Graph Theory', vi: "Lý thuyết phổ đồ thị" },
    descriptions: { zh: '通过邻接矩阵或拉普拉斯矩阵的特征值研究图的性质。', en: 'Studies graph properties via eigenvalues of adjacency/Laplacian matrices.', vi: "Nghiên cứu đồ thị qua trị riêng của ma trận kề và ma trận Laplace." },
    level: 2, parentId: 'graph-theory', childIds: [],
    position: [14, -18, 23], size: 'small', color: '#1d4ed8',
    tags: ['graph-theory', 'linear-algebra'],
    basics: { definition: { zh: '谱图论利用线性代数的特征值理论分析图的结构性质。', en: 'Spectral graph theory uses eigenvalue theory from linear algebra to analyze structural properties of graphs.', vi: "Dùng lý thuyết trị riêng của đại số tuyến tính phân tích cấu trúc đồ thị." }, scope: { zh: '邻接谱、Laplacian谱、图谱参数、扩张性、图划分。', en: 'Adjacency spectrum, Laplacian spectrum, graph parameters, expanders, graph partitioning.', vi: "Phổ ma trận kề, phổ Laplace, tham số đồ thị, đồ thị giãn nở, phân hoạch đồ thị." }, importance: 3, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['graph-theory', 'linear-algebra'], applications: ['network-clustering', 'data-analysis', 'machine-learning'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 随机图
  { id: 'random-graphs', slug: 'random-graphs',
    names: { zh: '随机图论', en: 'Random Graph Theory', vi: "Lý thuyết đồ thị ngẫu nhiên" },
    descriptions: { zh: '具有随机边分布的概率图模型。', en: 'Probabilistic graph models with randomly distributed edges.', vi: "Mô hình xác suất của đồ thị có các cạnh phân bố ngẫu nhiên." },
    level: 2, parentId: 'graph-theory', childIds: [],
    position: [6, -18, 28], size: 'small', color: '#1d4ed8',
    tags: ['graph-theory', 'probability'],
    basics: { definition: { zh: '随机图论研究以概率方式生成的图的性质。', en: 'Random graph theory studies properties of graphs generated probabilistically.', vi: "Nghiên cứu tính chất đồ thị sinh ra theo xác suất." }, scope: { zh: 'Erdős–Rényi模型、相变、小世界网络、无标度网络。', en: "Erdős–Rényi model, phase transitions, small-world networks, scale-free networks.", vi: "Mô hình Erdős–Rényi, chuyển pha, mạng thế giới nhỏ và mạng không tỷ lệ." }, importance: 3, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['graph-theory', 'probability', 'networks'], applications: ['complex-networks', 'epidemiology', 'ecology', 'internet-topology'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  }
];
