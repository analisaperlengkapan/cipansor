import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Debug Failures', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock Auth
    await context.addCookies([
      {
        name: 'accessToken',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.addInitScript(() => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: {
              id: 'user-123',
              name: 'Test Admin',
              role: 'SUPER_ADMIN',
              unitId: 'unit-123',
            },
            token: 'mock-jwt-token',
            isAuthenticated: true,
          },
          version: 0,
        })
      );
    });

    // Mock API
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'user-123',
            name: 'Test Admin',
            role: 'SUPER_ADMIN',
            unitId: 'unit-123',
          },
        }),
      });
    });

    // Shared Mocks
    await page.route('**/api/academic-years**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'ay-1', name: '2023/2024', isActive: true }] }) });
    });

    await page.route('**/api/units**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'unit-1', name: 'Unit A' }]) });
    });

    // Catch-all for other APIs to prevent 404s causing crashes (return empty list/object)
    await page.route('**/api/**', async (route) => {
        if (route.request().method() === 'GET') {
             await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], meta: { total: 0, totalPages: 1, page: 1, limit: 10 } }) });
        } else {
            await route.continue();
        }
    });
  });

  const pages = [
    'students',
    'finance',
    'health',
    'psb',
    'tahfidz',
    'assessment',
    'attendance',
    'library'
  ];

  for (const pageName of pages) {
    test(`dump html for ${pageName}`, async ({ page }) => {
      await page.goto(`/${pageName}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000); // Wait for potential client-side errors

      const content = await page.content();
      // Write to CWD (which is apps/web)
      fs.writeFileSync(`debug-${pageName}.html`, content);

      // Also take a screenshot for visual reference (small one)
      await page.screenshot({ path: `debug-${pageName}.png` });
    });
  }
});
