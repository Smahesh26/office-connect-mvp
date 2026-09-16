"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MarketplacePageWrapper } from "@/components/storefront/MarketplacePageWrapper";
import { TypoCorrectionBanner } from "@/components/search/TypoCorrectionBanner";
import { SearchEmptyState } from "@/components/search/SearchEmptyState";
import { ProductCard } from "@/components/commerce/CommercePrimitives";

interface SearchProductItem {
  id: string;
  title: string;
  brand: string;
  category: string;
  rating: number;
  reviewsCount: number;
  price: number;
  originalPrice: number;
  deliveryEstimate: string;
  sellerName: string;
  sellerTier: "premium" | "verified" | "new";
  inStock: boolean;
  stockQty: number;
  image: string;
  fullDescription: string;
}

const masterSearchDatabase: SearchProductItem[] = [];

// Typo mapping
const typoCorrections: Record<string, string> = {};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawQuery = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "All Categories";
  const exact = searchParams.get("exact") === "true";

  const [productsList, setProductsList] = useState<SearchProductItem[]>(masterSearchDatabase);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("officeconnect_custom_products");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProductsList(
            parsed.map((item: any) => ({
              id: item.id || `prod-${Date.now()}`,
              title: item.title,
              brand: item.brand || "Store Brand",
              category: item.category || "General",
              rating: item.rating || 5.0,
              reviewsCount: item.reviewsCount || 0,
              price: Number(item.price),
              originalPrice: Number(item.mrp || item.originalPrice || item.price * 1.2),
              deliveryEstimate: "FREE Delivery in 2 Days",
              sellerName: item.sellerName || "Registered Merchant",
              sellerTier: "verified" as const,
              inStock: true,
              stockQty: Number(item.stock !== undefined ? item.stock : 10),
              image: item.image || "",
              fullDescription: item.description || item.title,
            }))
          );
        }
      }
    } catch {}
  }, []);

  // Check typo
  const correctedQuery = useMemo(() => {
    if (exact) return "";
    const lower = rawQuery.toLowerCase().trim();
    return typoCorrections[lower] || "";
  }, [rawQuery, exact]);

  const activeSearchQuery = correctedQuery || rawQuery;

  // Filter States
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceBracket, setSelectedPriceBracket] = useState<string>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"relevance" | "price-asc" | "price-desc" | "rating">("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    const queryTerm = activeSearchQuery.toLowerCase().trim();

    return productsList
      .filter((p) => {
        // Query match
        if (queryTerm) {
          const matchTitle = p.title.toLowerCase().includes(queryTerm);
          const matchBrand = p.brand.toLowerCase().includes(queryTerm);
          const matchCat = p.category.toLowerCase().includes(queryTerm);
          const matchDesc = p.fullDescription.toLowerCase().includes(queryTerm);
          if (!matchTitle && !matchBrand && !matchCat && !matchDesc) return false;
        }

        // Category filter
        if (categoryParam !== "All Categories" && p.category.toLowerCase() !== categoryParam.toLowerCase()) {
          return false;
        }

        // Brand filter
        if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) {
          return false;
        }

        // Price filter
        if (selectedPriceBracket === "under-2k" && p.price >= 2000) return false;
        if (selectedPriceBracket === "2k-10k" && (p.price < 2000 || p.price > 10000)) return false;
        if (selectedPriceBracket === "10k-30k" && (p.price < 10000 || p.price > 30000)) return false;
        if (selectedPriceBracket === "above-30k" && p.price <= 30000) return false;

        // Rating filter
        if (minRating > 0 && p.rating < minRating) return false;

        // Stock filter
        if (inStockOnly && !p.inStock) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        return 0; // relevance
      });
  }, [activeSearchQuery, categoryParam, selectedBrands, selectedPriceBracket, minRating, inStockOnly, sortBy]);

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleResetFilters = () => {
    setSelectedBrands([]);
    setSelectedPriceBracket("all");
    setMinRating(0);
    setInStockOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-32 select-none">
      
      {/* Breadcrumb Bar */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/storefront" className="hover:text-slate-900">Storefront</Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">Search Results</span>
        {rawQuery && (
          <>
            <span>/</span>
            <span className="text-[#404d85] font-black">&ldquo;{rawQuery}&rdquo;</span>
          </>
        )}
      </nav>

      {/* Typo Correction Alert */}
      {correctedQuery && (
        <TypoCorrectionBanner
          originalQuery={rawQuery}
          correctedQuery={correctedQuery}
          onAcceptCorrection={() => router.push(`/search?q=${encodeURIComponent(correctedQuery)}`)}
        />
      )}

      {/* Search Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {rawQuery ? (
              <>Results for <span className="text-[#404d85]">&ldquo;{activeSearchQuery}&rdquo;</span></>
            ) : (
              "All Marketplace Products"
            )}
          </h1>
          <p className="text-xs text-slate-500">
            Showing {filteredProducts.length} verified items with 100% Escrow Protection
          </p>
        </div>

        {/* Controls: Sort & View Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-[4px] px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#404d85]"
            >
              <option value="relevance">Featured & Relevant</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Customer Rating (Highest)</option>
            </select>
          </div>

          <div className="hidden sm:flex items-center border border-slate-300 rounded-[4px] overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1.5 text-xs font-bold transition ${
                viewMode === "grid" ? "bg-[#404d85] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-2.5 py-1.5 text-xs font-bold transition ${
                viewMode === "list" ? "bg-[#404d85] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Main Search Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Facet Filters Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              Filter Results
            </h3>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-[#404d85] hover:underline"
            >
              Reset All
            </button>
          </div>

          {/* 1. Brands */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-slate-800 block">Brand Flagship</span>
            <div className="space-y-1.5 text-xs text-slate-700">
              {["Sony", "Dell", "Keychron", "Minimalist", "Brembo"].map((brand) => (
                <label key={brand} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    className="rounded border-slate-300 text-[#404d85] focus:ring-[#404d85]"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Price Brackets */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-extrabold text-slate-800 block">Price Range (INR)</span>
            <div className="space-y-1.5 text-xs text-slate-700">
              {[
                { key: "all", label: "All Prices" },
                { key: "under-2k", label: "Under ₹2,000" },
                { key: "2k-10k", label: "₹2,000 – ₹10,000" },
                { key: "10k-30k", label: "₹10,000 – ₹30,000" },
                { key: "above-30k", label: "Above ₹30,000" },
              ].map((p) => (
                <label key={p.key} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  <input
                    type="radio"
                    name="priceBracket"
                    checked={selectedPriceBracket === p.key}
                    onChange={() => setSelectedPriceBracket(p.key)}
                    className="text-[#404d85] focus:ring-[#404d85]"
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Customer Rating */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-extrabold text-slate-800 block">Customer Rating</span>
            <div className="space-y-1.5 text-xs text-slate-700">
              {[
                { stars: 4.8, label: "4.8★ & above" },
                { stars: 4.5, label: "4.5★ & above" },
                { stars: 4.0, label: "4.0★ & above" },
                { stars: 0, label: "Any Rating" },
              ].map((r) => (
                <label key={r.label} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  <input
                    type="radio"
                    name="ratingFilter"
                    checked={minRating === r.stars}
                    onChange={() => setMinRating(r.stars)}
                    className="text-[#404d85] focus:ring-[#404d85]"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 4. Availability */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-extrabold text-slate-800 block">Availability</span>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-slate-300 text-[#404d85]"
              />
              <span>In Stock Only</span>
            </label>
          </div>

        </aside>

        {/* Right Search Results */}
        <main className="lg:col-span-9 space-y-6">
          {filteredProducts.length === 0 ? (
            <SearchEmptyState
              query={activeSearchQuery}
              onSuggestionClick={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
            />
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                  : "space-y-4"
              }
            >
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  brand={p.brand}
                  price={p.price}
                  originalPrice={p.originalPrice}
                  rating={p.rating}
                  reviewsCount={p.reviewsCount}
                  deliveryEstimate={p.deliveryEstimate}
                  sellerName={p.sellerName}
                  sellerTier={p.sellerTier}
                  stockQty={p.stockQty}
                  image={p.image}
                  variant={viewMode === "list" ? "horizontal" : "standard"}
                  onAddToCart={() => alert(`Added ${p.title} to Cart!`)}
                />
              ))}
            </div>
          )}
        </main>

      </div>

    </div>
  );
}

export default function SearchPage() {
  return (
    <MarketplacePageWrapper>
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Search Results...</div>}>
        <SearchContent />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
