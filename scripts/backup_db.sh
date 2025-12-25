#!/bin/bash
set -e

# Configuration
BACKUP_DIR="./backups"
CONTAINER_NAME="arkadasozelegitim-postgres-1" # Check your actual container name via 'docker ps'
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-arkadas_erp}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
RETENTION_DAYS=7

# S3 Configuration (Optional)
# Set these in your environment or .env file
# S3_BUCKET="my-backup-bucket"
# S3_ENDPOINT="https://s3.eu-central-1.amazonaws.com" # Required for non-AWS (MinIO, DO Spaces)
# AWS_ACCESS_KEY_ID="xxx"
# AWS_SECRET_ACCESS_KEY="xxx"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "Starting backup for database: $DB_NAME..."

# Check if container is running
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    # Dump and compress
    docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME | gzip > "$FILENAME"
    
    if [ -f "$FILENAME" ]; then
        echo "✅ Backup success: $FILENAME"
        du -h "$FILENAME"

        # S3 Upload
        if [ -n "$S3_BUCKET" ]; then
            echo "Uploading to S3 bucket: $S3_BUCKET..."
            if command -v aws &> /dev/null; then
                # Construct AWS args
                AWS_ARGS="s3 cp $FILENAME s3://$S3_BUCKET/$(basename $FILENAME)"
                if [ -n "$S3_ENDPOINT" ]; then
                    AWS_ARGS="$AWS_ARGS --endpoint-url $S3_ENDPOINT"
                fi
                
                # Run upload
                $AWS_ARGS
                
                if [ $? -eq 0 ]; then
                    echo "✅ S3 Upload success"
                else
                    echo "❌ S3 Upload failed"
                fi
            else
                echo "⚠️  aws-cli not found, skipping S3 upload."
            fi
        fi
    else
        echo "❌ Backup failed: File not created."
        exit 1
    fi
else
    echo "❌ Container $CONTAINER_NAME is not running!"
    exit 1
fi

# Cleanup old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Done."
