import { prisma } from '@/lib/prisma';
import { AdmissionStatus, PaymentStatus } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * Finance-Admissions Bridge Service
 * Handles the integration between financial transactions and admission registrant status.
 */
export const financeBridgeService = {
  /**
   * Automatically advance registrant status based on payment verification.
   * This can be called after a payment is successfully recorded in the finance module.
   */
  async verifyAndAdvanceStatus(registrantId: string) {
    return prisma.$transaction(async (tx) => {
      const registrant = await tx.registrant.findUnique({
        where: { id: registrantId },
        include: {
          admissionPeriod: {
            select: {
              unitId: true,
              registrationFee: true,
            },
          },
        },
      });

      if (!registrant) {
        throw new Error('Registrant not found');
      }

      // If already beyond test scheduling, no need to auto-advance from payment
      if (!['REGISTERED', 'DOCUMENT_CHECK'].includes(registrant.status)) {
        return registrant;
      }

      // Check for successful REG_FEE payment in finance module
      // We look for invoices associated with this registrant's future student profile (if any)
      // or manually linked payments via parent info (phone/email match).

      const paymentType = await tx.paymentType.findFirst({
        where: {
          unitId: registrant.admissionPeriod.unitId,
          code: 'REG_FEE',
        },
      });

      if (!paymentType) {
        logger.warn(`No REG_FEE payment type found for unit ${registrant.admissionPeriod.unitId}`);
        return registrant;
      }

      // Since the registrant doesn't have a studentId yet, we look for payments
      // that might have been recorded using their registrationNo or parent phone in the notes
      const matchedPayments = await tx.payment.findMany({
        where: {
          notes: {
            contains: registrant.registrationNo,
          },
        },
        include: {
          invoice: true,
        },
      });

      const totalPaid = matchedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const requiredFee = Number(registrant.admissionPeriod.registrationFee);

      if (totalPaid >= requiredFee && requiredFee > 0) {
        logger.info(`Advancing registrant ${registrant.registrationNo} to TEST_SCHEDULED due to verified payment`);

        return tx.registrant.update({
          where: { id: registrantId },
          data: {
            status: AdmissionStatus.TEST_SCHEDULED,
            notes: (registrant.notes || '') + '\n[SYSTEM] Pembayaran biaya pendaftaran terverifikasi otomatis.',
          },
        });
      }

      return registrant;
    });
  },

  /**
   * Manual trigger to sync payment status for a registrant
   */
  async syncPaymentStatus(registrantId: string) {
    return this.verifyAndAdvanceStatus(registrantId);
  }
};

export default financeBridgeService;
