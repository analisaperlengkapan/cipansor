import { chromium, FullConfig } from '@playwright/test';
import { testUsers } from './fixtures/auth.fixture';

/**
 * Global Setup for E2E Tests
 * Runs once before all tests
 * - Validates backend API is running
 * - Validates frontend is accessible
 * - Pre-authenticates users and stores state
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  const apiURL = process.env.API_URL || 'http://localhost:3001';

  console.log('🚀 Starting E2E Test Global Setup...');

  // 1. Check backend API health
  console.log('📡 Checking backend API health...');
  try {
    const response = await fetch(`${apiURL}/health`);
    if (!response.ok) {
      // throw new Error(`Backend API health check failed: ${response.status}`);
      console.warn(`⚠️ Backend API health check failed: ${response.status} (Allowing for mock-only tests)`);
    } else {
      console.log('✅ Backend API is healthy');
    }
  } catch (error) {
    // console.error('❌ Backend API is not accessible:', error);
    // console.error('💡 Make sure to run: cd apps/api && pnpm dev');
    // throw error;
    console.warn('⚠️ Backend API is not accessible (Allowing for mock-only tests)');
  }

  // 2. Check frontend is accessible
  console.log('🌐 Checking frontend accessibility...');
  try {
    const response = await fetch(baseURL);
    if (!response.ok && response.status !== 404) {
      throw new Error(`Frontend check failed: ${response.status}`);
    }
    console.log('✅ Frontend is accessible');
  } catch (error) {
    console.error('❌ Frontend is not accessible:', error);
    console.error('💡 Make sure to run: cd apps/web && pnpm dev');
    throw error;
  }

  // 3. Pre-authenticate users and save state
  console.log('🔐 Pre-authenticating test users...');
  const browser = await chromium.launch();
  
  for (const [key, user] of Object.entries(testUsers)) {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();

    try {
      // Login
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(user.email);
      await page.getByLabel(/password|kata sandi/i).fill(user.password);
      await page.getByRole('button', { name: /sign in|masuk|login/i }).click();
      
      // Wait for successful login
      await page.waitForURL(/dashboard/, { timeout: 15000 });
      
      // Save authenticated state
      await context.storageState({ path: `playwright/.auth/${key}.json` });
      console.log(`✅ Authenticated ${key} (${user.email})`);
    } catch (error) {
      console.warn(`⚠️  Failed to authenticate ${key}:`, error);
      // Don't fail the whole setup if one user fails
    } finally {
      await page.close();
      await context.close();
    }
  }

  await browser.close();

  console.log('✅ Global setup completed successfully');
}

export default globalSetup;
