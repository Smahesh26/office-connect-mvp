"use client";

import { useState } from "react";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export const AdminMarketplaceDomain = ({
  subView,
}: {
  subView: "customers" | "sellers" | "stores" | "products" | "categories" | "brands";
}) => {
  const [sellers, setSellers] = useState([
    {
      id: "sel-1",
      name: "Sony India Direct",
      brand: "Sony",
      category: "Electronics",
      gstin: "29AABCU9603R1ZM",
      pan: "AABCU9603R",
      stage: "Stage 5: Approved",
      tier: "Gold Verified",
      status: "Active",
      gmv: 4820000,
    },
    {
      id: "sel-2",
      name: "Keychron Official India",
      brand: "Keychron",
      category: "Computing",
      gstin: "27AABCK8812R1ZZ",
      pan: "AABCK8812R",
      stage: "Stage 5: Approved",
      tier: "Gold Verified",
      status: "Active",
      gmv: 2190000,
    },
    {
      id: "sel-3",
      name: "UrbanThreads Fashion Lab",
      brand: "UrbanThreads",
      category: "Apparel",
      gstin: "33AABCT9914R1ZN",
      pan: "AABCT9914R",
      stage: "Stage 3: Bank Verification",
      tier: "Pending Review",
      status: "Under Review",
      gmv: 0,
    },
  ]);

  const handleApproveSeller = (id: string) => {
    setSellers((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, stage: "Stage 5: Approved", tier: "Gold Verified", status: "Active" }
          : s
      )
    );
  };

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none text-xs">
      
      {/* 1. CUSTOMERS */}
      {subView === "customers" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Customer Registry & B2B Buyer Accounts (1,420 Active)
              </h3>
              <p className="text-xs text-slate-500">Overview of verified marketplace retail and enterprise buyers</p>
            </div>
            <input
              type="text"
              placeholder="Search by name, email, GSTIN..."
              className="px-3 py-1.5 border rounded text-xs"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-slate-400 font-extrabold text-[10px] uppercase">
                  <th className="pb-2">Customer & Organization</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-right">Orders</th>
                  <th className="pb-2 text-right">Lifetime GMV</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr className="hover:bg-slate-50">
                  <td className="py-3">
                    <strong className="text-slate-900 block">Bhasker Anand</strong>
                    <span className="text-[11px] text-slate-500">Cambliss Studio (GST: 29AABCU9603R1ZM)</span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-bold text-[10px]">
                      B2B Corporate
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-slate-800">14 Orders</td>
                  <td className="py-3 text-right font-black text-slate-900">{formatINR(348900)}</td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[10px]">
                      Verified
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SELLERS (KYB DESK) */}
      {subView === "sellers" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Seller KYB & Merchant Compliance Desk ({sellers.length})
              </h3>
              <p className="text-xs text-slate-500">5-Stage verification gate for 3P merchants and 1P direct brands</p>
            </div>
            <button
              type="button"
              onClick={() => alert("Exporting merchant KYB audit trail...")}
              className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded text-xs"
            >
              Export KYB Ledger
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {sellers.map((s) => (
              <div key={s.id} className="py-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                    <span className="text-slate-500 pl-2">({s.brand} • {s.category})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                    s.status === "Active"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}>
                    {s.stage}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>GSTIN: <strong className="font-mono text-slate-800">{s.gstin}</strong> • PAN: <strong className="font-mono text-slate-800">{s.pan}</strong></span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">MTD Volume: {formatINR(s.gmv)}</span>
                    {s.status === "Under Review" && (
                      <button
                        type="button"
                        onClick={() => handleApproveSeller(s.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs"
                      >
                        ✓ Approve 5-Stage KYB
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. STORES */}
      {subView === "stores" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Brand Hubs & Official Storefronts (18 Active)
            </h3>
            <p className="text-xs text-slate-500">Custom branded stores with verified flagship badges</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded border bg-slate-50 space-y-2">
              <span className="font-black text-slate-900 text-sm">👑 Official Sony Flagship Store</span>
              <p className="text-slate-500 text-[11px]">theofficeconnect.com/brand/sony</p>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Active Verified Store
              </span>
            </div>
            <div className="p-4 rounded border bg-slate-50 space-y-2">
              <span className="font-black text-slate-900 text-sm">👑 Keychron Official India Hub</span>
              <p className="text-slate-500 text-[11px]">theofficeconnect.com/brand/keychron</p>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Active Verified Store
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRODUCTS, CATEGORIES, BRANDS */}
      {(subView === "products" || subView === "categories" || subView === "brands") && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Global Catalog Moderation & Taxonomy Engine
            </h3>
            <p className="text-xs text-slate-500">4,820 live listings across 32 taxonomy departments</p>
          </div>
          <div className="p-4 rounded bg-slate-50 border space-y-2">
            <span className="font-bold text-slate-900">⚡ Catalog Index Health: 100% Operational</span>
            <p className="text-slate-600 text-[11px]">
              All items indexed into vector search, faceted sidebar filters, and Buy Box automated repricing engine.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
