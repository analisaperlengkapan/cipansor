import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

export class HigherEducationService {
  // --- Faculty ---
  async createFaculty(data: { unitId: string; name: string; code: string; description?: string; deanId?: string }) {
    return prisma.faculty.create({ data });
  }

  async getFaculties(unitId: string) {
    return prisma.faculty.findMany({
      where: { unitId },
      include: { programs: true },
    });
  }

  // --- Study Program ---
  async createStudyProgram(data: { facultyId: string; name: string; code: string; degree: string; accreditation?: string }) {
    return prisma.studyProgram.create({ data });
  }

  async getStudyPrograms(facultyId: string) {
    return prisma.studyProgram.findMany({
      where: { facultyId },
      include: { courses: true },
    });
  }

  // --- Course ---
  async createCourse(data: { programId: string; name: string; code: string; credits: number; semester: number; description?: string }) {
    return prisma.course.create({ data });
  }

  // --- Student Higher Ed ---
  async enrollStudent(data: { studentId: string; programId: string; nim: string }) {
    return prisma.studentHigherEd.create({
      data: {
        studentId: data.studentId,
        programId: data.programId,
        nim: data.nim,
      },
    });
  }

  // --- Krs ---
  async createKrs(data: { studentHeId: string; academicYearId: string; semester: number }) {
    return prisma.krs.create({
      data: {
        studentHeId: data.studentHeId,
        academicYearId: data.academicYearId,
        semester: data.semester,
      },
    });
  }

  async addCourseToKrs(krsId: string, classId: string) {
    return prisma.courseEnrollment.create({
      data: {
        krsId,
        classId,
      },
    });
  }

  async getStudentTranscript(studentHeId: string) {
    return prisma.courseEnrollment.findMany({
      where: {
        krs: { studentHeId },
        status: 'COMPLETED',
      },
      include: {
        class: {
          include: {
            course: true,
          },
        },
      },
    });
  }
}

export const higherEducationService = new HigherEducationService();
