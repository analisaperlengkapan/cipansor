# Known Issues & Technical Debt

This document tracks known issues and technical debt in the Cipansor project.

## Web Build Issues (Next.js)

The following web pages have missing hook exports that cause build failures:

### High Priority (Missing Exports)

1. **PAUD Reports Page** (`apps/web/src/app/paud/reports/[id]/page.tsx`)
   - Missing: `useReportPhotos`, `useFinalizePAUDReport`, `ReportStatus`
   - Should import from: `@/hooks/use-paud-report`
   - Suggested fix: Use `useAddReportPhoto` instead of `useReportPhotos`

2. **Simaan Edit Page** (`apps/web/src/app/tahfidz/simaan/[id]/edit/page.tsx`)
   - Missing: `useUpdateSimaanExam`
   - Should import from: `@/hooks/use-simaan`
   - Suggested fix: Use `useUpdateSimaan` instead

3. **Certificate Pages** (`apps/web/src/app/certificates/*.tsx`)
   - Multiple missing hook exports

4. **Daily Reports Pages** (`apps/web/src/app/paud/daily-reports/*.tsx`)
   - Missing hook exports for class and parent views

5. **Rapor Pesantren** (`apps/web/src/app/rapor-pesantren/*.tsx`)
   - Multiple missing exports

6. **Tahfidz Module** (`apps/web/src/app/tahfidz/sanad/*.tsx`, `simaan/*.tsx`, `murojaah/*.tsx`)
   - Multiple missing hook exports

### How to Fix Web Build Issues

1. Check the existing hooks in `apps/web/src/hooks/`
2. Either add the missing exports to the hook files
3. Or update the page components to use existing exports
4. Run `pnpm --filter web build` to verify fixes

## TypeScript Strict Mode Issues (API)

The following modules have TypeScript type errors that need to be fixed for full strict mode compliance:

### High Priority (Core Functionality)

1. **`src/modules/reporting/report-builder.service.ts`** (20 errors)
   - Missing includes for related entities in Prisma queries
   - Property access on types that don't include relations

2. **`src/modules/analytics/alerts.service.ts`** (11 errors)
   - AttendanceStatus enum comparison uses lowercase instead of uppercase
   - Missing user relation in student queries
   - Decimal type conversions

3. **`src/modules/analytics/forecast.service.ts`** (7 errors)
   - Type mismatches in forecast calculations

4. **`src/modules/analytics/bulk.service.ts`** (7 errors)
   - Prisma create input type mismatches

### Medium Priority (Enhancement Features)

5. **Alumni service** (5 errors)
6. **Curriculum service** (4 errors)
7. **Analytics insights** (4 errors)

### Low Priority (Seed Data)

8. **`prisma/seeds/immunization-reference.ts`** (2 errors)
   - JSON type assignment issues

## Recommended Fixes

### Short-term (1-2 weeks)

1. Fix AttendanceStatus enum usage - use `PRESENT` instead of `'present'`
2. Add proper includes in Prisma queries for related entities
3. Fix Decimal to number conversions using `Number()` or `.toNumber()`

### Medium-term (1 month)

1. Review and fix all analytics module type issues
2. Update reporting service with proper type annotations
3. Add proper validation schemas for all service inputs

### Long-term (ongoing)

1. Enable strict TypeScript mode gradually
2. Add comprehensive unit tests for all services
3. Add integration tests for critical paths

## Workarounds Applied

To allow the build to succeed in development, the following workarounds are used:

1. **tsconfig.build.json** - Less strict TypeScript settings for build
2. **`as any` type assertions** - Used sparingly in service files where Prisma types are complex

## How to Contribute Fixes

1. Pick a file from the list above
2. Run `pnpm --filter api build:strict` to see specific errors
3. Fix the type errors
4. Ensure tests pass: `pnpm --filter api test`
5. Submit a PR with the fixes

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Type System](https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety)
- [Express with TypeScript](https://expressjs.com/en/advanced/best-practice-performance.html)
