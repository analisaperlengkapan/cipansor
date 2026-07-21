# Route & Naming Refactor — Plan

**Status:** approved, not started.
**Scope agreed:** backend *and* frontend, every old path kept alive with a
permanent redirect.
**Timing agreed:** run only after the Playwright route/role audit is finished
and its findings are fixed, so audit results stay attributable to real bugs
rather than rename fallout.

---

## Guiding rules

1. **Islamic / pesantren domain terms are never translated.**
   `tahfidz muhadhoroh muhadatsah muhasabah ibadah takhosus simaan murojaah
   sanad syariah musyrif kitab-progress halaqoh rapor-pesantren`
   These are the vocabulary the institution actually uses. Anglicising them
   would make the product worse, not tidier.
2. **Generic administrative concepts use one language consistently.** The admin
   app is predominantly English (`/students`, `/finance`, `/inventory`,
   `/procurement`), so stragglers like `/unit-usaha` align to that — while the
   *visible label* stays Indonesian.
3. **A module directory and its mount path must be the same string.**
4. **Every renamed public path keeps a permanent (308) redirect, shipped in the
   same deploy.** The site is live, indexed, and a Google Ad Grants account
   depends on landing pages that do not 404.
5. **URLs are the contract; labels are the copy.** Renaming a route does not
   require renaming what the user sees, and vice versa.

---

## 1. Admissions — PPDB is obsolete, the term is now SPMB

Kemendikdasmen replaced **PPDB** (*Penerimaan Peserta Didik Baru*) with
**SPMB** (*Sistem Penerimaan Murid Baru*) from the 2025/2026 school year;
SPMB 2026 is in force. This was **not** a cosmetic rename:

- *zonasi* → **domisili** route, alongside *afirmasi*, *prestasi*, *mutasi*
- "peserta didik" → "murid"
- the ministry renamed it partly because the public wrongly equated admissions
  with zoning

Today the codebase uses **four names for one concept** — `/psb` (fe), `/ppdb`
(fe), `/admissions` (be), `/ppdb-wave` (be) — and the landing page already
contradicts itself: it renders "SPMB 2026 Telah Dibuka" and "Daftar SPMB" but
links to `/public/ppdb`, whose own copy still says "PPDB".

| Surface | Target |
|---|---|
| Internal admin route | `/admissions` (matches `/students`, `/finance`) |
| Internal UI labels | "SPMB" |
| Public route | `/public/spmb`, with 308 from `/public/ppdb` |
| Public copy | lead with SPMB; keep one "(sebelumnya PPDB)" so parents searching the retired term still land |
| Backend | `ppdb-wave` → `admissions/waves` |
| `/psb` | already redirect-only — collapse into `/admissions` |

Footprint: PPDB appears in **16 web files (37 hits)**, **20 api files (86
hits)**, 1 prisma file. The schema has no admission-path enum
(`admissionPath` is a free string), so there is no `ZONASI` value to migrate —
this is mostly labels and routes.

> Note: an earlier draft of this plan argued for *keeping* `/public/ppdb` on the
> grounds that "PPDB is what parents search for". That reasoning was based on
> the retired term and is superseded by this section.

---

## 2. Backend — module directory must equal mount path

| module dir | current mount | target (both) | api refs |
|---|---|---|---|
| `business-unit` | `/business-units` | `business-units` | 1 |
| `tatalaksana` | `/tata-laksana` | `tata-laksana` | 1 |
| `sanad-certificate` | `/sanad` | `sanad` | 2 |
| `system-secrets` | `/secrets` | `secrets` | 1 |
| `performance-management` | `/performance-agreements` | `performance-agreements` | 1 |
| `reporting` | `/reports` | `reports` | 6 |
| `project` | `/projects` | `projects` | 1 |

## 3. Backend — names that describe nothing

`-enhancement` and `-bridge` record *when* code was added, not what it does.

- `dashboard-enhancement` → fold into `dashboard/`
- `finance-enhancement` → fold into `finance/`
- `finance-bridge` → fold into `finance/`

**Read each module before renaming.** Name it for what it exposes; do not
blind-rename.

## 4. Frontend renames — each needs a permanent 308

| from | to | web refs |
|---|---|---|
| `/psb` | `/admissions` | 1 |
| `/ppdb` | `/admissions` | 9 |
| `/unit-usaha` | `/business-units` | 2 |
| `/project` | `/projects` | 6 |
| `/risk-management` | `/risk` | 6 |
| `/e-office` | `/correspondence` | 6 |
| `/grc-dashboard` | `/grc` | 0 |

The blast radius is far smaller than the raw count of 1,838 route literals
across 456 files suggests — **most renames touch under 10 files.**

---

## 4b. Client/server path drift found by the 2026-07-21 audit

The audit turned up a second class of naming problem: the web app calling API
paths the backend never mounted. These were **broken**, not merely untidy, and
have been repointed already — but they show the failure mode the rest of this
refactor has to avoid.

| web called | backend actually mounts |
|---|---|
| `/bills` | `/finance/invoices` |
| `/payments` | `/finance/payments` |
| `/report-cards` | `/assessment/report-cards` |
| `/rooms` | `/facilities/rooms` |
| `/reward-types` | `/rewards/categories` |
| `/violation-types` | `/violations/categories` |
| `/extracurriculars` | `/extracurricular` |

Two lessons for the rename work:

1. **Singular/plural must be decided once and applied on both sides.** The
   backend is inconsistent today (`/extracurricular` but `/violations`), which
   is what let the frontend guess wrong.
2. `type` vs `category` is a genuine vocabulary split — the UI says "Jenis
   Pelanggaran" while the API says `categories`. Pick one term per concept and
   make the route and the label agree.

Still missing entirely (linked or called, never built) — a backlog, not a
rename target: `/finance/invoices/bulk`, `/assessment/report-cards/my-children`,
`/assessment/report-cards/students/:id`, `/rewards/categories/:id`,
`/violations/categories/:id`, `/extracurricular/my-enrollments` and the
per-module `:id/edit` pages tracked in `apps/web/src/lib/dead-links.test.ts`.

## 5. Must be updated alongside every path change

- `apps/web/src/config/navigation.ts` — nav hrefs
- `apps/web/src/lib/rbac.ts` — `roleRouteAccess`, `roleCodeDashboardOverrides`
- `apps/web/middleware.ts` — `publicRoutes`
- `apps/web/src/app/sitemap.ts` — public URLs
- `apps/web/next.config.ts` — the 308 redirect table
- API client call sites

## 6. Verification gate

1. `pnpm --filter web exec tsc --noEmit` clean
2. `pnpm --filter web test` — 85 tests, including the suites that assert
   every menu link resolves to a real page, is reachable by its role, and is
   not duplicated. These will catch a missed rename.
3. `pnpm --filter api build` clean
4. Re-run the Playwright role audit; diff against the pre-refactor report
5. `curl` every retired path and confirm 308 → new location

## 7. Why this was deliberately *not* done as one big-bang rename

- It attacks the Google Ad Grants goal directly: mass-renaming live URLs means
  mass 404s and a full re-crawl.
- The PWA service worker caches routes; installed users get broken navigation.
- Route strings are referenced as literals in 456 files, so a blind
  find-and-replace has a high chance of silent breakage.

Stage it, ship redirects with every rename, and let the test suite gate it.
