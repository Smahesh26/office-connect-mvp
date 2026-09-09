"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Store,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Truck,
  Building2,
  Clock,
  BadgeCheck,
  Lock,
  PhoneCall,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function StorefrontSignupPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-700">Loading Storefront Portal...</div>}>
      <StorefrontSignupContent />
    </Suspense>
  );
}

function StorefrontSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "customer" ? "customer" : "seller";

  const [activeMode, setActiveMode] = useState<"seller" | "customer">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Seller Form State
  const [sellerBusinessName, setSellerBusinessName] = useState("");
  const [sellerTradeName, setSellerTradeName] = useState("");
  const [sellerOwnerName, setSellerOwnerName] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerPassword, setSellerPassword] = useState("");
  const [sellerEntityType, setSellerEntityType] = useState("Individual / Sole Proprietor");
  const [sellerCategory, setSellerCategory] = useState("Electronics & Appliances");
  const [sellerWarehousePin, setSellerWarehousePin] = useState("");

  // Customer Form State
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [customerPincode, setCustomerPincode] = useState("");

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "customer") {
      setActiveMode("customer");
    } else if (modeParam === "seller") {
      setActiveMode("seller");
    }
  }, [searchParams]);

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/storefront/auth/register-merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: sellerBusinessName || sellerTradeName,
          tradeName: sellerTradeName,
          ownerName: sellerOwnerName,
          email: sellerEmail,
          phone: sellerPhone,
          password: sellerPassword,
          entityType: sellerEntityType,
          category: sellerCategory,
          warehousePinCode: sellerWarehousePin || "560001",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create merchant account");
      }

      // Store auth session
      if (data.token) {
        localStorage.setItem("authToken", "cookie-session");
        localStorage.setItem(
          "authUser",
          JSON.stringify({
            ...data.user,
            role: "SELLER",
          })
        );
        // Save initial state for wizard sync
        localStorage.setItem(
          `officeconnect_merchant_status_${data.user.email}`,
          JSON.stringify({
            status: "Pending Review",
            applicationId: data.user.applicationId,
            tradeName: data.user.tradeName,
          })
        );
      }

      setSuccessMsg("Merchant account created! Redirecting to 12-step Indian KYB verification...");
      setTimeout(() => {
        router.push("/seller-central/onboarding");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/storefront/auth/register-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          password: customerPassword,
          pincode: customerPincode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create customer account");
      }

      if (data.token) {
        localStorage.setItem("authToken", "cookie-session");
        localStorage.setItem(
          "authUser",
          JSON.stringify({
            ...data.user,
            role: "CUSTOMER",
          })
        );
      }

      setSuccessMsg("Welcome to Office Connect Marketplace! Taking you to the storefront...");
      setTimeout(() => {
        const next = searchParams.get("next");
        router.push(next || "/storefront");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50 to-slate-100/80 text-slate-900 flex flex-col justify-between select-none">
      {/* 1. TOP UTILITY HEADER */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/storefront" className="flex items-center gap-3 group">
            <Image
              src="/officeconnectlogo.png"
              alt="Office Connect Marketplace"
              width={160}
              height={36}
              priority
              className="h-8 w-auto object-contain transition-transform group-hover:scale-102"
            />
            <div className="hidden sm:flex flex-col border-l border-slate-200 pl-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#404d85]">
                Marketplace Portal
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Storefront Merchants & Shoppers
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/storefront"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1"
            >
              <span>← Return to Shopping</span>
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN REGISTRATION CARD CONTAINER */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* LEFT: FORM SECTION (7 COLS) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* MODE SELECTOR TABS */}
              <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200 w-full sm:w-auto mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode("seller");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition ${
                    activeMode === "seller"
                      ? "bg-[#404d85] text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Register as Merchant (Seller)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode("customer");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition ${
                    activeMode === "customer"
                      ? "bg-[#404d85] text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Register as Shopper (Buyer)</span>
                </button>
              </div>

              {/* HEADING BASED ON MODE */}
              <div className="mb-6">
                {activeMode === "seller" ? (
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-800 text-[11px] font-bold border border-violet-200 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                      Zero Fixed Monthly Subscription • 7-Day Escrow Payouts
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Open Your Marketplace Store
                    </h1>
                    <p className="text-slate-600 text-xs sm:text-sm mt-1">
                      Create your seller account in 2 minutes, then proceed into our guided 12-step Indian KYB verification.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      100% Genuine Verified Stores • Instant B2B GST Invoicing
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Create Your Shopper Account
                    </h1>
                    <p className="text-slate-600 text-xs sm:text-sm mt-1">
                      Enjoy multi-seller cart checkout, pan-India order tracking, and institutional bulk discounts.
                    </p>
                  </div>
                )}
              </div>

              {/* STATUS NOTICES */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* SELLER REGISTRATION FORM */}
              {activeMode === "seller" && (
                <form onSubmit={handleSellerSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Store / Trade Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Audio Official"
                        value={sellerTradeName}
                        onChange={(e) => setSellerTradeName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#404d85] focus:ring-2 focus:ring-[#404d85]/20 outline-none text-slate-900 bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Business Registered Entity Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Peripherals Pvt Ltd"
                        value={sellerBusinessName}
                        onChange={(e) => setSellerBusinessName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#404d85] focus:ring-2 focus:ring-[#404d85]/20 outline-none text-slate-900 bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Owner / Signatory Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={sellerOwnerName}
                        onChange={(e) => setSellerOwnerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#404d85] focus:ring-2 focus:ring-[#404d85]/20 outline-none text-slate-900 bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Business Entity Type
                      </label>
                      <select
                        value={sellerEntityType}
                        onChange={(e) => setSellerEntityType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#404d85] outline-none text-slate-900 bg-white"
                      >
                        <option>Individual / Sole Proprietor</option>
                        <option>Partnership / LLP</option>
                        <option>Private Limited / OPC</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Business Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="seller@yourbrand.in"
                        value={sellerEmail}
                        onChange={(e) => setSellerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#404d85] focus:ring-2 focus:ring-[#404d85]/20 outline-none text-slate-900 bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Mobile Number (+91) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={sellerPhone}
                        onChange={(e) => setSellerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#404d85] focus:ring-2 focus:ring-[#404d85]/20 outline-none text-slate-900 bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Primary Merchandise Category
                      </label>
                      <select
                        value={sellerCategory}
                        onChange={(e) => setSellerCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#404d85] outline-none text-slate-900 bg-white"
                      >
                        <option>Electronics & Appliances</option>
                        <option>Computers & Peripherals</option>
                        <option>Home & Office Furniture</option>
                        <option>Industrial, Tools & MRO</option>
                        <option>Fashion & Apparel</option>
                        <option>Beauty & Personal Care</option>
                        <option>Automotive Spares</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Pickup Warehouse PIN Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 560001"
                        value={sellerWarehousePin}
                        onChange={(e) => setSellerWarehousePin(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#404d85] focus:ring-2 focus:ring-[#404d85]/20 outline-none text-slate-900 bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Set Portal Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      value={sellerPassword}
                      onChange={(e) => setSellerPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#404d85] focus:ring-2 focus:ring-[#404d85]/20 outline-none text-slate-900 bg-white transition"
                    />
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-sm transition shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                      <span>{loading ? "Registering Seller Profile..." : "Register & Start 12-Step KYB Verification"}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-[11px] text-slate-500 text-center mt-2">
                      By registering, you agree to the Office Connect Indian Marketplace Business Solutions Agreement.
                    </p>
                  </div>
                </form>
              )}

              {/* CUSTOMER REGISTRATION FORM */}
              {activeMode === "customer" && (
                <form onSubmit={handleCustomerSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#404d85] focus:ring-2 focus:ring-[#404d85]/20 outline-none text-slate-900 bg-white transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="jane@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#404d85] focus:ring-2 focus:ring-[#404d85]/20 outline-none text-slate-900 bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Mobile Number (+91) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#404d85] focus:ring-2 focus:ring-[#404d85]/20 outline-none text-slate-900 bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Delivery PIN Code (Optional)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 110001"
                        value={customerPincode}
                        onChange={(e) => setCustomerPincode(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#404d85] focus:ring-2 focus:ring-[#404d85]/20 outline-none text-slate-900 bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        value={customerPassword}
                        onChange={(e) => setCustomerPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#404d85] focus:ring-2 focus:ring-[#404d85]/20 outline-none text-slate-900 bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-[#404d85] hover:bg-[#323d6a] text-white font-black text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <span>{loading ? "Creating Buyer Profile..." : "Create Buyer Account & Start Shopping"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-[11px] text-slate-500 text-center mt-2">
                      Zero subscription fees. Free returns on verified store items.
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* SEPARATION FOOTNOTE: SAAS ERP SIGNUP CALLOUT */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
              <span>Already have an account? <Link href="/login" className="font-bold text-[#404d85] hover:underline">Sign In</Link></span>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span>Looking for SaaS ERP Cloud (Accounting & CRM)?</span>
                <Link href="/register" className="font-bold text-slate-800 hover:text-[#404d85] underline flex items-center gap-0.5">
                  ERP Trial ↗
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: VALUE PROPOSITION HIGHLIGHTS (5 COLS) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-[#1f2430] to-indigo-950 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {activeMode === "seller" ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/70 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider">
                    <Store className="w-3.5 h-3.5 text-violet-400" />
                    Indian Merchant Benefits
                  </div>

                  <h3 className="text-2xl font-black tracking-tight leading-tight">
                    Scale Your Sales to Millions of Business & Retail Buyers.
                  </h3>

                  <div className="space-y-4 text-xs text-slate-300">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">₹0 Fixed Monthly Subscription</span>
                        <span className="text-slate-400">Never pay any upfront listing or recurring monthly gateway charges.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">7-Day Escrow Bank Settlements</span>
                        <span className="text-slate-400">Automated IMPS/NEFT transfers into your verified business bank account.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">19,000+ PIN Code Logistics</span>
                        <span className="text-slate-400">Doorstep pickups via Easy Ship, Fulfillment by Office Connect (FOC), or Self Ship.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">24-Hour Express Verification</span>
                        <span className="text-slate-400">Fast-track automated GSTIN REG-06 and bank penny-drop approval.</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/70 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                    Marketplace Shopper Perks
                  </div>

                  <h3 className="text-2xl font-black tracking-tight leading-tight">
                    Direct Manufacturer Pricing & Institutional Protection.
                  </h3>

                  <div className="space-y-4 text-xs text-slate-300">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <BadgeCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">100% Verified Indian Merchants</span>
                        <span className="text-slate-400">All sellers pass 12-step statutory KYB, GSTIN, and identity clearance.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">Express Courier Tracking</span>
                        <span className="text-slate-400">Real-time live AWB milestone tracking across all your ordered items.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">GST Input Tax Credit Invoices</span>
                        <span className="text-slate-400">Instant B2B tax invoices generated automatically with your organization's GSTIN.</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative z-10 pt-8 mt-8 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit SSL Encryption
              </span>
              <span>Made for Indian Commerce 🇮🇳</span>
            </div>

          </div>

        </div>
      </main>

      {/* 3. SUB-FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <p>© 2026 Office Connect Marketplace. All rights reserved. Dedicated Storefront & Merchant Infrastructure.</p>
      </footer>
    </div>
  );
}
