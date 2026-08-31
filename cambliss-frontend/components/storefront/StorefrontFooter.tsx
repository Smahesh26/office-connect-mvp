"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export const StorefrontFooter = () => {
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);

  const toggleMobileSection = (key: string) => {
    setOpenMobileSection((prev) => (prev === key ? null : key));
  };

  const footerGroups = [
    {
      id: "shop",
      title: "Shop",
      links: [
        { label: "Electronics & Audio", href: "/category/electronics" },
        { label: "Mobiles & Accessories", href: "/category/mobiles" },
        { label: "Fashion & Apparel", href: "/category/fashion" },
        { label: "Home & Kitchen", href: "/category/home-kitchen" },
        { label: "Beauty & Personal Care", href: "/category/beauty" },
        { label: "Grocery & Gourmet", href: "/category/grocery" },
        { label: "Automotive Spares", href: "/category/automotive" },
      ],
    },
    {
      id: "customer_service",
      title: "Customer Service",
      links: [
        { label: "Help Center & FAQs", href: "/support" },
        { label: "Order Tracking Timeline", href: "/orders" },
        { label: "Returns & RMA Policy", href: "/returns" },
        { label: "Contact Customer Care", href: "/support" },
        { label: "Dispute Arbitration Desk", href: "/support" },
      ],
    },
    {
      id: "sell_with_us",
      title: "Sell With Us",
      links: [
        { label: "Become a Verified Seller", href: "/seller-central" },
        { label: "Merchant Seller Portal", href: "/vendor-dashboard" },
        { label: "Seller Commission & Fees", href: "/vendor-dashboard" },
        { label: "Fulfillment & Dispatch SLA", href: "/vendor-dashboard" },
        { label: "Seller Code of Conduct", href: "/terms" },
      ],
    },
    {
      id: "about",
      title: "About Office Connect",
      links: [
        { label: "About Our Marketplace", href: "/about" },
        { label: "Careers & Engineering", href: "/careers" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "100% Escrow Security", href: "/security" },
      ],
    },
  ];

  return (
    <footer className="bg-[#1f2430] text-slate-300 font-sans text-xs border-t border-slate-800 select-none">
      
      {/* 1. Trust & Reliability Band */}
      <div className="border-b border-slate-800 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-xl text-emerald-400">
              🛡️
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">100% Escrow Protection</h5>
              <p className="text-[11px] text-slate-400">Funds released only after delivery confirmation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-xl text-blue-400">
              🚚
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">Express 48-Hour Dispatch</h5>
              <p className="text-[11px] text-slate-400">Direct from certified merchant warehouses</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-xl text-amber-400">
              👑
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">Verified Genuine Sellers</h5>
              <p className="text-[11px] text-slate-400">5-Stage KYB & KYC merchant credential vetting</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-xl text-purple-400">
              💳
            </div>
            <div>
              <h5 className="font-bold text-white text-xs">Secure Multi-Gateway Checkout</h5>
              <p className="text-[11px] text-slate-400">UPI, Cards, NetBanking, Stripe & Razorpay</p>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Main Desktop 5-Column Navigation Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 hidden md:grid md:grid-cols-5 gap-8">
        
        {/* Col 1: Brand & Certification */}
        <div className="space-y-3">
          <Image
            src="/officeconnectlogo.png"
            alt="Office Connect"
            width={160}
            height={40}
            className="h-8 w-auto brightness-200"
          />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Enterprise multi-vendor commerce platform connecting buyers with verified direct manufacturers and brands.
          </p>
          <div className="text-[10px] text-slate-500 font-mono">
            ISO 27001 Certified • PCI-DSS Level 1
          </div>
        </div>

        {/* Col 2-5: Grouped Navigation Links */}
        {footerGroups.map((group) => (
          <div key={group.id} className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">{group.title}</h4>
            <ul className="space-y-2 text-[11px] text-slate-400 font-medium">
              {group.links.map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="hover:text-white transition block truncate">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

      </div>

      {/* 3. Mobile Collapsible Accordion Navigation */}
      <div className="md:hidden px-4 py-6 space-y-3 border-b border-slate-800">
        {footerGroups.map((group) => {
          const isOpen = openMobileSection === group.id;
          return (
            <div key={group.id} className="border-b border-slate-800/80 pb-2">
              <button
                type="button"
                onClick={() => toggleMobileSection(group.id)}
                className="w-full flex items-center justify-between text-left py-2 text-white font-bold text-xs"
              >
                <span>{group.title}</span>
                <span className="text-slate-400">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <ul className="space-y-2 py-2 pl-2 text-[11px] text-slate-400 font-medium animate-in fade-in duration-150">
                  {group.links.map((link, idx) => (
                    <li key={idx}>
                      <Link href={link.href} className="hover:text-white block">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Copyright & Payment Badges */}
      <div className="py-6 px-4 sm:px-6 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © 2026 Office Connect Global Inc. All rights reserved. Built with precision multi-vendor architecture.
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold flex-wrap justify-center">
            <span>Stripe</span>
            <span>•</span>
            <span>Razorpay</span>
            <span>•</span>
            <span>UPI</span>
            <span>•</span>
            <span>Visa</span>
            <span>•</span>
            <span>Mastercard</span>
            <span>•</span>
            <span>RuPay</span>
            <span>•</span>
            <span>NetBanking</span>
          </div>
        </div>
      </div>

    </footer>
  );
};
