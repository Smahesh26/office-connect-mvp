"use client";

import { useState, useMemo } from "react";
import {
  Calculator,
  Truck,
  Building2,
  Percent,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

export interface FeeBreakdown {
  sellingPrice: number;
  referralRate: number;
  referralFee: number;
  closingFee: number;
  shippingFee: number;
  totalMarketplaceCharges: number;
  gstOnFees: number;
  totalDeductions: number;
  netPayout: number;
  cogs: number;
  netProfit: number;
  profitMargin: number;
}

export const CATEGORY_FEE_RATES: Record<string, { rate: number; label: string }> = {
  "Electronics & Appliances": { rate: 7.0, label: "Electronics & Appliances (7.0%)" },
  "Computers & Accessories": { rate: 6.0, label: "Computers & Peripherals (6.0%)" },
  "Fashion & Apparel": { rate: 13.5, label: "Fashion & Apparel (13.5%)" },
  "Beauty & Personal Care": { rate: 10.0, label: "Beauty & Personal Care (10.0%)" },
  "Grocery & Gourmet": { rate: 5.5, label: "Grocery & Gourmet Food (5.5%)" },
  "Home & Kitchen": { rate: 9.0, label: "Home, Kitchen & Decor (9.0%)" },
  "Books & Stationery": { rate: 8.0, label: "Books & Educational Supplies (8.0%)" },
  "Automotive & Industrial": { rate: 8.5, label: "Automotive & Industrial (8.5%)" },
  "Sports & Fitness": { rate: 9.5, label: "Sports, Fitness & Outdoors (9.5%)" },
};

export const CLOSING_FEE_TIERS = [
  { max: 250, fee: 5 },
  { max: 500, fee: 10 },
  { max: 1000, fee: 25 },
  { max: Infinity, fee: 45 },
];

export const SHIPPING_RATES: Record<
  "FOC" | "EASY_SHIP" | "SELF_SHIP",
  {
    local: { base: number; extra: number };
    regional: { base: number; extra: number };
    national: { base: number; extra: number };
  }
> = {
  FOC: {
    local: { base: 38, extra: 18 },
    regional: { base: 49, extra: 24 },
    national: { base: 66, extra: 32 },
  },
  EASY_SHIP: {
    local: { base: 44, extra: 20 },
    regional: { base: 56, extra: 26 },
    national: { base: 74, extra: 36 },
  },
  SELF_SHIP: {
    local: { base: 0, extra: 0 },
    regional: { base: 0, extra: 0 },
    national: { base: 0, extra: 0 },
  },
};

interface SellerFeeCalculatorProps {
  initialCategory?: string;
  initialPrice?: number;
  embedded?: boolean;
  onFeeCalculated?: (breakdown: FeeBreakdown) => void;
}

export const SellerFeeCalculator = ({
  initialCategory = "Computers & Accessories",
  initialPrice = 2499,
  embedded = false,
  onFeeCalculated,
}: SellerFeeCalculatorProps) => {
  const [category, setCategory] = useState<string>(
    CATEGORY_FEE_RATES[initialCategory] ? initialCategory : "Computers & Accessories"
  );
  const [sellingPrice, setSellingPrice] = useState<number>(initialPrice);
  const [cogs, setCogs] = useState<number>(Math.round(initialPrice * 0.55));
  const [fulfillment, setFulfillment] = useState<"FOC" | "EASY_SHIP" | "SELF_SHIP">("FOC");
  const [shippingZone, setShippingZone] = useState<"local" | "regional" | "national">("regional");
  const [weightGrams, setWeightGrams] = useState<number>(500);

  // Dynamic fee calculation adhering strictly to Indian Marketplace Standards
  const breakdown: FeeBreakdown = useMemo(() => {
    const price = Math.max(0, sellingPrice || 0);
    const categoryInfo = CATEGORY_FEE_RATES[category] || { rate: 8.0, label: category };
    const referralRate = categoryInfo.rate;
    const referralFee = (price * referralRate) / 100;

    // Closing Fee tier
    let closingFee = 45;
    for (const tier of CLOSING_FEE_TIERS) {
      if (price <= tier.max) {
        closingFee = tier.fee;
        break;
      }
    }

    // Shipping Fee
    let shippingFee = 0;
    if (fulfillment !== "SELF_SHIP") {
      const rates = SHIPPING_RATES[fulfillment][shippingZone];
      const extraHalfKgs = Math.max(0, Math.ceil((weightGrams - 500) / 500));
      shippingFee = rates.base + extraHalfKgs * rates.extra;
    }

    const totalMarketplaceCharges = referralFee + closingFee + shippingFee;
    const gstOnFees = totalMarketplaceCharges * 0.18; // 18% GST on marketplace platform service fees
    const totalDeductions = totalMarketplaceCharges + gstOnFees;
    const netPayout = Math.max(0, price - totalDeductions);
    const netProfit = netPayout - (cogs || 0);
    const profitMargin = price > 0 ? (netProfit / price) * 100 : 0;

    const res: FeeBreakdown = {
      sellingPrice: price,
      referralRate,
      referralFee,
      closingFee,
      shippingFee,
      totalMarketplaceCharges,
      gstOnFees,
      totalDeductions,
      netPayout,
      cogs,
      netProfit,
      profitMargin,
    };

    if (onFeeCalculated) {
      onFeeCalculated(res);
    }

    return res;
  }, [category, sellingPrice, cogs, fulfillment, shippingZone, weightGrams, onFeeCalculated]);

  const pricePresets = [499, 999, 1999, 4999, 12999];

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white ${
        embedded ? "p-4 sm:p-6 shadow-none" : "p-6 sm:p-8 shadow-xl"
      } select-none transition-all`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-inner">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
              Real-Time Merchant Fee & Profit Simulator
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Transparent breakdown of referral fees, closing fees, logistics, and statutory 18% GST.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            7-Day Escrow Payout
          </span>
          <button
            type="button"
            onClick={() => {
              setSellingPrice(2499);
              setCogs(1374);
              setCategory("Computers & Accessories");
              setFulfillment("FOC");
              setShippingZone("regional");
              setWeightGrams(500);
            }}
            title="Reset to default"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* Left Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Selling Price */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                Listing Selling Price (INR)
                <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                {pricePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setSellingPrice(preset);
                      setCogs(Math.round(preset * 0.55));
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      sellingPrice === preset
                        ? "bg-[#404d85] text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    ₹{preset.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                ₹
              </div>
              <input
                type="number"
                min="1"
                value={sellingPrice || ""}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                placeholder="e.g. 2499"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-extrabold text-base focus:ring-2 focus:ring-[#404d85] focus:border-[#404d85] outline-none transition"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
              Product Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs sm:text-sm focus:ring-2 focus:ring-[#404d85] focus:border-[#404d85] outline-none cursor-pointer transition"
              >
                {Object.entries(CATEGORY_FEE_RATES).map(([catKey, catVal]) => (
                  <option key={catKey} value={catKey}>
                    {catVal.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Fulfillment Model */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
              Fulfillment Channel
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  id: "FOC",
                  name: "FOC",
                  sub: "Fulfilled by Office Connect",
                  badge: "Prime Speed",
                },
                {
                  id: "EASY_SHIP",
                  name: "Easy Ship",
                  sub: "Doorstep Pickup",
                  badge: "Standard",
                },
                {
                  id: "SELF_SHIP",
                  name: "Self Ship",
                  sub: "Merchant Logistics",
                  badge: "Zero Fee",
                },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFulfillment(m.id as any)}
                  className={`p-2.5 rounded-xl text-left border transition flex flex-col justify-between ${
                    fulfillment === m.id
                      ? "border-[#404d85] bg-[#eef2ff] shadow-xs ring-1 ring-[#404d85]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-slate-900">{m.name}</span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        fulfillment === m.id
                          ? "bg-[#404d85] text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {m.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 line-clamp-1">{m.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Distance & Weight Row (Disabled for Self Ship) */}
          {fulfillment !== "SELF_SHIP" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Delivery Destination
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: "local", label: "Local" },
                    { id: "regional", label: "Regional" },
                    { id: "national", label: "National" },
                  ].map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setShippingZone(z.id as any)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition text-center ${
                        shippingZone === z.id
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {z.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Package Weight (Grams)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(Math.max(100, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-[#404d85] outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                    {weightGrams < 1000 ? `${weightGrams}g` : `${(weightGrams / 1000).toFixed(1)}kg`}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                <strong>Self Ship selected:</strong> Zero marketplace shipping fee deducted. You coordinate shipping with your integrated couriers (BlueDart, Delhivery, etc.).
              </span>
            </div>
          )}

          {/* Merchant Cost of Goods (COGS) Optional Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Merchant Product Cost (COGS)
              </label>
              <span className="text-[10px] text-slate-400 font-medium">To estimate net profit</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                ₹
              </div>
              <input
                type="number"
                min="0"
                value={cogs || ""}
                onChange={(e) => setCogs(Number(e.target.value))}
                placeholder="Product manufacturing / purchase cost"
                className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-bold text-xs focus:ring-1 focus:ring-[#404d85] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Output & Receipt (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#1b223c] via-[#242e54] to-[#344070] text-white p-5 sm:p-6 shadow-xl border border-white/10">
          <div>
            {/* Top Settlement Highlight */}
            <div className="pb-4 border-b border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#a5b4fc] block mb-1">
                Net Take-Home Bank Payout
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  ₹{Math.round(breakdown.netPayout).toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {((breakdown.netPayout / Math.max(1, breakdown.sellingPrice)) * 100).toFixed(0)}% of sale
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Credited directly to your escrow bank account every 7 days.
              </p>
            </div>

            {/* Profit Margin Indicator if COGS provided */}
            {breakdown.cogs > 0 && (
              <div className="mt-3 p-2.5 rounded-lg bg-white/10 border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Estimated Net Profit:</span>
                <span className="font-extrabold text-emerald-400">
                  ₹{Math.round(breakdown.netProfit).toLocaleString("en-IN")}{" "}
                  <span className="text-[10px] text-slate-300">
                    ({breakdown.profitMargin.toFixed(1)}% margin)
                  </span>
                </span>
              </div>
            )}

            {/* Detailed Deductions Line Items */}
            <div className="mt-4 space-y-2.5 text-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">
                Itemized Platform Deductions
              </span>

              {/* Referral Fee */}
              <div className="flex items-center justify-between text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-[#a5b4fc]" />
                  Referral Fee ({breakdown.referralRate}%)
                </span>
                <span className="font-mono font-bold text-slate-200">
                  -₹{breakdown.referralFee.toFixed(2)}
                </span>
              </div>

              {/* Closing Fee */}
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  Tiered Closing Fee
                </span>
                <span className="font-mono font-bold text-slate-200">
                  -₹{breakdown.closingFee.toFixed(2)}
                </span>
              </div>

              {/* Shipping Fee */}
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-indigo-400" />
                  Logistics ({fulfillment})
                </span>
                <span className="font-mono font-bold text-slate-200">
                  {breakdown.shippingFee > 0
                    ? `-₹${breakdown.shippingFee.toFixed(2)}`
                    : "₹0.00 (Self)"}
                </span>
              </div>

              {/* Subtotal Charges */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
                <span>Total Services Subtotal</span>
                <span className="font-mono">
                  ₹{breakdown.totalMarketplaceCharges.toFixed(2)}
                </span>
              </div>

              {/* GST 18% */}
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-[11px] text-amber-400 font-semibold">
                  + 18% GST on Marketplace Services
                </span>
                <span className="font-mono font-bold text-amber-400">
                  -₹{breakdown.gstOnFees.toFixed(2)}
                </span>
              </div>

              {/* Total Deductions */}
              <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between font-extrabold text-xs text-rose-400">
                <span>Total Platform Deductions</span>
                <span className="font-mono">
                  -₹{breakdown.totalDeductions.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Tax Compliance Guarantee */}
          <div className="mt-5 pt-3 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
            <p className="flex items-center gap-1 text-slate-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Tax Compliant & GST Invoicing
            </p>
            <p>
              Automated Form GSTR-8 1% TCS compliance filing credited directly to your Cash Ledger on the GST Portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerFeeCalculator;
