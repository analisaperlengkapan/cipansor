import { prisma } from '@/lib/prisma';
import type {
  ListTargetsQuery,
  CreateTargetInput,
  UpdateTargetInput,
  ListRecordsQuery,
  CreateRecordInput,
  UpdateRecordInput,
  BulkCreateRecordsInput,
  VerifyRecordInput,
  DailyCheckInInput,
  LeaderboardQuery,
  StudentIbadahStatsQuery,
  UnitIbadahStatsQuery,
  ClassIbadahStatsQuery,
  ListIslamicEventsQuery,
  CreateIslamicEventInput,
  UpdateIslamicEventInput,
} from './ibadah.schema';

// ======================
// TARGET SERVICES
// ======================

export async function listTargets(query: ListTargetsQuery) {
  const { unitId, category, targetType, isActive, isOptional, search, page, limit } = query;

  const where: any = {};
  if (unitId) where.unitId = unitId;
  if (category) where.category = category;
  if (targetType) where.targetType = targetType;
  if (isActive !== undefined) where.isActive = isActive;
  if (isOptional !== undefined) where.isOptional = isOptional;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [targets, total] = await Promise.all([
    prisma.dailyIbadahTarget.findMany({
      where,
      include: {
        unit: { select: { id: true, name: true, type: true } },
        _count: { select: { records: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.dailyIbadahTarget.count({ where }),
  ]);

  return {
    data: targets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTargetById(id: string) {
  return prisma.dailyIbadahTarget.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true, type: true } },
      _count: { select: { records: true } },
    },
  });
}

export async function createTarget(data: CreateTargetInput) {
  return prisma.dailyIbadahTarget.create({
    data: {
      ...data,
      targetUnit: data.targetUnit ?? null,
    },
    include: {
      unit: { select: { id: true, name: true, type: true } },
    },
  });
}

export async function updateTarget(id: string, data: UpdateTargetInput) {
  return prisma.dailyIbadahTarget.update({
    where: { id },
    data,
    include: {
      unit: { select: { id: true, name: true, type: true } },
    },
  });
}

export async function deleteTarget(id: string) {
  return prisma.dailyIbadahTarget.delete({ where: { id } });
}

// ======================
// RECORD SERVICES
// ======================

export async function listRecords(query: ListRecordsQuery) {
  const { unitId, studentId, targetId, category, date, startDate, endDate, isCompleted, isVerified, page, limit } = query;

  const where: any = {};
  if (studentId) where.studentId = studentId;
  if (targetId) where.targetId = targetId;
  if (isCompleted !== undefined) where.isCompleted = isCompleted;
  if (isVerified !== undefined) {
    where.verifiedAt = isVerified ? { not: null } : null;
  }

  // Date filtering
  if (date) {
    const targetDate = new Date(date);
    where.date = targetDate;
  } else if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  // Filter by unit through target
  if (unitId) {
    where.target = { unitId };
  }

  // Filter by category through target
  if (category) {
    where.target = { ...where.target, category };
  }

  const [records, total] = await Promise.all([
    prisma.dailyIbadahRecord.findMany({
      where,
      include: {
        target: { select: { id: true, name: true, category: true, points: true, bonusPoints: true, targetUnit: true } },
        student: { select: { id: true, nis: true, user: { select: { name: true } } } },
        verifier: { select: { id: true, name: true } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.dailyIbadahRecord.count({ where }),
  ]);

  return {
    data: records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getRecordById(id: string) {
  return prisma.dailyIbadahRecord.findUnique({
    where: { id },
    include: {
      target: true,
      student: { select: { id: true, nis: true, user: { select: { name: true } } } },
      verifier: { select: { id: true, name: true } },
    },
  });
}

export async function createRecord(data: CreateRecordInput) {
  const target = await prisma.dailyIbadahTarget.findUnique({
    where: { id: data.targetId },
  });

  if (!target) {
    throw new Error('Target not found');
  }

  // Calculate points
  const pointsEarned = data.isCompleted ? target.points : 0;

  return prisma.dailyIbadahRecord.create({
    data: {
      ...data,
      pointsEarned,
    },
    include: {
      target: { select: { id: true, name: true, category: true, points: true } },
      student: { select: { id: true, nis: true, user: { select: { name: true } } } },
    },
  });
}

export async function updateRecord(id: string, data: UpdateRecordInput) {
  const existingRecord = await prisma.dailyIbadahRecord.findUnique({
    where: { id },
    include: { target: true },
  });

  if (!existingRecord) {
    throw new Error('Record not found');
  }

  // Recalculate points if completion status changed
  let pointsEarned = existingRecord.pointsEarned;
  if (data.isCompleted !== undefined && data.isCompleted !== existingRecord.isCompleted) {
    pointsEarned = data.isCompleted ? existingRecord.target.points : 0;
  }

  return prisma.dailyIbadahRecord.update({
    where: { id },
    data: {
      ...data,
      pointsEarned,
    },
    include: {
      target: { select: { id: true, name: true, category: true, points: true } },
      student: { select: { id: true, nis: true, user: { select: { name: true } } } },
    },
  });
}

export async function deleteRecord(id: string) {
  return prisma.dailyIbadahRecord.delete({ where: { id } });
}

export async function bulkCreateRecords(data: BulkCreateRecordsInput) {
  const { studentId, date, records } = data;

  // Get all target points
  const targetIds = records.map(r => r.targetId);
  const targets = await prisma.dailyIbadahTarget.findMany({
    where: { id: { in: targetIds } },
  });
  const targetMap = new Map(targets.map(t => [t.id, t]));

  // Create records with points calculation
  const recordsToCreate = records.map(record => {
    const target = targetMap.get(record.targetId);
    const pointsEarned = record.isCompleted && target ? target.points : 0;

    return prisma.dailyIbadahRecord.upsert({
      where: {
        targetId_studentId_date: {
          targetId: record.targetId,
          studentId,
          date,
        },
      },
      create: {
        targetId: record.targetId,
        studentId,
        date,
        isCompleted: record.isCompleted,
        actualCount: record.actualCount,
        actualMinutes: record.actualMinutes,
        notes: record.notes,
        pointsEarned,
      },
      update: {
        isCompleted: record.isCompleted,
        actualCount: record.actualCount,
        actualMinutes: record.actualMinutes,
        notes: record.notes,
        pointsEarned,
      },
    });
  });

  return Promise.all(recordsToCreate);
}

export async function verifyRecords(verifierId: string, data: VerifyRecordInput) {
  const { recordIds } = data;

  return prisma.dailyIbadahRecord.updateMany({
    where: { id: { in: recordIds } },
    data: {
      verifiedBy: verifierId,
      verifiedAt: new Date(),
    },
  });
}

// ======================
// DAILY CHECK-IN
// ======================

// Predefined target names for quick check-in
const SHOLAT_WAJIB_TARGETS = ['Sholat Subuh', 'Sholat Dzuhur', 'Sholat Ashar', 'Sholat Maghrib', 'Sholat Isya'];
const SHOLAT_SUNNAH_TARGETS = ['Sholat Tahajud', 'Sholat Dhuha', 'Sholat Rawatib'];
const OTHER_TARGETS = ['Tilawah Harian', 'Dzikir Pagi', 'Dzikir Petang', 'Puasa Sunnah', 'Sedekah'];

export async function dailyCheckIn(data: DailyCheckInInput) {
  const { studentId, date, ...checkInData } = data;

  // Get student's unit
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { unitId: true },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // Get all active targets for the unit
  const targets = await prisma.dailyIbadahTarget.findMany({
    where: {
      unitId: student.unitId,
      isActive: true,
    },
  });

  const recordsToCreate: any[] = [];

  // Process each target based on check-in data
  for (const target of targets) {
    let isCompleted = false;
    let actualCount: number | undefined;
    let actualMinutes: number | undefined;

    // Match target with check-in data
    if (target.name === 'Sholat Subuh' && checkInData.sholatSubuh) {
      isCompleted = checkInData.sholatSubuh !== 'MISSED';
      actualCount = checkInData.sholatSubuh === 'JAMAAH' ? 2 : 1; // Extra point for jamaah
    } else if (target.name === 'Sholat Dzuhur' && checkInData.sholatDzuhur) {
      isCompleted = checkInData.sholatDzuhur !== 'MISSED';
      actualCount = checkInData.sholatDzuhur === 'JAMAAH' ? 2 : 1;
    } else if (target.name === 'Sholat Ashar' && checkInData.sholatAshar) {
      isCompleted = checkInData.sholatAshar !== 'MISSED';
      actualCount = checkInData.sholatAshar === 'JAMAAH' ? 2 : 1;
    } else if (target.name === 'Sholat Maghrib' && checkInData.sholatMaghrib) {
      isCompleted = checkInData.sholatMaghrib !== 'MISSED';
      actualCount = checkInData.sholatMaghrib === 'JAMAAH' ? 2 : 1;
    } else if (target.name === 'Sholat Isya' && checkInData.sholatIsya) {
      isCompleted = checkInData.sholatIsya !== 'MISSED';
      actualCount = checkInData.sholatIsya === 'JAMAAH' ? 2 : 1;
    } else if (target.name === 'Sholat Tahajud') {
      isCompleted = checkInData.sholatTahajud;
    } else if (target.name === 'Sholat Dhuha') {
      isCompleted = checkInData.sholatDhuha;
    } else if (target.name === 'Sholat Rawatib') {
      isCompleted = checkInData.sholatRawatib > 0;
      actualCount = checkInData.sholatRawatib;
    } else if (target.name.includes('Tilawah') && target.category === 'TILAWAH') {
      isCompleted = checkInData.tilawahPages > 0 || checkInData.tilawahMinutes > 0;
      actualCount = checkInData.tilawahPages;
      actualMinutes = checkInData.tilawahMinutes;
    } else if (target.name === 'Dzikir Pagi') {
      isCompleted = checkInData.dzikirPagi;
    } else if (target.name === 'Dzikir Petang') {
      isCompleted = checkInData.dzikirPetang;
    } else if (target.category === 'PUASA') {
      isCompleted = checkInData.puasaSunnah;
    } else if (target.category === 'SEDEKAH') {
      isCompleted = checkInData.sedekahAmount > 0;
      actualCount = checkInData.sedekahAmount;
    }

    const pointsEarned = isCompleted ? target.points : 0;

    recordsToCreate.push({
      targetId: target.id,
      studentId,
      date,
      isCompleted,
      actualCount,
      actualMinutes,
      notes: checkInData.notes,
      pointsEarned,
    });
  }

  // Upsert all records
  const results = await Promise.all(
    recordsToCreate.map(record =>
      prisma.dailyIbadahRecord.upsert({
        where: {
          targetId_studentId_date: {
            targetId: record.targetId,
            studentId: record.studentId,
            date: record.date,
          },
        },
        create: record,
        update: {
          isCompleted: record.isCompleted,
          actualCount: record.actualCount,
          actualMinutes: record.actualMinutes,
          notes: record.notes,
          pointsEarned: record.pointsEarned,
        },
        include: {
          target: { select: { name: true, category: true } },
        },
      })
    )
  );

  // Calculate total points
  const totalPoints = results.reduce((sum, r) => sum + r.pointsEarned, 0);
  const completedCount = results.filter(r => r.isCompleted).length;

  return {
    records: results,
    summary: {
      totalRecords: results.length,
      completedCount,
      totalPoints,
    },
  };
}

// ======================
// LEADERBOARD
// ======================

export async function getLeaderboard(query: LeaderboardQuery) {
  const { unitId, periodType, startDate, endDate, classId, limit } = query;

  // Calculate date range based on period type
  let dateStart: Date;
  let dateEnd: Date;
  const now = new Date();

  if (startDate && endDate) {
    dateStart = startDate;
    dateEnd = endDate;
  } else {
    dateEnd = now;
    switch (periodType) {
      case 'DAILY':
        dateStart = new Date(now);
        dateStart.setHours(0, 0, 0, 0);
        break;
      case 'WEEKLY':
        dateStart = new Date(now);
        dateStart.setDate(dateStart.getDate() - 7);
        break;
      case 'MONTHLY':
        dateStart = new Date(now);
        dateStart.setMonth(dateStart.getMonth() - 1);
        break;
      case 'SEMESTER':
        dateStart = new Date(now);
        dateStart.setMonth(dateStart.getMonth() - 6);
        break;
      case 'YEARLY':
        dateStart = new Date(now);
        dateStart.setFullYear(dateStart.getFullYear() - 1);
        break;
      default:
        dateStart = new Date(now);
        dateStart.setMonth(dateStart.getMonth() - 1);
    }
  }

  // Build student filter
  const studentWhere: any = { unitId };
  if (classId) {
    studentWhere.enrollments = {
      some: {
        classId,
        status: 'ACTIVE',
      },
    };
  }

  // Aggregate points per student
  const leaderboard = await prisma.dailyIbadahRecord.groupBy({
    by: ['studentId'],
    where: {
      date: {
        gte: dateStart,
        lte: dateEnd,
      },
      target: { unitId },
      student: studentWhere,
    },
    _sum: {
      pointsEarned: true,
      bonusEarned: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        pointsEarned: 'desc',
      },
    },
    take: limit,
  });

  // Get student details
  const studentIds = leaderboard.map(l => l.studentId);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: {
      user: { select: { name: true } },
      enrollments: {
        where: { status: 'ACTIVE' },
        include: { class: { select: { name: true } } },
        take: 1,
      },
    },
  });
  const studentMap = new Map(students.map(s => [s.id, s]));

  // Count completed targets per student for this period
  const targetCounts = await prisma.dailyIbadahTarget.count({
    where: { unitId, isActive: true },
  });

  const recordCounts = await prisma.dailyIbadahRecord.groupBy({
    by: ['studentId'],
    where: {
      date: { gte: dateStart, lte: dateEnd },
      target: { unitId },
      isCompleted: true,
    },
    _count: { id: true },
  });
  const recordCountMap = new Map(recordCounts.map(r => [r.studentId, r._count.id]));

  // Calculate days in period
  const daysInPeriod = Math.ceil((dateEnd.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const maxPossibleRecords = targetCounts * daysInPeriod;

  // Format results
  const results = leaderboard.map((entry, index) => {
    const student = studentMap.get(entry.studentId);
    const completedRecords = recordCountMap.get(entry.studentId) || 0;
    const completionRate = maxPossibleRecords > 0 ? (completedRecords / maxPossibleRecords) * 100 : 0;

    return {
      rank: index + 1,
      studentId: entry.studentId,
      studentName: student?.user.name || 'Unknown',
      nis: student?.nis || '',
      className: student?.enrollments[0]?.class.name || '',
      totalPoints: (entry._sum.pointsEarned || 0) + (entry._sum.bonusEarned || 0),
      bonusPoints: entry._sum.bonusEarned || 0,
      recordCount: entry._count.id,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  });

  return {
    periodType,
    startDate: dateStart,
    endDate: dateEnd,
    data: results,
  };
}

// ======================
// STATISTICS
// ======================

export async function getStudentIbadahStats(query: StudentIbadahStatsQuery) {
  const { studentId, startDate, endDate } = query;

  // Get all records for the student in period
  const records = await prisma.dailyIbadahRecord.findMany({
    where: {
      studentId,
      date: { gte: startDate, lte: endDate },
    },
    include: {
      target: true,
    },
  });

  // Group by category
  const byCategory: Record<string, { completed: number; total: number; points: number }> = {};
  for (const record of records) {
    const cat = record.target.category;
    if (!byCategory[cat]) {
      byCategory[cat] = { completed: 0, total: 0, points: 0 };
    }
    byCategory[cat].total++;
    if (record.isCompleted) {
      byCategory[cat].completed++;
      byCategory[cat].points += record.pointsEarned;
    }
  }

  // Calculate streaks
  const completedDates = [...new Set(
    records
      .filter(r => r.isCompleted)
      .map(r => r.date.toISOString().split('T')[0])
  )].sort();

  let currentStreak = 0;
  let maxStreak = 0;
  let lastDate: string | null = null;

  for (const dateStr of completedDates) {
    if (!lastDate) {
      currentStreak = 1;
    } else {
      const diff = (new Date(dateStr).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    lastDate = dateStr;
  }

  // Summary
  const totalRecords = records.length;
  const completedRecords = records.filter(r => r.isCompleted).length;
  const totalPoints = records.reduce((sum, r) => sum + r.pointsEarned, 0);
  const completionRate = totalRecords > 0 ? (completedRecords / totalRecords) * 100 : 0;

  return {
    summary: {
      totalRecords,
      completedRecords,
      totalPoints,
      completionRate: Math.round(completionRate * 100) / 100,
      currentStreak,
      maxStreak,
    },
    byCategory: Object.entries(byCategory).map(([category, stats]) => ({
      category,
      ...stats,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 10000) / 100 : 0,
    })),
    startDate,
    endDate,
  };
}

export async function getUnitIbadahStats(query: UnitIbadahStatsQuery) {
  const { unitId, startDate, endDate, groupBy } = query;

  // Get all records for the unit
  const records = await prisma.dailyIbadahRecord.findMany({
    where: {
      target: { unitId },
      date: { gte: startDate, lte: endDate },
    },
    include: {
      target: { select: { category: true } },
    },
  });

  // Group records by date/week/month
  const groupedData: Record<string, { completed: number; total: number; points: number }> = {};

  for (const record of records) {
    let key: string;
    const date = record.date;

    switch (groupBy) {
      case 'WEEK':
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'MONTH':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // DAY
        key = date.toISOString().split('T')[0];
    }

    if (!groupedData[key]) {
      groupedData[key] = { completed: 0, total: 0, points: 0 };
    }
    groupedData[key].total++;
    if (record.isCompleted) {
      groupedData[key].completed++;
      groupedData[key].points += record.pointsEarned;
    }
  }

  // By category summary
  const byCategory: Record<string, { completed: number; total: number }> = {};
  for (const record of records) {
    const cat = record.target.category;
    if (!byCategory[cat]) {
      byCategory[cat] = { completed: 0, total: 0 };
    }
    byCategory[cat].total++;
    if (record.isCompleted) {
      byCategory[cat].completed++;
    }
  }

  // Get student count
  const studentCount = await prisma.student.count({
    where: { unitId, status: 'ACTIVE' },
  });

  const totalRecords = records.length;
  const completedRecords = records.filter(r => r.isCompleted).length;

  return {
    unitId,
    startDate,
    endDate,
    summary: {
      studentCount,
      totalRecords,
      completedRecords,
      totalPoints: records.reduce((sum, r) => sum + r.pointsEarned, 0),
      completionRate: totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 10000) / 100 : 0,
    },
    byCategory: Object.entries(byCategory).map(([category, stats]) => ({
      category,
      ...stats,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 10000) / 100 : 0,
    })),
    timeline: Object.entries(groupedData)
      .map(([date, stats]) => ({
        date,
        ...stats,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export async function getClassIbadahStats(query: ClassIbadahStatsQuery) {
  const { classId, startDate, endDate } = query;

  // Get students in class
  const enrollments = await prisma.classEnrollment.findMany({
    where: { classId, status: 'ACTIVE' },
    select: { studentId: true },
  });
  const studentIds = enrollments.map(e => e.studentId);

  if (studentIds.length === 0) {
    return {
      classId,
      startDate,
      endDate,
      studentCount: 0,
      summary: {
        totalRecords: 0,
        completedRecords: 0,
        totalPoints: 0,
        completionRate: 0,
      },
      studentStats: [],
    };
  }

  // Get records for all students
  const records = await prisma.dailyIbadahRecord.findMany({
    where: {
      studentId: { in: studentIds },
      date: { gte: startDate, lte: endDate },
    },
    include: {
      student: { include: { user: { select: { name: true } } } },
    },
  });

  // Group by student
  const byStudent: Record<string, { name: string; completed: number; total: number; points: number }> = {};
  for (const record of records) {
    const sid = record.studentId;
    if (!byStudent[sid]) {
      byStudent[sid] = {
        name: record.student.user.name,
        completed: 0,
        total: 0,
        points: 0,
      };
    }
    byStudent[sid].total++;
    if (record.isCompleted) {
      byStudent[sid].completed++;
      byStudent[sid].points += record.pointsEarned;
    }
  }

  const totalRecords = records.length;
  const completedRecords = records.filter(r => r.isCompleted).length;

  return {
    classId,
    startDate,
    endDate,
    studentCount: studentIds.length,
    summary: {
      totalRecords,
      completedRecords,
      totalPoints: records.reduce((sum, r) => sum + r.pointsEarned, 0),
      completionRate: totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 10000) / 100 : 0,
    },
    studentStats: Object.entries(byStudent)
      .map(([studentId, stats]) => ({
        studentId,
        ...stats,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.points - a.points),
  };
}

// ======================
// ISLAMIC EVENTS
// ======================

export async function listIslamicEvents(query: ListIslamicEventsQuery) {
  const { unitId, type, hijriMonth, gregorianYear, isHoliday, page, limit } = query;

  const where: any = {};
  if (unitId !== undefined) where.unitId = unitId;
  if (type) where.type = type;
  if (hijriMonth) where.hijriMonth = hijriMonth;
  if (gregorianYear) where.gregorianYear = gregorianYear;
  if (isHoliday !== undefined) where.isHoliday = isHoliday;

  const [events, total] = await Promise.all([
    prisma.islamicEvent.findMany({
      where,
      include: {
        unit: { select: { id: true, name: true } },
      },
      orderBy: [{ hijriMonth: 'asc' }, { hijriDay: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.islamicEvent.count({ where }),
  ]);

  return {
    data: events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getIslamicEventById(id: string) {
  return prisma.islamicEvent.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
    },
  });
}

export async function createIslamicEvent(data: CreateIslamicEventInput) {
  return prisma.islamicEvent.create({
    data: {
      ...data,
      scheduleAdjustment: data.scheduleAdjustment ?? undefined,
    },
    include: {
      unit: { select: { id: true, name: true } },
    },
  });
}

export async function updateIslamicEvent(id: string, data: UpdateIslamicEventInput) {
  return prisma.islamicEvent.update({
    where: { id },
    data: {
      ...data,
      scheduleAdjustment: data.scheduleAdjustment ?? undefined,
    },
    include: {
      unit: { select: { id: true, name: true } },
    },
  });
}

export async function deleteIslamicEvent(id: string) {
  return prisma.islamicEvent.delete({ where: { id } });
}

// ======================
// SEED DEFAULT TARGETS
// ======================

export async function seedDefaultTargets(unitId: string) {
  const defaultTargets = [
    // Sholat Wajib
    { name: 'Sholat Subuh', category: 'SHOLAT_JAMAAH', points: 25, targetType: 'DAILY', targetCount: 1, targetUnit: 'TIMES', sortOrder: 1 },
    { name: 'Sholat Dzuhur', category: 'SHOLAT_JAMAAH', points: 25, targetType: 'DAILY', targetCount: 1, targetUnit: 'TIMES', sortOrder: 2 },
    { name: 'Sholat Ashar', category: 'SHOLAT_JAMAAH', points: 25, targetType: 'DAILY', targetCount: 1, targetUnit: 'TIMES', sortOrder: 3 },
    { name: 'Sholat Maghrib', category: 'SHOLAT_JAMAAH', points: 25, targetType: 'DAILY', targetCount: 1, targetUnit: 'TIMES', sortOrder: 4 },
    { name: 'Sholat Isya', category: 'SHOLAT_JAMAAH', points: 25, targetType: 'DAILY', targetCount: 1, targetUnit: 'TIMES', sortOrder: 5 },
    // Sholat Sunnah
    { name: 'Sholat Tahajud', category: 'QIYAMULLAIL', points: 30, targetType: 'DAILY', targetCount: 1, targetUnit: 'TIMES', sortOrder: 6, isOptional: true },
    { name: 'Sholat Dhuha', category: 'SHOLAT_SUNNAH', points: 15, targetType: 'DAILY', targetCount: 1, targetUnit: 'TIMES', sortOrder: 7, isOptional: true },
    { name: 'Sholat Rawatib', category: 'SHOLAT_SUNNAH', points: 10, targetType: 'DAILY', targetCount: 12, targetUnit: 'TIMES', sortOrder: 8, isOptional: true },
    // Tilawah
    { name: 'Tilawah Harian', category: 'TILAWAH', points: 20, targetType: 'DAILY', targetCount: 1, targetUnit: 'JUZ', sortOrder: 9 },
    // Dzikir
    { name: 'Dzikir Pagi', category: 'DZIKIR', points: 10, targetType: 'DAILY', targetCount: 1, targetUnit: 'TIMES', sortOrder: 10 },
    { name: 'Dzikir Petang', category: 'DZIKIR', points: 10, targetType: 'DAILY', targetCount: 1, targetUnit: 'TIMES', sortOrder: 11 },
    // Puasa
    { name: 'Puasa Senin', category: 'PUASA', points: 50, targetType: 'WEEKLY', targetCount: 1, targetUnit: 'TIMES', sortOrder: 12, isOptional: true },
    { name: 'Puasa Kamis', category: 'PUASA', points: 50, targetType: 'WEEKLY', targetCount: 1, targetUnit: 'TIMES', sortOrder: 13, isOptional: true },
    // Sedekah
    { name: 'Sedekah Harian', category: 'SEDEKAH', points: 15, targetType: 'DAILY', targetCount: 1, targetUnit: 'AMOUNT', sortOrder: 14, isOptional: true },
  ];

  const created = await Promise.all(
    defaultTargets.map(target =>
      prisma.dailyIbadahTarget.upsert({
        where: {
          id: `${unitId}-${target.name.toLowerCase().replace(/\s+/g, '-')}`,
        },
        create: {
          id: `${unitId}-${target.name.toLowerCase().replace(/\s+/g, '-')}`,
          unitId,
          ...target,
        },
        update: {},
      })
    )
  );

  return created;
}
