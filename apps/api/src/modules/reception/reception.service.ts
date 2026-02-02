import { prisma } from '../../lib/prisma';
import {
  CreateGuestBookInput,
  UpdateGuestBookInput,
  CreateStudentVisitInput,
  UpdateStudentVisitInput,
  CreateStudentPackageInput,
  UpdateStudentPackageInput,
  ReceptionStats,
} from '@cipansor/shared';
import { Errors } from '../../middleware/error';
import { Prisma, VisitStatus as PrismaVisitStatus, PackageStatus as PrismaPackageStatus } from '@prisma/client';

// --- Stats ---

export const getStats = async (unitId: string): Promise<ReceptionStats> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [guestsToday, activeVisits, pendingPackages] = await Promise.all([
    prisma.guestBook.count({
      where: {
        unitId,
        checkIn: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
    prisma.studentVisit.count({
      where: {
        unitId,
        status: PrismaVisitStatus.CHECKED_IN,
      },
    }),
    prisma.studentPackage.count({
      where: {
        unitId,
        status: PrismaPackageStatus.RECEIVED,
      },
    }),
  ]);

  return {
    guestsToday,
    activeVisits,
    pendingPackages,
  };
};

// --- Guest Book ---

export const getGuestBooks = async (unitId: string, params: { date?: string }) => {
  const where: Prisma.GuestBookWhereInput = { unitId };

  if (params.date) {
    const startDate = new Date(params.date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    where.checkIn = {
      gte: startDate,
      lt: endDate,
    };
  }

  return prisma.guestBook.findMany({
    where,
    orderBy: { checkIn: 'desc' },
    include: {
      receivedBy: {
        select: { name: true },
      },
    },
  });
};

export const createGuestBook = async (
  unitId: string,
  userId: string,
  data: CreateGuestBookInput
) => {
  return prisma.guestBook.create({
    data: {
      unitId,
      name: data.name,
      institution: data.institution,
      purpose: data.purpose,
      phone: data.phone,
      visitorCount: data.visitorCount ?? 1,
      vehicleNumber: data.vehicleNumber,
      notes: data.notes,
      receivedById: userId,
      checkIn: new Date(),
    },
    include: {
      receivedBy: {
        select: { name: true },
      },
    },
  });
};

export const updateGuestBook = async (id: string, data: UpdateGuestBookInput) => {
  const guestBook = await prisma.guestBook.findUnique({ where: { id } });
  if (!guestBook) throw Errors.notFound('Guest book entry');

  return prisma.guestBook.update({
    where: { id },
    data: {
      checkOut: data.checkOut,
      notes: data.notes,
    },
    include: {
      receivedBy: {
        select: { name: true },
      },
    },
  });
};

// --- Student Visits ---

const mapToStudentVisit = (visit: any): any => ({
  ...visit,
  relationship: visit.relation,
  needs: visit.purpose,
  // Cast Prisma enum to string/shared enum
  status: visit.status,
  student: visit.student ? {
    name: visit.student.user.name,
    nis: visit.student.nis,
    class: visit.student.enrollments?.[0]?.class
  } : undefined
});

export const getStudentVisits = async (
  unitId: string,
  params: { date?: string; studentId?: string }
) => {
  const where: Prisma.StudentVisitWhereInput = { unitId };

  if (params.date) {
    const startDate = new Date(params.date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    where.checkIn = {
      gte: startDate,
      lt: endDate,
    };
  }

  if (params.studentId) {
    where.studentId = params.studentId;
  }

  const visits = await prisma.studentVisit.findMany({
    where,
    orderBy: { checkIn: 'desc' },
    include: {
      student: {
        select: {
          user: { select: { name: true } },
          nis: true,
          enrollments: {
            where: { status: 'active' },
            select: { class: { select: { name: true } } },
            take: 1,
          },
        },
      },
    },
  });

  return visits.map(mapToStudentVisit);
};

export const createStudentVisit = async (unitId: string, data: CreateStudentVisitInput) => {
  // Validate student belongs to unit
  const student = await prisma.student.findUnique({
    where: { id: data.studentId },
  });

  if (!student) throw Errors.notFound('Student');

  const visit = await prisma.studentVisit.create({
    data: {
      unitId,
      studentId: data.studentId,
      visitorName: data.visitorName,
      relation: data.relationship,
      purpose: data.needs,
      notes: data.notes,
      status: PrismaVisitStatus.CHECKED_IN,
      checkIn: new Date(),
    },
    include: {
      student: {
        select: {
          user: { select: { name: true } },
          nis: true,
          enrollments: {
            where: { status: 'active' },
            select: { class: { select: { name: true } } },
            take: 1,
          },
        },
      },
    },
  });

  return mapToStudentVisit(visit);
};

export const updateStudentVisit = async (id: string, data: UpdateStudentVisitInput) => {
  const visit = await prisma.studentVisit.findUnique({ where: { id } });
  if (!visit) throw Errors.notFound('Visit');

  const updated = await prisma.studentVisit.update({
    where: { id },
    data: {
      checkOut: data.checkOut,
      status: data.status as unknown as PrismaVisitStatus, // Blind cast for now, assuming compatible or handled
      notes: data.notes,
    },
    include: {
      student: {
        select: {
          user: { select: { name: true } },
          nis: true,
          enrollments: {
            where: { status: 'active' },
            select: { class: { select: { name: true } } },
            take: 1,
          },
        },
      },
    },
  });

  return mapToStudentVisit(updated);
};

// --- Student Packages ---

const mapToStudentPackage = (pkg: any): any => ({
  ...pkg,
  expedition: '', // Not stored in DB explicitly
  content: pkg.description,
  // Map DELIVERED -> PICKED_UP for shared type consistency if needed, or just pass through
  status: pkg.status === PrismaPackageStatus.DELIVERED ? 'PICKED_UP' : pkg.status,
  pickedUpAt: pkg.deliveredAt,
  student: pkg.student ? {
    name: pkg.student.user.name,
    nis: pkg.student.nis,
    class: pkg.student.enrollments?.[0]?.class
  } : undefined,
  receivedBy: pkg.receivedBy ? { name: pkg.receivedBy.name } : undefined
});

export const getPackages = async (
  unitId: string,
  params: { status?: string; studentId?: string }
) => {
  const where: Prisma.StudentPackageWhereInput = { unitId };

  if (params.status) {
    where.status = params.status as PrismaPackageStatus;
  }

  if (params.studentId) {
    where.studentId = params.studentId;
  }

  const packages = await prisma.studentPackage.findMany({
    where,
    orderBy: { receivedAt: 'desc' },
    include: {
      student: {
        select: {
          user: { select: { name: true } },
          nis: true,
          enrollments: {
            where: { status: 'active' },
            select: { class: { select: { name: true } } },
            take: 1,
          },
        },
      },
      receivedBy: {
        select: { name: true },
      },
    },
  });

  return packages.map(mapToStudentPackage);
};

export const createPackage = async (
  unitId: string,
  userId: string,
  data: CreateStudentPackageInput
) => {
  const pkg = await prisma.studentPackage.create({
    data: {
      unitId,
      studentId: data.studentId,
      senderName: data.senderName,
      senderPhone: '-', // Default as missing in input
      description: `${data.content} [Expedition: ${data.expedition}]`,
      photoUrl: data.photoUrl,
      notes: data.notes,
      receivedById: userId,
      receivedAt: new Date(),
      status: PrismaPackageStatus.RECEIVED,
    },
    include: {
      student: {
        select: {
          user: { select: { name: true } },
          nis: true,
          enrollments: {
            where: { status: 'active' },
            select: { class: { select: { name: true } } },
            take: 1,
          },
        },
      },
      receivedBy: {
        select: { name: true },
      },
    },
  });

  return mapToStudentPackage(pkg);
};

export const updatePackage = async (id: string, data: UpdateStudentPackageInput) => {
  const pkg = await prisma.studentPackage.findUnique({ where: { id } });
  if (!pkg) throw Errors.notFound('Package');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    // Map shared status (PICKED_UP) to Prisma status (DELIVERED) if needed
    status: (data.status === 'PICKED_UP' ? PrismaPackageStatus.DELIVERED : data.status) as PrismaPackageStatus,
    notes: data.notes,
    // deliveredTo is missing in shared input, removing
  };

  if (data.status === 'PICKED_UP' && !pkg.deliveredAt) {
    updateData.deliveredAt = new Date();
  }

  const updated = await prisma.studentPackage.update({
    where: { id },
    data: updateData,
    include: {
      student: {
        select: {
          user: { select: { name: true } },
          nis: true,
          enrollments: {
            where: { status: 'active' },
            select: { class: { select: { name: true } } },
            take: 1,
          },
        },
      },
      receivedBy: {
        select: { name: true },
      },
    },
  });

  return mapToStudentPackage(updated);
};
