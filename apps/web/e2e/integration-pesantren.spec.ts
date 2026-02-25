import { test, expect } from '@playwright/test';
import { setupMockUser, login } from './utils/auth';

test.describe('End-to-End: Integrated Pesantren Modules (Tahfidz, Takhosus, Kitab, Rapor)', () => {
  test.beforeEach(async ({ page }) => {
    // Setup super admin access for e2e testing the unified module
    await setupMockUser(page, {
      role: 'SUPER_ADMIN',
      unitId: 'unit-pesantren-cipansor',
    });
    await login(page);
  });

  test('should aggregate Tahfidz, Takhosus, and Kitab data into the Unified Rapor Pesantren', async ({ page }) => {
    // 1. Mocking API Resources for the Unified Rapor page
    const raporId = 'rapor-123';
    
    await page.route(`**/api/v1/rapor-pesantren/${raporId}*`, async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            id: raporId,
            studentId: 'stud-001',
            status: 'PUBLISHED',
            semester: 1,
            academicYear: { name: '2025/2026' },
            student: { 
              id: 'stud-001',
              name: 'Santri Teladan', 
              nis: '998877',
              class: { name: 'Kelas 5 Ulya' },
              dormRoom: { name: 'Asrama Putra 1' }
            },
            overallScore: 92.5,
            overallGrade: 'MUMTAZ',
            tahfidz: {
              setoranCount: 15,
              murajaahCount: 20,
              latestSurah: 'Al-Baqarah',
              latestJuz: 2,
              score: 95.0,
              grade: 'MUMTAZ'
            },
            takhosus: {
              enrolledHalaqoh: 1,
              totalSessions: 12,
              score: 88.5,
              grade: 'JAYYID JIDDAN',
              halaqohDetails: [
                {
                  halaqohName: 'Takhosus Qiroat',
                  progress: 75,
                  latestGrade: 'MUMTAZ',
                }
              ]
            },
            kitabProgress: {
              completedKitab: 3,
              readPages: 450,
              totalPages: 500,
              score: 90.0,
              grade: 'MUMTAZ'
            },
            ibadah: {
              score: 98.0,
              grade: 'MUMTAZ'
            },
            akhlak: {
              totalViolations: 0,
              totalRewards: 5,
              score: 100,
              grade: 'MUMTAZ'
            },
            musyrifNotes: 'Santri yang sangat rajin dan taat beribadah.',
            headTeacherNotes: 'Pertahankan prestasi belajarmu.'
          }
        }
      });
    });

    // 2. Navigate to the Unified Rapor Pesantren page
    await page.goto(`/rapor-pesantren/unified/${raporId}`);

    // Wait for the page title to appear
    await expect(page.getByRole('heading', { name: 'Rapor Pesantren Terpadu' })).toBeVisible();

    // 3. Verify Student Header Data
    await expect(page.getByText('Santri Teladan')).toBeVisible();
    await expect(page.getByText('NIS: 998877')).toBeVisible();
    await expect(page.getByText('Dipublikasikan')).toBeVisible();

    // 4. Verify cross-module aggregated scores are present via the new integrations
    
    // Tahfidz Aggregation
    await expect(page.getByRole('heading', { name: 'Tahfidz Al-Quran' })).toBeVisible();
    await expect(page.getByText('15 Kali', { exact: false }).first()).toBeVisible(); // Setoran
    await expect(page.getByText('20 Kali', { exact: false })).toBeVisible(); // Murojaah
    await expect(page.getByText('Al-Baqarah (Juz 2)')).toBeVisible();

    // Takhosus Aggregation (New Integration)
    await expect(page.getByRole('heading', { name: 'Program Takhosus' })).toBeVisible();
    await expect(page.getByText('88.5', { exact: true })).toBeVisible(); // Takhosus Score
    await expect(page.getByText('Takhosus Qiroat')).toBeVisible();
    await expect(page.getByText('75% - MUMTAZ')).toBeVisible();

    // Kitab Progress Aggregation
    await expect(page.getByRole('heading', { name: 'Kajian Kitab Kuning' })).toBeVisible();
    await expect(page.getByText('Kitab Selesai: 3')).toBeVisible();
    await expect(page.getByText('Halaman Terbaca: 450 / 500')).toBeVisible();

    // 5. Verify Ibadah & Akhlak
    await expect(page.getByRole('heading', { name: 'Ibadah & Karakter (Akhlak)' })).toBeVisible();
    await expect(page.getByText('Prestasi: 5')).toBeVisible();
    
    // 6. Verify print layout structure
    await expect(page.getByRole('button', { name: 'Cetak Rapor' })).toBeVisible();
    await expect(page.getByText('Mudirul Ma\'had')).toBeVisible();
  });
});
