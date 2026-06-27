import { test, expect } from '@playwright/test';
import { primeAuthCookies } from './helpers/auth';

test.describe('Integrated School Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await primeAuthCookies(page);

    // Low-priority fallback + auth mocks so an incidental 401 never triggers the
    // refresh->logout redirect. Per-test mocks (registered later) take
    // precedence.
    await page.route('**/api/**', async (route) => {
      await route.fulfill({ json: { success: true, data: [] } });
    });
    await page.route('**/api/auth/refresh', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: { accessToken: 'mock-token', refreshToken: 'mock-token' },
        },
      });
    });
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: { id: '1', name: 'Admin', role: 'SUPER_ADMIN' },
        },
      });
    });

    // Seed auth state before any page JS runs (applies on every navigation), so
    // the auth store is hydrated on first paint and never races into the
    // logout/redirect flow.
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: { id: '1', name: 'Admin', role: 'SUPER_ADMIN' },
          isAuthenticated: true
        }
      }));
    });
  });

  test('Unified Raport - Access and Display Data', async ({ page }) => {
    // Mock Unified Raport API
    // The hook hits .../unified-raport/students/<id>?... — a single "*" won't
    // cross the "/students/" segment, so use "**" to match the full path.
    await page.route('**/api/assessment/unified-raport/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            student: { name: 'Ahmad Santri', class: '10-A', nis: '2023001' },
            school: { name: 'SMA Al-Qur\'an Cipansor', address: 'Tasikmalaya' },
            meta: { academicYear: '2023/2024', semester: 1 },
            academic: {
              intrakurikuler: [
                { subjectName: 'Matematika', finalScore: 85, competencyDescription: 'Sangat baik dalam aljabar' },
                { subjectName: 'Bahasa Indonesia', finalScore: 88, competencyDescription: 'Mahir dalam literasi' }
              ],
              attendance: { sick: 1, excused: 0, absent: 0 }
            },
            islamic: {
              tahfidz: { totalJuz: 5, latestSurah: 'Al-Baqarah' },
              grade: 'MUMTAZ',
              score: 95
            },
            remarks: { academic: 'Pertahankan prestasimu!' },
            signatures: { principal: 'Dr. H. Ahmad', homeroomTeacher: 'Ustadz Ali' }
          }
        })
      });
    });

    await page.goto('/assessment/unified-raport/student-1?academicYearId=year-1&semester=1');

    await expect(page.locator('text=Ahmad Santri')).toBeVisible();
    await expect(page.locator('text=Matematika')).toBeVisible();
    await expect(page.locator('text=85')).toBeVisible();
    await expect(page.locator('text=5 Juz')).toBeVisible();
    await expect(page.locator('text=MUMTAZ')).toBeVisible();
  });

  test('Talent Management - Display Talent Matrix', async ({ page }) => {
    // Mock Talent Analytics API
    await page.route('**/api/talenta/analytics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total: 1,
            distribution: { KEY_TALENT: 1, HIGH_POTENTIAL: 0, EMERGING: 0, SOLID_PERFORMER: 0, NEEDS_DEVELOPMENT: 0 },
            percentages: { KEY_TALENT: 100, HIGH_POTENTIAL: 0, EMERGING: 0, SOLID_PERFORMER: 0, NEEDS_DEVELOPMENT: 0 },
            profiles: [
              {
                id: 'p1',
                name: 'Budi Guru',
                currentRole: 'Guru Matematika',
                performanceScore: 90,
                potentialScore: 95,
                category: 'KEY_TALENT'
              }
            ]
          }
        })
      });
    });

    await page.goto('/hr/talenta');

    await expect(page.locator('text=Matriks Talenta')).toBeVisible();
    await expect(page.locator('text=Key Talents')).toBeVisible();

    // Check initials BG
    await expect(page.locator('text=BG')).toBeVisible();

    // Hover to see name - using first() to avoid strict mode violation if tooltips are tricky
    await page.locator('text=BG').hover();
    await expect(page.locator('text=Budi Guru').first()).toBeVisible();
  });
});
