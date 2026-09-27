import { FieldNode } from '@/types';

export const interdisciplinaryFields: FieldNode[] = [
  // ==================== 交叉学科 ====================
  {
    id: 'interdisciplinary', slug: 'interdisciplinary',
    names: { zh: '数学交叉学科', en: 'Interdisciplinary Mathematics', vi: "Toán học liên ngành" },
    descriptions: { zh: '数学与其他学科深度交叉融合产生的新兴领域。', en: 'Emerging fields from deep cross-disciplinary fusion of mathematics with other disciplines.', vi: "Lĩnh vực hình thành từ sự kết hợp sâu giữa Toán và các ngành khác." },
    level: 1, parentId: null,
    childIds: ['mathematical-biology', 'information-theory', 'mathematical-finance', 'computer-science-math', 'cryptography-adv', 'data-science-math'],
    position: [22, -12, -6], size: 'large', color: '#84cc16',
    tags: ['interdisciplinary'],
    basics: {
      definition: { zh: '交叉学科领域将数学方法应用于非传统数学问题，或从其他学科中提炼新的数学概念。', en: 'Interdisciplinary fields apply math to non-traditional problems or extract new math concepts from other disciplines.', vi: "Áp dụng toán vào bài toán mới hoặc rút ra khái niệm toán từ các ngành khác." },
      scope: { zh: '数学生物学、信息论、金融数学、计算科学、密码学、数据科学、网络科学。', en: 'Mathematical biology, information theory, financial mathematics, computer science, cryptography, data science, network science.', vi: "Toán sinh học, thông tin, tài chính, khoa học máy tính, mật mã, dữ liệu và mạng." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1948, event: { zh: '香农创立信息论', en: "Shannon founds information theory", vi: "Shannon sáng lập lý thuyết thông tin" } },
        { year: 1953, event: { zh: 'Watson-Crick DNA结构发现', en: 'Watson-Crick DNA discovery', vi: "Watson và Crick phát hiện cấu trúc DNA" } },
        { year: 1990, event: { zh: '机器学习兴起', en: 'Rise of machine learning', vi: "Học máy phát triển" } }
      ],
      tags: ['interdisciplinary']
    },
    principles: [], formulas: [],
    pioneers: [{ id: 'shannon', name: 'Claude Shannon', nameZh: '克劳德·香农', birthYear: 1916, deathYear: 2001, nationality: '美国', nationalityNames: {"zh": "美国", "en": "United States", "vi": "Hoa Kỳ"}, contributions: { zh: '信息论之父', en: "Father of information theory", vi: "Đặt nền móng cho lý thuyết thông tin" } }],
    figures: [], references: [],
    relatedFields: ['applied', 'discrete', 'probability'], applications: ['biology', 'cs', 'finance', 'engineering'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 数学生物学
  { id: 'mathematical-biology', slug: 'mathematical-biology',
    names: { zh: '数学生物学', en: 'Mathematical Biology', vi: "Toán sinh học" },
    descriptions: { zh: '用数学模型研究生物系统的结构和行为。', en: 'Using mathematical models to study structure and behavior of biological systems.', vi: "Dùng mô hình toán nghiên cứu cấu trúc và hành vi hệ sinh học." },
    level: 1, parentId: null,
    childIds: ['population-dynamics', 'epidemiology-math', 'computational-genomics', 'neuroscience-math', 'systems-biology-math'],
    position: [26, -16, -2], size: 'large', color: '#22c55e',
    tags: ['mathematical-biology'],
    basics: {
      definition: { zh: '数学生物学用微分方程、概率论、统计学和计算机模拟来描述和预测生物过程。', en: 'Mathematical biology uses DEs, probability, statistics, and simulation to describe and predict biological processes.', vi: "Dùng phương trình vi phân, xác suất, thống kê và mô phỏng để mô tả, dự đoán quá trình sinh học." },
      scope: { zh: '种群动力学、传染病模型、神经科学数学、基因序列分析、药代动力学、生态建模。', en: 'Population dynamics, epidemic models, neuroscience math, genomic analysis, pharmacokinetics, ecological modeling.', vi: "Động lực quần thể, dịch bệnh, toán thần kinh, phân tích bộ gen, dược động học, mô hình sinh thái." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1798, event: { zh: '马尔萨斯人口论', en: "Malthus's population essay", vi: "Luận thuyết dân số của Malthus" } },
        
        { year: 1952, event: { zh: 'Hodgkin-Huxley神经元模型', en: 'Hodgkin-Huxley neuron model', vi: "Mô hình nơron Hodgkin–Huxley" } }
      ], tags: []
    },
    principles: [], formulas: [
      { id: 'lotka-volterra', name: { zh: 'Lotka-Volterra方程', en: 'Lotka-Volterra Equations', vi: "Phương trình Lotka–Volterra" }, latex: '\\frac{dx}{dt} = \\alpha x - \\beta xy, \\quad \\frac{dy}{dt} = \\delta xy - \\gamma y', description: { zh: '捕食者-猎物种群动态的经典模型', en: 'Classic model of predator-prey population dynamics', vi: "Mô hình kinh điển về động lực quần thể thú săn mồi và con mồi" }, variables: [], applications: [{ zh: '生态学', en: 'Ecology', vi: "Sinh thái học" }], difficulty: 3 }
    ],
    pioneers: [],
    figures: [], references: [],
    relatedFields: ['ode', 'pde', 'probability'], applications: ['medicine', 'ecology', 'pharmaceuticals', 'genetics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 信息论
  { id: 'information-theory', slug: 'information-theory',
    names: { zh: '信息论', en: 'Information Theory', vi: "Lý thuyết thông tin" },
    descriptions: { zh: '信息的量化、存储和通信的数学理论。', en: 'Mathematical theory of quantification, storage, and communication of information.', vi: "Lý thuyết toán về định lượng, lưu trữ và truyền thông tin." },
    level: 1, parentId: null,
    childIds: ['coding-theory-info', 'channel-coding', 'source-coding', 'network-information-theory'],
    position: [28, -8, -8], size: 'large', color: '#6366f1',
    tags: ['interdisciplinary', 'cs'],
    basics: {
      definition: { zh: '信息论由香农创立，研究信息的度量、传输极限和数据压缩的理论极限。', en: 'Founded by Shannon, studies information measurement, transmission limits, and theoretical limits of data compression.', vi: "Shannon sáng lập; nghiên cứu đo thông tin, giới hạn truyền tin và nén dữ liệu." },
      scope: { zh: '熵与互信息、信源编码(无损/有损)、信道容量、纠错码、率失真理论。', en: 'Entropy & mutual info, source coding (lossy/lossless), channel capacity, error correction, rate-distortion theory.', vi: "Entropy, thông tin tương hỗ, mã nguồn có và không mất dữ liệu, dung lượng kênh, sửa lỗi, lý thuyết tốc độ – độ méo." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1948, event: { zh: '香农《通信的数学理论》', en: "Shannon's Mathematical Theory of Communication", vi: "Lý thuyết toán về truyền tin của Shannon" } },
        { year: 1959, event: { zh: '香农-费诺编码', en: 'Shannon-Fano coding', vi: "Mã Shannon–Fano" } },
        { year: 1960, event: { zh: '信道编码定理', en: 'Channel coding theorem', vi: "Định lý mã hóa kênh" } }
      ], tags: []
    },
    principles: [], formulas: [
      { id: 'shannon-entropy', name: { zh: '香农熵', en: 'Shannon Entropy', vi: "Entropy Shannon" }, latex: 'H(X) = -\\sum_{x} p(x) \\log_2 p(x)', description: { zh: '信息量的基本度量单位是比特(bit)', en: 'Basic measure of information is the bit', vi: "Đơn vị đo thông tin cơ bản là bit" }, variables: [], applications: [{ zh: '通信/压缩/ML', en: 'Compression/comms/ML', vi: "Nén dữ liệu, truyền tin, học máy" }], difficulty: 3 }
    ],
    pioneers: [],
    figures: [], references: [],
    relatedFields: ['probability', 'statistics', 'cs'], applications: ['telecommunications', 'data-compression', 'ml', 'cryptography'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 计算机科学数学
  { id: 'computer-science-math', slug: 'computer-science-math',
    names: { zh: '理论计算机科学', en: 'Theoretical Computer Science', vi: "Khoa học máy tính lý thuyết" },
    descriptions: { zh: '计算的数学基础：可计算性、复杂性、算法设计与分析。', en: 'Mathematical foundations of computing: computability, complexity, algorithm design & analysis.', vi: "Nền tảng toán của tính toán: khả năng tính, độ phức tạp, thiết kế và phân tích thuật toán." },
    level: 2, parentId: 'interdisciplinary', childIds: [],
    position: [30, -10, 0], size: 'medium', color: '#6366f1',
    tags: ['computer-science'],
    basics: { definition: { zh: '理论CS研究什么是可计算的、计算的效率极限是什么。', en: 'Theoretical CS studies what is computable and what are the efficiency limits of computation.', vi: "Nghiên cứu điều gì tính được và giới hạn hiệu quả tính toán." }, scope: { zh: '图灵机模型、可计算性理论、P/NP问题、算法复杂度类、随机算法、分布式算法。', en: 'Turing machines, computability theory, P vs NP, complexity classes, randomized algorithms, distributed algorithms.', vi: "Máy Turing, khả năng tính, P so với NP, lớp độ phức tạp, thuật toán ngẫu nhiên và phân tán." }, importance: 5, difficulty: 5, history: [
      { year: 1936, event: { zh: '图灵机模型', en: 'Turing machine model', vi: "Mô hình máy Turing" } },
      { year: 1971, event: { zh: 'Cook-Levin NP完全性', en: 'Cook-Levin NP-completeness', vi: "Tính NP-đầy đủ Cook–Levin" } }
    ], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['logic', 'discrete', 'complexity'], applications: ['all-cs-fields', 'algorithm-engineering', 'security'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 高级密码学
  { id: 'cryptography-adv', slug: 'cryptography-advanced',
    names: { zh: '现代密码学', en: 'Modern Cryptography', vi: "Mật mã học hiện đại" },
    descriptions: { zh: '基于计算复杂性理论的现代密码系统。', en: 'Modern cryptographic systems based on computational complexity theory.', vi: "Hệ mật mã hiện đại dựa trên lý thuyết độ phức tạp tính toán." },
    level: 2, parentId: 'interdisciplinary', childIds: [],
    position: [24, -18, -4], size: 'medium', color: '#4f46e5',
    tags: ['cryptography'],
    basics: { definition: { zh: '现代密码学基于计算难题（如因数分解、离散对数）构建安全协议。', en: 'Modern cryptography builds secure protocols based on computational hardness (factoring, discrete log).', vi: "Xây dựng giao thức an toàn dựa vào bài toán khó như phân tích thừa số và logarit rời rạc." }, scope: { zh: '公钥基础设施(PKI)、零知识证明、同态加密、多方安全计算(MPC)、后量子密码。', en: 'PKI, zero-knowledge proofs, homomorphic encryption, MPC, post-quantum cryptography.', vi: "Hạ tầng khóa công khai PKI, chứng minh không tiết lộ, mã hóa đồng cấu, tính toán đa bên MPC, mật mã hậu lượng tử." }, importance: 5, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['numbertheory', 'complexity', 'info-theory'], applications: ['blockchain', 'secure-multi-party', 'privacy-preserving-tech'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 数据科学数学
  { id: 'data-science-math', slug: 'data-science-mathematics',
    names: { zh: '数据科学中的数学', en: 'Mathematics in Data Science', vi: "Toán trong khoa học dữ liệu" },
    descriptions: { zh: '支撑数据分析、挖掘和机器学习的核心数学工具集。', en: 'Core mathematical toolkit supporting data analysis, mining, and machine learning.', vi: "Bộ công cụ toán cốt lõi cho phân tích dữ liệu, khai phá và học máy." },
    level: 2, parentId: 'interdisciplinary', childIds: [],
    position: [20, -18, 2], size: 'medium', color: '#84cc16',
    tags: ['interdisciplinary', 'cs'],
    basics: { definition: { zh: '数据科学依赖线性代数、优化理论、概率统计和信息论的深度融合。', en: 'Data science relies on deep integration of linear algebra, optimization, probability/statistics, and information theory.', vi: "Kết hợp đại số tuyến tính, tối ưu, xác suất, thống kê và lý thuyết thông tin." }, scope: { zh: '高维数据分析、降维方法(PCA/t-SNE/UMAP)、聚类算法、核方法、流形学习、因果推断。', en: 'High-dimensional data analysis, dimensionality reduction, clustering, kernel methods, manifold learning, causal inference.', vi: "Phân tích dữ liệu nhiều chiều, giảm chiều, phân cụm, phương pháp hạch, học đa tạp, suy luận nhân quả." }, importance: 5, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['linear-algebra', 'optimization', 'statistics', 'probability'], applications: ['ai/ml', 'business-analytics', 'scientific-data-analysis', 'recommender-systems'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 种群动力学
  { id: 'population-dynamics', slug: 'population-dynamics',
    names: { zh: '种群动力学', en: 'Population Dynamics', vi: "Động lực học quần thể" },
    descriptions: { zh: '种群数量随时间变化的数学模型。', en: 'Mathematical models for how population sizes change over time.', vi: "Mô hình toán về thay đổi quy mô quần thể theo thời gian." },
    level: 2, parentId: 'mathematical-biology', childIds: [],
    position: [28, -14, 0], size: 'small', color: '#22c55e',
    tags: ['mathematical-biology', 'ode'],
    basics: { definition: { zh: '种群动力学使用微分方程和差分方程描述生物种群的增长、竞争和共存。', en: 'Population dynamics uses ODEs and difference equations to describe growth, competition, and coexistence of biological populations.', vi: "Dùng phương trình vi phân thường và sai phân mô tả tăng trưởng, cạnh tranh và cùng tồn tại của quần thể." }, scope: { zh: '指数增长、Logistic增长、Lotka-Volterra竞争模型、结构化种群模型、元种群理论。', en: 'Exponential growth, Logistic growth, Lotka-Volterra competition, structured populations, metapopulation theory.', vi: "Tăng trưởng mũ, logistic, cạnh tranh Lotka–Volterra, quần thể có cấu trúc, lý thuyết siêu quần thể." }, importance: 3, difficulty: 3, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['ode', 'mathematical-biology'], applications: ['ecology', 'conservation', 'fisheries-management'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 流行病学数学
  { id: 'epidemiology-math', slug: 'epidemiology-math',
    names: { zh: '数理流行病学', en: 'Mathematical Epidemiology', vi: "Dịch tễ học toán học" },
    descriptions: { zh: '疾病传播过程的数学建模和分析。', en: 'Mathematical modeling and analysis of disease transmission processes.', vi: "Mô hình hóa và phân tích quá trình lây truyền bệnh." },
    level: 2, parentId: 'mathematical-biology', childIds: [],
    position: [24, -18, 2], size: 'small', color: '#22c55e',
    tags: ['mathematical-biology'],
    basics: { definition: { zh: '数理流行病学用微分方程和网络模型预测和控制传染病的传播。', en: 'Mathematical epidemiology predicts and controls disease spread using differential equations and network models.', vi: "Dự đoán, kiểm soát lây lan bằng phương trình vi phân và mô hình mạng." }, scope: { zh: 'SIR/SEIR模型、基本再生数R0、网络传播模型、空间流行病、疫苗策略优化。', en: 'SIR/SEIR models, basic reproduction number R0, network transmission, spatial epidemics, vaccine strategy optimization.', vi: "SIR/SEIR, số sinh sản cơ bản R0, lây truyền mạng, dịch không gian, tối ưu chiến lược vắc-xin." }, importance: 5, difficulty: 4, history: [
      
    ], tags: [] },
    principles: [], formulas: [{ id: 'sir', name: { zh: 'SIR模型', en: 'SIR Model', vi: "Mô hình SIR" }, latex: '\\frac{dS}{dt} = -\\beta SI, \\quad \\frac{dI}{dt} = \\beta SI - \\gamma I, \\quad \\frac{dR}{dt} = \\gamma I', description: { zh: '经典传染病仓室模型', en: 'Classic epidemic compartmental model', vi: "Mô hình ngăn kinh điển của dịch bệnh" }, variables: [], applications: [{ zh: '公共卫生', en: 'Public health', vi: "Y tế công cộng" }], difficulty: 3 }],
    pioneers: [], figures: [], references: [],
    relatedFields: ['ode', 'stochastic-processes', 'network-theory'], applications: ['public-health', 'pandemic-planning', 'vaccination-policy'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 计算基因组学
  { id: 'computational-genomics', slug: 'computational-genomics',
    names: { zh: '计算基因组学', en: 'Computational Genomics', vi: "Hệ gen học tính toán" },
    descriptions: { zh: '用计算和数学方法分析基因组和分子生物学数据。', en: 'Using computational and mathematical methods to analyze genomic and molecular biology data.', vi: "Dùng phương pháp tính toán và toán phân tích dữ liệu bộ gen và sinh học phân tử." },
    level: 2, parentId: 'mathematical-biology', childIds: [],
    position: [22, -12, 4], size: 'small', color: '#22c55e',
    tags: ['mathematical-biology', 'cs'],
    basics: { definition: { zh: '计算基因组学结合了统计学、组合优化和算法来处理大规模DNA序列数据。', en: 'Computational genomics combines statistics, combinatorial optimization, and algorithms for large-scale DNA sequence data.', vi: "Kết hợp thống kê, tối ưu tổ hợp và thuật toán cho dữ liệu trình tự DNA quy mô lớn." }, scope: { zh: '序列比对、基因组装、系统发育树构建、GWAS、单细胞RNA测序分析。', en: 'Sequence alignment, genome assembly, phylogenetics, GWAS, single-cell RNA-seq analysis.', vi: "Căn chỉnh trình tự, lắp ráp bộ gen, phát sinh chủng loại, GWAS, phân tích RNA-seq đơn tế bào." }, importance: 4, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['combinatorics', 'statistics', 'algorithmics'], applications: ['personalized-medicine', 'drug-discovery', 'ancestry-testing', 'agricultural-biotech'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 神经科学数学
  { id: 'neuroscience-math', slug: 'neuroscience-math',
    names: { zh: '计算神经科学', en: 'Computational Neuroscience', vi: "Khoa học thần kinh tính toán" },
    descriptions: { zh: '神经系统信息处理的数学理论与计算模型。', en: 'Mathematical theories and computational models of neural system information processing.', vi: "Lý thuyết toán và mô hình tính toán về xử lý thông tin của hệ thần kinh." },
    level: 2, parentId: 'mathematical-biology', childIds: [],
    position: [28, -10, 4], size: 'small', color: '#22c55e',
    tags: ['mathematical-biology'],
    basics: { definition: { zh: '计算神经科学用ODE、概率图神经网络等工具建模神经元活动和大脑功能。', en: 'Computational neuroscience uses ODEs, probabilistic graphical networks to model neuronal activity and brain function.', vi: "Dùng phương trình vi phân thường và mạng đồ thị xác suất mô hình hóa hoạt động nơron và chức năng não." }, scope: { zh: 'Hodgkin-Huxley模型、突触可塑性、神经网络动力学、感觉编码、认知建模。', en: 'Hodgkin-Huxley model, synaptic plasticity, neural network dynamics, sensory encoding, cognitive modeling.', vi: "Hodgkin–Huxley, tính mềm dẻo synapse, động lực mạng thần kinh, mã hóa giác quan, mô hình nhận thức." }, importance: 4, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['ode', 'dynamical-systems', 'probability'], applications: ['brain-machine-interface', 'neural-prosthetics', 'ai-brain-research', 'psychiatry'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 系统生物学
  { id: 'systems-biology-math', slug: 'systems-biology-math',
    names: { zh: '系统生物学', en: 'Systems Biology', vi: "Sinh học hệ thống" },
    descriptions: { zh: '对生物系统整体行为的定量分析和建模。', en: 'Quantitative analysis and modeling of whole-system behavior in biology.', vi: "Phân tích định lượng và mô hình hóa hành vi toàn hệ sinh học." },
    level: 2, parentId: 'mathematical-biology', childIds: [],
    position: [25, -15, -1], size: 'small', color: '#22c55e',
    tags: ['mathematical-biology'],
    basics: { definition: { zh: '系统生物学整合多组学数据，用网络理论和动力系统方法理解生物系统的涌现行为。', en: 'Systems biology integrates multi-omic data using network theory and dynamical systems to understand emergent behavior in biology.', vi: "Kết hợp dữ liệu đa omics bằng lý thuyết mạng và hệ động lực để hiểu hành vi nổi lên của hệ sinh học." }, scope: { zh: '代谢网络、信号通路建模、基因调控网络、蛋白质相互作用网络。', en: 'Metabolic networks, signaling pathway modeling, gene regulatory networks, protein interaction networks.', vi: "Mạng trao đổi chất, đường truyền tín hiệu, mạng điều hòa gen, tương tác protein." }, importance: 4, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['graph-theory', 'ode', 'probability'], applications: ['drug-target-discovery', 'synthetic-biology', 'precision-medicine'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 编码理论(信息论下)
  { id: 'coding-theory-info', slug: 'coding-theory-info',
    names: { zh: '信道编码理论', en: 'Channel Coding Theory', vi: "Lý thuyết mã hóa kênh" },
    descriptions: { zh: '在噪声信道上可靠通信的信息论极限与方法。', en: 'Information-theoretic limits and methods for reliable communication over noisy channels.', vi: "Giới hạn thông tin và phương pháp truyền tin đáng tin cậy qua kênh nhiễu." },
    level: 2, parentId: 'information-theory', childIds: [],
    position: [32, -6, -10], size: 'small', color: '#6366f1',
    tags: ['information-theory'],
    basics: { definition: { zh: '信道编码理论研究如何接近香农信道容量的编码方案。', en: 'Channel coding theory studies coding schemes approaching Shannon channel capacity.', vi: "Nghiên cứu mã tiến gần dung lượng kênh Shannon." }, scope: { zh: '信道容量、Turbo码、LDPC码、极化码、MIMO信道容量、网络编码。', en: 'Channel capacity, Turbo codes, LDPC, polar codes, MIMO capacity, network coding.', vi: "Dung lượng kênh, mã Turbo, LDPC, cực, dung lượng MIMO, mã mạng." }, importance: 4, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['information-theory', 'coding-theory', 'probability'], applications: ['satellite-comm', '5g', 'deep-space-comm', 'storage-devices'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 信源编码
  { id: 'source-coding', slug: 'source-coding',
    names: { zh: '信源编码/数据压缩', en: 'Source Coding / Data Compression', vi: "Mã hóa nguồn và nén dữ liệu" },
    descriptions: { zh: '去除数据冗余以实现高效表示的信息论方法。', en: 'Information-theoretic methods for removing redundancy for efficient representation.', vi: "Loại bỏ dư thừa để biểu diễn thông tin hiệu quả." },
    level: 2, parentId: 'information-theory', childIds: [],
    position: [26, -5, -10], size: 'small', color: '#6366f1',
    tags: ['information-theory'],
    basics: { definition: { zh: '信源编码研究如何在无失真或有失真条件下最有效地压缩数据。', en: 'Source coding studies how to most efficiently compress data under lossless or lossy conditions.', vi: "Nghiên cứu nén dữ liệu hiệu quả nhất có hoặc không mất dữ liệu." }, scope: { zh: 'Huffman编码、算术编码、LZ77/LZ78、JPEG/MPEG、率失真理论、字典编码。', en: 'Huffman coding, arithmetic coding, LZ77/LZ78, JPEG/MPEG, rate-distortion theory, dictionary coding.', vi: "Huffman, mã số học, LZ77/LZ78, JPEG/MPEG, tốc độ – độ méo, mã từ điển." }, importance: 4, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['information-theory', 'combinatorics'], applications: ['image/video-compression', 'file-compression', 'streaming-media'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 网络信息论
  { id: 'network-information-theory', slug: 'network-information-theory',
    names: { zh: '网络信息论', en: 'Network Information Theory', vi: "Lý thuyết thông tin mạng" },
    descriptions: { zh: '多用户通信网络的容量区域与最优策略。', en: 'Capacity regions and optimal strategies for multi-user communication networks.', vi: "Miền dung lượng và chiến lược tối ưu cho mạng truyền tin nhiều người dùng." },
    level: 2, parentId: 'information-theory', childIds: [],
    position: [30, -11, -5], size: 'small', color: '#6366f1',
    tags: ['information-theory'],
    basics: { definition: { zh: '网络信息论推广香农理论到多点到多点的通信场景。', en: 'Network information theory extends Shannon theory to multi-point communication scenarios.', vi: "Mở rộng lý thuyết Shannon sang truyền tin nhiều điểm." }, scope: { zh: '多址接入信道、广播信道、中继信道、干扰信道、网络编码容量。', en: 'Multiple access channel, broadcast channel, relay channel, interference channel, network coding capacity.', vi: "Kênh đa truy cập, quảng bá, chuyển tiếp, nhiễu và dung lượng mã mạng." }, importance: 3, difficulty: 5, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['information-theory', 'graph-theory'], applications: ['wireless-networks', 'ad-hoc-networks', 'sensor-networks', '5g-6g'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  }
];
