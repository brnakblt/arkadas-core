#!/bin/bash
# Opens Expo in a new terminal window

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$SCRIPT_DIR/../mobile"

cd "$MOBILE_DIR"

# Try to detect the current desktop environment and terminal
open_terminal() {
  local cmd="$1"

  # Try various terminals (most common first)
  if command -v ghostty &>/dev/null; then
    ghostty -e bash -c "$cmd; exec bash" &
  elif command -v konsole &>/dev/null; then
    konsole -e bash -c "$cmd; exec bash" &
  elif command -v xfce4-terminal &>/dev/null; then
    xfce4-terminal -e "bash -c '$cmd; exec bash'" &
  elif command -v alacritty &>/dev/null; then
    alacritty -e bash -c "$cmd; exec bash" &
  elif command -v kitty &>/dev/null; then
    kitty bash -c "$cmd; exec bash" &
  elif command -v terminator &>/dev/null; then
    terminator -e "bash -c '$cmd; exec bash'" &
  elif command -v xterm &>/dev/null; then
    xterm -e bash -c "$cmd; exec bash" &
  elif [ -n "$TERM" ] && command -v "$TERM" &>/dev/null; then
    # Try to use the current terminal if possible
    $TERM -e bash -c "$cmd; exec bash" &
  else
    echo "⚠️  Could not find a terminal emulator to open Expo in."
    echo "Please run manually: cd mobile && npm run start"
    return 1
  fi
}

echo "📱 Opening Expo bundler in a new terminal..."
open_terminal "cd \"$MOBILE_DIR\" && npm run start -- --clear"

if [ $? -eq 0 ]; then
  echo "✅ Expo bundler started in a new terminal window"
  echo "   The QR code should be visible in the new terminal"
else
  echo "❌ Failed to open Expo in new terminal"
  exit 1
fi
