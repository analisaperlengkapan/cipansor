"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UniversityPlacementStats } from "@/components/alumni/UniversityPlacementStats";
import { useAlumni } from "@/hooks/use-alumni";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AlumniPlacementPage() {
  const { data: alumniResponse } = useAlumni({ limit: 100 });
  const alumni = alumniResponse?.data || [];

  // Mock education data as we haven't seeded the specific placements
  const placements = [
    { id: "1", alumni: { name: "Ahmad Fauzi", graduationYear: 2023 }, institution: "Universitas Indonesia", field: "Teknik Informatika", admissionPath: "SNBP", isInternational: false, scholarshipName: "KIP-K" },
    { id: "2", alumni: { name: "Siti Maryam", graduationYear: 2023 }, institution: "Al-Azhar University", field: "Ushuluddin", admissionPath: "Jalur Kemenag", isInternational: true, scholarshipName: "Full Scholarship" },
    { id: "3", alumni: { name: "Rizky Ramadhan", graduationYear: 2023 }, institution: "ITB", field: "Teknik Sipil", admissionPath: "SNBT", isInternational: false, scholarshipName: null },
    { id: "4", alumni: { name: "Nurul Hidayah", graduationYear: 2022 }, institution: "UGM", field: "Kedokteran", admissionPath: "Mandiri", isInternational: false, scholarshipName: "Beasiswa Daerah" },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Si-Taka</h1>
          <p className="text-muted-foreground">Tracking Alumni & Bursa Karir Cipansor</p>
        </div>
        <Badge variant="outline" className="mb-1">SMA Al-Qur'an Cipansor</Badge>
      </div>

      <UniversityPlacementStats data={placements} />

      <Card>
        <CardHeader>
          <CardTitle>Daftar Sebaran Alumni</CardTitle>
          <CardDescription>Detail penempatan universitas dan jalur masuk</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Alumni</TableHead>
                <TableHead>Angkatan</TableHead>
                <TableHead>Universitas</TableHead>
                <TableHead>Program Studi</TableHead>
                <TableHead>Jalur</TableHead>
                <TableHead>Beasiswa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placements.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.alumni.name}</TableCell>
                  <TableCell>{p.alumni.graduationYear}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {p.institution}
                      {p.isInternational && <Badge className="ml-2 bg-purple-500 text-[8px]">INTL</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{p.field}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.admissionPath}</Badge>
                  </TableCell>
                  <TableCell>
                    {p.scholarshipName ? (
                      <span className="text-xs text-green-600 font-medium">{p.scholarshipName}</span>
                    ) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
