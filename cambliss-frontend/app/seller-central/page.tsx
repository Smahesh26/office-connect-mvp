import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
  Headphones,
  Check,
  Briefcase,
  Percent,
  Star,
  HelpCircle,
  Award,
} from "lucide-react";
import { SellerFeeCalculator } from "@/components/seller-portal/SellerFeeCalculator";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";

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
      icon: "📜",
    },
    {
      title: "Company / Proprietor PAN",
      desc: "Company PAN for private/public limited & LLPs, or personal PAN for sole proprietors.",
      tag: "Identity",
      icon: "🪪",
    },
    {
      title: "Active Bank Account & Cancelled Cheque",
      desc: "Current or savings account matching PAN holder name for 7-day escrow IMPS/NEFT payouts.",
      tag: "Financial",
      icon: "🏦",
    },
    {
      title: "Government Photo ID & Address Proof",
      desc: "Aadhaar Card, Passport, or Voter ID of authorized signatory for live Video KYC clearance.",
      tag: "KYC",
      icon: "🛡️",
    },
    {
      title: "Dispatch Warehouse PIN Code",
      desc: "Registered physical pickup facility located within serviceable courier zones across India.",
      tag: "Logistics",
      icon: "📦",
    },
    {
      title: "Business Registration Proof",
      desc: "Certificate of Incorporation, LLP Agreement, or Udyam MSME Registration Certificate.",
      tag: "Corporate",
      icon: "📑",
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

  const whySellFeatures = [
    {
      title: "Zero Fixed Subscription",
      desc: "No monthly listing charges or upfront fee lock-ins. You only pay a competitive referral fee when products actually sell.",
      icon: Coins,
      badge: "Zero Risk",
    },
    {
      title: "7-Day Escrow Payouts",
      desc: "Regular automated bank settlements directly to your verified account via Razorpay Virtual Accounts, backed by transparent ledgers.",
      icon: TrendingUp,
      badge: "Guaranteed Escrow",
    },
    {
      title: "Pan-India Logistics",
      desc: "Reach customers in 19,000+ PIN codes with doorstep pickup via trusted national logistics partners, or store in FOC hubs.",
      icon: Truck,
      badge: "19,000+ PINs",
    },
    {
      title: "Enterprise & Corporate B2B",
      desc: "Get discovered by corporate purchase managers, enterprise bulk procurement teams, and institutional buyers across India.",
      icon: Building2,
      badge: "Bulk RFQs",
    },
    {
      title: "Automated GST & TCS Filing",
      desc: "Monthly 1% TCS compliance statements generated automatically, with direct credits reflecting on your GST Portal cash ledger.",
      icon: ShieldCheck,
      badge: "100% Compliant",
    },
    {
      title: "Dedicated Merchant Desk",
      desc: "Direct telephone and ticketing support for catalog onboarding, brand gating, return management, and dispute arbitration.",
      icon: Headphones,
      badge: "24/7 Priority",
    },
  ];

  const sellerReviews = [
    {
      name: "Rajesh Sharma",
      company: "Apex Tech Peripherals",
      city: "Pune, Maharashtra",
      rating: 5,
      comment:
        "Switching our IT accessories catalog to Office Connect was the best decision of 2026. The 7-day regular escrow settlements are clockwork, and enterprise bulk orders gave us 3x volume in Q2.",
      category: "IT & Electronics",
    },
    {
      name: "Meera Kulkarni",
      company: "ErgoComfort Furniture Ltd",
      city: "Bengaluru, Karnataka",
      rating: 5,
      comment:
        "The 12-step onboarding took us under 15 minutes because of automated GST verification. The FOC fulfillment handles all our bulky office chair dispatches without any hassle.",
      category: "Office Furniture",
    },
    {
      name: "Vikram Singhania",
      company: "Crown Corporate Gifting",
      city: "New Delhi",
      rating: 5,
      comment:
        "Zero monthly fixed fees means our risk was literally zero. Our corporate gifting catalog now receives regular purchase orders from verified corporate buyers nationwide.",
      category: "Corporate Gifting",
    },
  ];

  const faqs = [
    {
      q: "Do I mandatorily require a GSTIN to sell on Office Connect?",
      a: "Yes, for inter-state commerce and all taxable merchandise, an active GSTIN (Form REG-06) is required under Indian e-commerce laws. However, if you sell exclusively 100% GST-exempt handcrafted or educational goods within your home state, you may apply under state-specific exempt declarations.",
    },
    {
      q: "How does the 7-day escrow bank settlement work?",
      a: "Customer payments are collected through our secure payment gateway and held in an RBI-compliant escrow virtual account. Once the order is delivered and the buyer return window clears (typically 7 days), your net settlement is automatically disbursed via IMPS/NEFT directly into your verified bank account.",
    },
    {
      q: "Can I ship products myself using my own logistics partners?",
      a: "Yes! We offer 3 flexible fulfillment channels: Fulfilled by Office Connect (FOC), Office Connect Easy Ship (doorstep courier pickup), or Merchant Self Ship (where you use your existing contracts with BlueDart, Delhivery, DTDC, etc. with ₹0 marketplace shipping fee).",
    },
    {
      q: "What is the 1% TCS deduction?",
      a: "Under Section 52 of the CGST Act, e-commerce operators in India are mandated to deduct 1% Tax Collected at Source (TCS) on net taxable supplies. We deposit this directly with the Government and file monthly Form GSTR-8, allowing you to claim 100% input credit on your GST Portal cash ledger.",
    },
    {
      q: "How long does merchant application approval take?",
      a: "Once you submit your 12-step application with all 6 required documents, our automated compliance system verifies your GSTIN and bank penny drop instantly. Human KYB clearance and catalog gating approval is completed within 24 hours.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans select-none antialiased">
      {/* Top Brand Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/storefront" className="flex items-center gap-2.5 group">
              <Image
                src="/officeconnectlogo.png"
                alt="Office Connect Marketplace"
                width={180}
                height={42}
                priority
                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-102"
              />
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eef2ff] border border-[#404d85]/20 text-[#404d85] text-[10px] font-black uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Seller Central
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 text-xs font-bold">
            <Link
              href="/storefront"
              className="text-slate-600 hover:text-[#404d85] transition font-semibold hidden md:inline-flex items-center gap-1"
            >
              ← Back to Storefront
            </Link>
            <span className="text-slate-300 hidden md:inline">|</span>
            <Link
              href="/vendor-dashboard"
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition border border-slate-200"
            >
              Seller Sign In
            </Link>
            <Link
              href="/seller-central/onboarding"
              className="px-4 py-2 rounded-lg bg-[#404d85] hover:bg-[#2b345e] text-white font-black transition shadow-sm hover:shadow-md flex items-center gap-1.5"
            >
              <span>Register as Seller</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 1. HIGH-IMPACT HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#12172a] via-[#1f2746] to-[#2e3a6a] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Ambient Glowing Spheres */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#404d85]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:28px_28px] opacity-15 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-bold tracking-wide uppercase backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Verified Indian Merchant Gateway & Escrow Network
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Scale Your Business Across India. <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-emerald-300 via-sky-200 to-indigo-200 bg-clip-text text-transparent">
              Zero Fixed Fees. 7-Day Escrow Payouts.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Sell directly to retail consumers and enterprise B2B buyers across 19,000+ Indian PIN codes.
            Enjoy predictable 7-day regular bank settlements, pan-India logistics, and automated GST compliance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/seller-central/onboarding"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base transition shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2 group"
            >
              <span>Start 12-Step Merchant Onboarding</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#fee-calculator"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 backdrop-blur-xs"
            >
              <Calculator className="w-4 h-4 text-indigo-300" />
              <span>Simulate Payout & Margins</span>
            </a>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Already registered with Office Connect?{" "}
            <Link href="/vendor-dashboard" className="text-indigo-300 hover:text-white underline font-bold">
              Sign In to Vendor Dashboard →
            </Link>
          </div>

          {/* 4 Value Prop Key Performance Badges */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 max-w-4xl mx-auto text-left">
            {[
              { label: "Fixed Monthly Fee", val: "₹0 Forever", sub: "No listing or subscription fees" },
              { label: "Bank Settlement", val: "7-Day Escrow", sub: "Regular direct IMPS/NEFT deposits" },
              { label: "Courier Network", val: "19,000+ PINs", sub: "Pan-India doorstep pickup" },
              { label: "Tax Compliance", val: "1% TCS & GSTR-8", sub: "Automated GST portal credit" },
            ].map((prop, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1 hover:bg-white/10 transition"
              >
                <span className="text-[11px] font-bold text-indigo-200 block">{prop.label}</span>
                <span className="text-lg sm:text-xl font-black text-white block">{prop.val}</span>
                <span className="text-[10px] text-slate-400 block">{prop.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. CATEGORY TICKER STRIP ("THE VIBE") */}
      <div className="bg-[#181f38] border-y border-white/10 py-3 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-extrabold text-white">LIVE MERCHANT CATEGORIES:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[11px] font-medium text-slate-300">
            <span>💻 IT Hardware & Accessories</span>
            <span>🪑 Ergonomic Furniture</span>
            <span>📑 Corporate Stationery</span>
            <span>🎁 Corporate Gifting</span>
            <span>📦 Industrial Packaging</span>
            <span>⚡ Breakroom & Pantry</span>
            <span>🛡️ Safety & Facility Supplies</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-400">
            ⚡ 24-Hour Approval SLA • Over 1,200+ Active Vendors
          </div>
        </div>
      </div>

      {/* 3. WHY SELL ON OFFICE CONNECT (6 VALUE PILLARS) */}
      <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef2ff] text-[#404d85] text-xs font-bold border border-[#404d85]/20">
            <Award className="w-3.5 h-3.5 text-[#404d85]" />
            Seller Advantage
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Why Indian Merchants Choose Office Connect
          </h2>
          <p className="text-slate-600 text-sm">
            Everything you need to list, sell, fulfill, and collect payments transparently across the country.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {whySellFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all hover:-translate-y-0.5 relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#eef2ff] text-[#404d85] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 group-hover:bg-[#404d85]/10 group-hover:text-[#404d85] transition-colors">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center text-[11px] font-bold text-[#404d85]">
                  <span>Explore Feature</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. DOCUMENT READINESS CHECKLIST */}
      <section className="bg-white border-y border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
              Document Readiness Checklist
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              What You Need Before Registering
            </h2>
            <p className="text-slate-600 text-sm">
              Keep these 6 official Indian business credentials ready to complete the 12-step verification in under 10 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prerequisites.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-sm flex items-center justify-center shadow-2xs">
                      {item.icon}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-600">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 mb-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-200 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accepted in Digital PDF or Image format</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 12-STEP PROCESS ROADMAP */}
      <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef2ff] text-[#404d85] text-xs font-bold border border-[#404d85]/20 mb-2">
              <Layers className="w-3.5 h-3.5 text-[#404d85]" />
              Structured Launch Roadmap
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              The 12-Step Indian Merchant Verification Process
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mt-1">
              Fully compliant with Indian e-commerce consumer protection regulations, GST mandates, and banking guidelines.
            </p>
          </div>

          <Link
            href="/seller-central/onboarding"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#404d85] hover:bg-[#2b345e] text-white text-xs font-extrabold transition shrink-0 shadow-sm"
          >
            <span>Start Step 1 Now</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stepsOverview.map((st) => (
            <div
              key={st.num}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#404d85] transition-all group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-[#404d85] bg-[#eef2ff] px-2 py-0.5 rounded border border-[#404d85]/20">
                  Step {st.num}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">Phase {Math.ceil(st.num / 3)}</span>
              </div>
              <h4 className="font-extrabold text-xs text-slate-900 mb-1 group-hover:text-[#404d85] transition-colors">
                {st.name}
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug">{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FULFILLMENT CHANNELS COMPARISON */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              Logistics & Shipping Models
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Compare Fulfillment Channels Side-by-Side
            </h2>
            <p className="text-slate-600 text-sm">
              Select the shipping method that best matches your operating scale, warehouse setup, and profit margins.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* FOC */}
            <div className="rounded-2xl border-2 border-[#404d85] bg-white p-6 shadow-md relative flex flex-col justify-between">
              <div className="absolute top-4 right-4">
                <span className="px-2.5 py-0.5 rounded-full bg-[#404d85] text-white font-black text-[10px] uppercase tracking-wider">
                  ⭐ RECOMMENDED
                </span>
              </div>

              <div>
                <div className="w-10 h-10 rounded-xl bg-[#eef2ff] text-[#404d85] flex items-center justify-center mb-4">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-slate-900 mb-1">
                  Fulfilled by Office Connect (FOC)
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Store inventory in Office Connect fulfillment hubs. We handle warehousing, pick-pack-ship, and customer returns.
                </p>

                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-500">Delivery Speed:</span>
                    <span className="font-extrabold text-emerald-600">1-Day / 2-Day Express</span>
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
                  className="w-full py-2.5 rounded-xl bg-[#404d85] hover:bg-[#2b345e] text-white font-extrabold text-xs transition block text-center shadow-xs"
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
                    <span className="font-bold text-slate-800">Daily Scheduled at Doorstep</span>
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
                    <span className="font-bold text-slate-800">Any National Courier</span>
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
        </div>
      </section>

      {/* 7. REAL-TIME FEE & MARGIN CALCULATOR */}
      <section id="fee-calculator" className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef2ff] text-[#404d85] text-xs font-bold border border-[#404d85]/20">
              <Calculator className="w-3.5 h-3.5 text-[#404d85]" />
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

      {/* 8. MERCHANT TESTIMONIALS (SOCIAL PROOF & VIBE) */}
      <section className="bg-white border-y border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              Merchant Stories
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Trusted by Brands & Manufacturers Across India
            </h2>
            <p className="text-slate-600 text-sm">
              See what verified merchants have to say about their experience selling on Office Connect.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sellerReviews.map((rev, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4 hover:bg-white hover:border-[#404d85]/30 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(rev.rating)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 italic leading-relaxed">
                    &quot;{rev.comment}&quot;
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900">{rev.name}</h5>
                    <p className="text-[10px] text-slate-500">{rev.company} • {rev.city}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#eef2ff] text-[#404d85]">
                    {rev.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
            Clear Answers
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-sm">
            Everything you need to know about seller accounts, payouts, and verification.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white group cursor-pointer transition open:ring-1 open:ring-[#404d85] open:border-[#404d85]"
            >
              <summary className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center justify-between list-none">
                <span>{faq.q}</span>
                <span className="text-[#404d85] text-lg font-bold group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 10. CALL TO ACTION HERO BANNER */}
      <section className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-[#12172a] via-[#1f2746] to-[#404d85] text-white shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-4 max-w-3xl mx-auto">
            <span className="inline-block px-3.5 py-1 bg-white/10 border border-white/20 text-indigo-200 text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-md">
              ⚡ Fast-Track 24-Hour Approval
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Ready to Expand Your Reach Across India?
            </h2>
            <p className="text-slate-300 text-xs sm:text-base max-w-xl mx-auto">
              Finish your 12-step registration in under 10 minutes. Our compliance desk validates your GSTIN and bank details within 24 hours.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/seller-central/onboarding"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base transition shadow-xl"
              >
                <span>Start 12-Step Merchant Onboarding</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/vendor-dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm sm:text-base transition backdrop-blur-xs"
              >
                <span>Vendor Portal Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 11. UNIFIED STOREFRONT FOOTER */}
      <StorefrontFooter />
    </div>
  );
}
