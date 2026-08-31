"use client";

import { useState } from "react";
import Link from "next/link";

export interface StorefrontAnnouncementBarProps {
  message?: string;
  linkText?: string;
  linkHref?: string;
  isDismissible?: boolean;
  isVisible?: boolean;
}

export const StorefrontAnnouncementBar = ({
  message = "⚡ Express 48-Hour Delivery Across All Verified Stores • Free Shipping on orders above ₹499",
  linkText = "Learn More",
  linkHref = "/returns",
  isDismissible = true,
  isVisible = true,
}: StorefrontAnnouncementBarProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isVisible || isDismissed) return null;

  return (
    <div
      role="region"
      aria-label="Marketplace Announcement"
      className="bg-[#1f2430] text-slate-300 border-b border-[#2b3242] px-4 sm:px-6 py-1.5 text-[11px] font-medium transition-all select-none"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left / Center Message */}
        <div className="flex-1 flex items-center justify-center sm:justify-start gap-2 truncate text-center sm:text-left">
          <span className="text-amber-400 font-bold hidden sm:inline">PROMO:</span>
          <span className="truncate text-slate-200">{message}</span>
          {linkText && linkHref && (
            <Link
              href={linkHref}
              className="text-[#8e9fc7] hover:text-white underline font-semibold ml-1 shrink-0 transition"
            >
              {linkText}
            </Link>
          )}
        </div>

        {/* Right Actions & Utilities */}
        <div className="hidden md:flex items-center gap-4 text-slate-400 shrink-0">
          <Link href="/seller-central" className="hover:text-amber-300 text-amber-400 font-semibold transition">
            Sell on Office Connect
          </Link>
          <span>•</span>
          <Link href="/support" className="hover:text-white transition">
            24x7 Help Desk
          </Link>
          <span>•</span>
          <span className="text-slate-300 font-semibold">INR (₹)</span>

          {isDismissible && (
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss announcement"
              className="ml-2 text-slate-400 hover:text-white p-0.5 rounded transition"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
