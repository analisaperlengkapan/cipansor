/**
 * Forecast Analytics Controller
 */

import { Request, Response, NextFunction } from 'express';
import * as forecastService from './forecast.service';

/**
 * Resolve the unitId a forecast request should be scoped to, given the
 * caller's role and the (optional) `unitId` query param.
 *
 * Centralised here so every forecast endpoint applies the same unit-level
 * authorization: a UNIT_ADMIN must not be able to read another unit's
 * forecast by passing a different `unitId`, nor by omitting it entirely
 * (which would otherwise return aggregated data across ALL units — see
 * forecast.service.ts where `unitId` is only spread when truthy).
 * SUPER_ADMIN and YAYASAN_ADMIN may scope to any (or all) unit(s).
 *
 * Returns `{ ok: true, unitId }` on success, or `{ ok: false }` after
 * having already written a 403 response — callers should early-return
 * when ok is false.
 */
function resolveForecastUnitId(
  req: Request,
  res: Response
): { ok: true; unitId: string | undefined } | { ok: false } {
  const { unitId } = (req.query as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;

  let effectiveUnitId = unitId as string | undefined;
  if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'YAYASAN_ADMIN') {
    if (!user.unitId) {
      res.status(403).json({ success: false, error: 'Access to this unit is not allowed' });
      return { ok: false };
    }
    if (effectiveUnitId && effectiveUnitId !== user.unitId) {
      res.status(403).json({ success: false, error: 'Access to this unit is not allowed' });
      return { ok: false };
    }
    effectiveUnitId = user.unitId;
  }
  return { ok: true, unitId: effectiveUnitId };
}

/**
 * Get enrollment forecast
 */
export async function getEnrollmentForecast(req: Request, res: Response, next: NextFunction) {
  try {
    const scoped = resolveForecastUnitId(req, res);
    if (!scoped.ok) return;
    const forecast = await forecastService.getEnrollmentForecast(scoped.unitId);
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
    const scoped = resolveForecastUnitId(req, res);
    if (!scoped.ok) return;
    const forecast = await forecastService.getPaymentForecast(scoped.unitId);
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
    const scoped = resolveForecastUnitId(req, res);
    if (!scoped.ok) return;
    const prediction = await forecastService.getOutstandingPaymentPrediction(scoped.unitId);
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
    const scoped = resolveForecastUnitId(req, res);
    if (!scoped.ok) return;
    const forecast = await forecastService.getTahfidzCompletionForecast(scoped.unitId);
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
    const scoped = resolveForecastUnitId(req, res);
    if (!scoped.ok) return;
    const forecast = await forecastService.calculateCashFlowForecast(scoped.unitId);
    res.json({ success: true, data: forecast });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all forecasts summary
 *
 * Applies the same unit-level authorization to ALL forecasts, not just
 * cash-flow: a UNIT_ADMIN cannot read another unit's projections by passing
 * a different `unitId`, nor by omitting it entirely (which would otherwise
 * return aggregated data across ALL units). Previously only cash-flow was
 * scoped, while enrollment / payment / outstanding / tahfidz silently leaked
 * cross-unit data — the 403 early-return implied full-response scoping but
 * only protected one of the five forecasts.
 */
export async function getAllForecasts(req: Request, res: Response, next: NextFunction) {
  try {
    const scoped = resolveForecastUnitId(req, res);
    if (!scoped.ok) return;
    const effectiveUnitId = scoped.unitId;

    const [enrollment, payment, outstanding, tahfidz, cashFlow] = await Promise.all([
      forecastService.getEnrollmentForecast(effectiveUnitId),
      forecastService.getPaymentForecast(effectiveUnitId),
      forecastService.getOutstandingPaymentPrediction(effectiveUnitId),
      forecastService.getTahfidzCompletionForecast(effectiveUnitId),
      forecastService.calculateCashFlowForecast(effectiveUnitId),
    ]);

    res.json({
      success: true,
      data: {
        enrollment,
        payment,
        outstanding,
        tahfidz,
        cashFlow,
      },
    });
  } catch (error) {
    next(error);
  }
}
