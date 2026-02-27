import { test, expect } from '@playwright/test';

test('visitor can access registration page and submit form', async ({ page }) => {
  // 1. Go to registration page
  await page.goto('/ppdb/register');

  // 2. Check title
  await expect(page.locator('h1')).toContainText('Formulir Pendaftaran Santri Baru');

  // 3. Fill form
  await page.fill('input[name="fullName"]', 'Calon Santri E2E');

  // Birth Place
  await page.fill('input[name="birthPlace"]', 'Jakarta');

  // Birth Date
  await page.fill('input[name="birthDate"]', '2015-01-01');

  // Select Gender
  // Find the trigger. In Shadcn, it's often a button with role combobox inside the form item
  // We target the trigger specifically associated with gender
  await page.click('button[role="combobox"]');
  await page.click('div[role="option"] >> text=Laki-laki');

  // Address
  await page.fill('textarea[name="address"]', 'Jl. Testing No. 1');

  // Parent Info
  await page.fill('input[name="parentName"]', 'Orang Tua E2E');
  await page.fill('input[name="parentPhone"]', '081234567890');
  await page.fill('input[name="email"]', 'test@example.com');

  // Previous School
  await page.fill('input[name="previousSchool"]', 'SD Asal');

  // 4. Submit
  await page.click('button[type="submit"]');

  // 5. Expect redirect to payment (wait for URL change)
  await expect(page).toHaveURL(/\/ppdb\/registration\/.*\/payment/, { timeout: 10000 });

  // 6. Check payment page content
  await expect(page.locator('h1')).toContainText('Pendaftaran Berhasil');
  await expect(page.locator('text=Invoice #')).toBeVisible();
});
