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

1. **Never clobber `apps/api/prisma/schema.prisma`.** It is very large —
   ~9,400 lines, hundreds of models and enums. (Exact counts drift; don't
   hard-code them here.) It was once accidentally truncated to a stub, which
   broke the entire backend. Edit surgically; run `pnpm --filter api db:generate`
   after changes. A committed PreToolUse hook (`.claude/hooks/guard.sh`) blocks a
   full-file Write to this path.
2. **Prisma is the source of truth for DB enums and models.** Import DB enums
   (`RoleCode`, `VisitStatus`, `LeaveStatus`, …) from `@prisma/client`, not from
   `@cipansor/shared`. `@cipansor/shared` holds API/DTO contracts only. (Rule 3
   applies to the specific choice of role enum.)
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
7. **Ship tests with the code — no behavior change merges untested.** Every
   new/changed API **service or controller** ships with vitest tests in the
   module's `tests/`; every new/changed **web route or user flow** ships with
   Playwright e2e coverage in `apps/web/e2e/`. A bug fix ships with a test that
   fails before the fix and passes after. Exempt: barrels (`index.ts`),
   type-only files, and pure Zod `schema.ts` (cover them through the
   service/route that uses them). "Done" means the code **and** its tests are in
   the same commit and the full local gate — including e2e — is green.
8. **Ship features wired end-to-end — no orphaned API, no mocked UI.** A change
   is not done until both sides are connected:
   - **New/changed API endpoint that serves a user-facing capability** ships in
     the same change with its web consumer — a React Query hook in
     `apps/web/src/hooks/*` plus the page/component that uses it — not a
     stubbed endpoint waiting for a UI.
   - **New/changed web feature that needs data** is backed by a real endpoint;
     never hardcode mock/placeholder data (see `apps/web/AGENTS.md`). If the
     endpoint is missing, add it to the relevant API module in the same change.
   - **Contracts live once, in `@cipansor/shared`.** Reuse the existing DTO/Zod
     type there; only when it genuinely doesn't exist do you add a new one to
     shared (never redeclare it or fall back to `any` in either app). Backend
     validates with it at the edge; the web imports the same type.
   - **Exempt** (backend-only by nature, no UI required): webhooks and
     third-party callbacks, cron/scheduler jobs, health/readiness probes,
     internal integration-orchestrator calls, and PWA/push endpoints; and on the
     web side, purely presentational/static pages with no data needs. When you
     take an exemption, it should be obvious why from the code — otherwise wire
     the other side.

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

## Committed skills and hooks

`.claude/` carries the automation this repo relies on, and it is checked in so
every session gets it.

| | |
|---|---|
| `skills/gate` | the quality gate AGENTS.md requires before pushing |
| `skills/stack` | bring the local Postgres + Redis stack up |
| `skills/screenshot-roles` | render real components for before/after shots |
| `skills/sync-records` | move findings out of the transcript and into files |
| `hooks/guard.sh` | PreToolUse — blocks a full-file Write to `schema.prisma` and a push to `main` |
| `hooks/session-bootstrap.sh` | SessionStart — installs deps, generates the Prisma client, builds shared |
| `hooks/pre-compact-sync.sh` | PreCompact — pauses the first manual `/compact` of a session so the records get written first |
| `hooks/stop-sync-baseline.sh` | SessionStart — records the HEAD sha the session started from, so the Stop hook has something to compare against |
| `hooks/stop-sync-records.sh` | Stop — asks for a `sync-records` pass once, at the first resting point after the session has produced commits |

**Why the compaction hook exists.** Compaction discards the transcript, and only
files survive it. Findings were reaching `memory/`, the plan and the ROADMAP
only because the user remembered to ask, every single time. The hook asks
instead: it exits 2 on the first manual `/compact`, which hands control back for
a `sync-records` pass, and lets the next one through unconditionally — so it can
nag but can never wedge a session. It never blocks *auto*-compaction, which
fires at the context wall where a refusal would leave no way out.
`/compact skip-sync` bypasses it deliberately.

**Why there is a `Stop` hook too.** The compaction hook only guards the
compaction door. A session that finishes without ever being compacted never
passes through it — and those are exactly the sessions that leave findings in
the transcript alone. `stop-sync-records.sh` closes that gap.

It is deliberately hard to trigger, because `Stop` fires at the end of *every*
turn and a reminder that appears every turn teaches everyone to ignore hook
messages. It stays quiet unless all five hold: not already continuing from its
own block (`stop_hook_active` — this is what makes a loop impossible), not yet
asked this session, at least one commit since the session began, no pending
changes to tracked files (a resting point, not mid-edit), and no durable record
touched since the session began. One reminder per session, then never again.
`CLAUDE_SKIP_STOP_SYNC=1` turns it off.

Both `Stop` and `PreCompact` fail open on everything else — unreadable input, an
unreadable git tree, an unwritable stamp directory. A hook that breaks a session
is worse than a hook that misses a reminder.
