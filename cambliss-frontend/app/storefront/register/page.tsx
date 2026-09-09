"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function StorefrontRegisterRedirect() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-bold text-slate-600">Redirecting to Storefront Portal...</div>}>
      <RedirectHandler />
    </Suspense>
  );
}

function RedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get("mode") || "customer";
    const next = searchParams.get("next");
    const target = `/storefront/signup?mode=${encodeURIComponent(mode)}${next ? `&next=${encodeURIComponent(next)}` : ""}`;
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500">
      Redirecting to Office Connect Storefront Portal...
    </div>
  );
}
