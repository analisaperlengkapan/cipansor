"use client";

import { TrainingList } from "@/components/hr/talent/TrainingList";
import { PageHeader } from "@/components/shared/page-header";

export default function TrainingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Training & Development"
        description="Manage training programs and employee development."
      />
      <TrainingList />
    </div>
  );
}
