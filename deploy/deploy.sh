#!/usr/bin/env bash
# Deploys a pre-built release of the NEO Kaizen backend on the production VM.
#
# Usage (the workflow streams this script over SSH):
#   deploy.sh <sha> [--skip-migrations]
#   deploy.sh --rollback
#
# Environment:
#   DEPLOY_PATH   application directory (default: $HOME/NEO/backend)
#   APP_PORT      backend port for the direct smoke test (default: 3000)
#   PUBLIC_PATH   URL through nginx for the proxy smoke test (optional; the
#                 address nginx actually binds, e.g.
#                 http://10.10.0.203:4189/api/portal-config). When empty the
#                 public smoke is skipped and only the direct HTTP check runs.
#
# The app runs in place from $DEPLOY_PATH. A deploy extracts the artifact over
# dist/ and node_modules/, leaving .env and uploads/ untouched, and keeps the
# previous build in *.prev for an instant rollback. No step needs sudo: the app
# is a user-level systemd unit (see docs/cd.md for the one-time setup).

set -euo pipefail

BASE="${DEPLOY_PATH:-$HOME/NEO/backend}"
APP_PORT="${APP_PORT:-3000}"
PUBLIC_PATH="${PUBLIC_PATH:-}"
UNIT_NAME="neo-backend"
SMOKE_ATTEMPTS=30
SMOKE_INTERVAL=1

if [ -z "${XDG_RUNTIME_DIR:-}" ]; then
  XDG_RUNTIME_DIR="/run/user/$(id -u)"
  export XDG_RUNTIME_DIR
fi

log() { printf '[deploy] %s\n' "$*"; }
die() {
  printf '[deploy] ERROR: %s\n' "$*" >&2
  exit 1
}

# Non-interactive SSH does not source ~/.bashrc, so nvm's node is usually not on
# PATH. Resolve it explicitly and put it first so `knex` runs on the same binary
# the service unit uses.
resolve_node() {
  local candidate
  candidate="$(command -v node 2>/dev/null || true)"
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    printf '%s\n' "$candidate"
    return 0
  fi
  candidate="$(ls -1 "$HOME"/.nvm/versions/node/v24.*/bin/node 2>/dev/null | sort -V | tail -n 1 || true)"
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    printf '%s\n' "$candidate"
    return 0
  fi
  return 1
}

NODE_BIN="$(resolve_node)" || die "node not found (non-interactive SSH does not load nvm)"
export PATH="$(dirname "$NODE_BIN"):$PATH"

usage() {
  sed -n '4,14p' "$0" | sed 's/^# \{0,1\}//'
}

preflight() {
  [ -f "$BASE/.env" ] || die "missing $BASE/.env"
  grep -qx 'NODE_ENV=production' "$BASE/.env" ||
    die "$BASE/.env must contain NODE_ENV=production (the session cookie is not Secure otherwise)"

  local arch version
  arch="$("$NODE_BIN" -p 'process.arch')"
  [ "$arch" = "x64" ] || die "release was built for x64, host reports $arch"
  version="$("$NODE_BIN" -p 'process.versions.node')"
  case "$version" in
    24.*) ;;
    *) die "release targets Node 24, host reports $version" ;;
  esac

  systemctl --user show-environment >/dev/null 2>&1 ||
    die "user systemd manager is unreachable (is 'loginctl enable-linger' enabled for this user?)"

  local unit unit_dir unit_node
  unit="$HOME/.config/systemd/user/$UNIT_NAME.service"
  [ -f "$unit" ] || die "service unit not installed: $unit (see docs/cd.md, one-time setup)"
  unit_dir="$(sed -n 's|^WorkingDirectory=\(.*\)|\1|p' "$unit")"
  unit_dir="${unit_dir//%h/$HOME}"
  if [ "$unit_dir" != "$BASE" ]; then
    die "unit WorkingDirectory is '${unit_dir}'; expected '$BASE' (fix DEPLOY_PATH or the unit)"
  fi
  unit_node="$(sed -n 's|^ExecStart=\([^ ]*\).*|\1|p' "$unit")"
  unit_node="${unit_node//%h/$HOME}"
  if [ -z "$unit_node" ] || [ ! -x "$unit_node" ]; then
    die "unit ExecStart points to a missing binary: ${unit_node:-<none>}"
  fi
  if [ "$unit_node" != "$NODE_BIN" ]; then
    log "warning: unit runs $unit_node, this deploy uses $NODE_BIN"
  fi
}

smoke() {
  local url="$1" attempt
  for attempt in $(seq 1 "$SMOKE_ATTEMPTS"); do
    if curl -fsS --max-time 5 --output /dev/null "$url"; then
      log "smoke ok: $url (attempt $attempt)"
      return 0
    fi
    sleep "$SMOKE_INTERVAL"
  done
  log "smoke failed: $url"
  return 1
}

restart() {
  systemctl --user restart "$UNIT_NAME"
}

snapshot() {
  log "snapshotting the current build"
  rm -rf "$BASE/dist.prev" "$BASE/node_modules.prev"
  if [ -d "$BASE/dist" ]; then
    cp -a "$BASE/dist" "$BASE/dist.prev"
  fi
  if [ -d "$BASE/node_modules" ]; then
    cp -a "$BASE/node_modules" "$BASE/node_modules.prev"
  fi
  if [ -s "$BASE/.deployed-sha" ]; then
    cp -f "$BASE/.deployed-sha" "$BASE/.previous-sha"
  fi
}

restore() {
  [ -d "$BASE/dist.prev" ] || return 1
  log "restoring the previous build"
  rm -rf "$BASE/dist"
  mv "$BASE/dist.prev" "$BASE/dist"
  if [ -d "$BASE/node_modules.prev" ]; then
    rm -rf "$BASE/node_modules"
    mv "$BASE/node_modules.prev" "$BASE/node_modules"
  fi
  if [ -s "$BASE/.previous-sha" ]; then
    cp -f "$BASE/.previous-sha" "$BASE/.deployed-sha"
  fi
}

deploy() {
  local sha="$1" skip_migrations="$2" tarball failed=0
  tarball="/tmp/release-$sha.tgz"
  [ -f "$tarball" ] || die "release artifact not found: $tarball"

  preflight
  snapshot

  log "extracting release $sha into $BASE"
  tar -xzf "$tarball" -C "$BASE"
  rm -f "$tarball"

  if [ "$skip_migrations" = "--skip-migrations" ]; then
    log "migrations skipped (--skip-migrations)"
  else
    log "applying migrations"
    (
      cd "$BASE"
      "$NODE_BIN" node_modules/knex/bin/cli.js migrate:latest --env development
    )
  fi

  restart

  smoke "http://127.0.0.1:$APP_PORT/portal-config" || failed=1
  if [ -n "$PUBLIC_PATH" ]; then
    smoke "$PUBLIC_PATH" || failed=1
  else
    log "public smoke skipped (PUBLIC_PATH not set)"
  fi

  if [ "$failed" -ne 0 ]; then
    log "deployment failed; restoring the previous build"
    journalctl --user -u "$UNIT_NAME" -n 80 --no-pager || true
    if restore; then
      restart
      smoke "http://127.0.0.1:$APP_PORT/portal-config" || true
    fi
    exit 1
  fi

  printf '%s\n' "$sha" >"$BASE/.deployed-sha"
  log "release $sha is live ($(systemctl --user is-active "$UNIT_NAME"))"
}

rollback() {
  preflight
  restore || die "no previous build snapshot in $BASE"
  restart

  if ! smoke "http://127.0.0.1:$APP_PORT/portal-config"; then
    log "rollback smoke failed; collecting recent logs"
    journalctl --user -u "$UNIT_NAME" -n 80 --no-pager || true
    exit 1
  fi

  log "rollback complete ($(systemctl --user is-active "$UNIT_NAME"))"
}

main() {
  local action="${1:-}"
  case "$action" in
    --rollback)
      [ "$#" -eq 1 ] || die "--rollback does not take extra arguments"
      rollback
      ;;
    -h | --help)
      usage
      ;;
    "")
      usage
      exit 1
      ;;
    *)
      [ "$#" -le 2 ] || die "too many arguments"
      if [ "$#" -eq 2 ] && [ "$2" != "--skip-migrations" ]; then
        die "unknown option: $2"
      fi
      [[ "$action" =~ ^[0-9a-f]{7,40}$ ]] || die "invalid commit sha: $action"
      deploy "$action" "${2:-}"
      ;;
  esac
}

main "$@"
