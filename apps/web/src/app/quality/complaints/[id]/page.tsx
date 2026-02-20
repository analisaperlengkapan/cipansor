"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useParams } from "next/navigation";
import {
  useComplaint,
  useUpdateComplaintStatus,
  useAddComplaintComment,
} from "@/hooks/use-complaints";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowLeft, Send, User } from "lucide-react";
import Link from "next/link";
import { ComplaintStatus } from "@cipansor/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ComplaintDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: complaint, isLoading } = useComplaint(id);
  const { mutate: updateStatus } = useUpdateComplaintStatus();
  const { mutate: addComment, isPending: isSendingComment } =
    useAddComplaintComment();
  const { user } = useAuth();
  const [comment, setComment] = useState("");

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8 text-center">Loading...</div>
      </MainLayout>
    );
  }

  if (!complaint) {
    return (
      <MainLayout>
        <div className="p-8 text-center">Aduan tidak ditemukan.</div>
      </MainLayout>
    );
  }

  // Check if user is admin/staff based on UserRole enum values (legacy format in JWT)
  // Teachers are excluded from management actions (status update, assignment)
  const role = user?.role || "";
  const isAdminOrStaff =
    role === "SUPER_ADMIN" || role === "UNIT_ADMIN" || role === "STAFF";

  const handleStatusChange = (status: string) => {
    updateStatus({ id, status: status as ComplaintStatus });
  };

  const handleSendComment = () => {
    if (!comment.trim()) return;
    addComment(
      { id, content: comment, isInternal: false },
      {
        onSuccess: () => setComment(""),
      },
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Menunggu</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary">Diproses</Badge>;
      case "RESOLVED":
        return (
          <Badge variant="default" className="bg-green-600">
            Selesai
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Link href="/quality/complaints">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {complaint.subject}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>
                {format(new Date(complaint.createdAt), "dd MMMM yyyy HH:mm", {
                  locale: idLocale,
                })}
              </span>
              <span>•</span>
              <span className="font-medium text-foreground">
                {complaint.category}
              </span>
            </div>
          </div>
          <div>{getStatusBadge(complaint.status)}</div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="prose max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">{complaint.description}</p>
                </div>

                {complaint.location && (
                  <div className="text-sm bg-muted p-3 rounded-md">
                    <span className="font-semibold">Lokasi:</span>{" "}
                    {complaint.location}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Diskusi</h3>
              <div className="space-y-4">
                {complaint.comments?.map((c: any) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {c.user?.name || "User"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(c.createdAt), "dd MMM HH:mm", {
                            locale: idLocale,
                          })}
                        </span>
                      </div>
                      <div className="text-sm p-3 bg-muted/50 rounded-md">
                        {c.content}
                      </div>
                    </div>
                  </div>
                ))}

                {complaint.comments?.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Belum ada komentar.
                  </p>
                )}
              </div>

              <div className="flex gap-2 items-start pt-4 border-t">
                <Textarea
                  placeholder="Tulis komentar..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1 min-h-[80px]"
                />
                <Button
                  onClick={handleSendComment}
                  disabled={isSendingComment || !comment.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Informasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Pelapor</div>
                  <div className="font-medium">
                    {complaint.isAnonymous
                      ? "Anonim"
                      : complaint.user?.name || "-"}
                  </div>
                  {!complaint.isAnonymous && complaint.user?.role && (
                    <div className="text-xs text-muted-foreground capitalize">
                      {complaint.user.role.toLowerCase().replace("_", " ")}
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <div className="text-muted-foreground mb-1">Petugas</div>
                  <div className="font-medium">
                    {complaint.assignedTo?.name || "Belum ditugaskan"}
                  </div>
                </div>

                {isAdminOrStaff && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-muted-foreground">Update Status</div>
                      <Select
                        value={complaint.status}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Menunggu</SelectItem>
                          <SelectItem value="IN_PROGRESS">Diproses</SelectItem>
                          <SelectItem value="RESOLVED">Selesai</SelectItem>
                          <SelectItem value="REJECTED">Ditolak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
