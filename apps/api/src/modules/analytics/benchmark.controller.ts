/**
 * Benchmark Analytics Controller
 * Handles benchmark API requests
 */

import { Request, Response, NextFunction } from 'express';
import * as benchmarkService from './benchmark.service';

/**
 * @swagger
 * /api/analytics/benchmark:
 *   get:
 *     summary: Get benchmark summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Benchmark summary with top performers
 */
export async function getBenchmarkSummary(req: Request, res: Response, next: NextFunction) {
    try {
        const summary = await benchmarkService.getBenchmarkSummary();
        res.json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /api/analytics/benchmark/compare:
 *   get:
 *     summary: Compare performance across units
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitIds
 *         schema:
 *           type: string
 *         description: Comma-separated unit IDs to compare
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Comparison data for units
 */
export async function compareUnits(req: Request, res: Response, next: NextFunction) {
    try {
        const { unitIds, startDate, endDate } = req.query;

        const options = {
            unitIds: unitIds ? (unitIds as string).split(',') : undefined,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
        };

        const comparison = await benchmarkService.compareUnitsPerformance(options);
        res.json({ success: true, data: comparison });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /api/analytics/benchmark/rankings:
 *   get:
 *     summary: Get unit rankings by metric
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [attendance, payment, tahfidz, academic, all]
 *         description: Metric to rank by
 *     responses:
 *       200:
 *         description: Rankings data
 */
export async function getUnitRankings(req: Request, res: Response, next: NextFunction) {
    try {
        const metric = (req.query.metric as 'attendance' | 'payment' | 'tahfidz' | 'academic' | 'all') || 'all';
        const rankings = await benchmarkService.getUnitRankings(metric);
        res.json({ success: true, data: rankings });
    } catch (error) {
        next(error);
    }
}

/**
 * @swagger
 * /api/analytics/benchmark/yoy/{unitId}:
 *   get:
 *     summary: Get year-over-year comparison for a unit
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Year-over-year comparison
 */
export async function getYearOverYear(req: Request, res: Response, next: NextFunction) {
    try {
        const { unitId } = req.params;
        const comparison = await benchmarkService.getYearOverYearComparison(unitId);
        res.json({ success: true, data: comparison });
    } catch (error) {
        next(error);
    }
}
