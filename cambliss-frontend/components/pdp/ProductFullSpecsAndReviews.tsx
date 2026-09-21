"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR, SellerBadge } from "@/components/commerce/CommercePrimitives";

export interface OtherSellerOffer {
  sellerId: string;
  sellerName: string;
  sellerTier: "premium" | "verified" | "new";
  price: number;
  condition: string;
  deliveryEstimate: string;
  dispatchRate: string;
  rating: number;
}

export interface ReviewItem {
  author: string;
  city: string;
  date: string;
  stars: number;
  title: string;
  comment: string;
  verified: boolean;
}

export const ProductFullSpecsAndReviews = ({
  description,
  features,
  specifications,
  sellerName,
  sellerTier,
  otherSellers,
  rating,
  reviewsCount,
  activePrice = 999,
  reviews,
  onAddToCart,
}: {
  description: string;
  features: string[];
  specifications: Record<string, string>;
  sellerName: string;
  sellerTier: "premium" | "verified" | "new";
  otherSellers: OtherSellerOffer[];
  rating: number;
  reviewsCount: number;
  activePrice?: number;
  reviews?: ReviewItem[];
  onAddToCart: (sellerName: string, price: number) => void;
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "specs" | "sellers" | "reviews">("overview");

  const ratingBreakdown = [
    { stars: 5, pct: 85 },
    { stars: 4, pct: 15 },
    { stars: 3, pct: 0 },
    { stars: 2, pct: 0 },
    { stars: 1, pct: 0 },
  ];

  const sampleReviews: ReviewItem[] = reviews && reviews.length > 0
    ? reviews
    : [
        {
          author: "Kavita Rao",
          city: "Bengaluru, KA",
          date: "Verified Store Order",
          stars: 5,
          title: "Stunning finish and rich craftsmanship!",
          comment: "Arrived within 48 hours in sealed protective packaging with official GST tax invoice. Looks even better in person!",
          verified: true,
        },
        {
          author: "Rohan Varma",
          city: "Hyderabad, TS",
          date: "Verified Store Order",
          stars: 5,
          title: "100% genuine merchant product",
          comment: "Fabric and fit are exceptional. Very satisfied with the quick dispatch and genuine quality.",
          verified: true,
        },
      ];

  return (
    <div className="space-y-6 select-none">
      
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none text-xs font-extrabold">
        {[
          { key: "overview", label: "Product Description & Highlights" },
          { key: "specs", label: "Technical Specifications" },
          { key: "sellers", label: `Other Sellers (${otherSellers.length + 1} Offers)` },
          { key: "reviews", label: `Ratings & Reviews (${reviewsCount.toLocaleString()})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-[4px] transition whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-[#404d85] text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW & FEATURES */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-6 rounded-[8px] border border-slate-200 shadow-2xs">
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Product Overview
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {description}
            </p>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Key Highlights:
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Seller Information Card */}
          <div className="lg:col-span-4 p-4 rounded-[6px] bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                Sold & Dispatched By
              </span>
              <SellerBadge sellerName={sellerName} sellerTier={sellerTier} />
            </div>

            <div className="space-y-2 text-[11px] text-slate-700">
              <div className="flex items-center justify-between">
                <span>On-Time Dispatch Rate:</span>
                <strong className="text-emerald-700 font-bold">99.8% (24h SLA)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Return / RMA Rate:</span>
                <strong className="text-slate-900 font-bold">0.2% (Top 1%)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>GSTIN Verified:</span>
                <strong className="text-[#404d85] font-mono">29AABCU9603R1ZM</strong>
              </div>
            </div>

            <Link
              href="/brand/sony"
              className="block w-full py-2 bg-white border border-slate-300 hover:border-[#404d85] text-slate-800 font-bold text-center rounded text-xs transition"
            >
              Visit Official Storefront →
            </Link>
          </div>
        </div>
      )}

      {/* 2. TECHNICAL SPECIFICATIONS */}
      {activeTab === "specs" && (
        <div className="bg-white p-6 rounded-[8px] border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Technical Specifications Matrix
          </h3>
          <div className="border border-slate-200 rounded-[6px] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse divide-y divide-slate-100">
              <tbody className="divide-y divide-slate-100">
                {Object.entries(specifications).map(([key, val], idx) => (
                  <tr key={key} className={idx % 2 === 0 ? "bg-slate-50/50" : "bg-white"}>
                    <td className="py-3 px-4 font-bold text-slate-600 w-1/3 sm:w-1/4">
                      {key}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. OTHER SELLERS COMPARISON TABLE */}
      {activeTab === "sellers" && (
        <div className="bg-white p-6 rounded-[8px] border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Compare Other Verified Merchant Offers
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              All merchant offers backed by 100% Escrow Protection
            </span>
          </div>

          <div className="border border-slate-200 rounded-[6px] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Merchant & Credentials</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Delivery SLA</th>
                  <th className="py-3 px-4">Price (INR)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {/* Winning Offer */}
                <tr className="bg-emerald-50/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{sellerName}</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-700 text-white font-black text-[9px]">
                        WINNING OFFER
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">Brand New (Sealed)</td>
                  <td className="py-3 px-4 text-emerald-700 font-bold">Express 24-48 Hours</td>
                  <td className="py-3 px-4 font-black text-sm text-slate-900">{formatINR(activePrice)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onAddToCart(sellerName, activePrice)}
                      className="px-3.5 py-1.5 bg-[#404d85] hover:bg-[#323d6a] text-white font-bold rounded text-xs transition"
                    >
                      Buy from Store
                    </button>
                  </td>
                </tr>

                {/* Other 3P Sellers */}
                {otherSellers.map((s) => (
                  <tr key={s.sellerId} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{s.sellerName}</span>
                      <span className="text-[10px] text-slate-400">★ {s.rating.toFixed(1)} • {s.dispatchRate} on-time</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{s.condition}</td>
                    <td className="py-3 px-4 text-slate-700">{s.deliveryEstimate}</td>
                    <td className="py-3 px-4 font-black text-slate-900">{formatINR(s.price)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onAddToCart(s.sellerName, s.price)}
                        className="px-3 py-1 border border-slate-300 hover:border-[#404d85] text-slate-800 font-bold rounded text-xs transition"
                      >
                        Add to Bag
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {otherSellers.length === 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs">
              🛡️ <strong>Exclusive Merchant Offering:</strong> This product is exclusively manufactured and distributed directly by {sellerName}. No unauthorized third-party resellers.
            </div>
          )}
        </div>
      )}

      {/* 4. RATINGS & REVIEWS HISTOGRAM */}
      {activeTab === "reviews" && (
        <div className="bg-white p-6 rounded-[8px] border border-slate-200 shadow-2xs space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-6 border-b border-slate-200">
            
            {/* Score Summary */}
            <div className="lg:col-span-4 text-center space-y-1">
              <div className="text-5xl font-black text-slate-900">{rating.toFixed(1)}</div>
              <div className="flex items-center justify-center gap-1 text-amber-500 text-base">
                ★★★★★
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Based on {reviewsCount.toLocaleString()} verified customer purchases
              </p>
            </div>

            {/* 5-Star Histogram */}
            <div className="lg:col-span-8 space-y-2 text-xs">
              {ratingBreakdown.map((row) => (
                <div key={row.stars} className="flex items-center gap-3">
                  <span className="w-12 font-bold text-slate-700">{row.stars} Star</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-bold text-slate-500">{row.pct}%</span>
                </div>
              ))}
            </div>

          </div>

          {/* Customer Reviews Feed */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Verified Buyer Reviews
            </h4>
            <div className="space-y-4 divide-y divide-slate-100">
              {sampleReviews.map((rev, idx) => (
                <div key={idx} className="pt-4 first:pt-0 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{rev.author}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-black border border-emerald-200">
                        ✓ Verified Purchase
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{rev.date}</span>
                  </div>
                  <div className="text-amber-500 text-xs">★★★★★</div>
                  <h5 className="font-bold text-slate-900">{rev.title}</h5>
                  <p className="text-slate-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
