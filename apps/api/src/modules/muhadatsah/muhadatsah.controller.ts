import { Request, Response, NextFunction } from 'express';
import { muhadatsahService } from './muhadatsah.service';

export class MuhadatsahController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = {
        unitId: (req.query as any).unitId as string,
        studentId: (req.query as any).studentId as string,
        partnerId: (req.query as any).partnerId as string,
        evaluatorId: (req.query as any).evaluatorId as string,
        status: (req.query as any).status as any,
        language: (req.query as any).language as string,
        startDate: (req.query as any).startDate as string,
        endDate: (req.query as any).endDate as string,
        page: parseInt((req.query as any).page as string) || 1,
        limit: parseInt((req.query as any).limit as string) || 20,
      };

      const result = await muhadatsahService.list(query, req.user!);
      res.json({ success: true, data: result.data, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const result = await muhadatsahService.getById(id, req.user!);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await muhadatsahService.create(req.body, req.user!);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const result = await muhadatsahService.update(id, req.body, req.user!);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const result = await muhadatsahService.delete(id, req.user!);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async evaluate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const result = await muhadatsahService.evaluate(id, req.body, req.user!);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const result = await muhadatsahService.cancel(id, req.user!);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getUpcoming(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = ((req.query as any).unitId as string) || req.user!.unitId || '';
      const limit = parseInt((req.query as any).limit as string) || 10;
      const result = await muhadatsahService.getUpcoming(unitId, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getStudentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = (req.params as any);
      const limit = parseInt((req.query as any).limit as string) || 20;
      const result = await muhadatsahService.getStudentHistory(studentId, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = ((req.query as any).unitId as string) || req.user!.unitId || '';
      const startDate = (req.query as any).startDate as string;
      const endDate = (req.query as any).endDate as string;
      const result = await muhadatsahService.getStatistics(unitId, startDate, endDate);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getTopPerformers(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = ((req.query as any).unitId as string) || req.user!.unitId || '';
      const language = (req.query as any).language as string;
      const limit = parseInt((req.query as any).limit as string) || 10;
      const result = await muhadatsahService.getTopPerformers(unitId, language, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async matchPartners(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = ((req.query as any).unitId as string) || req.user!.unitId || '';
      const language = ((req.query as any).language as string) || 'Arabic';
      const result = await muhadatsahService.matchPartners(unitId, language);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const muhadatsahController = new MuhadatsahController();
