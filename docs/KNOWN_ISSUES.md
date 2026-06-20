# Known Issues & Technical Debt

Status of production-readiness work and the remaining roadmap. Updated as part of
the production-readiness / architecture-standardization effort.

## ✅ Resolved in this effort

- **Destroyed Prisma schema restored.** `schema.prisma` (237 models, 133 enums)
  had been truncated to a stub, breaking the entire backend; restored from the
  last good revision.
- **Prisma 7 migration completed.** Datasource `url` moved to `prisma.config.ts`;
  runtime client now uses the `@prisma/adapter-pg` driver adapter; `Decimal`
  import path fixed; standalone seeds/scripts use a shared `createPrismaClient()`
  factory; missing back-relations and unsupported `nullsNotDistinct` arg fixed.
- **otplib 13 migration** for 2FA (functional `generateSecret`/`generateURI`/`verify`).
- **Express 5 types** pinned to a compatible `@types/express-serve-static-core`
  (5.1.0) so `req.params` is typed `string` without breaking router overloads.
- **RoleCode alignment (partial):** service/controller `currentUser.role` typed as
  string; route guards use `RoleCode.YAYASAN_*`; GRC controllers' `isPrivileged`
  accepts string.
- **🟢 API build is GREEN — all 336 TypeScript errors fixed.** `pnpm --filter api build`
  exits 0. Fixes spanned RoleCode typing, Prisma include/select bugs, enum literal
  mismatches, missing schema/DTO fields, the trial-balance report, role-switch
  tokens, and a full reception model alignment (the DB now matches the implemented
  frontend approval-workflow / package model). Controller→service calls that the
  lenient `strictNullChecks:false` config makes Zod-optional are cast to the
  service's own parameter type (`Parameters<...>[0]`) — to be removed when the
  build moves to strict mode.
- **Fixed a systematic test bug:** 13 module unit tests used a 5-level relative
  path so `vi.mock('../lib/prisma')` never intercepted; corrected to 4 levels.

## 🟢 API test suite — GREEN (565 passed, 0 failed)

`pnpm --filter api test` now passes: **565 passed, 24 skipped** (the skipped set is
the opt-in DB integration suite + 2 pre-existing skips). The previously-failing
~28 tests were all pre-existing debt and have been fixed, and new coverage was
added for security-critical paths (RBAC middleware, the 2FA flow,
foundation analytics, takhosus certificate eligibility, correspondence signing):

- Completed incomplete Prisma mocks (`$transaction`, `user`/`teacher`/`reward`/
  `roomAssignment`/`growthRecord`/`paymentType.upsert`, etc.).
- Repointed mis-wired mocks (organisasi/tatalaksana mocked the constructor; they
  use the shared `lib/prisma`) and fixed a `vi.mock` hoisting bug (classes).
- Implemented the missing `classService.promoteStudents` the test specified.
- Refreshed stale assertions/inputs (reception model alignment, library select,
  upload response shape, daily-report meal enum, auth RoleCode register flow).
- Gated `database-migrations` (real-DB integration) behind `RUN_DB_TESTS=1` and
  constructed it via the Prisma 7 adapter factory so it loads + skips cleanly.

**To run the DB integration suite:** start Postgres (docker-compose), apply the
schema (`db:push`), then `RUN_DB_TESTS=1 pnpm --filter api test`.

## 🟢 Also green now

- **Web build, type-check, and lint** all pass (`pnpm --filter web build`,
  `tsc --noEmit`, `pnpm --filter web lint` — fixed the user-edit role typing and
  the React Compiler lint errors).
- **API lint** passes (0 errors; `no-explicit-any` warnings remain, non-blocking).
- **CI gates are ON.** `.github/workflows/ci.yml` no longer tolerates lint/build
  failures (escape hatches removed) and runs an API test job.

## 🟢 Local full-stack verification (no Docker required)

The whole stack now boots and has been exercised locally against a **real**
Postgres 16 + Redis (no Docker needed — Postgres/Redis binaries are present):

- `prisma db push` + `db:seed` apply cleanly (after fixing the Prisma 7 config
  import + `--config` flag wiring — see commit history).
- **DB integration suite is green:** `RUN_DB_TESTS=1 pnpm --filter api test` →
  588 passed, 2 skipped (incl. the 22 real-schema DB tests, realigned to the
  restored schema's actual columns/indexes).
- **API boots and serves real requests:** `/health` OK; login verified for
  student/teacher/parent seed users; admins are correctly forced through the
  2FA-setup gate. Confirmed the reset-token-hash leak fix at runtime.
- **Web dev server boots** (Next 16 / Turbopack) and talks to the live API.
- **Playwright** browsers install and run: `landing.spec` 7/7 green and the
  unauthenticated `auth.spec` checks pass against the live stack.

**To reproduce locally:** start Postgres + Redis, write `apps/api/.env`
(DATABASE_URL/SHADOW_DATABASE_URL/REDIS_URL/JWT_SECRET), then
`pnpm --filter api db:push && pnpm --filter api db:seed`,
`pnpm --filter api dev` and `pnpm --filter web dev`.

### Playwright e2e — authenticated foundation in place

A reusable API-based auth helper now exists (`e2e/helpers/auth-api.ts`):
`await loginAs(page, role)` authenticates against the real API and injects the
session (localStorage + middleware cookies). It transparently completes the
**admin 2FA gate** using a TOTP derived from a fixed seed secret — so admins,
super-admins, teachers, parents and students can all be pre-authenticated for
browser tests. Verified by `authenticated-smoke.spec.ts` (5/5 roles green
against the live stack, incl. SUPER_ADMIN + UNIT_ADMIN).

Enablement: seed with `E2E_FIXED_2FA=1` (gives admin accounts the known TOTP
secret — opt-in, never used by a real seed). Bring the stack up with
`scripts/dev-stack.sh` (Postgres + Redis, no Docker).

Remaining: migrate the ~70 existing specs (many written against mock data and
the placeholder `*@cipansor.id`/`*.com` credentials) onto `loginAs` + real
backend data, and complete the route × {nav, CRUD, button, field, RBAC}
coverage matrix.

## 🗺️ Roadmap (remaining follow-ups)

- **Module architecture standardization.** Consistent `routes → controller →
  service → schema → index` naming across all modules; extract inline handlers
  from the ~12 controller-less modules. See `apps/api/AGENTS.md` for the standard.
- **Strict build.** Move `tsconfig.build.json` toward `tsconfig.json` strictness
  (fix the Prisma-null and remaining errors) so `build` == `build:strict`, then
  drop the `Parameters<...>[0]` casts added as lenient-config workarounds.
- **Reduce `no-explicit-any` warnings** (push shared types into `packages/shared`).
- **Web role alignment.** `apps/web/middleware.ts`, `src/config/navigation.ts`,
  `src/stores/auth.ts` still use the legacy `UserRole` vocabulary; align with
  backend `RoleCode` + permissions.
- **Replace remaining FE mock data** with real API calls. Done so far:
  `foundation/dashboard` (admissions KPI + per-unit risk) and
  `foundation/finance/consolidation` (real per-unit financials, cash position,
  6-month trend). Still mocked: `analytics/parent-engagement`,
  `homeroom/performance`, `alumni/sanad`, `foundation/accreditation/readiness`
  (each needs a dedicated backend aggregation endpoint).
- **Web unit/component tests.** Add a jsdom + React Testing Library vitest project
  for `apps/web/src/**` (currently only e2e-helper tests exist).
- **Comprehensive Playwright e2e** across all routes (nav, CRUD, every
  button/field, RBAC) against the seeded local stack.
- **Workflow completions:** ✅ correspondence letter-signed notification and
  ✅ takhosus certificate-eligibility notification are now wired (via the
  `notification:send` event bus). Remaining: accounting per-unit config fallback
  (deferred until `AccountCode` gains a `unitId` column — see the in-code note).

## How to contribute a build fix

1. `pnpm --filter api build:strict` to see strict errors (the real target).
2. Fix the type errors; reuse `@cipansor/shared` types and `@prisma/client` enums.
3. `pnpm --filter api test` and keep it green.
4. Commit with a scoped message on the feature branch.
