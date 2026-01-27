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

  // Wrap in transaction for consistency
  await prisma.$transaction(async (tx) => {
    for (const asset of assets) {
      try {
        if (processedAssetIds.has(asset.id)) {
          continue;
        }

        const depreciation = await calculateDepreciation(asset.id, tx);

        if (!depreciation) continue;

        // Only depreciate if book value > residual
        if (depreciation.bookValue <= depreciation.residual) continue;

        const amount = depreciation.monthlyDepreciation;
        if (amount <= 0) continue;

        await createDepreciationJournal(asset, amount, date, userId, tx);
        results.journals++;
        results.processed++;
      } catch (error: any) {
        results.errors.push(`Asset ${asset.code}: ${error.message}`);
        // Decide: Do we want to fail the whole batch or partial?
        // Bug report says "partial data commits if an error occurs mid-process".
        // If we want atomic batch, we should throw here.
        // If we want best-effort with logging (current), we don't throw.
        // However, "Reviewer Recommendation: Wrap ... in prisma.$transaction" implies atomic batch.
        // BUT, if one asset fails calculation, do we want to rollback valid ones?
        // Usually batch jobs are best-effort. But the reviewer specifically asked to "Wrap the entire asset processing loop".
        // Let's assume Atomic Batch is desired to ensure "All or Nothing" for a run, OR just to ensure `createDepreciationJournal` is safe.
        // Actually, `createDepreciationJournal` inside `depreciation.service` was using `prisma` directly before. Now we pass `tx`.
        // If we catch errors inside the loop but stay in transaction, we might commit partial if we don't rethrow.
        // Let's rethrow to rollback everything if any asset fails, enforcing strict data integrity.
        throw error;
      }
    }
  }).catch(err => {
    // If transaction failed, results are 0
    results.processed = 0;
    results.journals = 0;
    // Errors are already pushed or we push the main error
    if (results.errors.length === 0) results.errors.push(err.message);
  });

  return results;
}
