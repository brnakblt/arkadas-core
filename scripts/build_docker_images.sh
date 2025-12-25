#!/bin/bash
set -e

# Configuration
# Default registry (local). Change to e.g., "registry.digitalocean.com/my-project" for remote.
REGISTRY="" 
PREFIX="arkadas-"

# Get Git Hash
if ! command -v git &> /dev/null; then
    echo "❌ git not found. Using 'latest' as tag."
    TAG="latest"
else
    TAG=$(git rev-parse --short HEAD)
fi

echo "🚀 Building Docker Images with tag: $TAG"

# Services to build
SERVICES=("strapi" "web" "ai-service" "mebbis-service")

for SERVICE in "${SERVICES[@]}"; do
    IMAGE_NAME="${PREFIX}${SERVICE}"
    FULL_IMAGE_NAME="${REGISTRY}${IMAGE_NAME}"
    
    echo "----------------------------------------"
    echo "📦 Building $SERVICE ($FULL_IMAGE_NAME)..."
    echo "----------------------------------------"
    
    # Build
    docker build -t "$FULL_IMAGE_NAME:latest" -t "$FULL_IMAGE_NAME:$TAG" ./$SERVICE
    
    # Verify
    if [ $? -eq 0 ]; then
        echo "✅ Built $SERVICE:$TAG"
    else
        echo "❌ Failed to build $SERVICE"
        exit 1
    fi
done

echo ""
echo "📝 Updating .env.docker with IMAGE_TAG=$TAG"
echo "IMAGE_TAG=$TAG" > .env.docker

echo ""
echo "🎉 Build Complete!"
echo "Run 'docker compose -f docker-compose.prod.yml up -d' (ensure compose uses \${IMAGE_TAG})"
