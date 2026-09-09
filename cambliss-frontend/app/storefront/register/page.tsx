"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StorefrontRegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/seller-central");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-bold text-slate-600">
      Redirecting to Office Connect Seller Central...
    </div>
  );
}
