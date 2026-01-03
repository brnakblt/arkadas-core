#!/bin/bash
# =============================================================================
# Arkadaş ERP - Project Reset Script
# Wipes all data, regenerates secrets, and seeds fresh data
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}!!! WARNING: THIS WILL WIPE ALL DATA !!!${NC}"
echo -e "${RED}* Database (PostgreSQL, Redis) will be reset${NC}"
echo -e "${RED}* Environment files will be regenerated${NC}"
echo -e "${RED}* All uploads will be deleted${NC}"
echo "-------------------------------------------------------"
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Pre-flight check: Is Docker running?
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running.${NC}"
    echo "Please start Docker and try again."
    exit 1
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Arkadaş ERP - Full Reset${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${YELLOW}1. Stopping Docker containers...${NC}"
docker compose down --volumes --remove-orphans

echo -e "\n${YELLOW}2. Cleaning database files...${NC}"
docker run --rm -v "$(pwd):/app" -w /app alpine rm -rf databases
mkdir -p databases/postgres databases/redis databases/onlyoffice/data databases/onlyoffice/log databases/onlyoffice/cache

echo -e "\n${YELLOW}3. Cleaning Strapi cache...${NC}"
rm -rf strapi/.tmp strapi/dist strapi/build strapi/.cache
rm -rf strapi/public/uploads/*

echo -e "\n${YELLOW}4. Regenerating environment variables...${NC}"
export AUTO_CONFIRM=true
bash scripts/generate_envs.sh

# Check if Infisical is available
if command -v infisical &> /dev/null && [ -f ".infisical.json" ]; then
    echo -e "${YELLOW}Uploading secrets to Infisical...${NC}"
    bash scripts/setup_infisical.sh 2>/dev/null || echo "Infisical sync skipped"
fi

# Exit on error from here
set -e

echo -e "\n${YELLOW}5. Starting infrastructure (Docker)...${NC}"
docker compose up -d --wait
echo "Waiting 5s for database stability..."
sleep 5

echo -e "\n${YELLOW}6. Installing mobile app dependencies...${NC}"
if [ -d "mobile" ] && [ -f "mobile/package.json" ]; then
    cd mobile && npm install && cd ..
    echo -e "${GREEN}✓ Mobile dependencies installed${NC}"
else
    echo "Mobile app not found, skipping"
fi

echo -e "\n${YELLOW}7. Building Strapi...${NC}"
mkdir -p strapi/public/uploads
chmod 755 strapi/public/uploads

# Build Strapi (with or without Infisical)
if command -v infisical &> /dev/null && [ -f ".infisical.json" ]; then
    infisical run --path /strapi -- npm run build --prefix strapi
else
    npm run build --prefix strapi
fi

echo -e "\n${YELLOW}8. Seeding database (default tenant: arkadas)...${NC}"
cd strapi
if command -v infisical &> /dev/null && [ -f "../.infisical.json" ]; then
    infisical run --path /strapi -- node scripts/seed.js
else
    node scripts/seed.js
fi
cd ..

echo -e "\n${YELLOW}9. Running quick tests...${NC}"
npm run lint 2>/dev/null || echo "Lint check skipped"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  RESET & SEED COMPLETE ✅${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Services running:"
echo -e "  • PostgreSQL: ${BLUE}localhost:5432${NC}"
echo -e "  • Redis:      ${BLUE}localhost:6379${NC}"
echo -e "  • OnlyOffice: ${BLUE}localhost:8081${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Run: ${YELLOW}npm run dev${NC} to start all services"
echo -e "  2. Open: ${BLUE}http://localhost:1337/admin${NC} (Strapi)"
echo -e "  3. Open: ${BLUE}http://localhost:3000${NC} (Web)"
echo -e "  4. Mobile: ${YELLOW}cd mobile && npm run dev${NC}"
echo ""
echo -e "Default tenant: ${GREEN}arkadas${NC}"
