"use client";

import { ReactNode } from "react";
import { StorefrontHeader } from "./StorefrontHeader";
import { StorefrontFooter } from "./StorefrontFooter";
import { StorefrontMobileBottomNav } from "./StorefrontMobileBottomNav";

export const StorefrontShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-[#0f172a] flex flex-col antialiased selection:bg-[#404d85] selection:text-white">
      {/* Global Header */}
      <StorefrontHeader />

      {/* Main View Area */}
      <main className="flex-1 w-full">{children}</main>

      {/* Global Footer */}
      <StorefrontFooter />

      {/* Mobile Fixed Bottom Bar */}
      <StorefrontMobileBottomNav onOpenCart={() => {}} />
    </div>
  );
};
