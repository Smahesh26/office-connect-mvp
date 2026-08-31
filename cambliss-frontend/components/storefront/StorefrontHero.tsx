"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export const StorefrontHero = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      badge: "✨ MEGA MARKETPLACE SALE",
      title: "Enterprise Computing & Cloud Hardware",
      description: "Direct manufacturer pricing from verified IT distributors. Get up to 25% off on enterprise servers, high-performance NVMe nodes, and computing gear.",
      ctaPrimary: { label: "Shop Computing Deals", href: "/category/computing" },
      ctaSecondary: { label: "Explore Verified IT Sellers", href: "/storefront?vendor=All" },
      tag: "48-Hour Dispatch SLA",
      gradient: "from-[#1f2430] via-[#252f5a] to-[#404d85]",
    },
    {
      badge: "🌸 LUXURY FRENCH BOTANICALS",
      title: "Glow Beauty Organics Flagship Boutique",
      description: "Direct from Grasse, France. Cold-pressed Damask Rose elixirs, certified organic serums, and clinical skincare with 100% authenticity guarantee.",
      ctaPrimary: { label: "Visit Glow Beauty Store", href: "/storefront?vendor=v-glow-beauty" },
      ctaSecondary: { label: "View Beauty Catalog", href: "/category/beauty" },
      tag: "Certified Organic & Vegan",
      gradient: "from-[#2e1065] via-[#4c1d95] to-[#7c3aed]",
    },
    {
      badge: "🚘 MOTORSPORT & INDUSTRIAL SPARES",
      title: "AutoCare Certified Performance Hub",
      description: "High-grade 5W-40 synthetic motor oils, ceramic brake systems, and workshop equipment backed by manufacturer warranty and express freight.",
      ctaPrimary: { label: "Shop AutoCare Store", href: "/storefront?vendor=v-autocare" },
      ctaSecondary: { label: "Browse Auto Catalog", href: "/category/automotive" },
      tag: "OEM Specification Certified",
      gradient: "from-[#0f172a] via-[#1e293b] to-[#334155]",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[activeSlide];

  return (
    <section className="relative rounded-[16px] overflow-hidden shadow-lg border border-slate-700 select-none">
      <div className={`bg-gradient-to-r ${slide.gradient} text-white p-8 sm:p-12 transition-all duration-700 min-h-[320px] flex flex-col justify-between`}>
        
        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 px-3.5 py-1 text-[11px] font-bold text-blue-200">
              {slide.badge}
            </span>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-300">
              ✓ {slide.tag}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white">
            {slide.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
            {slide.description}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={slide.ctaPrimary.href}
              className="px-5 py-2.5 rounded-[8px] bg-white text-[#404d85] font-black text-xs hover:bg-slate-100 transition shadow-md"
            >
              {slide.ctaPrimary.label} →
            </Link>
            <Link
              href={slide.ctaSecondary.href}
              className="px-5 py-2.5 rounded-[8px] border border-white/30 bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition"
            >
              {slide.ctaSecondary.label} ↗
            </Link>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="flex items-center gap-2 pt-6 z-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeSlide === idx ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
