"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const StorefrontAccountDropdown = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>("Alex Johnson");
  const [userEmail, setUserEmail] = useState<string>("user@officeconnect.com");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("authToken");
      const rawUser = localStorage.getItem("authUser");
      if (token) {
        setIsLoggedIn(true);
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          setUserName(parsed.name || (parsed.email ? parsed.email.split("@")[0] : "Member"));
          setUserEmail(parsed.email || "user@officeconnect.com");
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (e) {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    } catch (e) {}
    setIsLoggedIn(false);
    setIsOpen(false);
    router.push("/login");
  };

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
            {isLoggedIn ? `Hello, ${userName}` : "Account"}
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
            <div className="space-y-2">
              <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="font-extrabold text-slate-900 text-xs truncate">{userName}</div>
                  <div className="text-[11px] text-slate-500 truncate">{userEmail}</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold shrink-0">
                  CONNECTED
                </span>
              </div>

              {/* DIRECT GO TO DASHBOARD BUTTON */}
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="w-full py-2 px-3 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs text-center"
              >
                <span>🏢</span>
                <span>Go to Workspace Dashboard ⚡</span>
              </Link>
            </div>
          ) : (
            <div className="p-3 rounded-[6px] bg-slate-50 border border-slate-100 text-center space-y-2">
              <span className="text-slate-600 block text-[11px]">Sign in to access your dashboard & orders</span>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="py-2 px-2.5 rounded-[6px] bg-[#404d85] text-white font-bold text-xs hover:bg-[#323d6a] text-center transition shadow-2xs"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="py-2 px-2.5 rounded-[6px] bg-white border border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-50 text-center transition"
                >
                  Register
                </Link>
              </div>
              <Link
                href="/seller-central"
                onClick={() => setIsOpen(false)}
                className="w-full py-1.5 px-2 rounded-[6px] bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[11px] hover:bg-amber-100 flex items-center justify-center gap-1.5 transition block"
              >
                <span>🏬</span>
                <span>Sell on Office Connect (0% Fee) →</span>
              </Link>
            </div>
          )}

          {/* Customer Navigation Links */}
          <div className="border-t border-slate-100 pt-2 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
              Customer Account
            </span>
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
              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 rounded">Saved</span>
            </Link>
          </div>

          {/* Platform & Seller Portals */}
          <div className="border-t border-slate-100 pt-2 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
              Workspace & Seller Hub
            </span>
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded bg-indigo-50/70 hover:bg-indigo-100/70 text-[#404d85] font-bold"
            >
              <span>🏢 Main Dashboard</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-200/60 text-[#404d85] font-extrabold">Open ↗</span>
            </Link>
            <Link
              href="/seller-central"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded bg-violet-50 hover:bg-violet-100/70 text-violet-900 font-bold"
            >
              <span>📋 Seller Central Hub</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-200/60 text-violet-800 font-extrabold">Portal</span>
            </Link>
            <Link
              href="/vendor-dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-slate-50 text-slate-700 font-semibold"
            >
              <span>🏬 3P Vendor Store</span>
              <span className="text-[10px]">Access ↗</span>
            </Link>
          </div>

          {isLoggedIn && (
            <div className="border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={handleSignOut}
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
