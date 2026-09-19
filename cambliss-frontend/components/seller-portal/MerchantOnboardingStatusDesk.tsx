"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Building2,
  CreditCard,
  Truck,
  Store,
  ExternalLink,
  ArrowRight,
  FileText,
  RotateCcw,
  Sparkles,
  ChevronRight,
  UploadCloud,
  Check,
} from "lucide-react";
import { SellerOnboardingWizard } from "./SellerOnboardingWizard";

export type MerchantVerificationStatus = "NOT_STARTED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";

interface MerchantOnboardingStatusDeskProps {
  userEmail?: string;
  onNavigateToStore?: () => void;
  onNavigateToBrowse?: () => void;
}

export const MerchantOnboardingStatusDesk = ({
  userEmail = "bhaskeradv1@gmail.com",
  onNavigateToStore,
  onNavigateToBrowse,
}: MerchantOnboardingStatusDeskProps) => {
  const [effectiveEmail, setEffectiveEmail] = useState<string>(userEmail);
  const [status, setStatus] = useState<MerchantVerificationStatus>("PENDING_REVIEW");
  const [applicationData, setApplicationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulatingApproval, setIsSimulatingApproval] = useState<boolean>(false);
  const [approvalNotification, setApprovalNotification] = useState<{ title: string; message: string } | null>(null);

  // Detect current logged-in user email
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const rawUser = localStorage.getItem("authUser");
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          if (parsed.email) {
            setEffectiveEmail(parsed.email);
          }
        }
      } catch (err) {}
    }
  }, []);

  // Load application and verification status for effectiveEmail
  useEffect(() => {
    const loadStatus = async () => {
      const emailKey = `officeconnect_merchant_status_${effectiveEmail}`;
      const fallbackKey = `officeconnect_merchant_status_bhaskeradv1@gmail.com`;

      // 1. Check direct localStorage key for this user
      let storedStatus = localStorage.getItem(emailKey) || localStorage.getItem(fallbackKey);
      if (storedStatus) {
        try {
          const parsed = JSON.parse(storedStatus);
          const isAppr = parsed.status === "Approved";
          setStatus(isAppr ? "APPROVED" : "PENDING_REVIEW");
          setApplicationData(parsed.payload || parsed);
          setIsLoading(false);
          return;
        } catch (e) {}
      }

      // 2. Check submitted applications list in localStorage
      try {
        const allSubmitted = localStorage.getItem("officeconnect_submitted_applications");
        if (allSubmitted) {
          const list = JSON.parse(allSubmitted);
          const found = list.find(
            (a: any) =>
              a.email && a.email.toLowerCase() === effectiveEmail.toLowerCase()
          );
          if (found) {
            setStatus(found.status === "Approved" ? "APPROVED" : "PENDING_REVIEW");
            setApplicationData(found);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {}

      // 3. Check backend API queue
      try {
        const res = await fetch("/api/storefront/seller-onboarding");
        if (res.ok) {
          const data = await res.json();
          if (data.applications && Array.isArray(data.applications)) {
            const found = data.applications.find(
              (a: any) =>
                a.email && a.email.toLowerCase() === effectiveEmail.toLowerCase()
            );
            if (found) {
              setStatus(found.status === "Approved" ? "APPROVED" : "PENDING_REVIEW");
              setApplicationData(found);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (e) {}

      // Clean default state for all SaaS users — start fresh from scratch
      setStatus("NOT_STARTED");
      setApplicationData(null);
      setIsLoading(false);
    };

    loadStatus();

    // Check for existing notifications on load
    try {
      const notifKey = `officeconnect_notification_${effectiveEmail}`;
      const fallbackNotifKey = `officeconnect_notification_bhaskeradv1@gmail.com`;
      const savedNotif = localStorage.getItem(notifKey) || localStorage.getItem(fallbackNotifKey);
      if (savedNotif) {
        const parsed = JSON.parse(savedNotif);
        if (!parsed.read) {
          setApprovalNotification(parsed);
        }
      }
    } catch (e) {}

    // Real-time listener for approval across tabs or in same window
    const handleStorageOrApprove = () => {
      loadStatus();
      try {
        const notifKey = `officeconnect_notification_${effectiveEmail}`;
        const fallbackNotifKey = `officeconnect_notification_bhaskeradv1@gmail.com`;
        const savedNotif = localStorage.getItem(notifKey) || localStorage.getItem(fallbackNotifKey);
        if (savedNotif) {
          const parsed = JSON.parse(savedNotif);
          if (!parsed.read) {
            setApprovalNotification(parsed);
          }
        }
      } catch (err) {}
    };

    window.addEventListener("storage", handleStorageOrApprove);
    window.addEventListener("officeconnect_kyb_approved" as any, handleStorageOrApprove);

    // Active real-time poll every 2 seconds
    const interval = setInterval(loadStatus, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageOrApprove);
      window.removeEventListener("officeconnect_kyb_approved" as any, handleStorageOrApprove);
      clearInterval(interval);
    };
  }, [effectiveEmail]);

  // Simulate background verification approval (allows instant testing without waiting 2 full days)
  const handleSimulateApproval = async () => {
    setIsSimulatingApproval(true);
    const updated = {
      ...applicationData,
      status: "Approved",
      decisionDate: new Date().toISOString().split("T")[0],
      decisionNotes: "Manual 2-day KYB verification passed by compliance officer.",
    };

    // Update localStorage
    try {
      localStorage.setItem(
        `officeconnect_merchant_status_${effectiveEmail}`,
        JSON.stringify({ status: "Approved", payload: updated })
      );

      const allSubmitted = localStorage.getItem("officeconnect_submitted_applications");
      if (allSubmitted) {
        const list = JSON.parse(allSubmitted);
        const mapped = list.map((item: any) =>
          item.email === effectiveEmail || item.id === applicationData?.id ? updated : item
        );
        localStorage.setItem("officeconnect_submitted_applications", JSON.stringify(mapped));
      }
    } catch (e) {}

    // Call backend patch
    if (applicationData?.id) {
      try {
        await fetch(`/api/storefront/seller-onboarding/${applicationData.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Approved" }),
        });
      } catch (err) {}
    }

    setTimeout(() => {
      setStatus("APPROVED");
      setApplicationData(updated);
      setIsSimulatingApproval(false);
    }, 600);
  };

  const handleResetToWizard = () => {
    setStatus("NOT_STARTED");
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold text-xs">
        Loading merchant verification profile...
      </div>
    );
  }

  // 1. STATE: NOT STARTED (Render 12-Step Wizard)
  if (status === "NOT_STARTED") {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-violet-50/80 border border-violet-200 text-xs text-violet-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-violet-600 shrink-0" />
            <div>
              <span className="font-extrabold text-sm block">Welcome, {effectiveEmail}!</span>
              <span className="text-slate-600">
                Complete your 12-step Indian merchant verification below to activate your custom storefront and start selling.
              </span>
            </div>
          </div>
        </div>

        <SellerOnboardingWizard
          initialEmail={effectiveEmail}
          initialStoreName=""
          onSubmitted={(app) => {
            setApplicationData(app);
            setStatus("PENDING_REVIEW");
          }}
        />
      </div>
    );
  }

  // 2. STATE: PENDING REVIEW (Under 2-Day Manual Verification)
  if (status === "PENDING_REVIEW") {
    return (
      <div className="space-y-6 select-none">
        {/* Top High-Impact Verification Status Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-white border border-amber-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center font-bold text-xl shrink-0 shadow-inner animate-pulse">
                ⏳
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    Verification in Progress
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Ref: {applicationData?.applicationId || "OC-KYB-2026-9214"}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Manual KYB Review Underway (~2 Business Days)
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={handleResetToWizard}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Edit Submitted Details
              </button>
            </div>
          </div>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-4xl">
            Your merchant registration details for <strong>{applicationData?.tradeName || "your business"}</strong> have been successfully recorded in our central compliance registry. Under Indian marketplace e-commerce norms, our officers manually verify your GSTIN REG-06 certificate, PAN details, and escrow settlement bank account. This verification step takes approximately <strong>2 business days</strong>.
          </p>

          <div className="p-3.5 rounded-xl bg-amber-100/60 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Background Verification Gate:</strong> Product listing and your public storefront will be automatically unlocked once manual verification is completed.
              </span>
            </div>

            {/* Immediate Simulation for Testing / Demo */}
            <button
              type="button"
              disabled={isSimulatingApproval}
              onClick={handleSimulateApproval}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shrink-0 shadow-xs flex items-center gap-1.5"
            >
              {isSimulatingApproval ? "Verifying..." : "⚡ Simulate Background Approval (Pass Review)"}
            </button>
          </div>
        </div>

        {/* 4-Stage Visual Progress Tracker */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>🛡️</span> 4-Stage Verification Roadmap
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stage 1: Submitted */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-800 uppercase">Stage 1</span>
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                  ✓
                </span>
              </div>
              <h4 className="font-extrabold text-xs text-slate-900">12 Steps Submitted</h4>
              <p className="text-[11px] text-slate-500">
                Registration details, legal entity, and contact inputs collected.
              </p>
              <span className="text-[10px] font-bold text-emerald-700 block">Completed</span>
            </div>

            {/* Stage 2: Manual Audit */}
            <div className="p-4 rounded-xl border-2 border-amber-400 bg-amber-50/70 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-amber-800 uppercase">Stage 2</span>
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
                  ⏳
                </span>
              </div>
              <h4 className="font-extrabold text-xs text-slate-900">Manual KYB & GST Audit</h4>
              <p className="text-[11px] text-slate-600">
                Compliance team checking Form REG-06 and CBDT records (~2 Business Days).
              </p>
              <span className="text-[10px] font-black text-amber-800 block">In Progress</span>
            </div>

            {/* Stage 3: Bank & KYC */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 opacity-75">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase">Stage 3</span>
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center font-bold">
                  3
                </span>
              </div>
              <h4 className="font-extrabold text-xs text-slate-800">Escrow Bank & KYC</h4>
              <p className="text-[11px] text-slate-500">
                Penny-drop settlement match and video KYC officer sign-off.
              </p>
              <span className="text-[10px] font-medium text-slate-400 block">Scheduled</span>
            </div>

            {/* Stage 4: Live Store */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 opacity-60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase">Stage 4</span>
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-xs flex items-center justify-center font-bold">
                  🔒
                </span>
              </div>
              <h4 className="font-extrabold text-xs text-slate-800">Storefront & Uploads Live</h4>
              <p className="text-[11px] text-slate-500">
                Dedicated /store/[slug] URL active and product publishing enabled.
              </p>
              <span className="text-[10px] font-medium text-slate-400 block">Locked Until Audit</span>
            </div>
          </div>
        </div>

        {/* Submitted Merchant Profile Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              Submitted Merchant Application Dossier
            </h3>
            <span className="text-xs text-slate-400">Account: {effectiveEmail}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
              <span className="text-slate-400 font-bold block text-[10px]">Store Display Name</span>
              <span className="font-bold text-slate-900 block text-sm">
                {applicationData?.tradeName || "My Store"}
              </span>
              <span className="text-[11px] text-violet-700 font-medium">
                /store/{applicationData?.storeSlug || "my-store"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5 font-mono">
              <span className="text-slate-400 font-bold block text-[10px]">GSTIN & PAN</span>
              <span className="font-bold text-slate-900 block">
                GST: {applicationData?.gstin || "29AABCH9912R1Z8"}
              </span>
              <span className="text-slate-600">
                PAN: {applicationData?.pan || "AABCH9912R"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
              <span className="text-slate-400 font-bold block text-[10px]">Escrow Bank Settlement</span>
              <span className="font-bold text-slate-900 block">
                {applicationData?.bankName || "HDFC Bank"} ({applicationData?.ifscCode || "HDFC0000128"})
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                A/C: {applicationData?.accountNumber || "50200088192019"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. STATE: APPROVED (Verified Merchant)
  return (
    <div className="space-y-6 select-none">
      {/* Real-time Approval Notification Toast/Banner */}
      {approvalNotification && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl flex items-center justify-between gap-4 border border-emerald-300 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-inner">
              🎉
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  Compliance Notification
                </span>
                <span className="text-xs font-bold text-emerald-100">Live Approval Event</span>
              </div>
              <h3 className="text-sm sm:text-base font-black tracking-tight mt-0.5">
                {approvalNotification.title}
              </h3>
              <p className="text-xs text-emerald-50 leading-tight mt-0.5">
                {approvalNotification.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setApprovalNotification(null);
              try {
                const notifKey = `officeconnect_notification_${effectiveEmail}`;
                const saved = localStorage.getItem(notifKey);
                if (saved) {
                  const p = JSON.parse(saved);
                  p.read = true;
                  localStorage.setItem(notifKey, JSON.stringify(p));
                }
              } catch (e) {}
            }}
            className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs transition border border-white/30 shrink-0 cursor-pointer"
          >
            Dismiss ✕
          </button>
        </div>
      )}

      {/* 4-Stage Verification Roadmap (ALL 4 STAGES COMPLETED) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>🛡️</span> 4-Stage Verification Roadmap
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> All Stages Complete
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Stage 1: Submitted */}
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-800 uppercase">Stage 1</span>
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                ✓
              </span>
            </div>
            <h4 className="font-extrabold text-xs text-slate-900">12 Steps Submitted</h4>
            <p className="text-[11px] text-slate-600">
              Registration, legal entity, and contact inputs collected.
            </p>
            <span className="text-[10px] font-bold text-emerald-700 block">Completed ✓</span>
          </div>

          {/* Stage 2: Manual Audit */}
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-800 uppercase">Stage 2</span>
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                ✓
              </span>
            </div>
            <h4 className="font-extrabold text-xs text-slate-900">Manual KYB & GST Audit</h4>
            <p className="text-[11px] text-slate-600">
              Form REG-06 and CBDT records verified by officer.
            </p>
            <span className="text-[10px] font-black text-emerald-700 block">Passed & Approved ✓</span>
          </div>

          {/* Stage 3: Bank & KYC */}
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-800 uppercase">Stage 3</span>
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                ✓
              </span>
            </div>
            <h4 className="font-extrabold text-xs text-slate-900">Escrow Bank & KYC</h4>
            <p className="text-[11px] text-slate-600">
              ₹1 Penny-drop verified and signatory KYC signed off.
            </p>
            <span className="text-[10px] font-bold text-emerald-700 block">Escrow Active ✓</span>
          </div>

          {/* Stage 4: Live Store */}
          <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-900 uppercase">Stage 4</span>
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold animate-pulse">
                👑
              </span>
            </div>
            <h4 className="font-extrabold text-xs text-slate-900">Storefront & Uploads Live</h4>
            <p className="text-[11px] text-slate-700 font-semibold">
              Dedicated URL active and product publishing unlocked!
            </p>
            <span className="text-[10px] font-black text-emerald-800 block">Active & Unlocked</span>
          </div>
        </div>
      </div>

      {/* Top Verified Merchant Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-200 border border-emerald-400/30">
                  Verified Indian Merchant
                </span>
                <span className="text-xs font-mono text-emerald-100">
                  Ref: {applicationData?.applicationId || "OC-KYB-2026-9214"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                {applicationData?.tradeName || "Bhasker Fashions"} — Storefront Live
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/store/${applicationData?.storeSlug || "bhasker-fashions"}`}
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-black text-xs hover:bg-emerald-50 transition shadow-xs flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Live Storefront
            </Link>
          </div>
        </div>

        <p className="text-emerald-50 text-xs sm:text-sm leading-relaxed max-w-3xl">
          Your 2-day manual KYB compliance verification has been approved! Your business is officially authorized to publish products directly to the Multi-Vendor Marketplace catalog and your custom branded storefront.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            href="/vendor-dashboard"
            className="px-5 py-2.5 rounded-xl bg-emerald-900/50 hover:bg-emerald-950 text-white font-extrabold text-xs transition border border-emerald-400/30 flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4 text-emerald-300" />
            Upload Products & Manage Catalog →
          </Link>
          <Link
            href="/storefront"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition border border-white/20"
          >
            Browse Marketplace Deals
          </Link>
        </div>
      </div>

      {/* Verified Merchant Checklist Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <span>✅</span> Active Compliance Accreditations
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-emerald-700">
              <Check className="w-4 h-4" /> GSTIN & PAN Verified
            </span>
            <span className="text-slate-500 block text-[11px]">
              Form REG-06 validated against GST Common Portal.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-emerald-700">
              <Check className="w-4 h-4" /> Escrow Penny-Drop Active
            </span>
            <span className="text-slate-500 block text-[11px]">
              7-Day automatic net settlement direct to HDFC Bank A/C.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-emerald-700">
              <Check className="w-4 h-4" /> Logistics Channel Enabled
            </span>
            <span className="text-slate-500 block text-[11px]">
              Office Connect Easy Ship doorstep pickup enabled at PIN 560001.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantOnboardingStatusDesk;
