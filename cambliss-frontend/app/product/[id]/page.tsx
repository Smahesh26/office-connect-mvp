"use client";

import { use } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { ProductPurchaseHero, ProductHeroData } from "@/components/pdp/ProductPurchaseHero";
import { ProductOffersStrip } from "@/components/pdp/ProductOffersStrip";
import { FrequentlyBoughtTogether, BundleItem } from "@/components/pdp/FrequentlyBoughtTogether";
import { ProductFullSpecsAndReviews, OtherSellerOffer } from "@/components/pdp/ProductFullSpecsAndReviews";
import { ProductCard } from "@/components/commerce/CommercePrimitives";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  // Mock Canonical Flagship Product Data
  const product: ProductHeroData = {
    id: productId,
    title: "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones",
    brand: "Sony",
    brandSlug: "sony",
    category: "Electronics",
    rating: 4.9,
    reviewsCount: 1420,
    questionsCount: 284,
    basePrice: 29990,
    originalPrice: 34990,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      {
        id: "v-black",
        name: "Midnight Black",
        colorCode: "#111827",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        inStock: true,
        priceOffset: 0,
      },
      {
        id: "v-silver",
        name: "Platinum Silver",
        colorCode: "#e2e8f0",
        image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80",
        inStock: true,
        priceOffset: 0,
      },
      {
        id: "v-blue",
        name: "Smoky Navy Blue",
        colorCode: "#1e3a8a",
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
        inStock: true,
        priceOffset: 1000,
      },
    ],
    sellerName: "Sony India Direct",
    sellerTier: "premium",
    dispatchSla: "Express 24-Hour Dispatch",
    stockCount: 24,
  };

  // Technical Specs
  const specifications: Record<string, string> = {
    "Brand & Model": "Sony WH-1000XM5",
    "Headphone Type": "Closed, dynamic over-ear",
    "Driver Unit": "30mm (Carbon fiber composite dome)",
    "Frequency Response": "4 Hz - 40,000 Hz (Hi-Res Audio Wireless)",
    "Battery Life": "Up to 30 Hours (NC ON), 40 Hours (NC OFF)",
    "Charging Time": "Approx. 3.5 Hours (3 min quick charge gives 3 hours playback)",
    "Bluetooth Version": "Bluetooth v5.2 (LDAC, AAC, SBC, multipoint connect)",
    "Weight": "Approx. 250 grams",
    "Active Noise Cancellation": "Integrated Processor V1 + HD Noise Cancelling Processor QN1 (8 microphones)",
    "Warranty": "1 Year Comprehensive Sony India Domestic Brand Warranty",
  };

  const features: string[] = [
    "Industry-leading Noise Cancellation with two processors and 8 microphones",
    "Magnificent Sound engineered with the new Integrated Processor V1",
    "Crystal clear hands-free calling with 4 beamforming microphones and AI noise reduction",
    "Up to 30-hour battery life with quick charging (3 min charge for 3 hours of playback)",
    "Ultra-comfortable, lightweight design with soft fit leather",
    "Multipoint connection allows you to quickly switch between devices",
  ];

  const otherSellers: OtherSellerOffer[] = [
    {
      sellerId: "s-102",
      sellerName: "AudioPhile Hub India",
      sellerTier: "verified",
      price: 30490,
      condition: "Brand New (Original Factory Seal)",
      deliveryEstimate: "FREE Delivery in 2 Days",
      dispatchRate: "99.4%",
      rating: 4.8,
    },
    {
      sellerId: "s-103",
      sellerName: "Apex Enterprise Tech",
      sellerTier: "verified",
      price: 30990,
      condition: "Brand New (B2B Bulk Invoice Eligible)",
      deliveryEstimate: "Delivery by Tomorrow, 5 PM",
      dispatchRate: "98.7%",
      rating: 4.7,
    },
  ];

  // Recommendations
  const similarProducts = [
    {
      id: "prod-2",
      title: "Sony WF-1000XM5 Truly Wireless Noise Canceling Earbuds",
      brand: "Sony",
      price: 23990,
      originalPrice: 26990,
      rating: 4.8,
      reviewsCount: 930,
      deliveryEstimate: "Tomorrow, by 5 PM",
      sellerName: "Sony India Direct",
      sellerTier: "premium" as const,
      stockQty: 18,
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod-4",
      title: "Keychron Q1 Pro Custom Wireless Mechanical Keyboard QMK/VIA",
      brand: "Keychron",
      price: 18499,
      originalPrice: 21999,
      rating: 4.9,
      reviewsCount: 680,
      deliveryEstimate: "Tomorrow, by 11 AM",
      sellerName: "Keychron Official India",
      sellerTier: "premium" as const,
      stockQty: 12,
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod-3",
      title: "Dell UltraSharp 32-inch 4K UHD Thunderbolt Hub USB-C Monitor",
      brand: "Dell",
      price: 78900,
      originalPrice: 89900,
      rating: 4.7,
      reviewsCount: 412,
      deliveryEstimate: "In 2 Days via Bluedart",
      sellerName: "Office Connect Direct",
      sellerTier: "premium" as const,
      stockQty: 5,
      image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const handleAddToCart = (variantId: string, qty: number) => {
    alert(`Added ${qty}x ${product.title} to Bag!`);
  };

  const handleBuyNow = (variantId: string, qty: number) => {
    window.location.href = "/checkout";
  };

  const handleAddBundleToCart = (bundleItems: BundleItem[]) => {
    alert(`Added all ${bundleItems.length} bundle accessories to Bag!`);
  };

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10 pb-32 select-none">
        
        {/* 1. Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/storefront" className="hover:text-slate-900">Storefront</Link>
          <span>/</span>
          <Link href="/category/electronics" className="hover:text-slate-900">Electronics</Link>
          <span>/</span>
          <Link href="/category/electronics" className="hover:text-slate-900">Headphones & Audio</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate max-w-xs sm:max-w-md">{product.title}</span>
        </nav>

        {/* 2. Top Purchase Area (Visual Priority: Gallery, Info, Bold Price, Variants, Delivery SLA, CTAs) */}
        <ProductPurchaseHero
          product={product}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />

        {/* 3. Promotional Offers & Bank Deals Strip */}
        <ProductOffersStrip />

        {/* 4. Frequently Bought Together (Accessory Bundle Engine) */}
        <FrequentlyBoughtTogether
          mainProduct={{
            id: product.id,
            title: product.title,
            price: product.basePrice,
            originalPrice: product.originalPrice,
            image: product.images[0],
          }}
          onAddBundleToCart={handleAddBundleToCart}
        />

        {/* 5. Comprehensive Product Overview, Specs, Seller Profile, Other Sellers Table & Reviews */}
        <ProductFullSpecsAndReviews
          description="The Sony WH-1000XM5 headphones rewrite the rules for distraction-free listening. Two processors control 8 microphones for unprecedented noise cancellation and exceptional call quality. With a newly developed driver unit, DSEE - Extreme and Hi-Res audio support, the WH-1000XM5 headphones provide awe-inspiring audio quality."
          features={features}
          specifications={specifications}
          sellerName={product.sellerName}
          sellerTier={product.sellerTier}
          otherSellers={otherSellers}
          rating={product.rating}
          reviewsCount={product.reviewsCount}
          onAddToCart={(sName, price) => alert(`Added to cart from ${sName} at ₹${price}!`)}
        />

        {/* 6. Similar & Recommended Products */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
              Similar Products Recommended for You
            </h3>
            <Link href="/category/electronics" className="text-xs font-bold text-[#404d85] hover:underline">
              Explore More Electronics →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {similarProducts.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                title={p.title}
                brand={p.brand}
                price={p.price}
                originalPrice={p.originalPrice}
                rating={p.rating}
                reviewsCount={p.reviewsCount}
                deliveryEstimate={p.deliveryEstimate}
                sellerName={p.sellerName}
                sellerTier={p.sellerTier}
                stockQty={p.stockQty}
                image={p.image}
                variant="standard"
                onAddToCart={() => alert(`Added ${p.title} to Cart!`)}
              />
            ))}
          </div>
        </div>

      </div>
    </StorefrontShell>
  );
}
