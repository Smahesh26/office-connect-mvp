import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// File storage paths
const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, "seller_onboarding_applications.json");
const BACKEND_DATA_FILE = path.resolve(process.cwd(), "../cambliss-backend/data/seller_onboarding_applications.json");

function ensureDataFile() {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    try {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    } catch (e) {}
  }
  if (!fs.existsSync(LOCAL_DATA_FILE)) {
    try {
      fs.writeFileSync(LOCAL_DATA_FILE, "[]", "utf-8");
    } catch (e) {}
  }
}

function readApplications(): any[] {
  ensureDataFile();
  try {
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const content = fs.readFileSync(LOCAL_DATA_FILE, "utf-8");
      const list = JSON.parse(content || "[]");
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.warn("Could not read local applications file:", e);
  }

  // Fallback to backend data file if present
  try {
    if (fs.existsSync(BACKEND_DATA_FILE)) {
      const content = fs.readFileSync(BACKEND_DATA_FILE, "utf-8");
      const list = JSON.parse(content || "[]");
      if (Array.isArray(list)) return list;
    }
  } catch (e) {}

  return [];
}

function writeApplications(list: any[]) {
  ensureDataFile();
  const serialized = JSON.stringify(list, null, 2);
  try {
    fs.writeFileSync(LOCAL_DATA_FILE, serialized, "utf-8");
  } catch (e) {
    console.warn("Could not write local applications file:", e);
  }

  // Also sync to backend data file so Express backend shares the exact same state
  try {
    const backendDir = path.dirname(BACKEND_DATA_FILE);
    if (!fs.existsSync(backendDir)) {
      fs.mkdirSync(backendDir, { recursive: true });
    }
    fs.writeFileSync(BACKEND_DATA_FILE, serialized, "utf-8");
  } catch (e) {}
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let list = readApplications();

    if (status && status !== "All") {
      list = list.filter(
        (app) => app.status && app.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (app) =>
          (app.businessName && app.businessName.toLowerCase().includes(q)) ||
          (app.tradeName && app.tradeName.toLowerCase().includes(q)) ||
          (app.email && app.email.toLowerCase().includes(q)) ||
          (app.phone && app.phone.toLowerCase().includes(q)) ||
          (app.gstin && app.gstin.toLowerCase().includes(q)) ||
          (app.pan && app.pan.toLowerCase().includes(q)) ||
          (app.applicationId && app.applicationId.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      count: list.length,
      applications: list,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.email) {
      return NextResponse.json(
        { success: false, message: "Missing required email address" },
        { status: 400 }
      );
    }

    const email = data.email.trim().toLowerCase();
    const bName = (data.businessName || data.storeName || (data.ownerName ? `${data.ownerName}'s Business` : "Registered Merchant")).trim();
    const tName = (data.tradeName || data.storeName || bName).trim();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const applicationId = data.applicationId || `OC-KYB-2026-${randomSuffix}`;
    const id = data.id || `app-oc-${Date.now()}`;

    const newApp = {
      id,
      applicationId,
      businessName: bName,
      tradeName: tName,
      storeSlug: (data.storeSlug || tName || bName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      ownerName: (data.ownerName || "Authorized Signatory").trim(),
      email,
      phone: (data.phone || "").trim(),
      entityType: data.entityType || "Individual / Sole Proprietor",
      gstin: data.gstin ? data.gstin.trim() : (data.isGstExempt ? "GST_EXEMPT" : ""),
      pan: data.pan ? data.pan.trim() : (data.gstin ? data.gstin.slice(2, 12) : ""),
      isGstExempt: Boolean(data.isGstExempt),
      category: data.category || "General Merchandise",
      gatedLicenses: Array.isArray(data.gatedLicenses) ? data.gatedLicenses : [],
      warehouseAddress: data.warehouseAddress ? data.warehouseAddress.trim() : "",
      warehouseCity: data.warehouseCity ? data.warehouseCity.trim() : "",
      warehouseState: data.warehouseState ? data.warehouseState.trim() : "",
      warehousePinCode: data.warehousePinCode ? data.warehousePinCode.trim() : "",
      dispatchManagerName: data.dispatchManagerName || data.ownerName || "",
      dispatchManagerPhone: data.dispatchManagerPhone || data.phone || "",
      bankName: data.bankName ? data.bankName.trim() : "",
      accountNumber: data.accountNumber ? data.accountNumber.trim() : "",
      ifscCode: data.ifscCode ? data.ifscCode.toUpperCase().trim() : "",
      accountHolderName: data.accountHolderName ? data.accountHolderName.trim() : bName,
      pennyDropVerified: data.pennyDropVerified ?? true,
      gstRateTier: data.gstRateTier || "18%",
      hsnCode: data.hsnCode ? data.hsnCode.trim() : "",
      automatedInvoicing: data.automatedInvoicing ?? true,
      tcsAccepted: data.tcsAccepted ?? true,
      kycDocType: data.kycDocType || "Aadhaar Card",
      kycDocNumber: data.kycDocNumber ? data.kycDocNumber.trim() : "",
      kycDocUploaded: Boolean(data.kycDocUploaded),
      gstDocUploaded: Boolean(data.gstDocUploaded),
      gstDocName: data.gstDocName || "",
      selfieCaptured: Boolean(data.selfieCaptured),
      selfieImage: data.selfieImage || "",
      faceMatchScore: data.faceMatchScore || 0,
      videoKycSlot: data.videoKycSlot || "Scheduled",
      fulfillmentModel: data.fulfillmentModel || "EASY_SHIP",
      documents: data.documents || {
        gstCertificate: data.gstDocName || (data.gstin ? `GST_REG06_${data.gstin}.pdf` : ""),
        panCard: data.pan ? `PAN_CARD_${data.pan}.pdf` : "",
        cancelledCheque: data.bankName ? `BANK_MANDATE_${data.bankName.toUpperCase().replace(/\s+/g, "_")}.pdf` : "",
        incorporationCertificate: data.entityType !== "Individual / Sole Proprietor" ? `COI_${bName.replace(/\s+/g, "_")}.pdf` : undefined,
        identityProof: `${(data.kycDocType || "AADHAAR").toUpperCase().replace(/\s+/g, "_")}_PROOF.pdf`,
        liveMerchantSelfie: data.selfieImage || undefined,
      },
      sampleProduct: data.sampleProduct || undefined,
      signatureName: (data.signatureName || data.ownerName || "Authorized Signatory").trim(),
      appliedDate: data.appliedDate || new Date().toISOString().split("T")[0],
      status: data.status || "Pending Review",
      decisionDate: data.decisionDate,
      decisionNotes: data.decisionNotes,
    };

    const existing = readApplications();
    // Check if applicant already exists by email or id
    const idx = existing.findIndex(
      (a) =>
        (a.email && a.email.toLowerCase() === email) ||
        (a.id && a.id === newApp.id) ||
        (a.applicationId && a.applicationId === newApp.applicationId)
    );

    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...newApp };
    } else {
      existing.unshift(newApp);
    }

    writeApplications(existing);

    return NextResponse.json(
      {
        success: true,
        message: "Seller onboarding application successfully saved.",
        application: newApp,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error in POST /api/storefront/seller-onboarding:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to process application" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, email, status, decisionNotes } = data;

    if (!id && !email) {
      return NextResponse.json(
        { success: false, message: "Missing required id or email to update" },
        { status: 400 }
      );
    }

    const existing = readApplications();
    const idx = existing.findIndex(
      (a) =>
        (id && (a.id === id || a.applicationId === id)) ||
        (email && a.email && a.email.toLowerCase() === email.toLowerCase())
    );

    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 }
      );
    }

    existing[idx].status = status || existing[idx].status;
    existing[idx].decisionDate = new Date().toISOString();
    if (decisionNotes !== undefined) {
      existing[idx].decisionNotes = decisionNotes;
    }

    writeApplications(existing);

    return NextResponse.json({
      success: true,
      message: `Application ${existing[idx].status} successfully.`,
      application: existing[idx],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to update application" },
      { status: 500 }
    );
  }
}
