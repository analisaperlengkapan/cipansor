import { prisma } from '../../lib/prisma';
import {
  CreateGuestBookInput,
  UpdateGuestBookInput,
  CreateStudentVisitInput,
  UpdateStudentVisitInput,
  CreateStudentPackageInput,
  UpdateStudentPackageInput,
  ReceptionStats,
  StudentVisit,
  StudentPackage,
} from '@cipansor/shared';
import { VisitStatus, PackageStatus, Prisma } from '@prisma/client';
import { Errors } from '../../middleware/error';

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
        status: VisitStatus.CHECKED_IN,
      },
    }),
    prisma.studentPackage.count({
      where: {
        unitId,
        status: PackageStatus.RECEIVED,
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

const mapToStudentVisitDTO = (visit: any): StudentVisit => {
  return {
    ...visit,
    relationship: visit.relation,
    needs: visit.purpose,
  };
};

export const getStudentVisits = async (
  unitId: string,
  params: { date?: string; studentId?: string }
): Promise<StudentVisit[]> => {
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

  return visits.map(mapToStudentVisitDTO);
};

export const createStudentVisit = async (
  unitId: string,
  data: CreateStudentVisitInput
): Promise<StudentVisit> => {
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
      status: VisitStatus.CHECKED_IN,
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

  return mapToStudentVisitDTO(visit);
};

export const updateStudentVisit = async (
  id: string,
  data: UpdateStudentVisitInput
): Promise<StudentVisit> => {
  const visit = await prisma.studentVisit.findUnique({ where: { id } });
  if (!visit) throw Errors.notFound('Visit');

  const updated = await prisma.studentVisit.update({
    where: { id },
    data: {
      checkOut: data.checkOut,
      status: data.status as VisitStatus,
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

  return mapToStudentVisitDTO(updated);
};

// --- Student Packages ---

const mapToStudentPackageDTO = (pkg: any): StudentPackage => {
  return {
    ...pkg,
    content: pkg.description || '',
    expedition: pkg.senderName, // Map senderName to expedition as placeholder
    pickedUpAt: pkg.deliveredAt,
  };
};

export const getPackages = async (
  unitId: string,
  params: { status?: string; studentId?: string }
): Promise<StudentPackage[]> => {
  const where: Prisma.StudentPackageWhereInput = { unitId };

  if (params.status) {
    where.status = params.status as PackageStatus;
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

  return packages.map(mapToStudentPackageDTO);
};

export const createPackage = async (
  unitId: string,
  userId: string,
  data: CreateStudentPackageInput
): Promise<StudentPackage> => {
  const pkg = await prisma.studentPackage.create({
    data: {
      unitId,
      studentId: data.studentId,
      senderName: data.senderName,
      senderPhone: null,
      description: data.content,
      photoUrl: data.photoUrl,
      notes: data.notes,
      receivedById: userId,
      receivedAt: new Date(),
      status: PackageStatus.RECEIVED,
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

  return mapToStudentPackageDTO(pkg);
};

export const updatePackage = async (
  id: string,
  data: UpdateStudentPackageInput
): Promise<StudentPackage> => {
  const pkg = await prisma.studentPackage.findUnique({ where: { id } });
  if (!pkg) throw Errors.notFound('Package');

  let prismaStatus: PackageStatus | undefined;
  if (data.status) {
    if ((data.status as string) === 'PICKED_UP') {
      prismaStatus = PackageStatus.DELIVERED;
    } else {
      // Allow other statuses if they match
      prismaStatus = data.status as unknown as PackageStatus;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    notes: data.notes,
  };

  if (prismaStatus) {
    updateData.status = prismaStatus;
  }

  if (prismaStatus === PackageStatus.DELIVERED && !pkg.deliveredAt) {
    updateData.deliveredAt = data.pickedUpAt || new Date();
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

  return mapToStudentPackageDTO(updated);
};
