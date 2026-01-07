import { test, expect } from './fixtures/auth.fixture';
import { Page } from '@playwright/test';

// Mock Data
const MOCK_FOUNDATION_ID = 'foundation-123';
const MOCK_STATS = {
  foundationId: MOCK_FOUNDATION_ID,
  foundationName: 'Yayasan Cipansor',
  totalUnits: 4,
  totalStudents: 1250,
  totalTeachers: 85,
  totalStaff: 40,
  totalBoardMembers: 5,
  activeBoardMembers: 5,
  totalDocuments: 15,
  expiringDocuments: 2,
  unitsSummary: [
    { id: 'u1', name: 'TK Quran', type: 'TK_QURAN', _count: { students: 100, teachers: 10, staff: 2 } },
    { id: 'u2', name: 'SD IT', type: 'SD_IT', _count: { students: 500, teachers: 30, staff: 10 } },
    { id: 'u3', name: 'SMP IT', type: 'SMP_IT', _count: { students: 400, teachers: 25, staff: 8 } },
    { id: 'u4', name: 'SMA Quran', type: 'SMA_QURAN', _count: { students: 250, teachers: 20, staff: 10 } },
  ],
  financialSummary: {
    totalRevenue: 500000000,
    totalExpense: 350000000,
    netIncome: 150000000,
    period: 'Bulan Ini',
  },
  studentsByUnit: [
    { unitId: 'u1', unitName: 'TK Quran', count: 100 },
    { unitId: 'u2', unitName: 'SD IT', count: 500 },
    { unitId: 'u3', unitName: 'SMP IT', count: 400 },
    { unitId: 'u4', unitName: 'SMA Quran', count: 250 },
  ],
  staffByUnit: [
    { unitId: 'u1', unitName: 'TK Quran', count: 12 },
    { unitId: 'u2', unitName: 'SD IT', count: 40 },
    { unitId: 'u3', unitName: 'SMP IT', count: 33 },
    { unitId: 'u4', unitName: 'SMA Quran', count: 30 },
  ],
};

const MOCK_FOUNDATION = {
  id: MOCK_FOUNDATION_ID,
  name: 'Yayasan Cipansor',
  legalName: 'Yayasan Pendidikan Islam Cipansor',
  registrationNumber: 'AHU-123456',
  email: 'info@cipansor.com',
  phone: '021-12345678',
  address: 'Jl. Pesantren No. 1',
  city: 'Jakarta',
  province: 'DKI Jakarta',
  postalCode: '12345',
  foundedDate: '2010-01-01',
};

test.describe('Foundation Dashboard Visual Verification', () => {
  test('should render foundation dashboard with charts and stats', async ({ authenticatedPage: page }) => {
    // Mock API Responses
    await page.route('**/api/foundation', async (route) => {
      await route.fulfill({ json: { success: true, data: MOCK_FOUNDATION } });
    });

    await page.route(`**/api/foundation/${MOCK_FOUNDATION_ID}/stats`, async (route) => {
      await route.fulfill({ json: { success: true, data: MOCK_STATS } });
    });

    await page.route('**/api/foundation/documents', async (route) => {
        await route.fulfill({ json: { success: true, data: [] } });
    });

    await page.route('**/api/foundation/board-members*', async (route) => {
        await route.fulfill({ json: { success: true, data: [] } });
    });

    // Navigate to Foundation Page
    await page.goto('/foundation');

    // Wait for Dashboard Elements
    await expect(page.getByText('Total Santri')).toBeVisible();
    await expect(page.getByText('1250')).toBeVisible(); // Total Students
    await expect(page.getByText('Total Pegawai')).toBeVisible();
    await expect(page.getByText('125')).toBeVisible(); // Total Teachers (85) + Staff (40)

    // Check for Charts (Recharts renders as SVG or Divs)
    await expect(page.getByText('Distribusi Santri per Unit')).toBeVisible();
    await expect(page.getByText('Komposisi SDM')).toBeVisible();

    // Check Financial Summary
    await expect(page.getByText('Ringkasan Finansial')).toBeVisible();
    await expect(page.getByText('Rp 500.000.000')).toBeVisible(); // Revenue

    // Take Screenshot
    await page.screenshot({ path: 'foundation-dashboard-visual.png', fullPage: true });

    console.log('Screenshot captured: foundation-dashboard-visual.png');
  });
});
