#!/bin/bash
# =============================================================================
# Arkadaş ERP - Backup Script
# Creates backups of PostgreSQL, Redis, and uploads
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Parse arguments
BACKUP_TYPE="full"  # full, db, files
COMPRESS=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            BACKUP_TYPE="$2"
            shift 2
            ;;
        --no-compress)
            COMPRESS=false
            shift
            ;;
        --dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -h|--help)
            echo "Arkadaş ERP Backup Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --type <type>     Backup type: full, db, files (default: full)"
            echo "  --no-compress     Skip compression"
            echo "  --dir <path>      Backup directory (default: ./backups)"
            echo "  -h, --help        Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Arkadaş ERP - Backup${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "  Type: ${YELLOW}${BACKUP_TYPE}${NC}"
echo -e "  Timestamp: ${YELLOW}${TIMESTAMP}${NC}"
echo -e "  Directory: ${YELLOW}${BACKUP_DIR}${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"

# PostgreSQL Backup
backup_postgres() {
    echo -e "${GREEN}📦 Backing up PostgreSQL...${NC}"
    
    POSTGRES_BACKUP_FILE="$BACKUP_DIR/postgres_${TIMESTAMP}.sql"
    
    # Check if postgres container is running
    if ! docker ps | grep -q arkadasozelegitim-postgres; then
        echo -e "${RED}❌ PostgreSQL container not running${NC}"
        return 1
    fi
    
    # Dump database
    docker exec arkadasozelegitim-postgres-1 pg_dump \
        -U postgres \
        -d arkadas_erp \
        --no-owner \
        --no-acl \
        > "$POSTGRES_BACKUP_FILE"
    
    if [ "$COMPRESS" = true ]; then
        gzip "$POSTGRES_BACKUP_FILE"
        POSTGRES_BACKUP_FILE="${POSTGRES_BACKUP_FILE}.gz"
    fi
    
    BACKUP_SIZE=$(du -h "$POSTGRES_BACKUP_FILE" | cut -f1)
    echo -e "   ✓ PostgreSQL backup: ${YELLOW}$POSTGRES_BACKUP_FILE${NC} (${BACKUP_SIZE})"
}

# Redis Backup
backup_redis() {
    echo -e "${GREEN}📦 Backing up Redis...${NC}"
    
    REDIS_BACKUP_FILE="$BACKUP_DIR/redis_${TIMESTAMP}.rdb"
    
    # Check if redis container is running
    if ! docker ps | grep -q arkadasozelegitim-redis; then
        echo -e "${RED}❌ Redis container not running${NC}"
        return 1
    fi
    
    # Trigger BGSAVE and copy dump
    docker exec arkadasozelegitim-redis-1 redis-cli -a "${REDIS_PASSWORD:-}" BGSAVE > /dev/null 2>&1
    sleep 2
    
    # Copy the dump file
    docker cp arkadasozelegitim-redis-1:/data/dump.rdb "$REDIS_BACKUP_FILE" 2>/dev/null || {
        echo -e "${YELLOW}   ⚠️ Redis dump not available (AOF mode)${NC}"
        return 0
    }
    
    if [ "$COMPRESS" = true ]; then
        gzip "$REDIS_BACKUP_FILE"
        REDIS_BACKUP_FILE="${REDIS_BACKUP_FILE}.gz"
    fi
    
    BACKUP_SIZE=$(du -h "$REDIS_BACKUP_FILE" | cut -f1)
    echo -e "   ✓ Redis backup: ${YELLOW}$REDIS_BACKUP_FILE${NC} (${BACKUP_SIZE})"
}

# Files Backup (Uploads)
backup_files() {
    echo -e "${GREEN}📦 Backing up uploads...${NC}"
    
    FILES_BACKUP_FILE="$BACKUP_DIR/uploads_${TIMESTAMP}.tar"
    
    if [ -d "strapi/public/uploads" ]; then
        tar -cf "$FILES_BACKUP_FILE" -C strapi/public uploads 2>/dev/null || {
            echo -e "${YELLOW}   ⚠️ No uploads to backup${NC}"
            return 0
        }
        
        if [ "$COMPRESS" = true ]; then
            gzip "$FILES_BACKUP_FILE"
            FILES_BACKUP_FILE="${FILES_BACKUP_FILE}.gz"
        fi
        
        BACKUP_SIZE=$(du -h "$FILES_BACKUP_FILE" | cut -f1)
        echo -e "   ✓ Uploads backup: ${YELLOW}$FILES_BACKUP_FILE${NC} (${BACKUP_SIZE})"
    else
        echo -e "${YELLOW}   ⚠️ No uploads directory found${NC}"
    fi
}

# Nextcloud Data Backup
backup_nextcloud() {
    echo -e "${GREEN}📦 Backing up Nextcloud data...${NC}"
    
    NEXTCLOUD_BACKUP_FILE="$BACKUP_DIR/nextcloud_${TIMESTAMP}.tar"
    
    if [ -d "infra_data/nextcloud" ]; then
        tar -cf "$NEXTCLOUD_BACKUP_FILE" -C infra_data nextcloud 2>/dev/null || {
            echo -e "${YELLOW}   ⚠️ No Nextcloud data to backup${NC}"
            return 0
        }
        
        if [ "$COMPRESS" = true ]; then
            gzip "$NEXTCLOUD_BACKUP_FILE"
            NEXTCLOUD_BACKUP_FILE="${NEXTCLOUD_BACKUP_FILE}.gz"
        fi
        
        BACKUP_SIZE=$(du -h "$NEXTCLOUD_BACKUP_FILE" | cut -f1)
        echo -e "   ✓ Nextcloud backup: ${YELLOW}$NEXTCLOUD_BACKUP_FILE${NC} (${BACKUP_SIZE})"
    else
        echo -e "${YELLOW}   ⚠️ No Nextcloud data directory found${NC}"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    echo -e "\n${GREEN}🧹 Cleaning up old backups (>${RETENTION_DAYS} days)...${NC}"
    
    DELETED_COUNT=$(find "$BACKUP_DIR" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
    
    if [ "$DELETED_COUNT" -gt 0 ]; then
        echo -e "   ✓ Deleted ${DELETED_COUNT} old backup files"
    else
        echo -e "   ✓ No old backups to delete"
    fi
}

# Run backup based on type
case $BACKUP_TYPE in
    full)
        backup_postgres
        backup_redis
        backup_files
        backup_nextcloud
        ;;
    db)
        backup_postgres
        backup_redis
        ;;
    files)
        backup_files
        backup_nextcloud
        ;;
    *)
        echo -e "${RED}Unknown backup type: $BACKUP_TYPE${NC}"
        exit 1
        ;;
esac

# Cleanup
cleanup_old_backups

# Summary
echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Backup Complete ✅${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Backup files saved to: ${YELLOW}$BACKUP_DIR${NC}"
echo -e "To restore, run: ${YELLOW}bash scripts/restore.sh --dir $BACKUP_DIR --timestamp $TIMESTAMP${NC}"
echo ""
