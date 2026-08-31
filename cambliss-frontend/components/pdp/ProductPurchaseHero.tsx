"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR, SellerBadge } from "@/components/commerce/CommercePrimitives";

export interface ProductVariantOption {
  id: string;
  name: string;
  colorCode: string;
  image: string;
  inStock: boolean;
  priceOffset?: number;
}

export interface ProductHeroData {
  id: string;
  title: string;
  brand: string;
  brandSlug: string;
  category: string;
  rating: number;
  reviewsCount: number;
  questionsCount: number;
  basePrice: number;
  originalPrice: number;
  images: string[];
  variants: ProductVariantOption[];
  sellerName: string;
  sellerTier: "premium" | "verified" | "new";
  dispatchSla: string;
  stockCount: number;
}

export const ProductPurchaseHero = ({
  product,
  onAddToCart,
  onBuyNow,
}: {
  product: ProductHeroData;
  onAddToCart: (variantId: string, quantity: number) => void;
  onBuyNow: (variantId: string, quantity: number) => void;
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantOption>(
    product.variants[0] || {
      id: "v-default",
      name: "Default",
      colorCode: "#1e293b",
      image: product.images[0],
      inStock: true,
    }
  );

  const [activeImage, setActiveImage] = useState<string>(
    selectedVariant.image || product.images[0]
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [pincode, setPincode] = useState<string>("560001");
  const [isPincodeChecked, setIsPincodeChecked] = useState<boolean>(true);
  const [pincodeMessage, setPincodeMessage] = useState<string>(
    "Delivery to Bengaluru 560001: FREE Express Delivery by Tomorrow, 1 PM via Bluedart Air"
  );
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  const activePrice = product.basePrice + (selectedVariant.priceOffset || 0);
  const discountAmount = product.originalPrice - activePrice;
  const discountPct = Math.round((discountAmount / product.originalPrice) * 100);

  const handleVariantSelect = (variant: ProductVariantOption) => {
    setSelectedVariant(variant);
    if (variant.image) {
      setActiveImage(variant.image);
    }
  };

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.trim().length === 6) {
      setIsPincodeChecked(true);
      setPincodeMessage(`Delivery to Pincode ${pincode}: FREE Delivery by Tomorrow, 1 PM (Bluedart Express)`);
    } else {
      setIsPincodeChecked(false);
      setPincodeMessage("Please enter a valid 6-digit Indian postal code.");
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 select-none">
      
      {/* 1. LEFT COLUMN: IMAGE GALLERY (5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        
        {/* Main Stage with Zoom Lens */}
        <div
          className="relative aspect-square w-full rounded-[8px] bg-slate-50 border border-slate-200 overflow-hidden cursor-crosshair flex items-center justify-center shadow-2xs"
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onMouseMove={handleMouseMove}
        >
          <img
            src={activeImage}
            alt={product.title}
            className={`w-full h-full object-contain p-4 transition-transform duration-100 ${
              isZooming ? "scale-150" : "scale-100"
            }`}
            style={
              isZooming
                ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                : undefined
            }
          />
          
          {/* Zoom hint badge */}
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-xs rounded text-[10px] font-bold text-slate-600 border border-slate-200 pointer-events-none">
            🔍 Hover to Zoom
          </div>

          {/* Genuine Authentic Badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-emerald-700 text-white rounded text-[10px] font-black uppercase tracking-wider shadow-2xs">
            100% Genuine Brand Stock
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {product.images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImage(img)}
              className={`w-16 h-16 rounded-[6px] border p-1 bg-white shrink-0 transition ${
                activeImage === img
                  ? "border-[#404d85] ring-2 ring-[#404d85]/20 shadow-2xs"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>

      </div>

      {/* 2. RIGHT COLUMN: PRODUCT INFO & HIGH-PRIORITY PURCHASE AREA (7 Cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Brand & Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/brand/${product.brandSlug}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#404d85]/10 border border-[#404d85]/20 text-[#404d85] text-xs font-black hover:bg-[#404d85]/15 transition"
            >
              <span>👑 Official {product.brand} Flagship Store</span>
              <span>→</span>
            </Link>
            <SellerBadge sellerName={product.sellerName} sellerTier={product.sellerTier} />
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight">
            {product.title}
          </h1>

          {/* Ratings & Q&A Bar */}
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <div className="flex items-center gap-1 bg-emerald-700 text-white font-black px-2 py-0.5 rounded text-[11px]">
              <span>★</span>
              <span>{product.rating.toFixed(1)}</span>
            </div>
            <span className="font-bold text-slate-700">{product.reviewsCount.toLocaleString()} Verified Ratings</span>
            <span>•</span>
            <span className="text-slate-500">{product.questionsCount} Answered Questions</span>
          </div>
        </div>

        {/* PRICE & DISCOUNT SECTION (High Visual Impact) */}
        <div className="p-4 rounded-[8px] bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {formatINR(activePrice)}
            </span>
            <span className="text-sm font-semibold text-slate-400 line-through">
              MRP: {formatINR(product.originalPrice)}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-black">
              {discountPct}% OFF • Save {formatINR(discountAmount)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Inclusive of all taxes • 18% GST invoice eligible for B2B input tax credit
          </p>
        </div>

        {/* VARIANT SELECTORS (Color & Finish) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
              Select Color Finish: <strong className="text-[#404d85]">{selectedVariant.name}</strong>
            </span>
            <span className="text-emerald-700 font-bold text-[11px]">
              {selectedVariant.inStock ? "✓ In Stock" : "Out of Stock"}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {product.variants.map((v) => {
              const isSelected = selectedVariant.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleVariantSelect(v)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-[6px] border text-xs font-bold transition ${
                    isSelected
                      ? "border-[#404d85] bg-[#404d85]/5 ring-2 ring-[#404d85]/20 text-[#404d85]"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                    style={{ backgroundColor: v.colorCode }}
                  />
                  <span>{v.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* DELIVERY AVAILABILITY & PINCODE CHECKER */}
        <div className="p-4 rounded-[8px] bg-white border border-slate-200 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
              📍 Delivery SLA & Pincode Checker
            </span>
            <span className="text-[10px] font-bold text-slate-400">Hub: BLR-Air Express</span>
          </div>

          <form onSubmit={handlePincodeCheck} className="flex gap-2 max-w-sm">
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Enter 6-digit Pincode"
              className="flex-1 px-3 py-1.5 border border-slate-300 rounded-[4px] text-xs font-mono font-bold focus:outline-hidden focus:border-[#404d85]"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-[4px] bg-slate-900 hover:bg-black text-white font-bold text-xs transition"
            >
              Check SLA
            </button>
          </form>

          <p
            className={`text-[11px] font-semibold ${
              isPincodeChecked ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {pincodeMessage}
          </p>

          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-2">
            <span className="text-emerald-600 font-black">● In Stock</span>
            <span>{product.stockCount} units available at certified dispatch center</span>
          </div>
        </div>

        {/* PURCHASE CTAS (HIGH VISUAL PRIORITY) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            
            {/* Quantity Selector */}
            <div className="flex items-center border border-slate-300 rounded-[6px] bg-white h-12 px-2 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 rounded text-sm"
              >
                -
              </button>
              <span className="w-8 text-center font-black text-slate-900 text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 rounded text-sm"
              >
                +
              </button>
            </div>

            {/* Add to Cart CTA */}
            <button
              type="button"
              onClick={() => onAddToCart(selectedVariant.id, quantity)}
              className="flex-1 h-12 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] active:bg-[#252f5a] text-white font-black text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>🛒</span>
              <span>Add to Cart</span>
            </button>

            {/* Buy Now CTA */}
            <button
              type="button"
              onClick={() => onBuyNow(selectedVariant.id, quantity)}
              className="flex-1 h-12 rounded-[6px] bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              <span>Buy Now</span>
            </button>

          </div>

          {/* Escrow Protection Strip */}
          <div className="p-2.5 rounded bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-[11px] font-semibold flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span>🛡️</span>
              <span>100% Escrow Protection: Funds held securely until verified delivery OTP scan</span>
            </div>
            <span className="font-black text-emerald-800">7-Day Replacement</span>
          </div>

        </div>

      </div>

    </div>
  );
};
