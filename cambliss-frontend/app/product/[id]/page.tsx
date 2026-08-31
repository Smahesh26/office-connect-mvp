"use client";

import { useState, use } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { ProductImageGallery } from "@/components/pdp/ProductImageGallery";
import { ProductBuyBox, BuyBoxOffer } from "@/components/pdp/ProductBuyBox";
import { OtherSellersTable, OtherSellerItem } from "@/components/pdp/OtherSellersTable";
import { ProductSpecsAndReviews } from "@/components/pdp/ProductSpecsAndReviews";
import { MobileStickyBuyBar } from "@/components/pdp/MobileStickyBuyBar";
import { Rating, ProductCard } from "@/components/commerce/CommercePrimitives";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [selectedColor, setSelectedColor] = useState("Midnight Black");
  const [selectedVariant, setSelectedVariant] = useState("Standard Edition");
  const [activeToast, setActiveToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 3000);
  };

  // Product Data
  const product = {
    id: id || "prod-1",
    title: "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones",
    brand: "Sony",
    category: "Electronics",
    categorySlug: "electronics",
    subCategory: "Wireless Headphones",
    badge: "👑 OFFICIAL 1P FLAGSHIP",
    rating: 4.9,
    reviewsCount: 1420,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
    ],
    highlights: [
      "Industry-leading noise canceling with two processors and 8 microphones",
      "Magnificent Sound, engineered with the new Integrated Processor V1",
      "Crystal clear hands-free calling with 4 beamforming microphones and precise voice pickup",
      "Up to 30-hour battery life with quick charging (3 min charge for 3 hours of playback)",
      "Ultra-comfortable, lightweight design with soft fit synthetic leather",
    ],
    colors: [
      { name: "Midnight Black", hex: "#1e2022" },
      { name: "Platinum Silver", hex: "#d8d9de" },
      { name: "Smoky Blue", hex: "#2b3a4a" },
    ],
    variants: ["Standard Edition", "Travel Case Bundle", "2-Year Extended Care Pack"],
  };

  // Winning Buy Box Offer
  const buyBoxOffer: BuyBoxOffer = {
    sellerId: "v-office-direct",
    sellerName: "Office Connect Direct",
    sellerTier: "premium",
    sellerRating: 4.9,
    sellerReviewsCount: 520,
    price: 29990,
    originalPrice: 34990,
    stockQty: 24,
    deliveryDays: 1,
    shipsFrom: "Bangalore Platform Fulfillment Center",
  };

  // Alternative Verified Sellers
  const otherSellers: OtherSellerItem[] = [
    {
      sellerId: "v-technova",
      sellerName: "TechNova Enterprises",
      sellerTier: "verified",
      rating: 4.8,
      reviewsCount: 310,
      condition: "Brand New • Factory Sealed",
      price: 29499,
      deliveryDays: 2,
      shipsFrom: "Mumbai, MH",
    },
    {
      sellerId: "v-audiohub",
      sellerName: "Pro Audio Direct",
      sellerTier: "verified",
      rating: 4.7,
      reviewsCount: 180,
      condition: "Brand New • Sony Authorized",
      price: 29800,
      deliveryDays: 3,
      shipsFrom: "New Delhi, DL",
    },
    {
      sellerId: "v-gadgetworld",
      sellerName: "Gadget World Retail",
      sellerTier: "verified",
      rating: 4.6,
      reviewsCount: 94,
      condition: "Brand New • Sealed Box",
      price: 30200,
      deliveryDays: 2,
      shipsFrom: "Chennai, TN",
    },
  ];

  // Technical Specs
  const specs = [
    { key: "Headphone Type", value: "Closed, Dynamic Over-Ear" },
    { key: "Driver Unit", value: "30mm Specially Engineered Carbon Fiber Dome" },
    { key: "Frequency Response", value: "4 Hz - 40,000 Hz (Active), 20 Hz - 20,000 Hz (Bluetooth)" },
    { key: "Bluetooth Version", value: "Version 5.2 (LDAC, AAC, SBC Supported)" },
    { key: "Battery Life", value: "Max. 30 hrs (NC ON), Max. 40 hrs (NC OFF)" },
    { key: "Weight", value: "Approx. 250 grams" },
    { key: "Microphone Array", value: "8 Microphones with AI Noise Reduction" },
    { key: "Warranty", value: "1 Year Official Sony India Manufacturer Warranty" },
  ];

  // Customer Reviews
  const reviews = [
    {
      id: "rev-1",
      author: "Aditya Sharma",
      rating: 5,
      date: "24 August 2026",
      title: "Unrivaled Noise Cancellation and Pure Comfort",
      comment: "Upgraded from XM4. The dual processors make airplane cabin noise virtually silent. Mic quality for Zoom calls is vastly superior. Dispatched same day by Office Connect Direct!",
      isVerifiedPurchase: true,
      helpfulCount: 42,
    },
    {
      id: "rev-2",
      author: "Meera Krishnan",
      rating: 5,
      date: "18 August 2026",
      title: "Worth every rupee for remote work",
      comment: "Sound signature is balanced, LDAC streaming from Apple Music is crystal clear. Battery easily lasts 4 days of full workday usage with ANC on.",
      isVerifiedPurchase: true,
      helpfulCount: 19,
    },
  ];

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-32 select-none">
        
        {/* Toast Alert */}
        {activeToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-[8px] shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-bounce">
            <span className="text-emerald-400">✓</span>
            <span>{activeToast}</span>
          </div>
        )}

        {/* 1. BREADCRUMB */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/storefront" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-slate-900 transition">Departments</Link>
          <span>/</span>
          <Link href={`/category/${product.categorySlug}`} className="hover:text-slate-900 transition">{product.category}</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate max-w-xs">{product.title}</span>
        </nav>

        {/* 2. TOP HERO SECTION: GALLERY + PRODUCT SPECS + BUY BOX */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Gallery (5 Cols) */}
          <div className="lg:col-span-5">
            <ProductImageGallery images={product.images} title={product.title} badge={product.badge} />
          </div>

          {/* Center Details (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Link
                  href={`/brand/${product.brand.toLowerCase()}`}
                  className="text-xs font-black uppercase tracking-widest text-[#404d85] hover:underline"
                >
                  Visit the {product.brand} Store
                </Link>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] text-slate-500 font-medium">SKU: OC-98214-XM5</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {product.title}
              </h1>

              <div className="flex items-center gap-3 pt-1">
                <Rating score={product.rating} reviewsCount={product.reviewsCount} />
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-emerald-600">✓ In Stock & Verified</span>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block">
                Color: <span className="text-slate-900 font-black">{selectedColor}</span>
              </span>
              <div className="flex items-center gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`px-3 py-1.5 rounded-[4px] border text-xs font-bold flex items-center gap-2 transition ${
                      selectedColor === c.name
                        ? "border-[#404d85] bg-slate-50 text-[#404d85] shadow-2xs"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Variant Package Options */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block">Edition / Package:</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-1.5 rounded-[4px] border text-xs font-bold transition ${
                      selectedVariant === v
                        ? "border-[#404d85] bg-slate-50 text-[#404d85]"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Key Feature Bullets */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] block">
                About this item:
              </span>
              <ul className="space-y-2 text-slate-600 list-disc list-inside leading-relaxed">
                {product.highlights.map((h, i) => (
                  <li key={i}><span className="text-slate-800 font-medium">{h}</span></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Buy Box (3 Cols) */}
          <div className="lg:col-span-3">
            <ProductBuyBox
              offer={buyBoxOffer}
              onAddToCart={(qty) => showToast(`Added ${qty}x "${product.title}" to cart!`)}
              onBuyNow={() => (window.location.href = "/checkout")}
            />
          </div>

        </div>

        {/* 3. MULTI-SELLER COMPARISON TABLE */}
        <OtherSellersTable
          offers={otherSellers}
          onAddToCart={(seller) => showToast(`Added from ${seller.sellerName} at ₹${seller.price.toLocaleString()}!`)}
        />

        {/* 4. TECHNICAL SPECIFICATIONS & CUSTOMER REVIEWS */}
        <ProductSpecsAndReviews
          specifications={specs}
          reviews={reviews}
          overallRating={product.rating}
          totalReviews={product.reviewsCount}
        />

        {/* 5. MOBILE STICKY BUY BAR */}
        <MobileStickyBuyBar
          title={product.title}
          image={product.images[0]}
          price={buyBoxOffer.price}
          onAddToCart={() => showToast(`Added "${product.title}" to cart!`)}
          onBuyNow={() => (window.location.href = "/checkout")}
        />

      </div>
    </StorefrontShell>
  );
}
