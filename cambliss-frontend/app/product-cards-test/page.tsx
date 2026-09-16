"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import {
  ProductCard,
  ProductCardVariant,
  formatINR,
} from "@/components/commerce/CommercePrimitives";

interface DemoProduct {
  id: string;
  title: string;
  brand: string;
  category: string;
  image: string;
  secondaryImage?: string;
  price: number;
  originalPrice?: number;
  sellerName: string;
  sellerTier: "new" | "verified" | "premium";
  rating: number;
  reviewsCount: number;
  stockQty: number;
  badge?: string;
  deliveryEstimate: string;
  variant: ProductCardVariant;
  matchScore?: number;
  priceDropAmount?: number;
  otherSellersCount?: number;
  specifications?: string[];
}

export default function ProductCardsTestPage() {
  const [selectedVariantFilter, setSelectedVariantFilter] = useState<string>("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [cartCount, setCartCount] = useState(0);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 3000);
  };

  const handleAddToCart = (product: DemoProduct, qty?: number) => {
    const quantity = qty || 1;
    setCartCount((prev) => prev + quantity);
    showToast(`Added ${quantity}x "${product.title}" to cart (${formatINR(product.price * quantity)})`);
  };

  // Dynamic Marketplace Products (Purged mock data - loads from custom uploaded products or starts clean)
  const [sampleProducts, setSampleProducts] = useState<DemoProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("officeconnect_custom_products");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: DemoProduct[] = parsed.map((p: any) => ({
            id: p.id || `custom-${Math.random()}`,
            title: p.title || p.name || "Custom Product",
            brand: p.brand || "Verified Merchant",
            category: p.category || "Electronics",
            image: p.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
            price: Number(p.price) || 0,
            originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
            sellerName: p.sellerName || "Registered Merchant",
            sellerTier: "verified" as const,
            rating: 5.0,
            reviewsCount: 0,
            stockQty: Number(p.stockQty) || 10,
            deliveryEstimate: "Standard Dispatch",
            variant: "standard" as const,
          }));
          setSampleProducts(mapped);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const variantsList: { key: string; label: string; count: number; desc: string }[] = [
    { key: "all", label: "All Variants Showcase", count: sampleProducts.length, desc: "Explore the comprehensive production suite across 10 specialized variants" },
    { key: "standard", label: "1. Standard", count: sampleProducts.filter(p => p.variant === "standard").length, desc: "Default catalog & category browsing card with hover actions" },
    { key: "compact", label: "2. Compact", count: sampleProducts.filter(p => p.variant === "compact").length, desc: "Dense grid card for sidebars, mini-shelves, and high-density listings" },
    { key: "horizontal", label: "3. Horizontal", count: sampleProducts.filter(p => p.variant === "horizontal").length, desc: "Row layout for cart review, order history, and tablet comparisons" },
    { key: "search_result", label: "4. Search Result", count: sampleProducts.filter(p => p.variant === "search_result").length, desc: "Search format with attribute chips, SLA, and seller comparison" },
    { key: "wishlist", label: "5. Wishlist", count: sampleProducts.filter(p => p.variant === "wishlist").length, desc: "Wishlist card with price drop tracking and fast Move-to-Cart" },
    { key: "recommended", label: "6. Recommended", count: sampleProducts.filter(p => p.variant === "recommended").length, desc: "Algorithmic recommendation tile with % match confidence score" },
    { key: "sponsored", label: "7. Sponsored", count: sampleProducts.filter(p => p.variant === "sponsored").length, desc: "Transparent sponsored ad listing with brand compliance tags" },
    { key: "out_of_stock", label: "8. Out of Stock", count: sampleProducts.filter(p => p.variant === "out_of_stock").length, desc: "Grayscale overlay with Notify Me back-in-stock alert modal" },
    { key: "discounted", label: "9. Discounted / Deal", count: sampleProducts.filter(p => p.variant === "discounted").length, desc: "Flash deal card with urgency progress bar & savings amount" },
    { key: "multi_seller", label: "10. Multi-Seller", count: sampleProducts.filter(p => p.variant === "multi_seller").length, desc: "Buy-box winner card with other seller offers comparison action" },
  ];

  const filteredProducts = sampleProducts.filter((p) => {
    const matchVariant = selectedVariantFilter === "all" || p.variant === selectedVariantFilter;
    const matchCategory = selectedCategoryFilter === "all" || p.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
    return matchVariant && matchCategory;
  });

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-28 select-none">
        
        {/* Page Header */}
        <div className="space-y-2 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#404d85] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              PHASE 5 ENGINE
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-600">Product Card Component System</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Production Product Card Suite & Visual Lab
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1">
                Rigorous multi-variant testing environment featuring 10 production variants, responsive grid adaptability, micro-interactions, and 26 realistic multi-vendor SKUs.
              </p>
            </div>

            {/* Live Cart Counter & Status */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2 bg-slate-900 text-white rounded-[6px] text-xs font-bold flex items-center gap-2">
                <span>🛒 Cart:</span>
                <span className="bg-[#404d85] px-2 py-0.5 rounded text-xs font-black">{cartCount} items</span>
              </div>
              <Link
                href="/storefront"
                className="px-4 py-2 border border-slate-300 rounded-[6px] text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                ← Back to Storefront
              </Link>
            </div>
          </div>
        </div>

        {/* Toast Alert */}
        {activeToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-[8px] shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-bounce">
            <span className="text-emerald-400">✓</span>
            <span>{activeToast}</span>
          </div>
        )}

        {/* Multi-Seller Compare Modal Preview */}
        {activeModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[10px] max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-sm text-slate-900">Multi-Seller Offer Comparison</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
              </div>

              <p className="text-xs text-slate-600">
                Comparing all active verified merchant offers for <strong>{activeModal}</strong> with buyer protection and seller ratings:
              </p>

              <div className="space-y-2.5">
                {[
                  { seller: "Office Connect Direct 👑", price: 21990, rating: 4.9, sla: "Tomorrow (Escrow Guaranteed)" },
                  { seller: "TechNova Enterprises ✓", price: 21499, rating: 4.7, sla: "2-3 Days" },
                  { seller: "Alpha Electro Global ✓", price: 21800, rating: 4.6, sla: "3-4 Days" },
                ].map((s, idx) => (
                  <div key={idx} className="p-3 rounded border border-slate-200 hover:border-[#404d85] flex items-center justify-between transition">
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{s.seller}</span>
                      <span className="text-[10px] text-slate-500">★ {s.rating} • Delivery: {s.sla}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm text-slate-900">{formatINR(s.price)}</span>
                      <button
                        onClick={() => { setCartCount(prev => prev + 1); setActiveModal(null); showToast(`Added from ${s.seller}!`); }}
                        className="px-3 py-1 bg-slate-900 hover:bg-[#404d85] text-white text-[11px] font-bold rounded transition"
                      >
                        Select Offer
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded hover:bg-slate-200 transition"
                >
                  Close Comparison
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="space-y-4">
          
          {/* Variant Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {variantsList.map((v) => (
              <button
                key={v.key}
                onClick={() => setSelectedVariantFilter(v.key)}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedVariantFilter === v.key
                    ? "bg-[#404d85] text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>{v.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedVariantFilter === v.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {v.count}
                </span>
              </button>
            ))}
          </div>

          {/* Department Filter & Layout Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter Category:</span>
              {["all", "Electronics", "Computing", "Beauty", "Automotive", "Workspace", "Cloud"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded text-xs font-bold capitalize transition ${
                    selectedCategoryFilter === cat
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 shrink-0">
              <span>Displaying {filteredProducts.length} Products</span>
            </div>
          </div>

        </div>

        {/* Selected Variant Description Callout */}
        {selectedVariantFilter !== "all" && (
          <div className="p-4 rounded-[6px] bg-slate-100/70 border border-slate-200 text-xs">
            <span className="font-extrabold text-[#404d85] uppercase tracking-wider block">Variant Specification:</span>
            <p className="text-slate-700 mt-0.5">
              {variantsList.find(v => v.key === selectedVariantFilter)?.desc}
            </p>
          </div>
        )}

        {/* Main Product Cards Test Matrix */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-300 rounded-[8px] space-y-3 bg-slate-50">
            <span className="text-3xl">📦</span>
            <h3 className="text-base font-black text-slate-900">No products uploaded yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              The product test suite is clean and ready. Upload your products via the Seller Portal to preview all 10 variant layouts here.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/seller/products"
                className="px-5 py-2 rounded-[6px] bg-[#404d85] text-white font-bold text-xs hover:bg-[#323d6a] transition shadow-xs"
              >
                + Upload Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Grid Rendering */}
            <div className={
              selectedVariantFilter === "horizontal" || selectedVariantFilter === "search_result"
                ? "space-y-4"
                : selectedVariantFilter === "compact"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            }>
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  brand={p.brand}
                  image={p.image}
                  secondaryImage={p.secondaryImage}
                  price={p.price}
                  originalPrice={p.originalPrice}
                  sellerName={p.sellerName}
                  sellerTier={p.sellerTier}
                  rating={p.rating}
                  reviewsCount={p.reviewsCount}
                  stockQty={p.stockQty}
                  badge={p.badge}
                  deliveryEstimate={p.deliveryEstimate}
                  variant={p.variant}
                  matchScore={p.matchScore}
                  priceDropAmount={p.priceDropAmount}
                  otherSellersCount={p.otherSellersCount}
                  specifications={p.specifications}
                  onAddToCart={(qty?: number) => handleAddToCart(p, qty)}
                  onRemoveFromWishlist={() => showToast(`Removed "${p.title}" from Wishlist`)}
                  onNotifyStock={(email: string) => showToast(`Subscribed ${email} for "${p.title}" in-stock alerts!`)}
                  onCompareSellers={() => setActiveModal(p.title)}
                />
              ))}
            </div>

          </div>
        )}

      </div>
    </StorefrontShell>
  );
}
