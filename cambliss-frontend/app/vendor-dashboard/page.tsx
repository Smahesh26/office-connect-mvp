"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MarketplacePageWrapper } from "@/components/storefront/MarketplacePageWrapper";
import { SellerNavSidebar, SellerPortalView } from "@/components/seller-portal/SellerNavSidebar";
import { SellerDashboardHeroMetrics } from "@/components/seller-portal/SellerDashboardHeroMetrics";
import { SellerCatalogSuite } from "@/components/seller-portal/SellerCatalogSuite";
import { SellerOrdersPipeline } from "@/components/seller-portal/SellerOrdersPipeline";
import { SellerFinanceSuite } from "@/components/seller-portal/SellerFinanceSuite";
import { SellerPricingPromos } from "@/components/seller-portal/SellerPricingPromos";

export default function VendorDashboardPage() {
  const [activeView, setActiveView] = useState<SellerPortalView>("dashboard");
  const [storeSlug, setStoreSlug] = useState("my-store");
  const [storeName, setStoreName] = useState("Merchant Portal");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("authUser");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.email) setUserEmail(u.email);
      }
      const allSubmitted = localStorage.getItem("officeconnect_submitted_applications");
      if (allSubmitted) {
        const list = JSON.parse(allSubmitted);
        if (Array.isArray(list) && list.length > 0) {
          const app = list[list.length - 1];
          if (app.storeSlug) setStoreSlug(app.storeSlug);
          if (app.tradeName) setStoreName(app.tradeName);
        }
      }
    } catch (e) {}
  }, []);

  return (
    <MarketplacePageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-32 select-none font-sans text-slate-900">
        
        {/* Top Header & Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-900 font-bold">{storeName}</span>
              <span>/</span>
              <span className="capitalize text-slate-600">{activeView.replace("-", " > ")}</span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>🖥️</span> {storeName} — Merchant Portal
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                VERIFIED SELLER
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Store Owner: <strong className="text-slate-800 font-semibold">{userEmail || "Registered Merchant"}</strong> • Manage hardware catalog, order dispatch, Buy Box pricing, and escrow payouts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/store/${storeSlug}`}
              target="_blank"
              className="px-3.5 py-1.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-semibold text-xs transition shadow-2xs flex items-center gap-1.5"
            >
              <span>🏪</span> Open My Storefront →
            </Link>
            <Link
              href="/storefront"
              className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
            >
              Browse Marketplace 🌐
            </Link>
          </div>
        </div>

        {/* 2-Column Information Architecture: Left Navigation & Right Workdesk */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Left: Hierarchical Navigation Sidebar */}
          <SellerNavSidebar
            activeView={activeView}
            onSelectView={setActiveView}
          />

          {/* Right: Dynamic Workdesk View */}
          <main className="flex-1 min-w-0 w-full">
            
            {/* 1. DASHBOARD */}
            {activeView === "dashboard" && (
              <SellerDashboardHeroMetrics
                onNavigateToOrders={() => setActiveView("orders-new")}
                onNavigateToInventory={() => setActiveView("inventory")}
              />
            )}

            {/* 2. CATALOG SUBMODULES */}
            {activeView === "catalog-products" && (
              <SellerCatalogSuite activeSubView="products" />
            )}
            {activeView === "catalog-add" && (
              <SellerCatalogSuite activeSubView="add" onFinishAdd={() => setActiveView("catalog-products")} />
            )}
            {activeView === "catalog-bulk" && (
              <SellerCatalogSuite activeSubView="bulk" />
            )}
            {activeView === "catalog-categories" && (
              <SellerCatalogSuite activeSubView="categories" />
            )}

            {/* 3. INVENTORY */}
            {activeView === "inventory" && (
              <SellerPricingPromos viewType="inventory" />
            )}

            {/* 4. ORDERS SUBMODULES */}
            {activeView.startsWith("orders-") && (
              <SellerOrdersPipeline
                initialTab={activeView.replace("orders-", "") as any}
              />
            )}

            {/* 5. PRICING */}
            {activeView === "pricing" && (
              <SellerPricingPromos viewType="pricing" />
            )}

            {/* 6. PROMOTIONS */}
            {activeView === "promotions" && (
              <SellerPricingPromos viewType="promotions" />
            )}

            {/* 7. FINANCE & PAYOUTS */}
            {activeView.startsWith("finance-") && (
              <SellerFinanceSuite activeSubView={activeView.replace("finance-", "") as any} />
            )}

          </main>
        </div>

      </div>
    </MarketplacePageWrapper>
  );
}
