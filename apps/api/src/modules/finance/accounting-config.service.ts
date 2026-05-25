import { prisma } from '../../lib/prisma';

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export const ACCOUNT_MAPPING_KEYS = {
  CASH: 'ACCOUNT_MAPPING_CASH',
  BANK: 'ACCOUNT_MAPPING_BANK',
  PAYROLL_EXPENSE: 'ACCOUNT_MAPPING_PAYROLL_EXPENSE',
  INVENTORY_ASSET: 'ACCOUNT_MAPPING_INVENTORY_ASSET',
  ACCOUNTS_PAYABLE: 'ACCOUNT_MAPPING_ACCOUNTS_PAYABLE',
  WALLET_LIABILITY: 'ACCOUNT_MAPPING_WALLET_LIABILITY',
  SALES_REVENUE: 'ACCOUNT_MAPPING_SALES_REVENUE',
  LAUNDRY_REVENUE: 'ACCOUNT_MAPPING_LAUNDRY_REVENUE',
  COGS: 'ACCOUNT_MAPPING_COGS',
};

export async function getAccountMapping(unitId: string, key: string, tx: TransactionClient | typeof prisma = prisma): Promise<string | null> {
  const setting = await tx.setting.findUnique({
    where: {
      unitId_key: {
        unitId,
        key,
      },
    },
  });

  if (!setting || !setting.value) return null;

  // Value is stored as JSON, expected to be { accountId: "..." } or just the ID string if simple
  const value = setting.value as any;
  return typeof value === 'string' ? value : value.accountId || null;
}

export async function setAccountMapping(unitId: string, key: string, accountId: string) {
  return prisma.setting.upsert({
    where: {
      unitId_key: {
        unitId,
        key,
      },
    },
    update: {
      value: { accountId },
    },
    create: {
      unitId,
      key,
      value: { accountId },
    },
  });
}

/**
 * Helper to get a mapped account or fallback to a default code/search.
 * Accepts an optional transaction client to ensure reads participate
 * in the caller's transaction when used inside prisma.$transaction.
 *
 * CROSS-UNIT SAFETY: The fallback lookups (by code or name) are NOT scoped
 * by unitId because the AccountCode model does not carry a unitId column.
 * In multi-unit deployments, falling back to a code/name lookup could bind
 * a unit to another unit's chart of accounts, producing cross-unit journal
 * entries that are hard to reconcile later.
 *
 * Policy:
 *   - Primary path (Settings-based mapping) IS unit-scoped — always safe.
 *   - Fallback paths are GATED by `ACCOUNTING_ALLOW_UNSCOPED_FALLBACK` env
 *     var (default: disabled). When disabled, we return null and the caller
 *     (e.g. canteen service) skips journal creation with its existing
 *     "missing account mapping" warning. This forces operators to configure
 *     unit-specific mappings via setAccountMapping() before journals are
 *     posted — eliminating the cross-unit leak risk in production.
 *   - When explicitly enabled (single-unit dev/test setups), fallbacks work
 *     as before and emit a WARN log for visibility.
 *
 * TODO: When AccountCode gains a `unitId` column, replace fallbacks with
 * unit-scoped findFirst calls and remove the env-flag gate.
 */
const ALLOW_UNSCOPED_FALLBACK =
  process.env.ACCOUNTING_ALLOW_UNSCOPED_FALLBACK === 'true';

export async function getAccountOrFallback(
  unitId: string,
  key: string,
  fallbackCode?: string,
  fallbackNameSearch?: string,
  tx: TransactionClient | typeof prisma = prisma
) {
  // 1. Try Mapping (unit-scoped via Settings) — always safe
  const mappedId = await getAccountMapping(unitId, key, tx);
  if (mappedId) {
    const account = await tx.accountCode.findUnique({ where: { id: mappedId } });
    if (account) return account;
  }

  // 2 & 3: Unscoped fallback paths are disabled by default in production.
  // Callers treat a null return as "missing mapping" and skip journals.
  if (!ALLOW_UNSCOPED_FALLBACK) {
    return null;
  }

  // 2. Try Fallback Code (NOT unit-scoped — see CROSS-UNIT SAFETY note above)
  if (fallbackCode) {
    const account = await tx.accountCode.findFirst({
      where: { code: fallbackCode, isActive: true },
    });
    if (account) {
      // eslint-disable-next-line no-console
      console.warn(
        `[AccountingConfig] Unit ${unitId} is using an unscoped fallback AccountCode ` +
        `(code=${fallbackCode}, id=${account.id}) for mapping key '${key}'. ` +
        `This may reference a different unit's chart of accounts. ` +
        `Configure a unit-specific mapping via Settings to resolve.`
      );
      return account;
    }
  }

  // 3. Try Name Search (NOT unit-scoped — see CROSS-UNIT SAFETY note above)
  if (fallbackNameSearch) {
    const account = await tx.accountCode.findFirst({
      where: {
        name: { contains: fallbackNameSearch, mode: 'insensitive' },
        isActive: true,
      },
    });
    if (account) {
      // eslint-disable-next-line no-console
      console.warn(
        `[AccountingConfig] Unit ${unitId} is using an unscoped fallback AccountCode ` +
        `(name~=${fallbackNameSearch}, id=${account.id}) for mapping key '${key}'. ` +
        `This may reference a different unit's chart of accounts. ` +
        `Configure a unit-specific mapping via Settings to resolve.`
      );
      return account;
    }
  }

  return null;
}
