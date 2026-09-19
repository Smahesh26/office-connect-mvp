"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationsStore = void 0;
const express_1 = require("express");
// In-memory store initialized empty — only contains applications submitted by registered merchants
exports.applicationsStore = [];
const router = (0, express_1.Router)();
/**
 * POST /api/storefront/seller-onboarding
 * Submit a new merchant onboarding registration application
 */
router.post("/", (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
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
        const newApp = {
            id,
            applicationId,
            businessName: bName,
            tradeName: tName,
            storeSlug: (data.storeSlug || tName || bName)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, ""),
            ownerName: ((_a = data.ownerName) === null || _a === void 0 ? void 0 : _a.trim()) || "Proprietor",
            email: data.email.trim(),
            phone: data.phone.trim(),
            entityType: data.entityType || "Individual / Sole Proprietor",
            gstin: ((_b = data.gstin) === null || _b === void 0 ? void 0 : _b.trim()) || "GST_EXEMPT",
            pan: ((_c = data.pan) === null || _c === void 0 ? void 0 : _c.trim()) || (data.gstin ? data.gstin.slice(2, 12) : "PENDING_PAN"),
            isGstExempt: Boolean(data.isGstExempt),
            category: data.category || "General Merchandise",
            gatedLicenses: Array.isArray(data.gatedLicenses) ? data.gatedLicenses : [],
            warehouseAddress: ((_d = data.warehouseAddress) === null || _d === void 0 ? void 0 : _d.trim()) || "Default Dispatch Warehouse",
            warehouseCity: ((_e = data.warehouseCity) === null || _e === void 0 ? void 0 : _e.trim()) || "Bengaluru",
            warehouseState: ((_f = data.warehouseState) === null || _f === void 0 ? void 0 : _f.trim()) || "Karnataka",
            warehousePinCode: ((_g = data.warehousePinCode) === null || _g === void 0 ? void 0 : _g.trim()) || "560001",
            dispatchManagerName: ((_h = data.dispatchManagerName) === null || _h === void 0 ? void 0 : _h.trim()) || data.ownerName || "Dispatch Manager",
            dispatchManagerPhone: ((_j = data.dispatchManagerPhone) === null || _j === void 0 ? void 0 : _j.trim()) || data.phone || "",
            bankName: ((_k = data.bankName) === null || _k === void 0 ? void 0 : _k.trim()) || "HDFC Bank",
            accountNumber: ((_l = data.accountNumber) === null || _l === void 0 ? void 0 : _l.trim()) || "XXXX-XXXX-XXXX",
            ifscCode: (data.ifscCode || "HDFC0000001").toUpperCase().trim(),
            accountHolderName: ((_m = data.accountHolderName) === null || _m === void 0 ? void 0 : _m.trim()) || bName,
            pennyDropVerified: (_o = data.pennyDropVerified) !== null && _o !== void 0 ? _o : true,
            gstRateTier: data.gstRateTier || data.defaultGstRate || "18%",
            hsnCode: ((_p = data.hsnCode) === null || _p === void 0 ? void 0 : _p.trim()) || ((_q = data.defaultHsnCode) === null || _q === void 0 ? void 0 : _q.trim()) || "",
            automatedInvoicing: (_s = (_r = data.automatedInvoicing) !== null && _r !== void 0 ? _r : data.automatedInvoicingEnabled) !== null && _s !== void 0 ? _s : true,
            tcsAccepted: (_u = (_t = data.tcsAccepted) !== null && _t !== void 0 ? _t : data.tcsDeclarationAccepted) !== null && _u !== void 0 ? _u : true,
            kycDocType: data.kycDocType || "Aadhaar Card",
            kycDocNumber: ((_v = data.kycDocNumber) === null || _v === void 0 ? void 0 : _v.trim()) || undefined,
            kycDocUploaded: Boolean(data.kycDocUploaded),
            gstDocUploaded: Boolean(data.gstDocUploaded),
            gstDocName: data.gstDocName || undefined,
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
            signatureName: ((_w = data.signatureName) === null || _w === void 0 ? void 0 : _w.trim()) || ((_x = data.digitalSignature) === null || _x === void 0 ? void 0 : _x.trim()) || ((_y = data.ownerName) === null || _y === void 0 ? void 0 : _y.trim()) || "Authorized Signatory",
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
