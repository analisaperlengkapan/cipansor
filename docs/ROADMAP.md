# Roadmap — outstanding work, most urgent first

Ordered backlog as of **2026-08-02**. Companion to
[`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md) (which records *defects* in detail); this
file records *what to do next and in what order*.

Ordering principle: anything that can harm people or data first, then anything
a visitor sees, then correctness work, then deliverables, then tidiness.

---

## Current deployment state

- As of **2026-07-31** both containers were rebuilt and rolled together from
  `main @ 41ee99e2` (through #381/#382) via `deploy-images.sh`. That deploy
  carried the CORS fix (§2), the public i18n work (§5) and the chatbot markdown
  fix to production, all verified live after the roll.
- **`main` has since moved ahead of production.** `#383` (teacher dashboard
  figures + the unit-admin route grants, `main @ d09bb67b`) is merged but **not
  deployed** — production still runs `41ee99e2`, so a guru signing in today
  still sees the fabricated stat row described in §8.4.
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
refused at boot because this API sends credentials. **Live since the 2026-07-31
deploy**, verified against production: `https://cipansor.or.id` is reflected
singly with `Vary: Origin`, and a foreign origin gets no
`Access-Control-Allow-Origin` header at all.

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
the bank details. Detail in `KNOWN_ISSUES.md`. **Live since the 2026-07-31
deploy.**

## 🟠 6. PWA install prompt — question moved hosts (#401, 2026-08-15)

**No longer a defect on `cipansor.or.id`.** The apex deliberately ships no PWA
now: `pwaEnabledForHost` withholds the manifest, the Apple web-app tags, the
install script and the banner there, because `start_url` is the landing page and
all three manifest shortcuts 404 on that host. Verified live after deploy — the
apex serves none of the three, the portal serves all of them.

**Still open on `portal.cipansor.or.id`**, where the app actually lives. Next
step unchanged: Chrome DevTools → Application → Manifest → **Installability** on
a real device, pointed at the portal. Two suspects, in order — Chrome's
user-engagement threshold (a fresh Incognito window has zero engagement, so the
test used to rule out a stale dismissal proved nothing), then the manifest's
`"id": "/"`. Details in `KNOWN_ISSUES.md`.

## ✅ 7. Temporal data was stale — code fixed (#370), production data now current

The seed wrote the calendar as literals (`2024/2025`, a PSB window of
1 Mar – 31 May 2024), so every reseed reproduced the day the seed was *written*.
By July 2026 the public SPMB page read "Pendaftaran Telah Ditutup — Periode PSB
2024/2025 Gelombang 1" and rendered no form: nobody could register.

**Fixed in code and seed.** `apps/api/src/lib/academic-calendar.ts` derives the
year from `now` (mid-July → end of June, 15 July the boundary) and anchors both
admission waves to the seed run, so wave 1 is open whenever the seed runs.
Hardcoding 2026/2027 would only have moved the expiry date.

A second defect surfaced while fixing the first, and would have been hidden by
it: `getPublicActiveAdmissionPeriod` trusted `isActive` alone and took the
flagged period with the latest `startDate` — which picks the wrong record as
soon as two waves are flagged, exactly the shape the corrected seed produces.
Proved against the reseeded database:

```
old query -> SPMB 2027/2028 Gelombang 2  [BELUM DIBUKA]
new query -> SPMB 2027/2028 Gelombang 1  [OPEN]
```

So fixing the data alone would have produced a *different* wrong answer. It now
prefers open → next upcoming → most recently closed, matching the three states
`apps/web/src/lib/admission-period.ts` (`getPeriodWindow`) already renders.
`isActive` remains administrative intent; whether registration is open is
always derived from the dates.

**Production data is now current** (verified 2026-07-31). The live database
holds `SPMB 2027/2028 Gelombang 1` (2026-06-09 → 2026-09-07) and
`Gelombang 2`, with academic year `2026/2027` active — so wave 1 is open today
and `/public/spmb` renders it with the registration button live.

One verification trap worth keeping: `curl` on `/public/spmb` returns
"Pendaftaran Belum Dibuka" because that is the pre-hydration server state; the
period arrives on the client. Check this page in a real browser, never with
`curl`, or you will chase a defect that is not there.

Still a business decision, not ours to invent: the real dates, fee and units
for an actual intake. The values above are demo data from the seed.

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
   **First confirmed instance, found 2026-07-31 — and it is a permission gap,
   not a missing frontend.** The four unit-admin RoleCodes (TKQ_ADMIN,
   SDIT_ADMIN, SMPIT_ADMIN, SMAQ_ADMIN) each rendered **18 sidebar links that
   bounced them back to their dashboard**: `/tk` and its five sub-pages,
   `/payroll`, `/perencanaan` (+ strategy-map), `/grc-dashboard`,
   `/pengawasan`, `/syariah`, `/tata-laksana`, `/organisasi`, `/unit-usaha`,
   `/project`, `/cbt/exams`. They are in `ADMIN_ROLES` so they get
   `adminNavigation`, but their legacy bucket `UNIT_ADMIN` granted none of
   those prefixes in `roleRouteAccess`. **Fixed in #383** (`d09bb67b`), with a
   guard that iterates all 81 RoleCodes asserting every menu link is one
   `canAccessRoute` allows — proven to bite by reverting the allowlist, which
   fails on exactly those four roles with 18 links each.

   Two guard holes let this survive a suite that already tested `rbac.ts`: the
   existing tests sampled roles by hand and no unit admin was among them, and
   nothing anywhere asserted the menu→permission relationship at all. The
   contract was enforced in neither direction.

   The sharpest case: TKQ_ADMIN runs the TK unit and could not open a single
   page of the TK/PAUD module. Only SUPER_ADMIN could, via `["*"]`.

   **Correction to an earlier draft of this entry.** It claimed PAUD had "a
   complete backend and no frontend at all". That was wrong. The module has
   **twenty pages under `/tk`** — assessment list/create/edit/detail, progress,
   per-student view, daily reports (class, parent, check-in), and raport
   generate — all calling the real `paud-assessment` and `paud-report`
   endpoints including `/indicators`, `/summary/class` and `/assessments/bulk`.
   The error came from taking route paths out of
   `docs/planning/implementation-tasks.md` and testing them literally against
   the tree: the module shipped under `/tk`, the plan wrote `/paud`. Checking
   a path exists is not checking a feature exists — resolve the module by its
   API calls, not by a name in a planning document.

   Genuinely absent, and referenced by nothing in nav, rbac or any link:
   `/tk/settings`, `/dashboard/performance`, `/dashboard/unit/[id]`. All three
   come from that same planning doc, so confirm they are wanted before
   building them.

> **The two task lists in `docs/planning/` are not trackers — do not read a
> checkbox there as status.** `implementation-tasks.md` shows 204 unchecked
> against 11 done, and `tasks.md` 82 against 153, but both were last touched
> 2026-07-20, before most of the work. Measured 2026-07-31 against the actual
> tree: of the 17 routes carrying unchecked tasks, only **3** are genuinely
> absent. The rest are built — 7 at the path the plan names, and 7 more under
> `/tk` where the plan wrote `/paud`.
>
> That last group is the trap, and it cost a wrong entry in §8.4 before it was
> caught: matching plan paths against the tree makes a renamed module look
> deleted. Resolve a module by the API endpoints its pages call, not by the
> route name in a document nobody has updated since July. Verify against the
> code, then record the result here — this file is the tracker.

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

## 🟡 10. Customer-service chatbot — Phase 1 shipped, four gaps left

**Live on cipansor.or.id since 2026-07-25** (#373, credentials reaching the
container via #374). The public widget answers from RAG over the public pages
with the live SPMB facts, cites its sources, caches structurally, and refuses
requests for private data. Design and rationale: [`planning/chatbot-design.md`](./planning/chatbot-design.md).

What the design asked for and we have not built, in the order it matters:

1. **No monthly spend alert** — the one remaining unmet item on the pre-launch
   list. An open LLM endpoint on a public page is a cost-amplification target,
   and nothing currently notices a bill climbing.
2. **The eval suite is not in CI** (§5). It exists — 36 golden and 23 red-team
   cases, `pnpm --filter api chatbot:eval` — and runs only when someone
   remembers. A leak regression is caught by nothing else. Real money per run,
   so a nightly or pre-release schedule fits better than per-PR.
3. **No persona version history and no eval gate on save** (§4). A super admin
   can change the public voice of the pesantren with no revision trail and no
   quality check; reverting means retyping.
4. **The golden set is 36 cases against the 50–100 the design asked for.** Grow
   it from questions visitors actually ask, which is the point of shipping
   Phase 1 first.

Phase 2 (the authenticated agent) stays deliberately parked. It must call the
existing authorized endpoints as the logged-in user with their **active** role —
never a vector index over the database — so `letterScopeWhere`,
`assertLetterAccess` and the nature levels apply unchanged, with conversation
state partitioned per (user, activeRole) and a fresh thread on every role
switch. It also waits on §8's data quality. The teacher dashboard was the
worked example — it reported fabricated figures until #383 — and the lesson
generalises: an agent restates whatever the API hands it, in fluent Indonesian,
with an authority the number has not earned. Every surface Phase 2 can read
needs the §8.4 treatment first.

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
- Dependabot PRs still open (checked 2026-07-31): **#333** (zod 3→4),
  **#377** (eslint 8→10), **#379** (typescript 5→7). All three are major
  bumps across several workspaces — `zod` is declared in api, shared and web,
  and `packages/shared` is the Zod DTO boundary the whole monorepo imports, so
  none of these is a one-line merge. The root `package.json` pins
  `"typescript": "latest"` while api/shared/web ask for `^5`, which is its own
  inconsistency worth settling when #379 is taken.
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
