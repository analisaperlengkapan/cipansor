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

  for (const asset of assets) {
    try {
      const depreciation = await calculateDepreciation(asset.id);

      if (!depreciation) continue;

      // Only depreciate if book value > residual
      if (depreciation.bookValue <= depreciation.residual) continue;

      const amount = depreciation.monthlyDepreciation;
      if (amount <= 0) continue;

      // Check if depreciation already run for this month
      const existing = await prisma.journalEntry.findFirst({
        where: {
          reference: asset.id,
          referenceType: 'ASSET_DEPRECIATION',
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      if (existing) {
        continue; // Already depreciated this month
      }

      await createDepreciationJournal(asset, amount, date, userId);
      results.journals++;
      results.processed++;
    } catch (error: any) {
      results.errors.push(`Asset ${asset.code}: ${error.message}`);
    }
  }

  return results;
}
