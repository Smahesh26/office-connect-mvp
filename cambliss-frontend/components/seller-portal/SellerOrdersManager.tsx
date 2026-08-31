"use client";

import { useState } from "react";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export interface SellerFulfillmentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerCity: string;
  itemTitle: string;
  itemQty: number;
  totalPayout: number;
  carrier: string;
  awbNumber?: string;
  status: "Pending Dispatch" | "Manifest Created" | "In Transit" | "Delivered";
  orderDate: string;
}

export const SellerOrdersManager = ({
  orders,
  onGenerateAwb,
  onMarkDispatched,
}: {
  orders: SellerFulfillmentOrder[];
  onGenerateAwb: (orderId: string) => void;
  onMarkDispatched: (orderId: string) => void;
}) => {
  const [filter, setFilter] = useState<"all" | "pending" | "dispatched">("all");

  const filtered = orders.filter((o) => {
    if (filter === "pending") return o.status === "Pending Dispatch" || o.status === "Manifest Created";
    if (filter === "dispatched") return o.status === "In Transit" || o.status === "Delivered";
    return true;
  });

  return (
    <div className="space-y-4 select-none">
      
      {/* Filter Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          {[
            { key: "all", label: `All Orders (${orders.length})` },
            { key: "pending", label: `Pending Dispatch (${orders.filter((o) => o.status === "Pending Dispatch" || o.status === "Manifest Created").length})` },
            { key: "dispatched", label: `In Transit & Delivered (${orders.filter((o) => o.status === "In Transit" || o.status === "Delivered").length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-[4px] text-xs font-bold transition ${
                filter === tab.key
                  ? "bg-[#404d85] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="border border-slate-200 rounded-[8px] overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Item & Quantity</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Net Merchant Payout</th>
                <th className="py-3 px-4">Fulfillment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                  
                  {/* Order ID */}
                  <td className="py-3 px-4 space-y-0.5">
                    <span className="font-mono font-bold text-[#404d85] block">{ord.orderNumber}</span>
                    <span className="text-[11px] text-slate-400">{ord.orderDate}</span>
                  </td>

                  {/* Item */}
                  <td className="py-3 px-4 max-w-xs">
                    <span className="font-bold text-slate-900 block truncate">{ord.itemTitle}</span>
                    <span className="text-[11px] text-slate-500">Qty: {ord.itemQty} units</span>
                  </td>

                  {/* Destination */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 block">{ord.customerName}</span>
                    <span className="text-[11px] text-slate-400">📍 {ord.customerCity}</span>
                  </td>

                  {/* Payout */}
                  <td className="py-3 px-4">
                    <span className="font-black text-slate-900">{formatINR(ord.totalPayout)}</span>
                    <span className="text-[10px] text-emerald-600 block font-semibold">T+2 Escrow</span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                        ord.status === "Delivered"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : ord.status === "In Transit"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      ● {ord.status}
                    </span>
                    {ord.awbNumber && (
                      <span className="text-[10px] font-mono text-slate-500 block pt-0.5">
                        {ord.carrier}: {ord.awbNumber}
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    {ord.status === "Pending Dispatch" ? (
                      <button
                        type="button"
                        onClick={() => onGenerateAwb(ord.id)}
                        className="px-3 py-1 rounded bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs transition"
                      >
                        🖨️ Generate AWB Label
                      </button>
                    ) : ord.status === "Manifest Created" ? (
                      <button
                        type="button"
                        onClick={() => onMarkDispatched(ord.id)}
                        className="px-3 py-1 rounded bg-slate-900 hover:bg-black text-white font-bold text-xs transition"
                      >
                        🚚 Confirm Courier Handover
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3 py-1 rounded border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                      >
                        Print Packing Slip
                      </button>
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
