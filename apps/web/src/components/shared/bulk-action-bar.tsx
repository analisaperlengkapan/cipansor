/**
 * Bulk Action Bar Component
 * Displays actions for selected items
 */

"use client";

import { X, Trash2, Download, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline";
  }>;
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onDelete,
  onExport,
  actions,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border bg-muted/50 p-3",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} dari {totalCount} item dipilih
        </span>
        {onSelectAll && selectedCount < totalCount && (
          <Button
            variant="link"
            size="sm"
            onClick={onSelectAll}
            className="h-auto p-0 text-sm"
          >
            Pilih semua {totalCount} item
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
        {actions?.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || "outline"}
            size="sm"
            onClick={action.onClick}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        {onDelete && (
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-4 w-4" />
          <span className="sr-only">Batal</span>
        </Button>
      </div>
    </div>
  );
}
