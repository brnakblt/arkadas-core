#!/bin/bash
set -e

USER_NAME=$(whoami)
echo "Checking docker group for user $USER_NAME..."

# Ensure group exists and user is in it
if groups $USER_NAME | grep &>/dev/null 'docker'; then
    echo "User $USER_NAME is ALREADY in the 'docker' group."
else
    echo "Adding $USER_NAME to 'docker' group..."
    sudo usermod -aG docker $USER_NAME
    echo "Added."
fi

echo ""
echo "IMPORTANT: Group membership changes only take effect after a new login."
echo "You have two options:"
echo "1. Log out and log back in (Recommended for permanent fix)."
echo "2. Run 'newgrp docker' in your current terminal to apply it temporarily for this session."
echo ""
echo "Trying 'newgrp docker' for this script execution to verify access..."
newgrp docker <<EONG
    docker ps >/dev/null 2>&1
    if [ \$? -eq 0 ]; then
        echo "SUCCESS: Docker command works inside 'newgrp'!"
    else
        echo "WARNING: Docker command failed even with newgrp. Please ensure Docker is running."
    fi
EONG
