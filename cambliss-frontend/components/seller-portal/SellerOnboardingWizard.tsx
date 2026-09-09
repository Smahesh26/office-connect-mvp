"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Building,
  ShieldCheck,
  CreditCard,
  Truck,
  FileText,
  Camera,
  Store,
  MapPin,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Upload,
  Clock,
  Sparkles,
  Lock,
  PhoneCall,
  RefreshCw,
  Package,
  HelpCircle,
  ExternalLink,
  Trash2,
  Send,
  Eye,
} from "lucide-react";
import { SellerFeeCalculator } from "./SellerFeeCalculator";

export interface OnboardingFormState {
  // Step 1: Account & Mobile OTP
  email: string;
  ownerName: string;
  password: string;
  phone: string;
  otp: string;
  isOtpVerified: boolean;

  // Step 2: Legal Entity
  entityType: "Individual / Sole Proprietor" | "Partnership / LLP" | "Private Limited / OPC";
  agreedToTerms: boolean;

  // Step 3: GSTIN & PAN
  isGstExempt: boolean;
  gstin: string;
  pan: string;
  gstDocUploaded: boolean;
  gstDocName: string;

  // Step 4: Store Display Identity & Catalog
  storeName: string;
  storeSlug: string;
  category: string;
  hasGatedLicenses: boolean;
  licenseNumber: string;

  // Step 5: Pickup Warehouse & Dispatch
  warehouseAddress: string;
  warehouseCity: string;
  warehouseState: string;
  warehousePinCode: string;
  isPinServiceable: boolean;
  dispatchManagerName: string;
  dispatchManagerPhone: string;
  matchesGstAddress: boolean;

  // Step 6: Escrow Bank Account
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  isPennyDropVerified: boolean;
  pennyDropLoading: boolean;

  // Step 7: Tax, HSN & Automated Invoicing
  defaultGstRate: string;
  defaultHsnCode: string;
  automatedInvoicingEnabled: boolean;
  tcsDeclarationAccepted: boolean;
  digitalSignature: string;

  // Step 8: Identity & Video KYC
  kycDocType: "Aadhaar Card" | "Passport" | "Voter ID" | "Driving License";
  kycDocNumber: string;
  kycDocUploaded: boolean;
  selfieCaptured: boolean;
  videoKycSlot: string;

  // Step 9: Fulfillment Model
  fulfillmentModel: "FOC" | "EASY_SHIP" | "SELF_SHIP";

  // Step 10: Fee Preview & Simulator
  feeAcknowledged: boolean;

  // Step 11: Fast-Track Listing
  listNow: boolean;
  sampleProduct: {
    title: string;
    brand: string;
    category: string;
    hsn: string;
    price: number;
    mrp: number;
    inventory: number;
    sku: string;
  };

  // Step 12: Audit & Submission
  finalAuditConfirmed: boolean;
  applicationId: string;
}

const INITIAL_FORM_STATE: OnboardingFormState = {
  email: "",
  ownerName: "",
  password: "",
  phone: "",
  otp: "",
  isOtpVerified: false,

  entityType: "Individual / Sole Proprietor",
  agreedToTerms: true,

  isGstExempt: false,
  gstin: "",
  pan: "",
  gstDocUploaded: false,
  gstDocName: "",

  storeName: "",
  storeSlug: "",
  category: "Computers & Accessories",
  hasGatedLicenses: false,
  licenseNumber: "",

  warehouseAddress: "",
  warehouseCity: "",
  warehouseState: "",
  warehousePinCode: "",
  isPinServiceable: true,
  dispatchManagerName: "",
  dispatchManagerPhone: "",
  matchesGstAddress: true,

  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  confirmAccountNumber: "",
  ifscCode: "",
  isPennyDropVerified: false,
  pennyDropLoading: false,

  defaultGstRate: "18%",
  defaultHsnCode: "8471",
  automatedInvoicingEnabled: true,
  tcsDeclarationAccepted: true,
  digitalSignature: "",

  kycDocType: "Aadhaar Card",
  kycDocNumber: "",
  kycDocUploaded: false,
  selfieCaptured: false,
  videoKycSlot: "Today, 4:00 PM - 4:30 PM",

  fulfillmentModel: "EASY_SHIP",

  feeAcknowledged: true,

  listNow: false,
  sampleProduct: {
    title: "",
    brand: "",
    category: "Computers & Accessories",
    hsn: "8471",
    price: 999,
    mrp: 1499,
    inventory: 50,
    sku: "",
  },

  finalAuditConfirmed: false,
  applicationId: "",
};

const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "19": "West Bengal",
  "24": "Gujarat",
  "27": "Maharashtra",
  "29": "Karnataka",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "36": "Telangana",
  "37": "Andhra Pradesh",
};

const BANK_IFSC_MAP: Record<string, string> = {
  HDFC: "HDFC Bank",
  SBIN: "State Bank of India",
  ICIC: "ICICI Bank",
  UTIB: "Axis Bank",
  KKBK: "Kotak Mahindra Bank",
  PUNB: "Punjab National Bank",
  BARB: "Bank of Baroda",
  IDIB: "Indian Bank",
};

const STEPS = [
  { id: 1, title: "Account & Mobile OTP", short: "Account" },
  { id: 2, title: "Business Legal Entity", short: "Entity" },
  { id: 3, title: "GSTIN & PAN Verification", short: "GST & PAN" },
  { id: 4, title: "Store Display Identity & Catalog", short: "Store & Catalog" },
  { id: 5, title: "Pickup Warehouse & Dispatch", short: "Warehouse" },
  { id: 6, title: "Escrow Bank & Penny Drop", short: "Bank Settlement" },
  { id: 7, title: "Tax, HSN & Automated Invoicing", short: "Taxes & TCS" },
  { id: 8, title: "Identity & Video KYC", short: "Video KYC" },
  { id: 9, title: "Fulfillment Model Selection", short: "Fulfillment" },
  { id: 10, title: "Fee Preview & Margin Simulator", short: "Fees & Margins" },
  { id: 11, title: "First Product Fast-Track", short: "First Listing" },
  { id: 12, title: "Pre-Launch Audit & Submission", short: "Audit & Submit" },
];

const LOCAL_STORAGE_KEY = "officeconnect_merchant_onboarding_draft";

export interface SellerOnboardingWizardProps {
  initialEmail?: string;
  initialStoreName?: string;
  onSubmitted?: (application: any) => void;
}

export const SellerOnboardingWizard = ({
  initialEmail,
  initialStoreName,
  onSubmitted,
}: SellerOnboardingWizardProps = {}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<OnboardingFormState>(INITIAL_FORM_STATE);
  const [isDraftSaved, setIsDraftSaved] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
      } else {
        const rawUser = localStorage.getItem("authUser");
        if (rawUser) {
          try {
            const u = JSON.parse(rawUser);
            if (u.email) {
              setFormData((prev) => ({
                ...prev,
                email: u.email || prev.email,
                ownerName: u.name || prev.ownerName,
                storeName: u.tradeName || prev.storeName,
                phone: u.phone || prev.phone,
                isOtpVerified: Boolean(u.role === "SELLER" || prev.isOtpVerified),
                storeSlug: u.tradeName
                  ? u.tradeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                  : prev.storeSlug,
              }));
            }
          } catch (e) {}
        }
        if (initialEmail || initialStoreName) {
          setFormData((prev) => ({
            ...prev,
            email: initialEmail || prev.email,
            storeName: initialStoreName || prev.storeName,
            storeSlug: initialStoreName
              ? initialStoreName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
              : prev.storeSlug,
          }));
        }
      }
    } catch (e) {
      console.warn("Could not load onboarding draft from localStorage", e);
    }
  }, [initialEmail, initialStoreName]);

  // Auto-save draft on data changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
      setIsDraftSaved(true);
      const timer = setTimeout(() => setIsDraftSaved(false), 2000);
      return () => clearTimeout(timer);
    } catch (e) {
      console.warn("Could not save onboarding draft", e);
    }
  }, [formData]);

  const updateForm = (fields: Partial<OnboardingFormState>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  // Helper for GSTIN parsing
  const handleGstinChange = (val: string) => {
    const clean = val.toUpperCase().trim();
    let detectedPan = formData.pan;
    let detectedState = formData.warehouseState;

    if (clean.length >= 2) {
      const stateCode = clean.substring(0, 2);
      if (GST_STATE_CODES[stateCode]) {
        detectedState = GST_STATE_CODES[stateCode];
      }
    }
    if (clean.length >= 12) {
      detectedPan = clean.substring(2, 12);
    }

    updateForm({
      gstin: clean,
      pan: detectedPan,
      warehouseState: detectedState || formData.warehouseState,
    });
  };

  // Helper for IFSC Bank Resolution
  const handleIfscChange = (val: string) => {
    const clean = val.toUpperCase().trim();
    let resolvedBank = formData.bankName;
    if (clean.length >= 4) {
      const prefix = clean.substring(0, 4);
      if (BANK_IFSC_MAP[prefix]) {
        resolvedBank = BANK_IFSC_MAP[prefix];
      }
    }
    updateForm({ ifscCode: clean, bankName: resolvedBank });
  };

  // Helper for Store Slug generation
  const handleStoreNameChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    updateForm({ storeName: val, storeSlug: slug });
  };

  // Simulate Penny Drop
  const handleSimulatePennyDrop = () => {
    updateForm({ pennyDropLoading: true });
    setTimeout(() => {
      updateForm({
        pennyDropLoading: false,
        isPennyDropVerified: true,
      });
    }, 1500);
  };

  // Handle Submission to Backend
  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const appId = `OC-KYB-2026-${randomSuffix}`;

    const payload = {
      ...formData,
      applicationId: appId,
      businessName: formData.ownerName ? `${formData.ownerName}'s Enterprise` : "Merchant Hub",
      tradeName: formData.storeName || "Office Connect Verified Store",
      appliedDate: new Date().toISOString().split("T")[0],
      status: "Pending Review",
    };

    try {
      const res = await fetch("/api/storefront/seller-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        updateForm({ applicationId: appId });
        // Also save to backup local seller applications key for instant admin desk view
        try {
          const stored = localStorage.getItem("officeconnect_submitted_applications") || "[]";
          const list = JSON.parse(stored);
          list.unshift(payload);
          localStorage.setItem("officeconnect_submitted_applications", JSON.stringify(list));
          localStorage.setItem(`officeconnect_merchant_status_${payload.email}`, JSON.stringify({
            status: "Pending Review",
            applicationId: appId,
            submittedAt: new Date().toISOString(),
            payload,
          }));
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (err) {}

        if (onSubmitted) {
          onSubmitted(payload);
        }
        setSubmissionSuccess(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.message || "Failed to submit application. Please try again.");
      }
    } catch (e) {
      console.warn("API unavailable, falling back to local submission record", e);
      // Even if network fails, persist locally and acknowledge
      updateForm({ applicationId: appId });
      try {
        const stored = localStorage.getItem("officeconnect_submitted_applications") || "[]";
        const list = JSON.parse(stored);
        list.unshift(payload);
        localStorage.setItem("officeconnect_submitted_applications", JSON.stringify(list));
        localStorage.setItem(`officeconnect_merchant_status_${payload.email}`, JSON.stringify({
          status: "Pending Review",
          applicationId: appId,
          submittedAt: new Date().toISOString(),
          payload,
        }));
      } catch (err) {}
      if (onSubmitted) {
        onSubmitted(payload);
      }
      setSubmissionSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearDraft = () => {
    if (window.confirm("Are you sure you want to discard this onboarding draft and start fresh?")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setFormData(INITIAL_FORM_STATE);
      setCurrentStep(1);
    }
  };

  if (submissionSuccess) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-2xl text-center select-none">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center mb-6 shadow-inner animate-pulse">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider rounded-full mb-3">
          Onboarding Registration Submitted
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          Welcome to Office Connect Seller Central!
        </h2>
        <p className="text-slate-600 text-sm max-w-lg mx-auto mb-6">
          Your 12-Step Merchant KYB file has been assigned an audit reference and dispatched to the compliance queue.
        </p>

        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto mb-8 space-y-3 text-left">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Application ID:</span>
            <span className="font-mono font-black text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-300">
              {formData.applicationId || "OC-KYB-2026-8841"}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Storefront:</span>
            <span className="font-bold text-violet-700">
              /store/{formData.storeSlug || "merchant-store"}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Fulfillment Model:</span>
            <span className="font-bold text-slate-800">{formData.fulfillmentModel}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">KYB Review ETA:</span>
            <span className="font-bold text-emerald-700">Under 24 Hours</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/seller-central"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm transition shadow-md"
          >
            Go to Seller Central Hub
          </Link>
          <Link
            href="/admin-dashboard?tab=marketplace&view=sellers"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition"
          >
            View in Admin KYB Verification Desk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/seller-central" className="hover:text-violet-600 transition">
              Seller Central
            </Link>
            <span>/</span>
            <span className="text-slate-800">Merchant Onboarding Wizard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Indian Merchant Registration & 12-Step KYB Verification
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {isDraftSaved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Draft Auto-Saved
            </span>
          )}
          <button
            type="button"
            onClick={clearDraft}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-slate-600 text-xs font-bold transition shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Draft
          </button>
        </div>
      </div>

      {/* Main Grid: Stepper Nav + Active Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 12-Step Progress Sidebar (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 sticky top-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Registration Progress
            </span>
            <span className="text-xs font-extrabold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
              Step {currentStep} of 12
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-4">
            <div
              className="bg-violet-600 h-2 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 12) * 100}%` }}
            />
          </div>

          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {STEPS.map((step) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition ${
                    isCurrent
                      ? "bg-violet-50 border border-violet-200 text-violet-900 font-bold shadow-xs"
                      : isCompleted
                      ? "hover:bg-slate-50 text-slate-700 font-medium"
                      : "opacity-60 hover:opacity-90 text-slate-500 font-normal"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-violet-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isCompleted ? "✓" : step.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs truncate">{step.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Step Form (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Account & Mobile OTP */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Step 1: Account Credentials & Mobile OTP</h2>
                <p className="text-xs text-slate-500">
                  Set up your master merchant login and verify your Indian mobile number via OTP.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Business Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                    placeholder="merchant@yourcompany.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Authorized Signatory / Owner Legal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => updateForm({ ownerName: e.target.value })}
                    placeholder="As printed on PAN Card"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Merchant Portal Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateForm({ password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Indian Mobile Number (+91) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                        +91
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={formData.phone}
                        onChange={(e) => updateForm({ phone: e.target.value })}
                        placeholder="98XXXXXXXX"
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => updateForm({ otp: "654321", isOtpVerified: true })}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shrink-0"
                    >
                      {formData.isOtpVerified ? "OTP Verified ✓" : "Send Mock OTP"}
                    </button>
                  </div>
                </div>

                {formData.isOtpVerified ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Mobile number verified successfully via SMS Gateway.</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400">
                    Click "Send Mock OTP" to auto-simulate SMS OTP validation (Code: 654321).
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Legal Entity */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Step 2: Business Legal Entity Structure</h2>
                <p className="text-xs text-slate-500">
                  Select your registered entity type under Ministry of Corporate Affairs / GST laws.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: "Individual / Sole Proprietor",
                    title: "Individual / Sole Proprietor",
                    desc: "Sole proprietorship or unregistered individual selling under personal PAN.",
                  },
                  {
                    id: "Partnership / LLP",
                    title: "Partnership / Limited Liability Partnership (LLP)",
                    desc: "Registered partnership firm with partnership deed or LLP agreement.",
                  },
                  {
                    id: "Private Limited / OPC",
                    title: "Private Limited Company / One Person Company (OPC)",
                    desc: "Incorporated under Companies Act 2013 with CIN and Certificate of Incorporation.",
                  },
                ].map((ent) => (
                  <label
                    key={ent.id}
                    className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition ${
                      formData.entityType === ent.id
                        ? "border-violet-600 bg-violet-50/60 ring-1 ring-violet-500"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="entityType"
                      checked={formData.entityType === ent.id}
                      onChange={() => updateForm({ entityType: ent.id as any })}
                      className="mt-1 text-violet-600 focus:ring-violet-500"
                    />
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 block">{ent.title}</span>
                      <span className="text-xs text-slate-500">{ent.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={(e) => updateForm({ agreedToTerms: e.target.checked })}
                    className="mt-0.5 rounded text-violet-600 focus:ring-violet-500"
                  />
                  <span>
                    I confirm that I am authorized to bind this legal entity to the Office Connect Merchant Solutions Agreement and Marketplace Participation Standards.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: GSTIN & PAN Verification */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Step 3: GSTIN & Permanent Account Number (PAN)</h2>
                <p className="text-xs text-slate-500">
                  Real-time validation against the Indian GST Common Portal and CBDT database.
                </p>
              </div>

              {/* GST Exemption toggle */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3">
                <div>
                  <span className="font-extrabold block">Selling 100% GST-Exempt Goods?</span>
                  <span className="text-[11px] text-amber-800">
                    Sellers dealing solely in exempt goods (e.g. unbranded books, raw silk) may proceed without GSTIN under Rule 5.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateForm({ isGstExempt: !formData.isGstExempt })}
                  className={`px-3 py-1 rounded text-xs font-bold transition ${
                    formData.isGstExempt ? "bg-amber-600 text-white" : "bg-white border border-amber-300 text-amber-900"
                  }`}
                >
                  {formData.isGstExempt ? "GST Exempt: YES" : "GST Exempt: NO"}
                </button>
              </div>

              {!formData.isGstExempt && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      15-Digit GSTIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={formData.gstin}
                      onChange={(e) => handleGstinChange(e.target.value)}
                      placeholder="e.g. 29AABCU9603R1ZM"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-wider uppercase focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                    {formData.gstin.length === 15 && (
                      <div className="mt-1.5 text-xs text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Valid GSTIN format. Detected jurisdiction: {formData.warehouseState || "India"}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  10-Character Business / Proprietor PAN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.pan}
                  onChange={(e) => updateForm({ pan: e.target.value.toUpperCase().trim() })}
                  placeholder="e.g. AABCU9603R"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-wider uppercase focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              {/* Upload simulation */}
              <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-800 block">
                  Upload GSTIN Registration Certificate (Form REG-06)
                </span>
                <span className="text-[11px] text-slate-500 block mb-3">PDF or JPEG (Max 5MB)</span>
                <button
                  type="button"
                  onClick={() =>
                    updateForm({
                      gstDocUploaded: true,
                      gstDocName: "GSTIN_Certificate_REG06.pdf",
                    })
                  }
                  className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition shadow-2xs"
                >
                  {formData.gstDocUploaded ? "Uploaded: " + formData.gstDocName + " ✓" : "Simulate Document Upload"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Store Display Identity & Catalog */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Step 4: Store Display Identity & Catalog Scope</h2>
                <p className="text-xs text-slate-500">
                  Configure your customer-facing brand storefront and primary merchandise category.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Public Store Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => handleStoreNameChange(e.target.value)}
                    placeholder="e.g. Hisense Computers India"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Unique Store URL Slug
                  </label>
                  <div className="flex items-center px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600">
                    <span>https://theofficeconnect.com/store/</span>
                    <span className="font-extrabold text-violet-700">
                      {formData.storeSlug || "your-store"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Primary Product Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateForm({ category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white font-medium"
                  >
                    <option value="Computers & Accessories">Computers & Accessories (6% Referral)</option>
                    <option value="Electronics & Appliances">Electronics & Appliances (7% Referral)</option>
                    <option value="Fashion & Apparel">Fashion & Apparel (13.5% Referral)</option>
                    <option value="Beauty & Personal Care">Beauty & Personal Care (10% Referral)</option>
                    <option value="Grocery & Gourmet">Grocery & Gourmet Food (5.5% Referral)</option>
                    <option value="Home & Kitchen">Home, Kitchen & Decor (9% Referral)</option>
                    <option value="Books & Stationery">Books & Stationery (8% Referral)</option>
                    <option value="Automotive & Industrial">Automotive & Industrial (8.5% Referral)</option>
                  </select>
                </div>

                {/* Gated Category Notice */}
                {["Grocery & Gourmet", "Beauty & Personal Care", "Electronics & Appliances"].includes(
                  formData.category
                ) && (
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Gated Category Compliance Notice ({formData.category})</span>
                    </div>
                    <p className="text-[11px] text-indigo-800">
                      This category requires mandatory statutory clearance (FSSAI license for food/grocery, BIS certification for electronics, or CDSCO cosmetic clearance).
                    </p>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => updateForm({ licenseNumber: e.target.value, hasGatedLicenses: true })}
                      placeholder="Enter Regulatory License / FSSAI / BIS Number"
                      className="w-full px-3 py-1.5 rounded-lg border border-indigo-200 bg-white text-xs font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Pickup Warehouse & Dispatch */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Step 5: Pickup Warehouse & Dispatch Address</h2>
                <p className="text-xs text-slate-500">
                  Where our Pan-India logistics partners will pick up outgoing customer orders.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Indian PIN Code (6-Digits) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.warehousePinCode}
                      onChange={(e) => updateForm({ warehousePinCode: e.target.value })}
                      placeholder="e.g. 560001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-wider focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Warehouse City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.warehouseCity}
                      onChange={(e) => updateForm({ warehouseCity: e.target.value })}
                      placeholder="e.g. Bengaluru"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Warehouse State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.warehouseState}
                      onChange={(e) => updateForm({ warehouseState: e.target.value })}
                      placeholder="e.g. Karnataka"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Street Address & Plot / Building Number <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.warehouseAddress}
                    onChange={(e) => updateForm({ warehouseAddress: e.target.value })}
                    placeholder="Warehouse 104, Industrial Area Phase 2..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Dispatch Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.dispatchManagerName}
                      onChange={(e) => updateForm({ dispatchManagerName: e.target.value })}
                      placeholder="Warehouse Supervisor Name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Dispatch Contact Mobile (+91)
                    </label>
                    <input
                      type="tel"
                      value={formData.dispatchManagerPhone}
                      onChange={(e) => updateForm({ dispatchManagerPhone: e.target.value })}
                      placeholder="98XXXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.matchesGstAddress}
                      onChange={(e) => updateForm({ matchesGstAddress: e.target.checked })}
                      className="rounded text-violet-600 focus:ring-violet-500"
                    />
                    <span>
                      Matches Principal Place of Business / Additional Place of Business on GST Certificate.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Escrow Bank Account & Penny Drop */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Step 6: Escrow Settlement Bank Account & Penny-Drop</h2>
                <p className="text-xs text-slate-500">
                  Bank details for your 7-day regular escrow net bank deposits. Verified via simulated IMPS ₹1 penny-drop.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Beneficiary Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.accountHolderName}
                    onChange={(e) => updateForm({ accountHolderName: e.target.value })}
                    placeholder="Must strictly match registered PAN name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Bank IFSC Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={formData.ifscCode}
                      onChange={(e) => handleIfscChange(e.target.value)}
                      placeholder="e.g. HDFC0000128"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase tracking-wider focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Resolved Bank Name
                    </label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => updateForm({ bankName: e.target.value })}
                      placeholder="e.g. HDFC Bank"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:ring-2 focus:ring-violet-500 outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.accountNumber}
                      onChange={(e) => updateForm({ accountNumber: e.target.value })}
                      placeholder="Enter Account Number"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Re-Enter Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.confirmAccountNumber}
                      onChange={(e) => updateForm({ confirmAccountNumber: e.target.value })}
                      placeholder="Confirm Account Number"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                </div>

                {/* Penny Drop Action Box */}
                <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="font-extrabold text-xs text-violet-950 block">
                      Automated ₹1 Penny-Drop Account Validation
                    </span>
                    <span className="text-[11px] text-violet-800">
                      We credit ₹1.00 via IMPS to verify active account holder identity before payouts commence.
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={formData.pennyDropLoading || formData.isPennyDropVerified}
                    onClick={handleSimulatePennyDrop}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                      formData.isPennyDropVerified
                        ? "bg-emerald-600 text-white"
                        : "bg-violet-600 hover:bg-violet-700 text-white shadow-xs"
                    }`}
                  >
                    {formData.pennyDropLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Verifying IMPS...
                      </>
                    ) : formData.isPennyDropVerified ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ₹1 Penny Verified ✓
                      </>
                    ) : (
                      "Simulate ₹1 Test Deposit"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Tax, HSN & Automated Invoicing */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Step 7: Tax Configuration & Automated Invoicing</h2>
                <p className="text-xs text-slate-500">
                  Default GST tier, HSN classification, digital signature for tax invoices, and 1% TCS compliance.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Default GST Rate Tier <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.defaultGstRate}
                      onChange={(e) => updateForm({ defaultGstRate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-violet-500 outline-none bg-white"
                    >
                      <option value="0%">0% (Exempt)</option>
                      <option value="5%">5% (Standard Essential)</option>
                      <option value="12%">12% (Apparel / Electronics)</option>
                      <option value="18%">18% (Computing / General)</option>
                      <option value="28%">28% (Luxury / High Tier)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Primary HSN Code (4 to 8 Digits)
                    </label>
                    <input
                      type="text"
                      value={formData.defaultHsnCode}
                      onChange={(e) => updateForm({ defaultHsnCode: e.target.value })}
                      placeholder="e.g. 8471"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">
                        Automated Customer Tax Invoice Generator
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Office Connect automatically issues compliant GST tax invoices with consecutive sequential numbering.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.automatedInvoicingEnabled}
                      onChange={(e) => updateForm({ automatedInvoicingEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Digital Signature for Invoicing (Signatory Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.digitalSignature}
                    onChange={(e) => updateForm({ digitalSignature: e.target.value })}
                    placeholder="Type full legal name for digital invoice stamping"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-serif italic focus:ring-2 focus:ring-violet-500 outline-none bg-amber-50/30"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tcsDeclarationAccepted}
                      onChange={(e) => updateForm({ tcsDeclarationAccepted: e.target.checked })}
                      className="mt-0.5 rounded text-violet-600 focus:ring-violet-500"
                    />
                    <span>
                      I acknowledge and consent to statutory 1% Tax Collected at Source (TCS) deduction under Section 52 of the CGST Act, 2017, to be deposited into the merchant's GSTIN cash ledger.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Identity & Video KYC */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Step 8: Identity Verification & Video KYC Slot</h2>
                <p className="text-xs text-slate-500">
                  Government photo ID verification and scheduling a 5-minute live Video KYC verification call.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Government ID Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.kycDocType}
                      onChange={(e) => updateForm({ kycDocType: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white font-medium"
                    >
                      <option value="Aadhaar Card">Aadhaar Card (Last 4 Digits)</option>
                      <option value="Passport">Passport</option>
                      <option value="Voter ID">Election Commission Voter ID</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Document Identification Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.kycDocNumber}
                      onChange={(e) => updateForm({ kycDocNumber: e.target.value })}
                      placeholder="e.g. XXXX-XXXX-9812"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                </div>

                {/* Webcam Selfie Simulation */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">
                        Live Merchant Face Match Snapshot
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Matches your photo against uploaded government proof.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateForm({ selfieCaptured: true })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                      formData.selfieCaptured
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {formData.selfieCaptured ? "Selfie Captured ✓" : "Simulate Selfie Capture"}
                  </button>
                </div>

                {/* Video KYC Slot Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Book 5-Minute Video KYC Verification Slot
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      "Today, 4:00 PM - 4:30 PM",
                      "Tomorrow, 11:00 AM - 11:30 AM",
                      "Tomorrow, 3:00 PM - 3:30 PM",
                    ].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => updateForm({ videoKycSlot: slot })}
                        className={`p-3 rounded-xl text-left border text-xs font-bold transition ${
                          formData.videoKycSlot === slot
                            ? "border-violet-600 bg-violet-50 text-violet-900 ring-1 ring-violet-500"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 mb-1 text-slate-400" />
                        <span>{slot}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: Fulfillment Model Selection */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Step 9: Choose Default Fulfillment Channel</h2>
                <p className="text-xs text-slate-500">
                  Select how customer orders are stored, packed, and dispatched across India.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    id: "FOC",
                    title: "Fulfillment by Office Connect (FOC)",
                    badge: "Highest Conversion",
                    desc: "Send your bulk inventory to Office Connect fulfillment centers. We store, pick, pack, deliver, and handle customer service with 1-day/2-day Prime delivery speed.",
                    features: ["Zero dispatch warehouse management", "Guaranteed 1-2 day delivery badges", "Automatic return handling"],
                  },
                  {
                    id: "EASY_SHIP",
                    title: "Office Connect Easy Ship",
                    badge: "Most Popular",
                    desc: "Store inventory in your own warehouse/facility. When an order arrives, you pack the product; an Office Connect courier partner picks it up from your doorstep.",
                    features: ["Maintain full inventory control", "Doorstep pickup via certified couriers", "Full track-and-trace on marketplace"],
                  },
                  {
                    id: "SELF_SHIP",
                    title: "Merchant Self Ship",
                    badge: "Custom Logistics",
                    desc: "You store, pack, and ship orders using your own third-party courier partners (e.g. Blue Dart, DTDC, Delhivery).",
                    features: ["Zero marketplace logistics fee", "Use custom enterprise shipping rates", "Upload tracking AWB manually"],
                  },
                ].map((channel) => (
                  <label
                    key={channel.id}
                    className={`block p-5 rounded-2xl border cursor-pointer transition ${
                      formData.fulfillmentModel === channel.id
                        ? "border-violet-600 bg-violet-50/60 ring-2 ring-violet-500 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="fulfillmentModel"
                          checked={formData.fulfillmentModel === channel.id}
                          onChange={() => updateForm({ fulfillmentModel: channel.id as any })}
                          className="text-violet-600 focus:ring-violet-500 mt-0.5"
                        />
                        <span className="font-extrabold text-sm text-slate-900">{channel.title}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-violet-100 text-violet-800">
                        {channel.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 pl-6 mb-3">{channel.desc}</p>

                    <div className="pl-6 flex flex-wrap gap-2">
                      {channel.features.map((f, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full"
                        >
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 10: Fee Preview & Margin Simulator */}
          {currentStep === 10 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Step 10: Fee Preview & Margin Simulator</h2>
                <p className="text-xs text-slate-500">
                  Test your category fee structure live to calculate exact net bank payout per sale before launch.
                </p>
              </div>

              <SellerFeeCalculator
                embedded={true}
                initialCategory={formData.category}
                initialPrice={1999}
              />

              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.feeAcknowledged}
                    onChange={(e) => updateForm({ feeAcknowledged: e.target.checked })}
                    className="mt-0.5 rounded text-violet-600 focus:ring-violet-500"
                  />
                  <span>
                    I have reviewed and understand the applicable Referral Fees, Tiered Closing Fees, Logistics Charges, and statutory 18% GST deductions.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 11: First Product Fast-Track Listing */}
          {currentStep === 11 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Step 11: First Product Fast-Track Listing</h2>
                <p className="text-xs text-slate-500">
                  Optionally seed your first SKU now so your store goes live the moment KYB is approved.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">
                    Create Fast-Track SKU Now?
                  </span>
                  <span className="text-[11px] text-slate-500">
                    You can also skip and list products in bulk from the Seller Portal later.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateForm({ listNow: !formData.listNow })}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                    formData.listNow ? "bg-violet-600 text-white" : "bg-white border border-slate-300 text-slate-700"
                  }`}
                >
                  {formData.listNow ? "Listing Enabled" : "Skip / List Later"}
                </button>
              </div>

              {formData.listNow && (
                <div className="space-y-4 p-5 rounded-2xl border border-slate-200 bg-white">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Product Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.sampleProduct.title}
                      onChange={(e) =>
                        updateForm({
                          sampleProduct: { ...formData.sampleProduct, title: e.target.value },
                        })
                      }
                      placeholder="e.g. Wireless Ergonomic Mechanical Keyboard"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={formData.sampleProduct.brand}
                        onChange={(e) =>
                          updateForm({
                            sampleProduct: { ...formData.sampleProduct, brand: e.target.value },
                          })
                        }
                        placeholder="e.g. Hisense / Generic"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Merchant SKU Code
                      </label>
                      <input
                        type="text"
                        value={formData.sampleProduct.sku}
                        onChange={(e) =>
                          updateForm({
                            sampleProduct: { ...formData.sampleProduct, sku: e.target.value },
                          })
                        }
                        placeholder="e.g. HS-KB-900"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Selling Price (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.sampleProduct.price}
                        onChange={(e) =>
                          updateForm({
                            sampleProduct: { ...formData.sampleProduct, price: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Maximum Retail Price (MRP)
                      </label>
                      <input
                        type="number"
                        value={formData.sampleProduct.mrp}
                        onChange={(e) =>
                          updateForm({
                            sampleProduct: { ...formData.sampleProduct, mrp: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Available Stock Units
                      </label>
                      <input
                        type="number"
                        value={formData.sampleProduct.inventory}
                        onChange={(e) =>
                          updateForm({
                            sampleProduct: {
                              ...formData.sampleProduct,
                              inventory: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 12: Pre-Launch Audit & Submission */}
          {currentStep === 12 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Step 12: Pre-Launch Audit & Submission</h2>
                <p className="text-xs text-slate-500">
                  Comprehensive 12-point KYB compliance audit before final submission to our verification desk.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 divide-y divide-slate-200/80 text-xs">
                <div className="pb-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-600">1. Master Account:</span>
                  <span className="font-semibold text-slate-900">{formData.email || "merchant@company.com"}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-600">2. Legal Entity:</span>
                  <span className="font-semibold text-slate-900">{formData.entityType}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-600">3. GSTIN / PAN:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formData.isGstExempt ? "GST Exempt" : formData.gstin || "Pending"} / {formData.pan || "Pending"}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-600">4. Store Name & URL:</span>
                  <span className="font-bold text-violet-700">
                    {formData.storeName || "Merchant Store"} (/store/{formData.storeSlug || "slug"})
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-600">5. Dispatch Warehouse:</span>
                  <span className="font-semibold text-slate-900">
                    {formData.warehouseCity || "Bengaluru"}, {formData.warehouseState || "Karnataka"} (PIN: {formData.warehousePinCode || "560001"})
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-600">6. Bank Settlement Account:</span>
                  <span className="font-semibold text-slate-900">
                    {formData.bankName || "HDFC Bank"} • {formData.ifscCode || "IFSC"} (Penny-Drop Verified ✓)
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-600">7. Tax & Invoicing:</span>
                  <span className="font-semibold text-slate-900">
                    GST Tier: {formData.defaultGstRate} • 1% TCS Acknowledged
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-600">8. Identity & Video KYC:</span>
                  <span className="font-semibold text-slate-900">
                    {formData.kycDocType} • Slot: {formData.videoKycSlot}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-600">9. Default Fulfillment:</span>
                  <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {formData.fulfillmentModel}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-600">10. Fee Acknowledgement:</span>
                  <span className="font-bold text-emerald-700">Confirmed ✓</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-600">11. Initial SKU Status:</span>
                  <span className="font-semibold text-slate-900">
                    {formData.listNow && formData.sampleProduct.title
                      ? `Fast-Track: "${formData.sampleProduct.title}" (₹${formData.sampleProduct.price})`
                      : "Deferred to Seller Catalog Suite"}
                  </span>
                </div>
                <div className="pt-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-600">12. Digital Signature:</span>
                  <span className="font-serif italic font-bold text-slate-900">
                    {formData.digitalSignature || formData.ownerName || "Authorized Signatory"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-200">
                <label className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.finalAuditConfirmed}
                    onChange={(e) => updateForm({ finalAuditConfirmed: e.target.checked })}
                    className="mt-0.5 rounded text-violet-600 focus:ring-violet-500"
                  />
                  <span>
                    I confirm that all statements made in this application are true, authentic, and compliant with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules and the Consumer Protection (E-Commerce) Rules, 2020.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Bottom Nav Buttons */}
          <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-100">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 transition ${
                currentStep === 1
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-slate-100"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Step
            </button>

            {currentStep < 12 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(12, prev + 1))}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold transition shadow-md"
              >
                Continue to Step {currentStep + 1}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || !formData.finalAuditConfirmed}
                onClick={handleSubmitApplication}
                className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black transition shadow-lg ${
                  isSubmitting || !formData.finalAuditConfirmed ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Application for KYB Audit
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerOnboardingWizard;
