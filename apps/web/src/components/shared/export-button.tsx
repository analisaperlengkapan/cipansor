/**
 * Export Button Component
 * Provides export functionality for data tables
 */

"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type ExportFormat = "json" | "csv";

interface ExportButtonProps {
  data: unknown;
  filename: string;
  disabled?: boolean;
  onExport?: (format: ExportFormat) => Promise<void> | void;
}

export function ExportButton({
  data,
  filename,
  disabled,
  onExport,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      if (onExport) {
        await onExport(format);
      } else {
        downloadData(data, filename, format);
      }
      toast.success(`Data berhasil diexport ke ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Gagal mengexport data");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJson className="mr-2 h-4 w-4" />
          Export JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function downloadData(data: unknown, filename: string, format: ExportFormat) {
  let blob: Blob;
  let extension: string;

  const dateStr = new Date().toISOString().split("T")[0];
  const fullFilename = `${filename}_${dateStr}`;

  if (format === "csv") {
    const csvContent = convertToCSV(data);
    blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    extension = "csv";
  } else {
    blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    extension = "json";
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fullFilename}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function convertToCSV(data: unknown): string {
  if (!data || typeof data !== "object") return "";

  // Handle paginated response
  const items = Array.isArray(data)
    ? data
    : (data as { data?: unknown[] }).data;

  if (!Array.isArray(items) || items.length === 0) return "";

  const headers = Object.keys(items[0] as Record<string, unknown>);
  const csvRows: string[] = [];

  // BOM for Excel UTF-8
  csvRows.push("\ufeff" + headers.join(","));

  for (const item of items) {
    const values = headers.map((header) => {
      const value = (item as Record<string, unknown>)[header];
      const stringValue = formatCSVValue(value);
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

function formatCSVValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
