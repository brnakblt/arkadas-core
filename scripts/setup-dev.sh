#!/bin/bash

# 1. Start Chrome in background (if not already running)
# Uses the alias defined in ~/.bashrc
# dev-chrome > /dev/null 2>&1 &
echo "Starting Chrome Dev..."
google-chrome --remote-debugging-port=9222 --user-data-dir=$HOME/.chrome-dev-profile > /dev/null 2>&1 &

# 2. Ensure tokens are loaded (if using secret files)
if [ -f ~/.secrets/github_token ]; then
    export GITHUB_PERSONAL_ACCESS_TOKEN=$(cat ~/.secrets/github_token)
fi
if [ -f ~/.secrets/hf_token ]; then
    export HF_TOKEN=$(cat ~/.secrets/hf_token)
fi

# 3. Ensure Node 24 is active (in case NVM isn't loaded properly in subshells)
source ~/.nvm/nvm.sh
nvm use 24

# 4. Start your dev servers in the background
echo "Starting dev servers..."
npm run dev &
DEV_PID=$!

# 5. Launch Gemini CLI (bkit)
echo "Starting Gemini CLI..."
# Uncomment the line below once gemini/bkit is installed globally
# gemini

# Wait for dev servers if gemini CLI exits
wait $DEV_PID
