#!/bin/bash
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}☢️  NUCLEAR RESET INITIATED ☢️${NC}"
echo -e "${RED}This script will DESTROY ALL Docker data, node_modules, and local databases.${NC}"
echo -e "${RED}It is intended to fix deep system corruption.${NC}"
read -p "Are you absolutely sure? (type 'yes' to confirm): " confirm
if [[ "$confirm" != "yes" ]]; then
    echo "Aborted."
    exit 1
fi

echo -e "\n${YELLOW}1. Stopping and Removing ALL Docker Containers...${NC}"
docker stop $(docker ps -aq) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null

echo -e "\n${YELLOW}2. Pruning Docker System (Volumes, Networks, Images)...${NC}"
# Prune everything not in use. -f force, -a all images, --volumes included
docker system prune -a --volumes -f

echo -e "\n${YELLOW}3. Cleaning Local Filesystem...${NC}"
sudo rm -rf databases
sudo rm -rf strapi/.tmp strapi/dist strapi/build
# Optional: clean node_modules if you really want a fresh start
# rm -rf node_modules strapi/node_modules web/node_modules mobile/node_modules mebbis-service/node_modules

echo -e "\n${YELLOW}4. Re-installing Dependencies...${NC}"
npm install

echo -e "\n${YELLOW}5. Starting Project with Seed...${NC}"
# Use existing robust reset script logic for starting & seeding
# We can just call npm run reset now that the environment is clean
echo "Environment clean. Running 'npm run reset' to bootstrap..."
npm run reset

echo -e "\n${GREEN}=== NUCLEAR RESET COMPLETE ===${NC}"
