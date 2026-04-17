import { prisma } from '@/lib/prisma';

export class AssessmentAnalyticsService {
  /**
   * Calculate a holistic holistic score for a student.
   * Integrates Academic, Tahfidz, Behavior (Violations), Attendance, and Ibadah.
   */
  static async getStudentHolisticAnalytics(studentId: string, academicYearId: string) {
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

      // 2. Tahfidz: Progress against target
      prisma.tahfidzRecord.aggregate({
        where: { studentId },
        _sum: { totalAyah: true },
        _max: { juz: true }
      }),

      // 3. Behavior: Total violation points (inverted)
      prisma.violation.aggregate({
        where: { studentId, status: 'VERIFIED' },
        _sum: { points: true }
      }),

      // 4. Attendance: Presence percentage
      prisma.attendance.groupBy({
        by: ['status'],
        where: { studentId },
        _count: { _all: true }
      }),

      // 5. Ibadah: Points from daily ibadah records
      prisma.dailyIbadahRecord.aggregate({
        where: { studentId, isCompleted: true },
        _sum: { pointsEarned: true }
      })
    ]);

    // Calculate sub-scores (scaled 0-100)
    const academicScore = Number(academicGrades._avg.percentage || 0);

    // Tahfidz score: assuming 30 juz is 100% for high level, but let's use a relative target
    const totalJuz = tahfidzProgress._max.juz || 0;
    const tahfidzScore = Math.min(100, (totalJuz / 30) * 100);

    // Behavior score: starting at 100, subtract points
    const violationPoints = Number(violations._sum.points || 0);
    const behaviorScore = Math.max(0, 100 - violationPoints);

    // Attendance score
    const attMap = attendance.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count._all }), {} as Record<string, number>);
    const totalDays = Object.values(attMap).reduce((a, b) => a + b, 0);
    const presentDays = (attMap['PRESENT'] || 0) + (attMap['LATE'] || 0);
    const attendanceScore = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Ibadah score (relative to an arbitrary monthly target of 3000 pts)
    const totalIbadahPoints = Number(ibadahPoints._sum.pointsEarned || 0);
    const ibadahScore = Math.min(100, (totalIbadahPoints / 3000) * 100);

    // Holistic Score (Weighted)
    // 30% Academic, 25% Tahfidz, 20% Behavior, 15% Attendance, 10% Ibadah
    const holisticScore = (
      (academicScore * 0.3) +
      (tahfidzScore * 0.25) +
      (behaviorScore * 0.2) +
      (attendanceScore * 0.15) +
      (ibadahScore * 0.1)
    );

    return {
      studentId,
      holisticScore: Math.round(holisticScore * 100) / 100,
      breakdown: {
        academic: Math.round(academicScore * 100) / 100,
        tahfidz: Math.round(tahfidzScore * 100) / 100,
        behavior: Math.round(behaviorScore * 100) / 100,
        attendance: Math.round(attendanceScore * 100) / 100,
        ibadah: Math.round(ibadahScore * 100) / 100
      },
      interpretation: this.getHolisticInterpretation(holisticScore)
    };
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
