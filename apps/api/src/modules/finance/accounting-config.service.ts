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
 * Helper to get a mapped account or fallback to a default code/search
 * This helps maintain backward compatibility or default behaviors.
 * Accepts an optional transaction client to ensure reads participate
 * in the caller's transaction when used inside prisma.$transaction.
 *
 * CROSS-UNIT SAFETY: The fallback lookups (by code or name) are NOT scoped
 * by unitId because the AccountCode schema may not carry a unitId column in
 * all deployments. If a unit has not configured its account mappings via
 * Settings, the fallback could return an AccountCode that logically belongs
 * to a different unit — creating cross-unit journal entries that are hard to
 * reconcile later.
 *
 * To mitigate this without a schema change:
 *   1. The primary path (Settings-based mapping) IS unit-scoped — configure
 *      account mappings per unit via setAccountMapping() to avoid falling
 *      through to the fallback.
 *   2. When the fallback path is used, we emit a WARN log so operators can
 *      detect mis-configuration and resolve it.
 *
 * TODO: If AccountCode gains a `unitId` column, replace the fallback queries
 * with unit-scoped findFirst calls and remove the warning.
 */
export async function getAccountOrFallback(
  unitId: string,
  key: string,
  fallbackCode?: string,
  fallbackNameSearch?: string,
  tx: TransactionClient | typeof prisma = prisma
) {
  // 1. Try Mapping (unit-scoped via Settings)
  const mappedId = await getAccountMapping(unitId, key, tx);
  if (mappedId) {
    const account = await tx.accountCode.findUnique({ where: { id: mappedId } });
    if (account) return account;
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
