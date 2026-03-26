#!/usr/bin/env bash
# Start ngrok tunnels for frontend (5173) and backend (8000).
# Requires: backend and frontend dev servers already running.
# Requires: ngrok authtoken configured (ngrok config add-authtoken YOUR_TOKEN)
#
# After ngrok starts:
# 1. Note the backend URL (e.g. https://xxxx.ngrok-free.app)
# 2. In frontend/.env set: VITE_API_URL=https://xxxx.ngrok-free.app
# 3. Restart the frontend dev server so it picks up VITE_API_URL
# 4. Share the frontend ngrok URL with users

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_CONFIG="${SCRIPT_DIR}/../ngrok.yml"
if [[ ! -f "$PROJECT_CONFIG" ]]; then
  echo "Config not found: $PROJECT_CONFIG"
  exit 1
fi

# Load default config first (contains authtoken from 'ngrok config add-authtoken'),
# then project tunnels. Set NGROK_DEFAULT_CONFIG to override default path.
case "$(uname -s)" in
  Darwin)  DEFAULT_CONFIG="${NGROK_DEFAULT_CONFIG:-$HOME/Library/Application Support/ngrok/ngrok.yml}" ;;
  Linux)   DEFAULT_CONFIG="${NGROK_DEFAULT_CONFIG:-${NGROK_CONFIG:-$HOME/.config/ngrok/ngrok.yml}}" ;;
  *)       DEFAULT_CONFIG="${NGROK_DEFAULT_CONFIG:-}" ;;
esac

if [[ -n "$DEFAULT_CONFIG" && -f "$DEFAULT_CONFIG" ]]; then
  exec ngrok start --config "$DEFAULT_CONFIG" --config "$PROJECT_CONFIG" --all
else
  echo "Default ngrok config not found at $DEFAULT_CONFIG"
  echo "Run: ngrok config add-authtoken YOUR_TOKEN"
  echo "Then run this script again, or run: ngrok start --config $PROJECT_CONFIG --all"
  exit 1
fi
