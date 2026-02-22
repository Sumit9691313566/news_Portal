# Use official Node.js runtime as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy only backend files from the repository root build context into the image.
# Using explicit source paths ensures the build works when the Docker build context is the repo root.
COPY backend/package*.json ./
COPY backend/ ./

# Install dependencies: prefer `npm ci` when lockfile exists for reproducible installs,
# otherwise fall back to `npm install`. Use --omit=dev to skip dev dependencies.
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "src/bootstrap.js"]
