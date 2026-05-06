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

const findDevNewsById = async (id) => {
  const response = await fetch(`${getDevApiBaseUrl()}/news`, {
    headers: { accept: "application/json" },
  })
  if (!response.ok) return null
  const payload = await response.json()
  const list = Array.isArray(payload) ? payload : payload?.news || []
  return list.find((item) => String(item?._id || item?.id) === String(id)) || null
}

const buildSharePreviewHtml = ({ title, description, articleUrl }) => `<!doctype html>
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
</html>`

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

      const id = decodeURIComponent(match[1])
      const localOrigin = `http://${req.headers.host || "localhost:5173"}`
      const articleUrl = `${localOrigin}/?newsId=${encodeURIComponent(id)}`

      let news = null
      try {
        news = await findDevNewsById(id)
      } catch (error) {
        server.config.logger.warn(`share preview fetch failed: ${error?.message || error}`)
      }

      const title = stripHtml(news?.title || "") || "Garud Samachar"
      const description = stripHtml(news?.content || "") || title
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      })
      res.end(buildSharePreviewHtml({ title, description, articleUrl }))
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
