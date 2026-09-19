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
  Package,
  ArrowRight,
  Layers,
  Sparkles,
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
  "Fashion & Apparel": { rate: 13.5, label: "Fashion & Apparel (13.5%)", gstRate: "12%" },
  "Electronics & Appliances": { rate: 7.0, label: "Electronics & Large Appliances (7.0%)", gstRate: "18%" },
  "Computers & Accessories": { rate: 6.0, label: "Computers & Peripherals (6.0%)", gstRate: "18%" },
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
  const [showFormulaGuide, setShowFormulaGuide] = useState<boolean>(false);

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
    <div className="w-full space-y-6 select-none">
      
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-200 shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                Merchant Payout & Profit Simulator
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-800">
                Global Standard
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Transparent international fee breakdown (Referral, Tiered Closing, Logistics, 18% GST & 1% TCS).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setShowFormulaGuide(!showFormulaGuide)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition"
          >
            <Info className="w-3.5 h-3.5 text-violet-600" />
            <span>Formula Explainer</span>
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
            className="p-2 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition border border-slate-200 shadow-2xs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Formula Explainer (Expandable) */}
      {showFormulaGuide && (
        <div className="p-5 rounded-2xl bg-violet-50/80 border border-violet-200 text-xs text-slate-700 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <span className="font-extrabold text-violet-950 block text-sm">
                Standard International Marketplace Settlement Formula:
              </span>
              <div className="p-3 rounded-xl bg-white border border-violet-200 font-mono text-xs text-violet-900 font-bold overflow-x-auto">
                Net Bank Settlement = Selling Price - [Referral Fee + Closing Fee + Logistics + 18% GST on Services + 1% Statutory TCS]
              </div>
              <p className="text-[11px] text-slate-600">
                • <strong>18% GST</strong> is levied strictly on marketplace service fees, never on your product value.<br />
                • <strong>1% TCS (CGST Sec 52)</strong> is credited directly to your Electronic Cash Ledger on the GST Portal each month.<br />
                • <strong>Net Profit</strong> = Net Bank Settlement minus your wholesale manufacturing/purchase cost (COGS).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFormulaGuide(false)}
              className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: Configurable Pricing & Channel Inputs (Spacious, Clean Full-Width) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        
        {/* Row 1: Selling Price & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Selling Price Input + Preset Chips */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span>Listing Selling Price (INR) <span className="text-rose-500">*</span></span>
              <span className="text-[11px] text-slate-400 font-normal lowercase">inclusive of gst</span>
            </label>

            <div className="relative rounded-2xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-black text-xl">
                ₹
              </div>
              <input
                type="number"
                min="1"
                step="10"
                value={sellingPrice || ""}
                onChange={(e) => setSellingPrice(Math.max(0, Number(e.target.value)))}
                placeholder="e.g. 1999"
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-300 bg-white text-slate-900 font-black text-xl sm:text-2xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition"
              />
            </div>

            {/* Price Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Quick Presets:</span>
              {pricePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSellingPrice(preset);
                    setCogs(Math.round(preset * 0.45));
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    sellingPrice === preset
                      ? "bg-violet-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  ₹{preset.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>

          {/* Product Category Dropdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Product Category
              </label>
              <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-200">
                {CATEGORY_FEE_RATES[category]?.rate || 8}% Commission
              </span>
            </div>

            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3.5 rounded-2xl border border-slate-300 bg-white text-slate-900 font-bold text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none cursor-pointer transition shadow-2xs"
              >
                {Object.entries(CATEGORY_FEE_RATES).map(([catKey, catVal]) => (
                  <option key={catKey} value={catKey}>
                    {catVal.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <p className="text-[11px] text-slate-500 pl-1">
              Standard marketplace referral rate applied strictly to customer selling price.
            </p>
          </div>

        </div>

        {/* Row 2: Fulfillment Channel Selector */}
        <div className="pt-2 border-t border-slate-100">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 block mb-3">
            Fulfillment Channel
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[
              {
                id: "FOC",
                name: "FOC (Prime)",
                badge: "Recommended",
                tagColor: "bg-emerald-100 text-emerald-800",
                desc: "Office Connect Fulfillment Center stores, packs & delivers with 1-2 day Prime badges.",
              },
              {
                id: "EASY_SHIP",
                name: "Easy Ship",
                badge: "Doorstep Pickup",
                tagColor: "bg-blue-100 text-blue-800",
                desc: "Keep goods in your warehouse. Marketplace courier partner picks up & delivers to buyer.",
              },
              {
                id: "SELF_SHIP",
                name: "Self Ship",
                badge: "Zero Platform Fee",
                tagColor: "bg-amber-100 text-amber-800",
                desc: "You pack and ship directly using your third-party logistics (Blue Dart, Delhivery, etc.).",
              },
            ].map((m) => {
              const isSelected = fulfillment === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFulfillment(m.id as any)}
                  className={`p-4 rounded-2xl text-left border transition flex flex-col justify-between ${
                    isSelected
                      ? "border-violet-600 bg-violet-50/70 ring-2 ring-violet-500/30 shadow-xs"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-extrabold text-sm text-slate-900">{m.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.tagColor}`}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Destination Zone, Weight & Merchant COGS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
          
          {/* Shipping Zone & Weight (If Not Self-Ship) */}
          {fulfillment !== "SELF_SHIP" ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Delivery Destination
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "local", label: "Local (City)" },
                    { id: "regional", label: "Regional (State)" },
                    { id: "national", label: "National" },
                  ].map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setShippingZone(z.id as any)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center ${
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Product Package Weight
                  </label>
                  <span className="text-xs font-mono font-bold text-violet-700">
                    {weightGrams < 1000 ? `${weightGrams}g` : `${(weightGrams / 1000).toFixed(1)} kg`}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(Math.max(100, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-violet-500 outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    Grams
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
              <Building2 className="w-6 h-6 text-amber-600 shrink-0" />
              <span>
                <strong>Self-Ship Enabled:</strong> Office Connect charges ₹0 logistics fee. You dispatch packages using your own courier contract.
              </span>
            </div>
          )}

          {/* Product COGS (Wholesale Cost) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Product Cost of Goods (COGS)
              </label>
              <span className="text-xs font-bold text-slate-400">Optional</span>
            </div>
            <p className="text-xs text-slate-500">
              Enter your wholesale purchase or manufacturing cost to see true net profit and margin:
            </p>
            <div className="relative mt-1">
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

      </div>

      {/* SECTION 2: Executive Settlement Highlight Banner (Clean, Modern, Uncompressed) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Payout Figure */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
                Net Take-Home Bank Payout
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <TrendingUp className="w-3.5 h-3.5" />
                {payoutPct.toFixed(1)}% of sale
              </span>
            </div>

            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                ₹{Math.round(breakdown.netPayout).toLocaleString("en-IN")}
              </span>
              <span className="text-sm text-slate-400">
                .{(breakdown.netPayout % 1).toFixed(2).substring(2)}
              </span>
            </div>

            <p className="text-xs text-slate-300 flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Transferred directly to your verified escrow bank account every 7 days.</span>
            </p>
          </div>

          {/* Profit & Margin Indicators */}
          {breakdown.cogs > 0 && (
            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md min-w-[240px] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Estimated Net Profit:</span>
                <span className={`font-mono font-black text-base ${breakdown.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  ₹{Math.round(breakdown.netProfit).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 pt-1.5 border-t border-white/10">
                <span>Net Margin: <strong className="text-white font-mono">{breakdown.profitMargin}%</strong></span>
                <span>ROI: <strong className="text-white font-mono">{breakdown.roi}%</strong></span>
              </div>
            </div>
          )}

        </div>

        {/* Horizontal Distribution Split Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
            <span>Revenue Split:</span>
            <span className="text-emerald-400">{payoutPct.toFixed(0)}% to Your Bank Account</span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${Math.max(5, payoutPct)}%` }}
              className="bg-emerald-500 h-full transition-all duration-300"
              title={`Net Bank Settlement: ${payoutPct.toFixed(1)}%`}
            />
            <div
              style={{ width: `${Math.max(2, referralPct)}%` }}
              className="bg-violet-500 h-full transition-all duration-300"
              title={`Referral Commission: ${referralPct.toFixed(1)}%`}
            />
            <div
              style={{ width: `${Math.max(1, closingPct)}%` }}
              className="bg-blue-500 h-full transition-all duration-300"
              title={`Closing Fee: ${closingPct.toFixed(1)}%`}
            />
            <div
              style={{ width: `${Math.max(1, shippingPct)}%` }}
              className="bg-amber-500 h-full transition-all duration-300"
              title={`Logistics: ${shippingPct.toFixed(1)}%`}
            />
            <div
              style={{ width: `${Math.max(1, taxPct)}%` }}
              className="bg-rose-500 h-full transition-all duration-300"
              title={`GST & TCS: ${taxPct.toFixed(1)}%`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300 pt-1">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Bank Payout ({payoutPct.toFixed(0)}%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Referral Fee ({referralPct.toFixed(1)}%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Closing Fee ({closingPct.toFixed(1)}%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Logistics ({shippingPct.toFixed(1)}%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 18% GST + 1% TCS ({taxPct.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: Itemized Settlement Remittance Statement (Spacious Full-Width Table) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Itemized Settlement Remittance Statement
            </h4>
            <p className="text-xs text-slate-500">
              Audit-ready invoice line items for a single unit sold at ₹{breakdown.sellingPrice.toLocaleString("en-IN")}.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            Per Unit Calculation
          </span>
        </div>

        {/* Clean Line Items */}
        <div className="divide-y divide-slate-100 text-xs sm:text-sm">
          
          {/* Gross Price */}
          <div className="py-3 flex items-center justify-between font-extrabold text-slate-900">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              Customer Gross Selling Price
            </span>
            <span className="font-mono text-sm sm:text-base">+ ₹{breakdown.sellingPrice.toFixed(2)}</span>
          </div>

          {/* Referral Fee */}
          <div className="py-3 flex items-center justify-between text-slate-700">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-violet-600 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900">Referral Commission</span>
                <span className="text-xs text-slate-500 block">Category: {category} ({breakdown.referralRate}%)</span>
              </div>
            </div>
            <span className="font-mono font-bold text-rose-600">- ₹{breakdown.referralFee.toFixed(2)}</span>
          </div>

          {/* Closing Fee */}
          <div className="py-3 flex items-center justify-between text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900">Fixed Closing Fee</span>
                <span className="text-xs text-slate-500 block">Tier: {breakdown.sellingPrice > 1000 ? "Above ₹1,000" : "Standard Slab"}</span>
              </div>
            </div>
            <span className="font-mono font-bold text-rose-600">- ₹{breakdown.closingFee.toFixed(2)}</span>
          </div>

          {/* Logistics & Handling */}
          <div className="py-3 flex items-center justify-between text-slate-700">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900">Logistics & Handling Fee</span>
                <span className="text-xs text-slate-500 block">
                  {fulfillment === "SELF_SHIP"
                    ? "Merchant Self-Ship (Zero Platform Fee)"
                    : `${fulfillment} • ${shippingZone.toUpperCase()} • ${weightGrams}g`}
                </span>
              </div>
            </div>
            <span className="font-mono font-bold text-rose-600">
              {breakdown.shippingFee + breakdown.pickAndPackFee > 0
                ? `- ₹${(breakdown.shippingFee + breakdown.pickAndPackFee).toFixed(2)}`
                : "₹0.00"}
            </span>
          </div>

          {/* Subtotal of Marketplace Services */}
          <div className="py-2.5 bg-slate-50/70 px-3 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Marketplace Services Subtotal</span>
            <span className="font-mono">₹{breakdown.totalMarketplaceCharges.toFixed(2)}</span>
          </div>

          {/* 18% GST on Services */}
          <div className="py-3 flex items-center justify-between text-slate-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900">18% GST on Marketplace Services</span>
                <span className="text-xs text-slate-500 block">18% levied strictly on platform charges (₹{breakdown.totalMarketplaceCharges.toFixed(2)})</span>
              </div>
            </div>
            <span className="font-mono font-bold text-rose-600">- ₹{breakdown.gstOnFees.toFixed(2)}</span>
          </div>

          {/* 1% TCS */}
          <div className="py-3 flex items-center justify-between text-slate-700">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900">1% Statutory TCS (CGST Sec 52)</span>
                <span className="text-xs text-slate-500 block">Credited 100% to your GST Portal Cash Ledger</span>
              </div>
            </div>
            <span className="font-mono font-bold text-rose-600">- ₹{breakdown.tcsFee.toFixed(2)}</span>
          </div>

          {/* Total Deductions Bar */}
          <div className="py-3 flex items-center justify-between font-black text-rose-700">
            <span>Total Deductions & Tax Withholdings</span>
            <span className="font-mono text-base">- ₹{breakdown.totalDeductions.toFixed(2)}</span>
          </div>

          {/* Net Settlement Row */}
          <div className="pt-4 pb-2">
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between">
              <div>
                <span className="font-black text-emerald-950 text-sm sm:text-base block">
                  Net Bank Settlement Amount
                </span>
                <span className="text-xs text-emerald-700">
                  Exact amount deposited into your verified bank account
                </span>
              </div>
              <span className="font-mono font-black text-xl sm:text-2xl text-emerald-800">
                ₹{breakdown.netPayout.toFixed(2)}
              </span>
            </div>
          </div>

        </div>

        {/* GST Portal Cash Ledger Explainer Note */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 leading-relaxed">
          💡 <strong>Merchant Tax Note:</strong> The 1% TCS (₹{breakdown.tcsFee.toFixed(2)}) deducted under Section 52 of the CGST Act is filed on Form GSTR-8 and credited directly to your Electronic Cash Ledger on <span className="font-semibold text-slate-700">gst.gov.in</span>. You can use this credit to offset any output tax liability in your monthly GSTR-3B filings.
        </div>

      </div>

    </div>
  );
};

export default SellerFeeCalculator;
