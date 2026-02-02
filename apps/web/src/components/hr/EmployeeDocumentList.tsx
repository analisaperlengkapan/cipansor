"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  expiryDate: string | null;
  notes: string | null;
  createdAt: string;
}

interface EmployeeDocumentListProps {
  documents: EmployeeDocument[];
}

export function EmployeeDocumentList({ documents }: EmployeeDocumentListProps) {
  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dokumen Kepegawaian</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Belum ada dokumen yang diunggah.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dokumen Kepegawaian</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary/10 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium line-clamp-1" title={doc.name}>
                        {doc.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {doc.type}
                      </div>
                    </div>
                  </div>
                </div>

                {doc.expiryDate && (
                  <div className="text-xs text-muted-foreground">
                    Exp: {format(new Date(doc.expiryDate), "d MMM yyyy")}
                  </div>
                )}

                {doc.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {doc.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-3 w-3" />
                    Lihat
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
