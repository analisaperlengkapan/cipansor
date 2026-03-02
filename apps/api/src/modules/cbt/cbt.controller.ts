import { Request, Response, NextFunction } from 'express';
import { CBTService } from './cbt.service';
import { Errors } from '@/middleware/error';
import { prisma } from '@/lib/prisma';

export class CBTController {
  // Helper to resolve student ID
  private static async getStudentId(userId: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw Errors.forbidden('User is not a student');
    return student.id;
  }

  // --- Banks ---
  static async getQuestionBanks(req: Request, res: Response, next: NextFunction) {
    try {
      // Filters
      const { unitId, subjectId, search } = req.query;
      const user = (req as any).user;

      const banks = await CBTService.getQuestionBanks({
        unitId: unitId as string,
        subjectId: subjectId as string,
        teacherId: user.role.includes('ADMIN') ? undefined : user.id, // Admins see all, teachers see theirs? Or maybe filtered by unit.
        // For now, let's allow filtering.
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
      const bank = await CBTService.createQuestionBank({
        ...req.body,
        teacherId: user.id, // Force creator
        unitId: user.unitId || req.body.unitId, // Fallback if user has no unit
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

  // --- Exam Taking (Student) ---

  static async getStudentExams(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const studentId = await CBTController.getStudentId(user.id);
      const exams = await CBTService.getStudentExams(studentId);
      res.json({ success: true, data: exams });
    } catch (error) {
      next(error);
    }
  }

  static async startExam(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const studentId = await CBTController.getStudentId(user.id);
      const attempt = await CBTService.startExamAttempt(req.params.examId, studentId);
      res.status(201).json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  static async getAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const studentId = await CBTController.getStudentId(user.id);
      const attempt = await CBTService.getAttempt(req.params.attemptId, studentId);
      res.json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  static async submitAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const { questionId, answer } = req.body;
      const user = (req as any).user;
      const studentId = await CBTController.getStudentId(user.id);

      await CBTService.submitAnswer(req.params.attemptId, questionId, answer, studentId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  static async finishExam(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const studentId = await CBTController.getStudentId(user.id);

      const attempt = await CBTService.finishExamAttempt(req.params.attemptId, studentId);
      res.json({ success: true, data: attempt });
    } catch (error) {
      next(error);
    }
  }

  static async gradeAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const { attemptId } = req.params;
      const grades = req.body.grades;
      if (!Array.isArray(grades) || !grades.every((g: any) => typeof g.answerId === 'string' && typeof g.score === 'number' && isFinite(g.score))) {
          throw Errors.badRequest('Grades must be an array of objects containing answerId (string) and score (finite number)');
      }
      const user = (req as any).user;
      const result = await CBTService.gradeManualAnswers(attemptId, user.id, grades, user.role);
      res.json({ message: 'Exam graded successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getAttemptsForGrading(req: Request, res: Response, next: NextFunction) {
      try {
          const user = (req as any).user;
          const result = await CBTService.getTeacherAttemptsForGrading(user.id, user.role);
          res.json({ data: result });
      } catch (error) {
          next(error);
      }
  }

  static async getTeacherAttempt(req: Request, res: Response, next: NextFunction) {
      try {
          const user = (req as any).user;
          const result = await CBTService.getTeacherAttemptDetail(req.params.attemptId, user.id, user.role);
          res.json({ data: result });
      } catch (error) {
          next(error);
      }
  }
}
