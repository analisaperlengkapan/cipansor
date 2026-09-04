import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { PaymentStatus, Registrant } from '@prisma/client';
import {
  syncParentRoleAssignments,
  type ParentScopeClient,
} from '@/utils/parent-scope';
import { assertAdmissionFeeSettled } from '@/utils/admission-fee-gate';

export interface EnrollmentOptions {
  classId?: string;
  assignedClassId?: string;
  academicYearId?: string;
  nis?: string;
  nisn?: string;
  roomId?: string;
}

export class StudentOnboardingOrchestrator {
  /**
   * Process a registrant to become a full student
   * This is an integration point touching multiple domains:
   * PSB -> HR/User -> Academic -> Health -> Finance
   */
  static async processEnrollment(
    registrantId: string,
    unitId: string,
    processedById: string,
    options?: EnrollmentOptions | string,
    legacyAcademicYearId?: string
  ) {
    // Normalise options
    let classId: string | undefined = undefined;
    let academicYearId: string | undefined = legacyAcademicYearId;
    let customNis: string | undefined = undefined;
    let nisn: string | undefined = undefined;
    let roomId: string | undefined = undefined;

    if (typeof options === 'string') {
      classId = options;
    } else if (options && typeof options === 'object') {
      classId = options.classId || options.assignedClassId;
      academicYearId = options.academicYearId || legacyAcademicYearId;
      customNis = options.nis;
      nisn = options.nisn;
      roomId = options.roomId;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock registrant row for concurrency protection
      if ((tx as any).$executeRaw) {
        await (tx as any).$executeRaw`SELECT id FROM "registrants" WHERE id = ${registrantId} FOR UPDATE`;
      }

      // Get registrant data
      const registrant = await tx.registrant.findUnique({
        where: { id: registrantId },
        include: { admissionPeriod: true },
      });

      if (!registrant) {
        throw Errors.notFound('Registrant');
      }

      if (registrant.status === 'ENROLLED' || (registrant as any).studentId) {
        throw Errors.conflict('Pendaftar ini telah terdaftar sebagai santri (enrolled)');
      }

      if (registrant.status !== 'ACCEPTED') {
        throw Errors.badRequest('Hanya pendaftar dengan status ACCEPTED yang dapat di-onboard');
      }

      // Being accepted is an academic decision; it is not daftar ulang. The
      // fee owed lives on the period, so it has to be read alongside.
      const period = registrant.admissionPeriod || (await tx.admissionPeriod.findUnique({
        where: { id: registrant.admissionPeriodId },
        select: { registrationFee: true, academicYearId: true },
      }));

      const effectiveUnitId = period?.unitId || unitId;

      assertAdmissionFeeSettled({
        registrationFee: period?.registrationFee ?? null,
        registrationFeePaidAt: registrant.registrationFeePaidAt,
      });

      // Resolve academicYearId if not passed explicitly
      if (!academicYearId && period?.academicYearId) {
        academicYearId = period.academicYearId;
      }

      // 2. Create User Account for Student
      const crypto = await import('crypto');
      const { hashPassword } = await import('@/lib/password');

      // Use crypto for password reset token generation
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const passwordHash = await hashPassword(crypto.randomBytes(8).toString('hex')); // Dummy secure hash

      // Extract parts of name to create a safe email
      let cleanName = registrant.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!cleanName) {
        cleanName = 'student'; // Fallback for non-Latin names
      }

      // 3. Resolve or Generate NIS
      const year = new Date().getFullYear();
      let nis = customNis;

      if (!nis) {
        // Look up unit dynamically, fallback to UNK
        let unitCode = 'UNK';
        const unit = await tx.unit.findUnique({ where: { id: effectiveUnitId }, select: { type: true } });
        if (unit && unit.type) {
          unitCode = unit.type.toUpperCase();
        }

        // Use Postgres advisory locks to serialize NIS generation for the same unit + year
        const prefix = `NIS-${year}-${unitCode}-`;

        let lockKey = 0;
        for (let i = 0; i < prefix.length; i++) {
          lockKey = ((lockKey << 5) - lockKey) + prefix.charCodeAt(i);
          lockKey = lockKey & lockKey;
        }

        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

        const prefixLen = prefix.length + 1;
        const results = await tx.$queryRaw<Array<{ max_seq: number | null }>>`
          SELECT MAX(CAST(substr(nis, ${prefixLen}) AS INTEGER)) as max_seq
          FROM "students"
          WHERE "unit_id" = ${effectiveUnitId} AND nis LIKE ${prefix + '%'} AND substr(nis, ${prefixLen}) ~ '^[0-9]+$'
        `;

        let maxSeq = 0;
        if (results && results.length > 0 && results[0].max_seq != null) {
          maxSeq = Number(results[0].max_seq);
        }

        const nextSeq = maxSeq + 1;
        nis = `${prefix}${String(nextSeq).padStart(4, '0')}`;
      }

      let unitCode = 'UNK';
      const unit = await tx.unit.findUnique({ where: { id: effectiveUnitId }, select: { type: true } });
      if (unit && unit.type) {
        unitCode = unit.type.toUpperCase();
      }

      // Determine student email: prefer real registrant.email, fallback to .local
      const realEmail = registrant.email && registrant.email.trim() !== '' ? registrant.email.trim() : null;
      const fallbackEmail = `${cleanName}.${nis.toLowerCase()}@student.cipansor.local`;
      const email = realEmail || fallbackEmail;

      let user = await tx.user.findUnique({
        where: { email },
      });

      if (!user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user = await (tx.user.create as any)({
          data: {
            name: registrant.fullName,
            email,
            passwordHash,
            resetTokenHash: crypto.createHash('sha256').update(resetToken).digest('hex'),
            resetTokenExpiresAt: resetTokenExpiry,
            role: 'STUDENT',
            unitId: effectiveUnitId,
            isActive: true,
          },
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let student = await (tx.student.findUnique as any)({
        where: { userId: user!.id },
      });

      if (student) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        student = await (tx.student.update as any)({
          where: { id: student.id },
          data: {
            unitId: effectiveUnitId,
            nis: student.nis || nis,
            nisn: nisn || student.nisn || undefined,
            status: 'active',
            registrant: {
              connect: { id: registrant.id },
            },
          },
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        student = await (tx.student.create as any)({
          data: {
            userId: user!.id,
            status: 'active',
            unitId: effectiveUnitId,
            nis,
            nisn: nisn || undefined,
            entryYear: year,

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
              connect: { id: registrant.id },
            },
          },
        });
      }

      // 4. Create Parent User Account
      let parentResetToken: string | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parentUser: any = null;
      if (registrant.parentPhone || registrant.parentEmail) {
        if (registrant.parentEmail) {
          parentUser = await tx.user.findUnique({
            where: { email: registrant.parentEmail }
          });
        }

        if (!parentUser && registrant.parentPhone) {
          parentUser = await tx.user.findFirst({
            where: { phone: registrant.parentPhone }
          });
        }

        if (!parentUser) {
          parentResetToken = crypto.randomBytes(32).toString('hex');
          const parentResetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
          const parentPasswordHash = await hashPassword(crypto.randomBytes(16).toString('hex'));
          const parentEmail = registrant.parentEmail || `parent.${registrant.parentPhone}@parent.cipansor.local`;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parentUser = await (tx.user.create as any)({
            data: {
              name: registrant.parentName,
              email: parentEmail,
              phone: registrant.parentPhone,
              passwordHash: parentPasswordHash,
              resetTokenHash: crypto.createHash('sha256').update(parentResetToken).digest('hex'),
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

        await syncParentRoleAssignments(
          tx as unknown as ParentScopeClient,
          parentUser.id
        );
      }

      // 5. Setup initial Health/UKS record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // 7. Enroll in specific class if provided
      if (classId) {
        await tx.classEnrollment.create({
          data: {
            studentId: student.id,
            classId,
            status: 'active',
          }
        });
      }

      // 8. Assign room if roomId provided
      if (roomId && tx.roomAssignment) {
        await tx.roomAssignment.create({
          data: {
            studentId: student.id,
            roomId,
            isActive: true,
          },
        });
      }

      // 9. Update Registrant Status
      await tx.registrant.update({
        where: { id: registrant.id },
        data: {
          status: 'ENROLLED',
          enrolledAt: new Date(),
          studentId: student.id
        }
      });

      // Decrement wave's acceptedCount
      if (registrant.waveId) {
        await tx.admissionWave.updateMany({
          where: { id: registrant.waveId, acceptedCount: { gt: 0 } },
          data: { acceptedCount: { decrement: 1 } },
        });
      }

      // Policy: Registration fee (daftar ulang) settlement is mandatory prior to onboarding
      // (enforced by assertAdmissionFeeSettled above). Payment is recorded prior to enrollment via
      // recordRegistrationFee, so no unpaid invoice generation is needed during student onboarding.

      return {
        success: true,
        studentId: student.id,
        userId: user!.id,
        nis,
        email,
        unitCode,
        resetToken,
        parentUserId: parentUser ? parentUser.id : undefined,
        parentEmail: parentUser && parentResetToken ? parentUser.email : undefined,
        parentName: parentUser ? parentUser.name : undefined,
        parentResetToken,
        studentName: registrant.fullName,
        effectiveUnitId,
      };
    });

    // Asynchronous event distribution
    process.nextTick(async () => {
      try {
        const { eventBus } = await import('@/lib/event-bus');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = result as any;

        eventBus.emit('student:created', {
          id: r.studentId,
          name: r.studentName,
          unitId: (result as any).effectiveUnitId || unitId,
          unitName: r.unitCode,
        });

        eventBus.emit('health:medical-record-created', {
          id: 'auto-generated',
          studentId: r.studentId,
          studentName: r.studentName,
          unitName: r.unitCode,
          type: 'CHECKUP',
          complaint: 'Initial Checkup',
          status: 'HEALTHY',
          recordedAt: new Date(),
          unitId: (result as any).effectiveUnitId || unitId,
        });

        eventBus.emit('notification:send', {
          type: 'INFO',
          title: 'Your Account has been created',
          message: `Student account created. Email: ${r.email}. Please check your email for a password reset link to set your password securely.`,
          userId: r.userId,
        });

        eventBus.emit('email:send_reset_token', {
          email: r.email,
          token: r.resetToken,
          userId: r.userId,
          name: r.studentName,
          title: 'Set Your Password',
          message: 'Please set your password using the link provided.',
          data: { expiresInHours: 24 },
        });

        if (r.parentUserId && r.parentResetToken) {
          eventBus.emit('notification:send', {
            type: 'INFO',
            title: 'Your Parent Account has been created',
            message: `Parent account created. Please check your email for a password reset link to set your password securely.`,
            userId: r.parentUserId,
          });
          eventBus.emit('email:send_reset_token', {
            email: r.parentEmail,
            token: r.parentResetToken,
            userId: r.parentUserId,
            name: r.parentName,
            title: 'Set Your Parent Password',
            message: 'Please set your parent account password using the link provided.',
            data: { expiresInHours: 24 },
          });
        } else if (r.parentUserId) {
          eventBus.emit('notification:send', {
            type: 'INFO',
            title: 'Your Parent Account has been linked',
            message: `Your existing parent account has been linked to the new student.`,
            userId: r.parentUserId,
          });
        }
      } catch (err) {
        console.error('Failed to dispatch onboarding events:', err);
      }
    });

    return {
      success: result.success,
      studentId: result.studentId,
      userId: result.userId,
      nis: result.nis
    };
  }
}
