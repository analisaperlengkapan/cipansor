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
      const filterUnitId = user.role === 'SUPER_ADMIN' ? (unitId as string) : user.unitId;

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

      const bank = await CBTService.createQuestionBank({
        ...req.body,
        teacherId,
        unitId: user.unitId || req.body.unitId,
      });
      res.status(201).json({ success: true, data: bank });
    } catch (error) {
      next(error);
    }
  }

  static async getQuestionBankById(req: Request, res: Response, next: NextFunction) {
    try {
      const bank = await CBTService.getQuestionBankById(req.params.id);
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
      const { unitId, academicYearId, subjectId, search, status } = req.query;

      const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'UNIT_ADMIN';
      const filterUnitId = user.role === 'SUPER_ADMIN' ? (unitId as string) : user.unitId;
      if (!filterUnitId && user.role === 'UNIT_ADMIN') {
        return res.json({ success: true, data: [] });
      }

      const exams = await CBTService.getExams({
        teacherUserId: isAdmin ? undefined : user.id,
        unitId: filterUnitId,
        academicYearId: academicYearId as string,
        subjectId: subjectId as string,
        search: search as string,
        status: status as any,
      });
      res.json({ success: true, data: exams });
    } catch (error) {
      next(error);
    }
  }

  static async createExam(req: Request, res: Response, next: NextFunction) {
    try {
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

      const exam = await CBTService.createExam(
        {
          ...req.body,
          teacherId,
          unitId: user.unitId || req.body.unitId,
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
      const attempt = await CBTService.startExamAttempt(req.params.examId, user.studentId);
      res.status(201).json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  static async getAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const attempt = await CBTService.getAttempt(req.params.attemptId, user.studentId);
      res.json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  static async submitAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const { questionId, answer } = req.body;
      // We should verify attempt belongs to user
      const user = (req as any).user;
      // Basic check done in service usually, but let's trust attemptId for now or add check
      await CBTService.submitAnswer(req.params.attemptId, questionId, answer);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  static async finishExam(req: Request, res: Response, next: NextFunction) {
    try {
      const attempt = await CBTService.finishExamAttempt(req.params.attemptId);
      res.json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }
}
