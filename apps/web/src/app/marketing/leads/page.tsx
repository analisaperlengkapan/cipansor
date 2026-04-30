"use client";

import { useRegistrations } from "@/hooks/use-admissions";
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
import { Loader2, Eye } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function LeadsPage() {
  const { data: registrationsData, isLoading } = useRegistrations({
    limit: 50,
  });
  const registrations = registrationsData?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manajemen Leads</h1>

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
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <div className="font-medium">{reg.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                          {(reg as any).parentPhone}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reg.source ? (
                        <Badge variant="outline">{reg.source}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {reg.campaign ? (
                        <Badge variant="secondary">{reg.campaign.name}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          reg.status === "ACCEPTED" ? "default" : "secondary"
                        }
                      >
                        {reg.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(reg.createdAt), "d MMM yyyy", {
                        locale: idLocale,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/marketing/leads/${reg.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
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
