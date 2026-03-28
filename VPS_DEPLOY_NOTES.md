# VPS Deployment Notes

## What was changed for VPS safety

- Removed hardcoded Railway and Vercel API fallbacks from runtime code.
- Backend now accepts both `MONGO_URI` and `MONGODB_URI`.
- Backend CORS now relies on `FRONTEND_URL` and optional `ALLOWED_ORIGINS` instead of old hosted domains.
- Added production-ready env templates for backend and frontend.
- Added isolated PM2 config: `ecosystem.config.js`.
- Added isolated Nginx sample: `deploy/news-portal.nginx.conf`.

## Recommended production frontend env

```env
VITE_API_BASE_URL=/api
VITE_API_FALLBACK_URL=
VITE_API_TIMEOUT_MS=12000
```

## Recommended production backend env

```env
PORT=3001
NODE_ENV=production
MONGO_URI=your_mongodb_uri
MONGODB_URI=your_mongodb_uri
FRONTEND_URL=https://garudsamachar.garudstacks.tech
```
