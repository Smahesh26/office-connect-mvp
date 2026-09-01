"use client";

import { use } from "react";
import Link from "next/link";
import { MarketplacePageWrapper } from "@/components/storefront/MarketplacePageWrapper";
import { SellerHeroHeader, SellerProfileData } from "@/components/seller-storefront/SellerHeroHeader";
import { SellerStorefrontTabs } from "@/components/seller-storefront/SellerStorefrontTabs";
import { ProductCardProps } from "@/components/commerce/CommercePrimitives";

const brandProfilesMap: Record<string, { profile: SellerProfileData; products: ProductCardProps[] }> = {
  sony: {
    profile: {
      id: "brand-sony",
      name: "Sony Official Flagship Store",
      legalEntity: "Sony India Private Limited",
      tier: "premium",
      bannerImage: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80",
      logoImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80",
      rating: 4.9,
      reviewsCount: 4890,
      location: "Bengaluru, Karnataka (Direct Warehouse)",
      memberSince: "January 2024",
      onTimeDispatchPct: 99.8,
      returnRatePct: 0.2,
      productCount: 48,
      tagline: "Be Moved. Official consumer electronics, noise cancelling headphones, and audio gear.",
      gstin: "29AABCS1234F1Z1",
    },
    products: [
      {
        id: "prod-1",
        title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
        brand: "Sony",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        price: 29990,
        originalPrice: 34990,
        sellerName: "Sony Official Store",
        sellerTier: "premium",
        rating: 4.9,
        reviewsCount: 1420,
        stockQty: 24,
        deliveryEstimate: "FREE Delivery by Tomorrow",
        variant: "standard",
      },
      {
        id: "prod-sony-2",
        title: "Sony WF-1000XM5 Truly Wireless Noise Canceling Earbuds",
        brand: "Sony",
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
        price: 23990,
        originalPrice: 26990,
        sellerName: "Sony Official Store",
        sellerTier: "premium",
        rating: 4.8,
        reviewsCount: 890,
        stockQty: 16,
        deliveryEstimate: "FREE Delivery by Tomorrow",
        variant: "standard",
      },
    ],
  },
  keychron: {
    profile: {
      id: "brand-keychron",
      name: "Keychron Official India Store",
      legalEntity: "Mechanical Keyboards & Peripherals LLP",
      tier: "verified",
      bannerImage: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80",
      logoImage: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=80",
      rating: 4.8,
      reviewsCount: 1250,
      location: "Pune, Maharashtra",
      memberSince: "March 2024",
      onTimeDispatchPct: 99.2,
      returnRatePct: 0.4,
      productCount: 32,
      tagline: "Custom mechanical keyboards, wireless QMK/VIA programmable typing tools.",
      gstin: "27AABCU7721R1ZX",
    },
    products: [
      {
        id: "prod-3",
        title: "Keychron Q1 Pro Wireless Custom Mechanical Keyboard (QMK/VIA ANSI)",
        brand: "Keychron",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
        price: 16999,
        originalPrice: 19999,
        sellerName: "Keychron Official Store",
        sellerTier: "verified",
        rating: 4.8,
        reviewsCount: 380,
        stockQty: 8,
        deliveryEstimate: "Express Delivery in 2 Days",
        variant: "standard",
      },
    ],
  },
};

export default function BrandStorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const brandData = brandProfilesMap[slug.toLowerCase()] || brandProfilesMap.sony;

  const policies = {
    shippingPolicy: "All orders are dispatched within 24 hours via Bluedart Air Express directly from our verified platform hub.",
    returnPolicy: "7-day hassle-free replacement or full refund under Office Connect 100% Escrow Protection.",
    warrantyPolicy: "Full 1 to 2-year official brand manufacturer warranty applicable across all authorized service centers.",
  };

  return (
    <MarketplacePageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-32 select-none">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/storefront" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-slate-900 transition">Brands</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">{brandData.profile.name}</span>
        </nav>

        {/* Hero Banner & KYB Profile Card */}
        <SellerHeroHeader
          seller={brandData.profile}
          onContactSeller={() => alert(`Opening verified inquiry desk for ${brandData.profile.name}`)}
        />

        {/* Catalog & Deals Tabs */}
        <SellerStorefrontTabs
          products={brandData.products}
          sellerName={brandData.profile.name}
          legalEntity={brandData.profile.legalEntity}
          gstin={brandData.profile.gstin}
          policies={policies}
        />

      </div>
    </MarketplacePageWrapper>
  );
}
