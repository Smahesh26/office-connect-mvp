"use client";

import { useState } from "react";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export interface BundleItem {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  image: string;
  isSelected: boolean;
}

export const FrequentlyBoughtTogether = ({
  mainProduct,
  bundleItems,
  onAddBundleToCart,
}: {
  mainProduct: { id: string; title: string; price: number; originalPrice: number; image: string };
  bundleItems?: BundleItem[];
  onAddBundleToCart: (items: BundleItem[]) => void;
}) => {
  const initialItems: BundleItem[] = bundleItems && bundleItems.length > 1
    ? bundleItems
    : [];

  const [items, setItems] = useState<BundleItem[]>(initialItems);

  // If no bundle items configured, do not render irrelevant items
  if (!items || items.length <= 1) {
    return null;
  }

  const handleToggle = (id: string) => {
    if (id === mainProduct.id) return; // Main product cannot be unselected
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isSelected: !item.isSelected } : item))
    );
  };

  const selectedItems = items.filter((i) => i.isSelected);
  const totalBundlePrice = selectedItems.reduce((acc, i) => acc + i.price, 0);
  const totalOriginalPrice = selectedItems.reduce((acc, i) => acc + i.originalPrice, 0);
  const totalSavings = totalOriginalPrice - totalBundlePrice;

  return (
    <div className="p-6 rounded-[8px] border border-slate-200 bg-white space-y-5 shadow-2xs select-none">
      
      <div className="flex items-center justify-between">
        <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <span>📦</span>
          <span>Frequently Bought Together</span>
        </h3>
        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Save {formatINR(totalSavings)} with Bundle
        </span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        
        {/* Visual Item Chain */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 flex-1">
          {items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-3 shrink-0">
              <div
                onClick={() => handleToggle(item.id)}
                className={`relative w-24 h-24 rounded-[8px] border p-2 bg-slate-50 flex items-center justify-center cursor-pointer transition ${
                  item.isSelected
                    ? "border-[#404d85] ring-2 ring-[#404d85]/15"
                    : "border-slate-200 opacity-50"
                }`}
              >
                <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                <div
                  className={`absolute top-1.5 left-1.5 w-4 h-4 rounded text-[10px] font-black flex items-center justify-center ${
                    item.isSelected ? "bg-[#404d85] text-white" : "border border-slate-300 bg-white text-transparent"
                  }`}
                >
                  ✓
                </div>
              </div>

              {idx < items.length - 1 && (
                <span className="font-black text-slate-400 text-lg">+</span>
              )}
            </div>
          ))}
        </div>

        {/* Total Price & Add All CTA */}
        <div className="lg:w-72 space-y-3 p-4 rounded-[6px] bg-slate-50 border border-slate-200 shrink-0">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Total Bundle Price ({selectedItems.length} items):
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{formatINR(totalBundlePrice)}</span>
              <span className="text-xs font-semibold text-slate-400 line-through">
                {formatINR(totalOriginalPrice)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAddBundleToCart(selectedItems)}
            className="w-full py-2.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-xs transition shadow-2xs"
          >
            Add All {selectedItems.length} to Bag
          </button>
        </div>

      </div>

      {/* Item Checklist */}
      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
            <input
              type="checkbox"
              disabled={item.id === mainProduct.id}
              checked={item.isSelected}
              onChange={() => handleToggle(item.id)}
              className="rounded border-slate-300 text-[#404d85] focus:ring-[#404d85]"
            />
            <span className="font-bold text-slate-900">{item.title}</span>
            <span className="text-slate-400">—</span>
            <span className="font-black text-slate-900">{formatINR(item.price)}</span>
          </label>
        ))}
      </div>

    </div>
  );
};
