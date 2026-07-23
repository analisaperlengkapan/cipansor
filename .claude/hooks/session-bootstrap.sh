#!/usr/bin/env bash
# SessionStart hook: get a fresh checkout to the point where lint/build/test can
# run. Web and remote sessions start from a clean clone with no node_modules and
# no generated Prisma client, so the first `pnpm --filter ... lint` fails on
# missing types until this has run. Best-effort: it never fails the session
# (always exits 0), it just prints what it did.
set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$root" || exit 0

echo "[session-bootstrap] installing deps + generating Prisma client + building shared…"

pnpm install --frozen-lockfile >/dev/null 2>&1 \
  && echo "[session-bootstrap] deps installed" \
  || echo "[session-bootstrap] pnpm install skipped/failed (continuing)"

pnpm --filter api db:generate >/dev/null 2>&1 \
  && echo "[session-bootstrap] prisma client generated" \
  || echo "[session-bootstrap] db:generate skipped/failed (continuing)"

pnpm --filter @cipansor/shared build >/dev/null 2>&1 \
  && echo "[session-bootstrap] @cipansor/shared built" \
  || echo "[session-bootstrap] shared build skipped/failed (continuing)"

exit 0
