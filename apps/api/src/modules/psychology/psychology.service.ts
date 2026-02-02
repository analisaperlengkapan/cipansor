import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { UserRole, Prisma } from '@prisma/client';
import {
  CreatePsychologyTestInput,
  UpdatePsychologyTestInput,
  CreateStudentPsychologyRecordInput,
  UpdateStudentPsychologyRecordInput,
} from './psychology.schema';

interface AuthenticatedUser {
  sub: string;
  role: UserRole;
  unitId: string | null;
}

export class PsychologyService {
  // Tests
  async getTests(unitId: string | null, currentUser: AuthenticatedUser) {
    const where: Prisma.PsychologyTestWhereInput = {};

    if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.unitId) {
       // Show global tests (unitId: null) AND tests for this unit
       where.OR = [
          { unitId: null },
          { unitId: currentUser.unitId }
       ];
    } else if (unitId) {
       where.unitId = unitId;
    }

    return prisma.psychologyTest.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        unit: { select: { id: true, name: true } }
      }
    });
  }

  async getTestById(id: string) {
      const test = await prisma.psychologyTest.findUnique({
          where: { id },
          include: { unit: { select: { id: true, name: true } } }
      });
      if (!test) throw Errors.notFound('Test not found');
      return test;
  }

  async createTest(data: CreatePsychologyTestInput, currentUser: AuthenticatedUser) {
    if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.UNIT_ADMIN) {
        throw Errors.forbidden('Only admins can create tests');
    }

    // Determine unitId:
    let targetUnitId = data.unitId;

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
        if (targetUnitId && targetUnitId !== currentUser.unitId) {
            throw Errors.forbidden('You cannot create tests for other units');
        }
        targetUnitId = currentUser.unitId;
    }

    return prisma.psychologyTest.create({
      data: {
        unitId: targetUnitId || null,
        name: data.name,
        type: data.type,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateTest(id: string, data: UpdatePsychologyTestInput, currentUser: AuthenticatedUser) {
       const test = await this.getTestById(id);

       if (currentUser.role !== UserRole.SUPER_ADMIN) {
           if (test.unitId !== currentUser.unitId) {
               throw Errors.forbidden('You cannot edit this test');
           }
       }

       return prisma.psychologyTest.update({
           where: { id },
           data
       });
  }

  async deleteTest(id: string, currentUser: AuthenticatedUser) {
      const test = await this.getTestById(id);
       if (currentUser.role !== UserRole.SUPER_ADMIN) {
           if (test.unitId !== currentUser.unitId) {
               throw Errors.forbidden('You cannot delete this test');
           }
       }
      return prisma.psychologyTest.delete({ where: { id } });
  }

  // Records
  async getRecords(
      filters: { studentId?: string; testId?: string; startDate?: string; endDate?: string },
      currentUser: AuthenticatedUser
  ) {
      const where: Prisma.StudentPsychologyRecordWhereInput = {};

      // Access Control
      if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.unitId) {
           where.student = { unitId: currentUser.unitId };
      }

      if (filters.studentId) where.studentId = filters.studentId;
      if (filters.testId) where.testId = filters.testId;

      if (filters.startDate || filters.endDate) {
          where.testDate = {};
          if (filters.startDate) where.testDate.gte = new Date(filters.startDate);
          if (filters.endDate) where.testDate.lte = new Date(filters.endDate);
      }

      return prisma.studentPsychologyRecord.findMany({
          where,
          include: {
              student: {
                  select: {
                      id: true,
                      nis: true,
                      user: { select: { name: true } },
                      enrollments: {
                          where: { status: 'active' },
                          take: 1,
                          include: { class: { select: { name: true } } }
                      }
                  }
              },
              test: { select: { id: true, name: true, type: true } },
              recordedBy: { select: { id: true, name: true } }
          },
          orderBy: { testDate: 'desc' }
      });
  }

  async getRecordById(id: string, currentUser: AuthenticatedUser) {
      const record = await prisma.studentPsychologyRecord.findUnique({
          where: { id },
          include: {
              student: { include: { unit: true, user: { select: { name: true } } } },
              test: true,
              recordedBy: { select: { id: true, name: true } }
          }
      });

      if(!record) throw Errors.notFound('Record not found');

       if (currentUser.role !== UserRole.SUPER_ADMIN && record.student.unitId !== currentUser.unitId) {
           throw Errors.forbidden('Access denied');
      }
      return record;
  }

  async createRecord(data: CreateStudentPsychologyRecordInput, currentUser: AuthenticatedUser) {
      const student = await prisma.student.findUnique({ where: { id: data.studentId } });
      if(!student) throw Errors.notFound('Student not found');

      if (currentUser.role !== UserRole.SUPER_ADMIN && student.unitId !== currentUser.unitId) {
           throw Errors.forbidden('Access denied');
      }

      return prisma.studentPsychologyRecord.create({
          data: {
              studentId: data.studentId,
              testId: data.testId,
              testDate: new Date(data.testDate),
              score: data.score,
              classification: data.classification,
              analysis: data.analysis,
              details: data.details || undefined,
              attachmentUrl: data.attachmentUrl,
              recordedById: currentUser.sub
          },
          include: {
              student: { include: { user: { select: { name: true } } } },
              test: { select: { name: true } }
          }
      });
  }

  async updateRecord(id: string, data: UpdateStudentPsychologyRecordInput, currentUser: AuthenticatedUser) {
       await this.getRecordById(id, currentUser); // checks permission
       return prisma.studentPsychologyRecord.update({
           where: { id },
           data: {
               ...data,
               testDate: data.testDate ? new Date(data.testDate) : undefined
           }
       })
  }

  async deleteRecord(id: string, currentUser: AuthenticatedUser) {
      await this.getRecordById(id, currentUser); // checks permission
      return prisma.studentPsychologyRecord.delete({ where: { id }});
  }
}

export const psychologyService = new PsychologyService();
