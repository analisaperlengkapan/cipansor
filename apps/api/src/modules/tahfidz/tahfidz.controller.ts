import { NextFunction, Request, Response } from 'express';
import { TahfidzService, tahfidzService } from './tahfidz.service';
import { CreateTahfidzInput, UpdateTahfidzInput, GenerateCertificateInput } from '@cipansor/shared';
import { getQuranProgressMap } from './tahfidz.analytics';

export class TahfidzController {
  private service: TahfidzService;

  constructor() {
    this.service = tahfidzService;
  }

  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = (req as any).user;
      const query = {
        page: Number((req.query as any).page) || 1,
        limit: Number((req.query as any).limit) || 10,
        studentId: (req.query as any).studentId as string,
        activityType: (req.query as any).activityType as string,
        startDate: (req.query as any).startDate as string,
        endDate: (req.query as any).endDate as string,
        surah: (req.query as any).surah as string,
      };

      const result = await this.service.findAll(query, currentUser);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.findById((req.params as any).id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const recordedById = (req as any).user.id;
      const input: CreateTahfidzInput = req.body;
      const result = await this.service.create(input, recordedById);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = (req.params as any).id;
      const input: UpdateTahfidzInput = req.body;
      const result = await this.service.update(id, input);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = (req.params as any).id;
      const result = await this.service.delete(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getStudentSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId } = (req.params as any);
      const result = await this.service.getStudentSummary(studentId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = (req.query as any).unitId as string;
      const year = (req.query as any).year ? parseInt((req.query as any).year as string) : undefined;
      const month = (req.query as any).month ? parseInt((req.query as any).month as string) : undefined;

      const result = await this.service.getDashboardStats({ unitId, year, month });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  generateCertificate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const createdById = (req as any).user.id;
      const input: GenerateCertificateInput = req.body;
      const result = await this.service.generateCertificate(input, createdById);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getQuranMap = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId } = (req.params as any);
      const result = await getQuranProgressMap(studentId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
