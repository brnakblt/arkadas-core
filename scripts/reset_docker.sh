#!/bin/bash
# Reset Docker Environment for Arkadaş Özel Eğitim ERP

echo "⚠️  WARNING: This will stop all project containers and DELETE all project volumes and networks."
echo "   Images tagged 'local' or built by compose will also be removed."
echo "   Data in ./databases/ will be preserved on filesystem but Docker volumes will be gone."
echo ""
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo "🛑 Stopping containers..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml down --remove-orphans

echo "🧹 Pruning project volumes and networks..."
# This removes volumes defined in the compose files
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v

echo "🗑️  Removing project-specific images..."
# Remove images built by this project (web, strapi, etc.)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down --rmi local

echo "🔥 Forcefully removing remaining 'arkadas-*' images..."
docker images --format "{{.Repository}}:{{.Tag}}" | grep "^arkadas-" | xargs -r docker rmi -f

echo "🧹 Pruning dangling images..."
docker image prune -f

echo "✨ Cleanup complete. You can now start fresh with 'npm run dev:docker'."
