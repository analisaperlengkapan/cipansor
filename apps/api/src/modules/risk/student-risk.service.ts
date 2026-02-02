import { prisma } from '@/lib/prisma';
import {
  RiskLevel,
  PaymentStatus,
  AttendanceStatus,
  Prisma
} from '@prisma/client';

export interface StudentRiskProfile {
  studentId: string;
  studentName: string;
  className: string;
  riskScore: number;
  riskLevel: RiskLevel;
  details: {
    behavior: {
      violationCount: number;
      totalPoints: number;
      riskContribution: number;
    };
    academic: {
      failingSubjects: number; // Score < 70
      gpa: number; // Simulated or calculated average
      riskContribution: number;
    };
    financial: {
      overdueInvoices: number;
      totalDebt: number;
      riskContribution: number;
    };
    attendance: {
      absenceCount: number;
      riskContribution: number;
    };
  };
}

// Type definition for student with all required relations included
type StudentWithRiskData = Prisma.StudentGetPayload<{
  include: {
    enrollments: { include: { class: true } };
    violations: true;
    grades: true;
    invoices: true;
    attendances: true; // Note: schema says 'attendances' (plural) relation name? Checking previous code... yes.
  }
}>;

export class StudentRiskService {

  // Weights for Risk Calculation
  private readonly WEIGHTS = {
    VIOLATION_POINT: 1,    // 1 point per violation point
    FAILING_GRADE: 10,     // 10 points per failing subject
    OVERDUE_INVOICE: 5,    // 5 points per overdue invoice
    ABSENCE: 2,            // 2 points per unexcused absence
  };

  /**
   * Calculate Risk Profile for a single student
   */
  async calculateStudentRisk(studentId: string): Promise<StudentRiskProfile> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: 'active' },
          include: { class: true }
        },
        violations: true,
        grades: true,
        invoices: {
          where: { status: { in: [PaymentStatus.OVERDUE, PaymentStatus.PARTIAL, PaymentStatus.PENDING] } }
        },
        attendances: {
          where: { status: AttendanceStatus.ABSENT }
        }
      }
    });

    if (!student) throw new Error(`Student not found: ${studentId}`);

    return this.computeRisk(student as unknown as StudentWithRiskData);
  }

  /**
   * Get all at-risk students for a unit
   * Optimized to fetch all data in one query to avoid N+1
   */
  async getAtRiskStudents(unitId: string, minScore: number = 20): Promise<StudentRiskProfile[]> {
    // Fetch all active students with related risk data
    const students = await prisma.student.findMany({
      where: {
        unitId,
        status: 'active'
      },
      include: {
        enrollments: {
          where: { status: 'active' },
          include: { class: true }
        },
        violations: true,
        grades: true,
        invoices: {
          where: { status: { in: [PaymentStatus.OVERDUE, PaymentStatus.PARTIAL, PaymentStatus.PENDING] } }
        },
        attendances: {
          where: { status: AttendanceStatus.ABSENT }
        }
      }
    });

    // Calculate risk in memory
    const riskProfiles = students.map(s => this.computeRisk(s as unknown as StudentWithRiskData));

    // Filter and Sort
    return riskProfiles
      .filter(p => p.riskScore >= minScore)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  private computeRisk(student: StudentWithRiskData): StudentRiskProfile {
    const currentClass = student.enrollments?.[0]?.class?.name || 'Unassigned';

    // 1. Behavior Risk
    const violationCount = student.violations.length;
    const totalPoints = student.violations.reduce((sum, v) => sum + v.points, 0);
    const behaviorRisk = totalPoints * this.WEIGHTS.VIOLATION_POINT;

    // 2. Academic Risk
    const failingGrades = student.grades.filter(g => g.score.toNumber() < 70);
    const failingSubjects = failingGrades.length;

    const totalScore = student.grades.reduce((sum, g) => sum + g.score.toNumber(), 0);
    const gpa = student.grades.length > 0 ? totalScore / student.grades.length : 0;

    const academicRisk = failingSubjects * this.WEIGHTS.FAILING_GRADE;

    // 3. Financial Risk
    const now = new Date();
    // Invoices are already filtered by status in the query (OVERDUE, PARTIAL, PENDING)
    // We double check due date logic if needed, but for bulk query simplicity we trust status or filter in memory
    const overdueInvoices = student.invoices.filter(inv =>
      inv.status === PaymentStatus.OVERDUE ||
      (inv.dueDate < now && inv.status !== PaymentStatus.PAID)
    );

    const overdueCount = overdueInvoices.length;
    const totalDebt = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.amount) - Number(inv.paidAmount)), 0);
    const financialRisk = overdueCount * this.WEIGHTS.OVERDUE_INVOICE;

    // 4. Attendance Risk
    // Attendances are already filtered to ABSENT in query
    const absenceCount = student.attendances.length;
    const attendanceRisk = absenceCount * this.WEIGHTS.ABSENCE;

    // Total Calculation
    const totalRiskScore = behaviorRisk + academicRisk + financialRisk + attendanceRisk;

    return {
      studentId: student.id,
      studentName: student.name,
      className: currentClass,
      riskScore: totalRiskScore,
      riskLevel: this.determineRiskLevel(totalRiskScore),
      details: {
        behavior: {
          violationCount,
          totalPoints,
          riskContribution: behaviorRisk
        },
        academic: {
          failingSubjects,
          gpa: Number(gpa.toFixed(2)),
          riskContribution: academicRisk
        },
        financial: {
          overdueInvoices: overdueCount,
          totalDebt,
          riskContribution: financialRisk
        },
        attendance: {
          absenceCount,
          riskContribution: attendanceRisk
        }
      }
    };
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.EXTREME;
    if (score >= 50) return RiskLevel.HIGH;
    if (score >= 20) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }
}

export const studentRiskService = new StudentRiskService();
