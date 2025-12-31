#!/bin/bash
# ============================================================
# Infisical Secret Sync Script
# ============================================================
# Syncs secrets from Infisical to local .env files
# Run this before starting services in production
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${GREEN}=== Infisical Secret Sync ===${NC}"

# Check if infisical CLI is installed
if ! command -v infisical &> /dev/null; then
    echo -e "${RED}Error: infisical CLI not installed${NC}"
    echo "Install with: curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | sudo -E bash && sudo apt install infisical"
    exit 1
fi

# Check if logged in
if ! infisical user &> /dev/null 2>&1; then
    echo -e "${YELLOW}Not logged in to Infisical. Please login:${NC}"
    infisical login
fi

# Environment selection
ENV="${1:-prod}"
echo -e "Environment: ${YELLOW}${ENV}${NC}"

# Sync secrets
echo -e "\n${GREEN}Syncing secrets from Infisical...${NC}"

# Root .env (Docker Compose infrastructure)
echo -e "  → ${YELLOW}.env${NC} (infrastructure)"
infisical export --env="$ENV" --path="/infrastructure" > .env 2>/dev/null || echo "# No infrastructure secrets found"

# Strapi
echo -e "  → ${YELLOW}strapi/.env${NC}"
infisical export --env="$ENV" --path="/strapi" > strapi/.env 2>/dev/null || echo "# No strapi secrets found" > strapi/.env

# Web
echo -e "  → ${YELLOW}web/.env.local${NC}"
infisical export --env="$ENV" --path="/web" > web/.env.local 2>/dev/null || echo "# No web secrets found" > web/.env.local

# AI Service
echo -e "  → ${YELLOW}ai-service/.env${NC}"
infisical export --env="$ENV" --path="/ai-service" > ai-service/.env 2>/dev/null || echo "# No ai-service secrets found" > ai-service/.env

# MEBBIS Service
echo -e "  → ${YELLOW}mebbis-service/.env${NC}"
infisical export --env="$ENV" --path="/mebbis-service" > mebbis-service/.env 2>/dev/null || echo "# No mebbis-service secrets found" > mebbis-service/.env

# Mobile (optional)

echo -e "\n${GREEN}✅ Secrets synced successfully!${NC}"

# Verify critical secrets
echo -e "\n${YELLOW}Verifying critical secrets...${NC}"

check_var() {
    local file=$1
    local var=$2
    if grep -q "^${var}=" "$file" 2>/dev/null && ! grep -q "^${var}=$" "$file" 2>/dev/null; then
        echo -e "  ✓ ${var} in ${file}"
    else
        echo -e "  ${RED}✗ ${var} missing or empty in ${file}${NC}"
    fi
}

check_var ".env" "POSTGRES_PASSWORD"
check_var "strapi/.env" "APP_KEYS"
check_var "strapi/.env" "JWT_SECRET"
check_var "web/.env.local" "NEXTAUTH_SECRET"
check_var "ai-service/.env" "STRAPI_API_TOKEN"
check_var "mebbis-service/.env" "STRAPI_API_TOKEN"

echo -e "\n${GREEN}Done!${NC}"
echo -e "You can now start services with: ${YELLOW}docker compose -f docker-compose.prod.yml up -d${NC}"
