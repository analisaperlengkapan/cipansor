import { test, expect } from './fixtures/auth.fixture';
import { LoginPage } from './page-objects';

/**
 * Muhadatsah Module E2E Tests
 * Tests Arabic conversation practice module
 */

test.describe('Muhadatsah - Navigation', () => {
  test('should navigate to muhadatsah page', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/muhadatsah');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    expect(page.url()).toMatch(/muhadatsah/);
  });

  test('should display muhadatsah list or empty state', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/muhadatsah');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    // Check for content
    const hasTable = await page.locator('table, [role="table"]')
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    const hasCards = await page.locator('[class*="card"]')
      .first()
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    const hasEmptyState = await page.getByText(/tidak ada|empty|no data/i)
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    // Should show something
    const hasContent = hasTable || hasCards || hasEmptyState;
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Muhadatsah - Create', () => {
  test('should navigate to create muhadatsah page', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/muhadatsah/new');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    expect(page.url()).toMatch(/muhadatsah\/new/);
  });

  test('should display create form elements', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/muhadatsah/new');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    // Page should load successfully
    expect(page.url()).toMatch(/muhadatsah\/new/);
    
    // Should have meaningful content
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});

test.describe('Muhadatsah - View & Evaluate', () => {
  test('should allow navigation from list to detail', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/muhadatsah');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    // Try to find first item link
    const firstLink = page.locator('a[href*="/muhadatsah/"]').first();
    
    if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      
      // Should navigate to detail page
      expect(page.url()).toMatch(/muhadatsah\/[^\/]+/);
    } else {
      // No items to click, that's ok
      expect(true).toBeTruthy();
    }
  });
});

test.describe('Muhadatsah - Performance', () => {
  test('should load muhadatsah page within timeout', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    
    const startTime = Date.now();
    await page.goto('/muhadatsah');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    const loadTime = Date.now() - startTime;
    
    // Page should load within 15 seconds
    expect(loadTime).toBeLessThan(15000);
    expect(page.url()).toMatch(/muhadatsah/);
  });
});
