import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  BookMarked,
  Home,
  FileText,
  AlertTriangle,
  Award,
  Wallet,
  UserPlus,
  Clock,
  Library,
  Heart,
  Package,
  Bell,
  BarChart3,
  School,
  Settings,
  FileSpreadsheet,
  Baby,
  Receipt,
  Megaphone,
  Target,
  Shield,
  UserCog,
  UtensilsCrossed,
  IdCard,
  CalendarDays,
  Send,
  ScrollText,
  Drama,
  HeartHandshake,
  BookCheck,
  ClipboardList,
  MessageSquare,
  Languages,
  Sparkles,
  WashingMachine,
  ShoppingCart,
  CreditCard,
  ClipboardPenLine,
  FolderOpen,
  FileBarChart,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];     // Legacy role support
  roleCodes?: string[]; // New RoleCode-based permissions
  realms?: string[];    // Realm-based filtering
  children?: NavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// Role codes by category for navigation permissions
const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'YAYASAN_ADMIN', 'YAYASAN_KETUA',
  'TKQ_ADMIN', 'TKQ_KEPALA_SEKOLAH',
  'SDIT_ADMIN', 'SDIT_KEPALA_SEKOLAH',
  'SMPIT_ADMIN', 'SMPIT_KEPALA_SEKOLAH',
  'SMAQ_ADMIN', 'SMAQ_KEPALA_SEKOLAH',
];

const TEACHER_ROLES = [
  'TKQ_GURU', 'SDIT_GURU', 'SMPIT_GURU', 'SMAQ_GURU',
];

const STAFF_ROLES = [
  'TKQ_TATA_USAHA', 'SDIT_TATA_USAHA', 'SMPIT_TATA_USAHA', 'SMAQ_TATA_USAHA',
];

const STUDENT_ROLES = [
  'TKQ_SISWA', 'SDIT_SISWA', 'SMPIT_SISWA', 'SMAQ_SISWA',
];

const PARENT_ROLES = [
  'TKQ_ORANG_TUA', 'SDIT_ORANG_TUA', 'SMPIT_ORANG_TUA', 'SMAQ_ORANG_TUA',
];

const YAYASAN_ROLES = [
  'YAYASAN_ADMIN', 'YAYASAN_PEMBINA', 'YAYASAN_KETUA', 
  'YAYASAN_SEKRETARIS', 'YAYASAN_BENDAHARA', 'YAYASAN_ANGGOTA', 'YAYASAN_PENGAWAS',
];

const PESANTREN_ROLES = [
  'MUSYRIF', 'MUHAFIDZ', 'MURABBI', 'WALI_KAMAR',
];

// Teacher-specific navigation
const teacherNavigation: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/teacher',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Mengajar',
    items: [
      {
        title: 'Tahfidz',
        href: '/tahfidz',
        icon: BookMarked,
      },
      {
        title: 'Kelas Saya',
        href: '/classes',
        icon: BookOpen,
      },
      {
        title: 'Siswa',
        href: '/students',
        icon: GraduationCap,
      },
      {
        title: 'Absensi',
        href: '/attendance',
        icon: ClipboardCheck,
      },
      {
        title: 'Portfolio Siswa',
        href: '/portfolio',
        icon: FolderOpen,
      },
    ],
  },
  {
    title: 'Wali Kelas',
    items: [
      {
        title: 'Dashboard Wali Kelas',
        href: '/homeroom',
        icon: Home,
      },
      {
        title: 'Absensi Harian',
        href: '/homeroom/attendance',
        icon: ClipboardCheck,
      },
      {
        title: 'Catatan Perilaku',
        href: '/homeroom/behavior',
        icon: ClipboardList,
      },
      {
        title: 'Pesan Orang Tua',
        href: '/homeroom/messages',
        icon: Send,
      },
    ],
  },
  {
    title: 'Pesantren',
    items: [
      {
        title: 'Jurnal Ibadah',
        href: '/ibadah',
        icon: Sparkles,
      },
      {
        title: 'Muhadhoroh',
        href: '/muhadhoroh',
        icon: MessageSquare,
      },
      {
        title: 'Muhadatsah',
        href: '/muhadatsah',
        icon: Languages,
      },
      {
        title: 'Kitab Kuning',
        href: '/kitab-progress',
        icon: BookOpen,
      },
    ],
  },
  {
    title: 'PKG',
    items: [
      {
        title: 'Penilaian Kinerja',
        href: '/pkg',
        icon: ClipboardPenLine,
      },
    ],
  },
  {
    title: 'Informasi',
    items: [
      {
        title: 'Pengumuman',
        href: '/announcements',
        icon: Bell,
      },
    ],
  },
];

// Staff-specific navigation
const staffNavigation: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/staff',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Layanan Siswa',
    items: [
      {
        title: 'Data Siswa',
        href: '/students',
        icon: GraduationCap,
      },
      {
        title: 'Kesehatan',
        href: '/health',
        icon: Heart,
      },
      {
        title: 'Perizinan',
        href: '/permits',
        icon: FileText,
      },
      {
        title: 'Pelanggaran',
        href: '/violations',
        icon: AlertTriangle,
      },
      {
        title: 'Penghargaan',
        href: '/rewards',
        icon: Award,
      },
    ],
  },
  {
    title: 'Administrasi',
    items: [
      {
        title: 'Keuangan',
        href: '/finance',
        icon: Wallet,
      },
      {
        title: 'Pengumuman',
        href: '/announcements',
        icon: Bell,
      },
    ],
  },
];

// Student-specific navigation
const studentNavigation: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/student',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Hafalan',
    items: [
      {
        title: 'Hafalan Saya',
        href: '/tahfidz',
        icon: BookMarked,
      },
      {
        title: 'Target',
        href: '/student/target',
        icon: Target,
      },
    ],
  },
  {
    title: 'Akademik',
    items: [
      {
        title: 'Portfolio Saya',
        href: '/portfolio',
        icon: FolderOpen,
      },
    ],
  },
  {
    title: 'Pesantren',
    items: [
      {
        title: 'Jurnal Ibadah',
        href: '/ibadah',
        icon: Sparkles,
      },
      {
        title: 'Muhadhoroh',
        href: '/muhadhoroh',
        icon: MessageSquare,
      },
      {
        title: 'Muhadatsah',
        href: '/muhadatsah',
        icon: Languages,
      },
      {
        title: 'Kitab Kuning',
        href: '/kitab-progress',
        icon: BookOpen,
      },
      {
        title: 'Muhasabah Harian',
        href: '/muhasabah',
        icon: Sparkles,
      },
    ],
  },
  {
    title: 'Kegiatan',
    items: [
      {
        title: 'Jadwal',
        href: '/schedule',
        icon: Calendar,
      },
      {
        title: 'Pengumuman',
        href: '/announcements',
        icon: Bell,
      },
    ],
  },
];

// Parent-specific navigation
const parentNavigation: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/parent',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Anak Saya',
    items: [
      {
        title: 'Data Anak',
        href: '/parent/children',
        icon: Baby,
      },
      {
        title: 'Raport',
        href: '/parent/report-cards',
        icon: FileSpreadsheet,
      },
      {
        title: 'Portfolio Anak',
        href: '/parent/portfolio',
        icon: FolderOpen,
      },
      {
        title: 'Kesehatan',
        href: '/parent/health',
        icon: Heart,
      },
      {
        title: 'Perizinan',
        href: '/parent/permits',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Kesiswaan',
    items: [
      {
        title: 'Pelanggaran',
        href: '/parent/violations',
        icon: AlertTriangle,
      },
      {
        title: 'Penghargaan',
        href: '/parent/rewards',
        icon: Award,
      },
    ],
  },
  {
    title: 'Keuangan',
    items: [
      {
        title: 'Tagihan & Pembayaran',
        href: '/parent/finance',
        icon: Receipt,
      },
    ],
  },
  {
    title: 'Informasi',
    items: [
      {
        title: 'Pengumuman',
        href: '/parent/announcements',
        icon: Megaphone,
      },
    ],
  },
];

// Yayasan-specific navigation (for Yayasan admins and board members)
const yayasanNavigation: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
      },
      {
        title: 'Reports',
        href: '/reports',
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    title: 'Yayasan',
    items: [
      {
        title: 'Foundation',
        href: '/foundation',
        icon: Building2,
      },
      {
        title: 'Units',
        href: '/units',
        icon: School,
      },
      {
        title: 'Board Members',
        href: '/foundation/board',
        icon: Users,
      },
      {
        title: 'Akreditasi',
        href: '/foundation/accreditation',
        icon: Award,
      },
    ],
  },
  {
    title: 'Keuangan',
    items: [
      {
        title: 'Laporan Keuangan',
        href: '/finance',
        icon: Wallet,
      },
      {
        title: 'BOS/BOP',
        href: '/finance/bos',
        icon: Wallet,
      },
      {
        title: 'Donasi Alumni',
        href: '/alumni/donations',
        icon: Receipt,
      },
      {
        title: 'Donation/ZIS',
        href: '/donation',
        icon: HeartHandshake,
      },
      {
        title: 'Public Portal',
        href: '/donation/public',
        icon: HeartHandshake,
      },
    ],
  },
  {
    title: 'Alumni',
    items: [
      {
        title: 'Data Alumni',
        href: '/alumni',
        icon: GraduationCap,
      },
    ],
  },
  {
    title: 'Pengumuman',
    items: [
      {
        title: 'Pengumuman',
        href: '/announcements',
        icon: Megaphone,
      },
    ],
  },
];

// Admin navigation - for Super Admin and Unit Admins
const adminNavigation: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
      },
      {
        title: 'Reports',
        href: '/reports',
        icon: FileSpreadsheet,
      },
      {
        title: 'EMIS Kemenag',
        href: '/emis',
        icon: FileSpreadsheet,
        roleCodes: ['SUPER_ADMIN', 'YAYASAN_ADMIN', 'TKQ_ADMIN', 'SDIT_ADMIN', 'SMPIT_ADMIN', 'SMAQ_ADMIN'],
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Foundation',
        href: '/foundation',
        icon: Building2,
        roleCodes: ['SUPER_ADMIN'],
      },
      {
        title: 'Units',
        href: '/units',
        icon: School,
        roleCodes: ['SUPER_ADMIN'],
      },
      {
        title: 'Users & Roles',
        href: '/users',
        icon: UserCog,
      },
      {
        title: 'Role Permissions',
        href: '/roles',
        icon: Shield,
        roleCodes: ['SUPER_ADMIN'],
      },
    ],
  },
  {
    title: 'Academic',
    items: [
      {
        title: 'Students',
        href: '/students',
        icon: GraduationCap,
      },
      {
        title: 'Student ID Card',
        href: '/students/id-card',
        icon: IdCard,
      },
      {
        title: 'Certificates',
        href: '/students/certificates',
        icon: Award,
      },
      {
        title: 'Transcript',
        href: '/students/transcript',
        icon: ScrollText,
      },
      {
        title: 'Portfolio Siswa',
        href: '/portfolio',
        icon: FolderOpen,
      },
      {
        title: 'Classes',
        href: '/classes',
        icon: BookOpen,
      },
      {
        title: 'Academic Years',
        href: '/academic-years',
        icon: Calendar,
      },
      {
        title: 'Curriculum',
        href: '/curriculum',
        icon: BookMarked,
      },
      {
        title: 'Timetable',
        href: '/curriculum/schedules/timetable',
        icon: CalendarDays,
      },
      {
        title: 'Assessment',
        href: '/assessment',
        icon: ClipboardCheck,
      },
      {
        title: 'Raport Merdeka',
        href: '/assessment/raport-merdeka',
        icon: FileSpreadsheet,
      },
      {
        title: 'Attendance',
        href: '/attendance',
        icon: ClipboardCheck,
      },
      {
        title: 'Attendance Calendar',
        href: '/attendance/calendar',
        icon: CalendarDays,
      },
      {
        title: 'Academic Calendar',
        href: '/calendar',
        icon: CalendarDays,
      },
      {
        title: 'Tahfidz',
        href: '/tahfidz',
        icon: BookMarked,
      },
      {
        title: 'Peta Al-Quran',
        href: '/tahfidz/quran-map',
        icon: BookCheck,
      },
    ],
  },
  {
    title: 'Kesiswaan',
    items: [
      {
        title: 'Ekstrakurikuler',
        href: '/extracurricular',
        icon: Drama,
      },
      {
        title: 'Bimbingan Konseling',
        href: '/counseling',
        icon: HeartHandshake,
      },
      {
        title: 'Piket Santri',
        href: '/duty-roster',
        icon: ClipboardList,
      },
    ],
  },
  {
    title: 'Pesantren',
    items: [
      {
        title: 'Jurnal Ibadah',
        href: '/ibadah',
        icon: Sparkles,
      },
      {
        title: 'Muhadhoroh',
        href: '/muhadhoroh',
        icon: MessageSquare,
      },
      {
        title: 'Muhadatsah',
        href: '/muhadatsah',
        icon: Languages,
      },
      {
        title: 'Kitab Kuning',
        href: '/kitab-progress',
        icon: BookOpen,
      },
      {
        title: 'Takhosus',
        href: '/takhosus',
        icon: BookMarked,
      },
      {
        title: 'Muhasabah',
        href: '/muhasabah',
        icon: Sparkles,
      },
    ],
  },
  {
    title: 'Boarding',
    items: [
      {
        title: 'Dormitories',
        href: '/dormitories',
        icon: Home,
      },
      {
        title: 'Permits',
        href: '/permits',
        icon: FileText,
      },
      {
        title: 'Violations',
        href: '/violations',
        icon: AlertTriangle,
      },
      {
        title: 'Rewards',
        href: '/rewards',
        icon: Award,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        title: 'Finance',
        href: '/finance',
        icon: Wallet,
      },
      {
        title: 'BOS/BOP',
        href: '/finance/bos',
        icon: Wallet,
      },
      {
        title: 'Accounting',
        href: '/finance/accounting',
        icon: Receipt,
      },
      {
        title: 'Scholarships',
        href: '/finance/scholarships',
        icon: Award,
      },
      {
        title: 'Donation/ZIS',
        href: '/donation',
        icon: HeartHandshake,
      },
      {
        title: 'Admissions (PSB)',
        href: '/psb',
        icon: UserPlus,
      },
      {
        title: 'HR',
        href: '/hr',
        icon: Clock,
      },
      {
        title: 'PKG Guru',
        href: '/pkg',
        icon: ClipboardPenLine,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Library',
        href: '/library',
        icon: Library,
      },
      {
        title: 'Health (UKS)',
        href: '/health',
        icon: Heart,
      },
      {
        title: 'Inventory',
        href: '/inventory',
        icon: Package,
      },
      {
        title: 'Facilities',
        href: '/facilities',
        icon: Building2,
      },
      {
        title: 'Meals',
        href: '/meals',
        icon: UtensilsCrossed,
      },
      {
        title: 'Canteen/Koperasi',
        href: '/canteen',
        icon: ShoppingCart,
      },
      {
        title: 'Laundry',
        href: '/laundry',
        icon: WashingMachine,
      },
      {
        title: 'Dompet Santri',
        href: '/finance/wallet',
        icon: CreditCard,
      },
      {
        title: 'Notifications',
        href: '/notifications',
        icon: Bell,
      },
      {
        title: 'Quick Send',
        href: '/notifications/quick-send',
        icon: Send,
      },
    ],
  },
  {
    title: 'Reference Data',
    items: [
      {
        title: 'Wilayah',
        href: '/wilayah',
        icon: Building2,
        roleCodes: ['SUPER_ADMIN', 'YAYASAN_ADMIN'],
      },
      {
        title: 'Kurikulum Merdeka',
        href: '/kurikulum-merdeka',
        icon: BookMarked,
      },
    ],
  },
  {
    title: 'Compliance',
    items: [
      {
        title: 'Student Compliance',
        href: '/compliance/students',
        icon: Shield,
      },
      {
        title: 'Teacher Compliance',
        href: '/compliance/teachers',
        icon: Shield,
      },
    ],
  },
  {
    title: 'Alumni',
    items: [
      {
        title: 'Alumni',
        href: '/alumni',
        icon: GraduationCap,
      },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
      },
    ],
  },
];

// Kepala Sekolah navigation - extended admin with focus on school operations
const kepalaSekolahNavigation: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
      },
      {
        title: 'Reports',
        href: '/reports',
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Users & Staff',
        href: '/users',
        icon: UserCog,
      },
      {
        title: 'Teachers',
        href: '/hr/teachers',
        icon: Users,
      },
      {
        title: 'PKG Guru',
        href: '/pkg',
        icon: ClipboardPenLine,
      },
    ],
  },
  {
    title: 'Academic',
    items: [
      {
        title: 'Students',
        href: '/students',
        icon: GraduationCap,
      },
      {
        title: 'Portfolio Siswa',
        href: '/portfolio',
        icon: FolderOpen,
      },
      {
        title: 'Classes',
        href: '/classes',
        icon: BookOpen,
      },
      {
        title: 'Curriculum',
        href: '/curriculum',
        icon: BookMarked,
      },
      {
        title: 'Assessment',
        href: '/assessment',
        icon: ClipboardCheck,
      },
      {
        title: 'Tahfidz',
        href: '/tahfidz',
        icon: BookMarked,
      },
    ],
  },
  {
    title: 'Kesiswaan',
    items: [
      {
        title: 'Attendance',
        href: '/attendance',
        icon: ClipboardCheck,
      },
      {
        title: 'Permits',
        href: '/permits',
        icon: FileText,
      },
      {
        title: 'Violations',
        href: '/violations',
        icon: AlertTriangle,
      },
      {
        title: 'Rewards',
        href: '/rewards',
        icon: Award,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        title: 'Admissions (PSB)',
        href: '/psb',
        icon: UserPlus,
      },
      {
        title: 'HR',
        href: '/hr',
        icon: Clock,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Notifications',
        href: '/notifications',
        icon: Bell,
      },
      {
        title: 'Announcements',
        href: '/announcements',
        icon: Megaphone,
      },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
      },
    ],
  },
];

export const navigationConfig: NavGroup[] = adminNavigation;

// Role category helpers
function isAdminRole(roleCode: string): boolean {
  return ADMIN_ROLES.includes(roleCode);
}

function isTeacherRole(roleCode: string): boolean {
  return TEACHER_ROLES.includes(roleCode);
}

function isStaffRole(roleCode: string): boolean {
  return STAFF_ROLES.includes(roleCode);
}

function isStudentRole(roleCode: string): boolean {
  return STUDENT_ROLES.includes(roleCode);
}

function isParentRole(roleCode: string): boolean {
  return PARENT_ROLES.includes(roleCode);
}

function isYayasanRole(roleCode: string): boolean {
  return YAYASAN_ROLES.includes(roleCode);
}

function isPrincipalRole(roleCode: string): boolean {
  if (!roleCode || typeof roleCode !== 'string') return false;
  return roleCode.includes('KEPALA_SEKOLAH');
}

export interface ActiveRole {
  id: string;
  code: string;
  name: string;
  realm: string;
}

/**
 * Get navigation for a specific role code
 * Uses the new RoleCode-based system
 */
export function getNavigationForRoleCode(roleCode: string): NavGroup[] {
  if (!roleCode) return [];

  // Super Admin gets full admin navigation
  if (roleCode === 'SUPER_ADMIN') {
    return adminNavigation;
  }
  
  // Yayasan roles
  if (isYayasanRole(roleCode)) {
    return yayasanNavigation;
  }
  
  // Kepala Sekolah gets kepala sekolah navigation
  if (isPrincipalRole(roleCode)) {
    return kepalaSekolahNavigation;
  }
  
  // Admin roles get admin navigation
  if (isAdminRole(roleCode)) {
    return adminNavigation.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roleCodes || item.roleCodes.includes(roleCode)
      ),
    })).filter((group) => group.items.length > 0);
  }
  
  // Teacher roles
  if (isTeacherRole(roleCode)) {
    return teacherNavigation;
  }
  
  // Staff roles
  if (isStaffRole(roleCode)) {
    return staffNavigation;
  }
  
  // Student roles
  if (isStudentRole(roleCode)) {
    return studentNavigation;
  }
  
  // Parent roles
  if (isParentRole(roleCode)) {
    return parentNavigation;
  }
  
  // Default to basic navigation
  return [
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Notifications',
          href: '/notifications',
          icon: Bell,
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          title: 'Settings',
          href: '/settings',
          icon: Settings,
        },
      ],
    },
  ];
}

/**
 * Legacy function - for backward compatibility
 * Maps old UserRole to appropriate navigation
 */
export function getNavigationForRole(role: string): NavGroup[] {
  // Map legacy roles to new role codes
  const legacyToRoleCode: Record<string, string> = {
    'SUPER_ADMIN': 'SUPER_ADMIN',
    'UNIT_ADMIN': 'SMPIT_ADMIN', // Default to SMPIT_ADMIN for legacy
    'TEACHER': 'SMPIT_GURU',
    'STAFF': 'SMPIT_TATA_USAHA',
    'STUDENT': 'SMPIT_SISWA',
    'PARENT': 'SMPIT_ORANG_TUA',
  };
  
  const roleCode = legacyToRoleCode[role] || role;
  return getNavigationForRoleCode(roleCode);
}

// Export role categories for use elsewhere
export {
  ADMIN_ROLES,
  TEACHER_ROLES,
  STAFF_ROLES,
  STUDENT_ROLES,
  PARENT_ROLES,
  YAYASAN_ROLES,
  isAdminRole,
  isTeacherRole,
  isStaffRole,
  isStudentRole,
  isParentRole,
  isYayasanRole,
  isPrincipalRole,
};
