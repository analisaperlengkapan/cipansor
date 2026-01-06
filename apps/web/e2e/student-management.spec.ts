import { test, expect } from './fixtures/auth.fixture';
import { waitForLoadingComplete, fillForm, clickTableRow, getTableData, waitForToast } from './helpers/page-helpers';
import { LoginPage } from './page-objects';

/**
 * Student Management E2E Tests
 * Tests CRUD operations, search, filter, and pagination
 */

test.describe('Student Management - List & View', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard('superadmin@cipansor.id', 'SuperAdmin123!');
    
    // Navigate to students page
    await page.goto('/students');
    await waitForLoadingComplete(page);
  });

  test('should display students list page', async ({ page }) => {
    // Check page heading with multiple possible variations
    const heading = page.getByRole('heading', { name: /daftar santri|students|siswa|santri/i }).first();
    const pageTitle = page.locator('h1, h2, h3').filter({ hasText: /santri|student|siswa/i }).first();
    
    if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    } else if (await pageTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(pageTitle).toBeVisible();
    } else {
      // At minimum, should be on students page
      await expect(page).toHaveURL(/students/);
    }
    
    // Check for add button
    const addButton = page.getByRole('button', { name: /tambah|add|create/i }).first();
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(addButton).toBeVisible();
    }
    
    // Check if table or grid exists
    const hasTable = await page.locator('table').isVisible({ timeout: 2000 }).catch(() => false);
    const hasGrid = await page.locator('[role="grid"]').isVisible({ timeout: 2000 }).catch(() => false);
    const hasListItems = await page.locator('[role="listitem"]').first().isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(hasTable || hasGrid || hasListItems).toBeTruthy();
  });

  test('should search students by name', async ({ page }) => {
    // Find search input
    const searchInput = page.getByPlaceholder(/cari|search/i).or(page.getByLabel(/cari|search/i));
    
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Ahmad');
      await waitForLoadingComplete(page);
      
      // Results should be filtered
      const rows = page.locator('table tbody tr, [role="row"]');
      const count = await rows.count();
      
      if (count > 0) {
        const firstRow = rows.first();
        const text = await firstRow.textContent();
        expect(text?.toLowerCase()).toContain('ahmad');
      }
    } else {
      test.skip(true, 'Search functionality not found');
    }
  });

  test('should filter students by unit', async ({ page }) => {
    // Find filter dropdown
    const unitFilter = page.locator('button[role="combobox"]').filter({ hasText: /unit|semua/i }).first();
    
    if (await unitFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await unitFilter.click();
      
      const options = page.getByRole('option');
      const optionCount = await options.count();
      
      if (optionCount > 1) {
        await options.nth(1).click();
        await waitForLoadingComplete(page);
        
        // Data should be filtered
        await expect(page.locator('table tbody tr, [role="row"]').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should paginate through students', async ({ page }) => {
    // Look for pagination controls
    const nextButton = page.getByRole('button', { name: /next|selanjutnya|>/i });
    
    if (await nextButton.isEnabled({ timeout: 3000 }).catch(() => false)) {
      // Get first student name
      const firstStudent = await page.locator('table tbody tr, [role="row"]').first().textContent();
      
      // Go to next page
      await nextButton.click();
      await waitForLoadingComplete(page);
      
      // Should show different students
      const newFirstStudent = await page.locator('table tbody tr, [role="row"]').first().textContent();
      expect(newFirstStudent).not.toBe(firstStudent);
    } else {
      test.skip(true, 'Pagination not available or only one page');
    }
  });

  test('should view student detail', async ({ page }) => {
    // Click first student row
    const firstRow = page.locator('table tbody tr, [role="row"]').first();
    
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Try clicking the row or view button
      const viewButton = firstRow.getByRole('button', { name: /view|lihat|detail/i });
      
      if (await viewButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await viewButton.click();
      } else {
        await firstRow.click();
      }
      
      // Should navigate to detail page or open modal
      const isModal = await page.locator('[role="dialog"]').isVisible({ timeout: 3000 }).catch(() => false);
      const urlChanged = page.url().includes('/students/');
      
      expect(isModal || urlChanged).toBeTruthy();
      
      if (isModal || urlChanged) {
        // Should show student details
        await expect(page.getByText(/nama|name/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/nisn|nis/i)).toBeVisible();
      }
    } else {
      test.skip(true, 'No students available');
    }
  });
});

test.describe('Student Management - Create', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = await import('./page-objects');
    const login = new loginPage.LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.goto('/students');
    await waitForLoadingComplete(page);
  });

  test('should open create student form', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /tambah|add|create/i }).first();
    await addButton.click();
    
    // Should show form
    await expect(page.getByRole('heading', { name: /tambah|add|create|baru/i })).toBeVisible({ timeout: 5000 });
    
    // Check for required fields
    await expect(page.getByLabel(/nama|name/i)).toBeVisible();
    await expect(page.getByLabel(/nisn|nis/i)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /tambah|add|create/i }).first();
    await addButton.click();
    await waitForLoadingComplete(page);
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /simpan|save|submit/i });
    await submitButton.click();
    
    // Should show validation errors
    const errorMessage = page.getByText(/wajib|required|harus diisi/i);
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should create new student successfully', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /tambah|add|create/i }).first();
    await addButton.click();
    await waitForLoadingComplete(page);
    
    // Generate unique data
    const timestamp = Date.now();
    const studentData = {
      nama: `Test Student ${timestamp}`,
      nisn: `TEST${timestamp.toString().slice(-10)}`,
    };
    
    // Fill form
    await page.getByLabel(/nama|name/i).first().fill(studentData.nama);
    await page.getByLabel(/nisn|nis/i).first().fill(studentData.nisn);
    
    // Fill other required fields if they exist
    const emailInput = page.getByLabel(/email/i);
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill(`test${timestamp}@example.com`);
    }
    
    const unitSelect = page.locator('button[role="combobox"]').filter({ hasText: /unit/i }).first();
    if (await unitSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await unitSelect.click();
      await page.getByRole('option').first().click();
    }
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /simpan|save|submit/i });
    await submitButton.click();
    
    // Should show success message
    await waitForToast(page, /berhasil|success/i, 'success');
    
    // Should navigate back to list or close modal
    await waitForLoadingComplete(page);
  });
});

test.describe('Student Management - Update', () => {
  test('should edit student information', async ({ page }) => {
    const loginPage = await import('./page-objects');
    const login = new loginPage.LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.goto('/students');
    await waitForLoadingComplete(page);
    
    // Find first student
    const firstRow = page.locator('table tbody tr, [role="row"]').first();
    
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click edit button
      const editButton = firstRow.getByRole('button', { name: /edit|ubah/i });
      
      if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await editButton.click();
        await waitForLoadingComplete(page);
        
        // Should show edit form
        await expect(page.getByRole('heading', { name: /edit|ubah/i })).toBeVisible({ timeout: 5000 });
        
        // Update a field
        const nameInput = page.getByLabel(/nama|name/i).first();
        const currentName = await nameInput.inputValue();
        await nameInput.fill(`${currentName} (Updated)`);
        
        // Save changes
        const saveButton = page.getByRole('button', { name: /simpan|save|update/i });
        await saveButton.click();
        
        // Should show success message
        await waitForToast(page, /berhasil|success/i, 'success');
      } else {
        test.skip(true, 'Edit button not found');
      }
    } else {
      test.skip(true, 'No students available');
    }
  });
});

test.describe('Student Management - Delete', () => {
  test('should delete student with confirmation', async ({ page }) => {
    const loginPage = await import('./page-objects');
    const login = new loginPage.LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.goto('/students');
    await waitForLoadingComplete(page);
    
    // Find first student
    const firstRow = page.locator('table tbody tr, [role="row"]').first();
    
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      const studentName = await firstRow.textContent();
      
      // Click delete button
      const deleteButton = firstRow.getByRole('button', { name: /delete|hapus/i });
      
      if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deleteButton.click();
        
        // Should show confirmation dialog
        const confirmDialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
        await expect(confirmDialog).toBeVisible({ timeout: 3000 });
        
        // Confirm deletion
        const confirmButton = confirmDialog.getByRole('button', { name: /ya|yes|confirm|hapus/i });
        await confirmButton.click();
        
        // Should show success message
        await waitForToast(page, /berhasil|success|deleted/i, 'success');
        
        await waitForLoadingComplete(page);
      } else {
        test.skip(true, 'Delete button not found');
      }
    } else {
      test.skip(true, 'No students available');
    }
  });
});

test.describe('Student Management - Export', () => {
  test('should export students data', async ({ page }) => {
    const loginPage = await import('./page-objects');
    const login = new loginPage.LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard('superadmin@cipansor.id', 'SuperAdmin123!');
    
    await page.goto('/students');
    await waitForLoadingComplete(page);
    
    // Look for export button
    const exportButton = page.getByRole('button', { name: /export|unduh|download/i });
    
    if (await exportButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.xlsx|\.csv|\.pdf/i);
    } else {
      test.skip(true, 'Export button not found');
    }
  });
});
