"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatINR, SellerBadge } from "@/components/commerce/CommercePrimitives";

interface ProductSuggestion {
  id: string;
  title: string;
  category: string;
  brand: string;
  price: number;
  image: string;
  sellerName: string;
  sellerTier: "premium" | "verified" | "new";
}

const mockProductDatabase: ProductSuggestion[] = [
  {
    id: "prod-1",
    title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
    category: "Electronics",
    brand: "Sony",
    price: 29990,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80",
    sellerName: "Sony India Direct",
    sellerTier: "premium",
  },
  {
    id: "prod-2",
    title: "Sony WF-1000XM5 Truly Wireless Noise Canceling Earbuds",
    category: "Electronics",
    brand: "Sony",
    price: 23990,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=300&q=80",
    sellerName: "Sony India Direct",
    sellerTier: "premium",
  },
  {
    id: "prod-3",
    title: "Dell UltraSharp 32-inch 4K UHD Thunderbolt Hub USB-C Monitor",
    category: "Computing",
    brand: "Dell",
    price: 78900,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=300&q=80",
    sellerName: "Office Connect Direct",
    sellerTier: "premium",
  },
  {
    id: "prod-4",
    title: "Keychron Q1 Pro Custom Wireless Mechanical Keyboard QMK/VIA",
    category: "Computing",
    brand: "Keychron",
    price: 18499,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=80",
    sellerName: "Keychron Official India",
    sellerTier: "premium",
  },
  {
    id: "prod-5",
    title: "Minimalist 100% Organic Hyaluronic Acid & Vitamin C Serum",
    category: "Beauty",
    brand: "Minimalist",
    price: 699,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80",
    sellerName: "Glow Beauty Organics",
    sellerTier: "verified",
  },
  {
    id: "prod-6",
    title: "Brembo High Performance Carbon Ceramic Brake Disc Spares",
    category: "Automotive",
    brand: "Brembo",
    price: 14500,
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=300&q=80",
    sellerName: "AutoCare Spares Direct",
    sellerTier: "verified",
  },
];

const defaultRecentSearches = [
  "Sony WH-1000XM5",
  "Keychron mechanical keyboard",
  "Dell UltraSharp 4K",
  "Vitamin C Serum",
];

const trendingSearches = [
  "Sony XM5 Noise Canceling",
  "Wireless Mechanical Keyboards",
  "4K USB-C Monitor Hub",
  "Organic Skincare Serums",
  "Brembo Brake Discs",
  "Cloud Server Hosting",
];

export const SearchAutocompletePopover = ({
  isOpen,
  query,
  onSelectQuery,
  onClose,
}: {
  isOpen: boolean;
  query: string;
  onSelectQuery: (q: string) => void;
  onClose: () => void;
}) => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("oc_recent_searches");
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      } else {
        setRecentSearches(defaultRecentSearches);
      }
    } catch {
      setRecentSearches(defaultRecentSearches);
    }
  }, []);

  const handleRemoveRecent = (itemToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((item) => item !== itemToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem("oc_recent_searches", JSON.stringify(updated));
    } catch {}
  };

  const handleClearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem("oc_recent_searches");
    } catch {}
  };

  if (!isOpen) return null;

  const trimmedQuery = query.trim().toLowerCase();

  // Filter products by query
  const matchingProducts = trimmedQuery
    ? mockProductDatabase.filter(
        (p) =>
          p.title.toLowerCase().includes(trimmedQuery) ||
          p.brand.toLowerCase().includes(trimmedQuery) ||
          p.category.toLowerCase().includes(trimmedQuery)
      )
    : [];

  // Filter brands
  const matchedBrands = trimmedQuery
    ? ["Sony", "Keychron", "Dell", "Minimalist", "Brembo"].filter((b) =>
        b.toLowerCase().includes(trimmedQuery)
      )
    : [];

  // Filter categories
  const matchedCategories = trimmedQuery
    ? ["Electronics", "Computing", "Beauty", "Automotive", "Cloud"].filter((c) =>
        c.toLowerCase().includes(trimmedQuery)
      )
    : [];

  return (
    <div
      className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-[8px] border border-slate-200 shadow-xl overflow-hidden text-xs divide-y divide-slate-100 select-none animate-in fade-in slide-in-from-top-1 duration-150"
      onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
    >
      {/* 1. QUERY IS EMPTY -> Show Recent & Trending Searches */}
      {!trimmedQuery && (
        <div className="p-4 space-y-4">
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <span>🕒 Recent Searches</span>
                <button
                  type="button"
                  onClick={handleClearAllRecent}
                  className="text-slate-400 hover:text-slate-700 normal-case font-bold"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((item) => (
                  <div
                    key={item}
                    onClick={() => onSelectQuery(item)}
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer font-medium transition"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRecent(item, e)}
                      className="text-slate-400 hover:text-slate-700 text-[10px] font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          <div className="space-y-2">
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              🔥 Trending Across Verified Stores
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trendingSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onSelectQuery(term)}
                  className="px-3 py-1.5 rounded-full border border-slate-200 hover:border-[#404d85] hover:text-[#404d85] bg-white text-slate-700 font-semibold transition"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 2. QUERY HAS TEXT -> Show Structured Suggestions */}
      {trimmedQuery && (
        <div className="max-h-[440px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
          
          {/* Brand & Category Quick Jumps */}
          {(matchedBrands.length > 0 || matchedCategories.length > 0) && (
            <div className="p-3 bg-slate-50/70 space-y-2">
              {matchedBrands.map((b) => (
                <Link
                  key={b}
                  href={`/brand/${b.toLowerCase()}`}
                  onClick={onClose}
                  className="flex items-center justify-between px-3 py-1.5 rounded bg-white border border-slate-200 hover:border-[#404d85] text-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500">👑</span>
                    <span className="font-bold">Official {b} Flagship Hub</span>
                  </div>
                  <span className="text-[11px] text-[#404d85] font-black">View Storefront →</span>
                </Link>
              ))}

              {matchedCategories.map((cat) => (
                <Link
                  key={cat}
                  href={`/category/${cat.toLowerCase()}`}
                  onClick={onClose}
                  className="flex items-center justify-between px-3 py-1 rounded hover:bg-slate-100 text-slate-700 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">📁</span>
                    <span>Search <strong>{query}</strong> in <em>{cat}</em></span>
                  </div>
                  <span className="text-[10px] text-slate-400">Department</span>
                </Link>
              ))}
            </div>
          )}

          {/* Product Suggestions */}
          {matchingProducts.length > 0 ? (
            <div className="p-3 space-y-2">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                Products ({matchingProducts.length})
              </div>
              <div className="space-y-1">
                {matchingProducts.slice(0, 4).map((prod) => (
                  <Link
                    key={prod.id}
                    href={`/product/${prod.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 transition group"
                  >
                    <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      <img src={prod.image} alt={prod.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate group-hover:text-[#404d85] transition">
                        {prod.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-black text-slate-900">{formatINR(prod.price)}</span>
                        <span className="text-slate-300">•</span>
                        <SellerBadge sellerName={prod.sellerName} sellerTier={prod.sellerTier} />
                      </div>
                    </div>
                    <span className="text-slate-300 group-hover:text-[#404d85] transition">→</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-slate-500">
              <p className="font-semibold">Press Enter to search for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-slate-400">Searching all product titles, descriptions, and verified sellers</p>
            </div>
          )}

          {/* Bottom Full Results Action */}
          <div className="p-2.5 bg-slate-50 text-center">
            <button
              type="button"
              onClick={() => onSelectQuery(query)}
              className="w-full py-1.5 font-black text-[#404d85] hover:text-[#323d6a] transition"
            >
              🔍 See all search results for &ldquo;{query}&rdquo; →
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
