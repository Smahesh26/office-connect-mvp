"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";

export const SellerDashboardMetrics = ({
  stats,
}: {
  stats: {
    gmvSales: number;
    netEarnings: number;
    escrowLocked: number;
    ordersPendingDispatch: number;
    sellerRating: number;
    onTimeFulfillmentPct: number;
  };
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      
      {/* 1. GMV Gross Sales */}
      <div className="p-5 rounded-[8px] border border-slate-200 bg-white space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
            Gross Sales (30 Days)
          </span>
          <span className="text-emerald-600 font-black text-xs">↑ 18.4%</span>
        </div>
        <div className="text-2xl font-black text-slate-900">{formatINR(stats.gmvSales)}</div>
        <p className="text-[11px] text-slate-400">Total multi-vendor customer GMV</p>
      </div>

      {/* 2. Net Merchant Earnings */}
      <div className="p-5 rounded-[8px] border border-slate-200 bg-white space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
            Net Payouts (After 8.5% Cut)
          </span>
          <span className="text-blue-600 font-black text-xs">Settled</span>
        </div>
        <div className="text-2xl font-black text-slate-900">{formatINR(stats.netEarnings)}</div>
        <p className="text-[11px] text-slate-400">Disbursed directly to primary bank</p>
      </div>

      {/* 3. Escrow Vault Locked */}
      <div className="p-5 rounded-[8px] border border-slate-200 bg-white space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
            Escrow Reserves (T+2)
          </span>
          <span className="text-amber-600 font-black text-xs">🛡️ Protected</span>
        </div>
        <div className="text-2xl font-black text-amber-600">{formatINR(stats.escrowLocked)}</div>
        <p className="text-[11px] text-slate-400">Releases upon buyer delivery OTP scan</p>
      </div>

      {/* 4. Fulfillment & Health Score */}
      <div className="p-5 rounded-[8px] border border-slate-200 bg-white space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
            Seller Health SLA
          </span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded">
            LEVEL 5 GOLD
          </span>
        </div>
        <div className="text-2xl font-black text-slate-900">{stats.onTimeFulfillmentPct}%</div>
        <p className="text-[11px] text-slate-400">
          ★ {stats.sellerRating.toFixed(1)} Rating • {stats.ordersPendingDispatch} orders to ship
        </p>
      </div>

    </div>
  );
};
