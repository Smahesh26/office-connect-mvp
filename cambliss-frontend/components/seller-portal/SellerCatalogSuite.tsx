"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Pencil, Trash2, X, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { formatINR } from "@/components/commerce/CommercePrimitives";
import { ProductCreatorStudio } from "./product-creator/ProductCreatorStudio";

export interface CatalogProduct {
  id: string;
  sku: string;
  title: string;
  category: string;
  mrp: number;
  price: number;
  stock: number;
  status: string;
  buyBox?: string;
  slug?: string;
  image?: string;
}

const DEFAULT_PRODUCTS: CatalogProduct[] = [
  {
    id: "prod-hisense-visionbook",
    sku: "HC-VB16-I9-4070",
    title: "Hisense VisionBook Pro 16 AI Workstation Laptop (Core i9-14900HX, 32GB DDR5, 1TB NVMe, RTX 4070, 3.2K 165Hz OLED)",
    category: "Enterprise Computing > Workstation Laptops",
    mrp: 179990,
    price: 149990,
    stock: 18,
    status: "PUBLISHED",
    buyBox: "Active (99.1%)",
    slug: "hisense-computers",
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-hisense-aio27",
    sku: "HC-AIO27-I7-4K",
    title: "Hisense Infinity AIO 27\" 4K All-In-One Desktop Computer (Intel Core i7-13700, 16GB RAM, 1TB SSD, Wireless Peripherals)",
    category: "Enterprise Computing > All-In-One Desktops",
    mrp: 99990,
    price: 84990,
    stock: 22,
    status: "PUBLISHED",
    buyBox: "Active (98.4%)",
    slug: "hisense-computers",
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-hisense-elitedesk",
    sku: "HC-ED-R9-64G",
    title: "Hisense EliteDesk Tower Enterprise PC (AMD Ryzen 9 7900X, 64GB DDR5 ECC, 2TB Gen4 SSD, Windows 11 Pro Enterprise)",
    category: "Enterprise Computing > Business Towers",
    mrp: 145000,
    price: 124500,
    stock: 8,
    status: "PUBLISHED",
    buyBox: "Active (100%)",
    slug: "hisense-computers",
    image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-hisense-ultraview34",
    sku: "HC-UV34-WQHD-165",
    title: "Hisense UltraView 34-Inch Curved WQHD USB-C Ergonomic Hub Monitor (3440x1440, 165Hz, 90W PD, 99% DCI-P3)",
    category: "Enterprise Computing > Ergonomic Monitors",
    mrp: 46990,
    price: 38990,
    stock: 35,
    status: "PUBLISHED",
    buyBox: "Active (99.5%)",
    slug: "hisense-computers",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-hisense-micropro",
    sku: "HC-MP-I5-16G",
    title: "Hisense MicroPro Fanless Mini PC (Intel Core i5-1335U, 16GB DDR4, 512GB PCIe SSD, Triple 4K Display Out)",
    category: "Enterprise Computing > Mini PCs",
    mrp: 36990,
    price: 29990,
    stock: 25,
    status: "PUBLISHED",
    buyBox: "Active (97.8%)",
    slug: "hisense-computers",
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prod-hisense-combo",
    sku: "HC-KBMS-PRO-RGB",
    title: "Hisense Mechanical RGB Ergonomic Hot-Swappable Office Keyboard & Precision Laser Mouse Combo",
    category: "Enterprise Computing > Peripherals",
    mrp: 6990,
    price: 4990,
    stock: 50,
    status: "PUBLISHED",
    buyBox: "Active (99.8%)",
    slug: "hisense-computers",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
  },
];

export const SellerCatalogSuite = ({
  activeSubView,
  onFinishAdd,
}: {
  activeSubView: "products" | "add" | "bulk" | "categories";
  onFinishAdd?: () => void;
}) => {
  const [storeSlug] = useState("hisense-computers");
  const [products, setProducts] = useState<CatalogProduct[]>(DEFAULT_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState<number | string>("");
  const [editMrp, setEditMrp] = useState<number | string>("");
  const [editStock, setEditStock] = useState<number | string>("");
  const [editStatus, setEditStatus] = useState("PUBLISHED");

  // Delete Confirmation States
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<CatalogProduct | null>(null);

  // Load persistent products on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("officeconnect_custom_products");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted: CatalogProduct[] = parsed.map((item: any) => ({
            id: item.id || `prod-${Date.now()}`,
            sku: item.sku || `SKU-${item.id}`,
            title: item.title,
            category: item.category || "General",
            mrp: Number(item.mrp || item.originalPrice || item.price * 1.2),
            price: Number(item.price),
            stock: Number(item.stock !== undefined ? item.stock : (item.stockQty || 10)),
            status: item.status || "PUBLISHED",
            buyBox: item.buyBox || "Active (99%)",
            slug: item.slug || storeSlug,
            image: item.image,
          }));
          setProducts(formatted);
        }
      }
    } catch (e) {
      console.warn("Could not load custom products from localStorage", e);
    }
  }, [storeSlug]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const q = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, searchTerm]);

  const handleProductPublished = () => {
    setPublishSuccess(true);
    if (onFinishAdd) {
      setTimeout(() => {
        onFinishAdd();
        setPublishSuccess(false);
      }, 1000);
    }
  };

  const handleOpenEdit = (p: CatalogProduct) => {
    setEditingProduct(p);
    setEditTitle(p.title);
    setEditSku(p.sku);
    setEditCategory(p.category);
    setEditPrice(p.price);
    setEditMrp(p.mrp);
    setEditStock(p.stock);
    setEditStatus(p.status);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updatedList = products.map((p) => {
      if (p.id === editingProduct.id) {
        return {
          ...p,
          title: editTitle,
          sku: editSku,
          category: editCategory,
          price: Number(editPrice),
          mrp: Number(editMrp),
          stock: Number(editStock),
          status: editStatus,
        };
      }
      return p;
    });

    setProducts(updatedList);
    try {
      localStorage.setItem("officeconnect_custom_products", JSON.stringify(updatedList));
    } catch (err) {}

    // Call backend API in background
    try {
      await fetch(`/api/catalog/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          categoryName: editCategory,
          variants: [{ sellingPrice: Number(editPrice), mrp: Number(editMrp), stockAvailable: Number(editStock) }],
        }),
      });
      await fetch(`/api/ecommerce/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editTitle,
          sellingPrice: Number(editPrice),
        }),
      });
    } catch (err) {
      console.warn("Could not sync product edit with backend API", err);
    }

    setIsEditModalOpen(false);
    setToastMessage(`✓ Product "${editTitle}" updated successfully!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmProduct) return;

    const targetId = deleteConfirmProduct.id;
    const targetTitle = deleteConfirmProduct.title;
    const updatedList = products.filter((p) => p.id !== targetId);

    setProducts(updatedList);
    try {
      localStorage.setItem("officeconnect_custom_products", JSON.stringify(updatedList));
    } catch (err) {}

    // Call backend API in background
    try {
      await fetch(`/api/catalog/products/${targetId}`, {
        method: "DELETE",
      });
      await fetch(`/api/ecommerce/products/${targetId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Could not sync product delete with backend API", err);
    }

    setDeleteConfirmProduct(null);
    setToastMessage(`🗑️ Product "${targetTitle}" removed from your catalog and storefront.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 select-none font-sans text-slate-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner: My Storefront Quick Link */}
      <div className="rounded-[8px] border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#404d85] text-white flex items-center justify-center font-bold text-lg shrink-0">
            🖥️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs text-slate-900">Hisense Computers — Live Storefront</h4>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                bhaskeradv1@gmail.com
              </span>
            </div>
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
                My Published Catalog ({filteredProducts.length} Active Listings)
              </h3>
              <p className="text-xs text-slate-500">Products uploaded from your dashboard are live on the main marketplace and your custom storefront.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search SKU, title, or category..."
                className="px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs font-medium focus:border-[#404d85] focus:outline-hidden w-64"
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
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
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
                      <span className={`font-semibold ${p.stock <= 5 ? "text-red-600 font-bold" : "text-slate-800"}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] border ${
                        p.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : p.status === "DRAFT"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/product/${p.id}`}
                          target="_blank"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[10px] transition"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-[#404d85] rounded font-bold text-[10px] transition flex items-center gap-1"
                          title="Edit product"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmProduct(p)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#404d85] bg-indigo-50 px-2 py-0.5 rounded">
                  Edit Product Listing
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Modify Product Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Product Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:border-[#404d85] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-xs font-mono focus:border-[#404d85] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Category</label>
                  <input
                    type="text"
                    required
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:border-[#404d85] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-xs font-bold text-slate-900 focus:border-[#404d85] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">MRP (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editMrp}
                    onChange={(e) => setEditMrp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-xs text-slate-600 focus:border-[#404d85] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Stock Units</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:border-[#404d85] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Listing Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs bg-white focus:border-[#404d85] focus:outline-hidden"
                >
                  <option value="PUBLISHED">PUBLISHED (Active on Store & Marketplace)</option>
                  <option value="DRAFT">DRAFT (Hidden from Buyers)</option>
                  <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#404d85] hover:bg-[#323d6a] text-white rounded text-xs font-bold transition shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Product Listing?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove this item?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
              <p className="font-bold text-slate-900 line-clamp-2">{deleteConfirmProduct.title}</p>
              <p className="text-slate-500 font-mono text-[11px]">SKU: {deleteConfirmProduct.sku} • {formatINR(deleteConfirmProduct.price)}</p>
            </div>

            <p className="text-xs text-slate-600">
              This action will delete the product listing from your catalog, search index, and your custom storefront.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition shadow-xs"
              >
                Yes, Delete Product
              </button>
            </div>
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
