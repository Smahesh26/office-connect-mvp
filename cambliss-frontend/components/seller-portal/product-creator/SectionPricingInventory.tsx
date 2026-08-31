"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";

export interface PricingInventoryData {
  mrp: number;
  sellingPrice: number;
  floorPrice: number;
  gstRate: string;
  enableB2BTiers: boolean;
  tier1Price: number; // 1-9
  tier2Price: number; // 10-49
  tier3Price: number; // 50+
  safetyStockThreshold: number;
  trackInventory: boolean;
}

export const SectionPricingInventory = ({
  data,
  onChange,
}: {
  data: PricingInventoryData;
  onChange: (data: PricingInventoryData) => void;
}) => {
  return (
    <div className="space-y-6 text-xs select-none">
      
      {/* 5. PRICING SECTION */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            5. Base Pricing & B2B Volume Tiers
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Define consumer retail price, floor threshold for automated repricer, and GST tax slab.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Maximum Retail Price (MRP in ₹) *
            </label>
            <input
              type="number"
              required
              value={data.mrp}
              onChange={(e) => onChange({ ...data, mrp: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Consumer Selling Price (INR ₹) *
            </label>
            <input
              type="number"
              required
              value={data.sellingPrice}
              onChange={(e) => onChange({ ...data, sellingPrice: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded font-bold text-[#404d85]"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Applicable GST Tax Slab *
            </label>
            <select
              value={data.gstRate}
              onChange={(e) => onChange({ ...data, gstRate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded font-bold bg-white"
            >
              <option value="5%">5% (Apparel below ₹1,000)</option>
              <option value="12%">12% (Apparel above ₹1,000)</option>
              <option value="18%">18% (Standard Electronics / Tech)</option>
              <option value="28%">28% (Luxury & Automotive)</option>
            </select>
          </div>
        </div>

        {/* B2B Tiered Pricing */}
        <div className="p-4 rounded-[6px] bg-slate-50 border border-slate-200 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.enableB2BTiers}
              onChange={(e) => onChange({ ...data, enableB2BTiers: e.target.checked })}
              className="rounded text-[#404d85]"
            />
            <span className="font-bold text-slate-900">
              🏢 Enable B2B Wholesale Tiered Quantity Pricing
            </span>
          </label>

          {data.enableB2BTiers && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 rounded bg-white border border-slate-200">
                <span className="font-bold text-slate-500 block text-[10px] uppercase">1 – 9 Units</span>
                <span className="text-sm font-black text-slate-900">{formatINR(data.sellingPrice)}</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-slate-200">
                <span className="font-bold text-slate-500 block text-[10px] uppercase">10 – 49 Units (Bulk)</span>
                <input
                  type="number"
                  value={data.tier2Price}
                  onChange={(e) => onChange({ ...data, tier2Price: Number(e.target.value) })}
                  className="w-full px-2 py-1 border rounded font-black text-emerald-700 mt-1"
                />
              </div>
              <div className="p-2.5 rounded bg-white border border-slate-200">
                <span className="font-bold text-slate-500 block text-[10px] uppercase">50+ Units (Enterprise)</span>
                <input
                  type="number"
                  value={data.tier3Price}
                  onChange={(e) => onChange({ ...data, tier3Price: Number(e.target.value) })}
                  className="w-full px-2 py-1 border rounded font-black text-emerald-700 mt-1"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. INVENTORY SECTION */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            6. Inventory & Warehouse Safety Stock
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Configure automated low-stock warnings and fulfillment reservations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Low-Stock Warning Threshold (Units) *
            </label>
            <input
              type="number"
              value={data.safetyStockThreshold}
              onChange={(e) => onChange({ ...data, safetyStockThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded font-bold"
            />
            <span className="text-[10px] text-slate-400 block pt-1">
              Alerts will trigger on the dashboard when stock drops below this number
            </span>
          </div>

          <div className="p-4 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <strong className="text-slate-900 block font-bold">Real-time Stock Synchronization</strong>
              <span className="text-[11px] text-slate-500">Auto-deduct on checkout & escrow hold</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase">
              Enabled
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
