#!/bin/bash
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}!!! WARNING: THIS WILL WIPE ALL DATA !!!${NC}"
echo -e "${RED}* All Docker volumes will be deleted.${NC}"
echo -e "${RED}* All Local Database files (Postgres, Redis, Nextcloud) will be deleted.${NC}"
echo -e "${RED}* Environment files will be regenerated.${NC}"
echo "-------------------------------------------------------"
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo -e "\n${YELLOW}1. Stopping Docker...${NC}"
# Use the same profiles as dev:full-stack
export COMPOSE_PROFILES=core,infra,apps,features
# Wrap with infisical to ensure vars like MEBBIS_PASSWORD are set for interpolation
infisical run --path / -- docker compose down --remove-orphans --volumes --rmi local || docker compose down --remove-orphans --volumes --rmi local

echo -e "\n${YELLOW}2. Cleaning local data files...${NC}"
sudo rm -rf databases
mkdir -p databases/postgres databases/redis databases/nextcloud databases/nextcloud_db databases/onlyoffice databases/n8n

echo -e "\n${YELLOW}3. Cleaning Strapi cache...${NC}"
rm -rf strapi/.tmp strapi/dist strapi/build

echo -e "\n${YELLOW}4. Regenerating Environment Variables & Secrets...${NC}"
# Regenerate consistent secrets
bash scripts/generate_envs.sh
# Upload to Infisical (Interactive)
echo -e "${YELLOW}Uploading new secrets to Infisical...${NC}"
bash scripts/setup_infisical.sh

echo -e "\n${YELLOW}5. Starting Strapi for Seeding...${NC}"

# Ensure upload directory exists and is writable (Fix for EACCES)
mkdir -p strapi/public/uploads
chmod 777 strapi/public/uploads

infisical run --path / -- docker compose -f docker-compose.yml --profile core --profile apps up -d strapi postgres

echo "Waiting for Strapi to be ready (this may take a minute)..."
# Loop until Strapi health check passes or timeout
for i in {1..60}; do
    if docker compose logs --tail 10 strapi | grep -q "To access the server"; then
        echo -e "${GREEN}Strapi is up!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

echo -e "\n${YELLOW}6. Seeding Database...${NC}"
# Use container name explicitly
STRA_CONTAINER="arkadasozelegitim-strapi-1"
if [ "$(docker ps -q -f name=$STRA_CONTAINER)" ]; then
    docker exec $STRA_CONTAINER npm run seed
    echo -e "${GREEN}Seeding Complete! Admin User & API Tokens created.${NC}"
    
    echo -e "\n${YELLOW}7. Stopping Strapi Container (Freeing port 1337 for local dev)...${NC}"
    docker stop $STRA_CONTAINER
else
    echo -e "${RED}Strapi container not running. Seeding failed.${NC}"
fi

echo -e "\n${GREEN}=== RESET & SEED COMPLETE ===${NC}"
echo -e "You can now run: ${YELLOW}npm run dev${NC} (Services are already running)"
