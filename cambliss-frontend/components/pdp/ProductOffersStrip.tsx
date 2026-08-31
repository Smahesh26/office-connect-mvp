"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";

export const ProductOffersStrip = () => {
  const offers = [
    {
      icon: "💳",
      badge: "BANK OFFER",
      title: "Flat ₹2,000 Instant Discount",
      description: "On HDFC, ICICI & SBI Credit Cards on orders above ₹20,000.",
    },
    {
      icon: "🗓️",
      badge: "NO COST EMI",
      title: "Zero Downpayment EMI from ₹2,499/mo",
      description: "Available on all major bank credit cards and Bajaj Finserv.",
    },
    {
      icon: "🏢",
      badge: "B2B GST SAVINGS",
      title: "Save up to 18% with GST Input Credit",
      description: "Enter your registered GSTIN at checkout to receive formal tax invoice.",
    },
    {
      icon: "🔄",
      badge: "EXCHANGE OFFER",
      title: "Up to ₹6,000 off on Old Audio/Tech Exchange",
      description: "Instant doorstep evaluation and pickup for eligible electronics.",
    },
  ];

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <span>🎁</span>
          <span>Available Offers & Promotions</span>
        </h3>
        <span className="text-[11px] font-bold text-[#404d85] cursor-pointer hover:underline">
          View All 8 Offers →
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {offers.map((off, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-[8px] border border-slate-200 bg-white hover:border-[#404d85]/50 transition space-y-1.5 text-xs shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-base">{off.icon}</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#404d85] font-black text-[9px] uppercase tracking-wider border border-blue-100">
                {off.badge}
              </span>
            </div>
            <h4 className="font-bold text-slate-900 leading-snug">{off.title}</h4>
            <p className="text-[11px] text-slate-500 line-clamp-2">{off.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
