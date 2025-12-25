# MEBBIS Service Dockerfile (Playwright)
FROM node:22-bullseye-slim

WORKDIR /app

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Install Playwright Browsers (Chromium only to save space, assuming script uses chromium)
RUN npx playwright install chromium --with-deps

# Security: Change ownership to node user
RUN chown -R node:node /app

# Switch to non-root user
USER node

EXPOSE 4000

CMD ["npm", "start"]
