/**
 * Stats Card Component
 * Reusable stats card for dashboards
 */

import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  isLoading?: boolean;
  className?: string;
  valueClassName?: string;
  negative?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendLabel,
  isLoading,
  className,
  valueClassName,
  negative,
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="mt-2 h-4 w-24" />
          </>
        ) : (
          <>
            <div className={cn('text-2xl font-bold', valueClassName)}>
              {value}
            </div>
            {(description || trend !== undefined) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {trend !== undefined && (
                  <span
                    className={cn(
                      'flex items-center gap-0.5',
                      trend > 0
                        ? negative
                          ? 'text-red-500'
                          : 'text-green-500'
                        : trend < 0
                          ? negative
                            ? 'text-green-500'
                            : 'text-red-500'
                          : ''
                    )}
                  >
                    {trend > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : trend < 0 ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : null}
                    {trend > 0 ? '+' : ''}
                    {trend}%
                  </span>
                )}
                {trendLabel && <span>{trendLabel}</span>}
                {description && !trend && <span>{description}</span>}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
