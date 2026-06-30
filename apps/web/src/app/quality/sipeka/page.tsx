"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SiPekaReportForm } from "@/components/quality/SiPekaReportForm";
import { useComplaints } from "@/hooks/use-complaints";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function SiPekaPage() {
  const { data: complaintsResponse } = useComplaints({ category: "FACILITY" });
  const recentReports = complaintsResponse?.data || [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Si-Peka</h1>
        <p className="text-muted-foreground text-lg">Sistem Pelaporan Kerusakan Fasilitas Yayasan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Buat Laporan Baru</CardTitle>
              <CardDescription>Laporkan fasilitas yang rusak atau membutuhkan perbaikan segera</CardDescription>
            </CardHeader>
            <CardContent>
              <SiPekaReportForm />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Laporan Saya</CardTitle>
              <CardDescription>Status perbaikan terkini</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentReports.map((report) => (
                  <div key={report.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm line-clamp-1">{report.subject}</h4>
                      <Badge variant={
                        report.status === "PENDING" ? "outline" :
                        report.status === "IN_PROGRESS" ? "secondary" : "default"
                      } className="text-[10px]">
                        {report.status}
                      </Badge>
                    </div>
                    <div className="flex items-center text-[10px] text-muted-foreground space-x-3">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(report.createdAt), 'dd MMM yyyy', { locale: id })}
                      </span>
                      {report.building && (
                        <span className="flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {report.building.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {recentReports.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Belum ada laporan kerusakan
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2" /> Komitmen Khidmat
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 opacity-90">
              <p>Tim Sarpras Cipansor berkomitmen untuk:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Respon awal dalam 1x24 jam</li>
                <li>Perbaikan darurat skala prioritas</li>
                <li>Transparansi proses perbaikan</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
