"use client";

import { useState } from "react";
import { ProductCard, ProductCardProps } from "@/components/commerce/CommercePrimitives";

export const SellerStorefrontTabs = ({
  products,
  sellerName,
  legalEntity,
  gstin,
  policies,
}: {
  products: ProductCardProps[];
  sellerName: string;
  legalEntity: string;
  gstin: string;
  policies: { returnPolicy: string; shippingPolicy: string; warrantyPolicy: string };
}) => {
  const [activeTab, setActiveTab] = useState<"catalog" | "deals" | "about">("catalog");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const dealProducts = products.filter((p) => p.originalPrice && p.originalPrice > p.price);

  return (
    <div className="space-y-6 select-none">
      
      {/* Tabs Header */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-xs sm:text-sm font-extrabold">
        <button
          type="button"
          onClick={() => setActiveTab("catalog")}
          className={`pb-3 transition relative ${
            activeTab === "catalog"
              ? "text-[#404d85] border-b-2 border-[#404d85]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          All Products ({products.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("deals")}
          className={`pb-3 transition relative ${
            activeTab === "deals"
              ? "text-[#404d85] border-b-2 border-[#404d85]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          🔥 Special Store Deals ({dealProducts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("about")}
          className={`pb-3 transition relative ${
            activeTab === "about"
              ? "text-[#404d85] border-b-2 border-[#404d85]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Merchant Policies & Legal KYB
        </button>
      </div>

      {/* 1. CATALOG TAB */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <input
              type="text"
              placeholder={`Search within ${sellerName}'s catalog...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs focus:border-[#404d85] focus:outline-hidden"
            />
            <span className="text-xs text-slate-500 font-bold hidden sm:block">
              {filteredProducts.length} Items Listed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} {...p} onAddToCart={() => alert(`Added "${p.title}" to bag!`)} />
            ))}
          </div>
        </div>
      )}

      {/* 2. DEALS TAB */}
      {activeTab === "deals" && (
        <div className="space-y-6">
          <div className="p-4 rounded-[6px] bg-red-50 border border-red-200 text-xs font-bold text-red-700">
            🔥 Exclusive limited-time discounts directly authorized by {sellerName}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dealProducts.map((p) => (
              <ProductCard key={p.id} {...p} variant="discounted" onAddToCart={() => alert(`Added "${p.title}" to bag!`)} />
            ))}
          </div>
        </div>
      )}

      {/* 3. ABOUT & POLICIES TAB */}
      {activeTab === "about" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="p-6 rounded-[8px] border border-slate-200 bg-white space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Verified Legal Merchant Details
            </h3>

            <div className="space-y-2 text-slate-600">
              <p><strong className="text-slate-900">Legal Entity Name:</strong> {legalEntity}</p>
              <p><strong className="text-slate-900">Registered GSTIN:</strong> <span className="font-mono">{gstin}</span></p>
              <p><strong className="text-slate-900">Marketplace Verification:</strong> Level 5 Gold Verified Partner</p>
              <p><strong className="text-slate-900">Escrow Settlement SLA:</strong> T+2 Days post delivery verification</p>
            </div>
          </div>

          <div className="p-6 rounded-[8px] border border-slate-200 bg-white space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Store Shipping & Return Policies
            </h3>

            <div className="space-y-3 text-slate-600">
              <div>
                <strong className="text-slate-900 block">Shipping & Handling:</strong>
                <p>{policies.shippingPolicy}</p>
              </div>
              <div>
                <strong className="text-slate-900 block">Returns & RMA Policy:</strong>
                <p>{policies.returnPolicy}</p>
              </div>
              <div>
                <strong className="text-slate-900 block">Manufacturer Warranty:</strong>
                <p>{policies.warrantyPolicy}</p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
