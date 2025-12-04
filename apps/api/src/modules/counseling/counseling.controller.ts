import { Request, Response, NextFunction } from 'express';
import { counselingService } from './counseling.service';
import { CounselingStatus, CounselingCategory, CounselingPriority, ReferralType } from '@prisma/client';

export class CounselingController {
  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const filters = {
        status: req.query.status as CounselingStatus | undefined,
        category: req.query.category as CounselingCategory | undefined,
        priority: req.query.priority as CounselingPriority | undefined,
        studentId: req.query.studentId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      const sessions = await counselingService.getSessions(filters, user);
      res.json({ data: sessions });
    } catch (error) {
      next(error);
    }
  }

  async getSessionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const session = await counselingService.getSessionById(sessionId, user);
      res.json({ data: session });
    } catch (error) {
      next(error);
    }
  }

  async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const session = await counselingService.createSession(req.body, user);
      res.status(201).json({ data: session });
    } catch (error) {
      next(error);
    }
  }

  async updateSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const session = await counselingService.updateSession(sessionId, req.body, user);
      res.json({ data: session });
    } catch (error) {
      next(error);
    }
  }

  async deleteSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      await counselingService.deleteSession(sessionId, user);
      res.json({ success: true, message: 'Session deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async addNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const note = await counselingService.addNote(sessionId, req.body, user);
      res.status(201).json({ data: note });
    } catch (error) {
      next(error);
    }
  }

  async updateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { noteId } = req.params;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const note = await counselingService.updateNote(noteId, req.body, user);
      res.json({ data: note });
    } catch (error) {
      next(error);
    }
  }

  async deleteNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { noteId } = req.params;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      await counselingService.deleteNote(noteId, user);
      res.json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async addReferral(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const referral = await counselingService.addReferral(sessionId, req.body, user);
      res.status(201).json({ data: referral });
    } catch (error) {
      next(error);
    }
  }

  async updateReferral(req: Request, res: Response, next: NextFunction) {
    try {
      const { referralId } = req.params;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const referral = await counselingService.updateReferral(referralId, req.body, user);
      res.json({ data: referral });
    } catch (error) {
      next(error);
    }
  }

  async deleteReferral(req: Request, res: Response, next: NextFunction) {
    try {
      const { referralId } = req.params;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      await counselingService.deleteReferral(referralId, user);
      res.json({ success: true, message: 'Referral deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getStudentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const history = await counselingService.getStudentHistory(studentId, user);
      res.json({ data: history });
    } catch (error) {
      next(error);
    }
  }

  async getMySessions(req: Request, res: Response, next: NextFunction) {
    try {
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const sessions = await counselingService.getCounselorSessions(user);
      res.json({ data: sessions });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const stats = await counselingService.getStatistics(user);
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const counselingController = new CounselingController();
