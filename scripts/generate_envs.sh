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
echo -e "${YELLOW}Setup Distinct Admin Credentials${NC}"
echo "You will now set passwords for each service separately."
echo "-------------------------------------------------------"

# Strapi Admin
echo -e "\n1. Strapi Admin Panel: ${YELLOW}Create manually in browser (Welcome Screen)${NC}"

# App Admin
echo -e "\n2. Mobile/Web App (User: admin)"
read -sp "   Enter Password: " APP_PWD
echo ""
if [ -z "$APP_PWD" ]; then echo -e "${RED}Password cannot be empty.${NC}"; exit 1; fi

# Nextcloud Admin
echo -e "\n3. Nextcloud Admin: ${YELLOW}Create manually in browser (Setup Wizard)${NC}"

# Default Usernames
STRAPI_USER="admin@arkadas.com.tr"
APP_USER_EMAIL="admin@arkadas.com.tr" # Used for seeding
APP_USER_USERNAME="admin"
NC_USER="admin"

APP_KEYS="$(generate_secret),$(generate_secret),$(generate_secret),$(generate_secret)"
NEXTAUTH_SECRET=$(generate_secret)
STRAPI_API_TOKEN_SALT=$(generate_secret)

# ... (Standard secrets generation)
POSTGRES_PASSWORD=$(generate_secret)
REDIS_PASSWORD=$(generate_secret)
JWT_SECRET=$(generate_secret)
ADMIN_JWT_SECRET=$(generate_secret)
API_TOKEN_SALT=$(generate_secret)
TRANSFER_TOKEN_SALT=$(generate_secret)
ENCRYPTION_KEY=$(generate_secret)
STRAPI_API_TOKEN_SALT=$(generate_secret) # Not full token, but used if we needed to gen one (tokens usually gen via API)
# Note: Full Strapi API tokens need to be generated via Strapi Admin UI or CLI after proper setup. 
# For now we will use a placeholder or a generated string if the reference allows.
# Looking at references, STRAPI_API_TOKEN is needed for AI and Mebbis services. 
# We cannot generate a valid signed Strapi token without Strapi running. 
# We will use a placeholder and warn the user.
STRAPI_API_TOKEN_PLACEHOLDER="Run_Strapi_And_Generate_Token_Then_Paste_Here"

generate_env_file() {
    local service_name=$1
    local target_file=$2
    local template_file=$3

    echo -e "Processing ${YELLOW}${service_name}${NC}..."

    if [ -f "$target_file" ]; then
        read -p "File $target_file already exists. Overwrite? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Skipping $target_file${NC}"
            return
        fi
    fi

    # Read template and replace variables
    # We use sed to replace known placeholders. 
    # Since reference files have comments and var=value, we construct the file content manually 
    # based on the known keys we want to sync, while keeping others default.
    
    # Actually, a safer approach than complete rewrite is to read the reference and replace specfic keys.
    # But for a "setup" script, writing a fresh file with known structure is often cleaner.
    
    # However, to preserve the comments and structure of reference files, we will copy reference and sed replace.
    cp "$template_file" "$target_file"

    # Replacements
    sed -i "s/POSTGRES_PASSWORD=.*$/POSTGRES_PASSWORD=${POSTGRES_PASSWORD}/" "$target_file" || true
    sed -i "s/DATABASE_PASSWORD=.*$/DATABASE_PASSWORD=${POSTGRES_PASSWORD}/" "$target_file" || true
    sed -i "s/DATABASE_USERNAME=.*$/DATABASE_USERNAME=postgres/" "$target_file" || true
    sed -i "s/REDIS_PASSWORD=.*$/REDIS_PASSWORD=${REDIS_PASSWORD}/" "$target_file" || true
    sed -i "s|REDIS_URL=.*$|REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379|g" "$target_file" || true
    
    sed -i "s/JWT_SECRET=.*$/JWT_SECRET=${JWT_SECRET}/" "$target_file" || true
    sed -i "s/ADMIN_JWT_SECRET=.*$/ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}/" "$target_file" || true
    sed -i "s/API_TOKEN_SALT=.*$/API_TOKEN_SALT=${API_TOKEN_SALT}/" "$target_file" || true
    sed -i "s/TRANSFER_TOKEN_SALT=.*$/TRANSFER_TOKEN_SALT=${TRANSFER_TOKEN_SALT}/" "$target_file" || true
    sed -i "s/ENCRYPTION_KEY=.*$/ENCRYPTION_KEY=${ENCRYPTION_KEY}/" "$target_file" || true
    sed -i "s/APP_KEYS=.*$/APP_KEYS=${APP_KEYS}/" "$target_file" || true
    sed -i "s/NEXTAUTH_SECRET=.*$/NEXTAUTH_SECRET=${NEXTAUTH_SECRET}/" "$target_file" || true
    # Nextcloud Admin (Manual Setup)
    # sed -i "s/NEXTCLOUD_ADMIN_PASSWORD=.*$/NEXTCLOUD_ADMIN_PASSWORD=${NC_PWD}/" "$target_file" || true
    # sed -i "s/NEXTCLOUD_ADMIN_USER=.*$/NEXTCLOUD_ADMIN_USER=${NC_USER}/" "$target_file" || true
    
    # Strapi Admin Credentials (Manual Setup now)
    # sed -i "s/STRAPI_ADMIN_EMAIL=.*$/STRAPI_ADMIN_EMAIL=${STRAPI_USER}/" "$target_file" || true
    # sed -i "s/STRAPI_ADMIN_PASSWORD=.*$/STRAPI_ADMIN_PASSWORD=${STRAPI_PWD}/" "$target_file" || true
    # sed -i "s/STRAPI_ADMIN_FIRSTNAME=.*$/STRAPI_ADMIN_FIRSTNAME=Super/" "$target_file" || true
    # sed -i "s/STRAPI_ADMIN_LASTNAME=.*$/STRAPI_ADMIN_LASTNAME=Admin/" "$target_file" || true
    
    # App Admin Credentials (for Strapi seeding fallback or custom var)
    sed -i "s/APP_ADMIN_PASSWORD=.*$/APP_ADMIN_PASSWORD=${APP_PWD}/" "$target_file" || true
    
    # Update Strapi API Token placeholders
    sed -i "s/STRAPI_API_TOKEN=.*$/STRAPI_API_TOKEN=${STRAPI_API_TOKEN_PLACEHOLDER}/" "$target_file" || true

    echo -e "${GREEN}Created $target_file${NC}"
}

# 2. Process Each Service

# Root (Infrastructure)
generate_env_file "Infrastructure" "$PROJECT_ROOT/.env" "$PROJECT_ROOT/.env.reference"

# Strapi
generate_env_file "Strapi CMS" "$PROJECT_ROOT/strapi/.env" "$PROJECT_ROOT/strapi/.env.reference"

# Web
generate_env_file "Web Frontend" "$PROJECT_ROOT/web/.env.local" "$PROJECT_ROOT/web/.env.reference"
# Web uses .env.local, reference says so.

# AI Service
generate_env_file "AI Service" "$PROJECT_ROOT/ai-service/.env" "$PROJECT_ROOT/ai-service/.env.reference"
# Fix DB URL in AI Service to use the generated password
# Default ref: DATABASE_URL=postgresql://strapi:strapi_production_password_change_me@localhost:5432/arkadas_erp
# We need to replace that connection string.
sed -i "s|DATABASE_URL=postgres.*$|DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/arkadas_erp|g" "$PROJECT_ROOT/ai-service/.env"

# Mebbis Service
generate_env_file "Mebbis Service" "$PROJECT_ROOT/mebbis-service/.env" "$PROJECT_ROOT/mebbis-service/.env.reference"

# Mobile
generate_env_file "Mobile App" "$PROJECT_ROOT/mobile/.env" "$PROJECT_ROOT/mobile/.env.reference"


echo -e "\n${GREEN}Success! All environment files generated.${NC}"

echo -e "\n${YELLOW}=== CREDENTIALS SUMMARY ===${NC}"
echo "Use these to login:"
echo "-------------------------------------------------------"
echo -e "1. Strapi Admin Panel:  ${GREEN}http://localhost:1337/admin${NC}"
echo -e "   User:     ${YELLOW}Create on first login${NC}"
echo -e "   Password: ${YELLOW}Create on first login${NC}"
echo ""
echo -e "2. Mobile/Web App:      ${GREEN}http://localhost:3000${NC}"
echo -e "   User:     ${APP_USER_USERNAME}"
echo -e "   Password: ${APP_PWD}"
echo ""
echo -e "3. Nextcloud Admin:     ${GREEN}http://localhost:8080${NC}"
echo -e "   User:     ${YELLOW}Create on first login${NC}"
echo -e "   Password: ${YELLOW}Create on first login${NC}"
echo "-------------------------------------------------------"

echo -e "${YELLOW}IMPORTANT STEPS REMAINING:${NC}"
echo "1. Restart Docker: docker-compose down -v && docker-compose up -d"
echo "2. Restart Strapi: cd strapi && npm run develop"
echo "3. Update 'STRAPI_API_TOKEN' in service envs manually if needed."
