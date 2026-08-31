"use client";

import { Suspense, useState } from "react";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { StorefrontHero } from "@/components/storefront/StorefrontHero";
import { StorefrontCategoryShortcuts } from "@/components/storefront/StorefrontCategoryShortcuts";
import { StorefrontTopDeals } from "@/components/storefront/StorefrontDealsSection";
import { StorefrontFeaturedStores } from "@/components/storefront/StorefrontFeaturedStores";
import { StorefrontFeaturedBrands } from "@/components/storefront/StorefrontFeaturedBrands";
import { StorefrontPersonalizedArea } from "@/components/storefront/StorefrontPersonalizedArea";
import { ProductCard } from "@/components/commerce/CommercePrimitives";

export default function StorefrontPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800 font-bold">Loading Marketplace...</div>}>
      <StorefrontShell>
        <StorefrontHomeContent />
      </StorefrontShell>
    </Suspense>
  );
}

function StorefrontHomeContent() {
  const [recommendedCategoryTab, setRecommendedCategoryTab] = useState("All");

  const recommendedProducts = [
    {
      id: "rec-p1",
      title: "Damask Rose Botanical Hydrating Serum (50ml)",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
      price: 2499,
      originalPrice: 3200,
      sellerName: "Glow Beauty Organics 🌸",
      sellerTier: "premium" as const,
      badge: "★ TOP RATED",
      rating: 5.0,
      reviewsCount: 310,
      category: "Beauty",
    },
    {
      id: "rec-p2",
      title: "Wireless ANC Noise-Cancelling Headphones Hi-Res Audio",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
      price: 18990,
      originalPrice: 22490,
      sellerName: "Office Connect Direct 👑",
      sellerTier: "premium" as const,
      badge: "⚡ FAST DISPATCH",
      rating: 4.9,
      reviewsCount: 420,
      category: "Electronics",
    },
    {
      id: "rec-p3",
      title: "Titanium Fitness & Cardiac Health Smartwatch",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
      price: 24990,
      originalPrice: 29990,
      sellerName: "Office Connect Direct 👑",
      sellerTier: "premium" as const,
      badge: "NEW ARRIVAL",
      rating: 4.9,
      reviewsCount: 156,
      category: "Electronics",
    },
    {
      id: "rec-p4",
      title: "5W-40 Fully Synthetic Engine Motor Oil (5 Liters)",
      image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
      price: 3200,
      originalPrice: 3800,
      sellerName: "AutoCare Motors 🚘",
      sellerTier: "verified" as const,
      rating: 4.8,
      reviewsCount: 88,
      category: "Automotive",
    },
  ];

  const filteredRecommended = recommendedCategoryTab === "All"
    ? recommendedProducts
    : recommendedProducts.filter((p) => p.category === recommendedCategoryTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12 pb-24 lg:pb-16">
      
      {/* 1. HERO / CAMPAIGN AREA (Editorial composition, no nested card) */}
      <StorefrontHero />

      {/* 2. CATEGORY SHORTCUTS (Minimalist horizontal ribbon) */}
      <StorefrontCategoryShortcuts />

      {/* 3. TOP DEALS (Open layout with live countdown & header divider) */}
      <StorefrontTopDeals />

      {/* 4. RECOMMENDED PRODUCTS (Open grid with minimal underline category filters) */}
      <section className="space-y-6 pt-4 border-t border-slate-200 select-none">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900">Recommended For You</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Handpicked selections based on buyer activity and multi-seller inventory availability
            </p>
          </div>

          {/* Clean Underline Category Tabs */}
          <div className="flex items-center gap-4 text-xs font-bold">
            {["All", "Electronics", "Beauty", "Automotive"].map((tab) => (
              <button
                key={tab}
                onClick={() => setRecommendedCategoryTab(tab)}
                className={`pb-1 transition select-none ${
                  recommendedCategoryTab === tab
                    ? "text-[#404d85] border-b-2 border-[#404d85]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredRecommended.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              title={p.title}
              image={p.image}
              price={p.price}
              originalPrice={p.originalPrice}
              sellerName={p.sellerName}
              sellerTier={p.sellerTier}
              badge={p.badge}
              rating={p.rating}
              reviewsCount={p.reviewsCount}
              onAddToCart={() => alert(`Added "${p.title}" to bag!`)}
            />
          ))}
        </div>
      </section>

      {/* 5. FEATURED STORES & SELLERS */}
      <StorefrontFeaturedStores />

      {/* 6. FEATURED BRANDS */}
      <StorefrontFeaturedBrands />

      {/* 7. PERSONALIZED AREA & RECENTLY VIEWED */}
      <StorefrontPersonalizedArea />

    </div>
  );
}
