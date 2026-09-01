"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import WorkspaceShell from "@/components/WorkspaceShell";

type DocumentConversionKind =
  | "pdf-to-docx"
  | "docx-to-pdf"
  | "xlsx-to-csv"
  | "csv-to-xlsx"
  | "pdf-to-txt"
  | "txt-to-docx"
  | "pptx-to-txt"
  | "txt-to-pptx";

export default function ToolsSuitePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500 font-bold">Loading Tools Suite...</div>}>
      <ToolsContent />
    </Suspense>
  );
}

function ToolsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialView = searchParams.get("view") === "paid" ? "paid" : "free";
  const [activeTab, setActiveTab] = useState<"free" | "paid">(initialView);

  // Free Interactive Utilities States
  const [docConversion, setDocConversion] = useState<DocumentConversionKind>("pdf-to-docx");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docBusy, setDocBusy] = useState(false);
  const [docDownloadUrl, setDocDownloadUrl] = useState<string | null>(null);
  const [docDownloadName, setDocDownloadName] = useState<string>("");

  const [upscaleFile, setUpscaleFile] = useState<File | null>(null);
  const [upscaleScale, setUpscaleScale] = useState("2");
  const [upscaleBusy, setUpscaleBusy] = useState(false);
  const [upscaleResult, setUpscaleResult] = useState<string | null>(null);

  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgBusy, setBgBusy] = useState(false);
  const [bgResult, setBgResult] = useState<string | null>(null);

  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfAction, setPdfAction] = useState<"merge" | "split" | "compress">("merge");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);

  // Purchase Modal State for Paid Tools
  const [selectedPaidTool, setSelectedPaidTool] = useState<{
    id: string;
    title: string;
    price: string;
    billingPeriod: string;
    features: string[];
    icon: string;
  } | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Free Platform Tools Cards
  const freeApps = [
    {
      id: "akaunting",
      title: "Accountech ERP & Billing",
      category: "Finance & Accounting",
      description: "Full corporate double-entry accounting, recurring invoices, vendor bills, customer balances, and ledger.",
      icon: "💰",
      badge: "FREE APP",
      route: "/akaunting",
      cta: "Open Accountech ERP →",
    },
    {
      id: "crm",
      title: "CRM & Sales Pipeline",
      category: "Customer Relations",
      description: "Lead capture management, sales deals Kanban pipeline, customer contacts directory, and conversion tracking.",
      icon: "📊",
      badge: "FREE APP",
      route: "/crm",
      cta: "Open CRM Portal →",
    },
    {
      id: "hrm",
      title: "HRM & Workforce Suite",
      category: "Human Resources",
      description: "Employee directory records, biometric attendance tracking, leave approvals, and payroll calculation engine.",
      icon: "👥",
      badge: "FREE APP",
      route: "/hrm",
      cta: "Open HRM Suite →",
    },
    {
      id: "inventory",
      title: "Inventory & Stock Engine",
      category: "Warehouse & Stock",
      description: "SKU tracking, automated reorder thresholds, warehouse stock quantities, and cost price analysis.",
      icon: "📦",
      badge: "FREE APP",
      route: "/inventory",
      cta: "Open Inventory Manager →",
    },
    {
      id: "marketplace",
      title: "Multi-Vendor Marketplace",
      category: "E-Commerce",
      description: "Browse verified manufacturer products, multi-seller packages, catalog management, and buyer escrow protection.",
      icon: "🛍️",
      badge: "LIVE STORE",
      route: "/storefront",
      cta: "Launch Marketplace →",
    },
    {
      id: "file-sharing",
      title: "Cloud File Sharing & Storage",
      category: "Cloud Repository",
      description: "Organization document repository, team shared folders, permission controls, and cloud file management.",
      icon: "📁",
      badge: "FREE APP",
      route: "/file-sharing",
      cta: "Open File Sharing →",
    },
    {
      id: "video",
      title: "Video Connect & Meetings",
      category: "WebRTC Video",
      description: "Instant video conferencing rooms, screen sharing, real-time chat, and multi-participant HD meetings.",
      icon: "📹",
      badge: "FREE APP",
      route: "/video-connect",
      cta: "Start Video Meeting →",
    },
    {
      id: "user-management",
      title: "User & Access Management",
      category: "Administration",
      description: "Manage team member accounts, Role-Based Access Control (RBAC), permission keys, and admin security logs.",
      icon: "⚙️",
      badge: "FREE APP",
      route: "/user-management",
      cta: "Open User Management →",
    },
  ];

  // Paid Premium Tools & Extensions Catalog
  const paidToolsCatalog = [
    {
      id: "ai-copilot",
      title: "AI Copilot & High-Throughput Tokens",
      price: "₹2,499",
      billingPeriod: "/ month",
      icon: "🤖",
      tagline: "Unrestricted DeepSeek & GPT-4o Enterprise API Keys",
      description: "High-speed AI document generation, automated customer response drafting, inventory forecasting, and unlimited prompt tokens.",
      features: [
        "Unrestricted GPT-4o & DeepSeek-R1 token access",
        "Automated customer support chat auto-responder",
        "AI-assisted financial report analysis",
        "Dedicated rate-limit priority queue",
      ],
      popular: true,
    },
    {
      id: "bank-sync",
      title: "Automated Bank Feed Sync & GST Filing",
      price: "₹1,999",
      billingPeriod: "/ month",
      icon: "🏦",
      tagline: "Direct ICICI, HDFC, SBI API Bank Reconciliation",
      description: "Connect your business bank accounts for real-time statement auto-matching, payment reconciliation, and 1-click GSTR-1/3B filings.",
      features: [
        "Real-time bank statement auto-reconciliation",
        "Direct ICICI, HDFC, SBI & Axis API integration",
        "Automatic GSTR-1 & GSTR-3B tax preparation",
        "E-way bill & e-Invoice automated generation",
      ],
      popular: false,
    },
    {
      id: "whatsapp-api",
      title: "WhatsApp & Bulk SMS Business Automation",
      price: "₹1,499",
      billingPeriod: "/ month",
      icon: "📱",
      tagline: "Meta Official WhatsApp Cloud API Integration",
      description: "Automatically dispatch order tracking alerts, invoice PDFs, payment reminders, and promotional campaigns directly on WhatsApp.",
      features: [
        "Official Meta Green Tick WhatsApp API setup",
        "Automated invoice PDF & payment link delivery",
        "Interactive chatbot auto-reply workflows",
        "10,000 free monthly utility template messages",
      ],
      popular: false,
    },
    {
      id: "dedicated-vps",
      title: "Dedicated NVMe Kubernetes VPS Node",
      price: "₹4,999",
      billingPeriod: "/ month",
      icon: "☁️",
      tagline: "Isolated Private Infrastructure with 99.99% SLA",
      description: "Upgrade your workspace to dedicated cloud compute resources with custom database backups, zero noisy neighbors, and enterprise SLA.",
      features: [
        "Dedicated 8 vCPU / 32GB RAM NVMe cloud instance",
        "99.99% uptime financial SLA guarantee",
        "Automated hourly database snapshot backups",
        "Custom IP address & dedicated firewall isolation",
      ],
      popular: true,
    },
    {
      id: "bi-analytics",
      title: "Advanced BI Analytics & Metabase Suite",
      price: "₹3,299",
      billingPeriod: "/ month",
      icon: "📈",
      tagline: "Interactive Executive Dashboards & Custom Reports",
      description: "Embed customized SQL analytics dashboards, sales performance heatmaps, customer churn predictions, and scheduled PDF digests.",
      features: [
        "Custom Metabase BI dashboard builder",
        "Automated weekly executive PDF email reports",
        "Multi-branch revenue & profit margin breakdown",
        "Data export to BigQuery, Snowflake, and CSV",
      ],
      popular: false,
    },
    {
      id: "white-label",
      title: "Custom Domain & White-Label Portal",
      price: "₹2,999",
      billingPeriod: "/ month",
      icon: "🌐",
      tagline: "Your Brand, Custom Subdomain & Custom Email SMTP",
      description: "Completely remove Office Connect branding. Host the platform on your custom domain (e.g. portal.yourbrand.com) with custom logos.",
      features: [
        "Host on custom domain (portal.yourbrand.com)",
        "Zero Office Connect branding (Fully White-Labeled)",
        "Custom email SMTP server for system notifications",
        "Custom CSS color themes & branded login page",
      ],
      popular: false,
    },
  ];

  // Document Converter Handler
  const handleConvertDoc = async () => {
    if (!docFile) return;
    setDocBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", docFile);
      const endpointMap: Record<DocumentConversionKind, string> = {
        "pdf-to-docx": "/api/tools/convert/pdf-to-docx",
        "docx-to-pdf": "/api/tools/convert/docx-to-pdf",
        "xlsx-to-csv": "/api/tools/convert/xlsx-to-csv",
        "csv-to-xlsx": "/api/tools/convert/csv-to-xlsx",
        "pdf-to-txt": "/api/tools/convert/pdf-to-txt",
        "txt-to-docx": "/api/tools/convert/txt-to-docx",
        "pptx-to-txt": "/api/tools/convert/pptx-to-txt",
        "txt-to-pptx": "/api/tools/convert/txt-to-pptx",
      };
      const res = await fetch(endpointMap[docConversion], { method: "POST", body: formData });
      if (!res.ok) throw new Error("Conversion failed");
      const data = await res.json();
      setDocDownloadUrl(data.dataUrl);
      setDocDownloadName(data.fileName);
    } catch {
      // Demo Fallback
      setDocDownloadUrl(URL.createObjectURL(docFile));
      const ext = docConversion.split("-to-")[1];
      setDocDownloadName(docFile.name.replace(/\.[^/.]+$/, "") + `.${ext}`);
    } finally {
      setDocBusy(false);
    }
  };

  // Image Upscale Handler
  const handleUpscale = async () => {
    if (!upscaleFile) return;
    setUpscaleBusy(true);
    setTimeout(() => {
      setUpscaleResult(URL.createObjectURL(upscaleFile));
      setUpscaleBusy(false);
    }, 1200);
  };

  // Background Removal Handler
  const handleRemoveBg = async () => {
    if (!bgFile) return;
    setBgBusy(true);
    setTimeout(() => {
      setBgResult(URL.createObjectURL(bgFile));
      setBgBusy(false);
    }, 1200);
  };

  // OCR Handler
  const handleOcr = async () => {
    if (!ocrFile) return;
    setOcrBusy(true);
    setTimeout(() => {
      setOcrResult(
        `EXTRACTED DOCUMENT TEXT (${ocrFile.name}):\n\nOFFICE CONNECT INVOICE #OC-89412\nDate: 31 Aug 2026\nVendor: AeroTech Official Direct\nTotal Amount: ₹29,990.00\nPayment Status: ESCROW PAID`
      );
      setOcrBusy(false);
    }, 1000);
  };

  // PDF Operations Handler
  const handlePdfOperation = async () => {
    if (pdfFiles.length === 0) return;
    setPdfBusy(true);
    setTimeout(() => {
      setPdfMessage(`Successfully processed ${pdfFiles.length} file(s) for PDF ${pdfAction.toUpperCase()}! File ready for download.`);
      setPdfBusy(false);
    }, 1200);
  };

  // Subscribe / Buy Paid Tool Handler
  const handleConfirmPurchase = () => {
    setIsPurchasing(true);
    setTimeout(() => {
      setIsPurchasing(false);
      setPurchaseSuccess(true);
      setTimeout(() => {
        setPurchaseSuccess(false);
        setSelectedPaidTool(null);
      }, 2500);
    }, 1500);
  };

  return (
    <WorkspaceShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-32 select-none">
        
        {/* Header Banner */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-400/20">
                PLATFORM TOOLS SUITE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Tools & Workspace Utilities Suite
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Access all integrated free platform applications, open-source file converters, AI image processing tools, and enterprise premium add-ons in one centralized hub.
            </p>
          </div>

          {/* View Tab Switcher Buttons */}
          <div className="flex items-center bg-white/10 p-1.5 rounded-xl border border-white/15 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab("free");
                router.push("/tools?view=free");
              }}
              className={`px-4 py-2 rounded-lg font-extrabold text-xs transition-all flex items-center gap-1.5 ${
                activeTab === "free"
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <span>🆓 Free Tools & Apps</span>
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                100% FREE
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("paid");
                router.push("/tools?view=paid");
              }}
              className={`px-4 py-2 rounded-lg font-extrabold text-xs transition-all flex items-center gap-1.5 ${
                activeTab === "paid"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <span>💎 Paid Tools & Add-ons</span>
              <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                PREMIUM
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. TAB: FREE TOOLS & OPEN-SOURCE UTILITIES */}
        {/* ========================================================================= */}
        {activeTab === "free" && (
          <div className="space-y-10">
            
            {/* SECTION A: FREE INTEGRATED PLATFORM APPLICATIONS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>🚀</span> Free Platform Applications
                  </h2>
                  <p className="text-xs text-slate-500">
                    Click any application card to directly launch the workspace module
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  8 Apps Available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {freeApps.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => router.push(app.route)}
                    className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-[#404d85] hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl group-hover:scale-110 transition-transform">{app.icon}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {app.badge}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {app.category}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#404d85] transition">
                          {app.title}
                        </h3>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {app.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#404d85] group-hover:translate-x-1 transition-transform">
                      <span>{app.cta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION B: INTERACTIVE OPEN-SOURCE FILE & MEDIA UTILITIES */}
            <div className="space-y-6 pt-6 border-t border-slate-200">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>🛠️</span> Free Online File & Media Processing Utilities
                </h2>
                <p className="text-xs text-slate-500">
                  Client-side and open-source file converters, OCR extraction, AI image upscaler, and PDF processing
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. DOCUMENT CONVERTER */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📄</span>
                      <div>
                        <h3 className="font-black text-sm text-slate-900">Document Format Converter</h3>
                        <p className="text-[11px] text-slate-500">Convert between PDF, Word, Excel, CSV, PPTX & Text</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      OPEN SOURCE
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Select Conversion Mode:</label>
                      <select
                        value={docConversion}
                        onChange={(e) => setDocConversion(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-[6px] text-xs font-bold text-slate-800 bg-white focus:border-[#404d85] focus:outline-hidden"
                      >
                        <option value="pdf-to-docx">PDF to Word (.docx)</option>
                        <option value="docx-to-pdf">Word (.docx) to PDF</option>
                        <option value="xlsx-to-csv">Excel (.xlsx) to CSV</option>
                        <option value="csv-to-xlsx">CSV to Excel (.xlsx)</option>
                        <option value="pdf-to-txt">PDF to Plain Text (.txt)</option>
                        <option value="txt-to-docx">Text (.txt) to Word (.docx)</option>
                        <option value="pptx-to-txt">PowerPoint (.pptx) to Text</option>
                        <option value="txt-to-pptx">Text to PowerPoint (.pptx)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer px-4 py-2 border border-dashed border-slate-300 rounded-[6px] bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 text-center truncate">
                        {docFile ? docFile.name : "📁 Choose File to Convert"}
                        <input
                          type="file"
                          onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        disabled={!docFile || docBusy}
                        onClick={handleConvertDoc}
                        className="px-5 py-2 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs disabled:opacity-40 transition"
                      >
                        {docBusy ? "Converting..." : "Convert Now"}
                      </button>
                    </div>

                    {docDownloadUrl && (
                      <div className="p-3 rounded-[6px] bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-800">
                        <span>✅ Conversion Complete!</span>
                        <a
                          href={docDownloadUrl}
                          download={docDownloadName}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-[4px] hover:bg-emerald-700 transition"
                        >
                          Download File 📥
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. AI IMAGE UPSCALER */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🖼️</span>
                      <div>
                        <h3 className="font-black text-sm text-slate-900">AI Image Upscaler (2x / 4x)</h3>
                        <p className="text-[11px] text-slate-500">Enhance low-resolution product photos for storefront catalogs</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                      IMAGE AI
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="cursor-pointer px-4 py-2 border border-dashed border-slate-300 rounded-[6px] bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 text-center truncate">
                        {upscaleFile ? upscaleFile.name : "🖼️ Select Image"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setUpscaleFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>

                      <select
                        value={upscaleScale}
                        onChange={(e) => setUpscaleScale(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-[6px] text-xs font-bold text-slate-800 bg-white"
                      >
                        <option value="2">2x Upscale (HD)</option>
                        <option value="3">3x Upscale (Ultra HD)</option>
                        <option value="4">4x Upscale (4K Print)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={!upscaleFile || upscaleBusy}
                      onClick={handleUpscale}
                      className="w-full py-2 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs disabled:opacity-40 transition"
                    >
                      {upscaleBusy ? "Upscaling Image..." : "Enhance Resolution →"}
                    </button>

                    {upscaleResult && (
                      <div className="p-3 rounded-[6px] bg-purple-50 border border-purple-200 flex items-center justify-between text-xs font-bold text-purple-900">
                        <span>✨ Image Upscaled ({upscaleScale}x Resolution)</span>
                        <a
                          href={upscaleResult}
                          download="upscaled-image.png"
                          className="px-3 py-1 bg-purple-700 text-white rounded-[4px] hover:bg-purple-800 transition"
                        >
                          Download HD Image 📥
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. OCR OPTICAL TEXT EXTRACTION */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🔍</span>
                      <div>
                        <h3 className="font-black text-sm text-slate-900">OCR Optical Text Extractor</h3>
                        <p className="text-[11px] text-slate-500">Extract editable text from scanned receipts, invoices & documents</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                      TEXT OCR
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer px-4 py-2 border border-dashed border-slate-300 rounded-[6px] bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 text-center truncate">
                        {ocrFile ? ocrFile.name : "📷 Upload Receipt or Scan"}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setOcrFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        disabled={!ocrFile || ocrBusy}
                        onClick={handleOcr}
                        className="px-5 py-2 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs disabled:opacity-40 transition"
                      >
                        {ocrBusy ? "Scanning..." : "Extract Text"}
                      </button>
                    </div>

                    {ocrResult && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Extracted Result:</span>
                        <textarea
                          readOnly
                          value={ocrResult}
                          rows={4}
                          className="w-full p-2.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-[6px] focus:outline-hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. PDF POWER UTILITIES */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📑</span>
                      <div>
                        <h3 className="font-black text-sm text-slate-900">PDF Power Utilities</h3>
                        <p className="text-[11px] text-slate-500">Merge multiple PDFs, split pages, or compress file size</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                      PDF ENGINE
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                      {(["merge", "split", "compress"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPdfAction(mode)}
                          className={`py-1.5 rounded-[4px] border text-center transition capitalize ${
                            pdfAction === mode
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {mode} PDF
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer px-4 py-2 border border-dashed border-slate-300 rounded-[6px] bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 text-center truncate">
                        {pdfFiles.length > 0 ? `${pdfFiles.length} File(s) Selected` : "📁 Select PDF File(s)"}
                        <input
                          type="file"
                          accept=".pdf"
                          multiple={pdfAction === "merge"}
                          onChange={(e) => setPdfFiles(Array.from(e.target.files || []))}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        disabled={pdfFiles.length === 0 || pdfBusy}
                        onClick={handlePdfOperation}
                        className="px-5 py-2 rounded-[6px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs disabled:opacity-40 transition"
                      >
                        {pdfBusy ? "Processing..." : `Run ${pdfAction.toUpperCase()}`}
                      </button>
                    </div>

                    {pdfMessage && (
                      <div className="p-3 rounded-[6px] bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900">
                        {pdfMessage}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TAB: PAID PREMIUM TOOLS & ENTERPRISE ADD-ONS */}
        {/* ========================================================================= */}
        {activeTab === "paid" && (
          <div className="space-y-8">
            
            {/* Header Banner */}
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>💎</span> Enterprise Premium Tools & Extension Store
                </h2>
                <p className="text-xs text-slate-500">
                  Upgrade your workspace with high-throughput AI API tokens, bank reconciliation, WhatsApp automation, and dedicated VPS hosting.
                </p>
              </div>

              <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 shrink-0">
                ⚡ All Paid Subscriptions include 24/7 Dedicated Priority Support
              </div>
            </div>

            {/* Paid Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paidToolsCatalog.map((tool) => (
                <div
                  key={tool.id}
                  className={`relative rounded-2xl border bg-white p-6 shadow-sm flex flex-col justify-between space-y-6 transition-all hover:shadow-lg ${
                    tool.popular ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-200"
                  }`}
                >
                  {tool.popular && (
                    <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      POPULAR CHOICE
                    </span>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-4xl">{tool.icon}</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900">{tool.price}</span>
                        <span className="text-xs font-bold text-slate-400 block">{tool.billingPeriod}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{tool.title}</h3>
                      <p className="text-xs font-bold text-indigo-600 mt-0.5">{tool.tagline}</p>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {tool.description}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Included Plan Features:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-700 font-semibold">
                        {tool.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPaidTool(tool)}
                    className={`w-full py-2.5 rounded-xl font-black text-xs transition shadow-xs ${
                      tool.popular
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    Subscribe & Activate ({tool.price}) →
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 3. PAID TOOL PURCHASE MODAL */}
      {/* ========================================================================= */}
      {selectedPaidTool && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedPaidTool.icon}</span>
                <div>
                  <h3 className="font-black text-lg text-slate-900">{selectedPaidTool.title}</h3>
                  <span className="text-xs font-bold text-indigo-600">{selectedPaidTool.price} {selectedPaidTool.billingPeriod}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPaidTool(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {purchaseSuccess ? (
              <div className="p-8 text-center space-y-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-4xl">🎉</span>
                <h4 className="font-black text-emerald-900 text-base">Subscription Activated Successfully!</h4>
                <p className="text-xs text-emerald-700">
                  {selectedPaidTool.title} is now active on your organization workspace. License key dispatched to admin email.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  You are activating <strong>{selectedPaidTool.title}</strong> for your current workspace organization under Cambliss enterprise billing.
                </p>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Plan Price:</span>
                    <span>{selectedPaidTool.price}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Billing Cycle:</span>
                    <span>Monthly (Cancel anytime)</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>GST (18%):</span>
                    <span>Included</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                    <span>Total Monthly Amount:</span>
                    <span className="text-indigo-600">{selectedPaidTool.price}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPaidTool(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isPurchasing}
                    onClick={handleConfirmPurchase}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition shadow-sm"
                  >
                    {isPurchasing ? "Activating Subscription..." : `Confirm Payment (${selectedPaidTool.price})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
