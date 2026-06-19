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
- **API build errors reduced from 336 → ~73** (lenient build) through the above.

## 🚧 In progress — API build green

The lenient build (`pnpm --filter api build`) still reports ~73 TypeScript errors;
strict build (`build:strict`) reports more (includes tests + null-safety). Goal:
both green, then unify and turn CI gates on.

Remaining error categories:

1. **Lenient-config Zod false-positives (~20).** `tsconfig.build.json` sets
   `strictNullChecks: false`, which degrades Zod inference so every validated
   field becomes optional → controllers passing validated bodies to services that
   require fields error ("optional but required"). Affected: lingkungan,
   pengawasan, perencanaan, talenta, finance/accounting, hr/employee-documents,
   hr/employment-history, system-secrets, tahfidz controllers. **Correct fix:**
   move the build toward strict (`strictNullChecks: true`) and resolve the
   resulting Prisma-null errors, rather than relaxing further.
2. **Shared-type ↔ Prisma-model divergence (reception, ~11).** `@cipansor/shared`
   `StudentVisit`/`StudentPackage` use field/enum names (`relationship`, `needs`,
   `expedition`, `content`, `pickedUpAt`; `VisitStatus.PENDING`,
   `PackageStatus.NOTIFIED/PICKED_UP`) that don't match the DB model
   (`relation`, `purpose`, `description`, `deliveredTo`; `CHECKED_IN`,
   `RECEIVED/DELIVERED/RETURNED`). Needs a product decision + frontend update to
   reconcile the contract end-to-end.
3. **Prisma include/select bugs (genuine, ~15).** e.g. selecting `name` on
   `Student` (it's on `user`), `account` not included on `Budget`,
   `status`/`unitId` filters on `AcademicYear` that don't exist, `user` include on
   a direct `User` relation in simaan. Fix each query's include/select to match
   the schema.
4. **Missing schema/DTO fields & enum mismatches (~10).** e.g.
   `inventory` `TransactionType` import, notification priority/recipient/channel
   enum literals, marketing/syariah/psb create-input field names. Align
   DTOs/services with the model.

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
