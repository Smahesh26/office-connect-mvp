"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";

export const AccountRefundsLedger = () => {
  const refunds = [
    {
      id: "RF-98214",
      orderId: "OC-77182",
      product: "Logitech MX Master 3S Wireless Mouse",
      amount: 8995,
      method: "Original Payment Source (UPI: bhasker@okaxis)",
      utr: "UTR-AXIS-99281048",
      status: "Settled in Bank",
      date: "Aug 18, 2026",
    },
    {
      id: "RF-94102",
      orderId: "OC-66019",
      product: "Anker 737 Power Bank (PowerCore 24K)",
      amount: 12499,
      method: "HDFC Credit Card (•••• 8821)",
      utr: "UTR-HDFC-18492011",
      status: "Settled in Bank",
      date: "Jul 29, 2026",
    },
  ];

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none">
      
      <div className="pb-4 border-b border-slate-100">
        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
          Escrow Refunds & Reversals Ledger
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Automated escrow payout reversals with verified banking UTR reference numbers
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {refunds.map((ref) => (
          <div key={ref.id} className="py-4 space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-slate-900">{ref.id}</span>
                <span className="text-slate-400">• Order {ref.orderId}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-[10px] uppercase self-start sm:self-auto">
                ✓ {ref.status}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h5 className="font-bold text-slate-800">{ref.product}</h5>
                <span className="text-slate-500 text-[11px] block">
                  Refunded to: {ref.method}
                </span>
                <span className="text-slate-400 font-mono text-[10px] block">
                  Bank UTR: <strong>{ref.utr}</strong> • Date: {ref.date}
                </span>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-sm font-black text-emerald-700">
                  +{formatINR(ref.amount)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
