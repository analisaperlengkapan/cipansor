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

## 🟢 API test suite — GREEN (533 passed, 0 failed)

`pnpm --filter api test` now passes: **533 passed, 24 skipped** (the skipped set is
the opt-in DB integration suite + 2 pre-existing skips). The previously-failing
~28 tests were all pre-existing debt and have been fixed:

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

## 🗺️ Roadmap (not yet started)

These were scoped in the production-readiness plan and remain follow-ups:

- **Module architecture standardization.** Consistent `routes → controller →
  service → schema → index` naming across all modules; extract inline handlers
  from the ~12 controller-less modules. See `apps/api/AGENTS.md` for the standard.
- **Turn CI gates on.** `.github/workflows/ci.yml` currently tolerates lint/build
  failures (`|| echo ...`). Once the build is green, drop the escape hatches and
  add a vitest job for api + web.
- **Web role alignment.** `apps/web/middleware.ts`, `src/config/navigation.ts`,
  `src/stores/auth.ts` still use the legacy `UserRole` vocabulary; align with
  backend `RoleCode` + permissions.
- **Replace remaining FE mock data** with real API calls (e.g.
  `parent/buku-penghubung`, `unit-usaha`, `dashboard/executive` fallback,
  `analytics/education`, `attendance/heatmap`, `foundation/dashboard`,
  `assessment/report-cards/[id]/print-merdeka`).
- **Web unit/component tests.** Add a jsdom + React Testing Library vitest project
  for `apps/web/src/**` (currently only e2e-helper tests exist).
- **Comprehensive Playwright e2e** across all routes (nav, CRUD, every
  button/field, RBAC) against the seeded local stack.
- **Workflow completions:** correspondence digital-signature trigger, takhosus
  notification/certificate emission wiring, accounting per-unit config fallback.

## How to contribute a build fix

1. `pnpm --filter api build:strict` to see strict errors (the real target).
2. Fix the type errors; reuse `@cipansor/shared` types and `@prisma/client` enums.
3. `pnpm --filter api test` and keep it green.
4. Commit with a scoped message on the feature branch.
