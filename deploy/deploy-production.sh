#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DOMAIN="deriv-aviator.privatedns.org"
CLIENT_DOMAIN="deriv-aviator.my.to"
NGINX_SITE="deriv-aviator"

cd "$ROOT_DIR"

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found in PATH" >&2
  exit 1
fi

if [ ! -f server/.env ]; then
  cp deploy/env/server.env.example server/.env
fi

cat > client/.env.production.local <<ENV
NEXT_PUBLIC_API_URL=https://${SERVER_DOMAIN}
ENV

sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx postgresql postgresql-client

sudo -u postgres psql -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'aviator') THEN
    CREATE ROLE aviator LOGIN PASSWORD 'aviator123';
  ELSE
    ALTER ROLE aviator WITH LOGIN PASSWORD 'aviator123';
  END IF;
END
$$;
SELECT 'CREATE DATABASE aviator OWNER aviator'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'aviator')\gexec
GRANT ALL PRIVILEGES ON DATABASE aviator TO aviator;
SQL

npm --prefix server ci
npm --prefix client ci

(cd server && npm exec -- prisma migrate deploy)
(cd client && npm run build)

if command -v pm2 >/dev/null 2>&1; then
  pm2 startOrReload ecosystem.config.js --env production
  pm2 save
else
  npx pm2 startOrReload ecosystem.config.js --env production
  npx pm2 save
fi

sudo cp deploy/nginx/deriv-aviator.conf "/etc/nginx/sites-available/${NGINX_SITE}"
sudo ln -sf "/etc/nginx/sites-available/${NGINX_SITE}" "/etc/nginx/sites-enabled/${NGINX_SITE}"
sudo nginx -t
sudo systemctl reload nginx

if [ -n "${LETSENCRYPT_EMAIL:-}" ]; then
  sudo certbot --nginx --non-interactive --agree-tos --redirect \
    --email "$LETSENCRYPT_EMAIL" \
    -d "$SERVER_DOMAIN"
else
  sudo certbot --nginx --non-interactive --agree-tos --redirect \
    --register-unsafely-without-email \
    -d "$SERVER_DOMAIN"
fi

if [ "$CLIENT_DOMAIN" != "$SERVER_DOMAIN" ]; then
  if [ -n "${LETSENCRYPT_EMAIL:-}" ]; then
    sudo certbot --nginx --non-interactive --agree-tos --redirect \
      --email "$LETSENCRYPT_EMAIL" \
      -d "$CLIENT_DOMAIN"
  else
    sudo certbot --nginx --non-interactive --agree-tos --redirect \
      --register-unsafely-without-email \
      -d "$CLIENT_DOMAIN"
  fi
fi

sudo systemctl reload nginx
if command -v pm2 >/dev/null 2>&1; then
  pm2 status
else
  npx pm2 status
fi
