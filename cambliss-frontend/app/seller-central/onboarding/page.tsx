import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Headphones } from "lucide-react";
import { SellerOnboardingWizard } from "@/components/seller-portal/SellerOnboardingWizard";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";

export const metadata: Metadata = {
  title: "Merchant Onboarding & 12-Step KYB Verification | Office Connect Seller Central",
  description:
    "Register your business on Office Connect Marketplace. Fast-track 12-step verification for Indian sellers, GSTIN validation, and escrow bank setup.",
};

export default function SellerOnboardingPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between">
      {/* Top Header with Visible Brand Logo */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
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
                Seller Onboarding
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <Link
              href="/seller-central"
              className="text-slate-600 hover:text-[#404d85] transition font-semibold inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Seller Central</span>
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="/vendor-dashboard"
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition border border-slate-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <SellerOnboardingWizard />
      </main>

      <StorefrontFooter />
    </div>
  );
}
