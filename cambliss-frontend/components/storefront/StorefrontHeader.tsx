"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { StorefrontAnnouncementBar } from "./StorefrontAnnouncementBar";
import { StorefrontLocationSelector } from "./StorefrontLocationSelector";
import { StorefrontSearchBar } from "./StorefrontSearchBar";
import { StorefrontAccountDropdown } from "./StorefrontAccountDropdown";
import { StorefrontCategoriesBar } from "./StorefrontCategoriesBar";
import { StorefrontMobileDrawer } from "./StorefrontMobileDrawer";
import { StorefrontCartDrawer } from "./StorefrontCartDrawer";
import { getStoredCart, getStoredWishlist, formatINR } from "@/lib/cart-wishlist";

export const StorefrontHeader = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const updateCounts = () => {
    const cart = getStoredCart();
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setCartItemsCount(totalCount);
    setCartSubtotal(subtotal);

    const wishlist = getStoredWishlist();
    setWishlistCount(wishlist.length);
  };

  useEffect(() => {
    updateCounts();
    window.addEventListener("oc_cart_updated", updateCounts);
    window.addEventListener("oc_wishlist_updated", updateCounts);
    return () => {
      window.removeEventListener("oc_cart_updated", updateCounts);
      window.removeEventListener("oc_wishlist_updated", updateCounts);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      
      {/* 1. Slim Announcement Bar */}
      <StorefrontAnnouncementBar />

      {/* 2. Main Desktop Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        
        {/* DESKTOP & TABLET ROW */}
        <div className="flex items-center justify-between gap-3 md:gap-4">
          
          {/* LEFT: Mobile Menu Trigger + Logo + Delivery Selector */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Drawer Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden h-9 w-9 rounded-[6px] border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 text-base font-bold transition"
              aria-label="Open Navigation Menu"
            >
              ☰
            </button>

            {/* Marketplace Wordmark Logo */}
            <Link href="/storefront" className="shrink-0 flex items-center group">
              <Image
                src="/officeconnectlogo.png"
                alt="Office Connect Marketplace"
                width={180}
                height={40}
                priority
                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-102"
              />
            </Link>

            {/* Location / Delivery Selector (Desktop / Tablet) */}
            <div className="hidden lg:block ml-1 border-l border-slate-200 pl-3">
              <StorefrontLocationSelector />
            </div>
          </div>

          {/* CENTER: Primary Search Bar (Hidden on small mobile, rendered below) */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <StorefrontSearchBar />
          </div>

          {/* RIGHT: Actions (Wishlist, Account, Cart) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Wishlist Button */}
            <Link
              href="/wishlist"
              aria-label="View Wishlist"
              className="relative hidden sm:flex items-center gap-1.5 h-9 px-2.5 rounded-[6px] hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-700 transition font-bold text-xs select-none group"
            >
              <span className="text-sm text-slate-600 group-hover:text-red-600 transition">♥</span>
              <span className="hidden xl:inline text-slate-800">Wishlist</span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-red-700 text-[10px] font-black">
                {wishlistCount}
              </span>
            </Link>

            {/* Account Controls */}
            <StorefrontAccountDropdown />

            {/* Header Cart Bag Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label="View Cart Bag"
              className="flex items-center gap-2 h-9 px-3 rounded-[6px] bg-[#404d85]/10 border border-[#404d85]/20 text-[#404d85] hover:bg-[#404d85]/15 transition font-bold text-xs select-none shadow-2xs"
            >
              <span className="text-base">🛒</span>
              <span className="hidden sm:inline font-extrabold text-slate-900">Cart</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#404d85] text-[10px] font-black text-white">
                {cartItemsCount}
              </span>
              <span className="hidden xl:inline text-slate-500 font-normal">{formatINR(cartSubtotal)}</span>
            </button>

          </div>

        </div>

        {/* MOBILE ROW 2: Search Bar */}
        <div className="md:hidden pt-2.5">
          <StorefrontSearchBar />
        </div>

        {/* MOBILE ROW 3: Delivery Location (Compact) */}
        <div className="lg:hidden pt-2 flex items-center justify-between border-t border-slate-100 mt-2">
          <StorefrontLocationSelector />
          <Link href="/seller-central" className="text-[11px] text-[#404d85] font-bold hover:underline">
            Sell with Us →
          </Link>
        </div>

      </div>

      {/* 3. Category Navigation Ribbon (Desktop / Tablet) */}
      <StorefrontCategoriesBar />

      {/* 4. Mobile Drawer Navigation */}
      <StorefrontMobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* 5. Cart Drawer Component */}
      <StorefrontCartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

    </header>
  );
};
