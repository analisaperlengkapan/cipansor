"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Loader2, Target, Info } from "lucide-react";
import { api } from "@/lib/api";
import {
  SuccessionPlanningList,
  type SuccessionCandidate,
} from "@/components/hr/succession-planning-list";

import { MainLayout } from "@/components/layout";

interface OrgPosition {
  id: string;
  title: string;
  requirements?: string | null;
}

function SuccessionPlanningPageContent() {
  const [positionSearch, setPositionSearch] = useState("Kepala Sekolah");
  const [targetPositionId, setTargetPositionId] = useState<string | null>(null);

  // Real positions from the org chart. Picking one is what lets the competency
  // component run at all: it reads that position's recorded requirements and
  // compares them to each candidate's assessed competencies. Without it the
  // service scored competency 0 for everyone and the UI drew a 0% bar.
  const { data: positions } = useQuery<OrgPosition[]>({
    queryKey: ["org-positions-for-succession"],
    queryFn: async () => {
      const response = await api.get("/organisasi/positions");
      return response.data.data ?? [];
    },
  });

  const {
    data: suggestions,
    isLoading,
    refetch,
  } = useQuery<SuccessionCandidate[]>({
    queryKey: ["talent-succession-suggestions", positionSearch, targetPositionId],
    queryFn: async () => {
      const params = new URLSearchParams({ positionTitle: positionSearch });
      if (targetPositionId) params.set("targetPositionId", targetPositionId);
      const response = await api.get(`/talenta/successions/suggest?${params}`);
      return response.data.data ?? [];
    },
    enabled: !!positionSearch,
  });

  const selected = positions?.find((p) => p.id === targetPositionId);
  const selectedHasRequirements = Boolean(selected?.requirements);

  return (
    <div className="container mx-auto space-y-8 py-8">
      <PageHeader
        title="Perencanaan Suksesi"
        description="Menyaring kandidat dari matriks talenta berdasarkan data yang tercatat"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <Target className="h-4 w-4" /> Cari Posisi
            </CardTitle>
            <CardDescription>
              Pilih jabatan dari struktur organisasi agar kesesuaian kompetensi
              ikut dihitung.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Misal: Kepala Sekolah, Bendahara..."
              value={positionSearch}
              onChange={(e) => {
                setPositionSearch(e.target.value);
                setTargetPositionId(null);
              }}
            />
            <Button className="w-full" onClick={() => refetch()}>
              <Search className="mr-2 h-4 w-4" /> Cari Kandidat
            </Button>

            {positions && positions.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Jabatan pada struktur organisasi
                </p>
                <div className="flex flex-wrap gap-2">
                  {positions.map((p) => (
                    <Badge
                      key={p.id}
                      variant={targetPositionId === p.id ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => {
                        setTargetPositionId(p.id);
                        setPositionSearch(p.title);
                      }}
                    >
                      {p.title}
                    </Badge>
                  ))}
                </div>
                {targetPositionId && !selectedHasRequirements && (
                  <p className="text-xs text-amber-700 dark:text-amber-500">
                    Jabatan ini belum punya syarat kompetensi tercatat, jadi
                    kesesuaian kompetensi tetap tidak bisa dihitung.
                  </p>
                )}
              </div>
            )}

            {positions && positions.length === 0 && (
              <p className="border-t pt-4 text-xs text-muted-foreground">
                Belum ada jabatan pada struktur organisasi. Tambahkan lewat menu
                Organisasi agar kesesuaian kompetensi bisa dinilai.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-slate-50 py-20 dark:bg-slate-900/40">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Menghitung skor kandidat...</p>
            </div>
          ) : (
            <SuccessionPlanningList
              candidates={suggestions || []}
              positionTitle={positionSearch}
            />
          )}

          {/*
            The old copy called this "AI-Driven" and stamped an "AI Powered
            Recommendations" badge on it. It is a weighted sum, not a model, and
            saying otherwise on a screen used to pick who runs a school is not a
            harmless flourish. The weights are stated here so a reader can judge
            the number instead of trusting it.
          */}
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-bold">Cara skor dihitung</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Penjumlahan berbobot, bukan model AI: kategori talenta (maks 80),
                relevansi peran saat ini terhadap judul jabatan (10), pelatihan
                yang diselesaikan (15), pelatihan syariah (10), dan kesesuaian
                kompetensi terhadap syarat jabatan (25). Komponen yang datanya
                belum ada ditandai pada setiap kandidat, dan bila hanya kategori
                yang menyumbang, skornya tidak ditampilkan sebagai angka — karena
                angka itu tidak menjawab kecocokan terhadap jabatan yang dicari.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessionPlanningPage() {
  return (
    <MainLayout>
      <SuccessionPlanningPageContent />
    </MainLayout>
  );
}
