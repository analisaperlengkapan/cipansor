import { test, expect } from '@playwright/test';

test.describe('Library Advanced Features', () => {
  test('should add book copy and scan to borrow', async ({ page }) => {
    // Mock API
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ json: { id: 'user-1', role: 'SUPER_ADMIN' } });
    });

    // Mock Book Detail
    await page.route('**/api/library/books/book-1', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            id: 'book-1',
            title: 'Test Book',
            quantity: 1,
            available: 1,
            category: { name: 'Umum' }
          }
        }
      });
    });

    // Mock Borrows List
    await page.route('**/api/library/borrowings?bookId=book-1&limit=50', async (route) => {
        await route.fulfill({ json: { success: true, data: [], meta: { total: 0 } } });
    });

    // Mock Copies List
    await page.route('**/api/library/books/book-1/copies', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, json: { success: true, data: { id: 'copy-1', code: 'BC-123' } } });
      } else {
        await route.fulfill({ json: { success: true, data: [] } });
      }
    });

    // Visit Book Detail
    await page.goto('/library/books/book-1');

    // Wait for page load
    await expect(page.getByText('Informasi Buku')).toBeVisible({ timeout: 10000 });

    // Click Tab explicitly
    await page.click('text=Eksemplar');

    // Add Copy
    await expect(page.getByText('Tambah Salinan')).toBeVisible();
    await page.click('text=Tambah Salinan');
    await page.fill('input[placeholder="Scan atau ketik kode..."]', 'BC-123');
    await page.click('button:has-text("Simpan")');

    // Verify Toast
    await expect(page.getByText('Salinan buku berhasil ditambahkan')).toBeVisible();

    // Mock Scan
    await page.route('**/api/library/copies/BC-123', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            id: 'copy-1',
            bookId: 'book-1',
            code: 'BC-123',
            status: 'AVAILABLE',
            book: {
                id: 'book-1',
                title: 'Test Book',
                quantity: 1,
                available: 1,
                category: { name: 'Umum' }
            }
          }
        }
      });
    });

    // Mock Students for Borrow Page
    await page.route('**/api/students?limit=100', async (route) => {
        await route.fulfill({ json: { success: true, data: [{ id: 'student-1', name: 'Student Test', nis: '123' }] } });
    });

    // Mock Books List for Borrow Page
    await page.route('**/api/library/books?limit=100', async (route) => {
        await route.fulfill({ json: { success: true, data: [{ id: 'book-1', title: 'Test Book', available: 1 }] } });
    });

    // Go to Borrow
    await page.goto('/library/borrow');

    // Scan Barcode
    await page.fill('input[placeholder="Scan barcode buku disini..."]', 'BC-123');

    // Verify Auto-Selection
    // Wait for debounce and query
    await page.waitForTimeout(2000);
    await expect(page.getByText('Buku ditemukan: Test Book')).toBeVisible();
    await expect(page.getByText('Buku terpilih:')).toBeVisible();
  });
});
