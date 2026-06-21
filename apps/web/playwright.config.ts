import { defineConfig, devices } from "@playwright/test";
import path from "path";

/**
 * Playwright E2E Test Configuration for Cipansor Web App
 * Optimized for performance, reliability, and best practices
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",

  /* Global Setup & Teardown */
  globalSetup: require.resolve("./e2e/global-setup"),
  globalTeardown: require.resolve("./e2e/global-teardown"),

  /* Test Organization */
  testMatch: "**/*.spec.ts",
  testIgnore: "**/debug-*.spec.ts", // Ignore debug tests in CI

  /* Parallel Execution */
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4, // More workers locally for speed
  forbidOnly: !!process.env.CI,

  /* Retry Strategy */
  retries: process.env.CI ? 2 : 1, // Retry once locally for flaky tests

  /* Timeouts - Optimized for faster execution */
  timeout: 30000, // 30s per test (reduced from 60s)
  expect: {
    timeout: 8000, // 8s for assertions (reduced from 10s)
  },

  /* Output */
  outputDir: "./test-results",

  /* Reporters */
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["list"], // Console output
    ...(process.env.CI ? [["github", {}] as const] : []), // GitHub Actions annotations
  ],

  /* Shared settings for all projects */
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    /* Tracing */
    trace: process.env.CI ? "retain-on-failure" : "on-first-retry",

    /* Screenshots */
    screenshot: "only-on-failure",

    /* Videos */
    video: process.env.CI ? "retain-on-failure" : "off",

    /* Action timeout - Optimized */
    actionTimeout: 10000, // 10s for actions (reduced from 15s)

    /* Navigation timeout - Optimized */
    navigationTimeout: 20000, // 20s for navigation (reduced from 30s)

    /* Locale & Timezone */
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",

    /* Viewport */
    viewport: { width: 1920, height: 1080 },

    /* Additional context options */
    ignoreHTTPSErrors: true,

    /* Storage state path */
    // storageState: 'playwright/.auth/superAdmin.json', // Use per-project
  },

  /* Configure projects for different browsers and scenarios */
  projects: [
    // Setup project - runs first
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
    },

    // Chromium - Primary browser
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Pre-authenticated state for faster tests
        // storageState: 'playwright/.auth/superAdmin.json',
      },
      dependencies: ["setup"],
    },

    // Firefox - Cross-browser testing
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
      dependencies: ["setup"],
    },

    // Webkit (Safari) - Cross-browser testing
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
      },
      dependencies: ["setup"],
    },

    // Mobile Chrome
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
      },
      dependencies: ["setup"],
    },

    // Mobile Safari
    {
      name: "mobile-safari",
      use: {
        ...devices["iPhone 13"],
      },
      dependencies: ["setup"],
    },
  ],

  /* Run the web server before tests. In CI we serve the production build
   * (fast, deterministic per-route — dev mode compiles on demand and is slow
   * and flaky). Locally we use the dev server and reuse an already-running one. */
  webServer: {
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 240 * 1000, // 4 minutes for server startup
    stdout: "pipe", // Capture server logs
    stderr: "pipe",
  },
});
