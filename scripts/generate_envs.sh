#!/bin/bash

# Script to generate .env files for all services with unique, secure secrets.
# Ensures consistency across services (e.g., shared DB passwords).

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${GREEN}Generating Environment Variables for Arkadaş Özel Eğitim ERP...${NC}"

# Helper function to generate secrets
generate_secret() {
    openssl rand -base64 32 | tr -d '/+' | cut -c1-32
}

# 1. Ask for Admin Credentials (Distinct)
echo "Generating secure secrets..."
# Admin Credentials (Universal)
echo -e "\n${YELLOW}Setup Universal Admin Credentials${NC}"
echo "This password will be used for:"
echo " - SFTPGo Admin"
echo " - Strapi Panel (Initial)"
echo " - Web/Mobile Admin User"

read -sp "   Enter Global Admin Password (leave empty to generate random): " GLOBAL_ADMIN_PASSWORD
if [ -z "$GLOBAL_ADMIN_PASSWORD" ]; then
    GLOBAL_ADMIN_PASSWORD=$(generate_secret)
    echo -e "\n   Generated: ${YELLOW}${GLOBAL_ADMIN_PASSWORD}${NC}"
fi
echo ""

APP_PWD=$GLOBAL_ADMIN_PASSWORD

# Default Usernames
STRAPI_USER="barannakblut@gmail.com"
APP_USER_EMAIL="admin@arkadas.com.tr"
APP_USER_USERNAME="admin"

# Generate Shared Secrets
POSTGRES_PASSWORD=$(generate_secret)
SFTPGO_ADMIN_PASSWORD=$GLOBAL_ADMIN_PASSWORD
REDIS_PASSWORD=$(generate_secret)
JWT_SECRET=$(generate_secret)
ADMIN_JWT_SECRET=$(generate_secret)
APP_KEYS="$(generate_secret),$(generate_secret),$(generate_secret),$(generate_secret)"
API_TOKEN_SALT=$(generate_secret)
TRANSFER_TOKEN_SALT=$(generate_secret)
NEXTAUTH_SECRET=$(generate_secret)
MEBBIS_PASSWORD=$(generate_secret)
OPENAI_API_KEY="" # Prompt or leave empty

# Function to process an env file
generate_env_file() {
    local template_file=$1
    local target_file=$2
    local service_name=$3

    echo -e "Generating ${YELLOW}${service_name}${NC} .env..."

    if [ -f "$template_file" ]; then
        cp "$template_file" "$target_file"
        
        # Replacements (Using | as delimiter to allow / in values)
        sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" "$target_file" || true
        # Sync DATABASE_PASSWORD and USERNAME (used by Strapi) with POSTGRES
        sed -i "s|DATABASE_PASSWORD=.*|DATABASE_PASSWORD=${POSTGRES_PASSWORD}|" "$target_file" || true
        sed -i "s|DATABASE_USERNAME=.*|DATABASE_USERNAME=postgres|" "$target_file" || true
        sed -i "s|MYSQL_ROOT_PASSWORD=.*|MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}|" "$target_file" || true
        sed -i "s|MYSQL_PASSWORD=.*|MYSQL_PASSWORD=${MYSQL_PASSWORD}|" "$target_file" || true
        sed -i "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=${REDIS_PASSWORD}|" "$target_file" || true
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" "$target_file" || true
        sed -i "s|ADMIN_JWT_SECRET=.*|ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}|" "$target_file" || true
        sed -i "s|APP_KEYS=.*|APP_KEYS=${APP_KEYS}|" "$target_file" || true
        sed -i "s|API_TOKEN_SALT=.*|API_TOKEN_SALT=${API_TOKEN_SALT}|" "$target_file" || true
        sed -i "s|TRANSFER_TOKEN_SALT=.*|TRANSFER_TOKEN_SALT=${TRANSFER_TOKEN_SALT}|" "$target_file" || true
        sed -i "s|STRAPI_ADMIN_PASSWORD=.*|STRAPI_ADMIN_PASSWORD=${APP_PWD}|" "$target_file" || true
        sed -i "s|STRAPI_ADMIN_EMAIL=.*|STRAPI_ADMIN_EMAIL=${STRAPI_USER}|" "$target_file" || true
        sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${NEXTAUTH_SECRET}|" "$target_file" || true
        
        # SFTPGo Admin (Global Consistency)
        sed -i "s|SFTPGO_ADMIN_PASSWORD=.*|SFTPGO_ADMIN_PASSWORD=${SFTPGO_ADMIN_PASSWORD}|" "$target_file" || true
        sed -i "s|SFTPGO_ADMIN_USER=.*|SFTPGO_ADMIN_USER=admin|" "$target_file" || true

        # Specialized Replacements
        
        # AI Service DATABASE_URL
        # Pattern: postgresql://USER:PASS@HOST:PORT/DB
        sed -i "s|DATABASE_URL=postgresql://.*|DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/arkadas_erp|" "$target_file" || true

        # MEBBIS (Root & Service)
        sed -i "s|MEBBIS_PASSWORD=.*|MEBBIS_PASSWORD=${MEBBIS_PASSWORD}|" "$target_file" || true
        # Assuming MEBBIS_USERNAME is static or prompted? It's not prompted currently. 
        # Using default placeholder or we should prompt? 
        # For now, let's just ensure the var maps if present.
        # But wait, MEBBIS_USERNAME is defined in .env.reference as 'your-mebbis-username'.
        # We don't have a variable for it in the script.
        # Let's add one.

    else
        echo -e "${RED}Template $template_file not found!${NC}"
    fi
}

# 1. Root .env (Docker Infrastructure)
generate_env_file "${PROJECT_ROOT}/.env.reference" "${PROJECT_ROOT}/.env" "Root (Docker)"

# 2. Strapi .env
generate_env_file "${PROJECT_ROOT}/strapi/.env.reference" "${PROJECT_ROOT}/strapi/.env" "Strapi"

# 3. Web .env
# Web uses .env.local usually, but let's check reference
if [ -f "${PROJECT_ROOT}/web/.env.example" ]; then
    generate_env_file "${PROJECT_ROOT}/web/.env.example" "${PROJECT_ROOT}/web/.env.local" "Web"
fi

# 4. Service Envs (Mebbis, AI)
if [ -f "${PROJECT_ROOT}/mebbis-service/.env.example" ]; then
    generate_env_file "${PROJECT_ROOT}/mebbis-service/.env.example" "${PROJECT_ROOT}/mebbis-service/.env" "Mebbis Service"
fi
if [ -f "${PROJECT_ROOT}/ai-service/.env.example" ]; then
    generate_env_file "${PROJECT_ROOT}/ai-service/.env.example" "${PROJECT_ROOT}/ai-service/.env" "AI Service"
fi
if [ -f "${PROJECT_ROOT}/mobile/.env.example" ]; then
    generate_env_file "${PROJECT_ROOT}/mobile/.env.example" "${PROJECT_ROOT}/mobile/.env" "Mobile"
fi

echo -e "\n${GREEN}=== Environment Generation Complete ===${NC}"
echo -e "SFTPGo Admin Password: ${YELLOW}${SFTPGO_ADMIN_PASSWORD}${NC}"
echo -e "Please run ${YELLOW}bash scripts/setup_infisical.sh${NC} to import these into Infisical."
