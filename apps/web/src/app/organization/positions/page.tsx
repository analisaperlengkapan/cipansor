"use client";
import { PageHeader } from "@/components/shared";

export default function PositionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Positions"
        description="Manage organization positions and job titles"
        action={{ label: "Add Position", href: "/organization/positions/new" }}
      />
      <div className="p-4 border rounded-lg bg-card">
        <p className="text-muted-foreground text-center py-10">
          Position list and tree view coming soon.
        </p>
      </div>
    </div>
  );
}
