"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";

export const SellerFinanceSuite = ({
  activeSubView,
}: {
  activeSubView: "earnings" | "commission" | "settlements" | "payouts";
}) => {
  const settlements = [
    {
      id: "SETTLE-89104",
      cycle: "Aug 16 - Aug 31, 2026",
      grossGmv: 4820000,
      commission: 409700, // 8.5%
      gstOnCommission: 73746, // 18% of commission
      netPayout: 4336554,
      status: "Scheduled for Sept 2",
      utr: "Pending Dispatch",
    },
    {
      id: "SETTLE-87902",
      cycle: "Aug 01 - Aug 15, 2026",
      grossGmv: 3940000,
      commission: 334900,
      gstOnCommission: 60282,
      netPayout: 3544818,
      status: "Disbursed to Bank",
      utr: "UTR-HDFC-991204812",
    },
  ];

  return (
    <div className="space-y-6 select-none">
      
      {/* 1. EARNINGS */}
      {activeSubView === "earnings" && (
        <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-5 shadow-2xs text-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Gross Earnings & Net Realization
            </h3>
            <p className="text-xs text-slate-500">Overview of lifetime and monthly merchant earnings</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded border bg-slate-50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Gross GMV</span>
              <div className="text-xl font-black text-slate-900">{formatINR(8760000)}</div>
              <span className="text-[11px] text-slate-500">Lifetime volume</span>
            </div>
            <div className="p-4 rounded border bg-slate-50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Net Disbursed</span>
              <div className="text-xl font-black text-emerald-700">{formatINR(7881372)}</div>
              <span className="text-[11px] text-emerald-800 font-bold">100% On-time bank payout</span>
            </div>
            <div className="p-4 rounded border bg-emerald-50 border-emerald-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-800">Pending Escrow Balance</span>
              <div className="text-xl font-black text-emerald-900">{formatINR(342100)}</div>
              <span className="text-[11px] text-emerald-700">Releases upon delivery scan</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. COMMISSION (8.5%) */}
      {activeSubView === "commission" && (
        <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-5 shadow-2xs text-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Platform Take-Rate & Commission Schedule
            </h3>
            <p className="text-xs text-slate-500">Transparent marketplace fees with GST tax invoice credit</p>
          </div>

          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
              <span>Standard Electronics Commission:</span>
              <span className="font-black text-[#404d85]">8.5% of Selling Price</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Includes payment gateway processing fees, escrow vault guarantee, customer service desk, and Bluedart Air priority logistics integration.
            </p>
          </div>
        </div>
      )}

      {/* 3. SETTLEMENTS & PAYOUTS */}
      {(activeSubView === "settlements" || activeSubView === "payouts") && (
        <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs text-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Settlement Cycles & Bank Dispatches
              </h3>
              <p className="text-xs text-slate-500">Bi-monthly automated NEFT/RTGS payouts to registered bank account</p>
            </div>
            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
              HDFC Bank (A/C •••• 9921)
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {settlements.map((s) => (
              <div key={s.id} className="py-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm">{s.id}</span>
                    <span className="text-slate-500 font-medium">({s.cycle})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                    s.status.includes("Disbursed")
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-blue-50 text-blue-800 border border-blue-200"
                  }`}>
                    {s.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Gross GMV:</span>
                    <strong className="text-slate-900">{formatINR(s.grossGmv)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Commission (8.5%):</span>
                    <strong className="text-red-600">-{formatINR(s.commission)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">GST on Commission (18%):</span>
                    <strong className="text-slate-700">-{formatINR(s.gstOnCommission)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Net Payout to Bank:</span>
                    <strong className="text-sm font-black text-emerald-700">{formatINR(s.netPayout)}</strong>
                  </div>
                </div>

                {s.utr !== "Pending Dispatch" && (
                  <div className="text-[10px] font-mono text-slate-500 pt-1">
                    Bank UTR Reference: <strong className="text-slate-800">{s.utr}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
