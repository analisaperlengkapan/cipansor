import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { attendanceService } from '../attendance/attendance.service';
import { eventBus } from '../../lib/event-bus';
import { logger } from '../../lib/logger';
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
} from '@cipansor/shared';
import { CreateGrowthRecordInput, QueryGrowthRecordInput } from './schema';

// ==================== MEDICAL RECORD ====================

export async function getMedicalRecords(query: QueryMedicalRecordInput & { status?: string }) {
  const { page = 1, limit = 20, studentId, type, startDate, endDate, status } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.MedicalRecordWhereInput = {
    ...(studentId && { studentId }),
    ...(type && { type: type as unknown as import('@prisma/client').MedicalRecordType }),
    ...(startDate &&
      endDate && {
        visitDate: { gte: startDate, lte: endDate },
      }),
    ...(status && { status: status as unknown as import('@prisma/client').HealthStatus }),
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
            unitId: true,
          },
        },
        recordedBy: { select: { id: true, name: true } },
      },
      orderBy: { visitDate: 'desc' },
    }),
    prisma.medicalRecord.count({ where }),
  ]);

  return {
    success: true,
    data: data.map((record: any) => ({
      ...record,
      student: record.student
        ? {
            id: record.student.id,
            nis: record.student.nis,
            name: record.student.user.name,
            user: record.student.user,
            unit: record.student.unit,
          }
        : undefined,
      recordedBy: record.recordedBy,
    })) as MedicalRecord[],
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

  return {
    ...record,
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
  const {
    status,
    temperature,
    bloodPressure,
    heartRate,
    weight,
    height,
    createAttendance,
    notifyParent,
    ...mainData
  } = data;

  const record = await prisma.medicalRecord.create({
    data: {
      studentId: mainData.studentId,
      type: mainData.type as unknown as import('@prisma/client').MedicalRecordType,
      visitDate: mainData.visitDate,
      complaint: mainData.complaint,
      diagnosis: mainData.diagnosis,
      treatment: mainData.treatment,
      prescription: mainData.prescription,
      notes: mainData.notes,
      referredTo: mainData.referredTo,
      followUpDate: mainData.followUpDate,
      status: status as unknown as import('@prisma/client').HealthStatus,
      temperature,
      bloodPressure,
      heartRate,
      weight,
      height,
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

  // Integration: Attendance
  if (createAttendance) {
    try {
      const enrollment = await prisma.classEnrollment.findFirst({
        where: { studentId: mainData.studentId, status: 'active' },
        select: { classId: true },
      });

      if (enrollment) {
        await attendanceService.create(
          {
            studentId: mainData.studentId,
            classId: enrollment.classId,
            date:
              mainData.visitDate instanceof Date
                ? mainData.visitDate.toISOString()
                : mainData.visitDate,
            status: 'SICK' as any,
            notes: `Sakit: ${mainData.complaint} (via UKS)`,
          },
          recordedById
        );
      }
    } catch (error) {
      logger.warn('Failed to create attendance from health record:', { error });
    }
  }

  // Integration: Notification
  if (notifyParent) {
    try {
      const parents = await prisma.studentParent.findMany({
        where: { studentId: mainData.studentId },
        include: { parent: true },
      });

      const studentName = record.student?.user?.name || 'Santri';

      parents.forEach((p) =>
        eventBus.emit('notification:send', {
          userId: p.parentId,
          type: 'HEALTH',
          title: 'Laporan Kesehatan Santri',
          message: `Ananda ${studentName} tercatat sakit dengan keluhan: ${mainData.complaint}. Kami telah memberikan penanganan awal.`,
          data: {
            studentId: mainData.studentId,
            healthRecordId: record.id,
          },
        })
      );
    } catch (error) {
      logger.warn('Failed to trigger parent notifications:', { error });
    }
  }

  // Emit Event for other listeners (e.g., Dashboard)
  eventBus.emit('health:medical-record-created', {
    id: record.id,
    studentId: record.studentId,
    studentName: record.student?.user?.name || 'Unknown',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    unitId: (record.student as any)?.unitId || (record.student as any)?.unit?.id || 'unknown',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    unitName: (record.student as any)?.unit?.name || 'Unknown',
    type: record.type,
    complaint: record.complaint,
    status: record.status || 'UNKNOWN',
    recordedAt: record.visitDate instanceof Date ? record.visitDate : new Date(record.visitDate),
  });

  return {
    ...record,
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

  const record = await prisma.medicalRecord.update({
    where: { id },
    data: {
      ...mainData,
      type: mainData.type
        ? (mainData.type as unknown as import('@prisma/client').MedicalRecordType)
        : undefined,
      status: status ? (status as unknown as import('@prisma/client').HealthStatus) : undefined,
      temperature,
      bloodPressure,
      heartRate,
      weight,
      height,
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

  return {
    ...record,
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
    orderBy: { visitDate: 'desc' },
  });

  return records as unknown as MedicalRecord[];
}

// ==================== MEDICATION ====================

export async function getMedications(query: QueryMedicationInput) {
  const { page = 1, limit = 20, unitId, search, lowStock, expired } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.MedicationWhereInput = {
    ...(unitId && { unitId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
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
      orderBy: { name: 'asc' },
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
        orderBy: { givenAt: 'desc' },
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
    ...(startDate &&
      endDate && {
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
      orderBy: { givenAt: 'desc' },
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
    throw new Error('Insufficient medication stock');
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

  const [medications, expiredMedications, thisMonthRecords, recordsByType] = await Promise.all([
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
      by: ['type'],
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
      type: r.type as unknown as import('@cipansor/shared').MedicalRecordType,
      count: r._count,
    })),
  };
}

// ==================== GROWTH RECORD ====================

export async function createGrowthRecord(data: CreateGrowthRecordInput, recordedById: string) {
  return prisma.growthRecord.create({
    data: {
      studentId: data.studentId,
      unitId: data.unitId,
      recordDate: data.recordDate,
      weight: data.weight,
      height: data.height,
      headCircumference: data.headCircumference,
      notes: data.notes,
      ageMonths: 0, // Placeholder, logic to calculate age needed
      recordedById,
    },
    include: {
      student: { select: { id: true, user: { select: { name: true } } } },
      recordedBy: { select: { id: true, name: true } },
    },
  });
}

export async function getGrowthRecords(query: QueryGrowthRecordInput) {
  const { page = 1, limit = 20, studentId, unitId, startDate, endDate } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.GrowthRecordWhereInput = {
    ...(studentId && { studentId }),
    ...(unitId && { unitId }),
    ...(startDate &&
      endDate && {
        recordDate: { gte: startDate, lte: endDate },
      }),
  };

  const [data, total] = await Promise.all([
    prisma.growthRecord.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { select: { id: true, user: { select: { name: true } } } },
        recordedBy: { select: { id: true, name: true } },
      },
      orderBy: { recordDate: 'desc' },
    }),
    prisma.growthRecord.count({ where }),
  ]);

  return {
    success: true,
    data,
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
