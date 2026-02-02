"use client";

import { useLead } from "@/hooks/use-leads";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LeadInteractionTimeline } from "@/components/marketing/lead-interaction-timeline";
import { LogInteractionDialog } from "@/components/marketing/log-interaction-dialog";
import { LeadFormDialog } from "@/components/marketing/lead-form-dialog";
import { ConvertToRegistrantDialog } from "@/components/marketing/convert-to-registrant-dialog";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: lead, isLoading } = useLead(id);
  const [logOpen, setLogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return <div>Lead tidak ditemukan</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold flex-1">{lead.name}</h1>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detail Lead</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <Badge className="mt-1">{lead.status}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Minat</div>
                <div>{lead.interest || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">No. HP</div>
                <div>{lead.phone}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Email</div>
                <div>{lead.email || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Sumber</div>
                <div>{lead.source || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Kampanye</div>
                <div>{lead.campaign?.name || "-"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm font-medium text-muted-foreground">Catatan</div>
                <div className="whitespace-pre-wrap">{lead.notes || "-"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Riwayat Interaksi</CardTitle>
              <Button size="sm" onClick={() => setLogOpen(true)}>
                <MessageSquare className="mr-2 h-4 w-4" /> Catat
              </Button>
            </CardHeader>
            <CardContent>
              <LeadInteractionTimeline leadId={lead.id} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Actions / Conversion Card placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {lead.status === "CONVERTED" && lead.registrantId ? (
                    <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200 text-sm">
                        Lead sudah dikonversi menjadi pendaftar.
                        <Button variant="link" className="p-0 h-auto text-green-800 ml-1" asChild>
                            <Link href={`/psb/registrations/${lead.registrantId}`}>Lihat Pendaftar</Link>
                        </Button>
                    </div>
                ) : (
                    <Button
                      className="w-full"
                      disabled={lead.status === "JUNK" || lead.status === "LOST"}
                      onClick={() => setConvertOpen(true)}
                    >
                        Konversi ke Pendaftar
                    </Button>
                )}
            </CardContent>
          </Card>
        </div>
      </div>

      <LogInteractionDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        leadId={lead.id}
      />
      <LeadFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        lead={lead}
      />
      <ConvertToRegistrantDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        lead={lead}
      />
    </div>
  );
}
