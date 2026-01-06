import { test, expect } from '@playwright/test';

test.describe('Debug Crashes', () => {
    test.use({ 
        viewport: { width: 1280, height: 1200 },
        locale: 'id-ID',
        timezoneId: 'Asia/Jakarta',
    });

    const pages = [
        { name: 'users', url: '/users' },
        { name: 'hr', url: '/hr' },
        { name: 'paud', url: '/paud/assessment' },
        { name: 'ibadah', url: '/ibadah' },
        { name: 'dormitories', url: '/dormitories' },
        { name: 'violations', url: '/violations' },
    ];

    test.beforeEach(async ({ page, context }) => {
        const mockUser = {
            id: 'user-123',
            name: 'Dr. Ahmad Fauzi, M.Pd.',
            email: 'admin@cipansor.id',
            role: 'SUPER_ADMIN',
            unitId: 'unit-sma',
            unit: { id: 'unit-sma', name: 'SMA Al-Qur\'an Cipansor' },
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
            { name: 'accessToken', value: 'mock-jwt-token', domain: 'localhost', path: '/', expires: Math.floor(Date.now() / 1000) + 3600, sameSite: 'Lax' }
        ]);

        await page.addInitScript(({ user }) => {
            window.localStorage.setItem('accessToken', 'mock-jwt-token');
            window.localStorage.setItem('auth-storage', JSON.stringify({ state: { user, isAuthenticated: true, isLoading: false }, version: 0 }));
            Object.defineProperty(navigator, 'onLine', { get: () => true });
        }, { user: mockUser });

        const paginated = (data: any[]) => ({
            success: true,
            data,
            meta: { total: data.length, page: 1, limit: 20, totalPages: 1, pagination: { total: data.length, page: 1, limit: 20, totalPages: 1 } }
        });

        const apiResponse = (data: any) => ({ success: true, data, message: 'Success' });
        const mockDate = "2024-01-01T00:00:00.000Z";
        const startDate = "2024-07-01T00:00:00.000Z";
        const endDate = "2025-06-30T23:59:59.000Z";

        await page.route('**/api/**', async route => {
            const url = route.request().url();
            
            if (url.includes('/api/foundation/documents')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: '1', name: 'Akta Pendirian', type: 'AKTA_PENDIRIAN', expiryDate: '2030-01-01T00:00:00Z', fileUrl: '#' }])) });
            if (url.includes('/api/foundation/board-members')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: '1', name: 'KH. Abdullah', position: 'Ketua Umum', isActive: true, startDate: mockDate }])) });
            if (url.includes('/api/foundation')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ id: 'f1', name: 'Yayasan Pesantren Cipansor' })) });

            if (url.includes('/api/units')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([
                { id: 'unit-sma', name: 'SMA Al-Qur\'an Cipansor', code: 'SMA', type: 'SMA' },
                { id: 'unit-paud', name: 'PAUD/TK Cipansor', code: 'TK', type: 'PAUD' }
            ])) });

            if (url.includes('/api/hr/employees')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
                { id: 'e1', nip: '123', fullName: 'Ust. Hamzah', status: 'ACTIVE', unit: { name: 'SMA' }, employeeType: 'PERMANENT', joinDate: mockDate }
            ])) });
            if (url.includes('/api/hr/departments')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: 'd1', name: 'Kurikulum' }])) });
            if (url.includes('/api/hr/leaves')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'l1', employee: { fullName: 'Ust. Hamzah' }, leaveType: 'ANNUAL', startDate: mockDate, endDate: mockDate, status: 'APPROVED' }])) });

            if (url.includes('/api/roles')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: 'r1', name: 'Super Admin', code: 'SUPER_ADMIN', realm: 'GLOBAL' }])) });
            if (url.includes('/api/users')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
                { id: 'u1', name: 'System Admin', email: 'admin@cipansor.id', isActive: true, createdAt: mockDate, userRoles: [{ role: { name: 'Super Admin' } }] }
            ])) });

            if (url.includes('/api/paud-assessment/assessments')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
                { id: 'a1', periodDate: mockDate, periodType: 'HARIAN', student: { user: { name: 'Daffa' } }, aspect: 'NAM', achievementLevel: 'BSB' }
            ])) });
            if (url.includes('/api/paud-assessment/indicators')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: 'i1', name: 'Indikator 1', aspect: 'NAM' }])) });

            if (url.includes('/api/ibadah/records')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
                { id: 'r1', date: mockDate, student: { name: 'Ahmad' }, target: { name: 'Sholat' }, isCompleted: true, pointsEarned: 10, verificationStatus: 'VERIFIED' }
            ])) });
            if (url.includes('/api/ibadah/stats/student')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ totalPoints: 100 })) });
            if (url.includes('/api/ibadah/targets')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 't1', name: 'Sholat', category: 'SHOLAT', points: 20, targetType: 'DAILY', targetCount: 5 }])) });
            if (url.includes('/api/ibadah/leaderboard')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: 'l1', student: { name: 'Ahmad' }, totalPoints: 1000, rank: 1 }])) });

            if (url.includes('/api/dormitories')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
                { id: 'dorm1', name: 'Gedung Abu Bakar', code: 'AS-01', type: 'MALE', capacity: 100, currentOccupancy: 85, unit: { name: 'SMA' }, supervisor: { name: 'Ust. Zainal' } }
            ])) });
            if (url.includes('/api/rooms')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'room1', name: 'Kamar 101', capacity: 4, currentOccupancy: 4 }])) });

            if (url.includes('/api/violations/summary')) return route.fulfill({ status: 200, body: JSON.stringify({ totalViolations: 12, byCategory: [{ category: 'LIGHT', count: 10 }] }) });
            if (url.includes('/api/violations')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
                { id: 'v1', date: mockDate, student: { name: 'Budi' }, violationType: { name: 'Terlambat', category: 'LIGHT', points: 5 } }
            ])) });
            if (url.includes('/api/violations/types')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: 'vt1', name: 'Terlambat', category: 'LIGHT', points: 5, isActive: true }])) });

            if (url.includes('/api/auth/me')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse(mockUser)) });
            if (url.includes('/api/academic-years')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'ay1', name: '2024/2025', isActive: true, startDate, endDate }])) });
            if (url.includes('/api/classes')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'c1', name: 'X-1' }])) });

            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
        });
    });

    for (const pageInfo of pages) {
        test(`debug crash ${pageInfo.name}`, async ({ page }) => {
            console.log(`\n--- DEBUGGING PAGE: ${pageInfo.name} ---`);
            
            page.on('console', msg => {
                console.log(`[${pageInfo.name} CONSOLE] ${msg.type()}: ${msg.text()}`);
            });

            page.on('pageerror', err => {
                console.log(`[${pageInfo.name} PAGE-ERROR] ${err.stack || err.message}`);
            });

            await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(5000);

            const isErrorVisible = await page.getByText('Terjadi Kesalahan').isVisible();
            if (isErrorVisible) {
                console.log(`[RESULT] ${pageInfo.name} REDUCED TO CRASH SCREEN`);
            } else {
                console.log(`[RESULT] ${pageInfo.name} RENDERED NORMALLY`);
            }
        });
    }
});
