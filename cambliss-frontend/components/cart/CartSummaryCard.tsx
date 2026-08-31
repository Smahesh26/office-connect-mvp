"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export const CartSummaryCard = ({
  itemCount,
  subtotal,
  originalTotal,
  deliveryFee,
  discountAmount,
  onApplyCoupon,
  couponCode,
  couponError,
  isCouponApplied,
}: {
  itemCount: number;
  subtotal: number;
  originalTotal: number;
  deliveryFee: number;
  discountAmount: number;
  onApplyCoupon: (code: string) => void;
  couponCode: string;
  couponError: string | null;
  isCouponApplied: boolean;
}) => {
  const [inputCode, setInputCode] = useState("");

  const gstRate = 0.18; // 18% GST standard in India
  const gstTaxAmount = Math.round(subtotal * (gstRate / (1 + gstRate)));
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);
  const totalSavings = originalTotal - subtotal + discountAmount;

  const handleSubmitCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    onApplyCoupon(inputCode.trim());
  };

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 space-y-5 shadow-2xs select-none sticky top-24">
      
      <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
        Order Summary ({itemCount} {itemCount === 1 ? "Item" : "Items"})
      </h3>

      {/* Coupon Engine */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-700 block">
          Promo Code / Gift Voucher
        </span>
        <form onSubmit={handleSubmitCoupon} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. OFFICE2000"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-[4px] text-xs font-mono font-bold uppercase focus:outline-hidden focus:border-[#404d85]"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-bold rounded-[4px] text-xs transition"
          >
            Apply
          </button>
        </form>

        {isCouponApplied && (
          <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-between">
            <span>✓ Coupon &ldquo;{couponCode}&rdquo; applied successfully!</span>
            <span>-{formatINR(discountAmount)}</span>
          </div>
        )}

        {couponError && (
          <p className="text-[11px] font-bold text-red-600">
            ⚠️ {couponError}
          </p>
        )}
      </div>

      {/* Calculations Breakdown */}
      <div className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
        
        <div className="flex items-center justify-between">
          <span>Items Subtotal:</span>
          <span className="font-bold text-slate-900">{formatINR(subtotal)}</span>
        </div>

        {originalTotal > subtotal && (
          <div className="flex items-center justify-between text-emerald-700 font-semibold">
            <span>Catalog MRP Discount:</span>
            <span>-{formatINR(originalTotal - subtotal)}</span>
          </div>
        )}

        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-emerald-700 font-semibold">
            <span>Promo Code Discount:</span>
            <span>-{formatINR(discountAmount)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span>Multi-Vendor Express Shipping:</span>
          {deliveryFee === 0 ? (
            <span className="text-emerald-700 font-bold">FREE Delivery</span>
          ) : (
            <span className="font-bold text-slate-900">{formatINR(deliveryFee)}</span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Included 18% GST (B2B Tax Credit):</span>
          <span>{formatINR(gstTaxAmount)}</span>
        </div>

      </div>

      {/* Grand Total */}
      <div className="pt-3 border-t border-slate-200 space-y-1">
        <div className="flex items-center justify-between text-base font-black text-slate-900">
          <span>Grand Total (INR):</span>
          <span className="text-xl text-[#404d85]">{formatINR(grandTotal)}</span>
        </div>
        {totalSavings > 0 && (
          <p className="text-[11px] font-bold text-emerald-700">
            🎉 You save {formatINR(totalSavings)} on this order!
          </p>
        )}
      </div>

      {/* Checkout CTA */}
      <div className="space-y-3 pt-2">
        <Link
          href="/checkout"
          className="block w-full py-3 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] active:bg-[#252f5a] text-white font-black text-sm text-center transition shadow-sm"
        >
          Proceed to Multi-Package Checkout →
        </Link>

        <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-600 text-[10px] space-y-1 text-center font-medium">
          <div className="flex items-center justify-center gap-1.5 font-bold text-slate-800">
            <span>🛡️</span>
            <span>100% Escrow Protection Guarantee</span>
          </div>
          <p>Merchant payouts released only after verified delivery scan.</p>
        </div>
      </div>

    </div>
  );
};
