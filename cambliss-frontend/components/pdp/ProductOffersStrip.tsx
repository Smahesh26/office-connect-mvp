"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";

export const ProductOffersStrip = ({
  category = "Fashion & Apparel",
  basePrice = 999,
}: {
  category?: string;
  basePrice?: number;
}) => {
  const catLower = category.toLowerCase();
  const isFashion = catLower.includes("fashion") || catLower.includes("apparel") || catLower.includes("clothing") || catLower.includes("kurta");

  const offers = isFashion
    ? [
        {
          icon: "💳",
          badge: "INSTANT BANK OFFER",
          title: "10% Instant Discount on SBI & HDFC",
          description: "Applicable on credit & debit card orders. Maximum savings ₹150.",
        },
        {
          icon: "🏷️",
          badge: "FESTIVE COUPON",
          title: "Extra ₹100 Off with Code BHASKER100",
          description: "Special inaugural merchant voucher on orders above ₹899.",
        },
        {
          icon: "🏢",
          badge: "B2B GST SAVINGS",
          title: "Save 12% via Verified GST Invoice",
          description: "Enter your registered GSTIN at checkout to receive formal tax invoice.",
        },
        {
          icon: "🚚",
          badge: "EXPRESS DISPATCH",
          title: "Free Express Shipping Nationwide",
          description: "Dispatched directly from merchant warehouse in sealed packaging.",
        },
      ]
    : [
        {
          icon: "💳",
          badge: "BANK OFFER",
          title: "Flat 10% Instant Card Discount",
          description: "On major bank cards on prepaid orders.",
        },
        {
          icon: "🗓️",
          badge: "FLEXIBLE EMI",
          title: "No-Cost EMI Options Available",
          description: "Applicable on leading credit cards and credit lines.",
        },
        {
          icon: "🏢",
          badge: "B2B GST SAVINGS",
          title: "Save 18% with GST Input Credit",
          description: "Enter your registered GSTIN at checkout to claim full input credit.",
        },
        {
          icon: "🛡️",
          badge: "ASSURED DISPATCH",
          title: "Office Connect Escrow Protected",
          description: "100% genuine brand stock with manufacturer domestic warranty.",
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
