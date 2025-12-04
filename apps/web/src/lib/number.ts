/**
 * Number and currency formatting utilities
 */

/**
 * Format number with Indonesian locale
 */
export function formatNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) return '-';
  
  return value.toLocaleString('id-ID', options);
}

/**
 * Format currency in Indonesian Rupiah
 */
export function formatCurrency(
  value: number | null | undefined,
  options?: { compact?: boolean; showPrefix?: boolean }
): string {
  if (value === null || value === undefined) return '-';
  
  const { compact = false, showPrefix = true } = options || {};
  
  if (compact && value >= 1000000000) {
    return `${showPrefix ? 'Rp ' : ''}${(value / 1000000000).toFixed(1)}M`;
  }
  if (compact && value >= 1000000) {
    return `${showPrefix ? 'Rp ' : ''}${(value / 1000000).toFixed(1)}Jt`;
  }
  if (compact && value >= 1000) {
    return `${showPrefix ? 'Rp ' : ''}${(value / 1000).toFixed(0)}Rb`;
  }
  
  const formatted = value.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return showPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined) return '-';
  
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '-';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format ordinal number (1st, 2nd, 3rd, etc.) in Indonesian
 */
export function formatOrdinal(n: number): string {
  return `ke-${n}`;
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  // Remove currency symbol, spaces, and thousand separators
  const cleaned = value.replace(/[Rp\s.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';
  
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format Indonesian phone number
  if (digits.startsWith('62')) {
    const local = digits.slice(2);
    if (local.length === 10) {
      return `+62 ${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
    }
    if (local.length === 11) {
      return `+62 ${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
    }
  }
  
  if (digits.startsWith('0')) {
    const local = digits.slice(1);
    if (local.length === 10) {
      return `0${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
    }
    if (local.length === 11) {
      return `0${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
    }
  }
  
  return phone;
}

/**
 * Format NIK (Indonesian ID Number)
 */
export function formatNIK(nik: string | null | undefined): string {
  if (!nik) return '-';
  
  const digits = nik.replace(/\D/g, '');
  
  if (digits.length !== 16) return nik;
  
  return `${digits.slice(0, 6)}.${digits.slice(6, 12)}.${digits.slice(12)}`;
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Format duration in minutes to hours and minutes
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '-';
  
  if (minutes < 60) {
    return `${minutes} menit`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} jam`;
  }
  
  return `${hours} jam ${remainingMinutes} menit`;
}

/**
 * Generate random ID
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}
