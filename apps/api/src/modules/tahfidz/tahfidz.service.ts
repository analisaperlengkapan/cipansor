import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { UserRole, TahfidzActivityType, Prisma } from '@prisma/client';
import type {
  ListTahfidzQuery,
} from './tahfidz.schema';
import type { CreateTahfidzInput, UpdateTahfidzInput } from '@cipansor/shared';

export class TahfidzService {
  /**
   * Get tahfidz records with pagination
   */
  async findAll(query: ListTahfidzQuery, currentUser: { role: UserRole; unitId: string | null }) {
    const { page, limit, studentId, activityType, startDate, endDate, surah } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TahfidzRecordWhereInput = {};

    // Filter by unit for non-super-admins
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.student = {
        unitId: currentUser.unitId || 'none',
      };
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (activityType) {
      where.activityType = activityType as TahfidzActivityType;
    }

    if (surah) {
      where.surahName = { contains: surah, mode: 'insensitive' };
    }

    // Date filtering
    if (startDate && endDate) {
      where.recordedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [records, total] = await Promise.all([
      prisma.tahfidzRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { recordedAt: 'desc' },
        include: {
          student: {
            include: {
              user: {
                select: { id: true, name: true },
              },
              unit: {
                select: { id: true, name: true },
              },
            },
          },
          recordedBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.tahfidzRecord.count({ where }),
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
  }

  /**
   * Get tahfidz record by ID
   */
  async findById(id: string) {
    const record = await prisma.tahfidzRecord.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            unit: { select: { id: true, name: true } },
          },
        },
        recordedBy: { select: { id: true, name: true } },
      },
    });

    if (!record) {
      throw Errors.notFound('Tahfidz record');
    }

    return record;
  }

  /**
   * Create tahfidz record
   */
  async create(input: CreateTahfidzInput, recordedById: string) {
    // Verify student exists
    const student = await prisma.student.findFirst({
      where: { id: input.studentId, deletedAt: null },
    });

    if (!student) {
      throw Errors.notFound('Student');
    }

    // Calculate total ayah if not provided
    const totalAyah = input.totalAyah || (input.ayahEnd - input.ayahStart + 1);

    const record = await prisma.tahfidzRecord.create({
      data: {
        studentId: input.studentId,
        activityType: input.activityType as TahfidzActivityType,
        surahNumber: input.surahNumber,
        surahName: input.surahName,
        ayahStart: input.ayahStart,
        ayahEnd: input.ayahEnd,
        juz: input.juz,
        totalAyah,
        score: input.score,
        notes: input.notes,
        recordedAt: input.recordedAt || new Date(),
        recordedById,
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    return record;
  }

  /**
   * Update tahfidz record
   */
  async update(id: string, input: UpdateTahfidzInput) {
    const record = await prisma.tahfidzRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw Errors.notFound('Tahfidz record');
    }

    // Recalculate total ayah if ayah range changed
    let totalAyah = input.totalAyah;
    if (input.ayahStart !== undefined || input.ayahEnd !== undefined) {
      const ayahStart = input.ayahStart ?? record.ayahStart;
      const ayahEnd = input.ayahEnd ?? record.ayahEnd;
      totalAyah = totalAyah ?? (ayahEnd - ayahStart + 1);
    }

    const updated = await prisma.tahfidzRecord.update({
      where: { id },
      data: {
        activityType: input.activityType as TahfidzActivityType | undefined,
        surahNumber: input.surahNumber,
        surahName: input.surahName,
        ayahStart: input.ayahStart,
        ayahEnd: input.ayahEnd,
        juz: input.juz,
        totalAyah,
        score: input.score,
        notes: input.notes,
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete tahfidz record
   */
  async delete(id: string) {
    const record = await prisma.tahfidzRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw Errors.notFound('Tahfidz record');
    }

    await prisma.tahfidzRecord.delete({
      where: { id },
    });

    return { message: 'Tahfidz record deleted' };
  }

  /**
   * Get student tahfidz summary/progress
   */
  async getStudentSummary(studentId: string) {
    const student = await prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      include: {
        user: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
    });

    if (!student) {
      throw Errors.notFound('Student');
    }

    // Get activity type counts
    const activityCounts = await prisma.tahfidzRecord.groupBy({
      by: ['activityType'],
      where: { studentId },
      _count: { _all: true },
      _sum: { totalAyah: true },
    });

    // Get total records
    const totalRecords = await prisma.tahfidzRecord.count({
      where: { studentId },
    });

    // Get total ayah memorized (ziyadah only)
    const totalAyahZiyadah = await prisma.tahfidzRecord.aggregate({
      where: { studentId, activityType: 'ZIYADAH' },
      _sum: { totalAyah: true },
    });

    // Get unique juz covered
    const juzCovered = await prisma.tahfidzRecord.findMany({
      where: { studentId },
      select: { juz: true },
      distinct: ['juz'],
    });

    // Get unique surah covered
    const surahCovered = await prisma.tahfidzRecord.findMany({
      where: { studentId },
      select: { surahNumber: true, surahName: true },
      distinct: ['surahNumber'],
    });

    // Get average score from assessments
    const avgScore = await prisma.tahfidzRecord.aggregate({
      where: { studentId, activityType: 'ASSESSMENT', score: { not: null } },
      _avg: { score: true },
    });

    // Get recent records
    const recentRecords = await prisma.tahfidzRecord.findMany({
      where: { studentId },
      orderBy: { recordedAt: 'desc' },
      take: 5,
      include: {
        recordedBy: { select: { id: true, name: true } },
      },
    });

    return {
      student,
      summary: {
        totalRecords,
        totalAyahMemorized: totalAyahZiyadah._sum?.totalAyah || 0,
        juzCoveredCount: juzCovered.length,
        surahCoveredCount: surahCovered.length,
        averageScore: avgScore._avg?.score ? Number(avgScore._avg.score.toFixed(1)) : null,
      },
      byActivity: activityCounts.map(ac => ({
        type: ac.activityType,
        count: ac._count._all,
        totalAyah: ac._sum?.totalAyah || 0,
      })),
      juzCovered: juzCovered.map(j => j.juz).sort((a, b) => a - b),
      surahCovered: surahCovered.sort((a, b) => a.surahNumber - b.surahNumber),
      recentRecords,
    };
  }

  /**
   * Get tahfidz dashboard stats for visualization
   */
  async getDashboardStats(params: { unitId?: string; year?: number; month?: number }) {
    const { unitId, year, month } = params;
    const currentYear = year || new Date().getFullYear();

    // Date range for the entire year
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    // Build Prisma where clause for standard queries
    const where: Prisma.TahfidzRecordWhereInput = {};
    if (unitId) {
      where.student = { unitId };
    }
    where.recordedAt = {
      gte: startOfYear,
      lte: endOfYear,
    };
    if (month !== undefined && month >= 0 && month <= 11) {
      where.recordedAt = {
        gte: new Date(currentYear, month, 1),
        lte: new Date(currentYear, month + 1, 0, 23, 59, 59),
      };
    }

    // --- Optimized Aggregations ---

    // 1. Total records and unique students
    const [totalRecords, uniqueStudents] = await Promise.all([
      prisma.tahfidzRecord.count({ where }),
      prisma.tahfidzRecord.findMany({
        where,
        select: { studentId: true },
        distinct: ['studentId'],
      }),
    ]);

    // 2. Records by activity type
    const recordsByType = await prisma.tahfidzRecord.groupBy({
      by: ['activityType'],
      where,
      _count: { _all: true },
    });

    // 3. Monthly Activity (Optimized using Raw SQL)
    // We filter by year and unitId if provided.
    // NOTE: 'tahfidz_records' is the mapped table name.
    const monthlyActivityRaw = await prisma.$queryRaw<
      Array<{ month: number; type: string; count: bigint }>
    >`
      SELECT
        CAST(EXTRACT(MONTH FROM tr.recorded_at) AS INTEGER) as month,
        tr.activity_type as type,
        COUNT(*)::bigint as count
      FROM tahfidz_records tr
      ${unitId ? Prisma.sql`JOIN students s ON tr.student_id = s.id` : Prisma.empty}
      WHERE tr.recorded_at >= ${startOfYear} AND tr.recorded_at <= ${endOfYear}
      ${unitId ? Prisma.sql`AND s.unit_id = ${unitId}` : Prisma.empty}
      GROUP BY EXTRACT(MONTH FROM tr.recorded_at), tr.activity_type
      ORDER BY month
    `;

    // Process raw results into the expected format
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyActivity = monthNames.map((name, index) => {
      const monthNum = index + 1;
      const records = monthlyActivityRaw.filter((r) => r.month === monthNum);
      const getCount = (type: string) => Number(records.find((r) => r.type === type)?.count || 0);

      return {
        month: name,
        setoran: getCount('ZIYADAH'),
        murajaah: getCount('MUROJAAH'),
        tasmi: getCount('TASMI') + getCount('ASSESSMENT'), // Count both TASMI and ASSESSMENT
      };
    });

    // 4. Progress by Juz (Optimized using Raw SQL)
    // We count distinct students per juz and those who passed assessment for that juz
    const progressByJuzRaw = await prisma.$queryRaw<
      Array<{ juz: number; student_count: bigint; completed_count: bigint }>
    >`
      SELECT
        tr.juz,
        COUNT(DISTINCT tr.student_id)::bigint as student_count,
        COUNT(DISTINCT CASE
          WHEN tr.activity_type IN ('ASSESSMENT', 'TASMI') AND tr.score >= 60
          THEN tr.student_id
        END)::bigint as completed_count
      FROM tahfidz_records tr
      ${unitId ? Prisma.sql`JOIN students s ON tr.student_id = s.id` : Prisma.empty}
      WHERE tr.recorded_at >= ${startOfYear} AND tr.recorded_at <= ${endOfYear}
      ${unitId ? Prisma.sql`AND s.unit_id = ${unitId}` : Prisma.empty}
      ${
        month !== undefined
          ? Prisma.sql`AND tr.recorded_at >= ${new Date(currentYear, month, 1)} AND tr.recorded_at <= ${new Date(currentYear, month + 1, 0, 23, 59, 59)}`
          : Prisma.empty
      }
      GROUP BY tr.juz
      ORDER BY tr.juz
    `;

    const progressByJuz = Array.from({ length: 30 }, (_, i) => {
      const juz = i + 1;
      const record = progressByJuzRaw.find((r) => r.juz === juz);
      return {
        juz,
        studentCount: Number(record?.student_count || 0),
        completedCount: Number(record?.completed_count || 0),
      };
    });

    // 5. Records by Grade (Optimized using Raw SQL)
    // Based on score: >=90 Mumtaz, >=80 Jayyid Jiddan, >=70 Jayyid, >=60 Maqbul, <60 Rasib
    const recordsByGradeRaw = await prisma.$queryRaw<
      Array<{ grade: string; count: bigint }>
    >`
      SELECT
        CASE
          WHEN score >= 90 THEN 'MUMTAZ'
          WHEN score >= 80 THEN 'JAYYID_JIDDAN'
          WHEN score >= 70 THEN 'JAYYID'
          WHEN score >= 60 THEN 'MAQBUL'
          ELSE 'RASIB'
        END as grade,
        COUNT(*)::bigint as count
      FROM tahfidz_records tr
      ${unitId ? Prisma.sql`JOIN students s ON tr.student_id = s.id` : Prisma.empty}
      WHERE tr.score IS NOT NULL
      AND tr.recorded_at >= ${startOfYear} AND tr.recorded_at <= ${endOfYear}
      ${unitId ? Prisma.sql`AND s.unit_id = ${unitId}` : Prisma.empty}
      ${
        month !== undefined
          ? Prisma.sql`AND tr.recorded_at >= ${new Date(currentYear, month, 1)} AND tr.recorded_at <= ${new Date(currentYear, month + 1, 0, 23, 59, 59)}`
          : Prisma.empty
      }
      GROUP BY grade
    `;

    const recordsByGrade = recordsByGradeRaw.map((r) => ({
      grade: r.grade,
      count: Number(r.count),
    }));

    // 6. Top students
    const topStudentsData = await prisma.tahfidzRecord.groupBy({
      by: ['studentId'],
      where: {
        ...(unitId && { student: { unitId } }),
        activityType: 'ZIYADAH',
        recordedAt: { gte: startOfYear, lte: endOfYear },
      },
      _sum: { totalAyah: true },
      orderBy: { _sum: { totalAyah: 'desc' } },
      take: 10,
    });

    const topStudentIds = topStudentsData.map((s) => s.studentId);

    // Fetch details and juz counts in bulk to avoid N+1
    const [topStudentDetails, allJuzCounts] = await Promise.all([
      prisma.student.findMany({
        where: { id: { in: topStudentIds } },
        include: { user: { select: { name: true } } },
      }),
      prisma.tahfidzRecord.groupBy({
        by: ['studentId', 'juz'],
        where: { studentId: { in: topStudentIds } },
        _count: { juz: true }, // Just to satisfy groupBy, we only need the groups
      })
    ]);

    // Map the results
    const topStudentsWithJuz = topStudentsData.map((ts) => {
      const studentDetail = topStudentDetails.find((s) => s.id === ts.studentId);
      // Filter juz counts for this student
      const studentJuzCounts = allJuzCounts.filter(j => j.studentId === ts.studentId);

      return {
        studentId: ts.studentId,
        studentName: studentDetail?.user?.name || '-',
        nis: studentDetail?.nis || '-',
        totalAyah: ts._sum.totalAyah || 0,
        completedJuz: studentJuzCounts.length,
      };
    });

    // 7. Recent records
    const recentRecords = await prisma.tahfidzRecord.findMany({
      where: unitId ? { student: { unitId } } : {},
      orderBy: { recordedAt: 'desc' },
      take: 10,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
            unit: { select: { id: true, name: true } },
          },
        },
        recordedBy: { select: { id: true, name: true } },
      },
    });

    return {
      totalRecords,
      totalStudents: uniqueStudents.length,
      recordsByType: recordsByType.map((r) => ({
        type: r.activityType,
        count: r._count._all,
      })),
      recordsByGrade,
      progressByJuz,
      monthlyActivity,
      topStudents: topStudentsWithJuz,
      recentRecords,
    };
  }
}

export const tahfidzService = new TahfidzService();
