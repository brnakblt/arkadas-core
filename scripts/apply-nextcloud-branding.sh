#!/bin/bash
# Apply Arkadas branding to Nextcloud
# This script must be run on the Docker host when containers are up

set -e

# Always run from the project root directory
cd "$(dirname "$0")/../.."

# Wait for nextcloud to be ready
echo "Checking if Nextcloud container is running..."
if ! docker compose ps nextcloud | grep "Up"; then
  echo "Error: Nextcloud container is not running. Please run 'docker compose up -d' first."
  exit 1
fi

echo "Applying Arkadas brand name and color..."
docker compose exec -u www-data nextcloud php occ theming:config name "Arkadas"
docker compose exec -u www-data nextcloud php occ theming:config color "#689F38"

echo "Applying logos..."
# We need to copy the files into the container so occ can read them
docker cp ./arkadas-web/public/icons/logo.svg $(docker compose ps -q nextcloud):/tmp/logo.svg
docker cp ./arkadas-web/public/icons/favicon.svg $(docker compose ps -q nextcloud):/tmp/favicon.svg

docker compose exec -u www-data nextcloud php occ theming:config logo /tmp/logo.svg
docker compose exec -u www-data nextcloud php occ theming:config favicon /tmp/favicon.svg

echo "Cleaning up temporary files..."
docker compose exec nextcloud rm /tmp/logo.svg /tmp/favicon.svg

echo "Nextcloud branding applied successfully! Please hard-refresh your browser."
