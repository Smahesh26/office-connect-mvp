"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationsStore = void 0;
const express_1 = require("express");
// In-memory store initialized with realistic seeded Indian seller applications
exports.applicationsStore = [
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
const router = (0, express_1.Router)();
/**
 * POST /api/storefront/seller-onboarding
 * Submit a new merchant onboarding registration application
 */
router.post("/", (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
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
        const newApp = {
            id,
            applicationId,
            businessName: data.businessName.trim(),
            tradeName: ((_a = data.tradeName) === null || _a === void 0 ? void 0 : _a.trim()) || data.businessName.trim(),
            storeSlug: (data.storeSlug || data.tradeName || data.businessName)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, ""),
            ownerName: ((_b = data.ownerName) === null || _b === void 0 ? void 0 : _b.trim()) || "Proprietor",
            email: data.email.trim(),
            phone: data.phone.trim(),
            entityType: data.entityType || "Individual / Sole Proprietor",
            gstin: ((_c = data.gstin) === null || _c === void 0 ? void 0 : _c.trim()) || "GST_EXEMPT",
            pan: ((_d = data.pan) === null || _d === void 0 ? void 0 : _d.trim()) || (data.gstin ? data.gstin.slice(2, 12) : "PENDING_PAN"),
            isGstExempt: Boolean(data.isGstExempt),
            category: data.category || "General Merchandise",
            gatedLicenses: Array.isArray(data.gatedLicenses) ? data.gatedLicenses : [],
            warehouseAddress: ((_e = data.warehouseAddress) === null || _e === void 0 ? void 0 : _e.trim()) || "Default Dispatch Warehouse",
            warehouseCity: ((_f = data.warehouseCity) === null || _f === void 0 ? void 0 : _f.trim()) || "Bengaluru",
            warehouseState: ((_g = data.warehouseState) === null || _g === void 0 ? void 0 : _g.trim()) || "Karnataka",
            warehousePinCode: ((_h = data.warehousePinCode) === null || _h === void 0 ? void 0 : _h.trim()) || "560001",
            dispatchManagerName: ((_j = data.dispatchManagerName) === null || _j === void 0 ? void 0 : _j.trim()) || data.ownerName || "Dispatch Manager",
            dispatchManagerPhone: ((_k = data.dispatchManagerPhone) === null || _k === void 0 ? void 0 : _k.trim()) || data.phone || "",
            bankName: ((_l = data.bankName) === null || _l === void 0 ? void 0 : _l.trim()) || "HDFC Bank",
            accountNumber: ((_m = data.accountNumber) === null || _m === void 0 ? void 0 : _m.trim()) || "XXXX-XXXX-XXXX",
            ifscCode: (data.ifscCode || "HDFC0000001").toUpperCase().trim(),
            accountHolderName: ((_o = data.accountHolderName) === null || _o === void 0 ? void 0 : _o.trim()) || data.businessName.trim(),
            pennyDropVerified: (_p = data.pennyDropVerified) !== null && _p !== void 0 ? _p : true,
            gstRateTier: data.gstRateTier || "18%",
            hsnCode: ((_q = data.hsnCode) === null || _q === void 0 ? void 0 : _q.trim()) || "",
            automatedInvoicing: (_r = data.automatedInvoicing) !== null && _r !== void 0 ? _r : true,
            tcsAccepted: (_s = data.tcsAccepted) !== null && _s !== void 0 ? _s : true,
            kycDocType: data.kycDocType || "Aadhaar Card",
            videoKycSlot: data.videoKycSlot || "Scheduled with Compliance Agent",
            fulfillmentModel: data.fulfillmentModel || "EASY_SHIP",
            sampleProduct: data.sampleProduct || undefined,
            signatureName: ((_t = data.signatureName) === null || _t === void 0 ? void 0 : _t.trim()) || ((_u = data.ownerName) === null || _u === void 0 ? void 0 : _u.trim()) || "Authorized Signatory",
            appliedDate: new Date().toISOString().split("T")[0],
            status: "Pending Review",
        };
        // Prepend to queue
        exports.applicationsStore.unshift(newApp);
        return res.status(201).json({
            success: true,
            message: "Seller onboarding application successfully submitted for KYB verification.",
            application: newApp,
        });
    }
    catch (error) {
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
router.get("/", (req, res) => {
    try {
        const { status, search } = req.query;
        let filtered = [...exports.applicationsStore];
        if (status && typeof status === "string" && status !== "All") {
            filtered = filtered.filter((app) => app.status.toLowerCase() === status.toLowerCase());
        }
        if (search && typeof search === "string" && search.trim()) {
            const q = search.toLowerCase().trim();
            filtered = filtered.filter((app) => app.businessName.toLowerCase().includes(q) ||
                app.tradeName.toLowerCase().includes(q) ||
                app.gstin.toLowerCase().includes(q) ||
                app.pan.toLowerCase().includes(q) ||
                app.applicationId.toLowerCase().includes(q) ||
                app.warehouseCity.toLowerCase().includes(q));
        }
        return res.json({
            success: true,
            count: filtered.length,
            total: exports.applicationsStore.length,
            applications: filtered,
        });
    }
    catch (error) {
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
router.get("/:id", (req, res) => {
    try {
        const id = String(req.params.id);
        const app = exports.applicationsStore.find((a) => a.id === id || a.applicationId.toLowerCase() === id.toLowerCase());
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
    }
    catch (error) {
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
router.patch("/:id/status", (req, res) => {
    try {
        const id = String(req.params.id);
        const { status, notes } = req.body;
        if (!status || !["Approved", "Rejected", "Pending Review"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Allowed values: 'Approved', 'Rejected', 'Pending Review'.",
            });
        }
        const index = exports.applicationsStore.findIndex((a) => a.id === id || a.applicationId.toLowerCase() === id.toLowerCase());
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: `Application with identifier "${id}" not found.`,
            });
        }
        exports.applicationsStore[index].status = status;
        exports.applicationsStore[index].decisionDate = new Date().toISOString().split("T")[0];
        if (notes) {
            exports.applicationsStore[index].decisionNotes = notes;
        }
        return res.json({
            success: true,
            message: `Application ${exports.applicationsStore[index].applicationId} updated to ${status}.`,
            application: exports.applicationsStore[index],
        });
    }
    catch (error) {
        console.error("Error updating onboarding status:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update application status.",
        });
    }
});
exports.default = router;
