import { prisma } from '../../lib/prisma';
import { Errors } from '../../middleware/error';
import {
  CreateCompetencyInput,
  UpdateCompetencyInput,
  CreateTrainingProgramInput,
  UpdateTrainingProgramInput,
  CreateEmployeeCompetencyInput,
  EnrollTrainingInput,
  UpdateEmployeeTrainingInput,
  CreatePerformanceReviewInput,
  UpdatePerformanceReviewInput,
} from './schema';

// =====================================
// COMPETENCY MANAGEMENT
// =====================================

export async function getCompetencies(params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}) {
  const { page, limit, search, category } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  if (category) {
    where.category = category;
  }

  const [data, total] = await Promise.all([
    prisma.competency.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.competency.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createCompetency(data: CreateCompetencyInput) {
  const existing = await prisma.competency.findUnique({
    where: { name: data.name },
  });
  if (existing) {
    throw Errors.badRequest('Competency with this name already exists');
  }

  return prisma.competency.create({ data: data as any });
}

export async function updateCompetency(id: string, data: UpdateCompetencyInput) {
  return prisma.competency.update({
    where: { id },
    data,
  });
}

// =====================================
// PERFORMANCE REVIEW MANAGEMENT
// =====================================

export async function createPerformanceReview(data: CreatePerformanceReviewInput) {
  // Check if active review exists for this cycle
  const existing = await prisma.performanceReview.findFirst({
    where: {
      userId: data.userId,
      cycleName: data.cycleName,
      status: { not: 'COMPLETED' },
    },
  });

  if (existing) {
    throw Errors.badRequest('An active review for this cycle already exists for the employee');
  }

  return prisma.performanceReview.create({
    data: {
      userId: data.userId,
      reviewerId: data.reviewerId,
      cycleName: data.cycleName,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      goals: data.goals,
    },
  });
}

export async function getPerformanceReviews(params: {
  page: number;
  limit: number;
  userId?: string;
  reviewerId?: string;
  cycleName?: string;
  status?: string;
}) {
  const { page, limit, userId, reviewerId, cycleName, status } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (userId) where.userId = userId;
  if (reviewerId) where.reviewerId = reviewerId;
  if (cycleName) where.cycleName = cycleName;
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.performanceReview.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startDate: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
      },
    }),
    prisma.performanceReview.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getReviewById(id: string) {
  return prisma.performanceReview.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true } },
    },
  });
}

export async function updatePerformanceReview(id: string, data: UpdatePerformanceReviewInput) {
  return prisma.performanceReview.update({
    where: { id },
    data,
  });
}

export async function deletePerformanceReview(id: string) {
  return prisma.performanceReview.delete({ where: { id } });
}

export async function deleteCompetency(id: string) {
  return prisma.competency.delete({ where: { id } });
}

// =====================================
// EMPLOYEE COMPETENCIES
// =====================================

export async function getEmployeeCompetencies(userId: string) {
  return prisma.employeeCompetency.findMany({
    where: { userId },
    include: {
      competency: true,
    },
  });
}

export async function addEmployeeCompetency(data: CreateEmployeeCompetencyInput) {
  return prisma.employeeCompetency.create({
    data: {
      userId: data.userId,
      competencyId: data.competencyId,
      proficiency: data.proficiency,
      targetLevel: data.targetLevel,
      notes: data.notes,
    },
  });
}

export async function updateEmployeeCompetency(id: string, data: { proficiency?: number; targetLevel?: number; notes?: string }) {
  return prisma.employeeCompetency.update({
    where: { id },
    data,
  });
}

export async function removeEmployeeCompetency(id: string) {
  return prisma.employeeCompetency.delete({ where: { id } });
}

// =====================================
// TRAINING MANAGEMENT
// =====================================

export async function getTrainingPrograms(params: {
  page: number;
  limit: number;
  search?: string;
}) {
  const { page, limit, search } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [data, total] = await Promise.all([
    prisma.trainingProgram.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startDate: 'desc' },
      include: {
        _count: { select: { participations: true } },
      },
    }),
    prisma.trainingProgram.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createTrainingProgram(data: CreateTrainingProgramInput) {
  return prisma.trainingProgram.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    } as any,
  });
}

export async function updateTrainingProgram(id: string, data: UpdateTrainingProgramInput) {
  return prisma.trainingProgram.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
}

export async function deleteTrainingProgram(id: string) {
  return prisma.trainingProgram.delete({ where: { id } });
}

// =====================================
// EMPLOYEE TRAINING
// =====================================

export async function enrollEmployeeToTraining(data: EnrollTrainingInput) {
  const existing = await prisma.employeeTraining.findUnique({
    where: {
      userId_trainingProgramId: {
        userId: data.userId,
        trainingProgramId: data.trainingProgramId,
      },
    },
  });

  if (existing) {
    throw Errors.badRequest('Employee is already enrolled in this training');
  }

  return prisma.employeeTraining.create({
    data: {
      userId: data.userId,
      trainingProgramId: data.trainingProgramId,
      status: data.status,
    },
  });
}

export async function getEmployeeTrainings(userId: string) {
  return prisma.employeeTraining.findMany({
    where: { userId },
    include: {
      program: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateEmployeeTraining(id: string, data: UpdateEmployeeTrainingInput) {
  return prisma.employeeTraining.update({
    where: { id },
    data,
  });
}
