"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StoreRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/storefront");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800 font-bold">
      <p>Redirecting to Marketplace Storefront...</p>
    </div>
  );
}
