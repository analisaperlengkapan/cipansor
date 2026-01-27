import { prisma } from '../lib/prisma';
import { AssetStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export async function runMonthlyDepreciation(unitId?: string) {
  console.log(`[DepreciationJob] Starting for unit: ${unitId || 'ALL'}`);

  // 1. Get Units to process
  const units = await prisma.unit.findMany({
    where: unitId ? { id: unitId } : { deletedAt: null },
    select: { id: true, name: true },
  });

  const results = [];

  for (const unit of units) {
    try {
      // 2. Get Settings
      const settings = await prisma.setting.findMany({
        where: {
          unitId: unit.id,
          key: { in: ['DEPRECIATION_EXPENSE_ACCOUNT', 'ACCUMULATED_DEPRECIATION_ACCOUNT'] },
        },
      });

      const expenseAccount = settings.find((s) => s.key === 'DEPRECIATION_EXPENSE_ACCOUNT')?.value as string;
      const accumAccount = settings.find((s) => s.key === 'ACCUMULATED_DEPRECIATION_ACCOUNT')?.value as string;

      if (!expenseAccount || !accumAccount) {
        console.warn(`[DepreciationJob] Skipping Unit ${unit.name} (${unit.id}): Missing account settings`);
        results.push({ unit: unit.name, status: 'SKIPPED', reason: 'Missing Settings' });
        continue;
      }

      // 3. Get Active Assets with Value
      const assets = await prisma.asset.findMany({
        where: {
          unitId: unit.id,
          status: AssetStatus.ACTIVE,
          purchasePrice: { gt: 0 },
          usefulLife: { gt: 0 },
          deletedAt: null,
        },
      });

      console.log(`[DepreciationJob] Found ${assets.length} assets for Unit ${unit.name}`);

      let processedCount = 0;
      let skippedCount = 0;
      const journalEntries: Prisma.JournalEntryCreateManyInput[] = [];

      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

      for (const asset of assets) {
        // Calculate Depreciation
        const cost = Number(asset.purchasePrice);
        const residual = Number(asset.residualValue || 0);
        const lifeMonths = asset.usefulLife || 0;
        const monthlyDepreciation = (cost - residual) / lifeMonths;

        // Skip if fully depreciated (approx)
        const ageMonths =
          (now.getFullYear() - (asset.purchaseDate?.getFullYear() || now.getFullYear())) * 12 +
          (now.getMonth() - (asset.purchaseDate?.getMonth() || now.getMonth()));

        if (ageMonths > lifeMonths) {
             skippedCount++;
             continue;
        }

        if (monthlyDepreciation <= 0) {
            skippedCount++;
            continue;
        }

        // Check if already run for this month
        // Reference format: DEPR-{ASSET_CODE}-{YYYY-MM}
        const reference = `DEPR-${asset.code}-${yearMonth}`;

        const existing = await prisma.journalEntry.findFirst({
          where: {
            unitId: unit.id,
            reference,
            referenceType: 'DEPRECIATION',
          },
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        const description = `Depresiasi Bulan ${yearMonth} - ${asset.name} (${asset.code})`;

        // Debit Expense
        journalEntries.push({
            unitId: unit.id,
            accountId: expenseAccount,
            date: now,
            description,
            debit: new Prisma.Decimal(monthlyDepreciation),
            credit: new Prisma.Decimal(0),
            reference: reference, // Unique per asset per month
            referenceType: 'DEPRECIATION',
            createdById: 'SYSTEM',
        });

        // Credit Accum Depr
        journalEntries.push({
            unitId: unit.id,
            accountId: accumAccount,
            date: now,
            description,
            debit: new Prisma.Decimal(0),
            credit: new Prisma.Decimal(monthlyDepreciation),
            reference: reference,
            referenceType: 'DEPRECIATION',
            createdById: 'SYSTEM',
        });

        processedCount++;
      }

      // Batch Insert (Chunk size 100)
      if (journalEntries.length > 0) {
          const BATCH_SIZE = 100;
          for (let i = 0; i < journalEntries.length; i += BATCH_SIZE) {
              const batch = journalEntries.slice(i, i + BATCH_SIZE);
              await prisma.journalEntry.createMany({
                  data: batch
              });
          }
      }

      results.push({
          unit: unit.name,
          status: 'SUCCESS',
          assets: assets.length,
          processed: processedCount,
          skipped: skippedCount
      });

    } catch (error) {
      console.error(`[DepreciationJob] Error processing unit ${unit.name}:`, error);
      results.push({ unit: unit.name, status: 'ERROR', error: String(error) });
    }
  }

  return results;
}
