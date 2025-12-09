/**
 * Forecast Analytics Controller
 */

import { Request, Response, NextFunction } from 'express';
import * as forecastService from './forecast.service';

/**
 * Get enrollment forecast
 */
export async function getEnrollmentForecast(req: Request, res: Response, next: NextFunction) {
    try {
        const { unitId } = req.query;
        const forecast = await forecastService.getEnrollmentForecast(unitId as string | undefined);
        res.json({ success: true, data: forecast });
    } catch (error) {
        next(error);
    }
}

/**
 * Get payment forecast
 */
export async function getPaymentForecast(req: Request, res: Response, next: NextFunction) {
    try {
        const { unitId } = req.query;
        const forecast = await forecastService.getPaymentForecast(unitId as string | undefined);
        res.json({ success: true, data: forecast });
    } catch (error) {
        next(error);
    }
}

/**
 * Get outstanding payment prediction
 */
export async function getOutstandingPrediction(req: Request, res: Response, next: NextFunction) {
    try {
        const { unitId } = req.query;
        const prediction = await forecastService.getOutstandingPaymentPrediction(
            unitId as string | undefined
        );
        res.json({ success: true, data: prediction });
    } catch (error) {
        next(error);
    }
}

/**
 * Get tahfidz completion forecast
 */
export async function getTahfidzForecast(req: Request, res: Response, next: NextFunction) {
    try {
        const { unitId } = req.query;
        const forecast = await forecastService.getTahfidzCompletionForecast(
            unitId as string | undefined
        );
        res.json({ success: true, data: forecast });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all forecasts summary
 */
export async function getAllForecasts(req: Request, res: Response, next: NextFunction) {
    try {
        const { unitId } = req.query;
        const uid = unitId as string | undefined;

        const [enrollment, payment, outstanding, tahfidz] = await Promise.all([
            forecastService.getEnrollmentForecast(uid),
            forecastService.getPaymentForecast(uid),
            forecastService.getOutstandingPaymentPrediction(uid),
            forecastService.getTahfidzCompletionForecast(uid),
        ]);

        res.json({
            success: true,
            data: {
                enrollment,
                payment,
                outstanding,
                tahfidz,
            },
        });
    } catch (error) {
        next(error);
    }
}
