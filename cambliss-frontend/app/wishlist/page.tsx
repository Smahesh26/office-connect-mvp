"use client";

import { useState } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { ProductCard, ProductCardProps } from "@/components/commerce/CommercePrimitives";

export default function CustomerWishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<ProductCardProps[]>([
    {
      id: "prod-1",
      title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
      brand: "Sony",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
      price: 29990,
      originalPrice: 34990,
      sellerName: "Office Connect Direct",
      sellerTier: "premium",
      rating: 4.9,
      reviewsCount: 1420,
      stockQty: 24,
      deliveryEstimate: "FREE Delivery by Tomorrow",
      variant: "wishlist",
    },
    {
      id: "prod-3",
      title: "Keychron Q1 Pro Wireless Custom Mechanical Keyboard",
      brand: "Keychron",
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
      price: 16999,
      originalPrice: 19999,
      sellerName: "Mechanical Keyboards India",
      sellerTier: "verified",
      rating: 4.8,
      reviewsCount: 380,
      stockQty: 8,
      deliveryEstimate: "Express Delivery in 2 Days",
      variant: "wishlist",
    },
    {
      id: "prod-7",
      title: "Anker Prime 27,650mAh Power Bank (250W Fast Charger)",
      brand: "Anker",
      image: "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?auto=format&fit=crop&w=600&q=80",
      price: 14999,
      originalPrice: 17999,
      sellerName: "Anker Official India",
      sellerTier: "premium",
      rating: 4.9,
      reviewsCount: 680,
      stockQty: 22,
      deliveryEstimate: "FREE Delivery by Tomorrow",
      variant: "wishlist",
    },
  ]);

  const handleRemove = (id: string) => {
    setWishlistItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32 select-none">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/storefront" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Saved Wishlist</span>
        </nav>

        {/* Header */}
        <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Saved Wishlist ({wishlistItems.length} {wishlistItems.length === 1 ? "Item" : "Items"})
            </h1>
            <p className="text-xs text-slate-500">
              Saved items are monitored for merchant price drops, flash coupons, and stock replenish alerts
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <button
              type="button"
              onClick={() => alert("Added all in-stock wishlist items to cart!")}
              className="px-4 py-2 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs transition shadow-xs"
            >
              Add All to Shopping Bag →
            </button>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          /* Empty Wishlist */
          <div className="p-12 text-center border border-dashed border-slate-300 rounded-[8px] bg-slate-50 space-y-3">
            <span className="text-3xl">❤️</span>
            <h3 className="text-base font-black text-slate-900">Your wishlist is empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Save your favorite products while browsing to keep track of discounts and merchant offers.
            </p>
            <Link
              href="/categories"
              className="inline-block px-5 py-2 rounded-[4px] bg-[#404d85] text-white font-bold text-xs"
            >
              Explore Departments →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="relative">
                <ProductCard
                  id={item.id}
                  title={item.title}
                  brand={item.brand}
                  image={item.image}
                  price={item.price}
                  originalPrice={item.originalPrice}
                  sellerName={item.sellerName}
                  sellerTier={item.sellerTier}
                  rating={item.rating}
                  reviewsCount={item.reviewsCount}
                  stockQty={item.stockQty}
                  deliveryEstimate={item.deliveryEstimate}
                  variant="wishlist"
                  onAddToCart={() => alert(`Added "${item.title}" to bag!`)}
                />
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  aria-label="Remove from wishlist"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow-md text-slate-400 hover:text-red-600 flex items-center justify-center text-xs font-bold transition z-20"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </StorefrontShell>
  );
}
