# Quick Start Guide - Backend (Railway)

## Local Development
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your local MongoDB and Cloudinary credentials

# Start development server
npm run dev
```

Server will run on `http://localhost:5000`

## Production Ready Features
✅ Dynamic PORT configuration for Railway
✅ Graceful shutdown handling
✅ CORS properly configured
✅ Health check endpoint
✅ Error handling middleware
✅ Environment variable validation
✅ MongoDB Atlas compatible
✅ Dockerfile for containerization

## Deployment to Railway
See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for detailed instructions

## API Endpoints
- `GET /health` - Health check
- `POST /api/auth/login` - Admin login
- `GET /api/news` - Fetch news
- `POST /api/news` - Create news (protected)
- `PUT /api/news/:id` - Update news (protected)
- `DELETE /api/news/:id` - Delete news (protected)
- `GET /api/epaper` - Fetch epapers
- `POST /api/epaper` - Create epaper (protected)

