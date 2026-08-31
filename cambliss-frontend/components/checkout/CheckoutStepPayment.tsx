"use client";

import { useState } from "react";
import { formatINR } from "@/components/commerce/CommercePrimitives";

export type PaymentMethod = "upi" | "card" | "netbanking" | "cod";

export const CheckoutStepPayment = ({
  selectedMethod,
  onSelectMethod,
  totalAmount,
}: {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  totalAmount: number;
}) => {
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  return (
    <div className="space-y-6 select-none">
      
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            2. Select Multi-Vendor Escrow Payment Method
          </h2>
          <p className="text-xs text-slate-500">
            Your payment is held securely in platform escrow and only released after delivery confirmation.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        
        {/* UPI Option */}
        <div
          onClick={() => onSelectMethod("upi")}
          className={`p-4 rounded-[8px] border-2 cursor-pointer transition space-y-3 ${
            selectedMethod === "upi"
              ? "border-[#404d85] bg-blue-50/30 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900">Instant UPI (GPay, PhonePe, Paytm, QR)</h4>
                <p className="text-[11px] text-slate-500">Zero transaction fees • Instant auto-refunds</p>
              </div>
            </div>
            <span className={selectedMethod === "upi" ? "text-[#404d85] font-black" : "text-slate-300"}>
              {selectedMethod === "upi" ? "●" : "○"}
            </span>
          </div>

          {selectedMethod === "upi" && (
            <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter your UPI ID (e.g. mobile@upi)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-[4px]"
                />
                <button
                  type="button"
                  className="px-4 py-1.5 bg-[#404d85] text-white font-bold rounded-[4px]"
                >
                  Verify UPI
                </button>
              </div>
              <p className="text-[11px] text-slate-500">Or scan UPI QR code on the next confirmation screen</p>
            </div>
          )}
        </div>

        {/* Credit / Debit Cards */}
        <div
          onClick={() => onSelectMethod("card")}
          className={`p-4 rounded-[8px] border-2 cursor-pointer transition space-y-3 ${
            selectedMethod === "card"
              ? "border-[#404d85] bg-blue-50/30 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">💳</span>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900">Credit / Debit Card (Visa, Mastercard, RuPay)</h4>
                <p className="text-[11px] text-slate-500">256-bit SSL encrypted • Tokenized secure storage</p>
              </div>
            </div>
            <span className={selectedMethod === "card" ? "text-[#404d85] font-black" : "text-slate-300"}>
              {selectedMethod === "card" ? "●" : "○"}
            </span>
          </div>

          {selectedMethod === "card" && (
            <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
              <input
                type="text"
                placeholder="16-Digit Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] font-mono"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="MM / YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-[4px]"
                />
                <input
                  type="password"
                  maxLength={4}
                  placeholder="CVV"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-[4px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Net Banking */}
        <div
          onClick={() => onSelectMethod("netbanking")}
          className={`p-4 rounded-[8px] border-2 cursor-pointer transition ${
            selectedMethod === "netbanking"
              ? "border-[#404d85] bg-blue-50/30 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🏦</span>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900">Net Banking (50+ Indian Banks)</h4>
                <p className="text-[11px] text-slate-500">HDFC, ICICI, SBI, Axis, Kotak and all major banks</p>
              </div>
            </div>
            <span className={selectedMethod === "netbanking" ? "text-[#404d85] font-black" : "text-slate-300"}>
              {selectedMethod === "netbanking" ? "●" : "○"}
            </span>
          </div>
        </div>

        {/* Escrow Cash on Delivery */}
        <div
          onClick={() => onSelectMethod("cod")}
          className={`p-4 rounded-[8px] border-2 cursor-pointer transition ${
            selectedMethod === "cod"
              ? "border-[#404d85] bg-blue-50/30 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">💵</span>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900">Cash on Delivery (COD)</h4>
                <p className="text-[11px] text-slate-500">Pay via cash or UPI to courier upon physical arrival</p>
              </div>
            </div>
            <span className={selectedMethod === "cod" ? "text-[#404d85] font-black" : "text-slate-300"}>
              {selectedMethod === "cod" ? "●" : "○"}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
