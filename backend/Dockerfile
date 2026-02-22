# Use official Node.js runtime as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies first (leverages layer caching)
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy remaining application code from build context (uses backend/.dockerignore to exclude node_modules)
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "src/bootstrap.js"]
