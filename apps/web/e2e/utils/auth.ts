import { Page } from '@playwright/test';

/**
 * Mocks the authenticated user state via Playwright browser context.
 */
export async function setupMockUser(page: Page, user: { role: string; unitId: string }) {
  await page.addInitScript((mockUser) => {
    window.localStorage.setItem('auth-storage', JSON.stringify({
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
    }));
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
