import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type {
  CreateMedicalRecordInput,
  UpdateMedicalRecordInput,
  QueryMedicalRecordInput,
  CreateMedicationInput,
  UpdateMedicationInput,
  QueryMedicationInput,
  CreateMedicationUsageInput,
  QueryMedicationUsageInput,
} from "./schema";

// ==================== MEDICAL RECORD ====================

export async function getMedicalRecords(query: QueryMedicalRecordInput) {
  const { page, limit, studentId, type, startDate, endDate } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.MedicalRecordWhereInput = {
    ...(studentId && { studentId }),
    ...(type && { type }),
    ...(startDate && endDate && {
      visitDate: { gte: startDate, lte: endDate },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.medicalRecord.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: {
          select: {
            id: true,
            nis: true,
            user: { select: { id: true, name: true } },
            unit: { select: { id: true, name: true } },
          },
        },
        recordedBy: { select: { id: true, name: true } },
      },
      orderBy: { visitDate: "desc" },
    }),
    prisma.medicalRecord.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMedicalRecordById(id: string) {
  return prisma.medicalRecord.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          id: true,
          nis: true,
          gender: true,
          birthDate: true,
          user: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
        },
      },
      recordedBy: { select: { id: true, name: true } },
    },
  });
}

export async function createMedicalRecord(data: CreateMedicalRecordInput, recordedById: string) {
  return prisma.medicalRecord.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      ...data,
      recordedById,
    } as any,
    include: {
      student: {
        select: {
          id: true,
          nis: true,
          user: { select: { id: true, name: true } },
        },
      },
      recordedBy: { select: { id: true, name: true } },
    },
  });
}

export async function updateMedicalRecord(id: string, data: UpdateMedicalRecordInput) {
  return prisma.medicalRecord.update({
    where: { id },
    data,
    include: {
      student: {
        select: {
          id: true,
          nis: true,
          user: { select: { id: true, name: true } },
        },
      },
      recordedBy: { select: { id: true, name: true } },
    },
  });
}

export async function deleteMedicalRecord(id: string) {
  return prisma.medicalRecord.delete({ where: { id } });
}

export async function getStudentMedicalHistory(studentId: string) {
  return prisma.medicalRecord.findMany({
    where: { studentId },
    include: {
      recordedBy: { select: { id: true, name: true } },
    },
    orderBy: { visitDate: "desc" },
  });
}

// ==================== MEDICATION ====================

export async function getMedications(query: QueryMedicationInput) {
  const { page, limit, unitId, search, lowStock, expired } = query;
  const skip = (page - 1) * limit;

  // For lowStock, we need to use raw query or filter after fetch
  // Simple approach: use a reasonable threshold or get medications with quantity <= minStock
  const where: Prisma.MedicationWhereInput = {
    ...(unitId && { unitId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { genericName: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(expired && {
      expiryDate: { lt: new Date() },
    }),
  };

  let [data, total] = await Promise.all([
    prisma.medication.findMany({
      where,
      skip,
      take: limit,
      include: {
        unit: { select: { id: true, name: true } },
        _count: { select: { usageLogs: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.medication.count({ where }),
  ]);

  // Filter by lowStock if requested (quantity <= minStock)
  if (lowStock) {
    data = data.filter((m) => m.quantity <= m.minStock);
    total = data.length;
  }

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMedicationById(id: string) {
  return prisma.medication.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      usageLogs: {
        take: 10,
        orderBy: { givenAt: "desc" },
        include: {
          student: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
          givenBy: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function createMedication(data: CreateMedicationInput) {
  return prisma.medication.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data as any,
    include: {
      unit: { select: { id: true, name: true } },
    },
  });
}

export async function updateMedication(id: string, data: UpdateMedicationInput) {
  return prisma.medication.update({
    where: { id },
    data,
    include: {
      unit: { select: { id: true, name: true } },
    },
  });
}

export async function deleteMedication(id: string) {
  return prisma.medication.delete({ where: { id } });
}

export async function addMedicationStock(id: string, quantity: number) {
  return prisma.medication.update({
    where: { id },
    data: { quantity: { increment: quantity } },
  });
}

// ==================== MEDICATION USAGE LOG ====================

export async function getMedicationUsageLogs(query: QueryMedicationUsageInput) {
  const { page, limit, medicationId, studentId, startDate, endDate } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.MedicationUsageLogWhereInput = {
    ...(medicationId && { medicationId }),
    ...(studentId && { studentId }),
    ...(startDate && endDate && {
      givenAt: { gte: startDate, lte: endDate },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.medicationUsageLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        medication: { select: { id: true, name: true, type: true, dosageForm: true } },
        student: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
        givenBy: { select: { id: true, name: true } },
      },
      orderBy: { givenAt: "desc" },
    }),
    prisma.medicationUsageLog.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createMedicationUsage(data: CreateMedicationUsageInput, givenById: string) {
  // Check medication stock
  const medication = await prisma.medication.findUnique({ where: { id: data.medicationId } });
  if (!medication || medication.quantity < data.quantity) {
    throw new Error("Insufficient medication stock");
  }

  // Create usage log and decrement stock
  return prisma.$transaction(async (tx) => {
    const usage = await tx.medicationUsageLog.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        ...data,
        givenById,
      } as any,
      include: {
        medication: { select: { id: true, name: true } },
        student: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
        givenBy: { select: { id: true, name: true } },
      },
    });

    await tx.medication.update({
      where: { id: data.medicationId },
      data: { quantity: { decrement: data.quantity } },
    });

    return usage;
  });
}

// ==================== STATISTICS ====================

export async function getHealthStats(unitId: string) {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    medications,
    expiredMedications,
    thisMonthRecords,
    recordsByType,
  ] = await Promise.all([
    prisma.medication.findMany({ where: { unitId } }),
    prisma.medication.count({
      where: {
        unitId,
        expiryDate: { lt: today },
      },
    }),
    prisma.medicalRecord.count({
      where: {
        student: { unitId },
        visitDate: { gte: startOfMonth },
      },
    }),
    prisma.medicalRecord.groupBy({
      by: ["type"],
      where: {
        student: { unitId },
        visitDate: { gte: startOfMonth },
      },
      _count: true,
    }),
  ]);

  // Calculate low stock medications
  const lowStockMedications = medications.filter((m: { quantity: number; minStock: number }) => m.quantity <= m.minStock).length;

  return {
    medications: {
      total: medications.length,
      lowStock: lowStockMedications,
      expired: expiredMedications,
    },
    thisMonthRecords,
    recordsByType: recordsByType.map((r: { type: string; _count: number }) => ({
      type: r.type,
      count: r._count,
    })),
  };
}
