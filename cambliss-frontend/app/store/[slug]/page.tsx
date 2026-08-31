"use client";

import { use, useState } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { SellerHeroHeader, SellerProfileData } from "@/components/seller-storefront/SellerHeroHeader";
import { SellerStorefrontTabs } from "@/components/seller-storefront/SellerStorefrontTabs";
import { ProductCardProps } from "@/components/commerce/CommercePrimitives";

const VENDOR_PROFILES: Record<string, { seller: SellerProfileData; products: ProductCardProps[]; gstin: string; legalEntity: string }> = {
  aerotech: {
    seller: {
      id: "v-aerotech",
      name: "AeroTech Official Store 👑",
      legalEntity: "AeroTech Audio Systems Private Limited",
      tier: "premium",
      bannerImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
      logoImage: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=400&q=80",
      rating: 4.9,
      reviewsCount: 1840,
      location: "Bengaluru, Karnataka",
      memberSince: "2023",
      onTimeDispatchPct: 99.4,
      returnRatePct: 0.6,
      productCount: 18,
      tagline: "Pioneering high-fidelity acoustic hardware and noise-canceling studio technology.",
      gstin: "29AABCA1234D1ZX",
    },
    legalEntity: "AeroTech Audio Systems Private Limited",
    gstin: "29AABCA1234D1ZX",
    products: [
      {
        id: "prod-1",
        title: "AeroTech ANC-500 Wireless Studio Noise Canceling Headphones",
        brand: "AeroTech",
        price: 29990,
        originalPrice: 34990,
        sellerName: "AeroTech Official Store",
        sellerTier: "premium",
        rating: 4.9,
        reviewsCount: 1420,
        stockQty: 24,
        deliveryEstimate: "FREE Delivery by Tomorrow",
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
        badge: "★ FLAGSHIP",
      },
      {
        id: "prod-aerotech-earbuds",
        title: "AeroTech AirPulse Truly Wireless ANC Earbuds (30H Battery)",
        brand: "AeroTech",
        price: 12990,
        originalPrice: 15990,
        sellerName: "AeroTech Official Store",
        sellerTier: "premium",
        rating: 4.8,
        reviewsCount: 420,
        stockQty: 30,
        deliveryEstimate: "FREE Delivery by Tomorrow",
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  urbanstyle: {
    seller: {
      id: "v-urbanstyle",
      name: "UrbanStyle Apparel Co.",
      legalEntity: "UrbanStyle Clothing & Textiles LLP",
      tier: "verified",
      bannerImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      logoImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80",
      rating: 4.8,
      reviewsCount: 920,
      location: "Tirupur, Tamil Nadu",
      memberSince: "2024",
      onTimeDispatchPct: 98.8,
      returnRatePct: 1.2,
      productCount: 42,
      tagline: "Luxury 240 GSM organic French Terry streetwear and executive apparel.",
      gstin: "33AABCU5678E1ZY",
    },
    legalEntity: "UrbanStyle Clothing & Textiles LLP",
    gstin: "33AABCU5678E1ZY",
    products: [
      {
        id: "prod-2",
        title: "UrbanStyle 240 GSM Heavyweight Oversized French Terry T-Shirt",
        brand: "UrbanStyle",
        price: 1499,
        originalPrice: 2499,
        sellerName: "UrbanStyle Apparel Co.",
        sellerTier: "verified",
        rating: 4.8,
        reviewsCount: 310,
        stockQty: 45,
        deliveryEstimate: "Same-Day Dispatch",
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
        badge: "⚡ 24H DISPATCH",
      },
    ],
  },
  "glow-beauty": {
    seller: {
      id: "v-glow-beauty",
      name: "Glow Beauty Organics 🌸",
      legalEntity: "Glow Botanicals India Private Limited",
      tier: "premium",
      bannerImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
      logoImage: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80",
      rating: 5.0,
      reviewsCount: 640,
      location: "Mumbai, Maharashtra",
      memberSince: "2023",
      onTimeDispatchPct: 99.6,
      returnRatePct: 0.3,
      productCount: 25,
      tagline: "Cold-pressed French Damask Rose elixirs and certified organic skincare.",
      gstin: "27AABCG9101F1ZX",
    },
    legalEntity: "Glow Botanicals India Private Limited",
    gstin: "27AABCG9101F1ZX",
    products: [
      {
        id: "rec-p3",
        title: "Damask Rose Botanical Hydrating Serum (50ml)",
        brand: "Glow Beauty",
        price: 2499,
        originalPrice: 3200,
        sellerName: "Glow Beauty Organics",
        sellerTier: "premium",
        rating: 5.0,
        reviewsCount: 310,
        stockQty: 30,
        deliveryEstimate: "FREE Delivery by Tomorrow",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
        badge: "ORGANIC CERTIFIED",
      },
    ],
  },
  autocare: {
    seller: {
      id: "v-autocare",
      name: "AutoCare Motors 🚘",
      legalEntity: "AutoCare Logistics & Spares Corporation",
      tier: "verified",
      bannerImage: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80",
      logoImage: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80",
      rating: 4.8,
      reviewsCount: 410,
      location: "Pune, Maharashtra",
      memberSince: "2024",
      onTimeDispatchPct: 98.5,
      returnRatePct: 1.1,
      productCount: 60,
      tagline: "Direct-from-factory synthetic motor oils, filters, and automotive fluids.",
      gstin: "27AABCA1112G1ZY",
    },
    legalEntity: "AutoCare Logistics & Spares Corporation",
    gstin: "27AABCA1112G1ZY",
    products: [
      {
        id: "rec-p4",
        title: "5W-40 Fully Synthetic Engine Motor Oil (5 Liters)",
        brand: "AutoCare",
        price: 3200,
        originalPrice: 3800,
        sellerName: "AutoCare Motors",
        sellerTier: "verified",
        rating: 4.8,
        reviewsCount: 88,
        stockQty: 15,
        deliveryEstimate: "Priority Courier 2-Day Delivery",
        image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  lumina: {
    seller: {
      id: "v-lumina",
      name: "Lumina Keyboards Official ⌨️",
      legalEntity: "Lumina Peripheral Technologies Private Limited",
      tier: "premium",
      bannerImage: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80",
      logoImage: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80",
      rating: 4.9,
      reviewsCount: 780,
      location: "Gurugram, Haryana",
      memberSince: "2023",
      onTimeDispatchPct: 99.1,
      returnRatePct: 0.5,
      productCount: 16,
      tagline: "Custom wireless mechanical keyboards engineered for power users.",
      gstin: "06AABCL1314H1ZX",
    },
    legalEntity: "Lumina Peripheral Technologies Private Limited",
    gstin: "06AABCL1314H1ZX",
    products: [
      {
        id: "prod-3",
        title: "Lumina Q1 Pro Custom Wireless Mechanical Keyboard QMK/VIA",
        brand: "Lumina Keyboards",
        price: 16999,
        originalPrice: 19999,
        sellerName: "Lumina Keyboards Official",
        sellerTier: "premium",
        rating: 4.9,
        reviewsCount: 680,
        stockQty: 12,
        deliveryEstimate: "Express 24-Hour Dispatch",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
        badge: "★ TOP PICK",
      },
    ],
  },
};

export default function DedicatedVendorStorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const vendorSlug = resolvedParams.slug.toLowerCase();

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [inquiryText, setInquiryText] = useState("");

  const storeData = VENDOR_PROFILES[vendorSlug] || {
    seller: {
      id: `v-${vendorSlug}`,
      name: `${vendorSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Store`,
      legalEntity: `${vendorSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Enterprises Private Limited`,
      tier: "verified" as const,
      bannerImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      logoImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
      rating: 4.8,
      reviewsCount: 150,
      location: "India",
      memberSince: "2024",
      onTimeDispatchPct: 99.0,
      returnRatePct: 0.8,
      productCount: 12,
      tagline: "Verified 3P Merchant Seller on Office Connect Marketplace",
      gstin: "27AAACX9999Z1ZX",
    },
    legalEntity: `${vendorSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Enterprises Private Limited`,
    gstin: "27AAACX9999Z1ZX",
    products: [
      {
        id: `prod-${vendorSlug}-1`,
        title: `${vendorSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Premium Product`,
        brand: vendorSlug.toUpperCase(),
        price: 3999,
        originalPrice: 4999,
        sellerName: `${vendorSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Store`,
        sellerTier: "verified" as const,
        rating: 4.8,
        reviewsCount: 88,
        stockQty: 20,
        deliveryEstimate: "FREE Delivery in 2 Days",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
      },
    ],
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim()) return;
    alert(`Inquiry sent directly to ${storeData.seller.name}! The merchant will respond to your account email.`);
    setInquiryText("");
    setIsContactModalOpen(false);
  };

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-32 select-none">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/storefront" className="hover:text-slate-900">Home</Link>
          <span>/</span>
          <Link href="/storefront" className="hover:text-slate-900">Verified Stores</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">{storeData.seller.name}</span>
        </nav>

        {/* 1. Dedicated Vendor Hero Header */}
        <SellerHeroHeader
          seller={storeData.seller}
          onContactSeller={() => setIsContactModalOpen(true)}
        />

        {/* 2. Vendor Storefront Navigation Tabs (Catalog, Deals, KYB & Policies) */}
        <SellerStorefrontTabs
          products={storeData.products}
          sellerName={storeData.seller.name}
          legalEntity={storeData.legalEntity}
          gstin={storeData.gstin}
          policies={{
            returnPolicy: "7-Day Hassle-Free Returns & Replacement guarantee for defect/damage items.",
            shippingPolicy: "Priority Air/Surface fulfillment within 24-48 hours of order verification.",
            warrantyPolicy: "Official Manufacturer / Merchant Direct Domestic Warranty backed with tax invoice.",
          }}
        />

        {/* Contact Merchant Inquiry Modal */}
        {isContactModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[8px] max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900">Contact {storeData.seller.name}</h3>
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendInquiry} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Direct Inquiry / Request for Bulk Quote (RFQ)
                  </label>
                  <textarea
                    rows={4}
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                    placeholder="Ask about product specifications, bulk pricing, GST tax invoicing, or dispatch timelines..."
                    className="w-full p-2.5 border border-slate-300 rounded-[4px] text-xs focus:border-[#404d85] focus:outline-hidden"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="px-3 py-1.5 rounded-[4px] border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white text-xs font-bold transition"
                  >
                    Send Direct Message →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </StorefrontShell>
  );
}
