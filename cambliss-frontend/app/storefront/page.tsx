"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { StorefrontHero } from "@/components/storefront/StorefrontHero";
import { StorefrontCategoryShortcuts } from "@/components/storefront/StorefrontCategoryShortcuts";
import { StorefrontTopDeals } from "@/components/storefront/StorefrontDealsSection";
import { StorefrontFeaturedStores } from "@/components/storefront/StorefrontFeaturedStores";
import { StorefrontFeaturedBrands } from "@/components/storefront/StorefrontFeaturedBrands";
import { StorefrontPersonalizedArea } from "@/components/storefront/StorefrontPersonalizedArea";
import { ProductCard, ProductCardProps } from "@/components/commerce/CommercePrimitives";
import { fetchCatalogProducts, ApiProduct } from "@/lib/catalog-api";
import WorkspaceShell from "@/components/WorkspaceShell";
import Link from "next/link";

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

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800 font-bold">Loading Marketplace...</div>}>
      {isMounted && isWorkspaceUser ? (
        <WorkspaceShell>
          <DashboardMarketplaceContent />
        </WorkspaceShell>
      ) : (
        <StorefrontShell>
          <StorefrontHomeContent />
        </StorefrontShell>
      )}
    </Suspense>
  );
}

// =========================================================================
// 1. DASHBOARD MARKETPLACE VIEW (WITH LEFT SIDEBAR FILTERS)
// =========================================================================
function DashboardMarketplaceContent() {
  const [liveCatalogProducts, setLiveCatalogProducts] = useState<ApiProduct[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("recommended");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  const masterProductsList: (ProductCardProps & { category: string; brand: string })[] = [
    {
      id: "prod-1",
      title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones (Midnight Black)",
      image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
      price: 29990,
      originalPrice: 34990,
      sellerName: "Sony India Direct 👑",
      sellerTier: "premium",
      badge: "★ TOP RATED",
      rating: 4.9,
      reviewsCount: 842,
      category: "Electronics",
      brand: "Sony",
      stockQty: 24,
    },
    {
      id: "prod-2",
      title: "UrbanThreads 240 GSM Heavyweight Oversized French Terry T-Shirt",
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
      price: 1499,
      originalPrice: 2499,
      sellerName: "UrbanThreads Official",
      sellerTier: "verified",
      badge: "⚡ 24H DISPATCH",
      rating: 4.8,
      reviewsCount: 310,
      category: "Apparel",
      brand: "UrbanThreads",
      stockQty: 45,
    },
    {
      id: "rec-p3",
      title: "Damask Rose Botanical Hydrating Serum (50ml)",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
      price: 2499,
      originalPrice: 3200,
      sellerName: "Glow Beauty Organics 🌸",
      sellerTier: "premium",
      badge: "ORGANIC CERTIFIED",
      rating: 5.0,
      reviewsCount: 310,
      category: "Beauty",
      brand: "Glow Beauty",
      stockQty: 18,
    },
    {
      id: "rec-p4",
      title: "5W-40 Fully Synthetic Engine Motor Oil (5 Liters)",
      image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
      price: 3200,
      originalPrice: 3800,
      sellerName: "AutoCare Motors 🚘",
      sellerTier: "verified",
      rating: 4.8,
      reviewsCount: 88,
      category: "Automotive",
      brand: "AutoCare",
      stockQty: 12,
    },
    {
      id: "prod-aerotech-earbuds",
      title: "AeroTech AirPulse Truly Wireless ANC Earbuds (30H Battery)",
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
      price: 12990,
      originalPrice: 15990,
      sellerName: "AeroTech Official Store",
      sellerTier: "premium",
      rating: 4.8,
      reviewsCount: 420,
      category: "Electronics",
      brand: "AeroTech",
      stockQty: 30,
    },
    {
      id: "prod-dell-monitor",
      title: "Dell UltraSharp 27-inch 4K USB-C Hub Ergonomic Monitor",
      image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
      price: 42990,
      originalPrice: 49990,
      sellerName: "Dell India Enterprise",
      sellerTier: "premium",
      badge: "4K UHD",
      rating: 4.9,
      reviewsCount: 195,
      category: "Computing",
      brand: "Dell",
      stockQty: 10,
    },
  ];

  // Dynamic Filtering Logic
  const filteredProducts = useMemo(() => {
    let result = masterProductsList.filter((p) => {
      // 1. Category Filter
      if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
      // 2. Brand Filter
      if (selectedBrand !== "All" && p.brand !== selectedBrand) return false;
      // 3. Rating Filter
      if (selectedRating > 0 && p.rating! < selectedRating) return false;
      // 4. In Stock Filter
      if (onlyInStock && (p.stockQty || 0) <= 0) return false;
      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) return false;
      }
      // 6. Price Range
      const numPrice = typeof p.price === "number" ? p.price : parseFloat(String(p.price)) || 0;
      if (selectedPriceRange === "under-2k" && numPrice >= 2000) return false;
      if (selectedPriceRange === "2k-10k" && (numPrice < 2000 || numPrice > 10000)) return false;
      if (selectedPriceRange === "10k-50k" && (numPrice < 10000 || numPrice > 50000)) return false;
      if (selectedPriceRange === "50k-plus" && numPrice < 50000) return false;

      return true;
    });

    // Sort Logic
    if (sortBy === "price-low") {
      result = [...result].sort((a, b) => {
        const valA = typeof a.price === "number" ? a.price : parseFloat(String(a.price)) || 0;
        const valB = typeof b.price === "number" ? b.price : parseFloat(String(b.price)) || 0;
        return valA - valB;
      });
    } else if (sortBy === "price-high") {
      result = [...result].sort((a, b) => {
        const valA = typeof a.price === "number" ? a.price : parseFloat(String(a.price)) || 0;
        const valB = typeof b.price === "number" ? b.price : parseFloat(String(b.price)) || 0;
        return valB - valA;
      });
    } else if (sortBy === "rating") {
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [selectedCategory, selectedPriceRange, selectedBrand, selectedRating, onlyInStock, sortBy, searchQuery]);

  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedPriceRange("all");
    setSelectedBrand("All");
    setSelectedRating(0);
    setOnlyInStock(false);
    setSortBy("recommended");
    setSearchQuery("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-32 select-none font-sans text-slate-900">
      
      {/* Top Header & Action Bar */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Multi-Vendor Marketplace</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>🌐</span> Multi-Vendor Marketplace Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse verified products, direct-from-brand deals, and multi-vendor supplier listings with live Buy Box pricing.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/vendor-dashboard"
            className="px-3.5 py-1.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-semibold text-xs transition shadow-2xs flex items-center gap-1.5"
          >
            <span>🏪</span> Sell on Marketplace →
          </Link>
        </div>
      </div>

      {/* Top Search & Filter Bar Controls */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-[6px] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search products, brands, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs font-medium bg-white focus:border-[#404d85] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-600">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-[4px] text-xs font-semibold bg-white"
            >
              <option value="recommended">Featured & Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
          >
            Reset Filters ↺
          </button>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: LEFT SIDEBAR FILTERS & RIGHT PRODUCTS GRID */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR FILTER PANEL */}
        {/* ========================================================================= */}
        <aside className="w-full lg:w-64 shrink-0 rounded-[8px] border border-slate-200 bg-white p-4 space-y-6 shadow-2xs text-xs">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡</span> Marketplace Filters
            </h3>
            <span className="text-[10px] font-semibold text-slate-500">
              {filteredProducts.length} Results
            </span>
          </div>

          {/* 1. CATEGORIES */}
          <div className="space-y-2">
            <h4 className="font-semibold text-[11px] text-slate-700 uppercase tracking-wider">Categories</h4>
            <div className="space-y-1">
              {["All", "Electronics", "Apparel", "Beauty", "Automotive", "Computing"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-[4px] transition text-xs font-medium flex items-center justify-between ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 2. PRICE RANGE */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h4 className="font-semibold text-[11px] text-slate-700 uppercase tracking-wider">Price Range</h4>
            <div className="space-y-1 font-medium text-slate-700">
              {[
                { id: "all", label: "All Prices" },
                { id: "under-2k", label: "Under ₹2,000" },
                { id: "2k-10k", label: "₹2,000 – ₹10,000" },
                { id: "10k-50k", label: "₹10,000 – ₹50,000" },
                { id: "50k-plus", label: "₹50,000+" },
              ].map((range) => (
                <label key={range.id} className="flex items-center gap-2 cursor-pointer py-1 px-1 hover:bg-slate-50 rounded">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={selectedPriceRange === range.id}
                    onChange={() => setSelectedPriceRange(range.id)}
                    className="accent-[#404d85]"
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. BRANDS */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h4 className="font-semibold text-[11px] text-slate-700 uppercase tracking-wider">Brand / Manufacturer</h4>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-[4px] text-xs font-medium bg-white"
            >
              <option value="All">All Verified Brands</option>
              <option value="Sony">Sony</option>
              <option value="UrbanThreads">UrbanThreads</option>
              <option value="Glow Beauty">Glow Beauty</option>
              <option value="AutoCare">AutoCare</option>
              <option value="AeroTech">AeroTech</option>
              <option value="Dell">Dell</option>
            </select>
          </div>

          {/* 4. RATING FILTER */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h4 className="font-semibold text-[11px] text-slate-700 uppercase tracking-wider">Minimum Rating</h4>
            <div className="space-y-1">
              {[0, 4.5, 4.0].map((ratingVal) => (
                <button
                  key={ratingVal}
                  type="button"
                  onClick={() => setSelectedRating(ratingVal)}
                  className={`w-full text-left px-2.5 py-1 rounded transition text-xs font-medium ${
                    selectedRating === ratingVal
                      ? "bg-amber-50 text-amber-900 font-semibold border border-amber-200"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {ratingVal === 0 ? "★ All Star Ratings" : `★ ${ratingVal} & Above`}
                </button>
              ))}
            </div>
          </div>

          {/* 5. IN STOCK TOGGLE */}
          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center justify-between cursor-pointer font-semibold text-slate-800">
              <span>In-Stock Only</span>
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 accent-[#404d85] rounded cursor-pointer"
              />
            </label>
          </div>

        </aside>

        {/* ========================================================================= */}
        {/* RIGHT PRODUCTS CATALOG GRID */}
        {/* ========================================================================= */}
        <main className="flex-1 min-w-0 w-full space-y-4">
          
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pb-1">
            <span>Showing {filteredProducts.length} Product(s)</span>
            {selectedCategory !== "All" && (
              <span className="bg-indigo-50 text-[#404d85] px-2 py-0.5 rounded font-semibold border border-indigo-100">
                Filtered by Category: {selectedCategory}
              </span>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-[8px] border border-slate-200 bg-white p-12 text-center space-y-3">
              <div className="text-4xl">🔍</div>
              <h3 className="font-bold text-slate-900 text-sm">No Products Match Your Selected Filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your category, price range, or brand filters to view available marketplace items.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded bg-[#404d85] text-white font-semibold text-xs hover:bg-[#323d6a]"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filteredProducts.map((p) => (
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
          )}

        </main>

      </div>
    </div>
  );
}

// =========================================================================
// 2. STANDALONE GUEST STOREFRONT HOMEPAGE
// =========================================================================
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12 pb-24 lg:pb-16 select-none font-sans">
      <StorefrontHero />
      <StorefrontCategoryShortcuts />
      <StorefrontTopDeals />

      <section className="space-y-6 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Recommended For You</h2>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[9px] uppercase tracking-wider">
                Live Catalog Synced
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Handpicked selections dynamically loaded from master catalog with live Buy Box pricing
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            {["All", "Electronics", "Apparel", "Beauty"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setRecommendedCategoryTab(tab)}
                className={`pb-1 transition-all ${
                  recommendedCategoryTab === tab
                    ? "text-[#404d85] border-b-2 border-[#404d85] font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

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

      <StorefrontFeaturedStores />
      <StorefrontFeaturedBrands />
      <StorefrontPersonalizedArea />
    </div>
  );
}
