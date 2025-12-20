#!/bin/bash
# Fix ownership for bind-mounted database directories
# Run with sudo

set -e

echo "Fixing database structure permissions..."

# Create directories if they don't exist
mkdir -p databases/onlyoffice/data/certs
mkdir -p databases/onlyoffice/data/cache
mkdir -p databases/onlyoffice/data/files
mkdir -p databases/onlyoffice/log
mkdir -p databases/onlyoffice/lib
mkdir -p databases/onlyoffice/db

# Postgres
echo "Setting Postgres permissions..."
chown -R 70:70 databases/postgres
chown -R 70:70 databases/onlyoffice/db

# Nextcloud (33:33 www-data)
echo "Setting Nextcloud permissions..."
# Ensure base dir exists and is owned by 33:33
chown -R 33:33 databases/nextcloud
# Fix commonly problematic subdirs if they exist
if [ -d "databases/nextcloud/apps" ]; then
    chown -R 33:33 databases/nextcloud/apps
fi
if [ -d "databases/nextcloud/config" ]; then
    chown -R 33:33 databases/nextcloud/config
fi
if [ -d "databases/nextcloud/data" ]; then
    chown -R 33:33 databases/nextcloud/data
fi

# MariaDB (999)
echo "Setting MariaDB permissions..."
chown -R 999:999 databases/nextcloud_db

# Redis (999)
echo "Setting Redis permissions..."
chown -R 999:999 databases/redis

# n8n (1000:1000 node)
echo "Setting n8n permissions..."
chown -R 1000:1000 databases/n8n

# OnlyOffice (101:101 ds)
echo "Setting OnlyOffice permissions..."
chown -R 101:101 databases/onlyoffice/data
chown -R 101:101 databases/onlyoffice/log
chown -R 101:101 databases/onlyoffice/lib

echo "Permissions updated. You may need to restart containers."
