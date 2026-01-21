/**
 * Detail Item Component
 * Displays key-value pairs in detail pages
 */

import { cn } from "@/lib/utils";

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function DetailItem({ label, value, className }: DetailItemProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value || "-"}</dd>
    </div>
  );
}

interface DetailGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function DetailGrid({
  children,
  columns = 2,
  className,
}: DetailGridProps) {
  const colsClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <dl className={cn("grid gap-4", colsClass[columns], className)}>
      {children}
    </dl>
  );
}
