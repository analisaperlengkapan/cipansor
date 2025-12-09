/**
 * Automated Alert System Service
 * Triggers alerts based on student/payment thresholds
 */

import { prisma } from '@/lib/prisma';
import { createNotification } from '@/modules/notifications/service';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';

export interface AlertRule {
    id: string;
    name: string;
    type: 'attendance' | 'payment' | 'academic' | 'behavior';
    threshold: number;
    operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
    action: 'notify' | 'email' | 'whatsapp' | 'all';
    recipients: 'parent' | 'teacher' | 'admin' | 'all';
    enabled: boolean;
}

export interface AlertTrigger {
    ruleId: string;
    studentId: string;
    studentName: string;
    value: number;
    threshold: number;
    message: string;
    triggeredAt: string;
}

// Default alert rules
const DEFAULT_RULES: AlertRule[] = [
    {
        id: 'low-attendance',
        name: 'Kehadiran Rendah',
        type: 'attendance',
        threshold: 75,
        operator: 'lt',
        action: 'notify',
        recipients: 'parent',
        enabled: true,
    },
    {
        id: 'payment-overdue',
        name: 'Pembayaran Terlambat',
        type: 'payment',
        threshold: 7,
        operator: 'gt',
        action: 'all',
        recipients: 'parent',
        enabled: true,
    },
    {
        id: 'low-grades',
        name: 'Nilai Rendah',
        type: 'academic',
        threshold: 60,
        operator: 'lt',
        action: 'notify',
        recipients: 'parent',
        enabled: true,
    },
    {
        id: 'multiple-violations',
        name: 'Pelanggaran Berulang',
        type: 'behavior',
        threshold: 3,
        operator: 'gte',
        action: 'notify',
        recipients: 'all',
        enabled: true,
    },
];

/**
 * Check all alert rules and trigger notifications
 */
export async function checkAndTriggerAlerts(): Promise<AlertTrigger[]> {
    const triggers: AlertTrigger[] = [];

    for (const rule of DEFAULT_RULES) {
        if (!rule.enabled) continue;

        const ruleTriggers = await checkRule(rule);
        triggers.push(...ruleTriggers);
    }

    return triggers;
}

/**
 * Check a specific rule
 */
async function checkRule(rule: AlertRule): Promise<AlertTrigger[]> {
    const triggers: AlertTrigger[] = [];

    switch (rule.type) {
        case 'attendance':
            triggers.push(...(await checkAttendanceRule(rule)));
            break;
        case 'payment':
            triggers.push(...(await checkPaymentRule(rule)));
            break;
        case 'academic':
            triggers.push(...(await checkAcademicRule(rule)));
            break;
        case 'behavior':
            triggers.push(...(await checkBehaviorRule(rule)));
            break;
    }

    return triggers;
}

/**
 * Check attendance rule
 */
async function checkAttendanceRule(rule: AlertRule): Promise<AlertTrigger[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const students = await prisma.student.findMany({
        where: { status: 'ACTIVE' },
        select: {
            id: true,
            user: { select: { id: true, name: true } },
            _count: {
                select: {
                    attendance: { where: { date: { gte: thirtyDaysAgo } } },
                },
            },
        },
    });

    const triggers: AlertTrigger[] = [];

    for (const student of students) {
        const attendance = await prisma.attendance.findMany({
            where: { studentId: student.id, date: { gte: thirtyDaysAgo } },
        });

        const total = attendance.length || 1;
        const present = attendance.filter((a) => a.status === 'present').length;
        const rate = (present / total) * 100;

        if (compareValue(rate, rule.threshold, rule.operator)) {
            const trigger: AlertTrigger = {
                ruleId: rule.id,
                studentId: student.id,
                studentName: student.user?.name || 'Unknown',
                value: rate,
                threshold: rule.threshold,
                message: `Kehadiran ${student.user?.name} hanya ${rate.toFixed(1)}% dalam 30 hari terakhir`,
                triggeredAt: new Date().toISOString(),
            };
            triggers.push(trigger);

            // Send notification
            if (student.user?.id) {
                await sendAlertNotification(rule, trigger, student.user.id);
            }
        }
    }

    return triggers;
}

/**
 * Check payment rule
 */
async function checkPaymentRule(rule: AlertRule): Promise<AlertTrigger[]> {
    const overdueInvoices = await prisma.invoice.findMany({
        where: {
            status: 'OVERDUE',
            dueDate: { lte: new Date() },
        },
        include: {
            student: {
                include: { user: { select: { id: true, name: true } } },
            },
        },
    });

    const triggers: AlertTrigger[] = [];

    for (const invoice of overdueInvoices) {
        const daysOverdue = Math.floor(
            (Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (compareValue(daysOverdue, rule.threshold, rule.operator)) {
            const trigger: AlertTrigger = {
                ruleId: rule.id,
                studentId: invoice.studentId,
                studentName: invoice.student?.user?.name || 'Unknown',
                value: daysOverdue,
                threshold: rule.threshold,
                message: `Tagihan ${invoice.invoiceNumber} sudah ${daysOverdue} hari melewati jatuh tempo`,
                triggeredAt: new Date().toISOString(),
            };
            triggers.push(trigger);

            if (invoice.student?.user?.id) {
                await sendAlertNotification(rule, trigger, invoice.student.user.id);
            }
        }
    }

    return triggers;
}

/**
 * Check academic rule
 */
async function checkAcademicRule(rule: AlertRule): Promise<AlertTrigger[]> {
    const recentGrades = await prisma.grade.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        include: {
            student: {
                include: { user: { select: { id: true, name: true } } },
            },
            subject: { select: { name: true } },
        },
    });

    const triggers: AlertTrigger[] = [];

    for (const grade of recentGrades) {
        if (compareValue(grade.score, rule.threshold, rule.operator)) {
            const trigger: AlertTrigger = {
                ruleId: rule.id,
                studentId: grade.studentId,
                studentName: grade.student?.user?.name || 'Unknown',
                value: grade.score,
                threshold: rule.threshold,
                message: `Nilai ${grade.subject?.name} ${grade.student?.user?.name}: ${grade.score}`,
                triggeredAt: new Date().toISOString(),
            };
            triggers.push(trigger);

            if (grade.student?.user?.id) {
                await sendAlertNotification(rule, trigger, grade.student.user.id);
            }
        }
    }

    return triggers;
}

/**
 * Check behavior rule
 */
async function checkBehaviorRule(rule: AlertRule): Promise<AlertTrigger[]> {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const violationCounts = await prisma.violation.groupBy({
        by: ['studentId'],
        where: { date: { gte: sixtyDaysAgo } },
        _count: true,
    });

    const triggers: AlertTrigger[] = [];

    for (const vc of violationCounts) {
        if (compareValue(vc._count, rule.threshold, rule.operator)) {
            const student = await prisma.student.findUnique({
                where: { id: vc.studentId },
                include: { user: { select: { id: true, name: true } } },
            });

            const trigger: AlertTrigger = {
                ruleId: rule.id,
                studentId: vc.studentId,
                studentName: student?.user?.name || 'Unknown',
                value: vc._count,
                threshold: rule.threshold,
                message: `${student?.user?.name} memiliki ${vc._count} pelanggaran dalam 60 hari`,
                triggeredAt: new Date().toISOString(),
            };
            triggers.push(trigger);

            if (student?.user?.id) {
                await sendAlertNotification(rule, trigger, student.user.id);
            }
        }
    }

    return triggers;
}

/**
 * Compare value with threshold
 */
function compareValue(value: number, threshold: number, operator: AlertRule['operator']): boolean {
    switch (operator) {
        case 'lt': return value < threshold;
        case 'lte': return value <= threshold;
        case 'gt': return value > threshold;
        case 'gte': return value >= threshold;
        case 'eq': return value === threshold;
        default: return false;
    }
}

/**
 * Send alert notification
 */
async function sendAlertNotification(
    rule: AlertRule,
    trigger: AlertTrigger,
    userId: string
): Promise<void> {
    try {
        await createNotification({
            userId,
            title: `⚠️ ${rule.name}`,
            message: trigger.message,
            type: NotificationType.ALERT,
        });
        logger.info(`Alert sent: ${rule.name} for ${trigger.studentName}`);
    } catch (error) {
        logger.error('Failed to send alert notification:', error);
    }
}

/**
 * Get alert rules
 */
export function getAlertRules(): AlertRule[] {
    return DEFAULT_RULES;
}

/**
 * Get recent alerts
 */
export async function getRecentAlerts(limit: number = 50): Promise<AlertTrigger[]> {
    // In production, this would query from a stored alerts table
    return [];
}
