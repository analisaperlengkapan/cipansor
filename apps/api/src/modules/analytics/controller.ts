import { Request, Response, NextFunction } from "express";
import * as service from "./service";

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = req.query;
    const stats = await service.getDashboardStats(unitId as string | undefined);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getStudentStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = req.query;
    const stats = await service.getStudentStats(unitId as string | undefined);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getTahfidzStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, startDate, endDate } = req.query;
    const stats = await service.getTahfidzStats(
      unitId as string | undefined,
      { startDate: startDate as string, endDate: endDate as string }
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getFinanceStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, startDate, endDate } = req.query;
    const stats = await service.getFinanceStats(
      unitId as string | undefined,
      { startDate: startDate as string, endDate: endDate as string }
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getAttendanceStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, startDate, endDate } = req.query;
    const stats = await service.getAttendanceStats(
      unitId as string | undefined,
      { startDate: startDate as string, endDate: endDate as string }
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getAcademicStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = req.query;
    const stats = await service.getAcademicStats(unitId as string | undefined);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getLibraryStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = req.query;
    const stats = await service.getLibraryStats(unitId as string | undefined);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getPSBStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = req.query;
    const stats = await service.getPSBStats(unitId as string | undefined);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
