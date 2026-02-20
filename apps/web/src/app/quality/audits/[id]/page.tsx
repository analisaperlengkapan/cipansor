"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useAuditDetails, useUpdateAuditItem } from "@/hooks/use-quality";
import { useParams } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function AuditExecutionPage() {
  const params = useParams();
  const auditId = params.id as string;
  const { data: audit, isLoading } = useAuditDetails(auditId);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!audit) {
    return (
      <MainLayout>
        <div className="p-8">Audit tidak ditemukan</div>
      </MainLayout>
    );
  }

  // Group items by Standard
  const itemsByStandard = audit.items.reduce((acc: any, item: any) => {
    const standardName = item.indicator.standard.name;
    if (!acc[standardName]) {
      acc[standardName] = [];
    }
    acc[standardName].push(item);
    return acc;
  }, {});

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Link href="/quality/audits">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {audit.name}
              </h1>
              <Badge variant="outline">{audit.code}</Badge>
            </div>
            <p className="text-muted-foreground">
              Lead Auditor: {audit.leadAuditor?.name || "-"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(itemsByStandard).map(
            ([standardName, items]: [string, any]) => (
              <Card key={standardName}>
                <CardHeader>
                  <CardTitle>{standardName}</CardTitle>
                  <CardDescription>
                    {items.length} Indikator Penilaian
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {items.map((item: any) => (
                      <AuditItemRow key={item.id} item={item} />
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function AuditItemRow({ item }: { item: any }) {
  const updateItem = useUpdateAuditItem();
  const [score, setScore] = useState<string>(item.score?.toString() || "");
  const [notes, setNotes] = useState<string>(item.notes || "");

  // Sync local state when item prop updates (e.g. after refetch)
  useEffect(() => {
    setTimeout(() => {
      setScore(item.score?.toString() || "");
      setNotes(item.notes || "");
    }, 0);
  }, [item.score, item.notes]);

  const isDirty =
    score !== (item.score?.toString() || "") || notes !== (item.notes || "");

  const handleSave = () => {
    const numericScore = score === "" ? undefined : parseFloat(score);

    // Check if numericScore is NaN (invalid input)
    if (score !== "" && isNaN(numericScore as number)) {
      return; // Or show error toast
    }

    updateItem.mutate({
      itemId: item.id,
      data: {
        score: numericScore,
        notes: notes,
      },
    });
  };

  return (
    <AccordionItem value={item.id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4 text-left">
          <div className="flex items-center gap-3">
            <Badge variant={item.score !== null ? "default" : "secondary"}>
              {item.indicator.code}
            </Badge>
            <span className="font-medium text-sm md:text-base line-clamp-1">
              {item.indicator.name}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden md:block">
              Target: {item.indicator.targetScore}
            </div>
            {item.score !== null && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Skor: {item.score}
              </Badge>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-2 px-1">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="font-semibold text-sm">Deskripsi Indikator:</div>
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
              {item.indicator.description || "Tidak ada deskripsi"}
            </p>
          </div>

          <div className="space-y-4 border rounded-md p-4 bg-card">
            <div className="flex gap-4">
              <div className="w-1/3">
                <label className="text-sm font-medium mb-1 block">
                  Skor Capaian
                </label>
                <Input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="0-100"
                />
              </div>
              <div className="w-2/3">
                <label className="text-sm font-medium mb-1 block">
                  Catatan Temuan
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan hasil audit..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!isDirty || updateItem.isPending}
              >
                {updateItem.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Simpan Penilaian
              </Button>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
