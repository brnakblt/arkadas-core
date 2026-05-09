#!/bin/bash
# =============================================================================
# Arkadaş Ecosystem - Unified Rebranding Tool
# Automates the transformation of any Nextcloud fork into "Arkadaş"
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TARGET_DIR=$1

if [ -z "$TARGET_DIR" ]; then
    echo -e "${RED}Usage: $0 <target_repo_directory>${NC}"
    exit 1
fi

echo -e "\n${BLUE}🚀 Starting Comprehensive Rebranding for: ${YELLOW}$TARGET_DIR${NC}"

cd "$TARGET_DIR" || exit 1

# 1. Core String Replacement (Case Sensitive)
echo -e "${YELLOW}1. Replacing Strings...${NC}"
find . -type f -not -path '*/.*' -exec sed -i 's/Nextcloud/Arkadaş/g' {} +
find . -type f -not -path '*/.*' -exec sed -i 's/nextcloud/arkadas/g' {} +
find . -type f -not -path '*/.*' -exec sed -i 's/NEXTCLOUD/ARKADAS/g' {} +

# 2. Package & Bundle ID Renaming
echo -e "${YELLOW}2. Updating Package Identifiers...${NC}"
find . -type f -not -path '*/.*' -exec sed -i 's/com.nextcloud.client/tr.com.arkadas.files/g' {} +
find . -type f -not -path '*/.*' -exec sed -i 's/com.nextcloud.ios/tr.com.arkadas.ios/g' {} +
find . -type f -not -path '*/.*' -exec sed -i 's/com.nextcloud.talk/tr.com.arkadas.talk/g' {} +

# 3. Branding Metadata (Android/iOS specific)
if [ -f "app/build.gradle" ]; then
    echo -e "   ✓ Android project detected. Updating Gradle properties..."
    sed -i 's/resValue "string", "app_name", "Arkadaş"/resValue "string", "app_name", "Arkadaş ERP"/g' app/build.gradle 2>/dev/null || true
fi

# 4. Success Summary
echo -e "\n${GREEN}✅ Rebranding Complete!${NC}"
echo "-------------------------------------------------------"
echo "Next Steps:"
echo "1. Manually replace assets (logo.svg, app icons)."
echo "2. Run a build test to ensure no breaking string changes."
echo "3. Push to: https://github.com/brnakblt/arkadas-<repo-name>.git"
echo "-------------------------------------------------------"
