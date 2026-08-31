"use client";

import { useState } from "react";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export interface EscrowPayoutBatch {
  batchId: string;
  sellerCount: number;
  ordersCount: number;
  totalSettlementAmount: number;
  scheduledDate: string;
  status: "Ready for Disbursement" | "Processing Bank Transfer" | "Settled Successfully";
}

export const AdminEscrowVaultDispatcher = ({
  batches,
  onDispatchBatch,
}: {
  batches: EscrowPayoutBatch[];
  onDispatchBatch: (batchId: string) => void;
}) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleDispatch = (batchId: string) => {
    setIsProcessing(batchId);
    setTimeout(() => {
      setIsProcessing(null);
      onDispatchBatch(batchId);
      alert(`Dispatched automated NEFT/RTGS bank transfer batch for ${batchId}!`);
    }, 1200);
  };

  return (
    <div className="space-y-4 select-none">
      
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900">
            Escrow Vault & Automated Bank Payout Dispatcher
          </h3>
          <p className="text-xs text-slate-500">
            Multi-vendor settlement batches ready for direct bank disbursement after buyer delivery OTP validation.
          </p>
        </div>
      </div>

      <div className="border border-slate-200 rounded-[8px] overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Payout Batch ID</th>
                <th className="py-3 px-4">Merchants & Orders</th>
                <th className="py-3 px-4">Total Net Disbursement</th>
                <th className="py-3 px-4">Scheduled Release</th>
                <th className="py-3 px-4">Batch Status</th>
                <th className="py-3 px-4 text-right">Escrow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {batches.map((b) => (
                <tr key={b.batchId} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-[#404d85]">
                    {b.batchId}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800">{b.sellerCount} Merchants</span>
                    <span className="text-[11px] text-slate-400 block">{b.ordersCount} verified orders</span>
                  </td>

                  <td className="py-3 px-4 font-black text-sm text-slate-900">
                    {formatINR(b.totalSettlementAmount)}
                  </td>

                  <td className="py-3 px-4 text-slate-600 font-semibold">
                    📅 {b.scheduledDate}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                        b.status === "Settled Successfully"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : b.status === "Processing Bank Transfer"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      ● {b.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    {b.status === "Ready for Disbursement" ? (
                      <button
                        type="button"
                        disabled={isProcessing === b.batchId}
                        onClick={() => handleDispatch(b.batchId)}
                        className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs disabled:opacity-50"
                      >
                        {isProcessing === b.batchId ? "Dispatching..." : "⚡ Release Bank Payout"}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold">Disbursed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
