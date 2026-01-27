import { prisma } from '../../lib/prisma';
import { AssetStatus } from '@prisma/client';
import { calculateDepreciation } from './service';
import { createDepreciationJournal } from './asset-accounting.service';

export async function runMonthlyDepreciation(unitId: string, date: Date, userId: string) {
  const assets = await prisma.asset.findMany({
    where: {
      unitId,
      status: AssetStatus.ACTIVE,
      deletedAt: null,
      purchasePrice: { gt: 0 },
      usefulLife: { gt: 0 },
    },
  });

  const results = {
    processed: 0,
    journals: 0,
    errors: [] as string[],
  };

  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  // Optimization: Fetch all existing depreciation journals for this month in one query
  const existingJournals = await prisma.journalEntry.findMany({
    where: {
      unitId,
      referenceType: 'ASSET_DEPRECIATION',
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: { reference: true },
  });

  const processedAssetIds = new Set(existingJournals.map((j) => j.reference));

  for (const asset of assets) {
    try {
      if (processedAssetIds.has(asset.id)) {
        continue;
      }

      const depreciation = await calculateDepreciation(asset.id);

      if (!depreciation) continue;

      // Only depreciate if book value > residual
      if (depreciation.bookValue <= depreciation.residual) continue;

      const amount = depreciation.monthlyDepreciation;
      if (amount <= 0) continue;

      await createDepreciationJournal(asset, amount, date, userId);
      results.journals++;
      results.processed++;
    } catch (error: any) {
      results.errors.push(`Asset ${asset.code}: ${error.message}`);
    }
  }

  return results;
}
