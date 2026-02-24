# ============================================================
# Strapi Production Dockerfile - Optimized
# Debian-based (Slim) for faster builds
# ============================================================

# Stage 1: Dependencies
FROM node:22-slim AS deps
WORKDIR /opt/app

# Install build dependencies for native modules
# python3, make, g++ are often needed for node-gyp
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
# Copy package files (Lockfile might be missing in monorepo dev)
COPY package.json package-lock.json ./
# Run install (will generate lockfile)
# Run install (will generate lockfile)
RUN npm install --omit=dev --legacy-peer-deps

# Stage 2: Builder
FROM node:22-slim AS builder
WORKDIR /opt/app

# Install build tools
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies from deps stage
COPY --from=deps /opt/app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Install ALL dependencies for build
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build admin panel
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Production Runner (Minimal)
FROM node:22-slim AS runner
WORKDIR /opt/app

# Security: Install only runtime dependencies
# tini for signal handling
RUN apt-get update && apt-get install -y \
    tini \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user with home directory
RUN groupadd -g 1001 strapi && \
    useradd -m -u 1001 -g strapi -s /bin/bash strapi

# Copy production dependencies
COPY --from=deps --chown=strapi:strapi /opt/app/node_modules ./node_modules

# Copy built application
# Copy built application
COPY --from=builder --chown=strapi:strapi /opt/app/dist ./dist
COPY --from=builder --chown=strapi:strapi /opt/app/public ./public
# Rely on compiled code in dist/ for these:
# COPY --from=builder --chown=strapi:strapi /opt/app/config ./config
# COPY --from=builder --chown=strapi:strapi /opt/app/src ./src
# COPY --from=builder --chown=strapi:strapi /opt/app/database ./database
COPY --chown=strapi:strapi package.json server.js ./
COPY --chown=strapi:strapi scripts ./scripts

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
ENTRYPOINT ["/usr/bin/tini", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD try_wget() { command -v wget > /dev/null && wget --no-verbose --tries=1 --spider http://localhost:1337/_health; }; \
    try_curl() { command -v curl > /dev/null && curl -f -s http://localhost:1337/_health; }; \
    try_wget || try_curl || exit 1

# Start Strapi
# Start Strapi via custom entry point
CMD ["node", "server.js"]
