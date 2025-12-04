'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  FileText, 
  Download, 
  Eye,
  Calendar,
  TrendingUp,
  Award,
  BookOpen,
  Users,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Demo data
const DEMO_CHILDREN = [
  {
    id: 'child-1',
    nis: '2024001',
    name: 'Ahmad Fauzan',
    gender: 'MALE',
    photo: null,
    class: { id: 'cls-1', name: 'VII-A' },
    unit: { id: 'unit-1', name: 'SMP IT Al-Ikhlas' },
  },
  {
    id: 'child-2',
    nis: '2024050',
    name: 'Aisyah Putri',
    gender: 'FEMALE',
    photo: null,
    class: { id: 'cls-5', name: 'V-B' },
    unit: { id: 'unit-2', name: 'SD IT Al-Ikhlas' },
  },
];

const DEMO_REPORT_HISTORY = [
  {
    academicYearId: 'ay-2024-1',
    year: '2024/2025',
    semester: 1,
    averageScore: 82.5,
    rank: 5,
    reportCardId: 'rc-1',
    status: 'PUBLISHED',
  },
  {
    academicYearId: 'ay-2023-2',
    year: '2023/2024',
    semester: 2,
    averageScore: 80.2,
    rank: 7,
    reportCardId: 'rc-2',
    status: 'DOWNLOADED',
  },
  {
    academicYearId: 'ay-2023-1',
    year: '2023/2024',
    semester: 1,
    averageScore: 78.8,
    rank: 10,
    reportCardId: 'rc-3',
    status: 'DOWNLOADED',
  },
];

export default function ParentReportCardsPage() {
  const [selectedChild, setSelectedChild] = useState(DEMO_CHILDREN[0].id);
  const children = DEMO_CHILDREN;
  const reportHistory = DEMO_REPORT_HISTORY;

  const currentChild = children.find(c => c.id === selectedChild);
  const latestReport = reportHistory[0];

  const getScoreTrend = () => {
    if (reportHistory.length < 2) return 0;
    return reportHistory[0].averageScore - reportHistory[1].averageScore;
  };

  const getRankTrend = () => {
    if (reportHistory.length < 2 || !reportHistory[0].rank || !reportHistory[1].rank) return 0;
    return reportHistory[1].rank - reportHistory[0].rank; // Positive = improved (lower rank number)
  };

  const scoreTrend = getScoreTrend();
  const rankTrend = getRankTrend();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Rapor Siswa
          </h1>
          <p className="text-muted-foreground">
            Lihat dan unduh rapor anak Anda
          </p>
        </div>
        {children.length > 1 && (
          <div className="w-full lg:w-64">
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih anak" />
              </SelectTrigger>
              <SelectContent>
                {children.map(child => (
                  <SelectItem key={child.id} value={child.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{child.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Current Child Info */}
      {currentChild && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={currentChild.photo || undefined} />
                <AvatarFallback className="text-2xl">
                  {currentChild.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">{currentChild.name}</h2>
                <p className="text-muted-foreground font-mono">{currentChild.nis}</p>
                <div className="flex gap-2">
                  <Badge variant="secondary">{currentChild.class.name}</Badge>
                  <Badge variant="outline">{currentChild.unit.name}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {latestReport && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{latestReport.averageScore}</p>
                  <p className="text-sm text-muted-foreground">Rata-rata Nilai</p>
                </div>
              </div>
              {scoreTrend !== 0 && (
                <div className={`mt-2 flex items-center gap-1 text-sm ${scoreTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className={`h-4 w-4 ${scoreTrend < 0 ? 'rotate-180' : ''}`} />
                  <span>{scoreTrend > 0 ? '+' : ''}{scoreTrend.toFixed(1)} dari semester lalu</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/20">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">#{latestReport.rank}</p>
                  <p className="text-sm text-muted-foreground">Peringkat Kelas</p>
                </div>
              </div>
              {rankTrend !== 0 && (
                <div className={`mt-2 flex items-center gap-1 text-sm ${rankTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className={`h-4 w-4 ${rankTrend < 0 ? 'rotate-180' : ''}`} />
                  <span>{rankTrend > 0 ? 'Naik' : 'Turun'} {Math.abs(rankTrend)} peringkat</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Sem {latestReport.semester}</p>
                  <p className="text-sm text-muted-foreground">{latestReport.year}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reportHistory.length}</p>
                  <p className="text-sm text-muted-foreground">Rapor Tersedia</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Latest Report Card */}
      {latestReport && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Rapor Terbaru
                </CardTitle>
                <CardDescription>
                  Tahun Ajaran {latestReport.year} - Semester {latestReport.semester}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Link href={`/parent/report-cards/${latestReport.reportCardId}`}>
                  <Button>
                    <Eye className="h-4 w-4 mr-2" />
                    Lihat Detail
                  </Button>
                </Link>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Unduh PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Rata-rata Nilai</p>
                <p className="text-3xl font-bold mt-1">{latestReport.averageScore}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Peringkat</p>
                <p className="text-3xl font-bold mt-1">
                  {latestReport.rank ? `#${latestReport.rank}` : '-'}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="mt-2 bg-green-100 text-green-800">
                  {latestReport.status === 'PUBLISHED' ? 'Telah Diterbitkan' : 'Telah Diunduh'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Card History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Rapor</CardTitle>
          <CardDescription>
            Semua rapor yang tersedia untuk {currentChild?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportHistory.map((report, index) => (
              <div
                key={report.reportCardId}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  index === 0 ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${
                    index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        Semester {report.semester} - {report.year}
                      </p>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">Terbaru</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>Nilai: {report.averageScore}</span>
                      {report.rank && <span>Peringkat: #{report.rank}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={report.status === 'DOWNLOADED' ? 'outline' : 'default'}>
                    {report.status === 'DOWNLOADED' ? 'Sudah Diunduh' : 'Tersedia'}
                  </Badge>
                  <Link href={`/parent/report-cards/${report.reportCardId}`}>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Grafik Perkembangan Nilai
          </CardTitle>
          <CardDescription>
            Trend nilai rata-rata dari waktu ke waktu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Grafik perkembangan nilai</p>
              <p className="text-sm text-muted-foreground">(Integrasi chart akan ditambahkan)</p>
            </div>
          </div>
          {/* Simple visual representation */}
          <div className="mt-6 flex items-end justify-around h-40 px-4">
            {reportHistory.slice().reverse().map((report, idx) => (
              <div key={report.reportCardId} className="flex flex-col items-center gap-2">
                <div 
                  className="w-16 bg-primary rounded-t transition-all"
                  style={{ height: `${(report.averageScore / 100) * 120}px` }}
                />
                <div className="text-center">
                  <p className="text-sm font-medium">{report.averageScore}</p>
                  <p className="text-xs text-muted-foreground">Sem {report.semester}</p>
                  <p className="text-xs text-muted-foreground">{report.year.split('/')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-800">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">Informasi Penting</h3>
              <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>• Rapor akan tersedia setelah diterbitkan oleh pihak sekolah</li>
                <li>• Anda dapat mengunduh rapor dalam format PDF</li>
                <li>• Hubungi wali kelas jika ada pertanyaan mengenai nilai</li>
                <li>• Pengambilan rapor fisik akan diumumkan melalui pengumuman sekolah</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
