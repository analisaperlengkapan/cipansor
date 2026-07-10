import { prisma } from '../../lib/prisma';

export class StudentOrgService {
  // Orgs
  async createOrg(data: any) {
    return prisma.studentOrg.create({ data });
  }

  async getOrgs(unitId?: string, academicYearId?: string) {
    return prisma.studentOrg.findMany({
      where: {
        ...(unitId && { unitId }),
        ...(academicYearId && { academicYearId }),
      },
      include: {
        positions: {
          include: {
            members: {
              include: {
                student: { include: { user: { select: { name: true } } } },
              },
            },
          },
        },
      },
    });
  }

  // Positions
  async createPosition(data: any) {
    return prisma.studentOrgPosition.create({ data });
  }

  // Members
  async addMember(data: any) {
    return prisma.studentOrgMember.create({ data });
  }

  async getMemberById(id: string) {
    return prisma.studentOrgMember.findUniqueOrThrow({
      where: { id },
      include: {
        student: { include: { user: { select: { name: true } } } },
        position: { include: { org: true } },
        logbooks: { orderBy: { date: 'desc' } },
      },
    });
  }

  async getMemberByStudentId(studentId: string, academicYearId: string) {
    return prisma.studentOrgMember.findFirst({
      where: {
        studentId,
        position: {
          org: { academicYearId },
        },
      },
      include: {
        position: { include: { org: true } },
      },
    });
  }

  // Logbooks
  async createLogbook(data: any) {
    return prisma.studentOrgLogbook.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
    });
  }

  async getLogbooks(memberId: string) {
    return prisma.studentOrgLogbook.findMany({
      where: { memberId },
      orderBy: { date: 'desc' },
    });
  }
}

export const studentOrgService = new StudentOrgService();
