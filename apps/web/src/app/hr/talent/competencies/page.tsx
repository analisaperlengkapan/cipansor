"use client";

import { CompetencyList } from "@/components/hr/talent/CompetencyList";
import { PageHeader } from "@/components/shared/page-header";

export default function CompetenciesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Competencies"
        description="Manage the competency dictionary for talent management."
      />
      <CompetencyList />
    </div>
  );
}
