"use client";

import Link from "next/link";
import { formatINR } from "@/components/commerce/CommercePrimitives";
import { CartLineItem } from "./MultiVendorPackageGroup";

export const SavedForLaterShelf = ({
  items,
  onMoveToBag,
  onRemoveItem,
}: {
  items: CartLineItem[];
  onMoveToBag: (item: CartLineItem) => void;
  onRemoveItem: (id: string) => void;
}) => {
  if (items.length === 0) return null;

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 space-y-4 shadow-2xs select-none">
      
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <span>💾</span>
          <span>Saved for Later ({items.length} items)</span>
        </h3>
        <span className="text-xs text-slate-400">Items saved from your active cart</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-[6px] border border-slate-200 bg-slate-50/50 flex gap-3 text-xs"
          >
            <Link
              href={`/product/${item.productId}`}
              className="w-16 h-16 rounded bg-white border border-slate-200 p-1 shrink-0 flex items-center justify-center"
            >
              <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
            </Link>

            <div className="flex-1 min-w-0 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">{item.brand}</span>
              <h4 className="font-bold text-slate-900 truncate">{item.title}</h4>
              <div className="font-black text-slate-900">{formatINR(item.price)}</div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onMoveToBag(item)}
                  className="px-2.5 py-1 rounded bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-[11px] transition"
                >
                  Move to Bag
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-600 hover:text-red-700 font-bold text-[11px]"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
