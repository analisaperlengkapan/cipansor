import { Request, Response, NextFunction } from 'express';
import { calendarService } from './calendar.service';

export class CalendarController {
  async listEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const query = {
        unitId: (req.query as any).unitId as string | undefined,
        classId: (req.query as any).classId as string | undefined,
        eventType: (req.query as any).eventType as any,
        startDate: (req.query as any).startDate as string | undefined,
        endDate: (req.query as any).endDate as string | undefined,
        month: (req.query as any).month ? parseInt((req.query as any).month as string) : undefined,
        year: (req.query as any).year ? parseInt((req.query as any).year as string) : undefined,
        search: (req.query as any).search as string | undefined,
        isPublic:
          (req.query as any).isPublic === 'true' ? true : (req.query as any).isPublic === 'false' ? false : undefined,
        page: parseInt((req.query as any).page as string) || 1,
        limit: parseInt((req.query as any).limit as string) || 50,
      };
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const result = await calendarService.findAll(query, user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getEventById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const event = await calendarService.findById(id, user);
      res.json({ data: event });
    } catch (error) {
      next(error);
    }
  }

  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const event = await calendarService.create(req.body, user);
      res.status(201).json({ data: event });
    } catch (error) {
      next(error);
    }
  }

  async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const event = await calendarService.update(id, req.body, user);
      res.json({ data: event });
    } catch (error) {
      next(error);
    }
  }

  async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      await calendarService.delete(id, user);
      res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getUpcomingEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = (req.params as any);
      const limit = parseInt((req.query as any).limit as string) || 10;
      const events = await calendarService.getUpcoming(unitId, limit);
      res.json({ data: events });
    } catch (error) {
      next(error);
    }
  }

  async getTodayEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = (req.params as any);
      const events = await calendarService.getToday(unitId);
      res.json({ data: events });
    } catch (error) {
      next(error);
    }
  }

  async getHolidays(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = (req.params as any);
      const startDate = (req.query as any).startDate as string;
      const endDate = (req.query as any).endDate as string;
      const events = await calendarService.getHolidays(unitId, startDate, endDate);
      res.json({ data: events });
    } catch (error) {
      next(error);
    }
  }

  async bulkCreateEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { events } = req.body;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const result = await calendarService.bulkCreate(events, user);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async importAcademicCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const { events } = req.body;
      const user = { sub: req.user!.sub, role: req.user!.role, unitId: req.user!.unitId };
      const result = await calendarService.bulkCreate(events, user);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async generateRecurringEvents(req: Request, res: Response, next: NextFunction) {
    try {
      // For now, just return a placeholder - recurrence can be complex
      res.json({ message: 'Recurring event generation not yet implemented' });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const unitId = (req.query as any).unitId as string | undefined;
      const startDate = (req.query as any).startDate as string | undefined;
      const endDate = (req.query as any).endDate as string | undefined;
      const stats = await calendarService.getStatistics(unitId, startDate, endDate);
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const calendarController = new CalendarController();
