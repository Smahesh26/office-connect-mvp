"use client";

import { useState } from "react";
import Link from "next/link";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { CheckoutStepAddress, DeliveryAddress } from "@/components/checkout/CheckoutStepAddress";
import { CheckoutStepPayment, PaymentMethod } from "@/components/checkout/CheckoutStepPayment";
import { CartOrderSummary } from "@/components/cart/CartOrderSummary";
import { formatINR, SellerBadge } from "@/components/commerce/CommercePrimitives";

export default function MultiVendorCheckoutPage() {
  const [currentStep, setCurrentStep] = useState<"address" | "payment" | "review">("address");

  const [addresses, setAddresses] = useState<DeliveryAddress[]>([
    {
      id: "addr-1",
      fullName: "Cambliss Studio & Tech HQ",
      phone: "+91 98450 12345",
      addressLine1: "#402, 4th Floor, Prestige Tech Park",
      addressLine2: "Outer Ring Road, Kadubeesanahalli",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560103",
      isDefault: true,
      gstin: "29AABCU9603R1ZM",
    },
    {
      id: "addr-2",
      fullName: "Bhasker Advani",
      phone: "+91 98450 67890",
      addressLine1: "Flat 12B, Ocean View Apartments",
      addressLine2: "Worli Sea Face",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400018",
    },
  ]);

  const [selectedAddressId, setSelectedAddressId] = useState("addr-1");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Cart Data for Checkout
  const checkoutPackages = [
    {
      sellerName: "Office Connect Direct",
      sellerTier: "premium" as const,
      deliveryEstimate: "Tomorrow by 2:00 PM",
      itemTitle: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
      price: 29990,
      quantity: 1,
    },
    {
      sellerName: "Glow Beauty Organics",
      sellerTier: "premium" as const,
      deliveryEstimate: "2 Days (Wednesday)",
      itemTitle: "Glow Beauty Damask Rose Organic Botanical Hydrating Facial Serum (50ml)",
      price: 2499,
      quantity: 2,
    },
  ];

  const itemsSubtotal = 29990 + 2499 * 2;
  const shippingTotal = 0;
  const taxTotal = Math.round(itemsSubtotal * 0.18);
  const grandTotal = itemsSubtotal + shippingTotal;

  const handleAddNewAddress = (newAddr: Omit<DeliveryAddress, "id">) => {
    const created: DeliveryAddress = {
      ...newAddr,
      id: `addr-${Date.now()}`,
    };
    setAddresses((prev) => [created, ...prev]);
    setSelectedAddressId(created.id);
  };

  const handlePlaceOrder = () => {
    setIsPlacingOrder(true);
    setTimeout(() => {
      window.location.href = "/order-confirmation/OC-89412";
    }, 1200);
  };

  return (
    <StorefrontShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32 select-none">
        
        {/* Checkout Header & Steps Indicator */}
        <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Secure Multi-Vendor Escrow Checkout
            </h1>
            <p className="text-xs text-slate-500">
              100% Escrow Protection • Funds held until verified package arrival
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className={`px-3 py-1 rounded-[4px] ${currentStep === "address" ? "bg-[#404d85] text-white" : "bg-slate-100 text-slate-700"}`}>
              1. Address
            </span>
            <span className="text-slate-300">→</span>
            <span className={`px-3 py-1 rounded-[4px] ${currentStep === "payment" ? "bg-[#404d85] text-white" : "bg-slate-100 text-slate-700"}`}>
              2. Payment
            </span>
            <span className="text-slate-300">→</span>
            <span className={`px-3 py-1 rounded-[4px] ${currentStep === "review" ? "bg-[#404d85] text-white" : "bg-slate-100 text-slate-700"}`}>
              3. Review
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Checkout Interaction (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Step 1: Address */}
            {currentStep === "address" && (
              <div className="space-y-6">
                <CheckoutStepAddress
                  addresses={addresses}
                  selectedAddressId={selectedAddressId}
                  onSelectAddress={setSelectedAddressId}
                  onAddNewAddress={handleAddNewAddress}
                />
                <button
                  type="button"
                  onClick={() => setCurrentStep("payment")}
                  className="w-full py-3.5 rounded-[6px] bg-[#404d85] text-white font-black text-xs hover:bg-[#323d6a] transition shadow-xs"
                >
                  Deliver to Selected Address & Continue to Payment →
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {currentStep === "payment" && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep("address")}
                  className="text-xs font-bold text-[#404d85] hover:underline"
                >
                  ← Back to Address Selection
                </button>

                <CheckoutStepPayment
                  selectedMethod={paymentMethod}
                  onSelectMethod={setPaymentMethod}
                  totalAmount={grandTotal}
                />

                <button
                  type="button"
                  onClick={() => setCurrentStep("review")}
                  className="w-full py-3.5 rounded-[6px] bg-[#404d85] text-white font-black text-xs hover:bg-[#323d6a] transition shadow-xs"
                >
                  Confirm Payment Method & Review Packages →
                </button>
              </div>
            )}

            {/* Step 3: Multi-Package Final Review */}
            {currentStep === "review" && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep("payment")}
                  className="text-xs font-bold text-[#404d85] hover:underline"
                >
                  ← Change Payment Method
                </button>

                <h2 className="text-base font-extrabold text-slate-900">
                  3. Review Multi-Vendor Packages Before Payment
                </h2>

                <div className="space-y-4">
                  {checkoutPackages.map((pkg, i) => (
                    <div key={i} className="p-4 rounded-[8px] border border-slate-200 bg-white space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded">
                            PACKAGE {i + 1}
                          </span>
                          <SellerBadge sellerName={pkg.sellerName} sellerTier={pkg.sellerTier} />
                        </div>
                        <span className="text-emerald-600 font-bold">🚚 {pkg.deliveryEstimate}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-semibold text-slate-800">{pkg.quantity}x {pkg.itemTitle}</span>
                        <span className="font-black text-slate-900">{formatINR(pkg.price * pkg.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-[8px] bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-900">Escrow Release Agreement:</p>
                  <p>
                    By clicking &quot;Authorize Escrow Payment&quot;, you authorize Office Connect to collect {formatINR(grandTotal)} and hold the funds in a designated platform escrow vault. Funds will only be settled to individual merchants after delivery verification.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full py-4 rounded-[6px] bg-slate-900 hover:bg-black text-white font-black text-sm transition shadow-md disabled:opacity-50"
                >
                  {isPlacingOrder ? "Processing Escrow Authorization..." : `🔒 Authorize Escrow Payment (${formatINR(grandTotal)})`}
                </button>
              </div>
            )}

          </div>

          {/* Right Order Summary Sticky (4 Cols) */}
          <div className="lg:col-span-4">
            <CartOrderSummary
              itemsSubtotal={itemsSubtotal}
              shippingTotal={shippingTotal}
              taxTotal={taxTotal}
              total={grandTotal}
              packageCount={checkoutPackages.length}
              checkoutHref="#"
              ctaLabel={currentStep === "review" ? "Authorize Escrow Payment" : "Continue Checkout"}
            />
          </div>

        </div>

      </div>
    </StorefrontShell>
  );
}
