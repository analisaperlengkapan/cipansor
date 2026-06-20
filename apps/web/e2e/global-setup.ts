import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Playwright Global Setup for Cipansor E2E Tests
 *
 * This setup runs once before all tests to:
 * 1. Verify backend and frontend are accessible
 * 2. Pre-authenticate test users and save state for faster tests
 * 3. Create necessary directories
 */

const baseURL = process.env.BASE_URL || "http://localhost:3000";
const apiURL = process.env.API_URL || "http://localhost:3001/api";
// The health endpoint is mounted at the server root (/health), not under /api.
const healthURL = `${apiURL.replace(/\/api\/?$/, "")}/health`;

// Test users for pre-authentication. These match the credentials produced by
// `prisma/seed.ts`. Only non-admin roles are pre-authenticated here: admins are
// deliberately forced through a 2FA-setup gate on first login (see
// auth.service.login), so they never reach /dashboard via a plain UI login.
const testUsers = {
  teacher: {
    email: "fatimah@sdit.sch.id",
    password: "Teacher123!",
  },
  parent: {
    email: "parent3@sdit.sch.id",
    password: "Parent123!",
  },
  student: {
    email: "student3@sdit.sch.id",
    password: "Student123!",
  },
};

async function globalSetup() {
  console.log("🚀 Starting E2E Test Global Setup...");
  console.log(`📍 Base URL: ${baseURL}`);
  console.log(`📍 API URL: ${apiURL}`);

  // Ensure auth directory exists
  const authDir = path.join(__dirname, "../playwright/.auth");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log("📁 Created auth directory");
  }

  // 1. Check backend API health
  console.log("📡 Checking backend API health...");
  let backendAvailable = false;
  try {
    const response = await fetch(healthURL);
    if (!response.ok) {
      console.warn(`⚠️ Backend API health check failed: ${response.status}`);
    } else {
      console.log("✅ Backend API is healthy");
      backendAvailable = true;
    }
  } catch (error) {
    console.warn(
      "⚠️ Backend API is not accessible (Mocking might be required):",
      error,
    );
  }

  // 2. Check frontend is accessible
  console.log("🌐 Checking frontend accessibility...");
  try {
    const response = await fetch(baseURL);
    if (!response.ok && response.status !== 404) {
      console.warn(`⚠️ Frontend check failed: ${response.status}`);
    } else {
      console.log("✅ Frontend is accessible");
    }
  } catch (error) {
    console.warn("⚠️ Frontend is not accessible:", error);
  }

  // 3. Pre-authenticate users and save state (Only if backend is available)
  if (backendAvailable) {
    console.log("🔐 Pre-authenticating test users...");
    const browser = await chromium.launch();

    for (const [key, user] of Object.entries(testUsers)) {
      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();

      try {
        // Login
        await page.goto("/login");
        await page.getByLabel(/email/i).fill(user.email);
        await page.getByLabel(/password|kata sandi/i).fill(user.password);
        await page
          .getByRole("button", { name: /sign in|masuk|login/i })
          .click();

        // Wait for successful login
        await page.waitForURL(/dashboard/, { timeout: 15000 });

        // Save authenticated state
        await context.storageState({ path: `playwright/.auth/${key}.json` });
        console.log(`✅ Authenticated ${key} (${user.email})`);
      } catch (error) {
        console.warn(`⚠️ Failed to authenticate ${key}:`, error);
        // Don't fail the whole setup if one user fails
      } finally {
        await page.close();
        await context.close();
      }
    }

    await browser.close();
  } else {
    console.log("⚠️ Skipping pre-authentication due to unavailable backend.");
  }

  console.log("✅ Global Setup Complete\n");
}

export default globalSetup;
