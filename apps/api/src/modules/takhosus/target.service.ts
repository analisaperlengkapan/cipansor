import { prisma } from '@/lib/prisma';
import { CreateTargetInput, UpdateTargetInput } from './takhosus.schema';

export class TargetService {
  /**
   * Create or update target for a student in an academic year
   */
  async createOrUpdate(input: CreateTargetInput) {
    // Check if target exists
    const existing = await prisma.tahfidzTarget.findUnique({
      where: {
        studentId_academicYearId: {
          studentId: input.studentId,
          academicYearId: input.academicYearId,
        },
      },
    });

    if (existing) {
      return prisma.tahfidzTarget.update({
        where: { id: existing.id },
        data: {
          targetJuz: input.targetJuz,
          targetAyah: input.targetAyah,
          notes: input.notes,
        } as any,
        include: {
          student: { select: { id: true, user: { select: { name: true } } } },
          academicYear: { select: { id: true, name: true } },
        },
      });
    }

    return prisma.tahfidzTarget.create({
      data: {
        studentId: input.studentId,
        academicYearId: input.academicYearId,
        targetJuz: input.targetJuz,
        targetAyah: input.targetAyah,
        notes: input.notes,
      } as any,
      include: {
        student: { select: { id: true, user: { select: { name: true } } } },
        academicYear: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Get target by student ID (and optional academic year)
   */
  async getByStudentId(studentId: string, academicYearId?: string) {
    const where: any = { studentId };
    if (academicYearId) {
      where.academicYearId = academicYearId;
    } else {
      // If no academic year provided, try to find the active one
      const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
      if (activeYear) {
        where.academicYearId = activeYear.id;
      }
    }

    return prisma.tahfidzTarget.findFirst({
      where,
      include: {
        academicYear: true,
      },
    });
  }

  /**
   * Get progress towards target
   */
  async getProgress(studentId: string) {
    // 1. Get Active Target
    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) return null;

    const target = await prisma.tahfidzTarget.findUnique({
      where: {
        studentId_academicYearId: {
          studentId,
          academicYearId: activeYear.id,
        },
      },
    });

    if (!target) return null;

    // 2. Get Current Achievement (Max Juz completed)
    // Logic: Count distinct juz where they passed an exam/tasmi
    const completedJuzList = await prisma.tahfidzRecord.findMany({
      where: {
        studentId,
        activityType: { in: ['ASSESSMENT', 'TASMI'] },
        score: { gte: 60 },
      },
      select: { juz: true },
      distinct: ['juz'],
    });

    const completedJuzCount = completedJuzList.length;

    // 3. Get total Ayah memorized (Ziyadah)
    const totalAyah = await prisma.tahfidzRecord.aggregate({
      where: { studentId, activityType: 'ZIYADAH' },
      _sum: { totalAyah: true },
    });

    return {
      targetJuz: target.targetJuz,
      completedJuz: completedJuzCount,
      totalAyahMemorized: totalAyah._sum.totalAyah || 0,
      percentage: Math.min(100, Math.round((completedJuzCount / target.targetJuz) * 100)),
      isOnTrack: completedJuzCount >= target.targetJuz, // Simplified logic
    };
  }
}

export const targetService = new TargetService();
