"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/commerce/CommercePrimitives";

export const StorefrontPersonalizedArea = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("officeconnect_recently_viewed");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setRecentlyViewed(parsed);
      }
    } catch (e) {}
  }, []);

  return (
    <div className="space-y-10 pt-6 border-t border-slate-200 select-none">
      {/* Editorial VIP Membership Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 px-6 bg-slate-100/70 rounded-[6px] border border-slate-200">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#404d85]">
            VIP CORPORATE & INDIVIDUAL BUYER PERKS
          </span>
          <h3 className="text-base font-black text-slate-900">
            Unlock Multi-Seller Volume Pricing & Direct Manufacturer Invoicing
          </h3>
          <p className="text-xs text-slate-600">
            Sign in to track orders across merchants, save custom wishlists, and request institutional B2B GST quotes.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/seller-central"
            className="px-5 py-2.5 rounded-[6px] bg-[#404d85] text-white font-bold text-xs hover:bg-[#323d6a] transition"
          >
            Sign In to Account
          </Link>
          <Link
            href="/seller-central"
            className="px-5 py-2.5 rounded-[6px] border border-slate-300 bg-white text-slate-800 font-bold text-xs hover:bg-slate-50 transition"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* Recently Viewed Products (Only rendered when user has viewed actual products) */}
      {recentlyViewed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Recently Viewed & Trending Items</h2>
              <p className="text-xs text-slate-500">Based on your recent marketplace exploration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentlyViewed.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                title={p.title}
                image={p.image}
                price={p.price}
                originalPrice={p.originalPrice}
                sellerName={p.sellerName}
                sellerTier={p.sellerTier}
                rating={p.rating}
                reviewsCount={p.reviewsCount}
                onAddToCart={() => alert(`Added "${p.title}" to bag!`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
