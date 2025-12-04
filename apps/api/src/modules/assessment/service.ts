import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import type {
  CreateExamInput,
  UpdateExamInput,
  ExamQuery,
  CreateGradeInput,
  UpdateGradeInput,
  BulkCreateGradesInput,
  GradeQuery,
  CreateReportCardInput,
  UpdateReportCardInput,
  ReportCardQuery,
} from './schema';

// =====================================
// EXAM SERVICES
// =====================================

export async function getExams(query: ExamQuery) {
  const { page, limit, unitId, academicYearId, subjectId, classId, teacherId, type, status, startDate, endDate } = query;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (unitId) where.unitId = unitId;
  if (academicYearId) where.academicYearId = academicYearId;
  if (subjectId) where.subjectId = subjectId;
  if (classId) where.classId = classId;
  if (teacherId) where.teacherId = teacherId;
  if (type) where.type = type;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.scheduledAt = {};
    if (startDate) where.scheduledAt.gte = new Date(startDate);
    if (endDate) where.scheduledAt.lte = new Date(endDate);
  }

  const [exams, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      skip,
      take: limit,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, level: true } },
        teacher: { include: { user: { select: { id: true, name: true } } } },
        _count: { select: { grades: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    }),
    prisma.exam.count({ where }),
  ]);

  return {
    data: exams,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getExamById(id: string) {
  return prisma.exam.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
      class: { select: { id: true, name: true, level: true } },
      teacher: { include: { user: { select: { id: true, name: true } } } },
      grades: {
        include: {
          student: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { score: 'desc' },
      },
    },
  });
}

export async function createExam(data: CreateExamInput) {
  return prisma.exam.create({
    data: {
      ...data,
      scheduledAt: new Date(data.scheduledAt),
      maxScore: new Decimal(data.maxScore),
      passingScore: new Decimal(data.passingScore),
      weight: new Decimal(data.weight),
      status: 'SCHEDULED',
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      class: { select: { id: true, name: true } },
      teacher: { include: { user: { select: { id: true, name: true } } } },
    },
  });
}

export async function updateExam(id: string, data: UpdateExamInput) {
  const updateData: any = { ...data };
  if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
  if (data.maxScore !== undefined) updateData.maxScore = new Decimal(data.maxScore);
  if (data.passingScore !== undefined) updateData.passingScore = new Decimal(data.passingScore);
  if (data.weight !== undefined) updateData.weight = new Decimal(data.weight);

  return prisma.exam.update({
    where: { id },
    data: updateData,
    include: {
      subject: { select: { id: true, name: true, code: true } },
      class: { select: { id: true, name: true } },
    },
  });
}

export async function deleteExam(id: string) {
  // First delete all grades for this exam
  await prisma.grade.deleteMany({ where: { examId: id } });
  return prisma.exam.delete({ where: { id } });
}

export async function updateExamStatus(id: string, status: string) {
  return prisma.exam.update({
    where: { id },
    data: { status: status as any },
  });
}

// =====================================
// GRADE SERVICES
// =====================================

function calculateLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'E';
}

export async function getGrades(query: GradeQuery) {
  const { page, limit, studentId, subjectId, examId, academicYearId, type } = query;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (studentId) where.studentId = studentId;
  if (subjectId) where.subjectId = subjectId;
  if (examId) where.examId = examId;
  if (academicYearId) where.academicYearId = academicYearId;
  if (type) where.type = type;

  const [grades, total] = await Promise.all([
    prisma.grade.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { include: { user: { select: { id: true, name: true } } } },
        subject: { select: { id: true, name: true, code: true } },
        exam: { select: { id: true, title: true, type: true } },
        gradedBy: { select: { id: true, name: true } },
      },
      orderBy: { gradedAt: 'desc' },
    }),
    prisma.grade.count({ where }),
  ]);

  return {
    data: grades,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getGradeById(id: string) {
  return prisma.grade.findUnique({
    where: { id },
    include: {
      student: { include: { user: { select: { id: true, name: true } } } },
      subject: { select: { id: true, name: true, code: true } },
      exam: { select: { id: true, title: true, type: true } },
      gradedBy: { select: { id: true, name: true } },
    },
  });
}

export async function createGrade(data: CreateGradeInput) {
  const percentage = (data.score / data.maxScore) * 100;
  const letterGrade = calculateLetterGrade(percentage);

  return prisma.grade.create({
    data: {
      ...data,
      score: new Decimal(data.score),
      maxScore: new Decimal(data.maxScore),
      percentage: new Decimal(percentage),
      letterGrade,
    },
    include: {
      student: { include: { user: { select: { id: true, name: true } } } },
      subject: { select: { id: true, name: true } },
    },
  });
}

export async function updateGrade(id: string, data: UpdateGradeInput) {
  const updateData: any = { ...data };
  
  if (data.score !== undefined && data.maxScore !== undefined) {
    const percentage = (data.score / data.maxScore) * 100;
    updateData.score = new Decimal(data.score);
    updateData.maxScore = new Decimal(data.maxScore);
    updateData.percentage = new Decimal(percentage);
    updateData.letterGrade = calculateLetterGrade(percentage);
  } else if (data.score !== undefined) {
    updateData.score = new Decimal(data.score);
  } else if (data.maxScore !== undefined) {
    updateData.maxScore = new Decimal(data.maxScore);
  }

  return prisma.grade.update({
    where: { id },
    data: updateData,
    include: {
      student: { include: { user: { select: { id: true, name: true } } } },
      subject: { select: { id: true, name: true } },
    },
  });
}

export async function deleteGrade(id: string) {
  return prisma.grade.delete({ where: { id } });
}

export async function bulkCreateGrades(data: BulkCreateGradesInput) {
  const grades = data.grades.map((g) => {
    const percentage = (g.score / data.maxScore) * 100;
    return {
      studentId: g.studentId,
      subjectId: data.subjectId,
      examId: data.examId,
      academicYearId: data.academicYearId,
      type: data.type,
      score: new Decimal(g.score),
      maxScore: new Decimal(data.maxScore),
      percentage: new Decimal(percentage),
      letterGrade: calculateLetterGrade(percentage),
      notes: g.notes,
      gradedById: data.gradedById,
    };
  });

  return prisma.grade.createMany({ data: grades as any });
}

export async function getStudentGrades(studentId: string, academicYearId?: string) {
  const where: any = { studentId };
  if (academicYearId) where.academicYearId = academicYearId;

  return prisma.grade.findMany({
    where,
    include: {
      subject: { select: { id: true, name: true, code: true } },
      exam: { select: { id: true, title: true, type: true } },
    },
    orderBy: [{ subjectId: 'asc' }, { gradedAt: 'desc' }],
  });
}

export async function getExamGrades(examId: string) {
  return prisma.grade.findMany({
    where: { examId },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true } },
        },
        select: { id: true, nis: true, userId: false, user: true } as any,
      },
    },
    orderBy: { score: 'desc' },
  });
}

// =====================================
// REPORT CARD SERVICES
// =====================================

export async function getReportCards(query: ReportCardQuery) {
  const { page, limit, studentId, classId, academicYearId, semester, isPublished } = query;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (studentId) where.studentId = studentId;
  if (classId) where.classId = classId;
  if (academicYearId) where.academicYearId = academicYearId;
  if (semester) where.semester = semester;
  if (isPublished !== undefined) where.isPublished = isPublished;

  const [reportCards, total] = await Promise.all([
    prisma.reportCard.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { include: { user: { select: { id: true, name: true } } } },
        class: { select: { id: true, name: true, level: true } },
        academicYear: { select: { id: true, name: true } },
        _count: { select: { details: true } },
      },
      orderBy: [{ academicYearId: 'desc' }, { semester: 'desc' }],
    }),
    prisma.reportCard.count({ where }),
  ]);

  return {
    data: reportCards,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getReportCardById(id: string) {
  return prisma.reportCard.findUnique({
    where: { id },
    include: {
      student: { include: { user: { select: { id: true, name: true } } } },
      class: { select: { id: true, name: true, level: true } },
      academicYear: { select: { id: true, name: true } },
      details: { orderBy: { subjectName: 'asc' } },
    },
  });
}

export async function createReportCard(data: CreateReportCardInput) {
  return prisma.reportCard.create({
    data,
    include: {
      student: { include: { user: { select: { id: true, name: true } } } },
      class: { select: { id: true, name: true } },
    },
  });
}

export async function updateReportCard(id: string, data: UpdateReportCardInput) {
  const updateData: any = { ...data };
  if (data.isPublished) {
    updateData.publishedAt = new Date();
  }

  return prisma.reportCard.update({
    where: { id },
    data: updateData,
    include: {
      student: { include: { user: { select: { id: true, name: true } } } },
      class: { select: { id: true, name: true } },
      details: true,
    },
  });
}

export async function deleteReportCard(id: string) {
  // Delete details first
  await prisma.reportCardDetail.deleteMany({ where: { reportCardId: id } });
  return prisma.reportCard.delete({ where: { id } });
}

export async function generateReportCard(studentId: string, classId: string, academicYearId: string, semester: number) {
  // Get all grades for this student in this academic year
  const grades = await prisma.grade.findMany({
    where: { studentId, academicYearId },
    include: { subject: true },
  });

  // Group grades by subject
  const gradesBySubject = grades.reduce((acc: any, grade) => {
    if (!acc[grade.subjectId]) {
      acc[grade.subjectId] = {
        subjectName: grade.subject.name,
        grades: [],
      };
    }
    acc[grade.subjectId].grades.push(grade);
    return acc;
  }, {});

  // Calculate averages per subject
  const details = Object.values(gradesBySubject).map((subjectData: any) => {
    const dailyGrades = subjectData.grades.filter((g: any) => g.type === 'EXAM' && g.exam?.type === 'DAILY_TEST');
    const midtermGrades = subjectData.grades.filter((g: any) => g.exam?.type === 'MIDTERM');
    const finalGrades = subjectData.grades.filter((g: any) => g.exam?.type === 'FINAL');

    const avgDaily = dailyGrades.length
      ? dailyGrades.reduce((sum: number, g: any) => sum + Number(g.percentage), 0) / dailyGrades.length
      : null;
    const avgMidterm = midtermGrades.length
      ? midtermGrades.reduce((sum: number, g: any) => sum + Number(g.percentage), 0) / midtermGrades.length
      : null;
    const avgFinal = finalGrades.length
      ? finalGrades.reduce((sum: number, g: any) => sum + Number(g.percentage), 0) / finalGrades.length
      : null;

    const allScores = [avgDaily, avgMidterm, avgFinal].filter((s) => s !== null);
    const avgScore = allScores.length ? allScores.reduce((a, b) => a! + b!, 0)! / allScores.length : null;

    return {
      subjectName: subjectData.subjectName,
      dailyScore: avgDaily ? new Decimal(avgDaily) : null,
      midtermScore: avgMidterm ? new Decimal(avgMidterm) : null,
      finalScore: avgFinal ? new Decimal(avgFinal) : null,
      averageScore: avgScore ? new Decimal(avgScore) : null,
      letterGrade: avgScore ? calculateLetterGrade(avgScore) : null,
    };
  });

  // Get attendance
  const attendance = await prisma.attendance.groupBy({
    by: ['status'],
    where: { studentId, class: { academicYearId } },
    _count: true,
  });

  const attendanceSummary = {
    present: attendance.find((a) => a.status === 'PRESENT')?._count || 0,
    absent: attendance.find((a) => a.status === 'ABSENT')?._count || 0,
    sick: attendance.find((a) => a.status === 'SICK')?._count || 0,
    excused: attendance.find((a) => a.status === 'EXCUSED')?._count || 0,
  };

  // Get tahfidz summary
  const tahfidz = await prisma.tahfidzRecord.findMany({
    where: { studentId },
    orderBy: { juz: 'desc' },
    take: 1,
  });

  const tahfidzSummary = tahfidz.length
    ? {
        lastJuz: tahfidz[0].juz,
        lastSurah: tahfidz[0].surahName,
        totalAyah: await prisma.tahfidzRecord.aggregate({
          where: { studentId, activityType: 'ZIYADAH' },
          _sum: { totalAyah: true },
        }).then((r) => r._sum.totalAyah || 0),
      }
    : null;

  // Calculate overall average and rank
  const overallAverage = details.length
    ? details
        .filter((d) => d.averageScore !== null)
        .reduce((sum, d) => sum + Number(d.averageScore), 0) / details.filter((d) => d.averageScore !== null).length
    : null;

  // Create or update report card
  const reportCard = await prisma.reportCard.upsert({
    where: {
      studentId_classId_academicYearId_semester: {
        studentId,
        classId,
        academicYearId,
        semester,
      },
    },
    create: {
      studentId,
      classId,
      academicYearId,
      semester,
      averageScore: overallAverage ? new Decimal(overallAverage) : null,
      attendance: attendanceSummary,
      tahfidzSummary: tahfidzSummary ?? undefined,
      details: { create: details as any },
    },
    update: {
      averageScore: overallAverage ? new Decimal(overallAverage) : null,
      attendance: attendanceSummary,
      tahfidzSummary: tahfidzSummary ?? undefined,
    },
    include: {
      student: { include: { user: { select: { id: true, name: true } } } },
      class: { select: { id: true, name: true } },
      details: true,
    },
  });

  // Update details if exists
  if (reportCard.id && details.length) {
    await prisma.reportCardDetail.deleteMany({ where: { reportCardId: reportCard.id } });
    await prisma.reportCardDetail.createMany({
      data: details.map((d) => ({ ...d, reportCardId: reportCard.id })) as any,
    });
  }

  return getReportCardById(reportCard.id);
}

export async function publishReportCard(id: string) {
  return prisma.reportCard.update({
    where: { id },
    data: { isPublished: true, publishedAt: new Date() },
  });
}
