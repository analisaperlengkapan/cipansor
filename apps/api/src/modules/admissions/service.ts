import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { Prisma, AdmissionStatus, Gender } from '@prisma/client';
import * as financeService from '../finance/service';
import * as notificationService from '../notifications/service';
import {
  CreateAdmissionPeriodInput,
  UpdateAdmissionPeriodInput,
  CreateRegistrantInput,
  UpdateRegistrantInput,
  UpdateRegistrantScoreInput,
  UpdateRegistrantStatusInput,
  CreateRegistrantDocumentInput,
} from './schema';

interface CreateRegistrantExtendedInput extends CreateRegistrantInput {
  source?: string;
  campaignId?: string;
}

// =====================================
// ADMISSION PERIOD SERVICE
// =====================================

export async function getAdmissionPeriods(params: {
  page: number;
  limit: number;
  unitId?: string;
  academicYearId?: string;
  isActive?: boolean;
}) {
  const { page, limit, unitId, academicYearId, isActive } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.AdmissionPeriodWhereInput = {};

  if (unitId) where.unitId = unitId;
  if (academicYearId) where.academicYearId = academicYearId;
  if (isActive !== undefined) where.isActive = isActive;

  const [data, total] = await Promise.all([
    prisma.admissionPeriod.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startDate: 'desc' },
      include: {
        unit: { select: { id: true, name: true, type: true } },
        academicYear: { select: { id: true, name: true } },
        _count: { select: { registrants: true } },
      },
    }),
    prisma.admissionPeriod.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getAdmissionPeriodById(id: string) {
  return prisma.admissionPeriod.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true, type: true } },
      academicYear: { select: { id: true, name: true } },
      _count: { select: { registrants: true } },
    },
  });
}

export async function createAdmissionPeriod(data: CreateAdmissionPeriodInput) {
  return prisma.admissionPeriod.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      registrationFee: new Prisma.Decimal(data.registrationFee),
    } as any,
  });
}

export async function updateAdmissionPeriod(id: string, data: UpdateAdmissionPeriodInput) {
  return prisma.admissionPeriod.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      registrationFee:
        data.registrationFee !== undefined ? new Prisma.Decimal(data.registrationFee) : undefined,
    },
  });
}

export async function deleteAdmissionPeriod(id: string) {
  // Check if period has registrants
  const period = await prisma.admissionPeriod.findUnique({
    where: { id },
    include: { _count: { select: { registrants: true } } },
  });

  if (period?._count.registrants && period._count.registrants > 0) {
    throw new Error('Cannot delete admission period with registrants');
  }

  return prisma.admissionPeriod.delete({ where: { id } });
}

export async function getAdmissionPeriodStats(id: string) {
  const period = await prisma.admissionPeriod.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } },
    },
  });

  if (!period) return null;

  const statusCounts = await prisma.registrant.groupBy({
    by: ['status'],
    where: { admissionPeriodId: id },
    _count: { status: true },
  });

  const genderCounts = await prisma.registrant.groupBy({
    by: ['gender'],
    where: { admissionPeriodId: id },
    _count: { gender: true },
  });

  const totalRegistrants = await prisma.registrant.count({
    where: { admissionPeriodId: id },
  });

  return {
    period,
    totalRegistrants,
    quota: period.quota,
    remaining: Math.max(0, period.quota - totalRegistrants),
    byStatus: statusCounts.reduce(
      (acc, item) => ({ ...acc, [item.status]: item._count.status }),
      {} as Record<string, number>
    ),
    byGender: genderCounts.reduce(
      (acc, item) => ({ ...acc, [item.gender]: item._count.gender }),
      {} as Record<string, number>
    ),
  };
}

// =====================================
// REGISTRANT SERVICE
// =====================================

async function generateRegistrationNo(
  admissionPeriodId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<string> {
  const period = await client.admissionPeriod.findUnique({
    where: { id: admissionPeriodId },
    include: { unit: true, academicYear: true },
  });

  if (!period) throw new Error('Admission period not found');

  const year = period.academicYear.name.split('/')[0];
  const count = await client.registrant.count({
    where: { admissionPeriodId },
  });

  return `REG-${year}-${String(count + 1).padStart(5, '0')}`;
}

export async function getRegistrants(params: {
  page: number;
  limit: number;
  admissionPeriodId?: string;
  status?: AdmissionStatus;
  gender?: 'MALE' | 'FEMALE';
  search?: string;
}) {
  const { page, limit, admissionPeriodId, status, gender, search } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.RegistrantWhereInput = {};

  if (admissionPeriodId) where.admissionPeriodId = admissionPeriodId;
  if (status) where.status = status;
  if (gender) where.gender = gender as Gender;

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { registrationNo: { contains: search, mode: 'insensitive' } },
      { parentName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.registrant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admissionPeriod: {
          select: { id: true, name: true, unit: { select: { id: true, name: true } } },
        },
        campaign: {
          select: { id: true, name: true, code: true },
        },
        _count: { select: { documents: true } },
      },
    }),
    prisma.registrant.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getRegistrantById(id: string) {
  return prisma.registrant.findUnique({
    where: { id },
    include: {
      admissionPeriod: {
        select: {
          id: true,
          name: true,
          registrationFee: true,
          unit: { select: { id: true, name: true, type: true } },
          academicYear: { select: { id: true, name: true } },
        },
      },
      documents: { orderBy: { createdAt: 'desc' } },
      student: { select: { id: true, nis: true, userId: true } },
    },
  });
}

export async function createRegistrant(data: CreateRegistrantExtendedInput) {
  // Race-safety: `generateRegistrationNo` derives the next number from
  // `count(*) + 1`. Under PostgreSQL's default READ COMMITTED isolation,
  // two concurrent transactions can read the same count and try to insert
  // the same `registrationNo`, which then fails the unique constraint
  // (`Registrant.registrationNo @unique`) with Prisma error P2002. Retry
  // a small number of times so the second/third concurrent caller gets a
  // valid sequential number instead of a 500.
  const MAX_ATTEMPTS = 5;
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await createRegistrantOnce(data);
    } catch (err) {
      lastError = err;
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        Array.isArray((err.meta as { target?: string[] } | undefined)?.target) &&
        ((err.meta as { target: string[] }).target).includes('registrationNo')
      ) {
        // Collision on registrationNo — retry with a fresh count.
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

async function createRegistrantOnce(data: CreateRegistrantExtendedInput) {
  return prisma.$transaction(async (tx) => {
    const registrationNo = await generateRegistrationNo(data.admissionPeriodId, tx);

    // Map Zod input fields to the actual Prisma Registrant model.
    // The schema accepts richer father/mother/address breakdowns for UX,
    // but the persisted model uses consolidated parent* fields and does
    // not have columns for nickname / nationalId / familyCardNumber /
    // village / district / city / province / postalCode /
    // previousSchoolAddress / graduationYear / fatherEmail /
    // fatherOccupation / motherOccupation. Spreading would cause Prisma
    // to reject unknown args at runtime.
    const parentName = data.fatherName || data.motherName;
    const parentPhone = data.fatherPhone || data.motherPhone || '';
    const parentEmail =
      data.fatherEmail && data.fatherEmail !== '' ? data.fatherEmail : undefined;
    const parentOccupation = data.fatherOccupation || data.motherOccupation;

    const registrant = await tx.registrant.create({
      data: {
        admissionPeriodId: data.admissionPeriodId,
        registrationNo,
        fullName: data.fullName,
        name: data.fullName, // legacy column, kept in sync
        gender: data.gender as Gender,
        birthPlace: data.birthPlace,
        birthDate: new Date(data.birthDate),
        address: data.address,
        phone: data.phone,
        email: data.email && data.email !== '' ? data.email : undefined,
        previousSchool: data.previousSchool,
        quranAbility: data.quranAbility,
        memorizedJuz: data.memorizedJuz,
        parentName,
        parentPhone,
        parentEmail,
        parentOccupation,
        notes: data.notes,
        source: data.source,
        campaignId: data.campaignId,
      },
    });

    // Best Practice: Ensure a REG_FEE payment type exists so that the
    // registration-fee invoice can be created automatically at enrollment
    // time (when a real studentId is available). We deliberately do NOT
    // create the Invoice here: the Invoice schema requires a non-null
    // studentId, and the registrant has not yet been promoted to a Student.
    // Creating an invoice with `studentId: ''` would fail with a Prisma
    // foreign-key error and abort the entire transaction.
    const period = await tx.admissionPeriod.findUnique({
      where: { id: data.admissionPeriodId },
    });

    if (period && Number(period.registrationFee) > 0) {
      const existing = await tx.paymentType.findFirst({
        where: { unitId: period.unitId, code: 'REG_FEE' },
      });

      if (!existing) {
        await tx.paymentType.create({
          data: {
            unitId: period.unitId,
            code: 'REG_FEE',
            name: 'Biaya Pendaftaran',
            amount: period.registrationFee,
            isActive: true,
            isRecurring: false,
          },
        });
      }
    }

    return registrant;
  });
}

export async function updateRegistrant(id: string, data: UpdateRegistrantInput) {
  // Map Zod input fields to the actual Prisma Registrant model.
  // The schema accepts `fatherName` / `fatherPhone` / `motherName` /
  // `motherPhone` for UX parity with create, but the persisted model uses
  // consolidated `parentName` / `parentPhone` columns. Spreading the raw
  // input would cause Prisma to reject unknown args at runtime.
  const {
    fatherName,
    fatherPhone,
    motherName,
    motherPhone,
    fullName,
    ...rest
  } = data;

  const parentName =
    fatherName !== undefined || motherName !== undefined
      ? fatherName || motherName
      : undefined;
  const parentPhone =
    fatherPhone !== undefined || motherPhone !== undefined
      ? fatherPhone || motherPhone
      : undefined;

  return prisma.registrant.update({
    where: { id },
    data: {
      ...rest,
      ...(fullName !== undefined ? { fullName, name: fullName } : {}),
      ...(parentName !== undefined ? { parentName } : {}),
      ...(parentPhone !== undefined ? { parentPhone } : {}),
    },
  });
}

export async function updateRegistrantScore(id: string, data: UpdateRegistrantScoreInput) {
  // Only advance status to TEST_COMPLETED when:
  //   1. At least one actual score (test/interview/tahfidz) was provided, AND
  //   2. The registrant is still in a pre-test phase.
  // Recording only notes — or recording a score on someone already
  // ACCEPTED / REJECTED / ENROLLED / CANCELLED — must not change their status.
  //
  // The read+write are wrapped in a single interactive transaction so that a
  // concurrent updateRegistrantStatus() (e.g. moving the registrant to
  // ACCEPTED) cannot slip in between the status read and the update below
  // and get clobbered back to TEST_COMPLETED.
  const hasScore =
    data.testScore !== undefined ||
    data.interviewScore !== undefined ||
    data.tahfidzScore !== undefined;

  const preTestStatuses: AdmissionStatus[] = [
    AdmissionStatus.REGISTERED,
    AdmissionStatus.DOCUMENT_CHECK,
    AdmissionStatus.TEST_SCHEDULED,
  ];

  return prisma.$transaction(async (tx) => {
    const current = await tx.registrant.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!current) throw new Error('Registrant not found');

    const shouldAdvanceStatus =
      hasScore && preTestStatuses.includes(current.status);

    return tx.registrant.update({
      where: { id },
      data: {
        testScore:
          data.testScore !== undefined ? new Prisma.Decimal(data.testScore) : undefined,
        interviewScore:
          data.interviewScore !== undefined ? new Prisma.Decimal(data.interviewScore) : undefined,
        tahfidzScore:
          data.tahfidzScore !== undefined ? new Prisma.Decimal(data.tahfidzScore) : undefined,
        notes: data.notes,
        ...(shouldAdvanceStatus ? { status: AdmissionStatus.TEST_COMPLETED } : {}),
      },
    });
  });
}

export async function updateRegistrantStatus(id: string, data: UpdateRegistrantStatusInput) {
  return prisma.$transaction(async (tx) => {
    // Read the previous status BEFORE updating so we can detect actual
    // transitions and avoid double-counting wave acceptance metrics.
    const previous = await tx.registrant.findUnique({
      where: { id },
      select: { status: true, waveId: true },
    });

    if (!previous) {
      throw new Error('Registrant not found');
    }

    const updateData: Prisma.RegistrantUpdateInput = {
      status: data.status,
      notes: data.notes,
    };

    if (data.status === AdmissionStatus.ACCEPTED) {
      updateData.acceptedAt = new Date();
    }

    const registrant = await tx.registrant.update({
      where: { id },
      data: updateData,
    });

    // Best Practice: Trigger automated notification on status change
    // Search for registrant with parent info for notification
    const regWithParent = await tx.registrant.findUnique({
      where: { id },
      include: {
        admissionPeriod: { select: { name: true } }
      }
    });

    if (regWithParent && regWithParent.parentPhone) {
        // Notification could be sent here via WhatsApp/Push
    }

    // Best Practice: Update wave statistics if wave is linked.
    // Only adjust acceptedCount on real transitions into / out of ACCEPTED
    // so the counter stays consistent across re-accepts and reverts.
    if (registrant.waveId) {
      const wasAccepted = previous.status === AdmissionStatus.ACCEPTED;
      const isAccepted = data.status === AdmissionStatus.ACCEPTED;

      if (!wasAccepted && isAccepted) {
        await tx.admissionWave.update({
          where: { id: registrant.waveId },
          data: { acceptedCount: { increment: 1 } },
        });
      } else if (wasAccepted && !isAccepted) {
        await tx.admissionWave.updateMany({
          where: { id: registrant.waveId, acceptedCount: { gt: 0 } },
          data: { acceptedCount: { decrement: 1 } },
        });
      }
    }

    return registrant;
  });
}

export async function enrollRegistrant(
  registrantId: string,
  studentData: {
    nis: string;
    nisn?: string;
    classId?: string;
    roomId?: string;
  }
) {
  const result = await prisma.$transaction(async (tx) => {
    // Read registrant + status check INSIDE the transaction so two concurrent
    // enrollment requests can't both pass the ACCEPTED check and end up
    // creating duplicate User/Student records for the same registrant.
    const registrant = await tx.registrant.findUnique({
      where: { id: registrantId },
      include: { admissionPeriod: { include: { unit: true } } },
    });

    if (!registrant) throw new Error('Registrant not found');
    if (registrant.status !== AdmissionStatus.ACCEPTED) {
      throw new Error('Registrant must be accepted before enrollment');
    }

    const existingUser = registrant.email
      ? await tx.user.findUnique({
          where: { email: registrant.email },
          include: { student: true },
        })
      : null;

    let user;
    let student;

    if (existingUser && existingUser.student) {
      user = existingUser;
      student = await tx.student.update({
        where: { id: existingUser.student.id },
        data: {
          unitId: registrant.admissionPeriod.unitId,
          status: 'active',
          nis: studentData.nis,
          graduateYear: null,
        },
      });

      await tx.classEnrollment.updateMany({
        where: { studentId: student.id, status: 'active' },
        data: { status: 'completed' },
      });
    } else {
      // Generate a cryptographically random password and bcrypt it.
      // The plain value is intentionally discarded so the account can only
      // be activated via the standard password-reset flow. This avoids
      // shipping a known-weak / non-bcrypt placeholder hash to production.
      const randomPassword = randomBytes(24).toString('base64url');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await tx.user.create({
        data: {
          name: registrant.fullName,
          email: registrant.email || `${studentData.nis}@student.cipansor.id`,
          passwordHash,
          role: 'STUDENT',
          unitId: registrant.admissionPeriod.unitId,
          isActive: true,
        },
      });

      student = await tx.student.create({
        data: {
          userId: user.id,
          unitId: registrant.admissionPeriod.unitId,
          nis: studentData.nis,
          nisn: studentData.nisn,
          gender: registrant.gender,
          birthPlace: registrant.birthPlace,
          birthDate: registrant.birthDate,
          address: registrant.address,
          parentName: registrant.parentName,
          parentPhone: registrant.parentPhone,
          parentEmail: registrant.parentEmail,
          status: 'active',
          entryYear: new Date().getFullYear(),
        },
      });
    }

    if (studentData.classId) {
      await tx.classEnrollment.create({
        data: {
          studentId: student.id,
          classId: studentData.classId,
          status: 'active',
        },
      });
    }

    if (studentData.roomId) {
      await tx.roomAssignment.create({
        data: {
          studentId: student.id,
          roomId: studentData.roomId,
          isActive: true,
          assignedAt: new Date(),
        },
      });
    }

    await tx.registrant.update({
      where: { id: registrantId },
      data: {
        status: AdmissionStatus.ENROLLED,
        enrolledAt: new Date(),
        studentId: student.id,
      },
    });

    // The registrant's status transitions from ACCEPTED -> ENROLLED here, but
    // unlike `updateRegistrantStatus` this code path doesn't go through the
    // shared status-transition logic. We must therefore decrement the wave's
    // `acceptedCount` ourselves; otherwise every successful enrollment leaves
    // a stale ACCEPTED count behind, eventually overstating the wave's
    // acceptance rate (see `ppdb-wave.service.ts` `getStats`).
    if (registrant.waveId) {
      await tx.admissionWave.updateMany({
        where: { id: registrant.waveId, acceptedCount: { gt: 0 } },
        data: { acceptedCount: { decrement: 1 } },
      });
    }

    // Auto-generate the registration-fee invoice now that we have a real
    // Student to attach it to. Skipped if no fee is configured or the
    // REG_FEE payment type is missing.
    const period = registrant.admissionPeriod;
    if (period && Number(period.registrationFee) > 0) {
      const paymentType = await tx.paymentType.findFirst({
        where: { unitId: period.unitId, code: 'REG_FEE' },
      });
      if (paymentType) {
        await financeService.createInvoice(
          {
            studentId: student.id,
            paymentTypeId: paymentType.id,
            amount: Number(period.registrationFee),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            notes: `Biaya Pendaftaran ${registrant.fullName}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          tx as Prisma.TransactionClient
        );
      }
    }

    return { user, student };
  });

  return result;
}

export async function deleteRegistrant(id: string) {
  // Wrap the read + decrement + delete in a single transaction so that the
  // wave's `registeredCount` (and `acceptedCount` if the registrant was
  // ACCEPTED) stays in sync with the registrants that actually exist.
  // Without this, deleting a registrant that was assigned to a wave would
  // leave the wave's counters permanently inflated, eventually marking
  // waves as FULL even when slots are free.
  return prisma.$transaction(async (tx) => {
    const registrant = await tx.registrant.findUnique({
      where: { id },
      select: { status: true, waveId: true },
    });

    if (!registrant) {
      throw new Error('Registrant not found');
    }

    if (registrant.status === AdmissionStatus.ENROLLED) {
      throw new Error('Cannot delete enrolled registrant');
    }

    if (registrant.waveId) {
      await tx.admissionWave.updateMany({
        where: { id: registrant.waveId, registeredCount: { gt: 0 } },
        data: { registeredCount: { decrement: 1 } },
      });

      if (registrant.status === AdmissionStatus.ACCEPTED) {
        await tx.admissionWave.updateMany({
          where: { id: registrant.waveId, acceptedCount: { gt: 0 } },
          data: { acceptedCount: { decrement: 1 } },
        });
      }
    }

    return tx.registrant.delete({ where: { id } });
  });
}

// =====================================
// REGISTRANT DOCUMENT SERVICE
// =====================================

export async function getRegistrantDocuments(registrantId: string) {
  return prisma.registrantDocument.findMany({
    where: { registrantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createRegistrantDocument(data: CreateRegistrantDocumentInput) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return prisma.registrantDocument.create({ data: data as any });
}

export async function verifyDocument(id: string, isVerified: boolean, notes?: string) {
  return prisma.registrantDocument.update({
    where: { id },
    data: {
      isVerified,
      verifiedAt: isVerified ? new Date() : null,
      notes,
    },
  });
}

export async function deleteRegistrantDocument(id: string) {
  return prisma.registrantDocument.delete({ where: { id } });
}
