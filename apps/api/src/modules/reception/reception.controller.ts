import { Request, Response, NextFunction } from 'express';
import * as ReceptionService from './reception.service';
import { ApiResponse } from '@cipansor/shared';

// --- Stats ---

export const getStats = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    if (!user.unitId) {
      throw new Error('User does not have a unit assigned');
    }
    const data = await ReceptionService.getStats(user.unitId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// --- Guest Book ---

export const getGuestBooks = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    if (!user.unitId) {
      throw new Error('User does not have a unit assigned');
    }
    const data = await ReceptionService.getGuestBooks(user.unitId, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createGuestBook = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    if (!user.unitId) {
      throw new Error('User does not have a unit assigned');
    }
    const data = await ReceptionService.createGuestBook(user.unitId, user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateGuestBook = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const data = await ReceptionService.updateGuestBook(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// --- Student Visits ---

export const getStudentVisits = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    if (!user.unitId) {
      throw new Error('User does not have a unit assigned');
    }
    const data = await ReceptionService.getStudentVisits(user.unitId, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createStudentVisit = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    if (!user.unitId) {
      throw new Error('User does not have a unit assigned');
    }
    const data = await ReceptionService.createStudentVisit(user.unitId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateStudentVisit = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const data = await ReceptionService.updateStudentVisit(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// --- Packages ---

export const getPackages = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    if (!user.unitId) {
      throw new Error('User does not have a unit assigned');
    }
    const data = await ReceptionService.getPackages(user.unitId, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createPackage = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    if (!user.unitId) {
      throw new Error('User does not have a unit assigned');
    }
    const data = await ReceptionService.createPackage(user.unitId, user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updatePackage = async (
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const data = await ReceptionService.updatePackage(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
