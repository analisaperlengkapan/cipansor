# AGENTS.md — Cipansor IMS

Canonical guidance for AI agents and developers working in this repository. This
is the single source of truth; `CLAUDE.md` points here. Keep it in sync with
`README.md`.

## What this is

Cipansor is an Information Management System for Yayasan Pesantren Cipansor
(TK Qur'an, SD IT, SMP IT, SMA Qur'an + tahfidz). It is a **pnpm + Turborepo
monorepo**:

| Workspace | Stack | Purpose |
|-----------|-------|---------|
| `apps/api` | Express 5, Prisma 7 (PostgreSQL), Zod, Socket.IO, Redis (ioredis), JWT | REST API + realtime |
| `apps/web` | Next.js 16 (App Router), React 19, React Query, Tailwind, Radix UI | Web client |
| `packages/shared` (`@cipansor/shared`) | TypeScript, Zod | Shared DTO types & schemas for both apps |

## Golden rules

1. **Never clobber `apps/api/prisma/schema.prisma`.** It holds 237 models / 133
   enums. It was once accidentally truncated to a stub, which broke the entire
   backend. Edit surgically; run `pnpm --filter api db:generate` after changes.
2. **Prisma is the source of truth for DB enums and models.** Import DB enums
   (`UserRole`, `VisitStatus`, `LeaveStatus`, …) from `@prisma/client`, not from
   `@cipansor/shared`. `@cipansor/shared` holds API/DTO contracts only.
3. **Use `RoleCode`, not the legacy `UserRole`.** `req.user.role` is a roleCode
   string. New auth checks use `RoleCode.*` / permissions; the legacy `UserRole`
   enum is deprecated and being removed.
4. **Validate at the edge with Zod, return via the response helper.** Routes →
   thin controller (`asyncHandler`, `ApiResponse`) → service (business logic +
   Prisma) → `schema.ts` (Zod). Routes never touch Prisma directly; controllers
   never embed business logic.
5. **Prove it locally before pushing.** Run the gate below; do not rely on CI to
   discover failures. CI is a backstop only.
6. **Develop on the feature branch, commit with clear messages, never push to
   `main`.**

## Commands

```bash
pnpm install                          # bootstrap workspace
pnpm --filter api db:generate         # generate Prisma client (after schema edits)
pnpm --filter @cipansor/shared build  # build shared package (consumed by both apps)

# Local stack (Postgres + Redis) for running/testing end-to-end
docker compose -f docker-compose.dev.yml up -d
pnpm --filter api db:push             # apply schema to the dev DB
pnpm --filter api db:seed             # seed admin + reference data

pnpm dev                              # turbo: run api + web in watch mode

# Quality gate — ALL must pass locally before committing/pushing
pnpm --filter api build               # tsc (build config)
pnpm --filter api build:strict        # tsc (full strict — the real target)
pnpm --filter api test                # vitest (API)
pnpm --filter web build               # next build
pnpm --filter web test                # vitest (web)
pnpm --filter web test:e2e            # Playwright e2e (needs the local stack up)
pnpm format                           # prettier
pnpm lint                             # eslint (api + web)
```

## Architecture standard (API module)

Every module under `apps/api/src/modules/<name>/` follows:

```
<name>/
  routes.ts        # express.Router(); auth + validate middleware; delegates to controller
  controller.ts    # thin handlers wrapped in asyncHandler; shape responses via ApiResponse
  service.ts       # business logic + Prisma access
  schema.ts        # Zod request schemas; types via z.infer
  index.ts         # barrel: export { <name>Routes }
  tests/           # vitest unit tests (Prisma mocked)
```

Reuse the shared primitives — do not reinvent them:
- `src/utils/response.ts` — `ApiResponse.success/error/paginated`
- `src/middleware/error.ts` — `ApiError`, `Errors.*`, `asyncHandler`, `validate`, `validateQuery`
- `src/middleware/auth.ts` — `authenticate`, `authorize(...RoleCode)`, `hasPermission`, `isAdmin`, `isSuperAdmin`, `isTeacherOrAbove`
- `src/lib/{prisma,event-bus,realtime,jwt,redis,logger}.ts`

Cross-module communication goes through the typed `eventBus` (`src/lib/event-bus.ts`);
add new events to the `AppEvents` interface with a payload type.

## Web standard

- Data layer: Axios instance in `src/lib/api.ts` (+ `lib/api-error.ts`), consumed
  through React Query hooks in `src/hooks/*`. **No mock/placeholder data in
  pages** — wire to the API.
- Share request/response types from `@cipansor/shared`; don't redefine `any`.
- Route protection / nav visibility must reflect real `RoleCode` + permissions.

## Per-area guides

See nested `AGENTS.md` files: `apps/api/AGENTS.md`, `apps/web/AGENTS.md`,
`packages/shared/AGENTS.md`, `apps/api/prisma/AGENTS.md`. Known technical debt and
the remaining build-green roadmap live in `docs/KNOWN_ISSUES.md`.
