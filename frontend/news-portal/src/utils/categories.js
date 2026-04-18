export const CATEGORY_LIST = [
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

export const DEFAULT_CATEGORY = CATEGORY_LIST[0].value;

const LEGACY_CATEGORY_MAP = {
  Crime: "अपराध",
  crime: "अपराध",
  National: "राष्ट्रीय",
  national: "राष्ट्रीय",
  Business: "बिज़नेस",
  business: "बिज़नेस",
  Politics: "राजनीति",
  politics: "राजनीति",
  World: "दुनिया",
  world: "दुनिया",
  Article: "आर्टिकल",
  article: "आर्टिकल",
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

export const normalizeCategoryValue = (value) => {
  const cleaned = String(value || "").trim();
  return ALL_KNOWN_CATEGORY_MAP[cleaned] || cleaned;
};

export const getCategoryLabel = (value) => {
  const normalized = normalizeCategoryValue(value);
  return normalized || "समाचार";
};

export const isHighlightedCategory = (value) => {
  const normalized = normalizeCategoryValue(value);
  return normalized === "अपराध" || normalized === "संघर्ष से शिखर";
};
