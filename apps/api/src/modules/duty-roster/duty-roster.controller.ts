import { Request, Response, NextFunction } from 'express';
import { dutyRosterService } from './duty-roster.service';

export class DutyRosterController {
  // ==================
  // DUTY TYPE METHODS
  // ==================

  async listTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const query = {
        unitId: (req.query as any).unitId as string | undefined,
        category: (req.query as any).category as any,
        isActive:
          (req.query as any).isActive === 'true' ? true : (req.query as any).isActive === 'false' ? false : undefined,
        page: parseInt((req.query as any).page as string) || 1,
        limit: parseInt((req.query as any).limit as string) || 20,
      };
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const result = await dutyRosterService.listTypes(query, user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getTypeById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const type = await dutyRosterService.getTypeById(id, user);
      res.json({ data: type });
    } catch (error) {
      next(error);
    }
  }

  async createType(req: Request, res: Response, next: NextFunction) {
    try {
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const type = await dutyRosterService.createType(req.body, user);
      res.status(201).json({ data: type });
    } catch (error) {
      next(error);
    }
  }

  async updateType(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const type = await dutyRosterService.updateType(id, req.body, user);
      res.json({ data: type });
    } catch (error) {
      next(error);
    }
  }

  async deleteType(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      await dutyRosterService.deleteType(id, user);
      res.json({ success: true, message: 'Duty type deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ==================
  // ROSTER METHODS
  // ==================

  async listRosters(req: Request, res: Response, next: NextFunction) {
    try {
      const query = {
        unitId: (req.query as any).unitId as string | undefined,
        dutyTypeId: (req.query as any).dutyTypeId as string | undefined,
        studentId: (req.query as any).studentId as string | undefined,
        date: (req.query as any).date as string | undefined,
        startDate: (req.query as any).startDate as string | undefined,
        endDate: (req.query as any).endDate as string | undefined,
        status: (req.query as any).status as any,
        page: parseInt((req.query as any).page as string) || 1,
        limit: parseInt((req.query as any).limit as string) || 50,
      };
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const result = await dutyRosterService.listRosters(query, user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getRosterById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const roster = await dutyRosterService.getRosterById(id, user);
      res.json({ data: roster });
    } catch (error) {
      next(error);
    }
  }

  async createRoster(req: Request, res: Response, next: NextFunction) {
    try {
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const roster = await dutyRosterService.createRoster(req.body, user);
      res.status(201).json({ data: roster });
    } catch (error) {
      next(error);
    }
  }

  async bulkCreateRosters(req: Request, res: Response, next: NextFunction) {
    try {
      const { rosters } = req.body;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const result = await dutyRosterService.bulkCreateRosters(rosters, user);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateRoster(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const roster = await dutyRosterService.updateRoster(id, req.body, user);
      res.json({ data: roster });
    } catch (error) {
      next(error);
    }
  }

  async deleteRoster(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      await dutyRosterService.deleteRoster(id, user);
      res.json({ success: true, message: 'Roster deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ==================
  // ROSTER ACTIONS
  // ==================

  async completeDuty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const roster = await dutyRosterService.completeDuty(id, user);
      res.json({ data: roster });
    } catch (error) {
      next(error);
    }
  }

  async markAbsent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const { notes } = req.body;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const roster = await dutyRosterService.markAbsent(id, notes || '', user);
      res.json({ data: roster });
    } catch (error) {
      next(error);
    }
  }

  async assignSubstitute(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const { substituteId } = req.body;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const roster = await dutyRosterService.assignSubstitute(id, substituteId, user);
      res.json({ data: roster });
    } catch (error) {
      next(error);
    }
  }

  async verifyDuty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const roster = await dutyRosterService.verifyDuty(id, user);
      res.json({ data: roster });
    } catch (error) {
      next(error);
    }
  }

  // ==================
  // QUERIES
  // ==================

  async getTodayDuties(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = (req.params as any);
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const rosters = await dutyRosterService.getTodayDuties(unitId, user);
      res.json({ data: rosters });
    } catch (error) {
      next(error);
    }
  }

  async getStudentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = (req.params as any);
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const limit = parseInt((req.query as any).limit as string) || 30;
      const history = await dutyRosterService.getStudentHistory(studentId, user, limit);
      res.json({ data: history });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = (req.params as any);
      const startDate = (req.query as any).startDate as string | undefined;
      const endDate = (req.query as any).endDate as string | undefined;
      const stats = await dutyRosterService.getStatistics(unitId, startDate, endDate);
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const dutyRosterController = new DutyRosterController();
