import { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  TrendingUp,
  Truck,
  Building2,
  Coins,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Store,
  Layers,
  Sparkles,
  Users,
  Clock,
  ExternalLink,
  ChevronRight,
  BadgeCheck,
  Package,
} from "lucide-react";
import { SellerFeeCalculator } from "@/components/seller-portal/SellerFeeCalculator";

export const metadata: Metadata = {
  title: "Office Connect Seller Central | Register & Sell Across India",
  description:
    "Join Office Connect Marketplace. Zero fixed monthly subscription, 7-day regular escrow bank settlements, pan-India logistics, and 12-step guided Indian merchant verification.",
};

export default function SellerCentralPage() {
  const prerequisites = [
    {
      title: "Active GSTIN (Form REG-06)",
      desc: "Mandatory 15-digit GSTIN for inter-state commerce (Exemptions apply for 100% tax-free goods).",
      tag: "Statutory",
    },
    {
      title: "PAN Card",
      desc: "Company PAN for private/public limited & LLPs, or personal PAN for sole proprietors.",
      tag: "Identity",
    },
    {
      title: "Active Bank Account & Cancelled Cheque",
      desc: "Current or savings account matching PAN holder name for 7-day escrow IMPS/NEFT payouts.",
      tag: "Financial",
    },
    {
      title: "Government Photo ID & Address Proof",
      desc: "Aadhaar Card, Passport, or Voter ID of authorized signatory for live Video KYC clearance.",
      tag: "KYC",
    },
    {
      title: "Dispatch Warehouse Address & PIN Code",
      desc: "Registered physical pickup facility located within serviceable courier zones.",
      tag: "Logistics",
    },
    {
      title: "Business Registration Proof",
      desc: "Certificate of Incorporation, LLP Agreement, or Udyam MSME Registration Certificate.",
      tag: "Corporate",
    },
  ];

  const stepsOverview = [
    { num: 1, name: "Account & Mobile OTP", desc: "Sign up with business email and verify +91 phone via instant SMS OTP." },
    { num: 2, name: "Business Legal Entity", desc: "Select Sole Proprietorship, LLP, or Pvt Ltd with Solutions agreement." },
    { num: 3, name: "GSTIN & PAN Check", desc: "Format validation, automated state extraction, and REG-06 document upload." },
    { num: 4, name: "Store Identity & Catalog", desc: "Claim your unique /store/[slug] URL and select merchandise categories." },
    { num: 5, name: "Pickup Warehouse Setup", desc: "Specify dispatch PIN code, city, and primary warehouse contact." },
    { num: 6, name: "Escrow Bank & Penny-Drop", desc: "Verify bank IFSC with automated ₹1.00 IMPS test deposit." },
    { num: 7, name: "Tax, HSN & Invoicing", desc: "Set default GST tiers (5% to 28%), TCS compliance, and digital signature." },
    { num: 8, name: "Identity & Video KYC", desc: "Upload Aadhaar/Passport proof, facial snapshot, and book live KYC slot." },
    { num: 9, name: "Fulfillment Model", desc: "Select Fulfillment by Office Connect (FOC), Easy Ship, or Self Ship." },
    { num: 10, name: "Fee & Margin Simulator", desc: "Preview exact category referral rates, closing fees, and net settlement." },
    { num: 11, name: "Fast-Track Listing", desc: "Optionally publish your first SKU so products go live immediately upon approval." },
    { num: 12, name: "Pre-Launch Audit", desc: "Review complete 12-point KYB summary and submit for verification queue." },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 select-none">
      {/* Top Brand & Utility Header */}
      <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/storefront" className="flex items-center gap-2 group">
              <img src="/officeconnectlogo.png" alt="Office Connect" className="h-8 w-auto object-contain brightness-0 invert" />
              <span className="hidden sm:inline px-2.5 py-0.5 rounded-full bg-violet-900/60 border border-violet-500/40 text-violet-300 text-[10px] font-black uppercase tracking-wider">
                Seller Central
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/storefront" className="text-slate-300 hover:text-white transition font-medium hidden sm:inline">
              ← Storefront Catalog
            </Link>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <Link
              href="/vendor-dashboard"
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition"
            >
              Seller Sign In
            </Link>
            <Link
              href="/seller-central/onboarding"
              className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-black transition shadow-sm"
            >
              Register as Seller
            </Link>
          </div>
        </div>
      </header>

      {/* 1. HIGH-IMPACT HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-900/60 border border-violet-500/30 text-violet-300 text-xs font-bold tracking-wide uppercase shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Office Connect Indian Merchant Central
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
            Launch Your Brand Across India. <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Zero Monthly Fixed Fees.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Sell to millions of enterprise and retail shoppers across 19,000+ Indian PIN codes. Enjoy predictable 7-day regular escrow settlements, pan-India logistics, and automated GST compliance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/seller-central/onboarding"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-sm sm:text-base transition shadow-xl hover:shadow-violet-500/25 flex items-center justify-center gap-2 group"
            >
              Start 12-Step Merchant Onboarding
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#fee-calculator"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 backdrop-blur-xs"
            >
              <Calculator className="w-4 h-4 text-violet-300" />
              Simulate Payout & Margins
            </a>
          </div>

          {/* Value Prop Badges */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            {[
              { label: "Fixed Monthly Fee", val: "₹0 Forever", sub: "No listing or subscription charges" },
              { label: "Bank Payout Cycle", val: "7-Day Escrow", sub: "Regular direct IMPS/NEFT deposits" },
              { label: "Logistics Reach", val: "19,000+ PINs", sub: "Pan-India courier network" },
              { label: "Tax Compliance", val: "1% TCS & GSTR-8", sub: "Automated GST portal credit" },
            ].map((prop, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1"
              >
                <span className="text-[11px] font-bold text-slate-400 block">{prop.label}</span>
                <span className="text-xl font-black text-white block">{prop.val}</span>
                <span className="text-[10px] text-slate-400 block">{prop.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. DOCUMENT READINESS CHECKLIST */}
      <section className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
            Document Readiness Checklist
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            What You Need Before Registering
          </h2>
          <p className="text-slate-600 text-sm">
            Keep these 6 official Indian business documents ready to finish the 12-step verification in under 10 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prerequisites.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-7 h-7 rounded-full bg-violet-50 text-violet-700 font-extrabold text-xs flex items-center justify-center">
                    0{idx + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                    {item.tag}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Accepted in Digital PDF / Image format</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 12-STEP PROCESS OVERVIEW */}
      <section className="bg-white border-y border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-800 text-xs font-bold border border-violet-200 mb-2">
                <Layers className="w-3.5 h-3.5 text-violet-600" />
                Structured Launch Roadmap
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                The 12-Step Indian Merchant Verification Process
              </h2>
              <p className="text-slate-600 text-sm max-w-xl mt-1">
                Designed to be 100% compliant with Indian e-commerce consumer protection laws, GST rules, and banking mandates.
              </p>
            </div>

            <Link
              href="/seller-central/onboarding"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition shrink-0"
            >
              Start Step 1 Now
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stepsOverview.map((st) => (
              <div
                key={st.num}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-violet-300 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                    Step {st.num}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">Phase {Math.ceil(st.num / 4)}</span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 mb-1 group-hover:text-violet-700 transition-colors">
                  {st.name}
                </h4>
                <p className="text-[11px] text-slate-500 leading-snug">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FULFILLMENT CHANNEL COMPARISON */}
      <section className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            Logistics & Shipping Models
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Compare Fulfillment Channels Side-by-Side
          </h2>
          <p className="text-slate-600 text-sm">
            Choose the fulfillment approach that best matches your operating scale and margins.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FOC */}
          <div className="rounded-2xl border-2 border-violet-500 bg-white p-6 shadow-md relative flex flex-col justify-between">
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-0.5 rounded-full bg-violet-600 text-white font-black text-[10px] uppercase">
                Recommended
              </span>
            </div>

            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center mb-4">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="font-black text-lg text-slate-900 mb-1">
                Fulfillment by Office Connect (FOC)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Store inventory in Office Connect fulfillment hubs. We handle warehousing, pick-pack-ship, and customer returns.
              </p>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Delivery Speed:</span>
                  <span className="font-extrabold text-emerald-600">1-Day / 2-Day Prime</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Inventory Storage:</span>
                  <span className="font-bold text-slate-800">Office Connect Warehouses</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Packaging:</span>
                  <span className="font-bold text-slate-800">Provided by Platform</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Customer Support:</span>
                  <span className="font-bold text-slate-800">24/7 Managed for You</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                href="/seller-central/onboarding"
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition block text-center shadow-xs"
              >
                Select FOC in Onboarding
              </Link>
            </div>
          </div>

          {/* Easy Ship */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-black text-lg text-slate-900 mb-1">
                Office Connect Easy Ship
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Store inventory in your own warehouse. When orders arrive, you pack; our logistics partner collects from your doorstep.
              </p>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Delivery Speed:</span>
                  <span className="font-extrabold text-slate-800">3-5 Days Standard</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Inventory Storage:</span>
                  <span className="font-bold text-slate-800">Merchant Warehouse</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Pickup:</span>
                  <span className="font-bold text-slate-800">Scheduled Daily at Doorstep</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Courier Tracking:</span>
                  <span className="font-bold text-slate-800">Automated AWB Integration</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                href="/seller-central/onboarding"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition block text-center"
              >
                Select Easy Ship
              </Link>
            </div>
          </div>

          {/* Self Ship */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-black text-lg text-slate-900 mb-1">
                Merchant Self Ship
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Handle storage, packaging, and dispatch end-to-end through your own contracted logistics carriers.
              </p>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Delivery Speed:</span>
                  <span className="font-extrabold text-slate-800">Custom Merchant SLA</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Logistics Fee:</span>
                  <span className="font-bold text-emerald-700">₹0 Marketplace Shipping</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Dispatch SLA:</span>
                  <span className="font-bold text-slate-800">24-48 Hours</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Courier Freedom:</span>
                  <span className="font-bold text-slate-800">Any Pan-India Courier</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                href="/seller-central/onboarding"
                className="w-full py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-extrabold text-xs transition block text-center"
              >
                Select Self Ship
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EMBEDDED REAL-TIME FEE & MARGIN CALCULATOR */}
      <section id="fee-calculator" className="bg-slate-100/70 border-y border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-900 text-xs font-bold border border-violet-200">
              <Calculator className="w-3.5 h-3.5 text-violet-600" />
              100% Transparent Fee Calculator
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Know Exactly What You Earn Per Sale
            </h2>
            <p className="text-slate-600 text-sm">
              Adjust your product category, price, and weight below to preview itemized referral fees, closing fees, logistics deductions, and net bank settlement.
            </p>
          </div>

          <SellerFeeCalculator initialCategory="Computers & Accessories" initialPrice={2499} />
        </div>
      </section>

      {/* 6. CALL TO ACTION FOOTER */}
      <section className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white shadow-xl space-y-6">
          <span className="px-3 py-1 bg-violet-800/80 border border-violet-400/30 text-violet-200 text-xs font-bold uppercase tracking-wider rounded-full">
            Fast-Track Verification
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto">
            Ready to Start Selling on Office Connect?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Take 10 minutes to finish your 12-step merchant registration. Our automated compliance desk reviews and approves applications within 24 hours.
          </p>
          <div className="pt-2">
            <Link
              href="/seller-central/onboarding"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-black text-sm sm:text-base transition shadow-lg"
            >
              Start 12-Step Merchant Onboarding
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
