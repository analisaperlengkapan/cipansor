"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ArrowRight,
  X,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type AlertSeverity = "critical" | "warning" | "info" | "success";

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp?: Date;
  actionLabel?: string;
  actionUrl?: string;
  dismissible?: boolean;
  count?: number;
  metadata?: Record<string, string | number>;
}

interface AlertCardProps {
  title?: string;
  alerts: AlertItem[];
  onDismiss?: (id: string) => void;
  onAction?: (alert: AlertItem) => void;
  maxItems?: number;
  showViewAll?: boolean;
  viewAllUrl?: string;
  className?: string;
  compact?: boolean;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-900",
    iconColor: "text-red-600 dark:text-red-400",
    badgeVariant: "destructive" as const,
  },
  warning: {
    icon: AlertCircle,
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-900",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeVariant: "secondary" as const,
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-900",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeVariant: "secondary" as const,
  },
  success: {
    icon: CheckCircle2,
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-900",
    iconColor: "text-green-600 dark:text-green-400",
    badgeVariant: "outline" as const,
  },
};

export function AlertCard({
  title = "Notifikasi & Peringatan",
  alerts,
  onDismiss,
  onAction,
  maxItems = 5,
  showViewAll = true,
  viewAllUrl,
  className,
  compact = false,
}: AlertCardProps) {
  const displayedAlerts = alerts.slice(0, maxItems);
  const hasMore = alerts.length > maxItems;

  // Sort by severity (critical first) then by timestamp
  const sortedAlerts = [...displayedAlerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    if (a.timestamp && b.timestamp) {
      return b.timestamp.getTime() - a.timestamp.getTime();
    }
    return 0;
  });

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  if (alerts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
            <p className="text-sm">Tidak ada peringatan saat ini</p>
            <p className="text-xs mt-1">Semua sistem berjalan normal</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {title}
            {alerts.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalCount} kritis
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge
                variant="outline"
                className="text-xs border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
              >
                {warningCount} peringatan
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {sortedAlerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  config.bgColor,
                  config.borderColor,
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={cn(
                      "h-5 w-5 mt-0.5 flex-shrink-0",
                      config.iconColor,
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{alert.title}</p>
                      {alert.count && alert.count > 1 && (
                        <Badge variant="outline" className="text-xs">
                          {alert.count}x
                        </Badge>
                      )}
                    </div>
                    {!compact && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {alert.message}
                      </p>
                    )}
                    {alert.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(alert.timestamp)}
                      </p>
                    )}
                    {/* Metadata */}
                    {alert.metadata &&
                      Object.keys(alert.metadata).length > 0 &&
                      !compact && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(alert.metadata).map(
                            ([key, value]) => (
                              <span
                                key={key}
                                className="text-xs bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded"
                              >
                                {key}: <strong>{value}</strong>
                              </span>
                            ),
                          )}
                        </div>
                      )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {alert.actionUrl ? (
                      <Link href={alert.actionUrl}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                        >
                          {alert.actionLabel || "Lihat"}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      alert.actionLabel &&
                      onAction && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => onAction(alert)}
                        >
                          {alert.actionLabel}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      )
                    )}
                    {alert.dismissible && onDismiss && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onDismiss(alert.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View all link */}
        {showViewAll && hasMore && viewAllUrl && (
          <div className="mt-3 pt-3 border-t">
            <Link href={viewAllUrl}>
              <Button variant="ghost" className="w-full text-sm">
                Lihat semua ({alerts.length} notifikasi)
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}

export default AlertCard;
