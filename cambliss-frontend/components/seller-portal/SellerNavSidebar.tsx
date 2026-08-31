"use client";

import { useState } from "react";
import Link from "next/link";

export type SellerPortalView =
  | "dashboard"
  | "catalog-products"
  | "catalog-add"
  | "catalog-bulk"
  | "catalog-categories"
  | "inventory"
  | "orders-new"
  | "orders-processing"
  | "orders-ready"
  | "orders-shipped"
  | "orders-delivered"
  | "orders-cancelled"
  | "orders-returns"
  | "pricing"
  | "promotions"
  | "analytics"
  | "finance-earnings"
  | "finance-commission"
  | "finance-settlements"
  | "finance-payouts"
  | "store"
  | "settings";

export const SellerNavSidebar = ({
  activeView,
  onSelectView,
}: {
  activeView: SellerPortalView;
  onSelectView: (view: SellerPortalView) => void;
}) => {
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [financeOpen, setFinanceOpen] = useState(true);

  return (
    <aside className="w-full lg:w-64 bg-slate-900 text-slate-300 p-4 rounded-[8px] space-y-4 select-none shrink-0 shadow-sm">
      
      {/* Merchant Profile Header */}
      <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded bg-[#404d85] text-white font-black flex items-center justify-center text-xs shrink-0">
            👑
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-white text-xs truncate">Sony India Direct</h3>
            <span className="text-[10px] text-emerald-400 font-bold block">Gold Tier Seller</span>
          </div>
        </div>
      </div>

      {/* Navigation Tree */}
      <nav className="space-y-1 text-xs font-semibold">
        
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => onSelectView("dashboard")}
          className={`w-full p-2.5 rounded text-left flex items-center justify-between transition ${
            activeView === "dashboard"
              ? "bg-[#404d85] text-white font-black"
              : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <span>📊</span>
            <span>Dashboard</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>

        {/* 2. Catalog (Dropdown) */}
        <div>
          <button
            type="button"
            onClick={() => setCatalogOpen(!catalogOpen)}
            className="w-full p-2.5 rounded text-left flex items-center justify-between hover:bg-slate-800 text-slate-300 transition"
          >
            <span className="flex items-center gap-2">
              <span>📁</span>
              <span>Catalog</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {catalogOpen ? "▼" : "▶"}
            </span>
          </button>

          {catalogOpen && (
            <div className="pl-6 pt-1 space-y-1 border-l border-slate-800 ml-3">
              {[
                { id: "catalog-products" as SellerPortalView, label: "Products (24)" },
                { id: "catalog-add" as SellerPortalView, label: "+ Add Listing" },
                { id: "catalog-bulk" as SellerPortalView, label: "Bulk Upload" },
                { id: "catalog-categories" as SellerPortalView, label: "Categories" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectView(sub.id)}
                  className={`w-full py-1.5 px-2 rounded text-left text-[11px] block transition ${
                    activeView === sub.id
                      ? "bg-[#404d85] text-white font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Inventory */}
        <button
          type="button"
          onClick={() => onSelectView("inventory")}
          className={`w-full p-2.5 rounded text-left flex items-center justify-between transition ${
            activeView === "inventory"
              ? "bg-[#404d85] text-white font-black"
              : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <span>📦</span>
            <span>Inventory</span>
          </span>
          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
            4 Low
          </span>
        </button>

        {/* 4. Orders (Dropdown) */}
        <div>
          <button
            type="button"
            onClick={() => setOrdersOpen(!ordersOpen)}
            className="w-full p-2.5 rounded text-left flex items-center justify-between hover:bg-slate-800 text-slate-300 transition"
          >
            <span className="flex items-center gap-2">
              <span>📑</span>
              <span>Orders</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {ordersOpen ? "▼" : "▶"}
            </span>
          </button>

          {ordersOpen && (
            <div className="pl-6 pt-1 space-y-1 border-l border-slate-800 ml-3">
              {[
                { id: "orders-new" as SellerPortalView, label: "New (12)", badge: "12" },
                { id: "orders-processing" as SellerPortalView, label: "Processing (8)" },
                { id: "orders-ready" as SellerPortalView, label: "Ready to Ship (4)" },
                { id: "orders-shipped" as SellerPortalView, label: "Shipped (32)" },
                { id: "orders-delivered" as SellerPortalView, label: "Delivered (114)" },
                { id: "orders-cancelled" as SellerPortalView, label: "Cancelled (2)" },
                { id: "orders-returns" as SellerPortalView, label: "Returns (1)" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectView(sub.id)}
                  className={`w-full py-1.5 px-2 rounded text-left text-[11px] block transition ${
                    activeView === sub.id
                      ? "bg-[#404d85] text-white font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. Pricing */}
        <button
          type="button"
          onClick={() => onSelectView("pricing")}
          className={`w-full p-2.5 rounded text-left flex items-center justify-between transition ${
            activeView === "pricing"
              ? "bg-[#404d85] text-white font-black"
              : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <span>🏷️</span>
            <span>Pricing</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">96% BuyBox</span>
        </button>

        {/* 6. Promotions */}
        <button
          type="button"
          onClick={() => onSelectView("promotions")}
          className={`w-full p-2.5 rounded text-left flex items-center gap-2 transition ${
            activeView === "promotions"
              ? "bg-[#404d85] text-white font-black"
              : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span>🎁</span>
          <span>Promotions</span>
        </button>

        {/* 7. Analytics */}
        <button
          type="button"
          onClick={() => onSelectView("analytics")}
          className={`w-full p-2.5 rounded text-left flex items-center gap-2 transition ${
            activeView === "analytics"
              ? "bg-[#404d85] text-white font-black"
              : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span>📈</span>
          <span>Analytics</span>
        </button>

        {/* 8. Finance (Dropdown) */}
        <div>
          <button
            type="button"
            onClick={() => setFinanceOpen(!financeOpen)}
            className="w-full p-2.5 rounded text-left flex items-center justify-between hover:bg-slate-800 text-slate-300 transition"
          >
            <span className="flex items-center gap-2">
              <span>💳</span>
              <span>Finance</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {financeOpen ? "▼" : "▶"}
            </span>
          </button>

          {financeOpen && (
            <div className="pl-6 pt-1 space-y-1 border-l border-slate-800 ml-3">
              {[
                { id: "finance-earnings" as SellerPortalView, label: "Earnings" },
                { id: "finance-commission" as SellerPortalView, label: "Commission (8.5%)" },
                { id: "finance-settlements" as SellerPortalView, label: "Settlements" },
                { id: "finance-payouts" as SellerPortalView, label: "Payouts" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectView(sub.id)}
                  className={`w-full py-1.5 px-2 rounded text-left text-[11px] block transition ${
                    activeView === sub.id
                      ? "bg-[#404d85] text-white font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 9. Store */}
        <button
          type="button"
          onClick={() => onSelectView("store")}
          className={`w-full p-2.5 rounded text-left flex items-center gap-2 transition ${
            activeView === "store"
              ? "bg-[#404d85] text-white font-black"
              : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span>🏬</span>
          <span>Store</span>
        </button>

        {/* 10. Settings */}
        <button
          type="button"
          onClick={() => onSelectView("settings")}
          className={`w-full p-2.5 rounded text-left flex items-center gap-2 transition ${
            activeView === "settings"
              ? "bg-[#404d85] text-white font-black"
              : "hover:bg-slate-800 text-slate-300"
          }`}
        >
          <span>⚙️</span>
          <span>Settings</span>
        </button>

      </nav>

      {/* Direct link to Storefront */}
      <div className="pt-4 border-t border-slate-800 text-center">
        <Link
          href="/brand/sony"
          target="_blank"
          className="text-[11px] font-bold text-slate-400 hover:text-white inline-flex items-center gap-1"
        >
          <span>View Public Storefront ↗</span>
        </Link>
      </div>

    </aside>
  );
};
