#!/bin/bash

# Enhanced Rebranding Script: Nextcloud -> Arkadaş (Unicode & UTF-16 Aware)

# 1. iOS Strings (Handle UTF-16 and UTF-8)
echo "Rebranding iOS files..."
find arkadas-ios -type f \( -name "*.strings" -o -name "*.swift" -o -name "*.plist" \) -exec perl -i -pe 's/Nextcloud/Arkadaş/g' {} +
find arkadas-ios -type f \( -name "*.strings" -o -name "*.swift" -o -name "*.plist" \) -exec perl -i -pe 's/nextcloud/arkadaş/g' {} +

# 2. Android XML & Kotlin
echo "Rebranding Android files..."
find arkadas-android -type f \( -name "*.xml" -o -name "*.kt" -o -name "*.java" -o -name "*.gradle*" \) -exec perl -i -pe 's/Nextcloud/Arkadaş/g' {} +
find arkadas-android -type f \( -name "*.xml" -o -name "*.kt" -o -name "*.java" -o -name "*.gradle*" \) -exec perl -i -pe 's/nextcloud/arkadaş/g' {} +

# 3. Web UI & Scripts
echo "Rebranding Web files..."
find arkadas-web -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.cjs" -o -name "*.css" \) -exec perl -i -pe 's/Nextcloud/Arkadaş/g' {} +
find arkadas-web -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.cjs" -o -name "*.css" \) -exec perl -i -pe 's/nextcloud/arkadaş/g' {} +

# 4. Infrastructure
echo "Rebranding Infra files..."
find arkadas-core -type f \( -name "Makefile" -o -name "docker-compose.yml" -o -name "*.md" -o -name ".env.reference" \) -exec perl -i -pe 's/Nextcloud/Arkadaş/g' {} +

echo "Rebranding complete!"
