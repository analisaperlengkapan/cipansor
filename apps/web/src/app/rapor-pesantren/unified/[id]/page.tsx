'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RaporPesantren } from '@/hooks/use-rapor-pesantren';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Printer, CalendarDays, BookOpen, Star, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function UnifiedRaporPage() {
  const params = useParams();
  const raporId = params.id as string;
  const [rapor, setRapor] = useState<RaporPesantren | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRapor = async () => {
      try {
        const res = await fetch(`/api/v1/rapor-pesantren/${raporId}`);
        if (!res.ok) throw new Error('Gagal mengambil data Rapor Pesantren');
        const data = await res.json();
        setRapor(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (raporId) fetchRapor();
  }, [raporId]);

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Memuat Unified Rapor Pesantren...</div>;
  if (error) return <Alert variant="destructive" className="m-8"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  if (!rapor) return <div className="p-8 text-center text-gray-500">Rapor tidak ditemukan</div>;

  return (
    <div className="container mx-auto p-4 max-w-5xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Rapor Pesantren Terpadu</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Periode Akademik {rapor.academicYear?.name} - Semester {rapor.semester}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rapor.status === 'PUBLISHED' ? (
            <Badge variant="default" className="bg-green-600">Dipublikasikan</Badge>
          ) : (
            <Badge variant="secondary">Draft</Badge>
          )}
          <Button onClick={() => window.print()} variant="outline" className="print:hidden">
            <Printer className="h-4 w-4 mr-2" /> Cetak Rapor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-sm border-gray-100">
          <CardHeader className="bg-gray-50/50 pb-4 border-b">
            <CardTitle className="text-lg">Data Santri</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full mb-3 flex items-center justify-center text-gray-400">
                <span className="text-3xl font-semibold">{rapor.student?.name?.[0]}</span>
              </div>
              <h2 className="text-xl font-bold">{rapor.student?.name}</h2>
              <p className="text-sm text-gray-500">NIS: {rapor.student?.nis}</p>
            </div>
            
            <div className="space-y-2 text-sm pt-2 border-t text-gray-600">
              <div className="flex justify-between"><span>Kelas:</span> <span className="font-medium text-gray-900">{rapor.student?.class?.name || '-'}</span></div>
              <div className="flex justify-between"><span>Asrama:</span> <span className="font-medium text-gray-900">{rapor.student?.dormRoom?.name || '-'}</span></div>
              <div className="flex justify-between mt-4">
                <span className="font-bold text-gray-800">Nilai Akhir:</span> 
                <span className="font-bold text-blue-600 text-lg">{rapor.overallScore?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-800">Predikat:</span> 
                <Badge variant={rapor.overallGrade === 'MUMTAZ' ? 'default' : 'secondary'} className="text-xs">
                  {rapor.overallGrade}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-100 text-blue-900">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-blue-600" /> Capaian Kepesantrenan & Akademik
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                
                {/* Tahfidz Section */}
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">Tahfidz Al-Quran</h3>
                    <div className="text-right">
                      <span className="block font-bold text-lg text-blue-600">{rapor.tahfidz?.score?.toFixed(1)}</span>
                      <Badge variant="outline">{rapor.tahfidz?.grade}</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mt-2">
                    <div> Total Setoran: <span className="font-medium text-gray-900">{rapor.tahfidz?.setoranCount} Kali</span></div>
                    <div> Murojaah: <span className="font-medium text-gray-900">{rapor.tahfidz?.murajaahCount} Kali</span></div>
                    <div className="col-span-2"> Surah Terakhir: <span className="font-medium text-gray-900">{rapor.tahfidz?.latestSurah} (Juz {rapor.tahfidz?.latestJuz})</span></div>
                  </div>
                </div>

                {/* Takhosus Section */}
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">Program Takhosus</h3>
                    <div className="text-right">
                      <span className="block font-bold text-lg text-blue-600">{rapor.takhosus?.score?.toFixed(1) || 0}</span>
                      <Badge variant="outline">{rapor.takhosus?.grade}</Badge>
                    </div>
                  </div>
                  {rapor.takhosus?.enrolledHalaqoh > 0 ? (
                    <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mt-2">
                      <div> Halaqoh Diikuti: <span className="font-medium text-gray-900">{rapor.takhosus?.enrolledHalaqoh}</span></div>
                      <div> Total Sesi: <span className="font-medium text-gray-900">{rapor.takhosus?.totalSessions}</span></div>
                      <div className="col-span-2 space-y-1 mt-1">
                        {rapor.takhosus?.halaqohDetails?.map((h: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs bg-gray-100 p-2 rounded">
                            <span className="font-medium">{h.halaqohName}</span>
                            <span>{h.progress}% - {h.latestGrade}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 mt-2 italic">Tidak Mengikuti Takhosus</div>
                  )}
                </div>

                {/* Kitab Kuning Section */}
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">Kajian Kitab Kuning</h3>
                    <div className="text-right">
                      <span className="block font-bold text-lg text-blue-600">{rapor.kitabProgress?.score?.toFixed(1) || 0}</span>
                      <Badge variant="outline">{rapor.kitabProgress?.grade}</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mt-2">
                    <div> Kitab Selesai: <span className="font-medium text-gray-900">{rapor.kitabProgress?.completedKitab}</span></div>
                    <div> Halaman Terbaca: <span className="font-medium text-gray-900">{rapor.kitabProgress?.readPages} / {rapor.kitabProgress?.totalPages}</span></div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardHeader className="bg-amber-50/50 pb-4 border-b border-amber-100 text-amber-900">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-amber-500" /> Ibadah & Karakter (Akhlak)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                
                {/* Ibadah */}
                <div className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Capaian Ibadah Yaumiyyah</h3>
                    <p className="text-sm text-gray-500">Skor berdasarkan kepatuhan jamaah & sunnah harian.</p>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-lg text-amber-600">{rapor.ibadah?.score?.toFixed(1)}</span>
                    <Badge variant="outline">{rapor.ibadah?.grade}</Badge>
                  </div>
                </div>
                
                {/* Akhlak */}
                <div className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Akhlak & Kedisiplinan</h3>
                    <p className="text-sm text-gray-500">
                      Pelanggaran: <span className="text-red-500 font-medium">{rapor.akhlak?.totalViolations}</span> | 
                      Prestasi: <span className="text-green-600 font-medium">{rapor.akhlak?.totalRewards}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-lg text-amber-600">{rapor.akhlak?.score?.toFixed(1)}</span>
                    <Badge variant="outline">{rapor.akhlak?.grade}</Badge>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100 print-break-inside-avoid">
            <CardHeader className="bg-gray-50/50 pb-4 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-gray-600" /> Catatan Musyrif & Mudir
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {rapor.musyrifNotes && (
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                  <h4 className="font-bold text-sm text-gray-700 mb-1">Catatan Musyrif Asrama</h4>
                  <p className="text-sm text-gray-600 italic whitespace-pre-wrap">&ldquo;{rapor.musyrifNotes}&rdquo;</p>
                </div>
              )}
              {rapor.headTeacherNotes && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                  <h4 className="font-bold text-sm text-blue-800 mb-1">Catatan Wali Kelas</h4>
                  <p className="text-sm text-blue-900 italic whitespace-pre-wrap">&ldquo;{rapor.headTeacherNotes}&rdquo;</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
{/* Print Footer */}
      <div className="hidden print:block mt-12 pt-8 border-t border-gray-300">
        <div className="flex justify-between px-12 text-sm">
          <div className="text-center">
            <p className="mb-16">Mengetahui,<br/>Wali Santri</p>
            <p className="border-t border-gray-800 pt-1 w-40">(...................................)</p>
          </div>
          <div className="text-center">
            <p className="mb-16">Mudirul Ma&apos;had,<br/>Pondok Pesantren Cipansor</p>
            <p className="border-t border-gray-800 pt-1 w-48 font-bold">Kyai Pimpinan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
