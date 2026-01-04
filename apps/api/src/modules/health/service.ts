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
  MedicalRecord,
  HealthStats,
} from "@cipansor/shared";

// Helper to unpack vitals from notes
function unpackVitals(record: any): any {
  let vitals = {};
  if (record.notes && record.notes.includes('[VITALS]')) {
    try {
      const parts = record.notes.split('[VITALS]');
      const jsonStr = parts[1].trim();
      vitals = JSON.parse(jsonStr);
      // Clean notes for display if desired, but here we keep original notes string minus the tag for 'notes' field?
      // Or just return the raw string in 'notes' and populated fields in top level.
      // Let's keep 'notes' as the user entered part (before the tag) for better UX.
      record.notes = parts[0].trim();
    } catch (e) {
      // Ignore parse error
    }
  }
  return { ...record, ...vitals };
}

// Helper to pack vitals into notes
function packVitals(notes: string | undefined | null, vitals: Record<string, any>): string {
  const existingNotes = notes ? notes.split('[VITALS]')[0].trim() : "";
  const validVitals = Object.fromEntries(Object.entries(vitals).filter(([_, v]) => v !== undefined && v !== null));

  if (Object.keys(validVitals).length === 0) return existingNotes;

  const vitalsStr = JSON.stringify(validVitals);
  return existingNotes ? `${existingNotes}\n\n[VITALS] ${vitalsStr}` : `[VITALS] ${vitalsStr}`;
}

// ==================== MEDICAL RECORD ====================

export async function getMedicalRecords(query: QueryMedicalRecordInput & { status?: string }) {
  const { page = 1, limit = 20, studentId, type, startDate, endDate, status } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.MedicalRecordWhereInput = {
    ...(studentId && { studentId }),
    ...(type && { type: type as unknown as import("@prisma/client").MedicalRecordType }),
    ...(startDate && endDate && {
      visitDate: { gte: startDate, lte: endDate },
    }),
    // Filtering by status (which is stored in notes) is inefficient but necessary without schema change
    ...(status && {
      notes: { contains: `"status":"${status}"` },
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
    success: true,
    data: data.map((record: any) => {
      const unpacked = unpackVitals(record);
      return {
        ...unpacked,
        student: record.student ? {
          id: record.student.id,
          nis: record.student.nis,
          name: record.student.user.name,
          user: record.student.user,
          unit: record.student.unit,
        } : undefined,
        recordedBy: record.recordedBy,
      };
    }) as MedicalRecord[],
    meta: {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}

export async function getMedicalRecordById(id: string) {
  const record = await prisma.medicalRecord.findUnique({
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

  if (!record) return null;

  const unpacked = unpackVitals(record);

  return {
    ...unpacked,
    student: {
      id: record.student.id,
      nis: record.student.nis,
      name: record.student.user.name,
      user: record.student.user,
      unit: record.student.unit,
    },
    recordedBy: record.recordedBy,
  } as unknown as MedicalRecord;
}

export async function createMedicalRecord(data: CreateMedicalRecordInput, recordedById: string) {
  const { status, temperature, bloodPressure, heartRate, weight, height, ...mainData } = data;

  const notes = packVitals(mainData.notes, { status, temperature, bloodPressure, heartRate, weight, height });

  const record = await prisma.medicalRecord.create({
    data: {
      studentId: mainData.studentId,
      type: mainData.type as unknown as import("@prisma/client").MedicalRecordType,
      visitDate: mainData.visitDate,
      complaint: mainData.complaint,
      diagnosis: mainData.diagnosis,
      treatment: mainData.treatment,
      prescription: mainData.prescription,
      notes: notes,
      referredTo: mainData.referredTo,
      followUpDate: mainData.followUpDate,
      recordedById,
    },
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

  const unpacked = unpackVitals(record);

  return {
    ...unpacked,
    student: {
      id: record.student.id,
      nis: record.student.nis,
      name: record.student.user.name,
      user: record.student.user,
    },
  } as unknown as MedicalRecord;
}

export async function updateMedicalRecord(id: string, data: UpdateMedicalRecordInput) {
  const { status, temperature, bloodPressure, heartRate, weight, height, ...mainData } = data;

  // Retrieve existing record to merge notes
  const existing = await prisma.medicalRecord.findUnique({ where: { id } });
  if (!existing) throw new Error("Record not found");

  // Unpack existing vitals to merge with new ones
  const existingVitals = unpackVitals(existing); // This unpacks into top level, but we want the vitals object

  // Re-construct current vitals object from unpacked (simplification: extract known keys)
  const currentVitals = {
    status: existingVitals.status,
    temperature: existingVitals.temperature,
    bloodPressure: existingVitals.bloodPressure,
    heartRate: existingVitals.heartRate,
    weight: existingVitals.weight,
    height: existingVitals.height,
  };

  const newVitals = { ...currentVitals, status, temperature, bloodPressure, heartRate, weight, height };

  // Use new notes if provided, else keep existing (stripped of tag)
  const baseNotes = mainData.notes !== undefined ? mainData.notes : existingVitals.notes;
  const packedNotes = packVitals(baseNotes, newVitals);

  const record = await prisma.medicalRecord.update({
    where: { id },
    data: {
        ...mainData,
        notes: packedNotes,
        type: mainData.type ? (mainData.type as unknown as import("@prisma/client").MedicalRecordType) : undefined,
    },
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

  const unpacked = unpackVitals(record);

  return {
    ...unpacked,
    student: {
      id: record.student.id,
      nis: record.student.nis,
      name: record.student.user.name,
      user: record.student.user,
    },
  } as unknown as MedicalRecord;
}

export async function deleteMedicalRecord(id: string) {
  return prisma.medicalRecord.delete({ where: { id } });
}

export async function getStudentMedicalHistory(studentId: string) {
  const records = await prisma.medicalRecord.findMany({
    where: { studentId },
    include: {
      recordedBy: { select: { id: true, name: true } },
    },
    orderBy: { visitDate: "desc" },
  });

  return records.map(unpackVitals) as unknown as MedicalRecord[];
}

// ==================== MEDICATION ====================

export async function getMedications(query: QueryMedicationInput) {
  const { page = 1, limit = 20, unitId, search, lowStock, expired } = query;
  const skip = (page - 1) * limit;

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

  if (lowStock) {
    data = data.filter((m) => m.quantity <= m.minStock);
    total = data.length;
  }

  return {
    success: true,
    data: data,
    meta: {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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
    data: {
      unitId: data.unitId,
      name: data.name,
      genericName: data.genericName,
      type: data.type,
      dosageForm: data.dosageForm,
      quantity: data.quantity ?? 0,
      minStock: data.minStock ?? 10,
      expiryDate: data.expiryDate,
      supplier: data.supplier,
      notes: data.notes,
    },
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
  const { page = 1, limit = 20, medicationId, studentId, startDate, endDate } = query;
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
    success: true,
    data: data.map((log: any) => ({
      ...log,
      student: log.student ? { id: log.student.id, user: log.student.user } : null,
    })),
    meta: {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}

export async function createMedicationUsage(data: CreateMedicationUsageInput, givenById: string) {
  const medication = await prisma.medication.findUnique({ where: { id: data.medicationId } });
  if (!medication || medication.quantity < data.quantity) {
    throw new Error("Insufficient medication stock");
  }

  return prisma.$transaction(async (tx) => {
    const usage = await tx.medicationUsageLog.create({
      data: {
        medicationId: data.medicationId,
        studentId: data.studentId,
        quantity: data.quantity,
        reason: data.reason,
        givenById,
      },
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

export async function getHealthStats(unitId: string): Promise<HealthStats> {
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

  const lowStockMedications = medications.filter((m) => m.quantity <= m.minStock).length;

  return {
    medications: {
      total: medications.length,
      lowStock: lowStockMedications,
      expired: expiredMedications,
    },
    thisMonthRecords,
    recordsByType: recordsByType.map((r) => ({
      type: r.type as unknown as import("@cipansor/shared").MedicalRecordType,
      count: r._count,
    })),
  };
}
