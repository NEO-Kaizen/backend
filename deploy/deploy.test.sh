#!/usr/bin/env bash
# Argument-parsing tests for deploy.sh. They run with NEO_DEPLOY_DRY_RUN=1, so
# no systemd unit, database or host state is required. They also cover the
# workflow invocation shape (`bash -s -- <sha> [--skip-migrations]`).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT="$SCRIPT_DIR/deploy.sh"
SHA="0123456789abcdef0123456789abcdef01234567"
FAILURES=0

run_dry() {
  NEO_DEPLOY_DRY_RUN=1 bash "$DEPLOY_SCRIPT" "$@"
}

run_streamed() {
  NEO_DEPLOY_DRY_RUN=1 bash -s -- "$@" <"$DEPLOY_SCRIPT"
}

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  FAILURES=$((FAILURES + 1))
}

expect_output() {
  local expected="$1" actual
  shift
  if ! actual="$("$@" 2>&1)"; then
    fail "expected success: $* (output: $actual)"
    return
  fi
  if [ "$actual" != "$expected" ]; then
    fail "expected '$expected', got '$actual' from: $*"
  fi
}

expect_error() {
  local description="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    fail "expected failure: $description"
  fi
}

expect_output "action=deploy sha=$SHA migrations=apply" run_dry "$SHA"
expect_output "action=deploy sha=$SHA migrations=apply" run_dry "$SHA" ""
expect_output "action=deploy sha=$SHA migrations=skip" run_dry "$SHA" --skip-migrations
expect_output "action=rollback" run_dry --rollback
expect_output "action=deploy sha=$SHA migrations=apply" run_streamed "$SHA"
expect_output "action=deploy sha=$SHA migrations=apply" run_streamed "$SHA" ""
expect_output "action=deploy sha=$SHA migrations=skip" run_streamed "$SHA" --skip-migrations
expect_output "action=rollback" run_streamed --rollback

if ! run_dry --help | grep -q '^Usage:'; then
  fail '--help does not print the usage block'
fi
if ! run_streamed --help | grep -q '^Usage:'; then
  fail '--help does not work when the script is streamed with bash -s'
fi

expect_error "unknown option" run_dry "$SHA" --frobnicate
expect_error "too many arguments" run_dry "$SHA" --skip-migrations extra
expect_error "invalid sha" run_dry not-a-sha
expect_error "--rollback with extra arguments" run_dry --rollback extra
expect_error "missing action" run_dry

if [ "$FAILURES" -ne 0 ]; then
  printf '%s test(s) failed\n' "$FAILURES" >&2
  exit 1
fi
printf 'deploy.sh argument tests passed\n'
