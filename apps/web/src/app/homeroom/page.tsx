'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserCheck, 
  UserX,
  BookOpen, 
  ClipboardList,
  MessageCircle,
  Calendar,
  Gift,
  Award,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Clock,
  Phone,
  Mail,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Demo data
const DEMO_CLASS = {
  id: 'cls-1',
  name: 'VII-A',
  grade: 7,
  academicYear: {
    id: 'ay-1',
    year: '2024/2025',
    semester: 1,
  },
  unit: {
    id: 'unit-1',
    name: 'SMP IT Al-Ikhlas',
    type: 'SMP_IT',
  },
  homeroomTeacher: {
    id: 'teacher-1',
    name: 'Ustadzah Fatimah, S.Pd',
    nip: '198507152010012001',
    email: 'fatimah@smpit.sch.id',
    phone: '081234567890',
  },
  studentCount: 28,
};

const DEMO_SUMMARY = {
  totalStudents: 28,
  maleCount: 15,
  femaleCount: 13,
  averageAttendance: 94.5,
  averageAcademicScore: 81.2,
  pendingBehaviorNotes: 3,
  upcomingBirthdays: [
    {
      student: { id: 's1', name: 'Ahmad Fauzan', nis: '2024001' },
      daysUntil: 2,
    },
    {
      student: { id: 's2', name: 'Aisyah Putri', nis: '2024002' },
      daysUntil: 5,
    },
  ],
  recentAchievements: [
    {
      id: 'n1',
      studentId: 's3',
      student: { name: 'Muhammad Rizki' },
      type: 'ACHIEVEMENT',
      category: 'Akademik',
      description: 'Juara 1 Olimpiade Matematika Tingkat Kota',
      date: '2024-01-20',
      points: 50,
    },
    {
      id: 'n2',
      studentId: 's4',
      student: { name: 'Zahra Amelia' },
      type: 'ACHIEVEMENT',
      category: 'Tahfidz',
      description: 'Selesai hafalan Juz 30',
      date: '2024-01-18',
      points: 100,
    },
  ],
  recentViolations: [
    {
      id: 'n3',
      studentId: 's5',
      student: { name: 'Dimas Pratama' },
      type: 'VIOLATION',
      category: 'Kedisiplinan',
      description: 'Terlambat 3 kali dalam 1 minggu',
      date: '2024-01-22',
      points: -10,
      resolved: false,
    },
  ],
};

const DEMO_STUDENTS = [
  { id: 's1', nis: '2024001', name: 'Ahmad Fauzan', gender: 'MALE', attendanceRate: 98, avgScore: 85.5, status: 'up' },
  { id: 's2', nis: '2024002', name: 'Aisyah Putri', gender: 'FEMALE', attendanceRate: 100, avgScore: 92.0, status: 'up' },
  { id: 's3', nis: '2024003', name: 'Muhammad Rizki', gender: 'MALE', attendanceRate: 95, avgScore: 88.5, status: 'stable' },
  { id: 's4', nis: '2024004', name: 'Zahra Amelia', gender: 'FEMALE', attendanceRate: 97, avgScore: 90.5, status: 'up' },
  { id: 's5', nis: '2024005', name: 'Dimas Pratama', gender: 'MALE', attendanceRate: 85, avgScore: 72.0, status: 'down' },
  { id: 's6', nis: '2024006', name: 'Nur Hidayah', gender: 'FEMALE', attendanceRate: 100, avgScore: 95.0, status: 'up' },
  { id: 's7', nis: '2024007', name: 'Farel Aditya', gender: 'MALE', attendanceRate: 92, avgScore: 78.5, status: 'stable' },
  { id: 's8', nis: '2024008', name: 'Siti Rahmawati', gender: 'FEMALE', attendanceRate: 96, avgScore: 86.0, status: 'up' },
];

const TODAY_ATTENDANCE = {
  present: 25,
  absent: 1,
  sick: 1,
  permitted: 1,
  late: 0,
};

export default function HomeroomDashboardPage() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const classData = DEMO_CLASS;
  const summary = DEMO_SUMMARY;
  const students = DEMO_STUDENTS;
  const todayAttendance = TODAY_ATTENDANCE;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 65) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {classData.name}
            </Badge>
            <Badge variant="outline">{classData.unit.name}</Badge>
          </div>
          <h1 className="text-3xl font-bold">Dashboard Wali Kelas</h1>
          <p className="text-muted-foreground">
            Tahun Ajaran {classData.academicYear.year} - Semester {classData.academicYear.semester}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/homeroom/attendance">
            <Button>
              <ClipboardList className="h-4 w-4 mr-2" />
              Absensi Cepat
            </Button>
          </Link>
          <Link href="/homeroom/behavior">
            <Button variant="outline">
              <BookOpen className="h-4 w-4 mr-2" />
              Catatan Perilaku
            </Button>
          </Link>
          <Link href="/homeroom/messages">
            <Button variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Pesan Wali
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{summary.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  L: {summary.maleCount} | P: {summary.femaleCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kehadiran Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{todayAttendance.present}/{summary.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  S: {todayAttendance.sick} | I: {todayAttendance.permitted} | A: {todayAttendance.absent}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{summary.averageAttendance}%</div>
                <Progress value={summary.averageAttendance} className="h-2 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Nilai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-amber-500" />
              <div>
                <div className="text-2xl font-bold">{summary.averageAcademicScore}</div>
                <Progress value={summary.averageAcademicScore} className="h-2 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Catatan Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{summary.pendingBehaviorNotes}</div>
                <p className="text-xs text-muted-foreground">Perlu tindak lanjut</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
          <TabsTrigger value="students">Daftar Siswa</TabsTrigger>
          <TabsTrigger value="achievements">Prestasi & Pelanggaran</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upcoming Birthdays */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-pink-500" />
                  Ulang Tahun Terdekat
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.upcomingBirthdays.length > 0 ? (
                  <div className="space-y-3">
                    {summary.upcomingBirthdays.map((item) => (
                      <div key={item.student.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{item.student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{item.student.name}</p>
                            <p className="text-sm text-muted-foreground">NIS: {item.student.nis}</p>
                          </div>
                        </div>
                        <Badge variant={item.daysUntil <= 3 ? 'default' : 'secondary'}>
                          {item.daysUntil === 0 ? 'Hari ini!' : `${item.daysUntil} hari lagi`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Tidak ada ulang tahun dalam waktu dekat
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Today's Attendance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" />
                  Kehadiran Hari Ini
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <UserCheck className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-green-600">{todayAttendance.present}</div>
                    <p className="text-xs text-muted-foreground">Hadir</p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                    <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-yellow-600">{todayAttendance.late}</div>
                    <p className="text-xs text-muted-foreground">Telat</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <UserX className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-blue-600">{todayAttendance.sick}</div>
                    <p className="text-xs text-muted-foreground">Sakit</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <UserX className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-purple-600">{todayAttendance.permitted}</div>
                    <p className="text-xs text-muted-foreground">Izin</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20">
                    <UserX className="h-6 w-6 text-red-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-red-600">{todayAttendance.absent}</div>
                    <p className="text-xs text-muted-foreground">Alpha</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/homeroom/attendance">
                    <Button variant="outline" className="w-full">
                      Input Absensi
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Prestasi Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.recentAchievements.length > 0 ? (
                  <div className="space-y-3">
                    {summary.recentAchievements.map((achievement: {
                      id: string;
                      student: { name: string };
                      category: string;
                      description: string;
                      date: string;
                      points?: number;
                    }) => (
                      <div key={achievement.id} className="p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-green-800 dark:text-green-200">{achievement.student.name}</p>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {achievement.category} • {new Date(achievement.date).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          {achievement.points && (
                            <Badge className="bg-green-600">+{achievement.points} poin</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Belum ada prestasi tercatat
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Violations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Pelanggaran Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.recentViolations.length > 0 ? (
                  <div className="space-y-3">
                    {summary.recentViolations.map((violation: {
                      id: string;
                      student: { name: string };
                      category: string;
                      description: string;
                      date: string;
                      points?: number;
                      resolved: boolean;
                    }) => (
                      <div key={violation.id} className="p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-red-800 dark:text-red-200">{violation.student.name}</p>
                            <p className="text-sm text-muted-foreground">{violation.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {violation.category} • {new Date(violation.date).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {violation.points && (
                              <Badge variant="destructive">{violation.points} poin</Badge>
                            )}
                            {!violation.resolved && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                Belum diselesaikan
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Tidak ada pelanggaran tercatat
                  </p>
                )}
                <div className="mt-4">
                  <Link href="/homeroom/behavior">
                    <Button variant="outline" className="w-full">
                      Lihat Semua Catatan
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Siswa Kelas {classData.name}</CardTitle>
              <CardDescription>
                Total {summary.totalStudents} siswa (L: {summary.maleCount}, P: {summary.femaleCount})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">No</th>
                      <th className="text-left py-3 px-2">NIS</th>
                      <th className="text-left py-3 px-2">Nama Siswa</th>
                      <th className="text-center py-3 px-2">L/P</th>
                      <th className="text-center py-3 px-2">Kehadiran</th>
                      <th className="text-center py-3 px-2">Rata-rata Nilai</th>
                      <th className="text-center py-3 px-2">Trend</th>
                      <th className="text-center py-3 px-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">{index + 1}</td>
                        <td className="py-3 px-2 font-mono text-sm">{student.nis}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant={student.gender === 'MALE' ? 'default' : 'secondary'}>
                            {student.gender === 'MALE' ? 'L' : 'P'}
                          </Badge>
                        </td>
                        <td className={`py-3 px-2 text-center font-medium ${getAttendanceColor(student.attendanceRate)}`}>
                          {student.attendanceRate}%
                        </td>
                        <td className={`py-3 px-2 text-center font-medium ${getScoreColor(student.avgScore)}`}>
                          {student.avgScore.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {getStatusIcon(student.status)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Link href={`/homeroom/students/${student.id}`}>
                              <Button variant="ghost" size="icon" title="Detail">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`tel:081234567890`}>
                              <Button variant="ghost" size="icon" title="Hubungi Wali">
                                <Phone className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/homeroom/messages/new?studentId=${student.id}`}>
                              <Button variant="ghost" size="icon" title="Kirim Pesan">
                                <Mail className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Achievements List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Award className="h-5 w-5" />
                  Daftar Prestasi
                </CardTitle>
                <CardDescription>Semester ini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Muhammad Rizki', category: 'Akademik', desc: 'Juara 1 Olimpiade Matematika', points: 50, date: '20 Jan 2024' },
                    { name: 'Zahra Amelia', category: 'Tahfidz', desc: 'Selesai hafalan Juz 30', points: 100, date: '18 Jan 2024' },
                    { name: 'Nur Hidayah', category: 'Akademik', desc: 'Ranking 1 Kelas', points: 30, date: '15 Jan 2024' },
                    { name: 'Aisyah Putri', category: 'Seni', desc: 'Juara 2 Lomba Kaligrafi', points: 40, date: '10 Jan 2024' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                          <Award className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                          <p className="text-xs text-muted-foreground">{item.category} • {item.date}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-600">+{item.points}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Violations List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Daftar Pelanggaran
                </CardTitle>
                <CardDescription>Semester ini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Dimas Pratama', category: 'Kedisiplinan', desc: 'Terlambat 3 kali dalam 1 minggu', points: -10, date: '22 Jan 2024', resolved: false },
                    { name: 'Farel Aditya', category: 'Kedisiplinan', desc: 'Tidak mengerjakan PR', points: -5, date: '19 Jan 2024', resolved: true },
                    { name: 'Ahmad Fauzan', category: 'Perilaku', desc: 'Bermain saat jam pelajaran', points: -5, date: '12 Jan 2024', resolved: true },
                  ].map((item, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${item.resolved ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${item.resolved ? 'bg-gray-100 dark:bg-gray-800' : 'bg-red-100 dark:bg-red-800'}`}>
                          <AlertTriangle className={`h-5 w-5 ${item.resolved ? 'text-gray-500' : 'text-red-600'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                          <p className="text-xs text-muted-foreground">{item.category} • {item.date}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="destructive">{item.points}</Badge>
                        {item.resolved ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">Selesai</Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
