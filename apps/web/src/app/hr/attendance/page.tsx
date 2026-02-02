"use client";

import { MainLayout } from "@/components/layout";
import { StaffAttendanceView } from "./components/staff-attendance-view";

export default function StaffAttendancePage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Absensi Karyawan
          </h1>
          <p className="text-muted-foreground">
            Kelola kehadiran harian guru dan staf
          </p>
        </div>
        <StaffAttendanceView />
      </div>
    </MainLayout>
  );
}
