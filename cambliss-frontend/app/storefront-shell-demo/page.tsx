"use client";

import { StorefrontShell } from "@/components/storefront/StorefrontShell";

export default function StorefrontShellDemoPage() {
  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12 select-none pb-24 lg:pb-16">
        
        {/* Phase 3 Scope Notice Banner */}
        <div className="p-4 rounded-[8px] bg-amber-50 border border-amber-200 flex items-start gap-3">
          <span className="text-xl">ℹ️</span>
          <div>
            <h3 className="font-extrabold text-amber-950 text-sm">
              Phase 3 — Storefront Shell & Navigation Inspection Route
            </h3>
            <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
              This page showcases the global customer-facing storefront shell (Announcement Bar, Location Selector, Search, Account Dropdown, Wishlist, Cart with 2-digit badge, Desktop Mega-Menu, Mobile Navigation Drawer, Sticky Behavior, and Footer). The neutral blocks below are temporary placeholder blocks strictly for testing scroll behavior, viewport heights, and responsive breakpoints.
            </p>
          </div>
        </div>

        {/* 1. Placeholder Hero Area */}
        <section className="h-64 sm:h-80 rounded-[8px] border-2 border-dashed border-slate-300 bg-slate-100 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
          <span className="text-2xl mb-2">🖼️</span>
          <h4 className="font-extrabold text-slate-700 text-sm">Temporary Hero Banner Placeholder</h4>
          <p className="text-xs text-slate-400 max-w-md mt-1">
            Reserved for future campaign slider & category spotlights (Phase 4). Test sticky navigation and search bar while scrolling past this section.
          </p>
        </section>

        {/* 2. Placeholder Category Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
              Temporary Category Ribbon Placeholder
            </h4>
            <span className="text-xs text-slate-400">Neutral Test Grid</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {["Electronics", "Mobiles", "Fashion", "Home & Kitchen", "Beauty", "Automotive"].map((cat, i) => (
              <div
                key={i}
                className="h-28 rounded-[8px] border border-slate-200 bg-white p-3 flex flex-col items-center justify-center text-center shadow-2xs hover:border-slate-300 transition"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 mb-2">
                  #{i + 1}
                </div>
                <span className="text-xs font-bold text-slate-800">{cat}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Placeholder Product Rails */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
              Temporary Product Rail Placeholder (Scroll Test)
            </h4>
            <span className="text-xs text-slate-400">4-Column Grid Viewport Test</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="rounded-[8px] border border-slate-200 bg-white p-4 space-y-3 shadow-2xs"
              >
                <div className="aspect-square rounded-[6px] bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                  Product Card Placeholder #{item}
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </StorefrontShell>
  );
}
