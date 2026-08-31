"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR } from "@/components/commerce/CommercePrimitives";
import { AdminMasterSidebar, AdminDomainView } from "@/components/admin-marketplace/AdminMasterSidebar";
import { AdminMarketplaceDomain } from "@/components/admin-marketplace/AdminMarketplaceDomain";
import { AdminCommerceDomain } from "@/components/admin-marketplace/AdminCommerceDomain";
import { AdminFinanceDomain } from "@/components/admin-marketplace/AdminFinanceDomain";
import { AdminMarketingDomain } from "@/components/admin-marketplace/AdminMarketingDomain";
import { AdminOperationsDomain } from "@/components/admin-marketplace/AdminOperationsDomain";
import { AdminSettingsDomain } from "@/components/admin-marketplace/AdminSettingsDomain";

export default function AdminDashboardPage() {
  const [activeView, setActiveView] = useState<AdminDomainView>("dashboard");

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 select-none">
      
      {/* Top Super-Admin Bar */}
      <header className="bg-slate-950 text-white border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/storefront" className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-[#404d85] text-white flex items-center justify-center text-[10px]">🏢</span>
            <span>Office Connect</span>
            <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
              SUPER ADMIN GOVERNANCE
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/vendor-dashboard"
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
          >
            🏪 Switch to Seller Portal
          </Link>
          <Link
            href="/storefront"
            className="px-3 py-1 rounded bg-[#404d85] hover:bg-[#323d6a] text-white font-bold"
          >
            🛒 Public Storefront
          </Link>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Hierarchical Sidebar */}
        <AdminMasterSidebar activeView={activeView} onSelectView={setActiveView} />

        {/* Dynamic Main Stage View */}
        <main className="flex-1 w-full space-y-6">
          
          {/* 1. MASTER DASHBOARD VIEW */}
          {activeView === "dashboard" && (
            <div className="space-y-6">
              
              {/* Hero KPI Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-[8px] bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Marketplace GMV</span>
                  <div className="text-xl font-black text-slate-900">{formatINR(12849000)}</div>
                  <span className="text-[10px] font-bold text-emerald-600">↑ 18.4% MoM</span>
                </div>

                <div className="p-4 rounded-[8px] bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Platform Take-Rate (8.5%)</span>
                  <div className="text-xl font-black text-[#404d85]">{formatINR(1092165)}</div>
                  <span className="text-[10px] font-bold text-emerald-600">Net Commission Revenue</span>
                </div>

                <div className="p-4 rounded-[8px] bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Escrow Reserves</span>
                  <div className="text-xl font-black text-amber-600">{formatINR(2480000)}</div>
                  <span className="text-[10px] font-bold text-slate-500">🔒 Held in HDFC Escrow</span>
                </div>

                <div className="p-4 rounded-[8px] bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Active Merchants</span>
                  <div className="text-xl font-black text-slate-900">24 KYB</div>
                  <span className="text-[10px] font-bold text-amber-600">3 Approvals Pending</span>
                </div>
              </div>

              {/* Quick Actions & Live Stream */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Pending KYB Merchant Approvals */}
                <div className="p-5 rounded-[8px] bg-white border border-slate-200 space-y-4 shadow-2xs text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">
                      Pending KYB Approvals (3)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveView("mkt-sellers")}
                      className="text-xs font-bold text-[#404d85] hover:underline"
                    >
                      View All Sellers →
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <strong className="text-slate-900 block">UrbanThreads Fashion Lab</strong>
                        <span className="text-[11px] text-slate-500">GST: 33AABCT9914R1ZN • Apparel</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          alert("UrbanThreads Fashion Lab approved!");
                          setActiveView("mkt-sellers");
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs"
                      >
                        Approve KYB
                      </button>
                    </div>
                  </div>
                </div>

                {/* System Activity Trail */}
                <div className="p-5 rounded-[8px] bg-white border border-slate-200 space-y-4 shadow-2xs text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">
                      Live Governance Stream
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveView("ops-audit")}
                      className="text-xs font-bold text-[#404d85] hover:underline"
                    >
                      Audit Trail →
                    </button>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="p-2 rounded bg-slate-50 border flex items-center justify-between font-mono">
                      <span>Order #OC-89412 Escrow Held (₹53,980)</span>
                      <span className="text-slate-400">12:45 PM</span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border flex items-center justify-between font-mono">
                      <span>Sony India Direct SLA Passed (99.4%)</span>
                      <span className="text-slate-400">11:30 AM</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 2. MARKETPLACE DOMAIN */}
          {activeView.startsWith("mkt-") && (
            <AdminMarketplaceDomain
              subView={activeView.replace("mkt-", "") as any}
            />
          )}

          {/* 3. COMMERCE DOMAIN */}
          {activeView.startsWith("com-") && (
            <AdminCommerceDomain
              subView={activeView.replace("com-", "") as any}
            />
          )}

          {/* 4. FINANCE DOMAIN */}
          {activeView.startsWith("fin-") && (
            <AdminFinanceDomain
              subView={activeView.replace("fin-", "") as any}
            />
          )}

          {/* 5. MARKETING DOMAIN */}
          {activeView.startsWith("mktg-") && (
            <AdminMarketingDomain
              subView={activeView.replace("mktg-", "") as any}
            />
          )}

          {/* 6. OPERATIONS DOMAIN */}
          {activeView.startsWith("ops-") && (
            <AdminOperationsDomain
              subView={activeView.replace("ops-", "") as any}
            />
          )}

          {/* 7. ANALYTICS */}
          {activeView === "analytics" && (
            <div className="p-5 rounded-[8px] bg-white border border-slate-200 shadow-2xs space-y-4 text-xs select-none">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                  Global Marketplace Analytics & Funnel Cohorts
                </h3>
                <p className="text-xs text-slate-500">Live conversion funnel and customer acquisition cost telemetry</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded border bg-slate-50">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Storefront Conversion</span>
                  <strong className="text-lg font-black text-slate-900">4.18%</strong>
                </div>
                <div className="p-4 rounded border bg-slate-50">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Average Order Value (AOV)</span>
                  <strong className="text-lg font-black text-slate-900">₹4,890</strong>
                </div>
                <div className="p-4 rounded border bg-slate-50">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Repeat Buyer Rate</span>
                  <strong className="text-lg font-black text-slate-900">42.8%</strong>
                </div>
              </div>
            </div>
          )}

          {/* 8. SETTINGS DOMAIN */}
          {activeView.startsWith("set-") && (
            <AdminSettingsDomain
              subView={activeView.replace("set-", "") as any}
            />
          )}

        </main>
      </div>

    </div>
  );
}
