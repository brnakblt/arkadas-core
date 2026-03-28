#!/bin/bash
# =============================================================================
# Arkadaş ERP - Project Reset Script (Secure Secret Management Mode)
# =============================================================================
# Wipes all data and seeds a fresh development environment.
#
# KEY IMPROVEMENTS:
#   1. Aggressive Docker-based wipe of root-owned volumes.
#   2. Idempotent SFTPGo admin setup via environment variables.
#   3. Secure secret management via scripts/generate_envs.sh and Infisical.
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Default Admin Configuration
DEFAULT_ADMIN_EMAIL="barannakblut@gmail.com"

echo -e "${RED}!!! WARNING: THIS WILL WIPE ALL DATA !!!${NC}"
echo -e "${RED}* Database (PostgreSQL, Redis) will be reset${NC}"
echo -e "${RED}* Environment files will be regenerated${NC}"
echo -e "${RED}* All uploads will be deleted${NC}"
echo "-------------------------------------------------------"
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Pre-flight: Docker must be running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running.${NC}"
    exit 1
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Arkadaş ERP - Full Reset${NC}"
echo -e "${BLUE}========================================${NC}"

# =====================================================================
# PHASE 1: TEAR DOWN
# =====================================================================

echo -e "\n${YELLOW}1. Stopping ALL Docker resources...${NC}"
docker compose down --volumes --remove-orphans 2>/dev/null || true
docker volume prune -f 2>/dev/null || true

echo -e "\n${YELLOW}2. Killing processes on dev ports...${NC}"
for port in 5432 6380 1337 3000 8088 8089 9980; do
    fuser -k -n tcp "$port" 2>/dev/null || true
done
sleep 1

echo -e "\n${YELLOW}3. Nuclear wipe of infra_data...${NC}"
# Mount current dir and wipe infra_data completely as root
docker run --rm -v "$(pwd):/app" alpine rm -rf /app/infra_data || true
sleep 2
echo "   ✓ infra_data wipe attempt complete"

# =====================================================================
# PHASE 2: GENERATE ENVIRONMENT (Secure & Dynamic)
# =====================================================================

echo -e "\n${YELLOW}4. Creating fresh infra_data directories...${NC}"
mkdir -p infra_data/postgres infra_data/redis
mkdir -p infra_data/sftpgo/data infra_data/sftpgo/config
chmod -R 777 infra_data

echo -e "\n${YELLOW}5. Generating secure environment variables...${NC}"
export AUTO_CONFIRM=true
export STRAPI_ADMIN_EMAIL="${DEFAULT_ADMIN_EMAIL}"
export SFTPGO_ADMIN_USER="${DEFAULT_ADMIN_EMAIL}"
bash scripts/generate_envs.sh

# Sync to Infisical if authenticated
if command -v infisical &> /dev/null && [ -f ".infisical.json" ]; then
    echo -e "${YELLOW}   Syncing secrets to Infisical...${NC}"
    # Check if logged in before attempting sync
    if infisical whoami &>/dev/null; then
        bash scripts/setup_infisical.sh || echo "   ⚠️ Infisical sync failed"
    else
        echo "   ⚠️ Infisical not authenticated. Skipping sync. Please run 'infisical login'."
    fi
fi

# Load variables from generated .env for subsequent readiness checks
SFTPGO_ADMIN_PASSWORD=$(grep SFTPGO_ADMIN_PASSWORD strapi/.env | cut -d= -f2)
SFTPGO_ADMIN_USER=$(grep SFTPGO_ADMIN_USER strapi/.env | cut -d= -f2)
POSTGRES_PASSWORD=$(grep DATABASE_PASSWORD strapi/.env | cut -d= -f2)

# =====================================================================
# PHASE 3: START INFRASTRUCTURE
# =====================================================================

echo -e "\n${YELLOW}6. Starting infrastructure containers...${NC}"
docker compose up -d postgres redis sftpgo --wait

echo -e "\n${YELLOW}7. Waiting for PostgreSQL to accept connections...${NC}"
MAX_PG_RETRIES=30
PG_COUNT=0
while [ $PG_COUNT -lt $MAX_PG_RETRIES ]; do
    docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1 && { echo "   ✓ PostgreSQL is ready"; break; }
    echo "   ...waiting for PostgreSQL ($PG_COUNT/$MAX_PG_RETRIES)..."
    sleep 2
    PG_COUNT=$((PG_COUNT + 1))
done

# Settle time after health check to avoid race conditions
sleep 10

if [ $PG_COUNT -eq $MAX_PG_RETRIES ]; then
    echo -e "${RED}FATAL: PostgreSQL did not become ready in 60s${NC}"
    exit 1
fi

echo -e "\n${YELLOW}8. Waiting for SFTPGo to be ready...${NC}"
MAX_SFTP_RETRIES=20
SFTP_COUNT=0
while [ $SFTP_COUNT -lt $MAX_SFTP_RETRIES ]; do
    AUTH_HEADER=$(echo -n "${SFTPGO_ADMIN_USER}:${SFTPGO_ADMIN_PASSWORD}" | base64)
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Basic ${AUTH_HEADER}" \
        http://localhost:8088/api/v2/token 2>/dev/null || echo "000")

    if [ "$HTTP_STATUS" == "200" ]; then
        echo "   ✓ SFTPGo authenticated successfully"
        break
    elif [ "$HTTP_STATUS" == "401" ]; then
        echo "   ...SFTPGo returned 401 (initializing admin, retrying)..."
    else
        echo "   ...SFTPGo not reachable (HTTP $HTTP_STATUS) [$SFTP_COUNT/$MAX_SFTP_RETRIES]..."
    fi

    sleep 3
    SFTP_COUNT=$((SFTP_COUNT + 1))
done

# =====================================================================
# PHASE 4: BUILD & SEED
# =====================================================================

echo -e "\n${YELLOW}9. Cleaning Strapi cache...${NC}"
rm -rf strapi/.tmp strapi/dist strapi/build strapi/.cache
rm -rf strapi/public/uploads/*
mkdir -p strapi/public/uploads
chmod 755 strapi/public/uploads

echo -e "\n${YELLOW}10. Building Strapi (on host)...${NC}"
npm run build --prefix strapi

echo -e "\n${YELLOW}11. Seeding database (on host)...${NC}"
(cd strapi && node scripts/seed.js) || {
    echo -e "${RED}Seed failed. Checking logs...${NC}"
    docker compose logs postgres --tail 30
    exit 1
}

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  RESET & SEED COMPLETE ✅${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Next steps: Run ${YELLOW}npm run dev${NC} to start the system."
echo ""
