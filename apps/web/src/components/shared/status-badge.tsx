/**
 * Status Badge Component
 * Displays status with consistent colors
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default';

const statusStyles: Record<StatusType, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

// Common status mappings
const statusTypeMap: Record<string, StatusType> = {
  // Student statuses
  ACTIVE: 'success',
  INACTIVE: 'default',
  GRADUATED: 'info',
  DROPPED_OUT: 'error',
  
  // Attendance statuses
  PRESENT: 'success',
  ABSENT: 'error',
  LATE: 'warning',
  SICK: 'info',
  PERMITTED: 'info', // Legacy support
  EXCUSED: 'info',
  
  // Permit statuses
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  COMPLETED: 'default',
  
  // Payment statuses
  PAID: 'success',
  UNPAID: 'error',
  PARTIAL: 'warning',
  OVERDUE: 'error',
  
  // Leave statuses
  CANCELLED: 'error',
  
  // General
  YES: 'success',
  NO: 'error',
  TRUE: 'success',
  FALSE: 'error',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
  statusType?: StatusType;
}

export function StatusBadge({ status, label, className, statusType }: StatusBadgeProps) {
  const type = statusType || statusTypeMap[status.toUpperCase()] || 'default';
  const displayLabel = label || status.replace(/_/g, ' ');

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-transparent font-normal capitalize',
        statusStyles[type],
        className
      )}
    >
      {displayLabel}
    </Badge>
  );
}
