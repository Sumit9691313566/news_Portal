import { getPlainTextTitle, stripHtml } from "./richText";

const normalize = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const splitTokens = (value = "") =>
  normalize(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

const getBlocksText = (blocks = []) =>
  Array.isArray(blocks)
    ? blocks
        .filter((block) => block?.type === "text" && block?.text)
        .map((block) => stripHtml(block.text))
        .join(" ")
    : "";

const getSearchableFields = (news = {}) => {
  const title = normalize(news?.title);
  const normalizedTitle = normalize(getPlainTextTitle(news?.title));
  const category = normalize(news?.category);
  const content = normalize(news?.content);
  const author = normalize(news?.author);
  const blocksText = normalize(getBlocksText(news?.blocks));

  return {
    title: normalizedTitle || title,
    category,
    content,
    author,
    blocksText,
    combined: [title, category, content, author, blocksText]
      .filter(Boolean)
      .join(" "),
  };
};

const scoreToken = (source = "", token = "", weight = 1) => {
  if (!source || !token) return 0;
  if (source === token) return 20 * weight;
  if (source.startsWith(token)) return 14 * weight;
  if (source.includes(token)) return 8 * weight;
  return 0;
};

const scoreNewsMatch = (news, rawQuery) => {
  const query = normalize(rawQuery);
  if (!query) return 0;

  const tokens = splitTokens(query);
  if (tokens.length === 0) return 0;

  const fields = getSearchableFields(news);
  if (!fields.combined) return 0;

  const matchedTokens = tokens.filter((token) =>
    [fields.title, fields.category, fields.content, fields.author, fields.blocksText].some(
      (field) => field.includes(token)
    )
  );

  if (matchedTokens.length === 0) return 0;

  const coverage = matchedTokens.length / tokens.length;
  if (coverage < 0.6) return 0;

  let score = 0;

  if (fields.title === query) score += 180;
  else if (fields.title.startsWith(query)) score += 140;
  else if (fields.title.includes(query)) score += 110;

  if (fields.category === query) score += 70;
  else if (fields.category.includes(query)) score += 40;

  if (fields.content.includes(query)) score += 50;
  if (fields.blocksText.includes(query)) score += 45;
  if (fields.author.includes(query)) score += 20;

  matchedTokens.forEach((token) => {
    score += scoreToken(fields.title, token, 4);
    score += scoreToken(fields.category, token, 2);
    score += scoreToken(fields.content, token, 1.5);
    score += scoreToken(fields.blocksText, token, 1.5);
    score += scoreToken(fields.author, token, 1);
  });

  score += Math.round(coverage * 25);

  return Math.round(score);
};

export const getNewsSearchSnippet = (news, rawQuery) => {
  const query = normalize(rawQuery);
  const tokens = splitTokens(query);
  const rawText = [
    news?.content || "",
    getBlocksText(news?.blocks),
    news?.title || "",
  ]
    .filter(Boolean)
    .join(" ");

  const cleanedText = stripHtml(rawText).replace(/\s+/g, " ").trim();
  if (!cleanedText) return "";

  const normalizedText = normalize(cleanedText);
  const matchedToken = tokens.find((token) => normalizedText.includes(token));

  if (!matchedToken) {
    return cleanedText.slice(0, 140).trim();
  }

  const index = normalizedText.indexOf(matchedToken);
  const start = Math.max(0, index - 50);
  const end = Math.min(cleanedText.length, start + 160);
  const snippet = cleanedText.slice(start, end).trim();

  return start > 0 ? `...${snippet}` : snippet;
};

export const searchNews = (newsList = [], query = "") =>
  (Array.isArray(newsList) ? newsList : [])
    .map((news, index) => ({
      news,
      index,
      score: scoreNewsMatch(news, query),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const dateA = new Date(a.news?.createdAt || 0).getTime();
      const dateB = new Date(b.news?.createdAt || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return a.index - b.index;
    })
    .map((entry) => entry.news);
