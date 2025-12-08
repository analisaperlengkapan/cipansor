import { prisma } from '@/lib/prisma';
import { Prisma, MurojaahType, TahfidzMistakeType } from '@prisma/client';
import type {
  ListMurojaahQuery,
  CreateMurojaahInput,
  UpdateMurojaahInput,
  CreateMistakeInput,
  StudentMurojaahSummaryQuery,
  HalaqohMurojaahQuery,
} from './murojaah.schema';

interface AuthContext {
  role: string;
  unitId?: string | null;
}

// ============================================
// Murojaah Service
// ============================================

export const murojaahService = {
  // ============================================
  // LIST & READ
  // ============================================

  async findAll(query: ListMurojaahQuery, context: AuthContext) {
    const {
      page = 1,
      limit = 20,
      studentId,
      enrollmentId,
      halaqohId,
      murojaahType,
      dateFrom,
      dateTo,
      juz,
      search,
    } = query;

    const where: Prisma.MurojaahRecordWhereInput = {};

    // Filter by student
    if (studentId) where.studentId = studentId;

    // Filter by enrollment
    if (enrollmentId) where.enrollmentId = enrollmentId;

    // Filter by halaqoh
    if (halaqohId) where.halaqohId = halaqohId;

    // Filter by murojaah type
    if (murojaahType) where.murojaahType = murojaahType as MurojaahType;

    // Date filters
    if (dateFrom || dateTo) {
      where.murojaahDate = {};
      if (dateFrom) where.murojaahDate.gte = new Date(dateFrom);
      if (dateTo) where.murojaahDate.lte = new Date(dateTo);
    }

    // Filter by juz
    if (juz) {
      where.AND = [
        { juzStart: { lte: juz } },
        { juzEnd: { gte: juz } },
      ];
    }

    // Search in notes
    if (search) {
      where.OR = [
        { notes: { contains: search, mode: 'insensitive' } },
        { improvementAreas: { contains: search, mode: 'insensitive' } },
        { student: { user: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.murojaahRecord.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              nis: true,
              user: { select: { id: true, name: true } },
            },
          },
          enrollment: {
            select: { id: true, status: true },
          },
          halaqoh: {
            select: { id: true, name: true },
          },
          recordedBy: {
            select: { id: true, name: true },
          },
          mistakes: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ murojaahDate: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.murojaahRecord.count({ where }),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string) {
    const record = await prisma.murojaahRecord.findUniqueOrThrow({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            nis: true,
            nisn: true,
            user: { select: { id: true, name: true } },
          },
        },
        enrollment: {
          select: { id: true, status: true },
        },
        halaqoh: {
          select: { id: true, name: true, level: true },
        },
        recordedBy: {
          select: { id: true, name: true },
        },
        mistakes: {
          orderBy: { juz: 'asc' },
        },
      },
    });

    return record;
  },

  // ============================================
  // CREATE
  // ============================================

  async create(data: CreateMurojaahInput, userId: string) {
    const murojaahDate = new Date(data.murojaahDate);
    murojaahDate.setHours(0, 0, 0, 0);

    const record = await prisma.murojaahRecord.create({
      data: {
        studentId: data.studentId,
        enrollmentId: data.enrollmentId,
        halaqohId: data.halaqohId,
        recordedById: userId,
        murojaahType: data.murojaahType as MurojaahType,
        murojaahDate,
        juzStart: data.juzStart,
        juzEnd: data.juzEnd,
        pagesReviewed: data.pagesReviewed,
        durationMinutes: data.durationMinutes,
        qualityScore: data.qualityScore,
        mistakeCount: data.mistakes?.length || 0,
        fluencyLevel: data.fluencyLevel || 3,
        tajwidScore: data.tajwidScore,
        notes: data.notes,
        improvementAreas: data.improvementAreas,
        mistakes: data.mistakes && data.mistakes.length > 0
          ? {
              create: data.mistakes.map((m) => ({
                mistakeType: m.mistakeType as TahfidzMistakeType,
                juz: m.juz,
                surahNumber: m.surahNumber,
                ayahNumber: m.ayahNumber,
                description: m.description,
              })),
            }
          : undefined,
      },
      include: {
        student: { select: { id: true, user: { select: { name: true } } } },
        halaqoh: { select: { id: true, name: true } },
        recordedBy: { select: { id: true, name: true } },
        mistakes: true,
      },
    });

    return record;
  },

  // ============================================
  // UPDATE
  // ============================================

  async update(id: string, data: UpdateMurojaahInput) {
    const record = await prisma.murojaahRecord.update({
      where: { id },
      data: {
        ...(data.murojaahType && { murojaahType: data.murojaahType as MurojaahType }),
        ...(data.juzStart !== undefined && { juzStart: data.juzStart }),
        ...(data.juzEnd !== undefined && { juzEnd: data.juzEnd }),
        ...(data.pagesReviewed !== undefined && { pagesReviewed: data.pagesReviewed }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.qualityScore !== undefined && { qualityScore: data.qualityScore }),
        ...(data.fluencyLevel !== undefined && { fluencyLevel: data.fluencyLevel }),
        ...(data.tajwidScore !== undefined && { tajwidScore: data.tajwidScore }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.improvementAreas !== undefined && { improvementAreas: data.improvementAreas }),
      },
      include: {
        student: { select: { id: true, user: { select: { name: true } } } },
        mistakes: true,
      },
    });

    return record;
  },

  // ============================================
  // DELETE
  // ============================================

  async delete(id: string) {
    await prisma.murojaahRecord.findUniqueOrThrow({ where: { id } });
    await prisma.murojaahRecord.delete({ where: { id } });
    return { message: 'Murojaah record deleted successfully' };
  },

  // ============================================
  // MISTAKE MANAGEMENT
  // ============================================

  async addMistake(data: CreateMistakeInput) {
    // Verify murojaah exists
    await prisma.murojaahRecord.findUniqueOrThrow({ where: { id: data.murojaahId } });

    const mistake = await prisma.murojaahMistake.create({
      data: {
        murojaahId: data.murojaahId,
        mistakeType: data.mistakeType as TahfidzMistakeType,
        juz: data.juz,
        surahNumber: data.surahNumber,
        ayahNumber: data.ayahNumber,
        description: data.description,
      },
    });

    // Update mistake count
    await prisma.murojaahRecord.update({
      where: { id: data.murojaahId },
      data: { mistakeCount: { increment: 1 } },
    });

    return mistake;
  },

  async deleteMistake(id: string) {
    const mistake = await prisma.murojaahMistake.findUniqueOrThrow({ where: { id } });
    await prisma.murojaahMistake.delete({ where: { id } });

    // Update mistake count
    await prisma.murojaahRecord.update({
      where: { id: mistake.murojaahId },
      data: { mistakeCount: { decrement: 1 } },
    });

    return { message: 'Mistake deleted successfully' };
  },

  // ============================================
  // STUDENT HISTORY & SUMMARY
  // ============================================

  async getStudentHistory(studentId: string, query: ListMurojaahQuery) {
    return this.findAll({ ...query, studentId }, { role: 'ADMIN', unitId: null });
  },

  async getStudentSummary(query: StudentMurojaahSummaryQuery) {
    const { studentId, startDate, endDate, murojaahType } = query;

    const where: Prisma.MurojaahRecordWhereInput = { studentId };

    if (startDate || endDate) {
      where.murojaahDate = {};
      if (startDate) where.murojaahDate.gte = new Date(startDate);
      if (endDate) where.murojaahDate.lte = new Date(endDate);
    }

    if (murojaahType) {
      where.murojaahType = murojaahType as MurojaahType;
    }

    const records = await prisma.murojaahRecord.findMany({
      where,
      include: { mistakes: true },
      orderBy: { murojaahDate: 'desc' },
    });

    // Calculate statistics
    const totalSessions = records.length;
    const totalPages = records.reduce((sum, r) => sum + r.pagesReviewed, 0);
    const totalMinutes = records.reduce((sum, r) => sum + r.durationMinutes, 0);
    const totalMistakes = records.reduce((sum, r) => sum + r.mistakeCount, 0);
    const avgQuality = totalSessions > 0
      ? Math.round(records.reduce((sum, r) => sum + r.qualityScore, 0) / totalSessions)
      : 0;
    const avgFluency = totalSessions > 0
      ? Math.round((records.reduce((sum, r) => sum + r.fluencyLevel, 0) / totalSessions) * 10) / 10
      : 0;

    // Juz coverage analysis
    const juzCoverage: Record<number, number> = {};
    records.forEach((r) => {
      for (let j = r.juzStart; j <= r.juzEnd; j++) {
        juzCoverage[j] = (juzCoverage[j] || 0) + 1;
      }
    });

    // Mistake type breakdown
    const mistakeBreakdown: Record<string, number> = {};
    records.forEach((r) => {
      r.mistakes.forEach((m) => {
        mistakeBreakdown[m.mistakeType] = (mistakeBreakdown[m.mistakeType] || 0) + 1;
      });
    });

    // Recent murojaah records (last 10)
    const recentRecords = records.slice(0, 10).map((r) => ({
      id: r.id,
      date: r.murojaahDate,
      type: r.murojaahType,
      juzRange: `${r.juzStart}-${r.juzEnd}`,
      pages: r.pagesReviewed,
      quality: r.qualityScore,
      mistakes: r.mistakeCount,
    }));

    return {
      student: await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, nis: true, user: { select: { name: true } } },
      }),
      summary: {
        totalSessions,
        totalPages,
        totalMinutes,
        avgMinutesPerSession: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
        totalMistakes,
        avgMistakesPerSession: totalSessions > 0 ? Math.round((totalMistakes / totalSessions) * 10) / 10 : 0,
        avgQualityScore: avgQuality,
        avgFluencyLevel: avgFluency,
      },
      juzCoverage,
      mistakeBreakdown,
      recentRecords,
    };
  },

  // ============================================
  // HALAQOH RECORDS
  // ============================================

  async getHalaqohRecords(query: HalaqohMurojaahQuery) {
    const { halaqohId, page = 1, limit = 20, dateFrom, dateTo } = query;

    const where: Prisma.MurojaahRecordWhereInput = { halaqohId };

    if (dateFrom || dateTo) {
      where.murojaahDate = {};
      if (dateFrom) where.murojaahDate.gte = new Date(dateFrom);
      if (dateTo) where.murojaahDate.lte = new Date(dateTo);
    }

    const [records, total, halaqoh] = await Promise.all([
      prisma.murojaahRecord.findMany({
        where,
        include: {
          student: {
            select: { id: true, nis: true, user: { select: { name: true } } },
          },
          mistakes: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ murojaahDate: 'desc' }],
      }),
      prisma.murojaahRecord.count({ where }),
      prisma.halaqoh.findUnique({
        where: { id: halaqohId },
        select: { id: true, name: true, level: true },
      }),
    ]);

    return {
      halaqoh,
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ============================================
  // SCHEDULE RECOMMENDATION
  // ============================================

  async getMurojaahSchedule(studentId: string) {
    // Get student's tahfidz progress
    const tahfidzRecords = await prisma.tahfidzRecord.findMany({
      where: { studentId },
      orderBy: { recordedAt: 'desc' },
      take: 1,
    });

    // Get recent murojaah records
    const recentMurojaah = await prisma.murojaahRecord.findMany({
      where: { studentId },
      orderBy: { murojaahDate: 'desc' },
      take: 30,
    });

    // Calculate juz that need review (not reviewed in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentlyReviewedJuz = new Set<number>();
    recentMurojaah
      .filter((r) => r.murojaahDate >= sevenDaysAgo)
      .forEach((r) => {
        for (let j = r.juzStart; j <= r.juzEnd; j++) {
          recentlyReviewedJuz.add(j);
        }
      });

    // Get memorized juz (from tahfidz records)
    const memorizedJuz = new Set<number>();
    const currentHafalan = tahfidzRecords[0];
    if (currentHafalan) {
      // TahfidzRecord has 'juz' field, not juzStart/juzEnd
      memorizedJuz.add(currentHafalan.juz);
    }
    // Add all juz from tahfidz records
    tahfidzRecords.forEach((r) => memorizedJuz.add(r.juz));

    // Find juz needing review
    const needsReview: number[] = [];
    memorizedJuz.forEach((juz) => {
      if (!recentlyReviewedJuz.has(juz)) {
        needsReview.push(juz);
      }
    });

    // Create schedule recommendation
    const today = new Date();
    const schedule = [];
    const juzPerDay = 3; // Review 3 juz per day

    for (let i = 0; i < Math.min(7, Math.ceil(needsReview.length / juzPerDay)); i++) {
      const scheduleDate = new Date(today);
      scheduleDate.setDate(scheduleDate.getDate() + i);
      
      const startIdx = i * juzPerDay;
      const endIdx = Math.min(startIdx + juzPerDay, needsReview.length);
      const juzForDay = needsReview.slice(startIdx, endIdx);

      if (juzForDay.length > 0) {
        schedule.push({
          date: scheduleDate.toISOString().split('T')[0],
          juz: juzForDay,
          estimatedMinutes: juzForDay.length * 15, // ~15 min per juz
          type: i === 0 ? 'DAILY' : 'WEEKLY',
        });
      }
    }

    return {
      student: await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, user: { select: { name: true } } },
      }),
      currentMemorization: {
        totalJuz: memorizedJuz.size,
        juzList: Array.from(memorizedJuz).sort((a, b) => a - b),
      },
      reviewStatus: {
        recentlyReviewed: Array.from(recentlyReviewedJuz).sort((a, b) => a - b),
        needsReview: needsReview.sort((a, b) => a - b),
      },
      recommendedSchedule: schedule,
    };
  },
};
