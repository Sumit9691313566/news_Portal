const SITE_URL = "https://garudsamachar.in";

const decodeHtmlEntities = (value = "") =>
  String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

const stripHtml = (value = "") => {
  let text = String(value || "");
  for (let i = 0; i < 2; i += 1) {
    text = decodeHtmlEntities(text);
  }
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|blockquote|span)>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const escapeHtml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeUrl = (value = "") => String(value || "").replace(/\/+$/, "");

const getApiBaseUrl = (req) => {
  const configured =
    process.env.API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    process.env.NEWS_API_BASE_URL ||
    "";
  const normalized = normalizeUrl(configured);
  if (normalized && normalized !== "/api") return normalized;

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "garudsamachar.in";
  return `${proto}://${host}/api`;
};

const findNewsById = async (req, id) => {
  const apiBase = getApiBaseUrl(req);
  const response = await fetch(`${apiBase}/news`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) return null;

  const payload = await response.json();
  const list = Array.isArray(payload) ? payload : payload?.news || [];
  return list.find((item) => String(item?._id || item?.id) === String(id)) || null;
};

export default async function handler(req, res) {
  const id = String(req.query?.id || "").trim();
  const articleUrl = id
    ? `${SITE_URL}/?newsId=${encodeURIComponent(id)}`
    : `${SITE_URL}/`;

  let news = null;
  if (id) {
    try {
      news = await findNewsById(req, id);
    } catch (error) {
      console.warn("share preview fetch failed", error?.message || error);
    }
  }

  const newsTitle = stripHtml(news?.title || "");
  const contentText = stripHtml(news?.content || "");
  const title = newsTitle || "Garud Samachar";
  const description = contentText || newsTitle || "Garud Samachar";

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  res.status(200).send(`<!doctype html>
<html lang="hi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link rel="canonical" href="${escapeHtml(articleUrl)}" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:site_name" content="Garud Samachar" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(articleUrl)}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta http-equiv="refresh" content="0; url=${escapeHtml(articleUrl)}" />
  </head>
  <body>
    <a href="${escapeHtml(articleUrl)}">Garud Samachar</a>
    <script>window.location.replace(${JSON.stringify(articleUrl)});</script>
  </body>
</html>`);
}
