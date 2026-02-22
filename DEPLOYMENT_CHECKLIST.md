# Pre-Deployment Checklist

## Backend Configuration ✅

- [x] Dynamic PORT configuration (uses process.env.PORT)
- [x] Environment variable validation
- [x] CORS properly configured for multiple origins
- [x] Graceful shutdown handling (SIGTERM)
- [x] Health check endpoint (/health)
- [x] Error handling middleware
- [x] Entry point: src/bootstrap.js loads .env first
- [x] Dockerfile with multi-stage build
- [x] .dockerignore for clean builds
- [x] Procfile for Railway deployment
- [x] railway.json configuration
- [x] .env.example with all required variables
- [x] Node version specified in .nvmrc (20.10.0)
- [x] package.json includes node engines version
- [x] .gitignore properly configured

## Frontend Configuration ✅

- [x] Vite build optimized for production
- [x] Environment variable support (VITE_API_BASE_URL)
- [x] vercel.json with proper configuration
- [x] .env.example with API URL template
- [x] Dynamic API base URL (import.meta.env.VITE_API_BASE_URL)
- [x] API timeout configuration
- [x] .gitignore properly configured
- [x] React Router configured
- [x] Protected routes implemented
- [x] Build output: dist/

## Database ✅

- [x] MongoDB Atlas compatible connection string
- [x] MONGO_URI environment variable in .env.example
- [x] Connection error handling in bootstrap.js

## Security ✅

- [x] JWT secret configurable via environment
- [x] Admin password hash in environment variables
- [x] Cloudinary credentials in environment variables
- [x] No secrets in git (use .env.example)
- [x] API timeout protection
- [x] Authorization middleware for protected routes
- [x] CORS origin validation

## Deployment Files ✅

- [x] DEPLOYMENT_GUIDE.md - Complete deployment instructions
- [x] README.md - Project overview and quick start
- [x] backend/QUICKSTART.md - Backend development guide
- [x] frontend/news-portal/QUICKSTART.md - Frontend development guide
- [x] docker-compose.yml - Local development environment
- [x] setup.sh - Linux/Mac setup script
- [x] setup.bat - Windows setup script
- [x] Dockerfile - Container image for backend
- [x] .dockerignore - Optimize container build

## Pre-Deployment Tasks

### Before Deploying to Railway (Backend)

1. **MongoDB Setup**
   - [ ] Create MongoDB Atlas account
   - [ ] Create cluster
   - [ ] Create database user
   - [ ] Whitelist Railway IP (0.0.0.0/0) or specific IP
   - [ ] Get connection string

2. **Cloudinary Setup**
   - [ ] Create Cloudinary account
   - [ ] Get Cloud Name, API Key, API Secret
   - [ ] Test file upload locally

3. **Generate Secrets**
   - [ ] Generate secure JWT_SECRET (min 32 chars)
   - [ ] Generate or provide admin password hash
   - [ ] Test locally with values

4. **Railway Setup**
   - [ ] Create Railway account
   - [ ] Push code to GitHub
   - [ ] Create new project in Railway
   - [ ] Set all environment variables

5. **Testing**
   - [ ] Test health endpoint
   - [ ] Test admin login
   - [ ] Test news API endpoints
   - [ ] Test file uploads

### Before Deploying to Vercel (Frontend)

1. **Configuration**
   - [ ] Update VITE_API_BASE_URL to Railway backend URL
   - [ ] Test API calls locally
   - [ ] Build locally: npm run build
   - [ ] Verify dist/ folder created

2. **Vercel Setup**
   - [ ] Create Vercel account
   - [ ] Connect GitHub repository
   - [ ] Set VITE_API_BASE_URL environment variable
   - [ ] Deploy

3. **Testing**
   - [ ] Homepage loads
   - [ ] API calls work
   - [ ] Login page appears
   - [ ] Admin dashboard is protected
   - [ ] Images load correctly

## Database Models ✅

Models configured in backend/src/models/:
- [x] Admin.js
- [x] News.js
- [x] Epaper.js
- [x] DeletedNews.js

## API Routes ✅

Routes configured:
- [x] /api/auth - Authentication routes
- [x] /api/news - News CRUD routes
- [x] /api/epaper - E-paper routes
- [x] /health - Health check

## Middleware ✅

- [x] Authentication middleware (protect route)
- [x] Upload middleware
- [x] Admin auth middleware
- [x] CORS middleware
- [x] Error handling middleware

## Controllers ✅

- [x] authController.js - Login functionality
- [x] newsController.js - News CRUD operations
- [x] epaperController.js - E-paper operations

## Environment Variables by Platform

### Railway Backend
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
JWT_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD_HASH=...
NEWS_RETENTION_DAYS=180
FRONTEND_URL=https://your-vercel-url.vercel.app
```

### Vercel Frontend
```
VITE_API_BASE_URL=https://your-railway-url.railway.app/api
VITE_API_TIMEOUT_MS=8000
```

## Post-Deployment Verification

### Backend
- [ ] Health check returns 200: GET /health
- [ ] MongoDB connection established
- [ ] Cloudinary configured and working
- [ ] Admin login endpoint works
- [ ] JWT token issued properly
- [ ] CORS headers present in responses
- [ ] News endpoints return data
- [ ] Protected routes require auth

### Frontend
- [ ] Homepage loads without errors
- [ ] API calls reach backend
- [ ] Login page accessible
- [ ] Admin dashboard requires login
- [ ] Images/videos load from CDN
- [ ] Navigation works
- [ ] No console errors

## Performance Checklist

- [x] Backend: Compression middleware (if needed)
- [x] Frontend: Vite production build optimized
- [x] Frontend: Terser minification enabled
- [x] API: Timeout protection (8s default)
- [x] Database: Connection pooling (Mongoose default)
- [x] Images: Hosted on Cloudinary CDN

## Monitoring & Logs

### Railway
- Check deployment logs
- Monitor CPU/Memory usage
- Check for application errors
- Verify successful health checks

### Vercel
- Check build logs
- Monitor function executions
- Check error logs
- Verify analytics

## Documentation Created

- ✅ DEPLOYMENT_GUIDE.md (comprehensive guide)
- ✅ README.md (project overview)
- ✅ backend/QUICKSTART.md (backend dev guide)
- ✅ frontend/QUICKSTART.md (frontend dev guide)
- ✅ DEPLOYMENT_CHECKLIST.md (this file)

---

**Status**: ✅ All systems ready for deployment
**Date**: February 22, 2026
**Tested**: Local development environment
