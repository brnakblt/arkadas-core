#!/bin/bash
# Helper script to start the mobile application

if [ ! -d "node_modules" ]; then
    echo "Installing request dependencies..."
    npm install
fi

echo "Starting mobile app on port 8082..."
# Explicitly set app root to avoid Webpack/Metro issues
export EXPO_ROUTER_APP_ROOT=./app
npm start
