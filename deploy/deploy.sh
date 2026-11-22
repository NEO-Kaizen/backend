#!/usr/bin/env bash
# Deploys a pre-built release of the NEO Kaizen backend on the production VM.
#
# Usage (the workflow streams this script over SSH):
#   deploy.sh <sha> [--skip-migrations]
#   deploy.sh --rollback
#   deploy.sh --help
#
# Environment:
#   DEPLOY_PATH        application directory (default: $HOME/NEO/backend)
#   APP_PORT           backend port for the direct smoke test (default: 3000);
#                      must match PORT in $DEPLOY_PATH/.env
#   PUBLIC_PATH        URL through nginx for the proxy smoke test (optional; the
#                      address nginx actually binds, e.g.
#                      http://<deploy-host>:<nginx-port>/api/portal-config).
#                      When empty the public smoke is skipped.
#   MIGRATION_DB_PORT  database port used only by knex migrations (default: 5432,
#                      Supabase session mode). Runtime keeps DB_PORT from .env.
#   DEPLOY_ARTIFACT    path of the uploaded tarball (default:
#                      /tmp/release-<sha>.tgz)
#   NEO_DEPLOY_DRY_RUN set to 1 to parse the arguments and exit without touching
#                      the host (used by deploy.test.sh).
#
# The app runs in place from $DEPLOY_PATH. A deploy extracts the artifact into a
# staging directory, snapshots every file the release overwrites, swaps the
# staged files in, and keeps the snapshot in .deploy-previous for rollback. .env
# and uploads/ are never touched. Any failure after the snapshot restores it. No
# step needs sudo: the app is a user-level systemd unit (see docs/cd.md for the
# one-time setup).

set -Eeuo pipefail

APP_DIR="${DEPLOY_PATH:-$HOME/NEO/backend}"
APP_DIR="${APP_DIR%/}"
APP_PORT="${APP_PORT:-3000}"
PUBLIC_PATH="${PUBLIC_PATH:-}"
UNIT_NAME="neo-backend"
SMOKE_ATTEMPTS=30
SMOKE_INTERVAL=1
RELEASE_PATHS=(dist node_modules assets package.json package-lock.json knexfile.js migrations)
STAGING_DIR="$APP_DIR/.deploy-staging"
PREVIOUS_DIR="$APP_DIR/.deploy-previous"
LOCK_FILE="$APP_DIR/.deploy-lock"
NODE_BIN=""
IS_DEPLOY_IN_FLIGHT=0

if [ -z "${XDG_RUNTIME_DIR:-}" ]; then
  XDG_RUNTIME_DIR="/run/user/$(id -u)"
  export XDG_RUNTIME_DIR
fi

log() { printf '[deploy] %s\n' "$*"; }
die() {
  printf '[deploy] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Deploy a pre-built release of the NEO Kaizen backend.

Usage:
  deploy.sh <sha> [--skip-migrations]
  deploy.sh --rollback
  deploy.sh --help

Arguments:
  <sha>                commit being deployed (7-40 lowercase hex characters)
  --skip-migrations    do not run knex migrate:latest
  --rollback           restore the previous release kept in .deploy-previous
  --help               show this help

Environment:
  DEPLOY_PATH          application directory (default: $HOME/NEO/backend)
  APP_PORT             backend port used by the direct smoke test (default: 3000)
  PUBLIC_PATH          optional public URL used by the nginx smoke test
  MIGRATION_DB_PORT    migrations port (default: 5432)
  DEPLOY_ARTIFACT      uploaded tarball path (default: /tmp/release-<sha>.tgz)
  NEO_DEPLOY_DRY_RUN   set to 1 to only parse arguments (tests)
EOF
}

# Non-interactive SSH does not source ~/.bashrc, so nvm's node is usually not on
# PATH. The service unit already points to the exact binary, so use that one for
# migrations and preflight instead of guessing from PATH.
resolve_node_from_unit() {
  local unit="$1" candidate
  candidate="$(sed -n 's|^ExecStart=\([^ ]*\).*|\1|p' "$unit" | head -n 1)"
  candidate="${candidate//%h/$HOME}"
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    printf '%s\n' "$candidate"
    return 0
  fi
  return 1
}

# Resolve a key the way dotenv does for the simple KEY=value lines used here:
# the last occurrence wins and quotes/whitespace/comments are ignored.
effective_env_value() {
  local key="$1" file="$2"
  grep -E "^[[:space:]]*(export[[:space:]]+)?${key}[[:space:]]*=" "$file" |
    tail -n 1 | cut -d= -f2- | sed 's/[[:space:]]*#.*$//' | tr -d "\"'[:space:]"
}

preflight() {
  case "$APP_DIR" in
    / | "") die "invalid DEPLOY_PATH: '$APP_DIR'" ;;
  esac
  [ -f "$APP_DIR/.env" ] || die "missing $APP_DIR/.env"
  local node_env env_port
  node_env="$(effective_env_value NODE_ENV "$APP_DIR/.env")"
  [ "$node_env" = "production" ] ||
    die "$APP_DIR/.env must set NODE_ENV=production as its last NODE_ENV entry (the session cookie is not Secure otherwise)"

  if grep -Eq '^[[:space:]]*(export[[:space:]]+)?PORT[[:space:]]*=' "$APP_DIR/.env"; then
    env_port="$(effective_env_value PORT "$APP_DIR/.env")"
    [ -n "$env_port" ] || die "$APP_DIR/.env has PORT set but empty"
  else
    env_port=3000
  fi
  if [ "$env_port" != "$APP_PORT" ]; then
    die "APP_PORT is '$APP_PORT' but $APP_DIR/.env has PORT=$env_port (the smoke test would hit the wrong port)"
  fi

  local unit unit_dir unit_node arch version linger
  unit="$HOME/.config/systemd/user/$UNIT_NAME.service"
  [ -f "$unit" ] || die "service unit not installed: $unit (see docs/cd.md, one-time setup)"
  unit_dir="$(sed -n 's|^WorkingDirectory=\(.*\)|\1|p' "$unit" | head -n 1 | tr -d '"')"
  unit_dir="${unit_dir//%h/$HOME}"
  unit_dir="${unit_dir%/}"
  if [ "$unit_dir" != "$APP_DIR" ]; then
    die "unit WorkingDirectory is '${unit_dir}'; expected '$APP_DIR' (fix DEPLOY_PATH or the unit)"
  fi
  unit_node="$(resolve_node_from_unit "$unit")" ||
    die "unit ExecStart does not point to an executable node binary"

  NODE_BIN="$unit_node"
  arch="$("$NODE_BIN" -p 'process.arch')"
  [ "$arch" = "x64" ] || die "release was built for x64, host reports $arch"
  version="$("$NODE_BIN" -p 'process.versions.node')"
  case "$version" in
    24.*) ;;
    *) die "release targets Node 24, unit runs $version" ;;
  esac

  linger="$(loginctl show-user "$(id -un)" -p Linger 2>/dev/null || true)"
  if [ "$linger" != "Linger=yes" ]; then
    die "lingering is disabled for $(id -un); run 'sudo loginctl enable-linger $(id -un)' once"
  fi

  systemctl --user show-environment >/dev/null 2>&1 ||
    die "user systemd manager is unreachable (is linger enabled for this user?)"
}

run_smoke_check() {
  local url="$1" attempt
  for ((attempt = 1; attempt <= SMOKE_ATTEMPTS; attempt++)); do
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

# The workflow has a concurrency group, but a manual run on the host could still
# overlap a pipeline run. Refuse to deploy while another deploy holds the lock.
acquire_deploy_lock() {
  exec 9>"$LOCK_FILE"
  flock -n 9 || die "another deploy is already running (lock: $LOCK_FILE)"
}

# Copies every path the release overwrites so a failure at any later step can
# restore the whole previous release, not only dist/ and node_modules/.
snapshot_current() {
  local destination="$1" staging="$1.tmp" path
  if [ ! -d "$APP_DIR/dist" ] || [ ! -d "$APP_DIR/node_modules" ]; then
    if [ -e "$destination" ]; then
      die "inconsistent state: $destination exists but $APP_DIR/dist or node_modules is missing; inspect the host before deploying"
    fi
    log "no complete previous release to snapshot (first deploy)"
    rm -rf "$staging"
    return 0
  fi
  log "snapshotting the current release"
  rm -rf "$staging" || return 1
  mkdir -p "$staging" || return 1
  for path in "${RELEASE_PATHS[@]}"; do
    if [ -e "$APP_DIR/$path" ]; then
      if [ "$path" = "node_modules" ]; then
        # node_modules is replaced as a whole and never edited in place, so
        # hardlinks are safe and avoid copying hundreds of megabytes.
        cp -al "$APP_DIR/$path" "$staging/$path" || return 1
      else
        cp -a "$APP_DIR/$path" "$staging/$path" || return 1
      fi
    fi
  done
  if [ -s "$APP_DIR/.deployed-sha" ]; then
    cp -f "$APP_DIR/.deployed-sha" "$staging/.deployed-sha" || return 1
  fi
  printf 'complete\n' >"$staging/.snapshot-complete" || return 1
  rm -rf "$destination" || return 1
  mv "$staging" "$destination" || return 1
}

# Every command is checked explicitly: with set -e, a failing command inside a
# function called from `if` does not abort the shell (ShellCheck SC2310).
restore_snapshot() {
  local source="$1" path
  [ -f "$source/.snapshot-complete" ] || return 1
  log "restoring the previous release"
  for path in "${RELEASE_PATHS[@]}"; do
    rm -rf "${APP_DIR:?}/$path" || return 1
    if [ -e "$source/$path" ]; then
      mv "$source/$path" "${APP_DIR:?}/$path" || return 1
    fi
  done
  if [ -s "$source/.deployed-sha" ]; then
    cp -f "$source/.deployed-sha" "$APP_DIR/.deployed-sha" || return 1
  else
    rm -f "$APP_DIR/.deployed-sha" || return 1
  fi
  rm -rf "$source" || return 1
}

verify_release() {
  local path
  for path in "${RELEASE_PATHS[@]}"; do
    [ -e "$STAGING_DIR/$path" ] || return 1
  done
}

swap_release() {
  local path
  for path in "${RELEASE_PATHS[@]}"; do
    rm -rf "${APP_DIR:?}/$path" || return 1
    mv "$STAGING_DIR/$path" "$APP_DIR/$path" || return 1
  done
  rm -rf "$STAGING_DIR" || return 1
}

run_migrations() {
  local migration_port="${MIGRATION_DB_PORT:-5432}"
  log "applying migrations (env production, port $migration_port)"
  (
    # The ERR trap is inherited by subshells under `set -E`; clear it so a
    # migration failure is handled once, by the parent shell.
    trap - ERR
    cd "$APP_DIR"
    MIGRATION_DB_PORT="$migration_port" "$NODE_BIN" node_modules/knex/bin/cli.js migrate:latest --env production
  )
}

fail_deploy() {
  local status="$1"
  trap - ERR HUP INT TERM
  if [ "$IS_DEPLOY_IN_FLIGHT" -eq 1 ]; then
    IS_DEPLOY_IN_FLIGHT=0
    rm -rf "$STAGING_DIR" || true
    log "deployment failed (exit $status)"
    journalctl --user -u "$UNIT_NAME" -n 80 --no-pager || true
    if [ -f "$PREVIOUS_DIR/.snapshot-complete" ]; then
      # Ignore signals while the snapshot is being moved back; an interrupted
      # restore would leave the application directory half swapped.
      trap '' HUP INT TERM
      # shellcheck disable=SC2310 # restore_snapshot checks every command itself
      if restore_snapshot "$PREVIOUS_DIR"; then
        trap - HUP INT TERM
        restart || log "warning: the service did not restart after the restore"
        # shellcheck disable=SC2310 # a failed post-restore smoke must not hide the deploy failure
        run_smoke_check "http://127.0.0.1:$APP_PORT/portal-config" || true
      else
        trap - HUP INT TERM
        printf '[deploy] ERROR: could not restore the previous release\n' >&2
      fi
    else
      log "no previous release to restore (first deploy)"
    fi
  fi
  exit "$status"
}

on_error() {
  local status=$?
  fail_deploy "$status"
}

on_signal() {
  log "deployment interrupted by SIG$1"
  fail_deploy 1
}

deploy() {
  local sha="$1" skip_migrations="$2" tarball="$3" has_smoke_failure=0
  [ -f "$tarball" ] || die "release artifact not found: $tarball"

  preflight
  acquire_deploy_lock
  snapshot_current "$PREVIOUS_DIR" || die "could not snapshot the current release"

  IS_DEPLOY_IN_FLIGHT=1
  trap on_error ERR
  trap 'on_signal HUP' HUP
  trap 'on_signal INT' INT
  trap 'on_signal TERM' TERM

  log "extracting release $sha into staging"
  rm -rf "$STAGING_DIR"
  mkdir -p "$STAGING_DIR"
  tar -xzf "$tarball" -C "$STAGING_DIR"
  verify_release || {
    log "release artifact is incomplete"
    false
  }
  swap_release

  if [ "$skip_migrations" = "--skip-migrations" ]; then
    log "migrations skipped (--skip-migrations)"
  else
    run_migrations
  fi

  restart

  run_smoke_check "http://127.0.0.1:$APP_PORT/portal-config" || has_smoke_failure=1
  if [ -n "$PUBLIC_PATH" ]; then
    run_smoke_check "$PUBLIC_PATH" || has_smoke_failure=1
  else
    log "public smoke skipped (PUBLIC_PATH not set)"
  fi
  if [ "$has_smoke_failure" -ne 0 ]; then
    log "smoke test failed"
    false
  fi

  printf '%s\n' "$sha" >"$APP_DIR/.deployed-sha"
  IS_DEPLOY_IN_FLIGHT=0
  trap - ERR HUP INT TERM
  rm -f "$tarball" || log "warning: could not remove $tarball"
  log "release $sha is live ($(systemctl --user is-active "$UNIT_NAME"))"
}

rollback() {
  preflight
  acquire_deploy_lock
  [ -f "$PREVIOUS_DIR/.snapshot-complete" ] ||
    die "no previous release snapshot in $PREVIOUS_DIR (the first deploy has no rollback target)"
  # Ignore signals while the snapshot is moved back; the restore consumes it.
  trap '' HUP INT TERM
  if ! restore_snapshot "$PREVIOUS_DIR"; then
    trap - HUP INT TERM
    die "could not restore the previous release"
  fi
  trap - HUP INT TERM
  restart
  if ! run_smoke_check "http://127.0.0.1:$APP_PORT/portal-config"; then
    log "rollback smoke failed; collecting recent logs"
    journalctl --user -u "$UNIT_NAME" -n 80 --no-pager || true
    exit 1
  fi
  log "rollback complete ($(systemctl --user is-active "$UNIT_NAME"))"
}

main() {
  local action="${1:-}" skip_migrations migration_mode
  case "$action" in
    --rollback)
      [ "$#" -eq 1 ] || die "--rollback does not take extra arguments"
      if [ "${NEO_DEPLOY_DRY_RUN:-0}" = "1" ]; then
        printf 'action=rollback\n'
        return 0
      fi
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
      skip_migrations="${2:-}"
      if [ -n "$skip_migrations" ] && [ "$skip_migrations" != "--skip-migrations" ]; then
        die "unknown option: $skip_migrations"
      fi
      [[ "$action" =~ ^[0-9a-f]{7,40}$ ]] || die "invalid commit sha: $action"

      migration_mode="apply"
      if [ -n "$skip_migrations" ]; then
        migration_mode="skip"
      fi
      if [ "${NEO_DEPLOY_DRY_RUN:-0}" = "1" ]; then
        printf 'action=deploy sha=%s migrations=%s\n' "$action" "$migration_mode"
        return 0
      fi
      deploy "$action" "$skip_migrations" "${DEPLOY_ARTIFACT:-/tmp/release-$action.tgz}"
      ;;
  esac
}

main "$@"
