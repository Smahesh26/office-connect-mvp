"use client";

import { useState } from "react";

export const AdminSettingsDomain = ({
  subView,
}: {
  subView: "roles" | "permissions" | "taxes" | "config";
}) => {
  const [config, setConfig] = useState({
    escrowReleaseDays: 7,
    autoApproveVerifiedBrands: true,
    tcsRate: 1.0,
    tdsRate: 0.1,
    defaultShippingSlaHours: 48,
  });

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none text-xs">
      
      {/* 1. ROLES & 2. PERMISSIONS */}
      {(subView === "roles" || subView === "permissions") && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Role-Based Access Control (RBAC) & Governance Permissions
            </h3>
            <p className="text-xs text-slate-500">Fine-grained operational permissions for admin staff</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded border bg-slate-50 space-y-1">
              <span className="font-bold text-slate-900 block">👑 Super-Admin (Root)</span>
              <p className="text-slate-500 text-[11px]">Full access to escrow vault, payout triggers, and audit logs.</p>
              <span className="text-[10px] text-emerald-700 font-bold block pt-1">3 Active Users</span>
            </div>
            <div className="p-4 rounded border bg-slate-50 space-y-1">
              <span className="font-bold text-slate-900 block">🛡️ Catalog & KYB Moderator</span>
              <p className="text-slate-500 text-[11px]">Can approve sellers and review listings. No financial access.</p>
              <span className="text-[10px] text-emerald-700 font-bold block pt-1">6 Active Users</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAXES (TCS & TDS COMPLIANCE) */}
      {subView === "taxes" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Statutory Tax Compliance (TCS Section 52 & TDS Section 194-O)
            </h3>
            <p className="text-xs text-slate-500">Automated government tax deduction rates on 3P merchant sales</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded border bg-slate-50 space-y-1">
              <label className="font-bold text-slate-800 block">GST TCS (Section 52) Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={config.tcsRate}
                onChange={(e) => setConfig({ ...config, tcsRate: Number(e.target.value) })}
                className="w-full px-2 py-1 border rounded font-black text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Standard rate: 1.0% (0.5% CGST + 0.5% SGST)</span>
            </div>

            <div className="p-3 rounded border bg-slate-50 space-y-1">
              <label className="font-bold text-slate-800 block">Income Tax TDS (Section 194-O) Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={config.tdsRate}
                onChange={(e) => setConfig({ ...config, tdsRate: Number(e.target.value) })}
                className="w-full px-2 py-1 border rounded font-black text-slate-900"
              />
              <span className="text-[10px] text-slate-400">Standard rate: 0.1% for PAN-verified sellers</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. MARKETPLACE CONFIGURATION */}
      {subView === "config" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Marketplace Operating Rules & Escrow Holds
            </h3>
            <p className="text-xs text-slate-500">Core parameters governing delivery SLAs, escrow periods, and payouts</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded border bg-slate-50 space-y-1">
              <label className="font-bold text-slate-800 block">
                Escrow Hold Period After Delivery (Days)
              </label>
              <input
                type="number"
                value={config.escrowReleaseDays}
                onChange={(e) => setConfig({ ...config, escrowReleaseDays: Number(e.target.value) })}
                className="w-full px-2 py-1 border rounded font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400">
                Protects buyers during the 7-day return/RMA window before releasing funds to seller.
              </span>
            </div>

            <div className="p-3 rounded border bg-slate-50 space-y-1">
              <label className="font-bold text-slate-800 block">
                Default Merchant Dispatch SLA (Hours)
              </label>
              <input
                type="number"
                value={config.defaultShippingSlaHours}
                onChange={(e) => setConfig({ ...config, defaultShippingSlaHours: Number(e.target.value) })}
                className="w-full px-2 py-1 border rounded font-bold text-slate-900"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
