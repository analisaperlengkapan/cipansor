"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PpdbRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(qs ? `/admissions?${qs}` : "/admissions");
  }, [router, searchParams]);
  return null;
}

export default function PpdbRedirect() {
  return (
    <Suspense>
      <PpdbRedirectInner />
    </Suspense>
  );
}
