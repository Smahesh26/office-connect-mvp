"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR, SellerBadge, QuantitySelector } from "@/components/commerce/CommercePrimitives";

export interface BuyBoxOffer {
  sellerId: string;
  sellerName: string;
  sellerTier: "new" | "verified" | "premium";
  sellerRating: number;
  sellerReviewsCount: number;
  price: number;
  originalPrice?: number;
  stockQty: number;
  deliveryDays: number;
  shipsFrom: string;
}

export const ProductBuyBox = ({
  offer,
  onAddToCart,
  onBuyNow,
}: {
  offer: BuyBoxOffer;
  onAddToCart: (qty: number) => void;
  onBuyNow: (qty: number) => void;
  onWishlistToggle?: () => void;
}) => {
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("560001");
  const [isPincodeChecked, setIsPincodeChecked] = useState(true);
  const [isAdded, setIsAdded] = useState(false);

  const numPrice = offer.price;
  const numOrig = offer.originalPrice;
  const hasDiscount = numOrig && numOrig > numPrice;
  const discountPercent = hasDiscount ? Math.round(((numOrig - numPrice) / numOrig) * 100) : 0;
  const savings = hasDiscount ? numOrig - numPrice : 0;

  const handleAdd = () => {
    setIsAdded(true);
    onAddToCart(quantity);
    setTimeout(() => setIsAdded(false), 2500);
  };

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-6 space-y-6 shadow-2xs select-none">
      
      {/* Price Header */}
      <div className="space-y-1 pb-4 border-b border-slate-100">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-3xl font-black text-slate-900">{formatINR(numPrice)}</span>
          {hasDiscount && (
            <>
              <span className="text-sm text-slate-400 line-through">{formatINR(numOrig)}</span>
              <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {discountPercent}% OFF
              </span>
            </>
          )}
        </div>
        {hasDiscount && (
          <p className="text-xs font-bold text-emerald-600">
            You save {formatINR(savings)} on this order
          </p>
        )}
        <p className="text-[11px] text-slate-500">
          Inclusive of all applicable GST taxes • Official tax invoice provided
        </p>
      </div>

      {/* Seller Credentials & Buy Box Winner */}
      <div className="p-3.5 rounded-[6px] bg-slate-50 border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#404d85]">
            👑 FEATURED BUY BOX MERCHANT
          </span>
          <span className="text-[10px] font-bold text-slate-500">
            ★ {offer.sellerRating.toFixed(1)} ({offer.sellerReviewsCount})
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <SellerBadge sellerName={offer.sellerName} sellerTier={offer.sellerTier} />
          <Link
            href={`/storefront?vendor=${offer.sellerId}`}
            className="text-[11px] font-bold text-[#404d85] hover:underline"
          >
            Visit Storefront →
          </Link>
        </div>
        <p className="text-[11px] text-slate-500">Dispatches from {offer.shipsFrom}</p>
      </div>

      {/* Pincode & Delivery SLA Checker */}
      <div className="space-y-2 pb-4 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-700 block">Delivery & Availability:</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="Enter Delivery Pincode"
            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs font-semibold focus:border-[#404d85] focus:outline-hidden"
          />
          <button
            type="button"
            onClick={() => setIsPincodeChecked(true)}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-[4px] transition"
          >
            Check
          </button>
        </div>

        {isPincodeChecked && (
          <div className="space-y-1 pt-1 text-xs">
            <p className="font-bold text-emerald-600 flex items-center gap-1.5">
              <span>🚚</span>
              <span>FREE Express Delivery by Tomorrow, 2:00 PM</span>
            </p>
            <p className="text-[11px] text-slate-500">If ordered within the next 4 hrs 28 mins</p>
          </div>
        )}
      </div>

      {/* Quantity & Action Buttons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Select Quantity:</span>
          <QuantitySelector value={quantity} onChange={setQuantity} min={1} max={offer.stockQty} />
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="w-full py-3 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-xs transition shadow-xs flex items-center justify-center gap-2"
        >
          <span>🛒</span>
          <span>{isAdded ? "✓ Added to Cart" : `Add to Cart (${formatINR(numPrice * quantity)})`}</span>
        </button>

        <button
          type="button"
          onClick={() => onBuyNow(quantity)}
          className="w-full py-3 rounded-[6px] bg-slate-900 hover:bg-black text-white font-black text-xs transition shadow-xs"
        >
          ⚡ Instant Buy Now
        </button>
      </div>

      {/* 4 Trust Guarantee Icons */}
      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-600 font-bold">🛡️</span>
          <span>100% Escrow Protection</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-blue-600 font-bold">🔄</span>
          <span>7-Day Hassle-Free Returns</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-amber-600 font-bold">📜</span>
          <span>Official Brand Warranty</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-purple-600 font-bold">🧾</span>
          <span>GST Input Tax Credit</span>
        </div>
      </div>

    </div>
  );
};
