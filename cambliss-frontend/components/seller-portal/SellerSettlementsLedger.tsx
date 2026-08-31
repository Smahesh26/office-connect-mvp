"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";

export interface SettlementRecord {
  id: string;
  orderNumber: string;
  orderDate: string;
  grossAmount: number;
  platformFeePct: number;
  platformFeeAmount: number;
  netSettlement: number;
  settlementDate: string;
  status: "Settled to Bank" | "In Escrow Hold" | "Processing Payout";
  utrNumber?: string;
}

export const SellerSettlementsLedger = ({
  records,
  totalSettled,
  pendingEscrow,
}: {
  records: SettlementRecord[];
  totalSettled: number;
  pendingEscrow: number;
}) => {
  return (
    <div className="space-y-6 select-none">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-[8px] border border-slate-200 bg-white space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Settled to Bank (30D)</span>
          <div className="text-xl font-black text-slate-900">{formatINR(totalSettled)}</div>
          <p className="text-[10px] text-emerald-600 font-bold">100% On-Time T+2 Settlement SLA</p>
        </div>

        <div className="p-4 rounded-[8px] border border-slate-200 bg-white space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Active Escrow Reserves</span>
          <div className="text-xl font-black text-amber-600">{formatINR(pendingEscrow)}</div>
          <p className="text-[10px] text-slate-500">Unlocks post-delivery OTP verification</p>
        </div>

        <div className="p-4 rounded-[8px] border border-slate-200 bg-white space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Standard Platform Take Rate</span>
          <div className="text-xl font-black text-slate-900">8.5% Flat</div>
          <p className="text-[10px] text-slate-500">Includes payment gateway fees & escrow insurance</p>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="border border-slate-200 rounded-[8px] overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Order & Date</th>
                <th className="py-3 px-4">Gross Customer Paid</th>
                <th className="py-3 px-4">Platform Fee (8.5%)</th>
                <th className="py-3 px-4">Net Merchant Payout</th>
                <th className="py-3 px-4">Settlement Status</th>
                <th className="py-3 px-4 text-right">Bank UTR / Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 space-y-0.5">
                    <span className="font-mono font-bold text-[#404d85] block">{rec.orderNumber}</span>
                    <span className="text-[11px] text-slate-400">{rec.orderDate}</span>
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {formatINR(rec.grossAmount)}
                  </td>

                  <td className="py-3 px-4 text-red-600 font-semibold">
                    -{formatINR(rec.platformFeeAmount)}
                  </td>

                  <td className="py-3 px-4 font-black text-slate-900">
                    {formatINR(rec.netSettlement)}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                        rec.status === "Settled to Bank"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : rec.status === "In Escrow Hold"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      ● {rec.status}
                    </span>
                    <span className="text-[10px] text-slate-400 block pt-0.5">{rec.settlementDate}</span>
                  </td>

                  <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-600">
                    {rec.utrNumber ? (
                      <span className="text-slate-800 font-bold">UTR: {rec.utrNumber}</span>
                    ) : (
                      <span className="text-amber-600 font-semibold">Pending Delivery OTP</span>
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
