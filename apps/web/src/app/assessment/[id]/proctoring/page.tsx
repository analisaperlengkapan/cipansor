"use client";

import { useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useAssessment, useStudents } from "@/hooks";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function ProctoringPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const componentRef = useRef<HTMLDivElement>(null);

  const { data: assessment, isLoading: loadingAssessment } = useAssessment(assessmentId);
  const { data: students, isLoading: loadingStudents } = useStudents({
    classId: assessment?.classId,
    limit: 100,
    status: "active",
  });

  const handlePrint = () => {
    window.print();
  };

  if (loadingAssessment || loadingStudents) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!assessment) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p>Penilaian tidak ditemukan</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            Kembali
          </Button>
        </div>
      </MainLayout>
    );
  }

  const sortedStudents = students?.data?.sort((a, b) =>
    (a.user?.name || "").localeCompare(b.user?.name || "")
  );

  return (
    <MainLayout>
      <div className="space-y-6 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Berita Acara Ujian</h1>
            <p className="text-muted-foreground">
              Cetak dokumen berita acara pelaksanaan ujian
            </p>
          </div>
          <Button onClick={handlePrint} className="ml-auto">
            <Printer className="mr-2 h-4 w-4" />
            Cetak Dokumen
          </Button>
        </div>
      </div>

      {/* Document Area */}
      <div className="mt-8 bg-white p-8 max-w-[210mm] mx-auto shadow-sm min-h-[297mm] print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none text-black">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h2 className="text-xl font-bold uppercase">YAYASAN PESANTREN CIPANSOR</h2>
          <h3 className="text-lg font-bold uppercase">BERITA ACARA PELAKSANAAN UJIAN</h3>
          <p className="text-sm mt-1">Tahun Ajaran {assessment.academicYear?.name}</p>
        </div>

        {/* Info Table */}
        <div className="mb-6">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="w-40 py-1">Mata Pelajaran</td>
                <td className="font-semibold">: {assessment.subject?.name}</td>
                <td className="w-40 py-1">Hari / Tanggal</td>
                <td className="font-semibold">: {format(new Date(assessment.scheduledAt), "EEEE, d MMMM yyyy", { locale: idLocale })}</td>
              </tr>
              <tr>
                <td className="py-1">Kelas / Semester</td>
                <td className="font-semibold">: {assessment.class?.name} / {assessment.semester}</td>
                <td className="py-1">Waktu</td>
                <td className="font-semibold">: {format(new Date(assessment.scheduledAt), "HH:mm", { locale: idLocale })} - Selesai</td>
              </tr>
              <tr>
                <td className="py-1">Guru Pengampu</td>
                <td className="font-semibold">: {assessment.teacher?.user?.name}</td>
                <td className="py-1">Ruang</td>
                <td className="font-semibold">: ....................</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Content Body */}
        <div className="space-y-4 text-sm mb-6">
          <p>
            Pada hari ini <strong>{format(new Date(assessment.scheduledAt), "EEEE", { locale: idLocale })}</strong> tanggal <strong>{format(new Date(assessment.scheduledAt), "d MMMM yyyy", { locale: idLocale })}</strong>, telah dilaksanakan ujian {assessment.title} dengan rincian kehadiran sebagai berikut:
          </p>
          <div className="grid grid-cols-2 gap-8 ml-4">
            <div>
              <p>1. Jumlah Peserta Seharusnya</p>
              <p>2. Jumlah Peserta Hadir</p>
              <p>3. Jumlah Peserta Tidak Hadir</p>
            </div>
            <div>
              <p>: <strong>{sortedStudents?.length || 0}</strong> orang</p>
              <p>: .......... orang</p>
              <p>: .......... orang</p>
            </div>
          </div>
        </div>

        {/* Attendance List */}
        <div className="mb-6">
          <h4 className="font-bold text-sm mb-2 uppercase">Daftar Hadir Peserta</h4>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-2 py-1 w-10">No</th>
                <th className="border border-black px-2 py-1 w-32">NIS</th>
                <th className="border border-black px-2 py-1 text-left">Nama Peserta</th>
                <th className="border border-black px-2 py-1 w-32">Tanda Tangan</th>
                <th className="border border-black px-2 py-1 w-24">Ket</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents?.map((student, index) => (
                <tr key={student.id}>
                  <td className="border border-black px-2 py-1 text-center">{index + 1}</td>
                  <td className="border border-black px-2 py-1 text-center">{student.nis}</td>
                  <td className="border border-black px-2 py-1">{student.user?.name}</td>
                  <td className="border border-black px-2 py-1"></td>
                  <td className="border border-black px-2 py-1"></td>
                </tr>
              ))}
              {/* Extra rows if needed */}
              {[...Array(Math.max(0, 5 - (sortedStudents?.length || 0)))].map((_, i) => (
                 <tr key={`empty-${i}`}>
                  <td className="border border-black px-2 py-1 text-center">{(sortedStudents?.length || 0) + i + 1}</td>
                  <td className="border border-black px-2 py-1"></td>
                  <td className="border border-black px-2 py-1"></td>
                  <td className="border border-black px-2 py-1"></td>
                  <td className="border border-black px-2 py-1"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        <div className="mb-8">
          <h4 className="font-bold text-sm mb-2 uppercase">Catatan Kejadian Penting</h4>
          <div className="border border-black h-24 p-2"></div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-16 text-sm text-center">
          <div>
            <p className="mb-16">Pengawas Ujian</p>
            <p className="font-bold border-b border-black inline-block min-w-[200px]"></p>
            <p className="mt-1">NIP. ..............................</p>
          </div>
          <div>
            <p className="mb-16">Guru Pengampu</p>
            <p className="font-bold border-b border-black inline-block min-w-[200px]">{assessment.teacher?.user?.name}</p>
            <p className="mt-1">NIP. {assessment.teacher?.nip || ".............................."}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
