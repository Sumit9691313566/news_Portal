import { stripHtml } from "./richText";

const normalize = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const getBlocksText = (blocks = []) =>
  Array.isArray(blocks)
    ? blocks
        .filter((block) => block?.type === "text" && block?.text)
        .map((block) => stripHtml(block.text))
        .join(" ")
    : "";

const scoreNewsMatch = (news, rawQuery) => {
  const query = normalize(rawQuery);
  if (!query) return 0;

  const tokens = query.split(" ").filter(Boolean);
  const title = normalize(news?.title);
  const category = normalize(news?.category);
  const content = normalize(news?.content);
  const author = normalize(news?.author);
  const blocksText = normalize(getBlocksText(news?.blocks));
  const combined = [title, category, content, author, blocksText].filter(Boolean).join(" ");

  if (!combined) return 0;

  const matchedTokens = tokens.filter((token) => combined.includes(token));
  if (matchedTokens.length !== tokens.length) return 0;

  let score = 0;

  if (title === query) score += 120;
  else if (title.startsWith(query)) score += 95;
  else if (title.includes(query)) score += 70;

  if (category === query) score += 60;
  else if (category.includes(query)) score += 35;

  if (content.includes(query)) score += 30;
  if (blocksText.includes(query)) score += 25;
  if (author.includes(query)) score += 10;

  matchedTokens.forEach((token) => {
    if (title.includes(token)) score += 18;
    if (category.includes(token)) score += 12;
    if (content.includes(token)) score += 8;
    if (blocksText.includes(token)) score += 8;
    if (author.includes(token)) score += 4;
  });

  return score;
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
