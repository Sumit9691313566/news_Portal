#!/bin/bash
# Setup script for News Portal

echo "🚀 News Portal Setup Script"
echo "=========================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Backend setup
echo "📦 Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update backend/.env with your credentials"
else
    echo "✅ backend/.env already exists"
fi

echo "Installing dependencies..."
npm install

echo ""
echo "✅ Backend setup complete!"
echo ""

# Frontend setup
echo "📦 Setting up Frontend..."
cd ../frontend/news-portal

if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update frontend/.env with your backend URL"
else
    echo "✅ frontend/.env already exists"
fi

echo "Installing dependencies..."
npm install

echo ""
echo "✅ Frontend setup complete!"
echo ""

echo "🎉 Setup finished!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with MongoDB and Cloudinary credentials"
echo "2. Update frontend/.env with backend API URL"
echo "3. Run: npm run dev (in backend or frontend directory)"
echo ""
