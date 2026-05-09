#!/bin/bash

# Script to generate .env files for all services with unique, secure secrets.
# Ensures consistency across services (e.g., shared DB passwords).
# Optimized for Arkadaş ERP (Forked Nextcloud + Strapi v5)

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

# PROACTIVE: Try to fetch existing GEMINI_API_KEY before generating new envs
echo -e "${YELLOW}Checking for existing GEMINI_API_KEY...${NC}"
EXISTING_GEMINI_KEY=""

# 1. Check Infisical
if command -v infisical &> /dev/null && [ -f "${PROJECT_ROOT}/.infisical.json" ]; then
    # Try dev environment root path
    EXISTING_GEMINI_KEY=$(cd "${PROJECT_ROOT}" && infisical secrets get GEMINI_API_KEY --env dev --plain 2>/dev/null || echo "")
fi

# 2. Check local .env as fallback
if [ -z "$EXISTING_GEMINI_KEY" ] && [ -f "${PROJECT_ROOT}/.env" ]; then
    EXISTING_GEMINI_KEY=$(grep "^GEMINI_API_KEY=" "${PROJECT_ROOT}/.env" | cut -d= -f2- | tr -d "'\"" | xargs || echo "")
fi

if [ -n "$EXISTING_GEMINI_KEY" ]; then
    echo -e "   ✓ Found existing GEMINI_API_KEY. It will be preserved."
else
    echo -e "   ! No GEMINI_API_KEY found. Placeholder 'your-gemini-api-key' will be used."
fi

# 1. Ask for Admin Credentials (Distinct)
echo "Generating secure secrets..."
# Admin Credentials (Universal)
echo -e "\n${YELLOW}Setup Universal Admin Credentials${NC}"
echo "This password will be used for:"
echo " - Nextcloud Admin"
echo " - Strapi Panel (Initial)"
echo " - Web Admin User"

if [ "$AUTO_CONFIRM" = "true" ]; then
    GLOBAL_ADMIN_PASSWORD=$(generate_secret)
    echo -e "\n   Auto-Generated Admin Password: ${YELLOW}${GLOBAL_ADMIN_PASSWORD}${NC}"
else
    read -sp "   Enter Global Admin Password (leave empty to generate random): " GLOBAL_ADMIN_PASSWORD
    if [ -z "$GLOBAL_ADMIN_PASSWORD" ]; then
        GLOBAL_ADMIN_PASSWORD=$(generate_secret)
        echo -e "\n   Generated: ${YELLOW}${GLOBAL_ADMIN_PASSWORD}${NC}"
    fi
fi
echo ""

APP_PWD=$GLOBAL_ADMIN_PASSWORD

# Default Usernames
STRAPI_USER="barannakblut@gmail.com"
APP_USER_EMAIL="barannakblut@gmail.com"
APP_USER_USERNAME="barannakblut"

# Generate Shared Secrets
POSTGRES_PASSWORD=$(generate_secret)
NEXTCLOUD_ADMIN_PASSWORD=$GLOBAL_ADMIN_PASSWORD
REDIS_PASSWORD=$(generate_secret)
JWT_SECRET=$(generate_secret)
ADMIN_JWT_SECRET=$(generate_secret)
APP_KEYS="$(generate_secret),$(generate_secret),$(generate_secret),$(generate_secret)"
API_TOKEN_SALT=$(generate_secret)
TRANSFER_TOKEN_SALT=$(generate_secret)
NEXTAUTH_SECRET=$(generate_secret)
MEBBIS_PASSWORD=$(generate_secret)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Function to process an env file
generate_env_file() {
    local template_file=$1
    local target_file=$2
    local service_name=$3

    echo -e "Generating ${YELLOW}${service_name}${NC} .env..."

    if [ -f "$template_file" ]; then
        cp "$template_file" "$target_file"
        
        # Core Infrastructure
        sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" "$target_file" || true
        sed -i "s|POSTGRES_DB=.*|POSTGRES_DB=arkadas|" "$target_file" || true
        
        # Database Sync
        sed -i "s|DATABASE_PASSWORD=.*|DATABASE_PASSWORD=${POSTGRES_PASSWORD}|" "$target_file" || true
        sed -i "s|DATABASE_NAME=.*|DATABASE_NAME=arkadas|" "$target_file" || true
        sed -i "s|DATABASE_USERNAME=.*|DATABASE_USERNAME=postgres|" "$target_file" || true
        sed -i "s|DATABASE_URL=postgresql://.*|DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/arkadas|" "$target_file" || true
        
        # Redis
        sed -i "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=${REDIS_PASSWORD}|" "$target_file" || true
        sed -i "s|REDIS_URL=.*|REDIS_URL=redis://localhost:6380|" "$target_file" || true
        
        # Security
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" "$target_file" || true
        sed -i "s|ADMIN_JWT_SECRET=.*|ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}|" "$target_file" || true
        sed -i "s|APP_KEYS=.*|APP_KEYS=${APP_KEYS}|" "$target_file" || true
        sed -i "s|API_TOKEN_SALT=.*|API_TOKEN_SALT=${API_TOKEN_SALT}|" "$target_file" || true
        sed -i "s|TRANSFER_TOKEN_SALT=.*|TRANSFER_TOKEN_SALT=${TRANSFER_TOKEN_SALT}|" "$target_file" || true
        sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=${ENCRYPTION_KEY}|" "$target_file" || true
        sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${NEXTAUTH_SECRET}|" "$target_file" || true
        
        # Admin User
        sed -i "s|STRAPI_ADMIN_PASSWORD=.*|STRAPI_ADMIN_PASSWORD=${APP_PWD}|" "$target_file" || true
        sed -i "s|STRAPI_ADMIN_EMAIL=.*|STRAPI_ADMIN_EMAIL=${STRAPI_USER}|" "$target_file" || true
        
        # AI (Gemini) - Preservation Logic
        if [ -n "$EXISTING_GEMINI_KEY" ]; then
            sed -i "s|GEMINI_API_KEY=.*|GEMINI_API_KEY=${EXISTING_GEMINI_KEY}|" "$target_file" || true
        fi

        # Nextcloud (Storage)
        sed -i "s|NEXTCLOUD_ADMIN_USER=.*|NEXTCLOUD_ADMIN_USER=admin|" "$target_file" || true
        sed -i "s|NEXTCLOUD_ADMIN_PASSWORD=.*|NEXTCLOUD_ADMIN_PASSWORD=${NEXTCLOUD_ADMIN_PASSWORD}|" "$target_file" || true
        sed -i "s|NEXTCLOUD_URL=.*|NEXTCLOUD_URL=http://localhost:8088|" "$target_file" || true

        # Monitoring & Notifications
        sed -i "s|GRAFANA_ADMIN_PASSWORD=.*|GRAFANA_ADMIN_PASSWORD=${APP_PWD}|" "$target_file" || true
        sed -i "s|SLACK_WEBHOOK_URL=.*|SLACK_WEBHOOK_URL=https://hooks.slack.com/services/placeholder|" "$target_file" || true

        # MEBBIS
        sed -i "s|MEBBIS_PASSWORD=.*|MEBBIS_PASSWORD=${MEBBIS_PASSWORD}|" "$target_file" || true

    else
        echo -e "${RED}Template $template_file not found!${NC}"
    fi
}

# 1. Root .env (Docker Infrastructure)
generate_env_file "${PROJECT_ROOT}/.env.reference" "${PROJECT_ROOT}/.env" "Root (Docker)"

# 2. Strapi .env
generate_env_file "${PROJECT_ROOT}/strapi/.env.reference" "${PROJECT_ROOT}/strapi/.env" "Strapi"

# 3. Web .env
if [ -f "${PROJECT_ROOT}/../arkadas-web/.env.reference" ]; then
    generate_env_file "${PROJECT_ROOT}/../arkadas-web/.env.reference" "${PROJECT_ROOT}/../arkadas-web/.env.local" "Web"
fi

echo -e "\n${GREEN}=== Environment Generation Complete ===${NC}"
echo -e "Admin Password: ${YELLOW}${GLOBAL_ADMIN_PASSWORD}${NC}"
echo -e "Nextcloud Admin: ${YELLOW}admin / ${NEXTCLOUD_ADMIN_PASSWORD}${NC}"
echo -e "Please run ${YELLOW}bash scripts/setup_infisical.sh${NC} to import these into Infisical."
