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

  const initialOrders: CustomerOrder[] = [
    {
      id: "ord-1",
      orderNumber: "OC-89412",
      date: "31 August 2026",
      totalAmount: 34988,
      paymentMethod: "UPI Escrow (GPay)",
      packages: [
        {
          packageId: "PKG-98214-A",
          sellerName: "Office Connect Direct",
          sellerTier: "premium",
          courier: "Bluedart Air Express",
          trackingNumber: "BD-89124091",
          status: "In Transit",
          estimatedArrival: "Tomorrow by 2:00 PM",
          items: [
            {
              id: "prod-1",
              title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones (Midnight Black)",
              image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
              price: 29990,
              quantity: 1,
              sellerName: "Office Connect Direct",
              sellerTier: "premium",
            },
          ],
        },
        {
          packageId: "PKG-98214-B",
          sellerName: "Glow Beauty Organics",
          sellerTier: "premium",
          courier: "Delhivery Surface",
          trackingNumber: "DEL-77192031",
          status: "In Transit",
          estimatedArrival: "Wednesday, Sept 3",
          items: [
            {
              id: "prod-4",
              title: "Glow Beauty Damask Rose Organic Botanical Hydrating Facial Serum (50ml)",
              image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
              price: 2499,
              quantity: 2,
              sellerName: "Glow Beauty Organics",
              sellerTier: "premium",
            },
          ],
        },
      ],
    },
    {
      id: "ord-2",
      orderNumber: "OC-76190",
      date: "14 August 2026",
      totalAmount: 16999,
      paymentMethod: "HDFC NetBanking",
      packages: [
        {
          packageId: "PKG-55102-A",
          sellerName: "Mechanical Keyboards India",
          sellerTier: "verified",
          courier: "DTDC Express",
          trackingNumber: "DTDC-4401923",
          status: "Delivered",
          estimatedArrival: "Delivered on Aug 16",
          items: [
            {
              id: "prod-3",
              title: "Keychron Q1 Pro Wireless Custom Mechanical Keyboard (QMK/VIA ANSI)",
              image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
              price: 16999,
              quantity: 1,
              sellerName: "Mechanical Keyboards India",
              sellerTier: "verified",
            },
          ],
        },
      ],
    },
  ];

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
          {filteredOrders.map((ord) => (
            <OrderCard key={ord.id} order={ord} onOpenRma={handleOpenRma} />
          ))}
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
