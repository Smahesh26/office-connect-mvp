"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Store,
  ExternalLink,
  Package,
  TrendingUp,
  CheckCircle2,
  Lock,
  Sparkles,
  ShieldCheck,
  X,
  UploadCloud,
  Layers,
  Trash2,
  Pencil,
} from "lucide-react";
import { ProductCardProps, formatINR } from "@/components/commerce/CommercePrimitives";

export interface CustomMerchantProduct {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  stockQty: number;
  sku: string;
  hsn: string;
  image: string;
  sellerName: string;
  sellerTier: "premium" | "verified" | "standard";
  badge?: string;
  rating: number;
  reviewsCount: number;
  createdAt: string;
}

const DEFAULT_HISENSE_PRODUCTS: CustomMerchantProduct[] = [
  {
    id: "prod-hisense-visionbook",
    title: "Hisense VisionBook Pro 16 AI Workstation Laptop (Core i9, 32GB, RTX 4070)",
    brand: "Hisense Computers",
    category: "Computing",
    price: 149990,
    originalPrice: 179990,
    stockQty: 18,
    sku: "HS-VB16-AI",
    hsn: "84713010",
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80",
    sellerName: "Hisense Computers (bhaskeradv1@gmail.com) 👑",
    sellerTier: "premium",
    badge: "★ FLAGSHIP WORKSTATION",
    rating: 4.9,
    reviewsCount: 142,
    createdAt: "2026-09-01",
  },
  {
    id: "prod-hisense-aio27",
    title: "Hisense Infinity AIO 27\" 4K All-In-One Desktop Computer",
    brand: "Hisense Computers",
    category: "Computing",
    price: 84990,
    originalPrice: 99990,
    stockQty: 22,
    sku: "HS-AIO27-4K",
    hsn: "84714190",
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80",
    sellerName: "Hisense Computers (bhaskeradv1@gmail.com) 👑",
    sellerTier: "premium",
    badge: "4K INFINITYEDGE",
    rating: 4.9,
    reviewsCount: 98,
    createdAt: "2026-09-02",
  },
  {
    id: "prod-hisense-ultraview34",
    title: "Hisense UltraView 34-Inch Curved WQHD USB-C Ergonomic Hub Monitor",
    brand: "Hisense Computers",
    category: "Computing",
    price: 38990,
    originalPrice: 46990,
    stockQty: 35,
    sku: "HS-UV34-WQHD",
    hsn: "85285200",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
    sellerName: "Hisense Computers (bhaskeradv1@gmail.com) 👑",
    sellerTier: "premium",
    badge: "165HZ WQHD",
    rating: 4.8,
    reviewsCount: 184,
    createdAt: "2026-09-03",
  },
];

const PRESET_PRODUCT_IMAGES = [
  { label: "AI Laptop", url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80" },
  { label: "4K Desktop", url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80" },
  { label: "Curved Monitor", url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80" },
  { label: "Wireless Keyboard", url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80" },
  { label: "Pro Gaming Mouse", url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80" },
];

interface MerchantStorefrontAndUploadTabProps {
  isVerified?: boolean;
  userEmail?: string;
  onNavigateToOnboarding?: () => void;
  onProductAdded?: (product: CustomMerchantProduct) => void;
}

export const MerchantStorefrontAndUploadTab = ({
  isVerified = true,
  userEmail = "bhaskeradv1@gmail.com",
  onNavigateToOnboarding,
  onProductAdded,
}: MerchantStorefrontAndUploadTabProps) => {
  const [products, setProducts] = useState<CustomMerchantProduct[]>(DEFAULT_HISENSE_PRODUCTS);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Product Form State
  const [newTitle, setNewTitle] = useState("");
  const [newBrand, setNewBrand] = useState("Hisense Computers");
  const [newCategory, setNewCategory] = useState("Computing");
  const [newPrice, setNewPrice] = useState("24990");
  const [newMrp, setNewMrp] = useState("29990");
  const [newStock, setNewStock] = useState("25");
  const [newSku, setNewSku] = useState("HS-PROD-" + Math.floor(100 + Math.random() * 900));
  const [newHsn, setNewHsn] = useState("8471");
  const [newImage, setNewImage] = useState(PRESET_PRODUCT_IMAGES[0].url);

  // Load any previously created products from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("officeconnect_custom_products");
      if (stored) {
        const customList: CustomMerchantProduct[] = JSON.parse(stored);
        if (customList.length > 0) {
          // Merge avoiding duplicates
          const map = new Map<string, CustomMerchantProduct>();
          DEFAULT_HISENSE_PRODUCTS.forEach((p) => map.set(p.id, p));
          customList.forEach((p) => map.set(p.id, p));
          setProducts(Array.from(map.values()));
        }
      }
    } catch (e) {}
  }, []);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const priceNum = parseFloat(newPrice) || 999;
    const mrpNum = parseFloat(newMrp) || priceNum * 1.25;
    const stockNum = parseInt(newStock, 10) || 10;

    const newProd: CustomMerchantProduct = {
      id: `prod-custom-${Date.now()}`,
      title: newTitle.trim(),
      brand: newBrand.trim() || "Hisense Computers",
      category: newCategory,
      price: priceNum,
      originalPrice: mrpNum,
      stockQty: stockNum,
      sku: newSku.trim() || "SKU-" + Date.now(),
      hsn: newHsn.trim() || "8471",
      image: newImage || PRESET_PRODUCT_IMAGES[0].url,
      sellerName: `Hisense Computers (${userEmail}) 👑`,
      sellerTier: "premium",
      badge: "⚡ NEW LAUNCH",
      rating: 5.0,
      reviewsCount: 1,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updatedList = [newProd, ...products];
    setProducts(updatedList);

    // Save to localStorage
    try {
      localStorage.setItem("officeconnect_custom_products", JSON.stringify(updatedList));
    } catch (err) {}

    // Notify parent to inject into Marketplace live catalog
    if (onProductAdded) {
      onProductAdded(newProd);
    }

    // Reset Form & Close Modal
    setIsUploadModalOpen(false);
    setNewTitle("");
    setNewSku("HS-PROD-" + Math.floor(100 + Math.random() * 900));

    setToastMessage(`🎉 "${newProd.title}" successfully published! It is now live on the Multi-Vendor Marketplace catalog and your custom storefront.`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Edit Product Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CustomMerchantProduct | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editCategory, setEditCategory] = useState("Computing");
  const [editPrice, setEditPrice] = useState("");
  const [editMrp, setEditMrp] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editHsn, setEditHsn] = useState("");
  const [editImage, setEditImage] = useState("");

  const handleOpenEdit = (p: CustomMerchantProduct) => {
    setEditingProduct(p);
    setEditTitle(p.title);
    setEditBrand(p.brand || "Hisense Computers");
    setEditCategory(p.category || "Computing");
    setEditPrice(String(p.price));
    setEditMrp(String(p.originalPrice || p.price * 1.2));
    setEditStock(String(p.stockQty));
    setEditSku(p.sku);
    setEditHsn(p.hsn);
    setEditImage(p.image);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editTitle.trim()) return;

    const priceNum = parseFloat(editPrice) || editingProduct.price;
    const mrpNum = parseFloat(editMrp) || priceNum;
    const stockNum = parseInt(editStock, 10) || 0;

    const updatedList = products.map((p) => {
      if (p.id === editingProduct.id) {
        return {
          ...p,
          title: editTitle.trim(),
          brand: editBrand.trim() || p.brand,
          category: editCategory,
          price: priceNum,
          originalPrice: mrpNum,
          stockQty: stockNum,
          sku: editSku.trim() || p.sku,
          hsn: editHsn.trim() || p.hsn,
          image: editImage || p.image,
        };
      }
      return p;
    });

    setProducts(updatedList);
    try {
      localStorage.setItem("officeconnect_custom_products", JSON.stringify(updatedList));
    } catch (err) {}

    try {
      await fetch(`/api/catalog/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          categoryName: editCategory,
          variants: [{ sellingPrice: priceNum, mrp: mrpNum, stockAvailable: stockNum }],
        }),
      });
      await fetch(`/api/ecommerce/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editTitle.trim(),
          sellingPrice: priceNum,
        }),
      });
    } catch (err) {}

    setIsEditModalOpen(false);
    setToastMessage(`✓ Product "${editTitle}" updated successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteProduct = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (window.confirm(`Remove "${target?.title || "this product"}" from your storefront and marketplace?`)) {
      const filtered = products.filter((p) => p.id !== id);
      setProducts(filtered);
      try {
        localStorage.setItem("officeconnect_custom_products", JSON.stringify(filtered));
      } catch (err) {}

      try {
        await fetch(`/api/catalog/products/${id}`, { method: "DELETE" });
        await fetch(`/api/ecommerce/products/${id}`, { method: "DELETE" });
      } catch (err) {}

      setToastMessage(`🗑️ Product "${target?.title || id}" deleted successfully.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // IF NOT VERIFIED (GATED STATE)
  if (!isVerified) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center select-none shadow-xs space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-2xl mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900">
            Manual Verification In Progress (~2 Days)
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            Storefront & Product Uploads Locked
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
            In accordance with Indian Consumer Protection (E-Commerce) Rules and GST compliance mandates, seller storefronts and catalog publishing are gated until your 2-day manual KYB background check is completed.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onNavigateToOnboarding}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition shadow-xs"
          >
            Check 2-Day Review Status →
          </button>
          <Link
            href="/seller-central"
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
          >
            Seller Central Guidelines
          </Link>
        </div>
      </div>
    );
  }

  // IF VERIFIED: FULL STOREFRONT & PRODUCT UPLOAD WORKDESK
  return (
    <div className="space-y-6 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {/* Top Store Identity Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/90 via-white to-slate-50 p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#404d85] text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
            🖥️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">
                Hisense Computers — Verified Brand Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                VERIFIED SELLER 👑
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Owner: <strong className="text-slate-800 font-semibold">{userEmail}</strong> • Official Storefront: <span className="font-mono text-violet-700">https://theofficeconnect.com/store/hisense-computers</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs transition shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Upload New Product
          </button>

          <Link
            href="/store/hisense-computers"
            target="_blank"
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            View Live Storefront
          </Link>

          <Link
            href="/vendor-dashboard"
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
          >
            Vendor Workdesk →
          </Link>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Listings", val: `${products.length} SKUs`, sub: "Live on marketplace & store" },
          { label: "Total Inventory Units", val: `${products.reduce((acc, p) => acc + (p.stockQty || 0), 0)} Units`, sub: "Easy Ship warehouse stock" },
          { label: "30-Day GMV Volume", val: "₹2,73,970", sub: "Buy Box orders" },
          { label: "Escrow Settlement", val: "7-Day Payout", sub: "Razorpay Virtual A/C Active ✓" },
        ].map((m, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{m.label}</span>
            <span className="text-lg font-black text-slate-900 block">{m.val}</span>
            <span className="text-[10px] text-slate-500 block">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* RAZORPAY VIRTUAL ACCOUNT & SETTLEMENT ESCROW CARD */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#404d85] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              🏦
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span>Razorpay Dedicated Virtual Account & Escrow Settlement</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[9px] border border-emerald-200">
                  AUTOMATED PAYOUTS
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                All customer payments are routed through your isolated virtual account with 7-day return cooling & double-entry ledger tracking.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-600 font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            VA ID: va_hisense_8819
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Virtual Account Number</span>
            <strong className="text-sm font-mono font-black text-slate-900 block">OCHISENSE9021</strong>
            <span className="text-[10px] text-slate-500 block">IFSC: RAZR0000001</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Virtual UPI Handle</span>
            <strong className="text-sm font-mono font-black text-indigo-700 block">hisense.officeconnect@icici</strong>
            <span className="text-[10px] text-slate-500 block">Instant customer split transfer</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Net Settled to Bank</span>
            <strong className="text-sm font-black text-emerald-700 block">₹1,24,900</strong>
            <span className="text-[10px] text-emerald-600 font-semibold block">HDFC Bank A/C ...9284 ✓</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">In 7-Day Return Escrow</span>
            <strong className="text-sm font-black text-amber-700 block">₹46,746</strong>
            <span className="text-[10px] text-amber-600 font-semibold block">Releases upon return window expiry</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-indigo-100 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Marketplace Commission Take-Rate: <strong className="text-slate-800 font-bold">7.5%</strong></span>
            <span>•</span>
            <span>GST on Commission: <strong className="text-slate-800 font-bold">18% (Automated Invoiced)</strong></span>
            <span>•</span>
            <span>TCS Withholding: <strong className="text-slate-800 font-bold">1% (Sec 52 CGST)</strong></span>
          </div>
          <span className="text-[10px] font-semibold text-[#404d85]">
            Immutable Financial Ledger Governed ✓
          </span>
        </div>
      </div>

      {/* Products Catalog Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              My Storefront Products Catalog ({products.length})
            </h3>
            <p className="text-xs text-slate-500">
              All products listed here appear live in the Multi-Vendor Marketplace catalog with your merchant badge.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add SKU
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Product Details & SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Selling Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Ecommerce Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate max-w-xs sm:max-w-sm">
                          {p.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>SKU: {p.sku}</span>
                          <span>•</span>
                          <span>HSN: {p.hsn}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[10px]">
                      {p.category}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-black text-slate-900 block text-xs">
                      {formatINR(p.price)}
                    </span>
                    <span className="text-[10px] text-slate-400 line-through">
                      {formatINR(p.originalPrice)}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`font-bold text-xs ${p.stockQty > 5 ? "text-emerald-700" : "text-amber-700"}`}>
                      {p.stockQty} in Stock
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ● Live on Ecommerce
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/product/${p.id}`}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        title="Edit product"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id)}
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

      {/* Quick Upload Product Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                  Merchant SKU Publisher
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Upload Product to Hisense Computers Storefront
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Product Listing Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Hisense VisionPro 14-inch Touch OLED Laptop"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="Computing">Computing & Accessories</option>
                    <option value="Electronics">Consumer Electronics</option>
                    <option value="Apparel">Apparel & Fashion</option>
                    <option value="Beauty">Beauty & Wellness</option>
                    <option value="Automotive">Automotive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={newMrp}
                    onChange={(e) => setNewMrp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inventory Stock</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={newHsn}
                    onChange={(e) => setNewHsn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Preset Image Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Select Product Thumbnail / Image
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_PRODUCT_IMAGES.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewImage(img.url)}
                      className={`p-1 rounded-xl border transition flex flex-col items-center gap-1 ${
                        newImage === img.url
                          ? "border-violet-600 bg-violet-50 ring-2 ring-violet-500"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-10 h-10 object-cover rounded-lg" />
                      <span className="text-[9px] font-bold text-slate-700 truncate w-full text-center">
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Publish to Marketplace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Edit Store SKU
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Edit Product Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-hidden"
                  >
                    <option value="Computing">Computing & Laptops</option>
                    <option value="Workstations">AI Workstations</option>
                    <option value="Monitors">Curved & Ergonomic Monitors</option>
                    <option value="Peripherals">Keyboards & Mice</option>
                    <option value="Audio">Headphones & Acoustics</option>
                    <option value="Apparel">Fashion & Streetwear</option>
                    <option value="Beauty">Organic Skincare</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={editMrp}
                    onChange={(e) => setEditMrp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inventory Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={editHsn}
                    onChange={(e) => setEditHsn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Preset Image Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Update Thumbnail / Image
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_PRODUCT_IMAGES.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditImage(img.url)}
                      className={`p-1 rounded-xl border transition flex flex-col items-center gap-1 ${
                        editImage === img.url
                          ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-10 h-10 object-cover rounded-lg" />
                      <span className="text-[9px] font-bold text-slate-700 truncate w-full text-center">
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#404d85] hover:bg-[#323d6a] text-white font-extrabold shadow-md flex items-center gap-1.5"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantStorefrontAndUploadTab;
