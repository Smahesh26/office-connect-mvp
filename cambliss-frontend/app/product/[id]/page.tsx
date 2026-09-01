"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { MarketplacePageWrapper } from "@/components/storefront/MarketplacePageWrapper";
import { ProductPurchaseHero, ProductHeroData } from "@/components/pdp/ProductPurchaseHero";
import { ProductOffersStrip } from "@/components/pdp/ProductOffersStrip";
import { FrequentlyBoughtTogether, BundleItem } from "@/components/pdp/FrequentlyBoughtTogether";
import { ProductFullSpecsAndReviews, OtherSellerOffer } from "@/components/pdp/ProductFullSpecsAndReviews";
import { ProductCard } from "@/components/commerce/CommercePrimitives";
import { fetchPDPDetails } from "@/lib/catalog-api";
import { addToCartStorage } from "@/lib/cart-wishlist";

const KNOWN_PRODUCTS: Record<string, ProductHeroData> = {
  // 1. Headphones & Audio
  "prod-1": {
    id: "prod-1",
    title: "AeroTech ANC-500 Wireless Studio Noise Canceling Headphones",
    brand: "AeroTech",
    brandSlug: "aerotech",
    category: "Electronics",
    rating: 4.9,
    reviewsCount: 1420,
    questionsCount: 284,
    basePrice: 29990,
    originalPrice: 34990,
    images: [
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      { id: "v-black", name: "Midnight Black", colorCode: "#111827", image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
      { id: "v-silver", name: "Platinum Silver", colorCode: "#e2e8f0", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
    ],
    sellerName: "AeroTech Official Direct 👑",
    sellerTier: "premium",
    dispatchSla: "Express 24-Hour Dispatch",
    stockCount: 24,
  },
  "deal-2": {
    id: "deal-2",
    title: "Wireless ANC Noise-Cancelling Headphones Hi-Res Audio",
    brand: "AeroTech",
    brandSlug: "aerotech",
    category: "Electronics",
    rating: 4.9,
    reviewsCount: 420,
    questionsCount: 94,
    basePrice: 18990,
    originalPrice: 22490,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      { id: "v-blk", name: "Matte Black", colorCode: "#111827", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
    ],
    sellerName: "Office Connect Direct 👑",
    sellerTier: "premium",
    dispatchSla: "Express 24-Hour Dispatch",
    stockCount: 18,
  },

  // 2. Beauty & Hydrating Serums
  "rec-p3": {
    id: "rec-p3",
    title: "Damask Rose Botanical Hydrating Serum (50ml)",
    brand: "Glow Beauty",
    brandSlug: "glowbeauty",
    category: "Beauty",
    rating: 5.0,
    reviewsCount: 310,
    questionsCount: 18,
    basePrice: 2499,
    originalPrice: 3200,
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      { id: "v-50ml", name: "50ml Bottle", colorCode: "#f43f5e", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
    ],
    sellerName: "Glow Beauty Organics 🌸",
    sellerTier: "premium",
    dispatchSla: "Express 24-Hour Dispatch",
    stockCount: 30,
  },
  "deal-1": {
    id: "deal-1",
    title: "Damask Rose Botanical Hydrating Serum (50ml)",
    brand: "Glow Beauty",
    brandSlug: "glowbeauty",
    category: "Beauty",
    rating: 5.0,
    reviewsCount: 310,
    questionsCount: 18,
    basePrice: 2499,
    originalPrice: 3200,
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      { id: "v-50ml", name: "50ml Bottle", colorCode: "#f43f5e", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
    ],
    sellerName: "Glow Beauty Organics 🌸",
    sellerTier: "premium",
    dispatchSla: "Express 24-Hour Dispatch",
    stockCount: 30,
  },
  "rec-1": {
    id: "rec-1",
    title: "Damask Rose Botanical Hydrating Serum (50ml)",
    brand: "Glow Beauty",
    brandSlug: "glowbeauty",
    category: "Beauty",
    rating: 5.0,
    reviewsCount: 310,
    questionsCount: 18,
    basePrice: 2499,
    originalPrice: 3200,
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      { id: "v-50ml", name: "50ml Bottle", colorCode: "#f43f5e", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
    ],
    sellerName: "Glow Beauty Organics 🌸",
    sellerTier: "premium",
    dispatchSla: "Express 24-Hour Dispatch",
    stockCount: 30,
  },
  "deal-3": {
    id: "deal-3",
    title: "Organic Damask Rose Lip Elixir Shine Balm",
    brand: "Glow Beauty",
    brandSlug: "glowbeauty",
    category: "Beauty",
    rating: 4.9,
    reviewsCount: 140,
    questionsCount: 12,
    basePrice: 1200,
    originalPrice: 1500,
    images: [
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      { id: "v-rose", name: "Rose Velvet Tint", colorCode: "#e11d48", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
    ],
    sellerName: "Glow Beauty Organics 🌸",
    sellerTier: "premium",
    dispatchSla: "Express 24-Hour Dispatch",
    stockCount: 40,
  },

  // 3. Automotive Engine Oil
  "rec-p4": {
    id: "rec-p4",
    title: "5W-40 Fully Synthetic Engine Motor Oil (5 Liters)",
    brand: "AutoCare",
    brandSlug: "autocare",
    category: "Automotive",
    rating: 4.8,
    reviewsCount: 88,
    questionsCount: 12,
    basePrice: 3200,
    originalPrice: 3800,
    images: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      { id: "v-5l", name: "5L Canister", colorCode: "#0284c7", image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
    ],
    sellerName: "AutoCare Motors 🚘",
    sellerTier: "verified",
    dispatchSla: "Priority Courier 2-Day Delivery",
    stockCount: 15,
  },
  "deal-4": {
    id: "deal-4",
    title: "5W-40 Fully Synthetic Engine Motor Oil (5 Liters)",
    brand: "AutoCare",
    brandSlug: "autocare",
    category: "Automotive",
    rating: 4.8,
    reviewsCount: 88,
    questionsCount: 12,
    basePrice: 3200,
    originalPrice: 3800,
    images: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      { id: "v-5l", name: "5L Canister", colorCode: "#0284c7", image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
    ],
    sellerName: "AutoCare Motors 🚘",
    sellerTier: "verified",
    dispatchSla: "Priority Courier 2-Day Delivery",
    stockCount: 15,
  },
  "rec-4": {
    id: "rec-4",
    title: "5W-40 Fully Synthetic Engine Motor Oil (5 Liters)",
    brand: "AutoCare",
    brandSlug: "autocare",
    category: "Automotive",
    rating: 4.8,
    reviewsCount: 88,
    questionsCount: 12,
    basePrice: 3200,
    originalPrice: 3800,
    images: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      { id: "v-5l", name: "5L Canister", colorCode: "#0284c7", image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
    ],
    sellerName: "AutoCare Motors 🚘",
    sellerTier: "verified",
    dispatchSla: "Priority Courier 2-Day Delivery",
    stockCount: 15,
  },

  // 4. Apparel & T-Shirts
  "prod-2": {
    id: "prod-2",
    title: "UrbanStyle 240 GSM Heavyweight Oversized French Terry T-Shirt",
    brand: "UrbanStyle",
    brandSlug: "urbanstyle",
    category: "Apparel",
    rating: 4.8,
    reviewsCount: 310,
    questionsCount: 42,
    basePrice: 1499,
    originalPrice: 2499,
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      { id: "v-s", name: "Small (S)", colorCode: "#111827", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
      { id: "v-m", name: "Medium (M)", colorCode: "#111827", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
      { id: "v-l", name: "Large (L)", colorCode: "#111827", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
    ],
    sellerName: "UrbanStyle Official",
    sellerTier: "verified",
    dispatchSla: "Same-Day Warehouse Dispatch",
    stockCount: 45,
  },

  // 5. Smartwatch & Cloud Clusters & Keyboards
  "rec-2": {
    id: "rec-2",
    title: "Titanium Fitness & Cardiac Health Smartwatch",
    brand: "AeroTech",
    brandSlug: "aerotech",
    category: "Electronics",
    rating: 4.9,
    reviewsCount: 156,
    questionsCount: 38,
    basePrice: 24990,
    originalPrice: 29990,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      { id: "v-ti", name: "Titanium Silver", colorCode: "#cbd5e1", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
    ],
    sellerName: "AeroTech Official Direct 👑",
    sellerTier: "premium",
    dispatchSla: "Express 24-Hour Dispatch",
    stockCount: 16,
  },
  "rec-3": {
    id: "rec-3",
    title: "Kubernetes NVMe Cloud Server Cluster (16 vCPU, 64GB RAM)",
    brand: "Acme Cloud",
    brandSlug: "acme-cloud",
    category: "Computing",
    rating: 4.8,
    reviewsCount: 94,
    questionsCount: 41,
    basePrice: 62000,
    originalPrice: 75000,
    images: [
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      { id: "v-cluster", name: "Multi-Region Enterprise Node", colorCode: "#0284c7", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
    ],
    sellerName: "Acme Cloud Corp ☁️",
    sellerTier: "verified",
    dispatchSla: "Instant Automated Cloud Provisioning",
    stockCount: 99,
  },
  "prod-3": {
    id: "prod-3",
    title: "Lumina Q1 Pro Custom Wireless Mechanical Keyboard QMK/VIA",
    brand: "Lumina Keyboards",
    brandSlug: "lumina",
    category: "Electronics",
    rating: 4.9,
    reviewsCount: 680,
    questionsCount: 95,
    basePrice: 16999,
    originalPrice: 19999,
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      { id: "v-carbon", name: "Carbon Black", colorCode: "#1e293b", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
    ],
    sellerName: "Lumina Keyboards Official",
    sellerTier: "premium",
    dispatchSla: "Express 24-Hour Dispatch",
    stockCount: 12,
  },
  "prod-7": {
    id: "prod-7",
    title: "Anker Prime 27,650mAh Power Bank (250W Fast Charger)",
    brand: "Anker",
    brandSlug: "anker",
    category: "Electronics",
    rating: 4.9,
    reviewsCount: 680,
    questionsCount: 54,
    basePrice: 14999,
    originalPrice: 17999,
    images: [
      "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?auto=format&fit=crop&w=800&q=80",
    ],
    variants: [
      { id: "v-blk", name: "Matte Black", colorCode: "#0f172a", image: "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
    ],
    sellerName: "Anker Official Direct",
    sellerTier: "premium",
    dispatchSla: "FREE Delivery by Tomorrow",
    stockCount: 22,
  },
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [productData, setProductData] = useState<ProductHeroData>(() => {
    if (KNOWN_PRODUCTS[productId]) {
      return KNOWN_PRODUCTS[productId];
    }
    // Dynamic fallback for any custom product ID
    const formattedTitle = productId
      .replace(/^prod-|^rec-|^deal-/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      id: productId,
      title: formattedTitle ? `${formattedTitle} Premium Edition` : "Verified Marketplace Product",
      brand: "Verified Brand",
      brandSlug: "verified-brand",
      category: "General Merchandise",
      rating: 4.8,
      reviewsCount: 140,
      questionsCount: 22,
      basePrice: 4999,
      originalPrice: 6999,
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { id: "v-standard", name: "Standard Edition", colorCode: "#3b82f6", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80", inStock: true, priceOffset: 0 },
      ],
      sellerName: "Office Connect Direct 👑",
      sellerTier: "verified",
      dispatchSla: "Standard 2-3 Business Days",
      stockCount: 18,
    };
  });

  useEffect(() => {
    async function loadApiProduct() {
      try {
        const pdp = await fetchPDPDetails(productId);
        if (pdp && pdp.product) {
          const apiP = pdp.product;
          setProductData({
            id: apiP.id,
            title: apiP.title,
            brand: apiP.brandName || "Verified Brand",
            brandSlug: (apiP.brandName || "brand").toLowerCase().replace(/\s+/g, "-"),
            category: apiP.categoryName || "General",
            rating: 4.9,
            reviewsCount: 320,
            questionsCount: 45,
            basePrice: pdp.buyBoxOffer?.sellingPrice || 29990,
            originalPrice: pdp.buyBoxOffer?.mrp || 34990,
            images: apiP.primaryImage ? [apiP.primaryImage, ...(apiP.galleryImages || [])] : ["https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80"],
            variants: apiP.variants && apiP.variants.length > 0
              ? apiP.variants.map((v, i) => ({
                  id: v.id,
                  name: v.title,
                  colorCode: i === 0 ? "#111827" : "#e2e8f0",
                  image: apiP.primaryImage,
                  inStock: true,
                  priceOffset: 0,
                }))
              : [{ id: "v-default", name: "Default Option", colorCode: "#111827", image: apiP.primaryImage, inStock: true, priceOffset: 0 }],
            sellerName: pdp.buyBoxOffer?.sellerName || `${apiP.brandName || "Office Connect"} Direct`,
            sellerTier: "premium",
            dispatchSla: pdp.buyBoxOffer?.dispatchSla || "Express 24-Hour Dispatch",
            stockCount: pdp.buyBoxOffer?.stockAvailable || 20,
          });
        }
      } catch (err) {
        console.warn("Using fallback local product data for:", productId, err);
      }
    }
    loadApiProduct();
  }, [productId]);

  const specifications: Record<string, string> = {
    "Brand & Model": `${productData.brand} (${productData.id})`,
    "Category": productData.category,
    "Seller": productData.sellerName,
    "Fulfillment SLA": productData.dispatchSla,
    "Warranty": "1 Year Manufacturer Official Domestic Warranty",
    "Return Window": "7 Days Hassle-Free Returns & Replacements",
  };

  const features: string[] = [
    `Authentic ${productData.brand} brand specification with full quality assurance.`,
    "Direct warehouse dispatch with sealed protective packaging.",
    "B2B tax invoice eligible with GST input credit.",
    "Backed by Office Connect buyer protection guarantee.",
  ];

  const otherSellers: OtherSellerOffer[] = [
    {
      sellerId: "s-102",
      sellerName: "Apex Digital Solutions",
      sellerTier: "verified",
      price: productData.basePrice + 500,
      condition: "Brand New (Factory Sealed)",
      deliveryEstimate: "FREE Delivery in 2 Days",
      dispatchRate: "99.2%",
      rating: 4.8,
    },
  ];

  const similarProducts = [
    {
      id: "prod-2",
      title: "UrbanStyle 240 GSM Heavyweight Oversized French Terry T-Shirt",
      brand: "UrbanStyle",
      price: 1499,
      originalPrice: 2499,
      rating: 4.8,
      reviewsCount: 310,
      deliveryEstimate: "Tomorrow, by 5 PM",
      sellerName: "UrbanStyle Store",
      sellerTier: "verified" as const,
      stockQty: 45,
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod-3",
      title: "Lumina Q1 Pro Custom Wireless Mechanical Keyboard QMK/VIA",
      brand: "Lumina Keyboards",
      price: 16999,
      originalPrice: 19999,
      rating: 4.9,
      reviewsCount: 680,
      deliveryEstimate: "Tomorrow, by 11 AM",
      sellerName: "Lumina Keyboards Official",
      sellerTier: "premium" as const,
      stockQty: 12,
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod-7",
      title: "Anker Prime 27,650mAh Power Bank (250W Fast Charger)",
      brand: "Anker",
      price: 14999,
      originalPrice: 17999,
      rating: 4.9,
      reviewsCount: 680,
      deliveryEstimate: "Tomorrow, by 2 PM",
      sellerName: "Anker Official Direct",
      sellerTier: "premium" as const,
      stockQty: 22,
      image: "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const handleAddToCart = (variantId: string, qty: number) => {
    addToCartStorage({
      id: productData.id,
      title: productData.title,
      price: productData.basePrice,
      originalPrice: productData.originalPrice,
      image: productData.images[0],
      sellerName: productData.sellerName,
      quantity: qty,
    });
    alert(`Added ${qty}x "${productData.title}" to Shopping Bag!`);
  };

  const handleBuyNow = (variantId: string, qty: number) => {
    addToCartStorage({
      id: productData.id,
      title: productData.title,
      price: productData.basePrice,
      originalPrice: productData.originalPrice,
      image: productData.images[0],
      sellerName: productData.sellerName,
      quantity: qty,
    });
    window.location.href = "/checkout";
  };

  const handleAddBundleToCart = (bundleItems: BundleItem[]) => {
    bundleItems.forEach((b) => {
      addToCartStorage({
        id: b.id,
        title: b.title,
        price: b.price,
        originalPrice: b.originalPrice,
        image: b.image,
        quantity: 1,
      });
    });
    alert(`Added all ${bundleItems.length} bundle items to Shopping Bag!`);
  };

  return (
    <MarketplacePageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10 pb-32 select-none">
        
        {/* 1. Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/storefront" className="hover:text-slate-900">Storefront</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-slate-900">{productData.category}</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate max-w-xs sm:max-w-md">{productData.title}</span>
        </nav>

        {/* 2. Top Purchase Area */}
        <ProductPurchaseHero
          product={productData}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />

        {/* 3. Promotional Offers & Bank Deals Strip */}
        <ProductOffersStrip />

        {/* 4. Frequently Bought Together */}
        <FrequentlyBoughtTogether
          mainProduct={{
            id: productData.id,
            title: productData.title,
            price: productData.basePrice,
            originalPrice: productData.originalPrice,
            image: productData.images[0],
          }}
          onAddBundleToCart={handleAddBundleToCart}
        />

        {/* 5. Comprehensive Overview, Specs, Seller Profile & Reviews */}
        <ProductFullSpecsAndReviews
          description={`Experience exceptional performance with the ${productData.title}. Engineered with premium materials, high-fidelity components, and direct seller warranty.`}
          features={features}
          specifications={specifications}
          sellerName={productData.sellerName}
          sellerTier={productData.sellerTier}
          otherSellers={otherSellers}
          rating={productData.rating}
          reviewsCount={productData.reviewsCount}
          onAddToCart={(sName, price) => {
            addToCartStorage({
              id: productData.id,
              title: productData.title,
              price,
              image: productData.images[0],
              sellerName: sName,
            });
            alert(`Added to cart from ${sName} at ₹${price}!`);
          }}
        />

        {/* 6. Similar & Recommended Products */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
              Similar Products Recommended for You
            </h3>
            <Link href="/storefront" className="text-xs font-bold text-[#404d85] hover:underline">
              Explore More Products →
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
              />
            ))}
          </div>
        </div>

      </div>
    </MarketplacePageWrapper>
  );
}
