"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";
import { BasicInfoData } from "./SectionBasicInfo";
import { VariantData } from "./SectionVariantMatrix";
import { PricingInventoryData } from "./SectionPricingInventory";

export interface SeoData {
  metaTitle: string;
  metaDescription: string;
  urlSlug: string;
  searchKeywords: string;
}

export const SectionSeoPreview = ({
  seoData,
  onSeoChange,
  basicInfo,
  variantData,
  pricingData,
  primaryImage,
  onPublish,
  isPublishing,
}: {
  seoData: SeoData;
  onSeoChange: (data: SeoData) => void;
  basicInfo: BasicInfoData;
  variantData: VariantData;
  pricingData: PricingInventoryData;
  primaryImage: string;
  onPublish: () => void;
  isPublishing: boolean;
}) => {
  return (
    <div className="space-y-6 text-xs select-none">
      
      {/* 9. SEO & SEARCH INFORMATION */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            9. Search Engine Optimization (SEO) & Search Indexing
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Fine-tune how your product appears on Google and the internal marketplace autocomplete search bar.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">SEO Meta Title *</label>
            <input
              type="text"
              value={seoData.metaTitle}
              onChange={(e) => onSeoChange({ ...seoData, metaTitle: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              SEO Meta Description ({seoData.metaDescription.length}/160 characters)
            </label>
            <textarea
              rows={2}
              maxLength={160}
              value={seoData.metaDescription}
              onChange={(e) => onSeoChange({ ...seoData, metaDescription: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded leading-relaxed text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Canonical URL Slug *</label>
              <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                <span className="px-2.5 py-2 bg-slate-100 text-slate-500 font-mono text-[10px] border-r">
                  theofficeconnect.com/product/
                </span>
                <input
                  type="text"
                  value={seoData.urlSlug}
                  onChange={(e) => onSeoChange({ ...seoData, urlSlug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  className="flex-1 px-3 py-2 font-mono text-[11px] font-bold text-[#404d85]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Search Keywords / Typeahead Tags</label>
              <input
                type="text"
                placeholder="tshirt, cotton, oversized, streetwear, black tshirt"
                value={seoData.searchKeywords}
                onChange={(e) => onSeoChange({ ...seoData, searchKeywords: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </div>
          </div>

          {/* Google Search Snippet Simulation */}
          <div className="p-4 rounded-[6px] bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 block">
              Google Search SERP Result Preview:
            </span>
            <div className="text-[11px] text-slate-500 font-mono">
              https://theofficeconnect.com &gt; product &gt; {seoData.urlSlug || "luxury-tshirt"}
            </div>
            <div className="text-sm font-bold text-blue-700 hover:underline cursor-pointer">
              {seoData.metaTitle || basicInfo.title}
            </div>
            <p className="text-[11px] text-slate-600 line-clamp-2">
              {seoData.metaDescription || basicInfo.description}
            </p>
          </div>
        </div>
      </div>

      {/* 10. LIVE INTERACTIVE PDP PREVIEW */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            10. Live Storefront PDP Simulation & Publish
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Review how your finished listing renders in the high-converting purchase area.
          </p>
        </div>

        {/* Mini PDP Buy Box Card */}
        <div className="p-5 rounded-[8px] border border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-6 items-start">
          
          {/* Thumbnail */}
          <div className="w-48 h-48 rounded-[6px] border border-slate-300 bg-white p-2 shrink-0 overflow-hidden flex items-center justify-center">
            <img src={primaryImage} alt="" className="w-full h-full object-contain" />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {basicInfo.brand}
              </span>
              <h4 className="text-base font-black text-slate-900 leading-snug">
                {basicInfo.title}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">{basicInfo.subtitle}</p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {formatINR(pricingData.sellingPrice)}
              </span>
              {pricingData.mrp > pricingData.sellingPrice && (
                <>
                  <span className="text-xs text-slate-400 line-through">
                    {formatINR(pricingData.mrp)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[10px]">
                    {Math.round(((pricingData.mrp - pricingData.sellingPrice) / pricingData.mrp) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Color Swatches */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">
                Color Swatches ({variantData.colors.length}):
              </span>
              <div className="flex items-center gap-2">
                {variantData.colors.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 rounded border border-slate-300 bg-white font-bold text-[10px]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Size Pills */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">
                Available Sizes ({variantData.sizes.length}):
              </span>
              <div className="flex items-center gap-1.5">
                {variantData.sizes.map((s) => (
                  <span
                    key={s}
                    className="w-8 h-7 rounded border border-slate-300 bg-white font-bold text-[11px] flex items-center justify-center"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Final Publish Button */}
        <div className="pt-3 flex items-center justify-between">
          <p className="text-slate-500 text-[11px]">
            Ready to distribute your product across 100,000+ verified marketplace buyers?
          </p>

          <button
            type="button"
            disabled={isPublishing}
            onClick={onPublish}
            className="px-8 py-3.5 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] active:bg-[#252f5a] text-white font-black text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isPublishing ? (
              <span>Publishing Listing...</span>
            ) : (
              <>
                <span>🚀</span>
                <span>Publish Listing to Marketplace</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};
