"use client";

import React from "react";
import { MainLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlumniPlacements } from "@/hooks/use-alumni";
import { GraduationCap, Globe, Award, Building2 } from "lucide-react";

export default function AlumniPlacementPage() {
  const { data, isLoading } = useAlumniPlacements();
  const placements = data?.placements || [];
  const stats = data?.stats;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Si-Taka — Sebaran Alumni
          </h1>
          <p className="text-muted-foreground">
            Pelacakan penempatan universitas, jalur masuk, dan beasiswa alumni
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Penempatan
                  </CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Luar Negeri
                  </CardTitle>
                  <Globe className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.internationalCount ?? 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Penerima Beasiswa
                  </CardTitle>
                  <Award className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.scholarshipCount ?? 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Kampus Terbanyak
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className="text-sm font-bold truncate"
                    title={stats?.topInstitutions?.[0]?.institution}
                  >
                    {stats?.topInstitutions?.[0]?.institution ?? "-"}
                  </div>
                  {stats?.topInstitutions?.[0] && (
                    <p className="text-xs text-muted-foreground">
                      {stats.topInstitutions[0].count} alumni
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {stats && stats.byPath.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Jalur Masuk</CardTitle>
                  <CardDescription>
                    Distribusi jalur penerimaan (SNBP/SNBT/Mandiri/dll.)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {stats.byPath.map((p) => (
                      <Badge key={p.path} variant="secondary">
                        {p.path}: {p.count}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Daftar Penempatan</CardTitle>
                <CardDescription>
                  Data riwayat pendidikan alumni — kelola dari profil alumni
                  masing-masing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {placements.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">
                    Belum ada data penempatan. Tambahkan riwayat pendidikan
                    (beserta jalur masuk/beasiswa) di halaman detail alumni.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Alumni</TableHead>
                        <TableHead>Angkatan</TableHead>
                        <TableHead>Institusi</TableHead>
                        <TableHead>Bidang</TableHead>
                        <TableHead>Jalur</TableHead>
                        <TableHead>Beasiswa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {placements.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.alumni?.name}
                          </TableCell>
                          <TableCell>{p.alumni?.graduationYear}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              {p.institution}
                              {p.isInternational && (
                                <Globe className="h-3 w-3 text-blue-600" />
                              )}
                            </span>
                          </TableCell>
                          <TableCell>{p.field}</TableCell>
                          <TableCell>
                            {p.admissionPath ? (
                              <Badge variant="outline">{p.admissionPath}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>{p.scholarshipName || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
