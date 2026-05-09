# ============================================================
# Strapi Production Dockerfile - Unified & Optimized
# ============================================================

# Stage 1: Build & Dependencies
FROM node:24.14.1-slim AS builder
WORKDIR /opt/app

# Install build tools with pinned versions
RUN apt-get update && apt-get install -y \
    python3=3.11.2-1+b1 \
    make=4.3-4.1 \
    g++=4:12.2.0-3 \
    build-essential=12.9 \
    && rm -rf /var/lib/apt/lists/*

# Copy package definition
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDeps for build)
RUN npm install --legacy-peer-deps

# Explicitly install esbuild (fix for Strapi v5 build issue) with pinned version
RUN npm install esbuild@0.27.4

# Copy source code
COPY . .

# Build admin panel
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production Runner
FROM node:24.14.1-slim AS runner
WORKDIR /opt/app

# Install runtime tools with pinned versions
RUN apt-get update && apt-get install -y \
    tini=0.19.0-1+b3 \
    curl=7.88.1-10+deb12u14 \
    && rm -rf /var/lib/apt/lists/*

# Create strapi user
RUN groupadd -g 1001 strapi && \
    useradd -m -u 1001 -g strapi -s /bin/bash strapi

# Copy dependencies & build artifacts
COPY --from=builder --chown=strapi:strapi /opt/app/node_modules ./node_modules
COPY --from=builder --chown=strapi:strapi /opt/app/dist ./dist
COPY --from=builder --chown=strapi:strapi /opt/app/public ./public
COPY --chown=strapi:strapi package.json server.js ./
COPY --chown=strapi:strapi scripts ./scripts

# Setup directories
RUN mkdir -p /opt/app/.tmp /opt/app/public/uploads && \
    chown -R strapi:strapi /opt/app

USER strapi
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

EXPOSE 1337
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
