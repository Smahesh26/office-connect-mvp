"use client";

import { useState } from "react";
import { SellerPackage } from "@/components/cart/MultiVendorPackageGroup";
import { SellerBadge } from "@/components/commerce/CommercePrimitives";

export const CheckoutStep2Delivery = ({
  isActive,
  isCompleted,
  packages,
  onContinue,
  onEditStep,
}: {
  isActive: boolean;
  isCompleted: boolean;
  packages: SellerPackage[];
  onContinue: () => void;
  onEditStep: () => void;
}) => {
  const [selectedCarriers, setSelectedCarriers] = useState<Record<string, string>>({
    "seller-sony": "Bluedart Air Express (Tomorrow, 1 PM - FREE)",
    "seller-keychron": "Delhivery Surface (In 2 Days - FREE)",
  });

  // Completed State Preview
  if (!isActive && isCompleted) {
    return (
      <div className="p-4 rounded-[8px] border border-slate-200 bg-white flex items-start justify-between gap-4 text-xs shadow-2xs select-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
              ✓
            </span>
            <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
              2. Multi-Vendor Delivery Scheduled
            </span>
          </div>
          <div className="pl-7 space-y-0.5 text-slate-700">
            {packages.map((pkg) => (
              <p key={pkg.sellerId} className="font-medium">
                • <strong>{pkg.sellerName}</strong>: {selectedCarriers[pkg.sellerId] || pkg.deliveryEstimate}
              </p>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onEditStep}
          className="px-3 py-1 rounded border border-slate-200 hover:border-[#404d85] text-[#404d85] font-bold text-xs transition"
        >
          Change
        </button>
      </div>
    );
  }

  // Inactive Non-completed State
  if (!isActive) {
    return (
      <div className="p-4 rounded-[8px] border border-slate-200 bg-slate-50 opacity-60 text-xs flex items-center gap-2 select-none">
        <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 font-bold text-[10px] flex items-center justify-center">
          2
        </span>
        <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">
          2. Multi-Vendor Delivery & Courier Preferences
        </span>
      </div>
    );
  }

  // Active State
  return (
    <div className="p-5 sm:p-6 rounded-[8px] border border-[#404d85] bg-white space-y-5 shadow-2xs select-none ring-2 ring-[#404d85]/10">
      
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <span className="w-6 h-6 rounded-full bg-[#404d85] text-white font-black text-xs flex items-center justify-center">
          2
        </span>
        <h2 className="font-black text-sm text-slate-900 uppercase tracking-wider">
          Multi-Vendor Delivery & Carrier Dispatch
        </h2>
      </div>

      <div className="space-y-4">
        {packages.map((pkg, idx) => (
          <div
            key={pkg.sellerId}
            className="p-4 rounded-[6px] border border-slate-200 bg-slate-50/70 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[10px] uppercase bg-white px-2 py-0.5 rounded border border-slate-200">
                  Package {idx + 1}
                </span>
                <SellerBadge sellerName={pkg.sellerName} sellerTier={pkg.sellerTier} />
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">{pkg.items.length} items</span>
            </div>

            {/* Carrier Radio Options */}
            <div className="space-y-2 pt-1">
              {[
                {
                  id: "express",
                  label: `🚀 Express Air via ${pkg.carrier} (Tomorrow by 1 PM)`,
                  cost: "FREE Delivery",
                  tag: "RECOMMENDED",
                },
                {
                  id: "standard",
                  label: "📦 Standard Surface Freight (2-3 Business Days)",
                  cost: "FREE Delivery",
                },
              ].map((opt, oIdx) => {
                const isSelected = oIdx === 0;
                return (
                  <label
                    key={opt.id}
                    className={`p-3 rounded border flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? "border-[#404d85] bg-white ring-1 ring-[#404d85]"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`carrier-${pkg.sellerId}`}
                        defaultChecked={isSelected}
                        className="text-[#404d85]"
                      />
                      <span className="font-bold text-slate-900">{opt.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {opt.tag && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-black text-[9px]">
                          {opt.tag}
                        </span>
                      )}
                      <span className="font-black text-emerald-700">{opt.cost}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="px-6 py-2.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-xs transition shadow-2xs"
        >
          Continue to Payment Gateway →
        </button>
      </div>

    </div>
  );
};
