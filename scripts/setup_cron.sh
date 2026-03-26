#!/bin/bash
# =============================================================================
# Arkadaş ERP - Cron Setup Script
# Adds a nightly backup cron job
# =============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT=$(pwd)
BACKUP_SCRIPT="$PROJECT_ROOT/scripts/backup.sh"
LOG_FILE="$PROJECT_ROOT/backups/backup.log"

if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "Error: Backup script not found at $BACKUP_SCRIPT"
    exit 1
fi

chmod +x "$BACKUP_SCRIPT"
mkdir -p "$PROJECT_ROOT/backups"

# Backup command: Every day at 3:00 AM
CRON_JOB_BACKUP="0 3 * * * cd $PROJECT_ROOT && bash scripts/backup.sh >> $PROJECT_ROOT/backups/backup.log 2>&1"

# Storage Maintenance: Every 1st of the month at 4:00 AM
CRON_JOB_MAINTENANCE="0 4 1 * * cd $PROJECT_ROOT && bash scripts/storage_maintenance.sh >> $PROJECT_ROOT/logs/storage_maintenance.log 2>&1"

echo -e "${BLUE}Configuring cron jobs...${NC}"

# Check if jobs already exist
(crontab -l 2>/dev/null | grep -F "scripts/backup.sh") && echo "Backup cron job already exists."
(crontab -l 2>/dev/null | grep -F "scripts/storage_maintenance.sh") && echo "Storage maintenance cron job already exists."

# Add jobs
(crontab -l 2>/dev/null | grep -v "scripts/backup.sh" | grep -v "scripts/storage_maintenance.sh"; echo "$CRON_JOB_BACKUP"; echo "$CRON_JOB_MAINTENANCE") | crontab -

echo -e "${GREEN}✓ Cron jobs configured:${NC}"
echo -e "  Backup: Daily at 03:00"
echo -e "  Storage Maintenance: Monthly at 04:00 on day 1"
