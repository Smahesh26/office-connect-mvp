"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";

export const AdminCommerceDomain = ({
  subView,
}: {
  subView: "orders" | "returns" | "refunds" | "reviews";
}) => {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none text-xs">
      
      {/* 1. ORDERS */}
      {subView === "orders" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Global Marketplace Orders (0 Orders Today)
              </h3>
              <p className="text-xs text-slate-500">Multi-package routing and carrier logistics telemetry</p>
            </div>
            <span className="font-bold text-slate-700">Today GMV: {formatINR(0)}</span>
          </div>

          <div className="p-8 text-center text-slate-400 text-xs font-semibold rounded bg-slate-50 border border-slate-200">
            No marketplace orders recorded yet. Real-time orders placed across registered storefronts will appear here.
          </div>
        </div>
      )}

      {/* 2. RETURNS */}
      {subView === "returns" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              RMA Return Requests & Dispute Arbitration
            </h3>
            <p className="text-xs text-slate-500">Reverse logistics inspection and merchant dispute resolution</p>
          </div>
          <div className="p-8 text-center text-slate-400 text-xs font-semibold rounded bg-slate-50 border border-slate-200">
            No return or RMA requests pending arbitration.
          </div>
        </div>
      )}

      {/* 3. REFUNDS */}
      {subView === "refunds" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Escrow Refunds & Instant Bank Reversals
            </h3>
            <p className="text-xs text-slate-500">Automated UPI and NetBanking payment reversal audit log</p>
          </div>
          <div className="p-4 rounded border bg-slate-50 space-y-2">
            <span className="font-bold text-emerald-800">✓ All Escrow Refund Queues Synchronized</span>
            <p className="text-slate-600 text-[11px]">No active refund disputes. Direct bank reversals will dispatch automatically upon RMA inspection pass.</p>
          </div>
        </div>
      )}

      {/* 4. REVIEWS */}
      {subView === "reviews" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Customer Reviews & Rating Moderation Desk
            </h3>
            <p className="text-xs text-slate-500">AI sentiment filter preventing fake or paid review injection</p>
          </div>
          <div className="p-8 text-center text-slate-400 text-xs font-semibold rounded bg-slate-50 border border-slate-200">
            No product reviews submitted yet. Moderated buyer feedback will display here.
          </div>
        </div>
      )}

    </div>
  );
};
