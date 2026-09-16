"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MarketplacePageWrapper } from "@/components/storefront/MarketplacePageWrapper";
import {
  CheckoutStep1Address,
  DeliveryAddress,
} from "@/components/checkout/CheckoutStep1Address";
import { CheckoutStep2Delivery } from "@/components/checkout/CheckoutStep2Delivery";
import {
  CheckoutStep3Payment,
  PaymentMethodType,
} from "@/components/checkout/CheckoutStep3Payment";
import { CheckoutStep4Review } from "@/components/checkout/CheckoutStep4Review";
import { CheckoutStickySummary } from "@/components/checkout/CheckoutStickySummary";
import { SellerPackage } from "@/components/cart/MultiVendorPackageGroup";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export default function CheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Address State
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress>({
    id: "addr-1",
    name: "Cambliss Studio & Tech HQ (Bhasker A.)",
    phone: "+91 98450 12345",
    line1: "Suite 402, Prestige Tech Park, Marathahalli-Sarjapur Outer Ring Rd",
    line2: "Kadubeesanahalli",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560103",
    isDefault: true,
    type: "Work / Office",
  });

  // B2B GSTIN State
  const [gstin, setGstin] = useState("29AABCU9603R1ZM");
  const [companyName, setCompanyName] = useState("Cambliss Studio Private Limited");

  // Payment Method State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>("upi");

  // Multi-Vendor Packages (Purged mock data - user/buyer products populated on checkout)
  const [packages, setPackages] = useState<SellerPackage[]>([]);

  const subtotal = packages.reduce((acc, pkg) => acc + pkg.items.reduce((iAcc, item) => iAcc + (item.price * item.quantity), 0), 0);
  const originalTotal = packages.reduce((acc, pkg) => acc + pkg.items.reduce((iAcc, item) => iAcc + ((item.originalPrice || item.price) * item.quantity), 0), 0);
  const discountAmount = originalTotal > subtotal ? originalTotal - subtotal : 0;
  const deliveryFee = 0;
  const grandTotal = subtotal - discountAmount + deliveryFee > 0 ? subtotal - discountAmount + deliveryFee : 0;

  const handlePlaceOrder = () => {
    if (packages.length === 0) return;
    setIsPlacingOrder(true);
    setTimeout(() => {
      router.push("/orders");
    }, 1200);
  };

  if (packages.length === 0) {
    return (
      <MarketplacePageWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 select-none text-center">
          <div className="max-w-md mx-auto p-8 rounded-[12px] border border-slate-200 bg-white shadow-sm space-y-4">
            <span className="text-4xl">🛍️</span>
            <h1 className="text-xl font-black text-slate-900">Your Shopping Bag is Empty</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              No products are currently staged for checkout. Browse the marketplace to discover products uploaded by registered merchants.
            </p>
            <div className="pt-2">
              <Link
                href="/storefront"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-xs transition shadow-sm"
              >
                ← Explore Marketplace
              </Link>
            </div>
          </div>
        </div>
      </MarketplacePageWrapper>
    );
  }

  return (
    <MarketplacePageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-32 select-none">
        
        {/* Header */}
        <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Multi-Package Escrow Checkout
            </h1>
            <p className="text-xs text-slate-500">
              Complete your 4-step verified purchase with 100% Escrow Protection guarantee.
            </p>
          </div>

          <Link
            href="/cart"
            className="text-xs font-bold text-[#404d85] hover:underline self-start sm:self-auto"
          >
            ← Return to Shopping Bag
          </Link>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between max-w-2xl bg-white p-3 rounded-[8px] border border-slate-200 text-xs font-extrabold shadow-2xs">
          {[
            { num: 1, label: "1. Address" },
            { num: 2, label: "2. Delivery" },
            { num: 3, label: "3. Payment" },
            { num: 4, label: "4. Review" },
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => {
                if (currentStep > s.num) setCurrentStep(s.num as any);
              }}
              className={`flex items-center gap-1.5 cursor-pointer ${
                currentStep === s.num
                  ? "text-[#404d85]"
                  : currentStep > s.num
                  ? "text-emerald-700 font-bold"
                  : "text-slate-400 cursor-not-allowed"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  currentStep === s.num
                    ? "bg-[#404d85] text-white"
                    : currentStep > s.num
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {currentStep > s.num ? "✓" : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* 2-Column Desktop Grid / 1-Column Mobile Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: 4-Step Form Formations */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Step 1: Address */}
            <CheckoutStep1Address
              isActive={currentStep === 1}
              isCompleted={currentStep > 1}
              selectedAddress={selectedAddress}
              onSelectAddress={setSelectedAddress}
              onContinue={() => setCurrentStep(2)}
              onEditStep={() => setCurrentStep(1)}
              gstin={gstin}
              onGstinChange={setGstin}
              companyName={companyName}
              onCompanyNameChange={setCompanyName}
            />

            {/* Step 2: Delivery */}
            <CheckoutStep2Delivery
              isActive={currentStep === 2}
              isCompleted={currentStep > 2}
              packages={packages}
              onContinue={() => setCurrentStep(3)}
              onEditStep={() => setCurrentStep(2)}
            />

            {/* Step 3: Payment */}
            <CheckoutStep3Payment
              isActive={currentStep === 3}
              isCompleted={currentStep > 3}
              selectedMethod={selectedPaymentMethod}
              onSelectMethod={setSelectedPaymentMethod}
              onContinue={() => setCurrentStep(4)}
              onEditStep={() => setCurrentStep(3)}
            />

            {/* Step 4: Final Review */}
            <CheckoutStep4Review
              isActive={currentStep === 4}
              packages={packages}
              address={selectedAddress}
              paymentMethod={selectedPaymentMethod}
              grandTotal={grandTotal}
              onPlaceOrder={handlePlaceOrder}
              isPlacingOrder={isPlacingOrder}
            />

          </div>

          {/* Right Column: Sticky Order Summary */}
          <div className="lg:col-span-4">
            <CheckoutStickySummary
              packages={packages}
              subtotal={subtotal}
              originalTotal={originalTotal}
              discountAmount={discountAmount}
              deliveryFee={deliveryFee}
              grandTotal={grandTotal}
            />
          </div>

        </div>

        {/* Mobile Fixed Bottom Checkout Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-4 shadow-xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Final Amount:
            </span>
            <span className="text-xl font-black text-[#404d85]">
              {formatINR(grandTotal)}
            </span>
          </div>

          <button
            type="button"
            disabled={isPlacingOrder}
            onClick={() => {
              if (currentStep < 4) {
                setCurrentStep((currentStep + 1) as any);
              } else {
                handlePlaceOrder();
              }
            }}
            className="flex-1 py-3 px-4 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-xs text-center transition shadow-sm"
          >
            {isPlacingOrder ? (
              "Securing Escrow..."
            ) : currentStep < 4 ? (
              `Proceed to Step ${currentStep + 1} →`
            ) : (
              `Place Order (${formatINR(grandTotal)})`
            )}
          </button>
        </div>

      </div>
    </MarketplacePageWrapper>
  );
}
