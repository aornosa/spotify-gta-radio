#!/usr/bin/env sh
# Los Santos Radio launcher for macOS / Linux. Run: sh start-mac-linux.sh
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Get the LTS version from https://nodejs.org/en/download and run this again."
  exit 1
fi

[ -d node_modules ] || { echo "Installing, this only happens the first time..."; npm ci --no-audit --no-fund; }
[ -f .env.local ] || npm run setup
[ -f .next/BUILD_ID ] || { echo "Building the app, this only happens the first time..."; npm run build; }

echo
echo "Los Santos Radio is running at http://127.0.0.1:3000 (Ctrl+C to stop)"
( sleep 3; (open http://127.0.0.1:3000 2>/dev/null || xdg-open http://127.0.0.1:3000 2>/dev/null) ) &
npm run start:local
