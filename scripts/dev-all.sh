#!/bin/bash
# Starts Strapi and Web in concurrently, then opens Expo in a new terminal

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "🚀 Starting development servers..."
echo ""

# Start Expo in a new terminal
bash "$SCRIPT_DIR/start-expo-terminal.sh"

# Start Strapi and Web in concurrently
npx concurrently -n strapi,web -c blue,green \
  "cd strapi && npm run develop" \
  "cd web && npm run dev"
