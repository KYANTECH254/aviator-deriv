#!/usr/bin/env bash
set -euo pipefail

# Simple server deploy script.
# Usage:
#   ./deploy/deploy-server.sh
#   ./deploy/deploy-server.sh user@host
#   DEPLOY_REMOTE=user@host DEPLOY_REMOTE_PATH=/home/kyan/apps/deriv-aviator/server ./deploy/deploy-server.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DEFAULT_REMOTE="kyan@77.37.97.244"
REMOTE=${1:-${DEPLOY_REMOTE:-${DEFAULT_REMOTE}}}
REMOTE_PATH=${DEPLOY_REMOTE_PATH:-/home/kyan/apps/deriv-aviator/server}

EXTRA_INCLUDES=(
  "server/.env"
  "server/.env.local"
)

RSYNC_ARGS=(
  --archive
  --compress
  --human-readable
  --progress
  --filter=':- .gitignore'
  --exclude='.git/'
  --exclude='client/'
)

for path in "${EXTRA_INCLUDES[@]}"; do
  RSYNC_ARGS+=(--include="$path")
done
RSYNC_ARGS+=(--include='*/' --exclude='*')

echo "Deploying server to ${REMOTE}:${REMOTE_PATH}"
ssh "${REMOTE}" "mkdir -p '${REMOTE_PATH}'"
rsync "${RSYNC_ARGS[@]}" ./server/ "${REMOTE}:${REMOTE_PATH}"

echo "Installing server dependencies on remote"
ssh "${REMOTE}" "cd '${REMOTE_PATH}' && export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\" && npm ci"

echo "Seeding server database on remote"
ssh "${REMOTE}" "cd '${REMOTE_PATH}' && export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\" && npm run seed || true"

echo "Restarting server app on remote if PM2 is available"
ssh "${REMOTE}" "if command -v pm2 >/dev/null 2>&1; then if pm2 describe deriv-server >/dev/null 2>&1; then pm2 restart deriv-server; else echo 'PM2 process deriv-server not found, skipping restart'; fi; fi"

echo "Server deploy complete."