#!/bin/bash
# =============================================================================
# Arkadaş ERP - Nextcloud Server Branding Script
# Applies "Arkadaş" identity to the running Nextcloud instance
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CONTAINER_NAME="arkadasozelegitim-nextcloud-1"

echo -e "\n${BLUE}Applying Arkadaş Branding to Nextcloud...${NC}"

if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ Nextcloud container is not running.${NC}"
    exit 1
fi

# Function to run occ commands
run_occ() {
    docker exec -u www-data "$CONTAINER_NAME" php occ "$@"
}

echo -e "${YELLOW}1. Enabling Theming App...${NC}"
run_occ app:enable theming

echo -e "${YELLOW}2. Setting Brand Names & Slogan...${NC}"
run_occ config:app:set theming name --value "Arkadaş ERP"
run_occ config:app:set theming slogan --value "Her Çocuk Özel ve Değerli!"
run_occ config:app:set theming url --value "https://arkadas.com.tr"

echo -e "${YELLOW}3. Setting Brand Colors...${NC}"
# Using a friendly blue/indigo variant from our design system
run_occ config:app:set theming color --value "#4f46e5" 

echo -e "${YELLOW}4. Disabling Default Links...${NC}"
run_occ config:app:set theming logoheader --value "none"
run_occ config:system:set help_url --value ""
run_occ config:system:set feedback_url --value ""

echo -e "\n${GREEN}✅ Arkadaş Branding applied to Server!${NC}"
echo "Note: You should manually upload the Arkadaş Logo via the Nextcloud Admin Panel > Theming section."
