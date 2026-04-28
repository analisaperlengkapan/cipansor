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
      registrationFee: data.registrationFee ? new Prisma.Decimal(data.registrationFee) : undefined,
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

async function generateRegistrationNo(admissionPeriodId: string): Promise<string> {
  const period = await prisma.admissionPeriod.findUnique({
    where: { id: admissionPeriodId },
    include: { unit: true, academicYear: true },
  });

  if (!period) throw new Error('Admission period not found');

  const year = period.academicYear.name.split('/')[0];
  const count = await prisma.registrant.count({
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
  return prisma.$transaction(async (tx) => {
    const registrationNo = await generateRegistrationNo(data.admissionPeriodId);

    const registrant = await tx.registrant.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        ...data,
        registrationNo,
        gender: data.gender as Gender,
        birthDate: new Date(data.birthDate),
      } as any,
    });

    // Best Practice: Auto-generate invoice for registration fee
    const period = await tx.admissionPeriod.findUnique({
      where: { id: data.admissionPeriodId },
    });

    if (period && Number(period.registrationFee) > 0) {
      let paymentType = await tx.paymentType.findFirst({
        where: { unitId: period.unitId, code: 'REG_FEE' }
      });

      if (!paymentType) {
        paymentType = await tx.paymentType.create({
          data: {
            unitId: period.unitId,
            code: 'REG_FEE',
            name: 'Biaya Pendaftaran',
            amount: period.registrationFee,
            isActive: true,
            isRecurring: false
          }
        });
      }

      await financeService.createInvoice({
        studentId: '', // Placeholder
        registrantId: registrant.id,
        paymentTypeId: paymentType.id,
        amount: Number(period.registrationFee),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: `Biaya Pendaftaran ${registrant.fullName}`
      }, tx as any);
    }

    return registrant;
  });
}

export async function updateRegistrant(id: string, data: UpdateRegistrantInput) {
  return prisma.registrant.update({
    where: { id },
    data,
  });
}

export async function updateRegistrantScore(id: string, data: UpdateRegistrantScoreInput) {
  return prisma.registrant.update({
    where: { id },
    data: {
      testScore: data.testScore ? new Prisma.Decimal(data.testScore) : undefined,
      interviewScore: data.interviewScore ? new Prisma.Decimal(data.interviewScore) : undefined,
      tahfidzScore: data.tahfidzScore ? new Prisma.Decimal(data.tahfidzScore) : undefined,
      notes: data.notes,
      status: AdmissionStatus.TEST_COMPLETED,
    },
  });
}

export async function updateRegistrantStatus(id: string, data: UpdateRegistrantStatusInput) {
  return prisma.$transaction(async (tx) => {
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

    // Best Practice: Update wave statistics if wave is linked
    if (registrant.waveId && data.status === AdmissionStatus.ACCEPTED) {
       await tx.admissionWave.update({
         where: { id: registrant.waveId },
         data: { acceptedCount: { increment: 1 } }
       });
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
  const registrant = await prisma.registrant.findUnique({
    where: { id: registrantId },
    include: { admissionPeriod: { include: { unit: true } } },
  });

  if (!registrant) throw new Error('Registrant not found');
  if (registrant.status !== AdmissionStatus.ACCEPTED) {
    throw new Error('Registrant must be accepted before enrollment');
  }

  const existingUser = registrant.email
    ? await prisma.user.findUnique({
        where: { email: registrant.email },
        include: { student: true },
      })
    : null;

  const result = await prisma.$transaction(async (tx) => {
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
      user = await tx.user.create({
        data: {
          name: registrant.fullName,
          email: registrant.email || `${studentData.nis}@student.cipansor.id`,
          passwordHash: '$2a$10$defaultpasswordhash',
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

    return { user, student };
  });

  return result;
}

export async function deleteRegistrant(id: string) {
  const registrant = await prisma.registrant.findUnique({ where: { id } });

  if (registrant?.status === AdmissionStatus.ENROLLED) {
    throw new Error('Cannot delete enrolled registrant');
  }

  return prisma.registrant.delete({ where: { id } });
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
