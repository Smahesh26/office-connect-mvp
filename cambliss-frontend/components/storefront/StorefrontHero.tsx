"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export const StorefrontHero = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      badge: "OFFICIAL CATALOG",
      title: "Enterprise Computing & Cloud Hardware",
      subtitle: "Direct manufacturer pricing from verified IT distributors across India & global markets.",
      bullets: ["Same-Day Warehouse Dispatch", "Encrypted Payment Protection", "Official GST Tax Invoice"],
      ctaPrimary: { label: "Shop Computing Offers", href: "/category/computing" },
      ctaSecondary: { label: "Browse AeroTech Flagship Store", href: "/store/aerotech" },
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80",
    },
    {
      badge: "FRENCH LUXURY ORGANICS",
      title: "Botanical Skincare Direct from Grasse",
      subtitle: "Cold-pressed Damask Rose elixirs, certified organic serums, and clinical botanicals.",
      bullets: ["Direct from French Laboratories", "100% Authenticity Verified", "Cruelty-Free & Vegan"],
      ctaPrimary: { label: "Explore Glow Beauty Store", href: "/store/glow-beauty" },
      ctaSecondary: { label: "View All Skincare", href: "/category/beauty" },
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[activeSlide];

  return (
    <section className="border-b border-slate-200 pb-10 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Editorial Copy */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black tracking-widest text-[#404d85] uppercase border-b-2 border-[#404d85] pb-0.5">
              {slide.badge}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-semibold">Verified Multi-Vendor Commerce</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]">
            {slide.title}
          </h1>

          <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
            {slide.subtitle}
          </p>

          {/* Bulleted trust points */}
          <div className="flex flex-wrap gap-4 pt-1 text-xs font-semibold text-slate-700">
            {slide.bullets.map((b, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>{b}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Link
              href={slide.ctaPrimary.href}
              className="px-6 py-3 rounded-[6px] bg-[#404d85] text-white font-bold text-xs hover:bg-[#323d6a] transition shadow-xs"
            >
              {slide.ctaPrimary.label} →
            </Link>
            <Link
              href={slide.ctaSecondary.href}
              className="px-5 py-3 rounded-[6px] border border-slate-300 bg-white text-slate-800 font-bold text-xs hover:bg-slate-50 transition"
            >
              {slide.ctaSecondary.label} ↗
            </Link>
          </div>

          {/* Slide Indicator Line */}
          <div className="flex items-center gap-2 pt-4">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1 transition-all duration-300 rounded-full ${
                  activeSlide === idx ? "w-10 bg-[#404d85]" : "w-3 bg-slate-200 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Composition Media */}
        <div className="lg:col-span-5 relative aspect-4/3 rounded-[8px] overflow-hidden bg-slate-100 border border-slate-200">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
          <div className="absolute bottom-3 right-3 bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-[4px] backdrop-blur-xs">
            Direct Merchant Fulfillment
          </div>
        </div>

      </div>
    </section>
  );
};
