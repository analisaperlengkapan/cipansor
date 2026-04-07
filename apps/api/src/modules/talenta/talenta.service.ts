import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class TalentaService {
  // ==================== TALENT PROFILES ====================

  async createProfile(data: {
    userId: string;
    unitId: string;
    currentRole: string;
    category?: 'HIGH_POTENTIAL' | 'KEY_TALENT' | 'EMERGING' | 'SOLID_PERFORMER' | 'NEEDS_DEVELOPMENT';
    potentialRole?: string;
    readinessLevel?: string;
    strengths?: string;
    developmentAreas?: string;
    careerAspiration?: string;
  }) {
    return prisma.talentProfile.create({
      data: {
        user: { connect: { id: data.userId } },
        unitRel: { connect: { id: data.unitId } },
        currentRole: data.currentRole,
        category: data.category,
        potentialRole: data.potentialRole,
        readinessLevel: data.readinessLevel,
        strengths: data.strengths,
        developmentAreas: data.developmentAreas,
        careerAspiration: data.careerAspiration,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        unitRel: { select: { id: true, name: true } },
      },
    });
  }

  async getProfiles(unitId: string, query: { category?: string }) {
    const where: Prisma.TalentProfileWhereInput = { unitId };
    if (query.category) where.category = query.category as any;

    return prisma.talentProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        unitRel: { select: { id: true, name: true } },
        assessments: {
          orderBy: { assessedAt: 'desc' },
          take: 1,
          select: { performanceRating: true, potentialRating: true, overallScore: true, assessedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProfileById(id: string) {
    return prisma.talentProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        unitRel: { select: { id: true, name: true } },
        assessments: {
          include: { assessor: { select: { id: true, name: true } } },
          orderBy: { assessedAt: 'desc' },
        },
        succession: true,
      },
    });
  }

  async updateProfile(id: string, data: Prisma.TalentProfileUpdateInput) {
    return prisma.talentProfile.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async deleteProfile(id: string) {
    return prisma.talentProfile.delete({ where: { id } });
  }

  // ==================== ASSESSMENTS ====================

  async createAssessment(data: {
    talentId: string;
    assessorId: string;
    period: string;
    performanceRating: 'OUTSTANDING' | 'EXCEEDS' | 'MEETS' | 'BELOW' | 'UNSATISFACTORY';
    potentialRating: 'OUTSTANDING' | 'EXCEEDS' | 'MEETS' | 'BELOW' | 'UNSATISFACTORY';
    overallScore: number;
    competencies?: any;
    feedback?: string;
    developmentPlan?: string;
    assessedAt: string;
  }) {
    const assessment = await prisma.talentAssessment.create({
      data: {
        talent: { connect: { id: data.talentId } },
        assessor: { connect: { id: data.assessorId } },
        period: data.period,
        performanceRating: data.performanceRating,
        potentialRating: data.potentialRating,
        overallScore: data.overallScore,
        competencies: data.competencies,
        feedback: data.feedback,
        developmentPlan: data.developmentPlan,
        assessedAt: new Date(data.assessedAt),
      },
      include: {
        assessor: { select: { id: true, name: true } },
      },
    });

    // Update talent profile with latest assessment info
    const newCategory = this.determineTalentCategory(data.performanceRating, data.potentialRating);
    await prisma.talentProfile.update({
      where: { id: data.talentId },
      data: {
        category: newCategory,
        lastAssessedAt: new Date(data.assessedAt),
      },
    });

    return assessment;
  }

  // ==================== TRAINING PROGRAMS ====================

  async createTraining(data: {
    title: string;
    description?: string;
    category: string;
    trainer?: string;
    startDate?: string;
    endDate?: string;
    maxParticipants?: number;
    budget?: number;
    location?: string;
    unitId: string;
    createdById: string;
  }) {
    return prisma.trainingProgram.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        trainer: data.trainer,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        maxParticipants: data.maxParticipants,
        budget: data.budget ? new Prisma.Decimal(data.budget) : undefined,
        location: data.location,
        unitRel: { connect: { id: data.unitId } },
        createdBy: { connect: { id: data.createdById } },
      },
      include: {
        unitRel: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        enrollments: { select: { id: true, userId: true, status: true } },
      },
    });
  }

  async getTrainings(unitId: string, query: { status?: string }) {
    const where: Prisma.TrainingProgramWhereInput = { unitId };
    if (query.status) where.status = query.status as any;

    return prisma.trainingProgram.findMany({
      where,
      include: {
        unitRel: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        enrollments: { select: { id: true, userId: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTrainingById(id: string) {
    return prisma.trainingProgram.findUnique({
      where: { id },
      include: {
        unitRel: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        enrollments: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  }

  async updateTraining(id: string, data: any) {
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.budget !== undefined) updateData.budget = new Prisma.Decimal(data.budget);

    return prisma.trainingProgram.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteTraining(id: string) {
    return prisma.trainingProgram.delete({ where: { id } });
  }

  async enrollUser(programId: string, userId: string) {
    return prisma.trainingEnrollment.create({
      data: {
        program: { connect: { id: programId } },
        user: { connect: { id: userId } },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  // ==================== SUCCESSION PLANNING ====================

  async createSuccession(data: {
    positionTitle: string;
    currentHolderId?: string;
    successorId?: string;
    readinessLevel?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    notes?: string;
    targetDate?: string;
    unitId: string;
  }) {
    return prisma.successionPlan.create({
      data: {
        positionTitle: data.positionTitle,
        currentHolder: data.currentHolderId ? { connect: { id: data.currentHolderId } } : undefined,
        successor: data.successorId ? { connect: { id: data.successorId } } : undefined,
        readinessLevel: data.readinessLevel,
        priority: data.priority,
        notes: data.notes,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        unitRel: { connect: { id: data.unitId } },
      },
      include: {
        currentHolder: { select: { id: true, name: true } },
        successor: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async getSuccessions(unitId: string) {
    return prisma.successionPlan.findMany({
      where: { unitId },
      include: {
        currentHolder: { select: { id: true, name: true } },
        successor: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSuccessionById(id: string) {
    return prisma.successionPlan.findUnique({
      where: { id },
    });
  }

  async updateSuccession(id: string, data: any) {
    const updateData: any = { ...data };

    // Convert targetDate if provided
    if (data.targetDate) {
      updateData.targetDate = new Date(data.targetDate);
    } else if (data.targetDate === null) {
      updateData.targetDate = null;
    }

    // Handle relations
    if (data.currentHolderId !== undefined) {
      updateData.currentHolder = data.currentHolderId
        ? { connect: { id: data.currentHolderId } }
        : { disconnect: true };
      delete updateData.currentHolderId;
    }

    if (data.successorId !== undefined) {
      updateData.successor = data.successorId
        ? { connect: { id: data.successorId } }
        : { disconnect: true };
      delete updateData.successorId;
    }

    return prisma.successionPlan.update({
      where: { id },
      data: updateData,
      include: {
        currentHolder: { select: { id: true, name: true } },
        successor: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async deleteSuccession(id: string) {
    return prisma.successionPlan.delete({ where: { id } });
  }

  // ==================== ANALYTICS ====================

  async getTalentAnalytics(unitId: string) {
    const talentProfiles = await prisma.talentProfile.findMany({
      where: { unitId },
      select: {
        id: true,
        category: true,
        currentRole: true,
        user: { select: { id: true, name: true } },
        assessments: {
          orderBy: { assessedAt: 'desc' },
          take: 1,
          select: { performanceRating: true, potentialRating: true, overallScore: true },
        },
      },
    });

    const distribution: Record<string, number> = {
      HIGH_POTENTIAL: 0,
      KEY_TALENT: 0,
      EMERGING: 0,
      SOLID_PERFORMER: 0,
      NEEDS_DEVELOPMENT: 0,
    };

    talentProfiles.forEach((p) => {
      if (p.category && distribution[p.category] !== undefined) {
        distribution[p.category]++;
      }
    });

    const total = talentProfiles.length;
    const percentages = Object.keys(distribution).reduce((acc, key) => {
      acc[key] = total > 0 ? Math.round((distribution[key] / total) * 100) : 0;
      return acc;
    }, {} as Record<string, number>);

    const ratingToScore: Record<string, number> = {
      OUTSTANDING: 100, EXCEEDS: 80, MEETS: 60, BELOW: 40, UNSATISFACTORY: 20,
    };

    const profiles = talentProfiles.map((p) => {
      const latest = p.assessments[0];
      return {
        id: p.id,
        name: p.user.name,
        currentRole: p.currentRole,
        performanceScore: latest ? (ratingToScore[latest.performanceRating] || 0) : 0,
        potentialScore: latest ? (ratingToScore[latest.potentialRating] || 0) : 0,
        category: p.category || 'SOLID_PERFORMER',
      };
    });

    return {
      total,
      distribution,
      percentages,
      profiles,
    };
  }

  // ==================== HELPERS ====================

  private determineTalentCategory(
    performance: string,
    potential: string
  ): 'HIGH_POTENTIAL' | 'KEY_TALENT' | 'EMERGING' | 'SOLID_PERFORMER' | 'NEEDS_DEVELOPMENT' {
    const perfScore = { OUTSTANDING: 5, EXCEEDS: 4, MEETS: 3, BELOW: 2, UNSATISFACTORY: 1 }[performance] || 3;
    const potScore = { OUTSTANDING: 5, EXCEEDS: 4, MEETS: 3, BELOW: 2, UNSATISFACTORY: 1 }[potential] || 3;
    const combined = perfScore + potScore;

    if (combined >= 9) return 'HIGH_POTENTIAL';
    if (combined >= 7) return 'KEY_TALENT';
    if (combined >= 5) return 'EMERGING';
    if (combined >= 4) return 'SOLID_PERFORMER';
    return 'NEEDS_DEVELOPMENT';
  }
}

export const talentaService = new TalentaService();
