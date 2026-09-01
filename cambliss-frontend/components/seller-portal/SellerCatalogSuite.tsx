"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR } from "@/components/commerce/CommercePrimitives";
import { ProductCreatorStudio } from "./product-creator/ProductCreatorStudio";

export const SellerCatalogSuite = ({
  activeSubView,
  onFinishAdd,
}: {
  activeSubView: "products" | "add" | "bulk" | "categories";
  onFinishAdd?: () => void;
}) => {
  const [storeSlug] = useState("aerotech");

  const [products, setProducts] = useState([
    {
      id: "prod-1",
      sku: "AERO-ANC500-BLK",
      title: "AeroTech ANC-500 Wireless Studio Noise Canceling Headphones",
      category: "Electronics > Audio > Headphones",
      mrp: 34990,
      price: 29990,
      stock: 24,
      status: "PUBLISHED",
      buyBox: "Active (99.4%)",
      slug: "aerotech",
    },
    {
      id: "prod-aerotech-earbuds",
      sku: "AERO-AIRPULSE-WHT",
      title: "AeroTech AirPulse Truly Wireless ANC Earbuds (30H Battery)",
      category: "Electronics > Audio > Earbuds",
      mrp: 15990,
      price: 12990,
      stock: 30,
      status: "PUBLISHED",
      buyBox: "Active (98.1%)",
      slug: "aerotech",
    },
    {
      id: "prod-[#3]",
      sku: "UT-TSHIRT-BLK-M",
      title: "UrbanThreads 240 GSM Heavyweight Oversized French Terry T-Shirt",
      category: "Apparel & Fashion > Men's Apparel",
      mrp: 2499,
      price: 1499,
      stock: 45,
      status: "PUBLISHED",
      buyBox: "Active (100%)",
      slug: "urbanstyle",
    },
  ]);

  const [publishSuccess, setPublishSuccess] = useState(false);

  const handleProductPublished = () => {
    setPublishSuccess(true);
    if (onFinishAdd) {
      setTimeout(() => {
        onFinishAdd();
        setPublishSuccess(false);
      }, 1000);
    }
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-900">
      
      {/* Top Banner: My Storefront Quick Link */}
      <div className="rounded-[8px] border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#404d85] text-white flex items-center justify-center font-bold text-lg shrink-0">
            🏪
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Your Live Multi-Vendor Storefront</h4>
            <p className="text-[11px] text-slate-500 font-mono">
              https://theofficeconnect.com/store/{storeSlug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/store/${storeSlug}`}
            target="_blank"
            className="px-3 py-1.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-semibold text-xs transition flex items-center gap-1 shadow-2xs"
          >
            <span>👁️ View Live Storefront</span>
          </Link>
        </div>
      </div>

      {/* 1. PRODUCTS TABLE SUBVIEW */}
      {activeSubView === "products" && (
        <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 uppercase tracking-wider">
                My Published Catalog ({products.length} Active Listings)
              </h3>
              <p className="text-xs text-slate-500">Products uploaded from your dashboard are live on the main marketplace and your custom storefront.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search SKU or title..."
                className="px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs font-medium focus:border-[#404d85] focus:outline-hidden"
              />
            </div>
          </div>

          {publishSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[4px] text-xs font-semibold text-emerald-900">
              🎉 Product successfully published into the main marketplace and your storefront!
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase">
                  <th className="pb-2">SKU & Product Title</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Selling Price</th>
                  <th className="pb-2 text-right">Stock</th>
                  <th className="pb-2 text-center">Status</th>
                  <th className="pb-2 text-right">Marketplace Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3 max-w-xs">
                      <div className="font-bold text-slate-900 line-clamp-1">{p.title}</div>
                      <span className="font-mono text-[10px] text-slate-400">{p.sku}</span>
                    </td>
                    <td className="py-3 text-slate-500">{p.category}</td>
                    <td className="py-3 text-right">
                      <strong className="text-slate-900">{formatINR(p.price)}</strong>
                      <span className="block text-[10px] text-slate-400 line-through">{formatINR(p.mrp)}</span>
                    </td>
                    <td className="py-3 text-right">
                      <span className={`font-semibold ${p.stock <= 5 ? "text-red-600" : "text-slate-800"}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10px]">
                        LIVE & PUBLISHED
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/product/${p.id}`}
                          target="_blank"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[10px] transition"
                        >
                          View Item 🛍️
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. PRODUCT CREATION STUDIO SUBVIEW */}
      {activeSubView === "add" && (
        <ProductCreatorStudio onFinishPublish={handleProductPublished} />
      )}

      {/* 3. BULK UPLOAD SUBVIEW */}
      {activeSubView === "bulk" && (
        <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs text-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-sm text-slate-900 uppercase tracking-wider">
              Bulk CSV / Excel Product Importer
            </h3>
            <p className="text-xs text-slate-500">Upload up to 5,000 product listings in a single batch to your storefront</p>
          </div>

          <div className="p-6 rounded-[6px] border-2 border-dashed border-slate-300 bg-slate-50 text-center space-y-3">
            <div className="text-4xl">📄</div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Drag & Drop Catalog File (.csv or .xlsx)</h4>
              <p className="text-slate-500 text-[11px]">Maximum file size: 25 MB</p>
            </div>
            <button
              type="button"
              onClick={() => alert("Selecting catalog file from local drive...")}
              className="px-4 py-2 bg-[#404d85] text-white font-semibold rounded text-xs"
            >
              Browse Files
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-700">Need the official template?</span>
            <button
              type="button"
              onClick={() => alert("Downloading Office Connect Bulk Catalog Template (.CSV)...")}
              className="font-semibold text-[#404d85] hover:underline"
            >
              Download Sample CSV Template 📥
            </button>
          </div>
        </div>
      )}

      {/* 4. CATEGORIES TAXONOMY SUBVIEW */}
      {activeSubView === "categories" && (
        <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs text-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-sm text-slate-900 uppercase tracking-wider">
              Marketplace Taxonomy Categories
            </h3>
            <p className="text-xs text-slate-500">Official multi-vendor catalog categorization tree</p>
          </div>

          <div className="space-y-2">
            {[
              "⚡ Electronics & Audio > Headphones, Earbuds, Home Audio",
              "💻 Enterprise Computing > Monitors, Keyboards, Laptops",
              "🌸 Skincare & Beauty > Botanical Serums, Cleansers, Fragrances",
              "🚘 Auto Motors & Spares > Brake Pads, LED Headlights, Engine Filters",
              "☁️ Cloud Servers & SaaS > Dedicated Cloud, Hosting, Enterprise Licenses",
            ].map((cat, idx) => (
              <div key={idx} className="p-3 rounded border border-slate-200 bg-slate-50/50 font-semibold text-slate-800 flex items-center justify-between">
                <span>{cat}</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Approved Category</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
