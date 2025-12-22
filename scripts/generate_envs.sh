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

# 1. Generate Master Secrets
echo "Generating secure secrets..."
POSTGRES_PASSWORD=$(generate_secret)
REDIS_PASSWORD=$(generate_secret)
JWT_SECRET=$(generate_secret)
ADMIN_JWT_SECRET=$(generate_secret)
API_TOKEN_SALT=$(generate_secret)
TRANSFER_TOKEN_SALT=$(generate_secret)
APP_KEYS="$(generate_secret),$(generate_secret),$(generate_secret),$(generate_secret)"
NEXTAUTH_SECRET=$(generate_secret)
NEXTCLOUD_PASSWORD=$(generate_secret)
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
    sed -i "s/REDIS_PASSWORD=.*$/REDIS_PASSWORD=${REDIS_PASSWORD}/" "$target_file" || true
    sed -i "s|REDIS_URL=.*$|REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379|g" "$target_file" || true
    # Fix for docker internal redis url if needed (usually just host)
    
    sed -i "s/JWT_SECRET=.*$/JWT_SECRET=${JWT_SECRET}/" "$target_file" || true
    sed -i "s/ADMIN_JWT_SECRET=.*$/ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}/" "$target_file" || true
    sed -i "s/API_TOKEN_SALT=.*$/API_TOKEN_SALT=${API_TOKEN_SALT}/" "$target_file" || true
    sed -i "s/TRANSFER_TOKEN_SALT=.*$/TRANSFER_TOKEN_SALT=${TRANSFER_TOKEN_SALT}/" "$target_file" || true
    sed -i "s/APP_KEYS=.*$/APP_KEYS=${APP_KEYS}/" "$target_file" || true
    sed -i "s/NEXTAUTH_SECRET=.*$/NEXTAUTH_SECRET=${NEXTAUTH_SECRET}/" "$target_file" || true
    sed -i "s/NEXTCLOUD_ADMIN_PASSWORD=.*$/NEXTCLOUD_ADMIN_PASSWORD=${NEXTCLOUD_PASSWORD}/" "$target_file" || true
    
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
echo -e "${YELLOW}IMPORTANT STEPS REMAINING:${NC}"
echo "1. Start Strapi and generate a permanent API Token."
echo "2. Update 'STRAPI_API_TOKEN' in ai-service/.env and mebbis-service/.env with that token."
echo "3. Review web/.env.local and populate external API keys (Google Maps, etc.)."
echo "4. Review mobile/.env and set the IP address if testing on physical device."
