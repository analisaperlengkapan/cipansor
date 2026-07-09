import { prisma } from '../../lib/prisma';
import { Errors } from '@/middleware/error';

export class StudentWellbeingService {
  /**
   * Calculate a holistic Wellbeing Index for a student.
   * Best Practice: Predictive student support by correlating health, behavior, and counseling.
   */
  async getStudentWellbeingIndex(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, fullName: true, unitId: true },
    });

    if (!student) throw Errors.notFound('Student');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Fetch relevant data in parallel
    const [medicalRecords, counselingSessions, violations] = await Promise.all([
      prisma.medicalRecord.findMany({
        where: { studentId, visitDate: { gte: thirtyDaysAgo } },
      }),
      prisma.counselingSession.findMany({
        where: { studentId, scheduledAt: { gte: thirtyDaysAgo } },
      }),
      prisma.violation.findMany({
        where: { studentId, occurredAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    // 2. Calculation Logic (Base 100)
    let index = 100;

    // Health Impact (-5 pts per record)
    const healthDeduction = medicalRecords.length * 5;

    // Counseling Impact (-10 pts per HIGH priority session)
    const counselingDeduction = counselingSessions.reduce((sum, s) => {
      return sum + (s.priority === 'HIGH' || s.priority === 'CRITICAL' ? 15 : 5);
    }, 0);

    // Compliance Impact (-5 pts per violation + points/10)
    const complianceDeduction = violations.reduce((sum, v) => {
      return sum + 5 + (v.points / 10);
    }, 0);

    index = Math.max(0, index - (healthDeduction + counselingDeduction + complianceDeduction));

    // 3. Status Determination
    let status: 'EXCELLENT' | 'GOOD' | 'CONCERNING' | 'CRITICAL' = 'EXCELLENT';
    if (index < 40) status = 'CRITICAL';
    else if (index < 70) status = 'CONCERNING';
    else if (index < 90) status = 'GOOD';

    return {
      studentId,
      fullName: student.fullName,
      index: Math.round(index),
      status,
      breakdown: {
        health: { count: medicalRecords.length, deduction: healthDeduction },
        counseling: { count: counselingSessions.length, deduction: counselingDeduction },
        compliance: { count: violations.length, deduction: complianceDeduction },
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Get Wellbeing Insights for a unit (early warning system).
   */
  async getUnitWellbeingDashboard(unitId: string) {
    const students = await prisma.student.findMany({
      where: { unitId, isActive: true },
      select: { id: true, fullName: true },
    });

    const results = await Promise.all(
      students.map(s => this.getStudentWellbeingIndex(s.id))
    );

    const summary = {
      excellent: results.filter(r => r.status === 'EXCELLENT').length,
      good: results.filter(r => r.status === 'GOOD').length,
      concerning: results.filter(r => r.status === 'CONCERNING').length,
      critical: results.filter(r => r.status === 'CRITICAL').length,
    };

    const criticalStudents = results
      .filter(r => r.status === 'CRITICAL' || r.status === 'CONCERNING')
      .sort((a, b) => a.index - b.index)
      .slice(0, 10);

    return {
      unitId,
      totalStudents: students.length,
      summary,
      criticalStudents,
    };
  }
}

export const studentWellbeingService = new StudentWellbeingService();
