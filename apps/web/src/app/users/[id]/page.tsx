"use client";

import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components/shared";
import { useUser } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Building2,
  Calendar,
  Shield,
} from "lucide-react";
import Link from "next/link";

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800",
  UNIT_ADMIN: "bg-blue-100 text-blue-800",
  TEACHER: "bg-green-100 text-green-800",
  STAFF: "bg-orange-100 text-orange-800",
  STUDENT: "bg-cyan-100 text-cyan-800",
  PARENT: "bg-pink-100 text-pink-800",
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  UNIT_ADMIN: "Unit Admin",
  TEACHER: "Teacher",
  STAFF: "Staff",
  STUDENT: "Student",
  PARENT: "Parent",
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: user, isLoading } = useUser(params.id as string);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">User not found</p>
          <Button variant="outline" onClick={() => router.push("/users")}>
            Back to Users
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout allowedRoles={["SUPER_ADMIN", "UNIT_ADMIN"]}>
      <div className="space-y-6">
        <PageHeader title={user.name} description={user.email}>
          <Button variant="outline" asChild>
            <Link href="/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/users/${user.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/users/${user.id}/roles`}>
              <Shield className="mr-2 h-4 w-4" />
              Manage Roles
            </Link>
          </Button>
        </PageHeader>

        {/* Status Banner */}
        <div className="flex items-center gap-4">
          <Badge className={roleColors[user.role]}>
            <Shield className="mr-1 h-3 w-3" />
            {roleLabels[user.role]}
          </Badge>
          <Badge variant={user.isActive ? "default" : "secondary"}>
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
          {user.unit && (
            <Badge variant="outline">
              <Building2 className="mr-1 h-3 w-3" />
              {user.unit.name}
            </Badge>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Full Name" value={user.name} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Role" value={roleLabels[user.role]} />
              <InfoRow
                label="Status"
                value={user.isActive ? "Active" : "Inactive"}
              />
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                label="Unit"
                value={user.unit?.name || "No unit assigned"}
              />
              <InfoRow label="Unit Type" value={user.unit?.type || "-"} />
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoRow
                label="Created At"
                value={format(new Date(user.createdAt), "dd MMMM yyyy, HH:mm")}
              />
              <InfoRow
                label="Last Updated"
                value={format(new Date(user.updatedAt), "dd MMMM yyyy, HH:mm")}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
