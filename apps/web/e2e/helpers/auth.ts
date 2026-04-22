import { Page } from '@playwright/test';

/**
 * Mocks the authenticated user state via Playwright browser context.
 */
export async function setupAuthenticatedPage(page: Page, role: string, unitId: string = 'unit-1') {
  await setupMockUser(page, { role, unitId });
  await page.goto('/');
}

export async function setupMockUser(page: Page, user: { role: string; unitId: string }) {
  await page.addInitScript((mockUser) => {
    const authState = {
      state: {
        isAuthenticated: true,
        user: {
          id: 'mock-user-id',
          name: 'Super Admin E2E',
          role: mockUser.role,
          unitId: mockUser.unitId,
          email: 'admin@simkari.test',
        },
        token: 'mock-jwt-token'
      },
      version: 0
    };
    window.localStorage.setItem('auth-storage', JSON.stringify(authState));
    window.localStorage.setItem('accessToken', 'mock-jwt-token');
  }, user);
}

/**
 * Fakes a login action.
 */
export async function login(page: Page) {
  // Can just go directly to a protected page since localstorage is seeded
  await page.context().addCookies([{
    name: 'accessToken',
    value: 'mock-jwt-token',
    domain: 'localhost',
    path: '/',
  }]);
}
