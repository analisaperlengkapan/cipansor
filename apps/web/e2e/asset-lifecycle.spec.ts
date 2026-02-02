import { test, expect } from "./fixtures/auth.fixture";
import {
  waitForLoadingComplete,
  waitForToast,
  navigateTo,
} from "./helpers/page-helpers";

test.describe("Asset Management Lifecycle", () => {
  test.use({ storageState: ".auth/superAdmin.json" });

  const categoryName = `Test Cat ${Date.now()}`;
  const categoryCode = `TC${Date.now()}`;
  const assetName = `Test Asset ${Date.now()}`;
  const assetCode = `TA${Date.now()}`;

  test("should manage categories and dispose asset", async ({ page }) => {
    // 1. Navigate to Inventory
    await navigateTo(page, "/inventory");

    // 2. Open Category Dialog & Create Category
    const categoryButton = page.getByRole("button", { name: "Kategori" });
    await expect(categoryButton).toBeVisible();
    await categoryButton.click();

    const addCategoryButton = page.getByRole("button", { name: "Tambah Kategori" });
    await expect(addCategoryButton).toBeVisible();
    await addCategoryButton.click();

    // Fill Category Form
    await page.getByPlaceholder("Contoh: Elektronik").fill(categoryName);
    await page.getByPlaceholder("Contoh: ELK").fill(categoryCode);
    await page.locator('input[name="defaultUsefulLife"]').fill("12");
    await page.locator('input[name="defaultResidualValue"]').fill("0");
    await page.getByLabel("Deskripsi").fill("Created by E2E test");

    await page.getByRole("button", { name: "Simpan" }).click();
    await waitForToast(page, "Kategori dibuat");

    // Verify it appears in the list
    await expect(page.getByText(categoryName)).toBeVisible();

    // Close dialogs
    await page.keyboard.press("Escape"); // Close form if still open/focused (though toast usually means closed)
    await page.keyboard.press("Escape"); // Close categories list

    // 3. Create Asset
    const addAssetButton = page.getByRole("button", { name: "Tambah Aset" });
    await addAssetButton.click();
    await waitForLoadingComplete(page);

    await page.getByLabel("Kode Aset").fill(assetCode);
    await page.getByLabel("Nama Aset").fill(assetName);

    // Select Category
    await page.locator('button[role="combobox"]').filter({ hasText: "Pilih kategori" }).click();
    await page.keyboard.type(categoryName);
    await page.keyboard.press("Enter");

    // Select Unit (Pick first available)
    await page.locator('button[role="combobox"]').filter({ hasText: "Pilih unit" }).click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await page.getByLabel("Harga Beli").fill("10000000");
    // Date needs specific format or picking? Input type=date usually accepts yyyy-mm-dd
    await page.locator('input[name="purchaseDate"]').fill("2023-01-01");

    await page.getByRole("button", { name: "Simpan" }).click();
    await waitForToast(page, "Inventaris berhasil ditambahkan");

    // 4. Dispose Asset
    await expect(page).toHaveURL(/\/inventory$/);

    // Search for the item
    await page.getByPlaceholder("Cari nama").fill(assetName);
    await page.waitForTimeout(1000); // Wait for debounce

    // Click View/Eye icon
    await page.locator("table tr").first().locator("a").first().click();
    await waitForLoadingComplete(page);

    // Click Dispose
    const disposeButton = page.getByRole("button", { name: "Dispose" });
    await expect(disposeButton).toBeVisible();
    await disposeButton.click();

    // Confirm
    await page.getByRole("button", { name: "Confirm Disposal" }).click();
    await waitForToast(page, "Asset disposed successfully");
  });
});
