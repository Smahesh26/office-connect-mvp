import { Router, Request, Response } from "express";

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
  videoKycSlot?: string;
  fulfillmentModel: "FOC" | "EASY_SHIP" | "SELF_SHIP";
  documents?: {
    gstCertificate?: string;
    panCard?: string;
    cancelledCheque?: string;
    incorporationCertificate?: string;
    identityProof?: string;
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
  };
  signatureName: string;
  appliedDate: string;
  status: "Pending Review" | "Approved" | "Rejected";
  decisionDate?: string;
  decisionNotes?: string;
}

// In-memory store initialized with realistic seeded Indian seller applications
export const applicationsStore: MerchantOnboardingApplication[] = [
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
    isGstExempt: false,
    category: "Electronics & Appliances",
    gatedLicenses: ["BIS Electronic Safety Certification"],
    warehouseAddress: "Plot 42, Electronic City Phase 1",
    warehouseCity: "Bengaluru",
    warehouseState: "Karnataka",
    warehousePinCode: "560100",
    dispatchManagerName: "Ramesh Sharma",
    dispatchManagerPhone: "+91 98100 12346",
    bankName: "HDFC Bank",
    accountNumber: "50200049281729",
    ifscCode: "HDFC0000128",
    accountHolderName: "Sony India Direct Private Limited",
    pennyDropVerified: true,
    gstRateTier: "18%",
    hsnCode: "8528",
    automatedInvoicing: true,
    tcsAccepted: true,
    kycDocType: "Certificate of Incorporation & Board Resolution",
    videoKycSlot: "Completed",
    fulfillmentModel: "FOC",
    signatureName: "Sunil Nayyar",
    appliedDate: "2026-08-28",
    status: "Approved",
    decisionDate: "2026-08-29",
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
    isGstExempt: false,
    category: "Computers & Accessories",
    gatedLicenses: ["WPC Equipment Type Approval (ETA)"],
    warehouseAddress: "Warehouse 14, Bhiwandi Logistics Park",
    warehouseCity: "Thane",
    warehouseState: "Maharashtra",
    warehousePinCode: "421302",
    dispatchManagerName: "Vikram Rane",
    dispatchManagerPhone: "+91 98200 67891",
    bankName: "ICICI Bank",
    accountNumber: "001105023918",
    ifscCode: "ICIC0000011",
    accountHolderName: "Keychron India Peripherals LLP",
    pennyDropVerified: true,
    gstRateTier: "18%",
    hsnCode: "8471",
    automatedInvoicing: true,
    tcsAccepted: true,
    kycDocType: "LLP Agreement & Partner PAN",
    videoKycSlot: "Completed",
    fulfillmentModel: "EASY_SHIP",
    signatureName: "Arjun Verma",
    appliedDate: "2026-08-29",
    status: "Approved",
    decisionDate: "2026-08-30",
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
    isGstExempt: false,
    category: "Fashion & Apparel",
    warehouseAddress: "12/4 Khaderpet Apparel Park",
    warehouseCity: "Tirupur",
    warehouseState: "Tamil Nadu",
    warehousePinCode: "641601",
    dispatchManagerName: "Pooja Sundaram",
    dispatchManagerPhone: "+91 94440 33211",
    bankName: "State Bank of India",
    accountNumber: "389201948291",
    ifscCode: "SBIN0000844",
    accountHolderName: "Pooja Sundaram UrbanThreads",
    pennyDropVerified: true,
    gstRateTier: "12%",
    hsnCode: "6109",
    automatedInvoicing: true,
    tcsAccepted: true,
    kycDocType: "Aadhaar & PAN",
    videoKycSlot: "Pending Slot Confirmation",
    fulfillmentModel: "EASY_SHIP",
    sampleProduct: {
      title: "Pure Cotton Heavyweight Oversized Tee - Charcoal",
      brand: "UrbanThreads",
      category: "Fashion & Apparel",
      hsn: "61091000",
      price: 899,
      mrp: 1499,
      inventory: 150,
      sku: "UT-OVS-CH-M",
    },
    signatureName: "Pooja Sundaram",
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
    isGstExempt: false,
    category: "Beauty & Personal Care",
    gatedLicenses: ["Ayush Manufacturing License", "GMP Certification"],
    warehouseAddress: "Ayur Industrial Estate, Kinfra Park",
    warehouseCity: "Kochi",
    warehouseState: "Kerala",
    warehousePinCode: "682030",
    dispatchManagerName: "Manoj K.",
    dispatchManagerPhone: "+91 97450 88232",
    bankName: "Axis Bank",
    accountNumber: "918020048192012",
    ifscCode: "UTIB0000182",
    accountHolderName: "AyurVeda Organics Naturals LLP",
    pennyDropVerified: true,
    gstRateTier: "18%",
    hsnCode: "3305",
    automatedInvoicing: true,
    tcsAccepted: true,
    kycDocType: "Partnership Deed & Ayush License",
    videoKycSlot: "Pending Verification",
    fulfillmentModel: "SELF_SHIP",
    signatureName: "Dr. K. S. Nambiar",
    appliedDate: "2026-09-03",
    status: "Pending Review",
  },
];

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
      gstDocName: data.gstDocName || (data.gstDocUploaded ? "GSTIN_Certificate_REG06.pdf" : undefined),
      selfieCaptured: Boolean(data.selfieCaptured),
      videoKycSlot: data.videoKycSlot || "Scheduled with Compliance Agent",
      fulfillmentModel: data.fulfillmentModel || "EASY_SHIP",
      documents: data.documents || {
        gstCertificate: data.gstDocName || (data.gstin ? `GST_REG06_${data.gstin}.pdf` : "GST_Certificate_REG06.pdf"),
        panCard: `PAN_${data.pan || (data.gstin ? data.gstin.slice(2, 12) : "CARD")}.pdf`,
        cancelledCheque: `BANK_CHEQUE_${(data.bankName || "HDFC").toUpperCase().replace(/\s+/g, "_")}.pdf`,
        incorporationCertificate: data.entityType !== "Individual / Sole Proprietor" ? `COI_${bName.replace(/\s+/g, "_")}.pdf` : undefined,
        identityProof: `${(data.kycDocType || "AADHAAR").toUpperCase().replace(/\s+/g, "_")}_PROOF.pdf`,
      },
      sampleProduct: data.sampleProduct || undefined,
      signatureName: data.signatureName?.trim() || data.digitalSignature?.trim() || data.ownerName?.trim() || "Authorized Signatory",
      appliedDate: new Date().toISOString().split("T")[0],
      status: "Pending Review",
    };

    // Prepend to queue
    applicationsStore.unshift(newApp);

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
