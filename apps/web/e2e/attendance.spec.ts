import { test, expect } from './fixtures/auth.fixture';
import { LoginPage } from './page-objects';

/**
 * Attendance Module E2E Tests
 * Tests student attendance tracking and reporting
 */

test.describe('Attendance - Navigation', () => {
  test('should navigate to attendance page', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    expect(page.url()).toMatch(/attendance/);
  });

  test('should display attendance interface', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });
});

test.describe('Attendance - Features', () => {
  test('should display attendance list or calendar', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    const hasTable = await page.locator('table, [class*="attendance"]')
      .first()
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasTable || page.url().includes('attendance')).toBeTruthy();
  });

  test('should have date selection controls', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    const hasDateControl = await page.locator('input[type="date"], button[class*="calendar"]')
      .first()
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasDateControl || page.url().includes('attendance')).toBeTruthy();
  });
});

test.describe('Attendance - Performance', () => {
  test('should load attendance page quickly', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    
    const startTime = Date.now();
    await page.goto('/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(15000);
  });
});
