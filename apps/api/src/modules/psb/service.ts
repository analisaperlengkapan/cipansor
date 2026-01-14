import { prisma } from "../../lib/prisma";
import { Prisma, AdmissionStatus, Gender } from "@prisma/client";
import {
  CreateAdmissionPeriodInput,
  UpdateAdmissionPeriodInput,
  CreateRegistrantInput,
  UpdateRegistrantInput,
  UpdateRegistrantScoreInput,
  UpdateRegistrantStatusInput,
  CreateRegistrantDocumentInput,
} from "./schema";

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
      orderBy: { startDate: "desc" },
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
    throw new Error("Cannot delete admission period with registrants");
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
    by: ["status"],
    where: { admissionPeriodId: id },
    _count: { status: true },
  });

  const genderCounts = await prisma.registrant.groupBy({
    by: ["gender"],
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

  if (!period) throw new Error("Admission period not found");

  const year = period.academicYear.name.split("/")[0];
  const count = await prisma.registrant.count({
    where: { admissionPeriodId },
  });

  return `REG-${year}-${String(count + 1).padStart(5, "0")}`;
}

export async function getRegistrants(params: {
  page: number;
  limit: number;
  admissionPeriodId?: string;
  status?: AdmissionStatus;
  gender?: "MALE" | "FEMALE";
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
      { name: { contains: search, mode: "insensitive" } },
      { registrationNo: { contains: search, mode: "insensitive" } },
      { parentName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.registrant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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
          unit: { select: { id: true, name: true, type: true } },
          academicYear: { select: { id: true, name: true } },
        },
      },
      documents: { orderBy: { createdAt: "desc" } },
      student: { select: { id: true, nis: true, userId: true } },
    },
  });
}

export async function createRegistrant(data: CreateRegistrantExtendedInput) {
  const registrationNo = await generateRegistrationNo(data.admissionPeriodId);

  return prisma.registrant.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      ...data,
      registrationNo,
      gender: data.gender as Gender,
      birthDate: new Date(data.birthDate),
    } as any,
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
  const updateData: Prisma.RegistrantUpdateInput = {
    status: data.status,
    notes: data.notes,
  };

  if (data.status === AdmissionStatus.ACCEPTED) {
    updateData.acceptedAt = new Date();
  }

  return prisma.registrant.update({
    where: { id },
    data: updateData,
  });
}

export async function enrollRegistrant(registrantId: string, studentData: {
  nis: string;
  nisn?: string;
  classId?: string;
  roomId?: string;
}) {
  const registrant = await prisma.registrant.findUnique({
    where: { id: registrantId },
    include: { admissionPeriod: { include: { unit: true } } },
  });

  if (!registrant) throw new Error("Registrant not found");
  if (registrant.status !== AdmissionStatus.ACCEPTED) {
    throw new Error("Registrant must be accepted before enrollment");
  }

  // Check if user already exists (Internal Track / Alumni)
  const existingUser = registrant.email
    ? await prisma.user.findUnique({
        where: { email: registrant.email },
        include: { student: true }
      })
    : null;

  // Create user and student in a transaction
  const result = await prisma.$transaction(async (tx) => {
    let user;
    let student;

    if (existingUser && existingUser.student) {
      // Internal Track: Update existing student
      user = existingUser;
      student = await tx.student.update({
        where: { id: existingUser.student.id },
        data: {
          unitId: registrant.admissionPeriod.unitId, // Update to new unit
          status: "active",
          nis: studentData.nis, // Update NIS for new level
          graduateYear: null, // Clear graduation status if any
          // Update other fields if necessary
        }
      });

      // Deactivate previous class enrollments if any active
      await tx.classEnrollment.updateMany({
        where: { studentId: student.id, status: "active" },
        data: { status: "completed", endDate: new Date() } // Mark as completed
      });

    } else {
      // External Track: Create new user and student
      user = await tx.user.create({
        data: {
          name: registrant.name,
          email: registrant.email || `${studentData.nis}@student.cipansor.id`,
          passwordHash: "$2a$10$defaultpasswordhash", // Should be changed on first login
          role: "STUDENT",
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
          status: "active",
          entryYear: new Date().getFullYear(),
        },
      });
    }

    // Enroll in class if provided
    if (studentData.classId) {
      // Deactivate any existing enrollments for this class/academic year if needed, but this is new student
      await tx.classEnrollment.create({
        data: {
            studentId: student.id,
            classId: studentData.classId,
            status: "active",
        }
      });
    }

    // Assign to room if provided
    if (studentData.roomId) {
        await tx.roomAssignment.create({
            data: {
                studentId: student.id,
                roomId: studentData.roomId,
                isActive: true,
                assignedAt: new Date(),
            }
        });
    }

    // Update registrant status
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
    throw new Error("Cannot delete enrolled registrant");
  }

  return prisma.registrant.delete({ where: { id } });
}

// =====================================
// REGISTRANT DOCUMENT SERVICE
// =====================================

export async function getRegistrantDocuments(registrantId: string) {
  return prisma.registrantDocument.findMany({
    where: { registrantId },
    orderBy: { createdAt: "desc" },
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
