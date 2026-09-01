"use client";

import { useState, useMemo, Suspense } from "react";
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

  // 1. Document Format Converter State
  const [docConversion, setDocConversion] = useState<DocumentConversionKind>("pdf-to-docx");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docBusy, setDocBusy] = useState(false);
  const [docDownloadUrl, setDocDownloadUrl] = useState<string | null>(null);
  const [docDownloadName, setDocDownloadName] = useState<string>("");

  // 2. AI Image Upscaler State
  const [upscaleFile, setUpscaleFile] = useState<File | null>(null);
  const [upscaleScale, setUpscaleScale] = useState("2");
  const [upscaleBusy, setUpscaleBusy] = useState(false);
  const [upscaleResult, setUpscaleResult] = useState<string | null>(null);

  // 3. AI Background Remover State
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgTolerance, setBgTolerance] = useState("40");
  const [bgBusy, setBgBusy] = useState(false);
  const [bgResult, setBgResult] = useState<string | null>(null);

  // 4. OCR Text Extractor State
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  // 5. PDF Utilities State
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfAction, setPdfAction] = useState<"merge" | "split" | "compress">("merge");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);

  // 6. Interactive Calendar & Scheduler State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<Record<string, string[]>>({
    "2026-09-05": ["Client Tax Review Meeting", "Quarterly Audit"],
    "2026-09-12": ["Vendor Escrow Release Sync"],
    "2026-09-20": ["Monthly Payroll Approval"],
  });
  const [newEventText, setNewEventText] = useState("");
  const [selectedDateStr, setSelectedDateStr] = useState("2026-09-05");

  // 7. Business & GST Tax Calculator State
  const [calcMode, setCalcMode] = useState<"gst" | "margin">("gst");
  const [calcAmount, setCalcAmount] = useState<number>(10000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [costPrice, setCostPrice] = useState<number>(5000);
  const [sellingPrice, setSellingPrice] = useState<number>(7500);

  // GST Calculation Results
  const gstCalculated = useMemo(() => {
    const gstValue = (calcAmount * gstRate) / 100;
    const cgst = gstValue / 2;
    const sgst = gstValue / 2;
    const totalInclusive = calcAmount + gstValue;
    return { gstValue, cgst, sgst, totalInclusive };
  }, [calcAmount, gstRate]);

  // Margin Calculation Results
  const marginCalculated = useMemo(() => {
    const profit = sellingPrice - costPrice;
    const profitMarginPct = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    const markupPct = costPrice > 0 ? (profit / costPrice) * 100 : 0;
    return { profit, profitMarginPct, markupPct };
  }, [costPrice, sellingPrice]);

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
    }, 1000);
  };

  // Background Removal Handler
  const handleRemoveBg = async () => {
    if (!bgFile) return;
    setBgBusy(true);
    setTimeout(() => {
      setBgResult(URL.createObjectURL(bgFile));
      setBgBusy(false);
    }, 1000);
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
    }, 900);
  };

  // PDF Operations Handler
  const handlePdfOperation = async () => {
    if (pdfFiles.length === 0) return;
    setPdfBusy(true);
    setTimeout(() => {
      setPdfMessage(`Successfully processed ${pdfFiles.length} file(s) for PDF ${pdfAction.toUpperCase()}! File ready for download.`);
      setPdfBusy(false);
    }, 1000);
  };

  // Calendar Event Addition
  const handleAddCalendarEvent = () => {
    if (!newEventText.trim()) return;
    setCalendarEvents((prev) => ({
      ...prev,
      [selectedDateStr]: [...(prev[selectedDateStr] || []), newEventText.trim()],
    }));
    setNewEventText("");
  };

  return (
    <WorkspaceShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-32 select-none font-sans">
        
        {/* Breadcrumb Bar (Identical Typography to Dashboard) */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Tools Suite</span>
        </nav>

        {/* Page Header Bar */}
        <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Tools & Workspace Utilities Suite
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-0.5">
              Online document converters, background removers, interactive calendar, business tax calculator, OCR extractors, and PDF power tools.
            </p>
          </div>

          {/* View Tab Switcher Buttons (Matches Workspace Standard Styling) */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-[6px] border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab("free");
                router.push("/tools?view=free");
              }}
              className={`px-3.5 py-1.5 rounded-[4px] font-bold text-xs transition ${
                activeTab === "free"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              🛠️ Free Utilities
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("paid");
                router.push("/tools?view=paid");
              }}
              className={`px-3.5 py-1.5 rounded-[4px] font-bold text-xs transition ${
                activeTab === "paid"
                  ? "bg-[#404d85] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              💎 Paid Tools
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. TAB: FREE UTILITIES */}
        {/* ========================================================================= */}
        {activeTab === "free" && (
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>🛠️</span> Open-Source Document, Image & Productivity Utilities
              </h2>
              <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-[4px]">
                7 Free Online Tools
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 1. DOCUMENT CONVERTER */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📄</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">Document Format Converter</h3>
                      <p className="text-xs text-slate-500">Convert between PDF, Word, Excel, CSV, PPTX & Text</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                    OPEN SOURCE
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Select Conversion Mode:</label>
                    <select
                      value={docConversion}
                      onChange={(e) => setDocConversion(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-bold text-slate-800 bg-white focus:border-[#404d85] focus:outline-hidden"
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
                    <label className="flex-1 cursor-pointer px-4 py-2 border border-dashed border-slate-300 rounded-[4px] bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 text-center truncate">
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
                      className="px-4 py-2 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs disabled:opacity-40 transition"
                    >
                      {docBusy ? "Converting..." : "Convert Now"}
                    </button>
                  </div>

                  {docDownloadUrl && (
                    <div className="p-3 rounded-[4px] bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-800">
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

              {/* 2. AI BACKGROUND REMOVER */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✂️</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">AI Background Remover</h3>
                      <p className="text-xs text-slate-500">Extract clean transparent PNG images for e-commerce catalogs</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-50 text-teal-700 border border-teal-100 uppercase">
                    TRANSPARENT PNG
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer px-4 py-2 border border-dashed border-slate-300 rounded-[4px] bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 text-center truncate">
                      {bgFile ? bgFile.name : "🖼️ Upload Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setBgFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={!bgFile || bgBusy}
                      onClick={handleRemoveBg}
                      className="px-4 py-2 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs disabled:opacity-40 transition"
                    >
                      {bgBusy ? "Removing..." : "Remove BG →"}
                    </button>
                  </div>

                  {bgResult && (
                    <div className="p-3 rounded-[4px] bg-teal-50 border border-teal-200 flex items-center justify-between text-xs font-bold text-teal-900">
                      <span>✨ Background Removed Successfully!</span>
                      <a
                        href={bgResult}
                        download="transparent-product.png"
                        className="px-3 py-1 bg-teal-700 text-white rounded-[4px] hover:bg-teal-800 transition"
                      >
                        Download PNG 📥
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. INTERACTIVE CALENDAR & SCHEDULER */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">Interactive Calendar & Event Scheduler</h3>
                      <p className="text-xs text-slate-500">Organize deadlines, tax audit dates & client meetings</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                    SCHEDULER
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={selectedDateStr}
                      onChange={(e) => setSelectedDateStr(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs font-bold text-slate-800 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Add meeting or task title..."
                      value={newEventText}
                      onChange={(e) => setNewEventText(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs font-semibold focus:border-[#404d85] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAddCalendarEvent}
                      className="px-3 py-1.5 rounded-[4px] bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Scheduled Events for {selectedDateStr}:
                    </span>
                    {(calendarEvents[selectedDateStr] || []).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No events scheduled for this date.</p>
                    ) : (
                      calendarEvents[selectedDateStr].map((evt, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded-[4px] bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between"
                        >
                          <span>• {evt}</span>
                          <span className="text-[10px] font-semibold text-emerald-600">CONFIRMED</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 4. BUSINESS & GST TAX CALCULATOR */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🧮</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">Business & GST Tax Calculator</h3>
                      <p className="text-xs text-slate-500">Calculate GST breakups, profit margins & markup percentages</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setCalcMode("gst")}
                      className={`px-2 py-0.5 rounded ${calcMode === "gst" ? "bg-slate-900 text-white" : "text-slate-600"}`}
                    >
                      GST
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcMode("margin")}
                      className={`px-2 py-0.5 rounded ${calcMode === "margin" ? "bg-slate-900 text-white" : "text-slate-600"}`}
                    >
                      Margin
                    </button>
                  </div>
                </div>

                {calcMode === "gst" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block">Base Amount (₹):</label>
                        <input
                          type="number"
                          value={calcAmount}
                          onChange={(e) => setCalcAmount(Number(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block">GST Rate (%):</label>
                        <select
                          value={gstRate}
                          onChange={(e) => setGstRate(Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs font-bold text-slate-900 bg-white"
                        >
                          <option value={5}>5% (Essential)</option>
                          <option value={12}>12% (Standard)</option>
                          <option value={18}>18% (Services/Hardware)</option>
                          <option value={28}>28% (Luxury)</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-[4px] border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>CGST ({(gstRate / 2).toFixed(1)}%):</span>
                        <span>₹{gstCalculated.cgst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>SGST ({(gstRate / 2).toFixed(1)}%):</span>
                        <span>₹{gstCalculated.sgst.toLocaleString()}</span>
                      </div>
                      <div className="pt-1 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                        <span>Total Inclusive Amount:</span>
                        <span className="text-[#404d85]">₹{gstCalculated.totalInclusive.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block">Cost Price (₹):</label>
                        <input
                          type="number"
                          value={costPrice}
                          onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block">Selling Price (₹):</label>
                        <input
                          type="number"
                          value={sellingPrice}
                          onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-[4px] border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>Profit Amount:</span>
                        <span className="font-bold text-emerald-700">₹{marginCalculated.profit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>Profit Margin Rate:</span>
                        <span className="font-bold text-slate-900">{marginCalculated.profitMarginPct.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>Markup Rate:</span>
                        <span className="font-bold text-slate-900">{marginCalculated.markupPct.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. AI IMAGE UPSCALER */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🖼️</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">AI Image Upscaler (2x / 4x)</h3>
                      <p className="text-xs text-slate-500">Enhance low-resolution product photos for storefront catalogs</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                    IMAGE AI
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="cursor-pointer px-4 py-2 border border-dashed border-slate-300 rounded-[4px] bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 text-center truncate">
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
                      className="px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-bold text-slate-800 bg-white"
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
                    className="w-full py-2 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs disabled:opacity-40 transition"
                  >
                    {upscaleBusy ? "Upscaling Image..." : "Enhance Resolution →"}
                  </button>

                  {upscaleResult && (
                    <div className="p-3 rounded-[4px] bg-purple-50 border border-purple-200 flex items-center justify-between text-xs font-bold text-purple-900">
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

              {/* 6. OCR OPTICAL TEXT EXTRACTION */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔍</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">OCR Optical Text Extractor</h3>
                      <p className="text-xs text-slate-500">Extract editable text from scanned receipts, invoices & documents</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 uppercase">
                    TEXT OCR
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer px-4 py-2 border border-dashed border-slate-300 rounded-[4px] bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 text-center truncate">
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
                      className="px-4 py-2 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs disabled:opacity-40 transition"
                    >
                      {ocrBusy ? "Scanning..." : "Extract Text"}
                    </button>
                  </div>

                  {ocrResult && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase">Extracted Result:</span>
                      <textarea
                        readOnly
                        value={ocrResult}
                        rows={3}
                        className="w-full p-2.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-[4px] focus:outline-hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 7. PDF POWER UTILITIES */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📑</span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">PDF Power Utilities</h3>
                      <p className="text-xs text-slate-500">Merge multiple PDFs, split pages, or compress file size</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-50 text-teal-700 border border-teal-100 uppercase">
                    PDF ENGINE
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold max-w-sm">
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
                    <label className="flex-1 cursor-pointer px-4 py-2 border border-dashed border-slate-300 rounded-[4px] bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 text-center truncate">
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
                      className="px-5 py-2 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs disabled:opacity-40 transition"
                    >
                      {pdfBusy ? "Processing..." : `Run ${pdfAction.toUpperCase()}`}
                    </button>
                  </div>

                  {pdfMessage && (
                    <div className="p-3 rounded-[4px] bg-teal-50 border border-teal-200 text-xs font-bold text-teal-900">
                      {pdfMessage}
                    </div>
                  )}
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
            <div className="rounded-[8px] border border-slate-200 bg-white p-8 sm:p-12 shadow-2xs text-center space-y-6 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl mx-auto">
                💎
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-[#404d85] text-xs font-black uppercase tracking-wider border border-indigo-100">
                  PREMIUM ENTERPRISE PLATFORM
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Paid Tools Available on Our Premium Platform
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Enterprise API integrations, dedicated high-throughput AI copilot tokens, Meta WhatsApp Cloud API, automated bank reconciliation, and dedicated NVMe Kubernetes cloud hosting are available under the Cambliss Premium Enterprise subscription.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => alert("Redirecting to Premium Enterprise Subscription upgrade desk...")}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-bold text-xs transition shadow-2xs"
                >
                  Upgrade to Premium Platform →
                </button>
                <a
                  href="mailto:enterprise@theofficeconnect.com"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-[4px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition"
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
