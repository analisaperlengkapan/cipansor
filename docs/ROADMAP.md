# Roadmap — outstanding work, most urgent first

Ordered backlog as of **2026-09-02**. Companion to
[`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md) (which records *defects* in detail); this
file records *what to do next and in what order*.

Ordering principle: anything that can harm people or data first, then anything
a visitor sees, then correctness work, then deliverables, then tidiness.

---

## Current deployment state

- As of **2026-09-02** both containers were rebuilt and rolled from
  `main @ b81c8ae4` (through #413) via `deploy-images.sh`. Production and `main`
  are level. That deploy carried the Gmail API transport, the password-reset
  flow and the honest mail-status card (§13), verified live after the roll:
  a real message left through `gmail_api` with `delivered: true`.
- Verified live the same day, and worth keeping straight because the previous
  version of this section was months stale:
  `NEXT_PUBLIC_SHOW_DEMO_LOGIN` is **false** and built that way — the demo
  credential panel is gone from `/login`. `DEMO_MODE` is still `true` in the api
  container, so the 2FA wall is still bypassed (§1).
- Prior state, for the record: the 2026-07-31 roll from `main @ 41ee99e2`
  (through #381/#382) carried the CORS fix (§2), the public i18n work (§5) and
  the chatbot markdown fix.
- The two containers can therefore hold *different* commits. Before assuming
  production runs what `main` says, check the running image itself — e.g.
  `docker exec cipansor-api grep -o "<snippet>" /app/apps/api/dist/…/<file>.js`.
  This is not hypothetical: reseeding for §7 while the API image predated the
  matching controller fix would have left the site *differently* broken.
- Production DB is managed by `db push`, **not** Prisma Migrate — there is no
  `_prisma_migrations` table. Verify every deploy with a non-destructive
  `prisma migrate diff` before building (see §3).

---

## 🟠 1. Before any real launch — half closed

**Closed:** `NEXT_PUBLIC_SHOW_DEMO_LOGIN` is `false` and the web image is built
with it, so the demo credential panel no longer appears on `/login`. Verified
against the live page 2026-09-02 (zero occurrences of the panel's markers).

**Still open:** `DEMO_MODE=true` in the api container. Every account skips the
mandatory-2FA wall, including both `SUPER_ADMIN`s, neither of which has an
authenticator enrolled. Flipping it locks out testing until someone enrols, so
it belongs on the launch checklist rather than being flipped casually.

Note the asymmetry that made the first half easy to get wrong:
`NEXT_PUBLIC_SHOW_DEMO_LOGIN` is inlined at **build** time, so changing `.env`
alone does nothing — the web image has to be rebuilt. `DEMO_MODE` is read at
runtime and only needs a restart.

**Seeded credentials are still the only credentials.** All 107 accounts come
from the seed. Measured against production 2026-09-02: both super admins
(`super.admin@` and `superadmin@cipansor.or.id`) sign in with the demo password
`Cipansor123!`, and `SuperAdmin123!` — which `seed.ts` still prints for
`superadmin@` on every run — is rejected.

That is not drift: a 2026-08-14 bulk reset set every one of the 107 rows to a
single password, and the value chosen was the demo one. So the seed's closing
log advertises a credential that has not worked on production since. Fix the
log line, or stop treating seed output as a description of the live system.

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
3. **Fill the empty tables — 45 of 285, counted 2026-09-02** (a real
   `count(*)` per table, not `reltuples`, which reports every never-analysed
   table as empty and gives 262). The **RPJP / Renstra / RKA** slice is
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

## 🟡 9. Documentation deliverable — the branch is gone

**Checked 2026-09-02: `docs/user-guide` does not exist**, on origin or locally.
Whatever was done on it was never pushed, so this is not "in flight" — it is
unstarted. Decisions already taken with the user still hold:

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
- Dependabot PRs still open (re-checked 2026-09-02): **#333** (zod 3→4),
  **#377** and its duplicate **#418** (both eslint 8→10), **#379** (typescript
  5→7, now CONFLICTING), **#419** (@tanstack/react-table 8→9). Close one of the
  eslint pair before touching either. All are major
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

## ✅ 13. Outgoing e-mail — live 2026-09-02

The system sends mail, for the first time, through the **Gmail API**: a Google
Cloud service account with domain-wide delegation scoped to `gmail.send` alone,
impersonating `noreply@cipansor.or.id`. No password exists to leak, and the
Workspace admin can revoke it per scope. SMTP remains a fallback; with neither
configured the transport is `log`, and — this is the part that was wrong before
— the settings screen now *says so* instead of showing a green badge.

Every automated message leaves as `noreply@cipansor.or.id` with
`Reply-To: halo@cipansor.or.id`, so a wali who hits Reply reaches a mailbox
someone reads. Setup, quotas and the failure-message table:
[`EMAIL_SETUP.md`](./EMAIL_SETUP.md). It costs nothing — Gmail API has no
per-call charge, and the 2,000 recipients/day limit is far above a school of
107 accounts.

**Password reset now exists at all.** The onboarding orchestrator had been
minting reset tokens for months with no endpoint to redeem them and no page to
present them, so every "set your password" e-mail led to the login wall with
the token discarded. Both halves shipped in #413. There is deliberately **no
self-service "lupa password" form**: a reset is started by an admin from
Pengguna → ⋯ → *Kirim tautan reset password*, so nothing unauthenticated can
make this system send mail, and there is no public form to probe for which
addresses have accounts.

What #413 did **not** do, and is worth knowing:

- **No spend or volume alarm.** Same gap as the chatbot (§10.1). The daily cap
  is Google's, not ours, and nothing notices approaching it.
- **`sendEOfficeLetter` was removed, not wired.** It had no caller; e-office
  mail belongs with #414, attached to a real event.
- **The notification preferences screen still reads a mock.** Its query returns
  `DEFAULT_PREFERENCES` with a comment saying "in production, this would fetch
  from API", so the per-user toggles a wali sees are not the ones the event bus
  consults. The bus reads the real `preferences.service`; the screen does not
  yet write to it.

---

## 🟡 14. E-Office & electronic signature — audited 2026-09-02, PR-1..PR-4 shipped

Full findings and the plan: [`EOFFICE_ESIGN_PLAN.md`](./EOFFICE_ESIGN_PLAN.md).

**Shipped so far:** PR-1 (#435, the feature recovered onto `main` and the naskah
given a real letterhead), PR-2 + PR-2b (#436, revocation that the app can
actually perform, with authority placed where ANRI, RFC 5280 and UU 16/2001
Pasal 29 all put it), PR-3 (#437, the signed PDF bytes archived so a dependency
bump can no longer invalidate every letter ever signed), PR-4 (flow completeness
— a real dispatch record, tembusan, and lampiran, plus the end of `SENT` being
applied to incoming letters).

**Still open:** PR-5
(PAdES B-B + RFC 3161 timestamps — the highest-value remaining item, since
without a timestamp there is no answer to *"was the key valid at the time of
signing"*, which is exactly what revocation semantics need), PR-6 (a.n./u.b./
Plt./Plh. — blocked on a governance decision), PR-7 (Arabic — needs an embedded
Unicode font and a shaping engine).

Three things from the audit that still change what you do next:

- **PR #414 must be closed, not merged.** ✅ *Closed 2026-09-02.* The feature it
  advertised was not in it: a Jules commit titled *"update status assertion …
  and add mysql2 override"* deleted the +5,112 lines that PR #421 had merged
  into that branch seventeen minutes earlier. The work was recovered from commit
  `e93a7cf2` and shipped in #435; a copy also stands at tag `esign-salvage`.
- **Naskah dinas are rasterised today.** `e-office/letter/[id]/page.tsx:126`
  turns the whole letter into one PNG via `html2canvas` + `jsPDF.addImage`, so
  the text is unselectable, unsearchable, and cannot carry a real PAdES
  signature. `raport-merdeka` does the same. The server-side `pdf-lib` generator
  in `e93a7cf2` fixes it, with four defects to repair first.
- **Revocation is display-only.** ✅ *Fixed in #436.* Key revocation now has a
  UI, letter-signature revocation is a signed statement (passphrase required,
  verifiable on the public page), a request-and-decide flow keeps proposing
  separate from deciding, and the withdrawn naskah prints with a DICABUT stamp
  naming who withdrew it. Super Admin can revoke **keys**, never a signed
  naskah — that boundary is deliberate; see the plan §PR-2b.
- **Downloads used to re-render the naskah every time.** ✅ *Fixed in #437.*
  `LetterSignedDocument` archives the exact bytes that were hashed, and
  `resolveLetterPdf` serves them verbatim. Run
  `pnpm --filter api db:archive-letters` after deploying to backfill letters
  signed before the archive existed — it archives only those whose bytes still
  reproduce exactly, and reports the rest rather than storing wrong bytes.
- **`SENT` meant the opposite of what it says.** ✅ *Fixed in PR-4.* It was
  applied to *incoming* letters whose review finished with no disposition
  recipients, and never to an outgoing letter at all — so every "surat terkirim"
  figure counted letters that had just arrived. Outgoing letters now get a real
  buku ekspedisi (`LetterDispatch`: date, channel, who received it, resi, tanda
  terima) behind `POST /correspondence/letters/:id/dispatch`, `Letter.sentAt`
  records the first departure, and a finished incoming letter with nobody to
  forward it to is archived, which is what actually happens to it.
- **Tembusan and lampiran existed only in the schema.** ✅ *Fixed in PR-4.*
  `isCC` had exactly one writer in the whole codebase — a hardcoded `false` —
  and there was no attachment table at all, so the naskah's "Lampiran" line was
  permanently "-". Both are now end-to-end: chosen on the form, stored, listed
  on the letter page, and printed on the naskah (`Lampiran : 2 (dua) berkas`,
  and a numbered `Tembusan:` block at the foot). A letter with neither renders
  byte-for-byte as before — `generate-letter-pdf.test.ts` pins that hash, since
  changing it would report every previously signed letter as altered.
- **A letter cannot be edited after it is created.** 🔴 *Found while building
  PR-4; not fixed.* There is no `PATCH /letters/:id` anywhere — the module's only
  `router.patch` is `/dispositions/:id/status`, and `UpdateLetterInput` is a DTO
  with no endpoint behind it. The revision loop therefore has no middle step: a
  reviewer returns a draft, the page invites the author to fix it, and the only
  move available is resubmitting the identical text. Lampiran and tembusan are
  likewise fixed at creation. See plan §2.7 (e) for what fixing it involves.

The signing crypto itself is *good* and should not be rebuilt — scrypt-sealed
Ed25519 keys, a passphrase that is never stored in any form, server-decided
enrolment vs renewal, and a lifecycle guard that refuses expired, revoked,
locked and unapproved keys. What it lacks is standards *form*: the signature
lives in the database rather than inside the PDF, so no external party can
verify a letter without visiting our site. See §4 of the plan for the mapping to
UU ITE Pasal 11, PP 71/2019, and PAdES.

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
- **The Security job can go red on a PR that changed no code.** `audit:deps`
  queries GitHub's live advisory endpoint, so a newly published advisory against
  any transitive dependency fails every open PR at once, including `main` if
  anything re-runs there. Read the failure before blaming the diff: the fix is
  almost always raising the matching pin in the root `package.json`
  `pnpm.overrides` (2026-09-02: `fast-uri` >=4.1.3, `qs` ^6.16.0), then
  `pnpm install` and `pnpm run audit:deps` to confirm 0 advisories.
- **Never push to `main`** (also enforced by a repository ruleset requiring PRs)
  and never `Write` `schema.prisma` wholesale — edit it surgically.
