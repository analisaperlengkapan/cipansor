import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validation middleware for request body
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate query params (parses and stores in res.locals.validatedQuery)
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // In Express 5, req.query is read-only, so we validate and store in res.locals
      res.locals.validatedQuery = schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate URL params
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Just validate, params is also read-only in Express 5
      schema.parse(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
}
