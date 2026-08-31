"use client";

import { use } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { formatINR, SellerBadge } from "@/components/commerce/CommercePrimitives";

export default function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);

  const orderData = {
    orderNumber: orderId || "OC-89412",
    date: "31 August 2026",
    paymentMethod: "UPI Escrow Authorization (GPay)",
    escrowStatus: "Secured in Escrow Vault",
    totalAmount: 34988,
    deliveryAddress: {
      fullName: "Cambliss Studio & Tech HQ",
      addressLine1: "#402, 4th Floor, Prestige Tech Park",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560103",
      phone: "+91 98450 12345",
      gstin: "29AABCU9603R1ZM",
    },
    packages: [
      {
        packageId: "PKG-98214-A",
        sellerName: "Office Connect Direct",
        sellerTier: "premium" as const,
        courier: "Bluedart Air Express",
        trackingNumber: "BD-89124091",
        estimatedArrival: "Tomorrow, Sept 1 by 2:00 PM",
        item: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
        qty: 1,
        price: 29990,
      },
      {
        packageId: "PKG-98214-B",
        sellerName: "Glow Beauty Organics",
        sellerTier: "premium" as const,
        courier: "Delhivery Surface Express",
        trackingNumber: "DEL-77192031",
        estimatedArrival: "Wednesday, Sept 3 by 6:00 PM",
        item: "Glow Beauty Damask Rose Organic Botanical Hydrating Facial Serum (50ml)",
        qty: 2,
        price: 2499,
      },
    ],
  };

  return (
    <StorefrontShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 pb-32 select-none">
        
        {/* Success Header */}
        <div className="text-center space-y-3 p-8 rounded-[12px] bg-slate-50 border border-slate-200">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-2xl mx-auto font-black shadow-xs">
            ✓
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Order Successfully Placed & Escrow Secured!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Thank you! Your payment of <span className="font-bold text-slate-900">{formatINR(orderData.totalAmount)}</span> is securely protected in platform escrow. We have notified both merchants to dispatch your packages.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <span>Order ID:</span>
            <span className="font-mono bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-900">
              {orderData.orderNumber}
            </span>
          </div>
        </div>

        {/* Multi-Vendor Packages Tracking Breakdown */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">
            Dispatched in {orderData.packages.length} Independent Seller Packages
          </h2>

          <div className="space-y-4">
            {orderData.packages.map((pkg) => (
              <div
                key={pkg.packageId}
                className="p-5 rounded-[8px] border border-slate-200 bg-white space-y-3 text-xs shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded">
                      {pkg.packageId}
                    </span>
                    <SellerBadge sellerName={pkg.sellerName} sellerTier={pkg.sellerTier} />
                  </div>
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    <span>🚚</span>
                    <span>Arriving {pkg.estimatedArrival}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{pkg.qty}x {pkg.item}</span>
                  <span className="font-black text-slate-900">{formatINR(pkg.price * pkg.qty)}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Courier: <strong className="text-slate-800">{pkg.courier}</strong></span>
                  <span className="font-mono font-bold text-[#404d85]">AWB: {pkg.trackingNumber}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Tax Invoice Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-[8px] border border-slate-200 bg-slate-50 text-xs">
          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider text-[10px] text-slate-400">Delivery Address</span>
            <p className="font-extrabold text-slate-900">{orderData.deliveryAddress.fullName}</p>
            <p className="text-slate-600 leading-relaxed">
              {orderData.deliveryAddress.addressLine1}, {orderData.deliveryAddress.city}, {orderData.deliveryAddress.state} - {orderData.deliveryAddress.pincode}
            </p>
            <p className="text-slate-500 font-mono">GSTIN: {orderData.deliveryAddress.gstin}</p>
          </div>

          <div className="space-y-1 md:text-right">
            <span className="font-black uppercase tracking-wider text-[10px] text-slate-400">Escrow & Payment Terms</span>
            <p className="font-bold text-slate-800">{orderData.paymentMethod}</p>
            <p className="text-emerald-700 font-bold">🛡️ {orderData.escrowStatus}</p>
            <p className="text-slate-400 text-[11px]">Funds released only upon buyer delivery verification</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/storefront"
            className="w-full sm:w-auto px-6 py-3 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs text-center transition shadow-xs"
          >
            Continue Shopping →
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto px-6 py-3 rounded-[6px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs text-center transition"
          >
            🖨️ Print GST Tax Invoice
          </button>
        </div>

      </div>
    </StorefrontShell>
  );
}
