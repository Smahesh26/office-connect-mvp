"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { SearchBar } from "./SearchBar";

export function StorefrontHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[var(--border)]">
      {/* Top utility bar */}
      <div className="bg-[var(--brand-900)] text-[var(--brand-100)] text-[11px] py-1.5 px-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <span className="font-medium">
            Free shipping on orders above ₹999
          </span>
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/seller-central"
              className="hover:text-white transition-colors"
            >
              Sell on Office Connect
            </Link>
            <span className="text-[var(--brand-400)]">·</span>
            <Link
              href="/login"
              className="hover:text-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-[1280px] mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="/officeconnectlogo.png"
            alt="Office Connect"
            width={160}
            height={40}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* Search — hidden on mobile, shown md+ */}
        <div className="hidden md:block flex-1 max-w-xl">
          <SearchBar />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium text-[var(--body)] hover:text-[var(--ink)] transition-colors"
          >
            <UserIcon />
            <span>Account</span>
          </Link>
          <button
            className="relative inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium text-[var(--body)] hover:text-[var(--ink)] transition-colors"
            aria-label="Shopping bag"
          >
            <BagIcon />
            <span className="hidden sm:inline">Bag</span>
            {/* Cart count badge — hardcoded 0 for now */}
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center h-9 w-9 text-[var(--body)]"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile search — shown only on small screens */}
      <div className="md:hidden px-4 pb-3">
        <SearchBar />
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-[var(--border)] bg-white px-4 py-3 space-y-1">
          <Link
            href="/login"
            className="block py-2 text-[14px] text-[var(--body)] hover:text-[var(--ink)]"
            onClick={() => setMobileMenuOpen(false)}
          >
            Sign In / Register
          </Link>
          <Link
            href="/seller-central"
            className="block py-2 text-[14px] text-[var(--body)] hover:text-[var(--ink)]"
            onClick={() => setMobileMenuOpen(false)}
          >
            Sell on Office Connect
          </Link>
        </nav>
      )}
    </header>
  );
}

/* ---- Inline SVG icons (small, no external dep) ---- */

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
