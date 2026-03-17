import { Request, Response, NextFunction } from 'express';
import { CBTService } from './cbt.service';
import { Errors } from '@/middleware/error';
import { prisma } from '@/lib/prisma';

export class CBTController {
  // --- Banks ---
  static async getQuestionBanks(req: Request, res: Response, next: NextFunction) {
    try {
      // Filters
      const { unitId, subjectId, search } = req.query;
      const user = (req as any).user;

      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'UNIT_ADMIN';

      if (user.role !== 'SUPER_ADMIN' && !user.unitId) {
        throw Errors.badRequest('User has no unit assigned');
      }

      const filterUnitId = user.role === 'SUPER_ADMIN' ? (unitId as string) : user.unitId;

      if (user.role !== 'SUPER_ADMIN' && !filterUnitId) {
        throw Errors.badRequest('unitId is required for data isolation');
      }

      const banks = await CBTService.getQuestionBanks({
        unitId: filterUnitId,
        subjectId: subjectId as string,
        teacherUserId: isAdmin ? undefined : user.id, // Admins see all in their scope, teachers see theirs
        search: search as string,
      });

      res.json({ success: true, data: banks });
    } catch (error) {
      next(error);
    }
  }

  static async createQuestionBank(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body.title) {
        throw Errors.badRequest('title is required');
      }

      const user = (req as any).user;
      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'UNIT_ADMIN';

      let teacherId = req.body.teacherId;
      if (!isAdmin) {
        const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
        if (!teacher) {
          throw Errors.badRequest('No teacher profile found for this user');
        }
        teacherId = teacher.id;
      } else if (!teacherId) {
        throw Errors.badRequest('teacherId is required for admins to create a question bank');
      }

      if (user.role !== 'SUPER_ADMIN' && !user.unitId) {
        throw Errors.badRequest('User has no unit assigned');
      }

      const unitId = user.role === 'SUPER_ADMIN' ? req.body.unitId : user.unitId;
      if (!unitId) {
        throw Errors.badRequest('unitId is required');
      }

      const bank = await CBTService.createQuestionBank({
        ...req.body,
        teacherId,
        unitId,
      });
      res.status(201).json({ success: true, data: bank });
    } catch (error) {
      next(error);
    }
  }

  static async getQuestionBankById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const bank = await CBTService.getQuestionBankById(req.params.id, user);
      res.json({ success: true, data: bank });
    } catch (error) {
      next(error);
    }
  }

  static async deleteQuestionBank(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      await CBTService.deleteQuestionBank(req.params.id, user);
      res.json({ success: true, message: 'Question Bank deleted' });
    } catch (error) {
      next(error);
    }
  }

  // --- Questions ---
  static async addQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const question = await CBTService.addQuestion(
        {
          ...req.body,
          bankId: req.params.id,
        },
        user
      );
      res.status(201).json({ success: true, data: question });
    } catch (error) {
      next(error);
    }
  }

  static async updateQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const question = await CBTService.updateQuestion(req.params.questionId, req.body, user);
      res.json({ success: true, data: question });
    } catch (error) {
      next(error);
    }
  }

  static async deleteQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      await CBTService.deleteQuestion(req.params.questionId, user);
      res.json({ success: true, message: 'Question deleted' });
    } catch (error) {
      next(error);
    }
  }

  // --- Exam Scheduling ---
  static async getExams(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { unitId, academicYearId, subjectId, search, status, page, limit } = req.query;

      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'UNIT_ADMIN';

      if (user.role !== 'SUPER_ADMIN' && !user.unitId) {
        throw Errors.badRequest('User has no unit assigned');
      }

      const filterUnitId = user.role === 'SUPER_ADMIN' ? (unitId as string) : user.unitId;

      if (user.role !== 'SUPER_ADMIN' && !filterUnitId) {
        throw Errors.badRequest('unitId is required for data isolation');
      }

      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;

      const result = await CBTService.getExams({
        page: pageNum,
        limit: limitNum,
        teacherUserId: isAdmin ? undefined : user.id,
        unitId: filterUnitId,
        academicYearId: academicYearId as string,
        subjectId: subjectId as string,
        search: search as string,
        status: status as any,
      });
      res.json({ success: true, data: result.data, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }

  static async createExam(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body.questionBankId) {
        throw Errors.badRequest('questionBankId is required');
      }

      if (!req.body.title) {
        throw Errors.badRequest('title is required');
      }

      const user = (req as any).user;
      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'UNIT_ADMIN';

      let teacherId = req.body.teacherId;
      if (!isAdmin) {
        const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
        if (!teacher) {
          throw Errors.badRequest('No teacher profile found for this user');
        }
        teacherId = teacher.id;
      } else if (!teacherId) {
        throw Errors.badRequest('teacherId is required for admins to create an exam');
      }

      if (user.role !== 'SUPER_ADMIN' && !user.unitId) {
        throw Errors.badRequest('User has no unit assigned');
      }

      const unitId = user.role === 'SUPER_ADMIN' ? req.body.unitId : user.unitId;
      if (!unitId) {
        throw Errors.badRequest('unitId is required');
      }

      const exam = await CBTService.createExam(
        {
          ...req.body,
          teacherId,
          unitId,
        },
        user
      );
      res.status(201).json({ success: true, data: exam });
    } catch (error) {
      next(error);
    }
  }

  static async getExamMonitoring(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const monitoringData = await CBTService.getExamMonitoring(req.params.examId, user);
      res.json({ success: true, data: monitoringData });
    } catch (error) {
      next(error);
    }
  }

  // --- Teacher Grading ---
  static async getAttemptForGrading(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const attempt = await CBTService.getAttemptForGrading(req.params.attemptId, user);
      res.json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  static async gradeEssayAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { questionId, score, isCorrect } = req.body;
      const result = await CBTService.gradeEssayAnswer(
        req.params.attemptId,
        questionId,
        { score, isCorrect },
        user
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // --- Exam Taking ---
  static async startExam(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const student = await prisma.student.findUnique({ where: { userId: user.id } });
      if (!student) {
        throw Errors.unauthorized('User is not a student');
      }
      const attempt = await CBTService.startExamAttempt(req.params.examId, student.id);
      res.status(201).json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  static async getAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const student = await prisma.student.findUnique({ where: { userId: user.id } });
      if (!student) {
        throw Errors.unauthorized('User is not a student');
      }
      const attempt = await CBTService.getAttempt(req.params.attemptId, student.id);
      res.json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  static async submitAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const { questionId, answer } = req.body;
      const user = (req as any).user;

      const student = await prisma.student.findUnique({ where: { userId: user.id } });
      if (!student) {
        throw Errors.unauthorized('User is not a student');
      }

      await CBTService.submitAnswer(req.params.attemptId, questionId, answer, student.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  static async finishExam(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const student = await prisma.student.findUnique({ where: { userId: user.id } });
      if (!student) {
        throw Errors.unauthorized('User is not a student');
      }

      const attempt = await CBTService.finishExamAttempt(req.params.attemptId, student.id);
      res.json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }
}
