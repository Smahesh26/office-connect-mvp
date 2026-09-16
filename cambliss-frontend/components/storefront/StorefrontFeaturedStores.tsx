"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export const StorefrontFeaturedStores = () => {
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    // Check if any registered merchant has an active store in localStorage or API
    try {
      const allSubmitted = localStorage.getItem("officeconnect_submitted_applications");
      if (allSubmitted) {
        const list = JSON.parse(allSubmitted);
        const approved = list.filter((a: any) => a.status === "Approved");
        if (approved.length > 0) {
          setStores(
            approved.map((a: any) => ({
              id: a.id || a.applicationId,
              slug: a.storeSlug || "store",
              name: a.tradeName || a.businessName,
              tagline: `Official verified merchant store for ${a.category || "merchandise"}.`,
              badge: "VERIFIED MERCHANT",
              rating: 5.0,
              reviewsCount: 0,
              productsCount: 0,
              salesCount: "Verified Merchant",
              location: `${a.warehouseCity || "India"}, India`,
              banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
            }))
          );
        }
      }
    } catch (e) {}
  }, []);

  return (
    <section className="space-y-6 pt-4 border-t border-slate-200 select-none">
      <div className="flex items-end justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900">Verified Merchant Stores</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated merchant storefronts with standalone product catalogs, legal business profiles & direct warranties
          </p>
        </div>
        <Link href="/seller-central" className="text-xs font-bold text-[#404d85] hover:underline">
          Launch Your Storefront →
        </Link>
      </div>

      {stores.length === 0 ? (
        <div className="p-8 rounded-[8px] border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#404d85]">
              DIRECT-TO-MERCHANT STOREFRONTS
            </span>
            <h3 className="font-extrabold text-sm text-slate-900">
              Only Registered Merchant Accounts Will Appear Here
            </h3>
            <p className="text-xs text-slate-500 max-w-xl">
              Register your business on Office Connect to get your own branded URL (/store/[slug]), verified business badge, and direct payout escrow desk.
            </p>
          </div>
          <Link
            href="/seller-central"
            className="px-5 py-2.5 rounded-[6px] bg-[#404d85] text-white font-bold text-xs hover:bg-[#323d6a] transition shrink-0 inline-flex items-center gap-1.5"
          >
            <span>🏪</span> Register Your Store
          </Link>
        </div>
      ) : (
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
                  <Link href={`/store/${s.slug}`} className="block">
                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#404d85] transition">
                      {s.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {s.tagline}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">{s.location}</span>
                  <Link
                    href={`/store/${s.slug}`}
                    className="text-xs font-bold text-[#404d85] hover:underline"
                  >
                    Visit Store →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
