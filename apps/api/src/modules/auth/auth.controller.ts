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

/**
 * Generate 2FA Secret
 * POST /api/auth/2fa/generate
 */
export const generateTwoFactorSecret = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const result = await authService.generateTwoFactorSecret(userId);
  res.json({ success: true, data: result });
});

/**
 * Enable 2FA
 * POST /api/auth/2fa/enable
 */
export const enableTwoFactor = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { token } = req.body; // Secret is no longer taken from body
  const result = await authService.enableTwoFactor(userId, token);
  res.json({ success: true, data: result });
});

/**
 * Verify 2FA Login
 * POST /api/auth/2fa/login
 */
export const verifyTwoFactorLogin = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { token } = req.body;
  const isTemp = req.user?.isTemp;
  const result = await authService.verifyTwoFactorLogin(userId, token, isTemp);
  res.json({ success: true, data: result });
});

/**
 * Disable 2FA
 * POST /api/auth/2fa/disable
 */
export const disableTwoFactor = asyncHandler(async (req: Request, res: Response) => {
  const { token, userId: targetUserId } = req.body;
  const userId = req.user!.sub; // Current user

  let result;
  if (targetUserId && targetUserId !== userId) {
    // Admin disabling for another user
    result = await authService.disableTwoFactor(targetUserId, token, userId);
  } else {
    // User disabling their own
    result = await authService.disableTwoFactor(userId, token);
  }

  res.json({ success: true, data: result });
});

/**
 * Get 2FA Status
 * GET /api/auth/2fa/status
 */
export const getTwoFactorStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const result = await authService.getTwoFactorStatus(userId);
  res.json({ success: true, data: result });
});
