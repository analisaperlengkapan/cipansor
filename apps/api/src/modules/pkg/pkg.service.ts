/**
 * PKG Service - Penilaian Kinerja Guru (Teacher Performance Evaluation)
 *
 * Implementasi sesuai Permendiknas No. 35 Tahun 2010
 * 4 Kompetensi Utama:
 * - Pedagogik: Kompetensi mengelola pembelajaran
 * - Kepribadian: Kompetensi pribadi yang mantap
 * - Sosial: Kompetensi interaksi sosial
 * - Profesional: Penguasaan materi pembelajaran
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';
import { seesGlobalPKGEvaluations } from '@/utils/resolve-unit-id';
import { Errors } from '@/middleware/error';

// PKG Indicators per Competency
export const PKG_INDICATORS = {
  PEDAGOGIK: [
    { code: 'P1', name: 'Mengenal karakteristik peserta didik' },
    { code: 'P2', name: 'Menguasai teori belajar dan prinsip-prinsip pembelajaran yang mendidik' },
    { code: 'P3', name: 'Pengembangan kurikulum' },
    { code: 'P4', name: 'Kegiatan pembelajaran yang mendidik' },
    { code: 'P5', name: 'Pengembangan potensi peserta didik' },
    { code: 'P6', name: 'Komunikasi dengan peserta didik' },
    { code: 'P7', name: 'Penilaian dan evaluasi' },
  ],
  KEPRIBADIAN: [
    {
      code: 'K1',
      name: 'Bertindak sesuai dengan norma agama, hukum, sosial dan kebudayaan nasional',
    },
    { code: 'K2', name: 'Menunjukkan pribadi yang dewasa dan teladan' },
    { code: 'K3', name: 'Etos kerja, tanggung jawab yang tinggi, rasa bangga menjadi guru' },
  ],
  SOSIAL: [
    { code: 'S1', name: 'Bersikap inklusif, bertindak objektif, serta tidak diskriminatif' },
    {
      code: 'S2',
      name: 'Komunikasi dengan sesama guru, tenaga kependidikan, orang tua, peserta didik, dan masyarakat',
    },
  ],
  PROFESIONAL: [
    {
      code: 'PR1',
      name: 'Penguasaan materi, struktur, konsep, dan pola pikir keilmuan yang mendukung mata pelajaran',
    },
    { code: 'PR2', name: 'Mengembangkan keprofesionalan melalui tindakan yang reflektif' },
  ],
};

// Status types
export const PKG_STATUS = [
  'DRAFT',
  'SELF_ASSESSMENT',
  'OBSERVATION',
  'REVIEW',
  'APPROVED',
] as const;
export const PERIOD_STATUS = ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'] as const;

// =====================================
// PERIOD MANAGEMENT
// =====================================

export interface CreatePeriodDto {
  unitId: string;
  academicYearId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  description?: string;
}

export async function createPeriod(data: CreatePeriodDto) {
  return prisma.pKGPeriod.create({
    data,
    include: {
      unit: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } },
    },
  });
}

export async function updatePeriod(
  id: string,
  data: Partial<Omit<CreatePeriodDto, 'unitId' | 'academicYearId'> & { status?: string }>
) {
  return prisma.pKGPeriod.update({
    where: { id },
    data,
    include: {
      unit: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } },
    },
  });
}

export async function deletePeriod(id: string) {
  // Delete all evaluations first
  await prisma.pKGEvaluation.deleteMany({ where: { periodId: id } });
  return prisma.pKGPeriod.delete({ where: { id } });
}

export async function listPeriods(params: {
  unitId?: string;
  academicYearId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { unitId, academicYearId, status, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.PKGPeriodWhereInput = {};
  if (unitId) where.unitId = unitId;
  if (academicYearId) where.academicYearId = academicYearId;
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.pKGPeriod.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        unit: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        _count: { select: { evaluations: true } },
      },
    }),
    prisma.pKGPeriod.count({ where }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getPeriodById(id: string) {
  return prisma.pKGPeriod.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } },
      evaluations: {
        include: {
          teacher: {
            select: {
              id: true,
              nip: true,
              user: { select: { name: true } },
            },
          },
          assessor: { select: { id: true, name: true } },
        },
      },
    },
  });
}

// =====================================
// EVALUATION MANAGEMENT
// =====================================

export interface CreateEvaluationDto {
  periodId: string;
  teacherId: string;
  assessorId?: string;
}

export async function createEvaluation(data: CreateEvaluationDto) {
  // Create evaluation with default details for all indicators
  const evaluation = await prisma.pKGEvaluation.create({
    data: {
      periodId: data.periodId,
      teacherId: data.teacherId,
      assessorId: data.assessorId,
    },
    include: {
      teacher: {
        select: { id: true, nip: true, user: { select: { name: true } } },
      },
      period: { select: { id: true, name: true } },
    },
  });

  // Create detail records for all indicators
  const details: any[] = [];
  for (const [competency, indicators] of Object.entries(PKG_INDICATORS)) {
    for (const indicator of indicators) {
      details.push({
        evaluationId: evaluation.id,
        competency,
        indicator: indicator.code,
        indicatorName: indicator.name,
      });
    }
  }

  await prisma.pKGDetail.createMany({ data: details });

  return evaluation;
}

export async function getEvaluation(id: string) {
  return prisma.pKGEvaluation.findUnique({
    where: { id },
    include: {
      period: { select: { id: true, name: true } },
      teacher: {
        select: {
          id: true,
          nip: true,
          user: { select: { name: true, email: true } },
        },
      },
      assessor: { select: { id: true, name: true } },
      details: { orderBy: [{ competency: 'asc' }, { indicator: 'asc' }] },
      documents: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function listEvaluations(params: {
  periodId?: string;
  teacherId?: string;
  unitId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { periodId, teacherId, unitId, status, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.PKGEvaluationWhereInput = {};
  if (periodId) where.periodId = periodId;
  if (teacherId) where.teacherId = teacherId;
  if (unitId) where.period = { unitId };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.pKGEvaluation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        period: { select: { id: true, name: true } },
        teacher: {
          select: {
            id: true,
            nip: true,
            user: { select: { name: true } },
          },
        },
        assessor: { select: { id: true, name: true } },
        _count: { select: { details: true, documents: true } },
      },
    }),
    prisma.pKGEvaluation.count({ where }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// =====================================
// SCORING
// =====================================

export interface SubmitScoreDto {
  detailId: string;
  selfScore?: number;
  assessorScore?: number;
  evidence?: string;
  notes?: string;
}

export async function submitScores(evaluationId: string, scores: SubmitScoreDto[]) {
  // Update each detail
  for (const score of scores) {
    await prisma.pKGDetail.update({
      where: { id: score.detailId },
      data: {
        selfScore: score.selfScore,
        assessorScore: score.assessorScore,
        finalScore: score.assessorScore ?? score.selfScore,
        evidence: score.evidence,
        notes: score.notes,
      },
    });
  }

  // Recalculate competency scores
  await calculateCompetencyScores(evaluationId);

  return getEvaluation(evaluationId);
}

export async function calculateCompetencyScores(evaluationId: string) {
  const details = await prisma.pKGDetail.findMany({
    where: { evaluationId },
  });

  // Group by competency and calculate average
  const competencyScores: Record<string, { sum: number; count: number }> = {};

  for (const detail of details) {
    if (detail.finalScore) {
      if (!competencyScores[detail.competency]) {
        competencyScores[detail.competency] = { sum: 0, count: 0 };
      }
      competencyScores[detail.competency].sum += detail.finalScore;
      competencyScores[detail.competency].count++;
    }
  }

  // Calculate averages (1-4 scale)
  const pedagogikScore = competencyScores.PEDAGOGIK
    ? competencyScores.PEDAGOGIK.sum / competencyScores.PEDAGOGIK.count
    : null;
  const kepribadianScore = competencyScores.KEPRIBADIAN
    ? competencyScores.KEPRIBADIAN.sum / competencyScores.KEPRIBADIAN.count
    : null;
  const sosialScore = competencyScores.SOSIAL
    ? competencyScores.SOSIAL.sum / competencyScores.SOSIAL.count
    : null;
  const profesionalScore = competencyScores.PROFESIONAL
    ? competencyScores.PROFESIONAL.sum / competencyScores.PROFESIONAL.count
    : null;

  // Calculate total score (0-100)
  let totalScore = null;
  let grade = null;
  let recommendation = null;

  const validScores = [pedagogikScore, kepribadianScore, sosialScore, profesionalScore].filter(
    (s) => s !== null
  );

  if (validScores.length === 4) {
    // Convert from 1-4 scale to 0-100
    const avgScore = validScores.reduce((a, b) => a! + b!, 0)! / 4;
    totalScore = ((avgScore - 1) / 3) * 100;

    // Determine grade
    if (totalScore >= 91) {
      grade = 'A';
      recommendation = 'LANJUT';
    } else if (totalScore >= 76) {
      grade = 'B';
      recommendation = 'LANJUT';
    } else if (totalScore >= 61) {
      grade = 'C';
      recommendation = 'PEMBINAAN';
    } else if (totalScore >= 51) {
      grade = 'D';
      recommendation = 'PKB';
    } else {
      grade = 'E';
      recommendation = 'PKB';
    }
  }

  // Update evaluation
  await prisma.pKGEvaluation.update({
    where: { id: evaluationId },
    data: {
      pedagogikScore,
      kepribadianScore,
      sosialScore,
      profesionalScore,
      totalScore,
      grade,
      recommendation,
    },
  });
}

// =====================================
// STATUS MANAGEMENT
// =====================================

export async function updateEvaluationStatus(id: string, status: string, _userId?: string) {
  const data: any = { status };

  // Set timestamps based on status
  if (status === 'SELF_ASSESSMENT') {
    data.selfAssessmentAt = new Date();
  } else if (status === 'OBSERVATION') {
    data.observedAt = new Date();
  } else if (status === 'APPROVED') {
    data.approvedAt = new Date();
  }

  return prisma.pKGEvaluation.update({
    where: { id },
    data,
    include: {
      teacher: {
        select: { id: true, nip: true, user: { select: { name: true } } },
      },
      period: { select: { id: true, name: true } },
    },
  });
}

// =====================================
// DOCUMENT MANAGEMENT
// =====================================

export async function addDocument(data: {
  evaluationId: string;
  name: string;
  type: string;
  fileUrl: string;
  fileSize?: number;
}) {
  return prisma.pKGDocument.create({ data });
}

export async function deleteDocument(id: string) {
  return prisma.pKGDocument.delete({ where: { id } });
}

// =====================================
// TEACHER PKG HISTORY
// =====================================

export async function getTeacherPKGHistory(teacherId: string) {
  return prisma.pKGEvaluation.findMany({
    where: { teacherId },
    orderBy: { createdAt: 'desc' },
    include: {
      period: {
        select: {
          id: true,
          name: true,
          academicYear: { select: { name: true } },
        },
      },
      assessor: { select: { id: true, name: true } },
    },
  });
}

// =====================================
// STATISTICS
// =====================================

export async function getPKGStatistics(params: {
  caller?: { roleCode?: string | null; role?: string | null; unitId?: string | null };
  unitId?: string;
  periodId?: string;
}) {
  const { caller, periodId } = params;

  let effectiveUnitId: string | undefined = params.unitId;

  if (caller) {
    const isGlobalRole = seesGlobalPKGEvaluations(caller.roleCode);
    if (!isGlobalRole && !caller.unitId) {
      throw Errors.forbidden('User does not belong to a specific unit and lacks global statistics access');
    }
    effectiveUnitId = isGlobalRole ? params.unitId : (caller.unitId ?? 'none');
  }

  const where: Prisma.PKGEvaluationWhereInput = {};
  if (periodId) where.periodId = periodId;
  if (effectiveUnitId) {
    where.period = { unitId: effectiveUnitId };
  }

  const evaluations = await prisma.pKGEvaluation.findMany({
    where,
    select: {
      status: true,
      grade: true,
      totalScore: true,
    },
  });

  const stats = {
    total: evaluations.length,
    byStatus: {} as Record<string, number>,
    byGrade: {} as Record<string, number>,
    averageScore: 0,
    completed: 0,
  };

  let scoreSum = 0;
  let scoreCount = 0;

  for (const e of evaluations) {
    stats.byStatus[e.status] = (stats.byStatus[e.status] || 0) + 1;
    if (e.grade) {
      stats.byGrade[e.grade] = (stats.byGrade[e.grade] || 0) + 1;
    }
    if (e.totalScore) {
      scoreSum += (e.totalScore as Decimal).toNumber();
      scoreCount++;
    }
    if (e.status === 'APPROVED') {
      stats.completed++;
    }
  }

  if (scoreCount > 0) {
    stats.averageScore = scoreSum / scoreCount;
  }

  return stats;
}

// =====================================
// BULK CREATE EVALUATIONS
// =====================================

export async function createBulkEvaluations(periodId: string, teacherIds: string[]) {
  const results = [];

  for (const teacherId of teacherIds) {
    // Check if already exists
    const existing = await prisma.pKGEvaluation.findUnique({
      where: { periodId_teacherId: { periodId, teacherId } },
    });

    if (!existing) {
      const evaluation = await createEvaluation({ periodId, teacherId });
      results.push(evaluation);
    }
  }

  return results;
}
