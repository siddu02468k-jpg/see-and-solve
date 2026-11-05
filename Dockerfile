# ==========================================
# SEE & SOLVE - PRODUCTION DOCKERFILE
# ==========================================
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Copy application source and data
COPY server/ ./server/
COPY data/ ./data/
COPY public/ ./public/

# Create persistent storage directory for SQLite database and uploads
RUN mkdir -p /app/data/uploads

# Expose port
EXPOSE 5050

# Environment variables
ENV NODE_ENV=production
ENV PORT=5050

# Start application server
CMD ["node", "server/index.js"]
