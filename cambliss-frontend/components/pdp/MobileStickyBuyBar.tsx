"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";

export const MobileStickyBuyBar = ({
  title,
  image,
  price,
  onAddToCart,
  onBuyNow,
}: {
  title: string;
  image: string;
  price: number;
  onAddToCart: () => void;
  onBuyNow: () => void;
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-3 shadow-2xl flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <h4 className="text-[11px] font-bold text-slate-900 truncate">{title}</h4>
          <span className="text-xs font-black text-slate-900">{formatINR(price)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onAddToCart}
          className="px-3.5 py-2 rounded-[6px] bg-[#404d85] text-white text-xs font-bold whitespace-nowrap shadow-xs"
        >
          + Cart
        </button>
        <button
          type="button"
          onClick={onBuyNow}
          className="px-3.5 py-2 rounded-[6px] bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-xs"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};
