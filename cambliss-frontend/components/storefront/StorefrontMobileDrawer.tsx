"use client";

import { useState } from "react";
import Link from "next/link";

export const StorefrontMobileDrawer = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>("electronics");

  if (!isOpen) return null;

  const categories = [
    {
      id: "electronics",
      title: "Electronics & Audio",
      items: ["Over-Ear Headphones", "True Wireless Earbuds", "Soundbars", "Laptops & IT"],
    },
    {
      id: "mobiles",
      title: "Mobiles & Tablets",
      items: ["Flagship 5G Phones", "Fast Chargers", "Protective Cases", "Smartwatches"],
    },
    {
      id: "fashion",
      title: "Fashion & Apparel",
      items: ["Men's Oversized Tees", "Formal Cotton Shirts", "Women's Ethnic", "Sneakers"],
    },
    {
      id: "home",
      title: "Home & Kitchen",
      items: ["Cast Iron Cookware", "Espresso Machines", "Air Fryers", "Ergonomic Chairs"],
    },
    {
      id: "beauty",
      title: "Beauty & Personal Care",
      items: ["Botanical Hydrating Serums", "SPF 50+ Sunscreens", "Organic Shampoo"],
    },
    {
      id: "grocery",
      title: "Grocery & Gourmet",
      items: ["Single-Estate Coffee", "Extra Virgin Olive Oil", "Artisan Chocolates"],
    },
    {
      id: "automotive",
      title: "Automotive Spares",
      items: ["Synthetic Engine Oil", "Dash Cameras", "Tire Inflators"],
    },
  ];

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden z-10 animate-in slide-in-from-left duration-200">
        
        {/* Header */}
        <div className="bg-[#1f2430] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#404d85] flex items-center justify-center text-sm font-black text-white">
              👤
            </div>
            <div>
              <div className="font-bold text-xs">Welcome, Alex</div>
              <div className="text-[10px] text-slate-400">Standard Buyer Account</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs select-none">
          
          {/* 1. SHOP BY DEPARTMENT */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="font-extrabold uppercase tracking-wider text-slate-400 text-[10px]">
                Shop By Department
              </span>
              <Link href="/categories" onClick={onClose} className="text-[#404d85] font-bold text-[10px] hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-1">
              {categories.map((cat) => (
                <div key={cat.id} className="border-b border-slate-50 last:border-0">
                  <button
                    type="button"
                    onClick={() => toggleSection(cat.id)}
                    className="w-full py-2 flex items-center justify-between font-bold text-slate-800 hover:text-[#404d85] text-left transition"
                  >
                    <span>{cat.title}</span>
                    <span className="text-slate-400 text-[10px]">
                      {expandedSection === cat.id ? "▲" : "▼"}
                    </span>
                  </button>

                  {expandedSection === cat.id && (
                    <div className="pl-3 pb-2 space-y-1.5 border-l-2 border-[#404d85]/30 ml-1">
                      {cat.items.map((sub, idx) => (
                        <Link
                          key={idx}
                          href={`/category/${cat.id}?sub=${encodeURIComponent(sub)}`}
                          onClick={onClose}
                          className="block text-slate-600 hover:text-[#404d85] py-0.5 text-xs font-medium"
                        >
                          {sub}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. CUSTOMER ACCOUNT */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <span className="font-extrabold uppercase tracking-wider text-slate-400 text-[10px] block pb-1 border-b border-slate-100">
              My Account & Orders
            </span>
            <div className="space-y-1 font-semibold text-slate-700">
              <Link href="/orders" onClick={onClose} className="flex items-center gap-2.5 py-1.5 hover:text-[#404d85]">
                <span>📦</span>
                <span>Track & Return Orders</span>
              </Link>
              <Link href="/wishlist" onClick={onClose} className="flex items-center gap-2.5 py-1.5 hover:text-[#404d85]">
                <span>♥</span>
                <span>Saved Wishlist (4)</span>
              </Link>
              <Link href="/account?tab=addresses" onClick={onClose} className="flex items-center gap-2.5 py-1.5 hover:text-[#404d85]">
                <span>📍</span>
                <span>Delivery Addresses</span>
              </Link>
              <Link href="/account" onClick={onClose} className="flex items-center gap-2.5 py-1.5 hover:text-[#404d85]">
                <span>⚙️</span>
                <span>Account Settings</span>
              </Link>
            </div>
          </div>

          {/* 3. HELP & POLICIES */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <span className="font-extrabold uppercase tracking-wider text-slate-400 text-[10px] block pb-1 border-b border-slate-100">
              Help & Customer Support
            </span>
            <div className="space-y-1 font-semibold text-slate-700">
              <Link href="/support" onClick={onClose} className="flex items-center gap-2.5 py-1.5 hover:text-[#404d85]">
                <span>💬</span>
                <span>24x7 Help Center</span>
              </Link>
              <Link href="/returns" onClick={onClose} className="flex items-center gap-2.5 py-1.5 hover:text-[#404d85]">
                <span>🔄</span>
                <span>Returns & Refund Policy</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Footer Merchant Callout */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
          <Link
            href="/vendor-dashboard"
            onClick={onClose}
            className="w-full py-2 px-3 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
          >
            <span>🏬</span> Seller Portal Access
          </Link>
        </div>

      </div>
    </div>
  );
};
