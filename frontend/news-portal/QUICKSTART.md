# Quick Start Guide - Frontend (Vercel)

## Local Development
```bash
cd frontend/news-portal

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:5000/api for local backend

# Start development server
npm run dev
```

Development server will run on `http://localhost:5173`

## Production Ready Features
✅ Vite optimized build configuration
✅ Source map disabled for production
✅ Terser minification enabled
✅ Environment variable support
✅ Vercel deployment configuration
✅ CORS handled by backend

## Deployment to Vercel
See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for detailed instructions

## Environment Variables
- `VITE_API_BASE_URL` - Backend API URL (required)
- `VITE_API_TIMEOUT_MS` - API timeout in milliseconds (default: 8000)

## Build
```bash
npm run build
```

Output: `dist/` directory ready for deployment

## Pages
- `/` - Home (news feed)
- `/login` - Admin login
- `/admin-dashboard` - Admin dashboard (protected)
- `/videos` - Videos page
- `/epaper` - E-paper listing
- `/search` - Search functionality

