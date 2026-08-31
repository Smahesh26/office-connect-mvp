"use client";

import { useState } from "react";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export interface SellerProductItem {
  id: string;
  title: string;
  sku: string;
  category: string;
  price: number;
  originalPrice: number;
  stockQty: number;
  status: "Active" | "Low Stock" | "Out of Stock";
  image: string;
}

export const SellerCatalogManager = ({
  products,
  onUpdateProduct,
  onAddNewProduct,
}: {
  products: SellerProductItem[];
  onUpdateProduct: (id: string, updates: Partial<SellerProductItem>) => void;
  onAddNewProduct: (newProd: Omit<SellerProductItem, "id">) => void;
}) => {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);

  const [newForm, setNewForm] = useState({
    title: "",
    sku: "",
    category: "Electronics",
    price: 0,
    originalPrice: 0,
    stockQty: 10,
    status: "Active" as const,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
  });

  const handleStartEdit = (p: SellerProductItem) => {
    setEditingId(p.id);
    setEditPrice(p.price);
    setEditStock(p.stockQty);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateProduct(id, {
      price: editPrice,
      stockQty: editStock,
      status: editStock <= 0 ? "Out of Stock" : editStock <= 5 ? "Low Stock" : "Active",
    });
    setEditingId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddNewProduct(newForm);
    setShowAddModal(false);
  };

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 select-none">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="text"
            placeholder="Search by SKU or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs focus:border-[#404d85] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-xs transition shadow-xs"
          >
            + Add New SKU Listing
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="border border-slate-200 rounded-[8px] overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Product & SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Selling Price (INR)</th>
                <th className="py-3 px-4">Inventory Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((p) => {
                const isEditing = editingId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    
                    {/* Title & SKU */}
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-slate-50 border overflow-hidden shrink-0">
                        <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <h5 className="font-bold text-slate-900 truncate">{p.title}</h5>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">SKU: {p.sku}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-slate-600 font-semibold">{p.category}</td>

                    {/* Price */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                          className="w-24 px-2 py-1 border border-[#404d85] rounded text-xs font-bold"
                        />
                      ) : (
                        <span className="font-black text-slate-900">{formatINR(p.price)}</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-[#404d85] rounded text-xs font-bold"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">{p.stockQty} units</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                          p.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : p.status === "Low Stock"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        ● {p.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(p.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 text-[11px] font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          className="px-3 py-1 rounded border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs transition"
                        >
                          Quick Edit
                        </button>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add SKU Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900">List New Product SKU on Marketplace</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OC-98214"
                    value={newForm.sku}
                    onChange={(e) => setNewForm({ ...newForm, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department / Category</label>
                  <select
                    value={newForm.category}
                    onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] bg-white"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Computing">Enterprise Computing</option>
                    <option value="Beauty">Beauty & Skincare</option>
                    <option value="Automotive">Automotive Spares</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newForm.price}
                    onChange={(e) => setNewForm({ ...newForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock Units *</label>
                  <input
                    type="number"
                    required
                    value={newForm.stockQty}
                    onChange={(e) => setNewForm({ ...newForm, stockQty: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#404d85] text-white font-bold rounded"
                >
                  Publish SKU Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
