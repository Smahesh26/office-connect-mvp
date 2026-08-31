"use client";

import { useState } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { AdminMetricsOverview } from "@/components/admin-marketplace/AdminMetricsOverview";
import { AdminSellerKybDesk, SellerKybApplication } from "@/components/admin-marketplace/AdminSellerKybDesk";
import { AdminCommissionEngine, CategoryCommissionRule } from "@/components/admin-marketplace/AdminCommissionEngine";
import { AdminEscrowVaultDispatcher, EscrowPayoutBatch } from "@/components/admin-marketplace/AdminEscrowVaultDispatcher";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "kyb" | "commission" | "escrow">("overview");

  // Platform KPIs
  const [stats, setStats] = useState({
    totalGmv: 28450000,
    platformNetCommission: 2418250,
    escrowVaultHeld: 1845000,
    activeSellersCount: 148,
    activeBuyersCount: 12480,
    pendingKybCount: 3,
    disputeCount: 2,
  });

  // Seller KYB Queue
  const [applications, setApplications] = useState<SellerKybApplication[]>([
    {
      id: "kyb-1",
      businessName: "Keychron Peripherals LLP",
      tradeName: "Keychron Official India Store",
      category: "Computing & Keyboards",
      gstin: "27AABCU7721R1ZX",
      pan: "AABCU7721R",
      bankName: "ICICI Bank (Pune Branch)",
      accountNumber: "001294810291",
      warehouseCity: "Pune, Maharashtra",
      appliedDate: "30 Aug 2026",
      status: "Pending Review",
    },
    {
      id: "kyb-2",
      businessName: "Glow Beauty Cosmeceuticals Pvt Ltd",
      tradeName: "Glow Beauty Organics",
      category: "Luxury Skincare",
      gstin: "29AABCG8812F1Z4",
      pan: "AABCG8812F",
      bankName: "HDFC Bank (Koramangala)",
      accountNumber: "502000841920",
      warehouseCity: "Bengaluru, Karnataka",
      appliedDate: "29 Aug 2026",
      status: "Approved",
    },
    {
      id: "kyb-3",
      businessName: "AutoCare High Performance Spares",
      tradeName: "AutoCare Spares Direct",
      category: "Automotive Spares",
      gstin: "27AABCA3319E1ZM",
      pan: "AABCA3319E",
      bankName: "State Bank of India",
      accountNumber: "304910291823",
      warehouseCity: "Mumbai, Maharashtra",
      appliedDate: "28 Aug 2026",
      status: "Approved",
    },
  ]);

  // Commission Rules
  const [rules, setRules] = useState<CategoryCommissionRule[]>([
    { category: "Electronics & Audio", defaultTakeRatePct: 8.5, fixedFulfillmentFee: 25, escrowPayoutHoldDays: 2, isActive: true },
    { category: "Enterprise Computing", defaultTakeRatePct: 6.5, fixedFulfillmentFee: 40, escrowPayoutHoldDays: 2, isActive: true },
    { category: "Luxury Skincare & Beauty", defaultTakeRatePct: 12.0, fixedFulfillmentFee: 15, escrowPayoutHoldDays: 2, isActive: true },
    { category: "Automotive Motorsport", defaultTakeRatePct: 9.0, fixedFulfillmentFee: 30, escrowPayoutHoldDays: 2, isActive: true },
    { category: "Enterprise Cloud Servers", defaultTakeRatePct: 5.0, fixedFulfillmentFee: 0, escrowPayoutHoldDays: 1, isActive: true },
  ]);

  // Escrow Batches
  const [batches, setBatches] = useState<EscrowPayoutBatch[]>([
    {
      batchId: "BATCH-20260831-A",
      sellerCount: 42,
      ordersCount: 310,
      totalSettlementAmount: 894500,
      scheduledDate: "31 Aug 2026 (Today)",
      status: "Ready for Disbursement",
    },
    {
      batchId: "BATCH-20260830-B",
      sellerCount: 38,
      ordersCount: 280,
      totalSettlementAmount: 742100,
      scheduledDate: "30 Aug 2026",
      status: "Settled Successfully",
    },
  ]);

  const handleApproveKyb = (id: string) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Approved" } : a))
    );
    setStats((prev) => ({
      ...prev,
      pendingKybCount: Math.max(0, prev.pendingKybCount - 1),
      activeSellersCount: prev.activeSellersCount + 1,
    }));
    alert("KYB Approved! Merchant storefront and listing privileges activated.");
  };

  const handleRejectKyb = (id: string) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Rejected" } : a))
    );
    setStats((prev) => ({ ...prev, pendingKybCount: Math.max(0, prev.pendingKybCount - 1) }));
  };

  const handleSaveCommissionRule = (category: string, newRate: number, holdDays: number) => {
    setRules((prev) =>
      prev.map((r) =>
        r.category === category
          ? { ...r, defaultTakeRatePct: newRate, escrowPayoutHoldDays: holdDays }
          : r
      )
    );
    alert(`Updated commission rule for "${category}" to ${newRate}% (T+${holdDays} SLA)`);
  };

  const handleDispatchBatch = (batchId: string) => {
    setBatches((prev) =>
      prev.map((b) => (b.batchId === batchId ? { ...b, status: "Settled Successfully" } : b))
    );
  };

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32 select-none">
        
        {/* Header */}
        <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Super-Admin Marketplace Governance
            </h1>
            <p className="text-xs text-slate-500">
              Platform-wide GMV oversight, 3P merchant KYB validation, commission take-rates, and escrow bank payouts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/vendor-dashboard"
              className="px-4 py-2 rounded-[4px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-2xs"
            >
              Merchant Seller Central →
            </Link>
          </div>
        </div>

        {/* Primary Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 scrollbar-none text-xs font-extrabold">
          {[
            { key: "overview", label: "Executive GMV & Revenue" },
            { key: "kyb", label: `Seller KYB Approvals (${stats.pendingKybCount} Pending)` },
            { key: "commission", label: "Commission & Take-Rates" },
            { key: "escrow", label: "Escrow Vault & Bank Batches" },
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

        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <AdminMetricsOverview stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-4">
                <AdminSellerKybDesk
                  applications={applications.slice(0, 3)}
                  onApprove={handleApproveKyb}
                  onReject={handleRejectKyb}
                />
              </div>

              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Escrow Batch Status</h3>
                <div className="p-5 rounded-[8px] border border-slate-200 bg-white space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-600">Pending Vault Reserves:</span>
                    <span className="font-black text-amber-600">{formatINR(stats.escrowVaultHeld)}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-600">Avg Settlement Speed:</span>
                    <span className="font-bold text-emerald-600">T+2 Days (100% SLA)</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-600">Arbitrated Disputes:</span>
                    <span className="font-bold text-slate-900">{stats.disputeCount} open tickets</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("escrow")}
                    className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded text-center hover:bg-black transition"
                  >
                    Manage Escrow Vault →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. KYB TAB */}
        {activeTab === "kyb" && (
          <AdminSellerKybDesk
            applications={applications}
            onApprove={handleApproveKyb}
            onReject={handleRejectKyb}
          />
        )}

        {/* 3. COMMISSION TAB */}
        {activeTab === "commission" && (
          <AdminCommissionEngine
            rules={rules}
            onSaveRule={handleSaveCommissionRule}
          />
        )}

        {/* 4. ESCROW TAB */}
        {activeTab === "escrow" && (
          <AdminEscrowVaultDispatcher
            batches={batches}
            onDispatchBatch={handleDispatchBatch}
          />
        )}

      </div>
    </StorefrontShell>
  );
}
