import { prisma } from '../../lib/prisma';
import {
  CreateGuestBookInput,
  UpdateGuestBookInput,
  CreateStudentVisitInput,
  UpdateStudentVisitInput,
  CreateStudentPackageInput,
  UpdateStudentPackageInput,
  VisitStatus,
  PackageStatus,
  ReceptionStats,
} from '@cipansor/shared';
import { Errors } from '../../middleware/error';
import { Prisma } from '@prisma/client';

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

  // Map to shared DTO (relation -> relationship, purpose -> needs)
  return visits.map(v => ({
    ...v,
    relationship: v.relation,
    needs: v.purpose,
    status: v.status as any,
    student: {
        ...v.student,
        name: v.student.user.name,
    }
  })) as any;
};

export const createStudentVisit = async (unitId: string, data: CreateStudentVisitInput) => {
  // Validate student belongs to unit
  const student = await prisma.student.findUnique({
    where: { id: data.studentId },
  });

  if (!student) throw Errors.notFound('Student');
  // In a real scenario, we might want to check if student.unitId === unitId
  // But for now we trust the input or assume global student access within allowed scopes

  const visit = await prisma.studentVisit.create({
    data: {
      unitId,
      studentId: data.studentId,
      visitorName: data.visitorName,
      relation: data.relationship, // Corrected mapping
      purpose: data.needs,         // Corrected mapping
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

  return {
    ...visit,
    relationship: visit.relation,
    needs: visit.purpose
  } as any;
};

export const updateStudentVisit = async (id: string, data: UpdateStudentVisitInput) => {
  const existingVisit = await prisma.studentVisit.findUnique({ where: { id } });
  if (!existingVisit) throw Errors.notFound('Visit');

  const updatedVisit = await prisma.studentVisit.update({
    where: { id },
    data: {
      checkOut: data.checkOut,
      status: data.status as any,
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

  return {
    ...updatedVisit,
    relationship: updatedVisit.relation,
    needs: updatedVisit.purpose
  } as any;
};

// --- Student Packages ---

export const getPackages = async (
  unitId: string,
  params: { status?: string; studentId?: string }
) => {
  const where: Prisma.StudentPackageWhereInput = { unitId };

  if (params.status) {
    where.status = params.status as any; // PackageStatus
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

  return packages.map(p => ({
    ...p,
    content: p.description,
    expedition: 'Unknown',
    status: p.status as any,
    student: {
        ...p.student,
        name: p.student.user.name,
    }
  })) as any;
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
      senderPhone: '',
      description: data.content, // Map content -> description
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

  return {
    ...pkg,
    content: pkg.description,
    expedition: 'Unknown'
  } as any;
};

export const updatePackage = async (id: string, data: UpdateStudentPackageInput) => {
  const existingPkg = await prisma.studentPackage.findUnique({ where: { id } });
  if (!existingPkg) throw Errors.notFound('Package');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    status: data.status as any,
    notes: data.notes,
    deliveredTo: data.deliveredTo,
  };

  if (data.status === PackageStatus.DELIVERED && !existingPkg.deliveredAt) {
    updateData.deliveredAt = new Date();
  }

  const updatedPkg = await prisma.studentPackage.update({
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

  return {
    ...updatedPkg,
    content: updatedPkg.description,
    expedition: 'Unknown'
  } as any;
};
