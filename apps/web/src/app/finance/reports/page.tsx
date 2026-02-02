"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, FileText, PieChart, Activity, DollarSign, BookOpen, Scale } from "lucide-react";
import Link from "next/link";

export default function FinanceReportsPage() {
  const reports = [
    {
      title: "Laporan Aktivitas",
      description: "Statement of Activities (ISAK 35) - Laporan pendapatan dan beban.",
      href: "/finance/reports/statement-of-activities",
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Laporan Posisi Keuangan",
      description: "Statement of Financial Position (ISAK 35) - Aset, Liabilitas, dan Aset Neto.",
      href: "/finance/reports/statement-of-financial-position",
      icon: Scale,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Laporan Arus Kas",
      description: "Cash Flow Statement - Laporan penerimaan dan pengeluaran kas.",
      href: "/finance/reports/cash-flow",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Realisasi Anggaran",
      description: "Budget Realization - Perbandingan anggaran dan realisasi.",
      href: "/finance/budgeting", // Linking to budgeting module main page or specific report if exists
      icon: PieChart,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Neraca Saldo",
      description: "Trial Balance - Daftar saldo akun.",
      href: "/finance/reports/trial-balance",
      icon: Scale,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Buku Besar",
      description: "General Ledger - Detail transaksi per akun.",
      href: "/finance/reports/general-ledger",
      icon: BookOpen,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Laporan Keuangan</h1>
        <p className="text-muted-foreground">
          Pusat laporan keuangan standar ISAK 35 dan manajemen anggaran.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Link key={report.href} href={report.href} className="block group">
            <Card className="h-full hover:shadow-md transition-all border-l-4" style={{ borderLeftColor: 'currentColor' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium group-hover:text-primary transition-colors">
                  {report.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${report.bgColor}`}>
                  <report.icon className={`h-5 w-5 ${report.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {report.description}
                </p>
                <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Lihat Laporan <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
