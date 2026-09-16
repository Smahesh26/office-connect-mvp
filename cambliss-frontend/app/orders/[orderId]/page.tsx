"use client";

import { use } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";

export default function OrderTrackingDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);

  const orderData = {
    orderNumber: orderId || "OC-NEW",
    packages: [] as any[],
  };

  return (
    <StorefrontShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center space-y-4 select-none">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-2xl mx-auto">
          📦
        </div>
        <h2 className="text-xl font-bold text-slate-900">Order #{orderData.orderNumber}</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No live shipment packages currently assigned to this order ID. When you purchase products from registered merchants, tracking will appear here.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/orders"
            className="inline-block px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded transition"
          >
            View All Orders
          </Link>
          <Link
            href="/storefront"
            className="inline-block px-4 py-2 bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs rounded transition"
          >
            Explore Marketplace
          </Link>
        </div>
      </div>
    </StorefrontShell>
  );
}
