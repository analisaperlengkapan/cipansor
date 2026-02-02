import { prisma } from '@/lib/prisma';
import { ComplaintStatus, ComplaintPriority, ComplaintCategory, Prisma, UserRole } from '@prisma/client';
import { createNotification, createBulkNotifications } from '../notifications/service';

export const complaintsService = {
  create: async (data: {
    unitId: string;
    userId: string;
    category: ComplaintCategory;
    subject: string;
    description: string;
    location?: string;
    isAnonymous?: boolean;
    attachments?: string[];
    priority?: ComplaintPriority;
  }) => {
    const complaint = await prisma.complaint.create({
      data: {
        unitId: data.unitId,
        userId: data.userId,
        category: data.category,
        subject: data.subject,
        description: data.description,
        location: data.location,
        isAnonymous: data.isAnonymous || false,
        attachments: data.attachments || [],
        status: 'PENDING',
        priority: data.priority || 'NORMAL',
      },
    });

    // Notify Unit Admins
    const admins = await prisma.user.findMany({
      where: {
        unitId: data.unitId,
        role: { in: [UserRole.UNIT_ADMIN, UserRole.SUPER_ADMIN] },
        isActive: true,
      },
      select: { id: true },
    });

    if (admins.length > 0) {
      await createBulkNotifications({
        userIds: admins.map((a) => a.id),
        title: 'Aduan Baru',
        message: `Aduan baru masuk: ${data.subject}`,
        type: 'ALERT',
        link: `/quality/complaints/${complaint.id}`,
        priority: 'HIGH',
        channels: ['IN_APP'],
      });
    }

    return complaint;
  },

  findAll: async (
    params: {
      unitId: string | null;
      userId: string;
      role: string;
      status?: ComplaintStatus;
      category?: ComplaintCategory;
      page?: number;
      limit?: number;
    }
  ) => {
    const { unitId, userId, role, status, category, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ComplaintWhereInput = {};

    // SUPER_ADMIN sees all if unitId is null, otherwise filters by unitId
    if (role === UserRole.SUPER_ADMIN) {
      if (unitId) where.unitId = unitId;
    } else {
      // Other roles must have a unitId
      if (!unitId) throw new Error('Unit ID required');
      where.unitId = unitId;
    }

    if (status) where.status = status;
    if (category) where.category = category;

    // Access Control
    const hasFullAccess =
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.UNIT_ADMIN ||
      role === UserRole.STAFF ||
      role === UserRole.TEACHER;

    // Students/Parents only see their own
    if (!hasFullAccess) {
      where.userId = userId;
    }

    const [total, data] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
          assignedTo: {
            select: { id: true, name: true },
          },
          _count: {
            select: { comments: true },
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // Mask anonymous users logic
    // Unmask for SUPER_ADMIN and UNIT_ADMIN (for investigation)
    const canViewAnonymous = role === UserRole.SUPER_ADMIN || role === UserRole.UNIT_ADMIN;

    const sanitizedData = data.map(d => {
      if (d.isAnonymous && !canViewAnonymous) {
        return {
          ...d,
          user: null, // Hide user details for anonymous complaints
          userId: null
        };
      }
      return d;
    });

    return {
      data: sanitizedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  findOne: async (id: string, userId: string, role: string, userUnitId: string | null) => {
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, role: true } },
        assignedTo: { select: { id: true, name: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!complaint) return null;

    // Access check
    const hasFullAccess =
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.UNIT_ADMIN ||
      role === UserRole.STAFF ||
      role === UserRole.TEACHER;

    if (!hasFullAccess && complaint.userId !== userId) {
      throw new Error('Unauthorized'); // Controller will handle this
    }

    // Unit Isolation Check
    // If user has full access (Admin/Staff/Teacher), they must be in the same unit as the complaint
    // Unless they are SUPER_ADMIN (who might have null unitId or access across units)
    if (hasFullAccess && role !== UserRole.SUPER_ADMIN) {
      if (complaint.unitId !== userUnitId) {
        throw new Error('Unauthorized'); // Cannot access complaints from other units
      }
    }

    // Filter internal comments for non-staff/non-admin
    // Teachers are considered staff-level for visibility but restricted in management actions
    if (!hasFullAccess) {
      complaint.comments = complaint.comments.filter(c => !c.isInternal);
    }

    // Mask anonymous users logic
    // Unmask for SUPER_ADMIN and UNIT_ADMIN (for investigation)
    const canViewAnonymous = role === UserRole.SUPER_ADMIN || role === UserRole.UNIT_ADMIN;

    if (complaint.isAnonymous && !canViewAnonymous) {
      // If anonymous, mask the reporter
      complaint.user = null;
      complaint.userId = null;
    }

    return complaint;
  },

  updateStatus: async (id: string, status: ComplaintStatus, resolution?: string) => {
    const data: Prisma.ComplaintUpdateInput = { status };
    if (resolution) data.resolution = resolution;

    if (status === 'RESOLVED') {
      data.resolvedAt = new Date();
    } else {
      data.resolvedAt = null;
    }

    const complaint = await prisma.complaint.update({
      where: { id },
      data,
      include: { user: true },
    });

    // Notify Reporter
    if (complaint.userId) {
      await createNotification({
        userId: complaint.userId,
        title: 'Update Status Aduan',
        message: `Status aduan "${complaint.subject}" berubah menjadi ${status}`,
        type: 'INFO',
        link: `/quality/complaints/${complaint.id}`,
        priority: 'NORMAL',
        channels: ['IN_APP'],
      });
    }

    return complaint;
  },

  assignHandler: async (id: string, handlerId: string) => {
    const complaint = await prisma.complaint.update({
      where: { id },
      data: { assignedToId: handlerId, status: 'IN_PROGRESS' },
    });

    // Notify Handler
    await createNotification({
      userId: handlerId,
      title: 'Tugas Baru',
      message: `Anda ditugaskan menangani aduan: ${complaint.subject}`,
      type: 'INFO',
      link: `/quality/complaints/${complaint.id}`,
      priority: 'NORMAL',
      channels: ['IN_APP'],
    });

    return complaint;
  },

  addComment: async (data: {
    complaintId: string;
    userId: string;
    content: string;
    isInternal?: boolean;
  }) => {
    const comment = await prisma.complaintComment.create({
      data: {
        complaintId: data.complaintId,
        userId: data.userId,
        content: data.content,
        isInternal: data.isInternal || false,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    // Fetch complaint to get owner and handler
    const complaint = await prisma.complaint.findUnique({
      where: { id: data.complaintId },
      select: { userId: true, assignedToId: true, subject: true },
    });

    if (complaint) {
      // Logic: If commenter is Owner, notify Handler (if exists) or Admins?
      // If commenter is Handler/Admin, notify Owner.

      // Notify Owner if commenter is NOT the owner
      if (complaint.userId && complaint.userId !== data.userId && !data.isInternal) {
        await createNotification({
          userId: complaint.userId,
          title: 'Komentar Baru',
          message: `Komentar baru pada aduan: ${complaint.subject}`,
          type: 'INFO',
          link: `/quality/complaints/${data.complaintId}`,
          priority: 'NORMAL',
          channels: ['IN_APP'],
        });
      }

      // Notify Handler if commenter is NOT the handler
      if (complaint.assignedToId && complaint.assignedToId !== data.userId) {
         await createNotification({
          userId: complaint.assignedToId,
          title: 'Komentar Baru',
          message: `Komentar baru pada aduan yang Anda tangani: ${complaint.subject}`,
          type: 'INFO',
          link: `/quality/complaints/${data.complaintId}`,
          priority: 'NORMAL',
          channels: ['IN_APP'],
        });
      }
    }

    return comment;
  },
};
