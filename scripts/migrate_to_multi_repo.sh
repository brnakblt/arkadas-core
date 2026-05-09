#!/bin/bash
# =============================================================================
# Arkadaş ERP - Multi-Repo Migration Guide & Scripts
# =============================================================================
# This script does NOT execute the split automatically. 
# It provides the commands and logic to perform the surgical split.
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Arkadaş ERP - Multi-Repo Migration Roadmap${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Step 1: Preparation${NC}"
echo "1. Install git-filter-repo: 'pip install git-filter-repo'"
echo "2. Push all current changes to main monorepo."
echo "3. Create empty repositories on your Git provider (GitHub/GitLab):"
echo "   - arkadas-core"
echo "   - arkadas-web"
echo "   - arkadas-sdk"
echo "   - arkadas-android (fork from nextcloud/android)"
echo "   - arkadas-ios (fork from nextcloud/ios)"

echo -e "\n${YELLOW}Step 2: Splitting arkadas-web${NC}"
echo -e "${GREEN}# Run these commands in a NEW clone of the monorepo${NC}"
echo "git clone <monorepo-url> arkadas-web-temp"
echo "cd arkadas-web-temp"
echo "git filter-repo --subdirectory-filter web/"
echo "git remote add origin <arkadas-web-new-url>"
echo "git push -u origin main"

echo -e "\n${YELLOW}Step 3: Splitting arkadas-sdk${NC}"
echo -e "${GREEN}# Run these commands in a NEW clone of the monorepo${NC}"
echo "git clone <monorepo-url> arkadas-sdk-temp"
echo "cd arkadas-sdk-temp"
echo "git filter-repo --subdirectory-filter sdk/"
echo "git remote add origin <arkadas-sdk-new-url>"
echo "git push -u origin main"

echo -e "\n${YELLOW}Step 4: Transforming to arkadas-core${NC}"
echo -e "${GREEN}# Run these commands in your CURRENT monorepo directory${NC}"
echo "rm -rf web/ sdk/ mobile/"
echo "git add ."
echo "git commit -m 'chore: transform monorepo to arkadas-core'"
echo "git remote set-url origin <arkadas-core-new-url>"
echo "git push -u origin main"

echo -e "\n${YELLOW}Step 5: Mobile Branding & Forks${NC}"
echo -e "${GREEN}# For Android (Run in new clone of arkadas-android)${NC}"
echo "git remote add upstream https://github.com/nextcloud/android.git"
echo "git fetch upstream"
echo "git checkout -b branding"
echo "find . -type f -exec sed -i 's/Nextcloud/Arkadaş/g' {} +"
echo "find . -type f -exec sed -i 's/com.nextcloud.client/tr.com.arkadas.mobile/g' {} +"

echo -e "\n${GREEN}# For iOS (Run in new clone of arkadas-ios)${NC}"
echo "git remote add upstream https://github.com/nextcloud/ios.git"
echo "git fetch upstream"
echo "git checkout -b branding"
echo "find . -type f -exec sed -i 's/Nextcloud/Arkadaş/g' {} +"
echo "find . -type f -exec sed -i 's/com.nextcloud.ios/tr.com.arkadas.ios/g' {} +"

echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "Migration tools prepared. Ready for the surgical split and branding."
