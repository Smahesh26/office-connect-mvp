"use client";

import { useState } from "react";
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

  // 26 Comprehensive Realistic Marketplace Products
  const sampleProducts: DemoProduct[] = [
    // 1. STANDARD
    {
      id: "prod-1",
      title: "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones",
      brand: "Sony",
      category: "Electronics",
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
      deliveryEstimate: "FREE Delivery by Tomorrow, 11 AM",
      variant: "standard",
    },
    {
      id: "prod-2",
      title: "Keychron Q1 Pro Wireless Custom Mechanical Keyboard (QMK/VIA ANSI)",
      brand: "Keychron",
      category: "Computing",
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

    // 2. COMPACT
    {
      id: "prod-3",
      title: "Apple 20W USB-C Fast Power Adapter",
      brand: "Apple",
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80",
      price: 1900,
      originalPrice: 2200,
      sellerName: "Office Connect Direct",
      sellerTier: "premium",
      rating: 4.8,
      reviewsCount: 4890,
      stockQty: 150,
      badge: "GENUINE",
      deliveryEstimate: "Same-Day Dispatch",
      variant: "compact",
    },
    {
      id: "prod-4",
      title: "Logitech MX Master 3S Wireless Performance Mouse",
      brand: "Logitech",
      category: "Computing",
      image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80",
      price: 8995,
      originalPrice: 10995,
      sellerName: "Prime Tech Supplies",
      sellerTier: "verified",
      rating: 4.9,
      reviewsCount: 2310,
      stockQty: 42,
      deliveryEstimate: "FREE Delivery by Tomorrow",
      variant: "compact",
    },
    {
      id: "prod-5",
      title: "SanDisk Extreme 1TB Portable External NVMe SSD USB-C",
      brand: "SanDisk",
      category: "Computing",
      image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
      price: 11499,
      originalPrice: 14500,
      sellerName: "Silicon Distro Hub",
      sellerTier: "verified",
      rating: 4.7,
      reviewsCount: 920,
      stockQty: 18,
      deliveryEstimate: "FREE Delivery by Wednesday",
      variant: "compact",
    },

    // 3. HORIZONTAL
    {
      id: "prod-6",
      title: "Herman Miller Aeron Ergonomic Chair - Graphite Edition (Size B)",
      brand: "Herman Miller",
      category: "Workspace",
      image: "https://images.unsplash.com/photo-1580481077195-731da89f3799?auto=format&fit=crop&w=600&q=80",
      price: 142000,
      originalPrice: 165000,
      sellerName: "ErgoWork Solutions",
      sellerTier: "premium",
      rating: 5.0,
      reviewsCount: 215,
      stockQty: 4,
      deliveryEstimate: "Special Freight Delivery in 3 Days (White Glove)",
      variant: "horizontal",
    },
    {
      id: "prod-7",
      title: "Dell UltraSharp 32-inch 4K UHD Thunderbolt Hub USB-C Monitor (U3223QE)",
      brand: "Dell",
      category: "Computing",
      image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
      price: 78900,
      originalPrice: 89900,
      sellerName: "Office Connect Direct",
      sellerTier: "premium",
      rating: 4.8,
      reviewsCount: 310,
      stockQty: 12,
      deliveryEstimate: "FREE Delivery by Tomorrow",
      variant: "horizontal",
    },

    // 4. SEARCH RESULT
    {
      id: "prod-8",
      title: "Kubernetes NVMe Cloud Server Cluster (16 vCPU, 64GB RAM, 1TB NVMe, 10Gbps)",
      brand: "Acme Cloud",
      category: "Cloud",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
      price: 62000,
      originalPrice: 75000,
      sellerName: "Acme Cloud Corp",
      sellerTier: "premium",
      rating: 4.9,
      reviewsCount: 94,
      stockQty: 15,
      deliveryEstimate: "Instant Automated Provisioning (under 3 mins)",
      specifications: ["16 Dedicated vCPUs", "64GB DDR5 ECC RAM", "1TB Enterprise PCIe 4.0", "99.99% SLA Uptime Guarantee", "BGP Anycast Routing"],
      otherSellersCount: 3,
      variant: "search_result",
    },
    {
      id: "prod-9",
      title: "Motul 300V Factory Line 15W-50 100% Synthetic 4T Ester Core Engine Oil (4 Liters)",
      brand: "Motul",
      category: "Automotive",
      image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
      price: 4850,
      originalPrice: 5600,
      sellerName: "AutoCare Spares",
      sellerTier: "verified",
      rating: 4.9,
      reviewsCount: 420,
      stockQty: 30,
      deliveryEstimate: "FREE Delivery by Tomorrow",
      specifications: ["Ester Core Technology", "JASO MA2 Certified", "High Thermal Stability", "Anti-Wear Protection"],
      otherSellersCount: 4,
      variant: "search_result",
    },

    // 5. WISHLIST
    {
      id: "prod-10",
      title: "Glow Beauty Damask Rose Organic Botanical Hydrating Facial Serum (50ml)",
      brand: "Glow Beauty",
      category: "Beauty",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
      price: 2499,
      originalPrice: 3200,
      sellerName: "Glow Beauty Organics",
      sellerTier: "premium",
      rating: 5.0,
      reviewsCount: 310,
      stockQty: 18,
      deliveryEstimate: "FREE Delivery by Tomorrow",
      priceDropAmount: 400,
      variant: "wishlist",
    },
    {
      id: "prod-11",
      title: "Garmin Fenix 7 Pro Solar Sapphire Multi-Sport GPS Smartwatch",
      brand: "Garmin",
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
      price: 84990,
      originalPrice: 94990,
      sellerName: "Office Connect Direct",
      sellerTier: "premium",
      rating: 4.9,
      reviewsCount: 164,
      stockQty: 6,
      deliveryEstimate: "FREE Express Delivery",
      priceDropAmount: 5000,
      variant: "wishlist",
    },

    // 6. RECOMMENDED
    {
      id: "prod-12",
      title: "Anker Prime 27,650mAh Power Bank (250W Multi-Port Fast Charger)",
      brand: "Anker",
      category: "Electronics",
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
      id: "prod-13",
      title: "Organic Damask Rose Lip Elixir Peptide Balm (15ml)",
      brand: "Glow Beauty",
      category: "Beauty",
      image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80",
      price: 1200,
      originalPrice: 1500,
      sellerName: "Glow Beauty Organics",
      sellerTier: "premium",
      rating: 4.9,
      reviewsCount: 140,
      stockQty: 35,
      deliveryEstimate: "FREE Delivery in 2 Days",
      matchScore: 95,
      variant: "recommended",
    },

    // 7. SPONSORED
    {
      id: "prod-14",
      title: "Brembo Ceramic Front Brake Pad Set for German Sedans & SUVs",
      brand: "Brembo",
      category: "Automotive",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
      price: 6800,
      originalPrice: 7900,
      sellerName: "AutoCare Spares",
      sellerTier: "verified",
      rating: 4.8,
      reviewsCount: 88,
      stockQty: 14,
      deliveryEstimate: "FREE Delivery in 2 Days",
      variant: "sponsored",
    },
    {
      id: "prod-15",
      title: "Sennheiser Profile USB-C Condenser Studio Microphone with Boom Arm",
      brand: "Sennheiser",
      category: "Electronics",
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

    // 8. OUT OF STOCK
    {
      id: "prod-16",
      title: "NVIDIA GeForce RTX 4090 24GB GDDR6X Founders Edition",
      brand: "NVIDIA",
      category: "Computing",
      image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80",
      price: 175000,
      originalPrice: 195000,
      sellerName: "Office Connect Direct",
      sellerTier: "premium",
      rating: 5.0,
      reviewsCount: 890,
      stockQty: 0,
      deliveryEstimate: "Currently Unavailable",
      variant: "out_of_stock",
    },
    {
      id: "prod-17",
      title: "Dyson Solarcycle Morph Desk Light with Intelligent Sun-Tracking",
      brand: "Dyson",
      category: "Workspace",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80",
      price: 41900,
      originalPrice: 46900,
      sellerName: "Modern Living India",
      sellerTier: "verified",
      rating: 4.7,
      reviewsCount: 110,
      stockQty: 0,
      deliveryEstimate: "Currently Unavailable",
      variant: "out_of_stock",
    },

    // 9. DISCOUNTED / FLASH DEAL
    {
      id: "prod-18",
      title: "Castrol EDGE 5W-40 Advanced Full Synthetic Engine Oil (5 Liters)",
      brand: "Castrol",
      category: "Automotive",
      image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
      price: 3200,
      originalPrice: 4200,
      sellerName: "AutoCare Spares",
      sellerTier: "verified",
      rating: 4.8,
      reviewsCount: 88,
      stockQty: 3,
      badge: "⚡ 24% OFF",
      deliveryEstimate: "FREE Delivery by Tomorrow",
      variant: "discounted",
    },
    {
      id: "prod-19",
      title: "French Botanical Anti-Aging Rose Elixir Night Concentrate (30ml)",
      brand: "Glow Beauty",
      category: "Beauty",
      image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80",
      price: 1999,
      originalPrice: 2800,
      sellerName: "Glow Beauty Organics",
      sellerTier: "premium",
      rating: 4.9,
      reviewsCount: 220,
      stockQty: 2,
      badge: "⚡ 28% OFF",
      deliveryEstimate: "FREE Delivery by Wednesday",
      variant: "discounted",
    },

    // 10. MULTI-SELLER
    {
      id: "prod-20",
      title: "Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)",
      brand: "Apple",
      category: "Electronics",
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
      id: "prod-21",
      title: "Sony PlayStation 5 DualSense Wireless Controller - Midnight Black",
      brand: "Sony",
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1606318801954-d46846092b2a?auto=format&fit=crop&w=600&q=80",
      price: 5490,
      originalPrice: 6390,
      sellerName: "Console Hub Retailers",
      sellerTier: "verified",
      rating: 4.8,
      reviewsCount: 3410,
      stockQty: 28,
      deliveryEstimate: "FREE Delivery in 2 Days",
      otherSellersCount: 4,
      variant: "multi_seller",
    },
    {
      id: "prod-22",
      title: "Ergonomic Aluminium Height-Adjustable Laptop Stand with Heat Dissipation",
      brand: "Office Connect",
      category: "Workspace",
      image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80",
      price: 1899,
      originalPrice: 2499,
      sellerName: "Office Connect Direct",
      sellerTier: "premium",
      rating: 4.8,
      reviewsCount: 940,
      stockQty: 80,
      deliveryEstimate: "FREE Delivery by Tomorrow",
      otherSellersCount: 5,
      variant: "multi_seller",
    },
  ];

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
          <div className="p-12 text-center border border-dashed border-slate-300 rounded-[8px] space-y-2">
            <p className="text-sm font-bold text-slate-700">No products match the selected variant & category filter.</p>
            <button
              onClick={() => { setSelectedVariantFilter("all"); setSelectedCategoryFilter("all"); }}
              className="text-xs font-bold text-[#404d85] underline"
            >
              Reset Filters
            </button>
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
