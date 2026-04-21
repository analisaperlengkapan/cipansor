import { prisma } from '@/lib/prisma';

export class AssessmentAnalyticsService {
  /**
   * Calculate a holistic holistic score for a student.
   * Integrates Academic, Tahfidz, Behavior (Violations), Attendance, and Ibadah.
   */
  static async getStudentHolisticAnalytics(studentId: string, academicYearId: string) {
    // Look up the academic year's date range to scope all queries
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
      select: { startDate: true, endDate: true },
    });

    if (!academicYear) {
      throw new Error(`Academic year with id ${academicYearId} not found`);
    }

    const yearStart = academicYear.startDate;
    const yearEnd = academicYear.endDate;

    const [
      academicGrades,
      tahfidzProgress,
      violations,
      attendance,
      ibadahPoints
    ] = await Promise.all([
      // 1. Academic: Average of all subject percentages
      prisma.grade.aggregate({
        where: { studentId, academicYearId },
        _avg: { percentage: true }
      }),

      // 2. Tahfidz: Progress against target (cumulative, not year-scoped)
      prisma.tahfidzRecord.aggregate({
        where: { studentId },
        _sum: { totalAyah: true },
        _max: { juz: true }
      }),

      // 3. Behavior: Total violation points within academic year (inverted)
      prisma.violation.aggregate({
        where: {
          studentId,
          ...(yearStart && yearEnd ? { occurredAt: { gte: yearStart, lte: yearEnd } } : {}),
        },
        _sum: { points: true }
      }),

      // 4. Attendance: Presence percentage within academic year
      prisma.attendance.groupBy({
        by: ['status'],
        where: {
          studentId,
          class: { academicYearId },
        },
        _count: { _all: true },
      }),

      // 5. Ibadah: Points from daily ibadah records within academic year
      prisma.dailyIbadahRecord.aggregate({
        where: {
          studentId,
          isCompleted: true,
          ...(yearStart && yearEnd ? { date: { gte: yearStart, lte: yearEnd } } : {}),
        },
        _sum: { pointsEarned: true }
      })
    ]);

    // Calculate sub-scores (scaled 0-100)
    // Use null for dimensions without data so consumers can distinguish
    // "no data" from "genuinely scored 0". Only non-null dimensions
    // participate in the weighted holistic score.
    const hasAcademicData = academicGrades._avg.percentage !== null;
    const hasTahfidzData = tahfidzProgress._max.juz !== null;
    const hasAttendanceData = attendance.length > 0;
    const hasIbadahData = ibadahPoints._sum.pointsEarned !== null && Number(ibadahPoints._sum.pointsEarned) > 0;

    const academicScore = hasAcademicData ? Number(academicGrades._avg.percentage) : null;

    // Tahfidz score: assuming 30 juz is 100% for high level
    const tahfidzScore = hasTahfidzData ? Math.min(100, ((tahfidzProgress._max.juz || 0) / 30) * 100) : null;

    // Behavior score: starting at 100, subtract points.
    // Unlike grades or attendance (where records are created per student),
    // violations are only recorded when infractions occur. The absence of
    // violation records means the student has a clean record, NOT that they
    // haven't been assessed. Therefore behavior data is always considered
    // present for enrolled students.
    const hasBehaviorData = true;
    const violationPoints = Number(violations._sum.points || 0);
    const behaviorScore = hasBehaviorData ? Math.max(0, 100 - violationPoints) : null;

    // Attendance score
    // SICK and EXCUSED are counted as partial presence (50% weight) since they are
    // legitimate absences that shouldn't penalize students the same as unexcused ones.
    const attMap = attendance.reduce((acc: Record<string, number>, curr: any) => ({ ...acc, [curr.status]: curr._count._all }), {} as Record<string, number>);
    const totalDays = Object.values(attMap).reduce((a, b) => a + b, 0);
    const presentDays = (attMap['PRESENT'] || 0) + (attMap['LATE'] || 0);
    const excusedDays = (attMap['SICK'] || 0) + (attMap['EXCUSED'] || 0);
    const attendanceScore = hasAttendanceData ? ((presentDays + excusedDays * 0.5) / totalDays) * 100 : null;

    // Ibadah score (relative to an arbitrary yearly target of 3000 pts)
    const ibadahScore = hasIbadahData ? Math.min(100, (Number(ibadahPoints._sum.pointsEarned) / 3000) * 100) : null;

    // Holistic Score (Weighted) — only include dimensions that have actual data.
    // This prevents a new student with no records from being scored as 0%.
    const weights: { score: number | null; weight: number }[] = [
      { score: academicScore, weight: 0.3 },
      { score: tahfidzScore, weight: 0.25 },
      { score: behaviorScore, weight: 0.2 },
      { score: attendanceScore, weight: 0.15 },
      { score: ibadahScore, weight: 0.1 },
    ];
    const activeWeights = weights.filter(w => w.score !== null);
    const totalWeight = activeWeights.reduce((sum, w) => sum + w.weight, 0);
    // Re-normalize: divide each weight by totalWeight so partial data is scaled
    // back to 0-100 instead of being penalized for missing dimensions.
    const normalizedScore = totalWeight > 0
      ? activeWeights.reduce((sum, w) => sum + (w.score! * (w.weight / totalWeight)), 0)
      : 0;

    const dimensionsWithData = [hasAcademicData, hasTahfidzData, hasBehaviorData, hasAttendanceData, hasIbadahData].filter(Boolean).length;
    const dataCompleteness = dimensionsWithData >= 4 ? 'COMPLETE' : dimensionsWithData >= 2 ? 'PARTIAL' : 'INSUFFICIENT';

    const roundOrNull = (v: number | null) => v !== null ? Math.round(v * 100) / 100 : null;

    // When data is insufficient (only behavior with no other dimensions),
    // return 0 instead of a misleading renormalized score.
    const finalScore = dataCompleteness === 'INSUFFICIENT' ? 0 : Math.round(normalizedScore * 100) / 100;

    const interpretation = dataCompleteness === 'INSUFFICIENT'
      ? 'Dhoif (Perlu Bimbingan/Needs Improvement)'
      : this.getHolisticInterpretation(finalScore);

    const breakdown = {
      academic: roundOrNull(academicScore),
      tahfidz: roundOrNull(tahfidzScore),
      behavior: roundOrNull(behaviorScore),
      attendance: roundOrNull(attendanceScore),
      ibadah: roundOrNull(ibadahScore)
    };

    return {
      studentId,
      holisticScore: finalScore,
      breakdown,
      dataCompleteness,
      interpretation,
      recommendation: this.generateRecommendation(breakdown, dataCompleteness),
    };
  }

  /**
   * Generate a development recommendation based on the holistic breakdown.
   * This is the single source of truth for recommendation text — the frontend
   * should use the `recommendation` field from the API response instead of
   * duplicating this logic.
   */
  private static generateRecommendation(
    breakdown: Record<string, number | null>,
    dataCompleteness: string
  ): string {
    const genericMessage = "Pertahankan prestasi dan terus kembangkan potensi diri di segala aspek.";
    const entries: [string, number][] = Object.entries(breakdown)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => [k, Number(v)] as [string, number]);
    if (entries.length === 0 || dataCompleteness === 'INSUFFICIENT') {
      return genericMessage;
    }
    const lowest = entries.reduce((a, b) => a[1] <= b[1] ? a : b, entries[0]);

    if (lowest[1] >= 80) {
      return genericMessage;
    }

    const recommendations: Record<string, string> = {
      academic: "Fokus pada peningkatan jam belajar mandiri dan konsultasi dengan guru mata pelajaran yang nilainya masih di bawah KKM.",
      tahfidz: "Tingkatkan intensitas murojaah harian dan pastikan setoran ziyadah konsisten sesuai target juz per semester.",
      behavior: "Perlu bimbingan intensif dalam kedisiplinan dan kepatuhan terhadap tata tertib pesantren.",
      attendance: "Tingkatkan kedisiplinan dalam kehadiran di kelas dan kegiatan wajib lainnya.",
      ibadah: "Meningkatkan kesadaran dalam menjalankan ibadah yaumiyah secara mandiri dan tepat waktu."
    };

    return recommendations[lowest[0]] || genericMessage;
  }

  private static getHolisticInterpretation(score: number): string {
    if (score >= 90) return 'Mumtaz (Sangat Baik/Outstanding)';
    if (score >= 80) return 'Jayyid Jiddan (Baik Sekali/Very Good)';
    if (score >= 70) return 'Jayyid (Baik/Good)';
    if (score >= 60) return 'Maqbul (Cukup/Average)';
    return 'Dhoif (Perlu Bimbingan/Needs Improvement)';
  }

  /**
   * Get education analytics for a unit (aggregated)
   */
  static async getUnitEducationAnalytics(unitId: string, academicYearId: string) {
    const [avgScores, tahfidzStats, enrollmentCount] = await Promise.all([
      // 1. Avg Scores per Subject in Unit
      prisma.grade.groupBy({
        by: ['subjectId'],
        where: { academicYearId, student: { unitId } },
        _avg: { percentage: true }
      }),
      // 2. Tahfidz progress summary for unit
      prisma.tahfidzRecord.aggregate({
        where: { student: { unitId } },
        _avg: { juz: true },
        _count: { id: true }
      }),
      // 3. Student count
      prisma.student.count({
        where: { unitId, status: 'active' }
      })
    ]);

    return {
      unitId,
      academicYearId,
      studentCount: enrollmentCount,
      averageJuz: Math.round(Number(tahfidzStats._avg.juz || 0) * 10) / 10,
      subjectAverages: avgScores.map(s => ({
        subjectId: s.subjectId,
        averagePercentage: Math.round(Number(s._avg.percentage || 0) * 100) / 100
      }))
    };
  }
}
