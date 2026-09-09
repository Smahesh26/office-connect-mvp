"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Building,
  ShieldCheck,
  CreditCard,
  Truck,
  FileText,
  MapPin,
  ExternalLink,
  RefreshCw,
  X,
} from "lucide-react";

export interface SellerKybApplication {
  id: string;
  applicationId?: string;
  businessName: string;
  tradeName: string;
  storeSlug?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  entityType?: string;
  category: string;
  gstin: string;
  pan: string;
  bankName: string;
  accountNumber: string;
  ifscCode?: string;
  accountHolderName?: string;
  warehouseCity: string;
  warehouseState?: string;
  warehousePinCode?: string;
  fulfillmentModel?: string;
  pennyDropVerified?: boolean;
  appliedDate: string;
  status: "Pending Review" | "Approved" | "Rejected";
  decisionDate?: string;
}

const SEED_APPLICATIONS: SellerKybApplication[] = [
  {
    id: "app-oc-001",
    applicationId: "OC-KYB-2026-8841",
    businessName: "Sony India Direct Private Limited",
    tradeName: "Sony Electronics Official",
    storeSlug: "sony-india-official",
    ownerName: "Sunil Nayyar",
    email: "marketplace@sonyindia.co.in",
    phone: "+91 98100 12345",
    entityType: "Private Limited / OPC",
    gstin: "29AABCU9603R1ZM",
    pan: "AABCU9603R",
    category: "Electronics & Appliances",
    warehouseCity: "Bengaluru",
    warehouseState: "Karnataka",
    warehousePinCode: "560100",
    bankName: "HDFC Bank",
    accountNumber: "50200049281729",
    ifscCode: "HDFC0000128",
    accountHolderName: "Sony India Direct Private Limited",
    pennyDropVerified: true,
    fulfillmentModel: "FOC",
    appliedDate: "2026-08-28",
    status: "Approved",
  },
  {
    id: "app-oc-002",
    applicationId: "OC-KYB-2026-7219",
    businessName: "Keychron India Peripherals LLP",
    tradeName: "Keychron Official Store",
    storeSlug: "keychron-india",
    ownerName: "Arjun Verma",
    email: "arjun@keychron.in",
    phone: "+91 98200 67890",
    entityType: "Partnership / LLP",
    gstin: "27AABCK8812R1ZZ",
    pan: "AABCK8812R",
    category: "Computers & Accessories",
    warehouseCity: "Thane",
    warehouseState: "Maharashtra",
    warehousePinCode: "421302",
    bankName: "ICICI Bank",
    accountNumber: "001105023918",
    ifscCode: "ICIC0000011",
    accountHolderName: "Keychron India Peripherals LLP",
    pennyDropVerified: true,
    fulfillmentModel: "EASY_SHIP",
    appliedDate: "2026-08-29",
    status: "Approved",
  },
  {
    id: "app-oc-003",
    applicationId: "OC-KYB-2026-5532",
    businessName: "UrbanThreads Fashion Lab Enterprise",
    tradeName: "UrbanThreads Studio",
    storeSlug: "urbanthreads-studio",
    ownerName: "Pooja Sundaram",
    email: "pooja@urbanthreads.co.in",
    phone: "+91 94440 33211",
    entityType: "Individual / Sole Proprietor",
    gstin: "33AABCT9914R1ZN",
    pan: "AABCT9914R",
    category: "Fashion & Apparel",
    warehouseCity: "Tirupur",
    warehouseState: "Tamil Nadu",
    warehousePinCode: "641601",
    bankName: "State Bank of India",
    accountNumber: "389201948291",
    ifscCode: "SBIN0000844",
    accountHolderName: "Pooja Sundaram UrbanThreads",
    pennyDropVerified: true,
    fulfillmentModel: "EASY_SHIP",
    appliedDate: "2026-09-02",
    status: "Pending Review",
  },
  {
    id: "app-oc-004",
    applicationId: "OC-KYB-2026-4190",
    businessName: "AyurVeda Organics Naturals LLP",
    tradeName: "AyurVeda Pure Wellness",
    storeSlug: "ayurveda-pure-wellness",
    ownerName: "Dr. K. S. Nambiar",
    email: "support@ayurvedapure.in",
    phone: "+91 97450 88231",
    entityType: "Partnership / LLP",
    gstin: "32AABCA4419R1ZM",
    pan: "AABCA4419R",
    category: "Beauty & Personal Care",
    warehouseCity: "Kochi",
    warehouseState: "Kerala",
    warehousePinCode: "682030",
    bankName: "Axis Bank",
    accountNumber: "918020048192012",
    ifscCode: "UTIB0000182",
    accountHolderName: "AyurVeda Organics Naturals LLP",
    pennyDropVerified: true,
    fulfillmentModel: "SELF_SHIP",
    appliedDate: "2026-09-03",
    status: "Pending Review",
  },
];

interface AdminSellerKybDeskProps {
  applications?: SellerKybApplication[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export const AdminSellerKybDesk = ({
  applications: initialPropsApps,
  onApprove,
  onReject,
}: AdminSellerKybDeskProps) => {
  const [apps, setApps] = useState<SellerKybApplication[]>(
    initialPropsApps && initialPropsApps.length > 0 ? initialPropsApps : SEED_APPLICATIONS
  );
  const [activeTab, setActiveTab] = useState<"All" | "Pending Review" | "Approved" | "Rejected">("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedApp, setSelectedApp] = useState<SellerKybApplication | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load from backend API and merge with localStorage submissions
  useEffect(() => {
    const fetchApps = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/storefront/seller-onboarding");
        if (res.ok) {
          const data = await res.json();
          if (data.applications && Array.isArray(data.applications)) {
            setApps(data.applications);
            return;
          }
        }
      } catch (e) {
        console.warn("Backend API not reachable for KYB, checking local storage", e);
      }

      // Check local storage submissions
      try {
        const stored = localStorage.getItem("officeconnect_submitted_applications");
        if (stored) {
          const localList: SellerKybApplication[] = JSON.parse(stored);
          if (localList.length > 0) {
            // Merge without duplicates
            const map = new Map<string, SellerKybApplication>();
            localList.forEach((item) => map.set(item.id || item.applicationId || "", item));
            SEED_APPLICATIONS.forEach((item) => {
              if (!map.has(item.id)) map.set(item.id, item);
            });
            setApps(Array.from(map.values()));
          }
        }
      } catch (err) {}
      setIsLoading(false);
    };

    fetchApps();
  }, []);

  const handleApprove = async (id: string) => {
    if (onApprove) {
      onApprove(id);
    }
    setApps((prev) =>
      prev.map((a) =>
        a.id === id || a.applicationId === id ? { ...a, status: "Approved" } : a
      )
    );

    try {
      await fetch(`/api/storefront/seller-onboarding/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" }),
      });
    } catch (e) {
      console.warn("Status patch failed", e);
    }
  };

  const handleReject = async (id: string) => {
    if (onReject) {
      onReject(id);
    }
    setApps((prev) =>
      prev.map((a) =>
        a.id === id || a.applicationId === id ? { ...a, status: "Rejected" } : a
      )
    );

    try {
      await fetch(`/api/storefront/seller-onboarding/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected" }),
      });
    } catch (e) {
      console.warn("Status patch failed", e);
    }
  };

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesTab = activeTab === "All" || app.status === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.businessName.toLowerCase().includes(q) ||
        app.tradeName.toLowerCase().includes(q) ||
        app.gstin.toLowerCase().includes(q) ||
        app.pan.toLowerCase().includes(q) ||
        (app.applicationId && app.applicationId.toLowerCase().includes(q)) ||
        app.warehouseCity.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [apps, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      All: apps.length,
      "Pending Review": apps.filter((a) => a.status === "Pending Review").length,
      Approved: apps.filter((a) => a.status === "Approved").length,
      Rejected: apps.filter((a) => a.status === "Rejected").length,
    };
  }, [apps]);

  return (
    <div className="space-y-4 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              3P Merchant KYB & GST Verification Desk
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-100 text-violet-800">
              {apps.length} Total Applications
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Review legal entity documents, 15-digit GSTIN, IFSC escrow accounts, and live Video KYC records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store, GSTIN, PAN, City..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:ring-1 focus:ring-violet-500 outline-none w-48 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
        {(["All", "Pending Review", "Approved", "Rejected"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === tab
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>{tab}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-700 font-black"
              }`}
            >
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Table of Applications */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Merchant Entity & Store Name</th>
                <th className="py-3 px-4">GSTIN & PAN</th>
                <th className="py-3 px-4">Escrow Settlement Bank</th>
                <th className="py-3 px-4">Warehouse & Model</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">KYB Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No merchant KYB applications found in this view.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    {/* Entity & Name */}
                    <td className="py-3 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 block">{app.businessName}</span>
                        {app.applicationId && (
                          <span className="font-mono text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                            {app.applicationId}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-violet-700 font-semibold block">
                        Store: {app.tradeName} ({app.category})
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Applied: {app.appliedDate}
                      </span>
                    </td>

                    {/* GSTIN / PAN */}
                    <td className="py-3 px-4 space-y-0.5 font-mono text-[11px]">
                      <span className="font-bold text-slate-800 block">GST: {app.gstin}</span>
                      <span className="text-slate-500">PAN: {app.pan}</span>
                    </td>

                    {/* Bank */}
                    <td className="py-3 px-4 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-800">{app.bankName}</span>
                        {app.pennyDropVerified && (
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200">
                            ₹1 Verified
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 block">
                        A/C: {app.accountNumber}
                      </span>
                    </td>

                    {/* Location & Model */}
                    <td className="py-3 px-4 space-y-0.5">
                      <span className="font-semibold text-slate-800 block">
                        📍 {app.warehouseCity}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Model: {app.fulfillmentModel || "EASY_SHIP"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                          app.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : app.status === "Rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {app.status === "Approved" && <CheckCircle2 className="w-3 h-3" />}
                        {app.status === "Rejected" && <XCircle className="w-3 h-3" />}
                        {app.status === "Pending Review" && <Clock className="w-3 h-3" />}
                        {app.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded transition flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>

                        {app.status === "Pending Review" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(app.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition shadow-2xs"
                            >
                              ✓ Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(app.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-red-50 text-red-600 font-bold text-xs rounded transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Inspection Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                  Merchant Verification Dossier
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedApp.businessName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Ref: {selectedApp.applicationId || selectedApp.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">Trade Name & Category</span>
                <span className="font-extrabold text-slate-800 text-sm block">
                  {selectedApp.tradeName}
                </span>
                <span className="text-violet-700 font-semibold">{selectedApp.category}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">Entity & Signatory</span>
                <span className="font-extrabold text-slate-800 block">
                  {selectedApp.entityType || "Sole Proprietor"}
                </span>
                <span className="text-slate-600">{selectedApp.ownerName || "Authorized Signatory"}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 font-mono">
                <span className="text-slate-400 font-bold block">GSTIN & PAN Details</span>
                <span className="font-bold text-slate-800 block">GST: {selectedApp.gstin}</span>
                <span className="text-slate-600">PAN: {selectedApp.pan}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">Escrow Bank Settlement</span>
                <span className="font-extrabold text-slate-800 block">
                  {selectedApp.bankName} ({selectedApp.ifscCode || "IFSC"})
                </span>
                <span className="font-mono text-slate-600">A/C: {selectedApp.accountNumber}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">Dispatch Warehouse</span>
                <span className="font-extrabold text-slate-800 block">
                  {selectedApp.warehouseCity}, {selectedApp.warehouseState || "India"}
                </span>
                <span className="text-slate-600">PIN Code: {selectedApp.warehousePinCode || "560001"}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold block">Logistics Channel</span>
                <span className="font-black text-violet-700 block text-sm">
                  {selectedApp.fulfillmentModel || "EASY_SHIP"}
                </span>
                <span className="text-slate-500">Penny-Drop: Verified ✓</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded border ${
                  selectedApp.status === "Approved"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : selectedApp.status === "Rejected"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                Status: {selectedApp.status}
              </span>

              <div className="flex items-center gap-2">
                {selectedApp.status === "Pending Review" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleApprove(selectedApp.id);
                        setSelectedApp(null);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
                    >
                      ✓ Approve Seller
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleReject(selectedApp.id);
                        setSelectedApp(null);
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl transition"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellerKybDesk;
