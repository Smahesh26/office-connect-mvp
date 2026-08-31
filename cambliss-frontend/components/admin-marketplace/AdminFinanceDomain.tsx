"use client";

import { useState } from "react";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export const AdminFinanceDomain = ({
  subView,
}: {
  subView: "payments" | "commissions" | "settlements" | "payouts";
}) => {
  const [rates, setRates] = useState({
    electronics: 8.5,
    apparel: 12.0,
    beauty: 15.0,
    computing: 7.5,
    auto: 10.0,
  });

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none text-xs">
      
      {/* 1. PAYMENTS */}
      {subView === "payments" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Marketplace Inflow Payments Ledger (₹1.28 Cr MTD)
              </h3>
              <p className="text-xs text-slate-500">Multi-gateway split: Razorpay, Stripe, UPI Intent, & B2B Invoicing</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
              Escrow Vault Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded border bg-slate-50">
              <span className="text-[10px] text-slate-500 uppercase font-extrabold block">UPI Direct</span>
              <strong className="text-base font-black text-slate-900">{formatINR(7420000)}</strong>
              <span className="text-[10px] text-emerald-600 font-bold block pt-1">58% Inflow Share</span>
            </div>
            <div className="p-4 rounded border bg-slate-50">
              <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Credit / Debit Cards</span>
              <strong className="text-base font-black text-slate-900">{formatINR(3840000)}</strong>
              <span className="text-[10px] text-emerald-600 font-bold block pt-1">30% Inflow Share</span>
            </div>
            <div className="p-4 rounded border bg-slate-50">
              <span className="text-[10px] text-slate-500 uppercase font-extrabold block">B2B NetBanking</span>
              <strong className="text-base font-black text-slate-900">{formatINR(1540000)}</strong>
              <span className="text-[10px] text-emerald-600 font-bold block pt-1">12% Inflow Share</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. COMMISSIONS (TAKE-RATE ENGINE) */}
      {subView === "commissions" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Category Take-Rate & Commission Engine
            </h3>
            <p className="text-xs text-slate-500">Configure marketplace revenue take-rate percentages per department</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded border bg-slate-50 space-y-1">
              <label className="font-bold text-slate-800 block">⚡ Electronics & Audio (%)</label>
              <input
                type="number"
                value={rates.electronics}
                onChange={(e) => setRates({ ...rates, electronics: Number(e.target.value) })}
                className="w-full px-2 py-1 border rounded font-black text-indigo-900"
              />
            </div>
            <div className="p-3 rounded border bg-slate-50 space-y-1">
              <label className="font-bold text-slate-800 block">👕 Apparel & Fashion (%)</label>
              <input
                type="number"
                value={rates.apparel}
                onChange={(e) => setRates({ ...rates, apparel: Number(e.target.value) })}
                className="w-full px-2 py-1 border rounded font-black text-indigo-900"
              />
            </div>
            <div className="p-3 rounded border bg-slate-50 space-y-1">
              <label className="font-bold text-slate-800 block">🌸 Skincare & Beauty (%)</label>
              <input
                type="number"
                value={rates.beauty}
                onChange={(e) => setRates({ ...rates, beauty: Number(e.target.value) })}
                className="w-full px-2 py-1 border rounded font-black text-indigo-900"
              />
            </div>
            <div className="p-3 rounded border bg-slate-50 space-y-1">
              <label className="font-bold text-slate-800 block">💻 Enterprise Computing (%)</label>
              <input
                type="number"
                value={rates.computing}
                onChange={(e) => setRates({ ...rates, computing: Number(e.target.value) })}
                className="w-full px-2 py-1 border rounded font-black text-indigo-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. SETTLEMENTS & 4. PAYOUTS */}
      {(subView === "settlements" || subView === "payouts") && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Merchant Settlements & Bank Payouts Dispatch
              </h3>
              <p className="text-xs text-slate-500">Bi-monthly automated NEFT/RTGS payouts with TCS/TDS deductions</p>
            </div>
            <button
              type="button"
              onClick={() => alert("Dispatching automated NEFT settlement batch to HDFC Corporate Gateway...")}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs"
            >
              🚀 Dispatch Payout Batch ({formatINR(342100)})
            </button>
          </div>

          <div className="p-4 rounded border bg-slate-50 space-y-2">
            <span className="font-bold text-slate-900">Upcoming Settlement: Sept 2, 2026</span>
            <p className="text-slate-600 text-[11px]">
              Sony India Direct (₹3,42,100) • Keychron India (₹1,84,200) • TCS 1% & TDS 194-O auto-deducted.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
