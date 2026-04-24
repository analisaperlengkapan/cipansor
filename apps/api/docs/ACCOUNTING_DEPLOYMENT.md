# Accounting Integration — Deployment Notes

The Canteen module posts automated double-entry journal entries (Revenue,
COGS, Inventory) on every sale, refund and cancellation. These entries are
**best-effort** and are intentionally decoupled from the business
transaction so that the POS remains operational regardless of the accounting
configuration.

## Graceful Degradation

Journal entries are **skipped with a warning log** (not failed) when:

1. The financial period covering the transaction date is **closed**
   (`financial_periods.is_closed = true`). See
   `apps/api/src/modules/canteen/service.ts:607-620` (create) and
   `apps/api/src/modules/canteen/service.ts:939-952` (refund/cancel).
2. The required **account mappings are missing** for the unit
   (`sales_revenue`, `cogs`, `inventory_asset`, `cash`,
   `wallet_liability`). See
   `apps/api/src/modules/canteen/service.ts:669-678`.

In both cases the sale/refund itself completes. Reconciliation must then be
performed manually by the accounting team (e.g. via adjusting journal
entries).

## Required Configuration Before Go-Live

Because `ACCOUNTING_ALLOW_UNSCOPED_FALLBACK` defaults to **disabled** in
production (see
`apps/api/src/modules/finance/accounting-config.service.ts:80-82`), the
unscoped fallback (by account code or name) will NOT be used. This means:

> **No canteen journal entries will be created until unit-specific account
> mappings are configured in the Settings table for every unit running
> canteen operations.**

### Setup Checklist (per unit)

1. Ensure an `AccountCode` exists for each of the following roles in the
   unit's chart of accounts:
   - Sales Revenue (typical code `4101`)
   - Cost of Goods Sold (typical code `5101`)
   - Inventory Asset (typical code `1104`)
   - Cash (typical code `1101`)
   - Wallet Liability (typical code `2101`)
2. Create entries in the `settings` table (via the admin UI or seed script)
   mapping each of these to the correct `AccountCode.id`. The mapping keys
   are defined in
   `apps/api/src/modules/finance/accounting-config.service.ts` as
   `ACCOUNT_MAPPING_KEYS`.
3. If the unit operates **multiple Business Units** (e.g. two canteens),
   create BU-specific mappings using the key prefix
   `BU_{businessUnitId}_{ACCOUNT_MAPPING_KEY}`. The canteen service
   automatically prefers BU-specific mappings over unit-level ones. See
   `apps/api/src/modules/canteen/service.ts:622`.
4. Ensure the financial period covering the expected first sale date is
   **open** (`is_closed = false`).

### Monitoring After Go-Live

Grep application logs for the prefix `[Canteen Accounting]` to surface any
skipped journal entries. Expected patterns:

- `Skipping journal entries for transaction ${transactionNo} — financial
  period for ${date} is closed (unit ${unitId}).`
- `Skipping journal entries for transaction ${transactionNo} — missing
  account mappings …`
- `Skipping reversing journal entries for transaction ${transactionNo} —
  financial period for ${date} is closed (unit ${unitId}).`

Any of these warnings indicates a reconciliation gap that must be closed
manually.

## Development / Single-Unit Environments

For local development or single-unit test deployments where configuring
per-unit mappings is impractical, set:

```bash
ACCOUNTING_ALLOW_UNSCOPED_FALLBACK=true
```

With this flag enabled, missing Settings mappings fall back to a global
`AccountCode` lookup by code (e.g. `4101`) and then by name (e.g.
`Pendapatan Kantin`). A `[AccountingConfig]` warning is still emitted on
every fallback use so the reliance is visible. **Do not enable this in
multi-unit production environments** — the fallback is NOT unit-scoped and
could bind a unit to another unit's chart of accounts.
