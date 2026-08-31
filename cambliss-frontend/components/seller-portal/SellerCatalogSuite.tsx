"use client";

import { useState } from "react";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export const SellerCatalogSuite = ({
  activeSubView,
}: {
  activeSubView: "products" | "add" | "bulk" | "categories";
}) => {
  const [products, setProducts] = useState([
    {
      id: "prod-1",
      sku: "SONY-XM5-BLK",
      title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones (Midnight Black)",
      category: "Electronics > Audio > Headphones",
      mrp: 34990,
      price: 29990,
      stock: 24,
      status: "Active",
      buyBox: "Yes (99.4%)",
    },
    {
      id: "prod-2",
      sku: "SONY-WF5-SLV",
      title: "Sony WF-1000XM5 Truly Wireless Noise Canceling Earbuds (Platinum Silver)",
      category: "Electronics > Audio > Earbuds",
      mrp: 26990,
      price: 23990,
      stock: 18,
      status: "Active",
      buyBox: "Yes (98.1%)",
    },
    {
      id: "prod-3",
      sku: "SONY-A7M4-BODY",
      title: "Sony Alpha 7 IV Full-frame Mirrorless Interchangeable Lens Camera",
      category: "Electronics > Cameras > Mirrorless",
      mrp: 269990,
      price: 241990,
      stock: 3,
      status: "Active",
      buyBox: "Yes (100%)",
    },
  ]);

  const [addForm, setAddForm] = useState({
    title: "",
    brand: "Sony",
    category: "Electronics > Audio > Headphones",
    sku: "",
    hsn: "85183000",
    gstRate: "18%",
    mrp: "",
    sellingPrice: "",
    stock: "",
    description: "",
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProd = {
      id: `prod-${Date.now()}`,
      sku: addForm.sku || `SONY-SKU-${Date.now()}`,
      title: addForm.title,
      category: addForm.category,
      mrp: Number(addForm.mrp) || 9999,
      price: Number(addForm.sellingPrice) || 8999,
      stock: Number(addForm.stock) || 10,
      status: "Active",
      buyBox: "Yes (100%)",
    };
    setProducts([newProd, ...products]);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* 1. PRODUCTS TABLE SUBVIEW */}
      {activeSubView === "products" && (
        <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Product Catalog ({products.length} Active Listings)
              </h3>
              <p className="text-xs text-slate-500">Live listings synchronized across storefront and search indexes</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search SKU or title..."
                className="px-3 py-1.5 border border-slate-300 rounded text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-extrabold text-[10px] uppercase">
                  <th className="pb-2">SKU & Title</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Selling Price</th>
                  <th className="pb-2 text-right">Stock</th>
                  <th className="pb-2 text-center">BuyBox</th>
                  <th className="pb-2 text-right">Status</th>
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
                      <span className={`font-bold ${p.stock <= 5 ? "text-red-600" : "text-slate-800"}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                        {p.buyBox}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[10px]">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. ADD LISTING FORM SUBVIEW */}
      {activeSubView === "add" && (
        <form onSubmit={handleAddSubmit} className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs text-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Create New Marketplace Product Listing
            </h3>
            <p className="text-xs text-slate-500">Provide official brand product details, HSN tax codes, and pricing</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sony WH-1000XM5 Wireless Noise Canceling Headphones"
                value={addForm.title}
                onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={addForm.brand}
                onChange={(e) => setAddForm({ ...addForm, brand: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Taxonomy Category *</label>
              <select
                value={addForm.category}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded font-bold"
              >
                <option value="Electronics > Audio > Headphones">Electronics &gt; Audio &gt; Headphones</option>
                <option value="Electronics > Audio > Earbuds">Electronics &gt; Audio &gt; Earbuds</option>
                <option value="Electronics > Cameras > Mirrorless">Electronics &gt; Cameras &gt; Mirrorless</option>
                <option value="Computing > Peripherals > Keyboards">Computing &gt; Peripherals &gt; Keyboards</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Merchant SKU *</label>
              <input
                type="text"
                required
                placeholder="SONY-XM5-BLK"
                value={addForm.sku}
                onChange={(e) => setAddForm({ ...addForm, sku: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">HSN Tax Code (8-Digit) *</label>
              <input
                type="text"
                required
                value={addForm.hsn}
                onChange={(e) => setAddForm({ ...addForm, hsn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Maximum Retail Price (MRP in ₹) *</label>
              <input
                type="number"
                required
                placeholder="34990"
                value={addForm.mrp}
                onChange={(e) => setAddForm({ ...addForm, mrp: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Your Selling Price (INR ₹) *</label>
              <input
                type="number"
                required
                placeholder="29990"
                value={addForm.sellingPrice}
                onChange={(e) => setAddForm({ ...addForm, sellingPrice: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded font-bold text-[#404d85]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Initial Stock Units *</label>
              <input
                type="number"
                required
                placeholder="25"
                value={addForm.stock}
                onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-xs transition shadow-2xs"
            >
              Publish Listing to Marketplace →
            </button>

            {isSaved && (
              <span className="text-emerald-700 font-bold text-xs">
                ✓ Product listing published successfully!
              </span>
            )}
          </div>
        </form>
      )}

      {/* 3. BULK UPLOAD SUBVIEW */}
      {activeSubView === "bulk" && (
        <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs text-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Bulk CSV / Excel Product Importer
            </h3>
            <p className="text-xs text-slate-500">Upload up to 5,000 product listings in a single batch</p>
          </div>

          <div className="p-6 rounded-[6px] border-2 border-dashed border-slate-300 bg-slate-50 text-center space-y-3">
            <div className="text-4xl">📄</div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Drag & Drop Catalog File (.csv or .xlsx)</h4>
              <p className="text-slate-500 text-[11px]">Maximum file size: 25 MB</p>
            </div>
            <button
              type="button"
              onClick={() => alert("Selecting catalog file from local drive...")}
              className="px-4 py-2 bg-[#404d85] text-white font-bold rounded text-xs"
            >
              Browse Files
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-700">Need the official template?</span>
            <button
              type="button"
              onClick={() => alert("Downloading Office Connect Bulk Catalog Template (.CSV)...")}
              className="font-bold text-[#404d85] hover:underline"
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
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Marketplace Taxonomy Categories
            </h3>
            <p className="text-xs text-slate-500">Official catalog categorization tree</p>
          </div>

          <div className="space-y-2">
            {[
              "⚡ Electronics & Audio > Headphones, Earbuds, Home Audio",
              "💻 Enterprise Computing > Monitors, Keyboards, Laptops",
              "🌸 Skincare & Beauty > Botanical Serums, Cleansers, Fragrances",
              "🚘 Auto Motors & Spares > Brake Pads, LED Headlights, Engine Filters",
              "☁️ Cloud Servers & SaaS > Dedicated Cloud, Hosting, Enterprise Licenses",
            ].map((cat, idx) => (
              <div key={idx} className="p-3 rounded border border-slate-200 bg-slate-50/50 font-bold text-slate-800 flex items-center justify-between">
                <span>{cat}</span>
                <span className="text-[10px] text-emerald-700 font-black">Approved Category</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
