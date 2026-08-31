"use client";

import Link from "next/link";

export const StorefrontFeaturedStores = () => {
  const stores = [
    {
      id: "v-office-direct",
      name: "Office Connect Direct 👑",
      tagline: "Official 1P Flagship Store for Hardware, Smartwear & Cloud Infrastructure",
      badge: "PLATFORM FLAGSHIP",
      rating: 5.0,
      reviewsCount: 520,
      productsCount: 4,
      salesCount: "1,200+ Sales",
      location: "Global Platform HQ 🌐",
      banner: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "v-glow-beauty",
      name: "Glow Beauty Organics 🌸",
      tagline: "Luxury French organic skincare, cold-pressed rose extracts & botanical balms",
      badge: "VERIFIED MERCHANT",
      rating: 5.0,
      reviewsCount: 310,
      productsCount: 2,
      salesCount: "840+ Sales",
      location: "Paris, France 🇫🇷",
      banner: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "v-acme-cloud",
      name: "Acme Cloud Corp ☁️",
      tagline: "Enterprise Kubernetes NVMe server clusters & dedicated private VPS hosting",
      badge: "VERIFIED MERCHANT",
      rating: 4.8,
      reviewsCount: 94,
      productsCount: 1,
      salesCount: "420+ Sales",
      location: "Munich, Germany 🇩🇪",
      banner: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "v-autocare",
      name: "AutoCare Spares 🚘",
      tagline: "High-performance synthetic motor oils, ceramic brake pads & workshop tools",
      badge: "VERIFIED MERCHANT",
      rating: 4.8,
      reviewsCount: 88,
      productsCount: 1,
      salesCount: "310+ Sales",
      location: "Detroit, USA 🇺🇸",
      banner: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <section className="space-y-6 pt-4 border-t border-slate-200 select-none">
      <div className="flex items-end justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900">Featured Verified Stores</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Certified merchant storefronts with dedicated catalog, direct warranty, and buyer escrow
          </p>
        </div>
        <Link href="/storefront?vendor=All" className="text-xs font-bold text-[#404d85] hover:underline">
          View All 48 Stores →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stores.map((s) => (
          <div
            key={s.id}
            className="border border-slate-200 rounded-[8px] bg-white overflow-hidden hover:border-slate-400 transition-all flex flex-col justify-between group"
          >
            <div className="relative h-28 bg-slate-100 overflow-hidden border-b border-slate-100">
              <img
                src={s.banner}
                alt={s.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 rounded bg-slate-900/90 text-white px-2 py-0.5 text-[9px] font-extrabold backdrop-blur-xs">
                {s.badge}
              </span>
            </div>

            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#404d85] transition">
                  {s.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {s.tagline}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px] font-medium">{s.location}</span>
                  <span className="font-bold text-amber-600">★ {s.rating} ({s.reviewsCount})</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{s.productsCount} Active Products</span>
                  <span className="font-semibold text-emerald-600">{s.salesCount}</span>
                </div>

                <Link
                  href={`/storefront?vendor=${s.id}`}
                  className="block w-full py-2 rounded-[6px] bg-slate-50 hover:bg-[#404d85] text-slate-800 hover:text-white text-center font-bold text-xs transition border border-slate-200"
                >
                  Visit Storefront →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
