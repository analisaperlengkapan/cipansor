# Architecture

System overview for the Cipansor IMS monorepo. This is the "map"; the
authoritative, area-specific conventions live in the `AGENTS.md` files
(root + per package) and the known gaps live in
[`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md).

## Monorepo layout

```
apps/
  api/        Express 5 + Prisma 7 REST API (+ socket.io realtime, cron jobs)
  web/        Next.js 16 (App Router) + React Query frontend
packages/
  shared/     Framework-agnostic DTOs / Zod schemas shared by both apps
```

Tooling: **pnpm** workspaces + **Turborepo**. Package manager is pinned
(`packageManager: pnpm@11.13.0`); use `corepack` rather than a global pnpm.

## Backend (`apps/api`)

Express 5 with a layered, per-feature module structure. The standard — and the
reuseable cross-cutting pieces — are documented in
[`apps/api/AGENTS.md`](../apps/api/AGENTS.md):

```
src/modules/<name>/
  routes.ts      # Router: authenticate/authorize/validate -> controller
  controller.ts  # thin; asyncHandler; returns via ApiResponse
  service.ts     # business logic; the ONLY layer that touches Prisma
  schema.ts      # Zod schemas (types via z.infer)
  index.ts       # export { <name>Routes }
  tests/         # vitest, Prisma mocked
```

Layering rule: **routes never call Prisma; controllers never embed business
logic.** Modules are mounted in `src/app.ts` under `/api`.

Cross-cutting foundations (reuse, don't reinvent):

- **Responses** — `src/utils/response.ts` (`ApiResponse.success/error/paginated`).
- **Errors / validation** — `src/middleware/error.ts` (`Errors.*`, `asyncHandler`,
  `validate`/`validateQuery`); centralized Prisma/Zod/JWT error mapping.
- **Auth / RBAC** — `src/middleware/auth.ts` (`authorize(RoleCode.X)`,
  `hasPermission`, `isAdmin`, …). `req.user` carries `roleCode`, `permissions[]`,
  `unitId`. Gate on `RoleCode`/permissions — not the deprecated `role` string.
- **Infra** — `src/lib/{prisma,redis,jwt,logger,event-bus,realtime}.ts`.
- **Cross-module side effects** — emit typed events on `eventBus` (`AppEvents`);
  don't reach into other modules' services. `notification:send` drives the
  notifications module; socket.io (`lib/realtime.ts`) pushes live updates.
- **Scheduled work** — `src/jobs/` (node-cron): snapshots, summaries, cleanup,
  auto-billing.

### Data layer (Prisma 7)

- The runtime client connects through the **`@prisma/adapter-pg` driver adapter**
  (`src/lib/prisma.ts`); the connection URL lives in `prisma/prisma.config.ts`,
  **not** in `schema.prisma`. Standalone scripts use `prisma/client.ts`'s
  `createPrismaClient()`.
- Edit `prisma/schema.prisma`, then `pnpm --filter api db:generate`. **Never**
  hand-clobber the schema (it was once truncated to a stub — see
  [`apps/api/prisma/AGENTS.md`](../apps/api/prisma/AGENTS.md)).
- Import DB enums and the `Prisma` namespace from `@prisma/client`; use
  `RoleCode` (not the legacy `UserRole`). `Decimal` comes from
  `@prisma/client/runtime/client`.

## Frontend (`apps/web`)

Next.js 16 App Router (RSC + client components). Conventions in
[`apps/web/AGENTS.md`](../apps/web/AGENTS.md):

- **Data layer** — a single Axios client in `src/lib/api.ts` whose `baseURL`
  already includes `/api` (`NEXT_PUBLIC_API_URL`, e.g.
  `http://localhost:3001/api`). Hooks therefore call paths **without** an `/api`
  prefix (`api.get('/risk/123')`). Wrap calls in React Query hooks under
  `src/hooks/*`; surface errors via `src/lib/api-error.ts`.
- **Auth** — `accessToken` cookie read by `middleware.ts` before page JS; the
  Axios response interceptor refreshes on 401 then redirects to `/login`.
- **Routing/menus** — gate by role/permission (`config/navigation.ts`,
  `components/auth/protected-route.tsx`).

## Shared (`packages/shared`)

Single source of truth for DTOs and Zod schemas consumed by both apps. No
app-specific imports; export through the barrel. See
[`packages/shared/AGENTS.md`](../packages/shared/AGENTS.md). Note `z.infer`
(output; defaulted fields required) vs `z.input` (defaulted fields optional)
when typing request bodies.

## Request lifecycle (typical authenticated call)

```
web hook (React Query)
  -> lib/api.ts (Axios; Bearer token; baseURL .../api)
  -> Express route (authenticate -> authorize/hasPermission -> validate)
  -> controller (asyncHandler)
  -> service (business logic; Prisma via adapter)
  -> ApiResponse envelope { success, data, meta? }
  -> (side effects) eventBus -> notifications / socket.io realtime
```

## Testing & the green gate

Run the full gate locally before pushing (CI re-runs it as a backstop):

```
pnpm --filter @cipansor/shared build
pnpm --filter api db:generate
pnpm --filter api build        # strict tsc (the real type gate)
pnpm --filter api test         # vitest, Prisma mocked
pnpm --filter web build
pnpm --filter web test:e2e     # Playwright; needs the seeded stack
```

- API unit tests mock Prisma; the opt-in DB integration suite runs with
  `RUN_DB_TESTS=1` against a real Postgres.
- Playwright e2e uses a Page Object Model + fixtures under `apps/web/e2e`;
  authenticated flows seed the session (admin 2FA via a fixed seed secret,
  `E2E_FIXED_2FA=1`). Mock-based specs seed auth with `addInitScript` so the
  store is hydrated before first paint (avoids logout-redirect races).

## Deployment

Each app has a multi-stage `Dockerfile` (`apps/api`, `apps/web`):

- **api** — fresh `pnpm install --prod` closure + compiled `dist` + the generated
  Prisma client; non-root; `node dist/main.js`.
- **web** — Next.js **standalone** output (`server.js`); non-root.

Both trust a build-time proxy CA passed as a BuildKit secret (`id=proxyca`) when
building behind a TLS-terminating egress proxy, and bake nothing proxy-specific
into the image. The build context is kept tiny via `.dockerignore`.
