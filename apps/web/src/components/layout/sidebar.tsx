"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  getNavigationForRole,
  getNavigationForRoleCode,
  type NavGroup,
} from "@/config/navigation";
import { useAuthStore } from "@/stores/auth";
import { useI18n } from "@/providers/i18n-provider";
import { ChevronLeft, LogOut } from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

interface UserRole {
  id: string;
  isPrimary: boolean;
  role: {
    id: string;
    code: string;
    name: string;
    realm: string;
  };
  unit?: {
    id: string;
    name: string;
  } | null;
}

// Realm colors for badges
const realmColors: Record<string, string> = {
  GLOBAL: "bg-purple-500",
  YAYASAN: "bg-amber-500",
  TK: "bg-pink-500",
  SD_IT: "bg-green-500",
  SMP_IT: "bg-blue-500",
  SMA_ALQURAN: "bg-emerald-500",
};

// Sidebar static translation mapping function
function translateSidebarKey(title: string, t: (key: string, fallback?: string) => string): string {
  const titleMap: Record<string, string> = {
    // Groups
    "Overview": "sidebar.overview",
    "Mengajar": "sidebar.mengajar",
    "Wali Kelas": "sidebar.waliKelas",
    "Pesantren": "sidebar.pesantren",
    "PKG": "sidebar.pkg",
    "Informasi": "sidebar.informasi",
    "Layanan Siswa": "sidebar.layananSiswa",
    "Administrasi": "sidebar.administrasi",
    "Hafalan": "sidebar.hafalan",
    "Akademik": "sidebar.academic",
    "Kegiatan": "sidebar.kegiatan",
    "Anak Saya": "sidebar.anakSaya",
    "Kesiswaan": "sidebar.kesiswaan",
    "Keuangan": "sidebar.keuangan",
    "Yayasan": "sidebar.yayasan",
    "Risk Management": "sidebar.riskManagement",
    "Management": "sidebar.management",
    "Academic": "sidebar.academic",
    "Boarding": "sidebar.boarding",
    "Administration": "sidebar.administration",
    "Operations": "sidebar.operations",
    "Reference Data": "sidebar.referenceData",
    "Compliance": "sidebar.compliance",
    "Alumni": "sidebar.alumni",

    // Items
    "Dashboard": "sidebar.dashboard_item",
    "Analytics": "sidebar.analytics",
    "Reports": "sidebar.reports",
    "Tahfidz": "sidebar.tahfidz",
    "Kelas Saya": "sidebar.classes",
    "Siswa": "sidebar.students",
    "Absensi": "sidebar.attendance",
    "Mutabaah Yaumiyah": "sidebar.dailyReport",
    "Portfolio Siswa": "sidebar.portfolio",
    "Dashboard Wali Kelas": "sidebar.homeroomDashboard",
    "Absensi Harian": "sidebar.homeroomAttendance",
    "Catatan Perilaku": "sidebar.homeroomBehavior",
    "Pesan Orang Tua": "sidebar.homeroomMessages",
    "Jurnal Ibadah": "sidebar.ibadah",
    "Muhadhoroh": "sidebar.muhadhoroh",
    "Muhadatsah": "sidebar.muhadatsah",
    "Kitab Kuning": "sidebar.kitabKuning",
    "Penilaian Kinerja": "sidebar.pkgEvaluation",
    "Pengumuman": "sidebar.announcements",
    "Aduan & Aspirasi": "sidebar.complaints",
    "Data Siswa": "sidebar.students",
    "Kesehatan": "sidebar.health",
    "Perizinan": "sidebar.permits",
    "Pelanggaran": "sidebar.violations",
    "Penghargaan": "sidebar.rewards",
    "Kampus Hijau": "sidebar.greenCampus",
    "Hafalan Saya": "sidebar.myHafalan",
    "Ujian Online": "sidebar.exams",
    "Portfolio Saya": "sidebar.myPortfolio",
    "Prestasi Ibadah": "sidebar.achievements",
    "Muhasabah Harian": "sidebar.myMuhasabah",
    "Jadwal": "sidebar.schedule",
    "Data Anak": "sidebar.myData",
    "Raport": "sidebar.reportCards",
    "Portfolio Anak": "sidebar.childPortfolio",
    "Laporan Harian": "sidebar.childDailyReport",
    "Tagihan & Pembayaran": "sidebar.billingAndPayments",
    "Foundation": "sidebar.foundation",
    "Units": "sidebar.units",
    "Board Members": "sidebar.boardMembers",
    "Penjaminan Mutu": "sidebar.qualityAssurance",
    "Laporan Keuangan": "sidebar.financialReports",
    "Billing & Pembayaran": "sidebar.billing",
    "Verifikasi Pembayaran": "sidebar.verification",
    "BOS/BOP": "sidebar.bosBop",
    "Procurement": "sidebar.procurement",
    "Donation/ZIS": "sidebar.donationZis",
    "Public Portal": "sidebar.publicPortal",
    "Data Alumni": "sidebar.alumniData",
    "Manajemen Risiko": "sidebar.riskMan",
    "EMIS Kemenag": "sidebar.emisKemenag",
    "Campaigns": "sidebar.campaigns",
    "Leads": "sidebar.leads",
    "Users & Roles": "sidebar.usersRoles",
    "Role Permissions": "sidebar.rolePermissions",
    "Student ID Card": "sidebar.studentIdCard",
    "Certificates": "sidebar.certificates",
    "Transcript": "sidebar.transcript",
    "Classes": "sidebar.classes",
    "Academic Years": "sidebar.academicYears",
    "Curriculum": "sidebar.curriculum",
    "Timetable": "sidebar.timetable",
    "Assessment": "sidebar.assessment",
    "Question Banks (CBT)": "sidebar.cbtBanks",
    "Raport Merdeka": "sidebar.raportMerdeka",
    "Attendance Calendar": "sidebar.attendanceCalendar",
    "Academic Calendar": "sidebar.academicCalendar",
    "E-Simaan": "sidebar.eSimaan",
    "Peta Al-Quran": "sidebar.quranMap",
    "Ekstrakurikuler": "sidebar.extracurricular",
    "Bimbingan Konseling": "sidebar.counseling",
    "Piket Santri": "sidebar.dutyRoster",
    "Amaliyah Tadris": "sidebar.amaliyahTadris",
    "Qiyadah (Organisasi)": "sidebar.qiyadah",
    "Turats Lab": "sidebar.turatsLab",
    "Takhosus": "sidebar.takhosus",
    "Muhasabah": "sidebar.muhasabah",
    "Dormitories": "sidebar.dormitories",
    "Accounting": "sidebar.accounting",
    "Scholarships": "sidebar.scholarships",
    "Admissions": "sidebar.admissions",
    "HR": "sidebar.hr",
    "Staff Attendance": "sidebar.staffAttendance",
    "PKG Guru": "sidebar.pkgGuru",
    "Facilities": "sidebar.facilities",
    "E-Office (Persuratan)": "sidebar.eOffice",
    "Inventory (Asset)": "sidebar.inventory",
    "Library": "sidebar.library",
    "Maktabah Digital": "sidebar.digitalLibrary",
    "Health (UKS)": "sidebar.healthUks",
    "Meals": "sidebar.meals",
    "Canteen/Koperasi": "sidebar.canteen",
    "Laundry": "sidebar.laundry",
    "Reception": "sidebar.reception",
    "Dompet Santri": "sidebar.wallet",
    "Quick Send": "sidebar.quickSend",
    "Wilayah": "sidebar.wilayah",
    "Kurikulum Merdeka": "sidebar.kurikulumMerdeka",
    "Student Compliance": "sidebar.studentCompliance",
    "Teacher Compliance": "sidebar.teacherCompliance",
    "Si-Taka (Sebaran)": "sidebar.placement",
    "Secrets": "sidebar.secrets"
  };

  const key = titleMap[title];
  if (key) {
    return t(key);
  }
  return title;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { t } = useI18n();

  if (typeof window !== "undefined") {
    console.log("Sidebar rendering, user:", JSON.stringify(user));
  }

  // Get active role from userRoles
  const userRoles = user?.userRoles as UserRole[] | undefined;
  const activeRole = userRoles?.find((r) => r.isPrimary) || userRoles?.[0];

  // Get navigation based on active role code or fallback to legacy role
  const navigation = activeRole
    ? getNavigationForRoleCode(activeRole.role.code)
    : user
      ? getNavigationForRole(user.role)
      : [];

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r sidebar-gradient transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              C
            </div>
            <span className="font-semibold">Cipansor</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            C
          </div>
        )}
        {onToggle && !collapsed && (
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        {navigation.map((group, index) => (
          <NavGroupComponent
            key={group.title}
            group={group}
            pathname={pathname}
            collapsed={collapsed}
            showSeparator={index > 0}
          />
        ))}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        {!collapsed && user && (
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{user.name}</p>
              {activeRole && (
                <div className="flex items-center gap-1">
                  <Badge
                    className={cn(
                      "text-[10px] px-1 py-0 text-white",
                      realmColors[activeRole.role.realm],
                    )}
                  >
                    {activeRole.role.realm.replace("_", " ")}
                  </Badge>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeRole.role.name}
                  </span>
                </div>
              )}
              {!activeRole && (
                <p className="truncate text-xs text-muted-foreground">
                  {user.role}
                </p>
              )}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            collapsed && "justify-center px-2",
          )}
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">{t("common.logout")}</span>}
        </Button>
      </div>
    </div>
  );
}

interface NavGroupComponentProps {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
  showSeparator: boolean;
}

function NavGroupComponent({
  group,
  pathname,
  collapsed,
  showSeparator,
}: NavGroupComponentProps) {
  const { t } = useI18n();
  return (
    <div className="mb-4">
      {showSeparator && <Separator className="mb-4" />}
      {!collapsed && (
        <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {translateSidebarKey(group.title, t)}
        </h4>
      )}
      <nav className="space-y-1">
        {group.items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all duration-200 hover:translate-x-1",
                  isActive && "active-glow bg-secondary/80 font-medium",
                  collapsed && "justify-center px-2 hover:translate-x-0",
                )}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && <span className="ml-2">{translateSidebarKey(item.title, t)}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
