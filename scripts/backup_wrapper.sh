#!/bin/bash
echo "Starting backup job at $(date)"
cd /app
if [ -f "scripts/backup.sh" ]; then
    bash scripts/backup.sh --type full
    
    # Restic Backup
    if [ -n "$RESTIC_REPOSITORY" ]; then
        echo "Starting Restic backup..."
        # Init if not exists (check by listing snapshots, if fails, init)
        if ! restic snapshots > /dev/null 2>&1; then
            echo "Initializing Restic repository..."
            restic init
        fi
        
        restic backup ./backups --tag scheduled
        echo "Restic backup complete."
        
        # Prune old snapshots
        restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
    fi
else
    echo "Error: backup.sh not found!"
fi
echo "Job finished at $(date)"
