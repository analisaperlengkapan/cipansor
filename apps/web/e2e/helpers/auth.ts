import { Page } from '@playwright/test';

/**
 * Mocks the authenticated user state via Playwright browser context.
 */
export async function setupAuthenticatedPage(page: Page, roleCode: string = 'SUPER_ADMIN') {
  await setupMockAuth(page, { roleCode });
  await page.goto('/');
}

export async function setupMockAuth(page: Page, options: {
  roleCode?: string;
  role?: string;
  name?: string;
  realm?: string;
} = {}) {
  const {
    roleCode = 'SUPER_ADMIN',
    role = 'SUPER_ADMIN',
    name = 'Super Admin E2E',
    realm = 'GLOBAL'
  } = options;

  const user = {
    id: 'mock-user-id',
    name,
    role, // Legacy role
    email: 'admin@cipansor.test',
    userRoles: [
      {
        id: 'ur-mock',
        isPrimary: true,
        role: {
          id: 'role-mock',
          code: roleCode,
          name: role,
          realm,
        }
      }
    ]
  };

  const accessToken = 'mock-jwt-token';
  const authState = {
    state: {
      isAuthenticated: true,
      user,
    },
    version: 0
  };
  const authStorage = JSON.stringify(authState);

  // Cookies must exist on the very first navigation (the Next middleware reads
  // them before any page JS runs). Setting them via document.cookie in
  // addInitScript is too late → the first request to a protected route redirects
  // to /login. Use context cookies instead.
  const baseURL = process.env.BASE_URL || "http://localhost:3000";
  await page.context().addCookies([
    { name: "accessToken", value: accessToken, url: baseURL },
    { name: "auth-storage", value: encodeURIComponent(authStorage), url: baseURL },
  ]);

  // localStorage (read by the auth store / axios interceptor) before page JS.
  await page.addInitScript(({ token, storage }) => {
    window.localStorage.setItem('accessToken', token);
    window.localStorage.setItem('auth-storage', storage);
  }, { token: accessToken, storage: authStorage });

  // Automatically mock /api/auth/me to prevent logout on hydration
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: user,
      }),
    });
  });

  // Mock roles API
  await page.route('**/api/roles/my-roles', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: user.userRoles,
      }),
    });
  });
}

/**
 * Fakes a login action by setting cookies.
 */
export async function login(page: Page) {
  await page.context().addCookies([{
    name: 'accessToken',
    value: 'mock-jwt-token',
    url: page.url(),
    path: '/',
  }]);
}
