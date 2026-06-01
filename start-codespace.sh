#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"
STATE_DIR="$ROOT_DIR/.codespace"
LOG_DIR="$STATE_DIR/logs"

SERVER_PORT="${SERVER_PORT:-3001}"
CLIENT_PORT="${CLIENT_PORT:-3000}"

mkdir -p "$LOG_DIR" "$STATE_DIR/redis"

log() {
  printf '[codespace] %s\n' "$*"
}

warn() {
  printf '[codespace] WARNING: %s\n' "$*" >&2
}

die() {
  printf '[codespace] ERROR: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

load_server_env() {
  if [ -f "$SERVER_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$SERVER_DIR/.env"
    set +a
  fi

  SERVER_PORT="${PORT:-$SERVER_PORT}"
}

port_open() {
  local port="$1"
  timeout 1 bash -c ":</dev/tcp/127.0.0.1/$port" >/dev/null 2>&1
}

wait_for_port() {
  local port="$1"
  local name="$2"
  local attempts="${3:-30}"

  for _ in $(seq 1 "$attempts"); do
    if port_open "$port"; then
      return 0
    fi
    sleep 1
  done

  die "$name did not open port $port in time"
}

sql_escape() {
  printf "%s" "$1" | sed "s/'/''/g"
}

parse_database_url() {
  local url="${DATABASE_URL:-postgresql://aviator:aviator123@localhost:5432/aviator}"
  local without_scheme creds rest hostport db_query

  without_scheme="${url#postgresql://}"
  without_scheme="${without_scheme#postgres://}"
  creds="${without_scheme%@*}"
  rest="${without_scheme#*@}"
  hostport="${rest%%/*}"
  db_query="${rest#*/}"

  DB_USER="${creds%%:*}"
  DB_PASS="${creds#*:}"
  DB_HOST="${hostport%%:*}"
  DB_PORT="${hostport#*:}"
  DB_NAME="${db_query%%\?*}"

  if [ "$DB_PORT" = "$hostport" ]; then
    DB_PORT="5432"
  fi
}

start_postgres() {
  require_cmd psql

  if command -v pg_isready >/dev/null 2>&1 && pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    log "PostgreSQL is already running"
  else
    log "Starting PostgreSQL"
    if command -v sudo >/dev/null 2>&1 && command -v service >/dev/null 2>&1; then
      sudo service postgresql start >/dev/null
    elif command -v sudo >/dev/null 2>&1 && command -v pg_ctlcluster >/dev/null 2>&1; then
      local cluster
      cluster="$(pg_lsclusters --no-header 2>/dev/null | awk 'NR==1 {print $1, $2}')"
      [ -n "$cluster" ] || die "No PostgreSQL cluster found"
      # shellcheck disable=SC2086
      sudo pg_ctlcluster $cluster start
    else
      die "Cannot start PostgreSQL automatically; install sudo/service or start it manually"
    fi
    wait_for_port 5432 PostgreSQL 30
  fi

  setup_database
}

setup_database() {
  parse_database_url

  if [[ ! "$DB_USER" =~ ^[A-Za-z0-9_]+$ || ! "$DB_NAME" =~ ^[A-Za-z0-9_]+$ ]]; then
    warn "Skipping database/user creation because DATABASE_URL has unsupported identifiers"
    return
  fi

  if [ "${DB_HOST:-localhost}" != "localhost" ] && [ "${DB_HOST:-127.0.0.1}" != "127.0.0.1" ]; then
    log "DATABASE_URL points at $DB_HOST; skipping local database creation"
    return
  fi

  command -v sudo >/dev/null 2>&1 || die "sudo is required to create the local PostgreSQL role/database"

  local escaped_pass
  escaped_pass="$(sql_escape "$DB_PASS")"

  log "Ensuring PostgreSQL role and database exist"
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1; then
    sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE ROLE \"$DB_USER\" LOGIN PASSWORD '$escaped_pass';" >/dev/null
  fi

  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
    sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
  fi
}

start_redis() {
  if command -v redis-cli >/dev/null 2>&1 && redis-cli -h localhost -p 6379 ping >/dev/null 2>&1; then
    log "Redis is already running"
    return
  fi

  require_cmd redis-server
  log "Starting Redis"
  redis-server \
    --daemonize yes \
    --bind 127.0.0.1 \
    --port 6379 \
    --dir "$STATE_DIR/redis" \
    --dbfilename dump.rdb \
    --logfile "$LOG_DIR/redis.log" \
    --pidfile "$STATE_DIR/redis.pid"

  wait_for_port 6379 Redis 15
}

ensure_node_deps() {
  require_cmd npm

  if [ ! -d "$SERVER_DIR/node_modules" ]; then
    log "Installing server dependencies"
    (cd "$SERVER_DIR" && npm install)
  fi

  if [ ! -d "$CLIENT_DIR/node_modules" ]; then
    log "Installing client dependencies"
    (cd "$CLIENT_DIR" && npm install)
  fi
}

run_prisma() {
  log "Preparing Prisma client and database"
  (
    cd "$SERVER_DIR"
    npm exec -- prisma generate
    npm exec -- prisma migrate deploy
    npm exec -- prisma db seed
  )
}

pid_alive() {
  local pid_file="$1"
  [ -f "$pid_file" ] || return 1
  local pid
  pid="$(cat "$pid_file")"
  [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1
}

start_node_processes() {
  local server_pid="$STATE_DIR/server.pid"
  local client_pid="$STATE_DIR/client.pid"

  if pid_alive "$server_pid"; then
    log "Server is already running with PID $(cat "$server_pid")"
  else
    log "Starting Express/socket server on port $SERVER_PORT"
    (
      cd "$SERVER_DIR"
      setsid env PORT="$SERVER_PORT" npm run dev >"$LOG_DIR/server.log" 2>&1 &
      echo $! >"$server_pid"
    )
    wait_for_port "$SERVER_PORT" "Express server" 30
  fi

  if pid_alive "$client_pid"; then
    log "Client is already running with PID $(cat "$client_pid")"
  else
    log "Starting Next client on port $CLIENT_PORT"
    (
      cd "$CLIENT_DIR"
      setsid npm run dev -- -H 0.0.0.0 -p "$CLIENT_PORT" >"$LOG_DIR/client.log" 2>&1 &
      echo $! >"$client_pid"
    )
    wait_for_port "$CLIENT_PORT" "Next client" 45
  fi
}

stop_pid_file() {
  local name="$1"
  local pid_file="$2"

  if pid_alive "$pid_file"; then
    local pid
    pid="$(cat "$pid_file")"
    log "Stopping $name (PID $pid)"
    kill "-$pid" >/dev/null 2>&1 || kill "$pid" >/dev/null 2>&1 || true
  fi
  rm -f "$pid_file"
}

stop_all() {
  stop_pid_file "Next client" "$STATE_DIR/client.pid"
  stop_pid_file "Express server" "$STATE_DIR/server.pid"

  if [ -f "$STATE_DIR/redis.pid" ] && kill -0 "$(cat "$STATE_DIR/redis.pid")" >/dev/null 2>&1; then
    stop_pid_file "Redis" "$STATE_DIR/redis.pid"
  fi
}

show_status() {
  load_server_env

  printf 'PostgreSQL: '
  if port_open 5432; then printf 'running\n'; else printf 'stopped\n'; fi

  printf 'Redis:      '
  if port_open 6379; then printf 'running\n'; else printf 'stopped\n'; fi

  printf 'Server:     '
  if port_open "$SERVER_PORT"; then printf 'running on %s\n' "$SERVER_PORT"; else printf 'stopped\n'; fi

  printf 'Client:     '
  if port_open "$CLIENT_PORT"; then printf 'running on %s\n' "$CLIENT_PORT"; else printf 'stopped\n'; fi
}

start_all() {
  load_server_env
  start_postgres
  start_redis
  ensure_node_deps
  run_prisma
  start_node_processes

  log "All services are up"
  log "Client: http://localhost:$CLIENT_PORT"
  log "Server: http://localhost:$SERVER_PORT"
  log "Logs: $LOG_DIR"
}

case "${1:-start}" in
  start)
    start_all
    ;;
  stop)
    stop_all
    ;;
  restart)
    stop_all
    start_all
    ;;
  status)
    show_status
    ;;
  *)
    cat <<USAGE
Usage: ./start-codespace.sh [start|stop|restart|status]

Starts the local services needed by this repo in a GitHub Codespace:
  - PostgreSQL for Prisma
  - Redis for socket/chat/game state
  - Express/socket server on port $SERVER_PORT
  - Next client on port $CLIENT_PORT
USAGE
    exit 2
    ;;
esac
