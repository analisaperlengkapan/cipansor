"use client";
import { PageHeader } from "@/components/shared";

export default function StructurePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Structure"
        description="Visual representation of the organization hierarchy"
      />
      <div className="p-4 border rounded-lg bg-card">
        <p className="text-muted-foreground text-center py-10">
          Organization Chart Visualization coming soon.
        </p>
      </div>
    </div>
  );
}
