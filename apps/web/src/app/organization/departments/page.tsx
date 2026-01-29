"use client";
import { PageHeader } from "@/components/shared";

export default function DepartmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage organization departments"
        action={{ label: "Add Department", href: "/organization/departments/new" }}
      />
      <div className="p-4 border rounded-lg bg-card">
        <p className="text-muted-foreground text-center py-10">
          Department list and tree view coming soon.
        </p>
      </div>
    </div>
  );
}
