import { describe, it, expect, beforeEach, vi } from 'vitest';
import { higherEducationService } from './higher-education.service';
import { prisma } from '../../lib/prisma';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    faculty: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    studyProgram: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    course: {
      create: vi.fn(),
    },
    studentHigherEd: {
      create: vi.fn(),
    },
    krs: {
      create: vi.fn(),
    },
    courseEnrollment: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('HigherEducationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a faculty', async () => {
    const facultyData = { unitId: 'unit-1', name: 'Fakultas Teknik', code: 'FT' };
    await higherEducationService.createFaculty(facultyData);
    expect(prisma.faculty.create).toHaveBeenCalledWith({ data: facultyData });
  });

  it('should create a study program', async () => {
    const programData = { facultyId: 'faculty-1', name: 'Informatika', code: 'IF', degree: 'S1' };
    await higherEducationService.createStudyProgram(programData);
    expect(prisma.studyProgram.create).toHaveBeenCalledWith({ data: programData });
  });

  it('should enroll a student', async () => {
    const enrollData = { studentId: 'student-1', programId: 'program-1', nim: '123456' };
    await higherEducationService.enrollStudent(enrollData);
    expect(prisma.studentHigherEd.create).toHaveBeenCalledWith({
      data: enrollData
    });
  });

  it('should create Krs', async () => {
    const krsData = { studentHeId: 'she-1', academicYearId: 'ay-1', semester: 1 };
    await higherEducationService.createKrs(krsData);
    expect(prisma.krs.create).toHaveBeenCalledWith({
      data: krsData
    });
  });
});
