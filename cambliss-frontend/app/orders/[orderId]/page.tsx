"use client";

import { use } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { PackageTrackingStepper, TrackingStage } from "@/components/account/PackageTrackingStepper";
import { formatINR, SellerBadge } from "@/components/commerce/CommercePrimitives";

export default function OrderTrackingDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);

  const orderData = {
    orderNumber: orderId || "OC-89412",
    date: "31 August 2026",
    totalAmount: 34988,
    paymentMethod: "UPI Escrow Authorization (GPay)",
    escrowStatus: "Secured in Escrow Vault",
    deliveryAddress: {
      fullName: "Cambliss Studio & Tech HQ",
      addressLine1: "#402, 4th Floor, Prestige Tech Park",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560103",
      phone: "+91 98450 12345",
    },
    packages: [
      {
        packageId: "PKG-98214-A",
        sellerName: "Office Connect Direct",
        sellerTier: "premium" as const,
        courier: "Bluedart Air Express",
        trackingNumber: "BD-89124091",
        stage: "in_transit" as TrackingStage,
        estimatedArrival: "Tomorrow, Sept 1 by 2:00 PM",
        item: "Sony WH-1000XM5 Wireless Noise Canceling Headphones (Midnight Black)",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        qty: 1,
        price: 29990,
        logs: [
          { timestamp: "31 Aug 2026, 11:30 AM", location: "Bangalore Main Sort Facility", activity: "Departed Sort Hub via Bluedart Air Cargo" },
          { timestamp: "31 Aug 2026, 09:15 AM", location: "Office Connect Fulfillment Center, BLR", activity: "Package Picked, Invoiced & Scanned" },
          { timestamp: "31 Aug 2026, 08:30 AM", location: "Platform Escrow Vault", activity: "Payment Verified & Merchant Dispatched" },
        ],
      },
      {
        packageId: "PKG-98214-B",
        sellerName: "Glow Beauty Organics",
        sellerTier: "premium" as const,
        courier: "Delhivery Surface",
        trackingNumber: "DEL-77192031",
        stage: "dispatched" as TrackingStage,
        estimatedArrival: "Wednesday, Sept 3 by 6:00 PM",
        item: "Glow Beauty Damask Rose Organic Botanical Hydrating Facial Serum (50ml)",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
        qty: 2,
        price: 2499,
        logs: [
          { timestamp: "31 Aug 2026, 10:45 AM", location: "Glow Beauty Warehouse, Grasse Import Hub", activity: "Manifest Created & Awaiting Courier Handover" },
          { timestamp: "31 Aug 2026, 08:30 AM", location: "Platform Escrow Vault", activity: "Escrow Secured & Seller Notified" },
        ],
      },
    ],
  };

  return (
    <StorefrontShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32 select-none">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/storefront" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <Link href="/orders" className="hover:text-slate-900 transition">My Orders</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Tracking #{orderData.orderNumber}</span>
        </nav>

        {/* Order Header */}
        <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Order #{orderData.orderNumber}
            </h1>
            <p className="text-xs text-slate-500">
              Placed on {orderData.date} • Total: <strong className="text-slate-900">{formatINR(orderData.totalAmount)}</strong> • {orderData.paymentMethod}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-[4px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition"
            >
              🖨️ Download GST Invoice
            </button>
          </div>
        </div>

        {/* Multi-Package Live Steppers */}
        <div className="space-y-8">
          {orderData.packages.map((pkg, idx) => (
            <div key={pkg.packageId} className="space-y-4">
              
              {/* Package Header Card */}
              <div className="p-4 rounded-[8px] bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="bg-[#404d85] text-white text-[10px] font-black px-2 py-0.5 rounded">
                    PACKAGE {idx + 1} of {orderData.packages.length}
                  </span>
                  <span className="font-bold">{pkg.item} (Qty: {pkg.qty})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Sold by:</span>
                  <span className="font-bold text-white">{pkg.sellerName}</span>
                </div>
              </div>

              {/* Visual Transit Stepper */}
              <PackageTrackingStepper
                currentStage={pkg.stage}
                logs={pkg.logs}
                courierName={pkg.courier}
                trackingNumber={pkg.trackingNumber}
                estimatedArrival={pkg.estimatedArrival}
              />

            </div>
          ))}
        </div>

        {/* Escrow & Delivery Address Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[8px] bg-slate-50 border border-slate-200 text-xs">
          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider text-[10px] text-slate-400">Shipping Address</span>
            <p className="font-extrabold text-slate-900">{orderData.deliveryAddress.fullName}</p>
            <p className="text-slate-600 leading-relaxed">
              {orderData.deliveryAddress.addressLine1}, {orderData.deliveryAddress.city}, {orderData.deliveryAddress.state} - {orderData.deliveryAddress.pincode}
            </p>
            <p className="text-slate-500">📞 {orderData.deliveryAddress.phone}</p>
          </div>

          <div className="space-y-1 md:text-right">
            <span className="font-black uppercase tracking-wider text-[10px] text-slate-400">Platform Escrow Status</span>
            <p className="font-bold text-emerald-700">🛡️ {orderData.escrowStatus}</p>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Office Connect will release payments to {orderData.packages[0].sellerName} and {orderData.packages[1].sellerName} only after successful delivery OTP validation.
            </p>
          </div>
        </div>

      </div>
    </StorefrontShell>
  );
}
