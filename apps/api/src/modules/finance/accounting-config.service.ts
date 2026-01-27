import { prisma } from '../../lib/prisma';

export const ACCOUNT_MAPPING_KEYS = {
  CASH: 'ACCOUNT_MAPPING_CASH',
  BANK: 'ACCOUNT_MAPPING_BANK',
  PAYROLL_EXPENSE: 'ACCOUNT_MAPPING_PAYROLL_EXPENSE',
  INVENTORY_ASSET: 'ACCOUNT_MAPPING_INVENTORY_ASSET',
  ACCOUNTS_PAYABLE: 'ACCOUNT_MAPPING_ACCOUNTS_PAYABLE',
};

export async function getAccountMapping(unitId: string, key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
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
 * This helps maintain backward compatibility or default behaviors
 */
export async function getAccountOrFallback(
  unitId: string,
  key: string,
  fallbackCode?: string,
  fallbackNameSearch?: string
) {
  // 1. Try Mapping
  const mappedId = await getAccountMapping(unitId, key);
  if (mappedId) {
    const account = await prisma.accountCode.findUnique({ where: { id: mappedId } });
    if (account) return account;
  }

  // 2. Try Fallback Code
  if (fallbackCode) {
    const account = await prisma.accountCode.findFirst({
      where: { code: fallbackCode, isActive: true },
    });
    if (account) return account;
  }

  // 3. Try Name Search
  if (fallbackNameSearch) {
    const account = await prisma.accountCode.findFirst({
      where: {
        name: { contains: fallbackNameSearch, mode: 'insensitive' },
        isActive: true,
      },
    });
    if (account) return account;
  }

  return null;
}
