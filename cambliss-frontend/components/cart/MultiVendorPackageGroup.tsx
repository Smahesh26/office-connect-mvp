"use client";

import Link from "next/link";
import { formatINR, SellerBadge } from "@/components/commerce/CommercePrimitives";

export interface CartLineItem {
  id: string;
  productId: string;
  title: string;
  brand: string;
  price: number;
  originalPrice: number;
  quantity: number;
  image: string;
  variantName: string;
  inStock: boolean;
  priceChangedAlert?: {
    oldPrice: number;
    newPrice: number;
    type: "drop" | "increase";
  };
}

export interface SellerPackage {
  sellerId: string;
  sellerName: string;
  sellerTier: "premium" | "verified" | "new";
  carrier: string;
  deliveryEstimate: string;
  items: CartLineItem[];
}

export const MultiVendorPackageGroup = ({
  packageIndex,
  totalPackages,
  sellerPackage,
  onUpdateQuantity,
  onRemoveItem,
  onSaveForLater,
}: {
  packageIndex: number;
  totalPackages: number;
  sellerPackage: SellerPackage;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onSaveForLater: (itemId: string) => void;
}) => {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-white overflow-hidden shadow-2xs select-none space-y-0 divide-y divide-slate-100">
      
      {/* Package Header (Merchant & Delivery SLA) */}
      <div className="bg-slate-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
              Package {packageIndex} of {totalPackages}
            </span>
            <SellerBadge
              sellerName={sellerPackage.sellerName}
              sellerTier={sellerPackage.sellerTier}
            />
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Dispatched directly from verified merchant warehouse hub
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-bold self-start sm:self-auto">
          <span>🚚</span>
          <span>{sellerPackage.deliveryEstimate} ({sellerPackage.carrier})</span>
        </div>
      </div>

      {/* Package Line Items */}
      <div className="divide-y divide-slate-100">
        {sellerPackage.items.map((item) => (
          <div key={item.id} className="p-4 sm:p-5 space-y-3">
            
            {/* Price Change Notification */}
            {item.priceChangedAlert && (
              <div
                className={`p-2.5 rounded text-xs font-semibold flex items-center justify-between ${
                  item.priceChangedAlert.type === "drop"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>
                    Price {item.priceChangedAlert.type === "drop" ? "Dropped" : "Updated"}: Was{" "}
                    <span className="line-through">{formatINR(item.priceChangedAlert.oldPrice)}</span>, now{" "}
                    <strong>{formatINR(item.priceChangedAlert.newPrice)}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase">Instant Update</span>
              </div>
            )}

            {/* Main Item Row */}
            <div className="flex items-start gap-4">
              
              {/* Product Thumbnail */}
              <Link
                href={`/product/${item.productId}`}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-[6px] border border-slate-200 bg-slate-50 p-1 shrink-0 overflow-hidden flex items-center justify-center"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-contain"
                />
              </Link>

              {/* Info & Price */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {item.brand}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 hover:text-[#404d85] transition">
                      <Link href={`/product/${item.productId}`}>{item.title}</Link>
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium block pt-0.5">
                      Finish: <strong className="text-slate-700">{item.variantName}</strong>
                    </span>
                  </div>

                  {/* Price */}
                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-base font-black text-slate-900">
                      {formatINR(item.price * item.quantity)}
                    </div>
                    {item.originalPrice > item.price && (
                      <div className="text-xs text-slate-400 line-through">
                        {formatINR(item.originalPrice * item.quantity)}
                      </div>
                    )}
                    {item.quantity > 1 && (
                      <div className="text-[10px] text-slate-400">
                        {formatINR(item.price)} each
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock Status */}
                <div>
                  {item.inStock ? (
                    <span className="text-[11px] font-bold text-emerald-700">
                      ✓ In Stock • Ready for 24h Express Dispatch
                    </span>
                  ) : (
                    <span className="text-[11px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      ⚠️ Currently Out of Stock (Will not be charged)
                    </span>
                  )}
                </div>

                {/* Actions: Quantity Stepper, Save for Later, Remove */}
                <div className="flex items-center gap-4 pt-2 flex-wrap text-xs">
                  
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-slate-300 rounded-[4px] bg-white h-7 px-1">
                    <button
                      type="button"
                      disabled={!item.inStock}
                      onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="w-5 h-5 flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-slate-900 text-xs">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={!item.inStock}
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-5 h-5 flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-slate-200">|</span>

                  {/* Save for Later Button */}
                  <button
                    type="button"
                    onClick={() => onSaveForLater(item.id)}
                    className="font-bold text-slate-600 hover:text-[#404d85] transition"
                  >
                    💾 Save for Later
                  </button>

                  <span className="text-slate-200">|</span>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="font-bold text-red-600 hover:text-red-700 transition"
                  >
                    ✕ Remove
                  </button>

                </div>

              </div>

            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
