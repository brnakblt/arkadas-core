#!/bin/bash
# scripts/setup_infisical.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Infisical Migration Setup ===${NC}"

# 1. Check Installation
if ! command -v infisical &> /dev/null; then
    echo -e "${YELLOW}Infisical CLI not found.${NC}"
    echo "Attempting install (requires sudo)..."
    if [ -f /etc/arch-release ]; then
        echo "Detected Arch Linux."
        if command -v yay &> /dev/null; then
            yay -S infisical-bin
        else
            echo -e "${RED}Please install 'infisical' manually (e.g. yay -S infisical-bin) and re-run this script.${NC}"
            exit 1
        fi
    elif [ -f /etc/debian_version ]; then
        curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | sudo -E bash
        sudo apt-get update && sudo apt-get install -y infisical
    else
        echo -e "${RED}OS not supported for auto-install. Please install Infisical CLI manually: https://infisical.com/docs/cli/overview${NC}"
        exit 1
    fi
fi

# 2. Login
echo -e "\n${YELLOW}Step 1: Authentication${NC}"
# infisical login

# 3. Init Project
echo -e "\n${YELLOW}Step 2: Initialize Project${NC}"
if [ ! -f .infisical.json ]; then
    echo "Please select the project you created for Arkadaş ERP."
    infisical init
else
    echo "Project already initialized."
fi

# 4. Create Folders & Import Secrets
create_folder() {
    local folder_name=$1
    echo -e "Ensuring folder ${YELLOW}/$folder_name${NC} exists..."
    # Attempt to create folder. Ignore error if it exists (CLI returns error if exists usually, or succeeds idempotently).
    # We suppress output but allow failure (|| true) assuming failure means "exists" or "permission denied" (which will fail import anyway).
    infisical secrets folders create --env dev --path "/" --name "$folder_name" >/dev/null 2>&1 || true
}

import_secrets() {
    local env_file=$1
    local secret_path=$2
    
    if [ -f "$env_file" ]; then
        echo -e "Importing ${YELLOW}$env_file${NC} to path ${GREEN}$secret_path${NC}..."
        
        # Use 'secrets set --file' command.
        infisical secrets set --env dev --path "$secret_path" --file "$env_file" || echo -e "${RED}Failed to import $env_file.${NC}"
    else
        echo "Skipping $env_file (not found)"
    fi
}

echo -e "\n${YELLOW}Step 3: Migrating Secrets to Infisical (Dev Env)${NC}"

# Root
import_secrets ".env" "/"

# Strapi
create_folder "strapi"
import_secrets "strapi/.env" "/strapi"

# Web
create_folder "web"
import_secrets "web/.env.local" "/web"

# AI
create_folder "ai-service"
import_secrets "ai-service/.env" "/ai-service"

# Mebbis
create_folder "mebbis-service"
import_secrets "mebbis-service/.env" "/mebbis-service"

# Mobile

echo -e "\n${GREEN}Migration Complete!${NC}"
echo "You can now verify secrets in the Dashboard."
echo "Running 'npm run dev' will now use Infisical."
