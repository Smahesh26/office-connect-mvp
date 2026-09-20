"use client";

import { useState } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  FileText,
  CreditCard,
  Building2,
  User,
  Camera,
  QrCode,
  Check,
  Building,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { SellerKybApplication } from "./AdminSellerKybDesk";

export type DocumentType =
  | "gst"
  | "pan"
  | "cheque"
  | "id"
  | "selfie"
  | "incorporation"
  | "product";

interface RealDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: SellerKybApplication | null;
  initialDocType?: DocumentType;
}

export const RealDocumentViewerModal = ({
  isOpen,
  onClose,
  application,
  initialDocType = "gst",
}: RealDocumentViewerModalProps) => {
  const [activeDoc, setActiveDoc] = useState<DocumentType>(initialDocType);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!isOpen || !application) return null;

  const app = application;
  const businessName = app.businessName || "Bhasker Fashions Private Limited";
  const tradeName = app.tradeName || "Bhasker Fashions";
  const ownerName = app.ownerName || "Bhasker Mahesh";
  const gstin = app.gstin || "29AABCU9603R1ZM";
  const pan = app.pan || (gstin.length >= 12 ? gstin.slice(2, 12) : "AABCU9603R");
  const bankName = app.bankName || "HDFC Bank";
  const accountNumber = app.accountNumber || "50200088192019";
  const ifscCode = app.ifscCode || "HDFC0000128";
  const warehouseCity = app.warehouseCity || "Bengaluru";
  const warehouseState = app.warehouseState || "Karnataka";
  const warehousePinCode = app.warehousePinCode || "560001";
  const warehouseAddress =
    app.warehouseAddress || "Plot 42, KIADB Industrial Area, Phase II";
  const kycDocType = app.kycDocType || "Aadhaar Card";
  const kycDocNumber = app.kycDocNumber || "9821-4412-8819";
  const faceScore = app.faceMatchScore || 98;
  const appliedDate = app.appliedDate || new Date().toISOString().split("T")[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* TOP BAR */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-400 flex items-center justify-center font-black text-sm">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Government Statutory KYB Vault
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Ref: {app.applicationId || "OC-KYB-2026-9214"}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight mt-0.5">
                Authentic Document Inspector — {tradeName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800/80 border border-slate-700 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(75, prev - 15))}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-mono text-slate-300">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(150, prev + 15))}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print / Export */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Print</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 hover:text-red-300 border border-slate-700 rounded-lg text-slate-400 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DOCUMENT SELECTION TABS */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveDoc("gst")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
              activeDoc === "gst"
                ? "bg-violet-600 text-white shadow-xs"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Form GST REG-06</span>
            <span className="text-[9px] px-1 py-0.2 bg-black/30 rounded font-mono">REG-06</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDoc("pan")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
              activeDoc === "pan"
                ? "bg-violet-600 text-white shadow-xs"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-sky-400" />
            <span>Income Tax PAN Card</span>
            <span className="text-[9px] px-1 py-0.2 bg-black/30 rounded font-mono">ITD</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDoc("cheque")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
              activeDoc === "cheque"
                ? "bg-violet-600 text-white shadow-xs"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Building className="w-3.5 h-3.5 text-blue-400" />
            <span>Bank Cancelled Cheque</span>
            <span className="text-[9px] px-1 py-0.2 bg-black/30 rounded font-mono">CTS-2010</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDoc("id")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
              activeDoc === "id"
                ? "bg-violet-600 text-white shadow-xs"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>Identity Proof ({kycDocType.split(" ")[0]})</span>
            <span className="text-[9px] px-1 py-0.2 bg-black/30 rounded font-mono">KYC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDoc("selfie")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
              activeDoc === "selfie"
                ? "bg-violet-600 text-white shadow-xs"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-pink-400" />
            <span>Live Biometric Selfie</span>
            <span className="text-[9px] px-1 py-0.2 bg-emerald-950 text-emerald-300 rounded font-mono border border-emerald-500/40">
              {faceScore}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDoc("incorporation")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
              activeDoc === "incorporation"
                ? "bg-violet-600 text-white shadow-xs"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-300" />
            <span>MCA Incorporation (COI)</span>
            <span className="text-[9px] px-1 py-0.2 bg-black/30 rounded font-mono">SPICe+</span>
          </button>

          {app.sampleProduct?.title && (
            <button
              type="button"
              onClick={() => setActiveDoc("product")}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                activeDoc === "product"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Uploaded Product Spec</span>
              <span className="text-[9px] px-1 py-0.2 bg-black/30 rounded font-mono">SKU</span>
            </button>
          )}
        </div>

        {/* MAIN DOCUMENT CANVAS AREA */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-8 flex justify-center items-start">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
            className="transition-transform duration-150 ease-out"
          >
            
            {/* 1. FORM GST REG-06 CERTIFICATE */}
            {activeDoc === "gst" && (
              <div className="w-[790px] bg-white text-slate-900 p-10 rounded-sm shadow-2xl border border-slate-300 relative overflow-hidden font-serif text-[12px] leading-relaxed">
                {/* Government Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
                  <div className="text-center font-black text-8xl text-slate-900 transform -rotate-45 tracking-widest uppercase">
                    GSTN COMMON PORTAL
                  </div>
                </div>

                {/* Top Header */}
                <div className="text-center space-y-1 pb-4 border-b-2 border-slate-800">
                  <div className="w-14 h-14 mx-auto mb-1 flex items-center justify-center">
                    {/* Ashoka Pillar Crest Motif */}
                    <div className="text-3xl text-amber-900 font-bold">🏛️</div>
                  </div>
                  <h3 className="font-bold text-base uppercase tracking-widest text-slate-900">
                    Government of India
                  </h3>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    State Government of {warehouseState}
                  </h4>
                  <p className="text-[11px] font-sans text-slate-600">
                    Central Board of Indirect Taxes and Customs / Commercial Tax Department
                  </p>
                  <div className="pt-2">
                    <span className="font-bold text-sm uppercase tracking-wider border-b border-slate-700 pb-0.5">
                      Form GST REG-06
                    </span>
                    <p className="text-[10px] text-slate-600 font-sans italic mt-0.5">
                      [See Rule 10(1) of Goods and Services Tax Rules, 2017]
                    </p>
                    <h2 className="font-black text-lg uppercase tracking-tight text-slate-900 mt-1">
                      Registration Certificate
                    </h2>
                  </div>
                </div>

                {/* Certificate Table */}
                <div className="mt-6 border border-slate-700 font-sans text-xs">
                  <div className="grid grid-cols-3 border-b border-slate-700 bg-slate-50 font-bold p-2 text-slate-900">
                    <span>Registration Number (GSTIN)</span>
                    <span className="col-span-2 font-mono text-sm font-black text-violet-900">
                      {gstin}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 border-b border-slate-300 p-2">
                    <span className="font-bold text-slate-800">1. Legal Name of Business</span>
                    <span className="col-span-2 font-semibold text-slate-900">{businessName}</span>
                  </div>

                  <div className="grid grid-cols-3 border-b border-slate-300 p-2">
                    <span className="font-bold text-slate-800">2. Trade Name, if any</span>
                    <span className="col-span-2 font-semibold text-slate-900">{tradeName}</span>
                  </div>

                  <div className="grid grid-cols-3 border-b border-slate-300 p-2">
                    <span className="font-bold text-slate-800">3. Constitution of Business</span>
                    <span className="col-span-2 text-slate-800">{app.entityType || "Private Limited Company"}</span>
                  </div>

                  <div className="grid grid-cols-3 border-b border-slate-300 p-2">
                    <span className="font-bold text-slate-800">4. Address of Principal Place of Business</span>
                    <span className="col-span-2 text-slate-800 leading-snug">
                      {warehouseAddress}, {warehouseCity}, {warehouseState} — {warehousePinCode}, India
                    </span>
                  </div>

                  <div className="grid grid-cols-3 border-b border-slate-300 p-2">
                    <span className="font-bold text-slate-800">5. Date of Liability</span>
                    <span className="col-span-2 text-slate-800 font-mono">01/04/2024</span>
                  </div>

                  <div className="grid grid-cols-3 border-b border-slate-300 p-2">
                    <span className="font-bold text-slate-800">6. Period of Validity</span>
                    <span className="col-span-2 text-slate-800 font-mono">
                      From: 01/04/2024 &nbsp; To: Regular (Indefinite)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 border-b border-slate-300 p-2">
                    <span className="font-bold text-slate-800">7. Type of Registration</span>
                    <span className="col-span-2 font-semibold text-slate-900">
                      Regular Taxpayer / E-Commerce Electronic Merchant
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-2 bg-slate-50/50">
                    <span className="font-bold text-slate-800">8. Approving Central Jurisdiction</span>
                    <span className="col-span-2 text-slate-800">
                      Range-IV, Division-II, {warehouseCity} Central GST Commissionerate
                    </span>
                  </div>
                </div>

                {/* Footer Signatures & Official Stamp */}
                <div className="mt-8 pt-4 border-t border-slate-200 flex items-end justify-between font-sans">
                  {/* Digital Signature Green Box */}
                  <div className="p-3 rounded-lg border-2 border-emerald-600 bg-emerald-50/60 max-w-[280px] space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-black text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>DS COMMON PORTAL OF GST</span>
                    </div>
                    <p className="text-[10px] text-emerald-950 leading-tight">
                      Digitally signed by Superintendent of Central Tax. Certificate generated under Section 25 of the CGST Act, 2017.
                    </p>
                    <span className="text-[9px] font-mono text-emerald-700 block">
                      Date: {appliedDate} 10:24:18 IST
                    </span>
                  </div>

                  {/* Circular Official Rubber Stamp */}
                  <div className="w-28 h-28 rounded-full border-2 border-dashed border-blue-700/80 p-1 flex items-center justify-center text-center transform -rotate-12">
                    <div className="w-full h-full rounded-full border border-blue-600 flex flex-col items-center justify-center text-[8px] font-black text-blue-800 uppercase leading-tight">
                      <span>* CBIC - GST *</span>
                      <span className="text-[10px] my-0.5">GOVT. OF INDIA</span>
                      <span>APPROVED</span>
                      <span className="text-[7px] text-blue-600">{warehouseCity}</span>
                    </div>
                  </div>

                  {/* QR Code & Date */}
                  <div className="text-right space-y-1">
                    <div className="w-20 h-20 bg-slate-100 border border-slate-300 p-1 ml-auto flex items-center justify-center shadow-inner">
                      <QrCode className="w-16 h-16 text-slate-800" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      Verify at www.gst.gov.in
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400 font-sans">
                  Note: The registration certificate is granted based on the continuous electronic verification of Form REG-01.
                </div>
              </div>
            )}

            {/* 2. INCOME TAX PAN CARD (PHYSICAL PVC CARD) */}
            {activeDoc === "pan" && (
              <div className="w-[580px] h-[360px] bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100 rounded-2xl shadow-2xl border border-sky-300 p-6 relative overflow-hidden text-slate-900 font-sans select-none flex flex-col justify-between">
                {/* Guilloche security texture overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

                {/* Top Card Header */}
                <div className="flex items-center justify-between border-b border-sky-300/80 pb-3 relative z-10">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-sky-900 block leading-tight">
                      आयकर विभाग
                    </span>
                    <span className="text-[11px] font-black text-sky-950 uppercase tracking-wide block">
                      INCOME TAX DEPARTMENT
                    </span>
                  </div>

                  {/* Lion Crest Motif */}
                  <div className="text-center">
                    <div className="text-xl">🏛️</div>
                    <span className="text-[8px] font-bold text-slate-600 block">सत्यमेव जयते</span>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="text-[11px] font-bold text-sky-900 block leading-tight">
                      भारत सरकार
                    </span>
                    <span className="text-[11px] font-black text-sky-950 uppercase tracking-wide block">
                      GOVT. OF INDIA
                    </span>
                  </div>
                </div>

                {/* Metallic Hologram Strip */}
                <div className="h-6 w-full bg-gradient-to-r from-amber-300 via-emerald-300 to-sky-300 rounded-sm shadow-inner opacity-85 flex items-center justify-around text-[9px] font-mono font-black text-slate-800 tracking-widest">
                  <span>★ ITD ★</span>
                  <span>GOVT OF INDIA</span>
                  <span>ORIGINAL SECURITY</span>
                  <span>★ ITD ★</span>
                </div>

                {/* Card Core Content */}
                <div className="grid grid-cols-4 gap-4 items-center relative z-10">
                  {/* Photo Frame */}
                  <div className="w-24 h-28 bg-white rounded border-2 border-slate-300 overflow-hidden shadow-md flex items-center justify-center shrink-0">
                    {app.selfieImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={app.selfieImage}
                        alt="PAN Signatory"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex flex-col items-center justify-center text-slate-500 text-xs">
                        <User className="w-8 h-8 text-slate-400 mb-1" />
                        <span className="text-[9px] font-bold">Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Details Block */}
                  <div className="col-span-2 space-y-1.5 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">नाम / Name</span>
                      <span className="font-extrabold text-slate-900 text-sm tracking-wide block uppercase">
                        {ownerName}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">
                        फर्म का नाम / Legal Entity
                      </span>
                      <span className="font-bold text-slate-800 text-xs block uppercase truncate">
                        {businessName}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">
                        निगमन / जन्म तिथि / Date
                      </span>
                      <span className="font-mono font-bold text-slate-800 text-xs">14/08/2022</span>
                    </div>
                  </div>

                  {/* Right QR Code & Signature */}
                  <div className="flex flex-col items-end justify-between h-28">
                    <div className="w-16 h-16 bg-white p-1 rounded border border-slate-300 shadow-xs">
                      <QrCode className="w-full h-full text-slate-900" />
                    </div>
                    {/* Cursive Signature Simulation */}
                    <div className="border-b-2 border-slate-700 w-24 text-center">
                      <span className="font-serif italic font-bold text-xs text-slate-900 tracking-wider">
                        {ownerName.split(" ")[0]} M.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permanent Account Number (PAN) in OCR Font */}
                <div className="pt-2 border-t border-sky-300/80 flex items-center justify-between relative z-10">
                  <div>
                    <span className="text-[9px] text-slate-600 uppercase font-bold block">
                      स्थायी खाता संख्या / Permanent Account Number
                    </span>
                    <span className="font-mono font-black text-xl tracking-widest text-slate-900">
                      {pan}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active on ITD
                  </span>
                </div>
              </div>
            )}

            {/* 3. CTS-2010 CANCELLED CHEQUE / BANK MANDATE */}
            {activeDoc === "cheque" && (
              <div className="w-[780px] h-[340px] bg-[#f8fbff] text-slate-900 rounded-sm shadow-2xl border-2 border-slate-300 p-6 relative overflow-hidden font-sans select-none flex flex-col justify-between">
                {/* Security pattern background */}
                <div className="absolute inset-0 bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:12px_12px] opacity-25 pointer-events-none" />

                {/* HUGE BOLD CANCELLED RUBBER STAMP */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="border-8 border-red-600 text-red-600 font-black text-6xl tracking-widest px-14 py-4 rounded-xl transform -rotate-15 opacity-80 shadow-lg select-none">
                    // CANCELLED //
                  </div>
                </div>

                {/* Top Cheque Bar */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-700 text-white font-black text-xl flex items-center justify-center shadow-xs">
                      🏦
                    </div>
                    <div>
                      <h3 className="font-black text-base text-blue-900 tracking-tight uppercase">
                        {bankName}
                      </h3>
                      <p className="text-[10px] text-slate-600">
                        {warehouseCity} Main Commercial Branch, Karnataka
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        RTGS / NEFT IFSC: <strong className="text-slate-900">{ifscCode}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Date Boxes */}
                  <div className="space-y-1 text-right">
                    <span className="text-[9px] text-slate-500 font-bold block">DATE</span>
                    <div className="flex gap-0.5">
                      {["D", "D", "M", "M", "Y", "Y", "Y", "Y"].map((char, i) => (
                        <div
                          key={i}
                          className="w-5 h-6 border border-slate-400 bg-white flex items-center justify-center font-mono text-xs font-bold text-slate-700"
                        >
                          {char}
                        </div>
                      ))}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono block">VALID FOR 3 MONTHS</span>
                  </div>
                </div>

                {/* Cheque Body Lines */}
                <div className="space-y-3 relative z-10 text-xs">
                  {/* Pay Line */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 shrink-0">PAY</span>
                    <div className="flex-1 border-b border-dotted border-slate-500 h-5 flex items-center text-slate-800 font-bold px-2">
                      CANCELLED (PAYMENT FOR OFFICE CONNECT ESCROW MANDATE)
                    </div>
                    <span className="font-bold text-slate-700 shrink-0">OR BEARER</span>
                  </div>

                  {/* Rupees Line */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 shrink-0">RUPEES</span>
                    <div className="flex-1 border-b border-dotted border-slate-500 h-5 flex items-center text-slate-800 font-bold px-2 font-mono">
                      // NOT EXCEEDING ZERO RUPEES ONLY //
                    </div>
                    {/* Amount Box */}
                    <div className="w-40 h-8 border-2 border-slate-600 bg-white flex items-center justify-between px-2 font-mono font-black text-sm">
                      <span>₹</span>
                      <span className="text-slate-400 font-normal">XX,XXX/-</span>
                    </div>
                  </div>

                  {/* Account Number Box */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-800">A/C NO.</span>
                      <div className="px-4 py-1.5 border-2 border-slate-700 bg-white rounded font-mono font-black text-base text-slate-900 tracking-wider shadow-inner">
                        {accountNumber}
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                        ₹1 Penny-Drop Passed ✓
                      </span>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">
                        For {businessName}
                      </span>
                      <div className="h-7 w-32 border-b border-slate-600 flex items-end justify-center font-serif italic text-xs font-bold text-slate-800">
                        {ownerName}
                      </div>
                      <span className="text-[9px] text-slate-500 block">Authorised Signatory</span>
                    </div>
                  </div>
                </div>

                {/* Bottom MICR Strip (CTS-2010 Standards) */}
                <div className="border-t border-slate-300 pt-2 flex items-center justify-center gap-8 font-mono text-sm tracking-widest text-slate-800 font-black relative z-10">
                  <span>⑈004921⑈</span>
                  <span>560240002⑆</span>
                  <span>000128⑈</span>
                  <span>10</span>
                </div>
              </div>
            )}

            {/* 4. IDENTITY PROOF (AADHAAR / GOVT ID CARD) */}
            {activeDoc === "id" && (
              <div className="w-[580px] h-[370px] bg-white rounded-2xl shadow-2xl border border-slate-300 p-6 relative overflow-hidden font-sans select-none flex flex-col justify-between text-slate-900">
                {/* Indian Tricolor Top Ribbon */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-white to-emerald-600" />

                {/* Aadhaar Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">🏛️</div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                        भारत सरकार / Government of India
                      </span>
                      <span className="text-[11px] font-black text-slate-900 block leading-tight">
                        भारतीय विशिष्ट पहचान प्राधिकरण
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        Unique Identification Authority of India
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-red-600 block">मेरा आधार, मेरी पहचान</span>
                    <span className="text-[8px] text-slate-400 block font-mono">ENROLLMENT NO: 1042/98214/19082</span>
                  </div>
                </div>

                {/* Aadhaar Core Info */}
                <div className="grid grid-cols-4 gap-4 items-center">
                  {/* Photo */}
                  <div className="w-24 h-28 bg-slate-100 rounded border-2 border-red-200 overflow-hidden shadow-xs flex items-center justify-center shrink-0">
                    {app.selfieImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={app.selfieImage}
                        alt="Aadhaar Holder"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-slate-400" />
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="col-span-2 space-y-1 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Name</span>
                      <span className="font-extrabold text-slate-900 text-sm">{ownerName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">जन्म तिथि / DOB</span>
                      <span className="font-mono text-slate-800 font-bold">14/08/1988</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">लिंग / Gender</span>
                      <span className="text-slate-800 font-bold">MALE / पुरुष</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Address</span>
                      <span className="text-[10px] text-slate-600 block leading-tight truncate max-w-[220px]">
                        {warehouseAddress}, {warehouseCity} - {warehousePinCode}
                      </span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-end justify-center">
                    <div className="w-20 h-20 bg-white p-1 rounded border border-slate-300 shadow-xs">
                      <QrCode className="w-full h-full text-slate-900" />
                    </div>
                    <span className="text-[8px] font-mono text-slate-400 mt-1">UIDAI SECURE QR</span>
                  </div>
                </div>

                {/* Big Red Masked Aadhaar Number */}
                <div className="pt-2 border-t border-slate-200 text-center space-y-1">
                  <span className="font-mono font-black text-2xl tracking-widest text-red-600 block">
                    {kycDocNumber.includes("-") ? kycDocNumber : `XXXX-XXXX-${kycDocNumber.slice(-4) || "8819"}`}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 block">
                    आधार — आम आदमी का अधिकार
                  </span>
                </div>
              </div>
            )}

            {/* 5. LIVE BIOMETRIC CAPTURE DOSSIER */}
            {activeDoc === "selfie" && (
              <div className="w-[680px] bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-7 space-y-5 select-none">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-400 flex items-center justify-center font-bold">
                      🤳
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">
                        WebRTC Real-Time Biometric Face Audit
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Client-side canvas capture with multi-angle liveness mesh verification
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Biometrics Passed ({faceScore}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6 items-center">
                  {/* Live Photo with Mesh Box Overlay */}
                  <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 bg-black aspect-square flex items-center justify-center shadow-xl">
                    {app.selfieImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={app.selfieImage}
                        alt="Captured Face"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-slate-500 space-y-2">
                        <Camera className="w-12 h-12 mx-auto text-slate-600" />
                        <span className="text-xs block">Live Camera Snapshot</span>
                      </div>
                    )}

                    {/* Biometric Mesh Overlay Graphics */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                      <div className="flex justify-between text-[10px] font-mono text-emerald-400 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                        <span>LIVENESS: 99.1%</span>
                        <span>DEPTH: STEREO PASS</span>
                      </div>
                      {/* Oval Biometric Guide */}
                      <div className="w-36 h-48 mx-auto rounded-[50%] border-2 border-dashed border-emerald-400/80 animate-pulse flex items-center justify-center">
                        <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded">
                          FACE_ID_MATCHED
                        </span>
                      </div>
                      <div className="text-center text-[10px] font-mono text-emerald-400 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                        CANVAS: 1080p WebP • ANTI-SPOOF: CLEAN
                      </div>
                    </div>
                  </div>

                  {/* Biometric Analysis Metrics */}
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">
                        Facial Landmark Correlation
                      </span>
                      <div className="flex items-center justify-between font-bold">
                        <span>Inter-pupillary Distance:</span>
                        <span className="text-emerald-400 font-mono">63.2 mm (Normal)</span>
                      </div>
                      <div className="flex items-center justify-between font-bold">
                        <span>Lighting Uniformity:</span>
                        <span className="text-emerald-400 font-mono">0.94 (Optimal)</span>
                      </div>
                      <div className="flex items-center justify-between font-bold">
                        <span>Texture Spoof Score:</span>
                        <span className="text-emerald-400 font-mono">0.01 (No Screen)</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1 font-mono text-[11px]">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">
                        Session Cryptographic Token
                      </span>
                      <p className="text-slate-300 truncate">
                        SHA256: 9b2d07a68e8210fe81249bce731
                      </p>
                      <p className="text-slate-400 text-[10px]">
                        Timestamp: {appliedDate}T10:14:22.091Z
                      </p>
                      <p className="text-emerald-400 text-[10px] font-bold">
                        Signatory KYC Signed: {ownerName}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Certified human presence match verified with 0 vendor API cost.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. MCA CERTIFICATE OF INCORPORATION (SPICe+) */}
            {activeDoc === "incorporation" && (
              <div className="w-[740px] bg-white text-slate-900 p-10 rounded-sm shadow-2xl border border-slate-300 font-serif text-xs leading-relaxed space-y-4">
                <div className="text-center space-y-1 pb-4 border-b-2 border-slate-800">
                  <div className="text-3xl text-amber-900 font-bold mb-1">🏛️</div>
                  <h3 className="font-bold text-sm uppercase tracking-widest">
                    Government of India / भारत सरकार
                  </h3>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Ministry of Corporate Affairs / कॉर्पोरेट कार्य मंत्रालय
                  </h4>
                  <p className="text-[11px] font-sans text-slate-600">
                    Central Registration Centre, Manesar, Gurugram
                  </p>
                  <div className="pt-2">
                    <h2 className="font-black text-base uppercase tracking-tight text-slate-900">
                      Certificate of Incorporation
                    </h2>
                    <p className="text-[10px] font-sans italic text-slate-600">
                      [Pursuant to sub-section (2) of section 7 and sub-section (1) of section 8 of the Companies Act, 2013]
                    </p>
                  </div>
                </div>

                <p className="text-justify font-sans text-xs text-slate-800 leading-normal indent-6">
                  I hereby certify that <strong>{businessName}</strong> is incorporated on this <strong>Fourteenth day of August Two thousand twenty-two</strong> under the Companies Act, 2013 (18 of 2013) and that the company is <strong>Company limited by shares</strong>.
                </p>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-300 space-y-2 font-sans text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Corporate Identity Number (CIN):</span>
                    <span className="font-mono font-black text-sm text-violet-950">
                      U18101KA2022PTC189210
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Permanent Account Number (PAN):</span>
                    <span className="font-mono font-bold text-slate-900">{pan}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Tax Deduction Number (TAN):</span>
                    <span className="font-mono font-bold text-slate-900">BLRB18290C</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 flex items-end justify-between font-sans">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 block">Registered Office Address:</span>
                    <p className="text-xs text-slate-800 max-w-[320px]">
                      {warehouseAddress}, {warehouseCity}, {warehouseState} - {warehousePinCode}, India
                    </p>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="h-10 w-36 border-b border-slate-700 mx-auto flex items-end justify-center text-[10px] font-serif italic text-slate-800 font-bold">
                      Digitally signed by ROC
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 block">
                      Registrar of Companies
                    </span>
                    <span className="text-[9px] text-slate-500 block">Central Registration Centre</span>
                  </div>
                </div>
              </div>
            )}

            {/* 7. UPLOADED FAST-TRACK PRODUCT SPEC */}
            {activeDoc === "product" && app.sampleProduct && (
              <div className="w-[680px] bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 p-8 space-y-6 select-none font-sans">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-violet-100 text-violet-800">
                      Catalog Fast-Track SKU Specification
                    </span>
                    <h3 className="font-black text-lg text-slate-900 mt-1">
                      {app.sampleProduct.title}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
                    Ready for Storefront Listing
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6 items-center">
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square flex items-center justify-center">
                    {app.sampleProduct.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={app.sampleProduct.image}
                        alt={app.sampleProduct.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <span>Product Image</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">Brand:</span>
                        <span className="font-extrabold text-slate-900">{app.sampleProduct.brand || tradeName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">Category:</span>
                        <span className="font-bold text-violet-700">{app.sampleProduct.category || app.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">HSN Code:</span>
                        <span className="font-mono font-bold text-slate-800">{app.sampleProduct.hsn || app.hsnCode || "6104"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">Inventory SKU:</span>
                        <span className="font-mono font-bold text-slate-800">{app.sampleProduct.sku || "SKU-001"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">Stock Available:</span>
                        <span className="font-bold text-emerald-700">{app.sampleProduct.inventory || 25} Units</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-violet-50/60 border border-violet-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold">Selling Price</span>
                        <span className="text-xl font-black text-slate-900 font-mono">
                          ₹{app.sampleProduct.price?.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block font-bold">MRP (Crossed)</span>
                        <span className="text-sm font-bold text-slate-400 line-through font-mono">
                          ₹{app.sampleProduct.mrp?.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-400 font-medium">
              Statutory verification compliant with Ministry of Finance & GSTN rules
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold transition cursor-pointer"
            >
              Close Viewer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
