#!/bin/bash
# =============================================================================
# Arkadaş ERP - Restore Script
# Restores backups of PostgreSQL, Redis, and uploads
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=""
RESTORE_TYPE="full"

while [[ $# -gt 0 ]]; do
    case $1 in
        --timestamp)
            TIMESTAMP="$2"
            shift 2
            ;;
        --type)
            RESTORE_TYPE="$2"
            shift 2
            ;;
        --dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --list)
            echo "Available backups in $BACKUP_DIR:"
            ls -la "$BACKUP_DIR"/*.gz 2>/dev/null | awk '{print $NF}' | xargs -I{} basename {} | sort -r | head -20
            exit 0
            ;;
        -h|--help)
            echo "Arkadaş ERP Restore Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --timestamp <ts>  Restore from specific timestamp (e.g., 20260121_120000)"
            echo "  --type <type>     Restore type: full, db, files (default: full)"
            echo "  --dir <path>      Backup directory (default: ./backups)"
            echo "  --list            List available backups"
            echo "  -h, --help        Show this help"
            echo ""
            echo "Example:"
            echo "  $0 --timestamp 20260121_120000 --type db"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [ -z "$TIMESTAMP" ]; then
    echo -e "${RED}Error: --timestamp is required${NC}"
    echo "Use --list to see available backups"
    exit 1
fi

echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Arkadaş ERP - Restore${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "  Type: ${YELLOW}${RESTORE_TYPE}${NC}"
echo -e "  Timestamp: ${YELLOW}${TIMESTAMP}${NC}"
echo -e "  Directory: ${YELLOW}${BACKUP_DIR}${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"

echo -e "${RED}⚠️  WARNING: This will overwrite existing data!${NC}"
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# PostgreSQL Restore
restore_postgres() {
    echo -e "${GREEN}📦 Restoring PostgreSQL...${NC}"
    
    POSTGRES_BACKUP_FILE="$BACKUP_DIR/postgres_${TIMESTAMP}.sql.gz"
    
    if [ ! -f "$POSTGRES_BACKUP_FILE" ]; then
        POSTGRES_BACKUP_FILE="$BACKUP_DIR/postgres_${TIMESTAMP}.sql"
        if [ ! -f "$POSTGRES_BACKUP_FILE" ]; then
            echo -e "${RED}❌ PostgreSQL backup not found: $POSTGRES_BACKUP_FILE${NC}"
            return 1
        fi
    fi
    
    # Check if postgres container is running
    if ! docker ps | grep -q arkadasozelegitim-postgres; then
        echo -e "${RED}❌ PostgreSQL container not running. Start with: docker compose up -d postgres${NC}"
        return 1
    fi
    
    # Restore database
    if [[ "$POSTGRES_BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$POSTGRES_BACKUP_FILE" | docker exec -i arkadasozelegitim-postgres-1 psql -U postgres -d arkadas_erp
    else
        docker exec -i arkadasozelegitim-postgres-1 psql -U postgres -d arkadas_erp < "$POSTGRES_BACKUP_FILE"
    fi
    
    echo -e "   ✓ PostgreSQL restored from: ${YELLOW}$POSTGRES_BACKUP_FILE${NC}"
}

# Redis Restore
restore_redis() {
    echo -e "${GREEN}📦 Restoring Redis...${NC}"
    
    REDIS_BACKUP_FILE="$BACKUP_DIR/redis_${TIMESTAMP}.rdb.gz"
    
    if [ ! -f "$REDIS_BACKUP_FILE" ]; then
        REDIS_BACKUP_FILE="$BACKUP_DIR/redis_${TIMESTAMP}.rdb"
        if [ ! -f "$REDIS_BACKUP_FILE" ]; then
            echo -e "${YELLOW}⚠️ Redis backup not found, skipping${NC}"
            return 0
        fi
    fi
    
    # Stop redis, restore, restart
    docker stop arkadasozelegitim-redis-1 2>/dev/null || true
    
    if [[ "$REDIS_BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$REDIS_BACKUP_FILE" > infra_data/redis/dump.rdb
    else
        cp "$REDIS_BACKUP_FILE" infra_data/redis/dump.rdb
    fi
    
    docker start arkadasozelegitim-redis-1
    
    echo -e "   ✓ Redis restored from: ${YELLOW}$REDIS_BACKUP_FILE${NC}"
}

# Files Restore
restore_files() {
    echo -e "${GREEN}📦 Restoring uploads...${NC}"
    
    FILES_BACKUP_FILE="$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
    
    if [ ! -f "$FILES_BACKUP_FILE" ]; then
        FILES_BACKUP_FILE="$BACKUP_DIR/uploads_${TIMESTAMP}.tar"
        if [ ! -f "$FILES_BACKUP_FILE" ]; then
            echo -e "${YELLOW}⚠️ Uploads backup not found, skipping${NC}"
            return 0
        fi
    fi
    
    # Restore uploads
    mkdir -p strapi/public
    
    if [[ "$FILES_BACKUP_FILE" == *.gz ]]; then
        tar -xzf "$FILES_BACKUP_FILE" -C strapi/public
    else
        tar -xf "$FILES_BACKUP_FILE" -C strapi/public
    fi
    
    echo -e "   ✓ Uploads restored from: ${YELLOW}$FILES_BACKUP_FILE${NC}"
}

# SFTPGo Restore
restore_sftpgo() {
    echo -e "${GREEN}📦 Restoring SFTPGo...${NC}"
    
    SFTPGO_BACKUP_FILE="$BACKUP_DIR/sftpgo_${TIMESTAMP}.tar.gz"
    
    if [ ! -f "$SFTPGO_BACKUP_FILE" ]; then
        SFTPGO_BACKUP_FILE="$BACKUP_DIR/sftpgo_${TIMESTAMP}.tar"
        if [ ! -f "$SFTPGO_BACKUP_FILE" ]; then
            echo -e "${YELLOW}⚠️ SFTPGo backup not found, skipping${NC}"
            return 0
        fi
    fi
    
    # Stop SFTPGo, restore, restart
    docker stop arkadasozelegitim-sftpgo-1 2>/dev/null || true
    
    if [[ "$SFTPGO_BACKUP_FILE" == *.gz ]]; then
        tar -xzf "$SFTPGO_BACKUP_FILE" -C infra_data
    else
        tar -xf "$SFTPGO_BACKUP_FILE" -C infra_data
    fi
    
    docker start arkadasozelegitim-sftpgo-1
    
    echo -e "   ✓ SFTPGo restored from: ${YELLOW}$SFTPGO_BACKUP_FILE${NC}"
}

# Run restore based on type
case $RESTORE_TYPE in
    full)
        restore_postgres
        restore_redis
        restore_files
        restore_sftpgo
        ;;
    db)
        restore_postgres
        restore_redis
        ;;
    files)
        restore_files
        restore_sftpgo
        ;;
    *)
        echo -e "${RED}Unknown restore type: $RESTORE_TYPE${NC}"
        exit 1
        ;;
esac

echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Restore Complete ✅${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "You may need to restart services: ${YELLOW}docker compose restart${NC}"
echo ""
