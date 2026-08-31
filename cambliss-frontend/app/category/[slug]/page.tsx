"use client";

import { useState, useMemo, use } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import {
  ProductListingFilters,
  FilterState,
  AvailableFacetOptions,
} from "@/components/commerce/ProductListingFilters";
import { MobileFilterDrawer } from "@/components/commerce/MobileFilterDrawer";
import { ProductCard, ProductCardProps } from "@/components/commerce/CommercePrimitives";

interface CategoryMeta {
  title: string;
  slug: string;
  parent: string;
  description: string;
  subcategories: { name: string; slug: string; count: number }[];
}

const categoryMetadataMap: Record<string, CategoryMeta> = {
  electronics: {
    title: "Electronics, Audio & Wearables",
    slug: "electronics",
    parent: "Storefront",
    description: "Industry-leading noise canceling headphones, studio microphones, smartwatches, and high-fidelity consumer audio gear.",
    subcategories: [
      { name: "Wireless Headphones", slug: "headphones", count: 420 },
      { name: "Smartwatches & Fitness", slug: "wearables", count: 310 },
      { name: "Studio Microphones", slug: "microphones", count: 180 },
      { name: "Power & Fast Charging", slug: "charging", count: 510 },
    ],
  },
  computing: {
    title: "Enterprise Computing & Cloud Hardware",
    slug: "computing",
    parent: "Storefront",
    description: "Enterprise workstations, PCIe 4.0 NVMe SSD storage, custom mechanical keyboards, 4K Thunderbolt displays, and GPU hardware.",
    subcategories: [
      { name: "Custom Mechanical Keyboards", slug: "keyboards", count: 280 },
      { name: "4K Thunderbolt Monitors", slug: "monitors", count: 190 },
      { name: "NVMe SSD & High-Speed Storage", slug: "storage", count: 340 },
      { name: "High-Performance Workstations", slug: "workstations", count: 170 },
    ],
  },
  beauty: {
    title: "Luxury Skincare & French Botanicals",
    slug: "beauty",
    parent: "Storefront",
    description: "Direct from Grasse, France. Cold-pressed Damask Rose organic elixirs, peptide balms, anti-aging serums, and botanical cosmetics.",
    subcategories: [
      { name: "Botanical Serums & Elixirs", slug: "serums", count: 310 },
      { name: "Organic Lip Peptide Balms", slug: "lip-care", count: 140 },
      { name: "Anti-Aging Night Concentrates", slug: "anti-aging", count: 220 },
      { name: "Certified Facial Cleansers", slug: "cleansers", count: 220 },
    ],
  },
  automotive: {
    title: "Automotive Motorsport & OEM Spares",
    slug: "automotive",
    parent: "Storefront",
    description: "High-performance synthetic motor oils, ceramic brake systems, workshop diagnostic tools, and OEM replacement spares.",
    subcategories: [
      { name: "Full Synthetic Motor Oils", slug: "motor-oils", count: 240 },
      { name: "Ceramic Brake Pad Sets", slug: "brakes", count: 180 },
      { name: "Workshop Diagnostic Tools", slug: "tools", count: 110 },
      { name: "Performance Filters & Plugs", slug: "filters", count: 90 },
    ],
  },
  cloud: {
    title: "Enterprise Cloud Servers & SaaS Infrastructure",
    slug: "cloud",
    parent: "Storefront",
    description: "Dedicated NVMe Kubernetes clusters, private VPS cloud hosting, automated SSL, and 99.99% uptime enterprise SLA infrastructure.",
    subcategories: [
      { name: "Kubernetes NVMe Clusters", slug: "k8s-nodes", count: 80 },
      { name: "High-Memory Dedicated VPS", slug: "vps", count: 120 },
      { name: "BGP Anycast Enterprise Storage", slug: "cloud-storage", count: 140 },
    ],
  },
  workspace: {
    title: "Ergonomic Office & Executive Workspace",
    slug: "workspace",
    parent: "Storefront",
    description: "Herman Miller ergonomic seating, motorised standing desks, intelligent sun-tracking lamps, and aluminium desk accessories.",
    subcategories: [
      { name: "Ergonomic Executive Chairs", slug: "chairs", count: 120 },
      { name: "Motorised Standing Desks", slug: "desks", count: 80 },
      { name: "Intelligent Desk Lighting", slug: "lighting", count: 90 },
      { name: "Aluminium Workspace Stands", slug: "stands", count: 150 },
    ],
  },
};

export default function CategoryListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const meta = categoryMetadataMap[slug.toLowerCase()] || {
    title: slug.toUpperCase() + " Catalog",
    slug: slug,
    parent: "Storefront",
    description: "Browse verified multi-vendor products with direct brand warranty and 100% escrow payment protection.",
    subcategories: [],
  };

  const initialFilters: FilterState = {
    brands: [],
    minPrice: 0,
    maxPrice: 200000,
    minRating: 0,
    inStockOnly: false,
    minDiscount: 0,
    categoryAttributes: {},
  };

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Realistic Catalog Data for this category
  const allCatalogProducts: ProductCardProps[] = [
    {
      id: "cat-p1",
      title: "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones",
      brand: "Sony",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
      secondaryImage: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=600&q=80",
      price: 29990,
      originalPrice: 34990,
      sellerName: "Office Connect Direct",
      sellerTier: "premium",
      rating: 4.9,
      reviewsCount: 1420,
      stockQty: 24,
      badge: "BESTSELLER",
      deliveryEstimate: "FREE Delivery by Tomorrow",
      variant: "standard",
    },
    {
      id: "cat-p2",
      title: "Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)",
      brand: "Apple",
      image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80",
      price: 21990,
      originalPrice: 24900,
      sellerName: "Office Connect Direct",
      sellerTier: "premium",
      rating: 4.9,
      reviewsCount: 5410,
      stockQty: 45,
      deliveryEstimate: "FREE Delivery by Tomorrow",
      otherSellersCount: 6,
      variant: "multi_seller",
    },
    {
      id: "cat-p3",
      title: "Keychron Q1 Pro Wireless Custom Mechanical Keyboard (QMK/VIA ANSI)",
      brand: "Keychron",
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
      price: 16999,
      originalPrice: 19999,
      sellerName: "Mechanical Keyboards India",
      sellerTier: "verified",
      rating: 4.8,
      reviewsCount: 380,
      stockQty: 8,
      badge: "HOT ITEM",
      deliveryEstimate: "Express Delivery in 2 Days",
      variant: "standard",
    },
    {
      id: "cat-p4",
      title: "Glow Beauty Damask Rose Organic Botanical Hydrating Facial Serum (50ml)",
      brand: "Glow Beauty",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
      price: 2499,
      originalPrice: 3200,
      sellerName: "Glow Beauty Organics",
      sellerTier: "premium",
      rating: 5.0,
      reviewsCount: 310,
      stockQty: 18,
      deliveryEstimate: "FREE Delivery by Tomorrow",
      badge: "🔥 22% OFF",
      variant: "discounted",
    },
    {
      id: "cat-p5",
      title: "Dell UltraSharp 32-inch 4K UHD Thunderbolt Hub USB-C Monitor (U3223QE)",
      brand: "Dell",
      image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
      price: 78900,
      originalPrice: 89900,
      sellerName: "Office Connect Direct",
      sellerTier: "premium",
      rating: 4.8,
      reviewsCount: 310,
      stockQty: 12,
      deliveryEstimate: "FREE Delivery by Tomorrow",
      variant: "standard",
    },
    {
      id: "cat-p6",
      title: "Motul 300V Factory Line 15W-50 100% Synthetic 4T Ester Core Engine Oil (4 Liters)",
      brand: "Motul",
      image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
      price: 4850,
      originalPrice: 5600,
      sellerName: "AutoCare Spares",
      sellerTier: "verified",
      rating: 4.9,
      reviewsCount: 420,
      stockQty: 30,
      deliveryEstimate: "FREE Delivery by Tomorrow",
      variant: "standard",
    },
    {
      id: "cat-p7",
      title: "Anker Prime 27,650mAh Power Bank (250W Multi-Port Fast Charger)",
      brand: "Anker",
      image: "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?auto=format&fit=crop&w=600&q=80",
      price: 14999,
      originalPrice: 17999,
      sellerName: "Anker Official India",
      sellerTier: "premium",
      rating: 4.9,
      reviewsCount: 680,
      stockQty: 22,
      deliveryEstimate: "FREE Delivery by Tomorrow",
      matchScore: 98,
      variant: "recommended",
    },
    {
      id: "cat-p8",
      title: "Herman Miller Aeron Ergonomic Chair - Graphite Edition (Size B)",
      brand: "Herman Miller",
      image: "https://images.unsplash.com/photo-1580481077195-731da89f3799?auto=format&fit=crop&w=600&q=80",
      price: 142000,
      originalPrice: 165000,
      sellerName: "ErgoWork Solutions",
      sellerTier: "premium",
      rating: 5.0,
      reviewsCount: 215,
      stockQty: 4,
      deliveryEstimate: "Special Freight Delivery in 3 Days",
      variant: "standard",
    },
    {
      id: "cat-p9",
      title: "Sennheiser Profile USB-C Condenser Studio Microphone with Boom Arm",
      brand: "Sennheiser",
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
      price: 18900,
      originalPrice: 21900,
      sellerName: "Pro Audio Direct",
      sellerTier: "verified",
      rating: 4.9,
      reviewsCount: 290,
      stockQty: 11,
      deliveryEstimate: "FREE Delivery by Tomorrow",
      variant: "sponsored",
    },
    {
      id: "cat-p10",
      title: "Brembo Ceramic Front Brake Pad Set for German Sedans & SUVs",
      brand: "Brembo",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
      price: 6800,
      originalPrice: 7900,
      sellerName: "AutoCare Spares",
      sellerTier: "verified",
      rating: 4.8,
      reviewsCount: 88,
      stockQty: 14,
      deliveryEstimate: "FREE Delivery in 2 Days",
      variant: "standard",
    },
  ];

  // Facet Options
  const facets: AvailableFacetOptions = {
    brands: [
      { name: "Sony", count: 14 },
      { name: "Apple", count: 12 },
      { name: "Keychron", count: 8 },
      { name: "Dell", count: 9 },
      { name: "Glow Beauty", count: 6 },
      { name: "Motul", count: 7 },
      { name: "Anker", count: 11 },
      { name: "Herman Miller", count: 4 },
      { name: "Sennheiser", count: 5 },
      { name: "Brembo", count: 3 },
    ],
    priceRange: { min: 0, max: 200000 },
    ratingCounts: [
      { rating: 4, count: 42 },
      { rating: 3, count: 58 },
      { rating: 2, count: 65 },
    ],
    discountBrackets: [
      { label: "10% or more", min: 10, count: 32 },
      { label: "20% or more", min: 20, count: 18 },
      { label: "30% or more", min: 30, count: 9 },
    ],
    categoryAttributes: [
      {
        name: "Connectivity / Spec",
        key: "spec",
        options: [
          { label: "Bluetooth 5.3 & Wireless", count: 28 },
          { label: "USB-C Thunderbolt 4", count: 19 },
          { label: "QMK / VIA Programmable", count: 8 },
          { label: "Active Noise Cancellation", count: 14 },
        ],
      },
      {
        name: "Warranty Coverage",
        key: "warranty",
        options: [
          { label: "2 Years Official Manufacturer", count: 35 },
          { label: "1 Year Official Manufacturer", count: 22 },
          { label: "Lifetime Limited Frame", count: 4 },
        ],
      },
    ],
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return allCatalogProducts.filter((p) => {
      const numPrice = typeof p.price === "string" ? parseFloat(p.price) : p.price;
      const numOrig = p.originalPrice ? (typeof p.originalPrice === "string" ? parseFloat(p.originalPrice) : p.originalPrice) : undefined;
      const discount = numOrig && numOrig > numPrice ? Math.round(((numOrig - numPrice) / numOrig) * 100) : 0;

      // Brand Filter
      if (filters.brands.length > 0 && (!p.brand || !filters.brands.includes(p.brand))) {
        return false;
      }
      // Price Filter
      if (numPrice < filters.minPrice || numPrice > filters.maxPrice) {
        return false;
      }
      // Rating Filter
      if (filters.minRating > 0 && (p.rating || 0) < filters.minRating) {
        return false;
      }
      // In Stock Filter
      if (filters.inStockOnly && (p.stockQty || 0) <= 0) {
        return false;
      }
      // Discount Filter
      if (filters.minDiscount > 0 && discount < filters.minDiscount) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const priceA = typeof a.price === "string" ? parseFloat(a.price) : a.price;
      const priceB = typeof b.price === "string" ? parseFloat(b.price) : b.price;
      if (sortBy === "price_asc") return priceA - priceB;
      if (sortBy === "price_desc") return priceB - priceA;
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "reviews") return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      return 0; // featured default
    });
  }, [allCatalogProducts, filters, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeFiltersCount =
    filters.brands.length +
    (filters.minPrice > facets.priceRange.min || filters.maxPrice < facets.priceRange.max ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.minDiscount > 0 ? 1 : 0);

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 select-none">
        
        {/* 1. BREADCRUMB */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/storefront" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-slate-900 transition">Departments</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">{meta.title}</span>
        </nav>

        {/* 2. CATEGORY HEADER & DESCRIPTION */}
        <div className="space-y-3 pb-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {meta.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl mt-1 leading-relaxed">
                {meta.description}
              </p>
            </div>
            <div className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-[4px] shrink-0">
              {filteredProducts.length} Products Available
            </div>
          </div>

          {/* 3. SUBCATEGORIES STRIP */}
          {meta.subcategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 shrink-0">
                Subcategories:
              </span>
              {meta.subcategories.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/category/${slug}?sub=${sub.slug}`}
                  className="px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-[#404d85] hover:text-[#404d85] text-xs font-bold text-slate-700 whitespace-nowrap transition shadow-2xs"
                >
                  {sub.name} <span className="text-slate-400 text-[10px]">({sub.count})</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 4. MAIN LAYOUT: DESKTOP SIDEBAR FILTERS + PRODUCT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Desktop Left Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24 bg-white p-5 rounded-[8px] border border-slate-200 shadow-2xs">
            <ProductListingFilters
              filters={filters}
              facets={facets}
              onChange={setFilters}
              onReset={() => setFilters(initialFilters)}
            />
          </aside>

          {/* Right Product Grid Area */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* Sorting & Layout Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              
              {/* Mobile Filter Button Trigger */}
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="lg:hidden w-full sm:w-auto py-2 px-4 rounded-[6px] bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <span>⚙️ Filter & Refine</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-red-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-black">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <div className="text-xs font-bold text-slate-500 hidden sm:block">
                Showing <span className="text-slate-900">{Math.min(filteredProducts.length, itemsPerPage)}</span> of <span className="text-slate-900">{filteredProducts.length}</span> results
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-semibold shrink-0">Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort products"
                    className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white font-bold text-xs text-slate-900 focus:border-[#404d85] focus:outline-hidden"
                  >
                    <option value="featured">Featured / Best Match</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Customer Rating</option>
                    <option value="reviews">Most Reviewed</option>
                  </select>
                </div>

                {/* View Mode Toggle (Grid vs List) */}
                <div className="flex items-center border border-slate-200 rounded-[4px] overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid View"
                    className={`px-2.5 py-1 text-xs font-bold transition ${
                      viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    ▦ Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    aria-label="List View"
                    className={`px-2.5 py-1 text-xs font-bold transition ${
                      viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    ☰ List
                  </button>
                </div>
              </div>

            </div>

            {/* 5. PRODUCT LISTING GRID / LIST */}
            {filteredProducts.length === 0 ? (
              /* EMPTY STATE */
              <div className="p-12 text-center border border-dashed border-slate-300 rounded-[8px] bg-slate-50 space-y-3">
                <span className="text-3xl">🔍</span>
                <h3 className="text-base font-black text-slate-900">No products match your selected filters</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try adjusting your price range, clearing brand selections, or resetting filters to browse all verified products.
                </p>
                <button
                  type="button"
                  onClick={() => setFilters(initialFilters)}
                  className="px-5 py-2 rounded-[6px] bg-[#404d85] text-white font-bold text-xs hover:bg-[#323d6a] transition"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className={
                  viewMode === "list"
                    ? "space-y-4"
                    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                }>
                  {paginatedProducts.map((p) => (
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
                      variant={viewMode === "list" ? "horizontal" : p.variant || "standard"}
                      matchScore={p.matchScore}
                      otherSellersCount={p.otherSellersCount}
                      onAddToCart={() => alert(`Added "${p.title}" to bag!`)}
                    />
                  ))}
                </div>

                {/* 6. PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className="px-4 py-2 rounded-[4px] border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                    >
                      ← Previous Page
                    </button>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPage(idx + 1)}
                          className={`w-8 h-8 rounded-[4px] flex items-center justify-center text-xs font-bold transition ${
                            currentPage === idx + 1
                              ? "bg-[#404d85] text-white"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      className="px-4 py-2 rounded-[4px] border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                    >
                      Next Page →
                    </button>
                  </div>
                )}

              </div>
            )}

          </main>

        </div>

      </div>

      {/* 7. MOBILE FILTER DRAWER */}
      <MobileFilterDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        filters={filters}
        facets={facets}
        totalResultsCount={filteredProducts.length}
        onChange={setFilters}
        onReset={() => setFilters(initialFilters)}
      />
    </StorefrontShell>
  );
}
