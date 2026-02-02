"use client";

import { ReviewCycleList } from "@/components/hr/talent/ReviewCycleList";
import { PageHeader } from "@/components/shared/page-header";

export default function PerformanceReviewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Reviews"
        description="Manage performance review cycles and assessments."
      />
      <ReviewCycleList />
    </div>
  );
}
