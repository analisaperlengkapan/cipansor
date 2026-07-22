import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/redis', () => ({ redis: {} }));

import router from './user.routes';
import { isAdmin } from '@/middleware/auth';

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

// Regression guard for the user-enumeration hole: every users route must carry
// an admin gate (or the self-or-admin gate for GET /:id). If someone removes
// one of these middlewares, this test fails before the route ships open again.
describe('user.routes access gates', () => {
  it('GET / requires isAdmin', () => {
    expect(handlersFor('get', '/').some((h) => h.handle === isAdmin)).toBe(true);
  });

  it('GET /:id requires isAdminOrSelf', () => {
    expect(handlersFor('get', '/:id').some((h) => h.name === 'isAdminOrSelfGuard')).toBe(true);
  });

  it('POST / requires isAdmin', () => {
    expect(handlersFor('post', '/').some((h) => h.handle === isAdmin)).toBe(true);
  });

  it('PUT /:id requires isAdmin', () => {
    expect(handlersFor('put', '/:id').some((h) => h.handle === isAdmin)).toBe(true);
  });

  it('DELETE /:id requires isAdmin', () => {
    expect(handlersFor('delete', '/:id').some((h) => h.handle === isAdmin)).toBe(true);
  });
});
