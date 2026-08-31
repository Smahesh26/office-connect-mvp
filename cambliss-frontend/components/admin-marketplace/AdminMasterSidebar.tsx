"use client";

import { useState } from "react";
import Link from "next/link";

export type AdminDomainView =
  | "dashboard"
  | "mkt-customers"
  | "mkt-sellers"
  | "mkt-stores"
  | "mkt-products"
  | "mkt-categories"
  | "mkt-brands"
  | "com-orders"
  | "com-returns"
  | "com-refunds"
  | "com-reviews"
  | "fin-payments"
  | "fin-commissions"
  | "fin-settlements"
  | "fin-payouts"
  | "mktg-coupons"
  | "mktg-promotions"
  | "mktg-banners"
  | "mktg-featured"
  | "ops-support"
  | "ops-notifications"
  | "ops-audit"
  | "analytics"
  | "set-roles"
  | "set-permissions"
  | "set-taxes"
  | "set-config";

export const AdminMasterSidebar = ({
  activeView,
  onSelectView,
}: {
  activeView: AdminDomainView;
  onSelectView: (view: AdminDomainView) => void;
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    marketplace: true,
    commerce: true,
    finance: true,
    marketing: false,
    operations: false,
    settings: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="w-full lg:w-64 bg-slate-950 text-slate-300 p-4 rounded-[8px] space-y-4 select-none shrink-0 shadow-lg border border-slate-800">
      
      {/* Super-Admin Header */}
      <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
            🛡️
          </div>
          <div>
            <h3 className="font-extrabold text-white text-xs tracking-tight">Governance Vault</h3>
            <span className="text-[10px] text-amber-400 font-bold block">Super-Admin Root</span>
          </div>
        </div>
      </div>

      <nav className="space-y-1 text-xs font-semibold">
        
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => onSelectView("dashboard")}
          className={`w-full p-2.5 rounded text-left flex items-center justify-between transition ${
            activeView === "dashboard"
              ? "bg-[#404d85] text-white font-black"
              : "hover:bg-slate-800/80 text-slate-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <span>📊</span>
            <span>Dashboard</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>

        {/* 2. Marketplace */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("marketplace")}
            className="w-full p-2 rounded text-left flex items-center justify-between hover:bg-slate-800 text-slate-200 transition"
          >
            <span className="flex items-center gap-2">
              <span>🏬</span>
              <span>Marketplace</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {openSections.marketplace ? "▼" : "▶"}
            </span>
          </button>

          {openSections.marketplace && (
            <div className="pl-6 pt-1 space-y-0.5 border-l border-slate-800 ml-3">
              {[
                { id: "mkt-customers" as AdminDomainView, label: "Customers (1,420)" },
                { id: "mkt-sellers" as AdminDomainView, label: "Sellers (24 KYB)", badge: "3 New" },
                { id: "mkt-stores" as AdminDomainView, label: "Stores (18)" },
                { id: "mkt-products" as AdminDomainView, label: "Products (4,820)" },
                { id: "mkt-categories" as AdminDomainView, label: "Categories (32)" },
                { id: "mkt-brands" as AdminDomainView, label: "Brands (12)" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectView(sub.id)}
                  className={`w-full py-1.5 px-2 rounded text-left text-[11px] flex items-center justify-between transition ${
                    activeView === sub.id
                      ? "bg-[#404d85] text-white font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span>{sub.label}</span>
                  {sub.badge && (
                    <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px]">
                      {sub.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Commerce */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("commerce")}
            className="w-full p-2 rounded text-left flex items-center justify-between hover:bg-slate-800 text-slate-200 transition"
          >
            <span className="flex items-center gap-2">
              <span>🛒</span>
              <span>Commerce</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {openSections.commerce ? "▼" : "▶"}
            </span>
          </button>

          {openSections.commerce && (
            <div className="pl-6 pt-1 space-y-0.5 border-l border-slate-800 ml-3">
              {[
                { id: "com-orders" as AdminDomainView, label: "Orders (284 Today)" },
                { id: "com-returns" as AdminDomainView, label: "Returns (2 RMA)" },
                { id: "com-refunds" as AdminDomainView, label: "Refunds ($24K)" },
                { id: "com-reviews" as AdminDomainView, label: "Reviews (98% 5★)" },
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

        {/* 4. Finance */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("finance")}
            className="w-full p-2 rounded text-left flex items-center justify-between hover:bg-slate-800 text-slate-200 transition"
          >
            <span className="flex items-center gap-2">
              <span>💳</span>
              <span>Finance</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {openSections.finance ? "▼" : "▶"}
            </span>
          </button>

          {openSections.finance && (
            <div className="pl-6 pt-1 space-y-0.5 border-l border-slate-800 ml-3">
              {[
                { id: "fin-payments" as AdminDomainView, label: "Payments ($1.2M GMV)" },
                { id: "fin-commissions" as AdminDomainView, label: "Commissions (8.5% Cut)" },
                { id: "fin-settlements" as AdminDomainView, label: "Settlements ($182K)" },
                { id: "fin-payouts" as AdminDomainView, label: "Payouts Dispatch" },
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

        {/* 5. Marketing */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("marketing")}
            className="w-full p-2 rounded text-left flex items-center justify-between hover:bg-slate-800 text-slate-200 transition"
          >
            <span className="flex items-center gap-2">
              <span>📣</span>
              <span>Marketing</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {openSections.marketing ? "▼" : "▶"}
            </span>
          </button>

          {openSections.marketing && (
            <div className="pl-6 pt-1 space-y-0.5 border-l border-slate-800 ml-3">
              {[
                { id: "mktg-coupons" as AdminDomainView, label: "Coupons & Vouchers" },
                { id: "mktg-promotions" as AdminDomainView, label: "Promotions & Deals" },
                { id: "mktg-banners" as AdminDomainView, label: "Hero Banners" },
                { id: "mktg-featured" as AdminDomainView, label: "Featured Content" },
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

        {/* 6. Operations */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("operations")}
            className="w-full p-2 rounded text-left flex items-center justify-between hover:bg-slate-800 text-slate-200 transition"
          >
            <span className="flex items-center gap-2">
              <span>⚙️</span>
              <span>Operations</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {openSections.operations ? "▼" : "▶"}
            </span>
          </button>

          {openSections.operations && (
            <div className="pl-6 pt-1 space-y-0.5 border-l border-slate-800 ml-3">
              {[
                { id: "ops-support" as AdminDomainView, label: "Support & Disputes" },
                { id: "ops-notifications" as AdminDomainView, label: "Notifications" },
                { id: "ops-audit" as AdminDomainView, label: "Audit Logs" },
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

        {/* 8. Settings */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("settings")}
            className="w-full p-2 rounded text-left flex items-center justify-between hover:bg-slate-800 text-slate-200 transition"
          >
            <span className="flex items-center gap-2">
              <span>🔧</span>
              <span>Settings</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {openSections.settings ? "▼" : "▶"}
            </span>
          </button>

          {openSections.settings && (
            <div className="pl-6 pt-1 space-y-0.5 border-l border-slate-800 ml-3">
              {[
                { id: "set-roles" as AdminDomainView, label: "Roles" },
                { id: "set-permissions" as AdminDomainView, label: "Permissions" },
                { id: "set-taxes" as AdminDomainView, label: "Taxes (TCS/TDS)" },
                { id: "set-config" as AdminDomainView, label: "Marketplace Config" },
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

      </nav>

      {/* Return to Storefront */}
      <div className="pt-4 border-t border-slate-800 text-center">
        <Link
          href="/storefront"
          className="text-[11px] font-bold text-slate-400 hover:text-white inline-flex items-center gap-1"
        >
          <span>← Back to Storefront</span>
        </Link>
      </div>

    </aside>
  );
};
