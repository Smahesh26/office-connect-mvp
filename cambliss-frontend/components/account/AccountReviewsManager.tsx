"use client";

import { useState } from "react";
import Link from "next/link";

export const AccountReviewsManager = () => {
  const [reviews, setReviews] = useState([
    {
      id: "rev-1",
      productId: "prod-1",
      productTitle: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
      rating: 5,
      headline: "Best active noise canceling headphones for open office work",
      comment: "The ANC blocks out entire office chatter. Battery lasts full 3 days of back-to-back client calls. Highly recommended for enterprise professionals.",
      date: "Aug 20, 2026",
      verified: true,
      helpfulVotes: 18,
    },
  ]);

  const [pendingReviews] = useState([
    {
      id: "pend-1",
      productId: "prod-4",
      productTitle: "Keychron Q1 Pro Custom Wireless Mechanical Keyboard QMK/VIA",
      purchasedDate: "Aug 25, 2026",
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=80",
    },
  ]);

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none">
      
      <div className="pb-4 border-b border-slate-100">
        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
          My Ratings & Customer Reviews ({reviews.length})
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Help fellow buyers make informed decisions with verified feedback
        </p>
      </div>

      {/* Pending Reviews Shelf */}
      {pendingReviews.length > 0 && (
        <div className="p-4 rounded-[6px] bg-amber-50/60 border border-amber-200 space-y-3">
          <h4 className="font-black text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
            <span>⭐</span>
            <span>Pending Reviews ({pendingReviews.length})</span>
          </h4>
          {pendingReviews.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 bg-white p-3 rounded border border-amber-200/80 text-xs">
              <div className="flex items-center gap-3">
                <img src={item.image} alt="" className="w-10 h-10 object-contain rounded border" />
                <div>
                  <h5 className="font-bold text-slate-900 line-clamp-1">{item.productTitle}</h5>
                  <span className="text-[11px] text-slate-500">Purchased on {item.purchasedDate}</span>
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs shrink-0"
              >
                Write Review
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Published Reviews List */}
      <div className="space-y-4">
        {reviews.map((rev) => (
          <div key={rev.id} className="p-4 rounded-[6px] border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <Link href={`/product/${rev.productId}`} className="font-black text-slate-900 hover:text-[#404d85] text-sm">
                {rev.productTitle}
              </Link>
              <span className="text-slate-400 text-[11px] font-mono">{rev.date}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-amber-500 font-black">
                {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
              </div>
              <span className="font-bold text-slate-900">{rev.headline}</span>
              {rev.verified && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-black text-[9px] uppercase">
                  ✓ Verified Buyer
                </span>
              )}
            </div>

            <p className="text-slate-600 leading-relaxed">{rev.comment}</p>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-4">
              <span>👍 {rev.helpfulVotes} people found this helpful</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
