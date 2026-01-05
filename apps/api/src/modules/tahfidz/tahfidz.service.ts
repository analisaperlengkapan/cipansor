import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { UserRole, TahfidzActivityType, Prisma } from '@prisma/client';
import type {
  ListTahfidzQuery,
  GenerateCertificateInput,
} from './tahfidz.schema';
import type { CreateTahfidzInput, UpdateTahfidzInput, TahfidzStudentSummary, TahfidzDashboardStats } from '@cipansor/shared';

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
   * Optimized with Promise.all for parallel execution
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

    const [
      activityCounts,
      totalRecords,
      totalAyahZiyadah,
      juzCovered,
      surahCovered,
      avgScore,
      recentRecords
    ] = await Promise.all([
      // 1. Get activity type counts
      prisma.tahfidzRecord.groupBy({
        by: ['activityType'],
        where: { studentId },
        _count: { _all: true },
        _sum: { totalAyah: true },
      }),
      // 2. Get total records
      prisma.tahfidzRecord.count({
        where: { studentId },
      }),
      // 3. Get total ayah memorized (ziyadah only)
      prisma.tahfidzRecord.aggregate({
        where: { studentId, activityType: 'ZIYADAH' },
        _sum: { totalAyah: true },
      }),
      // 4. Get unique juz covered
      prisma.tahfidzRecord.findMany({
        where: { studentId },
        select: { juz: true },
        distinct: ['juz'],
      }),
      // 5. Get unique surah covered
      prisma.tahfidzRecord.findMany({
        where: { studentId },
        select: { surahNumber: true, surahName: true },
        distinct: ['surahNumber'],
      }),
      // 6. Get average score from assessments
      prisma.tahfidzRecord.aggregate({
        where: { studentId, activityType: 'ASSESSMENT', score: { not: null } },
        _avg: { score: true },
      }),
      // 7. Get recent records
      prisma.tahfidzRecord.findMany({
        where: { studentId },
        orderBy: { recordedAt: 'desc' },
        take: 5,
        include: {
          recordedBy: { select: { id: true, name: true } },
        },
      })
    ]);

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
  async getDashboardStats(params: { unitId?: string; year?: number; month?: number }): Promise<TahfidzDashboardStats & { recentRecords: any[] }> {
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
      recentRecords: recentRecords as unknown as TahfidzRecord[],
    };
  }

  /**
   * Generate or retrieve certificate
   */
  async generateCertificate(input: GenerateCertificateInput, createdById: string) {
    const { studentId, certificateType, issueDate = new Date() } = input;
    const date = new Date(issueDate);

    // Check if certificate already exists
    const existing = await prisma.digitalCertificate.findFirst({
      where: {
        studentId,
        certificateType,
      },
      include: {
        student: true,
      }
    });

    if (existing) {
      // Update details if needed (e.g. reprint with corrections), but keep number
       const updated = await prisma.digitalCertificate.update({
        where: { id: existing.id },
        data: {
            grade: input.grade,
            signatoryName: input.musyrifName || existing.signatoryName,
            description: input.notes,
            // We could store more details in description or dedicated fields if model allowed
        },
        include: {
          student: true,
        }
       });
       return updated;
    }

    // Generate new Number
    // Format: [SEQ]/[TYPE]/CPN/[MM]/[YYYY]
    // SEQ resets every month

    // Determine the TYPE code
    let typeCode = 'TAHFIDZ';
    if (certificateType === 'TAHFIDZ_JUZ_AMMA') typeCode = 'JUZ30';
    else if (certificateType === 'TAHFIDZ_5_JUZ') typeCode = '5JUZ';
    else if (certificateType === 'TAHFIDZ_10_JUZ') typeCode = '10JUZ';
    else if (certificateType === 'TAHFIDZ_30_JUZ') typeCode = '30JUZ';
    else if (certificateType === 'SANAD_QIRAAH') typeCode = 'QIRAAH';

    // Get month and year for formatting
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();
    const monthStr = month.toString().padStart(2, '0');

    // Retry logic for sequence generation
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
       try {
         // Optimized: Find the latest certificate number for this month/year pattern
         const pattern = `%/${typeCode}/CPN/${monthStr}/${year}`;
         const latestCert = await prisma.digitalCertificate.findFirst({
             where: {
                 certificateNumber: {
                     endsWith: `/${typeCode}/CPN/${monthStr}/${year}`
                 }
             },
             orderBy: {
                 certificateNumber: 'desc'
             },
             select: {
                 certificateNumber: true
             }
         });

         let nextSeq = 1;
         if (latestCert) {
             const parts = latestCert.certificateNumber.split('/');
             const lastSeq = parseInt(parts[0], 10);
             if (!isNaN(lastSeq)) {
                 nextSeq = lastSeq + 1 + retries; // Add retries to jump over gaps/collisions in loop
             }
         }

         const seq = nextSeq.toString().padStart(3, '0');
         const certificateNumber = `${seq}/${typeCode}/CPN/${monthStr}/${year}`;

         // Generate generic placeholder values for required fields
         const cert = await prisma.digitalCertificate.create({
            data: {
                studentId,
                certificateType,
                certificateNumber,
                title: 'Sertifikat Tahfidz',
                grade: input.grade,
                issueDate: date,
                qrCode: crypto.randomUUID(), // Placeholder unique QR code
                verificationUrl: `https://cipansor.com/verify/${crypto.randomUUID()}`, // Placeholder
                signatoryName: input.musyrifName || 'Administrator',
                signatoryTitle: 'Musyrif Tahfidz',
                description: input.notes,
                createdById,
            },
            include: {
              student: true,
            }
         });

         return cert;

       } catch (e: any) {
         if (e.code === 'P2002') { // Unique constraint failed
            retries++;
            continue;
         }
         throw e;
       }
    }
    throw new Error('Failed to generate unique certificate number after multiple retries');
  }
}

export const tahfidzService = new TahfidzService();
