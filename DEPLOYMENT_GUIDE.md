# News Portal - Deployment Guide

## Overview
This guide covers deploying the News Portal backend to Railway and frontend to Vercel.

---

## Backend Deployment (Railway)

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository with code pushed
- MongoDB Atlas account (for cloud database)
- Cloudinary account (for image/video hosting)

### Step 1: Prepare MongoDB Atlas
1. Create a cluster on MongoDB Atlas
2. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/news_portal`
3. Add your Railway IP to MongoDB Atlas network access

### Step 2: Deploy to Railway

#### Option A: Using Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init

# Set environment variables
railway variable set PORT=5000
railway variable set NODE_ENV=production
railway variable set MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/news_portal"
railway variable set CLOUDINARY_CLOUD_NAME="your_cloud_name"
railway variable set CLOUDINARY_API_KEY="your_api_key"
railway variable set CLOUDINARY_API_SECRET="your_api_secret"
railway variable set JWT_SECRET="generate_a_secure_random_string"
railway variable set ADMIN_EMAIL="admin@example.com"
railway variable set ADMIN_PASSWORD_HASH="$2b$12$..."
railway variable set NEWS_RETENTION_DAYS=180

# Deploy
railway up
```

#### Option B: Using Railway Web Dashboard
1. Go to railway.app
2. Create new project
3. Connect GitHub repository
4. Select backend folder
5. Add environment variables in Variables tab:
   - `PORT`: 5000
   - `NODE_ENV`: production
   - `MONGO_URI`: Your MongoDB connection string
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
   - `JWT_SECRET`: Generate a secure random string
   - `ADMIN_EMAIL`: Your admin email
   - `ADMIN_PASSWORD_HASH`: Your bcrypt hashed password
   - `NEWS_RETENTION_DAYS`: 180

6. Deploy and get your Railway URL (e.g., `https://news-portal-backend.railway.app`)

### Step 3: Verify Backend Deployment
```bash
curl https://your-railway-url.railway.app/health
```
Should return: `{"status":"OK","timestamp":"2024-02-22T..."}

---

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository with code pushed

### Step 1: Configure Frontend Environment
1. Update `.env` file with your Railway backend URL:
```
VITE_API_BASE_URL=https://your-railway-url.railway.app/api
VITE_API_TIMEOUT_MS=8000
```

2. Git commit and push:
```bash
git add .env frontend/news-portal/.env
git commit -m "Update API URL for production"
git push
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Web Dashboard
1. Go to vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Select ROOT DIRECTORY: `frontend/news-portal`
5. Add Environment Variables (if needed):
   - `VITE_API_BASE_URL`: Your Railway backend URL
6. Click "Deploy"

#### Option B: Using Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from frontend directory
cd frontend/news-portal
vercel --prod

# Follow prompts and set VITE_API_BASE_URL environment variable
```

### Step 3: Verify Frontend Deployment
Visit your Vercel URL and check:
- Home page loads correctly
- Login page appears
- Admin dashboard is protected
- API calls reach your Railway backend

---

## Environment Variables Reference

### Backend (.env)
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/news_portal
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_secure_key_here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$12$hashed_password
NEWS_RETENTION_DAYS=180
FRONTEND_URL=https://your-vercel-url.vercel.app
```

### Frontend (.env)
```
VITE_API_BASE_URL=https://your-railway-url.railway.app/api
VITE_API_TIMEOUT_MS=8000
```

---

## Database Setup

### MongoDB Atlas Setup
1. Create a cluster
2. Create database user with strong password
3. Add IP 0.0.0.0/0 to Network Access (or specific Railway IP)
4. Get connection string and update MONGO_URI

### Sample Connection String
```
mongodb+srv://newsadmin:SecurePassword123@news-cluster.mongodb.net/news_portal?retryWrites=true&w=majority
```

---

## Cloudinary Setup

1. Create Cloudinary account
2. Get your credentials from Dashboard:
   - Cloud Name
   - API Key
   - API Secret
3. Set in Railway environment variables

---

## Testing Checklist

### Backend
- [ ] Health check endpoint `/health` returns OK
- [ ] MongoDB connection successful
- [ ] Cloudinary upload works
- [ ] Admin login endpoint works
- [ ] JWT token generation works
- [ ] News CRUD operations work

### Frontend
- [ ] Home page loads
- [ ] Login page accessible
- [ ] Admin dashboard protected
- [ ] News fetch from API
- [ ] Admin can create/edit news
- [ ] Images/videos upload to Cloudinary
- [ ] Logout works

---

## Troubleshooting

### Backend Issues
**Port Error**: Railway auto-assigns PORT env var, update your server.js
**MongoDB Connection**: Check IP whitelist and credentials
**Cloudinary Upload**: Verify API keys are correct

### Frontend Issues
**API 404 Errors**: Verify VITE_API_BASE_URL is correct
**CORS Errors**: Check backend CORS configuration includes your Vercel URL
**Build Fails**: Check node_modules are installed correctly

## Security Notes
1. Never commit `.env` files with real credentials
2. Use `.env.example` template
3. Rotate JWT_SECRET periodically
4. Use strong admin password
5. Keep API keys in Railway/Vercel secrets, not in code

---

## Support
For issues:
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- MongoDB Docs: https://docs.mongodb.com

