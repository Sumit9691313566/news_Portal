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
const getQueryValue = (req, key) => {
  const value = req.query?.[key];
  return Array.isArray(value) ? value[0] : value;
};

const getSiteUrl = (req) => {
  const configured =
    process.env.PUBLIC_SITE_URL ||
    process.env.VITE_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    SITE_URL;
  const normalized = normalizeUrl(configured);
  if (normalized) return normalized;

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "garudsamachar.in";
  return `${proto}://${host}`;
};

const absolutizeUrl = (url = "", baseUrl = SITE_URL) => {
  const cleanUrl = String(url || "").trim();
  if (!cleanUrl) return "";
  if (/^https?:\/\//i.test(cleanUrl)) return cleanUrl;
  if (cleanUrl.startsWith("//")) return `https:${cleanUrl}`;
  return `${normalizeUrl(baseUrl)}/${cleanUrl.replace(/^\/+/, "")}`;
};

const truncateText = (value = "", maxLength = 180) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
};

const isCloudinaryUrl = (url = "") =>
  /^https?:\/\/res\.cloudinary\.com\//i.test(String(url || ""));

const toCloudinaryOgImage = (url = "") => {
  const cleanUrl = String(url || "").trim();
  if (!isCloudinaryUrl(cleanUrl)) return cleanUrl;

  // WhatsApp/Facebook previews are most reliable with a crawlable 1200x630 image.
  if (cleanUrl.includes("/upload/")) {
    return cleanUrl.replace(
      "/upload/",
      "/upload/f_auto,q_auto,c_fill,w_1200,h_630,g_auto/"
    );
  }

  return cleanUrl;
};

const toCloudinaryVideoPoster = (url = "") => {
  const cleanUrl = String(url || "").trim();
  if (!isCloudinaryUrl(cleanUrl)) return "";

  const withoutQuery = cleanUrl.split("?")[0];
  if (!/\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(withoutQuery)) return "";

  return toCloudinaryOgImage(withoutQuery.replace(/\.(mp4|mov|webm|m4v|avi|mkv)$/i, ".jpg"));
};

const getNewsImageUrl = (news, siteUrl = SITE_URL) => {
  const imageBlock = Array.isArray(news?.blocks)
    ? news.blocks.find((block) => block?.type === "image" && block?.url)
    : null;

  if (imageBlock?.url) return toCloudinaryOgImage(absolutizeUrl(imageBlock.url, siteUrl));

  if (news?.mediaType === "image" && news?.mediaUrl) {
    return toCloudinaryOgImage(absolutizeUrl(news.mediaUrl, siteUrl));
  }

  const videoBlock = Array.isArray(news?.blocks)
    ? news.blocks.find((block) => block?.type === "video" && block?.url)
    : null;
  const videoPoster =
    toCloudinaryVideoPoster(videoBlock?.url) || toCloudinaryVideoPoster(news?.mediaUrl);
  if (videoPoster) return absolutizeUrl(videoPoster, siteUrl);

  return `${siteUrl}/logo.jpeg`;
};

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
  const rawId = getQueryValue(req, "id");
  const id = String(rawId || "")
    .split("?")[0]
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .trim();
  const siteUrl = getSiteUrl(req);
  const articleUrl = id
    ? `${siteUrl}/?newsId=${encodeURIComponent(id)}`
    : `${siteUrl}/`;

  let news = null;
  if (id) {
    try {
      news = await findNewsById(req, id);
    } catch (error) {
      console.warn("share preview fetch failed", error?.message || error);
    }
  }

  const fallbackTitle = stripHtml(getQueryValue(req, "t") || "");
  const fallbackDescription = stripHtml(getQueryValue(req, "d") || "");
  const fallbackImage = getQueryValue(req, "img") || "";
  const newsTitle = stripHtml(news?.title || "") || fallbackTitle;
  const contentText = stripHtml(news?.content || "") || fallbackDescription;
  const title = newsTitle || "Garud Samachar";
  const description = truncateText(contentText || newsTitle || "Garud Samachar");
  const imageUrl = news ? getNewsImageUrl(news, siteUrl) : toCloudinaryOgImage(absolutizeUrl(fallbackImage, siteUrl)) || `${siteUrl}/logo.jpeg`;
  const imageType = /\.png(?:$|\?)/i.test(imageUrl) ? "image/png" : "image/jpeg";

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
    <meta itemprop="name" content="${escapeHtml(title)}" />
    <meta itemprop="description" content="${escapeHtml(description)}" />
    <meta itemprop="image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:site_name" content="Garud Samachar" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(articleUrl)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:type" content="${escapeHtml(imageType)}" />
    <meta property="og:image:alt" content="${escapeHtml(title)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <meta http-equiv="refresh" content="0; url=${escapeHtml(articleUrl)}" />
  </head>
  <body>
    <a href="${escapeHtml(articleUrl)}">Open Garud Samachar news</a>
    <script>window.location.replace(${JSON.stringify(articleUrl)});</script>
  </body>
</html>`);
}
