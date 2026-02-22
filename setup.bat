@echo off
REM Setup script for News Portal on Windows

echo.
echo 🚀 News Portal Setup Script
echo ==========================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%
echo.

REM Backend setup
echo 📦 Setting up Backend...
cd backend

if not exist ".env" (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo ⚠️  Please update backend/.env with your credentials
) else (
    echo ✅ backend/.env already exists
)

echo Installing dependencies...
call npm install

echo.
echo ✅ Backend setup complete!
echo.

REM Frontend setup
echo 📦 Setting up Frontend...
cd ..\frontend\news-portal

if not exist ".env" (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo ⚠️  Please update frontend/.env with your backend URL
) else (
    echo ✅ frontend/.env already exists
)

echo Installing dependencies...
call npm install

echo.
echo ✅ Frontend setup complete!
echo.

echo 🎉 Setup finished!
echo.
echo Next steps:
echo 1. Update backend/.env with MongoDB and Cloudinary credentials
echo 2. Update frontend/.env with backend API URL
echo 3. Run: npm run dev (in backend or frontend directory)
echo.

pause
