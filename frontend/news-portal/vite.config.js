import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const normalizeUrl = (value = "") => String(value || "").replace(/\/+$/, "")

const getDevApiBaseUrl = () => {
  const configured = normalizeUrl(process.env.VITE_API_BASE_URL || "")
  if (configured && configured !== "/api") return configured
  return "http://localhost:5000/api"
}

const decodeHtmlEntities = (value = "") =>
  String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")

const stripHtml = (value = "") => {
  let text = String(value || "")
  for (let i = 0; i < 2; i += 1) text = decodeHtmlEntities(text)
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|blockquote|span)>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const escapeHtml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const firstQueryValue = (url, key) => url.searchParams.get(key) || ""

const absolutizeUrl = (url = "", baseUrl = "") => {
  const cleanUrl = String(url || "").trim()
  if (!cleanUrl) return ""
  if (/^https?:\/\//i.test(cleanUrl)) return cleanUrl
  if (cleanUrl.startsWith("//")) return `https:${cleanUrl}`
  return `${normalizeUrl(baseUrl)}/${cleanUrl.replace(/^\/+/, "")}`
}

const cleanNewsId = (value = "") =>
  String(value || "")
    .split("?")[0]
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .trim()

const truncateText = (value = "", maxLength = 180) => {
  const text = String(value || "").replace(/\s+/g, " ").trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3).trim()}...`
}

const isCloudinaryUrl = (url = "") =>
  /^https?:\/\/res\.cloudinary\.com\//i.test(String(url || ""))

const toCloudinaryOgImage = (url = "") => {
  const cleanUrl = String(url || "").trim()
  if (!isCloudinaryUrl(cleanUrl)) return cleanUrl

  if (cleanUrl.includes("/upload/")) {
    return cleanUrl.replace(
      "/upload/",
      "/upload/f_auto,q_auto,c_fill,w_1200,h_630,g_auto/"
    )
  }

  return cleanUrl
}

const toCloudinaryVideoPoster = (url = "") => {
  const cleanUrl = String(url || "").trim()
  if (!isCloudinaryUrl(cleanUrl)) return ""

  const withoutQuery = cleanUrl.split("?")[0]
  if (!/\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(withoutQuery)) return ""

  return toCloudinaryOgImage(withoutQuery.replace(/\.(mp4|mov|webm|m4v|avi|mkv)$/i, ".jpg"))
}

const getNewsImageUrl = (news, baseUrl) => {
  const imageBlock = Array.isArray(news?.blocks)
    ? news.blocks.find((block) => block?.type === "image" && block?.url)
    : null

  if (imageBlock?.url) return toCloudinaryOgImage(absolutizeUrl(imageBlock.url, baseUrl))

  if (news?.mediaType === "image" && news?.mediaUrl) {
    return toCloudinaryOgImage(absolutizeUrl(news.mediaUrl, baseUrl))
  }

  const videoBlock = Array.isArray(news?.blocks)
    ? news.blocks.find((block) => block?.type === "video" && block?.url)
    : null
  const videoPoster =
    toCloudinaryVideoPoster(videoBlock?.url) || toCloudinaryVideoPoster(news?.mediaUrl)
  if (videoPoster) return absolutizeUrl(videoPoster, baseUrl)

  return `${normalizeUrl(baseUrl)}/logo.jpeg`
}

const findDevNewsById = async (id) => {
  const response = await fetch(`${getDevApiBaseUrl()}/news`, {
    headers: { accept: "application/json" },
  })
  if (!response.ok) return null
  const payload = await response.json()
  const list = Array.isArray(payload) ? payload : payload?.news || []
  return list.find((item) => String(item?._id || item?.id) === String(id)) || null
}

const buildSharePreviewHtml = ({ title, description, articleUrl, imageUrl }) => {
  const imageType = /\.png(?:$|\?)/i.test(imageUrl) ? "image/png" : "image/jpeg"

  return `<!doctype html>
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
    <a href="${escapeHtml(articleUrl)}">Garud Samachar</a>
    <script>window.location.replace(${JSON.stringify(articleUrl)});</script>
  </body>
</html>`
}

const localSharePreviewPlugin = () => ({
  name: "local-share-preview",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url || "/", "http://localhost")
      const match = url.pathname.match(/^\/share\/([^/]+)$/)
      if (!match) {
        next()
        return
      }

      const id = cleanNewsId(decodeURIComponent(match[1]))
      const localOrigin = `http://${req.headers.host || "localhost:5173"}`
      const articleUrl = `${localOrigin}/?newsId=${encodeURIComponent(id)}`

      let news = null
      try {
        news = await findDevNewsById(id)
      } catch (error) {
        server.config.logger.warn(`share preview fetch failed: ${error?.message || error}`)
      }

      const fallbackTitle = stripHtml(firstQueryValue(url, "t"))
      const fallbackDescription = stripHtml(firstQueryValue(url, "d"))
      const fallbackImage = firstQueryValue(url, "img")
      const title = stripHtml(news?.title || "") || fallbackTitle || "Garud Samachar"
      const description = truncateText(stripHtml(news?.content || "") || fallbackDescription || title)
      const imageUrl = news
        ? getNewsImageUrl(news, localOrigin)
        : toCloudinaryOgImage(absolutizeUrl(fallbackImage, localOrigin)) || `${localOrigin}/logo.jpeg`
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      })
      res.end(buildSharePreviewHtml({ title, description, articleUrl, imageUrl }))
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [localSharePreviewPlugin(), react()],
  server: {
    proxy: {
      // Proxy local /api calls to the backend during development
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    reportCompressedSize: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      format: {
        comments: false,
      },
      mangle: {
        toplevel: true,
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
