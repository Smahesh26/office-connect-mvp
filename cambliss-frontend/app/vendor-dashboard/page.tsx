"use client";

import { useState } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { SellerDashboardMetrics } from "@/components/seller-portal/SellerDashboardMetrics";
import { SellerCatalogManager, SellerProductItem } from "@/components/seller-portal/SellerCatalogManager";
import { SellerOrdersManager, SellerFulfillmentOrder } from "@/components/seller-portal/SellerOrdersManager";
import { SellerSettlementsLedger, SettlementRecord } from "@/components/seller-portal/SellerSettlementsLedger";
import { SellerBadge, formatINR } from "@/components/commerce/CommercePrimitives";

export default function VendorDashboardPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "catalog" | "orders" | "settlements" | "kyb">("dashboard");

  // Mock Vendor Metrics
  const stats = {
    gmvSales: 482500,
    netEarnings: 441487,
    escrowLocked: 64970,
    ordersPendingDispatch: 4,
    sellerRating: 4.9,
    onTimeFulfillmentPct: 99.4,
  };

  // Mock Catalog
  const [catalog, setCatalog] = useState<SellerProductItem[]>([
    {
      id: "p-1",
      title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
      sku: "OC-98214-XM5",
      category: "Electronics",
      price: 29990,
      originalPrice: 34990,
      stockQty: 24,
      status: "Active",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "p-2",
      title: "Sony WF-1000XM5 Truly Wireless Noise Canceling Earbuds",
      sku: "OC-98215-WF5",
      category: "Electronics",
      price: 23990,
      originalPrice: 26990,
      stockQty: 16,
      status: "Active",
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "p-3",
      title: "Dell UltraSharp 32-inch 4K UHD Thunderbolt Hub USB-C Monitor",
      sku: "OC-77102-U32",
      category: "Computing",
      price: 78900,
      originalPrice: 89900,
      stockQty: 3,
      status: "Low Stock",
      image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
    },
  ]);

  // Mock Orders
  const [orders, setOrders] = useState<SellerFulfillmentOrder[]>([
    {
      id: "ord-f1",
      orderNumber: "OC-89412",
      customerName: "Cambliss Studio & Tech HQ",
      customerCity: "Bengaluru, Karnataka",
      itemTitle: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
      itemQty: 1,
      totalPayout: 27440,
      carrier: "Bluedart Air Express",
      status: "Pending Dispatch",
      orderDate: "31 Aug 2026, 08:30 AM",
    },
    {
      id: "ord-f2",
      orderNumber: "OC-89390",
      customerName: "TechNova Enterprise Systems",
      customerCity: "Hyderabad, Telangana",
      itemTitle: "Dell UltraSharp 32-inch 4K UHD Thunderbolt Hub Monitor",
      itemQty: 1,
      totalPayout: 72193,
      carrier: "Delhivery Surface",
      awbNumber: "DEL-881920",
      status: "Manifest Created",
      orderDate: "30 Aug 2026, 04:15 PM",
    },
  ]);

  // Mock Settlements
  const settlements: SettlementRecord[] = [
    {
      id: "set-1",
      orderNumber: "OC-76190",
      orderDate: "14 Aug 2026",
      grossAmount: 16999,
      platformFeePct: 8.5,
      platformFeeAmount: 1445,
      netSettlement: 15554,
      settlementDate: "17 Aug 2026",
      status: "Settled to Bank",
      utrNumber: "HDFC9941029148",
    },
    {
      id: "set-2",
      orderNumber: "OC-89412",
      orderDate: "31 Aug 2026",
      grossAmount: 29990,
      platformFeePct: 8.5,
      platformFeeAmount: 2549,
      netSettlement: 27441,
      settlementDate: "Pending Delivery OTP",
      status: "In Escrow Hold",
    },
  ];

  const handleUpdateProduct = (id: string, updates: Partial<SellerProductItem>) => {
    setCatalog((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleAddNewProduct = (newProd: Omit<SellerProductItem, "id">) => {
    const created: SellerProductItem = {
      ...newProd,
      id: `p-${Date.now()}`,
    };
    setCatalog((prev) => [created, ...prev]);
  };

  const handleGenerateAwb = (orderId: string) => {
    const randomAwb = `BD-${Math.floor(10000000 + Math.random() * 90000000)}`;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "Manifest Created", awbNumber: randomAwb } : o
      )
    );
    alert(`Generated Bluedart Air AWB Label: ${randomAwb}. Ready to print packaging slip!`);
  };

  const handleMarkDispatched = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "In Transit" } : o))
    );
    alert(`Order handed over to courier. Transit tracking activated!`);
  };

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32 select-none">
        
        {/* Vendor Header */}
        <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Seller Central Operating Portal
              </h1>
              <SellerBadge sellerName="Office Connect Direct" sellerTier="premium" />
            </div>
            <p className="text-xs text-slate-500">
              Manage multi-vendor listings, fulfillment AWB labels, inventory sync, and escrow bank settlements
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/brand/sony"
              className="px-4 py-2 rounded-[4px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-2xs"
            >
              👁️ View Public Storefront →
            </Link>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 scrollbar-none text-xs font-extrabold">
          {[
            { key: "dashboard", label: "Executive Dashboard" },
            { key: "catalog", label: `Catalog & Products (${catalog.length})` },
            { key: "orders", label: `Fulfillment & Shipping (${orders.length})` },
            { key: "settlements", label: "Escrow Settlements & Payouts" },
            { key: "kyb", label: "KYB & Bank Compliance" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-[4px] transition whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-[#404d85] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. DASHBOARD OVERVIEW */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <SellerDashboardMetrics stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Orders Awaiting Courier Handover</h3>
                <SellerOrdersManager
                  orders={orders}
                  onGenerateAwb={handleGenerateAwb}
                  onMarkDispatched={handleMarkDispatched}
                />
              </div>

              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Recent Escrow Settlements</h3>
                <div className="p-4 rounded-[8px] border border-slate-200 bg-white space-y-3 text-xs">
                  {settlements.map((s) => (
                    <div key={s.id} className="pb-3 border-b border-slate-100 last:border-b-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#404d85]">{s.orderNumber}</span>
                        <span className="font-black text-slate-900">{formatINR(s.netSettlement)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{s.status}</span>
                        <span>{s.settlementDate}</span>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setActiveTab("settlements")}
                    className="w-full py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded text-center hover:bg-slate-200 transition"
                  >
                    View All Settlements Ledger →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CATALOG TAB */}
        {activeTab === "catalog" && (
          <SellerCatalogManager
            products={catalog}
            onUpdateProduct={handleUpdateProduct}
            onAddNewProduct={handleAddNewProduct}
          />
        )}

        {/* 3. ORDERS TAB */}
        {activeTab === "orders" && (
          <SellerOrdersManager
            orders={orders}
            onGenerateAwb={handleGenerateAwb}
            onMarkDispatched={handleMarkDispatched}
          />
        )}

        {/* 4. SETTLEMENTS TAB */}
        {activeTab === "settlements" && (
          <SellerSettlementsLedger
            records={settlements}
            totalSettled={stats.netEarnings}
            pendingEscrow={stats.escrowLocked}
          />
        )}

        {/* 5. KYB COMPLIANCE TAB */}
        {activeTab === "kyb" && (
          <div className="max-w-2xl bg-white p-6 rounded-[8px] border border-slate-200 space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Verified Merchant Compliance & Escrow Account
            </h3>

            <div className="space-y-3 text-slate-700">
              <div className="flex items-center justify-between">
                <span>Legal Business Entity:</span>
                <strong className="text-slate-900">Office Connect Logistics & Retail Pvt Ltd</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Registered GSTIN:</span>
                <span className="font-mono font-bold text-[#404d85]">29AABCU9603R1ZM</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Escrow Settlement Bank:</span>
                <strong className="text-slate-900">HDFC Bank • A/C: ******9812 (IFSC: HDFC000124)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Standard Take Rate:</span>
                <strong className="text-slate-900">8.5% Flat Multi-Vendor Commission</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>KYB Verification Status:</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded">
                  ✓ VERIFIED LEVEL 5 GOLD
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </StorefrontShell>
  );
}
