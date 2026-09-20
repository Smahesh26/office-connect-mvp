import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

export interface MerchantOnboardingApplication {
  id: string;
  applicationId: string;
  businessName: string;
  tradeName: string;
  storeSlug: string;
  ownerName: string;
  email: string;
  phone: string;
  entityType: string;
  gstin: string;
  pan: string;
  isGstExempt: boolean;
  category: string;
  gatedLicenses?: string[];
  warehouseAddress: string;
  warehouseCity: string;
  warehouseState: string;
  warehousePinCode: string;
  dispatchManagerName: string;
  dispatchManagerPhone: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  pennyDropVerified: boolean;
  gstRateTier: string;
  hsnCode?: string;
  automatedInvoicing: boolean;
  tcsAccepted: boolean;
  kycDocType: string;
  kycDocNumber?: string;
  kycDocUploaded?: boolean;
  gstDocUploaded?: boolean;
  gstDocName?: string;
  selfieCaptured?: boolean;
  selfieImage?: string;
  faceMatchScore?: number;
  videoKycSlot?: string;
  fulfillmentModel: "FOC" | "EASY_SHIP" | "SELF_SHIP";
  documents?: {
    gstCertificate?: string;
    panCard?: string;
    cancelledCheque?: string;
    incorporationCertificate?: string;
    identityProof?: string;
    liveMerchantSelfie?: string;
  };
  sampleProduct?: {
    title: string;
    brand: string;
    category: string;
    hsn: string;
    price: number;
    mrp: number;
    inventory: number;
    sku: string;
    image?: string;
  };
  signatureName: string;
  appliedDate: string;
  status: "Pending Review" | "Approved" | "Rejected";
  decisionDate?: string;
  decisionNotes?: string;
}

const DATA_FILE = path.join(process.cwd(), "data/seller_onboarding_applications.json");

function loadApplicationsFromDisk(): MerchantOnboardingApplication[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const list = JSON.parse(content || "[]");
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.warn("Could not read applications from disk:", e);
  }
  return [];
}

function saveApplicationsToDisk(list: MerchantOnboardingApplication[]) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not save applications to disk:", e);
  }
}

// Persistent store initialized from disk file
export const applicationsStore: MerchantOnboardingApplication[] = loadApplicationsFromDisk();

const router = Router();

/**
 * POST /api/storefront/seller-onboarding
 * Submit a new merchant onboarding registration application
 */
router.post("/", (req: Request, res: Response) => {
  try {
    const data = req.body;

    if (!data.businessName || !data.email || !data.phone) {
      return res.status(400).json({
        success: false,
        message: "Missing required merchant onboarding details (businessName, email, phone).",
      });
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const applicationId = data.applicationId || `OC-KYB-2026-${randomSuffix}`;
    const id = `app-oc-${Date.now()}`;

    const bName = (data.businessName || data.storeName || (data.ownerName ? `${data.ownerName}'s Enterprise` : "Merchant Hub")).trim();
    const tName = (data.tradeName || data.storeName || bName).trim();

    const newApp: MerchantOnboardingApplication = {
      id,
      applicationId,
      businessName: bName,
      tradeName: tName,
      storeSlug: (data.storeSlug || tName || bName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      ownerName: data.ownerName?.trim() || "Proprietor",
      email: data.email.trim(),
      phone: data.phone.trim(),
      entityType: data.entityType || "Individual / Sole Proprietor",
      gstin: data.gstin?.trim() || "GST_EXEMPT",
      pan: data.pan?.trim() || (data.gstin ? data.gstin.slice(2, 12) : "PENDING_PAN"),
      isGstExempt: Boolean(data.isGstExempt),
      category: data.category || "General Merchandise",
      gatedLicenses: Array.isArray(data.gatedLicenses) ? data.gatedLicenses : [],
      warehouseAddress: data.warehouseAddress?.trim() || "Default Dispatch Warehouse",
      warehouseCity: data.warehouseCity?.trim() || "Bengaluru",
      warehouseState: data.warehouseState?.trim() || "Karnataka",
      warehousePinCode: data.warehousePinCode?.trim() || "560001",
      dispatchManagerName: data.dispatchManagerName?.trim() || data.ownerName || "Dispatch Manager",
      dispatchManagerPhone: data.dispatchManagerPhone?.trim() || data.phone || "",
      bankName: data.bankName?.trim() || "HDFC Bank",
      accountNumber: data.accountNumber?.trim() || "XXXX-XXXX-XXXX",
      ifscCode: (data.ifscCode || "HDFC0000001").toUpperCase().trim(),
      accountHolderName: data.accountHolderName?.trim() || bName,
      pennyDropVerified: data.pennyDropVerified ?? true,
      gstRateTier: data.gstRateTier || data.defaultGstRate || "18%",
      hsnCode: data.hsnCode?.trim() || data.defaultHsnCode?.trim() || "",
      automatedInvoicing: data.automatedInvoicing ?? data.automatedInvoicingEnabled ?? true,
      tcsAccepted: data.tcsAccepted ?? data.tcsDeclarationAccepted ?? true,
      kycDocType: data.kycDocType || "Aadhaar Card",
      kycDocNumber: data.kycDocNumber?.trim() || undefined,
      kycDocUploaded: Boolean(data.kycDocUploaded),
      gstDocUploaded: Boolean(data.gstDocUploaded),
      gstDocName: data.gstDocName || undefined,
      selfieCaptured: Boolean(data.selfieCaptured),
      selfieImage: data.selfieImage || undefined,
      faceMatchScore: data.faceMatchScore || undefined,
      videoKycSlot: data.videoKycSlot || "Scheduled with Compliance Agent",
      fulfillmentModel: data.fulfillmentModel || "EASY_SHIP",
      documents: data.documents || {
        gstCertificate: data.gstDocName || (data.gstin ? `GST_REG06_${data.gstin}.pdf` : "GST_Certificate_REG06.pdf"),
        panCard: `PAN_${data.pan || (data.gstin ? data.gstin.slice(2, 12) : "CARD")}.pdf`,
        cancelledCheque: `BANK_CHEQUE_${(data.bankName || "HDFC").toUpperCase().replace(/\s+/g, "_")}.pdf`,
        incorporationCertificate: data.entityType !== "Individual / Sole Proprietor" ? `COI_${bName.replace(/\s+/g, "_")}.pdf` : undefined,
        identityProof: `${(data.kycDocType || "AADHAAR").toUpperCase().replace(/\s+/g, "_")}_PROOF.pdf`,
        liveMerchantSelfie: data.selfieImage || undefined,
      },
      sampleProduct: data.sampleProduct || undefined,
      signatureName: data.signatureName?.trim() || data.digitalSignature?.trim() || data.ownerName?.trim() || "Authorized Signatory",
      appliedDate: new Date().toISOString().split("T")[0],
      status: "Pending Review",
    };

    // Prepend to queue and persist to disk
    applicationsStore.unshift(newApp);
    saveApplicationsToDisk(applicationsStore);

    return res.status(201).json({
      success: true,
      message: "Seller onboarding application successfully submitted for KYB verification.",
      application: newApp,
    });
  } catch (error) {
    console.error("Error submitting seller onboarding:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit merchant onboarding application.",
    });
  }
});

/**
 * GET /api/storefront/seller-onboarding
 * Fetch KYB verification queue with optional status query
 */
router.get("/", (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    let filtered = [...applicationsStore];

    if (status && typeof status === "string" && status !== "All") {
      filtered = filtered.filter(
        (app) => app.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (app) =>
          app.businessName.toLowerCase().includes(q) ||
          app.tradeName.toLowerCase().includes(q) ||
          app.gstin.toLowerCase().includes(q) ||
          app.pan.toLowerCase().includes(q) ||
          app.applicationId.toLowerCase().includes(q) ||
          app.warehouseCity.toLowerCase().includes(q)
      );
    }

    return res.json({
      success: true,
      count: filtered.length,
      total: applicationsStore.length,
      applications: filtered,
    });
  } catch (error) {
    console.error("Error fetching onboarding queue:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch merchant onboarding queue.",
    });
  }
});

/**
 * GET /api/storefront/seller-onboarding/:id
 * Fetch individual application status by ID or Application Number
 */
router.get("/:id", (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const app = applicationsStore.find(
      (a) => a.id === id || a.applicationId.toLowerCase() === id.toLowerCase()
    );

    if (!app) {
      return res.status(404).json({
        success: false,
        message: `Application with identifier "${id}" not found.`,
      });
    }

    return res.json({
      success: true,
      application: app,
    });
  } catch (error) {
    console.error("Error fetching onboarding application:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch application.",
    });
  }
});

/**
 * PATCH /api/storefront/seller-onboarding/:id/status
 * Approve or Reject merchant KYB application
 */
router.patch("/:id/status", (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status, notes } = req.body;

    if (!status || !["Approved", "Rejected", "Pending Review"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values: 'Approved', 'Rejected', 'Pending Review'.",
      });
    }

    const index = applicationsStore.findIndex(
      (a) => a.id === id || a.applicationId.toLowerCase() === id.toLowerCase()
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Application with identifier "${id}" not found.`,
      });
    }

    applicationsStore[index].status = status;
    applicationsStore[index].decisionDate = new Date().toISOString().split("T")[0];
    if (notes) {
      applicationsStore[index].decisionNotes = notes;
    }
    saveApplicationsToDisk(applicationsStore);

    return res.json({
      success: true,
      message: `Application ${applicationsStore[index].applicationId} updated to ${status}.`,
      application: applicationsStore[index],
    });
  } catch (error) {
    console.error("Error updating onboarding status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update application status.",
    });
  }
});

export default router;
