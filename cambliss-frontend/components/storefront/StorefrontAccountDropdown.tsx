"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export const StorefrontAccountDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Sample UI state
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 h-9 px-3 rounded-[6px] text-xs font-bold text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition select-none group"
      >
        <span className="text-sm text-[#404d85] group-hover:scale-110 transition">👤</span>
        <div className="text-left hidden lg:block leading-tight min-w-0">
          <span className="text-[10px] text-slate-500 block font-normal truncate">
            {isLoggedIn ? "Hello, Alex" : "Account"}
          </span>
          <span className="text-xs font-bold text-slate-900 truncate">
            {isLoggedIn ? "My Account ▾" : "Sign In ▾"}
          </span>
        </div>
      </button>

      {/* Account Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-[8px] bg-white border border-slate-200 shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs space-y-3">
          
          {/* Status Header */}
          {isLoggedIn ? (
            <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-slate-900 text-xs">Alex Johnson</div>
                <div className="text-[11px] text-slate-500 truncate">alex.johnson@example.com</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                PRO BUYER
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-100 text-center space-y-2">
              <span className="text-slate-600 block text-[11px]">Sign in for personalized orders & addresses</span>
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 px-3 rounded-[6px] bg-[#404d85] text-white font-bold text-xs hover:bg-[#323d6a] text-center transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 px-3 rounded-[6px] bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 text-center transition"
                >
                  Register
                </Link>
              </div>
            </div>
          )}

          {/* Customer Navigation Links */}
          <div className="border-t border-slate-100 pt-2 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
              Customer Account
            </span>
            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium"
            >
              <span>👤 My Account Overview</span>
            </Link>
            <Link
              href="/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium"
            >
              <span>📦 Orders & Tracking</span>
              <span className="text-slate-400 text-[10px]">Track & Return</span>
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium"
            >
              <span>♥ Saved Wishlist</span>
              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 rounded">4</span>
            </Link>
            <Link
              href="/account?tab=addresses"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium"
            >
              <span>📍 Saved Addresses</span>
            </Link>
            <Link
              href="/account?tab=reviews"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium"
            >
              <span>⭐ Product Reviews</span>
            </Link>
            <Link
              href="/account?tab=notifications"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium"
            >
              <span>🔔 Notifications</span>
              <span className="w-2 h-2 rounded-full bg-[#404d85]" />
            </Link>
            <Link
              href="/support"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium"
            >
              <span>💬 Help & Support</span>
            </Link>
          </div>

          {/* Switch Mock Login State for UI Testing */}
          <div className="border-t border-slate-100 pt-2 flex items-center justify-between px-2">
            <span className="text-[10px] text-slate-400 font-medium">Toggle Demo Auth State:</span>
            <button
              type="button"
              onClick={() => setIsLoggedIn(!isLoggedIn)}
              className="text-[10px] font-bold text-[#404d85] hover:underline"
            >
              {isLoggedIn ? "Switch to Logged Out" : "Switch to Logged In"}
            </button>
          </div>

          {/* Merchant Shortcuts */}
          <div className="border-t border-slate-100 pt-2 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
              Marketplace Portals
            </span>
            <Link
              href="/vendor-dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded bg-blue-50/50 hover:bg-blue-50 text-[#404d85] font-bold"
            >
              <span>🏬 3P Seller Portal</span>
              <span className="text-[10px]">Access ↗</span>
            </Link>
            <Link
              href="/admin-dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-slate-50 text-slate-700 font-semibold"
            >
              <span>👑 Platform Admin</span>
            </Link>
          </div>

          {isLoggedIn && (
            <div className="border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLoggedIn(false);
                  setIsOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded font-semibold text-xs transition"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
