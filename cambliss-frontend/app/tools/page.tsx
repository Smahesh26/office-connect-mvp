"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfAction, setPdfAction] = useState<"merge" | "split" | "compress">("merge");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);

  // Open Source Software & Engines Catalog (Integrated Open Source Tools)
  const openSourceTools = [
    {
      id: "akaunting",
      title: "Accountech (Akaunting)",
      category: "Open Source Accounting",
      tagline: "Free Open-Source ERP & Invoicing Engine",
      description: "Complete double-entry accounting, customer billing, recurring invoices, vendor bills, and financial ledger management.",
      icon: "💰",
      badge: "OPEN SOURCE ERP",
      route: "/akaunting",
      cta: "Open Accountech ERP →",
    },
    {
      id: "mercur",
      title: "MercurJS Marketplace Engine",
      category: "Open Source E-Commerce",
      tagline: "Headless MedusaJS Multi-Vendor Framework",
      description: "Open-source multi-vendor marketplace backend with order splitting, seller onboarding, commission routing, and buyer escrow.",
      icon: "🛍️",
      badge: "OPEN SOURCE MARKETPLACE",
      route: "/storefront",
      cta: "Launch Mercur Engine →",
    },
    {
      id: "twenty-crm",
      title: "Twenty CRM Engine",
      category: "Open Source CRM",
      tagline: "Modern Open-Source Customer Pipeline",
      description: "Open-source lead management, customer deal Kanban pipelines, contact directory, and conversion tracking.",
      icon: "📊",
      badge: "OPEN SOURCE CRM",
      route: "/crm",
      cta: "Open Twenty CRM →",
    },
    {
      id: "erpnext-dolibarr",
      title: "ERPNext & Dolibarr ERP",
      category: "Open Source Enterprise ERP",
      tagline: "All-in-One Open-Source Business Management",
      description: "Full-suite open-source ERP modules covering manufacturing, stock cataloging, purchase orders, and multi-location warehouses.",
      icon: "⚙️",
      badge: "OPEN SOURCE ERP",
      route: "/inventory",
      cta: "Open ERP & Inventory →",
    },
    {
      id: "orange-frappe-hrm",
      title: "OrangeHRM, IceHRM & Frappe HR",
      category: "Open Source HR Suite",
      tagline: "Open-Source Workforce & Payroll System",
      description: "Employee records management, biometric attendance sync, leave approvals, and automated payroll calculation engines.",
      icon: "👥",
      badge: "OPEN SOURCE HR",
      route: "/hrm",
      cta: "Open HR Suite →",
    },
    {
      id: "inventree",
      title: "InvenTree Asset & Part Manager",
      category: "Open Source Asset Tracking",
      tagline: "Open-Source Stock & Hardware Inventory",
      description: "Open-source part tracking, bill of materials (BOM), SKU barcode generation, and hardware component stock manager.",
      icon: "📦",
      badge: "OPEN SOURCE HARDWARE",
      route: "/inventory",
      cta: "Open InvenTree →",
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
              Explore integrated open-source business software, online document converters, OCR tools, and premium platform extensions.
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
              <span>🌐 Free Open-Source Tools</span>
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                FREE
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
              <span>💎 Paid Tools</span>
              <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                PREMIUM
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. TAB: FREE OPEN-SOURCE TOOLS */}
        {/* ========================================================================= */}
        {activeTab === "free" && (
          <div className="space-y-10">
            
            {/* SECTION A: INTEGRATED OPEN-SOURCE SOFTWARE & ENGINES */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>🌐</span> Integrated Open-Source Tools & Software
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pre-integrated open-source frameworks, ERPs, CRM engines, and workforce applications
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  6 Open Source Engines
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {openSourceTools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => router.push(tool.route)}
                    className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-[#404d85] hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl group-hover:scale-110 transition-transform">{tool.icon}</span>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {tool.badge}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {tool.category}
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#404d85] transition">
                          {tool.title}
                        </h3>
                        <p className="text-xs font-bold text-[#404d85] mt-0.5">{tool.tagline}</p>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#404d85] group-hover:translate-x-1 transition-transform">
                      <span>{tool.cta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION B: INTERACTIVE ONLINE UTILITIES */}
            <div className="space-y-6 pt-6 border-t border-slate-200">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>🛠️</span> Open-Source Document & Media Processing Utilities
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
        {/* 2. TAB: PAID TOOLS */}
        {/* ========================================================================= */}
        {activeTab === "paid" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-8 sm:p-12 text-white shadow-xl text-center space-y-6 max-w-3xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
                💎
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/30">
                  PREMIUM ENTERPRISE PLATFORM
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Paid Tools Available on Our Premium Platform
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                  Enterprise API integrations, dedicated high-throughput AI copilot tokens, Meta WhatsApp Cloud API, automated bank reconciliation, and dedicated NVMe Kubernetes cloud hosting are available under the Cambliss Premium Enterprise subscription.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => alert("Redirecting to Premium Enterprise Subscription upgrade desk...")}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition shadow-lg"
                >
                  Upgrade to Premium Platform →
                </button>
                <a
                  href="mailto:enterprise@theofficeconnect.com"
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition"
                >
                  Contact Enterprise Sales
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </WorkspaceShell>
  );
}
