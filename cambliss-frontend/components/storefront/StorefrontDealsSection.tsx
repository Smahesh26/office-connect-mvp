"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/commerce/CommercePrimitives";

export const StorefrontTopDeals = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dealProducts = [
    {
      id: "deal-1",
      title: "Damask Rose Botanical Hydrating Serum (50ml)",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
      price: 2499,
      originalPrice: 3200,
      sellerName: "Glow Beauty Organics 🌸",
      sellerTier: "premium" as const,
      badge: "🔥 22% OFF",
      rating: 5.0,
      reviewsCount: 310,
    },
    {
      id: "deal-2",
      title: "Wireless ANC Noise-Cancelling Headphones Hi-Res Audio",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
      price: 18990,
      originalPrice: 22490,
      sellerName: "Office Connect Direct 👑",
      sellerTier: "premium" as const,
      badge: "⚡ 15% OFF",
      rating: 4.9,
      reviewsCount: 420,
    },
    {
      id: "deal-3",
      title: "Organic Damask Rose Lip Elixir Shine Balm",
      image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80",
      price: 1200,
      originalPrice: 1500,
      sellerName: "Glow Beauty Organics 🌸",
      sellerTier: "premium" as const,
      badge: "🔥 20% OFF",
      rating: 4.9,
      reviewsCount: 140,
    },
    {
      id: "deal-4",
      title: "5W-40 Fully Synthetic Engine Motor Oil (5 Liters)",
      image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80",
      price: 3200,
      originalPrice: 3800,
      sellerName: "AutoCare Motors 🚘",
      sellerTier: "verified" as const,
      badge: "⚡ 16% OFF",
      rating: 4.8,
      reviewsCount: 88,
    },
  ];

  return (
    <section className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <h2 className="text-xl font-black text-slate-900">Today's Flash Deals & Limited Offers</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct-from-brand discounts refreshed daily with verified stock allocation
          </p>
        </div>

        {/* Minimalist Countdown Timer */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="text-slate-500">Sale Ends In:</span>
          <div className="flex items-center gap-1 font-mono text-xs">
            <span className="bg-slate-900 text-white px-2 py-1 rounded-[4px]">
              {String(timeLeft.hours).padStart(2, "0")}h
            </span>
            <span>:</span>
            <span className="bg-slate-900 text-white px-2 py-1 rounded-[4px]">
              {String(timeLeft.minutes).padStart(2, "0")}m
            </span>
            <span>:</span>
            <span className="bg-red-600 text-white px-2 py-1 rounded-[4px]">
              {String(timeLeft.seconds).padStart(2, "0")}s
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dealProducts.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            title={p.title}
            image={p.image}
            price={p.price}
            originalPrice={p.originalPrice}
            sellerName={p.sellerName}
            sellerTier={p.sellerTier}
            badge={p.badge}
            rating={p.rating}
            reviewsCount={p.reviewsCount}
            onAddToCart={() => alert(`Added "${p.title}" to bag!`)}
          />
        ))}
      </div>
    </section>
  );
};
