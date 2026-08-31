"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export const StorefrontAccountDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-9 px-3 rounded-[6px] text-xs font-bold text-slate-700 hover:bg-slate-100 transition select-none"
      >
        <span className="text-sm">👤</span>
        <div className="text-left hidden lg:block leading-tight">
          <span className="text-[10px] text-slate-400 block font-normal">Welcome,</span>
          <span>Account & Lists ▾</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-64 rounded-[8px] bg-white border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 text-xs space-y-3">
          <div className="p-2.5 rounded-[6px] bg-slate-50 border border-slate-100 text-center space-y-2">
            <span className="text-slate-600 block text-[11px]">Sign in for personalized recommendations</span>
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="inline-block w-full py-2 px-3 rounded-[6px] bg-[#404d85] text-white font-bold text-xs hover:bg-[#323d6a] transition"
            >
              Sign In / Register
            </Link>
          </div>

          <div className="border-t border-slate-100 pt-2 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
              Customer Account
            </span>
            <Link
              href="/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium"
            >
              <span>📦 Your Orders</span>
              <span className="text-slate-400 text-[10px]">Track & Return</span>
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium"
            >
              <span>♥ Your Wishlist</span>
            </Link>
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium"
            >
              <span>⚙️ Account Settings</span>
            </Link>
          </div>

          <div className="border-t border-slate-100 pt-2 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
              Merchant Portals
            </span>
            <Link
              href="/vendor-dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2 py-1.5 rounded bg-blue-50/50 hover:bg-blue-50 text-[#404d85] font-bold"
            >
              <span>🏬 3P Seller Portal</span>
              <span className="text-[10px] font-bold">Access ↗</span>
            </Link>
            <Link
              href="/admin-dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 text-slate-700 font-semibold"
            >
              <span>👑 Platform Admin</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
