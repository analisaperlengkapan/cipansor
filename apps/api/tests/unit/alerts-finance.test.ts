
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkAndTriggerAlerts } from '../../src/modules/analytics/alerts.service';
import { prisma } from '../../src/lib/prisma';
import { NotificationType } from '@prisma/client';

// Mock dependencies
vi.mock('../../src/lib/prisma', () => ({
    prisma: {
        invoice: {
            findMany: vi.fn(),
            groupBy: vi.fn(),
        },
        student: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
        },
        grade: {
            findMany: vi.fn(),
        },
        violation: {
            groupBy: vi.fn(),
        },
        attendance: {
            findMany: vi.fn(),
        },
        $queryRaw: vi.fn(),
    },
}));

vi.mock('../../src/modules/notifications/service', () => ({
    createNotification: vi.fn(),
}));

vi.mock('../../src/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
    },
}));

describe('Finance Anomaly Detection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should detect statistical outliers (z-score > 2)', async () => {
        // Mock stats: Mean = 100,000, StdDev = 10,000
        (prisma.$queryRaw as any).mockResolvedValue([
            { payment_type_id: 'pt1', avg_val: 100000, stddev_val: 10000 }
        ]);

        // Mock findMany with implementation to handle different calls
        (prisma.invoice.findMany as any).mockImplementation((args: any) => {
            // Return empty for overdue check to avoid crashes/noise
            if (args?.where?.status === 'OVERDUE') {
                return Promise.resolve([]);
            }
            // Return data for anomaly check
            return Promise.resolve([
                {
                    id: 'inv1',
                    paymentTypeId: 'pt1',
                    amount: 130000, // Outlier
                    studentId: 's1',
                    student: { user: { name: 'Student 1', id: 'u1' } },
                    createdAt: new Date(),
                    invoiceNumber: 'INV-1'
                },
                {
                    id: 'inv2',
                    paymentTypeId: 'pt1',
                    amount: 110000, // Normal (z=1)
                    studentId: 's2',
                    student: { user: { name: 'Student 2', id: 'u2' } },
                    createdAt: new Date(),
                    invoiceNumber: 'INV-2'
                }
            ]);
        });

        // Mock groupBy to return no duplicates for this test case
        (prisma.invoice.groupBy as any).mockResolvedValue([]);

        // Mock other rules data to return empty
        (prisma.student.findMany as any).mockResolvedValue([]); // attendance
        (prisma.grade.findMany as any).mockResolvedValue([]); // academic
        (prisma.violation.groupBy as any).mockResolvedValue([]); // behavior

        const triggers = await checkAndTriggerAlerts();

        const anomalies = triggers.filter(t => t.ruleId === 'finance-anomaly');

        expect(anomalies).toHaveLength(1);
        expect(anomalies[0].studentName).toBe('Student 1');
        expect(anomalies[0].value).toBe(130000);
        expect(anomalies[0].message).toContain('Tagihan tidak wajar');
        expect(anomalies[0].message).toContain('Z-Score');
    });

    it('should detect duplicate invoices', async () => {
        // Mock stats to avoid outliers
        (prisma.$queryRaw as any).mockResolvedValue([
             { payment_type_id: 'pt1', avg_val: 100000, stddev_val: 10000 }
        ]);

        (prisma.invoice.findMany as any).mockImplementation((args: any) => {
            if (args?.where?.status === 'OVERDUE') {
                return Promise.resolve([]);
            }
            return Promise.resolve([]); // No recent invoices for outliers check in this test
        });

        // Mock groupBy to return duplicates
        (prisma.invoice.groupBy as any).mockResolvedValue([
            {
                studentId: 's1',
                paymentTypeId: 'pt1',
                amount: 50000,
                period: 'JAN',
                _count: { _all: 2 }
            }
        ]);

        (prisma.student.findUnique as any).mockResolvedValue({
            user: { name: 'Student 1', id: 'u1' }
        });

        // Mock other rules data to return empty
        (prisma.student.findMany as any).mockResolvedValue([]);
        (prisma.grade.findMany as any).mockResolvedValue([]);
        (prisma.violation.groupBy as any).mockResolvedValue([]);

        const triggers = await checkAndTriggerAlerts();

        const duplicates = triggers.filter(t => t.ruleId === 'finance-anomaly');

        expect(duplicates).toHaveLength(1);
        expect(duplicates[0].studentName).toBe('Student 1');
        expect(duplicates[0].value).toBe(2);
        expect(duplicates[0].message).toContain('Terdeteksi 2 tagihan duplikat');
    });
});
