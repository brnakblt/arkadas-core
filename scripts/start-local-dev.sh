#!/bin/bash
set -e

# Always run from the project root directory
cd "$(dirname "$0")/../.."

echo "=========================================="
echo "Starting Hybrid Local Development Environment"
echo "=========================================="

# 1. Start Infrastructure & ML Services
echo "Starting Docker Infrastructure (Postgres, Redis, Nextcloud)..."
docker compose up -d postgres redis nextcloud

# Wait briefly for infrastructure to be available
sleep 2

# 2. Start Native Applications using concurrently
echo "Starting Native Applications..."
npx concurrently \
  -n "WEB,STRAPI,CORE-API" \
  -c "bgBlue.bold,bgMagenta.bold,bgCyan.bold" \
  "cd arkadas-web && npm run dev" \
  "cd arkadas-core/strapi && npm run develop" \
  "cd arkadas-core/api && source venv/bin/activate && uvicorn app.main:app --port 8001 --reload"
