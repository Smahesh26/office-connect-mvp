import { Metadata } from "next";
import { SellerOnboardingWizard } from "@/components/seller-portal/SellerOnboardingWizard";

export const metadata: Metadata = {
  title: "Merchant Onboarding & 12-Step KYB Verification | Office Connect Seller Central",
  description:
    "Register your business on Office Connect Marketplace. Fast-track 12-step verification for Indian sellers, GSTIN validation, and escrow bank setup.",
};

export default function SellerOnboardingPage() {
  return (
    <main className="min-h-screen bg-slate-50/50">
      <SellerOnboardingWizard />
    </main>
  );
}
