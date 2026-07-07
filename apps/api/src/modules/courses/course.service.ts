import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class CourseService {
  async createCourse(data: {
    unitId: string;
    teacherId: string;
    title: string;
    description?: string;
    category: string;
    level?: string;
    price?: number;
    imageUrl?: string;
  }) {
    return prisma.course.create({
      data: {
        ...data,
        price: data.price ? new Prisma.Decimal(data.price) : undefined,
      },
    });
  }

  async getCourses(unitId: string, category?: string) {
    return prisma.course.findMany({
      where: {
        unitId,
        ...(category && { category }),
        isActive: true,
      },
      include: {
        teacher: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  async createModule(courseId: string, title: string, order: number) {
    return prisma.courseModule.create({
      data: {
        courseId,
        title,
        order,
      },
    });
  }

  async createLesson(moduleId: string, data: {
    title: string;
    content?: string;
    videoUrl?: string;
    attachmentUrl?: string;
    order: number;
  }) {
    return prisma.courseLesson.create({
      data: {
        moduleId,
        ...data,
      },
    });
  }

  async enrollUser(courseId: string, userId: string) {
    return prisma.courseEnrollment.create({
      data: {
        courseId,
        userId,
      },
    });
  }

  async completeLesson(lessonId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Mark lesson as completed
      const completion = await tx.lessonCompletion.upsert({
        where: { lessonId_userId: { lessonId, userId } },
        update: {},
        create: { lessonId, userId },
      });

      // 2. Calculate new progress
      const lesson = await tx.courseLesson.findUnique({
        where: { id: lessonId },
        include: { module: { include: { course: { include: { modules: { include: { lessons: true } } } } } } }
      });

      if (lesson) {
        const course = lesson.module.course;
        const totalLessons = course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);

        const completedCount = await tx.lessonCompletion.count({
          where: {
            userId,
            lesson: { module: { courseId: course.id } }
          }
        });

        const progress = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

        await tx.courseEnrollment.update({
          where: { courseId_userId: { courseId: course.id, userId } },
          data: {
            progress,
            ...(progress >= 100 ? { status: 'COMPLETED', completedAt: new Date() } : {})
          }
        });
      }

      return completion;
    });
  }

  async submitAssignment(assignmentId: string, userId: string, data: {
    content?: string;
    attachments?: string[];
  }) {
    return prisma.assignmentSubmission.create({
      data: {
        courseAssignmentId: assignmentId,
        userId,
        content: data.content,
        attachments: data.attachments || [],
        status: 'SUBMITTED',
      },
    });
  }
}

export const courseService = new CourseService();
