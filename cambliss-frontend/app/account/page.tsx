"use client";

import { useState } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { AccountAddressesManager } from "@/components/account/AccountAddressesManager";
import { AccountProfileSettings } from "@/components/account/AccountProfileSettings";
import { AccountReviewsManager } from "@/components/account/AccountReviewsManager";
import { AccountRefundsLedger } from "@/components/account/AccountRefundsLedger";
import { AccountNotificationsCenter } from "@/components/account/AccountNotificationsCenter";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export default function AccountHubPage() {
  const [activeTab, setActiveTab] = useState<
    | "orders"
    | "wishlist"
    | "addresses"
    | "profile"
    | "reviews"
    | "returns"
    | "refunds"
    | "notifications"
    | "support"
  >("orders");

  const orders = [
    {
      id: "OC-89412",
      date: "Aug 30, 2026",
      status: "Out for Delivery",
      total: 70479,
      itemCount: 3,
      packagesCount: 2,
      firstItemTitle: "Sony WH-1000XM5 Wireless Headphones + 2 others",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80",
    },
    {
      id: "OC-77182",
      date: "Aug 15, 2026",
      status: "Delivered",
      total: 8995,
      itemCount: 1,
      packagesCount: 1,
      firstItemTitle: "Logitech MX Master 3S Wireless Performance Mouse",
      image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=300&q=80",
    },
  ];

  const wishlistItems = [
    {
      id: "wl-1",
      productId: "prod-3",
      title: "Dell UltraSharp 32-inch 4K UHD Thunderbolt Hub USB-C Monitor",
      price: 78900,
      originalPrice: 89900,
      image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=300&q=80",
      inStock: true,
    },
    {
      id: "wl-2",
      productId: "prod-4",
      title: "Keychron Q1 Pro Custom Wireless Mechanical Keyboard",
      price: 18499,
      originalPrice: 21999,
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=80",
      inStock: true,
    },
  ];

  const rmaReturns = [
    {
      rmaId: "RMA-9021",
      orderId: "OC-77182",
      product: "Logitech MX Master 3S",
      reason: "Scroll Wheel Sensor Glitch",
      status: "Refund Processed via Escrow",
      date: "Aug 18, 2026",
      amount: 8995,
    },
  ];

  const navigationTabs = [
    { id: "orders", label: "📦 My Orders", badge: "2" },
    { id: "wishlist", label: "❤️ Wishlist", badge: "2" },
    { id: "addresses", label: "📍 Delivery Addresses", badge: "3" },
    { id: "profile", label: "👤 Profile & B2B GSTIN" },
    { id: "reviews", label: "⭐ My Reviews & Ratings", badge: "1" },
    { id: "returns", label: "🔄 Returns & RMA", badge: "1" },
    { id: "refunds", label: "💰 Refunds & Payouts", badge: "2" },
    { id: "notifications", label: "🔔 Notifications", badge: "2" },
    { id: "support", label: "🎧 24/7 Support Desk" },
  ];

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32 select-none">
        
        {/* Header */}
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Customer Account & Commerce Hub
          </h1>
          <p className="text-xs text-slate-500">
            Manage your verified orders, 6-stage telemetry tracking, addresses, returns, and B2B corporate profiles.
          </p>
        </div>

        {/* 2-Column Desktop Grid / Stacked Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Navigation Sidebar */}
          <div className="lg:col-span-3 rounded-[8px] border border-slate-200 bg-white p-3 space-y-1 shadow-2xs">
            <div className="p-3 pb-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#404d85] text-white font-black flex items-center justify-center text-sm">
                BA
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-slate-900 text-xs truncate">Bhasker Anand</h4>
                <span className="text-[10px] text-emerald-700 font-bold block">✓ Verified Buyer & B2B</span>
              </div>
            </div>

            <div className="pt-2 space-y-0.5">
              {navigationTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full p-2.5 rounded text-left text-xs font-bold transition flex items-center justify-between ${
                      isActive
                        ? "bg-[#404d85] text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Tab Content */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* 1. ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs">
                <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                    My Orders ({orders.length})
                  </h3>
                  <span className="text-xs text-slate-400">Real-time status synced</span>
                </div>

                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-[6px] border border-slate-200 bg-slate-50/50 space-y-3 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <div>
                          <span className="font-black text-slate-900 font-mono text-sm">{ord.id}</span>
                          <span className="text-slate-500 pl-2">Placed on {ord.date}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-[11px] self-start sm:self-auto">
                          🚚 {ord.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img src={ord.image} alt="" className="w-12 h-12 object-contain rounded border p-1 bg-white" />
                          <div>
                            <h5 className="font-bold text-slate-900 line-clamp-1">{ord.firstItemTitle}</h5>
                            <span className="text-slate-500 text-[11px]">
                              {ord.itemCount} items across {ord.packagesCount} seller packages
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-black text-slate-900 text-sm block">
                            {formatINR(ord.total)}
                          </span>
                          <Link
                            href={`/orders/${ord.id}`}
                            className="text-xs font-bold text-[#404d85] hover:underline"
                          >
                            Track & View Details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. WISHLIST TAB */}
            {activeTab === "wishlist" && (
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                    My Saved Wishlist ({wishlistItems.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistItems.map((item) => (
                    <div key={item.id} className="p-4 rounded-[6px] border border-slate-200 bg-slate-50/50 flex gap-3 text-xs">
                      <Link href={`/product/${item.productId}`} className="w-16 h-16 rounded bg-white border p-1 shrink-0 flex items-center justify-center">
                        <img src={item.image} alt="" className="w-full h-full object-contain" />
                      </Link>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h5 className="font-bold text-slate-900 truncate">{item.title}</h5>
                        <div className="font-black text-slate-900">{formatINR(item.price)}</div>
                        <div className="pt-2 flex gap-2">
                          <Link
                            href={`/product/${item.productId}`}
                            className="px-3 py-1 bg-[#404d85] text-white font-bold rounded text-[11px]"
                          >
                            View Product
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. ADDRESSES TAB */}
            {activeTab === "addresses" && <AccountAddressesManager />}

            {/* 4. PROFILE TAB */}
            {activeTab === "profile" && <AccountProfileSettings />}

            {/* 5. REVIEWS TAB */}
            {activeTab === "reviews" && <AccountReviewsManager />}

            {/* 6. RETURNS TAB */}
            {activeTab === "returns" && (
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs">
                <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                      RMA Returns & Replacements ({rmaReturns.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      7-day guaranteed doorstep pickup and escrow refund protection
                    </p>
                  </div>
                  <Link
                    href="/returns"
                    className="px-3 py-1.5 rounded bg-[#404d85] text-white font-bold text-xs"
                  >
                    + New Return Request
                  </Link>
                </div>

                <div className="space-y-3">
                  {rmaReturns.map((r) => (
                    <div key={r.rmaId} className="p-4 rounded border border-slate-200 bg-slate-50/50 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">{r.rmaId} (Order {r.orderId})</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-[10px]">
                          ✓ {r.status}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800">{r.product}</p>
                      <p className="text-slate-500">Reason: {r.reason} • Amount: {formatINR(r.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. REFUNDS TAB */}
            {activeTab === "refunds" && <AccountRefundsLedger />}

            {/* 8. NOTIFICATIONS TAB */}
            {activeTab === "notifications" && <AccountNotificationsCenter />}

            {/* 9. SUPPORT TAB */}
            {activeTab === "support" && (
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-2xs text-xs">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                    24/7 Customer Help & Dispute Resolution Desk
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Priority response within 15 minutes for verified marketplace transactions
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded border border-slate-200 bg-slate-50 space-y-2">
                    <span className="text-2xl">💬</span>
                    <h5 className="font-bold text-slate-900">Live Agent Chat</h5>
                    <p className="text-slate-600 text-[11px]">Instant real-time support with dedicated marketplace managers.</p>
                    <button
                      type="button"
                      onClick={() => alert("Connecting to Live Marketplace Support Executive...")}
                      className="px-3 py-1.5 bg-[#404d85] text-white font-bold rounded text-xs"
                    >
                      Start Live Chat
                    </button>
                  </div>

                  <div className="p-4 rounded border border-slate-200 bg-slate-50 space-y-2">
                    <span className="text-2xl">🎫</span>
                    <h5 className="font-bold text-slate-900">Create Support Ticket</h5>
                    <p className="text-slate-600 text-[11px]">Open an escrow inquiry, shipping claim, or GST invoice request.</p>
                    <button
                      type="button"
                      onClick={() => alert("Opening New Support Ticket Dialog...")}
                      className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded text-xs"
                    >
                      Open Ticket
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </StorefrontShell>
  );
}
