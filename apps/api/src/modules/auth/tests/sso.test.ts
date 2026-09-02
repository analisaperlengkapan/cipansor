import { describe, it, expect } from 'vitest';
import { authService } from '../auth.service';

describe('SSO Authentication Security', () => {
  it('should reject ssoLogin when idToken is missing', async () => {
    await expect(
      authService.ssoLogin({
        provider: 'google',
        idToken: '',
      })
    ).rejects.toThrow();
  });

  it('should reject ssoLogin when idToken verification fails', async () => {
    await expect(
      authService.ssoLogin({
        provider: 'google',
        idToken: 'invalid_unverified_token',
      })
    ).rejects.toThrow('SSO token verification failed');
  });
});
