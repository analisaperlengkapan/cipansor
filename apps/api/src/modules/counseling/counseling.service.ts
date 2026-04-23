import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import {
  RoleCode,
  CounselingStatus,
  CounselingCategory,
  CounselingPriority,
  ReferralType,
  Prisma,
} from '@prisma/client';
import { isAdminRoleCode } from '@/middleware/auth';
import { createNotification } from '../notifications/service';
import {
  CounselingSession as SharedCounselingSession,
  CounselingNote as SharedCounselingNote,
  CounselingReferral as SharedCounselingReferral,
  CounselingStats as SharedCounselingStats,
  CreateCounselingSessionInput,
  UpdateCounselingSessionInput,
  CreateCounselingNoteInput,
  CreateCounselingReferralInput,
  CounselingListParams,
} from '@cipansor/shared';

// User type from JwtPayload (aligned with new RoleCode-based auth)
interface AuthenticatedUser {
  sub: string;
  roleCode: string;
  unitId: string | null;
}

export class CounselingService {
  /**
   * Get counseling sessions
   */
  async getSessions(filters: CounselingListParams, currentUser: AuthenticatedUser) {
    const where: Prisma.CounselingSessionWhereInput = {};

    // Access control
    if (currentUser.roleCode !== RoleCode.SUPER_ADMIN) {
      if (!currentUser.unitId) {
        throw Errors.forbidden('No unit assignment found for this user');
      }
      where.unitId = currentUser.unitId;
    }

    if (filters.status) where.status = filters.status as CounselingStatus;
    if (filters.category) where.category = filters.category as CounselingCategory;
    if (filters.priority) where.priority = filters.priority as CounselingPriority;
    if (filters.studentId) where.studentId = filters.studentId;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        // Optimized search: Filter by Student Name and Counselor Name via User relation
        {
          student: {
            user: {
              name: { contains: filters.search, mode: 'insensitive' },
            },
          },
        },
        {
          counselor: {
            user: {
              name: { contains: filters.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.scheduledAt = {};
      if (filters.startDate) where.scheduledAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.scheduledAt.lte = new Date(filters.endDate);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.counselingSession.findMany({
        where,
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true } },
              enrollments: {
                where: { status: 'active' },
                take: 1,
                include: { class: { select: { id: true, name: true } } },
              },
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
        skip,
        take: limit,
      }),
      prisma.counselingSession.count({ where }),
    ]);

    const mappedSessions = sessions.map((s) => ({
      ...s,
      student: {
        ...s.student,
        currentClass: s.student.enrollments[0]?.class || null,
      },
    }));

    return { data: mappedSessions as unknown as SharedCounselingSession[], total };
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
        _count: { select: { notes: true, referrals: true } },
      },
    });

    if (!session) {
      throw Errors.notFound('Session not found');
    }

    // Access control
    if (currentUser.roleCode !== RoleCode.SUPER_ADMIN && session.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const mappedSession = {
      ...session,
      student: {
        ...session.student,
        currentClass: session.student.enrollments[0]?.class || null,
      },
    };

    return mappedSession as unknown as SharedCounselingSession;
  }

  /**
   * Create counseling session
   */
  async createSession(input: CreateCounselingSessionInput, currentUser: AuthenticatedUser) {
    const student = await prisma.student.findUnique({
      where: { id: input.studentId, deletedAt: null },
    });

    if (!student) {
      throw Errors.notFound('Student not found');
    }

    let counselorId: string | undefined;

    const teacher = await prisma.teacher.findFirst({
      where: { userId: currentUser.sub },
    });

    if (teacher) {
      counselorId = teacher.id;
    } else {
      if (isAdminRoleCode(currentUser.roleCode)) {
        throw Errors.forbidden('You must have a Teacher profile to be assigned as a counselor.');
      } else {
        throw Errors.forbidden('Only teachers can create counseling sessions');
      }
    }

    // PSYCHOLOGICAL_OBSERVATION sessions default to confidential regardless
    // of the caller's input, since they contain sensitive mental health data.
    const isConfidential = input.category === 'PSYCHOLOGICAL_OBSERVATION'
      ? true
      : (input.isConfidential ?? true);

    const session = await prisma.counselingSession.create({
      data: {
        unitId: student.unitId,
        studentId: input.studentId,
        counselorId: counselorId,
        category: input.category as CounselingCategory,
        priority: (input.priority as CounselingPriority) || CounselingPriority.MEDIUM,
        title: input.title,
        description: input.description,
        scheduledAt: new Date(input.scheduledAt),
        duration: input.duration,
        location: input.location,
        isConfidential,
        status: CounselingStatus.SCHEDULED,
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
        counselor: { include: { user: { select: { name: true } } } },
        unit: { select: { id: true, name: true } },
      },
    });

    return session as unknown as SharedCounselingSession;
  }

  /**
   * Update counseling session
   */
  async updateSession(
    sessionId: string,
    input: UpdateCounselingSessionInput,
    currentUser: AuthenticatedUser
  ) {
    const session = await prisma.counselingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw Errors.notFound('Session not found');
    }

    if (currentUser.roleCode !== RoleCode.SUPER_ADMIN && session.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const updateData: Prisma.CounselingSessionUpdateInput = {};
    if (input.category) updateData.category = input.category as CounselingCategory;
    if (input.priority) updateData.priority = input.priority as CounselingPriority;
    if (input.title) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.scheduledAt) updateData.scheduledAt = new Date(input.scheduledAt);
    if (input.duration !== undefined) updateData.duration = input.duration;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.status) {
      updateData.status = input.status as CounselingStatus;
      if ((input.status as string) === CounselingStatus.IN_PROGRESS && !session.startedAt) {
        updateData.startedAt = new Date();
      } else if ((input.status as string) === CounselingStatus.COMPLETED && !session.endedAt) {
        updateData.endedAt = new Date();
      }
    }
    if (input.summary !== undefined) updateData.summary = input.summary;
    if (input.recommendations !== undefined) updateData.recommendations = input.recommendations;
    if (input.followUpDate) updateData.followUpDate = new Date(input.followUpDate);
    if (input.isConfidential !== undefined) {
      // PSYCHOLOGICAL_OBSERVATION sessions must always remain confidential.
      // Prevent downgrading confidentiality to avoid leaking sensitive mental
      // health data (e.g. via parent notifications at line 299).
      // Check the *effective* post-update category: if the caller is changing
      // the category to PSYCHOLOGICAL_OBSERVATION in the same request, the new
      // category takes precedence over the pre-update value from the DB.
      const effectiveCategory = (input.category as CounselingCategory | undefined) || session.category;
      if (effectiveCategory === CounselingCategory.PSYCHOLOGICAL_OBSERVATION && !input.isConfidential) {
        throw Errors.badRequest('PSYCHOLOGICAL_OBSERVATION sessions cannot be marked as non-confidential');
      }
      updateData.isConfidential = input.isConfidential;
    }

    // If the category is being changed TO PSYCHOLOGICAL_OBSERVATION, force
    // confidentiality regardless of whether isConfidential was provided.
    // This mirrors the create-time enforcement at createSession().
    if (input.category === 'PSYCHOLOGICAL_OBSERVATION' && session.category !== CounselingCategory.PSYCHOLOGICAL_OBSERVATION) {
      updateData.isConfidential = true;
    }
    if (input.parentNotified !== undefined) updateData.parentNotified = input.parentNotified;

    const updated = await prisma.counselingSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        student: {
          include: {
            user: { select: { name: true } },
          }
        },
        counselor: { include: { user: { select: { name: true } } } },
      },
    });

    // ─── NOTIFICATION INTEGRATION ───
    // If session is completed, notify primary parents.
    // Parent data is fetched only when the notification condition is met
    // to avoid leaking parent relationship data in confidential sessions.
    // Wrapped in try/catch so a non-critical notification failure
    // does not cause the already-persisted session update to appear failed.
    if (updated.status === CounselingStatus.COMPLETED && session.status !== CounselingStatus.COMPLETED && !updated.isConfidential) {
      try {
        const studentWithParents = await prisma.student.findUnique({
          where: { id: updated.studentId },
          include: {
            parents: { select: { parentId: true, isPrimary: true } },
          },
        });
        const primaryParent = studentWithParents?.parents.find(p => p.isPrimary) || studentWithParents?.parents[0];
        if (primaryParent) {
          await createNotification({
            userId: primaryParent.parentId,
            type: 'INFO',
            title: 'Sesi Konseling Selesai',
            message: `Sesi konseling untuk ${updated.student.user.name} telah selesai dilaksanakan. Silakan cek portal wali untuk detailnya.`,
            link: `/parent/counseling/${updated.id}`,
          } as any);
        }
      } catch (err) {
        console.error('Failed to send counseling completion notification:', err);
      }
    }

    return updated as unknown as SharedCounselingSession;
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

    if (currentUser.roleCode !== RoleCode.SUPER_ADMIN && session.unitId !== currentUser.unitId) {
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
    input: CreateCounselingNoteInput,
    currentUser: AuthenticatedUser
  ) {
    const session = await prisma.counselingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw Errors.notFound('Session not found');
    }

    if (currentUser.roleCode !== RoleCode.SUPER_ADMIN && session.unitId !== currentUser.unitId) {
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

    return note as unknown as SharedCounselingNote;
  }

  /**
   * Update session note
   */
  async updateNote(
    noteId: string,
    input: Partial<CreateCounselingNoteInput>,
    currentUser: AuthenticatedUser
  ) {
    const note = await prisma.counselingNote.findUnique({
      where: { id: noteId },
      include: { session: true },
    });

    if (!note) {
      throw Errors.notFound('Note not found');
    }

    if (currentUser.roleCode !== RoleCode.SUPER_ADMIN && note.session.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const updated = await prisma.counselingNote.update({
      where: { id: noteId },
      data: {
        content: input.content,
        noteType: input.noteType,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return updated as unknown as SharedCounselingNote;
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

    if (currentUser.roleCode !== RoleCode.SUPER_ADMIN && note.session.unitId !== currentUser.unitId) {
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
    input: CreateCounselingReferralInput,
    currentUser: AuthenticatedUser
  ) {
    const session = await prisma.counselingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw Errors.notFound('Session not found');
    }

    if (currentUser.roleCode !== RoleCode.SUPER_ADMIN && session.unitId !== currentUser.unitId) {
      throw Errors.forbidden('Access denied');
    }

    const referral = await prisma.counselingReferral.create({
      data: {
        sessionId,
        type: input.type as ReferralType,
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

    return referral as unknown as SharedCounselingReferral;
  }

  /**
   * Update referral
   */
  async updateReferral(
    referralId: string,
    input: Partial<CreateCounselingReferralInput & { outcome: string }>,
    currentUser: AuthenticatedUser
  ) {
    const referral = await prisma.counselingReferral.findUnique({
      where: { id: referralId },
      include: { session: true },
    });

    if (!referral) {
      throw Errors.notFound('Referral not found');
    }

    if (
      currentUser.roleCode !== RoleCode.SUPER_ADMIN &&
      referral.session.unitId !== currentUser.unitId
    ) {
      throw Errors.forbidden('Access denied');
    }

    const updated = await prisma.counselingReferral.update({
      where: { id: referralId },
      data: {
        type: input.type as ReferralType,
        referredTo: input.referredTo,
        institution: input.institution,
        reason: input.reason,
        contactInfo: input.contactInfo,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
        outcome: input.outcome,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return updated as unknown as SharedCounselingReferral;
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

    if (
      currentUser.roleCode !== RoleCode.SUPER_ADMIN &&
      referral.session.unitId !== currentUser.unitId
    ) {
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

    if (currentUser.roleCode !== RoleCode.SUPER_ADMIN && student.unitId !== currentUser.unitId) {
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

    return sessions as unknown as SharedCounselingSession[];
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

    return sessions as unknown as SharedCounselingSession[];
  }

  /**
   * Get statistics
   */
  async getStatistics(currentUser: AuthenticatedUser): Promise<SharedCounselingStats> {
    const where: Prisma.CounselingSessionWhereInput = {};

    if (currentUser.roleCode !== RoleCode.SUPER_ADMIN) {
      if (!currentUser.unitId) {
        throw Errors.forbidden('No unit assignment found for this user');
      }
      where.unitId = currentUser.unitId;
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
      byStatus: byStatus.map((s) => ({
        status: s.status as unknown as any,
        count: s._count.status,
      })),
      byCategory: byCategory.map((c) => ({
        category: c.category as unknown as any,
        count: c._count.category,
      })),
      byPriority: byPriority.map((p) => ({
        priority: p.priority as unknown as any,
        count: p._count.priority,
      })),
    };
  }
}

export const counselingService = new CounselingService();
