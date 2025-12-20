#!/bin/bash
set -e

echo "Switching Docker to socket activation..."

# key commands
echo "Disabling docker.service..."
systemctl disable --now docker.service

echo "Enabling docker.socket..."
systemctl enable --now docker.socket

echo "Done! Docker will now start on demand via socket."
systemctl status docker.socket --no-pager
