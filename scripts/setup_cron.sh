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
CRON_JOB="0 3 * * * cd $PROJECT_ROOT && bash scripts/backup.sh >> $LOG_FILE 2>&1"

echo -e "${BLUE}Configuring backup cron job...${NC}"

# Check if job already exists
(crontab -l 2>/dev/null | grep -F "$BACKUP_SCRIPT") && echo "Cron job already exists." && exit 0

# Add job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo -e "${GREEN}✓ Backup cron job added:${NC}"
echo -e "  $CRON_JOB"
echo -e "  Log file: $LOG_FILE"
