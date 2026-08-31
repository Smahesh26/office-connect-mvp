"use client";

import { useState } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { formatINR } from "@/components/commerce/CommercePrimitives";

interface ReturnTicket {
  rmaId: string;
  orderId: string;
  itemTitle: string;
  itemImage: string;
  sellerName: string;
  refundAmount: number;
  reason: string;
  resolution: "Refund via UPI" | "Replacement Dispatched";
  status: "Pickup Scheduled" | "Under Inspection" | "Refund Completed" | "Replacement in Transit";
  pickupDate: string;
  statusBadgeColor: string;
}

export default function RmaReturnsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "in_progress" | "resolved">("all");

  const returnTickets: ReturnTicket[] = [
    {
      rmaId: "RMA-90124",
      orderId: "OC-76190",
      itemTitle: "Keychron Q1 Pro Wireless Custom Mechanical Keyboard",
      itemImage: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
      sellerName: "Mechanical Keyboards India",
      refundAmount: 16999,
      reason: "Defective spacebar stabilizer switch",
      resolution: "Replacement Dispatched",
      status: "Replacement in Transit",
      pickupDate: "Picked up on 18 Aug 2026",
      statusBadgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      rmaId: "RMA-88410",
      orderId: "OC-65120",
      itemTitle: "Motul 300V Factory Line 15W-50 Synthetic Motor Oil (4L)",
      itemImage: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
      sellerName: "AutoCare Spares",
      refundAmount: 4850,
      reason: "Received wrong viscosity grade (10W-40 sent instead)",
      resolution: "Refund via UPI",
      status: "Refund Completed",
      pickupDate: "Completed on 10 Aug 2026",
      statusBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  ];

  const filteredTickets = returnTickets.filter((t) => {
    if (activeTab === "in_progress") return t.status !== "Refund Completed";
    if (activeTab === "resolved") return t.status === "Refund Completed";
    return true;
  });

  return (
    <StorefrontShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32 select-none">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/storefront" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <Link href="/orders" className="hover:text-slate-900 transition">My Orders</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Returns & RMA Desk</span>
        </nav>

        {/* Header */}
        <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Returns & RMA Refunds Desk
            </h1>
            <p className="text-xs text-slate-500">
              100% Escrow Protection • Track return pickups, merchant quality checks, and instant refunds
            </p>
          </div>

          <Link
            href="/orders"
            className="px-4 py-2 rounded-[4px] bg-[#404d85] text-white font-bold text-xs hover:bg-[#323d6a] transition"
          >
            + Request Return from Past Orders
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {[
            { key: "all", label: "All Returns" },
            { key: "in_progress", label: "Active & In Progress" },
            { key: "resolved", label: "Completed & Refunded" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-[4px] text-xs font-bold transition ${
                activeTab === tab.key
                  ? "bg-[#404d85] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Return Tickets List */}
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.rmaId}
              className="p-5 rounded-[8px] border border-slate-200 bg-white space-y-4 text-xs shadow-2xs"
            >
              {/* Ticket Top Ribbon */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[#404d85] text-sm">{ticket.rmaId}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-medium">Original Order #{ticket.orderId}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">Sold by: <strong>{ticket.sellerName}</strong></span>
                </div>

                <span className={`px-2.5 py-0.5 rounded border text-[11px] font-extrabold ${ticket.statusBadgeColor}`}>
                  ● {ticket.status}
                </span>
              </div>

              {/* Item Info & Resolution */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-14 h-14 rounded bg-slate-50 border overflow-hidden shrink-0">
                    <img src={ticket.itemImage} alt={ticket.itemTitle} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{ticket.itemTitle}</h4>
                    <p className="text-[11px] text-slate-500">
                      Reason: <span className="text-slate-800 font-medium">{ticket.reason}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Resolution: <strong className="text-[#404d85]">{ticket.resolution}</strong> ({formatINR(ticket.refundAmount)})
                    </p>
                  </div>
                </div>

                <div className="text-right sm:self-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">{ticket.pickupDate}</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </StorefrontShell>
  );
}
