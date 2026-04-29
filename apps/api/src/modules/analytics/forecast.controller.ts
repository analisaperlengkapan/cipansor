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
 * Get 6-month cash flow forecast (income vs expense-budget allocation).
 * Applies unit-level authorization so a UNIT_ADMIN cannot read another
 * unit's projection by passing a different `unitId`, nor by omitting it
 * entirely (which would otherwise return aggregated data across ALL units).
 */
export async function getCashFlowForecast(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = req.query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;

    let effectiveUnitId = unitId as string | undefined;
    if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'YAYASAN_ADMIN') {
      if (!user.unitId) {
        return res
          .status(403)
          .json({ success: false, error: 'Access to this unit is not allowed' });
      }
      if (effectiveUnitId && effectiveUnitId !== user.unitId) {
        return res
          .status(403)
          .json({ success: false, error: 'Access to this unit is not allowed' });
      }
      effectiveUnitId = user.unitId;
    }

    const forecast = await forecastService.calculateCashFlowForecast(effectiveUnitId);
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
