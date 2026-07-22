import { Request, Response, NextFunction } from 'express';

/**
 * Coerce the standard pagination query params to numbers.
 *
 * Query strings are always strings. Most modules validate with
 * `z.coerce.number()` and are fine, but several controllers pass `req.query`
 * straight through to a service typed `limit?: number` — TypeScript is happy
 * because the cast is `as any`, and Prisma then rejects the call at runtime:
 *
 *     Argument `take`: Invalid value provided. Expected Int, provided String.
 *
 * That surfaced as a 500 on GET /api/assignments and GET /api/sanad, and
 * `skip: NaN` wherever `(page - 1) * limit` was computed on strings. Fixing it
 * per-module means finding every controller that forgets; normalising once at
 * the API boundary means it cannot be forgotten. Zod's `coerce.number()`
 * accepts numbers unchanged, so the modules that already validate are
 * unaffected.
 *
 * Non-numeric values are left untouched so validation still reports them.
 */
const NUMERIC_QUERY_PARAMS = ['page', 'limit', 'pageSize', 'perPage', 'offset'];

export function normalizePagination(req: Request, _res: Response, next: NextFunction): void {
  // Express 5 defines `req.query` as a prototype getter that re-parses the URL
  // on every access, so mutating the object it returns is thrown away and
  // assigning to req.query throws. Shadow it with an own property holding the
  // normalised copy.
  const source = req.query as Record<string, unknown>;
  const normalized: Record<string, unknown> = { ...source };
  let changed = false;

  for (const key of NUMERIC_QUERY_PARAMS) {
    const value = normalized[key];
    if (typeof value !== 'string' || value.trim() === '') continue;

    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      normalized[key] = parsed;
      changed = true;
    }
  }

  if (changed) {
    Object.defineProperty(req, 'query', {
      value: normalized,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  next();
}
