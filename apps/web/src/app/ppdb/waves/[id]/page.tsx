"use client";

// Legacy `/ppdb/waves/[id]` detail page. The PSB and PPDB modules have been
// unified under `/admissions`, and `@/hooks/use-ppdb-wave` was deleted in
// favor of `@/hooks/use-admissions`. This file is reduced to a redirect to
// the new admissions wave UI so any old in-app links / bookmarks keep
// working without erroring out at build time on the now-missing imports.
//
// The live wave UI lives at `apps/web/src/app/admissions/waves/page.tsx`.
// The legacy ~540-line `WaveDetailPage` body that lived below has been
// deleted entirely (it referenced removed hooks `useWave`,
// `useWaveRegistrants`, `useUpdateWaveStatus`, `useUpdateRegistrantStatus`,
// `useUpdateRegistrantScores` and removed constants/utilities
// `WAVE_STATUSES`, `REGISTRANT_STATUSES`, `getNextStatus`,
// `calculateQuotaPercentage`, `formatRegistrationFee`).

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface __LegacyProps {
  params: Promise<{ id: string }>;
}

export default function LegacyWaveDetailRedirect(_props: __LegacyProps) {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admissions/waves");
  }, [router]);
  return null;
}

// The legacy `WaveDetailPage` implementation has been removed entirely.
// It referenced hooks (`useWave`, `useWaveRegistrants`, `useUpdateWaveStatus`,
// `useUpdateRegistrantStatus`, `useUpdateRegistrantScores`) and
// constants/utilities (`WAVE_STATUSES`, `REGISTRANT_STATUSES`,
// `getNextStatus`, `calculateQuotaPercentage`, `formatRegistrationFee`)
// that were deleted in this PR. The live wave UI lives at
// `apps/web/src/app/admissions/waves/page.tsx`.











