"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
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

const masterSearchDatabase: SearchProductItem[] = [
  {
    id: "prod-1",
    title: "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones",
    brand: "Sony",
    category: "Electronics",
    rating: 4.9,
    reviewsCount: 1420,
    price: 29990,
    originalPrice: 34990,
    deliveryEstimate: "Tomorrow, by 1 PM (Express Air)",
    sellerName: "Sony India Direct",
    sellerTier: "premium",
    inStock: true,
    stockQty: 24,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    fullDescription: "Premium wireless noise canceling headphones with Auto NC Optimizer, 30-hour battery life, and crystal-clear hands-free calling.",
  },
  {
    id: "prod-2",
    title: "Sony WF-1000XM5 Truly Wireless Noise Canceling Earbuds",
    brand: "Sony",
    category: "Electronics",
    rating: 4.8,
    reviewsCount: 930,
    price: 23990,
    originalPrice: 26990,
    deliveryEstimate: "Tomorrow, by 5 PM",
    sellerName: "Sony India Direct",
    sellerTier: "premium",
    inStock: true,
    stockQty: 18,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
    fullDescription: "The best noise canceling truly wireless earbuds with dynamic driver X, dual processors, and bone conduction sensors.",
  },
  {
    id: "prod-3",
    title: "Dell UltraSharp 32-inch 4K UHD Thunderbolt Hub USB-C Monitor (U3224KB)",
    brand: "Dell",
    category: "Computing",
    rating: 4.7,
    reviewsCount: 412,
    price: 78900,
    originalPrice: 89900,
    deliveryEstimate: "In 2 Days via Bluedart Heavy",
    sellerName: "Office Connect Direct",
    sellerTier: "premium",
    inStock: true,
    stockQty: 5,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
    fullDescription: "Professional 6K UHD IPS Black monitor with built-in 4K HDR webcam, 140W power delivery, and Thunderbolt 4 connectivity.",
  },
  {
    id: "prod-4",
    title: "Keychron Q1 Pro Custom Wireless Mechanical Keyboard QMK/VIA",
    brand: "Keychron",
    category: "Computing",
    rating: 4.9,
    reviewsCount: 680,
    price: 18499,
    originalPrice: 21999,
    deliveryEstimate: "Tomorrow, by 11 AM",
    sellerName: "Keychron Official India",
    sellerTier: "premium",
    inStock: true,
    stockQty: 12,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    fullDescription: "Full aluminum CNC body, wireless Bluetooth 5.1 and wired USB-C, hot-swappable switches with South-facing RGB backlighting.",
  },
  {
    id: "prod-5",
    title: "Minimalist 100% Organic Hyaluronic Acid & Vitamin C Serum",
    brand: "Minimalist",
    category: "Beauty",
    rating: 4.6,
    reviewsCount: 2840,
    price: 699,
    originalPrice: 899,
    deliveryEstimate: "Tomorrow, by 2 PM",
    sellerName: "Glow Beauty Organics",
    sellerTier: "verified",
    inStock: true,
    stockQty: 50,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
    fullDescription: "Brightening antioxidant facial serum with 10% ethyl ascorbic acid and centella water for glowing radiant skin tone.",
  },
  {
    id: "prod-6",
    title: "Brembo High Performance Carbon Ceramic Brake Disc Spares",
    brand: "Brembo",
    category: "Automotive",
    rating: 4.9,
    reviewsCount: 195,
    price: 14500,
    originalPrice: 16900,
    deliveryEstimate: "In 2 Days via Surface Freight",
    sellerName: "AutoCare Spares Direct",
    sellerTier: "verified",
    inStock: true,
    stockQty: 8,
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80",
    fullDescription: "High-friction carbon ceramic ventilated disc brakes designed for maximum stopping power and zero thermal fade under high load.",
  },
];

// Typo mapping
const typoCorrections: Record<string, string> = {
  soni: "Sony",
  "sony headfone": "Sony WH-1000XM5 headphones",
  "sony headfones": "Sony WH-1000XM5 headphones",
  keychorn: "Keychron",
  "keychron keybord": "Keychron mechanical keyboard",
  del: "Dell",
  "del monitor": "Dell 4K Monitor",
  "brak pad": "Brembo Brake Spares",
  "brembo brake": "Brembo High Performance Brake Discs",
  minimilist: "Minimalist",
  "vit c serum": "Vitamin C Serum",
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawQuery = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "All Categories";
  const exact = searchParams.get("exact") === "true";

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

    return masterSearchDatabase
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
    <StorefrontShell>
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading Search Results...</div>}>
        <SearchContent />
      </Suspense>
    </StorefrontShell>
  );
}
