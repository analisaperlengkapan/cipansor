import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from '../auth.service';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const { mockGetSigningKey } = vi.hoisted(() => {
  return {
    mockGetSigningKey: vi.fn().mockResolvedValue({
      getPublicKey: () => 'mock-public-key',
    }),
  };
});

vi.mock('jwks-rsa', () => {
  return {
    JwksClient: vi.fn().mockImplementation(function (this: any) {
      this.getSigningKey = mockGetSigningKey;
      return this;
    }),
  };
});

describe('SSO Authentication Security Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should reject ssoLogin when idToken is missing', async () => {
    await expect(
      authService.ssoLogin({
        provider: 'google',
        idToken: '',
      })
    ).rejects.toThrow();
  });

  it('should reject Google SSO when GOOGLE_CLIENT_ID is not configured', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    await expect(
      authService.ssoLogin({
        provider: 'google',
        idToken: 'some_token',
      })
    ).rejects.toThrow('Google SSO is not configured on this server');
  });

  it('should reject Google SSO when token audience (aud) mismatches', async () => {
    process.env.GOOGLE_CLIENT_ID = 'expected-google-client-id';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        email: 'user@cipansor.or.id',
        email_verified: true,
        aud: 'wrong-google-client-id',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    } as Response);

    await expect(
      authService.ssoLogin({
        provider: 'google',
        idToken: 'token_with_wrong_aud',
      })
    ).rejects.toThrow('Google token audience (aud) mismatch');
  });

  it('should reject Google SSO when token is expired', async () => {
    process.env.GOOGLE_CLIENT_ID = 'expected-google-client-id';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        email: 'user@cipansor.or.id',
        email_verified: true,
        aud: 'expected-google-client-id',
        exp: Math.floor(Date.now() / 1000) - 100, // Expired
      }),
    } as Response);

    await expect(
      authService.ssoLogin({
        provider: 'google',
        idToken: 'expired_token',
      })
    ).rejects.toThrow('Google token has expired');
  });

  it('should reject Google SSO when email is not verified', async () => {
    process.env.GOOGLE_CLIENT_ID = 'expected-google-client-id';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        email: 'user@cipansor.or.id',
        email_verified: false,
        aud: 'expected-google-client-id',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    } as Response);

    await expect(
      authService.ssoLogin({
        provider: 'google',
        idToken: 'unverified_email_token',
      })
    ).rejects.toThrow('Google account email is missing or not verified');
  });

  it('should reject Google SSO when user is not found in database', async () => {
    process.env.GOOGLE_CLIENT_ID = 'expected-google-client-id';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        email: 'unregistered@cipansor.or.id',
        email_verified: true,
        aud: 'expected-google-client-id',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    } as Response);

    vi.spyOn(prisma.user, 'findFirst').mockResolvedValueOnce(null);

    await expect(
      authService.ssoLogin({
        provider: 'google',
        idToken: 'valid_token_unregistered_user',
      })
    ).rejects.toThrow('belum terdaftar di Sistem Cipansor');
  });

  it('should reject Microsoft SSO when MICROSOFT_CLIENT_ID is not configured', async () => {
    delete process.env.MICROSOFT_CLIENT_ID;
    await expect(
      authService.ssoLogin({
        provider: 'microsoft',
        idToken: 'some_ms_token',
      })
    ).rejects.toThrow('Microsoft SSO is not configured on this server');
  });

  it('should verify Microsoft token signature and claims successfully', async () => {
    process.env.MICROSOFT_CLIENT_ID = 'expected-ms-client-id';

    const mockUser = {
      id: 'usr_ms_123',
      email: 'guru@cipansor.or.id',
      isActive: true,
      unitId: 'unit_1',
      userRoles: [
        {
          isPrimary: true,
          roleId: 'role_1',
          unitId: 'unit_1',
          role: {
            code: 'SDIT_GURU',
            permissions: ['STUDENT_READ'],
          },
        },
      ],
    };

    vi.spyOn(jwt, 'decode').mockReturnValueOnce({
      header: { kid: 'key_123' },
      payload: { aud: 'expected-ms-client-id' },
    } as any);

    vi.spyOn(jwt, 'verify').mockReturnValueOnce({
      aud: 'expected-ms-client-id',
      exp: Math.floor(Date.now() / 1000) + 3600,
      preferred_username: 'guru@cipansor.or.id',
    } as any);

    vi.spyOn(prisma.user, 'findFirst').mockResolvedValueOnce(mockUser as any);
    vi.spyOn(prisma.refreshToken, 'create').mockResolvedValueOnce({} as any);
    vi.spyOn(prisma.user, 'update').mockResolvedValueOnce({} as any);
    vi.spyOn(prisma.academicYear, 'findFirst').mockResolvedValueOnce({ id: 'ay_1' } as any);

    const result = await authService.ssoLogin({
      provider: 'microsoft',
      idToken: 'valid_ms_id_token',
    });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect((result as any).user.email).toBe('guru@cipansor.or.id');
  });
});
