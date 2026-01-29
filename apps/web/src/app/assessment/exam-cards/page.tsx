"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClasses, useAcademicYears, useStudents } from "@/hooks";
import { ArrowLeft, Printer, Download, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ExamCardsPage() {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("1");
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: classes } = useClasses();
  const { data: academicYears } = useAcademicYears();

  // Only fetch when class is selected to save resources
  const { data: students, isLoading } = useStudents({
    classId: selectedClass || undefined,
    status: "active",
    limit: 100, // Max per class usually < 50
  });

  const activeYear = academicYears?.data?.find(y => y.id === selectedYear)?.name ||
                     academicYears?.data?.find(y => y.isActive)?.name || "-";
  const className = classes?.data?.find(c => c.id === selectedClass)?.name || "-";

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If content is longer than one page, we need to handle pagination (simplified here)
      // For now, let's just fit it or let it spill (rendering issue for many students)
      // Better approach for many cards: Iterate and add pages.

      // Simpler approach: Just add the image. If it's too long, it might stretch or cut.
      // Since Exam Cards are usually grid, let's assume it fits or handle pages properly
      // But for robustness in this task, let's just output the canvas.

      // Improving PDF generation:
      // We can create a PDF with multiple pages.
      // But html2canvas captures the whole visible DOM.
      // If the list is long, it's a very tall image.

      if (imgHeight > pdfHeight) {
         let heightLeft = imgHeight;
         let position = 0;

         pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
         heightLeft -= pdfHeight;

         while (heightLeft >= 0) {
           position = heightLeft - imgHeight;
           pdf.addPage();
           pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
           heightLeft -= pdfHeight;
         }
      } else {
         pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      }

      pdf.save(`Kartu_Ujian_${className}.pdf`);
      toast.success("Kartu ujian berhasil diunduh");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunduh PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <MainLayout>
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cetak Kartu Ujian</h1>
            <p className="text-muted-foreground">
              Generate kartu peserta ujian untuk santri
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Tahun Ajaran" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.data?.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} {year.isActive && "(Aktif)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester 1 (Ganjil)</SelectItem>
                  <SelectItem value="2">Semester 2 (Genap)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.data?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handlePrint}
                  disabled={!selectedClass || !students?.data?.length}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleDownloadPDF}
                  disabled={!selectedClass || !students?.data?.length || isGenerating}
                >
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview / Print Area */}
      <div className="mt-8 bg-white p-8 min-h-[500px] shadow-sm rounded-lg print:shadow-none print:p-0 print:m-0" ref={printRef}>
        {!selectedClass ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground print:hidden">
            <CreditCard className="h-12 w-12 mb-4 opacity-20" />
            <p>Pilih kelas untuk menampilkan kartu ujian</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-64 print:hidden">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !students?.data?.length ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground print:hidden">
            <p>Tidak ada siswa di kelas ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4">
            {students.data.map((student) => (
              <div
                key={student.id}
                className="border-2 border-slate-800 rounded-xl p-4 flex gap-4 break-inside-avoid relative overflow-hidden bg-white text-black"
                style={{ pageBreakInside: 'avoid' }}
              >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                  <CreditCard className="w-32 h-32" />
                </div>

                {/* Left: Photo */}
                <div className="w-24 h-32 bg-gray-100 border border-gray-300 flex-shrink-0 flex items-center justify-center">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.user?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-xs text-center text-gray-400">
                      FOTO<br/>3x4
                    </div>
                  )}
                </div>

                {/* Right: Info */}
                <div className="flex-1 space-y-1 z-10">
                  <div className="border-b-2 border-slate-800 pb-2 mb-2">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">KARTU PESERTA UJIAN</h3>
                    <h2 className="font-bold text-lg leading-tight">YAYASAN CIPANSOR</h2>
                  </div>

                  <div className="text-sm space-y-1">
                    <div className="grid grid-cols-3">
                      <span className="text-gray-600">Nama</span>
                      <span className="col-span-2 font-semibold truncate">: {student.user?.name}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-gray-600">NIS/NISN</span>
                      <span className="col-span-2">: {student.nis} / {student.nisn || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-gray-600">Kelas</span>
                      <span className="col-span-2">: {className}</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <span className="text-gray-600">Periode</span>
                      <span className="col-span-2">: {activeYear} (Sem {selectedSemester})</span>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between items-end">
                    <div className="text-[10px] text-gray-500 italic">
                      *Wajib dibawa saat ujian
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] mb-8">Panitia Ujian</div>
                      <div className="text-[10px] font-bold border-t border-slate-400 px-2 pt-1">
                        ( ........................... )
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
