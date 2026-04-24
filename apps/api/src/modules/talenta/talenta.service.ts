import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Errors } from '@/middleware/error';

/** Well-known UUID for the seeded SYSTEM user (see prisma/seed.ts) */
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

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

  async getProfileByUserId(userId: string) {
    return prisma.talentProfile.findUnique({
      where: { userId },
      select: { id: true, unitId: true },
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

  /**
   * Sync talent profile category based on the latest PKG evaluation.
   * Best Practice: Performance rating from PKG, Potential rating stays the same
   * or adjusted by HR.
   */
  async syncFromPKG(teacherId: string, periodId: string) {
    const evaluation = await prisma.pKGEvaluation.findUnique({
      where: { periodId_teacherId: { periodId, teacherId } },
      include: {
        teacher: { select: { userId: true, unitId: true } },
      },
    });

    if (!evaluation || !evaluation.totalScore) {
      throw Errors.notFound('PKG Evaluation with score');
    }

    const talentProfile = await prisma.talentProfile.findUnique({
      where: { userId: evaluation.teacher.userId },
      include: {
        assessments: {
          orderBy: { assessedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!talentProfile) {
      throw Errors.notFound('Talent Profile for teacher');
    }

    // Map PKG Score (0-100) to Rating
    const score = evaluation.totalScore.toNumber();
    let performanceRating: 'OUTSTANDING' | 'EXCEEDS' | 'MEETS' | 'BELOW' | 'UNSATISFACTORY';

    if (score >= 90) performanceRating = 'OUTSTANDING';
    else if (score >= 80) performanceRating = 'EXCEEDS';
    else if (score >= 70) performanceRating = 'MEETS';
    else if (score >= 60) performanceRating = 'BELOW';
    else performanceRating = 'UNSATISFACTORY';

    const latestAssessment = talentProfile.assessments[0];
    const potentialRating = latestAssessment?.potentialRating || 'MEETS';

    return this.createAssessment({
      talentId: talentProfile.id,
      assessorId: evaluation.assessorId || SYSTEM_USER_ID,
      period: `PKG Sync: ${periodId}`,
      performanceRating,
      potentialRating,
      overallScore: score,
      feedback: `Automated sync from PKG evaluation. Original score: ${score}`,
      assessedAt: new Date().toISOString(),
    });
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
      include: {
        currentHolder: { select: { id: true, name: true } },
        successor: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
  }

  /**
   * Automatically suggest potential successors based on Talent Matrix.
   * Filters by unit and talent category. When positionTitle is provided,
   * candidates whose currentRole contains the position keywords are ranked higher.
   */
  async suggestSuccessors(positionTitle: string, unitId: string) {
    // Fetch ALL eligible talent profiles first, then score and rank them.
    // Previously `take: 10` was applied BEFORE scoring, which could exclude
    // the best keyword matches if they weren't among the 10 most recently updated.
    const topTalents = await prisma.talentProfile.findMany({
      where: {
        unitId,
        category: { in: ['HIGH_POTENTIAL', 'KEY_TALENT'] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            trainingEnrollments: {
              where: { status: 'COMPLETED' },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Compute a basic keyword match score against the position title
    const positionKeywords = positionTitle
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    return topTalents.map((t) => {
      const roleWords = (t.currentRole || '').toLowerCase();
      const keywordMatches = positionKeywords.filter((kw) => roleWords.includes(kw)).length;
      const keywordBonus = positionKeywords.length > 0
        ? Math.round((keywordMatches / positionKeywords.length) * 10)
        : 0;

      const completedTrainings = t.user.trainingEnrollments?.length || 0;
      const trainingBonus = Math.min(15, completedTrainings * 5); // Max 15 points for training

      const baseScore = t.category === 'HIGH_POTENTIAL' ? 80 : 65;
      return {
        talentProfileId: t.id,
        name: t.user.name,
        currentRole: t.currentRole,
        category: t.category,
        readiness: t.category === 'HIGH_POTENTIAL' ? 'READY_NOW' : 'READY_IN_1_YEAR',
        matchScore: Math.min(100, baseScore + keywordBonus + trainingBonus),
      };
    }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
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

  async getCompetencyGap(userId: string, targetPositionId?: string) {
    const userProfile = await prisma.talentProfile.findUnique({
      where: { userId },
      include: {
        assessments: {
          orderBy: { assessedAt: 'desc' },
          take: 1,
        },
        user: {
          include: {
            orgPositions: {
              include: { orgUnit: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!userProfile) throw Errors.notFound('Talent profile');

    const targetPosition = targetPositionId
      ? await prisma.orgPosition.findUnique({ where: { id: targetPositionId } })
      : userProfile.user.orgPositions[0];

    if (!targetPosition || !targetPosition.requirements) {
      return { position: targetPosition?.title || null, gaps: [], matchScore: 100 };
    }

    // Requirements are stored as text (e.g., "Skill A, Skill B") or JSON.
    // If stored as JSON object with levels (e.g., {"Skill A": 3, "Skill B": 5}),
    // use those as per-competency target levels. Otherwise default to 4 (scale of 5).
    let requirements: string[];
    let requirementLevels: Record<string, number> = {};
    try {
      const parsed = JSON.parse(targetPosition.requirements);
      if (Array.isArray(parsed)) {
        requirements = parsed.map((r: any) => String(r).trim());
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Object format: {"Skill A": 3, "Skill B": 5}
        requirements = Object.keys(parsed).map((r) => r.trim());
        requirementLevels = Object.fromEntries(
          Object.entries(parsed).map(([k, v]) => [k.trim(), Number(v) || 4])
        );
      } else {
        requirements = targetPosition.requirements.split(',').map((r) => r.trim());
      }
    } catch {
      requirements = targetPosition.requirements.split(',').map((r) => r.trim());
    }
    requirements = requirements.filter((r) => r.length > 0);

    if (requirements.length === 0) {
      return { position: targetPosition.title, gaps: [], matchScore: 100 };
    }

    const userCompetencies = (userProfile.assessments[0]?.competencies as any) || {};
    const DEFAULT_TARGET_LEVEL = 4; // Default target on a scale of 5

    const gaps = requirements.map((req) => {
      const userLevel = userCompetencies[req] ?? 0;
      const targetLevel = requirementLevels[req] || DEFAULT_TARGET_LEVEL;
      return {
        competency: req,
        userLevel,
        targetLevel,
        gap: targetLevel - userLevel,
      };
    });

    const averageGap = gaps.reduce((sum, g) => sum + g.gap, 0) / gaps.length;
    const matchScore = Math.min(100, Math.max(0, 100 - averageGap * 20));

    return {
      position: targetPosition.title,
      gaps,
      matchScore,
    };
  }

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

    const validTotal = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    const total = validTotal;
    const percentages = Object.keys(distribution).reduce((acc, key) => {
      acc[key] = validTotal > 0 ? Math.round((distribution[key] / validTotal) * 100) : 0;
      return acc;
    }, {} as Record<string, number>);

    const ratingToScore: Record<string, number> = {
      OUTSTANDING: 100, EXCEEDS: 80, MEETS: 60, BELOW: 40, UNSATISFACTORY: 20,
    };

    const validCategories = new Set(Object.keys(distribution));

    const profiles = talentProfiles
      .filter((p) => p.category && validCategories.has(p.category))
      .map((p) => {
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
