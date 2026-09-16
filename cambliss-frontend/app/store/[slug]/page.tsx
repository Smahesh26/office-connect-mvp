"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { MarketplacePageWrapper } from "@/components/storefront/MarketplacePageWrapper";
import { SellerHeroHeader, SellerProfileData } from "@/components/seller-storefront/SellerHeroHeader";
import { SellerStorefrontTabs } from "@/components/seller-storefront/SellerStorefrontTabs";
import { ProductCardProps } from "@/components/commerce/CommercePrimitives";

const VENDOR_PROFILES: Record<string, { seller: SellerProfileData; products: ProductCardProps[]; gstin: string; legalEntity: string }> = {
  "hisense-computers": {
    seller: {
      id: "v-hisense-computers",
      name: "Hisense Computers Official Store 🖥️",
      legalEntity: "Hisense Computers & Systems India Private Limited",
      tier: "premium",
      bannerImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
      logoImage: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=400&q=80",
      rating: 5.0,
      reviewsCount: 0,
      location: "Bengaluru, Karnataka, India",
      memberSince: "2024",
      onTimeDispatchPct: 100,
      returnRatePct: 0.0,
      productCount: 0,
      tagline: "Official verified merchant storefront on Office Connect Marketplace.",
      gstin: "29AAACH8921K1Z5",
    },
    legalEntity: "Hisense Computers & Systems India Private Limited",
    gstin: "29AAACH8921K1Z5",
    products: [],
  },
  hisense: {
    seller: {
      id: "v-hisense",
      name: "Hisense Computers Official Store 🖥️",
      legalEntity: "Hisense Computers & Systems India Private Limited",
      tier: "premium",
      bannerImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
      logoImage: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=400&q=80",
      rating: 5.0,
      reviewsCount: 0,
      location: "Bengaluru, Karnataka, India",
      memberSince: "2024",
      onTimeDispatchPct: 100,
      returnRatePct: 0.0,
      productCount: 0,
      tagline: "Official verified merchant storefront on Office Connect Marketplace.",
      gstin: "29AAACH8921K1Z5",
    },
    legalEntity: "Hisense Computers & Systems India Private Limited",
    gstin: "29AAACH8921K1Z5",
    products: [],
  },
};

export default function DedicatedVendorStorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const vendorSlug = resolvedParams.slug.toLowerCase();

  const storeData = VENDOR_PROFILES[vendorSlug] || {
    seller: {
      id: `v-${vendorSlug}`,
      name: `${vendorSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Store`,
      legalEntity: `${vendorSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Enterprises Private Limited`,
      tier: "verified" as const,
      bannerImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      logoImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
      rating: 5.0,
      reviewsCount: 0,
      location: "India",
      memberSince: "2024",
      onTimeDispatchPct: 100,
      returnRatePct: 0.0,
      productCount: 0,
      tagline: "Verified 3P Merchant Seller on Office Connect Marketplace",
      gstin: "27AAACX9999Z1ZX",
    },
    legalEntity: `${vendorSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Enterprises Private Limited`,
    gstin: "27AAACX9999Z1ZX",
    products: [],
  };

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [inquiryText, setInquiryText] = useState("");
  const [storeProducts, setStoreProducts] = useState<ProductCardProps[]>(storeData.products);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("officeconnect_custom_products");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && (vendorSlug === "hisense-computers" || vendorSlug === "hisense")) {
          const formatted: ProductCardProps[] = parsed.map((item: any) => ({
            id: item.id,
            title: item.title,
            brand: item.brand || "Hisense Computers",
            price: Number(item.price),
            originalPrice: Number(item.mrp || item.originalPrice || item.price * 1.2),
            sellerName: item.sellerName || "Hisense Computers (bhaskeradv1@gmail.com)",
            sellerTier: "premium",
            rating: item.rating || 4.9,
            reviewsCount: item.reviewsCount || 100,
            stockQty: Number(item.stock !== undefined ? item.stock : (item.stockQty || 10)),
            deliveryEstimate: "FREE Delivery by Tomorrow",
            image: item.image || "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80",
            badge: item.badge || "★ VERIFIED SELLER",
          }));
          setStoreProducts(formatted);
        }
      }
    } catch (e) {}
  }, [vendorSlug]);

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim()) return;
    alert(`Inquiry sent directly to ${storeData.seller.name}! The merchant will respond to your account email.`);
    setInquiryText("");
    setIsContactModalOpen(false);
  };

  return (
    <MarketplacePageWrapper>
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
          products={storeProducts}
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
    </MarketplacePageWrapper>
  );
}
