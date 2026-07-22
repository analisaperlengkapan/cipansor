import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { ApiResponse } from '@/utils/response';
import { runJob } from '@/jobs';

// ============================================
// Dashboard Controllers
// ============================================

/**
 * Get dashboard overview
 */
export const getOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // `validateQuery` parks the parsed result in `res.locals.validatedQuery`
    // (Express 5 makes `req.query` read-only). Reading `req.query` directly
    // discarded the schema's page=1/limit=20 defaults, so a call that omitted
    // `page` computed `skip: NaN` and Prisma answered with a 500.
    const query = (res.locals.validatedQuery || req.query) as any;
    const overview = await dashboardService.getOverview(query);
    res.json(ApiResponse.success(overview));
  } catch (error) {
    next(error);
  }
};

/**
 * Get quick stats for dashboard
 */
export const getQuickStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unitId = req.query.unitId as string | undefined;
    const stats = await dashboardService.getQuickStats(unitId);
    res.json(ApiResponse.success(stats));
  } catch (error) {
    next(error);
  }
};

/**
 * List metric snapshots
 */
export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = (res.locals.validatedQuery || req.query) as any;
    const result = await dashboardService.getMetrics(query);
    res.json(
      ApiResponse.paginated(
        result.metrics,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create metric snapshot
 */
export const createMetricSnapshot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as any)?.id;
    const metric = await dashboardService.createMetricSnapshot(req.body, userId);
    res.status(201).json(ApiResponse.success(metric, 'Metric snapshot created successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get metric trend
 */
export const getTrend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = (res.locals.validatedQuery || req.query) as any;
    const trend = await dashboardService.getTrend(query);
    res.json(ApiResponse.success(trend));
  } catch (error) {
    next(error);
  }
};

/**
 * Get unit comparison
 */
export const getUnitComparison = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = (res.locals.validatedQuery || req.query) as any;
    const comparison = await dashboardService.getUnitComparison(query);
    res.json(ApiResponse.success(comparison));
  } catch (error) {
    next(error);
  }
};

/**
 * Generate report
 */
export const generateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as any)?.id;
    const report = await dashboardService.generateReport(req.body, userId);
    res.status(201).json(ApiResponse.success(report, 'Report generated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger snapshot job manually (admin only)
 */
export const triggerSnapshotJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobType } = req.body;

    if (!['daily-snapshot', 'weekly-summary', 'cleanup'].includes(jobType)) {
      return res.status(400).json(ApiResponse.error('Invalid job type'));
    }

    // Run job in background
    runJob(jobType as 'daily-snapshot' | 'weekly-summary' | 'cleanup')
      .then(() => console.log(`Job ${jobType} completed`))
      .catch((err) => console.error(`Job ${jobType} failed:`, err));

    res.json(ApiResponse.success({ jobType, status: 'started' }, 'Job started successfully'));
  } catch (error) {
    next(error);
  }
};
