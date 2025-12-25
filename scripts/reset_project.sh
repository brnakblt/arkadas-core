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
docker-compose down --remove-orphans --volumes --rmi local

echo -e "\n${YELLOW}2. Cleaning local data files...${NC}"
sudo rm -rf databases
mkdir -p databases/postgres databases/redis databases/nextcloud databases/nextcloud_db databases/onlyoffice databases/n8n

echo -e "\n${YELLOW}3. Cleaning Strapi cache...${NC}"
rm -rf strapi/.tmp strapi/dist strapi/build

echo -e "\n${YELLOW}4. Regenerating Environment Variables...${NC}"
# We'll run the generate script. It handles prompts.
# We pass --force or just run it. The script prompts if file exists, but we want to overwrite to be safe?
# Actually the script asks "Overwrite? (y/N)".
# We can just run it and let the user answer or use yes to force.
# The user said "start from scratch", so forcing new secrets is good.
# But generate_envs.sh doesn't have a force flag.
# I'll just run it.
bash scripts/generate_envs.sh

echo -e "\n${GREEN}=== RESET COMPLETE ===${NC}"
echo -e "You can now run: ${YELLOW}npm run dev${NC}"
