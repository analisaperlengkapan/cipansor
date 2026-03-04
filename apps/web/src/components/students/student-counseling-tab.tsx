"use client";

import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Plus,
  MessageSquare,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useStudentCounselingHistory,
  getCounselingCategoryConfig,
  getCounselingStatusConfig,
} from "@/hooks/use-counseling";

interface StudentCounselingTabProps {
  studentId: string;
}

export function StudentCounselingTab({ studentId }: StudentCounselingTabProps) {
  const { data: records, isLoading } = useStudentCounselingHistory(studentId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Belum Ada Riwayat Konseling</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Siswa ini belum memiliki catatan bimbingan konseling.
          </p>
          <Button asChild>
            <Link href="/counseling/new">
              <Plus className="h-4 w-4 mr-2" />
              Buat Catatan Baru
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Riwayat Bimbingan & Konseling</h3>
          <p className="text-sm text-muted-foreground">
            Daftar sesi konseling yang pernah dilakukan
          </p>
        </div>
        <Button asChild>
          <Link href="/counseling/new">
            <Plus className="h-4 w-4 mr-2" />
            Catatan Baru
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Konselor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const catConfig = getCounselingCategoryConfig(record.category);
                const statusConfig = getCounselingStatusConfig(record.status);

                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(new Date(record.scheduledAt), "dd MMM yyyy", {
                        locale: localeId,
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {record.title}
                      {record.isConfidential && (
                        <span title="Rahasia" className="ml-2 text-xs">🔒</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{catConfig?.icon}</span>
                        <span>{catConfig?.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>{record.counselor?.user?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig?.color}>
                        {statusConfig?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/counseling/${record.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
