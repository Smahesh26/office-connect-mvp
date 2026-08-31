"use client";

import { useState } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { SellerNavSidebar, SellerPortalView } from "@/components/seller-portal/SellerNavSidebar";
import { SellerDashboardHeroMetrics } from "@/components/seller-portal/SellerDashboardHeroMetrics";
import { SellerCatalogSuite } from "@/components/seller-portal/SellerCatalogSuite";
import { SellerOrdersPipeline } from "@/components/seller-portal/SellerOrdersPipeline";
import { SellerFinanceSuite } from "@/components/seller-portal/SellerFinanceSuite";
import { SellerPricingPromos } from "@/components/seller-portal/SellerPricingPromos";

export default function VendorDashboardPage() {
  const [activeView, setActiveView] = useState<SellerPortalView>("dashboard");

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-32 select-none">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-bold text-slate-900">Seller Central Operating Suite</span>
              <span>/</span>
              <span className="capitalize">{activeView.replace("-", " > ")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Merchant Vendor Portal
            </h1>
            <p className="text-xs text-slate-500">
              Manage multi-vendor catalog, orders fulfillment, automated repricing, and escrow finance payouts.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Link
              href="/storefront"
              className="text-xs font-bold text-[#404d85] hover:underline"
            >
              ← Back to Marketplace
            </Link>
          </div>
        </div>

        {/* 2-Column Information Architecture: Left Sidebar & Right Dynamic Workdesk */}
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
              <SellerCatalogSuite activeSubView="add" />
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

            {/* 7. ANALYTICS */}
            {activeView === "analytics" && (
              <SellerPricingPromos viewType="analytics" />
            )}

            {/* 8. FINANCE SUBMODULES */}
            {activeView === "finance-earnings" && (
              <SellerFinanceSuite activeSubView="earnings" />
            )}
            {activeView === "finance-commission" && (
              <SellerFinanceSuite activeSubView="commission" />
            )}
            {activeView === "finance-settlements" && (
              <SellerFinanceSuite activeSubView="settlements" />
            )}
            {activeView === "finance-payouts" && (
              <SellerFinanceSuite activeSubView="payouts" />
            )}

            {/* 9. STORE */}
            {activeView === "store" && (
              <SellerPricingPromos viewType="store" />
            )}

            {/* 10. SETTINGS */}
            {activeView === "settings" && (
              <SellerPricingPromos viewType="settings" />
            )}

          </main>

        </div>

      </div>
    </StorefrontShell>
  );
}
