import React from "react";
import { safeFormat } from "@/lib/date";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStudentKitabReport } from "@/hooks/use-kitab-progress";

export function StudentKitabTab({ studentId }: { studentId: string }) {
  const { data: report, isLoading } = useStudentKitabReport(studentId);

  if (isLoading) {
    return (
      <div className="p-8 text-center animate-pulse">
        Memuat Data Kajian Kitab...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center text-gray-500">
        Belum ada data progres kitab kuning.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kitab Selesai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {report.summary?.completed || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Buku Berjalan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {report.summary?.inProgress || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Rata-rata Nilai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {report.summary?.averageScore?.toFixed(1) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kajian Kitab</CardTitle>
          <CardDescription>
            Daftar kitab kuning yang dipelajari beserta progresnya
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.progresses?.map((prog: any) => (
              <div
                key={prog.id}
                className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="mb-2 md:mb-0">
                  <h4 className="font-medium text-lg text-gray-900">
                    {prog.kitab?.title}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {prog.kitab?.category} • Pengajar: {prog.teacher?.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Dimulai:{" "}
                    {prog.startedAt
                      ? safeFormat(new Date(prog.startedAt), "dd MMM yyyy")
                      : "-"}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="font-semibold">
                      {prog.currentPage || 0} / {prog.kitab?.totalPages || 0}{" "}
                      Hal
                    </p>
                    <p className="text-gray-500">
                      {prog.kitab?.totalPages
                        ? Math.round(
                            ((prog.currentPage || 0) / prog.kitab.totalPages) *
                              100,
                          )
                        : 0}
                      % Selesai
                    </p>
                  </div>
                  <Badge
                    variant={
                      prog.status === "COMPLETED" ? "default" : "secondary"
                    }
                  >
                    {prog.status === "COMPLETED" ? "Selesai" : "Berjalan"}
                  </Badge>
                </div>
              </div>
            ))}
            {(!report.progresses || report.progresses.length === 0) && (
              <p className="text-gray-500 text-center py-4">
                Tidak ada data kajian kitab
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
