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

  const dealProducts: any[] = [];

  if (dealProducts.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <h2 className="text-xl font-black text-slate-900">Today&apos;s Flash Deals & Limited Offers</h2>
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
        {dealProducts.map((p: any) => (
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
