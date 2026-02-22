#!/bin/bash
set -e

echo "🚀 News Portal Backend - Starting..."

# Navigate to backend directory
cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Start the application
echo "▶️  Starting application..."
exec node src/bootstrap.js
