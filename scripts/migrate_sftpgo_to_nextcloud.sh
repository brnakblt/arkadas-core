#!/bin/bash
# =============================================================================
# Arkadaş ERP - SFTPGo to Nextcloud Migration Script
# Moves user files from SFTPGo data directory to Nextcloud
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SFTPGO_DATA="./infra_data/sftpgo/data"
NEXTCLOUD_DATA="./infra_data/nextcloud/data"

echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Arkadaş ERP - Data Migration (SFTPGo -> Nextcloud)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"

if [ ! -d "$SFTPGO_DATA" ]; then
    echo -e "${RED}❌ SFTPGo data directory not found: $SFTPGO_DATA${NC}"
    exit 1
fi

mkdir -p "$NEXTCLOUD_DATA"

echo -e "${YELLOW}📦 Starting file migration...${NC}"

# Iterate through user directories in SFTPGo
for user_dir in "$SFTPGO_DATA"/*; do
    if [ -d "$user_dir" ]; then
        username=$(basename "$user_dir")
        # Skip internal or system dirs if any
        if [[ "$username" == "groups" || "$username" == "temporary" ]]; then
            continue
        fi
        
        echo -e "   ➡️  Migrating user: ${GREEN}$username${NC}"
        
        # Target path in Nextcloud: data/{username}/files
        # Note: Nextcloud users must exist first for this to work perfectly with OCC scan
        target_dir="$NEXTCLOUD_DATA/$username/files"
        mkdir -p "$target_dir"
        
        # Copy contents
        cp -rn "$user_dir"/* "$target_dir/" 2>/dev/null || true
    fi
done

echo -e "\n${YELLOW}🔧 Setting file ownership...${NC}"
# Nextcloud expects www-data ownership
if command -v docker &>/dev/null && docker ps | grep -q arkadasozelegitim-nextcloud; then
    docker exec -u root arkadasozelegitim-nextcloud-1 chown -R www-data:www-data /var/www/html/data
    echo -e "   ✓ File ownership updated to www-data"
    
    echo -e "${YELLOW}🔍 Scanning files in Nextcloud...${NC}"
    docker exec -u www-data arkadasozelegitim-nextcloud-1 php occ files:scan --all
    echo -e "   ✓ Nextcloud file scan complete"
else
    echo -e "${RED}⚠️  Nextcloud container not running. Please run file scan manually later:${NC}"
    echo "   docker exec -u www-data arkadasozelegitim-nextcloud-1 php occ files:scan --all"
fi

echo -e "\n${GREEN}✅ Migration Complete!${NC}"
echo -e "You can now safely remove the SFTPGo data: ${YELLOW}rm -rf ./infra_data/sftpgo${NC}"
