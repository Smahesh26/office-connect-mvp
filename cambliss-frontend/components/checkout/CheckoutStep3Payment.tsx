"use client";

import { useState } from "react";

export type PaymentMethodType = "upi" | "card" | "netbanking" | "cod" | "net30";

export const CheckoutStep3Payment = ({
  isActive,
  isCompleted,
  selectedMethod,
  onSelectMethod,
  onContinue,
  onEditStep,
}: {
  isActive: boolean;
  isCompleted: boolean;
  selectedMethod: PaymentMethodType;
  onSelectMethod: (m: PaymentMethodType) => void;
  onContinue: () => void;
  onEditStep: () => void;
}) => {
  const [upiId, setUpiId] = useState("bhasker@okaxis");
  const [cardData, setCardData] = useState({
    number: "4532 •••• •••• 8821",
    name: "BHASKER A",
    expiry: "09/28",
    cvv: "•••",
  });
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  const methodNames: Record<PaymentMethodType, string> = {
    upi: "UPI / Instant QR (GPay, PhonePe, Paytm)",
    card: "Credit / Debit Card (Visa, MasterCard, RuPay)",
    netbanking: "Net Banking (All Major Indian Banks)",
    cod: "Escrow Cash on Delivery (Doorstep OTP Scan)",
    net30: "Corporate Net30 Invoice (B2B Credit)",
  };

  // Completed State Preview
  if (!isActive && isCompleted) {
    return (
      <div className="p-4 rounded-[8px] border border-slate-200 bg-white flex items-start justify-between gap-4 text-xs shadow-2xs select-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
              ✓
            </span>
            <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
              3. Escrow Payment Method Chosen
            </span>
          </div>
          <p className="font-bold text-slate-800 pl-7">{methodNames[selectedMethod]}</p>
          <p className="text-emerald-700 pl-7 text-[11px] font-semibold">
            🛡️ 100% Escrow Protection Lock Active
          </p>
        </div>

        <button
          type="button"
          onClick={onEditStep}
          className="px-3 py-1 rounded border border-slate-200 hover:border-[#404d85] text-[#404d85] font-bold text-xs transition"
        >
          Change
        </button>
      </div>
    );
  }

  // Inactive Non-completed State
  if (!isActive) {
    return (
      <div className="p-4 rounded-[8px] border border-slate-200 bg-slate-50 opacity-60 text-xs flex items-center gap-2 select-none">
        <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 font-bold text-[10px] flex items-center justify-center">
          3
        </span>
        <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">
          3. Escrow Payment Gateway
        </span>
      </div>
    );
  }

  // Active State
  return (
    <div className="p-5 sm:p-6 rounded-[8px] border border-[#404d85] bg-white space-y-5 shadow-2xs select-none ring-2 ring-[#404d85]/10">
      
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <span className="w-6 h-6 rounded-full bg-[#404d85] text-white font-black text-xs flex items-center justify-center">
          3
        </span>
        <h2 className="font-black text-sm text-slate-900 uppercase tracking-wider">
          Select Escrow Payment Gateway
        </h2>
      </div>

      <div className="space-y-3">
        
        {/* 1. UPI / Instant QR */}
        <label
          onClick={() => onSelectMethod("upi")}
          className={`p-4 rounded-[6px] border block cursor-pointer transition text-xs ${
            selectedMethod === "upi"
              ? "border-[#404d85] bg-[#404d85]/5 ring-1 ring-[#404d85]"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === "upi"}
                onChange={() => onSelectMethod("upi")}
                className="text-[#404d85]"
              />
              <span className="font-bold text-slate-900">
                ⚡ UPI / Instant QR (Google Pay, PhonePe, Paytm, BHIM)
              </span>
            </div>
            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-black text-[9px]">
              FASTEST • ZERO FEES
            </span>
          </div>

          {selectedMethod === "upi" && (
            <div className="mt-3 pl-6 space-y-2">
              <div className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  placeholder="Enter UPI VPA (e.g. mobile@upi)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono font-bold"
                />
                <button
                  type="button"
                  className="px-3 py-1.5 bg-slate-900 text-white rounded font-bold text-xs"
                >
                  Verify
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                You will receive an approval notification on your UPI mobile app.
              </p>
            </div>
          )}
        </label>

        {/* 2. Credit / Debit Cards */}
        <label
          onClick={() => onSelectMethod("card")}
          className={`p-4 rounded-[6px] border block cursor-pointer transition text-xs ${
            selectedMethod === "card"
              ? "border-[#404d85] bg-[#404d85]/5 ring-1 ring-[#404d85]"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === "card"}
                onChange={() => onSelectMethod("card")}
                className="text-[#404d85]"
              />
              <span className="font-bold text-slate-900">
                💳 Credit & Debit Cards (Visa, MasterCard, RuPay, Amex)
              </span>
            </div>
            <span className="text-slate-400 font-semibold text-[11px]">EMI Available</span>
          </div>

          {selectedMethod === "card" && (
            <div className="mt-3 pl-6 space-y-3 max-w-md">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardData.number}
                  onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valid Thru</label>
                  <input
                    type="text"
                    value={cardData.expiry}
                    onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardData.cvv}
                    onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}
        </label>

        {/* 3. Net Banking */}
        <label
          onClick={() => onSelectMethod("netbanking")}
          className={`p-4 rounded-[6px] border block cursor-pointer transition text-xs ${
            selectedMethod === "netbanking"
              ? "border-[#404d85] bg-[#404d85]/5 ring-1 ring-[#404d85]"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="paymentMethod"
              checked={selectedMethod === "netbanking"}
              onChange={() => onSelectMethod("netbanking")}
              className="text-[#404d85]"
            />
            <span className="font-bold text-slate-900">
              🏦 Net Banking (All Indian Banks)
            </span>
          </div>

          {selectedMethod === "netbanking" && (
            <div className="mt-3 pl-6 max-w-sm">
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white font-bold"
              >
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="State Bank of India">State Bank of India</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
              </select>
            </div>
          )}
        </label>

        {/* 4. Escrow COD */}
        <label
          onClick={() => onSelectMethod("cod")}
          className={`p-4 rounded-[6px] border block cursor-pointer transition text-xs ${
            selectedMethod === "cod"
              ? "border-[#404d85] bg-[#404d85]/5 ring-1 ring-[#404d85]"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="paymentMethod"
              checked={selectedMethod === "cod"}
              onChange={() => onSelectMethod("cod")}
              className="text-[#404d85]"
            />
            <span className="font-bold text-slate-900">
              💵 Escrow Verified Cash on Delivery (Pay upon delivery OTP)
            </span>
          </div>
        </label>

      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="px-6 py-2.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-xs transition shadow-2xs"
        >
          Review Order & Final Amount →
        </button>
      </div>

    </div>
  );
};
