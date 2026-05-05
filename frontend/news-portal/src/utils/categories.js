export const CATEGORY_LIST = [
  { value: "All", label: "सभी" },
  { value: "अपराध", label: "अपराध", highlight: true },
  { value: "संघर्ष से शिखर", label: "संघर्ष से शिखर", highlight: true },
  { value: "भ्रष्टाचार", label: "भ्रष्टाचार" },
  { value: "देश / विदेश", label: "देश / विदेश" },
  { value: "रियल हीरो", label: "रियल हीरो" },
  { value: "गरुड़ विशेष", label: "गरुड़ विशेष" },
  { value: "सतर्क", label: "सतर्क" },
  { value: "ज्योतिषी", label: "ज्योतिषी" },
  { value: "आत्म वाणी", label: "आत्म वाणी" },
];

export const DEFAULT_CATEGORY = CATEGORY_LIST[1].value;

const LEGACY_CATEGORY_MAP = {
  All: "All",
  all: "All",
  सभी: "All",
  Crime: "अपराध",
  crime: "अपराध",
  National: "देश / विदेश",
  national: "देश / विदेश",
  Business: "गरुड़ विशेष",
  business: "गरुड़ विशेष",
  Politics: "देश / विदेश",
  politics: "देश / विदेश",
  World: "देश / विदेश",
  world: "देश / विदेश",
  Article: "गरुड़ विशेष",
  article: "गरुड़ विशेष",
};

const ALL_KNOWN_CATEGORY_MAP = {
  ...LEGACY_CATEGORY_MAP,
  अपराध: "अपराध",
  "संघर्ष से शिखर": "संघर्ष से शिखर",
  भ्रष्टाचार: "भ्रष्टाचार",
  "देश / विदेश": "देश / विदेश",
  "रियल हीरो": "रियल हीरो",
  "गरुड़ विशेष": "गरुड़ विशेष",
  सतर्क: "सतर्क",
  ज्योतिषी: "ज्योतिषी",
  "आत्म बड़ी": "आत्म वाणी",
  "आत्म वादी": "आत्म वाणी",
  "आत्म वाणी": "आत्म वाणी",
};

const CATEGORY_TITLE_COLOR_MAP = {
  अपराध: "#b91c1c",
  "संघर्ष से शिखर": "#c2410c",
  भ्रष्टाचार: "#047857",
  "देश / विदेश": "#1d4ed8",
  "रियल हीरो": "#7c3aed",
  "गरुड़ विशेष": "#d97706",
  सतर्क: "#be123c",
  ज्योतिषी: "#0e7490",
  "आत्म वाणी": "#166534",
};

const CATEGORY_INFERENCE_RULES = [
  {
    category: "अपराध",
    keywords: [
      "हत्या",
      "लूट",
      "डकैती",
      "गिरफ्तार",
      "आरोपी",
      "अपराध",
      "चोरी",
      "हमला",
      "मारपीट",
      "बलात्कार",
      "हत्याकांड",
      "गोलीकांड",
      "एफआईआर",
      "थाना",
      "पुलिस ने पकड़ा",
    ],
  },
  {
    category: "भ्रष्टाचार",
    keywords: [
      "भ्रष्टाचार",
      "घोटाला",
      "वेयरहाउस",
      "रिश्वत",
      "गड़बड़ी",
      "अनियमितता",
      "भ्रष्ट",
      "सवाल",
      "जांच",
      "घपला",
      "कमीशन",
      "आरोप",
    ],
  },
  {
    category: "सतर्क",
    keywords: [
      "सतर्क",
      "चेतावनी",
      "अलर्ट",
      "सुरक्षा",
      "चूक",
      "खतरा",
      "बचाव",
      "सावधान",
      "रोक",
      "प्रतिबंध",
      "निलंबित",
      "सस्पेंड",
    ],
  },
  {
    category: "रियल हीरो",
    keywords: [
      "सम्मानित",
      "मदद",
      "बचाई",
      "बचाया",
      "सेवा",
      "हीरो",
      "उदाहरण",
      "प्रेरणा",
      "सराहनीय",
      "बहादुरी",
      "उपलब्धि",
    ],
  },
  {
    category: "गरुड़ विशेष",
    keywords: [
      "बाल संसद",
      "विद्यालय",
      "स्कूल",
      "छात्र",
      "छात्रा",
      "बच्चे",
      "बेटी",
      "संकल्प",
      "प्रतियोगिता",
      "सफलता",
      "मेहनत",
      "संघर्ष",
      "कहानी",
      "युवा",
      "विशेष",
      "खुलासा",
      "रिपोर्ट",
      "विश्लेषण",
      "गहराई",
      "मुद्दा",
      "एक्सक्लूसिव",
      "पड़ताल",
    ],
  },
  {
    category: "ज्योतिषी",
    keywords: [
      "राशिफल",
      "ज्योतिष",
      "ग्रह",
      "नक्षत्र",
      "कुंडली",
      "मेष",
      "वृषभ",
      "मिथुन",
      "कर्क",
      "सिंह",
      "कन्या",
      "तुला",
      "वृश्चिक",
      "धनु",
      "मकर",
      "कुंभ",
      "मीन",
    ],
  },
  {
    category: "आत्म वाणी",
    keywords: [
      "आध्यात्म",
      "प्रवचन",
      "धर्म",
      "मंदिर",
      "पूजा",
      "भक्ति",
      "साधु",
      "संत",
      "महात्मा",
      "कथा",
      "आरती",
    ],
  },
  {
    category: "देश / विदेश",
    keywords: [
      "मुख्यमंत्री",
      "प्रधानमंत्री",
      "मंत्री",
      "सरकार",
      "हाईकोर्ट",
      "अदालत",
      "देश",
      "विदेश",
      "भारत",
      "राजनीति",
      "आदेश",
      "नियुक्ति",
      "विधानसभा",
      "लोकसभा",
      "कलेक्टर",
    ],
  },
];

export const normalizeCategoryValue = (value) => {
  const cleaned = String(value || "").trim();
  return ALL_KNOWN_CATEGORY_MAP[cleaned] || cleaned;
};

export const getCategoryLabel = (value) => {
  const normalized = normalizeCategoryValue(value);
  if (normalized === "All") return "सभी";
  return normalized || "समाचार";
};

export const getCategoryTitleColor = (value) => {
  const normalized = normalizeCategoryValue(value);
  return CATEGORY_TITLE_COLOR_MAP[normalized] || "#7f1d1d";
};

export const inferCategoryFromNews = ({ title = "", content = "" } = {}) => {
  const haystack = `${String(title || "")} ${String(content || "")}`.toLowerCase();
  if (!haystack.trim()) return "";

  for (const rule of CATEGORY_INFERENCE_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
      return rule.category;
    }
  }

  return "";
};

export const resolveNewsCategory = ({ title = "", content = "", category = "" } = {}) => {
  const inferred = inferCategoryFromNews({ title, content });
  if (inferred) return inferred;

  const normalized = normalizeCategoryValue(category);
  if (normalized === "संघर्ष से शिखर") return "गरुड़ विशेष";
  if (normalized && normalized !== "All") return normalized;

  return "गरुड़ विशेष";
};

export const isHighlightedCategory = (value) => {
  const normalized = normalizeCategoryValue(value);
  return normalized === "अपराध" || normalized === "गरुड़ विशेष";
};
