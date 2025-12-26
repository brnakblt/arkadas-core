# ============================================================
# MEBBIS Service Production Dockerfile - Security Hardened
# Multi-stage, Non-root, Graceful Shutdown
# ============================================================

# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Copy all dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Stage 3: Production Runner
FROM mcr.microsoft.com/playwright:v1.40.0-focal AS runner
WORKDIR /app

# Install tini for graceful shutdown
RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    && rm -rf /var/lib/apt/lists/*

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Create non-root user
RUN groupadd -g 1001 mebbis && \
    useradd -u 1001 -g mebbis -m mebbis && \
    chown -R mebbis:mebbis /app

# Switch to non-root user
USER mebbis

# Environment
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Use tini for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
