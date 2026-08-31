"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export const CartOrderSummary = ({
  itemsSubtotal,
  shippingTotal,
  discountTotal = 0,
  taxTotal,
  total,
  packageCount,
  onApplyCoupon,
  checkoutHref = "/checkout",
  ctaLabel = "Proceed to Multi-Seller Checkout →",
}: {
  itemsSubtotal: number;
  shippingTotal: number;
  discountTotal?: number;
  taxTotal: number;
  total: number;
  packageCount: number;
  onApplyCoupon?: (code: string) => void;
  checkoutHref?: string;
  ctaLabel?: string;
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const handleCoupon = () => {
    if (!couponCode.trim()) return;
    setAppliedCoupon(couponCode.toUpperCase());
    if (onApplyCoupon) onApplyCoupon(couponCode.toUpperCase());
  };

  const freeShippingThreshold = 2000;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - itemsSubtotal);

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-6 space-y-6 shadow-2xs select-none sticky top-24">
      
      <h3 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
        Order Summary ({packageCount} {packageCount === 1 ? "Package" : "Packages"})
      </h3>

      {/* Free Shipping Progress Meter */}
      <div className="space-y-1.5 p-3 rounded-[6px] bg-slate-50 border border-slate-200 text-xs">
        <div className="flex items-center justify-between font-bold">
          <span>🚚 Free Platform Shipping</span>
          <span className={remainingForFreeShipping === 0 ? "text-emerald-600" : "text-slate-600"}>
            {remainingForFreeShipping === 0 ? "Qualified!" : `Add ${formatINR(remainingForFreeShipping)} more`}
          </span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (itemsSubtotal / freeShippingThreshold) * 100)}%` }}
          />
        </div>
      </div>

      {/* Line Item Breakdown */}
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-slate-600">
          <span>Items Subtotal:</span>
          <span className="font-bold text-slate-900">{formatINR(itemsSubtotal)}</span>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span>Estimated Multi-Seller Shipping:</span>
          <span className={shippingTotal === 0 ? "font-bold text-emerald-600" : "font-bold text-slate-900"}>
            {shippingTotal === 0 ? "FREE" : formatINR(shippingTotal)}
          </span>
        </div>

        {discountTotal > 0 && (
          <div className="flex items-center justify-between text-emerald-600 font-bold">
            <span>Promotional Discount:</span>
            <span>-{formatINR(discountTotal)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-600">
          <span>Estimated GST (18% Included):</span>
          <span className="font-bold text-slate-900">{formatINR(taxTotal)}</span>
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
          <div>
            <span className="text-sm font-black text-slate-900">Total Payable:</span>
            <p className="text-[10px] text-slate-500 font-semibold">Includes all taxes & delivery fees</p>
          </div>
          <span className="text-2xl font-black text-slate-900">{formatINR(total)}</span>
        </div>
      </div>

      {/* Coupon Application */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <span className="text-xs font-bold text-slate-700 block">Apply Marketplace Promo Code:</span>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. OFFICE10"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs font-mono font-bold uppercase focus:border-[#404d85] focus:outline-hidden"
          />
          <button
            type="button"
            onClick={handleCoupon}
            className="px-4 py-1.5 bg-slate-900 hover:bg-[#404d85] text-white text-xs font-bold rounded-[4px] transition"
          >
            Apply
          </button>
        </div>
        {appliedCoupon && (
          <p className="text-[11px] font-bold text-emerald-600">
            ✓ Code {appliedCoupon} applied (10% Multi-Vendor Discount)!
          </p>
        )}
      </div>

      {/* Primary Checkout CTA */}
      <Link
        href={checkoutHref}
        className="block w-full py-3.5 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-center text-xs transition shadow-xs"
      >
        {ctaLabel}
      </Link>

      {/* Trust & Escrow Guarantee */}
      <div className="space-y-1 text-center pt-2 border-t border-slate-100">
        <p className="text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1">
          <span>🛡️</span>
          <span>100% Escrow Buyer Protection Guaranteed</span>
        </p>
        <p className="text-[10px] text-slate-400">
          Payment is held in escrow and only released to individual merchants upon verified delivery confirmation.
        </p>
      </div>

    </div>
  );
};
