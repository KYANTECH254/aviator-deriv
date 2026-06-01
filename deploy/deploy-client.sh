#!/usr/bin/env bash
set -euo pipefail

# Simple client deploy script.
# Usage:
#   DEPLOY_REMOTE=user@host DEPLOY_REMOTE_PATH=/var/www/deriv-client ./deploy/deploy-client.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REMOTE=${1:-${DEPLOY_REMOTE:-}}
if [[ -z "$REMOTE" ]]; then
  echo "Usage: DEPLOY_REMOTE=user@host [DEPLOY_REMOTE_PATH=/var/www/deriv-client] ./deploy/deploy-client.sh"
  echo "Or: ./deploy/deploy-client.sh user@host"
  exit 1
fi
REMOTE_PATH=${DEPLOY_REMOTE_PATH:-/var/www/deriv-client}

EXTRA_INCLUDES=(
  "client/.env.production.local"
  "client/.env.local"
  "client/.env"
)

RSYNC_ARGS=(
  --archive
  --compress
  --human-readable
  --progress
  --filter=':- .gitignore'
  --exclude='.git/'
  --exclude='server/'
)

for path in "${EXTRA_INCLUDES[@]}"; do
  RSYNC_ARGS+=(--include="$path")
done
RSYNC_ARGS+=(--include='*/' --exclude='*')

echo "Deploying client to ${REMOTE}:${REMOTE_PATH}"
rsync "${RSYNC_ARGS[@]}" ./client/ "${REMOTE}:${REMOTE_PATH}"

echo "Installing client dependencies and building on remote"
ssh "${REMOTE}" "cd '${REMOTE_PATH}' && npm ci && npm run build"

echo "Restarting client app on remote if PM2 is available"
ssh "${REMOTE}" "if command -v pm2 >/dev/null 2>&1; then if pm2 describe deriv-client >/dev/null 2>&1; then pm2 restart deriv-client; else echo 'PM2 process deriv-client not found, skipping restart'; fi; fi"

echo "Client deploy complete."