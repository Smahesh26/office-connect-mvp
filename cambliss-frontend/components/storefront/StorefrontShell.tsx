"use client";

import { ReactNode } from "react";
import { StorefrontHeader } from "./StorefrontHeader";
import { StorefrontFooter } from "./StorefrontFooter";
import { StorefrontMobileBottomNav } from "./StorefrontMobileBottomNav";

export interface StorefrontShellProps {
  children: ReactNode;
  showAnnouncement?: boolean;
  showCategoryBar?: boolean;
}

export const StorefrontShell = ({
  children,
}: StorefrontShellProps) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-[#0f172a] flex flex-col antialiased selection:bg-[#404d85] selection:text-white">
      
      {/* 1. Global Header (Includes Announcement Bar, Location Selector, Search, Account, Wishlist, Cart, Mega Menu & Mobile Drawer) */}
      <StorefrontHeader />

      {/* 2. Main Page Content Viewport */}
      <main className="flex-1 w-full">{children}</main>

      {/* 3. Global Marketplace Footer */}
      <StorefrontFooter />

      {/* 4. Mobile Fixed Bottom Navigation */}
      <StorefrontMobileBottomNav onOpenCart={() => {}} />

    </div>
  );
};
