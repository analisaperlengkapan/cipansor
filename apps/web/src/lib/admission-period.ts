/**
 * Whether an admission period is actually open right now.
 *
 * `isActive` is an administrative flag, not a schedule: a period stays flagged
 * active long after its window closes. Anything that tells a visitor whether
 * they can register must compare against the dates, and must do it the same
 * way everywhere — the homepage badge claimed "SPMB 2026 Telah Dibuka" while
 * the registration page it linked to said "Pendaftaran Telah Ditutup", because
 * the badge was fixed page copy and only the form consulted the record.
 */
export type PeriodWindow = "none" | "upcoming" | "open" | "closed";

export interface AdmissionPeriodWindow {
  startDate: string | Date;
  endDate: string | Date;
}

export function getPeriodWindow(
  period: AdmissionPeriodWindow | null | undefined,
  now: Date = new Date(),
): PeriodWindow {
  if (!period) return "none";
  if (now < new Date(period.startDate)) return "upcoming";
  if (now > new Date(period.endDate)) return "closed";
  return "open";
}
