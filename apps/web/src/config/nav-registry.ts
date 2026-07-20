/**
 * Single data-driven navigation & route-access registry.
 *
 * One entry per feature area: `{ path, label, icon, group, roleCodes }`.
 * Everything else is DERIVED from this list:
 *  - the sidebar menu (src/config/navigation.ts groups + icons),
 *  - route protection (src/lib/rbac.ts → middleware.ts),
 *  - page guards.
 *
 * That derivation is the point: a menu item a role can see is, by
 * construction, a route that role may open — the old hand-mirrored
 * `navigation.ts` vs `roleRouteAccess` pair had drifted so far apart that
 * UNIT_ADMIN's menu linked ~40 routes the middleware bounced.
 *
 * Access rule: a role may open `path` and everything under it. Entries are
 * pure data (icon is a string key) so the Edge middleware can import this
 * module without dragging icon components into its bundle.
 */

import {
  ADMIN_ROLE_CODES,
  GOVERNANCE_ROLE_CODES,
  PRINCIPAL_ROLE_CODES,
  VICE_PRINCIPAL_ROLE_CODES,
  SCHOOL_TEACHER_ROLE_CODES,
  PESANTREN_LEADER_ROLE_CODES,
  PESANTREN_EDUCATOR_ROLE_CODES,
  PT_ACADEMIC_ROLE_CODES,
  PT_STAFF_ROLE_CODES,
  TATA_USAHA_ROLE_CODES,
  BENDAHARA_ROLE_CODES,
  BUSINESS_ROLE_CODES,
  STUDENT_ROLE_CODES,
  PARENT_ROLE_CODES,
  KOMITE_ROLE_CODES,
  ALUMNI_ROLE_CODES,
} from "@cipansor/shared";

export interface NavEntry {
  /** Route prefix — grants access to this path and everything under it. */
  path: string;
  /** Sidebar label (bahasa Indonesia, konsisten). */
  label: string;
  /** Icon key resolved by src/config/navigation.ts. */
  icon: string;
  /** Sidebar group key (see NAV_GROUP_ORDER). */
  group: string;
  /** Roles that see this menu item AND may open the route. */
  roleCodes: readonly string[];
  /** Access without a menu item (utility/deep routes). */
  hidden?: boolean;
}

/** Sidebar group rendering order. */
export const NAV_GROUP_ORDER = [
  "Beranda",
  "Anak Saya",
  "Kesiswaan",
  "Akademik",
  "Kepesantrenan",
  "Keuangan",
  "SDM",
  "Sarpras & Layanan",
  "Tata Kelola",
  "Administrasi",
  "Informasi",
] as const;

// --- Audience shorthands -----------------------------------------------------

const SUPER = ["SUPER_ADMIN"] as const;
const ADMINS = ADMIN_ROLE_CODES; // SUPER_ADMIN + YAYASAN_ADMIN + per-unit admins
const YAYASAN = ["YAYASAN_ADMIN", ...GOVERNANCE_ROLE_CODES] as const;
const SCHOOL_LEADS = [...PRINCIPAL_ROLE_CODES, ...VICE_PRINCIPAL_ROLE_CODES] as const;
const TEACHERS = SCHOOL_TEACHER_ROLE_CODES;
const PESANTREN = [...PESANTREN_LEADER_ROLE_CODES, ...PESANTREN_EDUCATOR_ROLE_CODES] as const;
const TU = TATA_USAHA_ROLE_CODES;
const BENDAHARA = ["YAYASAN_BENDAHARA", ...BENDAHARA_ROLE_CODES] as const;
const BUSINESS = BUSINESS_ROLE_CODES;
const STUDENTS = STUDENT_ROLE_CODES;
const PARENTS = PARENT_ROLE_CODES;
const PT_STAFF_ALL = [...PT_ACADEMIC_ROLE_CODES, ...PT_STAFF_ROLE_CODES] as const;

const uniq = (...groups: ReadonlyArray<readonly string[]>): string[] =>
  Array.from(new Set(groups.flat()));

/** Everyone — used for shared information surfaces. */
const EVERYONE = uniq(
  ADMINS,
  YAYASAN,
  SCHOOL_LEADS,
  TEACHERS,
  PESANTREN,
  TU,
  BENDAHARA,
  ["PUSTAKAWAN", "PERAWAT", "KEAMANAN", "LABORAN"],
  BUSINESS,
  PT_STAFF_ALL,
  STUDENTS,
  PARENTS,
  KOMITE_ROLE_CODES,
  ALUMNI_ROLE_CODES,
);

/** All non-admin staff buckets that land on the /staff dashboard. */
const STAFF_PORTAL = uniq(TU, BENDAHARA, ["PUSTAKAWAN", "PERAWAT", "KEAMANAN", "LABORAN"], BUSINESS, PT_STAFF_ALL);

// --- The registry ------------------------------------------------------------

export const NAV_REGISTRY: readonly NavEntry[] = [
  // ── Beranda ────────────────────────────────────────────────────────────────
  { path: "/dashboard", label: "Beranda", icon: "dashboard", group: "Beranda",
    roleCodes: uniq(ADMINS, YAYASAN, SCHOOL_LEADS, KOMITE_ROLE_CODES, ALUMNI_ROLE_CODES, PT_STAFF_ALL) },
  { path: "/teacher", label: "Beranda Guru", icon: "dashboard", group: "Beranda",
    roleCodes: uniq(TEACHERS, PT_ACADEMIC_ROLE_CODES) },
  { path: "/musyrif", label: "Beranda Pembina", icon: "dashboard", group: "Beranda",
    roleCodes: uniq(PESANTREN) },
  { path: "/staff", label: "Beranda Staf", icon: "dashboard", group: "Beranda",
    roleCodes: STAFF_PORTAL },
  { path: "/student", label: "Beranda Siswa", icon: "dashboard", group: "Beranda",
    roleCodes: STUDENTS },
  { path: "/parent", label: "Beranda Wali", icon: "dashboard", group: "Beranda",
    roleCodes: PARENTS },
  { path: "/analytics", label: "Analitik", icon: "chart", group: "Beranda",
    roleCodes: uniq(ADMINS, YAYASAN, SCHOOL_LEADS) },
  { path: "/reports", label: "Laporan", icon: "report", group: "Beranda",
    roleCodes: uniq(ADMINS, YAYASAN, SCHOOL_LEADS) },

  // ── Anak Saya (portal wali — semua di bawah prefix /parent) ───────────────
  { path: "/parent/children", label: "Data Anak", icon: "child", group: "Anak Saya", roleCodes: PARENTS },
  { path: "/parent/report-cards", label: "Rapor", icon: "report", group: "Anak Saya", roleCodes: PARENTS },
  { path: "/parent/buku-penghubung", label: "Buku Penghubung", icon: "message", group: "Anak Saya", roleCodes: PARENTS },
  { path: "/parent/ibadah", label: "Ibadah Anak", icon: "sparkles", group: "Anak Saya", roleCodes: PARENTS },
  { path: "/parent/daily-report", label: "Laporan Harian", icon: "activity", group: "Anak Saya", roleCodes: PARENTS },
  { path: "/parent/health", label: "Kesehatan", icon: "health", group: "Anak Saya", roleCodes: PARENTS },
  { path: "/parent/permits", label: "Perizinan", icon: "permit", group: "Anak Saya", roleCodes: PARENTS },
  { path: "/parent/violations", label: "Pelanggaran", icon: "alert", group: "Anak Saya", roleCodes: PARENTS },
  { path: "/parent/rewards", label: "Penghargaan", icon: "award", group: "Anak Saya", roleCodes: PARENTS },
  { path: "/parent/finance", label: "Tagihan & Pembayaran", icon: "receipt", group: "Keuangan", roleCodes: PARENTS },

  // ── Kesiswaan ─────────────────────────────────────────────────────────────
  { path: "/admissions", label: "PSB / Penerimaan", icon: "userPlus", group: "Kesiswaan",
    roleCodes: uniq(ADMINS, TU) },
  { path: "/students", label: "Data Siswa", icon: "students", group: "Kesiswaan",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS, TU, PESANTREN_LEADER_ROLE_CODES) },
  { path: "/classes", label: "Kelas", icon: "classes", group: "Kesiswaan",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS) },
  { path: "/attendance", label: "Absensi", icon: "attendance", group: "Kesiswaan",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS) },
  { path: "/extracurricular", label: "Ekstrakurikuler", icon: "activityAlt", group: "Kesiswaan",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS) },
  { path: "/counseling", label: "Bimbingan Konseling", icon: "heartHand", group: "Kesiswaan",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS) },
  { path: "/permits", label: "Perizinan Santri", icon: "permit", group: "Kesiswaan",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, PESANTREN, TU, ["KEAMANAN"]) },
  { path: "/violations", label: "Pelanggaran", icon: "alert", group: "Kesiswaan",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS, PESANTREN, ["KEAMANAN"]) },
  { path: "/rewards", label: "Penghargaan", icon: "award", group: "Kesiswaan",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS, PESANTREN) },
  { path: "/portfolio", label: "Portofolio", icon: "folder", group: "Kesiswaan",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS, STUDENTS) },
  { path: "/duty-roster", label: "Piket Santri", icon: "clipboardList", group: "Kesiswaan",
    roleCodes: uniq(ADMINS, PESANTREN) },
  { path: "/student-org", label: "Organisasi Santri", icon: "users", group: "Kesiswaan",
    roleCodes: uniq(ADMINS, PESANTREN_LEADER_ROLE_CODES) },

  // ── Akademik ──────────────────────────────────────────────────────────────
  { path: "/academic-years", label: "Tahun Ajaran", icon: "calendar", group: "Akademik",
    roleCodes: ADMINS },
  { path: "/curriculum", label: "Kurikulum & Jadwal", icon: "bookMarked", group: "Akademik",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS) },
  { path: "/schedule", label: "Jadwal Pelajaran", icon: "calendarDays", group: "Akademik",
    roleCodes: uniq(TEACHERS, STUDENTS) },
  { path: "/assessment", label: "Penilaian & Rapor", icon: "clipboardCheck", group: "Akademik",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS) },
  { path: "/cbt", label: "Ujian (CBT)", icon: "bookCheck", group: "Akademik",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS) },
  { path: "/assignments", label: "Tugas", icon: "clipboardPen", group: "Akademik",
    roleCodes: uniq(TEACHERS, STUDENTS) },
  { path: "/homeroom", label: "Wali Kelas", icon: "home", group: "Akademik",
    roleCodes: uniq(TEACHERS) },
  { path: "/daily-report", label: "Mutabaah Yaumiyah", icon: "activity", group: "Akademik",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS) },
  { path: "/calendar", label: "Kalender Akademik", icon: "calendarDays", group: "Akademik",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS) },
  { path: "/tk", label: "Modul TK", icon: "baby", group: "Akademik",
    roleCodes: ["TKQ_ADMIN", "TKQ_KEPALA_SEKOLAH", "TKQ_WAKASEK", "TKQ_GURU", "TKQ_WALI_KELAS", "SUPER_ADMIN"] },
  { path: "/certificates", label: "Sertifikat", icon: "award", group: "Akademik",
    roleCodes: ADMINS },
  { path: "/student/exams", label: "Ujian Saya", icon: "bookCheck", group: "Akademik",
    roleCodes: STUDENTS },

  // ── Kepesantrenan ─────────────────────────────────────────────────────────
  { path: "/tahfidz", label: "Tahfidz", icon: "bookMarked", group: "Kepesantrenan",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS, PESANTREN, STUDENTS) },
  { path: "/ibadah", label: "Jurnal Ibadah", icon: "sparkles", group: "Kepesantrenan",
    roleCodes: uniq(ADMINS, TEACHERS, PESANTREN, STUDENTS) },
  { path: "/muhadhoroh", label: "Muhadhoroh", icon: "message", group: "Kepesantrenan",
    roleCodes: uniq(ADMINS, TEACHERS, PESANTREN, STUDENTS) },
  { path: "/muhadatsah", label: "Muhadatsah", icon: "languages", group: "Kepesantrenan",
    roleCodes: uniq(ADMINS, TEACHERS, PESANTREN, STUDENTS) },
  { path: "/kitab-progress", label: "Kitab Kuning", icon: "bookOpen", group: "Kepesantrenan",
    roleCodes: uniq(ADMINS, TEACHERS, PESANTREN, STUDENTS) },
  { path: "/muhasabah", label: "Muhasabah", icon: "sparkles", group: "Kepesantrenan",
    roleCodes: uniq(ADMINS, PESANTREN, STUDENTS) },
  { path: "/rapor-pesantren", label: "Rapor Pesantren", icon: "report", group: "Kepesantrenan",
    roleCodes: uniq(ADMINS, PESANTREN) },
  { path: "/dormitories", label: "Asrama", icon: "home", group: "Kepesantrenan",
    roleCodes: uniq(ADMINS, PESANTREN) },
  { path: "/takhosus", label: "Takhosus", icon: "bookMarked", group: "Kepesantrenan",
    roleCodes: uniq(ADMINS, PESANTREN) },
  { path: "/practicum", label: "Amaliyah Tadris", icon: "clipboardPen", group: "Kepesantrenan",
    roleCodes: uniq(ADMINS, PESANTREN) },
  { path: "/research", label: "Turats Lab", icon: "scroll", group: "Kepesantrenan",
    roleCodes: uniq(SUPER, PESANTREN_LEADER_ROLE_CODES) },
  { path: "/student/achievements", label: "Prestasi Ibadah", icon: "trophy", group: "Kepesantrenan",
    roleCodes: STUDENTS, hidden: true },

  // ── Keuangan ──────────────────────────────────────────────────────────────
  { path: "/finance", label: "Keuangan", icon: "wallet", group: "Keuangan",
    roleCodes: uniq(ADMINS, YAYASAN, BENDAHARA, TU) },
  { path: "/payroll", label: "Penggajian", icon: "receipt", group: "Keuangan",
    roleCodes: uniq(ADMINS, ["YAYASAN_BENDAHARA"]) },
  { path: "/donation", label: "Donasi & ZIS", icon: "heartHand", group: "Keuangan",
    roleCodes: uniq(ADMINS, YAYASAN, BENDAHARA) },
  { path: "/procurement", label: "Pengadaan", icon: "shoppingBag", group: "Keuangan",
    roleCodes: uniq(ADMINS, BENDAHARA) },
  { path: "/wallet", label: "Dompet Santri", icon: "creditCard", group: "Keuangan",
    roleCodes: uniq(ADMINS, BENDAHARA, TU) },

  // ── SDM ───────────────────────────────────────────────────────────────────
  { path: "/hr", label: "Kepegawaian", icon: "clock", group: "SDM",
    roleCodes: ADMINS },
  { path: "/pkg", label: "PKG Guru", icon: "clipboardPen", group: "SDM",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TEACHERS) },
  { path: "/talenta", label: "Talenta", icon: "sparkles", group: "SDM",
    roleCodes: ADMINS },

  // ── Sarpras & Layanan ─────────────────────────────────────────────────────
  { path: "/facilities", label: "Fasilitas", icon: "building", group: "Sarpras & Layanan",
    roleCodes: uniq(ADMINS, TU, ["LABORAN"]) },
  { path: "/inventory", label: "Inventaris Aset", icon: "package", group: "Sarpras & Layanan",
    roleCodes: uniq(ADMINS, TU, BUSINESS) },
  { path: "/library", label: "Perpustakaan", icon: "library", group: "Sarpras & Layanan",
    roleCodes: uniq(ADMINS, ["PUSTAKAWAN"]) },
  { path: "/library/digital", label: "Maktabah Digital", icon: "bookOpen", group: "Sarpras & Layanan",
    roleCodes: uniq(TEACHERS, PESANTREN, STUDENTS) },
  { path: "/health", label: "Kesehatan (UKS)", icon: "health", group: "Sarpras & Layanan",
    roleCodes: uniq(ADMINS, TU, ["PERAWAT"]) },
  { path: "/meals", label: "Konsumsi", icon: "utensils", group: "Sarpras & Layanan",
    roleCodes: uniq(ADMINS, BUSINESS) },
  { path: "/canteen", label: "Kantin & Koperasi", icon: "shoppingCart", group: "Sarpras & Layanan",
    roleCodes: uniq(ADMINS, BUSINESS) },
  { path: "/laundry", label: "Laundry", icon: "washing", group: "Sarpras & Layanan",
    roleCodes: uniq(ADMINS, BUSINESS) },
  { path: "/unit-usaha", label: "Unit Usaha", icon: "store", group: "Sarpras & Layanan",
    roleCodes: uniq(ADMINS, BUSINESS) },
  { path: "/reception", label: "Buku Tamu", icon: "idCard", group: "Sarpras & Layanan",
    roleCodes: uniq(ADMINS, TU, ["KEAMANAN"]) },
  { path: "/e-office", label: "E-Office (Persuratan)", icon: "mail", group: "Sarpras & Layanan",
    roleCodes: uniq(ADMINS, SCHOOL_LEADS, TU) },

  // ── Tata Kelola ───────────────────────────────────────────────────────────
  { path: "/foundation", label: "Yayasan", icon: "building", group: "Tata Kelola",
    roleCodes: uniq(SUPER, YAYASAN) },
  { path: "/units", label: "Unit Pendidikan", icon: "school", group: "Tata Kelola",
    roleCodes: uniq(SUPER, ["YAYASAN_ADMIN"]) },
  { path: "/quality", label: "Penjaminan Mutu", icon: "award", group: "Tata Kelola",
    roleCodes: uniq(ADMINS, YAYASAN, SCHOOL_LEADS) },
  { path: "/risk-management", label: "Manajemen Risiko", icon: "shield", group: "Tata Kelola",
    roleCodes: uniq(SUPER, YAYASAN) },
  { path: "/alumni", label: "Alumni", icon: "graduation", group: "Tata Kelola",
    roleCodes: uniq(ADMINS, YAYASAN, ALUMNI_ROLE_CODES) },
  { path: "/lingkungan", label: "Kampus Hijau", icon: "leaf", group: "Tata Kelola",
    roleCodes: SUPER },
  { path: "/marketing", label: "Pemasaran", icon: "megaphone", group: "Tata Kelola",
    roleCodes: uniq(SUPER, ["YAYASAN_ADMIN"]) },
  // Modul GRC/expansi di luar kebutuhan inti — sengaja hanya SUPER_ADMIN
  // (kebijakan feature-freeze; lihat docs/CRITIQUE.md).
  { path: "/perencanaan", label: "Perencanaan", icon: "clipboardList", group: "Tata Kelola", roleCodes: SUPER },
  { path: "/pengawasan", label: "Pengawasan", icon: "shield", group: "Tata Kelola", roleCodes: SUPER },
  { path: "/tata-laksana", label: "Tata Laksana", icon: "clipboardList", group: "Tata Kelola", roleCodes: SUPER, hidden: true },
  { path: "/grc-dashboard", label: "GRC", icon: "shield", group: "Tata Kelola", roleCodes: SUPER, hidden: true },
  { path: "/project", label: "Proyek", icon: "clipboardList", group: "Tata Kelola", roleCodes: SUPER, hidden: true },
  { path: "/litbang", label: "Litbang", icon: "scroll", group: "Tata Kelola", roleCodes: SUPER, hidden: true },
  { path: "/syariah", label: "Kepatuhan Syariah", icon: "shield", group: "Tata Kelola", roleCodes: SUPER, hidden: true },
  { path: "/organisasi", label: "Organisasi", icon: "users", group: "Tata Kelola", roleCodes: SUPER, hidden: true },

  // ── Administrasi ──────────────────────────────────────────────────────────
  { path: "/users", label: "Pengguna & Peran", icon: "userCog", group: "Administrasi",
    roleCodes: ADMINS },
  { path: "/settings/roles", label: "Izin Peran", icon: "shield", group: "Administrasi",
    roleCodes: SUPER },
  { path: "/emis", label: "EMIS Kemenag", icon: "report", group: "Administrasi",
    roleCodes: ADMINS },
  { path: "/wilayah", label: "Referensi Wilayah", icon: "globe", group: "Administrasi",
    roleCodes: uniq(SUPER, ["YAYASAN_ADMIN"]) },
  { path: "/settings", label: "Pengaturan", icon: "settings", group: "Administrasi",
    roleCodes: ADMINS },

  // ── Informasi (semua role) ────────────────────────────────────────────────
  { path: "/announcements", label: "Pengumuman", icon: "bell", group: "Informasi",
    roleCodes: EVERYONE },
  { path: "/quality/complaints", label: "Aduan & Aspirasi", icon: "messageWarning", group: "Informasi",
    roleCodes: EVERYONE },
  { path: "/notifications", label: "Notifikasi", icon: "bell", group: "Informasi",
    roleCodes: EVERYONE, hidden: true },
  { path: "/profile", label: "Profil", icon: "userCog", group: "Informasi",
    roleCodes: EVERYONE, hidden: true },
];

/**
 * Route prefixes reachable by every authenticated user regardless of role
 * (auth pages and access-denied are handled as public routes in middleware).
 */
export const ALWAYS_ALLOWED_PREFIXES: readonly string[] = [
  "/profile",
  "/notifications",
  "/announcements",
  "/quality/complaints",
];

/** Entries visible in the sidebar for a roleCode (hidden entries excluded). */
export function menuEntriesForRole(roleCode: string): NavEntry[] {
  return NAV_REGISTRY.filter(
    (e) => !e.hidden && e.roleCodes.includes(roleCode),
  );
}

/** Allowed route prefixes for a roleCode (menu + hidden + always-allowed). */
export function routePrefixesForRole(roleCode: string): string[] {
  const own = NAV_REGISTRY.filter((e) => e.roleCodes.includes(roleCode)).map(
    (e) => e.path,
  );
  return Array.from(new Set([...own, ...ALWAYS_ALLOWED_PREFIXES]));
}

/** May `roleCode` open `pathname`? SUPER_ADMIN may open everything. */
export function roleCodeCanAccess(roleCode: string, pathname: string): boolean {
  if (roleCode === "SUPER_ADMIN") return true;
  return routePrefixesForRole(roleCode).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
