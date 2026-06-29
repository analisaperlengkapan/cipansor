import * as fs from "fs";
import * as path from "path";
import { apiLogin, buildStorageState, SEED_USERS } from "./helpers/auth-api";

/**
 * Playwright Global Setup for Cipansor E2E Tests
 *
 * 1. Verify backend and frontend are reachable.
 * 2. Pre-authenticate the seed roles via the API (completing the admin 2FA gate
 *    with a fixed-secret TOTP) and write Playwright storageState files, so specs
 *    can `test.use({ storageState: ".auth/superAdmin.json" })`. This replaces the
 *    old UI login, which couldn't authenticate admins and waited on the wrong URL.
 */

const baseURL = process.env.BASE_URL || "http://localhost:3000";
const apiURL = process.env.API_URL || "http://localhost:3001/api";
// The health endpoint is mounted at the server root (/health), not under /api.
const healthURL = `${apiURL.replace(/\/api\/?$/, "")}/health`;

// Roles to pre-authenticate → storageState file name (under apps/web/.auth).
const ROLE_FILES: Record<keyof typeof SEED_USERS, string> = {
  superAdmin: "superAdmin",
  adminSdit: "adminSdit",
  teacher: "teacher",
  parent: "parent",
  student: "student",
};

async function globalSetup() {
  console.log("🚀 Starting E2E Test Global Setup...");
  console.log(`📍 Base URL: ${baseURL}`);
  console.log(`📍 API URL: ${apiURL}`);

  const authDir = path.join(__dirname, "../.auth");
  fs.mkdirSync(authDir, { recursive: true });

  // 1. Backend health.
  let backendAvailable = false;
  try {
    const response = await fetch(healthURL);
    backendAvailable = response.ok;
    console.log(
      backendAvailable
        ? "✅ Backend API is healthy"
        : `⚠️ Backend API health check failed: ${response.status}`,
    );
  } catch (error) {
    console.warn("⚠️ Backend API is not accessible:", error);
  }

  // 2. Frontend reachable.
  try {
    const response = await fetch(baseURL);
    if (response.ok || response.status === 404) {
      console.log("✅ Frontend is accessible");
    } else {
      console.warn(`⚠️ Frontend check failed: ${response.status}`);
    }
  } catch (error) {
    console.warn("⚠️ Frontend is not accessible:", error);
  }

  // 3. Pre-authenticate roles via the API and persist storageState.
  if (backendAvailable) {
    console.log("🔐 Pre-authenticating roles via API...");
    for (const [role, file] of Object.entries(ROLE_FILES)) {
      try {
        const session = await apiLogin(SEED_USERS[role as keyof typeof SEED_USERS]);
        fs.writeFileSync(
          path.join(authDir, `${file}.json`),
          JSON.stringify(buildStorageState(session), null, 2),
        );
        console.log(`✅ Saved storageState for ${role}`);
      } catch (error) {
        console.warn(`⚠️ Failed to pre-authenticate ${role}:`, error);
      }
    }
  } else {
    console.log("⚠️ Skipping pre-authentication (backend unavailable).");
  }

  console.log("✅ Global Setup Complete\n");
}

export default globalSetup;
