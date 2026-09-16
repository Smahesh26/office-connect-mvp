"use client";

import { useState } from "react";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export const SellerPricingPromos = ({
  viewType,
}: {
  viewType: "pricing" | "promotions" | "store" | "settings" | "inventory" | "analytics";
}) => {
  const [promos] = useState<
    {
      id: string;
      code: string;
      type: string;
      minOrder: number;
      claims: number;
      status: string;
    }[]
  >([]);

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none text-xs font-sans text-slate-900">
      
      {/* 1. PRICING */}
      {viewType === "pricing" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Automated Buy Box & Pricing Intelligence
              </h3>
              <p className="text-xs text-slate-500">Monitor competitor offers and automatically match lowest winning Buy Box price</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-bold text-xs">
              ⚡ Buy Box Engine Ready
            </span>
          </div>

          <div className="p-8 rounded bg-slate-50 border border-slate-200 text-center space-y-2">
            <span className="text-2xl block">🏷️</span>
            <div className="font-bold text-slate-800">No active products to monitor</div>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Upload products to your catalog to enable real-time competitor price tracking and automated Buy Box optimization.
            </p>
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
              onClick={() => alert("Promotions will be available after products are uploaded.")}
              className="px-3 py-1.5 bg-[#404d85] text-white font-bold rounded text-xs"
            >
              + Create Promotion
            </button>
          </div>

          {promos.length === 0 ? (
            <div className="p-8 rounded bg-slate-50 border border-slate-200 text-center space-y-2">
              <span className="text-2xl block">🎟️</span>
              <div className="font-bold text-slate-800">No active promotions</div>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Create coupon codes and flash discounts once you have published listings in your store catalog.
              </p>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* 3. STORE */}
      {viewType === "store" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Hisense Computers Storefront Builder
            </h3>
            <p className="text-xs text-slate-500">Customize your verified brand page, hero graphics, and hardware showcases</p>
          </div>

          <div className="p-4 rounded border bg-slate-50 space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Brand Tagline</label>
              <input
                type="text"
                defaultValue="High-Performance Enterprise Computing & Hardware"
                className="w-full px-3 py-1.5 border rounded bg-white font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Hero Banner Image URL</label>
              <input
                type="text"
                defaultValue="https://images.unsplash.com/photo-1550745165-9bc0b252726f"
                className="w-full px-3 py-1.5 border rounded bg-white font-mono text-[11px]"
              />
            </div>
            <button
              type="button"
              onClick={() => alert("Hisense Computers visual storefront settings updated!")}
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
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Merchant Settings & Compliance (bhaskeradv1@gmail.com)
            </h3>
            <p className="text-xs text-slate-500">Manage KYB documentation, bank accounts, and warehouse logistics nodes</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded border bg-slate-50 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">KYB & Tax Credentials</span>
              <p className="text-slate-600 text-[11px]">Entity: <strong>Hisense Computers & Systems India Pvt Ltd</strong></p>
              <p className="text-slate-600 text-[11px]">Contact: <strong>bhaskeradv1@gmail.com</strong></p>
              <p className="text-slate-600 text-[11px]">GSTIN: <strong>29AAACH8921K1Z5</strong> (Verified)</p>
              <p className="text-slate-600 text-[11px]">PAN: <strong>AAACH8921K</strong> (Verified)</p>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                ✓ 5-Stage KYB Gold Approved
              </span>
            </div>

            <div className="p-4 rounded border bg-slate-50 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">Bank Settlement Account</span>
              <p className="text-slate-600 text-[11px]">Bank: <strong>HDFC Bank Limited</strong></p>
              <p className="text-slate-600 text-[11px]">A/C Number: <strong>50200088910482</strong></p>
              <p className="text-slate-600 text-[11px]">IFSC Code: <strong>HDFC0000240</strong></p>
              <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                ⚡ Automated Daily T+1 Escrow Settlement
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. INVENTORY */}
      {viewType === "inventory" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Hardware Warehouse Inventory & Safety Stock
            </h3>
            <p className="text-xs text-slate-500">Real-time stock monitoring and reorder alerts</p>
          </div>

          <div className="p-8 rounded bg-slate-50 border border-slate-200 text-center space-y-2">
            <span className="text-2xl block">📦</span>
            <div className="font-bold text-slate-800">Inventory Status Healthy</div>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              No low-stock alerts or stockout warnings. Real-time safety thresholds will trigger alerts once items reach safety quantities.
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
              <div className="text-xl font-black text-slate-900">0</div>
              <span className="text-slate-400 font-bold text-[11px]">Tracking initialized</span>
            </div>
            <div className="p-4 rounded border bg-slate-50 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Product Page Views</span>
              <div className="text-xl font-black text-slate-900">0</div>
              <span className="text-slate-400 font-bold text-[11px]">Live tracking active</span>
            </div>
            <div className="p-4 rounded border bg-slate-50 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Conversion Rate</span>
              <div className="text-xl font-black text-slate-700">0.0%</div>
              <span className="text-slate-500 text-[11px]">Industry Benchmark: 2.8%</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
