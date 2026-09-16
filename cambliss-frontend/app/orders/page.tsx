"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketplacePageWrapper } from "@/components/storefront/MarketplacePageWrapper";
import { OrderCard, CustomerOrder } from "@/components/account/OrderCard";
import { RmaReturnModal, RmaItemDetails } from "@/components/account/RmaReturnModal";

export default function CustomerOrdersPage() {
  const [activeTab, setActiveTab] = useState<"all" | "in_transit" | "delivered" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRmaItem, setSelectedRmaItem] = useState<RmaItemDetails | null>(null);
  const [isRmaOpen, setIsRmaOpen] = useState(false);

  const initialOrders: CustomerOrder[] = [];

  const handleOpenRma = (item: RmaItemDetails) => {
    setSelectedRmaItem(item);
    setIsRmaOpen(true);
  };

  const filteredOrders = initialOrders.filter((ord) => {
    if (activeTab === "in_transit") {
      return ord.packages.some((p) => p.status === "In Transit" || p.status === "Out for Delivery");
    }
    if (activeTab === "delivered") {
      return ord.packages.every((p) => p.status === "Delivered");
    }
    if (activeTab === "cancelled") {
      return ord.packages.some((p) => p.status === "Cancelled");
    }
    return true;
  });

  return (
    <MarketplacePageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32 select-none">
        
        {/* Header */}
        <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Orders & Live Tracking
            </h1>
            <p className="text-xs text-slate-500">
              Track independent seller shipments, download official GST invoices, and manage returns
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/returns"
              className="px-3.5 py-1.5 rounded-[4px] border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
            >
              RMA Returns Desk →
            </Link>
            <Link
              href="/wishlist"
              className="px-3.5 py-1.5 rounded-[4px] bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
            >
              Saved Wishlist
            </Link>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 border-b sm:border-b-0 border-slate-200 pb-2 sm:pb-0 overflow-x-auto scrollbar-none">
            {[
              { key: "all", label: "All Orders" },
              { key: "in_transit", label: "In Transit" },
              { key: "delivered", label: "Delivered" },
              { key: "cancelled", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3.5 py-1.5 rounded-[4px] text-xs font-bold transition ${
                  activeTab === tab.key
                    ? "bg-[#404d85] text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by product name or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs focus:border-[#404d85] focus:outline-hidden"
            />
          </div>

        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center rounded-[8px] border border-dashed border-slate-200 bg-white p-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 text-xl">
                🛍️
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Orders Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
                {initialOrders.length === 0
                  ? "You have not placed any orders yet. When you purchase products from verified marketplace merchants, tracking and invoices will appear here."
                  : "No orders match your search or filter query."}
              </p>
              <Link
                href="/storefront"
                className="px-4 py-2 bg-[#404d85] hover:bg-[#323d6a] text-white rounded font-bold text-xs shadow-xs transition"
              >
                Explore Marketplace
              </Link>
            </div>
          ) : (
            filteredOrders.map((ord) => (
              <OrderCard key={ord.id} order={ord} onOpenRma={handleOpenRma} />
            ))
          )}
        </div>

        {/* RMA Return Modal */}
        <RmaReturnModal
          isOpen={isRmaOpen}
          onClose={() => setIsRmaOpen(false)}
          item={selectedRmaItem}
          onSubmitRma={(data) => {
            alert(`RMA Return registered for item. Resolution: ${data.resolution.toUpperCase()}`);
          }}
        />

      </div>
    </MarketplacePageWrapper>
  );
}
