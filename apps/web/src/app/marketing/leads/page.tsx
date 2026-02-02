"use client";

import { useState } from "react";
import { useLeads, Lead } from "@/hooks/use-leads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { LeadFormDialog } from "@/components/marketing/lead-form-dialog";

export default function LeadsPage() {
  const { data: leadsData, isLoading } = useLeads({
    limit: 50,
  });
  const leads = leadsData?.data || [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleCreate = () => {
    setSelectedLead(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Leads</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Lead Baru
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Calon Santri (Leads)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead>Kampanye</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Minat</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {lead.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.source ? (
                        <Badge variant="outline">{lead.source}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.campaign ? (
                        <Badge variant="secondary">{lead.campaign.name}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lead.status === "CONVERTED"
                            ? "default"
                            : lead.status === "LOST" || lead.status === "JUNK"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.interest || "-"}</TableCell>
                    <TableCell>
                      {format(new Date(lead.createdAt), "d MMM yyyy", {
                        locale: idLocale,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/marketing/leads/${lead.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!isLoading && (!leads || leads.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    Belum ada data leads
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LeadFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={selectedLead}
      />
    </div>
  );
}
