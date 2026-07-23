---
name: gate
description: Run the full local quality gate for the Cipansor monorepo (shared build, API build + strict typecheck + tests, web build + tests) the way AGENTS.md requires before every push. Use when asked to "run the gate", "check everything passes", or before committing/pushing.
---

# Quality gate

AGENTS.md requires the full gate to pass locally before pushing — CI is only a
backstop. Run these in order from the repo root and stop at the first failure.

```bash
pnpm --filter api db:generate         # Prisma client (needed if schema changed)
pnpm --filter @cipansor/shared build  # shared types, consumed by both apps
pnpm --filter api build               # tsc, build config
pnpm --filter api build:strict        # tsc, full strict incl. tests (the real bar)
pnpm --filter api test                # vitest (API)
pnpm --filter web build               # next build (also typechecks web)
pnpm --filter web test                # vitest (web)
```

Notes:
- `api build` / `web build` can OOM tsc/next on the default heap; if you see
  exit 134, prefix with `NODE_OPTIONS=--max-old-space-size=4096`.
- `web build` bakes `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001`).
- The e2e suite (`pnpm --filter web test:e2e`) needs the local stack running —
  bring it up with the `stack` skill first. It is not part of this quick gate.
- Report the first failure with its output; do not claim green unless every
  step above exited 0.
