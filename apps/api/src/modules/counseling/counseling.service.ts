import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { UserRole, CounselingStatus, CounselingCategory, CounselingPriority, ReferralType, Prisma } from '@prisma/client';

// User type from JwtPayload
interface AuthenticatedUser {
  sub: string;
  role: UserRole;
  unitId: string | null;
}

interface SessionFilters {
  status?: CounselingStatus;
  category?: CounselingCategory;
  priority?: CounselingPriority;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}

export class CounselingService {
  /**
   * Get counseling sessions
   */
  async getSessions(filters: SessionFilters, currentUser: AuthenticatedUser) {
    const where: Prisma.CounselingSessionWhereInput = {};

    // Access control
    if (currentUser.role === UserRole.UNIT_ADMIN || currentUser.role === UserRole.TEACHER) {
      where.unitId = currentUser.unitId!;
    }

    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.priority) where.priority = filters.priority;
    if (filters.studentId) where.studentId = filters.studentId;
    
    if (filters.startDate || filters.endDate) {
      where.scheduledAt = {};
      if (filters.startDate) where.scheduledAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.scheduledAt.lte = new Date(filters.endDate);
    }

    const sessions = await prisma.counselingSession.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        counselor: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        unit: { select: { id: true, name: true } },
        _count: { select: { notes: true, referrals: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return sessions;
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string, currentUser: AuthenticatedUser) {
    const session = await prisma.counselingSession.findUnique({
      where: { id: sessionId },
      include: {
        student: {
          include: {
            user: true,
            enrollments: {
              where: { status: 'active' },
              include: { class: { select: { id: true, name: true } } },
            },
          },
        },
        counselor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        unit: { select: { id: true, name: true } },
        notes: {
          include: {
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        referrals: {
          include: {
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { referredAt: 'desc' },
        },
      },
    });

    if (!session) {
      throw Errors.notFound('Session not found');
    }

    // Access control
    if (currentUser.role !== UserRole.SUPER_ADMIN && session.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    return session;
  }

  /**
   * Create counseling session
   */
  async createSession(
    input: {
      studentId: string;
      category: CounselingCategory;
      priority?: CounselingPriority;
      title: string;
      description?: string;
      scheduledAt: string;
      duration?: number;
      location?: string;
      isConfidential?: boolean;
    },
    currentUser: AuthenticatedUser
  ) {
    // Get student to get unitId
    const student = await prisma.student.findUnique({
      where: { id: input.studentId, deletedAt: null },
    });

    if (!student) {
      throw Errors.notFound('Student not found');
    }

    // Get teacher ID for counselor
    const teacher = await prisma.teacher.findFirst({
      where: { userId: currentUser.sub },
    });

    if (!teacher) {
      throw Errors.forbidden('Only teachers can create counseling sessions');
    }

    const session = await prisma.counselingSession.create({
      data: {
        unitId: student.unitId,
        studentId: input.studentId,
        counselorId: teacher.id,
        category: input.category,
        priority: input.priority || CounselingPriority.MEDIUM,
        title: input.title,
        description: input.description,
        scheduledAt: new Date(input.scheduledAt),
        duration: input.duration,
        location: input.location,
        isConfidential: input.isConfidential ?? true,
        status: CounselingStatus.SCHEDULED,
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
        counselor: { include: { user: { select: { name: true } } } },
        unit: { select: { id: true, name: true } },
      },
    });

    return session;
  }

  /**
   * Update counseling session
   */
  async updateSession(
    sessionId: string,
    input: {
      category?: CounselingCategory;
      priority?: CounselingPriority;
      title?: string;
      description?: string;
      scheduledAt?: string;
      duration?: number;
      location?: string;
      status?: CounselingStatus;
      summary?: string;
      recommendations?: string;
      followUpDate?: string;
      isConfidential?: boolean;
      parentNotified?: boolean;
    },
    currentUser: AuthenticatedUser
  ) {
    const session = await prisma.counselingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw Errors.notFound('Session not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && session.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const updateData: Prisma.CounselingSessionUpdateInput = {};
    if (input.category) updateData.category = input.category;
    if (input.priority) updateData.priority = input.priority;
    if (input.title) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.scheduledAt) updateData.scheduledAt = new Date(input.scheduledAt);
    if (input.duration !== undefined) updateData.duration = input.duration;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.status) {
      updateData.status = input.status;
      if (input.status === CounselingStatus.IN_PROGRESS) {
        updateData.startedAt = new Date();
      } else if (input.status === CounselingStatus.COMPLETED) {
        updateData.endedAt = new Date();
      }
    }
    if (input.summary !== undefined) updateData.summary = input.summary;
    if (input.recommendations !== undefined) updateData.recommendations = input.recommendations;
    if (input.followUpDate) updateData.followUpDate = new Date(input.followUpDate);
    if (input.isConfidential !== undefined) updateData.isConfidential = input.isConfidential;
    if (input.parentNotified !== undefined) updateData.parentNotified = input.parentNotified;

    const updated = await prisma.counselingSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        student: { include: { user: { select: { name: true } } } },
        counselor: { include: { user: { select: { name: true } } } },
      },
    });

    return updated;
  }

  /**
   * Delete counseling session
   */
  async deleteSession(sessionId: string, currentUser: AuthenticatedUser) {
    const session = await prisma.counselingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw Errors.notFound('Session not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && session.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    await prisma.counselingSession.delete({
      where: { id: sessionId },
    });

    return { success: true };
  }

  /**
   * Add session note
   */
  async addNote(
    sessionId: string,
    input: { content: string; noteType?: string },
    currentUser: AuthenticatedUser
  ) {
    const session = await prisma.counselingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw Errors.notFound('Session not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && session.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const note = await prisma.counselingNote.create({
      data: {
        sessionId,
        content: input.content,
        noteType: input.noteType || 'general',
        createdById: currentUser.sub,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return note;
  }

  /**
   * Update session note
   */
  async updateNote(
    noteId: string,
    input: { content?: string; noteType?: string },
    currentUser: AuthenticatedUser
  ) {
    const note = await prisma.counselingNote.findUnique({
      where: { id: noteId },
      include: { session: true },
    });

    if (!note) {
      throw Errors.notFound('Note not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && note.session.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const updated = await prisma.counselingNote.update({
      where: { id: noteId },
      data: {
        content: input.content,
        noteType: input.noteType,
      },
    });

    return updated;
  }

  /**
   * Delete session note
   */
  async deleteNote(noteId: string, currentUser: AuthenticatedUser) {
    const note = await prisma.counselingNote.findUnique({
      where: { id: noteId },
      include: { session: true },
    });

    if (!note) {
      throw Errors.notFound('Note not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && note.session.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    await prisma.counselingNote.delete({ where: { id: noteId } });
    return { success: true };
  }

  /**
   * Add referral
   */
  async addReferral(
    sessionId: string,
    input: {
      type: ReferralType;
      referredTo: string;
      institution?: string;
      reason: string;
      contactInfo?: string;
      followUpDate?: string;
    },
    currentUser: AuthenticatedUser
  ) {
    const session = await prisma.counselingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw Errors.notFound('Session not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && session.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const referral = await prisma.counselingReferral.create({
      data: {
        sessionId,
        type: input.type,
        referredTo: input.referredTo,
        institution: input.institution,
        reason: input.reason,
        contactInfo: input.contactInfo,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
        createdById: currentUser.sub,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return referral;
  }

  /**
   * Update referral
   */
  async updateReferral(
    referralId: string,
    input: {
      type?: ReferralType;
      referredTo?: string;
      institution?: string;
      reason?: string;
      contactInfo?: string;
      followUpDate?: string;
      outcome?: string;
    },
    currentUser: AuthenticatedUser
  ) {
    const referral = await prisma.counselingReferral.findUnique({
      where: { id: referralId },
      include: { session: true },
    });

    if (!referral) {
      throw Errors.notFound('Referral not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && referral.session.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const updated = await prisma.counselingReferral.update({
      where: { id: referralId },
      data: {
        type: input.type,
        referredTo: input.referredTo,
        institution: input.institution,
        reason: input.reason,
        contactInfo: input.contactInfo,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
        outcome: input.outcome,
      },
    });

    return updated;
  }

  /**
   * Delete referral
   */
  async deleteReferral(referralId: string, currentUser: AuthenticatedUser) {
    const referral = await prisma.counselingReferral.findUnique({
      where: { id: referralId },
      include: { session: true },
    });

    if (!referral) {
      throw Errors.notFound('Referral not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && referral.session.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    await prisma.counselingReferral.delete({ where: { id: referralId } });
    return { success: true };
  }

  /**
   * Get student counseling history
   */
  async getStudentHistory(studentId: string, currentUser: AuthenticatedUser) {
    const student = await prisma.student.findUnique({
      where: { id: studentId, deletedAt: null },
    });

    if (!student) {
      throw Errors.notFound('Student not found');
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN && student.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const sessions = await prisma.counselingSession.findMany({
      where: { studentId },
      include: {
        counselor: { include: { user: { select: { name: true } } } },
        _count: { select: { notes: true, referrals: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return sessions;
  }

  /**
   * Get counselor sessions
   */
  async getCounselorSessions(currentUser: AuthenticatedUser) {
    const teacher = await prisma.teacher.findFirst({
      where: { userId: currentUser.sub },
    });

    if (!teacher) {
      return [];
    }

    const sessions = await prisma.counselingSession.findMany({
      where: { counselorId: teacher.id },
      include: {
        student: { include: { user: { select: { name: true } } } },
        unit: { select: { id: true, name: true } },
        _count: { select: { notes: true, referrals: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return sessions;
  }

  /**
   * Get statistics
   */
  async getStatistics(currentUser: AuthenticatedUser) {
    const where: Prisma.CounselingSessionWhereInput = {};

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      where.unitId = currentUser.unitId!;
    }

    const [totalSessions, byStatus, byCategory, byPriority] = await Promise.all([
      prisma.counselingSession.count({ where }),
      prisma.counselingSession.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.counselingSession.groupBy({
        by: ['category'],
        where,
        _count: { category: true },
      }),
      prisma.counselingSession.groupBy({
        by: ['priority'],
        where,
        _count: { priority: true },
      }),
    ]);

    return {
      totalSessions,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.status })),
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.category })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count.priority })),
    };
  }
}

export const counselingService = new CounselingService();
