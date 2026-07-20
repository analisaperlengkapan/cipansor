import { prisma } from '@/lib/prisma';
import { ACCOUNT_MAPPING_KEYS, getAccountOrFallback } from '../finance/accounting-config.service';

export const financeBridge = {
  async journalSocialService(orderId: string, amount: number, unitId: string, createdById: string) {
    return prisma.$transaction(async (tx) => {
      const expenseAccount = await getAccountOrFallback(
        unitId,
        'SOCIAL_SERVICE_EXPENSE',
        '5105',
        'Beban Layanan Sosial'
      );

      const cashAccount = await getAccountOrFallback(
        unitId,
        ACCOUNT_MAPPING_KEYS.CASH,
        '1101',
        'Kas'
      );

      if (expenseAccount && cashAccount) {
        await tx.journalEntry.create({
          data: {
            unitId,
            accountId: expenseAccount.id,
            date: new Date(),
            description: `Biaya Layanan Sosial #${orderId}`,
            debit: amount,
            credit: 0,
            reference: orderId,
            referenceType: 'SOCIAL_SERVICE',
            createdById,
          },
        });

        await tx.journalEntry.create({
          data: {
            unitId,
            accountId: cashAccount.id,
            date: new Date(),
            description: `Biaya Layanan Sosial #${orderId}`,
            debit: 0,
            credit: amount,
            reference: orderId,
            referenceType: 'SOCIAL_SERVICE',
            createdById,
          },
        });
      }
    });
  },
};
