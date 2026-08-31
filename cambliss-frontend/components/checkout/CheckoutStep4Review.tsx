"use client";

import { formatINR } from "@/components/commerce/CommercePrimitives";
import { SellerPackage } from "@/components/cart/MultiVendorPackageGroup";
import { DeliveryAddress } from "./CheckoutStep1Address";
import { PaymentMethodType } from "./CheckoutStep3Payment";

export const CheckoutStep4Review = ({
  isActive,
  packages,
  address,
  paymentMethod,
  grandTotal,
  onPlaceOrder,
  isPlacingOrder,
}: {
  isActive: boolean;
  packages: SellerPackage[];
  address: DeliveryAddress;
  paymentMethod: PaymentMethodType;
  grandTotal: number;
  onPlaceOrder: () => void;
  isPlacingOrder: boolean;
}) => {
  if (!isActive) {
    return (
      <div className="p-4 rounded-[8px] border border-slate-200 bg-slate-50 opacity-60 text-xs flex items-center gap-2 select-none">
        <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 font-bold text-[10px] flex items-center justify-center">
          4
        </span>
        <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">
          4. Final Review & Place Order
        </span>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-[8px] border border-[#404d85] bg-white space-y-6 shadow-2xs select-none ring-2 ring-[#404d85]/10">
      
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <span className="w-6 h-6 rounded-full bg-[#404d85] text-white font-black text-xs flex items-center justify-center">
          4
        </span>
        <h2 className="font-black text-sm text-slate-900 uppercase tracking-wider">
          Review & Confirm Marketplace Order
        </h2>
      </div>

      {/* Package Line Items Review */}
      <div className="space-y-4">
        {packages.map((pkg, idx) => (
          <div key={pkg.sellerId} className="p-4 rounded-[6px] border border-slate-200 bg-slate-50/50 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900">
                Package {idx + 1}: {pkg.sellerName}
              </span>
              <span className="text-emerald-700 font-bold">
                🚚 {pkg.deliveryEstimate}
              </span>
            </div>

            <div className="space-y-2">
              {pkg.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={item.image} alt="" className="w-8 h-8 rounded border object-contain shrink-0" />
                    <span className="font-bold text-slate-800 truncate">{item.title}</span>
                    <span className="text-slate-400">×{item.quantity}</span>
                  </div>
                  <span className="font-black text-slate-900 shrink-0">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Delivery & Payment Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-1">
          <span className="font-extrabold text-[10px] text-slate-400 uppercase">Shipping To:</span>
          <p className="font-bold text-slate-900">{address.name}</p>
          <p className="text-slate-600">{address.line1}, {address.city} {address.pincode}</p>
        </div>

        <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-1">
          <span className="font-extrabold text-[10px] text-slate-400 uppercase">Payment Method:</span>
          <p className="font-bold text-slate-900 uppercase">{paymentMethod}</p>
          <p className="text-emerald-700 font-semibold">100% Escrow Protection Lock</p>
        </div>
      </div>

      {/* Final Authorization Button */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          disabled={isPlacingOrder}
          onClick={onPlaceOrder}
          className="w-full py-4 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] active:bg-[#252f5a] text-white font-black text-base transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isPlacingOrder ? (
            <span>Securing Escrow Vault...</span>
          ) : (
            <>
              <span>🔒</span>
              <span>Authorize & Place Order ({formatINR(grandTotal)})</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-500 text-center font-medium">
          By placing this order, you agree to the Office Connect Terms of Service and Escrow Vault Policy.
        </p>
      </div>

    </div>
  );
};
