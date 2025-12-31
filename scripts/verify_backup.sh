#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

BACKUP_SCRIPT="./scripts/backup_db.sh"
TEMP_CONTAINER="verify_restore_db"
RESTORE_TIMEOUT=60

echo -e "${GREEN}Starting Backup Verification Process...${NC}"

# 1. Run Backup
echo "Step 1: Creating a fresh backup..."
if [ -f "$BACKUP_SCRIPT" ]; then
    bash "$BACKUP_SCRIPT"
else
    echo -e "${RED}Error: Backup script not found at $BACKUP_SCRIPT${NC}"
    exit 1
fi

# Find the latest backup
LATEST_BACKUP=$(ls -t ./backups/backup_*.sql.gz | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}Error: No backup file generated.${NC}"
    exit 1
fi

echo -e "Latest backup found: ${GREEN}$LATEST_BACKUP${NC}"

# 2. Start Temporary DB Container
echo "Step 2: Starting temporary Postgres container..."
# Remove if exists
docker rm -f $TEMP_CONTAINER || true

docker run -d --name $TEMP_CONTAINER \
    -e POSTGRES_PASSWORD=verify_secret \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_DB=arkadas_verify \
    postgres:16-alpine

# Wait for DB to be ready
echo "Waiting for temporary DB to initialize..."
sleep 5

# 3. Restore Backup
echo "Step 3: Restoring backup to temporary DB..."
zcat "$LATEST_BACKUP" | docker exec -i $TEMP_CONTAINER psql -U postgres -d arkadas_verify

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Restore command executed successfully.${NC}"
else
    echo -e "${RED}Restore failed.${NC}"
    docker rm -f $TEMP_CONTAINER
    exit 1
fi

# 4. Verify Data (Simple Check)
echo "Step 4: Verifying data integrity..."

# Check if tables exist (e.g., 'up_users' which is 'users-permissions_user' in Strapi usually, or just check public schema tables count)
TABLE_COUNT=$(docker exec $TEMP_CONTAINER psql -U postgres -d arkadas_verify -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
TABLE_COUNT=$(echo "$TABLE_COUNT" | xargs) # trim whitespace

echo "Found $TABLE_COUNT tables in restored database."

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Verification SUCCESS: Database restored with tables.${NC}"
else
    echo -e "${RED}❌ Verification FAILED: Restored database is empty.${NC}"
    docker rm -f $TEMP_CONTAINER
    exit 1
fi

# 5. Cleanup
echo "Step 5: Cleaning up..."
docker rm -f $TEMP_CONTAINER
echo -e "${GREEN}Done.${NC}"
