"use client";

import Link from "next/link";
import { useState } from "react";

export const StorefrontCategoriesBar = () => {
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  const primaryCategories = [
    { label: "Electronics & Audio", href: "/category/electronics", icon: "⚡" },
    { label: "Skincare & Beauty", href: "/category/beauty", icon: "🌸" },
    { label: "Cloud Servers & SaaS", href: "/category/cloud", icon: "☁️" },
    { label: "Auto Motors & Spares", href: "/category/automotive", icon: "🚘" },
    { label: "Enterprise Computing", href: "/category/computing", icon: "💻" },
    { label: "Verified Stores", href: "/storefront?vendor=All", icon: "🏬" },
  ];

  return (
    <div className="bg-[#1f2430] text-slate-200 text-xs border-b border-slate-800 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        
        {/* Left Categories Links */}
        <div className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
          {/* Mega Menu Toggle */}
          <button
            type="button"
            onClick={() => setMegaMenuOpen(!megaMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] font-bold text-white hover:bg-slate-800 transition shrink-0"
          >
            <span>☰</span>
            <span>All Departments</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1 shrink-0" />

          {primaryCategories.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[4px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition shrink-0 whitespace-nowrap"
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </Link>
          ))}
        </div>

        {/* Right Help / Sell Links */}
        <div className="hidden md:flex items-center gap-4 text-[11px] font-semibold text-slate-300 shrink-0">
          <Link href="/vendor-dashboard" className="text-amber-300 hover:underline flex items-center gap-1">
            <span>📋 Become a Seller (5-Step KYC)</span>
          </Link>
          <span>|</span>
          <Link href="/support" className="hover:text-white transition">
            24x7 Help Desk
          </Link>
        </div>

      </div>

      {/* Mega Menu Dropdown */}
      {megaMenuOpen && (
        <div className="bg-white text-slate-900 border-b border-slate-200 shadow-2xl p-6 absolute left-0 right-0 z-40 animate-in fade-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-[#404d85] border-b border-slate-100 pb-1">
                ⚡ Electronics & Audio
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                <li><Link href="/category/electronics" onClick={() => setMegaMenuOpen(false)} className="hover:text-slate-900">ANC Wireless Headphones</Link></li>
                <li><Link href="/category/electronics" onClick={() => setMegaMenuOpen(false)} className="hover:text-slate-900">Titanium Smartwatches</Link></li>
                <li><Link href="/category/electronics" onClick={() => setMegaMenuOpen(false)} className="hover:text-slate-900">USB-C Fast Chargers</Link></li>
                <li><Link href="/category/electronics" onClick={() => setMegaMenuOpen(false)} className="hover:text-slate-900">Bluetooth Speakers</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-[#404d85] border-b border-slate-100 pb-1">
                🌸 Beauty & Skincare
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                <li><Link href="/category/beauty" onClick={() => setMegaMenuOpen(false)} className="hover:text-slate-900">Damask Rose Serums</Link></li>
                <li><Link href="/category/beauty" onClick={() => setMegaMenuOpen(false)} className="hover:text-slate-900">Organic Lip Elixirs</Link></li>
                <li><Link href="/category/beauty" onClick={() => setMegaMenuOpen(false)} className="hover:text-slate-900">Botanical Night Creams</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-[#404d85] border-b border-slate-100 pb-1">
                ☁️ Cloud Servers & SaaS
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                <li><Link href="/category/cloud" onClick={() => setMegaMenuOpen(false)} className="hover:text-slate-900">Kubernetes NVMe Nodes</Link></li>
                <li><Link href="/category/cloud" onClick={() => setMegaMenuOpen(false)} className="hover:text-slate-900">Dedicated Enterprise VPS</Link></li>
                <li><Link href="/category/cloud" onClick={() => setMegaMenuOpen(false)} className="hover:text-slate-900">Database Storage Clusters</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-[#404d85] border-b border-slate-100 pb-1">
                🚘 Motors & Auto Spares
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                <li><Link href="/category/automotive" onClick={() => setMegaMenuOpen(false)} className="hover:text-slate-900">Synthetic Motor Oils 5W-40</Link></li>
                <li><Link href="/category/automotive" onClick={() => setMegaMenuOpen(false)} className="hover:text-slate-900">Ceramic Brake Pads</Link></li>
                <li><Link href="/category/automotive" onClick={() => setMegaMenuOpen(false)} className="hover:text-slate-900">Garage Tool Kits</Link></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
