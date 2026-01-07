import { defineConfig, devices } from '@playwright/test';

/**
 * Custom Playwright Config for Verification
 * - Disables Global Setup (which fails due to backend timeout)
 * - Only runs Chromium
 * - Uses Mock Data exclusively
 */
export default defineConfig({
    testDir: './e2e',

    /* No Global Setup */
    // globalSetup: require.resolve('./e2e/global-setup'),

    /* Parallel Execution */
    fullyParallel: true,
    workers: 1,

    /* Timeouts */
    timeout: 30000,
    expect: {
        timeout: 8000,
    },

    /* Output */
    outputDir: './test-results',

    /* Reporters */
    reporter: [['list']],

    /* Shared settings */
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'on',
        actionTimeout: 10000,
        navigationTimeout: 20000,
        locale: 'id-ID',
        timezoneId: 'Asia/Jakarta',
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
    },

    /* Only run Chromium for verification */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
            },
        },
    ],

    /* Run local dev server */
    webServer: {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
});
