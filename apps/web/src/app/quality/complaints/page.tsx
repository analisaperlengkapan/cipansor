"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useComplaints } from "@/hooks/use-complaints";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, ChevronLeft, ChevronRight, LayoutList, KanbanSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComplaintStatus, ComplaintCategory } from "@cipansor/shared";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "./kanban-board";

export default function ComplaintsPage() {
  const [status, setStatus] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("list");

  const { data, isLoading } = useComplaints({
    status: status === "ALL" ? undefined : status,
    category: category === "ALL" ? undefined : category,
    page,
    limit: view === "board" ? 50 : 10, // Fetch more for board view
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Menunggu</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary">Diproses</Badge>;
      case "RESOLVED":
        return <Badge variant="default" className="bg-green-600">Selesai</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6 h-[calc(100vh-60px)] flex flex-col">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aduan & Aspirasi</h1>
            <p className="text-muted-foreground">
              Kelola dan pantau aduan serta aspirasi civitas akademika.
            </p>
          </div>
          <Link href="/quality/complaints/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Buat Aduan Baru
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="list" className="w-full flex-1 flex flex-col" onValueChange={setView}>
          <div className="flex flex-wrap gap-4 items-center justify-between mb-4 shrink-0">
            <div className="flex gap-4">
              <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  {Object.values(ComplaintStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={category} onValueChange={(val) => { setCategory(val); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kategori</SelectItem>
                  {Object.values(ComplaintCategory).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TabsList>
              <TabsTrigger value="list"><LayoutList className="w-4 h-4 mr-2"/>List</TabsTrigger>
              <TabsTrigger value="board"><KanbanSquare className="w-4 h-4 mr-2"/>Board</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="flex-1">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Subjek</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Pelapor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Komentar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : data?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Belum ada aduan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell>
                          {format(new Date(complaint.createdAt), "dd MMM yyyy", {
                            locale: idLocale,
                          })}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/quality/complaints/${complaint.id}`}
                            className="font-medium hover:underline"
                          >
                            {complaint.subject}
                          </Link>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {complaint.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{complaint.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {complaint.isAnonymous ? (
                            <span className="italic text-muted-foreground">
                              Anonim
                            </span>
                          ) : (
                            complaint.user?.name || "-"
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 text-muted-foreground">
                            <MessageSquare className="h-4 w-4" />
                            <span>{complaint._count?.comments || 0}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination for List View */}
            {data && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {page} of {data.meta.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                  disabled={page === data.meta.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="board" className="flex-1 overflow-hidden h-full">
             {isLoading ? (
               <div className="flex items-center justify-center h-64">Loading...</div>
             ) : (
               <KanbanBoard complaints={data?.data || []} />
             )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
