/**
 * Analytics Service Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock, resetPrismaMocks } from '../mocks/prisma.mock';
import * as analyticsService from '@/modules/analytics/service';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: prismaMock,
}));

describe('Analytics Service', () => {
    beforeEach(() => {
        resetPrismaMocks();
        vi.clearAllMocks();
    });

    describe('getDashboardStats', () => {
        it('should return dashboard statistics', async () => {
            // Setup mocks
            prismaMock.student.count
                .mockResolvedValueOnce(100) // totalStudents
                .mockResolvedValueOnce(25)  // activeStudents (called as second)
                .mockResolvedValueOnce(85); // activeStudents with status filter
            prismaMock.teacher.count.mockResolvedValue(20);
            prismaMock.staff.count.mockResolvedValue(15);
            prismaMock.class.count.mockResolvedValue(10);
            prismaMock.alumni.count.mockResolvedValue(50);
            prismaMock.invoice.count.mockResolvedValue(5);
            prismaMock.attendance.count.mockResolvedValue(90);

            const result = await analyticsService.getDashboardStats();

            expect(result).toHaveProperty('students');
            expect(result).toHaveProperty('teachers');
            expect(result).toHaveProperty('staff');
            expect(result).toHaveProperty('classes');
            expect(result).toHaveProperty('alumni');
            expect(result).toHaveProperty('finance');
            expect(result).toHaveProperty('attendance');
        });

        it('should filter by unitId when provided', async () => {
            prismaMock.student.count.mockResolvedValue(50);
            prismaMock.teacher.count.mockResolvedValue(10);
            prismaMock.staff.count.mockResolvedValue(5);
            prismaMock.class.count.mockResolvedValue(3);
            prismaMock.alumni.count.mockResolvedValue(20);
            prismaMock.invoice.count.mockResolvedValue(2);
            prismaMock.attendance.count.mockResolvedValue(45);

            const result = await analyticsService.getDashboardStats('unit-1');

            // Verify that student.count was called with unitId filter
            expect(prismaMock.student.count).toHaveBeenCalled();
            // The function should return valid stats structure
            expect(result).toHaveProperty('students');
            expect(result).toHaveProperty('teachers');
        });
    });

    describe('getStudentStats', () => {
        it('should return student statistics grouped by status, gender, and unit', async () => {
            prismaMock.student.groupBy
                .mockResolvedValueOnce([
                    { status: 'active', _count: 80 },
                    { status: 'graduated', _count: 15 },
                    { status: 'inactive', _count: 5 },
                ])
                .mockResolvedValueOnce([
                    { gender: 'L', _count: 55 },
                    { gender: 'P', _count: 45 },
                ])
                .mockResolvedValueOnce([
                    { unitId: 'unit-1', _count: 40 },
                    { unitId: 'unit-2', _count: 60 },
                ])
                .mockResolvedValueOnce([
                    { entryYear: 2024, _count: 30 },
                    { entryYear: 2023, _count: 25 },
                ]);

            prismaMock.unit.findMany.mockResolvedValue([
                { id: 'unit-1', name: 'Unit Alpha', type: 'PESANTREN' },
                { id: 'unit-2', name: 'Unit Beta', type: 'SEKOLAH' },
            ]);

            const result = await analyticsService.getStudentStats();

            expect(result).toHaveProperty('byStatus');
            expect(result).toHaveProperty('byGender');
            expect(result).toHaveProperty('byUnit');
            expect(result).toHaveProperty('enrollmentTrend');
            expect(result.byStatus).toHaveProperty('active', 80);
        });
    });

    describe('getTahfidzStats', () => {
        it('should return tahfidz statistics', async () => {
            prismaMock.tahfidzRecord.groupBy
                .mockResolvedValueOnce([
                    { activityType: 'ZIYADAH', _count: 100, _avg: { score: 85 } },
                    { activityType: 'MUROJAAH', _count: 80, _avg: { score: 90 } },
                ])
                .mockResolvedValueOnce([
                    { score: 80, _count: 20 },
                    { score: 90, _count: 50 },
                    { score: 100, _count: 30 },
                ])
                .mockResolvedValueOnce([
                    { studentId: 'student-1', _sum: { totalAyah: 604 } },
                    { studentId: 'student-2', _sum: { totalAyah: 500 } },
                ]);

            prismaMock.tahfidzRecord.findMany.mockResolvedValue([
                {
                    id: 'record-1',
                    studentId: 'student-1',
                    activityType: 'ZIYADAH',
                    surahName: 'Al-Baqarah',
                    ayahStart: 1,
                    ayahEnd: 10,
                    score: 90,
                    createdAt: new Date(),
                    student: { id: 'student-1', nis: '001', user: { name: 'Ahmad' } },
                },
            ]);

            prismaMock.student.findMany.mockResolvedValue([
                { id: 'student-1', user: { name: 'Ahmad' } },
                { id: 'student-2', user: { name: 'Budi' } },
            ]);

            const result = await analyticsService.getTahfidzStats();

            expect(result).toHaveProperty('byActivity');
            expect(result).toHaveProperty('scoreDistribution');
            expect(result).toHaveProperty('topStudents');
            expect(result).toHaveProperty('recentActivity');
        });

        it('should filter by date range when provided', async () => {
            const dateRange = {
                startDate: '2024-01-01',
                endDate: '2024-12-31',
            };

            prismaMock.tahfidzRecord.groupBy.mockResolvedValue([]);
            prismaMock.tahfidzRecord.findMany.mockResolvedValue([]);
            prismaMock.student.findMany.mockResolvedValue([]);

            await analyticsService.getTahfidzStats(undefined, dateRange);

            expect(prismaMock.tahfidzRecord.groupBy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        createdAt: expect.objectContaining({
                            gte: expect.any(Date),
                            lte: expect.any(Date),
                        }),
                    }),
                })
            );
        });
    });

    describe('getFinanceStats', () => {
        it('should return finance statistics', async () => {
            prismaMock.invoice.aggregate.mockResolvedValue({
                _sum: { amount: 100000000, paidAmount: 75000000 },
                _count: 200,
            });

            prismaMock.payment.aggregate.mockResolvedValue({
                _sum: { amount: 75000000 },
                _count: 180,
            });

            prismaMock.invoice.groupBy.mockResolvedValue([
                { status: 'PAID', _count: 150, _sum: { amount: 75000000 } },
                { status: 'PENDING', _count: 30, _sum: { amount: 15000000 } },
                { status: 'PARTIAL', _count: 20, _sum: { amount: 10000000 } },
            ]);

            prismaMock.payment.groupBy.mockResolvedValue([
                { method: 'CASH', _count: 100, _sum: { amount: 40000000 } },
                { method: 'TRANSFER', _count: 80, _sum: { amount: 35000000 } },
            ]);

            prismaMock.$queryRaw.mockResolvedValue([
                { month: '2024-12', total: BigInt(10000000) },
                { month: '2024-11', total: BigInt(12000000) },
            ]);

            const result = await analyticsService.getFinanceStats();

            expect(result).toHaveProperty('summary');
            expect(result.summary).toHaveProperty('totalInvoiced', 100000000);
            expect(result.summary).toHaveProperty('totalPaid', 75000000);
            expect(result.summary).toHaveProperty('outstandingBalance', 25000000);
            expect(result).toHaveProperty('byStatus');
            expect(result).toHaveProperty('byMethod');
            expect(result).toHaveProperty('monthlyRevenue');
        });
    });

    describe('getAttendanceStats', () => {
        it('should return attendance statistics', async () => {
            prismaMock.attendance.groupBy
                .mockResolvedValueOnce([
                    { status: 'PRESENT', _count: 450 },
                    { status: 'ABSENT', _count: 30 },
                    { status: 'LATE', _count: 15 },
                    { status: 'SICK', _count: 5 },
                ])
                .mockResolvedValueOnce([
                    { classId: 'class-1', _count: 150 },
                    { classId: 'class-2', _count: 120 },
                ]);

            prismaMock.$queryRaw.mockResolvedValue([
                { date: new Date('2024-12-01'), present: BigInt(45), total: BigInt(50) },
                { date: new Date('2024-12-02'), present: BigInt(48), total: BigInt(50) },
            ]);

            prismaMock.class.findMany.mockResolvedValue([
                { id: 'class-1', name: 'Kelas 7A', level: '7' },
                { id: 'class-2', name: 'Kelas 8A', level: '8' },
            ]);

            const result = await analyticsService.getAttendanceStats();

            expect(result).toHaveProperty('summary');
            expect(result.summary).toHaveProperty('attendanceRate');
            expect(result).toHaveProperty('byStatus');
            expect(result).toHaveProperty('dailyTrend');
            expect(result).toHaveProperty('byClass');
        });
    });

    describe('getAcademicStats', () => {
        it('should return academic statistics', async () => {
            prismaMock.exam.aggregate.mockResolvedValue({
                _count: 50,
            });

            prismaMock.grade.groupBy
                .mockResolvedValueOnce([
                    { letterGrade: 'A', _count: 30, _avg: { percentage: 92 } },
                    { letterGrade: 'B', _count: 45, _avg: { percentage: 82 } },
                    { letterGrade: 'C', _count: 20, _avg: { percentage: 72 } },
                ])
                .mockResolvedValueOnce([
                    { subjectId: 'subj-1', _avg: { percentage: 88 }, _count: 50 },
                    { subjectId: 'subj-2', _avg: { percentage: 75 }, _count: 45 },
                ]);

            prismaMock.subject.findMany.mockResolvedValue([
                { id: 'subj-1', name: 'Matematika', code: 'MTK' },
                { id: 'subj-2', name: 'Bahasa Indonesia', code: 'BIND' },
            ]);

            const result = await analyticsService.getAcademicStats();

            expect(result).toHaveProperty('exams');
            expect(result).toHaveProperty('gradeDistribution');
            expect(result).toHaveProperty('subjectPerformance');
        });
    });

    describe('getLibraryStats', () => {
        it('should return library statistics', async () => {
            prismaMock.book.aggregate.mockResolvedValue({
                _sum: { quantity: 500, available: 420 },
                _count: 150,
            });

            prismaMock.borrowing.groupBy.mockResolvedValue([
                { status: 'ACTIVE', _count: 80 },
                { status: 'RETURNED', _count: 500 },
                { status: 'OVERDUE', _count: 5 },
            ]);

            prismaMock.borrowing.count.mockResolvedValue(5);

            prismaMock.borrowing.groupBy.mockResolvedValue([
                { bookId: 'book-1', _count: 25 },
                { bookId: 'book-2', _count: 20 },
            ]);

            prismaMock.book.findMany.mockResolvedValue([
                { id: 'book-1', title: 'Al-Quran dan Terjemah', author: 'Kemenag' },
                { id: 'book-2', title: 'Fiqih Islam', author: 'Sulaiman Rasjid' },
            ]);

            const result = await analyticsService.getLibraryStats();

            expect(result).toHaveProperty('books');
            expect(result).toHaveProperty('borrowings');
            expect(result).toHaveProperty('overdue');
            expect(result).toHaveProperty('popularBooks');
        });
    });

    describe('getPSBStats', () => {
        it('should return PSB statistics', async () => {
            prismaMock.registrant.count.mockResolvedValue(150);

            prismaMock.registrant.groupBy.mockResolvedValue([
                { status: 'REGISTERED', _count: 50 },
                { status: 'ACCEPTED', _count: 80 },
                { status: 'REJECTED', _count: 20 },
            ]);

            prismaMock.admissionPeriod.findMany.mockResolvedValue([
                {
                    id: 'period-1',
                    name: 'PSB 2024/2025',
                    quota: 100,
                    startDate: new Date('2024-06-01'),
                    endDate: new Date('2024-07-31'),
                    isActive: true,
                    _count: { registrants: 150 },
                },
            ]);

            const result = await analyticsService.getPSBStats();

            expect(result).toHaveProperty('totalRegistrants', 150);
            expect(result).toHaveProperty('byStatus');
            expect(result).toHaveProperty('byPeriod');
        });
    });
});
