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
                Global Marketplace Orders (284 Orders Today)
              </h3>
              <p className="text-xs text-slate-500">Multi-package routing and carrier logistics telemetry</p>
            </div>
            <span className="font-bold text-slate-700">Today GMV: {formatINR(842900)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-slate-400 font-extrabold text-[10px] uppercase">
                  <th className="pb-2">Order ID & Date</th>
                  <th className="pb-2">Buyer</th>
                  <th className="pb-2">Packages</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-right">Escrow Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr className="hover:bg-slate-50">
                  <td className="py-3">
                    <strong className="text-slate-900 block font-mono">#OC-89412</strong>
                    <span className="text-[11px] text-slate-400">Aug 31, 2026 • 12:45 PM</span>
                  </td>
                  <td className="py-3">
                    <strong className="text-slate-800">Bhasker Anand</strong>
                    <span className="text-[11px] text-slate-500 block">Cambliss Studio</span>
                  </td>
                  <td className="py-3">
                    <span className="text-slate-700">2 Packages (Sony + Keychron)</span>
                  </td>
                  <td className="py-3 text-right font-black text-slate-900">{formatINR(53980)}</td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-black text-[10px]">
                      🔒 Escrow Held
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
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
          <div className="p-4 rounded border bg-slate-50 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900">RMA-4819: Keychron Q1 Pro (Damaged in Transit)</span>
              <p className="text-slate-500 text-[11px]">Buyer: Bhasker Anand • Seller: Keychron India</p>
            </div>
            <button
              type="button"
              onClick={() => alert("Arbitration resolved: Full refund approved from courier insurance.")}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs"
            >
              Approve Return & Reverse Pickup
            </button>
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
            <p className="text-slate-600 text-[11px]">Direct bank reversals dispatched within 2 hours of RMA inspection pass.</p>
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
          <div className="p-4 rounded border bg-slate-50 space-y-2">
            <span className="font-bold text-slate-900">⭐⭐⭐⭐⭐ Sony WH-1000XM5 (Verified Purchase)</span>
            <p className="text-slate-700 italic text-[11px]">&quot;Exceptional noise canceling for office executive calls.&quot;</p>
            <span className="text-[10px] text-emerald-700 font-black">Status: Published (Automated Trust Pass)</span>
          </div>
        </div>
      )}

    </div>
  );
};
