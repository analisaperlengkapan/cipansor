# Roadmap — outstanding work, most urgent first

Ordered backlog as of **2026-07-23**. Companion to
[`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md) (which records *defects* in detail); this
file records *what to do next and in what order*.

Ordering principle: anything that can harm people or data first, then anything
a visitor sees, then correctness work, then deliverables, then tidiness.

---

## Current deployment state

- As of **2026-07-24** the web container runs `main @ 460cb678` (through #368)
  and the API container an image built earlier the same day (through #365, so
  it includes #357 and the CORS fix). Both were deployed from this host.
- The two containers can therefore hold *different* commits. Before assuming
  production runs what `main` says, check the running image itself — e.g.
  `docker exec cipansor-api grep -o "<snippet>" /app/apps/api/dist/…/<file>.js`.
  This is not hypothetical: reseeding for §7 while the API image predated the
  matching controller fix would have left the site *differently* broken.
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

## ✅ 2. CORS returned a comma-joined `Access-Control-Allow-Origin` — fixed

`app.ts` passed the raw `CORS_ORIGIN` string to the `cors` middleware, so the
header carried all three production origins at once — which the Fetch standard
forbids and every browser rejects. Socket.IO had the same bug independently.
Fixed in `apps/api/src/config/cors.ts`: the list is parsed into an allowlist and
the single matching origin is reflected, with `Vary: Origin`. A wildcard is now
refused at boot because this API sends credentials. **Ships with the next
deploy — not yet on production.**

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

## ✅ 4. Merge and deploy #357 — done

Merged 2026-07-23 and carried to production by the 2026-07-24 full deploy
(e-office: flow history, tiered signing, letter types, templates, e-sign).

## ✅ 5. Public i18n — all 9 pages done

Was 1 of 9 pages and 0 of 7 landing sections. Now every public page is
localized end to end — page titles, meta descriptions and the donation form
included — guarded by `config/i18n-coverage.test.ts`.

Still Indonesian by design: the news article *bodies* (headlines and
standfirsts are translated; the text is marked `lang="id"` under a line telling
the reader so), the leaders' mottos and the donation page's scripture, and the
values that are *recorded* rather than displayed — the anonymous donor name and
the bank details. Detail in `KNOWN_ISSUES.md`. **Ships with the next deploy.**

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
3. **Fill the ~41 empty tables.** The **RPJP / Renstra / RKA** slice is
   **done** — `prisma/seeds/strategic-plan-cipansor.ts` seeds the yayasan's
   full cascade from the three planning documents (RPJP 2027–2045 → Renstra
   2027–2029 → RKA 2027), all foundation-wide (`unitId` null): 15 objectives,
   25 indicators, 47 activities, with the RKA's `budget` the exact sum of its
   activity budgets. Sasaran → `PlanObjective`, IUP/IKU/IKK → `PlanIndicator`,
   Program/Kegiatan → `PlanActivity`, faithful to the user's mock-up framing.
   Shipping this surfaced an end-to-end gap now fixed in the same change: the
   `perencanaan` read path filtered strictly on `unitId`, so foundation-wide
   plans were invisible to everyone and the board (no unit) could not list at
   all. `getPlans` + the controller now surface `unitId: null` plans to every
   unit and give the board an all-units view via `seesAllUnits()`; foundation
   plans stay writable only by foundation-scoped callers (mutations do not
   widen). **Still owed:** the remaining empty tables, and — a known follow-up
   — foundation-plan *creation* through the UI (the create flow still requires
   a unit; only the seed writes null-unit plans today).
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

- ~~~14 API services still scope with `unitId || 'none'`.~~ **Closed (PR #363).**
  The literal `unitId || 'none'` pattern is gone: eight services (finance,
  extracurricular, homeroom, muhadatsah, muhadhoroh, meals, attendance,
  duty-roster) were migrated to `seesAllUnits()`, joining the four already
  done (students, tahfidz, murojaah, units). Calendar's `role`-keyed variant
  was fixed in the same PR. The yayasan board and cross-unit asrama staff now
  see their data instead of an empty (or partial) list. `resolve-unit-id` got
  its first direct test.
  - **Still owed, for the module audit (§8.4), not a mechanical sweep:** other
    read filters keyed on the legacy `role !== SUPER_ADMIN` that may wrongly
    exclude the foundation board need *per-module judgment* about whether the
    board should see across units — they are not all the same bug. `emis` is
    deliberately per-unit (it *requires* a unitId, being a Dapodik/EMIS export);
    `paud-report`'s check is an authorization gate, not a read filter. Decide
    these case by case when auditing each module, never by find-and-replace.
- ~210 racy `isVisible({ timeout })` probes in e2e specs.
- Dependabot PRs **#333** (zod 4) and **#328** (eslint 10) still open.
- ~~Stray root-owned directory `apps/api/apps/api`.~~ **Gone** (verified
  2026-07-24). A bind-mounted `docker run` can recreate it; if `git stash -u`
  or `git checkout` starts emitting permission warnings that break `&&` chains,
  that is what happened.
- E2E selectors must not use Playwright's unquoted `text=` engine for short
  strings: it matches a case-insensitive **substring**, and the sidebar precedes
  the content in the DOM, so `.first()` returns a menu button. `text=UA` matched
  "Konsolidasi Keuangan". Guarded by a test in `apps/web/src/lib/rbac.test.ts`
  that cross-checks every unquoted `text=` against all 81 roles' sidebar labels.

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
