"use client";

import { useState } from "react";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export const SellerPricingPromos = ({
  viewType,
}: {
  viewType: "pricing" | "promotions" | "store" | "settings" | "inventory" | "analytics";
}) => {
  const [promos] = useState([
    {
      id: "PR-102",
      code: "SONYFEST2000",
      type: "Flat ₹2,000 Off",
      minOrder: 20000,
      claims: 184,
      status: "Active",
    },
    {
      id: "PR-103",
      code: "EARBUD10",
      type: "10% Instant Discount",
      minOrder: 15000,
      claims: 92,
      status: "Active",
    },
  ]);

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none text-xs">
      
      {/* 1. PRICING */}
      {viewType === "pricing" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Automated Buy Box & Pricing Intelligence
              </h3>
              <p className="text-xs text-slate-500">Monitor competitor offers and automatically match lowest winning Buy Box price</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-black text-xs">
              👑 96.4% Buy Box Win Rate
            </span>
          </div>

          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Sony WH-1000XM5 Wireless Headphones</span>
              <strong className="text-slate-900 font-mono">{formatINR(29990)} (Buy Box Winner)</strong>
            </div>
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span>Next Lowest Competitor: AudioTech India ({formatINR(30499)})</span>
              <span className="text-emerald-700 font-bold">Your price is ₹509 lower</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROMOTIONS */}
      {viewType === "promotions" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Active Promotions & Lightning Deals ({promos.length})
              </h3>
              <p className="text-xs text-slate-500">Drive sales volume with targeted seller-funded discount vouchers</p>
            </div>
            <button
              type="button"
              onClick={() => alert("Opening Create New Promo Campaign Modal...")}
              className="px-3 py-1.5 bg-[#404d85] text-white font-bold rounded text-xs"
            >
              + Create Promotion
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {promos.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-slate-900 text-sm">{p.code}</span>
                  <span className="text-slate-500 pl-2">({p.type} • Min Order: {formatINR(p.minOrder)})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{p.claims} claims</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                    ✓ {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. STORE */}
      {viewType === "store" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Brand Flagship Storefront Builder
            </h3>
            <p className="text-xs text-slate-500">Customize your verified brand page, hero graphics, and category showcases</p>
          </div>

          <div className="p-4 rounded border bg-slate-50 space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Brand Tagline</label>
              <input
                type="text"
                defaultValue="For The Music • World-Class Audio & Imaging Technology"
                className="w-full px-3 py-1.5 border rounded bg-white font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Hero Banner Image URL</label>
              <input
                type="text"
                defaultValue="https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
                className="w-full px-3 py-1.5 border rounded bg-white font-mono text-[11px]"
              />
            </div>
            <button
              type="button"
              onClick={() => alert("Storefront visual settings updated!")}
              className="px-4 py-2 bg-[#404d85] text-white font-bold rounded text-xs"
            >
              Save Storefront Layout
            </button>
          </div>
        </div>
      )}

      {/* 4. SETTINGS */}
      {viewType === "settings" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Merchant Settings & Compliance
            </h3>
            <p className="text-xs text-slate-500">Manage KYB documentation, bank accounts, and warehouse logistics nodes</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded border bg-slate-50 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">KYB & Tax Credentials</span>
              <p className="text-slate-600 text-[11px]">GSTIN: <strong>29AABCU9603R1ZM</strong> (Verified)</p>
              <p className="text-slate-600 text-[11px]">PAN: <strong>AABCU9603R</strong> (Verified)</p>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                ✓ 5-Stage KYB Gold Approved
              </span>
            </div>

            <div className="p-4 rounded border bg-slate-50 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">Bank Settlement Account</span>
              <p className="text-slate-600 text-[11px]">Bank: <strong>HDFC Bank Limited</strong></p>
              <p className="text-slate-600 text-[11px]">A/C Number: <strong>50200088910482</strong></p>
              <p className="text-slate-600 text-[11px]">IFSC Code: <strong>HDFC0000240</strong></p>
            </div>
          </div>
        </div>
      )}

      {/* 5. INVENTORY */}
      {viewType === "inventory" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Warehouse Inventory & Safety Stock
            </h3>
            <p className="text-xs text-slate-500">Real-time stock monitoring and reorder alerts</p>
          </div>

          <div className="p-4 rounded bg-red-50 border border-red-200 space-y-2">
            <h5 className="font-black text-red-900">⚠️ 4 SKUs Below Reorder Safety Stock</h5>
            <p className="text-red-800 text-[11px]">
              Sony Alpha 7 IV Body (3 units left), Sony FE 24-70mm GM II Lens (2 units left). Reorder recommended to avoid Buy Box suppression.
            </p>
          </div>
        </div>
      )}

      {/* 6. ANALYTICS */}
      {viewType === "analytics" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Store Traffic & Conversion Analytics
            </h3>
            <p className="text-xs text-slate-500">Deep telemetry into visitor sessions and checkout conversions</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded border bg-slate-50 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Impressions</span>
              <div className="text-xl font-black text-slate-900">142,800</div>
              <span className="text-emerald-700 font-bold text-[11px]">↑ +24.1% vs last month</span>
            </div>
            <div className="p-4 rounded border bg-slate-50 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Product Page Views</span>
              <div className="text-xl font-black text-slate-900">38,400</div>
              <span className="text-emerald-700 font-bold text-[11px]">↑ +18.4%</span>
            </div>
            <div className="p-4 rounded border bg-slate-50 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Conversion Rate</span>
              <div className="text-xl font-black text-emerald-700">4.18%</div>
              <span className="text-slate-500 text-[11px]">Industry Benchmark: 2.8%</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
