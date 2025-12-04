'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Users,
  Target,
  Sparkles,
  GraduationCap,
  Loader2,
  Printer,
  Download,
  Heart,
  Globe,
  Lightbulb,
  Brain,
  Palette,
  HandHelping,
  FileText,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCurrentUnit } from '@/hooks';

// P5 Dimension Icons
const P5_ICONS: Record<string, React.ReactNode> = {
  BER: <Heart className="h-5 w-5 text-red-500" />,
  BKB: <Globe className="h-5 w-5 text-blue-500" />,
  GR: <HandHelping className="h-5 w-5 text-green-500" />,
  MAN: <Target className="h-5 w-5 text-orange-500" />,
  BK: <Brain className="h-5 w-5 text-purple-500" />,
  KR: <Palette className="h-5 w-5 text-pink-500" />,
};

// Capaian level colors
const CAPAIAN_COLORS: Record<string, string> = {
  'SANGAT BAIK': 'bg-green-100 text-green-800 border-green-200',
  BAIK: 'bg-blue-100 text-blue-800 border-blue-200',
  CUKUP: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'PERLU BIMBINGAN': 'bg-red-100 text-red-800 border-red-200',
};

// P5 Achievement levels
const P5_LEVELS = [
  { code: 'MB', name: 'Mulai Berkembang', color: 'bg-yellow-500' },
  { code: 'SB', name: 'Sedang Berkembang', color: 'bg-blue-500' },
  { code: 'BSH', name: 'Berkembang Sesuai Harapan', color: 'bg-green-500' },
  { code: 'SBH', name: 'Sangat Berkembang', color: 'bg-purple-500' },
];

interface P5Dimension {
  code: string;
  name: string;
  description: string;
  elements: string[];
}

export default function RaportMerdekaPage() {
  const { data: currentUnit } = useCurrentUnit();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch P5 dimensions
  const { data: p5Dimensions, isLoading: p5Loading } = useQuery<P5Dimension[]>({
    queryKey: ['p5-dimensions'],
    queryFn: async () => {
      const res = await api.get('/assessment/raport-merdeka/p5-dimensions');
      return res.data.data;
    },
  });

  // Fetch CP mappings for reference
  const { data: cpMtk } = useQuery({
    queryKey: ['cp-mapping', 'MTK'],
    queryFn: async () => {
      const res = await api.get('/assessment/raport-merdeka/cp/MTK/7-9');
      return res.data.data;
    },
  });

  const { data: cpThf } = useQuery({
    queryKey: ['cp-mapping', 'THF'],
    queryFn: async () => {
      const res = await api.get('/assessment/raport-merdeka/cp/THF/7-9');
      return res.data.data;
    },
  });

  if (p5Loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Memuat data Kurikulum Merdeka...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Raport Kurikulum Merdeka</h1>
            <p className="text-muted-foreground">
              Penilaian berbasis Capaian Pembelajaran (CP) dan Projek P5
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Template CP/TP
            </Button>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generate Raport
            </Button>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="p5">Projek P5</TabsTrigger>
            <TabsTrigger value="cp-tp">CP & TP</TabsTrigger>
            <TabsTrigger value="generate">Generate Raport</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Format Raport</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Kurikulum Merdeka</div>
                  <p className="text-xs text-muted-foreground">
                    Permendikbudristek No. 56/2022
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dimensi P5</CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">6 Dimensi</div>
                  <p className="text-xs text-muted-foreground">
                    Profil Pelajar Pancasila
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fase Pembelajaran</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">A - F</div>
                  <p className="text-xs text-muted-foreground">
                    PAUD hingga SMA/SMK
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Conversion Table */}
            <Card>
              <CardHeader>
                <CardTitle>Konversi Nilai ke Capaian</CardTitle>
                <CardDescription>
                  Standar penilaian Kurikulum Merdeka berdasarkan level capaian kompetensi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rentang Nilai</TableHead>
                      <TableHead>Predikat</TableHead>
                      <TableHead>Level Capaian</TableHead>
                      <TableHead>Deskripsi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">91 - 100</TableCell>
                      <TableCell><Badge className="bg-green-500">A</Badge></TableCell>
                      <TableCell>Sangat Baik</TableCell>
                      <TableCell className="text-sm">Sangat mampu mendemonstrasikan pemahaman dan keterampilan di atas standar</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">76 - 90</TableCell>
                      <TableCell><Badge className="bg-blue-500">B</Badge></TableCell>
                      <TableCell>Baik</TableCell>
                      <TableCell className="text-sm">Mampu mendemonstrasikan pemahaman dan keterampilan sesuai standar</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">61 - 75</TableCell>
                      <TableCell><Badge className="bg-yellow-500">C</Badge></TableCell>
                      <TableCell>Cukup</TableCell>
                      <TableCell className="text-sm">Cukup mampu mendemonstrasikan pemahaman sesuai standar minimal</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">0 - 60</TableCell>
                      <TableCell><Badge className="bg-red-500">D</Badge></TableCell>
                      <TableCell>Perlu Bimbingan</TableCell>
                      <TableCell className="text-sm">Perlu bimbingan lebih lanjut untuk mencapai kompetensi</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Fase Table */}
            <Card>
              <CardHeader>
                <CardTitle>Fase Pembelajaran Kurikulum Merdeka</CardTitle>
                <CardDescription>
                  Pembagian fase berdasarkan jenjang pendidikan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fase</TableHead>
                      <TableHead>Jenjang</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Usia (tahun)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell><Badge variant="outline">Fondasi</Badge></TableCell>
                      <TableCell>PAUD</TableCell>
                      <TableCell>TK A - TK B</TableCell>
                      <TableCell>5 - 6</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Badge className="bg-blue-500">A</Badge></TableCell>
                      <TableCell>SD</TableCell>
                      <TableCell>1 - 2</TableCell>
                      <TableCell>6 - 8</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Badge className="bg-green-500">B</Badge></TableCell>
                      <TableCell>SD</TableCell>
                      <TableCell>3 - 4</TableCell>
                      <TableCell>8 - 10</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Badge className="bg-yellow-500">C</Badge></TableCell>
                      <TableCell>SD</TableCell>
                      <TableCell>5 - 6</TableCell>
                      <TableCell>10 - 12</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Badge className="bg-orange-500">D</Badge></TableCell>
                      <TableCell>SMP</TableCell>
                      <TableCell>7 - 9</TableCell>
                      <TableCell>12 - 15</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Badge className="bg-purple-500">E</Badge></TableCell>
                      <TableCell>SMA/SMK</TableCell>
                      <TableCell>10</TableCell>
                      <TableCell>15 - 16</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><Badge className="bg-pink-500">F</Badge></TableCell>
                      <TableCell>SMA/SMK</TableCell>
                      <TableCell>11 - 12</TableCell>
                      <TableCell>16 - 18</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* P5 Tab */}
          <TabsContent value="p5" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Profil Pelajar Pancasila (P5)
                </CardTitle>
                <CardDescription>
                  6 dimensi karakter yang dikembangkan melalui projek penguatan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {p5Dimensions?.map((dim) => (
                    <Card key={dim.code} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          {P5_ICONS[dim.code]}
                          <div>
                            <CardTitle className="text-base">{dim.code}</CardTitle>
                            <CardDescription className="text-xs">{dim.name}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{dim.description}</p>
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Elemen:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {dim.elements.slice(0, 3).map((el, i) => (
                              <li key={i} className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                {el}
                              </li>
                            ))}
                            {dim.elements.length > 3 && (
                              <li className="text-xs text-muted-foreground">
                                +{dim.elements.length - 3} elemen lainnya
                              </li>
                            )}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* P5 Achievement Levels */}
            <Card>
              <CardHeader>
                <CardTitle>Level Capaian P5</CardTitle>
                <CardDescription>
                  Skala penilaian untuk dimensi Profil Pelajar Pancasila
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {P5_LEVELS.map((level) => (
                    <div key={level.code} className="text-center p-4 border rounded-lg">
                      <Badge className={level.color}>{level.code}</Badge>
                      <p className="font-medium mt-2">{level.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tema P5 */}
            <Card>
              <CardHeader>
                <CardTitle>Tema Projek P5</CardTitle>
                <CardDescription>
                  7 tema yang dapat dipilih untuk projek penguatan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { tema: 'Gaya Hidup Berkelanjutan', desc: 'Eco-friendly living dan sustainability' },
                    { tema: 'Kearifan Lokal', desc: 'Budaya dan tradisi masyarakat setempat' },
                    { tema: 'Bhinneka Tunggal Ika', desc: 'Keberagaman dan toleransi' },
                    { tema: 'Bangunlah Jiwa dan Raganya', desc: 'Kesehatan fisik dan mental' },
                    { tema: 'Suara Demokrasi', desc: 'Partisipasi warga dan demokrasi' },
                    { tema: 'Berekayasa dan Berteknologi', desc: 'Inovasi dan teknologi untuk kebaikan' },
                    { tema: 'Kewirausahaan', desc: 'Entrepreneurship dan kreativitas ekonomi' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.tema}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CP & TP Tab */}
          <TabsContent value="cp-tp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Capaian Pembelajaran (CP) & Tujuan Pembelajaran (TP)</CardTitle>
                <CardDescription>
                  CP adalah kompetensi yang harus dicapai, TP adalah langkah menuju CP
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Matematika CP */}
                {cpMtk && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-blue-500">MTK</Badge>
                      <span className="font-medium">Matematika</span>
                      <Badge variant="outline">Fase {cpMtk.fase}</Badge>
                    </div>
                    <p className="text-sm font-medium mb-2">Capaian Pembelajaran:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {cpMtk.cp?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tahfidz CP */}
                {cpThf && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-green-500">THF</Badge>
                      <span className="font-medium">Tahfidz Al-Qur'an</span>
                      <Badge variant="outline">Fase {cpThf.fase}</Badge>
                    </div>
                    <p className="text-sm font-medium mb-2">Capaian Pembelajaran:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {cpThf.cp?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Select Subject for more CP */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm font-medium mb-3">Lihat CP mata pelajaran lain:</p>
                  <div className="flex gap-2">
                    <Select>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Pilih Mapel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IPA">IPA</SelectItem>
                        <SelectItem value="IPS">IPS</SelectItem>
                        <SelectItem value="BIG">Bahasa Inggris</SelectItem>
                        <SelectItem value="FIQ">Fiqih</SelectItem>
                        <SelectItem value="AQD">Aqidah Akhlak</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Fase" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Fase A</SelectItem>
                        <SelectItem value="B">Fase B</SelectItem>
                        <SelectItem value="C">Fase C</SelectItem>
                        <SelectItem value="D">Fase D</SelectItem>
                        <SelectItem value="E">Fase E</SelectItem>
                        <SelectItem value="F">Fase F</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="secondary">Tampilkan</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Generate Raport Merdeka
                </CardTitle>
                <CardDescription>
                  Pilih kelas dan semester untuk generate raport format Kurikulum Merdeka
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kelas</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7a">VII A</SelectItem>
                        <SelectItem value="7b">VII B</SelectItem>
                        <SelectItem value="8a">VIII A</SelectItem>
                        <SelectItem value="8b">VIII B</SelectItem>
                        <SelectItem value="9a">IX A</SelectItem>
                        <SelectItem value="9b">IX B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tahun Ajaran</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024/2025">2024/2025</SelectItem>
                        <SelectItem value="2023/2024">2023/2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Semester</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1 (Ganjil)</SelectItem>
                        <SelectItem value="2">Semester 2 (Genap)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Raport Kelas
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export ke PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Raport Preview Info */}
            <Card>
              <CardHeader>
                <CardTitle>Komponen Raport Merdeka</CardTitle>
                <CardDescription>
                  Isi raport sesuai standar Kurikulum Merdeka
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { section: 'A. Identitas Peserta Didik', desc: 'Nama, NISN, Kelas, Sekolah' },
                    { section: 'B. Capaian Pembelajaran Intrakurikuler', desc: 'Nilai dan deskripsi per mata pelajaran' },
                    { section: 'C. Projek Penguatan P5', desc: 'Tema projek dan capaian dimensi' },
                    { section: 'D. Ekstrakurikuler', desc: 'Kegiatan dan predikat' },
                    { section: 'E. Tahfidz Al-Quran', desc: 'Capaian hafalan (khusus pesantren)' },
                    { section: 'F. Kehadiran', desc: 'Rekap hadir, sakit, izin, alpa' },
                    { section: 'G. Catatan Wali Kelas', desc: 'Catatan perkembangan' },
                    { section: 'H. Catatan Kepala Sekolah', desc: 'Pesan dan pengesahan' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.section}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
