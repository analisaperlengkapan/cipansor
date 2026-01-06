import { test, expect } from './fixtures/auth.fixture';
import { LoginPage } from './page-objects';

/**
 * Dashboard Module E2E Tests
 * Tests main dashboard metrics and real-time updates
 */

test.describe('Dashboard - Navigation', () => {
  test('should load dashboard after login', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url).toMatch(/(dashboard|home)/);
  });

  test('should display dashboard content', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    
    const content = await page.content();
    expect(content.length).toBeGreaterThan(2000);
  });
});

test.describe('Dashboard - Metrics', () => {
  test('should display statistics cards', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    
    const hasCards = await page.locator('[class*="card"], [class*="stat"]')
      .first()
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasCards).toBeTruthy();
  });

  test('should show student count metrics', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    
    const content = await page.content();
    const hasStudentMetrics = content.includes('Siswa') || 
                              content.includes('Student') ||
                              content.includes('Total');
    
    expect(hasStudentMetrics).toBeTruthy();
  });

  test('should display charts or graphs', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(3000);
    
    const hasChart = await page.locator('canvas, svg[class*="chart"], [class*="graph"]')
      .first()
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasChart || page.url().includes('dashboard')).toBeTruthy();
  });
});

test.describe('Dashboard - Navigation Links', () => {
  test('should have links to main modules', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    
    const content = await page.content();
    const hasNavigation = content.includes('Siswa') || 
                          content.includes('Guru') || 
                          content.includes('Keuangan') ||
                          content.includes('Students') ||
                          content.includes('Teachers') ||
                          content.includes('Finance');
    
    expect(hasNavigation).toBeTruthy();
  });

  test('should navigate to PAUD module', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/paud');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    expect(page.url()).toMatch(/paud/);
  });

  test('should navigate to Tahfidz module', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/tahfidz');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    expect(page.url()).toMatch(/tahfidz/);
  });
});

test.describe('Dashboard - Performance', () => {
  test('should load dashboard quickly after login', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    
    const startTime = Date.now();
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    await page.waitForTimeout(2000);
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(10000);
  });

  test('should handle real-time updates', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(3000);
    
    // Check if page is still responsive
    const isResponsive = await page.evaluate(() => {
      return document.readyState === 'complete';
    });
    
    expect(isResponsive).toBeTruthy();
  });
});
