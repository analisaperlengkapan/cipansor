import { prisma } from '@/lib/prisma';
import { ComplaintStatus, ComplaintPriority, ComplaintCategory, Prisma } from '@prisma/client';

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
  }) => {
    return prisma.complaint.create({
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
        priority: 'NORMAL',
      },
    });
  },

  findAll: async (
    params: {
      unitId: string;
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

    const where: Prisma.ComplaintWhereInput = {
      unitId,
    };

    if (status) where.status = status;
    if (category) where.category = category;

    // Access Control
    // Allow Admins, Principals, Yayasan, and Staff to see all complaints in their unit
    const hasFullAccess =
      role.includes('ADMIN') ||
      role.includes('KEPALA_SEKOLAH') ||
      role.includes('YAYASAN') ||
      role.includes('STAFF') ||
      role.includes('TATA_USAHA') ||
      role === 'SUPER_ADMIN';

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
    const sanitizedData = data.map(d => {
      if (d.isAnonymous) {
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

  findOne: async (id: string, userId: string, role: string) => {
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
      role.includes('ADMIN') ||
      role.includes('KEPALA_SEKOLAH') ||
      role.includes('YAYASAN') ||
      role.includes('STAFF') ||
      role.includes('TATA_USAHA') ||
      role === 'SUPER_ADMIN';

    if (!hasFullAccess && complaint.userId !== userId) {
      throw new Error('Unauthorized'); // Controller will handle this
    }

    if (complaint.isAnonymous) {
      // If anonymous, mask the reporter
      complaint.user = null;
      complaint.userId = null;
    }

    return complaint;
  },

  updateStatus: async (id: string, status: ComplaintStatus, resolution?: string) => {
    const data: Prisma.ComplaintUpdateInput = { status };
    if (resolution) data.resolution = resolution;
    if (status === 'RESOLVED') data.resolvedAt = new Date();

    return prisma.complaint.update({
      where: { id },
      data,
    });
  },

  assignHandler: async (id: string, handlerId: string) => {
    return prisma.complaint.update({
      where: { id },
      data: { assignedToId: handlerId, status: 'IN_PROGRESS' },
    });
  },

  addComment: async (data: {
    complaintId: string;
    userId: string;
    content: string;
    isInternal?: boolean;
  }) => {
    return prisma.complaintComment.create({
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
  },
};
