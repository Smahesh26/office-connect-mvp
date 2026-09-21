"use client";

import { useState } from "react";
import { SellerBadge, Rating } from "@/components/commerce/CommercePrimitives";

export interface SellerProfileData {
  id: string;
  name: string;
  legalEntity: string;
  tier: "new" | "verified" | "premium";
  bannerImage: string;
  logoImage: string;
  rating: number;
  reviewsCount: number;
  location: string;
  memberSince: string;
  onTimeDispatchPct: number;
  returnRatePct: number;
  productCount: number;
  tagline: string;
  gstin: string;
}

export const SellerHeroHeader = ({
  seller,
  onContactSeller,
}: {
  seller: SellerProfileData;
  onContactSeller: () => void;
}) => {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs select-none">
      
      {/* 1. Store Cover Banner */}
      <div className="relative h-48 sm:h-60 w-full bg-slate-950 overflow-hidden">
        <img
          src={seller.bannerImage}
          alt={`${seller.name} Store Banner`}
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
        
        {/* Banner Trust Badge */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm text-xs font-black text-slate-900 flex items-center gap-1.5 border border-slate-200/60">
          <span className="text-emerald-600">🛡️</span>
          <span>Verified Merchant Storefront</span>
        </div>
      </div>

      {/* 2. Store Profile & Info Bar (Clean White Card - Zero Overlap) */}
      <div className="px-6 sm:px-8 pb-6 pt-0 relative">
        
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 pt-2">
          
          {/* Logo & Store Title Details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            
            {/* Store Avatar Logo - Floats above banner edge cleanly */}
            <div className="-mt-16 sm:-mt-20 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden shrink-0 ring-1 ring-slate-900/10">
              <img
                src={seller.logoImage}
                alt={seller.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Store Name, Badges & Metadata - Cleanly below banner */}
            <div className="space-y-1.5 pt-1 sm:pt-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {seller.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <span>✓</span> Verified Merchant
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl">
                {seller.tagline}
              </p>
              <div className="flex items-center gap-2.5 text-xs text-slate-500 flex-wrap pt-0.5">
                <span className="font-extrabold text-amber-500 flex items-center gap-1">
                  ★ {seller.rating.toFixed(1)} <span className="text-slate-600 font-semibold">({seller.reviewsCount})</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700">📍 {seller.location}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-medium">Member since {seller.memberSince}</span>
              </div>
            </div>

          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 self-start lg:self-end shrink-0">
            <button
              type="button"
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition shadow-xs ${
                isFollowing
                  ? "bg-slate-100 text-slate-800 border border-slate-300"
                  : "bg-[#404d85] text-white hover:bg-[#323d6a]"
              }`}
            >
              {isFollowing ? "✓ Following Store" : "+ Follow Store"}
            </button>
            <button
              type="button"
              onClick={onContactSeller}
              className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-2xs"
            >
              💬 Contact Merchant
            </button>
          </div>

        </div>

        {/* 3. Merchant Trust Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-5 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">On-Time Dispatch</span>
            <span className="text-base font-black text-emerald-600">{seller.onTimeDispatchPct}%</span>
            <p className="text-[10px] text-slate-500">Express 24h SLA compliance</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Return Rate</span>
            <span className="text-base font-black text-slate-900">{seller.returnRatePct}%</span>
            <p className="text-[10px] text-emerald-600 font-bold">Top 1% marketplace standard</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Active Catalog</span>
            <span className="text-base font-black text-slate-900">{seller.productCount} SKU{seller.productCount === 1 ? "" : "s"}</span>
            <p className="text-[10px] text-slate-500">100% Genuine brand stock</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Verified Entity</span>
            <span className="text-xs font-black text-slate-900 truncate block font-mono">{seller.gstin}</span>
            <p className="text-[10px] text-slate-500">KYB & GST Verified</p>
          </div>
        </div>

      </div>

    </div>
  );
};
