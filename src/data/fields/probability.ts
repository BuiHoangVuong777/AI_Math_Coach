import { FieldNode } from '@/types';

export const probabilityFields: FieldNode[] = [
  // ==================== 概率论与统计 ====================
  {
    id: 'probability', slug: 'probability',
    names: { zh: '概率论', en: 'Probability Theory', vi: "Lý thuyết xác suất" },
    descriptions: {
      zh: '研究随机现象数量规律的数学分支，是现代科学和工程的基石。',
      en: 'The branch studying numerical laws of random phenomena, foundation of modern science and engineering.', vi: "Nghiên cứu quy luật định lượng của hiện tượng ngẫu nhiên; nền tảng khoa học và kỹ thuật hiện đại."
    },
    level: 1, parentId: null,
    childIds: ['probability-foundations', 'stochastic-processes', 'bayesian-inference', 'martingale-theory'],
    position: [20, -4, 6], size: 'large', color: '#22c55e',
    tags: ['probability'],
    basics: {
      definition: { zh: '概率论用公理化方法定义概率测度，研究随机变量的分布、收敛和极限行为。', en: 'Probability theory axiomatizes probability measures and studies distributions, convergence, and limits of random variables.', vi: "Tiên đề hóa độ đo xác suất, nghiên cứu phân phối, hội tụ và giới hạn của biến ngẫu nhiên." },
      scope: { zh: '概率空间、随机变量、分布函数、期望与大数定律、中心极限定理。', en: 'Probability spaces, random variables, distribution functions, expectation, LLN, CLT.', vi: "Không gian xác suất, biến ngẫu nhiên, hàm phân phối, kỳ vọng, luật số lớn và định lý giới hạn trung tâm." },
      importance: 5, difficulty: 4,
      history: [
        { year: 1654, event: { zh: '帕斯卡-费马通信奠定基础', en: 'Pascal-Fermat correspondence', vi: "Thư trao đổi Pascal–Fermat" } },
        { year: 1812, event: { zh: '拉普拉斯《概率分析论》', en: "Laplace's Théorie Analytique", vi: "Théorie Analytique của Laplace" } },
        { year: 1933, event: { zh: '科尔莫戈罗夫概率论公理', en: 'Kolmogorov axioms', vi: "Tiên đề Kolmogorov" } },
        { year: 1900, event: { zh: '巴切利耶期权定价理论', en: 'Bachelier option pricing theory', vi: "Lý thuyết định giá quyền chọn của Bachelier" } }
      ],
      tags: ['probability']
    },
    principles: [
      { id: 'p1', title: { zh: '大数定律', en: 'Law of Large Numbers', vi: "Luật số lớn" }, description: { zh: '样本均值收敛到期望值', en: 'Sample mean converges to expected value', vi: "Trung bình mẫu hội tụ về kỳ vọng" }, importance: 3 },
      { id: 'p2', title: { zh: '中心极限定理', en: 'Central Limit Theorem', vi: "Định lý giới hạn trung tâm" }, description: { zh: '大量独立变量之和趋近正态分布', en: 'Sum of many independent variables approaches normal distribution', vi: "Tổng nhiều biến độc lập, dưới điều kiện thích hợp và sau chuẩn hóa, tiến tới phân phối chuẩn" }, importance: 3 }
    ],
    formulas: [
      { id: 'clt', name: { zh: '中心极限定理', en: 'CLT', vi: "Định lý giới hạn trung tâm" }, latex: '\\frac{\\bar{X}_n - \\mu}{\\sigma/\\sqrt{n}} \\xrightarrow{d} N(0,1)', description: { zh: '标准化样本均值的极限分布', en: 'Limit distribution of standardized sample mean', vi: "Phân phối giới hạn của trung bình mẫu chuẩn hóa" }, variables: [], applications: [{ zh: '统计学基础', en: 'Statistics foundation', vi: "Nền tảng thống kê" }], difficulty: 3 }
    ],
    pioneers: [
      { id: 'kolmogorov', name: 'Andrey Kolmogorov', nameZh: '科尔莫戈罗夫', birthYear: 1903, deathYear: 1987, nationality: '俄罗斯', nationalityNames: {"zh": "俄罗斯", "en": "Russia", "vi": "Nga"}, contributions: { zh: '概率论公理化', en: 'Axiomatization of probability', vi: "Tiên đề hóa xác suất" } },
      { id: 'laplace-p', name: 'Pierre-Simon Laplace', nameZh: '皮埃尔-西蒙·拉普拉斯', birthYear: 1749, deathYear: 1827, nationality: '法国', nationalityNames: {"zh": "法国", "en": "France", "vi": "Pháp"}, contributions: { zh: '概率论系统化', en: 'Systematization of probability theory', vi: "Hệ thống hóa lý thuyết xác suất" } }
    ], figures: [], references: [],
    relatedFields: ['analysis', 'statistics', 'applied'], applications: ['finance', 'ai', 'physics', 'insurance'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 统计学
  {
    id: 'statistics', slug: 'statistics',
    names: { zh: '统计学', en: 'Statistics', vi: "Thống kê" },
    descriptions: { zh: '收集、分析和解释数据的科学与艺术。', en: 'The science of collecting, analyzing, and interpreting data.', vi: "Khoa học thu thập, phân tích và diễn giải dữ liệu." },
    level: 1, parentId: null,
    childIds: ['mathematical-statistics', 'statistical-inference', 'multivariate-statistics', 'nonparametric-statistics', 'time-series-analysis'],
    position: [22, -8, 10], size: 'large', color: '#16a34a',
    tags: ['statistics'],
    basics: {
      definition: { zh: '统计学从数据中推断总体特征，包括描述统计和推断统计。', en: 'Statistics infers population characteristics from data, including descriptive and inferential statistics.', vi: "Suy ra đặc điểm tổng thể từ dữ liệu, gồm thống kê mô tả và suy luận." },
      scope: { zh: '参数估计、假设检验、回归分析、方差分析、贝叶斯统计。', en: 'Parameter estimation, hypothesis testing, regression, ANOVA, Bayesian statistics.', vi: "Ước lượng tham số, kiểm định giả thuyết, hồi quy, phân tích phương sai ANOVA, thống kê Bayes." },
      importance: 5, difficulty: 3,
      history: [
        { year: 1908, event: { zh: '戈塞特t检验', en: "Student's t-test", vi: "Kiểm định t của Student" } },
        { year: 1920, event: { zh: '费希尔统计方法论', en: "Fisher's statistical methodology", vi: "Phương pháp thống kê của Fisher" } },
        { year: 1937, event: { zh: '奈曼-皮尔逊引理', en: 'Neyman-Pearson lemma', vi: "Bổ đề Neyman–Pearson" } }
      ], tags: []
    },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['probability', 'applied', 'computer-science'], applications: ['data-science', 'medicine', 'economics', 'social-science'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 随机过程
  { id: 'stochastic-processes', slug: 'stochastic-processes',
    names: { zh: '随机过程', en: 'Stochastic Processes', vi: "Quá trình ngẫu nhiên" },
    descriptions: { zh: '随时间演化的随机现象的数学模型。', en: 'Mathematical models for random phenomena evolving over time.', vi: "Mô hình toán cho hiện tượng ngẫu nhiên tiến triển theo thời gian." },
    level: 2, parentId: 'probability', childIds: [],
    position: [18, -2, 9], size: 'medium', color: '#22c55e',
    tags: ['probability'],
    basics: { definition: { zh: '随机过程是时间参数化的随机变量族。', en: 'A stochastic process is an indexed family of random variables.', vi: "Quá trình ngẫu nhiên là họ biến ngẫu nhiên được đánh chỉ số." }, scope: { zh: '马尔可夫链、布朗运动、泊松过程、鞅论。', en: 'Markov chains, Brownian motion, Poisson processes, martingale theory.', vi: "Chuỗi Markov, chuyển động Brown, quá trình Poisson, martingale." }, importance: 5, difficulty: 5, history: [
      { year: 1900, event: { zh: '巴切利耶提出布朗运动模型', en: 'Bachelier proposes Brownian motion model', vi: "Bachelier đề xuất mô hình chuyển động Brown" } },
      { year: 1933, event: { zh: '柯尔莫戈罗夫扩张定理', en: 'Kolmogorov extension theorem', vi: "Định lý mở rộng Kolmogorov" } }
    ], tags: [] },
    principles: [], formulas: [],
    pioneers: [{ id: 'wiener', name: 'Norbert Wiener', nameZh: '诺伯特·维纳', birthYear: 1894, deathYear: 1964, nationality: '美国', nationalityNames: {"zh": "美国", "en": "United States", "vi": "Hoa Kỳ"}, contributions: { zh: '维纳过程（布朗运动）', en: 'Wiener process (Brownian motion)', vi: "Quá trình Wiener (chuyển động Brown)" } }],
    figures: [], references: [],
    relatedFields: ['probability', 'analysis', 'physics'], applications: ['finance', 'queueing-theory', 'biology', 'physics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 贝叶斯推断
  { id: 'bayesian-inference', slug: 'bayesian-inference',
    names: { zh: '贝叶斯推断', en: 'Bayesian Inference', vi: "Suy luận Bayes" },
    descriptions: { zh: '基于贝叶斯定理更新信念的概率推断方法。', en: 'Probabilistic inference method that updates beliefs using Bayes theorem.', vi: "Suy luận xác suất cập nhật niềm tin bằng định lý Bayes." },
    level: 2, parentId: 'probability', childIds: [],
    position: [24, -6, 4], size: 'medium', color: '#16a34a',
    tags: ['statistics'],
    basics: { definition: { zh: '贝叶斯推断将未知参数视为随机变量，利用先验信息和观测数据进行后验推断。', en: 'Bayesian inference treats unknown parameters as random variables, using prior information and observed data for posterior inference.', vi: "Xem tham số chưa biết là biến ngẫu nhiên, kết hợp thông tin tiên nghiệm với dữ liệu để suy luận hậu nghiệm." }, scope: { zh: '先验分布、似然函数、后验分布、MCMC采样、变分推断。', en: 'Prior distribution, likelihood, posterior, MCMC sampling, variational inference.', vi: "Phân phối tiên nghiệm, hàm hợp lý, hậu nghiệm, lấy mẫu MCMC, suy luận biến phân." }, importance: 4, difficulty: 4, history: [
      { year: 1763, event: { zh: '贝叶斯论文发表', en: "Bayes' essay published", vi: "Công bố bài luận của Bayes" } },
      { year: 1990, event: { zh: 'MCMC方法兴起', en: 'Rise of MCMC methods', vi: "Phát triển phương pháp MCMC" } }
    ], tags: [] },
    principles: [], formulas: [
      { id: 'bayes', name: { zh: '贝叶斯定理', en: "Bayes' Theorem", vi: "Định lý Bayes" }, latex: 'P(\\theta|D) = \\frac{P(D|\\theta)P(\\theta)}{P(D)}', description: { zh: '从先验到后验的核心公式', en: 'Core formula from prior to posterior', vi: "Công thức cốt lõi chuyển từ tiên nghiệm sang hậu nghiệm" }, variables: [], applications: [{ zh: '机器学习', en: 'Machine learning', vi: "Học máy" }], difficulty: 3 }
    ], pioneers: [], figures: [], references: [],
    relatedFields: ['probability', 'statistics', 'machine-learning'], applications: ['ai', 'data-science', 'medicine', 'finance'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 鞅论
  { id: 'martingale-theory', slug: 'martingale-theory',
    names: { zh: '鞅论', en: 'Martingale Theory', vi: "Lý thuyết martingale" },
    descriptions: { zh: '研究"公平博弈"过程的数学理论，在金融数学中至关重要。', en: 'Theory of fair game processes, essential in mathematical finance.', vi: "Lý thuyết quá trình trò chơi công bằng, quan trọng trong toán tài chính." },
    level: 2, parentId: 'probability', childIds: [],
    position: [20, 0, 12], size: 'small', color: '#22c55e',
    tags: ['probability'],
    basics: { definition: { zh: '鞅是在给定历史信息下条件期望保持不变的随机过程。', en: 'A martingale is a stochastic process whose conditional expectation remains constant given its history.', vi: "Martingale là quá trình có kỳ vọng có điều kiện của giá trị tương lai bằng giá trị hiện tại khi biết lịch sử." }, scope: { zh: '可选停止定理、上/下鞅、Doob分解、连续时间鞅。', en: 'Optional stopping theorem, sub/super-martingales, Doob decomposition, continuous-time martingales.', vi: "Định lý dừng tùy chọn, martingale dưới và trên, phân rã Doob, martingale thời gian liên tục." }, importance: 4, difficulty: 5, history: [
      { year: 1953, event: { zh: 'Doob《鞅论》出版', en: "Doob's Stochastic Processes published", vi: "Công bố Quá trình ngẫu nhiên của Doob" } }
    ], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['probability', 'finance', 'analysis'], applications: ['quantitative-finance', 'gambling-theory'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 概率基础
  { id: 'probability-foundations', slug: 'probability-foundations',
    names: { zh: '概率论基础', en: 'Foundations of Probability', vi: "Nền tảng xác suất" },
    descriptions: { zh: '概率空间的公理化和基本概念。', en: 'Axiomatization of probability spaces and fundamental concepts.', vi: "Tiên đề hóa không gian xác suất và các khái niệm cơ bản." },
    level: 2, parentId: 'probability', childIds: [],
    position: [22, -1, 6], size: 'small', color: '#22c55e',
    tags: ['probability'],
    basics: { definition: { zh: '建立在σ-代数上的概率测度及其性质。', en: 'Probability measures on σ-algebras and their properties.', vi: "Độ đo xác suất trên σ-đại số và tính chất của chúng." }, scope: { zh: '事件独立性、条件概率、全概率公式、联合分布。', en: 'Event independence, conditional probability, law of total probability, joint distributions.', vi: "Độc lập biến cố, xác suất có điều kiện, xác suất toàn phần, phân phối đồng thời." }, importance: 4, difficulty: 3, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['probability', 'measure-theory', 'logic'], applications: ['all-probability-fields'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 数学统计
  { id: 'mathematical-statistics', slug: 'mathematical-statistics',
    names: { zh: '数理统计', en: 'Mathematical Statistics', vi: "Thống kê toán học" },
    descriptions: { zh: '统计推断的数学理论基础。', en: 'Mathematical foundation of statistical inference.', vi: "Nền tảng toán của suy luận thống kê." },
    level: 2, parentId: 'statistics', childIds: [],
    position: [24, -10, 12], size: 'medium', color: '#16a34a',
    tags: ['statistics'],
    basics: { definition: { zh: '从样本数据推断总体特征的严格数学框架。', en: 'Rigorous framework for inferring population characteristics from sample data.', vi: "Khuôn khổ chặt chẽ để suy ra đặc điểm tổng thể từ mẫu." }, scope: { zh: '充分统计量、指数族分布、Cramer-Rao界、假设检验理论。', en: 'Sufficient statistics, exponential families, Cramer-Rao bound, hypothesis testing theory.', vi: "Thống kê đủ, họ mũ, chặn Cramér–Rao, lý thuyết kiểm định giả thuyết." }, importance: 5, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['probability', 'statistics', 'applied'], applications: ['data-science', 'quality-control'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 多元统计
  { id: 'multivariate-statistics', slug: 'multivariate-statistics',
    names: { zh: '多元统计分析', en: 'Multivariate Statistics', vi: "Thống kê đa biến" },
    descriptions: { zh: '同时分析多个随机变量的统计方法。', en: 'Statistical methods for analyzing multiple random variables simultaneously.', vi: "Phương pháp phân tích đồng thời nhiều biến ngẫu nhiên." },
    level: 2, parentId: 'statistics', childIds: [],
    position: [25, -6, 14], size: 'small', color: '#16a34a',
    tags: ['statistics'],
    basics: { definition: { zh: '处理多维数据集的统计分析技术。', en: 'Statistical techniques for handling multidimensional datasets.', vi: "Kỹ thuật thống kê cho dữ liệu nhiều chiều." }, scope: { zh: '主成分分析、因子分析、聚类分析、典型相关、判别分析。', en: 'PCA, factor analysis, cluster analysis, canonical correlation, discriminant analysis.', vi: "PCA, phân tích nhân tố, phân cụm, tương quan chính tắc, phân tích phân biệt." }, importance: 4, difficulty: 3, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['statistics', 'linear-algebra', 'applied'], applications: ['machine-learning', 'data-mining', 'psychometrics'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 非参数统计
  { id: 'nonparametric-statistics', slug: 'nonparametric-statistics',
    names: { zh: '非参数统计', en: 'Nonparametric Statistics', vi: "Thống kê phi tham số" },
    descriptions: { zh: '不依赖特定总体分布形式的统计方法。', en: 'Statistical methods not dependent on a specific population distribution form.', vi: "Phương pháp không phụ thuộc một dạng phân phối tổng thể cụ thể." },
    level: 2, parentId: 'statistics', childIds: [],
    position: [20, -11, 13], size: 'small', color: '#16a34a',
    tags: ['statistics'],
    basics: { definition: { zh: '对分布形式不做强假定的统计推断方法。', en: 'Inference methods without strong assumptions about distribution forms.', vi: "Suy luận không đòi hỏi giả định mạnh về dạng phân phối." }, scope: { zh: '秩检验、核密度估计、U检验、符号检验。', en: 'Rank tests, kernel density estimation, Mann-Whitney U test, sign test.', vi: "Kiểm định hạng, ước lượng mật độ hạch, Mann–Whitney U, kiểm định dấu." }, importance: 3, difficulty: 3, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['statistics', 'applied'], applications: ['biostatistics', 'social-sciences'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },

  // 时间序列分析
  { id: 'time-series-analysis', slug: 'time-series-analysis',
    names: { zh: '时间序列分析', en: 'Time Series Analysis', vi: "Phân tích chuỗi thời gian" },
    descriptions: { zh: '按时间顺序排列的数据的分析与预测。', en: 'Analysis and prediction of sequentially ordered data.', vi: "Phân tích và dự báo dữ liệu theo thứ tự thời gian." },
    level: 2, parentId: 'statistics', childIds: [],
    position: [26, -4, 8], size: 'small', color: '#16a34a',
    tags: ['statistics'],
    basics: { definition: { zh: '对随时间变化的数据序列进行建模、分析和预测。', en: 'Modeling, analyzing, and forecasting time-varying data sequences.', vi: "Mô hình hóa, phân tích và dự báo dãy dữ liệu thay đổi theo thời gian." }, scope: { zh: 'ARIMA模型、自相关、谱分析、状态空间模型。', en: 'ARIMA models, autocorrelation, spectral analysis, state-space models.', vi: "ARIMA, tự tương quan, phân tích phổ, mô hình không gian trạng thái." }, importance: 4, difficulty: 4, history: [], tags: [] },
    principles: [], formulas: [], pioneers: [], figures: [], references: [],
    relatedFields: ['statistics', 'stochastic-processes', 'applied'], applications: ['economics', 'signal-processing', 'weather-forecasting'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  }
];
