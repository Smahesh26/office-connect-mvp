"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "../ui/Badge";
import { Button, IconButton } from "../ui/Button";

// Format INR currency without floating-point errors
export const formatINR = (amount: number | string) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
};

export const ProductPrice = ({
  price,
  originalPrice,
  size = "md",
}: {
  price: number | string;
  originalPrice?: number | string;
  size?: "sm" | "md" | "lg";
}) => {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  const numOrig = originalPrice ? (typeof originalPrice === "string" ? parseFloat(originalPrice) : originalPrice) : undefined;
  const hasDiscount = numOrig && numOrig > numPrice;
  const discountPercent = hasDiscount ? Math.round(((numOrig - numPrice) / numOrig) * 100) : 0;

  const sizeClasses = {
    sm: { price: "text-sm font-black", orig: "text-[11px]", badge: "text-[10px]" },
    md: { price: "text-base font-black", orig: "text-xs", badge: "text-[10px]" },
    lg: { price: "text-2xl font-black", orig: "text-sm", badge: "text-xs" },
  };

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className={`text-slate-900 ${sizeClasses[size].price}`}>{formatINR(numPrice)}</span>
      {hasDiscount && (
        <>
          <span className={`text-slate-400 line-through ${sizeClasses[size].orig}`}>{formatINR(numOrig)}</span>
          <span className="text-red-600 font-extrabold text-[11px]">-{discountPercent}% OFF</span>
        </>
      )}
    </div>
  );
};

export const Rating = ({ score, reviewsCount }: { score: number; reviewsCount?: number }) => {
  return (
    <div className="inline-flex items-center gap-1 text-xs">
      <span className="text-amber-500 font-bold">★</span>
      <span className="font-extrabold text-slate-800">{score.toFixed(1)}</span>
      {reviewsCount !== undefined && <span className="text-slate-400 font-normal">({reviewsCount})</span>}
    </div>
  );
};

export const QuantitySelector = ({
  value,
  min = 1,
  max = 99,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
}) => {
  return (
    <div className="inline-flex items-center border border-slate-300 rounded-[6px] bg-white h-9">
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 font-bold"
      >
        −
      </button>
      <span className="w-10 text-center font-bold text-xs text-slate-900">{value}</span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 font-bold"
      >
        +
      </button>
    </div>
  );
};

export const WishlistButton = ({ isSaved, onToggle }: { isSaved: boolean; onToggle: () => void }) => {
  return (
    <IconButton
      size="sm"
      variant="outline"
      ariaLabel="Save to Wishlist"
      onClick={onToggle}
      className={isSaved ? "text-red-600 border-red-200 bg-red-50" : "text-slate-400 hover:text-red-500"}
      icon={isSaved ? "♥" : "♡"}
    />
  );
};

export const SellerBadge = ({
  sellerName,
  sellerTier = "verified",
}: {
  sellerName: string;
  sellerTier?: "new" | "verified" | "premium";
}) => {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span className="font-semibold text-slate-900">{sellerName}</span>
      {sellerTier === "premium" && (
        <span className="rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-700">
          👑 Premium
        </span>
      )}
      {sellerTier === "verified" && (
        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-700">
          ✓ Verified
        </span>
      )}
    </div>
  );
};

export const StockIndicator = ({ stockQty }: { stockQty: number }) => {
  if (stockQty <= 0) {
    return <span className="text-[11px] font-bold text-slate-400">Out of Stock</span>;
  }
  if (stockQty <= 5) {
    return <span className="text-[11px] font-bold text-amber-600">🔥 Only {stockQty} left in stock!</span>;
  }
  return <span className="text-[11px] font-bold text-emerald-600">✓ In Stock</span>;
};

export const DeliveryInformation = ({ deliveryDays = 2 }: { deliveryDays?: number }) => {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-[6px] border border-slate-200">
      <span>🚚</span>
      <div>
        <span className="font-bold text-slate-800">Express Delivery in {deliveryDays} Days</span>
        <p className="text-[11px] text-slate-500">Free delivery on orders above ₹999</p>
      </div>
    </div>
  );
};

export interface ProductCardProps {
  id: string;
  title: string;
  image: string;
  price: number | string;
  originalPrice?: number | string;
  sellerName: string;
  sellerTier?: "new" | "verified" | "premium";
  rating?: number;
  reviewsCount?: number;
  stockQty?: number;
  badge?: string;
  onAddToCart?: () => void;
  onQuickView?: () => void;
}

export const ProductCard = ({
  id,
  title,
  image,
  price,
  originalPrice,
  sellerName,
  sellerTier = "verified",
  rating = 4.8,
  reviewsCount = 120,
  stockQty = 10,
  badge,
  onAddToCart,
  onQuickView,
}: ProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <div className="group rounded-[8px] border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
      <div className="relative aspect-square bg-slate-50 overflow-hidden border-b border-slate-100">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
        />
        {badge && (
          <span className="absolute top-2 left-2 rounded-full bg-slate-900/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-extrabold text-white">
            {badge}
          </span>
        )}
        <div className="absolute top-2 right-2">
          <WishlistButton isSaved={isWishlisted} onToggle={() => setIsWishlisted(!isWishlisted)} />
        </div>
      </div>

      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <SellerBadge sellerName={sellerName} sellerTier={sellerTier} />
          <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-[#404d85] transition">
            {title}
          </h4>
          <Rating score={rating} reviewsCount={reviewsCount} />
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <ProductPrice price={price} originalPrice={originalPrice} size="sm" />
          <Button size="xs" variant="primary" onClick={onAddToCart}>
            + Add
          </Button>
        </div>
      </div>
    </div>
  );
};
