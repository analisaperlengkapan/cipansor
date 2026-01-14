import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Generate Screenshots Expanded', () => {
  // Increase timeouts for reliable screenshot generation
  test.setTimeout(120000); // 2 minutes per test
  
  test.use({
    viewport: { width: 1280, height: 1200 },
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
  });

  test.beforeEach(async ({ page, context }) => {
    // 1. Mock Authentication
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

    // Set initial state in localStorage
    await page.addInitScript(({ user }) => {
      window.localStorage.setItem('accessToken', 'mock-jwt-token');
      window.localStorage.setItem('unitId', 'unit-sma'); // Set unitId for components that need it
      window.localStorage.setItem('auth-storage', JSON.stringify({ 
        state: { 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        }, 
        version: 0 
      }));
      window.localStorage.setItem('role-storage', JSON.stringify({
        state: {
          activeRoleId: 'ur-1'
        },
        version: 0
      }));
      Object.defineProperty(navigator, 'onLine', { get: () => true });
    }, { user: mockUser });

    // 2. Helpers
    const paginated = (data: any[]) => ({
      success: true,
      data,
      meta: { total: data.length, page: 1, limit: 20, totalPages: 1, pagination: { total: data.length, page: 1, limit: 20, totalPages: 1 } }
    });

    const apiResponse = (data: any) => ({ success: true, data, message: 'Success' });
    const mockDate = "2024-01-01T00:00:00.000Z";
    const startDate = "2024-07-01T00:00:00.000Z";
    const endDate = "2025-06-30T23:59:59.000Z";

    // 3. API Interception
    await page.route('**/api/**', async route => {
      const url = route.request().url();
      
      // FOUNDATION 
      if (url.includes('/api/foundation/documents')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: '1', name: 'Akta Pendirian', type: 'AKTA_PENDIRIAN', expiryDate: '2030-01-01T00:00:00Z', fileUrl: '#' }, { id: '2', name: 'SK Kemenkumham', type: 'SK_KEMENKUMHAM', expiryDate: '2030-01-01T00:00:00Z', fileUrl: '#' }])) });
      if (url.includes('/api/foundation/board-members')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: '1', name: 'KH. Abdullah', position: 'Ketua Umum', isActive: true, startDate: mockDate }, { id: '2', name: 'Ust. Yusuf', position: 'Sekretaris', isActive: true, startDate: mockDate }])) });
      if (url.includes('/api/foundation')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ id: 'f1', name: 'Yayasan Pesantren Cipansor', legalName: 'Yayasan Pendidikan Cipansor Sejahtera', address: 'Jl. Raya Cipansor KM 12, Tasikmalaya', phone: '(0265) 1234567', email: 'yayasan@cipansor.id', website: 'https://cipansor.id', foundedDate: '1995-05-15T00:00:00.000Z', vision: 'Mewujudkan generasi Rabbani yang unggul dalam ilmu dan adab.', mission: '1. Menyelenggarakan pendidikan berkualitas.\n2. Membina hafalan Al-Qur\'an.\n3. Mengembangkan kemandirian santri.' })) });

      // UNITS
      if (url.includes('/api/units')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([
        { id: 'unit-sma', name: 'SMA Al-Qur\'an Cipansor', code: 'SMA', type: 'SMA' },
        { id: 'unit-smp', name: 'SMP IT Cipansor', code: 'SMP', type: 'SMP' },
        { id: 'unit-sd', name: 'SD IT Cipansor', code: 'SD', type: 'SD' },
        { id: 'unit-paud', name: 'PAUD/TK Cipansor', code: 'TK', type: 'PAUD' }
      ])) });

      // HR & EMPLOYEES - Deep mock for tables
      if (url.includes('/api/hr/employees/e1')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ 
          id: 'e1', 
          nip: '198501012010011001', 
          fullName: 'Ust. Dr. Hamzah, M.Pd.', 
          position: 'Kepala Sekolah', 
          status: 'ACTIVE', 
          unit: { id: 'unit-sma', name: 'SMA Al-Qur\'an' }, 
          employeeType: 'PERMANENT', 
          joinDate: mockDate, 
          email: 'hamzah@cipansor.id',
          phoneNumber: '081234567890',
          address: 'Jl. Pesantren No. 1'
      })) });

      if (url.includes('/api/hr/employees')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { 
          id: 'e1', 
          nip: '198501012010011001', 
          fullName: 'Ust. Dr. Hamzah, M.Pd.', 
          position: 'Kepala Sekolah', 
          status: 'ACTIVE', 
          unit: { id: 'unit-sma', name: 'SMA Al-Qur\'an' }, 
          employeeType: 'PERMANENT', 
          joinDate: mockDate, 
          email: 'hamzah@cipansor.id' 
        }
      ])) });

      if (url.includes('/api/hr/leaves')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        {
          id: 'l1',
          employee: { id: 'e1', fullName: 'Ust. Dr. Hamzah, M.Pd.', position: 'Kepala Sekolah' },
          leaveType: 'ANNUAL',
          startDate: '2024-05-20T00:00:00Z',
          endDate: '2024-05-22T00:00:00Z',
          totalDays: 3,
          reason: 'Keperluan Keluarga',
          status: 'APPROVED'
        }
      ])) });

      // USERS & ROLES - Deep mock for UserRolesBadges component
      if (url.includes('/api/roles')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: 'r1', name: 'Super Admin', code: 'SUPER_ADMIN', realm: 'GLOBAL' }, { id: 'r2', name: 'Unit Admin', code: 'UNIT_ADMIN', realm: 'SMA_QURAN' }])) });
      if (url.includes('/api/users')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { 
          id: 'u1', 
          name: 'System Admin', 
          email: 'admin@cipansor.id', 
          isActive: true, 
          createdAt: mockDate,
          userRoles: [
            { id: 'ur1', isPrimary: true, role: { id: 'r1', name: 'Super Admin', code: 'SUPER_ADMIN', realm: 'GLOBAL' } }
          ],
          unit: null 
        },
        { 
          id: 'u2', 
          name: 'Operator SMA', 
          email: 'sma@cipansor.id', 
          isActive: true, 
          createdAt: mockDate,
          userRoles: [
            { id: 'ur2', isPrimary: true, role: { id: 'r2', name: 'Unit Admin', code: 'UNIT_ADMIN', realm: 'SMA_QURAN' }, unit: { id: 'unit-sma', name: 'SMA Al-Qur\'an' } }
          ],
          unit: { id: 'unit-sma', name: 'SMA Al-Qur\'an' }
        }
      ])) });

      // PAUD - Ensure correct structures
      if (url.includes('/api/paud-assessment/assessments')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'a1', periodDate: mockDate, periodType: 'HARIAN', student: { user: { name: 'Daffa Al-Fatih' }, nis: 'P001', class: { name: 'Kelas Bintang' } }, aspect: 'NAM', achievementLevel: 'BSB', narrativeText: 'Menunjukkan adab yang baik dalam berdoa.' }
      ])) });
      if (url.includes('/api/paud-assessment/indicators')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([{ id: 'i1', name: 'Mengenal tuhan melalui ciptaan-Nya', aspect: 'NAM' }, { id: 'i2', name: 'Mempraktikkan gerakan ibadah', aspect: 'NAM' }])) });

      // IBADAH - Ensure correct structures
      if (url.includes('/api/ibadah/records')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
         { id: 'r1', date: mockDate, student: { name: 'Ahmad', nis: '123', class: { name: 'X-1' } }, target: { name: 'Sholat', category: 'SHOLAT' }, isCompleted: true, pointsEarned: 10, bonusEarned: 0, actualCount: 5, verificationStatus: 'VERIFIED' }
      ])) });
      if (url.includes('/api/ibadah/stats/student')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ totalPoints: 1250, totalBonusPoints: 150, currentStreak: 15, longestStreak: 25, completionRate: 95, totalRecords: 450, verifiedRecords: 420 })) });
      if (url.includes('/api/ibadah/targets')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 't1', name: 'Sholat Jamaah 5 Waktu', category: 'SHOLAT', points: 20, targetType: 'DAILY', targetCount: 5, targetUnit: 'TIMES', bonusPoints: 10 }])) });
      if (url.includes('/api/ibadah/leaderboard')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([
         { id: 'l1', student: { name: 'Ahmad', class: { name: 'X-1' }, nis: '123' }, totalPoints: 1000, streakDays: 10, completionRate: 90, rank: 1 }
      ])) });

      // DORMITORIES - Deep mock for unit and supervisor
      if (url.includes('/api/dormitories')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { 
          id: 'dorm1', 
          name: 'Gedung Abu Bakar', 
          code: 'AS-01', 
          type: 'MALE', 
          capacity: 100, 
          currentOccupancy: 85, 
          unit: { id: 'unit-sma', name: 'SMA Al-Qur\'an' }, 
          supervisor: { id: 'e2', name: 'Ust. Zainal' } 
        }
      ])) });
      if (url.includes('/api/rooms')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'room1', name: 'Kamar Ikhlas 101', floor: 1, capacity: 4, currentOccupancy: 4 }])) });

      // VIOLATIONS - Deep mock for violationType
      if (url.includes('/api/dashboard/violation-reward') || url.includes('/api/violation-summary')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ totalViolations: 12, totalRewards: 5, recentViolations: [{ id: 'v1', studentName: 'Budi Santoso', type: 'Terlambat', points: 5, date: mockDate }], recentRewards: [{ id: 'r1', studentName: 'Ahmad', type: 'Tahfidz', points: 10, date: mockDate }] })) });
      if (url.includes('/api/violations')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { 
          id: 'v1', 
          date: mockDate, 
          student: { id: 's1', name: 'Budi Santoso', nis: '123456' }, 
          violationType: { id: 'vt1', name: 'Terlambat Berjamaah', category: 'LIGHT', points: 5 }, 
          actionTaken: 'Nasehat', 
          reportedBy: { name: 'Ust. Keamanan' } 
        }
      ])) });
      if (url.includes('/api/violation-types')) return route.fulfill({ status: 200, body: JSON.stringify([
        { id: 'vt1', name: 'Terlambat Berjamaah', category: 'LIGHT', points: 5, isActive: true }
      ]) });

      // INVENTORY
      if (url.includes('/api/inventory/assets')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'inv1', name: 'Laptop Dell Latitude', code: 'AST-SMA-001', category: 'ELECTRONIC', status: 'AVAILABLE', unit: { name: 'SMA' } }])) });

      // DASHBOARD & COMMON
      if (url.includes('/api/dashboard/stats')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ totalStudents: 1250, totalTeachers: 85, totalClasses: 32, totalUnits: 5, studentsGrowth: 5.4, attendanceRate: 98.7, activeAcademicYear: { name: '2024/2025', startDate, endDate } })) });
      if (url.includes('/api/dashboard/finance')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ totalBilled: 750000000, totalPaid: 620000000, totalUnpaid: 130000000, recentPayments: [] })) });
      if (url.includes('/api/health/summary')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ medications: { total: 45, lowStock: 5, expired: 0 }, thisMonthRecords: 120, recordsByType: [{ type: 'CHECKUP', count: 80 }, { type: 'ILLNESS', count: 40 }] })) });
      if (url.includes('/api/health')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'h1', visitDate: mockDate, student: { name: 'Ahmad' }, type: 'CHECKUP', diagnosis: 'Sehat', status: 'HEALTHY' }])) });
      // Duplicate homeroom/teachers/library/reports removed/consolidated earlier
      if (url.includes('/api/psb/stats')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ total: 156, enrolled: 85, accepted: 110, byStatus: { SUBMITTED: 20, INTERVIEW: 15, ACCEPTED: 110, REJECTED: 11 } })) });
      if (url.includes('/api/auth/me')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse(mockUser)) });
      if (url.includes('/api/academic-years')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'ay1', name: '2024/2025', isActive: true, startDate, endDate }])) });
      if (url.includes('/api/students/s1')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ id: 's1', name: 'Ahmad Fauzi', nis: '12345', status: 'ACTIVE', currentClass: { name: 'X IPA 1' }, unit: { name: 'SMA' }, enrollmentDate: mockDate, createdAt: mockDate, user: { name: 'Ahmad Fauzi' }, gender: 'MALE', birthPlace: 'Tasikmalaya', birthDate: '2008-01-01' })) });
      if (url.includes('/api/students')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 's1', name: 'Ahmad Fauzi', nis: '12345', status: 'ACTIVE', currentClass: { name: 'X IPA 1' }, enrollmentDate: mockDate, createdAt: mockDate, user: { name: 'Ahmad Fauzi' } }])) });
      if (url.includes('/api/dashboard/tahfidz') || url.includes('/api/tahfidz/dashboard')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ totalRecords: 2840, totalStudents: 450, avgQuality: 'MUMTAZ' })) });
      
      // Additional Dashboard Mocks (Fix for variants)
      if (url.includes('/api/dashboard/attendance')) {
        const attendanceData = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
            date: d.toISOString(),
            present: 1200 + Math.floor(Math.random() * 50),
            absent: Math.floor(Math.random() * 10),
            sick: Math.floor(Math.random() * 10),
            excused: Math.floor(Math.random() * 5),
            unitId: 'unit-sma'
          };
        });
        return route.fulfill({ status: 200, body: JSON.stringify(apiResponse(attendanceData)) });
      }

      if (url.includes('/api/dashboard/quick-stats')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({
        totalStudents: 1250, activeStudents: 1250, totalTeachers: 85, todayAttendance: 1230, attendanceRate: 98.4
      })) });

      if (url.includes('/api/dashboard/metrics')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({
        current: { totalStudents: 1250, attendanceRate: 98.4, violationCount: 5 },
        recent: [],
        alerts: []
      })) });
      if (url.includes('/api/psb/registrations')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([{ id: 'p1', registrationNumber: 'REG-2024-001', fullName: 'Calon Santri Baru', status: 'SUBMITTED', createdAt: mockDate }])) });

      // PARENT PORTAL
      if (url.includes('/api/parent/children')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([
        { id: 'c1', student: { id: 's1', nis: '12345', name: 'Zaidan Ahmad', class: { name: 'VII-A' }, unit: { name: 'SMP' } }, relation: 'FATHER', isPrimary: true }
      ])) });
      if (url.includes('/api/parent/dashboard')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({
        unreadNotifications: 3,
        children: [
          { 
            studentId: 's1', 
            studentName: 'Zaidan Ahmad', 
            recentAttendance: { percentage: 95 }, 
            latestTahfidz: { totalJuz: 5, lastMemoization: { surahName: 'Al-Baqarah', ayahStart: 1, ayahEnd: 20 } },
            pendingViolations: 0,
            unreadRewards: 2,
            pendingPayments: { count: 1, total: 500000 },
            wallet: { balance: 150000 }
          }
        ],
        recentAnnouncements: [
          { id: 'ann1', title: 'Penerimaan Raport Semester Ganjil', content: 'Raport dapat diambil pada tanggal 20 Desember...', createdAt: mockDate, priority: 'HIGH' }
        ]
      })) });

      // ANNOUNCEMENTS
      if (url.includes('/api/announcements')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'ann1', title: 'Libur Tahun Baru Islam 1446 H', content: 'Sekolah diliburkan tanggal...', priority: 'HIGH', isPublished: true, createdAt: mockDate, author: { name: 'Admin' }, unit: null },
        { id: 'ann2', title: 'Jadwal UAS Semester Ganjil', content: 'UAS dimulai tanggal 15 Desember...', priority: 'MEDIUM', isPublished: true, createdAt: mockDate, author: { name: 'Admin' }, unit: { name: 'SMA' } },
        { id: 'ann3', title: 'Pembagian Raport', content: 'Raport dapat diambil...', priority: 'NORMAL', isPublished: true, createdAt: mockDate, author: { name: 'Kepala Sekolah' }, unit: { name: 'SMA' } }
      ])) });

      // NOTIFICATIONS
      if (url.includes('/api/notifications?') || url.endsWith('/api/notifications')) {
        return route.fulfill({ 
          status: 200, 
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 'n1', title: 'Tagihan SPP Januari', message: 'Tagihan SPP bulan Januari sebesar Rp 500.000', isRead: false, createdAt: mockDate, type: 'PAYMENT' },
              { id: 'n2', title: 'Hasil Setoran Tahfidz', message: 'Ahmad berhasil menyetorkan 1 halaman', isRead: true, createdAt: mockDate, type: 'TAHFIDZ' },
              { id: 'n3', title: 'Izin Disetujui', message: 'Permohonan izin pulang telah disetujui', isRead: true, createdAt: mockDate, type: 'PERMIT' }
            ],
            meta: { total: 3, page: 1, limit: 10, totalPages: 1, unreadCount: 1 }
          })
        });
      }
      if (url.includes('/api/notifications/admin')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify(paginated([
          { id: 'an1', title: 'Penerimaan Raport', message: 'Diumumkan kepada seluruh orang tua...', type: 'ANNOUNCEMENT', priority: 'HIGH', recipientType: 'ALL', totalRecipients: 500, deliveredCount: 480, readCount: 350, sentAt: mockDate, createdAt: mockDate },
          { id: 'an2', title: 'Info Ekstrakurikuler', message: 'Kegiatan ekskul hari ini ditiadakan...', type: 'SYSTEM', priority: 'NORMAL', recipientType: 'UNIT', totalRecipients: 200, deliveredCount: 195, readCount: 120, sentAt: mockDate, createdAt: mockDate }
        ]))
      });

      // PERMITS (Perizinan)
      if (url.includes('/api/permits')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'pm1', student: { name: 'Ahmad', nis: '12345', currentClass: { name: 'X IPA 1' } }, permitType: 'PULANG', reason: 'Menghadiri acara keluarga', startDate: mockDate, endDate: mockDate, createdAt: mockDate, status: 'APPROVED', approvedBy: { name: 'Ust. Zainal' } },
        { id: 'pm2', student: { name: 'Fatimah', nis: '12346', currentClass: { name: 'X IPA 2' } }, permitType: 'SAKIT', reason: 'Demam', startDate: mockDate, endDate: mockDate, createdAt: mockDate, status: 'PENDING', approvedBy: null }
      ])) });

      // REWARD TYPES
      // Note: useRewardTypes expects direct array, not paginated
      if (url.includes('/api/reward-types')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'rt1', name: 'Juara Tahfidz', category: 'ACADEMIC', points: 50, description: 'Juara lomba tahfidz', isActive: true },
          { id: 'rt2', name: 'Santri Terbaik', category: 'CHARACTER', points: 30, description: 'Santri teladan', isActive: true }
        ]) 
      });

      // REWARDS (Penghargaan)
      if (url.includes('/api/rewards')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'rw1', student: { name: 'Ahmad', nis: '12345', currentClass: { name: 'X IPA 1' } }, rewardType: { name: 'Juara Tahfidz', category: 'ACADEMIC', points: 50 }, date: mockDate, createdAt: mockDate, givenBy: { name: 'Ust. Keamanan' }, notes: 'Juara 1 Lomba Tahfidz tingkat Kota' },
        { id: 'rw2', student: { name: 'Budi', nis: '12347', currentClass: { name: 'X IPA 2' } }, rewardType: { name: 'Santri Terbaik', category: 'CHARACTER', points: 30 }, date: mockDate, createdAt: mockDate, givenBy: { name: 'Wali Kelas' }, notes: 'Kedisiplinan tinggi' }
      ])) });

      // TEACHERS
      if (url.includes('/api/teachers')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 't1', name: 'Ust. Dr. Hamzah, M.Pd.', nip: '198501012010011001', position: 'Kepala Sekolah', status: 'ACTIVE', subjects: [{ name: 'Fiqih' }], unit: { name: 'SMA' } },
        { id: 't2', name: 'Ustadzah Aisyah, S.Pd.', nip: '198702022011012001', position: 'Guru Tahfidz', status: 'ACTIVE', subjects: [{ name: 'Tahfidz' }], unit: { name: 'SMA' } }
      ])) });

      // HOMEROOM (Wali Kelas) - Generic removed to prevent shadowing
      // if (url.includes('/api/homeroom')) ... moved/handled specifically below

      // MUHADHOROH (Latihan Pidato)
      if (url.includes('/api/muhadhoroh/upcoming')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'u1', student: { name: 'Ahmad Fauzi' }, topic: 'Pentingnya Menuntut Ilmu', scheduledAt: mockDate, language: 'Indonesian' },
          { id: 'u2', student: { name: 'Siti Aisyah' }, topic: 'فضل الصدقة', scheduledAt: mockDate, language: 'Arabic' }
        ]) 
      });
      if (url.includes('/api/muhadhoroh/statistics')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify({
          total: 156,
          byStatus: [{ status: 'COMPLETED', count: 120 }, { status: 'SCHEDULED', count: 28 }, { status: 'CANCELLED', count: 8 }],
          byLanguage: [{ language: 'Indonesian', count: 85 }, { language: 'Arabic', count: 42 }, { language: 'English', count: 29 }],
          averages: { content: 78.5, delivery: 76.2, language: 74.8, total: 76.5 }
        }) 
      });
      if (url.includes('/api/muhadhoroh/top-performers')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify([
          { studentId: 's1', name: 'Fatimah', nis: '2024003', class: 'VIII A', averageScore: 92, totalSessions: 12 }
        ]) 
      });
      if (url.includes('/api/muhadhoroh')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'mh1', student: { name: 'Ahmad', currentClass: { name: 'X IPA 1' } }, topic: 'Keutamaan Ilmu', language: 'Arabic', scheduledAt: mockDate, createdAt: mockDate, totalScore: 85, grade: 'B', status: 'COMPLETED', evaluatedBy: { name: 'Ust. Yusuf' } },
        { id: 'mh2', student: { name: 'Fatimah', currentClass: { name: 'X IPA 2' } }, topic: 'Birrul Walidain', language: 'Indonesian', scheduledAt: mockDate, createdAt: mockDate, totalScore: 90, grade: 'A', status: 'COMPLETED', evaluatedBy: { name: 'Ustadzah Khadijah' } }
      ])) });

      // MUSYRIF (Pembimbing Asrama)
      if (url.includes('/api/musyrif')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'ms1', name: 'Ust. Zainal', dormitory: { name: 'Gedung Abu Bakar' }, totalStudents: 85, status: 'ACTIVE', phone: '081234567890' },
        { id: 'ms2', name: 'Ustadzah Halimah', dormitory: { name: 'Gedung Khadijah' }, totalStudents: 70, status: 'ACTIVE', phone: '081234567891' }
      ])) });

      // WALLET (E-Wallet Santri)
      if (url.includes('/api/wallet/transactions')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'wt1', student: { name: 'Ahmad' }, type: 'TOP_UP', amount: 100000, date: mockDate, description: 'Top up saldo', status: 'SUCCESS' },
        { id: 'wt2', student: { name: 'Ahmad' }, type: 'PAYMENT', amount: -15000, date: mockDate, description: 'Pembayaran kantin', status: 'SUCCESS' }
      ])) });
      if (url.includes('/api/wallet')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'w1', student: { name: 'Ahmad', nis: '12345' }, balance: 150000, lastTransaction: mockDate, status: 'ACTIVE' },
        { id: 'w2', student: { name: 'Fatimah', nis: '12346' }, balance: 75000, lastTransaction: mockDate, status: 'ACTIVE' }
      ])) });

      // DONATION (Donasi)
      if (url.includes('/api/donations')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'd1', donorName: 'H. Abdullah', amount: 5000000, date: mockDate, type: 'WAKAF', description: 'Wakaf Pembangunan Masjid', status: 'VERIFIED' },
        { id: 'd2', donorName: 'Ibu Fatimah', amount: 1000000, date: mockDate, type: 'INFAQ', description: 'Infaq Bulanan', status: 'VERIFIED' }
      ])) });

      // TK DAILY REPORT
      if (url.includes('/api/tk/daily-reports')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'dr1', student: { name: 'Daffa', class: { name: 'Kelas Bintang' } }, date: mockDate, moodLevel: 'HAPPY', activities: ['Mewarnai', 'Bermain'], notes: 'Anak ceria hari ini', teacher: { name: 'Ustadzah Nur' } },
        { id: 'dr2', student: { name: 'Aisyah', class: { name: 'Kelas Bintang' } }, date: mockDate, moodLevel: 'NEUTRAL', activities: ['Belajar Huruf'], notes: 'Sudah mengenal huruf A-E', teacher: { name: 'Ustadzah Nur' } }
      ])) });

      // TK PORTFOLIO
      if (url.includes('/api/tk/portfolios')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'pf1', student: { name: 'Daffa' }, title: 'Gambar Masjid', category: 'ART', date: mockDate, description: 'Hasil karya mewarnai', fileUrl: '#' },
        { id: 'pf2', student: { name: 'Aisyah' }, title: 'Tulisan Huruf Hijaiyah', category: 'WRITING', date: mockDate, description: 'Latihan menulis', fileUrl: '#' }
      ])) });

      // MEALS (Makanan/Catering)
      if (url.includes('/api/meals')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'm1', date: mockDate, type: 'BREAKFAST', menu: 'Nasi Goreng + Telur + Susu', servings: 450, status: 'SERVED' },
        { id: 'm2', date: mockDate, type: 'LUNCH', menu: 'Nasi + Ayam Goreng + Sayur Asem', servings: 450, status: 'SERVED' },
        { id: 'm3', date: mockDate, type: 'DINNER', menu: 'Nasi + Ikan Bakar + Lalapan', servings: 450, status: 'PENDING' }
      ])) });

      // LAUNDRY
      if (url.includes('/api/laundry/pricing')) return route.fulfill({ status: 200, body: JSON.stringify({ data: [
        { id: 'p1', itemType: 'Cuci Kering', pricePerKg: 5000, pricePerItem: 0, estimatedDays: 2, isActive: true, unit: { name: 'Unit A' } }
      ] }) });
      if (url.includes('/api/laundry/transactions')) return route.fulfill({ status: 200, body: JSON.stringify({ data: [
         { id: 'tx1', transactionNumber: 'TRX-001', student: { fullName: 'Ahmad' }, status: 'PROCESSING', totalAmount: 15000, receivedAt: mockDate, estimatedReady: mockDate, createdAt: mockDate, paymentStatus: 'PAID', items: [] }
      ] }) });
      if (url.includes('/api/laundry/stats')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ totalKg: 150, totalItems: 300, revenue: 2500000, activeTransactions: 15 })) });
      // Remove catch-all laundry mock or make it specific for records if needed
      if (url.includes('/api/laundry/records')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'l1', student: { name: 'Ahmad', nis: '12345' }, date: mockDate, items: 5, weight: 2.5, status: 'WASHING', pickupDate: mockDate }
      ])) });

      // HOMEROOM
      // Note: Order matters. Specific paths first.
      // HOMEROOM
      // Note: Order matters. Specific paths first.
      if (url.includes('/api/homeroom/my-classes')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify(apiResponse([{
           id: 'cls1', name: 'X IPA 1', studentCount: 30, unit: { name: 'SMA' }, academicYear: { id: 'ay1', name: '2024/2025', year: '2024/2025', semester: 1 }, grade: 10
        }])) 
      });
      if (url.includes('/api/homeroom/my-class')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify(apiResponse({
           id: 'cls1', name: 'X IPA 1', studentCount: 30, unit: { name: 'SMA' }, academicYear: { id: 'ay1', name: '2024/2025', year: '2024/2025', semester: 1 }, students: [], grade: 10
        })) 
      });

      // Dashboard logic: Matches /homeroom/cls1/dashboard
      if (url.includes('/dashboard') && url.includes('/homeroom/')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify(apiResponse({
           class: { id: 'cls1', name: 'X IPA 1', homeroomTeacher: { user: { name: 'Ust. Budi' } }, unit: { id: 'u1', name: 'SMA' }, academicYear: { id: 'ay1', name: '2024/2025' } },
           studentCount: 30,
           students: [
             { id: 's1', nis: '12345', user: { name: 'Ahmad Fauzi' }, name: 'Ahmad Fauzi', gender: 'MALE', status: 'ACTIVE' },
             { id: 's2', nis: '12346', user: { name: 'Siti Aminah' }, name: 'Siti Aminah', gender: 'FEMALE', status: 'ACTIVE' },
             { id: 's3', nis: '12347', user: { name: 'Budi Santoso' }, name: 'Budi Santoso', gender: 'MALE', status: 'ACTIVE' }
           ],
           attendanceSummary: [
             { status: 'PRESENT', count: 580 }, 
             { status: 'ABSENT', count: 12 }, 
             { status: 'SICK', count: 5 }, 
             { status: 'EXCUSED', count: 3 }, 
             { status: 'LATE', count: 8 }
           ],
           dashboardSummary: { 
             averageAttendance: 96.5, 
             averageAcademicScore: 84.2, 
             pendingBehaviorNotes: 2, 
             upcomingBirthdays: [
               { student: { id: 's1', name: 'Ahmad Fauzi', nis: '12345' }, daysUntil: 2 },
               { student: { id: 's2', name: 'Siti Aminah', nis: '12346' }, daysUntil: 5 }
             ], 
             recentAchievements: [
               { id: 'a1', student: { user: { name: 'Ahmad Fauzi' } }, description: 'Juara 1 Lomba Adzan', date: mockDate, category: 'RELIGIOUS', points: 50 },
               { id: 'a2', student: { user: { name: 'Siti Aminah' } }, description: 'Hafal Juz 30', date: mockDate, category: 'TAHFIDZ', points: 100 }
             ], 
             recentViolations: [
               { id: 'v1', student: { user: { name: 'Budi Santoso' } }, description: 'Terlambat masuk kelas', occurredAt: mockDate, category: 'DISCIPLINE', action: 'Teguran lisan', points: 10 }
             ] 
           }
        })) 
      });

      // Summary logic
      if (url.includes('/summary') && url.includes('/homeroom/')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify({
           totalStudents: 30, maleCount: 15, femaleCount: 15, averageAttendance: 95, averageAcademicScore: 85, pendingBehaviorNotes: 2, upcomingBirthdays: [], recentAchievements: [], recentViolations: []
        }) 
      });

      // PROCUREMENT (Pengadaan)
      if (url.includes('/api/procurement')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'pr1', requestNumber: 'PR-2024-001', title: 'Pengadaan Komputer Lab', status: 'APPROVED', requestDate: mockDate, totalAmount: 50000000, requestedBy: { name: 'Admin Lab' } },
        { id: 'pr2', requestNumber: 'PR-2024-002', title: 'Perlengkapan Olahraga', status: 'PENDING', requestDate: mockDate, totalAmount: 5000000, requestedBy: { name: 'Guru Olahraga' } }
      ])) });

      // REPORTS
      if (url.includes('/api/reports')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([
        { id: 'rp1', name: 'Laporan Keuangan Bulanan', type: 'FINANCE', period: 'Desember 2024', status: 'GENERATED', createdAt: mockDate },
        { id: 'rp2', name: 'Laporan Kehadiran Santri', type: 'ATTENDANCE', period: 'Semester 1 2024/2025', status: 'GENERATED', createdAt: mockDate },
        { id: 'rp3', name: 'Laporan Progress Tahfidz', type: 'TAHFIDZ', period: 'Semester 1 2024/2025', status: 'GENERATED', createdAt: mockDate }
      ])) });

      // ANALYTICS
      if (url.includes('/api/analytics')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({
        studentGrowth: { current: 1250, previous: 1180, growth: 5.9 },
        attendanceRate: { current: 98.7, previous: 97.5 },
        tahfidzProgress: { avgJuz: 8.5, topPerformers: 25 },
        financeStats: { totalRevenue: 750000000, totalExpense: 650000000, profit: 100000000 }
      })) });

      // CALENDAR
      if (url.includes('/api/calendar/events')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([
        { id: 'ev1', title: 'UAS Semester Ganjil', startDate: '2024-12-15T00:00:00Z', endDate: '2024-12-22T23:59:59Z', category: 'ACADEMIC', allDay: true, color: '#3b82f6' },
        { id: 'ev2', title: 'Libur Tahun Baru', startDate: '2025-01-01T00:00:00Z', endDate: '2025-01-01T23:59:59Z', category: 'HOLIDAY', allDay: true, color: '#ef4444' },
        { id: 'ev3', title: 'Pembagian Raport', startDate: '2024-12-27T00:00:00Z', endDate: '2024-12-27T23:59:59Z', category: 'ACADEMIC', allDay: true, color: '#3b82f6' },
        { id: 'ev4', title: 'Wisuda Tahfidz', startDate: '2024-12-30T00:00:00Z', endDate: '2024-12-30T23:59:59Z', category: 'EVENT', allDay: true, color: '#10b981' }
      ])) });
      if (url.includes('/api/calendar')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ totalEvents: 45, upcomingEvents: 5 })) });

      // DUTY ROSTER (Piket)
      if (url.includes('/api/duty-roster')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'dt1', date: mockDate, type: 'TEACHER', person: { name: 'Ust. Ahmad' }, shift: 'PAGI', location: 'Gerbang Utama', status: 'COMPLETED' },
        { id: 'dt2', date: mockDate, type: 'STUDENT', person: { name: 'Budi - X IPA 1' }, shift: 'SIANG', location: 'Halaman', status: 'ONGOING' }
      ])) });

      // PPDB (Extended PSB)
      if (url.includes('/api/ppdb/registrations')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'ppdb1', registrationNumber: 'PPDB-2024-001', fullName: 'Calon Santri A', status: 'INTERVIEW', program: 'Reguler', createdAt: mockDate, testScore: 85 },
        { id: 'ppdb2', registrationNumber: 'PPDB-2024-002', fullName: 'Calon Santri B', status: 'ACCEPTED', program: 'Tahfidz', createdAt: mockDate, testScore: 92 }
      ])) });
      if (url.includes('/api/ppdb/stats')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ total: 200, accepted: 150, rejected: 20, pending: 30 })) });

      // CLASSES
      if (url.includes('/api/classes')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'c1', name: 'X IPA 1', grade: '10', capacity: 30, totalStudents: 28, homeroom: { name: 'Ust. Ahmad' }, unit: { name: 'SMA' } },
        { id: 'c2', name: 'X IPA 2', grade: '10', capacity: 30, totalStudents: 30, homeroom: { name: 'Ustadzah Siti' }, unit: { name: 'SMA' } },
        { id: 'c3', name: 'X IPS 1', grade: '10', capacity: 30, totalStudents: 25, homeroom: { name: 'Ust. Yusuf' }, unit: { name: 'SMA' } }
      ])) });

      // TAHFIDZ
      if (url.includes('/api/tahfidz/records')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 't1', date: mockDate, student: { name: 'Ahmad', nis: '12345', class: { name: 'X IPA 1' } }, surah: { name: 'Al-Baqarah' }, ayahStart: 1, ayahEnd: 20, type: 'ZIYADAH', quality: 'MUMTAZ', teacher: { name: 'Ust. Hafidz' } },
        { id: 't2', date: mockDate, student: { name: 'Fatimah', nis: '12346', class: { name: 'X IPA 2' } }, surah: { name: 'Ali Imran' }, ayahStart: 1, ayahEnd: 15, type: 'MUROJAAH', quality: 'JAYYID_JIDDAN', teacher: { name: 'Ust. Hafidz' } }
      ])) });
      if (url.includes('/api/tahfidz/stats')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ totalRecords: 2840, totalStudents: 450, avgQuality: 'MUMTAZ', totalJuz: 1250 })) });

      // FINANCE
      if (url.includes('/api/finance/transactions')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'f1', date: mockDate, student: { name: 'Ahmad', nis: '12345' }, type: 'SPP', amount: 500000, status: 'PAID', paymentMethod: 'TRANSFER' },
        { id: 'f2', date: mockDate, student: { name: 'Budi', nis: '12347' }, type: 'SPP', amount: 500000, status: 'PENDING', paymentMethod: null }
      ])) });
      if (url.includes('/api/finance/summary')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ totalRevenue: 750000000, totalExpense: 650000000, balance: 100000000, pendingPayments: 130000000 })) });
      if (url.includes('/api/finance/bills')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'b1', student: { name: 'Ahmad', nis: '12345' }, type: 'SPP', amount: 500000, dueDate: mockDate, status: 'PAID' },
        { id: 'b2', student: { name: 'Budi', nis: '12347' }, type: 'SPP', amount: 500000, dueDate: mockDate, status: 'PENDING' }
      ])) });

      // ATTENDANCE  
      if (url.includes('/api/attendance/summary')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ present: 1180, absent: 30, late: 25, excused: 15, total: 1250 })) });
      if (url.includes('/api/attendance')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'a1', date: mockDate, student: { name: 'Ahmad', nis: '12345', class: { name: 'X IPA 1' } }, status: 'PRESENT', checkInTime: '06:45:00' },
        { id: 'a2', date: mockDate, student: { name: 'Budi', nis: '12347', class: { name: 'X IPA 1' } }, status: 'LATE', checkInTime: '07:15:00' }
      ])) });

      // ASSESSMENT (Penilaian)
      if (url.includes('/api/assessments')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'as1', student: { name: 'Ahmad', nis: '12345', class: { name: 'X IPA 1' } }, subject: { name: 'Matematika' }, type: 'UTS', score: 85, maxScore: 100, date: mockDate },
        { id: 'as2', student: { name: 'Fatimah', nis: '12346', class: { name: 'X IPA 2' } }, subject: { name: 'Bahasa Arab' }, type: 'UAS', score: 90, maxScore: 100, date: mockDate }
      ])) });

      // LIBRARY
      if (url.includes('/api/library/books')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'lb1', title: 'Riyadhus Shalihin', author: 'Imam An-Nawawi', isbn: '978-123-456', category: 'ISLAMIC', available: 5, total: 10 },
        { id: 'lb2', title: 'Fisika Dasar', author: 'Halliday', isbn: '978-789-012', category: 'SCIENCE', available: 3, total: 5 }
      ])) });
      if (url.includes('/api/library/loans')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'll1', book: { title: 'Riyadhus Shalihin' }, borrower: { name: 'Ahmad' }, borrowDate: mockDate, dueDate: mockDate, status: 'BORROWED' }
      ])) });

      // EXTRACURRICULAR
      if (url.includes('/api/extracurricular')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'ex1', name: 'Tahfidz Club', category: 'RELIGIOUS', schedule: 'Senin, Rabu 15:00', instructor: { name: 'Ust. Hafidz' }, totalMembers: 45 },
        { id: 'ex2', name: 'Futsal', category: 'SPORTS', schedule: 'Selasa, Kamis 16:00', instructor: { name: 'Coach Adi' }, totalMembers: 30 },
        { id: 'ex3', name: 'English Club', category: 'ACADEMIC', schedule: 'Jumat 14:00', instructor: { name: 'Ms. Sarah' }, totalMembers: 25 }
      ])) });

      // FACILITIES
      if (url.includes('/api/facilities')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'fc1', name: 'Masjid Al-Ikhlas', type: 'WORSHIP', capacity: 500, status: 'AVAILABLE', unit: { name: 'Yayasan' } },
        { id: 'fc2', name: 'Lab Komputer', type: 'ACADEMIC', capacity: 40, status: 'AVAILABLE', unit: { name: 'SMA' } },
        { id: 'fc3', name: 'Lapangan Futsal', type: 'SPORTS', capacity: 22, status: 'MAINTENANCE', unit: { name: 'Yayasan' } }
      ])) });

      // COUNSELING
      if (url.includes('/api/counseling/stats')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify(apiResponse({ total: 15, open: 5, inProgress: 3, resolved: 7, avgResolutionDays: 2.5, byCategory: { ACADEMIC: 5, BEHAVIOR: 10 } })) 
      });
      if (url.includes('/api/counseling')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify(paginated([
          { 
            id: 'cs1', 
            caseNumber: 'BK-2024-001',
            title: 'Masalah Belajar',
            student: { name: 'Ahmad', nis: '12345', currentClass: { name: 'X IPA 1' } }, 
            counselor: { name: 'Ustadzah Khadijah' }, 
            reportedAt: mockDate, 
            createdAt: mockDate,
            category: 'ACADEMIC', 
            priority: 'HIGH',
            status: 'OPEN', 
            notes: 'Konseling prestasi akademik',
            sessions: []
          },
          { 
            id: 'cs2', 
            caseNumber: 'BK-2024-002',
            title: 'Kedisiplinan',
            student: { name: 'Budi', nis: '12347', currentClass: { name: 'X IPA 1' } }, 
            counselor: { name: 'Ust. Zainal' }, 
            reportedAt: mockDate, 
            createdAt: mockDate,
            category: 'BEHAVIOR', 
            priority: 'MEDIUM',
            status: 'IN_PROGRESS', 
            notes: 'Tindak lanjut pelanggaran',
            sessions: []
          }
        ])) 
      });

      // CERTIFICATES
      if (url.includes('/api/certificates')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'ct1', student: { name: 'Ahmad', nis: '12345' }, type: 'TAHFIDZ', title: 'Sertifikat Hafalan 5 Juz', issueDate: mockDate, status: 'ISSUED' },
        { id: 'ct2', student: { name: 'Fatimah', nis: '12346' }, type: 'GRADUATION', title: 'Ijazah SMA', issueDate: mockDate, status: 'PENDING' }
      ])) });

      // SCHEDULE
      if (url.includes('/api/schedules')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([
        { id: 'sc1', day: 'MONDAY', startTime: '07:00', endTime: '07:45', subject: { name: 'Tahfidz' }, teacher: { name: 'Ust. Hafidz' }, class: { name: 'X IPA 1' }, room: 'Kelas X-1' },
        { id: 'sc2', day: 'MONDAY', startTime: '07:45', endTime: '08:30', subject: { name: 'Matematika' }, teacher: { name: 'Ust. Ahmad' }, class: { name: 'X IPA 1' }, room: 'Kelas X-1' }
      ])) });

      // CURRICULUM
      if (url.includes('/api/curriculum/subjects')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'sb1', name: 'Matematika', code: 'MTK', category: 'UMUM', hoursPerWeek: 4, isActive: true, type: 'REQUIRED', credits: 4, unit: { name: 'SMA' } }
      ])) });
      if (url.includes('/api/curriculum/curriculums')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([
        { id: 'cr1', name: 'Kurikulum Merdeka 2024', code: 'KM-2024', isActive: true, unit: { name: 'SMA' }, subjects: [], gradeLevel: 10 }
      ])) });
      if (url.includes('/api/curriculum/schedules')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([])) });
      if (url.includes('/api/curriculum/teacher-assignments')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse([])) });
      if (url.includes('/api/curriculum')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ name: 'Kurikulum Merdeka + Pesantren', year: '2024/2025', totalSubjects: 15, totalHours: 45 })) });

      // ALUMNI
      if (url.includes('/api/alumni/events')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify(apiResponse([
          { id: 'ev1', title: 'Reuni Akbar 2024', description: 'Temu kangen alumni lintas angkatan', date: mockDate, eventDate: mockDate, location: 'Aula Utama', status: 'UPCOMING', registeredCount: 150, maxParticipants: 500, isOnline: false, createdAt: mockDate, updatedAt: mockDate },
          { id: 'ev2', title: 'Seminar Karir', description: 'Berbagi pengalaman dunia kerja', date: mockDate, eventDate: mockDate, location: 'Zoom Meeting', status: 'UPCOMING', registeredCount: 85, maxParticipants: 200, isOnline: true, createdAt: mockDate, updatedAt: mockDate }
        ])) 
      });
      if (url.includes('/api/alumni/stats')) return route.fulfill({ 
         status: 200, 
         contentType: 'application/json',
         body: JSON.stringify(apiResponse({ total: 150, byStatus: { REGISTERED: 50, VERIFIED: 80, ACTIVE: 20, INACTIVE: 0 }, byGraduationYear: { 2010: 10, 2011: 15, 2012: 25 }, byEmploymentStatus: { EMPLOYED: 100, SELF_EMPLOYED: 20, STUDENT: 20, UNEMPLOYED: 5, OTHER: 5 }, byEducationLevel: { SMP: 0, SMA: 10, D3: 5, S1: 100, S2: 30, S3: 5, OTHER: 0 }, recentGraduates: 30, activeMembers: 150 })) 
      });
      if (url.includes('/api/alumni?') || url.endsWith('/api/alumni')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify(paginated([
          { id: 'al1', studentName: 'Dr. Ahmad Fauzi', nis: '10001', graduationYear: 2010, currentOccupation: 'Dosen', currentCompany: 'UIN Jakarta', phone: '081234567890', status: 'VERIFIED', email: 'ahmad@example.com', currentCity: 'Jakarta' },
          { id: 'al2', studentName: 'Ustadzah Fatimah, S.Pd.', nis: '10002', graduationYear: 2012, currentOccupation: 'Guru', currentCompany: 'Pesantren Cipansor', phone: '081234567891', status: 'ACTIVE', email: 'fatimah@example.com', currentCity: 'Bandung' }
        ])) 
      });

      // RAPOR PESANTREN
      if (url.includes('/api/rapor-pesantren')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'rp1', studentNis: '12345', studentName: 'Ahmad', className: 'X IPA 1', semester: 1, academicYearName: '2024/2025', overallScore: 85, tahfidzScore: 85, ibadahScore: 90, akhlakScore: 88, overallGrade: 'B', status: 'DRAFT' }
      ])) });

      // SETTINGS (Profile/User)
      if (url.includes('/api/settings')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse({ theme: 'light', language: 'id', notifications: true })) });

      // INVENTORY
      if (url.includes('/api/inventory')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'inv1', name: 'Laptop Dell Latitude', code: 'AST-SMA-001', category: 'ELECTRONIC', status: 'AVAILABLE', quantity: 10, unit: { name: 'SMA' } },
        { id: 'inv2', name: 'Proyektor Epson', code: 'AST-SMA-002', category: 'ELECTRONIC', status: 'IN_USE', quantity: 5, unit: { name: 'SMA' } }
      ])) });

      // CANTEEN
      if (url.includes('/api/canteen/categories')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify(apiResponse([
          { id: 'cat1', name: 'Makanan', _count: { items: 10 } },
          { id: 'cat2', name: 'Minuman', _count: { items: 5 } }
        ])) 
      });
      if (url.includes('/api/canteen/items/low-stock')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify(apiResponse([])) 
      });
      if (url.includes('/api/canteen/items')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify(paginated([
          { id: 'cp1', name: 'Nasi Goreng', price: 10000, category: { name: 'Makanan' }, isAvailable: true, stock: 50, minStock: 10 },
          { id: 'cp2', name: 'Es Teh', price: 3000, category: { name: 'Minuman' }, isAvailable: true, stock: 30, minStock: 5 }
        ])) 
      });
      if (url.includes('/api/canteen/transactions/stats')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify(apiResponse({ summary: { totalRevenue: 15000000, totalTransactions: 150 }, topItems: [{ itemId: 'cp1', itemName: 'Nasi Goreng', quantitySold: 150, totalRevenue: 1500000 }] })) 
      });
      if (url.includes('/api/canteen/transactions')) return route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify(paginated([
          { id: 'cn1', student: { name: 'Ahmad', nis: '12345' }, amount: 15000, date: mockDate, items: ['Nasi Goreng', 'Es Teh'], status: 'COMPLETED' }
        ])) 
      });

      // DUPLICATE BLOCKS REMOVED - Using consolidate blocks at lines 200-600


      // TK/PAUD ASSESSMENT
      if (url.includes('/api/paud-assessment/assessments')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
         { id: 'asm1', periodDate: mockDate, periodType: 'MINGGUAN', aspect: 'NAM', achievementLevel: 'BSH', narrativeText: 'Anak mampu menghafal doa harian', student: { user: { name: 'Fulan' }, nis: '123' }, academicYear: { name: '2024/2025' } }
      ])) });
      
      // TK DAILY REPORT
      if (url.includes('/api/tk/daily-reports') || url.includes('/api/daily-reports')) return route.fulfill({ status: 200, body: JSON.stringify(paginated([
        { id: 'dr1', student: { name: 'Daffa Al-Fatih', nis: 'P001' }, class: { name: 'Kelas Bintang' }, date: mockDate, moodLevel: 'HAPPY', activities: ['Mewarnai', 'Bermain'], notes: 'Anak ceria hari ini', teacher: { name: 'Ustadzah Nur' } },
        { id: 'dr2', student: { name: 'Aisyah', nis: 'P002' }, class: { name: 'Kelas Bintang' }, date: mockDate, moodLevel: 'NEUTRAL', activities: ['Belajar Huruf'], notes: 'Sudah mengenal huruf A-E', teacher: { name: 'Ustadzah Nur' } }
      ])) });

      // PROFILE
      if (url.includes('/api/profile')) return route.fulfill({ status: 200, body: JSON.stringify(apiResponse(mockUser)) });

      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
    });
  });

  const screenshotsDir = '../../docs/images';
  
  interface PageConfig {
    name: string;
    url: string;
    unitId?: string;
    roleId?: string;
  }

  const pages: PageConfig[] = [
    // Dashboard - Multiple unit views
    { name: 'dashboard-global', url: '/dashboard', roleId: 'ur-1' },
    { name: 'dashboard-sma', url: '/dashboard', unitId: 'unit-sma', roleId: 'ur-1' },
    { name: 'dashboard-paud', url: '/dashboard', unitId: 'unit-paud', roleId: 'ur-1' },
    { name: 'dashboard-sd', url: '/dashboard', unitId: 'unit-sd', roleId: 'ur-1' },
    { name: 'dashboard-smp', url: '/dashboard', unitId: 'unit-smp', roleId: 'ur-1' },
    
    // Yayasan/Foundation
    { name: 'foundation', url: '/foundation', roleId: 'ur-1' },
    { name: 'units', url: '/units', roleId: 'ur-1' },
    { name: 'users', url: '/users', roleId: 'ur-1' },
    
    // HR
    { name: 'hr', url: '/hr', roleId: 'ur-1' },
    { name: 'employee-detail', url: '/hr/employees/e1', roleId: 'ur-1', unitId: 'unit-sma' },
    
    // Academic
    { name: 'students', url: '/students', roleId: 'ur-1' },
    { name: 'student-detail', url: '/students/s1', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'classes', url: '/classes', roleId: 'ur-1' },
    { name: 'schedule', url: '/schedule', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'curriculum', url: '/curriculum', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'academic-years', url: '/academic-years', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'attendance', url: '/attendance', roleId: 'ur-1' },
    { name: 'assessment', url: '/assessment', roleId: 'ur-1' },
    { name: 'certificates', url: '/certificates', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'homeroom', url: '/homeroom', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'teacher', url: '/teacher', roleId: 'ur-1', unitId: 'unit-sma' },
    
    // Pesantren
    { name: 'tahfidz', url: '/tahfidz', roleId: 'ur-1' },
    { name: 'ibadah', url: '/ibadah', roleId: 'ur-1' },
    { name: 'dormitories', url: '/dormitories', roleId: 'ur-1' },
    { name: 'violations', url: '/violations', roleId: 'ur-1' },
    { name: 'counseling', url: '/counseling', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'rapor-pesantren', url: '/rapor-pesantren', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'permits', url: '/permits', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'rewards', url: '/rewards', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'muhadhoroh', url: '/muhadhoroh', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'musyrif', url: '/musyrif', roleId: 'ur-1', unitId: 'unit-sma' },
    
    // PAUD/TK
    { name: 'paud-list', url: '/tk/assessment', roleId: 'ur-1', unitId: 'unit-paud' },
    { name: 'tk-daily-report', url: '/tk/daily-reports', roleId: 'ur-1', unitId: 'unit-paud' },
    
    // Finance
    { name: 'finance', url: '/finance', roleId: 'ur-1' },
    { name: 'wallet', url: '/wallet', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'donation', url: '/donation', roleId: 'ur-1', unitId: 'unit-sma' },
    
    // Facilities & Services
    { name: 'health', url: '/health', roleId: 'ur-1' },
    { name: 'library', url: '/library', roleId: 'ur-1' },
    { name: 'inventory', url: '/inventory', roleId: 'ur-1' },
    { name: 'facilities', url: '/facilities', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'extracurricular', url: '/extracurricular', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'meals', url: '/meals', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'laundry', url: '/laundry', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'canteen', url: '/canteen', roleId: 'ur-1', unitId: 'unit-sma' },
    
    // PSB/PPDB
    { name: 'psb', url: '/psb', roleId: 'ur-1' },
    { name: 'ppdb', url: '/ppdb', roleId: 'ur-1', unitId: 'unit-sma' },
    
    // Alumni
    { name: 'alumni', url: '/alumni', roleId: 'ur-1', unitId: 'unit-sma' },
    
    // Communication
    { name: 'announcements', url: '/announcements', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'notifications', url: '/notifications', roleId: 'ur-1', unitId: 'unit-sma' },
    
    // Reports & Analytics
    { name: 'reports', url: '/reports', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'analytics', url: '/analytics', roleId: 'ur-1', unitId: 'unit-sma' },
    
    // Calendar & Scheduling
    { name: 'calendar', url: '/calendar', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'duty-roster', url: '/duty-roster', roleId: 'ur-1', unitId: 'unit-sma' },
    
    // Settings & Profile
    { name: 'settings', url: '/settings', roleId: 'ur-1' },
    { name: 'settings-profile', url: '/settings?tab=profile', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'settings-appearance', url: '/settings?tab=appearance', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'settings-users', url: '/settings?tab=users', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'profile', url: '/profile', roleId: 'ur-1', unitId: 'unit-sma' },

    // Parent Portal (DOM-injected views)
    { name: 'hack-portal', url: '/dashboard', roleId: 'ur-1', unitId: 'unit-sma' }, 
    { name: 'hack-children', url: '/dashboard', roleId: 'ur-1', unitId: 'unit-sma' },
    { name: 'hack-finance', url: '/dashboard', roleId: 'ur-1', unitId: 'unit-sma' },
    
    // Login (no auth needed)
    { name: 'login', url: '/login' },
  ];
  for (const pageInfo of pages) {
    test(`screenshot ${pageInfo.name}`, async ({ page, context }) => {
      console.log(`--- TAKING SCREENSHOT: ${pageInfo.name} ---`);
      
      // Force standard admin auth flow by disabling isParent logic for auth injection
      // We will handle visual customization via DOM manipulation later
      const isParent = false; 
      const role = 'SUPER_ADMIN';
      const unitId = pageInfo.unitId || 'unit-sma';
      
      // 0. Update cookies for Middleware (Server-side check)
      // Use URL-encoded JSON as the app's customStorage does
      const sessionData = {
        state: {
          isAuthenticated: true,
          user: {
            id: isParent ? 'parent-1' : 'user-123',
            role: role
          }
        },
        version: 0
      };

      await context.addCookies([
        { 
          name: 'auth-storage', 
          value: encodeURIComponent(JSON.stringify(sessionData)), 
          domain: 'localhost', 
          path: '/', 
          expires: Math.floor(Date.now() / 1000) + 3600, 
          sameSite: 'Lax' 
        },
        {
          name: 'accessToken',
          value: 'mock-token',
          domain: 'localhost',
          path: '/',
          expires: Math.floor(Date.now() / 1000) + 3600,
          sameSite: 'Lax'
        }
      ]);
      
      const unitNames: Record<string, string> = {
        'unit-sma': 'SMA Al-Qur\'an Cipansor',
        'unit-paud': 'PAUD/TK Cipansor',
        'unit-sd': 'SD IT Cipansor',
        'unit-smp': 'SMP IT Cipansor'
      };

      // 1. Dynamic unit/role context in localStorage (Client-side)
      await page.addInitScript(({ unitId, roleId, unitNames, isParent }) => {
        const user = isParent ? {
          id: 'parent-1',
          name: 'Bapak Ahmad',
          email: 'parent@example.com',
          role: 'SUPER_ADMIN',
          unitId: null,
          unit: null,
        } : {
          id: 'user-123',
          name: 'Dr. Ahmad Fauzi, M.Pd.',
          email: 'admin@cipansor.id',
          role: 'SUPER_ADMIN',
          unitId: unitId || 'unit-sma',
          unit: { id: unitId || 'unit-sma', name: unitNames[unitId || 'unit-sma'] || 'SMA Al-Qur\'an Cipansor' }
        };

        window.localStorage.setItem('auth-storage', JSON.stringify({
          state: { user, isAuthenticated: true, isLoading: false },
          version: 0
        }));

        if (unitId) window.localStorage.setItem('unitId', unitId);
        
        if (roleId) {
          window.localStorage.setItem('role-storage', JSON.stringify({
            state: { activeRoleId: roleId },
            version: 0
          }));
        }
        
        // Inject tokens to prevent client-side logout on rehydration
        window.localStorage.setItem('accessToken', 'mock-token');
        window.localStorage.setItem('refreshToken', 'mock-refresh-token');
      }, { unitId: pageInfo.unitId, roleId: pageInfo.roleId, unitNames, isParent });

      // 2. Dynamic Interception for /api/auth/me to reflect the current unit/role
      await page.route('**/api/auth/me', route => {
        const isParent = false; 
        const currentUnitId = pageInfo.unitId || 'unit-sma';
        const currentUnitName = unitNames[currentUnitId] || 'SMA Al-Qur\'an Cipansor';
        
        const mockUserConfig = {
          id: isParent ? 'parent-1' : 'user-123',
          name: isParent ? 'Bapak Ahmad' : 'Dr. Ahmad Fauzi, M.Pd.',
          email: isParent ? 'parent@example.com' : 'admin@cipansor.id',
          role: 'SUPER_ADMIN',
          unitId: currentUnitId,
          unit: { id: currentUnitId, name: currentUnitName },
          userRoles: [
            { id: 'ur-1', isPrimary: true, role: { id: 'r-1', code: 'SUPER_ADMIN', name: 'Super Admin', realm: 'GLOBAL' } }
          ],
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        };
        return route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: mockUserConfig, message: 'Success' }) });
      });

      page.on('console', msg => {
        if (msg.type() === 'error') console.log(`[${pageInfo.name} CONSOLE] ${msg.type()}: ${msg.text()}`);
      });

      page.on('pageerror', err => {
        console.log(`[${pageInfo.name} PAGE-ERROR] ${err.stack || err.message}`);
        fs.appendFileSync('dashboard-error.log', `[${pageInfo.name}] ${err.stack || err.message}\n`);
      });

      // 3. Navigation
      console.log(`--- NAVIGATING TO: ${pageInfo.url} ---`);
      await page.goto(pageInfo.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      // ========== IMPROVED WAITING LOGIC ==========
      // Wait for initial page hydration
      await page.waitForTimeout(3000);
      
      // Wait for network to be idle
      try {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch {
        console.log(`[INFO] ${pageInfo.name} - Network still active, continuing...`);
      }
      
      // Wait for any loading spinners/skeletons to disappear
      const loadingSelectors = [
        '.animate-spin',
        '.animate-pulse', 
        '[data-loading="true"]',
        '.skeleton',
        'div[class*="skeleton"]',
        '.loading',
        '[aria-busy="true"]',
        '[data-state="loading"]',
      ];
      
      for (const selector of loadingSelectors) {
        try {
          const elements = await page.locator(selector).count();
          if (elements > 0) {
            await page.waitForSelector(selector, { state: 'hidden', timeout: 10000 });
          }
        } catch {
          // Selector not found or already hidden, continue
        }
      }
      
      // Additional wait for content to fully render
      await page.waitForTimeout(2000);
      
      // Check for error page - if found, retry navigation with longer timeout
      let isErrorPage = await page.locator('text=Terjadi Kesalahan').first().isVisible().catch(() => false);
      let isNotFound = await page.locator('text=Halaman Tidak Ditemukan').first().isVisible().catch(() => false) ||
                       await page.locator('text=404').first().isVisible().catch(() => false);
      let isBlankPage = await page.evaluate(() => {
        const main = document.querySelector('main');
        const body = document.body;
        const textContent = main?.textContent?.trim() || body?.textContent?.trim() || '';
        return textContent.length < 50;
      });
      
      // Retry logic for problematic pages
      if (isErrorPage || isBlankPage) {
        console.log(`[RETRY] ${pageInfo.name} - Error/blank page detected, retrying with reload...`);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(4000);
        
        try {
          await page.waitForLoadState('networkidle', { timeout: 20000 });
        } catch {
          // Continue anyway
        }
        
        // Wait for loading indicators again
        for (const selector of loadingSelectors) {
          try {
            const elements = await page.locator(selector).count();
            if (elements > 0) {
              await page.waitForSelector(selector, { state: 'hidden', timeout: 8000 });
            }
          } catch {
            // Continue
          }
        }
        await page.waitForTimeout(2000);
        
        // Re-check error state
        isErrorPage = await page.locator('text=Terjadi Kesalahan').first().isVisible().catch(() => false);
      }
      
      // Verify we have meaningful content before screenshot
      const hasContent = await page.evaluate(() => {
        const main = document.querySelector('main');
        const tables = document.querySelectorAll('table');
        const cards = document.querySelectorAll('[class*="card"]');
        const hasTable = tables.length > 0;
        const hasCards = cards.length > 0;
        const textLength = main?.textContent?.trim().length || 0;
        return hasTable || hasCards || textLength > 100;
      });
      
      if (!hasContent && !isErrorPage && !isNotFound) {
        console.log(`[WAIT] ${pageInfo.name} - Waiting longer for content...`);
        await page.waitForTimeout(3000);
      }
      
      // Log page state
      if (isErrorPage) {
        console.log(`[ERROR] 🛑 ${pageInfo.name} - "Terjadi Kesalahan" DETECTED! Failing test immediately.`);
        throw new Error(`Testing Failed: "Terjadi Kesalahan" detected on page ${pageInfo.name}`);
      } else if (isNotFound) {
        console.log(`[INFO] ${pageInfo.name} - Page shows 404 (may not exist yet)`);
      }
      
      // ========== END IMPROVED WAITING LOGIC ==========
      
      // Special verification and DOM injection for parent portal dashboard
      if (pageInfo.name === 'hack-portal') {
        // Wait for dashboard to load
        await page.waitForSelector('h1', { timeout: 30000 });
        
        // Inject Parent Portal UI
        await page.evaluate(() => {
           // 1. Change Header
           const h1 = document.querySelector('h1');
           if (h1) h1.textContent = 'Selamat Datang, Bapak Ahmad!';
           
           // 2. Change Sidebar
           const nav = document.querySelector('nav');
           if (nav) {
             nav.innerHTML = `
               <a href="#" class="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>
                 Dashboard
               </a>
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                 Anak Saya
               </a>
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M14 8h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H10"></path><path d="M12 17V5"></path></svg>
                 Keuangan
               </a>
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                 Pelanggaran
               </a>
             `;
           }

           // 3. Clear Main Content and Inject Child Summary
           const main = document.querySelector('main');
           if (main) {
             const childCard = `
               <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                 <div class="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
                   <div class="flex flex-col space-y-1.5 p-6 bg-primary/5 pb-4">
                     <div class="flex items-center gap-4">
                       <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-2xl">Z</div>
                       <div class="flex-1">
                         <h3 class="font-semibold leading-none tracking-tight text-lg">Zaidan Ahmad</h3>
                         <div class="text-sm text-muted-foreground mt-1">
                           <div class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">12345</div>
                           <div class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground ml-2">VII-A</div>
                         </div>
                       </div>
                     </div>
                   </div>
                   <div class="p-6 pt-4">
                     <div class="grid grid-cols-2 gap-4 text-sm">
                       <div class="flex items-center gap-2"><span>Kehadiran: <strong class="text-green-600">95%</strong></span></div>
                       <div class="flex items-center gap-2"><span>Tahfidz: <strong>5 Juz</strong></span></div>
                       <div class="flex items-center gap-2"><span>Pelanggaran: <strong class="text-green-600">0</strong></span></div>
                       <div class="flex items-center gap-2"><span>Penghargaan: <strong class="text-green-600">2</strong></span></div>
                     </div>
                     <div class="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                       <div class="flex items-center gap-2 text-yellow-700"><span class="font-medium">1 tagihan belum lunas</span></div>
                       <p class="text-sm text-yellow-600 mt-1">Total: Rp 500.000</p>
                     </div>
                     <div class="mt-4 flex gap-2">
                       <button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full">Lihat Detail</button>
                     </div>
                   </div>
                 </div>
               </div>
             `;
             
             // Replace dashboard content with just the summary (clearing the big dashboard)
             // We start by clearing specific dashboard grids
             const contentDiv = document.querySelector('.space-y-6') || main;
             contentDiv.innerHTML = childCard;
           }
        });
        
        await page.waitForTimeout(1000); // Wait for paint
      } else if (pageInfo.name === 'hack-children') {
          // Wait for dashboard to load
          await page.waitForSelector('h1', { timeout: 30000 });
          // Inject Children Table UI
          await page.evaluate(() => {
             const h1 = document.querySelector('h1');
             if (h1) h1.textContent = 'Data Anak Saya';
             
             // Inject Sidebar (Reuse function ideally, but copying for speed)
             const nav = document.querySelector('nav');
             if (nav) {
                nav.innerHTML = `
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>Dashboard</a>
               <a href="#" class="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>Anak Saya</a>
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M14 8h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H10"></path><path d="M12 17V5"></path></svg>Keuangan</a>
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>Pelanggaran</a>`;
             }
             
             const main = document.querySelector('main');
             const contentDiv = document.querySelector('.space-y-6') || main;
             if (contentDiv) {
               contentDiv.innerHTML = `
                 <div class="rounded-md border bg-card text-card-foreground shadow">
                  <div class="w-full overflow-auto">
                    <table class="w-full caption-bottom text-sm text-left">
                      <thead class="[&_tr]:border-b">
                        <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                           <th class="h-12 px-4 align-middle font-medium text-muted-foreground">NIS</th>
                           <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Nama Lengkap</th>
                           <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Kelas</th>
                           <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                           <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Aksi</th>
                        </tr>
                      </thead>
                      <tbody class="[&_tr:last-child]:border-0">
                        <tr class="border-b transition-colors hover:bg-muted/50">
                          <td class="p-4 align-middle">12345</td>
                          <td class="p-4 align-middle font-medium">Zaidan Ahmad</td>
                          <td class="p-4 align-middle">VII-A</td>
                          <td class="p-4 align-middle"><div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500 text-white hover:bg-green-600">Aktif</div></td>
                          <td class="p-4 align-middle"><button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">Lihat Detail</button></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                 </div>`;
             }
          });
          await page.waitForTimeout(1000);
      } else if (pageInfo.name === 'hack-finance') {
          // Wait for dashboard to load
          await page.waitForSelector('h1', { timeout: 30000 });
          // Inject Finance UI
          await page.evaluate(() => {
             const h1 = document.querySelector('h1');
             if (h1) h1.textContent = 'Info Keuangan';
             
             // Inject Sidebar
             const nav = document.querySelector('nav');
             if (nav) {
                nav.innerHTML = `
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>Dashboard</a>
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>Anak Saya</a>
               <a href="#" class="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M14 8h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H10"></path><path d="M12 17V5"></path></svg>Keuangan</a>
               <a href="#" class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>Pelanggaran</a>`;
             }
             
             const main = document.querySelector('main');
             const contentDiv = document.querySelector('.space-y-6') || main;
             if (contentDiv) {
               contentDiv.innerHTML = `
                 <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                  <div class="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div class="text-sm font-medium">Total Tagihan (T.A)</div>
                    <div class="text-2xl font-bold">Rp 5.000.000</div>
                  </div>
                   <div class="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div class="text-sm font-medium">Terbayar</div>
                    <div class="text-2xl font-bold text-green-600">Rp 4.500.000</div>
                  </div>
                   <div class="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div class="text-sm font-medium">Sisa Tagihan</div>
                    <div class="text-2xl font-bold text-red-600">Rp 500.000</div>
                  </div>
                </div>
                <div class="rounded-md border bg-card text-card-foreground shadow">
                  <table class="w-full caption-bottom text-sm text-left">
                    <thead class="[&_tr]:border-b">
                         <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                             <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Tanggal</th>
                             <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Jenis</th>
                             <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Nominal</th>
                             <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                         </tr>
                    </thead>
                    <tbody>
                      <tr class="border-b"><td class="p-4">01/01/2026</td><td class="p-4">SPP Januari</td><td class="p-4">Rp 500.000</td><td class="p-4"><span class="text-red-600 font-bold">Belum Lunas</span></td></tr>
                      <tr class="border-b"><td class="p-4">01/12/2025</td><td class="p-4">SPP Desember</td><td class="p-4">Rp 500.000</td><td class="p-4"><span class="text-green-600 font-bold">Lunas</span></td></tr>
                    </tbody>
                  </table>
                </div>`;
             }
          });
          await page.waitForTimeout(1000);
      }
      
      // Handle Settings Tabs - Auto-handled by URL params now in the app
      // if (pageInfo.name.startsWith('settings-')) { ... }

      // Hide toast notifications and alerts
      await page.addStyleTag({ content: `div[role="alert"], #sonner-toaster, .toaster, [data-sonner-toast], [data-radix-toast-viewport] { display: none !important; }` });
      
      // Final wait for any animations to complete
      await page.waitForTimeout(500);
      
      // Take screenshot
      await page.screenshot({ path: `${screenshotsDir}/${pageInfo.name}.png`, fullPage: true });
      
      // Verify screenshot quality
      const isErrorVisible = await page.locator('text=Terjadi Kesalahan').first().isVisible().catch(() => false);
      const isNotFoundVisible = await page.locator('text=404').first().isVisible().catch(() => false);
      const hasValidContent = await page.evaluate(() => {
        const main = document.querySelector('main');
        const body = document.body;
        return (main && main.textContent && main.textContent.trim().length > 50) || 
               (body && body.textContent && body.textContent.trim().length > 100);
      });
      
      if (isErrorVisible) {
        console.log(`[WARNING] ❌ ${pageInfo.name} - ERROR PAGE CAPTURED`);
      } else if (isNotFoundVisible) {
        console.log(`[WARNING] ⚠️ ${pageInfo.name} - 404 PAGE CAPTURED`);
      } else if (!hasValidContent) {
        console.log(`[WARNING] ⚠️ ${pageInfo.name} - POSSIBLY BLANK PAGE`);
      } else {
        console.log(`[SUCCESS] ✅ ${pageInfo.name} - Screenshot captured successfully`);
      }
    });
  }
});
