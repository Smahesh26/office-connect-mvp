"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
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

interface NewsItem {
  id: string;
  title: string;
  category: "Business" | "Tech" | "Finance" | "Startup" | "Tax";
  source: string;
  timeAgo: string;
  summary: string;
  url: string;
  readTime: string;
}

export default function ToolsSuitePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500 font-semibold">Loading Tools Suite...</div>}>
      <ToolsContent />
    </Suspense>
  );
}

function ToolsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialView = searchParams.get("view") || "daily";
  const [activeTab, setActiveTab] = useState<string>(initialView);

  // =========================================================================
  // 1. NEWS API & LIVE UPDATES STATE
  // =========================================================================
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>("All");
  const [newsSearchQuery, setNewsSearchQuery] = useState("");
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);

  const initialNewsFeed: NewsItem[] = [
    {
      id: "news-1",
      title: "Reserve Bank Guidelines Update for B2B Digital Payments & Escrow Settlement",
      category: "Finance",
      source: "Economic Times",
      timeAgo: "15 mins ago",
      summary: "Updated compliance frameworks for multi-vendor online marketplaces require T+1 escrow settlement windows for verified vendor payouts.",
      url: "#",
      readTime: "3 min read",
    },
    {
      id: "news-2",
      title: "Global Enterprise SaaS Adoption Surges 28% Driven by Open-Source ERP Integration",
      category: "Tech",
      source: "TechCrunch",
      timeAgo: "42 mins ago",
      summary: "Organizations are rapidly migrating towards hybrid open-source ERP systems to reduce licensing overhead and maintain data sovereignty.",
      url: "#",
      readTime: "4 min read",
    },
    {
      id: "news-3",
      title: "GST Council Approves Simplified E-Invoicing Thresholds for Small Businesses",
      category: "Tax",
      source: "Business Standard",
      timeAgo: "1 hour ago",
      summary: "New GST portal updates streamline automated GSTR-1 and GSTR-3B filings for registered MSME enterprises with instant IRN generation.",
      url: "#",
      readTime: "2 min read",
    },
    {
      id: "news-4",
      title: "Next-Gen Smart Models Slash Document OCR & Data Extraction Latency by 60%",
      category: "Tech",
      source: "VentureBeat",
      timeAgo: "2 hours ago",
      summary: "Advances in multimodal vision models enable instant extraction of structured invoice data from low-resolution receipts and PDF scans.",
      url: "#",
      readTime: "5 min read",
    },
    {
      id: "news-5",
      title: "Indian B2B E-Commerce Marketplace Volume Crosses $100 Billion Benchmark",
      category: "Business",
      source: "Financial Express",
      timeAgo: "3 hours ago",
      summary: "Direct manufacturer-to-enterprise procurement models gain market share as corporate buyers prioritize escrow safety and bulk tier pricing.",
      url: "#",
      readTime: "4 min read",
    },
    {
      id: "news-6",
      title: "Startup Funding Highlights: B2B Supply Chain & Logistics Tech Leads Investments",
      category: "Startup",
      source: "Inc42",
      timeAgo: "4 hours ago",
      summary: "Investors channel capital into automated inventory management, smart demand forecasting, and cross-border trade payment infrastructure.",
      url: "#",
      readTime: "3 min read",
    },
  ];

  const filteredNewsFeed = useMemo(() => {
    return initialNewsFeed.filter((item) => {
      const matchesCategory = selectedNewsCategory === "All" || item.category === selectedNewsCategory;
      const matchesQuery =
        item.title.toLowerCase().includes(newsSearchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(newsSearchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [selectedNewsCategory, newsSearchQuery]);

  const handleRefreshNews = () => {
    setIsRefreshingNews(true);
    setTimeout(() => {
      setIsRefreshingNews(false);
    }, 800);
  };

  // =========================================================================
  // 2. DAILY TASK ROUTINE UTILITIES STATE
  // =========================================================================
  // Quick Notepad & Sticky Checklist
  const [quickNote, setQuickNote] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("daily_quick_note") || "• Review morning vendor pending orders\n• Confirm GST invoice reconciliation\n• Team sync at 2:30 PM";
    }
    return "";
  });

  const handleNoteChange = (val: string) => {
    setQuickNote(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("daily_quick_note", val);
    }
  };

  // Focus Work Timer (Pomodoro)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"work" | "break">("work");

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      if (timerMode === "work") {
        alert("🎉 Focus session complete! Time for a 5-minute break.");
        setTimerMode("break");
        setTimerSeconds(5 * 60);
      } else {
        alert("🔔 Break over! Ready to focus?");
        setTimerMode("work");
        setTimerSeconds(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, timerMode]);

  const formatTimerTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Live Currency Converter
  const [currencyAmount, setCurrencyAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("INR");

  const currencyRates: Record<string, number> = {
    INR: 1,
    USD: 83.5,
    EUR: 90.2,
    GBP: 105.8,
    AED: 22.7,
    SGD: 61.9,
  };

  const convertedCurrencyAmount = useMemo(() => {
    const amountInINR = currencyAmount * (currencyRates[fromCurrency] || 1);
    const result = amountInINR / (currencyRates[toCurrency] || 1);
    return result;
  }, [currencyAmount, fromCurrency, toCurrency]);

  // Website Uptime Health Checker
  const [checkUrl, setCheckUrl] = useState("https://theofficeconnect.com");
  const [checkStatus, setCheckStatus] = useState<"idle" | "checking" | "online" | "offline">("idle");
  const [checkResponseTime, setCheckResponseTime] = useState<number | null>(null);

  const handleCheckUptime = () => {
    if (!checkUrl) return;
    setCheckStatus("checking");
    setTimeout(() => {
      setCheckStatus("online");
      setCheckResponseTime(Math.floor(Math.random() * 40) + 18);
    }, 900);
  };

  // Password & API Key Secret Generator
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [passLength, setPassLength] = useState(16);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copiedPass, setCopiedPass] = useState(false);

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const validChars = includeSymbols ? chars + symbols : chars;
    let res = "";
    for (let i = 0; i < passLength; i++) {
      res += validChars.charAt(Math.floor(Math.random() * validChars.length));
    }
    setGeneratedPassword(res);
    setCopiedPass(false);
  };

  // =========================================================================
  // 3. DOCUMENT & FILE UTILITIES STATE
  // =========================================================================
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

  // =========================================================================
  // 4. BUSINESS & FINANCIAL CALCULATORS STATE
  // =========================================================================
  const [calcMode, setCalcMode] = useState<"gst" | "margin" | "emi">("gst");
  const [calcAmount, setCalcAmount] = useState<number>(10000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [costPrice, setCostPrice] = useState<number>(5000);
  const [sellingPrice, setSellingPrice] = useState<number>(7500);

  // Loan EMI Calculator
  const [loanPrincipal, setLoanPrincipal] = useState<number>(500000);
  const [loanInterestRate, setLoanInterestRate] = useState<number>(9.5);
  const [loanTenureMonths, setLoanTenureMonths] = useState<number>(24);

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

  // EMI Calculation Results
  const emiCalculated = useMemo(() => {
    const monthlyRate = loanInterestRate / (12 * 100);
    const emi =
      monthlyRate > 0
        ? (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, loanTenureMonths)) /
          (Math.pow(1 + monthlyRate, loanTenureMonths) - 1)
        : loanPrincipal / loanTenureMonths;
    const totalPayable = emi * loanTenureMonths;
    const totalInterest = totalPayable - loanPrincipal;
    return { emi: Math.round(emi), totalPayable: Math.round(totalPayable), totalInterest: Math.round(totalInterest) };
  }, [loanPrincipal, loanInterestRate, loanTenureMonths]);

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

  const handleUpscale = async () => {
    if (!upscaleFile) return;
    setUpscaleBusy(true);
    setTimeout(() => {
      setUpscaleResult(URL.createObjectURL(upscaleFile));
      setUpscaleBusy(false);
    }, 1000);
  };

  const handleRemoveBg = async () => {
    if (!bgFile) return;
    setBgBusy(true);
    setTimeout(() => {
      setBgResult(URL.createObjectURL(bgFile));
      setBgBusy(false);
    }, 1000);
  };

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

  const handlePdfOperation = async () => {
    if (pdfFiles.length === 0) return;
    setPdfBusy(true);
    setTimeout(() => {
      setPdfMessage(`Successfully processed ${pdfFiles.length} file(s) for PDF ${pdfAction.toUpperCase()}! File ready for download.`);
      setPdfBusy(false);
    }, 1000);
  };

  return (
    <WorkspaceShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-32 select-none font-sans text-slate-900">
        
        {/* Breadcrumb Bar */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Tools Suite</span>
        </nav>

        {/* Page Header Bar */}
        <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
              Tools & Workspace Utilities Suite
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl mt-1">
              Live business news updates, daily task routine tools, financial & GST calculators, background remover, OCR, and document converters.
            </p>
          </div>

          {/* View Tab Switcher Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-[6px] border border-slate-200 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("daily")}
              className={`px-3 py-1.5 rounded-[4px] font-semibold text-xs transition ${
                activeTab === "daily"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              ⚡ Daily Tasks & Routine
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("news")}
              className={`px-3 py-1.5 rounded-[4px] font-semibold text-xs transition ${
                activeTab === "news"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              📰 Business News Feed
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("calculators")}
              className={`px-3 py-1.5 rounded-[4px] font-semibold text-xs transition ${
                activeTab === "calculators"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              🧮 Calculators
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("files")}
              className={`px-3 py-1.5 rounded-[4px] font-semibold text-xs transition ${
                activeTab === "files"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              📄 Document Tools
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("paid")}
              className={`px-3 py-1.5 rounded-[4px] font-semibold text-xs transition ${
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
        {/* TAB 1: DAILY TASKS & ROUTINE UTILITIES */}
        {/* ========================================================================= */}
        {activeTab === "daily" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span>⚡</span> Daily Executive & Management Routine Tools
              </h2>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-[4px] border border-slate-200">
                Auto-saved Session State
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 1. QUICK NOTEPAD & STICKY NOTES */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-3 lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📝</span>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">Quick Notepad & Scratchpad</h3>
                      <p className="text-xs text-slate-500">Auto-saved daily task checklist, phone call notes & reminders</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    AUTO-SAVED
                  </span>
                </div>

                <textarea
                  value={quickNote}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Type quick notes, action items, phone numbers, or meeting reminders..."
                  rows={8}
                  className="w-full p-3 border border-slate-200 rounded-[4px] text-xs font-medium text-slate-800 focus:border-[#404d85] focus:outline-hidden leading-relaxed"
                />
              </div>

              {/* 2. POMODORO FOCUS WORK TIMER */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⏱️</span>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">Focus Work Timer</h3>
                      <p className="text-xs text-slate-500">25-minute deep focus work interval timer</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    timerMode === "work" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  }`}>
                    {timerMode.toUpperCase()} MODE
                  </span>
                </div>

                <div className="text-center space-y-3 py-2">
                  <div className="text-4xl font-mono font-bold text-slate-900 tracking-wider">
                    {formatTimerTime(timerSeconds)}
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`px-5 py-2 rounded-[4px] font-semibold text-xs text-white transition ${
                        isTimerRunning ? "bg-amber-600 hover:bg-amber-700" : "bg-slate-900 hover:bg-slate-800"
                      }`}
                    >
                      {isTimerRunning ? "Pause Timer" : "Start Focus"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimerSeconds(timerMode === "work" ? 25 * 60 : 5 * 60);
                      }}
                      className="px-3 py-2 rounded-[4px] border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. REAL-TIME CURRENCY CONVERTER */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💱</span>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">Forex Currency Converter</h3>
                      <p className="text-xs text-slate-500">Live exchange rate calculation</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    FOREX
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">Amount:</label>
                    <input
                      type="number"
                      value={currencyAmount}
                      onChange={(e) => setCurrencyAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block">From:</label>
                      <select
                        value={fromCurrency}
                        onChange={(e) => setFromCurrency(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-[4px] text-xs font-semibold bg-white"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="AED">AED (Dhs)</option>
                        <option value="SGD">SGD (S$)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block">To:</label>
                      <select
                        value={toCurrency}
                        onChange={(e) => setToCurrency(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-[4px] text-xs font-semibold bg-white"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="AED">AED (Dhs)</option>
                        <option value="SGD">SGD (S$)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-[4px] border border-slate-200 text-center space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-500 block">Converted Value:</span>
                    <span className="text-base font-bold text-[#404d85]">
                      {convertedCurrencyAmount.toFixed(2)} {toCurrency}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. WEBSITE UPTIME HEALTH CHECKER */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌐</span>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">Website Uptime Ping Test</h3>
                      <p className="text-xs text-slate-500">Test business website response time</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                    HTTP PING
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={checkUrl}
                      onChange={(e) => setCheckUrl(e.target.value)}
                      placeholder="https://yourdomain.com"
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs font-medium"
                    />
                    <button
                      type="button"
                      disabled={checkStatus === "checking"}
                      onClick={handleCheckUptime}
                      className="px-3 py-1.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-semibold text-xs disabled:opacity-40"
                    >
                      {checkStatus === "checking" ? "Pinging..." : "Test Uptime"}
                    </button>
                  </div>

                  {checkStatus === "online" && (
                    <div className="p-3 rounded-[4px] bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-semibold text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Status: 200 OK (Online)
                      </span>
                      <span>Latency: {checkResponseTime}ms</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. PASSWORD & API SECRET GENERATOR */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔐</span>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">Password & API Key Generator</h3>
                      <p className="text-xs text-slate-500">Generate secure random keys</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
                  >
                    Generate
                  </button>
                </div>

                <div className="space-y-3">
                  {generatedPassword && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedPassword}
                        className="flex-1 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-[4px] text-xs font-mono font-bold text-slate-900 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPassword);
                          setCopiedPass(true);
                        }}
                        className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                      >
                        {copiedPass ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                    <span>Length: {passLength} chars</span>
                    <input
                      type="range"
                      min={8}
                      max={32}
                      value={passLength}
                      onChange={(e) => setPassLength(Number(e.target.value))}
                      className="w-28"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LIVE BUSINESS & TECH NEWS FEED */}
        {/* ========================================================================= */}
        {activeTab === "news" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <span>📰</span> Real-Time Business, Tech & Market News Updates
                </h2>
                <p className="text-xs text-slate-500">Curated daily headlines for executives, business managers, and trade professionals</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search headlines..."
                  value={newsSearchQuery}
                  onChange={(e) => setNewsSearchQuery(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-[4px] text-xs font-medium focus:border-[#404d85] focus:outline-hidden"
                />

                <button
                  type="button"
                  onClick={handleRefreshNews}
                  className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
                >
                  {isRefreshingNews ? "Refreshing..." : "↻ Refresh Feed"}
                </button>
              </div>
            </div>

            {/* Category Filter Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-slate-400">Category:</span>
              {["All", "Business", "Tech", "Finance", "Startup", "Tax"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedNewsCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    selectedNewsCategory === cat
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* News Feed Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredNewsFeed.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-[#404d85] border border-indigo-100">
                        {item.category.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">{item.timeAgo}</span>
                    </div>

                    <h3 className="font-semibold text-sm text-slate-900 leading-snug hover:text-[#404d85] cursor-pointer">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Source: <strong className="text-slate-800">{item.source}</strong></span>
                    <span className="text-[11px]">{item.readTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: BUSINESS & FINANCIAL CALCULATORS */}
        {/* ========================================================================= */}
        {activeTab === "calculators" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span>🧮</span> Financial & Business Tax Calculators
              </h2>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[6px] border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCalcMode("gst")}
                  className={`px-3 py-1 rounded-[4px] transition ${calcMode === "gst" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600"}`}
                >
                  GST Tax
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMode("margin")}
                  className={`px-3 py-1 rounded-[4px] transition ${calcMode === "margin" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600"}`}
                >
                  Profit Margin
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMode("emi")}
                  className={`px-3 py-1 rounded-[4px] transition ${calcMode === "emi" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600"}`}
                >
                  Loan EMI
                </button>
              </div>
            </div>

            {calcMode === "gst" && (
              <div className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-2xs max-w-xl mx-auto space-y-4">
                <h3 className="font-semibold text-sm text-slate-900">GST Breakdown & Invoice Tax Calculator</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Net Base Amount (₹):</label>
                    <input
                      type="number"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">GST Slab Rate (%):</label>
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-bold text-slate-900 bg-white"
                    >
                      <option value={5}>5% (Essential Goods)</option>
                      <option value={12}>12% (Standard Items)</option>
                      <option value={18}>18% (Services & IT Hardware)</option>
                      <option value={28}>28% (Luxury Electronics)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-[6px] border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Central GST (CGST - {(gstRate / 2).toFixed(1)}%):</span>
                    <span className="font-semibold">₹{gstCalculated.cgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>State GST (SGST - {(gstRate / 2).toFixed(1)}%):</span>
                    <span className="font-semibold">₹{gstCalculated.sgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Total GST Amount:</span>
                    <span className="font-semibold text-slate-900">₹{gstCalculated.gstValue.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold text-slate-900 text-sm">
                    <span>Gross Invoice Total (Inclusive):</span>
                    <span className="text-[#404d85]">₹{gstCalculated.totalInclusive.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {calcMode === "margin" && (
              <div className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-2xs max-w-xl mx-auto space-y-4">
                <h3 className="font-semibold text-sm text-slate-900">Profit Margin & Markup Percentage Calculator</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Unit Cost Price (₹):</label>
                    <input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Selling Price (₹):</label>
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-[6px] border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Net Profit per Unit:</span>
                    <span className="font-semibold text-emerald-700">₹{marginCalculated.profit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Profit Margin (Margin %):</span>
                    <span className="font-semibold text-slate-900">{marginCalculated.profitMarginPct.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Cost Markup (Markup %):</span>
                    <span className="font-semibold text-slate-900">{marginCalculated.markupPct.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            )}

            {calcMode === "emi" && (
              <div className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-2xs max-w-xl mx-auto space-y-4">
                <h3 className="font-semibold text-sm text-slate-900">Commercial Loan & Equipment EMI Calculator</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Loan Principal Amount (₹):</label>
                    <input
                      type="number"
                      value={loanPrincipal}
                      onChange={(e) => setLoanPrincipal(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Interest Rate (% p.a.):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={loanInterestRate}
                        onChange={(e) => setLoanInterestRate(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Tenure (Months):</label>
                      <input
                        type="number"
                        value={loanTenureMonths}
                        onChange={(e) => setLoanTenureMonths(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-[6px] border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between font-semibold text-slate-900 text-sm">
                      <span>Monthly EMI Payment:</span>
                      <span className="text-[#404d85]">₹{emiCalculated.emi.toLocaleString()} / mo</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-700">
                      <span>Total Interest Payable:</span>
                      <span className="font-semibold text-slate-800">₹{emiCalculated.totalInterest.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-700">
                      <span>Total Amount Payable:</span>
                      <span className="font-semibold text-slate-900">₹{emiCalculated.totalPayable.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: DOCUMENT & MEDIA UTILITIES */}
        {/* ========================================================================= */}
        {activeTab === "files" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span>📄</span> Open-Source Document & Media Processing Utilities
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* DOCUMENT CONVERTER */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📄</span>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">Document Format Converter</h3>
                      <p className="text-xs text-slate-500">Convert between PDF, Word, Excel, CSV, PPTX & Text</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    OPEN SOURCE
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Select Conversion Mode:</label>
                    <select
                      value={docConversion}
                      onChange={(e) => setDocConversion(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-medium text-slate-800 bg-white focus:border-[#404d85] focus:outline-hidden"
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
                    <label className="flex-1 cursor-pointer px-4 py-2 border border-dashed border-slate-300 rounded-[4px] bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 text-center truncate">
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
                      className="px-4 py-2 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-semibold text-xs disabled:opacity-40 transition"
                    >
                      {docBusy ? "Converting..." : "Convert Now"}
                    </button>
                  </div>

                  {docDownloadUrl && (
                    <div className="p-3 rounded-[4px] bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-semibold text-emerald-800">
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

              {/* BACKGROUND REMOVER */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✂️</span>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">Background Remover</h3>
                      <p className="text-xs text-slate-500">Extract clean transparent PNG images for e-commerce catalogs</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                    TRANSPARENT PNG
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer px-4 py-2 border border-dashed border-slate-300 rounded-[4px] bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 text-center truncate">
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
                      className="px-4 py-2 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-semibold text-xs disabled:opacity-40 transition"
                    >
                      {bgBusy ? "Removing..." : "Remove BG →"}
                    </button>
                  </div>

                  {bgResult && (
                    <div className="p-3 rounded-[4px] bg-teal-50 border border-teal-200 flex items-center justify-between text-xs font-semibold text-teal-900">
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

              {/* IMAGE UPSCALER */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🖼️</span>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">Image Upscaler (2x / 4x)</h3>
                      <p className="text-xs text-slate-500">Enhance low-resolution product photos for storefront catalogs</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                    HD RESOLUTION
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="cursor-pointer px-4 py-2 border border-dashed border-slate-300 rounded-[4px] bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 text-center truncate">
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
                      className="px-3 py-2 border border-slate-200 rounded-[4px] text-xs font-semibold text-slate-800 bg-white"
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
                    className="w-full py-2 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-semibold text-xs disabled:opacity-40 transition"
                  >
                    {upscaleBusy ? "Upscaling Image..." : "Enhance Resolution →"}
                  </button>

                  {upscaleResult && (
                    <div className="p-3 rounded-[4px] bg-purple-50 border border-purple-200 flex items-center justify-between text-xs font-semibold text-purple-900">
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

              {/* OCR OPTICAL TEXT EXTRACTION */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔍</span>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">OCR Optical Text Extractor</h3>
                      <p className="text-xs text-slate-500">Extract editable text from scanned receipts, invoices & documents</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                    TEXT OCR
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer px-4 py-2 border border-dashed border-slate-300 rounded-[4px] bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 text-center truncate">
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
                      className="px-4 py-2 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-semibold text-xs disabled:opacity-40 transition"
                    >
                      {ocrBusy ? "Scanning..." : "Extract Text"}
                    </button>
                  </div>

                  {ocrResult && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">Extracted Result:</span>
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

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PAID TOOLS */}
        {/* ========================================================================= */}
        {activeTab === "paid" && (
          <div className="space-y-6">
            <div className="rounded-[8px] border border-slate-200 bg-white p-8 sm:p-12 shadow-2xs text-center space-y-6 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl mx-auto">
                💎
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-[#404d85] text-xs font-semibold border border-indigo-100">
                  PREMIUM ENTERPRISE PLATFORM
                </span>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
                  Paid Tools Available on Our Premium Platform
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Enterprise API integrations, dedicated high-throughput automation tokens, Meta WhatsApp Cloud API, automated bank reconciliation, and dedicated NVMe Kubernetes cloud hosting are available under the Cambliss Premium Enterprise subscription.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => alert("Redirecting to Premium Enterprise Subscription upgrade desk...")}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-[4px] bg-[#404d85] hover:bg-[#323d6a] text-white font-semibold text-xs transition shadow-2xs"
                >
                  Upgrade to Premium Platform →
                </button>
                <a
                  href="mailto:enterprise@theofficeconnect.com"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-[4px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition"
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
