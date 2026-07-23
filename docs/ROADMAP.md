# Roadmap — outstanding work, most urgent first

Ordered backlog as of **2026-07-23**. Companion to
[`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md) (which records *defects* in detail); this
file records *what to do next and in what order*.

Ordering principle: anything that can harm people or data first, then anything
a visitor sees, then correctness work, then deliverables, then tidiness.

---

## Current deployment state

- Production runs **`main @ 2bcbb57e`** (includes #355, #356, #358, #359).
- **#357** (e-office: flow history, tiered signing, letter types, templates,
  e-sign) is green and pushed but **not merged and not deployed**.
- Production DB is managed by `db push`, **not** Prisma Migrate — there is no
  `_prisma_migrations` table. Verify every deploy with a non-destructive
  `prisma migrate diff` before building (see §3).

---

## 🔴 1. Before any real launch — demo mode is wide open

`NEXT_PUBLIC_SHOW_DEMO_LOGIN=true` and `DEMO_MODE=true` are live **right now**.
That is deliberate for the demo phase, and it means:

- every demo account's credentials are published on `/login`, and
- those accounts are exempt from the mandatory 2FA wall.

Before a real launch both must become `false` **and the web image rebuilt** —
`NEXT_PUBLIC_SHOW_DEMO_LOGIN` is inlined at build time, so changing `.env`
alone does nothing. Treat this as a launch blocker, not a setting.

## 🔴 2. CORS returns a comma-joined `Access-Control-Allow-Origin`

`app.ts` passes `config.cors.origin` — the raw `CORS_ORIGIN` string — straight
to the `cors` middleware. In production that value is
`"https://cipansor.or.id,https://www.cipansor.or.id,http://localhost:3000"`, so
the header carries three origins at once, which the spec forbids and every
browser rejects.

Real users are unaffected today only because the web app calls the API
same-origin. Any cross-origin client (an admin subdomain, a mobile app, a
partner integration) is broken. Fix: parse the list into an allowlist and
reflect the single matching origin per request.

## 🔴 3. Production DB has no Prisma migration history

No `_prisma_migrations` table, so `migrate deploy` cannot be used and drift is
invisible. Today's safeguard is manual: run

```
prisma migrate diff --from-config-datasource prisma/prisma.config.ts \
  --to-schema prisma/schema.prisma --script
```

before every deploy and require it to be empty. Proper fix: baseline the
database (`migrate resolve --applied`) for the existing migrations so future
deploys are checked automatically.

---

## 🟠 4. Merge and deploy #357

Green (1011 API + 104 web tests, E2E 313). Carries **four migrations** —
letter flow events, letter type/nature, e-sign, e-sign lifecycle — all
rehearsed against a copy of the production schema. Sequence: merge → rehearse
diff → apply migrations → build → deploy → verify.

## 🟠 5. Public pages still render Indonesian in EN/AR

1 of 9 public pages and 0 of 7 landing sections are localized. Every visitor
sees the switcher, so this is outward-facing. Full inventory, the extension
recipe, and the list of things that must **not** be translated are in
`KNOWN_ISSUES.md`.

## 🟠 6. PWA install prompt never fires

Every documented precondition verified correct on the live site; the event
simply does not fire. Next step is Chrome DevTools → Application → Manifest →
**Installability** on a real device, which states the reason directly. Leading
suspect: the manifest's `"id": "/"`. Details in `KNOWN_ISSUES.md`.

## 🟠 7. Temporal data is stale

Academic year and admission period still read 2024/2025 in a system now
running in 2026. `isActive` is being used as if it were a schedule; it is not.
Needs a real current period plus a rule that derives "active" from dates.

---

## 🟡 8. Agreed feature queue (in the order previously approved)

1. **Validation / rejection rules** across forms and flows.
2. **Complete parent & student data** — occupation, income and family members
   (needed for scholarship and fee relief), CRUD screens for guardian data,
   SPMB → active santri only after the registration fee is settled (transfers
   excepted), and **jenjang progression TK→SD→SMP→SMA** that carries prior data
   forward with an explicit change confirmation.
3. **Fill the ~41 empty tables**, including the **RPJP / Renstra / RKA** demo
   data drawn from the three planning documents supplied on 2026-07-23. The
   models already exist and are shaped for it: `StrategicPlan` has a
   `parentId` documented as *RPJP → RENSTRA → RKA* and a nullable `unitId`
   because RPJP/Renstra are foundation-wide. Map Sasaran → `PlanObjective`,
   IUP/indicators → `PlanIndicator`, Program/Kegiatan → `PlanActivity`. Keep
   the user's framing: realistic mock-ups, not official documents.
4. **Module audit** — every backend module reachable from the frontend and
   vice versa, and reachable by at least one role.

## 🟡 9. Documentation deliverable (in flight)

Branch `docs/user-guide`. Decisions already taken with the user:

- **Role-first user guide**, where each role's chapter details how that role
  uses every module it touches.
- **README becomes lean** — overview, tech, install, links — with the
  screenshot gallery moving into the guide.
- `QUICK_START.md` and `docs/screenshots/` already deleted on that branch.

Remaining: regenerate all screenshots into `docs/images` (checking each page
and fixing what is broken — this doubles as the role/menu audit), write the
guide with a clickable table of contents, then rewrite the README.

## 🟡 10. Customer-service chatbot — Phase 1 only

Advisory already given (2026-07-23). Build **only** the public widget with RAG
over public pages, plus the eval harness (golden questions **and** a red-team
set asserting non-disclosure). Do **not** build the authenticated agent as a
vector index over the database: it must call the existing authorized endpoints
as the logged-in user with their **active** role, so `letterScopeWhere`,
`assertLetterAccess` and the nature levels apply unchanged. Conversation state
must be partitioned per (user, activeRole).

---

## 🟠 11. Route/naming refactor — PPDB / PSB → SPMB

**Approved, and the database turned out not to be involved at all.**

An earlier note in this file warned that renaming `PPDB`/`PSB` enum values
would be a data migration and should be deferred. **That was wrong**, and the
correction matters because it removes the only risky part:

- `schema.prisma` contains `PPDB`/`PSB` in **comments only** (4 occurrences) —
  no enum values, no models, no columns.
- The live production database was checked directly: **zero** tables, columns
  or enum values matching `ppdb`/`psb`.
- RoleCodes are clean too (0 affected).

So there is **no data migration and no data risk**. The rename is entirely
code, filenames, routes and copy — mechanical and reversible. The user
explicitly authorised proceeding (2026-07-23), noting the system is not yet
production-ready.

Scope, measured 2026-07-23 — three vocabularies coexist: `ppdb` in 38 files,
`psb` in 35, `spmb` in 32.

Remaining work:

1. **Backend** — rename `apps/api/src/modules/admissions/ppdb-wave.*` to
   `spmb-wave.*`, its exports in `admissions/index.ts`, and the
   `/api/ppdb-waves` paths in the controller's docs and routes.
2. **Frontend** — `/ppdb` and `/psb` pages already redirect to `/admissions`;
   settle on the SPMB vocabulary in routes and copy.
3. **Keep every old path alive with a permanent redirect.** Anything may hold
   an old URL — a bookmark, a printed flyer's QR, an external integration. A
   rename that 404s a family mid-registration is a real harm, not cosmetic.
4. Sweep the comments in `schema.prisma` and elsewhere.

Timing note (still worth honouring): running this *after* the role/menu audit
keeps audit findings attributable to real bugs rather than rename fallout. If
run before, expect to re-check any page the sweep flags.

## 🟢 12. Long-tail technical debt

- ~14 API services still scope with `unitId || 'none'`.
- ~210 racy `isVisible({ timeout })` probes in e2e specs.
- Dependabot PRs **#333** (zod 4) and **#328** (eslint 10) still open.
- Stray root-owned directory `apps/api/apps/api` (created by a `docker run`);
  harmless because git does not track empty directories, but it makes
  `git stash -u` and `git checkout` emit permission warnings that break `&&`
  chains.

---

## Operating notes that keep costing time when forgotten

- **`node` is not on this host's PATH.** Everything runs through
  `docker run node:22-alpine` with `corepack prepare pnpm@9.15.9 --activate`.
- **After switching branches, regenerate before trusting a failure:**
  `pnpm --filter @cipansor/shared build` and `pnpm --filter api db:generate`.
  A stale Prisma client makes enums import as `undefined`; a stale `shared`
  build makes `tsc` report missing exports that plainly exist. Note `vitest`
  can pass while `tsc` fails, because tests resolve through the source alias.
- **CI runs `pnpm install --frozen-lockfile`.** A local install is not frozen,
  so lockfile drift passes locally and fails CI at the install step — which
  looks like several unrelated jobs failing within seconds.
- **Never push to `main`** (also enforced by a repository ruleset requiring PRs)
  and never `Write` `schema.prisma` wholesale — edit it surgically.
