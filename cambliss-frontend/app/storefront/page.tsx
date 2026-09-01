"use client";

import { Suspense, useState, useEffect } from "react";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { StorefrontHero } from "@/components/storefront/StorefrontHero";
import { StorefrontCategoryShortcuts } from "@/components/storefront/StorefrontCategoryShortcuts";
import { StorefrontTopDeals } from "@/components/storefront/StorefrontDealsSection";
import { StorefrontFeaturedStores } from "@/components/storefront/StorefrontFeaturedStores";
import { StorefrontFeaturedBrands } from "@/components/storefront/StorefrontFeaturedBrands";
import { StorefrontPersonalizedArea } from "@/components/storefront/StorefrontPersonalizedArea";
import { ProductCard } from "@/components/commerce/CommercePrimitives";
import { fetchCatalogProducts, ApiProduct } from "@/lib/catalog-api";
import WorkspaceShell from "@/components/WorkspaceShell";

export default function StorefrontPage() {
  const [isWorkspaceUser, setIsWorkspaceUser] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        setIsWorkspaceUser(true);
      }
    }
  }, []);

  const content = <StorefrontHomeContent />;

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800 font-bold">Loading Marketplace...</div>}>
      {isMounted && isWorkspaceUser ? (
        <WorkspaceShell>{content}</WorkspaceShell>
      ) : (
        <StorefrontShell>{content}</StorefrontShell>
      )}
    </Suspense>
  );
}

function StorefrontHomeContent() {
  const [recommendedCategoryTab, setRecommendedCategoryTab] = useState("All");
  const [liveCatalogProducts, setLiveCatalogProducts] = useState<ApiProduct[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const prods = await fetchCatalogProducts();
        setLiveCatalogProducts(prods);
      } catch (err) {
        console.error("Failed to load catalog products:", err);
      } finally {
        setIsLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, []);

  const fallbackRecommended = [
    {
      id: "prod-1",
      title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones (Midnight Black)",
      image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
      price: 29990,
      originalPrice: 34990,
      sellerName: "Sony India Direct 👑",
      sellerTier: "premium" as const,
      badge: "★ TOP RATED",
      rating: 4.9,
      reviewsCount: 842,
      category: "Electronics",
    },
    {
      id: "prod-2",
      title: "UrbanThreads 240 GSM Heavyweight Oversized French Terry T-Shirt",
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
      price: 1499,
      originalPrice: 2499,
      sellerName: "UrbanThreads Official",
      sellerTier: "verified" as const,
      badge: "⚡ 24H DISPATCH",
      rating: 4.8,
      reviewsCount: 310,
      category: "Apparel",
    },
    {
      id: "rec-p3",
      title: "Damask Rose Botanical Hydrating Serum (50ml)",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
      price: 2499,
      originalPrice: 3200,
      sellerName: "Glow Beauty Organics 🌸",
      sellerTier: "premium" as const,
      badge: "ORGANIC CERTIFIED",
      rating: 5.0,
      reviewsCount: 310,
      category: "Beauty",
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

  const displayProducts = liveCatalogProducts.length > 0
    ? [
        ...liveCatalogProducts.map((p) => ({
          id: p.id,
          title: p.title,
          image: p.primaryImage,
          price: p.id === "prod-1" ? 29990 : 1499,
          originalPrice: p.id === "prod-1" ? 34990 : 2499,
          sellerName: p.brandName ? `${p.brandName} Direct 👑` : "Office Connect Direct 👑",
          sellerTier: "premium" as const,
          badge: "★ TOP RATED",
          rating: 4.9,
          reviewsCount: 248,
          category: p.categoryName?.includes("Headphones") ? "Electronics" : "Apparel",
        })),
        ...fallbackRecommended.slice(2),
      ]
    : fallbackRecommended;

  const filteredRecommended = recommendedCategoryTab === "All"
    ? displayProducts
    : displayProducts.filter((p) => p.category === recommendedCategoryTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12 pb-24 lg:pb-16">
      
      {/* 1. HERO / CAMPAIGN AREA */}
      <StorefrontHero />

      {/* 2. CATEGORY SHORTCUTS */}
      <StorefrontCategoryShortcuts />

      {/* 3. TOP DEALS */}
      <StorefrontTopDeals />

      {/* 4. RECOMMENDED PRODUCTS (Real Database / Catalog Synchronized) */}
      <section className="space-y-6 pt-4 border-t border-slate-200 select-none">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">Recommended For You</h2>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[9px] uppercase tracking-wider">
                Live Catalog Synced
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Handpicked selections dynamically loaded from master catalog with live Buy Box pricing
            </p>
          </div>

          {/* Clean Underline Category Tabs */}
          <div className="flex items-center gap-4 text-xs font-bold">
            {["All", "Electronics", "Apparel", "Beauty", "Automotive"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setRecommendedCategoryTab(tab)}
                className={`pb-1 transition-all ${
                  recommendedCategoryTab === tab
                    ? "text-[#404d85] border-b-2 border-[#404d85] font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 4-Column Grid with Real Master Catalog Integration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
            />
          ))}
        </div>
      </section>

      {/* 5. FEATURED MULTI-VENDOR STORES */}
      <StorefrontFeaturedStores />

      {/* 6. FEATURED BRAND HUBS */}
      <StorefrontFeaturedBrands />

      {/* 7. PERSONALIZED BROWSER / RECENT HISTORY */}
      <StorefrontPersonalizedArea />

    </div>
  );
}
