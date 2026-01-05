import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Generate Screenshots', () => {
  test.use({
    viewport: { width: 1280, height: 800 },
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
  });

  test.beforeEach(async ({ page, context }) => {
    // 1. Mock Authentication with full consistency
    const mockUser = {
      id: 'user-123',
      name: 'Test Admin',
      email: 'admin@cipansor.id',
      role: 'SUPER_ADMIN',
      unitId: 'unit-123',
      unit: { id: 'unit-123', name: 'SMA IT Cipansor' },
      userRoles: [
        {
          id: 'ur-1',
          isPrimary: true,
          role: { id: 'r-1', code: 'SUPER_ADMIN', name: 'Super Admin', realm: 'GLOBAL' }
        }
      ],
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    };

    await context.addCookies([
      {
        name: 'accessToken',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 3600,
        sameSite: 'Lax',
      }
    ]);

    await page.addInitScript(({ user }) => {
      window.localStorage.setItem('accessToken', 'mock-jwt-token');
      window.localStorage.setItem('refreshToken', 'mock-refresh-token');
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: user,
            isAuthenticated: true,
            isLoading: false
          },
          version: 0,
        })
      );
      // Force online to avoid banners
      Object.defineProperty(navigator, 'onLine', { get: () => true });
    }, { user: mockUser });

    // 2. Helpers
    const paginated = (data: any[]) => ({
      success: true,
      data,
      meta: {
        total: data.length,
        page: 1, limit: 20, totalPages: 1,
        pagination: { total: data.length, page: 1, limit: 20, totalPages: 1 }
      }
    });

    const apiResponse = (data: any) => ({
      success: true,
      data,
      message: 'Success'
    });

    const mockDate = "2024-01-01T00:00:00.000Z";
    const startDate = "2024-07-01T00:00:00.000Z";
    const endDate = "2025-06-30T23:59:59.000Z";

    const mockStudent = (id: string, name: string, nis: string) => ({
      id, name, nis, status: 'ACTIVE', gender: 'MALE',
      currentClass: { id: 'cls-1', name: 'X IPA 1', grade: 10 },
      class: { id: 'cls-1', name: 'X IPA 1', grade: 10 },
      unit: { id: 'unit-1', name: 'SMA IT' },
      user: { id: 'u-' + id, name },
      parentName: 'Budi Santoso',
      parentPhone: '08123456789',
      enrollmentDate: mockDate,
      createdAt: mockDate,
      updatedAt: mockDate
    });

    // 3. Global Mocks
    await page.route('**/api/**', async route => {
      const url = route.request().url();
      
      // DASHBOARD - NAKED (response.data)
      if (url.includes('/api/dashboard/stats')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          totalStudents: 1250, totalTeachers: 85, totalClasses: 32, totalUnits: 5,
          studentsGrowth: 5.2, attendanceRate: 98.5,
          activeAcademicYear: { id: 'ay-1', name: '2024/2025', startDate, endDate }
        }) });
      }
      if (url.includes('/api/dashboard/metrics')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          current: {
            students: { total: 1250, active: 1245, change: 5 },
            teachers: { total: 85 },
            attendance: { rate: 98.5, present: 1226, total: 1245 },
            tahfidz: { totalHafidz: 45, avgQuality: 88 }
          },
          recent: [],
          alerts: []
        }) });
      }
      if (url.includes('/api/dashboard/attendance')) {
        return route.fulfill({ status: 200, body: JSON.stringify([
          { date: "2024-01-01T00:00:00Z", present: 1200, absent: 10, sick: 15, excused: 20 },
          { date: "2024-01-02T00:00:00Z", present: 1210, absent: 5, sick: 10, excused: 20 },
          { date: "2024-01-03T00:00:00Z", present: 1205, absent: 8, sick: 12, excused: 20 },
          { date: "2024-01-04T00:00:00Z", present: 1215, absent: 4, sick: 11, excused: 15 },
          { date: "2024-01-05T00:00:00Z", present: 1220, absent: 3, sick: 12, excused: 10 },
          { date: "2024-01-06T00:00:00Z", present: 1225, absent: 2, sick: 10, excused: 8 },
          { date: "2024-01-07T00:00:00Z", present: 1230, absent: 1, sick: 9, excused: 5 }
        ]) });
      }
      if (url.includes('/api/dashboard/finance')) {
        return route.fulfill({ status: 200, body: JSON.stringify({ 
          totalBilled: 500000000, totalPaid: 350000000, totalUnpaid: 150000000,
          recentPayments: []
        }) });
      }

      // HEALTH - WRAPPED (response.data.data)
      if (url.includes('/api/health/summary')) {
        return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ 
          medications: { total: 45, lowStock: 12, expired: 2 },
          thisMonthRecords: 150,
          recordsByType: [
            { type: 'CHECKUP', count: 100 }, 
            { type: 'ILLNESS', count: 50 }
          ]
        })) });
      }
      if (url.includes('/api/health/records') || url.includes('/api/health')) {
        return route.fulfill({ status: 200, body: JSON.stringify(paginated([
          { 
            id: '1', visitDate: mockDate, recordedAt: mockDate, 
            student: mockStudent('1', 'Ahmad Fulan', '12345'), 
            type: 'CHECKUP', diagnosis: 'Sehat Wal Afiat', status: 'HEALTHY' 
          }
        ])) });
      }

      // OTHERS
      if (url.includes('/api/auth/me') || url.includes('/api/auth/profile')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse(mockUser)) });
      if (url.includes('/api/units')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: 'unit-1', name: 'SMA IT Cipansor' }])) });
      if (url.includes('/api/students')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([mockStudent('1', 'Ahmad Fulan', '12345')])) });
      if (url.includes('/api/attendance')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: '1', date: mockDate, status: 'PRESENT', student: mockStudent('1', 'Ahmad Fulan', '12345'), class: { name: 'X IPA 1' } }])) });
      if (url.includes('/api/classes')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: '1', name: 'X IPA 1', grade: 10 }])) });
      if (url.includes('/api/tahfidz/dashboard')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ totalRecords: 2500, totalStudents: 450 })) });
      if (url.includes('/api/tahfidz')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: '1', recordedAt: mockDate, student: { user: { name: 'Ahmad' } }, surahName: 'Al-Baqarah', activityType: 'ZIYADAH', grade: 'MUMTAZ' }])) });
      if (url.includes('/api/psb/stats')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ total: 85, enrolled: 35, accepted: 45, byStatus: { SUBMITTED: 15, REJECTED: 0 } })) });
      if (url.includes('/api/psb/registrations')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: '1', registrationNumber: 'REG/001', fullName: 'Calon Ahmad', status: 'SUBMITTED', createdAt: mockDate }])) });
      if (url.includes('/api/library/books')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: '1', title: 'Laskar Pelangi', category: 'FICTION' }])) });
      if (url.includes('/api/academic-years')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'ay-1', name: '2024/2025', isActive: true, startDate, endDate }])) });

      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
    });
  });

  const screenshotsDir = '../../docs/images';
  const pagesToScreenshot = [
    { name: 'dashboard', url: '/dashboard' },
    { name: 'login', url: '/login' },
    { name: 'students', url: '/students' },
    { name: 'tahfidz', url: '/tahfidz' },
    { name: 'finance', url: '/finance' },
    { name: 'attendance', url: '/attendance' },
    { name: 'classes', url: '/classes' },
    { name: 'assessment', url: '/assessment' },
    { name: 'library', url: '/library' },
    { name: 'health', url: '/health' },
    { name: 'settings', url: '/settings' },
    { name: 'psb', url: '/psb' },
  ];

  for (const pageInfo of pagesToScreenshot) {
    test(`screenshot ${pageInfo.name}`, async ({ page, context }) => {
      if (pageInfo.name === 'login') await context.clearCookies();
      await page.goto(pageInfo.url, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(10000);
      await page.addStyleTag({ content: `div[role="alert"], #sonner-toaster, .toaster { display: none !important; }` });
      await page.screenshot({ path: `${screenshotsDir}/${pageInfo.name}.png`, fullPage: true });
    });
  }
});
