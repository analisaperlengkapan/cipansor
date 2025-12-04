import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { authService } from './auth.service';
import { LoginInput, RegisterInput, RefreshTokenInput, ChangePasswordInput } from './auth.schema';

/**
 * Login
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const input: LoginInput = req.body;
  const result = await authService.login(input);
  
  res.json({
    success: true,
    data: result,
  });
});

/**
 * Register new user (admin only)
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const input: RegisterInput = req.body;
  const creatorRole = req.user!.role;
  
  const user = await authService.register(input, creatorRole);
  
  res.status(201).json({
    success: true,
    data: user,
  });
});

/**
 * Refresh tokens
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken }: RefreshTokenInput = req.body;
  const tokens = await authService.refreshToken(refreshToken);
  
  res.json({
    success: true,
    data: tokens,
  });
});

/**
 * Logout
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { refreshToken } = req.body;
  
  await authService.logout(userId, refreshToken);
  
  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const user = await authService.getCurrentUser(userId);
  
  res.json({
    success: true,
    data: user,
  });
});

/**
 * Change password
 * PUT /api/auth/password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const input: ChangePasswordInput = req.body;
  
  const result = await authService.changePassword(userId, input);
  
  res.json({
    success: true,
    data: result,
  });
});
