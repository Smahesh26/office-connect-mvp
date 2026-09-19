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
  Info,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
} from "lucide-react";

export interface FeeBreakdown {
  sellingPrice: number;
  referralRate: number;
  referralFee: number;
  closingFee: number;
  shippingFee: number;
  pickAndPackFee: number;
  totalMarketplaceCharges: number;
  gstOnFees: number;
  tcsFee: number;
  totalDeductions: number;
  netPayout: number;
  cogs: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
}

// Global Category Commission Benchmarks (aligned with Amazon/Flipkart/Shopify standards)
export const CATEGORY_FEE_RATES: Record<string, { rate: number; label: string; gstRate: string }> = {
  "Electronics & Appliances": { rate: 7.0, label: "Electronics & Large Appliances (7.0%)", gstRate: "18%" },
  "Computers & Accessories": { rate: 6.0, label: "Computers & Peripherals (6.0%)", gstRate: "18%" },
  "Fashion & Apparel": { rate: 13.5, label: "Fashion & Apparel (13.5%)", gstRate: "12%" },
  "Beauty & Personal Care": { rate: 10.0, label: "Beauty & Personal Care (10.0%)", gstRate: "18%" },
  "Grocery & Gourmet": { rate: 5.5, label: "Grocery & Gourmet Food (5.5%)", gstRate: "5%" },
  "Home & Kitchen": { rate: 9.0, label: "Home, Kitchen & Decor (9.0%)", gstRate: "18%" },
  "Books & Stationery": { rate: 8.0, label: "Books & Educational Supplies (8.0%)", gstRate: "0%" },
  "Automotive & Industrial": { rate: 8.5, label: "Automotive & Industrial (8.5%)", gstRate: "28%" },
  "Sports & Fitness": { rate: 9.5, label: "Sports, Fitness & Outdoors (9.5%)", gstRate: "18%" },
};

// Standard International Tiered Closing Fees
export const CLOSING_FEE_TIERS = [
  { max: 250, fee: 5, label: "₹0 - ₹250" },
  { max: 500, fee: 10, label: "₹251 - ₹500" },
  { max: 1000, fee: 25, label: "₹501 - ₹1,000" },
  { max: Infinity, fee: 45, label: "> ₹1,000" },
];

// Logistics & Weight Handling Standard Slabs (500g base)
export const SHIPPING_RATES: Record<
  "FOC" | "EASY_SHIP" | "SELF_SHIP",
  {
    local: { base: number; extra: number };
    regional: { base: number; extra: number };
    national: { base: number; extra: number };
    pickAndPack: number;
  }
> = {
  FOC: {
    local: { base: 35, extra: 16 },
    regional: { base: 45, extra: 22 },
    national: { base: 65, extra: 30 },
    pickAndPack: 14,
  },
  EASY_SHIP: {
    local: { base: 40, extra: 18 },
    regional: { base: 52, extra: 24 },
    national: { base: 70, extra: 34 },
    pickAndPack: 0,
  },
  SELF_SHIP: {
    local: { base: 0, extra: 0 },
    regional: { base: 0, extra: 0 },
    national: { base: 0, extra: 0 },
    pickAndPack: 0,
  },
};

interface SellerFeeCalculatorProps {
  initialCategory?: string;
  initialPrice?: number;
  embedded?: boolean;
  onFeeCalculated?: (breakdown: FeeBreakdown) => void;
}

export const SellerFeeCalculator = ({
  initialCategory = "Fashion & Apparel",
  initialPrice = 1999,
  embedded = false,
  onFeeCalculated,
}: SellerFeeCalculatorProps) => {
  const [category, setCategory] = useState<string>(
    CATEGORY_FEE_RATES[initialCategory] ? initialCategory : "Fashion & Apparel"
  );
  const [sellingPrice, setSellingPrice] = useState<number>(initialPrice);
  const [cogs, setCogs] = useState<number>(Math.round(initialPrice * 0.45));
  const [fulfillment, setFulfillment] = useState<"FOC" | "EASY_SHIP" | "SELF_SHIP">("FOC");
  const [shippingZone, setShippingZone] = useState<"local" | "regional" | "national">("regional");
  const [weightGrams, setWeightGrams] = useState<number>(500);
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  // Dynamic fee calculation adhering strictly to International FinTech & GST Marketplace Standards
  const breakdown: FeeBreakdown = useMemo(() => {
    const price = Math.max(0, sellingPrice || 0);
    const categoryInfo = CATEGORY_FEE_RATES[category] || { rate: 8.0, label: category, gstRate: "18%" };
    const referralRate = categoryInfo.rate;

    // 1. Referral Commission
    const referralFee = Number(((price * referralRate) / 100).toFixed(2));

    // 2. Tiered Fixed Closing Fee
    let closingFee = 45;
    for (const tier of CLOSING_FEE_TIERS) {
      if (price <= tier.max) {
        closingFee = tier.fee;
        break;
      }
    }

    // 3. Logistics & Pick-and-Pack
    let shippingFee = 0;
    let pickAndPackFee = 0;
    if (fulfillment !== "SELF_SHIP") {
      const rates = SHIPPING_RATES[fulfillment][shippingZone];
      const extraHalfKgs = Math.max(0, Math.ceil((weightGrams - 500) / 500));
      shippingFee = rates.base + extraHalfKgs * rates.extra;
      pickAndPackFee = SHIPPING_RATES[fulfillment].pickAndPack;
    }

    // 4. Subtotal Platform Services
    const totalMarketplaceCharges = Number((referralFee + closingFee + shippingFee + pickAndPackFee).toFixed(2));

    // 5. Statutory 18% GST strictly on Marketplace Platform Services
    const gstOnFees = Number((totalMarketplaceCharges * 0.18).toFixed(2));

    // 6. Statutory 1% TCS (Section 52 CGST Act - with-held and credited to merchant cash ledger)
    const tcsFee = Number((price * 0.01).toFixed(2));

    // 7. Total Deductions
    const totalDeductions = Number((totalMarketplaceCharges + gstOnFees + tcsFee).toFixed(2));

    // 8. Net Settlement Payout
    const netPayout = Math.max(0, Number((price - totalDeductions).toFixed(2)));

    // 9. Real Net Profit & Margins
    const effectiveCogs = Math.max(0, cogs || 0);
    const netProfit = Number((netPayout - effectiveCogs).toFixed(2));
    const profitMargin = price > 0 ? Number(((netProfit / price) * 100).toFixed(1)) : 0;
    const roi = effectiveCogs > 0 ? Number(((netProfit / effectiveCogs) * 100).toFixed(1)) : 0;

    const res: FeeBreakdown = {
      sellingPrice: price,
      referralRate,
      referralFee,
      closingFee,
      shippingFee,
      pickAndPackFee,
      totalMarketplaceCharges,
      gstOnFees,
      tcsFee,
      totalDeductions,
      netPayout,
      cogs: effectiveCogs,
      netProfit,
      profitMargin,
      roi,
    };

    if (onFeeCalculated) {
      onFeeCalculated(res);
    }

    return res;
  }, [category, sellingPrice, cogs, fulfillment, shippingZone, weightGrams, onFeeCalculated]);

  const pricePresets = [499, 999, 1999, 4999, 9999];

  // Visual Waterfall Percentages for progress split
  const payoutPct = breakdown.sellingPrice > 0 ? (breakdown.netPayout / breakdown.sellingPrice) * 100 : 0;
  const referralPct = breakdown.sellingPrice > 0 ? (breakdown.referralFee / breakdown.sellingPrice) * 100 : 0;
  const closingPct = breakdown.sellingPrice > 0 ? (breakdown.closingFee / breakdown.sellingPrice) * 100 : 0;
  const shippingPct = breakdown.sellingPrice > 0 ? ((breakdown.shippingFee + breakdown.pickAndPackFee) / breakdown.sellingPrice) * 100 : 0;
  const taxPct = breakdown.sellingPrice > 0 ? ((breakdown.gstOnFees + breakdown.tcsFee) / breakdown.sellingPrice) * 100 : 0;

  return (
    <div
      className={`rounded-3xl border border-slate-200/90 bg-white ${
        embedded ? "p-4 sm:p-7 shadow-xs" : "p-6 sm:p-8 shadow-xl"
      } select-none transition-all`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-xs shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">
                Merchant Fee & Settlement Simulator
              </h3>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700">
                FinTech Grade
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live algorithmic breakdown based on Category Commission, Tiered Closing, Logistics, and 18% GST.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
          >
            <Info className="w-3.5 h-3.5 text-violet-600" />
            <span>Formula Guide</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSellingPrice(1999);
              setCogs(899);
              setCategory("Fashion & Apparel");
              setFulfillment("FOC");
              setShippingZone("regional");
              setWeightGrams(500);
            }}
            title="Reset to default benchmark"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition border border-slate-200"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Formula Explainer Banner (Expandable) */}
      {showFormulaModal && (
        <div className="mt-4 p-4 rounded-2xl bg-violet-50/70 border border-violet-200 text-xs text-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-extrabold text-violet-900 block mb-1 text-sm">
                Standard International Marketplace Settlement Formula:
              </span>
              <p className="font-mono text-xs text-violet-800 bg-white/80 p-2.5 rounded-xl border border-violet-100 mb-2">
                Net Take-Home Payout = Selling Price - [Referral Commission + Tiered Closing + Shipping + 18% GST on Services + 1% TCS]
              </p>
              <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
                <li>
                  <strong>18% GST:</strong> Levied strictly on marketplace service fees, never on your product value.
                </li>
                <li>
                  <strong>1% TCS (CGST Sec 52):</strong> Withheld for government compliance and credited 100% to your GSTR-2B cash ledger.
                </li>
                <li>
                  <strong>Net Profit:</strong> Take-Home Bank Payout minus your wholesale production cost (COGS).
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowFormulaModal(false)}
              className="text-violet-500 hover:text-violet-800 font-bold p-1 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Controls (Left) & Output Cards (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pt-6 items-start">
        
        {/* Left Column: Configurable Parameters (7 Cols on xl) */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* 1. Listing Selling Price */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                Listing Selling Price (INR)
                <span className="text-rose-500">*</span>
              </label>

              {/* Responsive Quick Preset Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Presets:</span>
                {pricePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setSellingPrice(preset);
                      setCogs(Math.round(preset * 0.45));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      sellingPrice === preset
                        ? "bg-violet-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    ₹{preset.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative rounded-2xl shadow-xs mt-3">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-black text-lg">
                ₹
              </div>
              <input
                type="number"
                min="1"
                step="10"
                value={sellingPrice || ""}
                onChange={(e) => setSellingPrice(Math.max(0, Number(e.target.value)))}
                placeholder="e.g. 1999"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 font-black text-lg sm:text-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 pl-1">
              Total price charged to the buyer, including product GST.
            </p>
          </div>

          {/* 2. Product Category Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Product Category & Commission Tier
              </label>
              <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                {CATEGORY_FEE_RATES[category]?.rate || 8}% Fee
              </span>
            </div>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 font-bold text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none cursor-pointer transition shadow-2xs"
              >
                {Object.entries(CATEGORY_FEE_RATES).map(([catKey, catVal]) => (
                  <option key={catKey} value={catKey}>
                    {catVal.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Fulfillment Channel Selection */}
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 block mb-2">
              Fulfillment Channel
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "FOC",
                  name: "FOC (Prime)",
                  badge: "Highest Sales",
                  sub: "Office Connect Warehouse",
                  tagColor: "bg-emerald-100 text-emerald-800",
                },
                {
                  id: "EASY_SHIP",
                  name: "Easy Ship",
                  badge: "Doorstep Pickup",
                  sub: "Courier at your facility",
                  tagColor: "bg-blue-100 text-blue-800",
                },
                {
                  id: "SELF_SHIP",
                  name: "Self Ship",
                  badge: "Zero Platform Fee",
                  sub: "Your own couriers",
                  tagColor: "bg-amber-100 text-amber-800",
                },
              ].map((m) => {
                const isSelected = fulfillment === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFulfillment(m.id as any)}
                    className={`p-3.5 rounded-2xl text-left border transition flex flex-col justify-between ${
                      isSelected
                        ? "border-violet-600 bg-violet-50/70 shadow-xs ring-2 ring-violet-500/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-slate-900">{m.name}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${m.tagColor}`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{m.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Delivery Zone & Package Weight (Disabled if Self-Ship) */}
          {fulfillment !== "SELF_SHIP" ? (
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Delivery Destination Zone
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "local", label: "Local" },
                      { id: "regional", label: "Regional" },
                      { id: "national", label: "National" },
                    ].map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => setShippingZone(z.id as any)}
                        className={`py-2 rounded-xl text-xs font-bold transition text-center ${
                          shippingZone === z.id
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {z.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                      Dead Weight / Volumetric
                    </label>
                    <span className="text-xs font-mono font-bold text-violet-700">
                      {weightGrams < 1000 ? `${weightGrams}g` : `${(weightGrams / 1000).toFixed(1)}kg`}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={weightGrams}
                      onChange={(e) => setWeightGrams(Math.max(100, Number(e.target.value)))}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-violet-500 outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                      Grams
                    </span>
                  </div>
                </div>
              </div>

              {fulfillment === "FOC" && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <Package className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                  <span>Includes automatic inspection, barcode tagging, and pick & pack handling.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
              <Building2 className="w-4 h-4 shrink-0 text-amber-700" />
              <span>
                <strong>Self-Ship Enabled:</strong> Office Connect charges ₹0 logistics fee. You fulfill orders directly via your approved 3PL partner (Blue Dart, Delhivery, etc.).
              </span>
            </div>
          )}

          {/* 5. Merchant Cost of Goods Sold (COGS) */}
          <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 block">
                  Product Manufacturing / Purchase Cost (COGS)
                </label>
                <span className="text-[11px] text-slate-500">
                  Your direct cost to manufacture or acquire this item
                </span>
              </div>
              <span className="text-xs font-bold text-slate-500">Optional</span>
            </div>
            <div className="relative mt-2">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                ₹
              </div>
              <input
                type="number"
                min="0"
                step="50"
                value={cogs || ""}
                onChange={(e) => setCogs(Math.max(0, Number(e.target.value)))}
                placeholder="e.g. 899"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-sm focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Executive Payout & Settlement Receipt (5 Cols on xl) */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          
          {/* Top Hero Payout Card (Executive FinTech Design) */}
          <div className="rounded-3xl bg-slate-900 text-white p-6 shadow-xl border border-slate-800 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-violet-300">
                  Net Take-Home Bank Payout
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <TrendingUp className="w-3 h-3" />
                  {payoutPct.toFixed(1)}% of sale
                </span>
              </div>

              {/* Main Payout Amount */}
              <div className="flex items-baseline gap-1 mt-1 mb-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                  ₹{Math.round(breakdown.netPayout).toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  .{(breakdown.netPayout % 1).toFixed(2).substring(2)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Credited to your verified escrow bank account every 7 days.</span>
              </div>

              {/* Profit & Margin Highlights */}
              {breakdown.cogs > 0 && (
                <div className="mt-5 p-3.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Estimated Net Profit:</span>
                    <span className={`font-mono font-black text-sm ${breakdown.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      ₹{Math.round(breakdown.netProfit).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/10">
                    <span>Operating Margin: <strong className="text-white">{breakdown.profitMargin}%</strong></span>
                    <span>Return on Investment: <strong className="text-white">{breakdown.roi}%</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visual Revenue Split Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              <span>Revenue Distribution Split</span>
              <span className="text-emerald-700 font-bold">{payoutPct.toFixed(0)}% to You</span>
            </div>
            {/* Split Bar */}
            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${Math.max(5, payoutPct)}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
                title={`Your Payout: ${payoutPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${Math.max(2, referralPct)}%` }}
                className="bg-violet-600 h-full transition-all duration-300"
                title={`Referral: ${referralPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${Math.max(1, closingPct)}%` }}
                className="bg-blue-500 h-full transition-all duration-300"
                title={`Closing: ${closingPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${Math.max(1, shippingPct)}%` }}
                className="bg-amber-500 h-full transition-all duration-300"
                title={`Logistics: ${shippingPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${Math.max(1, taxPct)}%` }}
                className="bg-rose-500 h-full transition-all duration-300"
                title={`Taxes: ${taxPct.toFixed(1)}%`}
              />
            </div>
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-600 mt-2 gap-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Payout</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-600" /> Referral</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Closing</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Shipping</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> GST / TCS</span>
            </div>
          </div>

          {/* Itemized Settlement Receipt Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Itemized Settlement Statement
              </span>
              <span className="text-[10px] font-bold text-slate-400">1 Unit Sold</span>
            </div>

            {/* Line Items */}
            <div className="space-y-2 text-xs">
              {/* Gross Price */}
              <div className="flex items-center justify-between text-slate-900 font-extrabold pb-1">
                <span>Customer Gross Selling Price</span>
                <span className="font-mono text-sm">₹{breakdown.sellingPrice.toFixed(2)}</span>
              </div>

              {/* Referral Fee */}
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-violet-600" />
                  Referral Commission ({breakdown.referralRate}%)
                </span>
                <span className="font-mono font-bold text-rose-600">-₹{breakdown.referralFee.toFixed(2)}</span>
              </div>

              {/* Tiered Closing Fee */}
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Fixed Closing Fee (Tier: {breakdown.sellingPrice > 1000 ? ">₹1k" : "Slab"})
                </span>
                <span className="font-mono font-bold text-rose-600">-₹{breakdown.closingFee.toFixed(2)}</span>
              </div>

              {/* Logistics */}
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  Logistics & Handling ({fulfillment})
                </span>
                <span className="font-mono font-bold text-rose-600">
                  {breakdown.shippingFee + breakdown.pickAndPackFee > 0
                    ? `-₹${(breakdown.shippingFee + breakdown.pickAndPackFee).toFixed(2)}`
                    : "₹0.00 (Self Ship)"}
                </span>
              </div>

              {/* Services Subtotal */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[11px]">
                <span>Marketplace Services Subtotal</span>
                <span className="font-mono font-bold">₹{breakdown.totalMarketplaceCharges.toFixed(2)}</span>
              </div>

              {/* 18% GST */}
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                  18% GST on Marketplace Services
                </span>
                <span className="font-mono font-bold text-rose-600">-₹{breakdown.gstOnFees.toFixed(2)}</span>
              </div>

              {/* 1% Statutory TCS */}
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1" title="Claimed back in your monthly GST Return (GSTR-2B)">
                  1% TCS Withheld (CGST Sec 52)
                </span>
                <span className="font-mono font-bold text-rose-600">-₹{breakdown.tcsFee.toFixed(2)}</span>
              </div>

              {/* Total Deductions Bar */}
              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between font-extrabold text-xs text-rose-700">
                <span>Total Deductions & Withholding</span>
                <span className="font-mono text-sm">-₹{breakdown.totalDeductions.toFixed(2)}</span>
              </div>

              {/* Net Payout Final */}
              <div className="pt-2 border-t-2 border-slate-900 flex items-center justify-between font-black text-sm text-slate-900 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-emerald-900">Net Bank Settlement:</span>
                <span className="font-mono text-base text-emerald-700">₹{breakdown.netPayout.toFixed(2)}</span>
              </div>
            </div>

            {/* GST Cash Ledger Note */}
            <p className="text-[10px] text-slate-400 pt-1 leading-relaxed">
              * The 1% TCS (₹{breakdown.tcsFee.toFixed(2)}) is credited directly to your Electronic Cash Ledger on the GST Portal each month and can be used to pay your business taxes.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SellerFeeCalculator;
