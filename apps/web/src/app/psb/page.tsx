"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PsbRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admissions");
  }, [router]);
  return null;
}
