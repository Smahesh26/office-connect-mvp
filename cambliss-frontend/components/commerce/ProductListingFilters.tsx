"use client";

import { useState } from "react";
import { formatINR } from "./CommercePrimitives";

export interface FilterState {
  brands: string[];
  minPrice: number;
  maxPrice: number;
  minRating: number;
  inStockOnly: boolean;
  minDiscount: number;
  categoryAttributes: Record<string, string[]>;
}

export interface AvailableFacetOptions {
  brands: { name: string; count: number }[];
  priceRange: { min: number; max: number };
  ratingCounts: { rating: number; count: number }[];
  discountBrackets: { label: string; min: number; count: number }[];
  categoryAttributes?: {
    name: string;
    key: string;
    options: { label: string; count: number }[];
  }[];
}

export const ProductListingFilters = ({
  filters,
  facets,
  onChange,
  onReset,
  isMobile = false,
}: {
  filters: FilterState;
  facets: AvailableFacetOptions;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
  isMobile?: boolean;
}) => {
  const [brandSearch, setBrandSearch] = useState("");

  const handleBrandToggle = (brand: string) => {
    const nextBrands = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    onChange({ ...filters, brands: nextBrands });
  };

  const handleAttributeToggle = (attrKey: string, optionLabel: string) => {
    const current = filters.categoryAttributes[attrKey] || [];
    const next = current.includes(optionLabel)
      ? current.filter((o) => o !== optionLabel)
      : [...current, optionLabel];
    onChange({
      ...filters,
      categoryAttributes: {
        ...filters.categoryAttributes,
        [attrKey]: next,
      },
    });
  };

  const filteredBrands = facets.brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const activeFiltersCount =
    filters.brands.length +
    (filters.minPrice > facets.priceRange.min || filters.maxPrice < facets.priceRange.max ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.minDiscount > 0 ? 1 : 0) +
    Object.values(filters.categoryAttributes).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="space-y-6 select-none text-xs">
      
      {/* Active Filters Header & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-[#404d85] text-white px-2 py-0.2 text-[10px] font-black">
              {activeFiltersCount}
            </span>
          )}
        </span>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-bold text-red-600 hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* 1. AVAILABILITY TOGGLE */}
      <div className="space-y-2 pb-4 border-b border-slate-100">
        <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] block">
          Availability
        </span>
        <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-[#404d85] focus:ring-[#404d85]"
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {/* 2. BRAND FILTER WITH QUICK SEARCH */}
      <div className="space-y-2.5 pb-4 border-b border-slate-100">
        <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] block">
          Brand
        </span>
        {facets.brands.length > 5 && (
          <input
            type="text"
            placeholder="Search brand..."
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-[4px] border border-slate-200 text-xs focus:outline-hidden focus:border-[#404d85]"
          />
        )}
        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
          {filteredBrands.map((b) => {
            const isChecked = filters.brands.includes(b.name);
            return (
              <label
                key={b.name}
                className="flex items-center justify-between cursor-pointer py-0.5 hover:text-[#404d85]"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleBrandToggle(b.name)}
                    className="w-4 h-4 rounded border-slate-300 text-[#404d85] focus:ring-[#404d85]"
                  />
                  <span className={`${isChecked ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                    {b.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">({b.count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. PRICE RANGE */}
      <div className="space-y-3 pb-4 border-b border-slate-100">
        <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] block">
          Price Range (INR)
        </span>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 block font-semibold">Min (₹)</span>
            <input
              type="number"
              value={filters.minPrice}
              min={facets.priceRange.min}
              max={filters.maxPrice}
              onChange={(e) => onChange({ ...filters, minPrice: Number(e.target.value) })}
              className="w-full px-2 py-1 border border-slate-200 rounded-[4px] text-xs font-bold"
            />
          </div>
          <span className="text-slate-400 pt-3">-</span>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 block font-semibold">Max (₹)</span>
            <input
              type="number"
              value={filters.maxPrice}
              min={filters.minPrice}
              max={facets.priceRange.max}
              onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
              className="w-full px-2 py-1 border border-slate-200 rounded-[4px] text-xs font-bold"
            />
          </div>
        </div>

        {/* Quick price pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { label: "Under ₹2k", min: 0, max: 2000 },
            { label: "₹2k - ₹10k", min: 2000, max: 10000 },
            { label: "₹10k - ₹50k", min: 10000, max: 50000 },
            { label: "₹50k+", min: 50000, max: facets.priceRange.max },
          ].map((bracket) => (
            <button
              key={bracket.label}
              type="button"
              onClick={() => onChange({ ...filters, minPrice: bracket.min, maxPrice: bracket.max })}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition"
            >
              {bracket.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. CUSTOMER RATING */}
      <div className="space-y-2 pb-4 border-b border-slate-100">
        <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] block">
          Customer Rating
        </span>
        <div className="space-y-1">
          {[4, 3, 2].map((stars) => {
            const isSelected = filters.minRating === stars;
            return (
              <label
                key={stars}
                onClick={() => onChange({ ...filters, minRating: isSelected ? 0 : stars })}
                className={`flex items-center justify-between cursor-pointer py-1 px-1.5 rounded transition ${
                  isSelected ? "bg-amber-50 text-amber-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-500 font-bold">{"★".repeat(stars)}</span>
                  <span className="text-slate-300">{"★".repeat(5 - stars)}</span>
                  <span className="text-[11px] font-semibold">& Above</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. DISCOUNT PERCENTAGE */}
      <div className="space-y-2 pb-4 border-b border-slate-100">
        <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] block">
          Discount
        </span>
        <div className="space-y-1">
          {[
            { label: "10% Off or More", min: 10 },
            { label: "20% Off or More", min: 20 },
            { label: "30% Off or More", min: 30 },
            { label: "50% Off or More", min: 50 },
          ].map((d) => (
            <label
              key={d.min}
              className="flex items-center gap-2 cursor-pointer py-0.5 text-slate-700 hover:text-slate-900"
            >
              <input
                type="radio"
                name="discount"
                checked={filters.minDiscount === d.min}
                onChange={() => onChange({ ...filters, minDiscount: filters.minDiscount === d.min ? 0 : d.min })}
                className="w-4 h-4 border-slate-300 text-[#404d85] focus:ring-[#404d85]"
              />
              <span className="font-semibold">{d.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 6. CATEGORY-SPECIFIC ATTRIBUTES */}
      {facets.categoryAttributes && facets.categoryAttributes.map((attr) => (
        <div key={attr.key} className="space-y-2 pb-4 border-b border-slate-100">
          <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] block">
            {attr.name}
          </span>
          <div className="space-y-1">
            {attr.options.map((opt) => {
              const selectedList = filters.categoryAttributes[attr.key] || [];
              const isChecked = selectedList.includes(opt.label);
              return (
                <label
                  key={opt.label}
                  className="flex items-center justify-between cursor-pointer py-0.5 hover:text-[#404d85]"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleAttributeToggle(attr.key, opt.label)}
                      className="w-4 h-4 rounded border-slate-300 text-[#404d85] focus:ring-[#404d85]"
                    />
                    <span className={`${isChecked ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                      {opt.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">({opt.count})</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

    </div>
  );
};
