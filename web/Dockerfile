# Base stage
FROM node:22-bullseye-slim AS base
WORKDIR /app
COPY package.json ./

# Development stage
FROM base AS dev
RUN npm install
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# Builder stage
FROM base AS builder
RUN npm install
COPY . .
# Build Next.js app
ENV NODE_ENV=production
# Next.js telemetry disable
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runner Stage
FROM node:22-bullseye-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
CMD ["node", "server.js"]
