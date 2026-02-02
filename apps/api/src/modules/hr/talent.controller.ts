import { Request, Response, NextFunction } from 'express';
import * as service from './talent.service';
import {
  createCompetencySchema,
  updateCompetencySchema,
  createTrainingProgramSchema,
  updateTrainingProgramSchema,
  createEmployeeCompetencySchema,
  updateEmployeeCompetencySchema,
  enrollTrainingSchema,
  updateEmployeeTrainingSchema,
  createPerformanceReviewSchema,
  updatePerformanceReviewSchema,
} from './schema';
import { Errors } from '../../middleware/error';
import { z } from 'zod';

// =====================================
// COMPETENCY CONTROLLERS
// =====================================

export async function getCompetencies(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const category = req.query.category as string;

    const result = await service.getCompetencies({ page, limit, search, category });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function createCompetency(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createCompetencySchema.parse(req.body);
    const result = await service.createCompetency(data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateCompetency(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateCompetencySchema.parse(req.body);
    const result = await service.updateCompetency(req.params.id, data);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteCompetency(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteCompetency(req.params.id);
    res.json({ success: true, message: 'Competency deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// =====================================
// EMPLOYEE COMPETENCIES
// =====================================

export async function getEmployeeCompetencies(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'UNIT_ADMIN') {
      if (userId !== currentUser.sub) {
        throw Errors.forbidden('Access denied');
      }
    }

    const result = await service.getEmployeeCompetencies(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function addEmployeeCompetency(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createEmployeeCompetencySchema.parse(req.body);
    const result = await service.addEmployeeCompetency(data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeeCompetency(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateEmployeeCompetencySchema.parse(req.body);
    const result = await service.updateEmployeeCompetency(req.params.id, data);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function removeEmployeeCompetency(req: Request, res: Response, next: NextFunction) {
  try {
    await service.removeEmployeeCompetency(req.params.id);
    res.json({ success: true, message: 'Competency removed from employee' });
  } catch (error) {
    next(error);
  }
}

// =====================================
// TRAINING CONTROLLERS
// =====================================

export async function getTrainingPrograms(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const result = await service.getTrainingPrograms({ page, limit, search });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function createTrainingProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createTrainingProgramSchema.parse(req.body);
    const result = await service.createTrainingProgram(data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateTrainingProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateTrainingProgramSchema.parse(req.body);
    const result = await service.updateTrainingProgram(req.params.id, data);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteTrainingProgram(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteTrainingProgram(req.params.id);
    res.json({ success: true, message: 'Training program deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// =====================================
// EMPLOYEE TRAINING
// =====================================

export async function getEmployeeTrainings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId;
    const currentUser = req.user!;

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'UNIT_ADMIN') {
      if (userId !== currentUser.sub) {
        throw Errors.forbidden('Access denied');
      }
    }

    const result = await service.getEmployeeTrainings(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function enrollEmployeeToTraining(req: Request, res: Response, next: NextFunction) {
  try {
    const data = enrollTrainingSchema.parse(req.body);
    const result = await service.enrollEmployeeToTraining(data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeeTraining(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateEmployeeTrainingSchema.parse(req.body);
    const result = await service.updateEmployeeTraining(req.params.id, data);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// =====================================
// PERFORMANCE REVIEWS
// =====================================

export async function getPerformanceReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    let userId = req.query.userId as string;
    const reviewerId = req.query.reviewerId as string;
    const cycleName = req.query.cycleName as string;
    const status = req.query.status as string;

    const currentUser = req.user!;
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'UNIT_ADMIN') {
      // If specific reviewer requested
      if (reviewerId) {
        if (reviewerId !== currentUser.sub) throw Errors.forbidden('Cannot view reviews of other reviewers');
      } else {
        // If client sends userId other than me, and I'm not looking as reviewer:
        if (userId && userId !== currentUser.sub) {
          throw Errors.forbidden('Cannot view reviews of other employees');
        }

        // If no filters provided, default to MY reviews (as subject)
        if (!userId && !reviewerId) {
          userId = currentUser.sub;
        }
      }
    }

    const result = await service.getPerformanceReviews({
      page,
      limit,
      userId,
      reviewerId,
      cycleName,
      status,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getReviewById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getReviewById(req.params.id);
    if (!result) throw Errors.notFound('Review not found');

    const currentUser = req.user!;
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'UNIT_ADMIN') {
      if (result.userId !== currentUser.sub && result.reviewerId !== currentUser.sub) {
        throw Errors.forbidden('Access denied');
      }
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createPerformanceReview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createPerformanceReviewSchema.parse(req.body);
    const result = await service.createPerformanceReview(data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updatePerformanceReview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updatePerformanceReviewSchema.parse(req.body);
    const result = await service.updatePerformanceReview(req.params.id, data);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deletePerformanceReview(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deletePerformanceReview(req.params.id);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
}
