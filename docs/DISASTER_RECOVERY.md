# Disaster Recovery Guide

This guide outlines the procedures for recovering the Arkadaş Özel Eğitim ERP system in the event of data loss or server failure.

## 1. Backups

### Automatic Backups
- **Database**: The script `scripts/backup_db.sh` runs nightly (via cron) to dump the PostgreSQL database.
- **Location**:
  - Local: `./backups/` directory on the server.
  - Remote: S3 Bucket (if configured).

### Manual Backups
To trigger a manual backup:
```bash
./scripts/backup_db.sh
```

## 2. Restore Procedures

### Scenario A: Restoring from Local Backup
If the server is healthy but data is corrupted:

1.  **Stop Services**:
    ```bash
    docker compose -f docker-compose.prod.yml stop strapi web ai-service mebbis-service
    # Keep postgres running
    ```

2.  **Locate Backup**: Find the latest `.sql.gz` file in `./backups/`.

3.  **Restore Command**:
    ```bash
    # Decompress first
    gunzip -c ./backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz > restore.sql
    
    # Drop existing connections (Optional but recommended)
    # docker exec -it arkadasozelegitim-postgres-1 psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'arkadas_erp';"

    # Import
    cat restore.sql | docker exec -i arkadasozelegitim-postgres-1 psql -U postgres -d arkadas_erp
    ```

4.  **Restart Services**:
    ```bash
    docker compose -f docker-compose.prod.yml start
    ```

### Scenario B: Restoring from S3 (Total Server Loss)
If the server is gone and you are setting up a fresh one:

1.  **Server Setup**: Follow `setup_ubuntu_server.sh` to install dependencies and containers.
2.  **Download Backup**:
    ```bash
    export AWS_ACCESS_KEY_ID=your_key
    export AWS_SECRET_ACCESS_KEY=your_secret
    # Use --endpoint-url if using MinIO/DigitalOcean
    aws s3 cp s3://your-bucket/backup_LATEST.sql.gz ./restore.sql.gz
    ```
3.  **Restore**: Follow Scenario A steps starting from decompression.

## 3. "Break Glass" Procedure
In case of critical failures where automation fails:
1.  **Access Database Directly**:
    ```bash
    docker exec -it arkadasozelegitim-postgres-1 psql -U postgres
    ```
2.  **Check Volume Data**:
    Data is persisted in `./databases/postgres`. If the container is broken but files exist, you can mount this volume to a new container.
