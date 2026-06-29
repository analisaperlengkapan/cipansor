# CLAUDE.md

This file is intentionally a thin pointer to avoid guidance drift.

**Read [`AGENTS.md`](./AGENTS.md) for all project conventions, commands, the
module architecture standard, and the golden rules.** Per-area guides live in
`apps/api/AGENTS.md`, `apps/web/AGENTS.md`, `packages/shared/AGENTS.md`, and
`apps/api/prisma/AGENTS.md`. Known issues and the remaining roadmap are in
`docs/KNOWN_ISSUES.md`.

Quick reminders (full detail in `AGENTS.md`):

- Monorepo: `apps/api` (Express 5 + Prisma 7), `apps/web` (Next 16 + React Query),
  `packages/shared` (Zod DTOs).
- Never clobber `apps/api/prisma/schema.prisma`; run `pnpm --filter api db:generate`
  after editing it.
- Import DB enums from `@prisma/client`; use `RoleCode`, not legacy `UserRole`.
- Run the full local quality gate (build / build:strict / test / e2e) before
  pushing — CI is only a backstop.
- Work on the feature branch; never push to `main`.
