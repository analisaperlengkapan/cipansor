import { Request, Response, NextFunction } from 'express';
import * as ReceptionService from './reception.service';
import { ApiResponse } from '@cipansor/shared';
import { ReceptionStats, GuestBook, StudentVisit, StudentPackage } from '@cipansor/shared';
import { Errors } from '../../middleware/error';

// --- Stats ---

export const getStats = async (
  req: Request,
  res: Response<ApiResponse<ReceptionStats>>,
  next: NextFunction
) => {
  try {
    if (!req.user?.unitId) {
      throw Errors.unauthorized('User does not have a unit assigned');
    }
    const data = await ReceptionService.getStats(req.user.unitId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// --- Guest Book ---

export const getGuestBooks = async (
  req: Request,
  res: Response<ApiResponse<GuestBook[]>>,
  next: NextFunction
) => {
  try {
    if (!req.user?.unitId) {
      throw Errors.unauthorized('User does not have a unit assigned');
    }
    const data = await ReceptionService.getGuestBooks(req.user.unitId, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createGuestBook = async (
  req: Request,
  res: Response<ApiResponse<GuestBook>>,
  next: NextFunction
) => {
  try {
    if (!req.user?.unitId || !req.user.id) {
      throw Errors.unauthorized('User does not have a unit assigned');
    }
    const data = await ReceptionService.createGuestBook(req.user.unitId, req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateGuestBook = async (
  req: Request,
  res: Response<ApiResponse<GuestBook>>,
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
  res: Response<ApiResponse<StudentVisit[]>>,
  next: NextFunction
) => {
  try {
    if (!req.user?.unitId) {
      throw Errors.unauthorized('User does not have a unit assigned');
    }
    const data = await ReceptionService.getStudentVisits(req.user.unitId, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createStudentVisit = async (
  req: Request,
  res: Response<ApiResponse<StudentVisit>>,
  next: NextFunction
) => {
  try {
    if (!req.user?.unitId) {
      throw Errors.unauthorized('User does not have a unit assigned');
    }
    const data = await ReceptionService.createStudentVisit(req.user.unitId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateStudentVisit = async (
  req: Request,
  res: Response<ApiResponse<StudentVisit>>,
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
  res: Response<ApiResponse<StudentPackage[]>>,
  next: NextFunction
) => {
  try {
    if (!req.user?.unitId) {
      throw Errors.unauthorized('User does not have a unit assigned');
    }
    const data = await ReceptionService.getPackages(req.user.unitId, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createPackage = async (
  req: Request,
  res: Response<ApiResponse<StudentPackage>>,
  next: NextFunction
) => {
  try {
    if (!req.user?.unitId || !req.user.id) {
      throw Errors.unauthorized('User does not have a unit assigned');
    }
    const data = await ReceptionService.createPackage(req.user.unitId, req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updatePackage = async (
  req: Request,
  res: Response<ApiResponse<StudentPackage>>,
  next: NextFunction
) => {
  try {
    const data = await ReceptionService.updatePackage(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
