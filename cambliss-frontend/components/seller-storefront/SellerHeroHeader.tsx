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
    <div className="rounded-[8px] border border-slate-200 bg-white overflow-hidden shadow-2xs select-none space-y-0">
      
      {/* Banner */}
      <div className="relative h-40 sm:h-52 w-full bg-slate-900 overflow-hidden">
        <img
          src={seller.bannerImage}
          alt={`${seller.name} Store Banner`}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
        
        {/* Banner Overlay Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-[4px] shadow-xs text-xs font-black text-slate-900 flex items-center gap-1.5">
          <span>🛡️</span>
          <span>Encrypted Payment Processing</span>
        </div>
      </div>

      {/* Profile Bar */}
      <div className="p-6 relative pt-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
          
          {/* Logo & Name */}
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[8px] border-4 border-white bg-white shadow-md overflow-hidden shrink-0">
              <img src={seller.logoImage} alt={seller.name} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{seller.name}</h1>
                <SellerBadge sellerName="" sellerTier={seller.tier} />
              </div>
              <p className="text-xs text-slate-500 font-medium">{seller.tagline}</p>
              <div className="flex items-center gap-2 text-xs">
                <Rating score={seller.rating} reviewsCount={seller.reviewsCount} />
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-semibold">📍 {seller.location}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400">Member since {seller.memberSince}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 self-start sm:self-end">
            <button
              type="button"
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-4 py-2 rounded-[4px] text-xs font-bold transition shadow-2xs ${
                isFollowing
                  ? "bg-slate-100 text-slate-800 border border-slate-300"
                  : "bg-slate-900 text-white hover:bg-black"
              }`}
            >
              {isFollowing ? "✓ Following Store" : "+ Follow Store"}
            </button>
            <button
              type="button"
              onClick={onContactSeller}
              className="px-4 py-2 rounded-[4px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition"
            >
              💬 Contact Merchant
            </button>
          </div>

        </div>

        {/* 4 Merchant Trust Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">On-Time Dispatch</span>
            <span className="text-sm font-black text-emerald-600">{seller.onTimeDispatchPct}%</span>
            <p className="text-[10px] text-slate-500">Express 24h SLA compliance</p>
          </div>

          <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Return Rate</span>
            <span className="text-sm font-black text-slate-900">{seller.returnRatePct}%</span>
            <p className="text-[10px] text-emerald-600 font-bold">Top 1% marketplace standard</p>
          </div>

          <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Active Catalog</span>
            <span className="text-sm font-black text-slate-900">{seller.productCount} SKUs</span>
            <p className="text-[10px] text-slate-500">100% Genuine brand stock</p>
          </div>

          <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Verified Entity</span>
            <span className="text-xs font-black text-slate-900 truncate block font-mono">{seller.gstin}</span>
            <p className="text-[10px] text-slate-500">KYB & GST Verified</p>
          </div>
        </div>

      </div>

    </div>
  );
};
