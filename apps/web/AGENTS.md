# AGENTS.md — apps/web

Next.js 16 (App Router) + React 19 client. Read the root `AGENTS.md` first.

## Conventions

- **App Router** under `src/app/**`. Prefer Server Components; mark Client
  Components with `"use client"` only when they need interactivity/hooks.
- **Data layer:** the Axios instance in `src/lib/api.ts` (errors via
  `src/lib/api-error.ts`), wrapped by **React Query** hooks in `src/hooks/*`.
  `src/lib/api-client.ts` is a back-compat re-export; import from `lib/api`.
- **No mock/placeholder data in pages.** If an endpoint is missing, add it to the
  API rather than hardcoding. (Pages still carrying mock data are listed in
  `docs/KNOWN_ISSUES.md`.)
- **Types come from `@cipansor/shared`.** Don't redeclare DTOs or use `any` for
  API payloads.
- **Roles:** route protection (`middleware.ts`), navigation (`src/config/navigation.ts`),
  and the auth store (`src/stores/auth.ts`) must reflect real backend `RoleCode`
  + permissions. (Aligning the legacy `UserRole` usage here is tracked in
  `docs/KNOWN_ISSUES.md`.)
- **UI:** Tailwind + Radix primitives in `src/components/ui/*`; compose, don't
  fork. Charts via the shared chart components.

## State & providers

- React Query provider: `src/components/providers/query-provider.tsx`.
- Realtime: `src/providers/socket-provider.tsx` (Socket.IO).
- Auth state: `src/stores/auth.ts`.

## Testing

- **E2E:** Playwright in `e2e/` (`pnpm test:e2e`). Reuse the Page Object Model in
  `e2e/page-objects`, fixtures (`e2e/fixtures/{auth,api}.fixture.ts`), and helpers.
  Run against the real seeded stack (Postgres+Redis up, API seeded) — `webServer`
  starts `pnpm dev`. Cover each route's nav, CRUD, every button/field (valid +
  invalid), and RBAC per role. Prefer real API calls over `page.route` mocks.
- **Unit/component tests:** add jsdom + React Testing Library under `src/**`
  (see `docs/KNOWN_ISSUES.md` — a vitest project for `src` is a pending task).

## Build

- `pnpm build` runs `next build`. `next.config.ts` does NOT ignore type/lint
  errors — keep the build type-clean. Security headers and Sentry are configured
  there; don't remove them.
