import { prisma } from '../../lib/prisma';
import { Prisma, Room } from '@prisma/client';
import {
  CreateDormitoryDto,
  UpdateDormitoryDto,
  QueryDormitoryDto,
  CreateRoomDto,
  UpdateRoomDto,
  QueryRoomDto,
  CreateRoomAssignmentDto,
  UpdateRoomAssignmentDto,
  QueryRoomAssignmentDto,
} from './schema';

// =====================================
// DORMITORY SERVICE
// =====================================

export async function createDormitory(data: CreateDormitoryDto) {
  return prisma.dormitory.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data as any,
    include: { unit: true },
  });
}

export async function getDormitories(query: QueryDormitoryDto) {
  const { unitId, gender, search, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(unitId && { unitId }),
    ...(gender && { gender }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.dormitory.findMany({
      where,
      include: {
        unit: { select: { id: true, name: true } },
        _count: { select: { rooms: true } },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.dormitory.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDormitoryById(id: string) {
  return prisma.dormitory.findFirst({
    where: { id, deletedAt: null },
    include: {
      unit: { select: { id: true, name: true, type: true } },
      rooms: {
        where: { isActive: true },
        include: {
          _count: { select: { assignments: { where: { isActive: true } } } },
        },
        orderBy: [{ floor: 'asc' }, { name: 'asc' }],
      },
    },
  });
}

export async function updateDormitory(id: string, data: UpdateDormitoryDto) {
  return prisma.dormitory.update({
    where: { id },
    data,
    include: { unit: true },
  });
}

export async function deleteDormitory(id: string) {
  return prisma.dormitory.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// =====================================
// ROOM SERVICE
// =====================================

export async function createRoom(data: CreateRoomDto) {
  return prisma.room.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data as any,
    include: { dormitory: { select: { id: true, name: true, code: true } } },
  });
}

export async function getRooms(query: QueryRoomDto) {
  const { dormitoryId, floor, isActive, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(dormitoryId && { dormitoryId }),
    ...(floor && { floor }),
    ...(isActive !== undefined && { isActive }),
  };

  const [data, total] = await Promise.all([
    prisma.room.findMany({
      where,
      include: {
        dormitory: { select: { id: true, name: true, code: true, gender: true } },
        _count: { select: { assignments: { where: { isActive: true } } } },
      },
      orderBy: [{ floor: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.room.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getRoomById(id: string) {
  return prisma.room.findUnique({
    where: { id },
    include: {
      dormitory: { select: { id: true, name: true, code: true, gender: true } },
      assignments: {
        where: { isActive: true },
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
  });
}

export async function updateRoom(id: string, data: UpdateRoomDto) {
  return prisma.room.update({
    where: { id },
    data,
    include: { dormitory: { select: { id: true, name: true, code: true } } },
  });
}

export async function deleteRoom(id: string) {
  // Soft delete by deactivating
  return prisma.room.update({
    where: { id },
    data: { isActive: false },
  });
}

// =====================================
// ROOM ASSIGNMENT SERVICE
// =====================================

export async function createRoomAssignment(data: CreateRoomAssignmentDto) {
  // First, deactivate any existing assignment for this student
  await prisma.roomAssignment.updateMany({
    where: { studentId: data.studentId, isActive: true },
    data: { isActive: false, endedAt: new Date() },
  });

  return prisma.roomAssignment.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data as any,
    include: {
      room: {
        include: {
          dormitory: { select: { id: true, name: true, code: true } },
        },
      },
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

export async function getRoomAssignments(query: QueryRoomAssignmentDto) {
  const { roomId, studentId, isActive, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(roomId && { roomId }),
    ...(studentId && { studentId }),
    ...(isActive !== undefined && { isActive }),
  };

  const [data, total] = await Promise.all([
    prisma.roomAssignment.findMany({
      where,
      include: {
        room: {
          include: {
            dormitory: { select: { id: true, name: true, code: true } },
          },
        },
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.roomAssignment.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getRoomAssignmentById(id: string) {
  return prisma.roomAssignment.findUnique({
    where: { id },
    include: {
      room: {
        include: {
          dormitory: { select: { id: true, name: true, code: true } },
        },
      },
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

export async function updateRoomAssignment(id: string, data: UpdateRoomAssignmentDto) {
  return prisma.roomAssignment.update({
    where: { id },
    data,
    include: {
      room: {
        include: {
          dormitory: { select: { id: true, name: true, code: true } },
        },
      },
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

export async function endRoomAssignment(id: string) {
  return prisma.roomAssignment.update({
    where: { id },
    data: { isActive: false, endedAt: new Date() },
  });
}

export async function getStudentsByMusyrif(userId: string) {
  // 1. Get Musyrif profile
  const musyrif = await prisma.musyrif.findFirst({
    where: { userId },
    include: {
      assignments: {
        where: { isActive: true },
      },
    },
  });

  if (!musyrif) {
    return [];
  }

  // 2. Collect scope
  const dormitoryIds = musyrif.assignments.filter((a) => !a.roomId).map((a) => a.dormitoryId);

  const roomIds = musyrif.assignments.filter((a) => a.roomId).map((a) => a.roomId as string);

  // 3. Find students
  const roomAssignments = await prisma.roomAssignment.findMany({
    where: {
      isActive: true,
      room: {
        OR: [{ id: { in: roomIds } }, { dormitoryId: { in: dormitoryIds } }],
      },
    },
    include: {
      room: { select: { name: true } },
      student: {
        include: {
          user: { select: { name: true, email: true } },
          enrollments: {
            where: { status: 'active' },
            include: { class: { select: { name: true } } },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      student: { user: { name: 'asc' } },
    },
  });

  return roomAssignments.map((ra) => ({
    id: ra.student.id,
    name: ra.student.user.name,
    nis: ra.student.nis,
    photo: ra.student.photoUrl,
    class: ra.student.enrollments[0]?.class.name || '-',
    room: ra.room.name,
    gender: ra.student.gender,
  }));
}

// =====================================
// HELPER FUNCTIONS
// =====================================

export async function getRoomOccupancy(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      _count: { select: { assignments: { where: { isActive: true } } } },
    },
  });

  if (!room) return null;

  return {
    roomId: room.id,
    roomName: room.name,
    capacity: room.capacity,
    occupied: room._count.assignments,
    available: room.capacity - room._count.assignments,
  };
}

export async function getRoomSocialAnalytics(roomId: string) {
  // Only consider violations from the last 6 months for current room dynamics
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      assignments: {
        where: { isActive: true },
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true } },
              violations: {
                where: { occurredAt: { gte: sixMonthsAgo } },
                orderBy: { createdAt: 'desc' },
                take: 50, // Limit per student to prevent excessive memory usage
              },
              medicalRecords: {
                select: { id: true },
                orderBy: { visitDate: 'desc' },
                take: 1
              }
            }
          }
        }
      }
    }
  });

  if (!room) return null;

  const members = room.assignments.map(a => {
    const s = a.student;
    const violationPoints = s.violations.reduce((sum, v) => sum + Number(v.points), 0);

    return {
      studentId: s.id,
      name: s.user?.name,
      riskScore: violationPoints,
      lastHealthStatus: s.medicalRecords.length > 0 ? 'Tercatat' : 'Sehat',
      recentViolations: s.violations.length
    };
  });

  // Calculate room harmony score (simplified)
  // Higher violations = lower harmony.
  // Use a logarithmic-inspired scale so a single high-violation member
  // doesn't crash the score to 0 for the entire room.
  const totalViolations = members.reduce((sum, m) => sum + m.riskScore, 0);
  const avgViolationPoints = totalViolations / Math.max(1, members.length);
  // Scale: 0 pts → 100, ~10 pts → ~82, ~50 pts → ~37, ~100 pts → ~14, ~250+ pts → ~0
  const harmonyScore = Math.round(Math.max(0, 100 * Math.exp(-avgViolationPoints / 50)) * 100) / 100;

  return {
    roomId,
    roomName: room.name,
    harmonyScore,
    members,
    status: harmonyScore > 80 ? 'KONDUSIF' : harmonyScore > 50 ? 'PERLU_PENGAWASAN' : 'RAWAN_KONFLIK'
  };
}

export async function getDormitoryStats(dormitoryId: string) {
  const dormitory = await prisma.dormitory.findUnique({
    where: { id: dormitoryId },
    include: {
      rooms: {
        include: {
          _count: { select: { assignments: { where: { isActive: true } } } },
        },
      },
    },
  });

  if (!dormitory) return null;

  type RoomWithCount = Room & { _count: { assignments: number } };
  const rooms = dormitory.rooms as RoomWithCount[];

  const totalRooms = rooms.length;
  const activeRooms = rooms.filter((r) => r.isActive).length;
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const totalOccupied = rooms.reduce((sum, r) => sum + r._count.assignments, 0);

  return {
    dormitoryId: dormitory.id,
    dormitoryName: dormitory.name,
    totalRooms,
    activeRooms,
    totalCapacity,
    totalOccupied,
    availableSpots: totalCapacity - totalOccupied,
    occupancyRate: totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0,
  };
}
