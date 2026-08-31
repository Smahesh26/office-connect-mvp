"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { StorefrontSearchBar } from "./StorefrontSearchBar";
import { StorefrontAccountDropdown } from "./StorefrontAccountDropdown";
import { StorefrontCartDrawer } from "./StorefrontCartDrawer";
import { StorefrontCategoriesBar } from "./StorefrontCategoriesBar";

export const StorefrontHeader = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      {/* Top Utility Bar */}
      <div className="bg-[#1f2430] text-slate-300 px-4 sm:px-6 py-1.5 text-[11px] font-medium border-b border-[#252f5a]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-blue-200">
            <span>🚚 Express 48-Hour Delivery Across All Verified Stores</span>
            <span className="hidden lg:inline text-slate-400">• 100% Stripe & Razorpay Escrow Protection</span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <span className="hidden sm:inline">Currency: <strong>INR (₹)</strong></span>
            <span className="hidden sm:inline">|</span>
            <Link href="/seller-central" className="text-amber-300 font-bold hover:underline">
              Sell on Office Connect
            </Link>
            <span>|</span>
            <Link href="/login" className="hover:text-white font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Mobile Drawer Trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden h-9 w-9 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-700 text-base font-bold"
          aria-label="Toggle Navigation Menu"
        >
          ☰
        </button>

        {/* Brand Logo */}
        <Link href="/storefront" className="shrink-0 flex items-center">
          <Image
            src="/officeconnectlogo.png"
            alt="Office Connect"
            width={200}
            height={50}
            priority
            className="h-9 sm:h-11 w-auto object-contain"
          />
        </Link>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-2xl hidden md:block">
          <StorefrontSearchBar />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Account Controls */}
          <StorefrontAccountDropdown />

          {/* Cart Bag Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 h-9 px-3.5 rounded-[6px] bg-[#404d85]/10 border border-[#404d85]/20 text-[#404d85] hover:bg-[#404d85]/15 transition font-bold text-xs select-none"
          >
            <span className="text-base">🛒</span>
            <span className="hidden sm:inline">Bag</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#404d85] text-[10px] font-black text-white">
              0
            </span>
          </button>
        </div>

      </div>

      {/* Mobile Search Bar (Visible on mobile screens) */}
      <div className="md:hidden px-4 pb-3">
        <StorefrontSearchBar />
      </div>

      {/* Secondary Categories Bar */}
      <StorefrontCategoriesBar />

      {/* Cart Drawer */}
      <StorefrontCartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Mobile Slide-Over Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 bottom-0 left-0 w-4/5 max-w-xs bg-white p-6 shadow-2xl z-10 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <Image src="/officeconnectlogo.png" alt="Office Connect" width={140} height={35} className="h-7 w-auto" />
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 text-lg font-bold p-1">✕</button>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Departments</h4>
                <div className="space-y-1 font-bold text-xs text-slate-800">
                  <Link href="/category/electronics" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded hover:bg-slate-50">⚡ Electronics & Audio</Link>
                  <Link href="/category/beauty" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded hover:bg-slate-50">🌸 Skincare & Cosmetics</Link>
                  <Link href="/category/cloud" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded hover:bg-slate-50">☁️ Cloud Servers & SaaS</Link>
                  <Link href="/category/automotive" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded hover:bg-slate-50">🚘 Auto Motors & Spares</Link>
                  <Link href="/storefront?vendor=All" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded hover:bg-slate-50">🏬 Verified Stores Directory</Link>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account & Merchant</h4>
                <div className="space-y-1 font-semibold text-xs text-slate-700">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded hover:bg-slate-50">🔑 Customer Sign In</Link>
                  <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded hover:bg-slate-50">📦 My Orders</Link>
                  <Link href="/vendor-dashboard" onClick={() => setMobileMenuOpen(false)} className="block p-2 rounded bg-blue-50 text-[#404d85] font-bold">🏬 3P Seller Portal</Link>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-4">
              Office Connect Multi-Vendor v2.0
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
