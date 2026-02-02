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
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        studentId: req.query.studentId as string,
        // @ts-ignore
        activityType: req.query.activityType as any,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        surah: req.query.surah as string,
      };

      const result = await this.service.findAll(query, currentUser);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.findById(req.params.id);
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
      const id = req.params.id;
      const input: UpdateTahfidzInput = req.body;
      const result = await this.service.update(id, input);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const result = await this.service.delete(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getStudentSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId } = req.params;
      const result = await this.service.getStudentSummary(studentId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unitId = req.query.unitId as string;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;

      const result = await this.service.getDashboardStats({ unitId, year, month });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  generateCertificate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const createdById = (req as any).user.id;
      const input = req.body;

      // Fix issueDate conversion if needed
      const serviceInput: GenerateCertificateInput = {
        ...input,
        issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
      };

      const result = await this.service.generateCertificate(serviceInput, createdById);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getQuranMap = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId } = req.params;
      const result = await getQuranProgressMap(studentId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
