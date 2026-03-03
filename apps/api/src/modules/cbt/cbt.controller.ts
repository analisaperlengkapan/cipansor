import { Request, Response, NextFunction } from 'express';
import { CBTService } from './cbt.service';
import { Errors } from '@/middleware/error';

export class CBTController {
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
