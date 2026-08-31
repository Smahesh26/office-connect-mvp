"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";

export const AdminMetricsOverview = ({
  stats,
}: {
  stats: {
    totalGmv: number;
    platformNetCommission: number;
    escrowVaultHeld: number;
    activeSellersCount: number;
    activeBuyersCount: number;
    pendingKybCount: number;
    disputeCount: number;
  };
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      
      {/* 1. Global Platform GMV */}
      <div className="p-5 rounded-[8px] border border-slate-200 bg-white space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
            Global Platform GMV (30D)
          </span>
          <span className="text-emerald-600 font-black text-xs">↑ 31.2% MoM</span>
        </div>
        <div className="text-2xl font-black text-slate-900">{formatINR(stats.totalGmv)}</div>
        <p className="text-[11px] text-slate-400">Total customer transaction volume</p>
      </div>

      {/* 2. Net Commission Revenue */}
      <div className="p-5 rounded-[8px] border border-slate-200 bg-white space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
            Platform Net Revenue
          </span>
          <span className="text-blue-600 font-black text-xs">8.5% Avg Take</span>
        </div>
        <div className="text-2xl font-black text-[#404d85]">{formatINR(stats.platformNetCommission)}</div>
        <p className="text-[11px] text-slate-400">Net platform fee collected</p>
      </div>

      {/* 3. Escrow Vault Reserves */}
      <div className="p-5 rounded-[8px] border border-slate-200 bg-white space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
            Escrow Vault Reserves
          </span>
          <span className="text-amber-600 font-black text-xs">🛡️ T+2 Vault</span>
        </div>
        <div className="text-2xl font-black text-amber-600">{formatINR(stats.escrowVaultHeld)}</div>
        <p className="text-[11px] text-slate-400">Held pending delivery validation</p>
      </div>

      {/* 4. Active Ecosystem Count */}
      <div className="p-5 rounded-[8px] border border-slate-200 bg-white space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
            Active Merchants & KYB
          </span>
          <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.2 rounded">
            {stats.pendingKybCount} Pending KYB
          </span>
        </div>
        <div className="text-2xl font-black text-slate-900">{stats.activeSellersCount} Merchants</div>
        <p className="text-[11px] text-slate-400">{stats.activeBuyersCount.toLocaleString()} verified buyers registered</p>
      </div>

    </div>
  );
};
