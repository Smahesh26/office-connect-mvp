"use client";

import { useEffect } from "react";
import { ProductListingFilters, FilterState, AvailableFacetOptions } from "./ProductListingFilters";

export const MobileFilterDrawer = ({
  isOpen,
  onClose,
  filters,
  facets,
  totalResultsCount,
  onChange,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  facets: AvailableFacetOptions;
  totalResultsCount: number;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-Up Drawer Content */}
      <div className="relative z-10 w-full max-h-[85vh] bg-white rounded-t-[16px] shadow-2xl flex flex-col border-t border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-[16px]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-900">Filter Products</h3>
            <span className="rounded-full bg-[#404d85] text-white px-2 py-0.2 text-[10px] font-black">
              {totalResultsCount} Matches
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm hover:bg-slate-300 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Filters Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <ProductListingFilters
            filters={filters}
            facets={facets}
            onChange={onChange}
            onReset={onReset}
            isMobile
          />
        </div>

        {/* Sticky Bottom Apply Action Bar */}
        <div className="p-4 border-t border-slate-200 bg-white shadow-md flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-3 rounded-[6px] border border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-50 transition"
          >
            Clear Filters
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-2 py-3 rounded-[6px] bg-[#404d85] text-white font-black text-xs hover:bg-[#323d6a] transition shadow-xs"
          >
            Apply & View {totalResultsCount} Products →
          </button>
        </div>

      </div>
    </div>
  );
};
