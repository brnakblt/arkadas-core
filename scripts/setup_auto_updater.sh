#!/bin/bash

# ============================================================
# Arkadaş ERP - Setup Auto Updater Cron Job
# Installs a crontab entry to automatically run rolling release
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
UPDATE_SCRIPT="${PROJECT_DIR}/scripts/rolling-release.sh"
CRON_INTERVAL="0 * * * *" # Every hour on the hour

if [ ! -f "$UPDATE_SCRIPT" ]; then
    echo "Error: update script not found at $UPDATE_SCRIPT"
    exit 1
fi

# Ensure it's executable
chmod +x "$UPDATE_SCRIPT"

# Check if already installed
if crontab -l 2>/dev/null | grep -q "$UPDATE_SCRIPT"; then
    echo "Cron job for rolling-release is already installed."
    exit 0
fi

# Add to crontab
(crontab -l 2>/dev/null; echo "$CRON_INTERVAL bash $UPDATE_SCRIPT >> ${PROJECT_DIR}/logs/rolling-release.log 2>&1") | crontab -

echo "Successfully configured auto-updater to run every hour."
echo "Logs will be written to ${PROJECT_DIR}/logs/rolling-release.log"
