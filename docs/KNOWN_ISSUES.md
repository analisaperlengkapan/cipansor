# Known Issues & Technical Debt

Status of production-readiness work and the remaining roadmap. Updated as part of
the production-readiness / architecture-standardization effort. For the system
overview see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## ✅ Resolved in this effort

- **FE↔BE double-`/api` bug (false green).** Seven React Query hooks
  (`use-syariah`, `use-tata-laksana`, `use-organisasi`, `use-quality`,
  `use-litbang`, `use-pengawasan`, `use-complaints`) prefixed paths with `/api`
  even though the Axios `baseURL` already ends in `/api`, so they hit
  `/api/api/...` and 404'd against the live backend. The e2e mocks' `**/api/...`
  globs masked it. Fixed all 59 call sites to match the majority convention.
- **Docker images reworked & verified runnable.** `apps/api` is a multi-stage
  build using a fresh `pnpm install --prod` closure + compiled `dist` + the
  generated Prisma client (~929 MB; boots, `/health` 200, PrismaClient loads);
  `apps/web` uses Next.js standalone output (~537 MB; boots, `/` 200). Build
  context kept ~136 KB via `.dockerignore`; both trust a build-time proxy CA via
  a BuildKit secret. (`pnpm deploy` was dropped — it hangs in CI sandboxes.)
- **E2E stabilized.** Root-caused and fixed every hard failure (a tahfidz raw-SQL
  bug referencing a non-existent `deleted_at`, the class-management edit flow,
  and several brittle mock-auth specs). Mock-based specs now seed auth via
  `page.addInitScript` (before first paint) with `/api/auth/me` + `/api/auth/refresh`
  mocks and a low-priority `/api/**` fallback, removing the logout-redirect races.
- **Removed stale artifacts.** `dashboard/dashboard.controller.ts.old` and the
  dead `apps/web/e2e/temp/` placeholder spec.

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
- **Replace remaining FE mock data** with real API calls. ✅ **DONE — all
  previously-mocked pages are now real-API:** `foundation/dashboard`,
  `foundation/finance/consolidation`, `analytics/education`,
  `attendance/heatmap`, `parent/buku-penghubung` Weekly Progress,
  `analytics/parent-engagement` (new `/analytics/parent-engagement`),
  `alumni/sanad` (new `/sanad/tree` transmission tree),
  `homeroom/performance` (new `/homeroom/performance-overview`), and
  `foundation/accreditation/readiness` (new
  `/foundation/accreditation/readiness`). Also implemented the missing backend
  for the pre-existing `useStudentCompleteProfile` hook
  (`/students/:id/complete-profile`, Student 360 aggregate — counseling and
  medical details deliberately excluded; they stay behind their own
  permission-guarded endpoints).
- **Web unit/component tests.** Add a jsdom + React Testing Library vitest project
  for `apps/web/src/**` (currently only e2e-helper tests exist).
- **Comprehensive Playwright e2e** across all routes (nav, CRUD, every
  button/field, RBAC) against the seeded local stack.
- **Workflow completions:** ✅ correspondence letter-signed notification and
  ✅ takhosus certificate-eligibility notification are now wired (via the
  `notification:send` event bus). Remaining: accounting per-unit config fallback
  (deferred until `AccountCode` gains a `unitId` column — see the in-code note).

## 📋 Disposition of the auto-generated PR backlog (#278–#298)

A review of the 20 open PRs (2026-07) found: 18 failed CI (build/lint/test/e2e),
massive duplication (the same feature implemented 3–5× across PRs — e.g.
`marketing/roi.service.ts` rewritten by 5 PRs), 4 PRs editing `schema.prisma`
with **zero migrations**, and systematically overstated descriptions. Verdict
and follow-through:

- **Rebuilt properly on this branch (verified, tested):** Student 360
  complete-profile (#281/#283/#284/#285), parent-engagement analytics
  (#282/#286/#289), sanad transmission tree (#278/#286/#294 part),
  homeroom performance + accreditation readiness (#286), cash-flow page fix
  (#279 — its restyle dropped `MainLayout`; we kept the layout and fixed the
  dead export button instead).
- **Already existed on `main`; PR variants rejected:** talenta `syncFromPKG`,
  marketing ROI service, perencanaan budget-realization — the competing PR
  rewrites all failed CI.
- **Rejected as unsafe:** #281's `responsibleId: risk.ownerId` on auto audit
  findings (`Risk.ownerId` is documented as "User **or Department**"; blind
  assignment can violate the `AuditFinding.responsibleId → User` FK).
- **Deferred (rebuild from scratch if wanted, with real migrations):** the
  large feature sets in #294–#298 (E-Simaan, digital library, facility
  ticketing, alumni placement, practicum/qiyadah/turats, admissions+CBT
  bridge, tahfidz prediction/gamification, Flutter mobile + FCM/WhatsApp).
  All fail CI and change the schema without migrations.
- **#293 (demo seeding)** is the only non-generated PR; left open — needs its
  e2e failure fixed by its author before merge.

## How to contribute a build fix

1. `pnpm --filter api build:strict` to see strict errors (the real target).
2. Fix the type errors; reuse `@cipansor/shared` types and `@prisma/client` enums.
3. `pnpm --filter api test` and keep it green.
4. Commit with a scoped message on the feature branch.
