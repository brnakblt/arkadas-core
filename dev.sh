#!/bin/bash

# Development Helper Script
# Usage: ./dev.sh [up|down|build|logs]

# Detect Docker Compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    DOCKER_COMPOSE_CMD="docker compose"
fi

COMMAND=${1:-up}

case $COMMAND in
  up)
    echo "Starting development environment..."
    $DOCKER_COMPOSE_CMD up
    ;;
  down)
    echo "Stopping environment..."
    $DOCKER_COMPOSE_CMD down
    ;;
  build)
    echo "Rebuilding images..."
    $DOCKER_COMPOSE_CMD build
    ;;
  logs)
    $DOCKER_COMPOSE_CMD logs -f
    ;;
  help|*)
    echo "Usage: ./dev.sh [up|down|build|logs]"
    echo "  up    : Start the system (default)"
    echo "  down  : Stop the system"
    echo "  build : Rebuild images (after adding dependencies)"
    echo "  logs  : View live logs"
    ;;
esac
