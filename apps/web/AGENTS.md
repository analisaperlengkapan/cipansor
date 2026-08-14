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
  `docs/KNOWN_ISSUES.md`.) This is the web half of **golden rule #8** (ship
  features wired end-to-end): a page needing data is backed by a real endpoint in
  the same change.
- **Types come from `@cipansor/shared`.** Don't redeclare DTOs or use `any` for
  API payloads. Reuse the shared contract; only add a new one to `@cipansor/shared`
  when it truly doesn't exist yet (golden rule #8).
- **Roles:** route protection (`middleware.ts`), navigation (`src/config/navigation.ts`),
  and the auth store (`src/stores/auth.ts`) must reflect real backend `RoleCode`
  + permissions. (Aligning the legacy `UserRole` usage here is tracked in
  `docs/KNOWN_ISSUES.md`.)
- **UI:** Tailwind + Radix primitives in `src/components/ui/*`; compose, don't
  fork. Charts via the shared chart components.

## App shell & navigation

Three defect classes came from this area in one week; each now has a guard test
in `src/lib/rbac.test.ts`. Run `pnpm --filter web test` after touching a page,
a route or `src/config/navigation.ts`.

- **Every authenticated page renders its own shell.** Wrap the return in
  `<MainLayout>` (from `@/components/layout`) — sidebar, header, and
  `ProtectedRoute`. Pages self-wrap **except** under `/parent`, `/marketing`,
  `/e-office` and `/reception`, which own a `layout.tsx` supplying it for the
  whole subtree. When auditing, check for an ancestor `layout.tsx` before
  concluding a page is shell-less; grepping only `page.tsx` for `MainLayout`
  wrongly flags all 14 `/parent/*` pages. 50 pages once rendered as a bare
  `<div>` with no nav and no logout.
- **NEVER wrap a page listed in `middleware.ts`'s `publicPrefixes`**
  (`/profil`, `/program-unggulan`, `/unit`, `/berita`, `/wakaf-infaq`,
  `/kontak`, `/verifikasi`). `MainLayout` implies `ProtectedRoute`, so this
  bounces anonymous visitors to the staff login — the regression that got the
  Google Ad Grants application rejected once already. The guard test parses
  `publicPrefixes` out of `middleware.ts` rather than duplicating the list.
- **A public page belongs to TWO lists.** `publicPrefixes` in `middleware.ts`
  decides what may be *read* without a session; `PUBLIC_PATH_PREFIXES` in
  `src/lib/host-split.ts` decides which *host* serves it —
  `cipansor.or.id` or `portal.cipansor.or.id`. Miss the second and the page is
  reachable only from the portal, behind a login; miss the first and the apex
  serves it and then bounces the visitor. `host-split.test.ts` compares the two
  and fails if they diverge, so adding to one is enough to be told about the
  other. Background in [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md).
- **The nav contract runs both ways.** `src/config/navigation.ts` decides what a
  role is *shown*; `src/lib/rbac.ts` (`roleRouteAccess`, consumed by
  `middleware.ts`) decides what it may *open*. Add a nav item → add its prefix
  to `roleRouteAccess`. And a new page must appear in some role's menu, be a
  sub-page of a hub that does, be an action page (`new|create|edit|generate|
  bulk|check-in`), or be listed in `NO_MENU_BY_DESIGN` **with a reason** — 34
  top-level pages once shipped reachable only by typing the URL.
- **Sidebar scrolling:** the nav `ScrollArea` needs `min-h-0`. A flex child
  defaults to `min-height: auto` and refuses to shrink below its content, so the
  area grew to the full menu height and nothing could scroll.

## State & providers

- React Query provider: `src/components/providers/query-provider.tsx`.
- Realtime: `src/providers/socket-provider.tsx` (Socket.IO).
- Auth state: `src/stores/auth.ts`.

## Testing

- **Mandatory (golden rule #7):** every new/changed **route/page or user flow**
  ships with Playwright e2e coverage in the **same commit**. A page is not "done"
  until a spec drives its real flow. A bug fix ships with a regression spec.
- **E2E:** Playwright in `e2e/` (`pnpm test:e2e`). Reuse the Page Object Model in
  `e2e/page-objects`, fixtures (`e2e/fixtures/{auth,api}.fixture.ts`), and helpers.
  Run against the real seeded stack (Postgres+Redis up, API seeded) — `webServer`
  starts `pnpm dev`. Cover each route's nav, CRUD, every button/field (valid +
  invalid), and RBAC per role. Prefer real API calls over `page.route` mocks.
  Radix triggers animate — on Firefox/WebKit under CI load, `click({ force: true })`
  once the element is visible avoids the flaky "element not stable" gate.
- **Unit/component tests:** add jsdom + React Testing Library under `src/**`
  (see `docs/KNOWN_ISSUES.md` — a vitest project for `src` is a pending task).
  Once that project exists, shared hooks/utilities get unit tests too.

## PWA (the mobile app)

The mobile app is this web app shipped as an installable PWA — there is no
separate mobile codebase. Pieces: `public/manifest.json` + `public/icons/*`,
`public/sw.js` (service worker), `public/offline.html`, and
`components/pwa/{service-worker-register,install-prompt}.tsx` mounted in the root
layout. Rules: never cache `/api/**` in the service worker (auth/session must
stay fresh); the SW registers in production only **and never under browser
automation** (`navigator.webdriver`) — a navigation-intercepting SW trips a
known WebKit+Playwright engine bug, so `ServiceWorkerRegister` skips it to keep
e2e deterministic across engines (real users are unaffected); keep the manifest
icons in sync if you regenerate them. See `docs/MOBILE_API.md` for the
parent-app API contract.

## Build

- `pnpm build` runs `next build`. `next.config.ts` does NOT ignore type/lint
  errors — keep the build type-clean. Security headers and Sentry are configured
  there; don't remove them.
