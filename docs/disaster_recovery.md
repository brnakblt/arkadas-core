# Disaster Recovery Guide

This document outlines the procedures for restoring the system in case of data loss or corruption.

## 1. Database Restoration

### Prerequisites
-   A valid backup file (e.g., `backups/backup_2025-12-22.sql.gz`).
-   Docker containers running (specifically Postgres).

### Steps to Restore

1.  **Stop Application Services**:
    Prevent new data being written during restore.
    ```bash
    docker-compose -f docker-compose.prod.yml stop web strapi mebbis-service ai-service
    ```

2.  **Unzip the Backup**:
    ```bash
    gunzip -k backups/backup_YYYY-MM-DD.sql.gz
    ```
    *(This creates a `.sql` file)*

3.  **Drop & Recreate Database** (Optional but Recommended for Clean Restore):
    > [!WARNING]
    > This will delete all current data!
    ```bash
    docker exec -it arkadasozelegitim-postgres-1 dropdb -U postgres arkadas_erp
    docker exec -it arkadasozelegitim-postgres-1 createdb -U postgres arkadas_erp
    ```

4.  **Import Data**:
    ```bash
    cat backups/backup_YYYY-MM-DD.sql | docker exec -i arkadasozelegitim-postgres-1 psql -U postgres -d arkadas_erp
    ```

5.  **Restart Services**:
    ```bash
    docker-compose -f docker-compose.prod.yml start
    ```

## 2. Full System Recovery (Coolify)
If the entire server is lost:
1.  Provision a new VPS using `setup_ubuntu_server.sh`.
2.  Install Coolify.
3.  Connect your Git repository.
4.  Inject Environment Variables (retrieve from your password manager).
5.  Restore the latest database backup (if you have offsite backups).
