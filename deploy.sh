#!/usr/bin/env bash
#
# Deploys the frontend on the server: pull → install → build → restart, with a
# health check and automatic rollback to the previous commit if the app fails
# to come up.
#
# Everything is overridable by env, so the same script runs on the server and
# in a local rehearsal:
#   APP_DIR      path to the checkout            (default: /srv/app/frontend)
#   BRANCH       branch to deploy                (default: staging)
#   RESTART_CMD  how to restart the app          (default: systemctl restart)
#   HEALTH_URL   URL that must return 2xx        (default: http://127.0.0.1:3000)
#   HEALTH_RETRIES / HEALTH_DELAY  health-check polling
#
# Rehearse it locally before trusting it — the rollback path is the part you
# want to have already seen work:
#   APP_DIR=~/deploy-test/frontend \
#   RESTART_CMD="echo simulated-restart" \
#   bash deploy.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/srv/app/frontend}"
BRANCH="${BRANCH:-staging}"
RESTART_CMD="${RESTART_CMD:-sudo systemctl restart app-frontend}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000}"
HEALTH_RETRIES="${HEALTH_RETRIES:-10}"
HEALTH_DELAY="${HEALTH_DELAY:-3}"

log() { printf '\n\033[1;34m[deploy]\033[0m %s\n' "$*"; }

cd "$APP_DIR"

PREV_COMMIT="$(git rev-parse HEAD)"
log "Current commit: $(git rev-parse --short HEAD)"

build() {
  git pull origin "$BRANCH"
  npm ci
  npm run build
  log "Restarting app…"
  eval "$RESTART_CMD"
}

health_ok() {
  for i in $(seq 1 "$HEALTH_RETRIES"); do
    if curl -sf -o /dev/null "$HEALTH_URL"; then
      log "Health check passed on attempt $i."
      return 0
    fi
    log "Health check attempt $i/$HEALTH_RETRIES failed; retrying in ${HEALTH_DELAY}s…"
    sleep "$HEALTH_DELAY"
  done
  return 1
}

log "Deploying $BRANCH → $APP_DIR"
build

if health_ok; then
  log "Deployed $(git rev-parse --short HEAD) successfully."
  exit 0
fi

log "Health check failed — rolling back to ${PREV_COMMIT:0:7}"
git reset --hard "$PREV_COMMIT"
npm ci
npm run build
eval "$RESTART_CMD"

if health_ok; then
  log "Rollback to ${PREV_COMMIT:0:7} succeeded. Deploy aborted."
else
  log "CRITICAL: rollback also failed its health check. Manual intervention needed."
fi
exit 1
