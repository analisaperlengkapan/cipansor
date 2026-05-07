import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { userService } from './user.service';
import { ListUsersQuery, CreateUserInput, UpdateUserInput } from './user.schema';

/**
 * List users
 * GET /api/users
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = (res.locals.validatedQuery || (req.query as any)) as ListUsersQuery;
  const result = await userService.findAll(query, {
    role: req.user!.role,
    unitId: req.user!.unitId,
  });

  res.json({
    success: true,
    data: result.users,
    meta: {
      pagination: result.pagination,
    },
  });
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = (req.params as any);
  const user = await userService.findById(id);

  res.json({
    success: true,
    data: user,
  });
});

/**
 * Create user
 * POST /api/users
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const input: CreateUserInput = req.body;
  const user = await userService.create(input, req.user!.role);

  res.status(201).json({
    success: true,
    data: user,
  });
});

/**
 * Update user
 * PUT /api/users/:id
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = (req.params as any);
  const input: UpdateUserInput = req.body;
  const user = await userService.update(id, input, {
    role: req.user!.role,
    sub: req.user!.sub,
  });

  res.json({
    success: true,
    data: user,
  });
});

/**
 * Delete user
 * DELETE /api/users/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = (req.params as any);
  const result = await userService.delete(id);

  res.json({
    success: true,
    data: result,
  });
});
