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
  Boxes,
  Receipt,
  QrCode,
  Lock,
  BarChart3,
  RefreshCw,
  Globe2,
} from "lucide-react";
import { SellerFeeCalculator } from "@/components/seller-portal/SellerFeeCalculator";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";

export const metadata: Metadata = {
  title: "Office Connect Seller Central | Marketplace & Merchant Operating System",
  description:
    "Explore Office Connect Marketplace features: Zero fixed subscription, 7-day regular escrow bank settlements, circular inventory & PO sync, pan-India logistics, and 12-step guided Indian merchant verification.",
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

  const detailedMarketplaceFeatures = [
    {
      title: "Branded Multi-Vendor Storefronts",
      subtitle: "Dedicated /store/[slug] Vanity URLs",
      desc: "Every approved merchant receives an independent, SEO-optimized digital storefront with custom banners, store profile, brand badges, social handles, and direct merchant reviews.",
      icon: Store,
      badge: "Merchant Identity",
      highlight: "Custom Vanity URL + Brand Story",
      stat: "100% Branded",
    },
    {
      title: "Automated Algorithmic Buy Box",
      subtitle: "Intelligent Multi-Offer Competition",
      desc: "Multi-seller offer ranking engine evaluates seller reputation, price competitiveness, dispatch SLA, and delivery speed to award the primary Buy Box and drive maximum orders.",
      icon: TrendingUp,
      badge: "Conversion Engine",
      highlight: "Dynamic Pricing & SLA Scoring",
      stat: "4.2x Faster Sales",
    },
    {
      title: "Escrow Security & 7-Day Bank Payouts",
      subtitle: "100% Risk-Free Merchant Settlements",
      desc: "Customer payments are held in an automated platform escrow account. Following the 7-day buyer return grace period, funds are automatically transferred via direct IMPS/NEFT.",
      icon: ShieldCheck,
      badge: "Financial Trust",
      highlight: "Automated IMPS/NEFT Settlements",
      stat: "7-Day Cycle",
    },
    {
      title: "Circular Inventory & Auto Purchase Orders",
      subtitle: "Unified Commerce ➔ Warehouse ➔ PO Flow",
      desc: "Storefront orders instantly deduct stock from connected multi-location warehouses. When inventory reaches safety thresholds, 1-click supplier POs and gate passes are generated.",
      icon: Boxes,
      badge: "Circular ERP",
      highlight: "Real-Time Stock Sync & Auto POs",
      stat: "Zero Stockouts",
    },
    {
      title: "Indian Statutory & KYB Compliance",
      subtitle: "Automated GSTIN, PAN & Bank Penny-Drop",
      desc: "Strict adherence to Indian e-commerce consumer protection laws. Automatic verification of 15-digit GSTIN (REG-06), PAN verification, and ₹1.00 penny-drop IFSC validation.",
      icon: FileCheck,
      badge: "Statutory KYB",
      highlight: "Instant REG-06 & Penny-Drop",
      stat: "24-Hour SLA",
    },
    {
      title: "Automated GST, HSN & TCS Invoicing",
      subtitle: "1% TCS Withholding & GSTR-8 Export",
      desc: "Automates 1% Tax Collected at Source (TCS) withholding under Section 52 of the CGST Act, credited directly to your Cash Ledger on the GST portal with ready-to-file GSTR-8 returns.",
      icon: Receipt,
      badge: "Tax Automation",
      highlight: "Automated HSN Tax Invoices",
      stat: "100% Tax Compliant",
    },
    {
      title: "Pan-India Logistics & AWB Automation",
      subtitle: "19,000+ PIN Code Doorstep Network",
      desc: "Seamlessly integrated with premier national courier networks (BlueDart, Delhivery, XpressBees). Automated Airway Bill (AWB) generation, doorstep package pickups, and live tracking.",
      icon: Truck,
      badge: "Nationwide Logistics",
      highlight: "Automated AWB & Live Courier Telemetry",
      stat: "19,000+ PINs",
    },
    {
      title: "Omnichannel POS & Multi-Warehouse Sync",
      subtitle: "Unified Offline Counter & Online Pool",
      desc: "Run physical retail checkout counters and online marketplace listings off a single unified inventory pool. Barcode scanning, offline receipt generation, and live inventory sync.",
      icon: QrCode,
      badge: "Omnichannel POS",
      highlight: "Barcode Scanning & POS Integration",
      stat: "Unified Stock Pool",
    },
  ];

  const whySellFeatures = [
    {
      title: "Zero Fixed Subscription",
      desc: "No monthly listing charges, server fees, or upfront lock-ins. You only pay a competitive referral fee when products actually sell.",
      icon: Coins,
      badge: "Zero Risk",
    },
    {
      title: "Predictable 7-Day Settlements",
      desc: "Automated payouts directly to your verified Indian current or savings account every 7 days after delivery clearance.",
      icon: Building2,
      badge: "Automated Escrow",
    },
    {
      title: "Pan-India Courier Network",
      desc: "Seamless doorstep pickup across 19,000+ serviceable PIN codes with automated tracking, reverse logistics, and insurance.",
      icon: Truck,
      badge: "19k+ PIN Codes",
    },
    {
      title: "Automated GST & TCS Filing",
      desc: "Automates 1% TCS deduction under Section 52 of CGST Act, providing monthly GSTR-8 reconciliations for seamless tax input credit.",
      icon: FileCheck,
      badge: "TCS Compliant",
    },
    {
      title: "Dedicated Branded Storefront",
      desc: "Claim your unique /store/[slug] URL with custom merchant banner, catalog highlights, seller badges, and customer ratings.",
      icon: Store,
      badge: "Branded URL",
    },
    {
      title: "Multi-Offer Buy Box Engine",
      desc: "Compete with other sellers transparently on pricing, dispatch SLA, and stock availability to win the primary buy box.",
      icon: TrendingUp,
      badge: "Buy Box Advantage",
    },
  ];

  const sellerReviews = [
    {
      name: "Rajesh Kulkarni",
      company: "Hisense Computer Solutions",
      city: "Bengaluru, Karnataka",
      category: "IT Hardware",
      rating: 5,
      comment:
        "Switching our distribution to Office Connect Marketplace reduced our operational costs dramatically. 7-day escrow disbursements are 100% on time, and inventory connects straight into our warehouse POs.",
    },
    {
      name: "Ananya Mehta",
      company: "AeroTech Studio India",
      city: "Gurugram, Haryana",
      category: "Consumer Audio",
      rating: 5,
      comment:
        "The automated Buy Box engine and transparent fee simulator give us full visibility over our product margins. The 12-step verification gave our enterprise buyers immediate confidence.",
    },
    {
      name: "Pooja Sundaram",
      company: "UrbanStyle Apparel Co.",
      city: "Tirupur, Tamil Nadu",
      category: "Apparel & Textiles",
      rating: 5,
      comment:
        "Zero monthly subscription fee meant we could test our new collection with zero financial exposure. Doorstep Easy Ship pickups work like clockwork across North and South India.",
    },
  ];

  const faqs = [
    {
      q: "What are the fees for selling on Office Connect Marketplace?",
      a: "There are zero fixed monthly fees or upfront listing charges. You only pay a competitive category referral fee (5.5% to 13.5% depending on category), a small closing fee (₹5 to ₹45 based on price tier), and standard shipping fees if you choose Fulfilled by Office Connect (FOC) or Easy Ship.",
    },
    {
      q: "How and when do I receive payment for orders?",
      a: "Payments are settled on a strict 7-day cycle directly into your verified bank account via IMPS or NEFT. Customer funds are held securely in platform escrow and disbursed automatically after the 7-day customer return window concludes.",
    },
    {
      q: "Can I sell if I already have an offline store or warehouse?",
      a: "Yes! Office Connect Marketplace is built for omnichannel commerce. You can use our integrated Point-of-Sale (POS) barcodes and connect your physical warehouse inventory directly into the online catalog, ensuring real-time stock deductions.",
    },
    {
      q: "How does the Circular Inventory & Auto PO system work?",
      a: "When a customer places an order on the marketplace, stock is immediately decremented from your designated warehouse. If inventory drops below your defined reorder threshold, the system automatically drafts a supplier Purchase Order (PO) with ready-to-approve quantities.",
    },
    {
      q: "How does 1% TCS compliance work for Indian GST?",
      a: "As mandated under Section 52 of the Central Goods and Services Tax (CGST) Act, Office Connect withholds 1% Tax Collected at Source (TCS) on net taxable supplies. We file monthly Form GSTR-8, and the credit reflects directly in your electronic Cash Ledger on the GST portal.",
    },
    {
      q: "How long does merchant application approval take?",
      a: "Once you submit your 12-step application with required credentials, our automated compliance system verifies your GSTIN and bank penny drop within minutes. Human KYB clearance and catalog gating approval is completed within 24 hours.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans select-none antialiased">
      
      {/* ========================================================================= */}
      {/* 1. TOP BRAND NAVIGATION HEADER (EXACT USER REQUIREMENT: ONLY GO TO MARKETPLACE) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/seller-central" className="flex items-center gap-2.5 group">
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

          {/* User directive: Remove "Back to Storefront", "Seller Sign In", "Register as Seller". Put ONLY "Go to Marketplace" */}
          <div className="flex items-center gap-3">
            <Link
              href="/storefront"
              className="px-5 py-2.5 rounded-xl bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-xs transition shadow-sm hover:shadow-md flex items-center gap-2 group active:scale-95"
            >
              <span>🛍️ Go to Marketplace</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. ULTRA-CLASSY HIGH-IMPACT HERO BANNER */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b0f19] via-[#151c33] to-[#252f55] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Ambient Glowing Spheres */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#404d85]/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-bold tracking-wide uppercase backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Unified Indian Multi-Vendor Marketplace & Operating System
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            The Complete Commerce Layer <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-emerald-300 via-sky-200 to-indigo-200 bg-clip-text text-transparent">
              For Verified Indian Merchants & Brands
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base lg:text-lg max-w-3xl mx-auto font-normal leading-relaxed">
            Sell directly to retail consumers and enterprise B2B buyers across 19,000+ Indian PIN codes.
            Empowered by real-time inventory decrement, 1-click automated supplier POs, 7-day regular bank escrow settlements, and 100% statutory GST compliance.
          </p>

          {/* Hero CTAs: Both direct to Marketplace as requested */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <Link
              href="/storefront"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base transition shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2 group"
            >
              <span>🛍️ Go to Marketplace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/storefront?tab=browse"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 backdrop-blur-xs"
            >
              <span>🔍 Browse Live Catalog & Stores</span>
            </Link>
          </div>

          {/* Sub-hero portal helper link: directs to marketplace */}
          <div className="text-xs text-slate-400 font-medium pt-1">
            Looking to register a storefront, access vendor portal, or view active listings?{" "}
            <Link href="/storefront" className="text-indigo-300 hover:text-white underline font-bold">
              Go to Marketplace & Storefront Portal →
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

      {/* ========================================================================= */}
      {/* 3. LIVE MARKETPLACE CATEGORY TICKER STRIP */}
      {/* ========================================================================= */}
      <div className="bg-[#12182b] border-y border-white/10 py-3.5 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-extrabold text-white">LIVE MARKETPLACE CATEGORIES:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[11px] font-medium text-slate-300">
            <span>💻 IT Hardware & Computing</span>
            <span>🎧 Professional Audio & Acoustics</span>
            <span>👕 Apparel, Fashion & Corporate Wear</span>
            <span>🧴 Personal Care & Beauty</span>
            <span>🚗 Automotive & Industrial Supplies</span>
            <span>📦 Packaging & Breakroom Essentials</span>
          </div>
          <div className="text-[11px] font-bold text-emerald-400">
            ⚡ 24-Hour Verification SLA • Integrated With Supply Chain & POS
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. COMPREHENSIVE MARKETPLACE FEATURE DEEP-DIVE (CLASSY & DETAILED) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef2ff] text-[#404d85] text-xs font-bold border border-[#404d85]/20">
            <Award className="w-3.5 h-3.5 text-[#404d85]" />
            Enterprise Marketplace Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Every Feature Engineered For Indian Multi-Vendor Commerce
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            We don&apos;t just provide a storefront — we deliver a complete operating infrastructure bridging customer orders, warehouse inventory, automated supplier replenishment, and banking compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {detailedMarketplaceFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all hover:-translate-y-1 relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#eef2ff] text-[#404d85] flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 group-hover:bg-[#404d85]/10 group-hover:text-[#404d85] transition-colors">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 mb-1">{feat.title}</h3>
                  <div className="text-[11px] font-bold text-[#404d85] mb-2">{feat.subtitle}</div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{feat.desc}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">{feat.highlight}</span>
                    <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{feat.stat}</span>
                  </div>
                  <Link
                    href="/storefront"
                    className="w-full py-1.5 rounded-lg bg-slate-50 hover:bg-[#eef2ff] text-[#404d85] font-bold text-[11px] transition flex items-center justify-center gap-1 group-hover:bg-[#404d85] group-hover:text-white"
                  >
                    <span>Explore in Marketplace</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. WHY SELL ON OFFICE CONNECT (6 VALUE PILLARS) */}
      {/* ========================================================================= */}
      <section className="bg-white border-y border-slate-200/90 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef2ff] text-[#404d85] text-xs font-bold border border-[#404d85]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#404d85]" />
              Merchant Value Proposition
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Why Indian Merchants Scale With Us
            </h2>
            <p className="text-slate-600 text-sm">
              Transparent margins, guaranteed escrow settlements, and nationwide automated logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whySellFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all hover:-translate-y-0.5 relative group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-[#404d85] flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-600 group-hover:bg-[#404d85]/10 group-hover:text-[#404d85] transition-colors">
                        {feat.badge}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 mb-2">{feat.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between">
                    <Link
                      href="/storefront"
                      className="text-[11px] font-bold text-[#404d85] hover:underline flex items-center gap-1"
                    >
                      <span>Go to Marketplace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. DOCUMENT READINESS CHECKLIST */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
            Document Readiness Checklist
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            What You Need Before Registering
          </h2>
          <p className="text-slate-600 text-sm">
            Keep these 6 official Indian business credentials ready to complete verification in under 10 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prerequisites.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-lg bg-[#f0f4fc] text-sm flex items-center justify-center shadow-2xs">
                    {item.icon}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                    {item.tag}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Accepted in Digital PDF or Image format</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. 12-STEP PROCESS ROADMAP (WITH BUTTON DIRECTING TO MARKETPLACE) */}
      {/* ========================================================================= */}
      <section className="bg-white border-y border-slate-200/90 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
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

            {/* Button directs to Marketplace as requested */}
            <Link
              href="/storefront"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#404d85] hover:bg-[#2b345e] text-white text-xs font-extrabold transition shrink-0 shadow-sm"
            >
              <span>Go to Marketplace</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stepsOverview.map((st) => (
              <div
                key={st.num}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-[#404d85] transition-all group shadow-2xs"
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
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FULFILLMENT CHANNELS (ALL 3 BUTTONS DIRECT TO MARKETPLACE) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
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

            {/* Directs to marketplace */}
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                href="/storefront"
                className="w-full py-2.5 rounded-xl bg-[#404d85] hover:bg-[#2b345e] text-white font-extrabold text-xs transition block text-center shadow-xs"
              >
                Go to Marketplace
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

            {/* Directs to marketplace */}
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                href="/storefront"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition block text-center"
              >
                Go to Marketplace
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

            {/* Directs to marketplace */}
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                href="/storefront"
                className="w-full py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-extrabold text-xs transition block text-center"
              >
                Go to Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. REAL-TIME FEE & MARGIN CALCULATOR */}
      {/* ========================================================================= */}
      <section id="fee-calculator" className="bg-white border-y border-slate-200/90 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
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

      {/* ========================================================================= */}
      {/* 10. MERCHANT TESTIMONIALS (SOCIAL PROOF) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
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
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4 hover:border-[#404d85]/30 transition"
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

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
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
      </section>

      {/* ========================================================================= */}
      {/* 11. FREQUENTLY ASKED QUESTIONS */}
      {/* ========================================================================= */}
      <section className="bg-white border-y border-slate-200/90 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
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
                className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 group cursor-pointer transition open:ring-1 open:ring-[#404d85] open:border-[#404d85] open:bg-white"
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
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. HIGH-CONVERTING BOTTOM HERO CTA BANNER (DIRECTS TO MARKETPLACE) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-[#0b0f19] via-[#151c33] to-[#404d85] text-white shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-4 max-w-3xl mx-auto">
            <span className="inline-block px-3.5 py-1 bg-white/10 border border-white/20 text-indigo-200 text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-md">
              ⚡ Instant Access to Marketplace Ecosystem
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Ready to Explore or Sell on Office Connect Marketplace?
            </h2>
            <p className="text-slate-300 text-xs sm:text-base max-w-xl mx-auto">
              Browse products, list merchandise in your storefront, and enjoy automated inventory synchronization across all channels.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/storefront"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base transition shadow-xl active:scale-95"
              >
                <span>🛍️ Go to Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/storefront?tab=store"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm sm:text-base transition backdrop-blur-xs active:scale-95"
              >
                <span>🏪 Manage Storefront & Listings</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. UNIFIED STOREFRONT FOOTER */}
      {/* ========================================================================= */}
      <StorefrontFooter />
    </div>
  );
}
