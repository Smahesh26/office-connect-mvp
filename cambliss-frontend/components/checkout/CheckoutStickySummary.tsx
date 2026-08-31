"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";
import { SellerPackage } from "@/components/cart/MultiVendorPackageGroup";

export const CheckoutStickySummary = ({
  packages,
  subtotal,
  originalTotal,
  discountAmount,
  deliveryFee,
  grandTotal,
}: {
  packages: SellerPackage[];
  subtotal: number;
  originalTotal: number;
  discountAmount: number;
  deliveryFee: number;
  grandTotal: number;
}) => {
  const totalItems = packages.reduce(
    (acc, pkg) => acc + pkg.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );

  const gstRate = 0.18;
  const gstTaxAmount = Math.round(subtotal * (gstRate / (1 + gstRate)));
  const totalSavings = originalTotal - subtotal + discountAmount;

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 space-y-5 shadow-2xs select-none sticky top-24">
      
      <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
        Order Summary ({totalItems} Items in {packages.length} Packages)
      </h3>

      {/* Package Breakdown Accordion/Pills */}
      <div className="space-y-2 text-xs">
        {packages.map((pkg, idx) => (
          <div key={pkg.sellerId} className="p-2.5 rounded bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>Pkg {idx + 1}: {pkg.sellerName}</span>
              <span>{pkg.items.length} items</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold block">
              🚚 {pkg.deliveryEstimate}
            </span>
          </div>
        ))}
      </div>

      {/* Price Calculations */}
      <div className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span>Items Subtotal:</span>
          <span className="font-bold text-slate-900">{formatINR(subtotal)}</span>
        </div>

        {originalTotal > subtotal && (
          <div className="flex items-center justify-between text-emerald-700 font-semibold">
            <span>Catalog Savings:</span>
            <span>-{formatINR(originalTotal - subtotal)}</span>
          </div>
        )}

        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-emerald-700 font-semibold">
            <span>Voucher Discount:</span>
            <span>-{formatINR(discountAmount)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span>Multi-Vendor Delivery:</span>
          <span className="text-emerald-700 font-bold">FREE Delivery</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Included 18% GST (B2B Claimable):</span>
          <span>{formatINR(gstTaxAmount)}</span>
        </div>
      </div>

      {/* EXTREMELY CLEAR PROMINENT FINAL AMOUNT */}
      <div className="pt-4 border-t-2 border-slate-900 space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            Final Total to Pay:
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#404d85] tracking-tight">
            {formatINR(grandTotal)}
          </span>
        </div>

        {totalSavings > 0 && (
          <p className="text-[11px] font-black text-emerald-700 text-right">
            🎉 Total Savings: {formatINR(totalSavings)}
          </p>
        )}
      </div>

      {/* Escrow Guarantee */}
      <div className="p-3 rounded bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-[11px] font-semibold flex items-center gap-2">
        <span className="text-base">🛡️</span>
        <div>
          <strong className="block text-emerald-950">100% Escrow Protection Lock</strong>
          <span className="text-[10px] text-emerald-800">Funds released to sellers only upon verified delivery scan.</span>
        </div>
      </div>

    </div>
  );
};
