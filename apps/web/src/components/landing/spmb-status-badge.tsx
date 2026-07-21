"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useActivePeriod } from "@/hooks/use-admissions";
import { getPeriodWindow } from "@/lib/admission-period";

/**
 * The homepage badge announcing admission status.
 *
 * It was fixed copy reading "SPMB 2026 Telah Dibuka" — a hardcoded claim that
 * outlived whatever intake it was written for. It contradicted the very page
 * it sat above: the record's most recent period closed on 31 May 2024, so
 * /public/spmb correctly showed "Pendaftaran Telah Ditutup" while the homepage
 * invited people to register. It also named a year no record contained.
 *
 * Now it states only what the record supports, and shows nothing at all when
 * there is no open or upcoming period. The year comes from the period's
 * academic year rather than being written into the markup.
 *
 * The wrapper keeps its height whether or not a badge renders, so resolving
 * the query cannot shift the <h1> beneath it.
 */
export function SpmbStatusBadge() {
  const { data: activePeriod } = useActivePeriod();
  const window = getPeriodWindow(activePeriod);

  const year: string | undefined = activePeriod?.academicYear?.name;
  const label =
    window === "open"
      ? `SPMB ${year ?? ""} Telah Dibuka`.replace(/\s+/g, " ").trim()
      : window === "upcoming"
        ? `SPMB ${year ?? ""} dibuka ${format(
            new Date(activePeriod.startDate),
            "d MMMM yyyy",
            { locale: idLocale },
          )}`
            .replace(/\s+/g, " ")
            .trim()
        : null;

  return (
    <div className="flex h-6 items-center justify-center">
      {label && (
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-primary/10 text-primary">
          {label}
        </span>
      )}
    </div>
  );
}
