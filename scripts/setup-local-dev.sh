#!/bin/bash
set -e

# Always run from the project root directory
cd "$(dirname "$0")/../.."

echo "=========================================="
echo "Installing Dependencies for Local Native Dev"
echo "=========================================="

# 1. Web
echo "[1/5] Setting up arkadas-web (Next.js)..."
cd arkadas-web
npm install
cd ..

# 2. Strapi
echo "[2/5] Setting up arkadas-core/strapi..."
cd arkadas-core/strapi
npm install
cd ../..

# 3. Core API
echo "[3/5] Setting up Core API (FastAPI)..."
cd arkadas-core/api
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cd ../..

# 4. AI Service
echo "[4/5] Setting up AI Service..."
cd arkadas-core/api/opencv
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cd ../../../..

# 5. Mebbis Service
echo "[5/5] Setting up Mebbis Service..."
cd arkadas-core/api/mebbis
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cd ../../../..

echo "=========================================="
echo "All dependencies installed successfully!"
echo "You can now run ./scripts/start-local-dev.sh"
echo "=========================================="
