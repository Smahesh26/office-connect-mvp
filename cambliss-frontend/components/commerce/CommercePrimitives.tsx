"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "../ui/Badge";
import { Button, IconButton } from "../ui/Button";

// Format INR currency without floating-point errors
export const formatINR = (amount: number | string) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

export const ProductPrice = ({
  price,
  originalPrice,
  size = "md",
}: {
  price: number | string;
  originalPrice?: number | string;
  size?: "xs" | "sm" | "md" | "lg";
}) => {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  const numOrig = originalPrice ? (typeof originalPrice === "string" ? parseFloat(originalPrice) : originalPrice) : undefined;
  const hasDiscount = numOrig && numOrig > numPrice;
  const discountPercent = hasDiscount ? Math.round(((numOrig - numPrice) / numOrig) * 100) : 0;

  const sizeClasses = {
    xs: { price: "text-xs font-black", orig: "text-[10px]", badge: "text-[9px]" },
    sm: { price: "text-sm font-black", orig: "text-[11px]", badge: "text-[10px]" },
    md: { price: "text-base font-black", orig: "text-xs", badge: "text-[10px]" },
    lg: { price: "text-2xl font-black", orig: "text-sm", badge: "text-xs" },
  };

  return (
    <div className="flex items-baseline gap-1.5 flex-wrap">
      <span className={`text-slate-900 ${sizeClasses[size].price}`}>{formatINR(numPrice)}</span>
      {hasDiscount && (
        <>
          <span className={`text-slate-400 line-through ${sizeClasses[size].orig}`}>{formatINR(numOrig)}</span>
          <span className={`text-red-600 font-extrabold ${sizeClasses[size].badge}`}>-{discountPercent}%</span>
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
      {reviewsCount !== undefined && <span className="text-slate-400 font-normal">({reviewsCount.toLocaleString()})</span>}
    </div>
  );
};

export const QuantitySelector = ({
  value,
  min = 1,
  max = 99,
  size = "md",
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  onChange: (val: number) => void;
}) => {
  const heightClass = size === "sm" ? "h-7 text-xs" : "h-8 text-xs";
  const btnWidth = size === "sm" ? "w-6" : "w-7";

  return (
    <div className={`inline-flex items-center border border-slate-300 rounded-[4px] bg-white ${heightClass}`}>
      <button
        type="button"
        disabled={value <= min}
        onClick={(e) => { e.stopPropagation(); onChange(Math.max(min, value - 1)); }}
        className={`${btnWidth} h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 font-bold transition`}
      >
        −
      </button>
      <span className="w-8 text-center font-bold text-slate-900">{value}</span>
      <button
        type="button"
        disabled={value >= max}
        onClick={(e) => { e.stopPropagation(); onChange(Math.min(max, value + 1)); }}
        className={`${btnWidth} h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 font-bold transition`}
      >
        +
      </button>
    </div>
  );
};

export const WishlistButton = ({ isSaved, onToggle }: { isSaved: boolean; onToggle: () => void }) => {
  return (
    <button
      type="button"
      aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-xs ${
        isSaved
          ? "bg-red-50 text-red-600 border border-red-200"
          : "bg-white/90 text-slate-500 hover:text-red-500 hover:bg-white border border-slate-200 backdrop-blur-xs"
      }`}
    >
      <span className="text-sm">{isSaved ? "♥" : "♡"}</span>
    </button>
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
      <span className="font-semibold text-slate-800 truncate max-w-[140px]">{sellerName}</span>
      {sellerTier === "premium" && (
        <span className="rounded bg-amber-50 border border-amber-200/80 px-1 py-0.2 text-[9px] font-extrabold text-amber-700">
          👑 Flagship
        </span>
      )}
      {sellerTier === "verified" && (
        <span className="rounded bg-emerald-50 border border-emerald-200/80 px-1 py-0.2 text-[9px] font-extrabold text-emerald-700">
          ✓ Verified
        </span>
      )}
    </div>
  );
};

export const StockIndicator = ({ stockQty }: { stockQty: number }) => {
  if (stockQty <= 0) {
    return <span className="text-[11px] font-bold text-red-600">Out of Stock</span>;
  }
  if (stockQty <= 5) {
    return <span className="text-[11px] font-bold text-amber-600">⚡ Only {stockQty} left!</span>;
  }
  return <span className="text-[11px] font-bold text-emerald-600">✓ In Stock</span>;
};

export const DeliveryInformation = ({ deliveryDays = 2, deliveryEstimate }: { deliveryDays?: number; deliveryEstimate?: string }) => {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
      <span className="text-slate-400">🚚</span>
      <span className="font-medium">
        {deliveryEstimate || `Get it in ${deliveryDays} days`}
      </span>
    </div>
  );
};

export type ProductCardVariant =
  | "standard"
  | "compact"
  | "horizontal"
  | "search_result"
  | "wishlist"
  | "recommended"
  | "sponsored"
  | "out_of_stock"
  | "discounted"
  | "multi_seller";

export interface OtherSellerOffer {
  sellerName: string;
  sellerTier: "new" | "verified" | "premium";
  price: number;
  deliveryDays: number;
  rating: number;
}

export interface ProductCardProps {
  id: string;
  title: string;
  brand?: string;
  image: string;
  secondaryImage?: string;
  price: number | string;
  originalPrice?: number | string;
  sellerName?: string;
  sellerTier?: "new" | "verified" | "premium";
  rating?: number;
  reviewsCount?: number;
  stockQty?: number;
  badge?: string;
  deliveryEstimate?: string;
  deliveryDays?: number;
  variant?: ProductCardVariant;
  matchScore?: number;
  priceDropAmount?: number;
  otherSellersCount?: number;
  otherSellerOffers?: OtherSellerOffer[];
  specifications?: string[];
  onAddToCart?: (qty?: number) => void;
  onQuickView?: () => void;
  onRemoveFromWishlist?: () => void;
  onNotifyStock?: (email: string) => void;
  onCompareSellers?: () => void;
}

export const ProductCard = ({
  id,
  title,
  brand,
  image,
  secondaryImage,
  price,
  originalPrice,
  sellerName = "Office Connect Direct",
  sellerTier = "verified",
  rating = 4.8,
  reviewsCount = 120,
  stockQty = 10,
  badge,
  deliveryEstimate = "FREE Delivery by Tomorrow",
  deliveryDays = 1,
  variant = "standard",
  matchScore = 96,
  priceDropAmount,
  otherSellersCount = 3,
  otherSellerOffers,
  specifications,
  onAddToCart,
  onQuickView,
  onRemoveFromWishlist,
  onNotifyStock,
  onCompareSellers,
}: ProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  const numOrig = originalPrice ? (typeof originalPrice === "string" ? parseFloat(originalPrice) : originalPrice) : undefined;
  const isOutOfStock = variant === "out_of_stock" || stockQty <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    setIsAddedToCart(true);
    if (onAddToCart) onAddToCart(quantity);
    setTimeout(() => setIsAddedToCart(false), 2000);
  };

  // 1. COMPACT VARIANT
  if (variant === "compact") {
    return (
      <div className="group border border-slate-200 rounded-[6px] bg-white overflow-hidden hover:border-slate-400 transition-all flex flex-col justify-between p-2.5 space-y-2 select-none">
        <div className="relative aspect-square bg-slate-50 rounded-[4px] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
          />
          {badge && (
            <span className="absolute top-1 left-1 bg-slate-900/90 text-white text-[8px] font-black px-1.5 py-0.2 rounded-[2px]">
              {badge}
            </span>
          )}
        </div>

        <div className="space-y-1">
          {brand && <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">{brand}</span>}
          <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#404d85] transition">
            {title}
          </h4>
          <Rating score={rating} reviewsCount={reviewsCount} />
          <ProductPrice price={price} originalPrice={originalPrice} size="xs" />
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full py-1.5 rounded-[4px] bg-slate-900 hover:bg-[#404d85] text-white text-[11px] font-bold transition"
        >
          {isAddedToCart ? "✓ Added" : "+ Add"}
        </button>
      </div>
    );
  }

  // 2. HORIZONTAL VARIANT
  if (variant === "horizontal") {
    return (
      <div className="group border border-slate-200 rounded-[8px] bg-white p-4 hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[6px] bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              {brand && <span className="text-[10px] font-black text-[#404d85] uppercase tracking-wider">{brand}</span>}
              <SellerBadge sellerName={sellerName} sellerTier={sellerTier} />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 line-clamp-2 group-hover:text-[#404d85] transition">
              {title}
            </h4>
            <div className="flex items-center gap-3">
              <Rating score={rating} reviewsCount={reviewsCount} />
              <StockIndicator stockQty={stockQty} />
            </div>
            <DeliveryInformation deliveryEstimate={deliveryEstimate} />
          </div>
        </div>

        <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-center w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
          <ProductPrice price={price} originalPrice={originalPrice} size="md" />

          <div className="flex items-center gap-2">
            <QuantitySelector value={quantity} onChange={setQuantity} size="sm" />
            <Button size="xs" variant="primary" onClick={handleAddToCart}>
              {isAddedToCart ? "✓ Added" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. SEARCH RESULT VARIANT
  if (variant === "search_result") {
    return (
      <div className="group border border-slate-200 rounded-[8px] bg-white p-5 hover:border-slate-400 transition-all flex flex-col md:flex-row gap-6 select-none">
        <div className="relative w-full md:w-52 aspect-square md:aspect-auto rounded-[6px] bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-103 transition duration-300" />
          <div className="absolute top-2 right-2">
            <WishlistButton isSaved={isWishlisted} onToggle={() => setIsWishlisted(!isWishlisted)} />
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            {brand && <span className="text-[11px] font-black text-[#404d85] uppercase tracking-wider">{brand}</span>}
            <span className="text-slate-300">•</span>
            <SellerBadge sellerName={sellerName} sellerTier={sellerTier} />
          </div>

          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#404d85] transition">
            {title}
          </h3>

          <div className="flex items-center gap-3">
            <Rating score={rating} reviewsCount={reviewsCount} />
            <span className="text-slate-300">•</span>
            <StockIndicator stockQty={stockQty} />
          </div>

          {specifications && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {specifications.map((s, i) => (
                <span key={i} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="pt-1">
            <DeliveryInformation deliveryEstimate={deliveryEstimate} />
          </div>
        </div>

        <div className="md:w-56 flex flex-col justify-between pt-4 md:pt-0 border-t md:border-t-0 md:border-l md:pl-6 border-slate-100 space-y-3">
          <div className="space-y-1">
            <ProductPrice price={price} originalPrice={originalPrice} size="lg" />
            <p className="text-[11px] text-slate-500">Includes all GST taxes & warranty</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <QuantitySelector value={quantity} onChange={setQuantity} size="sm" />
              <Button size="sm" variant="primary" isFullWidth onClick={handleAddToCart}>
                {isAddedToCart ? "✓ Added" : "Add to Cart"}
              </Button>
            </div>

            {otherSellersCount > 0 && (
              <button
                type="button"
                onClick={onCompareSellers}
                className="w-full py-1.5 text-center text-[11px] font-bold text-[#404d85] hover:underline"
              >
                Compare {otherSellersCount} Other Seller Offers →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. WISHLIST VARIANT
  if (variant === "wishlist") {
    return (
      <div className="group border border-slate-200 rounded-[8px] bg-white overflow-hidden hover:border-slate-300 transition-all flex flex-col justify-between select-none">
        <div className="relative aspect-square bg-slate-50 overflow-hidden border-b border-slate-100">
          <img src={image} alt={title} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onRemoveFromWishlist}
            aria-label="Remove from wishlist"
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-400 hover:text-red-600 hover:bg-white flex items-center justify-center text-xs font-bold shadow-xs transition"
          >
            ✕
          </button>
          {priceDropAmount && priceDropAmount > 0 && (
            <span className="absolute bottom-2 left-2 bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
              📉 Price dropped by {formatINR(priceDropAmount)}
            </span>
          )}
        </div>

        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            {brand && <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{brand}</span>}
            <h4 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-[#404d85] transition">
              {title}
            </h4>
            <div className="flex items-center justify-between">
              <Rating score={rating} reviewsCount={reviewsCount} />
              <StockIndicator stockQty={stockQty} />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <ProductPrice price={price} originalPrice={originalPrice} size="sm" />
            <Button size="xs" variant="primary" isFullWidth onClick={handleAddToCart}>
              {isAddedToCart ? "✓ Moved to Cart" : "Move to Cart"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 5. RECOMMENDED VARIANT
  if (variant === "recommended") {
    return (
      <div className="group border border-slate-200 rounded-[8px] bg-white overflow-hidden hover:border-slate-400 transition-all flex flex-col justify-between select-none">
        <div className="relative aspect-square bg-slate-50 overflow-hidden border-b border-slate-100">
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-103 transition duration-300" />
          <span className="absolute top-2 left-2 rounded bg-[#404d85] text-white px-2 py-0.5 text-[9px] font-black shadow-xs">
            ⚡ {matchScore}% MATCH
          </span>
          <div className="absolute top-2 right-2">
            <WishlistButton isSaved={isWishlisted} onToggle={() => setIsWishlisted(!isWishlisted)} />
          </div>
        </div>

        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              {brand && <span className="text-[10px] font-black text-slate-400 uppercase">{brand}</span>}
              <span className="text-[9px] font-bold text-emerald-600">Top Algorithm Pick</span>
            </div>
            <h4 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-[#404d85] transition">
              {title}
            </h4>
            <Rating score={rating} reviewsCount={reviewsCount} />
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <ProductPrice price={price} originalPrice={originalPrice} size="sm" />
            <DeliveryInformation deliveryEstimate={deliveryEstimate} />
            <Button size="xs" variant="primary" isFullWidth onClick={handleAddToCart}>
              {isAddedToCart ? "✓ Added" : "+ Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 6. SPONSORED VARIANT
  if (variant === "sponsored") {
    return (
      <div className="group border border-amber-200/90 rounded-[8px] bg-amber-50/20 overflow-hidden hover:border-amber-400 transition-all flex flex-col justify-between select-none">
        <div className="relative aspect-square bg-slate-50 overflow-hidden border-b border-amber-100">
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-103 transition duration-300" />
          <span className="absolute top-2 left-2 rounded bg-amber-500/90 text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider backdrop-blur-xs">
            Sponsored Ad
          </span>
          <div className="absolute top-2 right-2">
            <WishlistButton isSaved={isWishlisted} onToggle={() => setIsWishlisted(!isWishlisted)} />
          </div>
        </div>

        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <SellerBadge sellerName={sellerName} sellerTier={sellerTier} />
            <h4 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-[#404d85] transition">
              {title}
            </h4>
            <Rating score={rating} reviewsCount={reviewsCount} />
          </div>

          <div className="pt-2 border-t border-amber-100 space-y-2">
            <ProductPrice price={price} originalPrice={originalPrice} size="sm" />
            <DeliveryInformation deliveryEstimate={deliveryEstimate} />
            <Button size="xs" variant="primary" isFullWidth onClick={handleAddToCart}>
              {isAddedToCart ? "✓ Added" : "+ Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 7. OUT OF STOCK VARIANT
  if (variant === "out_of_stock") {
    return (
      <div className="border border-slate-200 rounded-[8px] bg-slate-50/70 overflow-hidden flex flex-col justify-between opacity-85 select-none">
        <div className="relative aspect-square bg-slate-100 overflow-hidden border-b border-slate-200 grayscale">
          <img src={image} alt={title} className="w-full h-full object-cover opacity-60" />
          <span className="absolute top-2 left-2 rounded bg-slate-900 text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
            Out of Stock
          </span>
        </div>

        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            {brand && <span className="text-[10px] font-black text-slate-400 uppercase">{brand}</span>}
            <h4 className="font-bold text-xs text-slate-700 line-clamp-2">
              {title}
            </h4>
            <ProductPrice price={price} originalPrice={originalPrice} size="sm" />
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-2">
            <button
              type="button"
              onClick={() => {
                const email = prompt("Enter your email to receive back-in-stock alert:");
                if (email && onNotifyStock) onNotifyStock(email);
              }}
              className="w-full py-2 rounded-[4px] bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition"
            >
              🔔 Notify Me When Available
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 8. DISCOUNTED VARIANT
  if (variant === "discounted") {
    const unitsLeft = stockQty <= 5 ? stockQty : 4;
    return (
      <div className="group border border-red-200 rounded-[8px] bg-white overflow-hidden hover:border-red-400 shadow-2xs transition-all flex flex-col justify-between select-none">
        <div className="relative aspect-square bg-slate-50 overflow-hidden border-b border-slate-100">
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-103 transition duration-300" />
          <span className="absolute top-2 left-2 rounded bg-red-600 text-white px-2 py-0.5 text-[10px] font-black">
            🔥 FLASH DEAL
          </span>
          <div className="absolute top-2 right-2">
            <WishlistButton isSaved={isWishlisted} onToggle={() => setIsWishlisted(!isWishlisted)} />
          </div>
        </div>

        <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <SellerBadge sellerName={sellerName} sellerTier={sellerTier} />
            <h4 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-[#404d85] transition">
              {title}
            </h4>
            <Rating score={rating} reviewsCount={reviewsCount} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-red-600">
              <span>⚡ Almost Sold Out</span>
              <span>Only {unitsLeft} left</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-red-600 h-full rounded-full w-4/5" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <ProductPrice price={price} originalPrice={originalPrice} size="sm" />
            <Button size="xs" variant="primary" onClick={handleAddToCart}>
              {isAddedToCart ? "✓ Added" : "Grab Deal"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 9. MULTI-SELLER VARIANT
  if (variant === "multi_seller") {
    return (
      <div className="group border border-slate-200 rounded-[8px] bg-white overflow-hidden hover:border-slate-400 transition-all flex flex-col justify-between select-none">
        <div className="relative aspect-square bg-slate-50 overflow-hidden border-b border-slate-100">
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-103 transition duration-300" />
          <span className="absolute top-2 left-2 rounded bg-emerald-700 text-white px-2 py-0.5 text-[9px] font-black">
            👑 BUY BOX WINNER
          </span>
          <div className="absolute top-2 right-2">
            <WishlistButton isSaved={isWishlisted} onToggle={() => setIsWishlisted(!isWishlisted)} />
          </div>
        </div>

        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <SellerBadge sellerName={sellerName} sellerTier={sellerTier} />
              <span className="text-[10px] font-bold text-emerald-600">Best Value</span>
            </div>
            <h4 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-[#404d85] transition">
              {title}
            </h4>
            <Rating score={rating} reviewsCount={reviewsCount} />
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <ProductPrice price={price} originalPrice={originalPrice} size="sm" />
              <Button size="xs" variant="primary" onClick={handleAddToCart}>
                {isAddedToCart ? "✓ Added" : "+ Add"}
              </Button>
            </div>

            <button
              type="button"
              onClick={onCompareSellers}
              className="w-full py-1.5 rounded-[4px] bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 transition text-center"
            >
              + Available from {otherSellersCount} other sellers →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 10. STANDARD VARIANT
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group border border-slate-200 rounded-[8px] bg-white overflow-hidden hover:border-slate-400 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between select-none"
    >
      <div className="relative aspect-square bg-slate-50 overflow-hidden border-b border-slate-100">
        <img
          src={isHovered && secondaryImage ? secondaryImage : image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
        />
        {badge && (
          <span className="absolute top-2 left-2 rounded bg-slate-900/90 text-white px-2 py-0.5 text-[9px] font-black backdrop-blur-xs">
            {badge}
          </span>
        )}
        <div className="absolute top-2 right-2">
          <WishlistButton isSaved={isWishlisted} onToggle={() => setIsWishlisted(!isWishlisted)} />
        </div>
      </div>

      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            {brand && <span className="text-[10px] font-black text-[#404d85] uppercase tracking-wider">{brand}</span>}
            <SellerBadge sellerName={sellerName} sellerTier={sellerTier} />
          </div>
          <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-[#404d85] transition">
            {title}
          </h4>
          <Rating score={rating} reviewsCount={reviewsCount} />
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <ProductPrice price={price} originalPrice={originalPrice} size="sm" />
            <Button size="xs" variant="primary" onClick={handleAddToCart}>
              {isAddedToCart ? "✓ Added" : "+ Add"}
            </Button>
          </div>
          <DeliveryInformation deliveryEstimate={deliveryEstimate} />
        </div>
      </div>
    </div>
  );
};
