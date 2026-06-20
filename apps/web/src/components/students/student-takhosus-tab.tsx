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
import { useEnrollmentByStudent, useSanadRecords } from "@/hooks/use-takhosus";

export function StudentTakhosusTab({ studentId }: { studentId: string }) {
  const { data: enrollments, isLoading: loadEnrollments } =
    useEnrollmentByStudent(studentId);
  const { data: sanadRecords, isLoading: loadSanads } = useSanadRecords({
    studentId,
    limit: 10,
  });

  if (loadEnrollments || loadSanads) {
    return (
      <div className="p-8 text-center animate-pulse">
        Memuat Data Takhosus...
      </div>
    );
  }

  const enrollmentList =
    (enrollments as any)?.data ||
    (Array.isArray(enrollments)
      ? enrollments
      : enrollments
        ? [enrollments]
        : []);
  const sanadList = sanadRecords?.data || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Halaqoh Takhosus</CardTitle>
          <CardDescription>Daftar halaqoh yang diikuti</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {enrollmentList.map((enr: any) => (
              <div
                key={enr.id}
                className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <h4 className="font-medium text-lg text-gray-900">
                    {enr.halaqoh?.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Program: {enr.halaqoh?.program}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Bergabung:{" "}
                    {safeFormat(new Date(enr.joinedAt), "dd MMM yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {enr.progressPercentage || 0}%
                  </div>
                  <Badge
                    variant={enr.status === "ACTIVE" ? "default" : "secondary"}
                  >
                    {enr.status}
                  </Badge>
                </div>
              </div>
            ))}
            {enrollmentList.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                Tidak mengikuti program takhosus apapun.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Ujian Sanad / Sertifikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sanadList.map((sanad: any) => (
              <div
                key={sanad.id}
                className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <h4 className="font-medium text-gray-900">Juz {sanad.juz}</h4>
                  <p className="text-sm text-gray-500">
                    Penguji: {sanad.teacher?.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {safeFormat(
                      new Date(sanad.certifiedAt || sanad.createdAt),
                      "dd MMM yyyy",
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{sanad.score}</div>
                  <Badge variant="outline">{sanad.grade}</Badge>
                </div>
              </div>
            ))}
            {sanadList.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                Belum ada riwayat sertifikasi sanad.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
