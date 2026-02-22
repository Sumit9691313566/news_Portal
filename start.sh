#!/bin/bash
set -e

echo "🚀 News Portal Backend - Starting..."

# Navigate to backend directory and start the application
cd backend || exit 1

echo "▶️  Starting application..."
# Start without trying to install dependencies here — build step should install them.
exec node src/bootstrap.js
