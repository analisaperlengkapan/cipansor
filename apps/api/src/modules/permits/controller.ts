import { Request, Response, NextFunction } from 'express';
import * as permitService from './service';
import {
  createPermitSchema,
  updatePermitStatusSchema,
  markReturnedSchema,
  queryPermitSchema,
} from './schema';
import { Errors } from '../../middleware/error';

export async function createPermit(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createPermitSchema.parse(req.body);
    const permit = await permitService.createPermit(data);
    res.status(201).json({
      success: true,
      message: 'Permit request created successfully',
      data: permit,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPermits(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryPermitSchema.parse(res.locals.validatedQuery || (req.query as any));
    const result = await permitService.getPermits(query);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPermitById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = (req.params as any);
    const permit = await permitService.getPermitById(id);
    if (!permit) {
      throw Errors.notFound('Permit');
    }
    res.json({
      success: true,
      data: permit,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePermitStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = (req.params as any);
    const data = updatePermitStatusSchema.parse(req.body);
    const userId = req.user?.sub;

    if (!userId) {
      throw Errors.unauthorized();
    }

    const permit = await permitService.updatePermitStatus(id, data, userId);
    res.json({
      success: true,
      message: `Permit ${data.status.toLowerCase()} successfully`,
      data: permit,
    });
  } catch (error) {
    next(error);
  }
}

export async function markReturned(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = (req.params as any);
    const data = markReturnedSchema.parse(req.body);
    const permit = await permitService.markReturned(id, data.returnedAt);
    res.json({
      success: true,
      message: 'Student marked as returned',
      data: permit,
    });
  } catch (error) {
    next(error);
  }
}

export async function markDeparted(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = (req.params as any);
    const permit = await permitService.markDeparted(id);
    res.json({
      success: true,
      message: 'Student marked as departed',
      data: permit,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPermitByCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = (req.params as any);
    const permit = await permitService.getPermitByCode(code);
    if (!permit) {
      throw Errors.notFound('Permit not found');
    }
    res.json({
      success: true,
      data: permit,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudentActivePermit(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = (req.params as any);
    const permit = await permitService.getStudentActivePermit(studentId);
    res.json({
      success: true,
      data: permit,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPermitStats(req: Request, res: Response, next: NextFunction) {
  try {
    const unitId = (req.query as any).unitId as string | undefined;
    const stats = await permitService.getPermitStats(unitId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
