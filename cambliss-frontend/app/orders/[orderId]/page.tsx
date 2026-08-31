"use client";

import { use } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { OrderTimelineProgress } from "@/components/account/OrderTimelineProgress";
import { formatINR, SellerBadge } from "@/components/commerce/CommercePrimitives";

export default function OrderTrackingDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);

  const orderData = {
    orderNumber: orderId || "OC-89412",
    date: "30 August 2026",
    totalAmount: 70479,
    paymentMethod: "⚡ UPI Escrow Hold (bhasker@okaxis)",
    escrowStatus: "100% Escrow Vault Active",
    gstin: "29AABCU9603R1ZM",
    deliveryAddress: {
      fullName: "Cambliss Studio & Tech HQ (Bhasker A.)",
      addressLine1: "Suite 402, Prestige Tech Park, Marathahalli-Sarjapur Outer Ring Rd",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560103",
      phone: "+91 98450 12345",
    },
    packages: [
      {
        packageId: "PKG-89412-A",
        sellerName: "Sony India Direct",
        sellerTier: "premium" as const,
        courier: "Bluedart Air Express",
        trackingNumber: "BD-98421094",
        estimatedArrival: "Today by 1:00 PM",
        items: [
          {
            id: "i1",
            title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones (Midnight Black)",
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
            qty: 1,
            price: 29990,
          },
          {
            id: "i2",
            title: "Sony WF-1000XM5 Truly Wireless Noise Canceling Earbuds (Platinum Silver)",
            image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
            qty: 1,
            price: 23990,
          },
        ],
      },
      {
        packageId: "PKG-89412-B",
        sellerName: "Keychron Official India",
        sellerTier: "premium" as const,
        courier: "Delhivery Surface",
        trackingNumber: "DEL-44192088",
        estimatedArrival: "In 2 Days (Sept 2)",
        items: [
          {
            id: "i3",
            title: "Keychron Q1 Pro Custom Wireless Mechanical Keyboard QMK/VIA (Barebone ISO)",
            image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
            qty: 1,
            price: 18499,
          },
        ],
      },
    ],
  };

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32 select-none">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/account" className="hover:underline">My Account</Link>
              <span>/</span>
              <Link href="/orders" className="hover:underline">Orders</Link>
              <span>/</span>
              <span className="font-bold text-slate-900">{orderData.orderNumber}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Order Details & Live Telemetry
            </h1>
            <p className="text-xs text-slate-500">
              Placed on {orderData.date} • Total: <strong className="text-slate-900">{formatINR(orderData.totalAmount)}</strong> ({orderData.escrowStatus})
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => alert("Downloading Official B2B GST Tax Invoice PDF...")}
              className="px-3.5 py-1.5 rounded-[4px] bg-white border border-slate-300 hover:border-[#404d85] text-slate-800 font-bold text-xs transition inline-flex items-center gap-1.5"
            >
              <span>📄</span>
              <span>Download Tax Invoice (PDF)</span>
            </button>
            <Link
              href="/orders"
              className="text-xs font-bold text-[#404d85] hover:underline"
            >
              ← All Orders
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: 6-Stage Timeline & Merchant Packages */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 6-Stage Fulfillment Timeline */}
            <OrderTimelineProgress />

            {/* Merchant Packages Breakdown */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Multi-Vendor Packages ({orderData.packages.length})
              </h3>

              {orderData.packages.map((pkg, idx) => (
                <div
                  key={pkg.packageId}
                  className="rounded-[8px] border border-slate-200 bg-white p-5 space-y-4 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[10px] uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Package {idx + 1}
                        </span>
                        <SellerBadge sellerName={pkg.sellerName} sellerTier={pkg.sellerTier} />
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Carrier: <strong>{pkg.courier}</strong> • AWB: <strong>{pkg.trackingNumber}</strong>
                      </p>
                    </div>

                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-bold self-start sm:self-auto">
                      🚚 Expected {pkg.estimatedArrival}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {pkg.items.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt="" className="w-14 h-14 rounded object-contain border p-1 bg-slate-50 shrink-0" />
                          <div>
                            <h5 className="font-bold text-slate-900 line-clamp-2">{item.title}</h5>
                            <span className="text-slate-500 font-medium">Quantity: {item.qty}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-slate-900 text-sm">
                            {formatINR(item.price * item.qty)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column: Delivery Address, Escrow, and Actions */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Delivery Address Card */}
            <div className="rounded-[8px] border border-slate-200 bg-white p-5 space-y-3 shadow-2xs text-xs">
              <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Delivery Address
              </h4>
              <p className="font-bold text-slate-900">{orderData.deliveryAddress.fullName}</p>
              <p className="text-slate-600 leading-relaxed">
                {orderData.deliveryAddress.addressLine1}, {orderData.deliveryAddress.city} {orderData.deliveryAddress.pincode}
              </p>
              <p className="text-slate-500 font-medium">Contact: {orderData.deliveryAddress.phone}</p>
              {orderData.gstin && (
                <div className="pt-2 border-t border-slate-100 text-[11px] text-emerald-800 font-mono font-bold">
                  B2B GSTIN: {orderData.gstin}
                </div>
              )}
            </div>

            {/* Payment & Escrow Card */}
            <div className="rounded-[8px] border border-slate-200 bg-white p-5 space-y-3 shadow-2xs text-xs">
              <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Payment & Escrow Protection
              </h4>
              <p className="text-slate-700 font-medium">
                Method: <strong>{orderData.paymentMethod}</strong>
              </p>
              <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-black">
                  <span>🛡️</span>
                  <span>100% Escrow Vault Protected</span>
                </div>
                <p className="leading-tight text-emerald-800">
                  Total amount of {formatINR(orderData.totalAmount)} is held safely until you confirm delivery OTP.
                </p>
              </div>
            </div>

            {/* Support & Returns Help */}
            <div className="rounded-[8px] border border-slate-200 bg-white p-5 space-y-3 shadow-2xs text-xs">
              <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Need Assistance?
              </h4>
              <div className="flex flex-col gap-2">
                <Link
                  href="/returns"
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-center transition"
                >
                  Initiate RMA Return / Replacement
                </Link>
                <Link
                  href="/account"
                  className="w-full py-2 bg-[#404d85] hover:bg-[#323d6a] text-white font-bold rounded text-center transition"
                >
                  Contact 24/7 Support Desk
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </StorefrontShell>
  );
}
