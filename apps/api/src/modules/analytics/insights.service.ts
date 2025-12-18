/**
 * AI-Powered Student Insights Service
 * Provides risk assessment, trend analysis, and recommendations
 */

import { prisma } from '@/lib/prisma';
import { AttendanceStatus } from '@prisma/client';

// Risk levels
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface StudentRiskAssessment {
    studentId: string;
    studentName: string;
    overallRisk: RiskLevel;
    riskScore: number; // 0-100
    factors: RiskFactor[];
    recommendations: string[];
    lastUpdated: string;
}

export interface RiskFactor {
    category: 'attendance' | 'academic' | 'behavior' | 'payment' | 'tahfidz';
    level: RiskLevel;
    score: number;
    details: string;
    trend: 'improving' | 'stable' | 'declining';
}

export interface PerformanceTrend {
    studentId: string;
    period: string;
    metrics: {
        attendance: number;
        academic: number;
        tahfidz: number;
        behavior: number;
    };
    overallTrend: 'up' | 'down' | 'stable';
    changePercent: number;
}

/**
 * Calculate student risk assessment
 */
export async function calculateStudentRisk(studentId: string): Promise<StudentRiskAssessment> {
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: { select: { name: true } } },
    });

    if (!student) {
        throw new Error('Student not found');
    }

    const [attendanceFactor, academicFactor, behaviorFactor, paymentFactor, tahfidzFactor] =
        await Promise.all([
            calculateAttendanceRisk(studentId),
            calculateAcademicRisk(studentId),
            calculateBehaviorRisk(studentId),
            calculatePaymentRisk(studentId),
            calculateTahfidzRisk(studentId),
        ]);

    const factors = [attendanceFactor, academicFactor, behaviorFactor, paymentFactor, tahfidzFactor];

    // Calculate weighted overall score
    const weights = { attendance: 0.25, academic: 0.25, behavior: 0.2, payment: 0.15, tahfidz: 0.15 };
    const riskScore = factors.reduce((sum, f) => {
        const weight = weights[f.category as keyof typeof weights] || 0.2;
        return sum + f.score * weight;
    }, 0);

    const overallRisk = scoreToRiskLevel(riskScore);
    const recommendations = generateRecommendations(factors, overallRisk);

    return {
        studentId,
        studentName: student.user?.name || 'Unknown',
        overallRisk,
        riskScore: Math.round(riskScore),
        factors,
        recommendations,
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Calculate attendance risk
 */
async function calculateAttendanceRisk(studentId: string): Promise<RiskFactor> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendance = await prisma.attendance.findMany({
        where: { studentId, date: { gte: thirtyDaysAgo } },
    });

    const total = attendance.length || 1;
    const present = attendance.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    const rate = (present / total) * 100;

    let score: number;
    let level: RiskLevel;

    if (rate >= 90) { score = 0; level = 'low'; }
    else if (rate >= 75) { score = 30; level = 'medium'; }
    else if (rate >= 60) { score = 60; level = 'high'; }
    else { score = 90; level = 'critical'; }

    return {
        category: 'attendance',
        level,
        score,
        details: `Kehadiran ${rate.toFixed(1)}% (${present}/${total} hari)`,
        trend: 'stable',
    };
}

/**
 * Calculate academic risk
 */
async function calculateAcademicRisk(studentId: string): Promise<RiskFactor> {
    const grades = await prisma.grade.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    const avgScore = grades.length > 0
        ? grades.reduce((sum, g) => sum + Number(g.score), 0) / grades.length
        : 70;

    let score: number;
    let level: RiskLevel;

    if (avgScore >= 80) { score = 0; level = 'low'; }
    else if (avgScore >= 70) { score = 30; level = 'medium'; }
    else if (avgScore >= 60) { score = 60; level = 'high'; }
    else { score = 90; level = 'critical'; }

    return {
        category: 'academic',
        level,
        score,
        details: `Rata-rata nilai ${avgScore.toFixed(1)}`,
        trend: 'stable',
    };
}

/**
 * Calculate behavior risk
 */
async function calculateBehaviorRisk(studentId: string): Promise<RiskFactor> {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const violations = await prisma.violation.count({
        where: { studentId, occurredAt: { gte: sixtyDaysAgo } },
    });

    let score: number;
    let level: RiskLevel;

    if (violations === 0) { score = 0; level = 'low'; }
    else if (violations <= 2) { score = 30; level = 'medium'; }
    else if (violations <= 5) { score = 60; level = 'high'; }
    else { score = 90; level = 'critical'; }

    return {
        category: 'behavior',
        level,
        score,
        details: `${violations} pelanggaran dalam 60 hari`,
        trend: 'stable',
    };
}

/**
 * Calculate payment risk
 */
async function calculatePaymentRisk(studentId: string): Promise<RiskFactor> {
    const pendingInvoices = await prisma.invoice.count({
        where: { studentId, status: { in: ['PENDING', 'OVERDUE'] } },
    });

    const overdueInvoices = await prisma.invoice.count({
        where: { studentId, status: 'OVERDUE' },
    });

    let score: number;
    let level: RiskLevel;

    if (overdueInvoices > 2) { score = 90; level = 'critical'; }
    else if (overdueInvoices > 0) { score = 60; level = 'high'; }
    else if (pendingInvoices > 2) { score = 30; level = 'medium'; }
    else { score = 0; level = 'low'; }

    return {
        category: 'payment',
        level,
        score,
        details: `${pendingInvoices} tagihan pending, ${overdueInvoices} overdue`,
        trend: 'stable',
    };
}

/**
 * Calculate tahfidz risk
 */
async function calculateTahfidzRisk(studentId: string): Promise<RiskFactor> {
    const records = await prisma.tahfidzRecord.findMany({
        where: { studentId },
        orderBy: { recordedAt: 'desc' },
        take: 5,
    });

    const recentProgress = records.reduce((sum, r) => sum + r.totalAyah, 0);
    const isActive = records.length > 0;

    let score: number;
    let level: RiskLevel;

    if (!isActive) { score = 50; level = 'medium'; }
    else if (recentProgress >= 100) { score = 0; level = 'low'; }
    else if (recentProgress >= 50) { score = 20; level = 'low'; }
    else { score = 40; level = 'medium'; }

    return {
        category: 'tahfidz',
        level,
        score,
        details: `${recentProgress} ayat dalam periode terakhir`,
        trend: 'stable',
    };
}

/**
 * Convert score to risk level
 */
function scoreToRiskLevel(score: number): RiskLevel {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
}

/**
 * Generate recommendations based on risk factors
 */
function generateRecommendations(factors: RiskFactor[], overallRisk: RiskLevel): string[] {
    const recommendations: string[] = [];

    factors.forEach((factor) => {
        if (factor.level === 'critical' || factor.level === 'high') {
            switch (factor.category) {
                case 'attendance':
                    recommendations.push('Perlu komunikasi dengan wali/orang tua mengenai kehadiran');
                    break;
                case 'academic':
                    recommendations.push('Pertimbangkan program bimbingan tambahan');
                    break;
                case 'behavior':
                    recommendations.push('Jadwalkan sesi konseling dengan santri');
                    break;
                case 'payment':
                    recommendations.push('Hubungi orang tua untuk diskusi pembayaran');
                    break;
                case 'tahfidz':
                    recommendations.push('Evaluasi metode pembelajaran tahfidz');
                    break;
            }
        }
    });

    if (overallRisk === 'critical') {
        recommendations.unshift('⚠️ Prioritas tinggi: Perlu pertemuan segera dengan wali/orang tua');
    }

    return recommendations.length > 0
        ? recommendations
        : ['Santri menunjukkan perkembangan yang baik'];
}

/**
 * Get students at risk
 */
export async function getStudentsAtRisk(
    unitId?: string,
    minRiskLevel: RiskLevel = 'medium'
): Promise<StudentRiskAssessment[]> {
    const where: Record<string, unknown> = { status: 'ACTIVE' };
    if (unitId) where.unitId = unitId;

    const students = await prisma.student.findMany({
        where,
        select: { id: true },
        take: 100,
    });

    const assessments = await Promise.all(
        students.map((s) => calculateStudentRisk(s.id))
    );

    const riskOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const minOrder = riskOrder[minRiskLevel];

    return assessments
        .filter((a) => riskOrder[a.overallRisk] >= minOrder)
        .sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Get class risk summary
 */
export async function getClassRiskSummary(classId: string): Promise<{
    totalStudents: number;
    riskDistribution: Record<RiskLevel, number>;
    averageScore: number;
    topRisks: StudentRiskAssessment[];
}> {
    const students = await prisma.student.findMany({
        where: { enrollments: { some: { classId, status: 'active' } } },
        select: { id: true },
    });

    const assessments = await Promise.all(
        students.map((s) => calculateStudentRisk(s.id))
    );

    const riskDistribution: Record<RiskLevel, number> = {
        low: 0, medium: 0, high: 0, critical: 0,
    };

    assessments.forEach((a) => {
        riskDistribution[a.overallRisk]++;
    });

    const averageScore = assessments.length > 0
        ? assessments.reduce((sum, a) => sum + a.riskScore, 0) / assessments.length
        : 0;

    return {
        totalStudents: students.length,
        riskDistribution,
        averageScore: Math.round(averageScore),
        topRisks: assessments.filter((a) => a.overallRisk === 'high' || a.overallRisk === 'critical').slice(0, 5),
    };
}
