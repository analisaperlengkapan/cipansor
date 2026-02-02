"use client";

import { useRouter } from "next/navigation";
import { useCorrespondence } from "@/hooks/use-correspondence";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LetterStatusBadge } from "@/components/e-office/letter-status-badge";
import { AgendaPrintView } from "@/components/e-office/agenda-print-view"; // New Import
import { Plus, Search, Mail, Send, Printer } from "lucide-react"; // Added Printer
import {
  LetterDirection,
  LetterStatus,
  type LetterDetail,
} from "@cipansor/shared";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

export default function InboxPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState<LetterDirection>(
    LetterDirection.INCOMING,
  );
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"ALL" | "PERSONAL">("ALL");

  const { useLetters } = useCorrespondence(user?.unitId);

  // We might want a separate fetch for printing "All" letters in a period,
  // but for now we'll print the current view's data
  const { data, isLoading } = useLetters({
    page,
    limit: 10, // Pagination applies
    direction,
    search,
    scope,
  });

  const agendaRef = useRef<HTMLDivElement>(null);

  const handlePrintAgenda = async () => {
    if (!agendaRef.current) return;

    try {
      toast.info("Sedang menyiapkan Buku Agenda...");
      const canvas = await html2canvas(agendaRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      // A4 Landscape
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;

      let heightLeft = scaledHeight;
      let position = 0;
      let page = 1;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;

      // Add remaining pages
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;
        page++;
      }

      const filename = `Buku-Agenda-${direction}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      pdf.save(filename);
      toast.success("Buku Agenda berhasil diunduh");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunduh Buku Agenda");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Hidden Print Template */}
      <div className="fixed left-[-9999px] top-0">
         <AgendaPrintView
            ref={agendaRef}
            letters={data?.data || []}
            direction={direction}
            unitName={user?.unit?.name}
         />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">E-Office</h1>
          <p className="text-muted-foreground">
            Manajemen surat masuk, surat keluar, dan disposisi.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintAgenda} disabled={isLoading || !data?.data.length}>
            <Printer className="mr-2 h-4 w-4" />
            Cetak Buku Agenda
          </Button>
          <Button onClick={() => router.push("/e-office/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Surat
          </Button>
        </div>
      </div>

      <Tabs
        value={scope}
        onValueChange={(v) => setScope(v as any)}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="ALL">Semua Surat (Unit)</TabsTrigger>
          <TabsTrigger value="PERSONAL">Inbox Saya (Disposisi)</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => setDirection(LetterDirection.INCOMING)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surat Masuk</CardTitle>
            <Mail
              className={`h-4 w-4 ${direction === LetterDirection.INCOMING ? "text-primary" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Inbox</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => setDirection(LetterDirection.OUTGOING)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surat Keluar</CardTitle>
            <Send
              className={`h-4 w-4 ${direction === LetterDirection.OUTGOING ? "text-primary" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Outbox</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari perihal atau nomor surat..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor Surat</TableHead>
                <TableHead>Perihal</TableHead>
                <TableHead>
                  {direction === LetterDirection.INCOMING
                    ? "Pengirim"
                    : "Tujuan"}
                </TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Sifat</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Tidak ada surat ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((letter: LetterDetail) => (
                  <TableRow
                    key={letter.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/e-office/letter/${letter.id}`)}
                  >
                    <TableCell className="font-medium">
                      {letter.letterNumber || letter.agendaNumber || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{letter.subject}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {letter.classification?.code} -{" "}
                          {letter.classification?.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {direction === LetterDirection.INCOMING
                        ? letter.senderName || letter.senderInstance
                        : letter.recipientName || letter.recipientInstance}
                    </TableCell>
                    <TableCell>
                      {format(new Date(letter.date), "dd MMM yyyy", {
                        locale: id,
                      })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${
                          letter.urgency === "URGENT"
                            ? "bg-red-50 border-red-200 text-red-700"
                            : letter.urgency === "IMMEDIATE"
                              ? "bg-orange-50 border-orange-200 text-orange-700"
                              : "bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                      >
                        {letter.urgency}
                      </span>
                    </TableCell>
                    <TableCell>
                      <LetterStatusBadge status={letter.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
