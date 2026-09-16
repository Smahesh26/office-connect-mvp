"use client";

import { use, useState, useEffect } from "react";
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
      rating: 5.0,
      reviewsCount: 0,
      location: "Bengaluru, Karnataka (Direct Warehouse)",
      memberSince: "January 2024",
      onTimeDispatchPct: 100,
      returnRatePct: 0,
      productCount: 0,
      tagline: "Be Moved. Official consumer electronics, noise cancelling headphones, and audio gear.",
      gstin: "29AABCS1234F1Z1",
    },
    products: [],
  },
  keychron: {
    profile: {
      id: "brand-keychron",
      name: "Keychron Official India Store",
      legalEntity: "Mechanical Keyboards & Peripherals LLP",
      tier: "verified",
      bannerImage: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80",
      logoImage: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=80",
      rating: 5.0,
      reviewsCount: 0,
      location: "Pune, Maharashtra",
      memberSince: "March 2024",
      onTimeDispatchPct: 100,
      returnRatePct: 0,
      productCount: 0,
      tagline: "Custom mechanical keyboards, wireless QMK/VIA programmable typing tools.",
      gstin: "27AABCU7721R1ZX",
    },
    products: [],
  },
};

export default function BrandStorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const rawBrand = brandProfilesMap[slug.toLowerCase()] || {
    profile: {
      id: `brand-${slug}`,
      name: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Brand Store`,
      legalEntity: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Enterprises`,
      tier: "verified" as const,
      bannerImage: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80",
      logoImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80",
      rating: 5.0,
      reviewsCount: 0,
      location: "Platform Hub",
      memberSince: "2026",
      onTimeDispatchPct: 100,
      returnRatePct: 0,
      productCount: 0,
      tagline: "Official verified brand partner on Office Connect.",
      gstin: "29AABCU0000R1ZX",
    },
    products: [],
  };

  const [brandProducts, setBrandProducts] = useState<ProductCardProps[]>(rawBrand.products);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("officeconnect_custom_products");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const matched = parsed
            .filter((p: any) =>
              (p.brand && p.brand.toLowerCase().includes(slug.toLowerCase())) ||
              (p.sellerName && p.sellerName.toLowerCase().includes(slug.toLowerCase()))
            )
            .map((p: any) => ({
              id: p.id || `custom-${Math.random()}`,
              title: p.title || p.name || "Product",
              brand: p.brand || rawBrand.profile.name,
              image: p.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
              price: Number(p.price) || 0,
              originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
              sellerName: rawBrand.profile.name,
              sellerTier: "verified" as const,
              rating: 5.0,
              reviewsCount: 0,
              stockQty: Number(p.stockQty) || 10,
              deliveryEstimate: "FREE Delivery by Tomorrow",
              variant: "standard" as const,
            }));
          if (matched.length > 0) {
            setBrandProducts(matched);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [slug, rawBrand.profile.name]);

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
          <span className="text-slate-900 font-bold">{rawBrand.profile.name}</span>
        </nav>

        {/* Hero Banner & KYB Profile Card */}
        <SellerHeroHeader
          seller={{
            ...rawBrand.profile,
            productCount: brandProducts.length,
          }}
          onContactSeller={() => alert(`Opening verified inquiry desk for ${rawBrand.profile.name}`)}
        />

        {/* Catalog & Deals Tabs */}
        <SellerStorefrontTabs
          products={brandProducts}
          sellerName={rawBrand.profile.name}
          legalEntity={rawBrand.profile.legalEntity}
          gstin={rawBrand.profile.gstin}
          policies={policies}
        />

      </div>
    </MarketplacePageWrapper>
  );
}
