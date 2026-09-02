# E-Office & electronic signature — audit findings and the plan

Written 2026-09-02, after auditing PR #414, the e-signature key lifecycle, and
the incoming/outgoing letter flow. This is the durable copy of a plan that is
too large to carry in a conversation.

Read [`ROADMAP.md`](./ROADMAP.md) §14 for where this sits against everything
else outstanding.

---

## 0. Read this first — where the code actually is

**The work is not in PR #414. It is in commit `e93a7cf2`, and nothing on any
branch points at it any more.**

The sequence, from the git history:

| When (UTC) | What |
|---|---|
| 2026-09-02 01:40:12 | PR **#421** — *"Fix E-Office correspondence verification, workflow, and recipient pickers"*, **+5,112 lines**, nine rounds of review fixes — squash-merged into `feature/e-office-enhancements-9779766552483489576` as `e93a7cf2`. GitHub marks #421 **MERGED**. |
| 2026-09-02 01:57:28 | Commit `dfc2ad43` by `google-labs-jules[bot]`, titled *"fix(e2e): update status assertion in public-verification spec and add mysql2 override"*, **deleted almost all of it**: `correspondence.service.ts` −912, `tests/service.test.ts` −1,112, `tests/public.test.ts` −125, `generate-letter-pdf.ts` −297, `letter-verification.ts` −95, `captcha.ts` −50, `esign.service.ts` −199, and 6 lines from `schema.prisma`. |

Verified by blob hash: on the PR branch today, `correspondence.service.ts`,
`correspondence.controller.ts`, `correspondence.routes.ts`, `navigation.ts`,
`rbac.ts` and `types/correspondence.ts` are **byte-identical to `main`**. The
feature contributes nothing.

A trial merge of #414 into `main` conflicts (`pnpm-lock.yaml`,
`forecast.test.ts`) and, excluding the lockfile, yields
**26 files, 236 insertions, 776 deletions** — a dependency and CI **downgrade**
that reverts #424/#425, drops `framer-motion` a major version, unpins `turbo`
and `typescript` back to floating `"latest"`, loosens the `nodemailer` security
pin, reverts Zod-4 idioms, and deletes two test suites (158 + 502 lines) whose
replacement covers fewer cases. GitHub reports it `CONFLICTING` / `DIRTY`; its
green checks are from 01:57–02:08 UTC against an older base.

> **#414 must be closed, not merged.** Recover `e93a7cf2` onto `main` instead,
> taking `main`'s side for every dependency, CI and Zod hunk.

The salvage diff — `git diff origin/main e93a7cf2` restricted to the feature
paths — is **33 files, +4,178 / −1,526**.

---

## 1. The design decision behind public verification

**Verification is by uploading the PDF, not by scanning the QR.** This is
deliberate and must not be "fixed" back.

A token only attests *"a letter with this token was signed"* — never *"the
document in your hand is that letter."* An attacker keeps a genuine QR and edits
the body: *"paling lambat tanggal 30 November"* becomes *"1 November"*. The old
`/verifikasi/[token]` page would still answer **valid**, and because it withheld
the subject for non-`PUBLIC` letters, nothing on screen contradicted the forged
text.

So: `/verifikasi/[token]` was removed on purpose, `/public/verify-letter` takes
an uploaded PDF plus a captcha, and the QR now carries the **raw token string**
rather than a URL — scanning it opens nothing, by design.

The upload path is implemented well: captcha issued server-side and verified
before the file is touched, a dedicated public rate limiter
(`PUBLIC_VERIFY_RATE_LIMIT_MAX`, default 30 per 15 min), multer in memory only
with a 10 MB cap and a PDF filter.

---

## 2. What the audit found

### 2.1 The PDF is rasterised in production today

`apps/web/src/app/e-office/letter/[id]/page.tsx:126` runs `html2canvas(...)` →
`toDataURL("image/png")` → `jsPDF.addImage(...)`. **The entire naskah dinas
becomes one PNG.** `assessment/raport-merdeka/page.tsx` does the same.

Unselectable, unsearchable, unindexable by the archive, hostile to screen
readers, needlessly large — and, decisively for everything below, **a raster PDF
cannot carry a meaningful PAdES signature**.

`e93a7cf2` fixes this with a server-side `pdf-lib` generator: 21 `drawText`
calls with embedded fonts, and the QR as an image via `embedPng`/`drawImage`.
That is the right shape — text stays text, images stay images — but it ships
four defects (§2.2).

### 2.2 Defects in the server-side PDF generator

| # | Defect | Consequence |
|---|---|---|
| a | `addPage` is called once (line 45) and content stops at `if (y < 120) break;` | **Letters longer than one page are silently truncated — and the truncated PDF is what gets hashed and signed.** A multi-article SK is cut off mid-way and still verifies as valid. |
| b | The header is text-only; no logo is embedded | The web letterhead uses `unit.logoUrl` with a fallback. Moving to the server generator **drops the lambang from every letter** — the one element that genuinely should be an image. |
| c | `StandardFonts.TimesRoman` is WinAnsi-only | Arabic on a pesantren letterhead (bismillah, the name in Arabic) makes `pdf-lib` **throw** — and that throw lands in the swallowed `try/catch` of §2.3, so the letter silently becomes unverifiable. Needs `@pdf-lib/fontkit` and an embedded Unicode face. |
| d | `y = Math.min(y - 20, 220)` for the signature block | Can overlap body content. |

### 2.3 The PDF hash is written outside the transaction, and its errors are swallowed

`apps/api/src/modules/esign/esign.service.ts:531`. Signing commits in a
transaction; the hash is computed *after* it, wrapped in a `try/catch` whose
body is only `console.error`.

If PDF generation fails for any reason, the letter is **SIGNED** with
`pdfHash = NULL`. Since upload is the only supported verification path, that
letter can never be proven genuine — and the public page does not say "our
system had a problem", it says:

> *"Dokumen PDF tidak terdaftar dalam sistem resmi Yayasan Pesantren Cipansor
> atau telah mengalami perubahan."*

**A genuine letter is publicly accused of being forged, silently.**

### 2.4 The signed PDF bytes are not stored

There is no blob field on `LetterSignature`;
`correspondence.controller.ts:67` regenerates the PDF on every download. So
verification depends on `generateLetterPdfBuffer` emitting identical bytes
forever.

The author understood the risk — `setCreationDate(new Date(0))`,
`setModificationDate(...)`, and a determinism test exist. But that test compares
two calls **in the same process and version**. It cannot catch the real hazard:
bump `pdf-lib`, edit the letterhead, change a date format, or land on a
different ICU build, and **every previously signed letter fails verification at
once**, all of them publicly reported as altered.

This repo takes dependabot bumps weekly (#424 and #425 inside one week), so this
is not hypothetical. **Archive the signed bytes and serve downloads from the
archive.**

### 2.5 Revocation exists in the schema and in the UI, but nothing can perform it

Two separate holes:

- **Signing keys.** `POST /esign/keys/:userId/revoke` exists, guarded by
  `isSuperAdmin` with its own schema — and **no frontend code calls it**. A
  leaked passphrase or a departing official cannot be revoked through the app.
  This is the one lifecycle operation that is urgent by nature.
- **Letter signatures.** `LetterSignature.revokedAt` / `revokedReason` /
  `revokedById` exist; `letter-verification.ts` branches on them; the public
  page is ready to report *"Surat telah dicabut: …"*; the naskah template
  filters revoked signatures out. But the only `letterSignature.update` in the
  entire tree writes `{ pdfHash, pdfSignature }`. **No route, no controller, no
  service method ever writes `revokedAt`.** The feature is display-only: the
  system advertises a capability it does not have. Withdrawing a wrongly issued
  SK is a real administrative need.

### 2.6 The token oracle survives the redesign

`GET /api/esign/verify/:token` and `GET /api/correspondence/public/verify/:token`
are still public and still answer `valid: true` from the database row alone —
precisely the assertion §1 exists to retire. No UI drives them, but anyone can
call them directly or build a convincing lookalike verification page on top.
Remove them, or change the response so it no longer asserts document validity.

**Minor, same area:** `verifyByPdfBuffer` verifies `signature.pdfHash` using
`signature.publicKey` — both read from the row just fetched — instead of binding
`uploadedHash`. Outcome-equivalent, because the lookup keyed on equality, but it
means the Ed25519 step adds no independent assurance against database tampering.

### 2.7 Letter flow — four things that are wired to nothing

The flow is otherwise strong (§3.2). These are the gaps:

| # | Gap | Detail |
|---|---|---|
| a | **`SENT` is never used for outgoing letters** | `correspondence.service.ts:755` sets `SENT` only for **INCOMING** letters whose review finished with no disposition recipients — semantically inverted. Outgoing runs `DRAFT → PENDING_REVIEW → READY_TO_SIGN → SIGNED → ARCHIVED`, skipping it. There is no `sentAt` field and no dispatch record (date, channel, tanda terima), which is exactly what a buku agenda surat keluar records. Any "surat terkirim" statistic is therefore wrong. |
| b | **Tembusan is modelled but dead** | `isCC` exists on the recipient model and is written exactly once in the codebase: a hardcoded `isCC: false` at `correspondence.service.ts:350`. Nothing sets it true; no UI offers it. Tembusan is a standard element of naskah dinas. |
| c | **Signing authority is unstructured** | `senderTitle` is free text. Naskah dinas distinguishes **a.n.**, **u.b.**, **Plt.**, **Plh.**, and that determines both who may sign and how the signature block prints. Today it is a typist's convention, not a rule the system can enforce. |
| d | **No attachment list for outgoing letters** | `fileUrl` is a single field for the scanned original. There is no list of lampiran and no "Lampiran: N berkas" line. |

**Minor:** urgency has three levels (`NORMAL`/`IMMEDIATE`/`URGENT`); the common
ANRI set is four, adding **Kilat**.

---

## 3. What is already good — do not rebuild these

### 3.1 The signing crypto and key lifecycle

`apps/api/src/utils/esign.ts` and `esign-lifecycle.ts` are carefully built:

- Ed25519 keypair per signer; private key sealed with AES-256-GCM under a KEK
  derived by scrypt (N=2¹⁵, r=8, p=1), parameters stored per key so they can be
  raised later without breaking old keys.
- **The passphrase is never stored, not even hashed.** Proof of correctness is
  that AES-GCM authenticates. There is no extra material to steal and grind
  offline.
- The signing passphrase is deliberately distinct from the account password, so
  a hijacked session cannot sign.
- The public key is copied into every signature, so rotating or revoking a key
  never makes an already-valid letter look forged.
- Request kind (`ENROLLMENT` vs `RENEWAL`) is decided **server-side** from key
  state, so a client cannot pass off an expired key as a renewal and skip the
  re-check that the expiry exists to force.
- `grantedDays` is chosen by the approver per request, not a global constant.
- `assertCanSign` refuses: no key, locked, revoked, pending approval, expired.
- Failed-attempt lockout with a countdown surfaced to the user.
- Owner UI is complete: request, renew, activate, change passphrase, days
  remaining, lock state. Super-admin approve/reject UI exists.
- Dedicated migrations exist (`20260723090000_letter_esign`,
  `20260723100000_esign_lifecycle`).

### 3.2 The letter flow

Well aligned with ANRI's tata naskah dinas:

- Four-level security classification (Biasa / Terbatas / Rahasia / Sangat
  Rahasia) and an archive classification code (`FilingClassification`).
- Separate incoming/outgoing agendas, per unit, per academic year, Roman-numeral
  month format.
- **Drafts do not burn a letter number** — a number is issued only when the
  status is not `DRAFT`, which keeps the buku agenda gapless. The number is
  generated *inside* the transaction, so a rollback cancels the increment.
- Tiered paraf with turn order enforced; every non-signer reviewer must approve
  before the signer may sign.
- `SELECT … FOR UPDATE` row locking with re-verification inside the transaction.
- Append-only `LetterFlowEvent` audit trail.
- Multi-recipient disposition with instruction, deadline, result notes,
  `completedAt`, and **hierarchical disposition** via `parentDispositionId`.
- Archiving closes the chain, with authority checks.

---

## 4. Where the signature stands against law and standards

Not legal advice — confirm with the yayasan's counsel before ijazah are signed
electronically. This mapping is for the engineering decision.

### 4.1 UU ITE Pasal 11 ayat (1)

| Condition | Status |
|---|---|
| a. creation data linked only to the signatory | ✅ |
| b. creation data solely under the signatory's control | ⚠️ the key lives on our server, opened by a passphrase. Defensible — commercial PSrE sign server-side too — but weaker than an HSM |
| c. alterations to the signature detectable | ✅ |
| d. alterations to the signed information detectable | ✅ content digest |
| e. a means to identify the signatory | ⚠️ internal only; no certificate binds the key to a verified identity |
| f. a means to show the signatory consented | ✅ passphrase entry |

Under **PP 71/2019 Pasal 60** this is a **Tanda Tangan Elektronik Tidak
Tersertifikasi**: valid and admissible, but the burden of proving validity falls
on whoever relies on it. A **Tersertifikasi** signature — one using a
certificate from an Indonesian PSrE — carries a much stronger presumption.

### 4.2 International practice

What DocuSign, Adobe Sign, and the Indonesian PSrE (BSrE, Privy, VIDA, Peruri,
Digisign) all do, and where we stand:

| Element | Standard | Cipansor today |
|---|---|---|
| Signature **inside** the PDF (signature dictionary, ByteRange, PKCS#7/CMS) | PAdES — ETSI EN 319 142, ISO 32000-2 | ❌ stored in the database |
| X.509 certificate from a trusted CA | RFC 5280 | ❌ raw keys, no certificate |
| Trusted timestamp | RFC 3161 | ❌ `signedAt` is issuer-controlled |
| Offline verification in any PDF reader | PAdES B-B | ❌ requires uploading to our site |
| Long-term validation data | PAdES B-LT / B-LTA | ❌ |

**The practical consequence:** when a santri presents a surat keterangan to a
bank, a receiving school, or a Kemenag office, the recipient cannot verify it
themselves. Adobe shows nothing. They must trust us and visit cipansor.or.id.

### 4.3 The tiers, and the recommendation

- **Tier 1 — make the PDF prove itself.** Fix §2.2–§2.4, then embed the
  signature as **PAdES B-B** plus an **RFC 3161** timestamp. This requires one
  crypto change: **Ed25519 must give way to RSA-3072 or ECDSA P-256** for the
  PDF layer, because EdDSA in CMS (RFC 8419) is effectively unsupported by
  Acrobat. A self-signed certificate is fine at this tier.
- **Tier 2 — certification.** Obtain certificates from **BSrE (BSSN)**, the
  standard route for naskah dinas at institutions under Kemenag, or from a
  commercial PSrE via API. Once the signature is *inside* the PDF, swapping a
  self-signed certificate for a BSrE one is a credential change, not an
  architectural one — **so Tier 1 is not throwaway work.**
- **Tier 3 — PAdES B-LT/B-LTA**, for ijazah and syahadah that must still verify
  in twenty years.

Upload-and-captcha verification (§1) **stays at every tier**: it closes the
content-substitution hole, which PAdES alone does not.

---

## 5. The plan

Six pull requests, each reviewable on its own. Order is deliberate.

### PR-1 — Recover the feature, and make the PDF honest
Move `e93a7cf2` onto `main`, taking `main`'s side for every dependency, CI and
Zod hunk. Then fix §2.2 (multi-page, logo, Unicode font, signature-block
overlap) and §2.3 (move the hash inside the transaction or fail the signing),
and remove the token endpoints of §2.6. Keep `complaints.controller.test.ts`.

*Done when:* a two-page letter renders in full with selectable text and the
lambang; an Arabic letterhead does not throw; no path produces a `SIGNED` letter
with `pdfHash = NULL`; the deleted test suites are still present and green.

### PR-2 — Revocation (§2.5) — **SHIPPED** (PR #436)
Route and UI to revoke a signing key; endpoint, service, authority rule and UI
to revoke a letter signature, with the reason surfaced on the public page.

*Done when:* a super admin can revoke a key and a signed letter from the app,
and the public verification page reports the revocation and its reason.

*Security-operational — bring this forward if anything is ever compromised.*

**What shipped, and the decisions inside it:**

| Decision | Why |
|---|---|
| `GET /esign/keys` + a key-holder card on `/settings/esign` | The revoke route already existed and nothing called it. It could not be called from a UI because no page listed the holders — so the inventory is not a nicety, it is the precondition. |
| Revoking a key reports the letters signed with it | Mercifully, revoking a key does **not** invalidate letters already signed — each signature stores its own copy of the public key. That is right for a departing official and wrong for a leaked passphrase, so the count and the list come back with the response and the admin is told to revoke those signatures one by one. Matched on `publicKey`, not just `signerId`: the same person may have held an earlier key. |
| `POST /esign/letters/:id/revoke` is **not** `isSuperAdmin` | A signer withdraws their own signature. Authority is checked in the service against the signature row, which is the only place that knows who signed *this* letter. `esign.routes.test.ts` pins both halves — that the route exists without the Super-Admin guard, and that it is still behind `authenticate`. |
| No passphrase to revoke | Revoking produces no new cryptographic assertion; it withdraws an old one. Demanding the passphrase would block exactly the case the feature exists for — a passphrase that leaked, or an official who has gone. |
| The letter's `status` is left alone | It really was signed and really did circulate; sending it back to DRAFT erases that from the buku agenda. Validity lives on the signature, and `LetterFlowAction.SIGNATURE_REVOKED` records the act in the letter's own history. |
| Reason ≥ 10 characters, trimmed before storing | It is **public text** — shown as written to anyone who uploads the PDF. Zod's `min()` passes ten spaces, so the length is re-checked after trimming in `utils/esign-revocation.ts`, and both dialogs warn the writer before they type. |
| A revoked letter can no longer be printed | The generator drops the signature block once revoked, so a fresh download is a *different* file with a hash the database has never seen — and the public page would answer it with the sentence a forgery gets. Copies already in circulation still verify and still report the revocation, because they carry the bytes that were hashed. |
| Neither key nor signature can be revoked twice | The second revocation would overwrite the first date and reason — and the first is the one that answers "since when". |

Schema, additive only: `UserSigningKey.revokedById` (accountability parity with
`LetterSignature`, which already had it) and `LetterFlowAction.SIGNATURE_REVOKED`.

### PR-2b — Authority, proof, and the AATL read

Revised 2026-09-02 after the yayasan pushed back on the authority rule and sent
the **Adobe AATL Technical Requirements v2.0**. Three sources were checked
against each other; they agree, and they all disagreed with what PR-2 first
shipped.

**Who may revoke.** Authority to revoke follows authority to *issue*.

| Source | Rule |
|---|---|
| ANRI, tata naskah dinas | *"Pejabat yang berhak menetapkan perubahan, pencabutan, dan pembatalan adalah pejabat yang berwenang menetapkan naskah dinas tersebut."* A regulatory naskah must be withdrawn by one of equal or higher level. |
| RFC 5280 / BSrE | Only the issuer revokes. The certificate owner *requests*, in writing with a reason; the issuer decides. |
| DocuSign / Acrobat Sign | Only the sender may void. The **signer specifically cannot** — they may only decline to sign. |

So `signer OR SUPER_ADMIN` was wrong in both directions. Super Admin is a
*technical* role; an IT administrator annulling the Ketua's SK is what none of
the three permits. And signer-only would leave a wrongly issued SK valid forever
once its signer stops holding office.

The rule now, in `packages/shared/src/types/letter-revocation-authority.ts`:

| Actor | May revoke |
|---|---|
| Anyone | their own signature |
| **Pengawas Yayasan** | own + Pengurus + every unit office |
| **Pembina** | own + any naskah signed by a Pembina (succession in office) |
| Ketua / Sekretaris / Bendahara | own only |
| **Super Admin** | **nothing** — keys and certificates only |

Annulling what the Pengurus issued is a *supervisory* act, not an executive one,
so it sits with the Pengawas. Putting it on the Ketua would have the executing
organ annul its own work — the separation UU 16/2001 jo. UU 28/2004 Pasal 29
exists to prevent. Pembina succeeds its own office because there is no organ
above it to appeal to.

**Everyone else gets a channel, not a wall.** `LetterRevocationRequest`: anyone
who may read the letter may ask, with a reason and an optional attachment; the
authorised officer decides on the letter's own page. The clerk who spots the
duplicate number is rarely the officer who may annul it.

**Revoking now takes a passphrase, and is signed.** The first version reasoned
that "revoking makes no new cryptographic assertion". That is wrong: a CRL is a
signed, timestamped data structure (RFC 5280). The revoker signs the statement —
binding signature, letter, revoker, office, time and reason — with **their own**
key, so a leaked passphrase or a departed official blocks nothing, a live session
alone cannot withdraw an official letter, and the public page *proves* the
revocation instead of asserting it. Editing the reason afterwards invalidates it.

**A revoked naskah is stamped, not withheld.** DocuSign watermarks a voided
document and keeps it downloadable; refusing the download left the office unable
to file a copy. The naskah is rebuilt as it stood when signed, re-hashed, and
stamped only once the hash matches `pdfHash` — so circulated copies keep
verifying and keep reporting the revocation. A mismatch means the bytes have
drifted since signing (§2.4) and printing is refused, honestly.

**Reason codes (RFC 5280 §5.3.1), on key revocation.** AATL ICA6(a) enumerates
three different situations with three different consequences, and only
`KEY_COMPROMISE` makes previously signed letters doubtful. Without the
distinction an operator has two equally wrong options: revoke a dozen sound
letters, or leave letters signed with a leaked key standing. Not applied to
letters: withdrawing a naskah is an administrative act, and ANRI's form for it is
the written reason.

### What AATL asks that we cannot meet, and should not pretend to

AATL is a programme for **certificate authorities**, not for signing
applications. Membership needs a WebTrust or ETSI EN 319 411 audit every two
years (G2), FIPS 140-2 Level 3 HSMs for the ICA key (ICA4), face-to-face
identity proofing (ICA5a), and a contract with Adobe. The yayasan is not going
to be an AATL member, and building toward that is the wrong goal.

What the document is genuinely useful for is as a checklist of what a serious
deployment looks like:

| AATL | Here | Verdict |
|---|---|---|
| **EE1/EE2** X.509 v3 per RFC 5280, KeyUsage + EKU | no certificate at all, just a raw public key | Needed before any PAdES signature Acrobat will trust |
| **EE4(b)** RSA ≥ 2048 or EC ≥ 256 | **Ed25519** | ⚠️ **Ed25519 is not on AATL's list.** Independent confirmation of §4.3: the algorithm choice is what blocks PAdES, and RFC 8419 EdDSA-in-CMS support in Acrobat is thin. A migration, not a patch. |
| **EE3** RFC 3161 timestamp; embedded revocation info for LTV | none | **The highest-value single item.** Without a timestamp there is no answer to "was the key valid *at the time of signing*", which is exactly what revocation semantics need. Already PR-5. |
| **EE4(c)** private key in FIPS 140-2 L2 hardware | scrypt + AES-GCM in the application database | Out of reach; state it plainly rather than imply otherwise |
| **ICA5(a)** identity proofing before issuance | Super Admin approves a request in the app | **Cheap and worth doing**: record *how* identity was verified at approval. It is the difference between "an admin clicked approve" and "the Ketua checked the KTP in person on this date" — and that difference is what PP 71/2019 weighs when distinguishing *tersertifikasi* from *tidak tersertifikasi*. |
| **ICA6(a)** immediate revocation on suspected compromise | key revocation, now with reason codes | Met |
| **ICA7** published status for enquiring about validity | a database column | A public **key**-status endpoint would meet it — deliberately about the *key*, never the document, so it cannot become the token oracle §1 exists to retire |

**Standing conclusion:** the signature here is *tanda tangan elektronik tidak
tersertifikasi* under PP 71/2019, and every improvement above still leaves it
that way. Becoming *tersertifikasi* means using a PSrE (BSrE, Privy, VIDA,
Peruri, Digisign) — a procurement decision, not an engineering one. What the
work above buys is a system that behaves correctly at its own tier, and one that
a PSrE could be dropped into later without redesigning the flow around it.

### PR-3 — Archive the signed PDF bytes (§2.4)
Schema change. Store the exact buffer that was hashed; serve downloads from it.

*Done when:* a `pdf-lib` upgrade no longer invalidates historical letters —
provable by bumping it in a test and re-verifying an old letter.

### PR-4 — Flow completeness (§2.7 a, b, d)
`sentAt` plus a correct `SENT` transition for outgoing letters and a dispatch
record; stop applying `SENT` to incoming letters; make tembusan usable
end-to-end; add an attachment list and the "Lampiran" line.

### PR-5 — PAdES B-B + RFC 3161 (§4.3 Tier 1)
Embed the signature in the PDF. Requires the RSA/ECDSA change.

### Also fixed while walking the flow (PR #436)

Rendering every page at every stage found defects no diff review would:

- `DispositionTimeline` read `disposition.senderName[0]`; the API sends
  `sender: { name }`. The DTO declared the flat field, so TypeScript passed and
  `undefined[0]` blanked the **whole letter page for every disposed letter**.
- `LetterReviewerDetail.reviewerName` — same defect, silent: the "Status Review"
  panel printed no name at all.
- `/e-office/outbox` re-rendered the inbox component, whose direction is
  internal state starting at INCOMING → **the outbox showed the inbox**.
- Urgency named three different ways; the dashboard shifted every letter one
  step (IMMEDIATE→"Penting"). One `LETTER_URGENCY_LABELS` now.
- A column headed "Sifat" displayed urgency.
- `REVISION_NEEDED` was terminal in the UI: `resubmit` existed in the API and
  nothing called it.
- `/e-office/archive` 404'd from the module's own landing tile; `dead-links.test.ts`
  scanned `href=` only. Widened to `router.push` → 27 more pre-existing dead
  targets recorded as backlog (13 are `/paud/…` pushed from `/tk/…`).
- `limit: 10` with no pagination controls: letter 11 was unreachable.
- The naskah's letterhead printed the yayasan name **twice** for its own letters,
  and single newlines inside a paragraph were collapsed — so the
  `Nama : … / Nomor Induk : … / Kelas : …` block of every surat keterangan
  printed as one run-on paragraph. Both only visible once the PDF was rendered
  and read; `generate-letter-pdf.test.ts` now reads the text layer (inflating
  Flate streams and decoding hex strings) instead of only hashing bytes.

### PR-7 — Arabic and Unicode in the naskah

**Requested 2026-09-02. Not a patch — it needs a font, a shaping engine and a
build change, which is why PR-1 refused the input instead of half-rendering it.**

Today `generateLetterPdfBuffer` uses `StandardFonts.TimesRoman` and friends,
whose repertoire is WinAnsi. PR-1 added `assertRenderable`, which rejects a
naskah containing anything outside it and names the offending characters. That
is the honest floor — before it, `pdf-lib` threw from deep inside, the throw was
swallowed, and the letter was signed but permanently unverifiable — but it means
a pesantren cannot put a Qur'anic quotation or an Arabic bismillah in a letter
body, which is a real limitation for this institution.

What full support actually requires, in order:

1. **An embedded Unicode font.** `@pdf-lib/fontkit` plus a TTF/OTF. Two faces are
   needed: a Times-metric Latin face (Tinos or Liberation Serif, both
   open-licensed) and an Arabic face (Noto Naskh Arabic). Subset them — a full
   Noto Naskh is ~500 KB and every letter would carry it.
2. **A shaping engine, which pdf-lib does not have.** Embedding the glyphs is not
   enough: Arabic needs contextual joining (a letter's form depends on its
   neighbours) and bidirectional reordering. Without it the text renders as
   isolated letters in left-to-right order — wrong in a way that looks like
   nonsense to a reader of Arabic, and worse than refusing. The realistic
   options are `harfbuzzjs` (WASM, does real shaping) feeding positioned glyphs
   to pdf-lib, or replacing pdf-lib for this document with a renderer that
   shapes natively.
3. **A build change.** The API image stages only `dist` and `node_modules`, so a
   font file needs either a Dockerfile step or the base64-in-source treatment
   used for the lambang (`apps/api/src/assets/logo-cipansor.ts`). At subset
   sizes the latter stays viable and keeps the bytes frozen, which matters —
   see below.
4. **A hash-stability decision.** Changing the font changes every rendered byte,
   so every letter signed before the change fails public verification and is
   reported as altered. This must land *after* PR-3 archives the signed PDF
   bytes, or it silently invalidates the archive. **PR-7 is blocked on PR-3.**

Scope note: the letterhead itself is Latin-only today, so this is about letter
*bodies*. If the yayasan wants an Arabic kop surat, the cheaper answer is to put
the calligraphy in the lambang image — it is an image by nature, and needs no
shaping at all.

*Done when:* a letter whose body contains an Arabic sentence renders with correct
joining and right-to-left order, verifies after upload, and a letter signed
before the change still verifies.

### PR-6 — Structured signing authority (§2.7 c)
a.n. / u.b. / Plt. / Plh. as a modelled rule.

**Blocked on a governance decision, not on engineering:** who may sign on whose
behalf, and under which of those forms. Needs the yayasan's answer first.

### Deployment note

`e93a7cf2` adds 6 lines to `schema.prisma` (`pdfHash`, `pdfSignature` and their
index). Production still has no `_prisma_migrations` (ROADMAP §3), so every
deploy in this series must be pre-checked with a non-destructive
`prisma migrate diff` that comes back clean.

---

## 6. Open decisions for the yayasan

1. **Which letters must verify outside the pesantren?** That answer sets whether
   Tier 2 (BSrE) is required or merely desirable, and by when.
2. **Signing authority (PR-6):** who may sign a.n. whom, and when u.b./Plt./Plh.
   apply.
3. **Retention:** how long a signed letter and its archived PDF must be kept —
   this drives whether Tier 3 (B-LTA) is in scope.
4. **Arabic in letter bodies (PR-7):** whether staff need to write Arabic script
   inside the naskah, or whether an Arabic element on the letterhead — shipped as
   part of the lambang image — is enough. The first is weeks of work behind PR-3;
   the second is an afternoon.
