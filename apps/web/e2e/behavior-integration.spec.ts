import { test, expect } from '@playwright/test';

test.describe('Behavior & Counseling Integration', () => {
  test('High violation points should trigger counseling session', async ({ page }) => {
    // Navigate to Violations
    await page.goto('/violations');

    // Open Create Modal
    // Note: Adjust selector based on actual UI text "Catat Pelanggaran" or "+" icon
    const createBtn = page.locator('button:has-text("Catat"), button:has-text("Lapor"), button[aria-label="Buat"]');
    if (await createBtn.count() > 0) {
        await createBtn.first().click();
    } else {
        // Fallback to URL if button not found (e.g. /violations/new)
        await page.goto('/violations/new');
    }

    // Select Student (Generic robust selection for Shadcn/Radix Select)
    await page.locator('button[role="combobox"]').first().click();
    await page.locator('[role="option"]').nth(0).click(); // Select first student

    // Fill Violation Details
    await page.fill('input[name="description"], textarea[name="description"]', 'Test Major Violation for E2E');

    // Set Points (if manual override allowed or via Type)
    // Assuming there is a points input or type selection
    // If type selection:
    // await page.click('text=Jenis Pelanggaran');
    // await page.click('text=Berat');

    // Direct points input if available (based on schema it is an Int field)
    const pointsInput = page.locator('input[name="points"], input[type="number"]');
    if (await pointsInput.isVisible()) {
        await pointsInput.fill('60');
    } else {
        // Try selecting a category that gives high points if points are not manually input
        // This part depends on UI implementation details
    }

    // Submit
    await page.click('button[type="submit"]');

    // Wait for success
    await expect(page.getByText(/berhasil|success/i)).toBeVisible();

    // Verify Counseling Session Auto-Creation
    await page.goto('/counseling');
    // Search for the auto-generated title
    await page.fill('input[placeholder*="Cari"]', 'Auto-referral');
    await expect(page.getByText('Auto-referral: High Violation Points')).toBeVisible();

    // Verify Risk Dashboard
    await page.goto('/counseling/risk');
    // Check if the table lists the student with high points
    // We expect at least one row with points >= 50
    await expect(page.locator('table tr')).not.toHaveCount(0);
    // Check for the "60 Poin" badge or similar
    await expect(page.getByText(/60 Poin/)).toBeVisible();
  });
});
