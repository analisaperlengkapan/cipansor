import { Request, Response, NextFunction } from 'express';
import { counselingService } from './counseling.service';
import {
  CounselingStatus,
  CounselingCategory,
  CounselingPriority,
  ReferralType,
} from '@prisma/client';
import { ApiResponse } from '@cipansor/shared'; // Imported from shared
import {
  CounselingSession,
  CounselingNote,
  CounselingReferral,
  CounselingStats,
  CounselingListParams,
} from '@cipansor/shared';

export class CounselingController {
  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const user = { sub: req.user!.sub, roleCode: req.user!.roleCode, unitId: req.user!.unitId };
      const filters: CounselingListParams = {
        status: req.query.status as any,
        category: req.query.category as any,
        priority: req.query.priority as any,
        studentId: req.query.studentId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };

      const result = await counselingService.getSessions(filters, user);
      res.json({ success: true, data: result.data, total: result.total });
    } catch (error) {
      next(error);
    }
  }

  async getSessionById(
    req: Request,
    res: Response<ApiResponse<CounselingSession>>,
    next: NextFunction
  ) {
    try {
      const { sessionId } = req.params;
      const user = { sub: req.user!.sub, roleCode: req.user!.roleCode, unitId: req.user!.unitId };
      const session = await counselingService.getSessionById(sessionId, user);
      res.json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  async createSession(
    req: Request,
    res: Response<ApiResponse<CounselingSession>>,
    next: NextFunction
  ) {
    try {
      const user = { sub: req.user!.sub, roleCode: req.user!.roleCode, unitId: req.user!.unitId };
      const session = await counselingService.createSession(req.body, user);
      res.status(201).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  async updateSession(
    req: Request,
    res: Response<ApiResponse<CounselingSession>>,
    next: NextFunction
  ) {
    try {
      const { sessionId } = req.params;
      const user = { sub: req.user!.sub, roleCode: req.user!.roleCode, unitId: req.user!.unitId };
      const session = await counselingService.updateSession(sessionId, req.body, user);
      res.json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  async deleteSession(req: Request, res: Response<ApiResponse<null>>, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const user = { sub: req.user!.sub, roleCode: req.user!.roleCode, unitId: req.user!.unitId };
      await counselingService.deleteSession(sessionId, user);
      res.json({ success: true, data: null, message: 'Session deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async addNote(req: Request, res: Response<ApiResponse<CounselingNote>>, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const user = { sub: req.user!.sub, roleCode: req.user!.roleCode, unitId: req.user!.unitId };
      const note = await counselingService.addNote(sessionId, req.body, user);
      res.status(201).json({ success: true, data: note });
    } catch (error) {
      next(error);
    }
  }

  async updateNote(req: Request, res: Response<ApiResponse<CounselingNote>>, next: NextFunction) {
    try {
      const { noteId } = req.params;
      const user = { sub: req.user!.sub, roleCode: req.user!.roleCode, unitId: req.user!.unitId };
      const note = await counselingService.updateNote(noteId, req.body, user);
      res.json({ success: true, data: note });
    } catch (error) {
      next(error);
    }
  }

  async deleteNote(req: Request, res: Response<ApiResponse<null>>, next: NextFunction) {
    try {
      const { noteId } = req.params;
      const user = { sub: req.user!.sub, roleCode: req.user!.roleCode, unitId: req.user!.unitId };
      await counselingService.deleteNote(noteId, user);
      res.json({ success: true, data: null, message: 'Note deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async addReferral(
    req: Request,
    res: Response<ApiResponse<CounselingReferral>>,
    next: NextFunction
  ) {
    try {
      const { sessionId } = req.params;
      const user = { sub: req.user!.sub, roleCode: req.user!.roleCode, unitId: req.user!.unitId };
      const referral = await counselingService.addReferral(sessionId, req.body, user);
      res.status(201).json({ success: true, data: referral });
    } catch (error) {
      next(error);
    }
  }

  async updateReferral(
    req: Request,
    res: Response<ApiResponse<CounselingReferral>>,
    next: NextFunction
  ) {
    try {
      const { referralId } = req.params;
      const user = { sub: req.user!.sub, roleCode: req.user!.roleCode, unitId: req.user!.unitId };
      const referral = await counselingService.updateReferral(referralId, req.body, user);
      res.json({ success: true, data: referral });
    } catch (error) {
      next(error);
    }
  }

  async deleteReferral(req: Request, res: Response<ApiResponse<null>>, next: NextFunction) {
    try {
      const { referralId } = req.params;
      const user = { sub: req.user!.sub, roleCode: req.user!.roleCode, unitId: req.user!.unitId };
      await counselingService.deleteReferral(referralId, user);
      res.json({ success: true, data: null, message: 'Referral deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getStudentHistory(
    req: Request,
    res: Response<ApiResponse<CounselingSession[]>>,
    next: NextFunction
  ) {
    try {
      const { studentId } = req.params;
      const user = { sub: req.user!.sub, roleCode: req.user!.roleCode, unitId: req.user!.unitId };
      const history = await counselingService.getStudentHistory(studentId, user);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  async getMySessions(
    req: Request,
    res: Response<ApiResponse<CounselingSession[]>>,
    next: NextFunction
  ) {
    try {
      const user = { sub: req.user!.sub, roleCode: req.user!.roleCode, unitId: req.user!.unitId };
      const sessions = await counselingService.getCounselorSessions(user);
      res.json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(
    req: Request,
    res: Response<ApiResponse<CounselingStats>>,
    next: NextFunction
  ) {
    try {
      const user = { sub: req.user!.sub, roleCode: req.user!.roleCode, unitId: req.user!.unitId };
      const stats = await counselingService.getStatistics(user);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const counselingController = new CounselingController();
