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
        status: 'CHECKED_IN' as any,
      },
    }),
    prisma.studentPackage.count({
      where: {
        unitId,
        status: 'RECEIVED' as any,
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

  return visits.map((v) => ({
    ...v,
    status: v.status as unknown as VisitStatus,
    relationship: (v as any).relation || '',
    needs: (v as any).purpose || '',
    student: {
      name: v.student?.user?.name || '',
      nis: v.student?.nis || '',
      class: v.student?.enrollments?.[0]?.class
        ? { name: v.student.enrollments[0].class.name }
        : undefined,
    },
  }));
};

export const createStudentVisit = async (unitId: string, data: CreateStudentVisitInput) => {
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
      status: 'CHECKED_IN' as any,
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
    status: visit.status as unknown as VisitStatus,
    relationship: (visit as any).relation,
    needs: (visit as any).purpose,
    student: {
      name: visit.student?.user?.name || '',
      nis: visit.student?.nis || '',
      class: visit.student?.enrollments?.[0]?.class
        ? { name: visit.student.enrollments[0].class.name }
        : undefined,
    },
  };
};

export const updateStudentVisit = async (id: string, data: UpdateStudentVisitInput) => {
  const visit = await prisma.studentVisit.findUnique({ where: { id } });
  if (!visit) throw Errors.notFound('Visit');

  const updated = await prisma.studentVisit.update({
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
    ...updated,
    status: updated.status as unknown as VisitStatus,
    relationship: (updated as any).relation,
    needs: (updated as any).purpose,
    student: {
      name: updated.student?.user?.name || '',
      nis: updated.student?.nis || '',
      class: updated.student?.enrollments?.[0]?.class
        ? { name: updated.student.enrollments[0].class.name }
        : undefined,
    },
  };
};

// --- Student Packages ---

export const getPackages = async (
  unitId: string,
  params: { status?: string; studentId?: string }
) => {
  const where: Prisma.StudentPackageWhereInput = { unitId };

  if (params.status) {
    where.status = params.status as any;
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

  return packages.map((p) => ({
    ...p,
    status: p.status as unknown as PackageStatus,
    expedition: (p as any).senderPhone || '-',
    content: p.description,
    pickedUpAt: (p as any).deliveredAt,
    student: {
      name: p.student?.user?.name || '',
      nis: p.student?.nis || '',
      class: p.student?.enrollments?.[0]?.class
        ? { name: p.student.enrollments[0].class.name }
        : undefined,
    },
  }));
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
      senderPhone: data.expedition, // Mapping expedition to senderPhone as workaround
      description: data.content,
      photoUrl: data.photoUrl,
      notes: data.notes,
      receivedById: userId,
      receivedAt: new Date(),
      status: 'RECEIVED' as any,
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
    status: pkg.status as unknown as PackageStatus,
    expedition: (pkg as any).senderPhone || '-',
    content: pkg.description,
    pickedUpAt: (pkg as any).deliveredAt,
    student: {
      name: pkg.student?.user?.name || '',
      nis: pkg.student?.nis || '',
      class: pkg.student?.enrollments?.[0]?.class
        ? { name: pkg.student.enrollments[0].class.name }
        : undefined,
    },
  };
};

export const updatePackage = async (id: string, data: UpdateStudentPackageInput) => {
  const pkg = await prisma.studentPackage.findUnique({ where: { id } });
  if (!pkg) throw Errors.notFound('Package');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    status: data.status,
    notes: data.notes,
  };

  if (data.status === ('PICKED_UP' as any) || data.status === ('DELIVERED' as any)) {
     if (data.pickedUpAt) updateData.deliveredAt = data.pickedUpAt;
     else if (!pkg.deliveredAt) updateData.deliveredAt = new Date();
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

  return {
    ...updated,
    status: updated.status as unknown as PackageStatus,
    expedition: (updated as any).senderPhone || '-',
    content: updated.description,
    pickedUpAt: (updated as any).deliveredAt,
    student: {
      name: updated.student?.user?.name || '',
      nis: updated.student?.nis || '',
      class: updated.student?.enrollments?.[0]?.class
        ? { name: updated.student.enrollments[0].class.name }
        : undefined,
    },
  };
};
