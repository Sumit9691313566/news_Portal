# Use official Node.js runtime as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies first (leverages layer caching)
# Use a glob so build won't fail if package-lock.json is missing.
COPY package*.json ./
# If a lockfile exists, prefer `npm ci` for reproducible installs; otherwise fall back to `npm install`.
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production; \
    else \
      npm install --only=production; \
    fi

# Copy remaining application code from build context (uses backend/.dockerignore to exclude node_modules)
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "src/bootstrap.js"]
