"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PsbRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(qs ? `/admissions?${qs}` : "/admissions");
  }, [router, searchParams]);
  return null;
}
