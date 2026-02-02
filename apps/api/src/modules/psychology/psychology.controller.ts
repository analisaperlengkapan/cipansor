import { Request, Response, NextFunction } from 'express';
import { psychologyService } from './psychology.service';
import { sendResponse } from '@/utils/response';
import httpStatus from 'http-status';

export class PsychologyController {
  // Tests
  async getTests(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = req.query.unitId as string;
      const result = await psychologyService.getTests(unitId, req.user);
      sendResponse(res, httpStatus.OK, { data: result });
    } catch (error) {
      next(error);
    }
  }

  async getTestById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await psychologyService.getTestById(req.params.id);
      sendResponse(res, httpStatus.OK, { data: result });
    } catch (error) {
        next(error);
    }
  }

  async createTest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await psychologyService.createTest(req.body, req.user);
      sendResponse(res, httpStatus.CREATED, { data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateTest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await psychologyService.updateTest(req.params.id, req.body, req.user);
      sendResponse(res, httpStatus.OK, { data: result });
    } catch (error) {
      next(error);
    }
  }

  async deleteTest(req: Request, res: Response, next: NextFunction) {
      try {
          await psychologyService.deleteTest(req.params.id, req.user);
          sendResponse(res, httpStatus.OK, { message: 'Test deleted successfully' });
      } catch (error) {
          next(error);
      }
  }

  // Records
  async getRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        studentId: req.query.studentId as string,
        testId: req.query.testId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      const result = await psychologyService.getRecords(filters, req.user);
      sendResponse(res, httpStatus.OK, { data: result });
    } catch (error) {
      next(error);
    }
  }

  async getRecordById(req: Request, res: Response, next: NextFunction) {
      try {
          const result = await psychologyService.getRecordById(req.params.id, req.user);
          sendResponse(res, httpStatus.OK, { data: result });
      } catch (error) {
          next(error);
      }
  }

  async createRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await psychologyService.createRecord(req.body, req.user);
      sendResponse(res, httpStatus.CREATED, { data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateRecord(req: Request, res: Response, next: NextFunction) {
      try {
          const result = await psychologyService.updateRecord(req.params.id, req.body, req.user);
          sendResponse(res, httpStatus.OK, { data: result });
      } catch (error) {
          next(error);
      }
  }

  async deleteRecord(req: Request, res: Response, next: NextFunction) {
      try {
          await psychologyService.deleteRecord(req.params.id, req.user);
          sendResponse(res, httpStatus.OK, { message: 'Record deleted successfully' });
      } catch (error) {
          next(error);
      }
  }
}

export const psychologyController = new PsychologyController();
