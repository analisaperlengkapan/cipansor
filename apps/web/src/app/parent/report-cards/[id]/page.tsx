'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  Printer,
  FileText,
  BookOpen,
  Calendar,
  Award,
  MessageCircle,
  User,
  CheckCircle,
  Activity,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Demo data
const DEMO_REPORT_CARD = {
  id: 'rc-1',
  studentId: 'child-1',
  student: {
    id: 'child-1',
    nis: '2024001',
    name: 'Ahmad Fauzan',
    gender: 'MALE',
    birthPlace: 'Jakarta',
    birthDate: '2011-05-15',
    class: { id: 'cls-1', name: 'VII-A', grade: 7 },
  },
  academicYearId: 'ay-2024-1',
  academicYear: { id: 'ay-2024-1', year: '2024/2025', semester: 1 },
  unitId: 'unit-1',
  unit: { id: 'unit-1', name: 'SMP IT Al-Ikhlas', type: 'SMP_IT', address: 'Jl. Pendidikan No. 1, Bogor' },
  grades: [
    // Kelompok A - Mata Pelajaran Umum
    { subjectId: 's1', subjectName: 'Pendidikan Agama Islam', category: 'RELIGIOUS', knowledgeScore: 88, skillScore: 85, averageScore: 86.5, grade: 'A', predicate: 'Sangat Baik', description: 'Peserta didik sangat baik dalam memahami materi PAI' },
    { subjectId: 's2', subjectName: 'PPKn', category: 'ACADEMIC', knowledgeScore: 82, skillScore: 80, averageScore: 81, grade: 'B+', predicate: 'Baik', description: 'Peserta didik baik dalam memahami konsep kewarganegaraan' },
    { subjectId: 's3', subjectName: 'Bahasa Indonesia', category: 'ACADEMIC', knowledgeScore: 85, skillScore: 88, averageScore: 86.5, grade: 'A', predicate: 'Sangat Baik', description: 'Peserta didik sangat baik dalam berbahasa Indonesia' },
    { subjectId: 's4', subjectName: 'Matematika', category: 'ACADEMIC', knowledgeScore: 85, skillScore: 82, averageScore: 83.5, grade: 'A-', predicate: 'Sangat Baik', description: 'Peserta didik sangat baik dalam kemampuan matematika' },
    { subjectId: 's5', subjectName: 'IPA', category: 'ACADEMIC', knowledgeScore: 82, skillScore: 80, averageScore: 81, grade: 'B+', predicate: 'Baik', description: 'Peserta didik baik dalam memahami konsep IPA' },
    { subjectId: 's6', subjectName: 'IPS', category: 'ACADEMIC', knowledgeScore: 80, skillScore: 78, averageScore: 79, grade: 'B', predicate: 'Baik', description: 'Peserta didik baik dalam memahami ilmu sosial' },
    { subjectId: 's7', subjectName: 'Bahasa Inggris', category: 'ACADEMIC', knowledgeScore: 82, skillScore: 85, averageScore: 83.5, grade: 'A-', predicate: 'Sangat Baik', description: 'Peserta didik sangat baik dalam berbahasa Inggris' },
    // Kelompok B - Mata Pelajaran Lokal/Muatan Lokal
    { subjectId: 's8', subjectName: 'Bahasa Arab', category: 'LOCAL', knowledgeScore: 78, skillScore: 80, averageScore: 79, grade: 'B', predicate: 'Baik', description: 'Peserta didik baik dalam berbahasa Arab' },
    { subjectId: 's9', subjectName: 'Seni Budaya', category: 'LOCAL', knowledgeScore: 80, skillScore: 85, averageScore: 82.5, grade: 'B+', predicate: 'Baik', description: 'Peserta didik baik dalam seni budaya' },
    { subjectId: 's10', subjectName: 'PJOK', category: 'LOCAL', knowledgeScore: 85, skillScore: 90, averageScore: 87.5, grade: 'A', predicate: 'Sangat Baik', description: 'Peserta didik sangat baik dalam olahraga' },
    { subjectId: 's11', subjectName: 'Prakarya', category: 'VOCATIONAL', knowledgeScore: 80, skillScore: 82, averageScore: 81, grade: 'B+', predicate: 'Baik', description: 'Peserta didik baik dalam prakarya' },
    // Kelompok C - Mata Pelajaran Keagamaan
    { subjectId: 's12', subjectName: 'Al-Quran Hadits', category: 'RELIGIOUS', knowledgeScore: 88, skillScore: 90, averageScore: 89, grade: 'A', predicate: 'Sangat Baik', description: 'Peserta didik sangat baik dalam Al-Quran Hadits' },
    { subjectId: 's13', subjectName: 'Aqidah Akhlak', category: 'RELIGIOUS', knowledgeScore: 85, skillScore: 88, averageScore: 86.5, grade: 'A', predicate: 'Sangat Baik', description: 'Peserta didik sangat baik dalam aqidah akhlak' },
    { subjectId: 's14', subjectName: 'Fiqih', category: 'RELIGIOUS', knowledgeScore: 82, skillScore: 80, averageScore: 81, grade: 'B+', predicate: 'Baik', description: 'Peserta didik baik dalam fiqih' },
    { subjectId: 's15', subjectName: 'SKI', category: 'RELIGIOUS', knowledgeScore: 80, skillScore: 78, averageScore: 79, grade: 'B', predicate: 'Baik', description: 'Peserta didik baik dalam sejarah kebudayaan Islam' },
  ],
  extracurricularGrades: [
    { extracurricularId: 'e1', extracurricularName: 'Pramuka', predicate: 'A', description: 'Sangat aktif dan berprestasi', achievement: 'Tanda Kecakapan Umum (TKU)' },
    { extracurricularId: 'e2', extracurricularName: 'Hadroh', predicate: 'B', description: 'Aktif dalam kegiatan hadroh', achievement: null },
    { extracurricularId: 'e3', extracurricularName: 'Futsal', predicate: 'A', description: 'Tim inti, sangat berkontribusi', achievement: 'Juara 2 Turnamen Futsal Antar Sekolah' },
  ],
  attendance: {
    sick: 2,
    permitted: 2,
    absent: 1,
    totalDays: 120,
    attendanceRate: 95.8,
  },
  tahfidzProgress: {
    memorizedJuz: 2,
    targetJuz: 30,
    currentSurah: 'Al-Mulk',
    currentAyat: 15,
    grade: 'Jayyid Jiddan',
    notes: 'Hafalan lancar dan tartil baik. Perlu tingkatkan muraja\'ah.',
  },
  characterAssessment: [
    { characterId: 'c1', characterName: 'Beriman & Bertaqwa', category: 'Spiritual', predicate: 'SB', description: 'Sangat baik dalam menjalankan ibadah' },
    { characterId: 'c2', characterName: 'Jujur', category: 'Moral', predicate: 'B', description: 'Baik dalam berperilaku jujur' },
    { characterId: 'c3', characterName: 'Disiplin', category: 'Moral', predicate: 'B', description: 'Baik dalam kedisiplinan' },
    { characterId: 'c4', characterName: 'Tanggung Jawab', category: 'Moral', predicate: 'SB', description: 'Sangat baik dalam tanggung jawab' },
    { characterId: 'c5', characterName: 'Gotong Royong', category: 'Sosial', predicate: 'SB', description: 'Sangat baik dalam kerja sama' },
    { characterId: 'c6', characterName: 'Percaya Diri', category: 'Personal', predicate: 'B', description: 'Baik dalam kepercayaan diri' },
  ],
  teacherNotes: 'Ahmad adalah siswa yang rajin dan memiliki semangat belajar tinggi. Prestasinya dalam bidang tahfidz dan olahraga sangat membanggakan. Perlu ditingkatkan dalam partisipasi diskusi kelas.',
  homeroomTeacher: {
    id: 't1',
    name: 'Ustadzah Fatimah, S.Pd',
    nip: '198507152010012001',
  },
  headmasterNotes: 'Pertahankan prestasi dan tingkatkan semangat belajar. Semoga sukses di semester berikutnya.',
  headmaster: {
    id: 'h1',
    name: 'Ustadz Dr. H. Abdullah, M.Pd.I',
    nip: '197503151998031001',
  },
  averageScore: 82.5,
  rank: 5,
  totalStudents: 28,
  status: 'PUBLISHED',
  publishedAt: '2024-01-15T08:00:00',
  createdAt: '2024-01-10T10:00:00',
};

type PredicateType = 'SB' | 'B' | 'C' | 'K';

const PREDICATE_COLORS: Record<PredicateType, string> = {
  SB: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-yellow-100 text-yellow-800',
  K: 'bg-red-100 text-red-800',
};

const PREDICATE_LABELS: Record<PredicateType, string> = {
  SB: 'Sangat Baik',
  B: 'Baik',
  C: 'Cukup',
  K: 'Kurang',
};

export default function ReportCardDetailPage() {
  const params = useParams();
  const reportCardId = params.id;
  const [activeTab, setActiveTab] = useState('grades');
  const reportCard = DEMO_REPORT_CARD;

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 font-bold';
    if (grade.startsWith('B')) return 'text-blue-600 font-semibold';
    if (grade.startsWith('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleDownload = () => {
    toast.success('Rapor akan diunduh dalam format PDF');
  };

  const handlePrint = () => {
    window.print();
  };

  const categorizedGrades = {
    RELIGIOUS: reportCard.grades.filter(g => g.category === 'RELIGIOUS'),
    ACADEMIC: reportCard.grades.filter(g => g.category === 'ACADEMIC'),
    LOCAL: reportCard.grades.filter(g => g.category === 'LOCAL'),
    VOCATIONAL: reportCard.grades.filter(g => g.category === 'VOCATIONAL'),
  };

  return (
    <div className="container mx-auto py-6 space-y-6 print:py-0">
      {/* Header - Hidden when printing */}
      <div className="flex items-center gap-4 print:hidden">
        <Link href="/parent/report-cards">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Detail Rapor</h1>
          <p className="text-muted-foreground">
            {reportCard.student.name} - {reportCard.academicYear.year} Semester {reportCard.academicYear.semester}
          </p>
        </div>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Cetak
        </Button>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Unduh PDF
        </Button>
      </div>

      {/* Report Card Header */}
      <Card className="print:border-0 print:shadow-none">
        <CardContent className="pt-6">
          {/* School Header */}
          <div className="text-center border-b pb-4 mb-4">
            <h2 className="text-xl font-bold uppercase">{reportCard.unit.name}</h2>
            <p className="text-sm text-muted-foreground">{reportCard.unit.address}</p>
            <h3 className="text-lg font-semibold mt-4">LAPORAN HASIL BELAJAR PESERTA DIDIK</h3>
            <p className="text-sm">Tahun Pelajaran {reportCard.academicYear.year} Semester {reportCard.academicYear.semester === 1 ? 'Ganjil' : 'Genap'}</p>
          </div>

          {/* Student Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground">Nama Siswa</span>
                <span className="col-span-2 font-medium">: {reportCard.student.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground">NIS</span>
                <span className="col-span-2 font-medium">: {reportCard.student.nis}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground">Kelas</span>
                <span className="col-span-2 font-medium">: {reportCard.student.class.name}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground">Tempat, Tgl Lahir</span>
                <span className="col-span-2 font-medium">: {reportCard.student.birthPlace}, {new Date(reportCard.student.birthDate).toLocaleDateString('id-ID')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground">Peringkat</span>
                <span className="col-span-2 font-medium">: {reportCard.rank} dari {reportCard.totalStudents} siswa</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground">Rata-rata</span>
                <span className="col-span-2 font-medium">: {reportCard.averageScore.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs - Hidden when printing */}
      <div className="print:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="grades">Nilai Akademik</TabsTrigger>
            <TabsTrigger value="extracurricular">Ekstrakurikuler</TabsTrigger>
            <TabsTrigger value="tahfidz">Tahfidz</TabsTrigger>
            <TabsTrigger value="character">Sikap</TabsTrigger>
            <TabsTrigger value="notes">Catatan</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Print View - Shows all sections */}
      <div className="print:block hidden">
        {/* All sections will be visible when printing */}
      </div>

      {/* Tab Contents */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-6">
          {/* Religious Subjects */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Kelompok A - Mata Pelajaran Keagamaan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">No</th>
                      <th className="text-left py-2 px-2">Mata Pelajaran</th>
                      <th className="text-center py-2 px-2">Pengetahuan</th>
                      <th className="text-center py-2 px-2">Keterampilan</th>
                      <th className="text-center py-2 px-2">Rata-rata</th>
                      <th className="text-center py-2 px-2">Predikat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorizedGrades.RELIGIOUS.map((grade, idx) => (
                      <tr key={grade.subjectId} className="border-b">
                        <td className="py-2 px-2">{idx + 1}</td>
                        <td className="py-2 px-2">{grade.subjectName}</td>
                        <td className="py-2 px-2 text-center">{grade.knowledgeScore}</td>
                        <td className="py-2 px-2 text-center">{grade.skillScore}</td>
                        <td className={`py-2 px-2 text-center ${getGradeColor(grade.grade)}`}>{grade.averageScore}</td>
                        <td className={`py-2 px-2 text-center ${getGradeColor(grade.grade)}`}>{grade.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Academic Subjects */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Kelompok B - Mata Pelajaran Umum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">No</th>
                      <th className="text-left py-2 px-2">Mata Pelajaran</th>
                      <th className="text-center py-2 px-2">Pengetahuan</th>
                      <th className="text-center py-2 px-2">Keterampilan</th>
                      <th className="text-center py-2 px-2">Rata-rata</th>
                      <th className="text-center py-2 px-2">Predikat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorizedGrades.ACADEMIC.map((grade, idx) => (
                      <tr key={grade.subjectId} className="border-b">
                        <td className="py-2 px-2">{idx + 1}</td>
                        <td className="py-2 px-2">{grade.subjectName}</td>
                        <td className="py-2 px-2 text-center">{grade.knowledgeScore}</td>
                        <td className="py-2 px-2 text-center">{grade.skillScore}</td>
                        <td className={`py-2 px-2 text-center ${getGradeColor(grade.grade)}`}>{grade.averageScore}</td>
                        <td className={`py-2 px-2 text-center ${getGradeColor(grade.grade)}`}>{grade.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Local & Vocational Subjects */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Kelompok C - Muatan Lokal & Prakarya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">No</th>
                      <th className="text-left py-2 px-2">Mata Pelajaran</th>
                      <th className="text-center py-2 px-2">Pengetahuan</th>
                      <th className="text-center py-2 px-2">Keterampilan</th>
                      <th className="text-center py-2 px-2">Rata-rata</th>
                      <th className="text-center py-2 px-2">Predikat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...categorizedGrades.LOCAL, ...categorizedGrades.VOCATIONAL].map((grade, idx) => (
                      <tr key={grade.subjectId} className="border-b">
                        <td className="py-2 px-2">{idx + 1}</td>
                        <td className="py-2 px-2">{grade.subjectName}</td>
                        <td className="py-2 px-2 text-center">{grade.knowledgeScore}</td>
                        <td className="py-2 px-2 text-center">{grade.skillScore}</td>
                        <td className={`py-2 px-2 text-center ${getGradeColor(grade.grade)}`}>{grade.averageScore}</td>
                        <td className={`py-2 px-2 text-center ${getGradeColor(grade.grade)}`}>{grade.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Kehadiran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{reportCard.attendance.sick}</p>
                  <p className="text-xs text-muted-foreground">Sakit</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{reportCard.attendance.permitted}</p>
                  <p className="text-xs text-muted-foreground">Izin</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{reportCard.attendance.absent}</p>
                  <p className="text-xs text-muted-foreground">Alpha</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <p className="text-2xl font-bold">{reportCard.attendance.totalDays}</p>
                  <p className="text-xs text-muted-foreground">Total Hari</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{reportCard.attendance.attendanceRate}%</p>
                  <p className="text-xs text-muted-foreground">Kehadiran</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extracurricular Tab */}
        <TabsContent value="extracurricular">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Ekstrakurikuler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">No</th>
                      <th className="text-left py-2 px-2">Kegiatan</th>
                      <th className="text-center py-2 px-2">Predikat</th>
                      <th className="text-left py-2 px-2">Keterangan</th>
                      <th className="text-left py-2 px-2">Prestasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCard.extracurricularGrades.map((grade, idx) => (
                      <tr key={grade.extracurricularId} className="border-b">
                        <td className="py-2 px-2">{idx + 1}</td>
                        <td className="py-2 px-2 font-medium">{grade.extracurricularName}</td>
                        <td className="py-2 px-2 text-center">
                          <Badge className={grade.predicate === 'A' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                            {grade.predicate}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">{grade.description}</td>
                        <td className="py-2 px-2">
                          {grade.achievement ? (
                            <div className="flex items-center gap-1">
                              <Award className="h-4 w-4 text-amber-500" />
                              <span>{grade.achievement}</span>
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tahfidz Tab */}
        <TabsContent value="tahfidz">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Progress Tahfidz Al-Quran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Progress Hafalan</span>
                      <span className="font-medium">{reportCard.tahfidzProgress?.memorizedJuz} / {reportCard.tahfidzProgress?.targetJuz} Juz</span>
                    </div>
                    <Progress value={(reportCard.tahfidzProgress?.memorizedJuz || 0) / (reportCard.tahfidzProgress?.targetJuz || 30) * 100} className="h-3" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Juz Selesai</p>
                      <p className="text-2xl font-bold text-green-600">{reportCard.tahfidzProgress?.memorizedJuz}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Predikat</p>
                      <Badge className="mt-1 bg-green-100 text-green-800">{reportCard.tahfidzProgress?.grade}</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4" />
                      Posisi Hafalan Saat Ini
                    </h4>
                    <p className="text-lg">
                      Surah <strong>{reportCard.tahfidzProgress?.currentSurah}</strong>, Ayat <strong>{reportCard.tahfidzProgress?.currentAyat}</strong>
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Catatan Ustadz/Ustadzah</h4>
                    <p className="text-sm">{reportCard.tahfidzProgress?.notes}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Character Tab */}
        <TabsContent value="character">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Penilaian Sikap (Karakter)
              </CardTitle>
              <CardDescription>
                Penilaian berdasarkan Profil Pelajar Pancasila & Profil Pelajar Rahmatan Lil Alamin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">No</th>
                      <th className="text-left py-2 px-2">Aspek Sikap</th>
                      <th className="text-left py-2 px-2">Kategori</th>
                      <th className="text-center py-2 px-2">Predikat</th>
                      <th className="text-left py-2 px-2">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCard.characterAssessment.map((char, idx) => (
                      <tr key={char.characterId} className="border-b">
                        <td className="py-2 px-2">{idx + 1}</td>
                        <td className="py-2 px-2 font-medium">{char.characterName}</td>
                        <td className="py-2 px-2">
                          <Badge variant="outline">{char.category}</Badge>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <Badge className={PREDICATE_COLORS[char.predicate as PredicateType]}>
                            {PREDICATE_LABELS[char.predicate as PredicateType]}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">{char.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Keterangan Predikat:</h4>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span><Badge className={PREDICATE_COLORS.SB}>SB</Badge> = Sangat Baik</span>
                  <span><Badge className={PREDICATE_COLORS.B}>B</Badge> = Baik</span>
                  <span><Badge className={PREDICATE_COLORS.C}>C</Badge> = Cukup</span>
                  <span><Badge className={PREDICATE_COLORS.K}>K</Badge> = Kurang</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Catatan Wali Kelas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <p className="italic">&ldquo;{reportCard.teacherNotes}&rdquo;</p>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{reportCard.homeroomTeacher.name}</p>
                  <p className="text-sm text-muted-foreground">NIP. {reportCard.homeroomTeacher.nip}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Catatan Kepala Sekolah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <p className="italic">&ldquo;{reportCard.headmasterNotes}&rdquo;</p>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{reportCard.headmaster.name}</p>
                  <p className="text-sm text-muted-foreground">NIP. {reportCard.headmaster.nip}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signature Area */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="space-y-12">
                  <p className="text-sm text-muted-foreground">Orang Tua/Wali</p>
                  <div className="border-b border-black mx-8"></div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Wali Kelas</p>
                  <div className="h-10"></div>
                  <p className="font-medium">{reportCard.homeroomTeacher.name}</p>
                  <p className="text-xs text-muted-foreground">NIP. {reportCard.homeroomTeacher.nip}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Kepala Sekolah</p>
                  <div className="h-10"></div>
                  <p className="font-medium">{reportCard.headmaster.name}</p>
                  <p className="text-xs text-muted-foreground">NIP. {reportCard.headmaster.nip}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
