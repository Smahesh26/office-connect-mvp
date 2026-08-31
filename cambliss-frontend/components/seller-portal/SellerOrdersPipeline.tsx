"use client";

import { useState } from "react";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export const SellerOrdersPipeline = ({
  initialTab = "new",
}: {
  initialTab?: "new" | "processing" | "ready" | "shipped" | "delivered" | "cancelled" | "returns";
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const orders = [
    {
      id: "OC-89412",
      customer: "Bhasker Anand (Cambliss Studio HQ)",
      pincode: "560103",
      items: "Sony WH-1000XM5 (Midnight Black) × 1 + Sony WF-1000XM5 × 1",
      amount: 53980,
      payment: "UPI Escrow Hold",
      status: "Ready to Ship",
      tab: "ready",
      sla: "Dispatch by Today 4:00 PM",
      awb: "BD-98421094",
    },
    {
      id: "OC-89408",
      customer: "Kavita R. (Bengaluru)",
      pincode: "560001",
      items: "Sony WH-1000XM5 (Platinum Silver) × 1",
      amount: 29990,
      payment: "Credit Card (HDFC)",
      status: "New Order",
      tab: "new",
      sla: "Accept order within 2 hours",
      awb: "Pending",
    },
    {
      id: "OC-89392",
      customer: "Amitav S. (Mumbai)",
      pincode: "400001",
      items: "Sony WF-1000XM5 Earbuds × 1",
      amount: 23990,
      payment: "Net Banking (ICICI)",
      status: "Shipped",
      tab: "shipped",
      sla: "In Transit via Bluedart Air",
      awb: "BD-99120481",
    },
    {
      id: "OC-88910",
      customer: "Rohan V. (Delhi)",
      pincode: "110001",
      items: "Sony Alpha 7 IV Camera × 1",
      amount: 241990,
      payment: "Corporate Net30 Invoice",
      status: "Delivered",
      tab: "delivered",
      sla: "Delivered & Confirmed on Aug 28",
      awb: "BD-77192019",
    },
  ];

  const filteredOrders = orders.filter((o) => o.tab === activeTab);

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs select-none">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            Order Fulfillment Pipeline
          </h3>
          <p className="text-xs text-slate-500">Track incoming purchases, generate AWB shipping manifests, and manage dispatches</p>
        </div>

        <button
          type="button"
          onClick={() => alert("Generating unified batch shipping manifest for Bluedart courier pickup...")}
          className="px-3.5 py-1.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs transition self-start sm:self-auto"
        >
          📄 Print Batch Dispatch Manifest
        </button>
      </div>

      {/* 7-Stage Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold">
        {[
          { id: "new", label: "New", count: 1 },
          { id: "processing", label: "Processing", count: 0 },
          { id: "ready", label: "Ready to Ship", count: 1 },
          { id: "shipped", label: "Shipped", count: 1 },
          { id: "delivered", label: "Delivered", count: 1 },
          { id: "cancelled", label: "Cancelled", count: 0 },
          { id: "returns", label: "Returns", count: 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "bg-[#404d85] text-white font-black"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs font-semibold">
          No orders currently in &ldquo;{activeTab}&rdquo; status.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredOrders.map((ord) => (
            <div key={ord.id} className="py-4 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900 text-sm">{ord.id}</span>
                  <span className="text-slate-500">• {ord.customer} (PIN: {ord.pincode})</span>
                </div>
                <span className="font-black text-slate-900 text-sm">
                  {formatINR(ord.amount)}
                </span>
              </div>

              <div className="p-3 rounded bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-800">{ord.items}</div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Payment: <strong>{ord.payment}</strong> • SLA: <strong className="text-emerald-700">{ord.sla}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {ord.awb !== "Pending" ? (
                    <button
                      type="button"
                      onClick={() => alert(`Printing Bluedart Air AWB Shipping Label #${ord.awb}...`)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:border-[#404d85] text-slate-800 font-bold rounded text-xs inline-flex items-center gap-1"
                    >
                      <span>🏷️ Print AWB ({ord.awb})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => alert(`Accepting order ${ord.id} and generating Bluedart AWB...`)}
                      className="px-3.5 py-1.5 bg-[#404d85] hover:bg-[#323d6a] text-white font-bold rounded text-xs"
                    >
                      Accept & Generate AWB →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
