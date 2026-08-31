"use client";

import { useState } from "react";
import { SectionBasicInfo, BasicInfoData } from "./SectionBasicInfo";
import { SectionCategory, CategoryData } from "./SectionCategory";
import { SectionMedia, MediaData } from "./SectionMedia";
import { SectionVariantMatrix, VariantData } from "./SectionVariantMatrix";
import { SectionPricingInventory, PricingInventoryData } from "./SectionPricingInventory";
import { SectionShippingSpecs, ShippingSpecsData } from "./SectionShippingSpecs";
import { SectionSeoPreview, SeoData } from "./SectionSeoPreview";

export const ProductCreatorStudio = ({
  onFinishPublish,
}: {
  onFinishPublish: () => void;
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isPublishing, setIsPublishing] = useState(false);

  // 1. Basic Info State
  const [basicInfo, setBasicInfo] = useState<BasicInfoData>({
    title: "UrbanThreads 240 GSM Heavyweight Oversized French Terry T-Shirt",
    brand: "UrbanThreads",
    subtitle: "100% Super-Combed Bio-Washed Organic Cotton with 2.5cm Ribbed Crew Neck",
    hsnCode: "61091000",
    countryOfOrigin: "India",
    highlights: [
      "240 GSM Heavyweight French Terry knit with high tensile durability",
      "Super-combed bio-washed 100% organic long-staple cotton",
      "Boxy drop-shoulder aesthetic with reinforced double-stitched hems",
      "Pre-shrunk fabric to prevent post-wash deformation and color fade",
    ],
    description:
      "Engineered for luxury streetwear and daily executive comfort, the UrbanThreads 240 GSM Heavyweight T-Shirt sets the gold standard for oversized apparel. Built with high-density combed yarn and reactive dyes that stay vibrant after 50+ wash cycles.",
  });

  // 2. Category State
  const [categoryData, setCategoryData] = useState<CategoryData>({
    primaryCategory: "Apparel & Fashion",
    subcategory: "Men's Clothing",
    itemType: "T-Shirts & Polos",
    attributes: {
      fabric: "100% Super-Combed Organic Cotton",
      fit: "Relaxed Oversized",
      neck: "Ribbed Crew Neck",
      sleeve: "Half Sleeve",
    },
  });

  // 3. Media State
  const [mediaData, setMediaData] = useState<MediaData>({
    primaryImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
    ],
  });

  // 4. Variant Matrix State (Exact User Specification: Colors: Black, White, Blue × Sizes: S, M, L, XL)
  const [variantData, setVariantData] = useState<VariantData>({
    hasVariants: true,
    colors: ["Black", "White", "Blue"],
    sizes: ["S", "M", "L", "XL"],
    matrix: [
      { id: "var-blk-s", color: "Black", size: "S", sku: "UT-TSHIRT-BLK-S", price: 1499, stock: 25, barcode: "890124810101", active: true },
      { id: "var-blk-m", color: "Black", size: "M", sku: "UT-TSHIRT-BLK-M", price: 1499, stock: 40, barcode: "890124810102", active: true },
      { id: "var-blk-l", color: "Black", size: "L", sku: "UT-TSHIRT-BLK-L", price: 1499, stock: 35, barcode: "890124810103", active: true },
      { id: "var-blk-xl", color: "Black", size: "XL", sku: "UT-TSHIRT-BLK-XL", price: 1499, stock: 20, barcode: "890124810104", active: true },
      { id: "var-wht-s", color: "White", size: "S", sku: "UT-TSHIRT-WHT-S", price: 1499, stock: 20, barcode: "890124810201", active: true },
      { id: "var-wht-m", color: "White", size: "M", sku: "UT-TSHIRT-WHT-M", price: 1499, stock: 30, barcode: "890124810202", active: true },
      { id: "var-wht-l", color: "White", size: "L", sku: "UT-TSHIRT-WHT-L", price: 1499, stock: 30, barcode: "890124810203", active: true },
      { id: "var-wht-xl", color: "White", size: "XL", sku: "UT-TSHIRT-WHT-XL", price: 1499, stock: 15, barcode: "890124810204", active: true },
      { id: "var-blu-s", color: "Blue", size: "S", sku: "UT-TSHIRT-BLU-S", price: 1499, stock: 18, barcode: "890124810301", active: true },
      { id: "var-blu-m", color: "Blue", size: "M", sku: "UT-TSHIRT-BLU-M", price: 1499, stock: 28, barcode: "890124810302", active: true },
      { id: "var-blu-l", color: "Blue", size: "L", sku: "UT-TSHIRT-BLU-L", price: 1499, stock: 24, barcode: "890124810303", active: true },
      { id: "var-blu-xl", color: "Blue", size: "XL", sku: "UT-TSHIRT-BLU-XL", price: 1499, stock: 12, barcode: "890124810304", active: true },
    ],
  });

  // 5 & 6. Pricing & Inventory State
  const [pricingData, setPricingData] = useState<PricingInventoryData>({
    mrp: 2499,
    sellingPrice: 1499,
    floorPrice: 1299,
    gstRate: "12%",
    enableB2BTiers: true,
    tier1Price: 1499,
    tier2Price: 1199,
    tier3Price: 999,
    safetyStockThreshold: 10,
    trackInventory: true,
  });

  // 7 & 8. Shipping & Specs State
  const [shippingData, setShippingData] = useState<ShippingSpecsData>({
    packageWeightGrams: 320,
    lengthCm: 30,
    widthCm: 22,
    heightCm: 3,
    dispatchSla: "24 Hours",
    isFragile: false,
    specifications: [
      { key: "Fabric", value: "100% Super-Combed Bio-Washed French Terry Cotton" },
      { key: "GSM", value: "240 GSM Heavyweight" },
      { key: "Fit", value: "Relaxed Boxy Oversized Drop-Shoulder" },
      { key: "Care Instructions", value: "Machine Wash Cold, Do Not Tumble Dry, Iron Low" },
      { key: "Country of Origin", value: "India" },
    ],
  });

  // 9. SEO State
  const [seoData, setSeoData] = useState<SeoData>({
    metaTitle: "UrbanThreads Heavyweight 240 GSM Oversized T-Shirt | Office Connect",
    metaDescription: "Buy 100% organic combed cotton 240 GSM oversized t-shirts in Black, White, and Blue. Free 24h express delivery with 100% Escrow Protection.",
    urlSlug: "urbanthreads-heavyweight-oversized-tshirt",
    searchKeywords: "tshirt, 240 gsm, oversized, black tshirt, white tshirt, blue tshirt, streetwear",
  });

  const steps = [
    { num: 1, label: "Basic info" },
    { num: 2, label: "Category" },
    { num: 3, label: "Images" },
    { num: 4, label: "Variants (12)" },
    { num: 5, label: "Pricing & Stock" },
    { num: 6, label: "Shipping & Specs" },
    { num: 7, label: "SEO & Preview" },
  ];

  const handlePublishListing = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      onFinishPublish();
    }, 1200);
  };

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Seller Product Creation Studio
          </h2>
          <p className="text-xs text-slate-500">
            Structured 10-section listing pipeline with automated 2D variant matrix generation
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("Draft saved to your browser session.")}
          className="text-xs font-bold text-slate-600 hover:text-[#404d85] self-start sm:self-auto"
        >
          💾 Save as Draft
        </button>
      </div>

      {/* Stepper Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold">
        {steps.map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setActiveStep(s.num)}
            className={`px-3 py-1.5 rounded whitespace-nowrap transition flex items-center gap-1.5 ${
              activeStep === s.num
                ? "bg-[#404d85] text-white font-black shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                activeStep === s.num
                  ? "bg-white text-[#404d85]"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {s.num}
            </span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Active Section Content Container */}
      <div className="py-2">
        {activeStep === 1 && (
          <SectionBasicInfo data={basicInfo} onChange={setBasicInfo} />
        )}
        {activeStep === 2 && (
          <SectionCategory data={categoryData} onChange={setCategoryData} />
        )}
        {activeStep === 3 && (
          <SectionMedia data={mediaData} onChange={setMediaData} />
        )}
        {activeStep === 4 && (
          <SectionVariantMatrix
            data={variantData}
            onChange={setVariantData}
            basePrice={pricingData.sellingPrice}
          />
        )}
        {activeStep === 5 && (
          <SectionPricingInventory
            data={pricingData}
            onChange={setPricingData}
          />
        )}
        {activeStep === 6 && (
          <SectionShippingSpecs
            data={shippingData}
            onChange={setShippingData}
          />
        )}
        {activeStep === 7 && (
          <SectionSeoPreview
            seoData={seoData}
            onSeoChange={setSeoData}
            basicInfo={basicInfo}
            variantData={variantData}
            pricingData={pricingData}
            primaryImage={mediaData.primaryImage}
            onPublish={handlePublishListing}
            isPublishing={isPublishing}
          />
        )}
      </div>

      {/* Step Navigation Controls (Prev / Next) */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          disabled={activeStep === 1}
          onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
          className="px-4 py-2 border border-slate-300 rounded font-bold text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition"
        >
          ← Previous Section
        </button>

        {activeStep < 7 ? (
          <button
            type="button"
            onClick={() => setActiveStep(Math.min(7, activeStep + 1))}
            className="px-6 py-2 bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs rounded transition shadow-2xs"
          >
            Next Section →
          </button>
        ) : (
          <button
            type="button"
            disabled={isPublishing}
            onClick={handlePublishListing}
            className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded transition shadow-2xs"
          >
            {isPublishing ? "Publishing..." : "✓ Publish Listing"}
          </button>
        )}
      </div>

    </div>
  );
};
