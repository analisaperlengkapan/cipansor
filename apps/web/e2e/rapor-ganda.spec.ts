import { test, expect } from '@playwright/test';
import { setupMockUser, login } from './utils/auth';

test.describe('End-to-End: Rapor Ganda (Unified Raport) Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Setup super admin access for e2e testing the Assessment module
    await setupMockUser(page, {
      role: 'SUPER_ADMIN',
      unitId: 'unit-sekolah-dasar-1',
    });
    await login(page);
  });

  test('should successfully load dropdowns, select student, and generate unified raport', async ({ page }) => {
    // 1. Mocking the API resources required for dynamic dropdowns
    await page.route('**/api/academic-years**', async (route) => {
      await route.fulfill({
        json: {
          data: [{ id: 'ay-2026', name: '2025/2026', isActive: true }]
        }
      });
    });

    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({
        json: {
          data: [{ id: 'class-1a', name: 'Kelas 1A' }]
        }
      });
    });

    await page.route('**/api/students**', async (route) => {
      await route.fulfill({
        json: {
          data: [{ id: 'stud-001', name: 'Ahmad Hanif', nis: '12345' }]
        }
      });
    });

    // Mocking the ultimate Unified Raport payload from backend orchestrator
    // We only need to provide the shape the UI expects to render
    await page.route('**/api/assessment/unified-raport/students/stud-001?academicYearId=ay-2026&semester=1', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            school: { name: 'SDIT IBB', address: 'Bandung' },
            student: { name: 'Ahmad Hanif', nis: '12345', nisn: '99', class: 'Kelas 1A' },
            meta: { semester: 1 },
            academic: {
              intrakurikuler: {
                kelompokUmum: [
                  { subjectName: 'Matematika', nilaiAkhir: 95, predikat: 'Sangat Baik', deskripsi: 'Mumpuni' }
                ]
              },
              p5: [
                { tema: 'Kewirausahaan', judul: 'Pasar Mini', deskripsiProyek: '-', dimensiTerkait: [] }
              ]
            },
            islamic: {
              tahfidz: { totalJuz: 2, surahTerakhir: 'Al-Mulk', catatan: 'Mumtaz' },
              ibadah: { grade: 'A', completionRate: 98 }
            },
            signatures: { homeroomTeacher: 'Ustadz Budi' }
          }
        }
      });
    });

    // 2. Navigate to the Unified Raport generator page
    await page.goto('/assessment/unified-raport');
    await expect(page.getByRole('heading', { name: /Unified SD IT Raport/i })).toBeVisible();

    // Select Academic Year
    await page.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: '2025/2026' }).click();

    // Select Class
    await page.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: 'Kelas 1A' }).click();

    // Select Student
    await page.getByRole('combobox').nth(2).click();
    await page.getByRole('option', { name: 'Ahmad Hanif (12345)' }).click();

    // Select Semester 1
    await page.getByRole('combobox').nth(3).click();
    await page.getByRole('option', { name: 'Semester 1 (Ganjil)' }).click();

    // 3. Click Generate Report
    await page.getByRole('button', { name: /Generate Report/i }).click();

    // 4. Verify Unified Report Output renders on screen
    await expect(page.getByText('LAPORAN HASIL BELAJAR (RAPOR)')).toBeVisible();
    await expect(page.getByText('Ahmad Hanif')).toBeVisible();
    
    // Academic Section
    await expect(page.getByRole('cell', { name: 'Matematika' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Sangat Baik' })).toBeVisible();

    // Islamic/Tahfidz Section
    await expect(page.getByText('Total Hafalan: 2 Juz')).toBeVisible();
    await expect(page.getByText('Surah Terakhir: Al-Mulk')).toBeVisible();

    // Signatures
    await expect(page.getByText('Ustadz Budi')).toBeVisible();
  });
});
