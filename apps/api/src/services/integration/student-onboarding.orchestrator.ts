import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { PaymentStatus, Registrant } from '@prisma/client';

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
      const crypto = await import('crypto');
      const { hashPassword } = await import('@/lib/password');

      // Use crypto for password reset token generation
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const passwordHash = await hashPassword(crypto.randomBytes(8).toString('hex')); // Dummy secure hash, user will reset it

      // Extract parts of name to create a safe email
      let cleanName = registrant.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!cleanName) {
        cleanName = 'student'; // Fallback for non-Latin names
      }

      // 3. Create Student Record (Generate NIS first so we can use it for email)
      const year = new Date().getFullYear();

      // Instead of using `desc` which sorts lexicographically and breaks on old formats,
      // we count existing students to determine the sequence.
      const studentCount = await tx.student.count({
        where: { unitId }
      });
      const nextSeq = studentCount + 1;

      // Look up unit code dynamically, fallback to UNK
      let unitCode = 'UNK';
      const unit = await tx.unit.findUnique({ where: { id: unitId }, select: { code: true } });
      if (unit && unit.code) {
        unitCode = unit.code.toUpperCase();
      }

      const nis = `NIS-${year}-${unitCode}-${String(nextSeq).padStart(4, '0')}`;

      const email = `${cleanName}.${nis.toLowerCase()}@student.cipansor.local`;

      const { eventBus } = await import('@/lib/event-bus');

      // @ts-ignore - Ignore type error as Prisma types might be lagging behind schema for password reset
      const user = await tx.user.create({
        data: {
          name: registrant.fullName,
          email,
          passwordHash,
          resetTokenHash: await hashPassword(resetToken),
          resetTokenExpiresAt: resetTokenExpiry,
          role: 'STUDENT',
          unitId,
          isActive: true,
        },
      });


      const student = await (tx.student.create as any)({
        data: {
          userId: user.id,
          status: 'active',
          unitId,
          nis,
          entryYear: academicYearId, // Link to academic year per PR feedback

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
      let parentDefaultPassword;
      let parentResetToken: string | undefined;
      let parentUser: any = null;
      if (registrant.parentPhone || registrant.parentEmail) {
        // Try to find existing parent by phone or email
        parentUser = await tx.user.findFirst({
          where: {
            OR: [
              ...(registrant.parentPhone ? [{ phone: registrant.parentPhone, role: 'PARENT' as const }] : []),
              ...(registrant.parentEmail ? [{ email: registrant.parentEmail, role: 'PARENT' as const }] : [])
            ]
          }
        });

        if (!parentUser) {
          parentResetToken = crypto.randomBytes(32).toString('hex');
          const parentResetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
          // Assign a dummy unguessable password hash, parent will reset via token
          const parentPasswordHash = await hashPassword(crypto.randomBytes(16).toString('hex'));
          const parentEmail = registrant.parentEmail || `parent.${registrant.parentPhone}@parent.cipansor.local`;
          parentUser = await (tx.user.create as any)({
            data: {
              name: registrant.parentName,
              email: parentEmail,
              phone: registrant.parentPhone,
              passwordHash: parentPasswordHash,
              resetTokenHash: await hashPassword(parentResetToken),
              resetTokenExpiresAt: parentResetTokenExpiry,
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

      // 8. Distribute Reset Tokens asynchronously via secure channels
      // We do NOT generate plaintext passwords anymore. We notify users to set their passwords via tokens.
      process.nextTick(() => {
        try {
          eventBus.emit('student:created', {
            id: student.id,
            name: registrant.fullName,
            unitId,
          });

          eventBus.emit('health:medical-record-created', {
            id: '',
            studentId: student.id,
            studentName: registrant.fullName,
            unitId,
            unitName: '',
            type: 'CHECKUP',
            complaint: 'Initial Enrollment Checkup',
            status: 'HEALTHY',
            recordedAt: new Date(),
          });

          eventBus.emit('notification:send', {
            type: 'CREDENTIALS',
            title: 'Your Account has been created',
            message: `Student account created. Email: ${email}. Please use the password reset link to set your password: https://app.cipansor.local/reset-password?token=${resetToken}`,
            userId: user.id,
          });

          if (parentUser && parentResetToken) {
            eventBus.emit('notification:send', {
              type: 'CREDENTIALS',
              title: 'Your Parent Account has been created',
              message: `Parent account created. Please use the password reset link to set your password: https://app.cipansor.local/reset-password?token=${parentResetToken}`,
              userId: parentUser.id,
            });
          } else if (parentUser) {
            eventBus.emit('notification:send', {
              type: 'INFO',
              title: 'Your Parent Account has been linked',
              message: `Your existing parent account has been linked to the new student.`,
              userId: parentUser.id,
            });
          }
        } catch (err) {
          console.error('Failed to dispatch events', err);
        }
      });

      return {
        success: true,
        studentId: student.id,
        userId: user.id,
        nis
      };
    });
  }
}
