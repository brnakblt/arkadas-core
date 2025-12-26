# ============================================================
# Strapi Production Dockerfile - Security Hardened
# Alpine-based, Multi-stage, Non-root
# ============================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /opt/app

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /opt/app

# Install build tools
RUN apk add --no-cache python3 make g++ vips-dev

# Copy dependencies from deps stage
COPY --from=deps /opt/app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Install ALL dependencies for build
RUN npm ci

# Copy source code
COPY . .

# Build admin panel
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Production Runner (Minimal)
FROM node:20-alpine AS runner
WORKDIR /opt/app

# Security: Install only runtime dependencies
RUN apk add --no-cache \
    vips \
    tini \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S strapi && \
    adduser -u 1001 -S strapi -G strapi

# Copy production dependencies
COPY --from=deps --chown=strapi:strapi /opt/app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=strapi:strapi /opt/app/dist ./dist
COPY --from=builder --chown=strapi:strapi /opt/app/build ./build
COPY --from=builder --chown=strapi:strapi /opt/app/public ./public
COPY --from=builder --chown=strapi:strapi /opt/app/config ./config
COPY --from=builder --chown=strapi:strapi /opt/app/src ./src
COPY --from=builder --chown=strapi:strapi /opt/app/database ./database
COPY --chown=strapi:strapi package.json ./

# Create necessary directories
RUN mkdir -p /opt/app/.tmp /opt/app/public/uploads && \
    chown -R strapi:strapi /opt/app

# Switch to non-root user
USER strapi

# Environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

# Expose port
EXPOSE 1337

# Use tini for proper signal handling (graceful shutdown)
ENTRYPOINT ["/sbin/tini", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:1337/_health || exit 1

# Start Strapi
CMD ["node", "node_modules/@strapi/strapi/bin/strapi.js", "start"]
