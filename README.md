# News Portal - Full Stack Application

A modern news portal application built with React (frontend) and Express (backend), ready for production deployment on Vercel and Railway.

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
Runs on: `http://localhost:5000`

### Frontend
```bash
cd frontend/news-portal
npm install
cp .env.example .env
npm run dev
```
Runs on: `http://localhost:5173`

## 📦 Project Structure

```
news_Portal/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── app.js             # Express app setup
│   │   ├── server.js          # Server with production config
│   │   ├── bootstrap.js       # Entry point with env loading
│   │   ├── config/            # Database & Cloudinary config
│   │   ├── controllers/       # API controllers
│   │   ├── middleware/        # Auth & upload middleware
│   │   ├── models/            # MongoDB models
│   │   ├── routes/            # API routes
│   │   └── utils/             # Helper functions
│   ├── Dockerfile             # Container image
│   ├── Procfile               # Railway process definition
│   └── .env.example           # Environment template
│
├── frontend/
│   └── news-portal/           # React + Vite app
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── pages/         # Page components
│       │   ├── services/      # API services
│       │   └── styles/        # CSS styles
│       ├── vite.config.js     # Production optimized
│       ├── vercel.json        # Vercel config
│       └── .env.example       # Environment template
│
├── docker-compose.yml         # Local dev environment
├── DEPLOYMENT_GUIDE.md        # Full deployment instructions
└── README.md                  # This file

```

## 🔑 Key Features

✅ **Backend (Railway Ready)**
- Node.js + Express.js
- MongoDB with Mongoose ODM
- JWT authentication
- Cloudinary integration for media
- Graceful shutdown handling
- Health check endpoint
- Dynamic PORT configuration
- Error handling middleware
- CORS properly configured

✅ **Frontend (Vercel Ready)**
- React 19 with Hooks
- Vite build tool with optimizations
- React Router for navigation
- Protected admin routes
- API service with timeout handling
- Environment variable support

## 🌍 Deployment

### Railway Backend
```bash
# Set environment variables in Railway dashboard:
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$12$...
```

### Vercel Frontend
```bash
# Set environment variable in Vercel dashboard:
VITE_API_BASE_URL=https://your-railway-backend.railway.app/api
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🛠️ Configuration

### Environment Variables

**Backend (.env)**
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/news_portal
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$12$hashed_password
NEWS_RETENTION_DAYS=180
FRONTEND_URL=https://your-frontend.vercel.app
```

**Frontend (.env)**
```
VITE_API_BASE_URL=http://localhost:5000/api (dev)
VITE_API_BASE_URL=https://backend-url.railway.app/api (prod)
VITE_API_TIMEOUT_MS=8000
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login

### News Management
- `GET /api/news` - List all news
- `POST /api/news` - Create news (protected)
- `GET /api/news/:id` - Get single news
- `PUT /api/news/:id` - Update news (protected)
- `DELETE /api/news/:id` - Delete news (protected)

### E-Paper
- `GET /api/epaper` - List all epapers
- `POST /api/epaper` - Create epaper (protected)

### Health
- `GET /health` - Server health check

## 🐳 Docker

### Local Testing with Docker Compose
```bash
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- Backend on port 5000
- MongoDB UI on port 8081 (optional)

### Build Backend Container
```bash
cd backend
docker build -t news-portal-backend .
docker run -p 5000:5000 --env-file .env news-portal-backend
```

## 📋 Requirements

### Backend
- Node.js 18+ or 20+
- npm/yarn
- MongoDB Atlas account
- Cloudinary account

### Frontend
- Node.js 18+ or 20+
- npm/yarn
- Modern web browser

## 🔒 Security

- JWT-based authentication
- Password hashing with bcryptjs
- CORS protection
- Environment variable isolation
- API timeout handling
- Input validation

## 🧪 Testing Checklist

### Backend
- [ ] Health check `/health` returns 200
- [ ] MongoDB connection successful
- [ ] Admin login works
- [ ] JWT token generation
- [ ] News CRUD operations
- [ ] File upload to Cloudinary
- [ ] Graceful shutdown

### Frontend
- [ ] Home page loads
- [ ] Admin login works
- [ ] Dashboard protected
- [ ] API communication
- [ ] Image/video upload works
- [ ] Responsive design
- [ ] Production build succeeds

## 📖 Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [backend/QUICKSTART.md](./backend/QUICKSTART.md) - Backend quick start
- [frontend/news-portal/QUICKSTART.md](./frontend/news-portal/QUICKSTART.md) - Frontend quick start

## 🐛 Troubleshooting

### CORS Errors
- Check FRONTEND_URL in backend .env
- Ensure backend CORS middleware includes frontend origin

### MongoDB Connection
- Verify connection string in .env
- Check IP whitelist in MongoDB Atlas
- Verify database user credentials

### API 404 Errors
- Check VITE_API_BASE_URL in frontend .env
- Ensure backend is running
- Verify API endpoint URLs

### Cloudinary Upload Issues
- Verify API credentials
- Check file size limits
- Ensure folder exists in Cloudinary

## 📄 License

This project is ready for deployment.

## 🤝 Support

For deployment issues:
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- MongoDB Docs: https://docs.mongodb.com
- Cloudinary Docs: https://cloudinary.com/documentation

---

**Status**: ✅ Production Ready for Railway (Backend) & Vercel (Frontend)
