import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/redis', () => ({ redis: {} }));

import router from './esign.routes';
import { isSuperAdmin } from '@/middleware/auth';

interface RouteLayer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: (...args: unknown[]) => unknown; name: string }>;
  };
}

function handlersFor(method: string, path: string) {
  const layer = (router.stack as unknown as RouteLayer[]).find(
    (l) => l.route && l.route.path === path && l.route.methods[method]
  );
  if (!layer?.route) throw new Error(`No route for ${method.toUpperCase()} ${path}`);
  return layer.route.stack;
}

/**
 * express-rate-limit hangs `resetKey`/`getKey` on the middleware it returns.
 * Recognising the limiter by those rather than by identity keeps the test from
 * needing the module to export it just to be checked.
 */
function isRateLimiter(handle: unknown): boolean {
  return (
    typeof handle === 'function' &&
    typeof (handle as { resetKey?: unknown }).resetKey === 'function'
  );
}

function hasLimiter(method: string, path: string) {
  return handlersFor(method, path).some((h) => isRateLimiter(h.handle));
}

/**
 * Every route that carries a passphrase must carry a strict limiter with it.
 *
 * app.ts reserves the strict limiter for "credential-bearing endpoints ONLY"
 * and then lists the auth routes by hand. E-sign was added afterwards and
 * never joined that list, so three endpoints that accept a passphrase ran on
 * the ordinary budget. A hand-maintained list is exactly the kind of thing
 * that goes stale silently, so the guard belongs next to the routes.
 */
describe('esign.routes rate limiting', () => {
  it('POST /letters/:letterId/sign is rate limited', () => {
    expect(hasLimiter('post', '/letters/:letterId/sign')).toBe(true);
  });

  it('POST /me/activate is rate limited', () => {
    expect(hasLimiter('post', '/me/activate')).toBe(true);
  });

  it('POST /me/passphrase is rate limited', () => {
    expect(hasLimiter('post', '/me/passphrase')).toBe(true);
  });

  /**
   * The settings page reads this on every visit and it holds nothing guessable.
   * Limiting it would repeat the /auth/me mistake app.ts documents: a whole
   * pesantren behind one NAT gateway locked out of a read-only status call.
   */
  it('GET /me is NOT rate limited', () => {
    expect(hasLimiter('get', '/me')).toBe(false);
  });

  /**
   * Scanned by outsiders with no account, from any number of addresses. It
   * neither accepts a secret nor reveals the letter body, and a token is 160
   * random bits, so there is nothing here to brute force — but there is a
   * whole dinas office behind one address.
   */
  it('GET /verify/:token is NOT rate limited', () => {
    expect(hasLimiter('get', '/verify/:token')).toBe(false);
  });
});

/**
 * Only a Super Admin issues, refuses or revokes signing keys. If one of these
 * gates is dropped, any authenticated user could grant themselves the ability
 * to sign on behalf of the yayasan.
 */
describe('esign.routes authority gates', () => {
  it('GET /requests requires isSuperAdmin', () => {
    expect(handlersFor('get', '/requests').some((h) => h.handle === isSuperAdmin)).toBe(
      true
    );
  });

  it('POST /requests/:id/decide requires isSuperAdmin', () => {
    expect(
      handlersFor('post', '/requests/:id/decide').some((h) => h.handle === isSuperAdmin)
    ).toBe(true);
  });

  it('POST /keys/:userId/revoke requires isSuperAdmin', () => {
    expect(
      handlersFor('post', '/keys/:userId/revoke').some((h) => h.handle === isSuperAdmin)
    ).toBe(true);
  });
});
