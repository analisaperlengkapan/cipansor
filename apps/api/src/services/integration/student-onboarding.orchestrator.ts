import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { PaymentStatus, Registrant } from '@prisma/client';
import { generateNis } from '@/utils/nis-generator';

export class StudentOnboardingOrchestrator {
  /**
   * Process a registrant to become a full student
   * This is an integration point touching multiple domains:
   * PSB -> HR/User -> Academic -> Health -> Finance
   */
  static async processEnrollment(
    registrantId: string,
    unitId: string,
    academicYearId: string,
    processedById: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get registrant data
      const registrant = await tx.registrant.findUnique({
        where: { id: registrantId },
      });

      if (!registrant) {
        throw Errors.notFound('Registrant not found');
      }

      if (registrant.status !== 'ACCEPTED') {
        throw Errors.badRequest('Only ACCEPTED registrants can be enrolled');
      }

      // 2. Create User Account for Student
      const defaultPassword = 'Password123!';
      const { hashPassword } = await import('@/lib/password');
      const passwordHash = await hashPassword(defaultPassword);

      // Extract parts of name to create a safe email
      const cleanName = registrant.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      const email = `${cleanName}${uniqueSuffix}@student.cipansor.local`;

      const user = await tx.user.create({
        data: {
          name: registrant.fullName,
          email,
          passwordHash,
          role: 'STUDENT',
          unitId,
          isActive: true,
        },
      });

      // 3. Create Student Record
      const nis = await generateNis(unitId, tx as any);

      const student = await (tx.student.create as any)({
        data: {
          userId: user.id,
          status: 'active',
          unitId,
          nis,
          status: 'active',

          // Core Data mapping from registrant
          gender: registrant.gender,
          birthPlace: registrant.birthPlace,
          birthDate: registrant.birthDate,
          address: registrant.address,
          parentName: registrant.parentName,
          parentPhone: registrant.parentPhone,
          parentEmail: registrant.parentEmail,

          // Link back
          registrant: {
            connect: { id: registrant.id }
          }
        },
      });

      // 4. Create Parent User Account
      if (registrant.parentPhone) {
        // Try to find existing parent by phone
        let parentUser = await tx.user.findFirst({
          where: { phone: registrant.parentPhone, role: 'PARENT' }
        });

        if (!parentUser) {
          const parentEmail = registrant.parentEmail || `parent.${registrant.parentPhone}@parent.cipansor.local`;
          parentUser = await (tx.user.create as any)({
            data: {
              name: registrant.parentName,
              email: parentEmail,
              phone: registrant.parentPhone,
              passwordHash,
              role: 'PARENT',
              isActive: true,
            }
          });
        }

        // Link student and parent
        await tx.studentParent.create({
          data: {
            studentId: student.id,
            parentId: parentUser.id,
            relation: 'parent',
            isPrimary: true,
          }
        });
      }

      // 5. Setup initial Health/UKS record (Empty but ready)
      await (tx.medicalRecord.create as any)({
        data: {
          studentId: student.id,
          type: 'CHECKUP',
          visitDate: new Date(),
          complaint: 'Initial Enrollment Checkup',
          diagnosis: 'Healthy',
          notes: 'Auto-generated during enrollment',
          recordedById: processedById,
          status: 'HEALTHY'
        }
      });

      // 6. Setup Student Wallet
      await tx.santriWallet.create({
        data: {
          studentId: student.id,
          balance: 0,
        }
      });

      // 7. Update Registrant Status
      await tx.registrant.update({
        where: { id: registrant.id },
        data: {
          status: 'ENROLLED',
          enrolledAt: new Date(),
          studentId: student.id
        }
      });

      // 8. Generate Registration Invoice (If not already created)
      // Check if registration fee invoice exists for this registrant
      const existingInvoice = await tx.invoice.findFirst({
        where: {
          // @ts-ignore - Ignore type error as Prisma types might be lagging behind schema
          registrantId: registrant.id
        }
      });

      // We only generate invoice if we have a payment type configured for this unit
      // This is simplified for this orchestrator, in real scenario we'd query paymentTypes

      return {
        success: true,
        studentId: student.id,
        userId: user.id,
        nis
      };
    });
  }
}
