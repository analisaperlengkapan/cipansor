import { test, expect } from '@playwright/test';

test.describe('Procurement Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Super Admin using global setup or direct login
    // Assuming 'storageState' is set up in playwright.config.ts or we login manually
    // If not using global storage state, we'd need to login here.
    // Checking auth.spec.ts pattern would be ideal, but standard is usually:
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@cipansor.com'); // Default seed admin
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create, approve, order, and fulfill a purchase request', async ({ page }) => {
    // 1. Navigate to Procurement
    await page.goto('/procurement');
    await expect(page.getByRole('heading', { name: 'Pengadaan Barang' })).toBeVisible();

    // 2. Create New Request
    await page.getByRole('link', { name: 'Buat Pengajuan' }).click();
    await page.waitForURL('/procurement/create');

    // Fill Header
    // Select Unit (Shadcn Select)
    await page.click('button:has-text("Pilih Unit")'); // Adjust selector based on UI
    await page.click('div[role="option"] >> nth=0'); // Pick first unit

    // Fill Description
    await page.fill('textarea[name="description"]', 'E2E Test Procurement Request');

    // 3. Add Item
    // Assuming there's a dynamic form for items
    await page.fill('input[name="items.0.itemName"]', 'Test Item E2E');
    await page.fill('input[name="items.0.quantity"]', '10');
    await page.fill('input[name="items.0.unit"]', 'pcs');
    await page.fill('input[name="items.0.estimatedPrice"]', '50000');

    // Select Asset Category (Optional but good to test)
    // await page.click('button:has-text("Kategori Aset")');
    // await page.click('div[role="option"] >> nth=0');

    // Submit
    await page.getByRole('button', { name: 'Simpan Pengajuan' }).click();

    // 4. Verify Redirect to Detail
    await expect(page).toHaveURL(/\/procurement\/[a-zA-Z0-9-]+/);

    // 5. Approve Request
    // Wait for buttons to load
    await expect(page.getByRole('button', { name: 'Setujui' })).toBeVisible();

    // Handle Confirm Dialog
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Setujui' }).click();

    // Verify Status Update
    await expect(page.getByText('APPROVED')).toBeVisible();

    // 6. Verify Print PO Button Exists
    const printButton = page.getByRole('link', { name: 'Cetak PO' });
    await expect(printButton).toBeVisible();
    await expect(printButton).toHaveAttribute('target', '_blank');

    // 7. Mark as Ordered
    await page.getByRole('button', { name: 'Tandai Dipesan' }).click();
    await expect(page.getByText('ORDERED')).toBeVisible();

    // 8. Fulfill (Receive Goods)
    await page.getByRole('button', { name: 'Terima Barang' }).click();

    // Fill Fulfillment Dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.fill('input[name="purchaseOrderNo"]', 'PO-E2E-001');
    // Supplier might be a select or input
    // await page.fill('input[name="supplier"]', 'E2E Vendor');

    // Submit Fulfillment
    await page.getByRole('button', { name: 'Simpan Penerimaan' }).click();

    // 9. Verify Final Status
    await expect(page.getByText('RECEIVED')).toBeVisible();
    await expect(page.getByText('Barang Diterima')).toBeVisible();
  });
});
