export const PERMISSIONS = {
  // User Management
  USER_VIEW: 'USER_VIEW',
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',

  // Role Management
  ROLE_VIEW: 'ROLE_VIEW',
  ROLE_MANAGE: 'ROLE_MANAGE', // Create, Update, Delete Roles & Permissions

  // Student Management
  STUDENT_VIEW: 'STUDENT_VIEW',
  STUDENT_CREATE: 'STUDENT_CREATE',
  STUDENT_UPDATE: 'STUDENT_UPDATE',
  STUDENT_DELETE: 'STUDENT_DELETE',

  // Teacher & Staff Management
  TEACHER_VIEW: 'TEACHER_VIEW',
  TEACHER_MANAGE: 'TEACHER_MANAGE',
  STAFF_VIEW: 'STAFF_VIEW',
  STAFF_MANAGE: 'STAFF_MANAGE',

  // Academic / Curriculum
  ACADEMIC_VIEW: 'ACADEMIC_VIEW',
  ACADEMIC_MANAGE: 'ACADEMIC_MANAGE', // Subjects, Classes, Schedules

  // Exams & Grades
  EXAM_VIEW: 'EXAM_VIEW',
  EXAM_MANAGE: 'EXAM_MANAGE',
  GRADE_VIEW: 'GRADE_VIEW',
  GRADE_MANAGE: 'GRADE_MANAGE',

  // Finance
  FINANCE_VIEW: 'FINANCE_VIEW',
  FINANCE_MANAGE: 'FINANCE_MANAGE', // Invoices, Payments, Budgets

  // Inventory / Assets
  INVENTORY_VIEW: 'INVENTORY_VIEW',
  INVENTORY_MANAGE: 'INVENTORY_MANAGE',

  // Library
  LIBRARY_VIEW: 'LIBRARY_VIEW',
  LIBRARY_MANAGE: 'LIBRARY_MANAGE',

  // Health / UKS
  HEALTH_VIEW: 'HEALTH_VIEW',
  HEALTH_MANAGE: 'HEALTH_MANAGE',

  // Dormitory / Pesantren
  DORMITORY_VIEW: 'DORMITORY_VIEW',
  DORMITORY_MANAGE: 'DORMITORY_MANAGE',

  // Tahfidz
  TAHFIDZ_VIEW: 'TAHFIDZ_VIEW',
  TAHFIDZ_MANAGE: 'TAHFIDZ_MANAGE',

  // Admissions (PSB)
  ADMISSION_VIEW: 'ADMISSION_VIEW',
  ADMISSION_MANAGE: 'ADMISSION_MANAGE',

  // Settings
  SETTINGS_MANAGE: 'SETTINGS_MANAGE',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_GROUPS = {
  USER: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
  ],
  ROLE: [PERMISSIONS.ROLE_VIEW, PERMISSIONS.ROLE_MANAGE],
  STUDENT: [
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.STUDENT_CREATE,
    PERMISSIONS.STUDENT_UPDATE,
    PERMISSIONS.STUDENT_DELETE,
  ],
  EMPLOYEE: [
    PERMISSIONS.TEACHER_VIEW,
    PERMISSIONS.TEACHER_MANAGE,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.STAFF_MANAGE,
  ],
  ACADEMIC: [
    PERMISSIONS.ACADEMIC_VIEW,
    PERMISSIONS.ACADEMIC_MANAGE,
    PERMISSIONS.EXAM_VIEW,
    PERMISSIONS.EXAM_MANAGE,
    PERMISSIONS.GRADE_VIEW,
    PERMISSIONS.GRADE_MANAGE,
  ],
  FINANCE: [PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_MANAGE],
  ASSETS: [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_MANAGE],
  LIBRARY: [PERMISSIONS.LIBRARY_VIEW, PERMISSIONS.LIBRARY_MANAGE],
  HEALTH: [PERMISSIONS.HEALTH_VIEW, PERMISSIONS.HEALTH_MANAGE],
  PESANTREN: [
    PERMISSIONS.DORMITORY_VIEW,
    PERMISSIONS.DORMITORY_MANAGE,
    PERMISSIONS.TAHFIDZ_VIEW,
    PERMISSIONS.TAHFIDZ_MANAGE,
  ],
  ADMISSION: [PERMISSIONS.ADMISSION_VIEW, PERMISSIONS.ADMISSION_MANAGE],
  SYSTEM: [PERMISSIONS.SETTINGS_MANAGE],
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);
const ALL_VIEW_PERMISSIONS = ALL_PERMISSIONS.filter((p) => p.endsWith('_VIEW'));

/**
 * Default permission set per RoleCode, seeded into the Role records (and
 * embedded into JWTs at login). Least-privilege by function:
 *
 * - SUPER_ADMIN: everything.
 * - Unit/foundation admins: everything except role-permission management
 *   (only SUPER_ADMIN edits the permission matrix). A unit admin's DATA
 *   scope is their own unit — enforced by unitId scoping in the services,
 *   not by this list.
 * - Yayasan governance: read-only oversight (every *_VIEW).
 * - Kepala sekolah / wakasek: oversight views + academic management.
 * - Guru (incl. wali kelas & BK): students, academics, exams/grades, tahfidz.
 * - Pesantren leaders/educators: dormitory + tahfidz (+ leaders get views).
 * - Tata usaha: student administration, admissions, finance view, inventory.
 * - Bendahara: finance.
 * - Support staff: their service module only.
 * - Business units: inventory + finance view.
 * - Students/parents/komite/alumni: none (self-service endpoints are gated
 *   by authenticate + ownership, not by the permission layer).
 */
export function defaultPermissionsForRole(code: string): Permission[] {
  if (code === 'SUPER_ADMIN') return [...ALL_PERMISSIONS];

  if (code === 'YAYASAN_ADMIN' || code.endsWith('_ADMIN')) {
    return ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.ROLE_MANAGE);
  }

  if (code.startsWith('YAYASAN_')) return [...ALL_VIEW_PERMISSIONS];

  if (code.endsWith('_KEPALA_SEKOLAH') || code.endsWith('_WAKASEK')) {
    return [
      ...ALL_VIEW_PERMISSIONS,
      PERMISSIONS.ACADEMIC_MANAGE,
      PERMISSIONS.EXAM_MANAGE,
      PERMISSIONS.GRADE_MANAGE,
    ];
  }

  if (
    code.endsWith('_GURU') ||
    code.endsWith('_WALI_KELAS') ||
    code.endsWith('_GURU_BK') ||
    ['PT_REKTOR', 'PT_WAKIL_REKTOR', 'PT_DEKAN', 'PT_KAPRODI', 'PT_DOSEN'].includes(code)
  ) {
    return [
      PERMISSIONS.STUDENT_VIEW,
      PERMISSIONS.ACADEMIC_VIEW,
      PERMISSIONS.ACADEMIC_MANAGE,
      PERMISSIONS.EXAM_VIEW,
      PERMISSIONS.EXAM_MANAGE,
      PERMISSIONS.GRADE_VIEW,
      PERMISSIONS.GRADE_MANAGE,
      PERMISSIONS.TAHFIDZ_VIEW,
      PERMISSIONS.TAHFIDZ_MANAGE,
      PERMISSIONS.LIBRARY_VIEW,
      PERMISSIONS.HEALTH_VIEW,
    ];
  }

  if (['PESANTREN_PENGASUH', 'PESANTREN_DIREKTUR'].includes(code)) {
    return [
      ...ALL_VIEW_PERMISSIONS,
      PERMISSIONS.DORMITORY_MANAGE,
      PERMISSIONS.TAHFIDZ_MANAGE,
    ];
  }

  if (
    ['USTADZ', 'MUSYRIF', 'MUSYRIFAH', 'MUHAFIDZ', 'MUHAFIDZAH', 'MURABBI', 'WALI_KAMAR'].includes(
      code
    )
  ) {
    return [
      PERMISSIONS.STUDENT_VIEW,
      PERMISSIONS.DORMITORY_VIEW,
      PERMISSIONS.DORMITORY_MANAGE,
      PERMISSIONS.TAHFIDZ_VIEW,
      PERMISSIONS.TAHFIDZ_MANAGE,
    ];
  }

  if (code.endsWith('_TATA_USAHA') || code === 'PT_STAF_AKADEMIK') {
    return [
      PERMISSIONS.STUDENT_VIEW,
      PERMISSIONS.STUDENT_CREATE,
      PERMISSIONS.STUDENT_UPDATE,
      PERMISSIONS.ADMISSION_VIEW,
      PERMISSIONS.ADMISSION_MANAGE,
      PERMISSIONS.TEACHER_VIEW,
      PERMISSIONS.STAFF_VIEW,
      PERMISSIONS.ACADEMIC_VIEW,
      PERMISSIONS.FINANCE_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.LIBRARY_VIEW,
      PERMISSIONS.HEALTH_VIEW,
    ];
  }

  if (code.endsWith('_BENDAHARA')) {
    return [PERMISSIONS.STUDENT_VIEW, PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_MANAGE];
  }

  if (code === 'PUSTAKAWAN') return [PERMISSIONS.LIBRARY_VIEW, PERMISSIONS.LIBRARY_MANAGE];
  if (code === 'PERAWAT')
    return [PERMISSIONS.STUDENT_VIEW, PERMISSIONS.HEALTH_VIEW, PERMISSIONS.HEALTH_MANAGE];
  if (code === 'KEAMANAN') return [PERMISSIONS.STUDENT_VIEW];
  if (code === 'LABORAN') return [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.ACADEMIC_VIEW];

  if (code.startsWith('BUSINESS_')) {
    return [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_MANAGE, PERMISSIONS.FINANCE_VIEW];
  }

  // Students, parents, komite, alumni: self-service only.
  return [];
}
