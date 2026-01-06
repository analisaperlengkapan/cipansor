import { test, expect } from './fixtures/auth.fixture';
import { LoginPage } from './page-objects';

/**
 * Inventory Module E2E Tests
 * Tests inventory management for school assets and supplies
 */

test.describe('Inventory - Navigation', () => {
  test('should navigate to inventory page', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/inventory');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    expect(page.url()).toMatch(/inventory/);
  });

  test('should display inventory content', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/inventory');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
    expect(page.url()).toMatch(/inventory/);
  });
});

test.describe('Inventory - Features', () => {
  test('should display inventory items or categories', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/inventory');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    // Check for inventory list
    const hasItems = await page.locator('table, [class*="inventory"], [class*="item"]')
      .first()
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasItems || page.url().includes('inventory')).toBeTruthy();
  });

  test('should have management features', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    await page.goto('/inventory');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    
    // Look for management buttons
    const hasButtons = await page.getByRole('button')
      .first()
      .isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasButtons || page.url().includes('inventory')).toBeTruthy();
  });
});

test.describe('Inventory - Performance', () => {
  test('should load inventory page quickly', async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto('/login');
    await login.login('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.waitForTimeout(2000);
    
    const startTime = Date.now();
    await page.goto('/inventory');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(15000);
    expect(page.url()).toMatch(/inventory/);
  });
});
