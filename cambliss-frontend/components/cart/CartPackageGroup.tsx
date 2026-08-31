"use client";

import Link from "next/link";
import { formatINR, SellerBadge, QuantitySelector } from "@/components/commerce/CommercePrimitives";

export interface CartItem {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
  sellerTier: "new" | "verified" | "premium";
  deliveryEstimate: string;
  shippingFee: number;
  stockQty: number;
}

export interface SellerCartPackage {
  sellerId: string;
  sellerName: string;
  sellerTier: "new" | "verified" | "premium";
  deliveryEstimate: string;
  shippingFee: number;
  items: CartItem[];
}

export const CartPackageGroup = ({
  pkg,
  packageIndex,
  onUpdateQty,
  onRemoveItem,
  onSaveForLater,
}: {
  pkg: SellerCartPackage;
  packageIndex: number;
  onUpdateQty: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onSaveForLater: (itemId: string) => void;
}) => {
  const packageSubtotal = pkg.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white overflow-hidden shadow-2xs select-none space-y-0">
      
      {/* Package Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded">
            PACKAGE {packageIndex + 1}
          </span>
          <span className="text-slate-400">•</span>
          <SellerBadge sellerName={pkg.sellerName} sellerTier={pkg.sellerTier} />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>🚚 Estimated Delivery:</span>
          <span className="font-extrabold text-slate-900">{pkg.deliveryEstimate}</span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-emerald-600">
            {pkg.shippingFee === 0 ? "FREE Shipping" : formatINR(pkg.shippingFee)}
          </span>
        </div>
      </div>

      {/* Package Line Items */}
      <div className="divide-y divide-slate-100 p-4 space-y-4">
        {pkg.items.map((item) => (
          <div key={item.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start justify-between gap-4">
            
            {/* Item Thumbnail & Info */}
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                  {item.title}
                </h4>

                <div className="flex items-baseline gap-2">
                  <span className="font-black text-sm text-slate-900">{formatINR(item.price)}</span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatINR(item.originalPrice)}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-emerald-600 font-semibold">✓ In Stock & Ready to Dispatch</p>
              </div>
            </div>

            {/* Item Actions & Subtotal */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
              <span className="font-black text-sm text-slate-900 hidden sm:block">
                {formatINR(item.price * item.quantity)}
              </span>

              <div className="flex items-center gap-2">
                <QuantitySelector
                  value={item.quantity}
                  onChange={(newQty) => onUpdateQty(item.id, newQty)}
                  min={1}
                  max={item.stockQty}
                  size="sm"
                />

                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  aria-label="Remove item"
                  className="w-7 h-7 rounded border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center text-xs transition"
                >
                  ✕
                </button>
              </div>

              <button
                type="button"
                onClick={() => onSaveForLater(item.id)}
                className="text-[11px] font-bold text-[#404d85] hover:underline"
              >
                Save for later
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Package Subtotal Footer */}
      <div className="bg-slate-50/70 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
        <span>Package {packageIndex + 1} Subtotal ({pkg.items.reduce((sum, i) => sum + i.quantity, 0)} items):</span>
        <span className="font-black text-slate-900">{formatINR(packageSubtotal)}</span>
      </div>

    </div>
  );
};
