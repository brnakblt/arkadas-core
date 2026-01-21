#!/bin/bash

echo "☢️  WARNING: THIS WILL DELETE ALL DOCKER CONTAINERS, IMAGES, VOLUMES, AND NETWORKS."
echo "   This action is irreversible."
echo ""
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled."
    exit 1
fi

echo ""
echo "🛑 Stopping all running containers..."
if [ -n "$(docker ps -aq)" ]; then
    docker stop $(docker ps -aq)
else
    echo "   No running containers."
fi

echo ""
echo "🗑️  Removing all containers..."
if [ -n "$(docker ps -aq)" ]; then
    docker rm $(docker ps -aq)
else
    echo "   No containers to remove."
fi

echo ""
echo "🧹 Pruning System (Volumes, Networks, Images)..."
# -a: Remove all unused images not just dangling ones
# --volumes: Prune volumes
# -f: Force without confirmation
docker system prune -a --volumes -f

echo ""
echo "✨ Docker environment has been nuked successfully."
echo "👉 Run 'docker-compose up --build' to start fresh."
