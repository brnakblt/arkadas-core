#!/bin/bash
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}!!! WARNING: THIS WILL WIPE ALL DATA !!!${NC}"
echo -e "${RED}* Database (PostgreSQL, Redis) will be reset.${NC}"
echo -e "${RED}* Environment files will be regenerated.${NC}"
echo "-------------------------------------------------------"
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo -e "\n${YELLOW}1. Stopping Docker...${NC}"
docker compose down --volumes --remove-orphans

echo -e "\n${YELLOW}2. Cleaning local data files...${NC}"
sudo rm -rf databases
mkdir -p databases/postgres databases/redis

echo -e "\n${YELLOW}3. Cleaning Strapi cache...${NC}"
rm -rf strapi/.tmp strapi/dist strapi/build

echo -e "\n${YELLOW}4. Regenerating Environment Variables & Secrets...${NC}"
bash scripts/generate_envs.sh
echo -e "${YELLOW}Uploading new secrets to Infisical...${NC}"
bash scripts/setup_infisical.sh

echo -e "\n${YELLOW}5. Starting Infrastructure...${NC}"
docker compose up -d --wait

echo -e "\n${YELLOW}6. Building and Starting Strapi...${NC}"
mkdir -p strapi/public/uploads
chmod 755 strapi/public/uploads

# Build Strapi
infisical run --path /strapi -- npm run build --prefix strapi

echo -e "\n${YELLOW}7. Seeding Database...${NC}"
# Run Strapi with seed in background, wait for it
infisical run --path /strapi -- npm run develop --prefix strapi &
STRAPI_PID=$!

echo "Waiting for Strapi to be ready..."
for i in {1..60}; do
    if curl -s http://localhost:1337/_health > /dev/null 2>&1; then
        echo -e "${GREEN}Strapi is up!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Run seed script
cd strapi && node scripts/seed.js && cd ..

echo -e "\n${YELLOW}8. Stopping Strapi...${NC}"
kill $STRAPI_PID 2>/dev/null

echo -e "\n${GREEN}=== RESET & SEED COMPLETE ===${NC}"
echo -e "Run: ${YELLOW}npm run dev${NC} to start development"
echo -e "Services: Postgres (5432), Redis (6379)"
