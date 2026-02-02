import { prisma } from '../../lib/prisma';
import { Asset, Prisma, AssetDisposal } from '@prisma/client';

// Default Account Codes (Standard Indonesian Accounting)
const DEFAULT_ACCOUNTS = {
  FIXED_ASSET: '1200', // Aset Tetap
  ACCUM_DEPR: '1299', // Akumulasi Penyusutan
  DEPR_EXPENSE: '6200', // Beban Penyusutan
  CASH: '1101', // Kas
  BANK: '1102', // Bank
};

export async function createPurchaseJournal(
  asset: Asset,
  userId: string,
  tx: Prisma.TransactionClient = prisma
) {
  if (!asset.purchasePrice || Number(asset.purchasePrice) <= 0) return;

  const unitId = asset.unitId;
  const amount = new Prisma.Decimal(asset.purchasePrice);

  // 1. Find Debit Account (Fixed Asset)
  const assetAccount = await tx.accountCode.findFirst({
    where: {
      OR: [
        { code: DEFAULT_ACCOUNTS.FIXED_ASSET },
        { name: { contains: 'Aset Tetap', mode: 'insensitive' } },
        { name: { contains: 'Inventaris', mode: 'insensitive' } },
      ],
      isActive: true,
    },
  });

  // 2. Find Credit Account (Cash/Bank)
  const creditAccount = await tx.accountCode.findFirst({
    where: {
      OR: [
        { code: DEFAULT_ACCOUNTS.CASH },
        { name: { contains: 'Kas', mode: 'insensitive' } },
      ],
      isActive: true,
    },
  });

  if (!assetAccount || !creditAccount) {
    throw new Error(`Asset Accounting: Missing accounts for Asset ${asset.code}`);
  }

  // Create Journal Entries
  // Debit Asset
  await tx.journalEntry.create({
    data: {
      unitId,
      date: asset.purchaseDate || new Date(),
      description: `Pembelian Aset: ${asset.name} (${asset.code})`,
      reference: asset.id,
      referenceType: 'ASSET_PURCHASE',
      accountId: assetAccount.id,
      debit: amount,
      credit: 0,
      createdById: userId,
    },
  });

  // Credit Cash
  await tx.journalEntry.create({
    data: {
      unitId,
      date: asset.purchaseDate || new Date(),
      description: `Kas Keluar: Pembelian Aset ${asset.code}`,
      reference: asset.id,
      referenceType: 'ASSET_PURCHASE',
      accountId: creditAccount.id,
      debit: 0,
      credit: amount,
      createdById: userId,
    },
  });
}

export async function createDepreciationJournal(
  asset: Asset,
  amount: number,
  date: Date,
  userId: string,
  tx: Prisma.TransactionClient = prisma
) {
  if (amount <= 0) return;

  const unitId = asset.unitId;
  const decimalAmount = new Prisma.Decimal(amount);

  // 1. Find Expense Account
  const expenseAccount = await tx.accountCode.findFirst({
    where: {
      OR: [
        { code: DEFAULT_ACCOUNTS.DEPR_EXPENSE },
        { name: { contains: 'Beban Penyusutan', mode: 'insensitive' } },
      ],
      isActive: true,
    },
  });

  // 2. Find Accum Depr Account
  const accumAccount = await tx.accountCode.findFirst({
    where: {
      OR: [
        { code: DEFAULT_ACCOUNTS.ACCUM_DEPR },
        { name: { contains: 'Akumulasi Penyusutan', mode: 'insensitive' } },
      ],
      isActive: true,
    },
  });

  if (!expenseAccount || !accumAccount) {
    throw new Error(`Asset Accounting: Missing depreciation accounts`);
  }

  const desc = `Penyusutan Periode ${date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} - ${asset.code}`;

  // Debit Expense
  await tx.journalEntry.create({
    data: {
      unitId,
      date,
      description: desc,
      reference: asset.id,
      referenceType: 'ASSET_DEPRECIATION',
      accountId: expenseAccount.id,
      debit: decimalAmount,
      credit: 0,
      createdById: userId,
    },
  });

  // Credit Accum Depr
  await tx.journalEntry.create({
    data: {
      unitId,
      date,
      description: desc,
      reference: asset.id,
      referenceType: 'ASSET_DEPRECIATION',
      accountId: accumAccount.id,
      debit: 0,
      credit: decimalAmount,
      createdById: userId,
    },
  });
}

export async function createDisposalJournal(
  asset: Asset,
  disposal: AssetDisposal,
  accumulatedDepreciation: number,
  userId: string,
  tx: Prisma.TransactionClient = prisma
) {
  const unitId = asset.unitId;
  const purchasePrice = new Prisma.Decimal(asset.purchasePrice || 0);
  const accumDepr = new Prisma.Decimal(accumulatedDepreciation);
  const bookValue = purchasePrice.minus(accumDepr);
  const salePrice = new Prisma.Decimal(disposal.salePrice || 0);

  // Calculate Gain/Loss
  const gainLoss = salePrice.minus(bookValue);

  // 1. Fixed Asset (Credit)
  const assetAccount = await tx.accountCode.findFirst({
    where: {
      OR: [
        { code: DEFAULT_ACCOUNTS.FIXED_ASSET },
        { name: { contains: 'Aset Tetap', mode: 'insensitive' } },
        { name: { contains: 'Inventaris', mode: 'insensitive' } },
      ],
      isActive: true,
    },
  });

  // 2. Accum Depr (Debit)
  const accumAccount = await tx.accountCode.findFirst({
    where: {
      OR: [
        { code: DEFAULT_ACCOUNTS.ACCUM_DEPR },
        { name: { contains: 'Akumulasi Penyusutan', mode: 'insensitive' } },
      ],
      isActive: true,
    },
  });

  // 3. Cash/Bank (Debit)
  let cashAccount = null;
  if (salePrice.gt(0)) {
    cashAccount = await tx.accountCode.findFirst({
      where: {
        OR: [
          { code: DEFAULT_ACCOUNTS.CASH },
          { name: { contains: 'Kas', mode: 'insensitive' } },
        ],
        isActive: true,
      },
    });
  }

  // 4. Gain/Loss Account
  let gainLossAccount = null;
  if (!gainLoss.equals(0)) {
    const isGain = gainLoss.gt(0);
    const searchName = isGain ? 'Pendapatan Lain-lain' : 'Beban Kerugian';
    gainLossAccount = await tx.accountCode.findFirst({
      where: {
        name: { contains: searchName, mode: 'insensitive' },
        isActive: true,
      },
    });
  }

  if (!assetAccount || !accumAccount) {
    // If accounts are missing, we log/warn but maybe still proceed or throw?
    // For now, assume setup is done. If not, throw.
    throw new Error(`Asset Accounting: Missing accounts for Asset Disposal`);
  }

  const desc = `Penghapusan Aset: ${asset.name} (${asset.code}) - ${disposal.reason}`;
  const date = disposal.date;

  // 1. Credit Fixed Asset (Remove Asset Cost)
  await tx.journalEntry.create({
    data: {
      unitId,
      date,
      description: desc,
      reference: disposal.id,
      referenceType: 'ASSET_DISPOSAL',
      accountId: assetAccount.id,
      debit: 0,
      credit: purchasePrice,
      createdById: userId,
    },
  });

  // 2. Debit Accum Depr (Remove Accum Depr)
  if (accumDepr.gt(0)) {
    await tx.journalEntry.create({
      data: {
        unitId,
        date,
        description: desc,
        reference: disposal.id,
        referenceType: 'ASSET_DISPOSAL',
        accountId: accumAccount.id,
        debit: accumDepr,
        credit: 0,
        createdById: userId,
      },
    });
  }

  // 3. Debit Cash (Receive Money)
  if (cashAccount && salePrice.gt(0)) {
    await tx.journalEntry.create({
      data: {
        unitId,
        date,
        description: desc,
        reference: disposal.id,
        referenceType: 'ASSET_DISPOSAL',
        accountId: cashAccount.id,
        debit: salePrice,
        credit: 0,
        createdById: userId,
      },
    });
  }

  // 4. Record Gain/Loss
  if (gainLossAccount && !gainLoss.equals(0)) {
    if (gainLoss.gt(0)) {
      // Gain -> Credit
      await tx.journalEntry.create({
        data: {
          unitId,
          date,
          description: `Keuntungan Penjualan Aset: ${asset.code}`,
          reference: disposal.id,
          referenceType: 'ASSET_DISPOSAL',
          accountId: gainLossAccount.id,
          debit: 0,
          credit: gainLoss,
          createdById: userId,
        },
      });
    } else {
      // Loss -> Debit
      await tx.journalEntry.create({
        data: {
          unitId,
          date,
          description: `Kerugian Penghapusan Aset: ${asset.code}`,
          reference: disposal.id,
          referenceType: 'ASSET_DISPOSAL',
          accountId: gainLossAccount.id,
          debit: gainLoss.abs(),
          credit: 0,
          createdById: userId,
        },
      });
    }
  }
}
