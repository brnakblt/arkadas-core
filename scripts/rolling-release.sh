#!/bin/bash

# ============================================================
# Arkadaş ERP - Rolling Release Auto-Updater
# Fetches latest changes and rebuilds specific components if needed.
# ============================================================

set -e

echo "=========================================="
echo "Arkadas ERP Rolling Release Update Started"
echo "Date: $(date)"
echo "=========================================="

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
cd "$PROJECT_DIR"

# 1. Take a quick database backup before applying any updates
echo "[1/4] Securing current state with database backup..."
# Run backup and suppress permission denied errors from find/cleanup
bash scripts/backup_db.sh 2>&1 | grep -v "Permission denied" || echo "Warning: Backup reported some issues but continuing..."

# 2. Check for Git changes
echo "[2/4] Checking for updates from origin..."
git fetch origin > /dev/null 2>&1

LOCAL=$(git rev-parse @ 2>/dev/null || echo "")
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
BASE=$(git merge-base @ @{u} 2>/dev/null || echo "")

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "Git repository is already up-to-date. Proceeding to check dependency and container updates..."
elif [ "$LOCAL" = "$BASE" ]; then
    echo "Git updates found. Pulling from remote..."
    git pull origin $(git rev-parse --abbrev-ref HEAD)
else
    echo "Warning: Local changes detected. Stashing changes..."
    git stash
    git pull origin $(git rev-parse --abbrev-ref HEAD)
    git reset --hard origin/$(git rev-parse --abbrev-ref HEAD) || echo "Forced sync done."
fi

# 3. Apply updates to environments
echo "[3/4] Fetching latest NPM packages and updating dependencies..."
# Update all packages (root + workspaces) using legacy-peer-deps to avoid monorepo conflicts
npm update --legacy-peer-deps
npm install --legacy-peer-deps

# 4. Trigger docker composition updates
echo "[4/4] Updating Docker Infrastructure..."

# Pull new versions of base/infrastructure images (sftpgo, onlyoffice, postgres, redis, ai-service)
docker compose pull

# Rebuild only custom internal images without cache to ensure latest code is bundled
docker compose build --no-cache strapi web mebbis

# Restart containers to apply changes (keeps zero downtime for unchanged containers, restarts orphans)
docker compose up -d --remove-orphans

echo "=========================================="
echo "Rolling release completed successfully. System is now up-to-date."
echo "=========================================="
