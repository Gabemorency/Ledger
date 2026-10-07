#!/usr/bin/env bash
# Cloud-mode end-to-end test against a real Postgres and the real PostgREST
# (the API Supabase uses), with a stand-in for Supabase's email sign-in.
#
# Needs: a Postgres reachable through the usual PG* variables (PGHOST, PGPORT,
# PGUSER, PGPASSWORD), POSTGREST pointing at a postgrest binary, and
# Playwright's Chromium. Builds the app in cloud mode on port 3128.
set -euo pipefail
cd "$(dirname "$0")/../.."

: "${POSTGREST:?set POSTGREST to the postgrest binary}"
DB_HOST="${DB_HOST:-127.0.0.1}"
LOGS="$(mktemp -d)"
pids=()
cleanup() {
  for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done
  if [ "${status:-0}" != 0 ]; then tail -n 20 "$LOGS"/*.log || true; fi
  rm -rf "$LOGS"
}
trap 'status=$?; cleanup' EXIT

psql -v ON_ERROR_STOP=1 -q -f e2e/cloud/stub.sql
psql -v ON_ERROR_STOP=1 -q -f supabase/migrations/0001_init.sql 2>&1 | grep -v NOTICE || true

PGRST_DB_URI="postgres://authenticator:pw@${DB_HOST}:${PGPORT:-5432}/postgres" \
PGRST_DB_SCHEMAS=public PGRST_DB_ANON_ROLE=anon PGRST_DB_MAX_ROWS=1000 \
PGRST_JWT_SECRET=local-test-secret-at-least-32-characters-long \
PGRST_SERVER_HOST=127.0.0.1 PGRST_SERVER_PORT=54330 \
  "$POSTGREST" >"$LOGS/postgrest.log" 2>&1 &
pids+=($!)
node e2e/cloud/fake-supabase.mjs >"$LOGS/fake.log" 2>&1 &
pids+=($!)

NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 \
NEXT_PUBLIC_SUPABASE_ANON_KEY="$(node e2e/cloud/fake-supabase.mjs --anon)" \
  npm run build >"$LOGS/build.log" 2>&1
npx next start -p 3128 >"$LOGS/next.log" 2>&1 &
pids+=($!)
curl -s --retry 30 --retry-connrefused --retry-delay 1 -o /dev/null http://127.0.0.1:54330/
curl -sf --retry 30 --retry-connrefused --retry-delay 1 -o /dev/null http://localhost:3128/login

node e2e/cloud/cloud.e2e.mjs
