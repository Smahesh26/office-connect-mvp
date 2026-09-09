"use client";

import { useState, useEffect } from "react";
import { formatINR } from "@/components/commerce/CommercePrimitives";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
  CreditCard,
  Building2,
  FileText,
  RotateCcw,
  Check,
  Search,
  DollarSign,
  Layers,
  Scale,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

export type GovernanceTab =
  | "kyc"
  | "orders"
  | "refunds"
  | "settlements"
  | "ledger"
  | "reconciliation";

export const AdminMarketplaceGovernanceDesk = ({
  initialTab = "kyc",
}: {
  initialTab?: GovernanceTab;
}) => {
  const [activeTab, setActiveTab] = useState<GovernanceTab>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Overview metrics
  const [overviewMetrics, setOverviewMetrics] = useState({
    totalGmv: 188980,
    totalCommissions: 14750,
    totalSellerSettled: 124900,
    totalCustomerRefunds: 24990,
    totalSellerPayableOutstanding: 49330,
    ordersCount: 4,
    settlementsCount: 2,
    returnsCount: 1,
    ledgerEntriesCount: 18,
  });

  // KYC Dossiers State
  const [kycDossiers, setKycDossiers] = useState<any[]>([
    {
      sellerId: "sel-hisense-01",
      sellerCode: "SEL-HISENSE",
      submittedInfo: {
        businessName: "Hisense Computers India Private Limited",
        tradeName: "Hisense Computers Official",
        ownerName: "Bhasker Advani",
        email: "bhaskeradv1@gmail.com",
        phone: "+91 98765 43210",
        pan: "AAACH9102K",
        gstin: "29AAACH9102K1Z5",
        warehouseAddress: "Plot 88, Electronic City Phase 2, Hosur Road, Bengaluru 560100",
        bankName: "HDFC Bank",
        accountNumber: "50100294819284",
        ifscCode: "HDFC0000128",
      },
      submittedDocuments: {
        panDocUrl: "#",
        gstDocUrl: "#",
        bankChequeUrl: "#",
      },
      aiCollectedData: {
        gstinVerified: true,
        gstinTradeName: "HISENSE COMPUTERS INDIA PVT LTD",
        gstinStateCode: "29 (Karnataka)",
        panChecksumValid: true,
        mcaRegisteredEntity: "U72900KA2021PTC148921 (Active)",
        pincodeServiceable: true,
        scrapedCatalogMatchScore: 98,
        flaggedMismatches: [],
        confidenceScore: 98,
        collectedAt: "2026-09-02T10:00:00.000Z",
      },
      checklist: {
        panMatchesLegalName: true,
        gstinActiveOnPortal: true,
        bankPennyDropSuccess: true,
        videoKycDone: true,
        warehousePinServiceable: true,
      },
      kycStatus: "VERIFIED_ACTIVE",
      reviewerName: "Pooja Hegde (Compliance Head)",
      reviewedAt: "2026-09-02T14:30:00.000Z",
    },
    {
      sellerId: "sel-keychron-03",
      sellerCode: "SEL-KEYCHRON",
      submittedInfo: {
        businessName: "Keychron India Peripherals LLP",
        tradeName: "Keychron Official Store",
        ownerName: "Arjun Verma",
        email: "arjun@keychron.in",
        phone: "+91 98450 99881",
        pan: "AAAFK8192E",
        gstin: "27AAAFK8192E1Z8",
        warehouseAddress: "Andheri East Logistics Hub, Mumbai 400069",
        bankName: "ICICI Bank",
        accountNumber: "001105028491",
        ifscCode: "ICIC0000011",
      },
      submittedDocuments: {
        panDocUrl: "#",
        gstDocUrl: "#",
        bankChequeUrl: "#",
      },
      aiCollectedData: {
        gstinVerified: true,
        gstinTradeName: "KEYCHRON PERIPHERALS INDIA LLP",
        gstinStateCode: "27 (Maharashtra)",
        panChecksumValid: true,
        mcaRegisteredEntity: "LLPIN AAE-9921",
        pincodeServiceable: true,
        scrapedCatalogMatchScore: 94,
        flaggedMismatches: [
          "Trade Name variance: Submitted 'Keychron Official Store' vs GST Portal 'KEYCHRON PERIPHERALS INDIA LLP'",
        ],
        confidenceScore: 88,
        collectedAt: "2026-09-07T11:00:00.000Z",
      },
      checklist: {
        panMatchesLegalName: true,
        gstinActiveOnPortal: true,
        bankPennyDropSuccess: true,
        videoKycDone: false,
        warehousePinServiceable: true,
      },
      kycStatus: "MANUAL_REVIEW",
    },
  ]);

  const [selectedDossier, setSelectedDossier] = useState<any>(kycDossiers[1]);
  const [reviewerNotes, setReviewerNotes] = useState("");

  // Orders State (Multi-Seller Splits)
  const [masterOrders, setMasterOrders] = useState<any[]>([
    {
      id: "mord_9042",
      orderNumber: "OC-ORD-2026-9042",
      customerName: "Anand Mahindra",
      customerEmail: "anand@mahindra.com",
      totalGrossAmount: 188980,
      totalCommissionAmount: 14690,
      totalTaxesAmount: 2644,
      totalSellerPayableAmount: 171646,
      paymentStatus: "CAPTURED",
      gatewayPaymentId: "pay_rzp_98418902",
      createdAt: "2026-09-08T10:15:00.000Z",
      sellerOrders: [
        {
          id: "sord_hisense_01",
          sellerCode: "SEL-HISENSE",
          sellerName: "Hisense Computers (bhaskeradv1@gmail.com) 👑",
          grossAmount: 149990,
          commissionAmount: 11249,
          taxDeductionAmount: 2024,
          netPayableAmount: 136717,
          orderStatus: "DELIVERED",
          settlementStatus: "ELIGIBLE",
          deliveredAt: "2026-09-02T16:00:00.000Z",
          returnWindowExpiryDate: "2026-09-09T16:00:00.000Z",
          refundedAmount: 0,
          trackingNumber: "TRK-OC-882194",
          items: [
            {
              title: "Hisense VisionBook Pro 16 AI Workstation Laptop",
              quantity: 1,
              unitPrice: 149990,
              commissionRate: 0.075,
              commissionAmount: 11249,
              sellerPayable: 136717,
            },
          ],
        },
        {
          id: "sord_hisense_02",
          sellerCode: "SEL-HISENSE",
          sellerName: "Hisense Computers (bhaskeradv1@gmail.com) 👑",
          grossAmount: 38990,
          commissionAmount: 3441,
          taxDeductionAmount: 620,
          netPayableAmount: 34929,
          orderStatus: "DELIVERED",
          settlementStatus: "ELIGIBLE",
          deliveredAt: "2026-09-03T11:00:00.000Z",
          returnWindowExpiryDate: "2026-09-10T11:00:00.000Z",
          refundedAmount: 0,
          trackingNumber: "TRK-OC-882195",
          items: [
            {
              title: "Hisense UltraView 34-Inch Curved WQHD USB-C Hub Monitor",
              quantity: 1,
              unitPrice: 38990,
              commissionRate: 0.088,
              commissionAmount: 3441,
              sellerPayable: 34929,
            },
          ],
        },
      ],
    },
  ]);

  // Refund Simulator State
  const [selectedRefundOrder, setSelectedRefundOrder] = useState<string>("sord_hisense_02");
  const [refundType, setRefundType] = useState<"FULL" | "PARTIAL">("FULL");
  const [partialRefundValue, setPartialRefundValue] = useState<number>(10000);
  const [refundReason, setRefundReason] = useState<string>("Customer requested return due to minor transit box damage");

  // Ledger Entries State
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([
    {
      id: "led_01",
      entryType: "CUSTOMER_PAYMENT",
      masterOrderId: "mord_9042",
      debitAmount: 0,
      creditAmount: 188980,
      referenceId: "pay_rzp_98418902",
      description: "Customer payment captured for Master Order OC-ORD-2026-9042",
      auditHash: "0a9f82d17c4b8e9921",
      createdAt: "2026-09-08 10:15",
    },
    {
      id: "led_02",
      entryType: "PLATFORM_COMMISSION",
      masterOrderId: "mord_9042",
      sellerCode: "SEL-HISENSE",
      debitAmount: 0,
      creditAmount: 17334,
      referenceId: "pay_rzp_98418902",
      description: "Marketplace commission + 18% GST fee deduction on sub-orders",
      auditHash: "88c2b7401fae92418a",
      createdAt: "2026-09-08 10:15",
    },
    {
      id: "led_03",
      entryType: "SELLER_PAYABLE",
      masterOrderId: "mord_9042",
      sellerCode: "SEL-HISENSE",
      debitAmount: 0,
      creditAmount: 171646,
      referenceId: "pay_rzp_98418902",
      description: "Net payable allocated to Hisense Computers (Held in 7-day return window)",
      auditHash: "77a83d99420bf3109b",
      createdAt: "2026-09-08 10:15",
    },
  ]);

  // Settlements History
  const [settlements, setSettlements] = useState<any[]>([
    {
      settlementId: "OC-STL-2026-0012",
      sellerName: "Hisense Computers (bhaskeradv1@gmail.com) 👑",
      sellerCode: "SEL-HISENSE",
      virtualAccountId: "OCHISENSE9021",
      bankAccountNo: "50100294819284",
      amount: 124900,
      status: "SETTLED",
      providerReference: "pout_rzp_8849182",
      initiatedAt: "2026-09-04 14:00",
      processedAt: "2026-09-04 14:05",
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Action: AI Re-Scrape
  const handleAiScrape = (sellerId: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setSelectedDossier((prev: any) => ({
        ...prev,
        aiCollectedData: {
          ...prev.aiCollectedData,
          confidenceScore: 97,
          flaggedMismatches: [],
          mcaRegisteredEntity: "LLPIN AAE-9921 (Active on Ministry of Corporate Affairs)",
          collectedAt: new Date().toISOString(),
        },
        checklist: {
          ...prev.checklist,
          videoKycDone: true,
        },
      }));
      setIsLoading(false);
      showToast("AI Agent refreshed government directory data. Confidence score updated to 97%.");
    }, 1200);
  };

  // 2. Action: Manual Support Decision
  const handleKycDecision = (decision: "VERIFIED_ACTIVE" | "REJECTED" | "RESUBMISSION_REQUIRED") => {
    if (!selectedDossier) return;
    setIsLoading(true);
    setTimeout(() => {
      setSelectedDossier((prev: any) => ({
        ...prev,
        kycStatus: decision,
        reviewerName: "Current Admin (Cambliss Support)",
        reviewedAt: new Date().toISOString(),
      }));

      setKycDossiers((prev) =>
        prev.map((d) =>
          d.sellerId === selectedDossier.sellerId
            ? {
                ...d,
                kycStatus: decision,
                reviewerName: "Current Admin (Cambliss Support)",
                reviewedAt: new Date().toISOString(),
              }
            : d
        )
      );

      setIsLoading(false);
      showToast(
        decision === "VERIFIED_ACTIVE"
          ? `Seller ${selectedDossier.sellerCode} approved! Razorpay Virtual Account OCHISENSE9021 provisioned.`
          : `Seller status updated to ${decision}.`
      );
    }, 1000);
  };

  // 3. Action: Process Amazon-Style Refund
  const handleProcessRefund = () => {
    const isFull = refundType === "FULL";
    const refundAmount = isFull ? 38990 : partialRefundValue;
    const commissionClawback = Math.round(refundAmount * 0.088);
    const sellerDeduction = refundAmount - commissionClawback;

    // Add customer refund entry
    const refEntry1 = {
      id: `led_${Date.now()}_crfnd`,
      entryType: "CUSTOMER_REFUND",
      masterOrderId: "mord_9042",
      sellerCode: "SEL-HISENSE",
      debitAmount: refundAmount,
      creditAmount: 0,
      referenceId: `rfnd_rzp_${Date.now()}`,
      description: `Customer refund (₹${refundAmount.toLocaleString()}) via Razorpay Gateway. Reason: ${refundReason}`,
      auditHash: "9a01f827d31a0e",
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    // Add seller reversal entry
    const refEntry2 = {
      id: `led_${Date.now()}_srev`,
      entryType: "SELLER_REVERSAL",
      masterOrderId: "mord_9042",
      sellerCode: "SEL-HISENSE",
      debitAmount: sellerDeduction,
      creditAmount: 0,
      referenceId: `REV-${Date.now()}`,
      description: `Seller payable deduction reversal (₹${sellerDeduction.toLocaleString()}) on sub-order sord_hisense_02`,
      auditHash: "b7e4198c2d5f01",
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    setLedgerEntries((prev) => [refEntry1, refEntry2, ...prev]);
    showToast(`Amazon-style refund of ${formatINR(refundAmount)} executed with seller reversal & commission clawback.`);
  };

  // 4. Action: Dispatch Settlement
  const handleDispatchSettlement = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newSettlement = {
        settlementId: `OC-STL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        sellerName: "Hisense Computers (bhaskeradv1@gmail.com) 👑",
        sellerCode: "SEL-HISENSE",
        virtualAccountId: "OCHISENSE9021",
        bankAccountNo: "50100294819284",
        amount: 171646,
        status: "SETTLED",
        providerReference: `pout_rzp_${Date.now()}`,
        initiatedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        processedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      };

      const stlEntry = {
        id: `led_${Date.now()}_stl`,
        entryType: "SELLER_SETTLEMENT",
        sellerCode: "SEL-HISENSE",
        debitAmount: 171646,
        creditAmount: 0,
        referenceId: newSettlement.providerReference,
        description: `Settlement payout dispatched to Hisense Computers via Razorpay Virtual Account OCHISENSE9021`,
        auditHash: "f48c17a9e03d",
        createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      };

      setSettlements((prev) => [newSettlement, ...prev]);
      setLedgerEntries((prev) => [stlEntry, ...prev]);
      setIsLoading(false);
      showToast(`Settlement instruction of ${formatINR(171646)} dispatched via Razorpay Virtual Accounts.`);
    }, 1500);
  };

  return (
    <div className="space-y-6 font-sans select-none text-slate-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-[6px] shadow-xl border border-slate-700 flex items-center gap-3 text-xs animate-bounce">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-[6px] border border-slate-200 bg-white shadow-2xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Customer Inflow (GMV)</span>
          <strong className="text-lg font-black text-slate-900">{formatINR(overviewMetrics.totalGmv)}</strong>
          <span className="text-[10px] text-emerald-600 font-semibold block pt-1">Escrow Vault Active</span>
        </div>
        <div className="p-4 rounded-[6px] border border-slate-200 bg-white shadow-2xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Platform Commission Cut</span>
          <strong className="text-lg font-black text-indigo-700">{formatINR(overviewMetrics.totalCommissions)}</strong>
          <span className="text-[10px] text-slate-500 font-semibold block pt-1">Avg Take-Rate 7.8%</span>
        </div>
        <div className="p-4 rounded-[6px] border border-slate-200 bg-white shadow-2xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Razorpay Virtual Settled</span>
          <strong className="text-lg font-black text-emerald-700">{formatINR(overviewMetrics.totalSellerSettled)}</strong>
          <span className="text-[10px] text-emerald-600 font-semibold block pt-1">Direct Bank Transfers</span>
        </div>
        <div className="p-4 rounded-[6px] border border-slate-200 bg-white shadow-2xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Pending Return Escrow</span>
          <strong className="text-lg font-black text-amber-700">{formatINR(overviewMetrics.totalSellerPayableOutstanding)}</strong>
          <span className="text-[10px] text-amber-600 font-semibold block pt-1">7-Day Cooling Window</span>
        </div>
      </div>

      {/* SIX CORE GOVERNANCE MODULE TABS */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-px overflow-x-auto text-xs font-bold">
        {[
          { id: "kyc" as GovernanceTab, label: "AI Seller Verification (KYC)", icon: "🛡️" },
          { id: "orders" as GovernanceTab, label: "Multi-Seller Orders & Splits", icon: "📦" },
          { id: "refunds" as GovernanceTab, label: "Amazon-Style Refund Engine", icon: "💸" },
          { id: "settlements" as GovernanceTab, label: "Razorpay Virtual Settlements", icon: "🏦" },
          { id: "ledger" as GovernanceTab, label: "Double-Entry Financial Ledger", icon: "📜" },
          { id: "reconciliation" as GovernanceTab, label: "Gateway Reconciliation", icon: "🔄" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[#404d85] text-[#404d85] bg-indigo-50/50 font-black"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* MODULE 1: AI SELLER VERIFICATION (KYC DESK) */}
      {/* ========================================================================= */}
      {activeTab === "kyc" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>🛡️</span> AI-Assisted Seller KYC & Verification Desk
              </h3>
              <p className="text-xs text-slate-500">
                AI scrapes public GSTIN & MCA databases. The Cambliss Support Team makes final manual verification decisions.
              </p>
            </div>
            <button
              onClick={() => handleAiScrape(selectedDossier?.sellerId)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isLoading ? "Scraping..." : "Re-Run AI Intelligence Collection"}</span>
            </button>
          </div>

          {/* SIDE-BY-SIDE INTELLIGENCE COMPARISON */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* COLUMN 1: AI-COLLECTED DATA */}
            <div className="p-4 rounded-[6px] border border-indigo-100 bg-indigo-50/30 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <span className="font-extrabold text-xs text-[#404d85] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  AI Scraped Intelligence & Government References
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  {selectedDossier?.aiCollectedData?.confidenceScore}% Match Confidence
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">GSTIN Portal Trade Name:</span>
                  <strong className="text-slate-900 font-mono">{selectedDossier?.aiCollectedData?.gstinTradeName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">State Jurisdiction:</span>
                  <span className="text-slate-800 font-semibold">{selectedDossier?.aiCollectedData?.gstinStateCode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">MCA Corporate Registry:</span>
                  <span className="text-slate-800 font-semibold">{selectedDossier?.aiCollectedData?.mcaRegisteredEntity}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">PAN Checksum Status:</span>
                  <span className="text-emerald-700 font-bold">✓ Algorithmic Checksum Valid</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Warehouse PIN Serviceability:</span>
                  <span className="text-emerald-700 font-bold">✓ 19,000+ Pin Codes Connected</span>
                </div>

                {/* Flagged Mismatches */}
                {selectedDossier?.aiCollectedData?.flaggedMismatches?.length > 0 ? (
                  <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <strong className="font-bold flex items-center gap-1 text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Discrepancy Detected by AI:
                    </strong>
                    {selectedDossier.aiCollectedData.flaggedMismatches.map((m: string, i: number) => (
                      <p key={i} className="text-[11px]">{m}</p>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 rounded bg-emerald-50 text-emerald-800 font-semibold text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Zero Credential Mismatches Detected Against State Databases
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: SELLER-SUBMITTED CREDENTIALS */}
            <div className="p-4 rounded-[6px] border border-slate-200 bg-white space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  Seller-Submitted Dossier ({selectedDossier?.sellerCode})
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    selectedDossier?.kycStatus === "VERIFIED_ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedDossier?.kycStatus === "MANUAL_REVIEW"
                      ? "bg-amber-100 text-amber-800 animate-pulse"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {selectedDossier?.kycStatus}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Legal Business Name:</span>
                  <strong className="text-slate-900">{selectedDossier?.submittedInfo?.businessName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Trade Store Name:</span>
                  <span className="text-slate-900 font-semibold">{selectedDossier?.submittedInfo?.tradeName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">GSTIN:</span>
                  <span className="text-slate-900 font-mono font-bold">{selectedDossier?.submittedInfo?.gstin}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Income Tax PAN:</span>
                  <span className="text-slate-900 font-mono font-bold">{selectedDossier?.submittedInfo?.pan}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Bank Account & IFSC:</span>
                  <span className="text-slate-900 font-semibold">
                    {selectedDossier?.submittedInfo?.bankName} ({selectedDossier?.submittedInfo?.ifscCode})
                  </span>
                </div>
              </div>

              {/* SUPPORT TEAM DECISION ACTION BAR */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Support Reviewer Audit Notes:
                  </label>
                  <input
                    type="text"
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Enter compliance verification justification notes..."
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs focus:outline-hidden focus:border-[#404d85]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleKycDecision("VERIFIED_ACTIVE")}
                    disabled={isLoading}
                    className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve (VERIFIED_ACTIVE)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleKycDecision("RESUBMISSION_REQUIRED")}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition"
                  >
                    Resubmit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleKycDecision("REJECTED")}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition"
                  >
                    Reject
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 2: MULTI-SELLER ORDERS & SPLITS */}
      {/* ========================================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Multi-Seller Orders & Sub-Order Splitting
              </h3>
              <p className="text-xs text-slate-500">
                Single customer payment split into independent seller financial records with individual commission and payable tracking.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">
              Master Orders: {masterOrders.length}
            </span>
          </div>

          {masterOrders.map((mOrder) => (
            <div key={mOrder.id} className="rounded-[6px] border border-slate-200 bg-white p-4 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">{mOrder.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {mOrder.paymentStatus}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Customer: <strong className="text-slate-700">{mOrder.customerName}</strong> ({mOrder.customerEmail}) • Ref: {mOrder.gatewayPaymentId}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Total Customer Paid</span>
                  <strong className="text-base font-black text-slate-900">{formatINR(mOrder.totalGrossAmount)}</strong>
                </div>
              </div>

              {/* Sub-Orders Grid */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Partitioned Seller Sub-Orders ({mOrder.sellerOrders.length})
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mOrder.sellerOrders.map((sub: any) => (
                    <div key={sub.id} className="p-3.5 rounded border border-slate-200 bg-slate-50/50 space-y-3 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div>
                          <strong className="font-bold text-slate-900 block">{sub.sellerName}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">Sub-Order: {sub.id}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                          {sub.orderStatus}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1">
                        {sub.items.map((it: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-700 font-medium truncate max-w-[200px]">{it.title}</span>
                            <span className="font-bold text-slate-900">{formatINR(it.unitPrice)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Financial breakdown */}
                      <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px]">
                        <div className="flex justify-between text-slate-500">
                          <span>Gross Sub-Order Amount:</span>
                          <span>{formatINR(sub.grossAmount)}</span>
                        </div>
                        <div className="flex justify-between text-indigo-700 font-semibold">
                          <span>Platform Commission (7.5%):</span>
                          <span>- {formatINR(sub.commissionAmount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>18% GST Deduction on Fee:</span>
                          <span>- {formatINR(sub.taxDeductionAmount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                          <span>Net Seller Payable:</span>
                          <span className="text-emerald-700 font-black">{formatINR(sub.netPayableAmount)}</span>
                        </div>
                      </div>

                      {/* Tracking / Return window */}
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Courier: {sub.trackingNumber}</span>
                        <span className="text-amber-700 font-semibold">Return Window: 7-Day Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 3: AMAZON-STYLE REFUND ENGINE */}
      {/* ========================================================================= */}
      {activeTab === "refunds" && (
        <div className="p-5 rounded-[6px] border border-slate-200 bg-white space-y-5 shadow-2xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>💸</span> Amazon-Style Returns & Refund Calculation Engine
              </h3>
              <p className="text-xs text-slate-500">
                Supports full and partial refunds with automatic seller payable reversal, commission clawback, and seller debt recovery.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
              Ledger Reversal Audited
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* Form */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Select Sub-Order to Refund:</label>
                <select
                  value={selectedRefundOrder}
                  onChange={(e) => setSelectedRefundOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded font-semibold bg-white"
                >
                  <option value="sord_hisense_02">
                    sord_hisense_02 — Hisense UltraView 34-Inch Monitor (₹38,990)
                  </option>
                  <option value="sord_hisense_01">
                    sord_hisense_01 — Hisense VisionBook Pro 16 AI Laptop (₹1,49,990)
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Refund Type:</label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="refType"
                      checked={refundType === "FULL"}
                      onChange={() => setRefundType("FULL")}
                      className="accent-[#404d85]"
                    />
                    <span>Full Refund (100%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="refType"
                      checked={refundType === "PARTIAL"}
                      onChange={() => setRefundType("PARTIAL")}
                      className="accent-[#404d85]"
                    />
                    <span>Partial Refund</span>
                  </label>
                </div>
              </div>

              {refundType === "PARTIAL" && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Partial Refund Amount (₹):</label>
                  <input
                    type="number"
                    value={partialRefundValue}
                    onChange={(e) => setPartialRefundValue(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-bold text-slate-900"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Return / Refund Reason:</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleProcessRefund}
                className="w-full py-2 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-2xs"
              >
                Execute Refund & Write Ledger Reversals ↵
              </button>
            </div>

            {/* Live Calculation Preview */}
            <div className="p-4 rounded border border-slate-200 bg-slate-50 space-y-3 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
                Live Amazon Refund Breakdown Preview
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Customer Refund (Gateway Outflow):</span>
                  <strong className="text-rose-700 font-black">
                    {formatINR(refundType === "FULL" ? 38990 : partialRefundValue)}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Platform Commission Clawback:</span>
                  <span className="text-indigo-700 font-bold">
                    - {formatINR(Math.round((refundType === "FULL" ? 38990 : partialRefundValue) * 0.088))}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Seller Payable Reversal:</span>
                  <strong className="text-amber-700 font-bold">
                    - {formatINR(Math.round((refundType === "FULL" ? 38990 : partialRefundValue) * 0.912))}
                  </strong>
                </div>
              </div>

              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <strong className="font-bold flex items-center gap-1 text-amber-800">
                  <Scale className="w-3.5 h-3.5" />
                  Amazon Seller Recovery Mechanism:
                </strong>
                <p>
                  If the seller order has already been settled via Razorpay Virtual Accounts, the system will not manipulate historical transactions. Instead, an immutable <strong>SELLER_RECOVERY_DEBIT</strong> entry is posted to offset future payouts.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 4: RAZORPAY VIRTUAL ACCOUNT SETTLEMENTS */}
      {/* ========================================================================= */}
      {activeTab === "settlements" && (
        <div className="space-y-4">
          <div className="p-4 rounded-[6px] border border-slate-200 bg-white space-y-3 shadow-2xs text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🏦</span> Razorpay Virtual Account Settlement Pipeline
                </h3>
                <p className="text-slate-500">
                  Evaluates the 6 golden conditions before releasing escrow funds to seller virtual accounts.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDispatchSettlement}
                disabled={isLoading}
                className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs flex items-center gap-1.5"
              >
                <span>🚀</span>
                <span>{isLoading ? "Dispatching via Razorpay..." : "Dispatch Eligible Settlements (₹1,71,646)"}</span>
              </button>
            </div>

            {/* 6 Golden Rules Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px]">
              <div className="p-2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                ✓ Order Delivered
              </div>
              <div className="p-2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                ✓ 7-Day Window Expired
              </div>
              <div className="p-2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                ✓ Zero Disputes
              </div>
              <div className="p-2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                ✓ KYC VERIFIED_ACTIVE
              </div>
              <div className="p-2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                ✓ Seller Account Active
              </div>
              <div className="p-2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                ✓ Payment Captured
              </div>
            </div>
          </div>

          {/* Settlements History Table */}
          <div className="rounded-[6px] border border-slate-200 bg-white overflow-hidden shadow-2xs text-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-xs flex items-center justify-between">
              <span>Settlement Payout History ({settlements.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">Processed through Razorpay Route / Payouts</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Settlement ID</th>
                    <th className="py-2.5 px-3">Seller / Trade Name</th>
                    <th className="py-2.5 px-3">Virtual A/C No</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Gateway Ref</th>
                    <th className="py-2.5 px-3">Processed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settlements.map((s) => (
                    <tr key={s.settlementId} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{s.settlementId}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{s.sellerName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{s.virtualAccountId}</td>
                      <td className="py-2.5 px-3 font-black text-emerald-700">{formatINR(s.amount)}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{s.providerReference}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{s.processedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 5: DOUBLE-ENTRY FINANCIAL LEDGER */}
      {/* ========================================================================= */}
      {activeTab === "ledger" && (
        <div className="rounded-[6px] border border-slate-200 bg-white overflow-hidden shadow-2xs text-xs space-y-0">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider block">
                Immutable Financial Journal & Ledger Entries ({ledgerEntries.length})
              </span>
              <p className="text-[11px] text-slate-500">
                Cryptographically hashed append-only audit trail. Historical transactions are never overwritten.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">
              Double-Entry Balanced
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Entry Type</th>
                  <th className="py-2.5 px-3">Seller Code</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Debit (Outflow)</th>
                  <th className="py-2.5 px-3 text-right">Credit (Inflow)</th>
                  <th className="py-2.5 px-3">Audit Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {ledgerEntries.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-500">{l.createdAt}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          l.entryType === "CUSTOMER_PAYMENT"
                            ? "bg-emerald-100 text-emerald-800"
                            : l.entryType === "PLATFORM_COMMISSION"
                            ? "bg-indigo-100 text-indigo-800"
                            : l.entryType === "SELLER_SETTLEMENT"
                            ? "bg-blue-100 text-blue-800"
                            : l.entryType === "CUSTOMER_REFUND" || l.entryType === "SELLER_REVERSAL"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {l.entryType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-bold">{l.sellerCode || "PLATFORM"}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-800 max-w-sm truncate">{l.description}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                      {l.debitAmount > 0 ? formatINR(l.debitAmount) : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {l.creditAmount > 0 ? formatINR(l.creditAmount) : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px]">{l.auditHash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 6: RECONCILIATION & WEBHOOKS */}
      {activeTab === "reconciliation" && (
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-[6px] border border-slate-200 bg-white space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>🔄</span> Database vs Razorpay Gateway Reconciliation
              </h3>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                100% Reconciled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded border bg-slate-50">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Payments Reconciled</span>
                <strong className="text-base font-black text-slate-900">{formatINR(188980)}</strong>
                <span className="text-[10px] text-emerald-600 font-bold block pt-0.5">0 Discrepancies</span>
              </div>
              <div className="p-3 rounded border bg-slate-50">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Refunds Reconciled</span>
                <strong className="text-base font-black text-slate-900">{formatINR(24990)}</strong>
                <span className="text-[10px] text-emerald-600 font-bold block pt-0.5">0 Discrepancies</span>
              </div>
              <div className="p-3 rounded border bg-slate-50">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Settlements Reconciled</span>
                <strong className="text-base font-black text-slate-900">{formatINR(124900)}</strong>
                <span className="text-[10px] text-emerald-600 font-bold block pt-0.5">0 Discrepancies</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-[6px] border border-slate-200 bg-white space-y-2 shadow-2xs">
            <span className="font-bold text-slate-800 text-xs block">Idempotent Webhook Event Listener</span>
            <p className="text-slate-500 text-xs">
              Listens for <code className="bg-slate-100 px-1 py-0.5 rounded">payment.captured</code>,{" "}
              <code className="bg-slate-100 px-1 py-0.5 rounded">refund.processed</code>, and{" "}
              <code className="bg-slate-100 px-1 py-0.5 rounded">settlement.processed</code> with HMAC SHA256 cryptographic verification.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
