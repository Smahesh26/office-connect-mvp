"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eway_service_1 = require("./eway.service");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * POST /gst/eway-bill/validate
 * Validate if invoice is eligible for E-Way Bill generation
 */
router.post("/eway-bill/validate", auth_middleware_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { invoiceId } = req.body;
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!invoiceId) {
            return res.status(400).json({ error: "invoiceId is required" });
        }
        const validation = yield (0, eway_service_1.validateEWayBillEligibility)(invoiceId, organizationId);
        return res.status(200).json(validation);
    }
    catch (error) {
        console.error("Error validating E-Way Bill eligibility:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
/**
 * POST /gst/eway-bill/generate
 * Generate E-Way Bill JSON for an invoice
 */
router.post("/eway-bill/generate", auth_middleware_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { invoiceId, transportDetails } = req.body;
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!invoiceId) {
            return res.status(400).json({ error: "invoiceId is required" });
        }
        const transportData = {
            transporterName: transportDetails === null || transportDetails === void 0 ? void 0 : transportDetails.transporterName,
            transporterGSTIN: transportDetails === null || transportDetails === void 0 ? void 0 : transportDetails.transporterGSTIN,
            vehicleNumber: transportDetails === null || transportDetails === void 0 ? void 0 : transportDetails.vehicleNumber,
            transportMode: (transportDetails === null || transportDetails === void 0 ? void 0 : transportDetails.transportMode) || "ROAD",
            distance: transportDetails === null || transportDetails === void 0 ? void 0 : transportDetails.distance,
        };
        const result = yield (0, eway_service_1.generateEWayBillJSON)(invoiceId, organizationId, transportData);
        if (!result.success) {
            return res.status(400).json({
                error: "E-Way Bill generation failed",
                errors: result.errors,
            });
        }
        return res.status(200).json({
            success: true,
            data: result.data,
        });
    }
    catch (error) {
        console.error("Error generating E-Way Bill:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
/**
 * GET /gst/eway-bill/download/:invoiceId
 * Download E-Way Bill JSON as file
 */
router.get("/eway-bill/download/:invoiceId", auth_middleware_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const invoiceId = req.params.invoiceId;
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Get transport details from query params (if updating)
        const transportDetails = {
            transporterName: req.query.transporterName,
            transporterGSTIN: req.query.transporterGSTIN,
            vehicleNumber: req.query.vehicleNumber,
            transportMode: req.query.transportMode,
            distance: req.query.distance ? parseInt(req.query.distance) : undefined,
        };
        const result = yield (0, eway_service_1.generateEWayBillJSON)(invoiceId, organizationId, transportDetails);
        if (!result.success) {
            return res.status(400).json({
                error: "E-Way Bill generation failed",
                errors: result.errors,
            });
        }
        // Set response headers for download
        const filename = `EWAY_${result.data.docNo}_${Date.now()}.json`;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.status(200).json(result.data);
    }
    catch (error) {
        console.error("Error downloading E-Way Bill:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
/**
 * GET /gst/eway-bill/history/:invoiceId
 * Get E-Way Bill generation history for an invoice
 */
router.get("/eway-bill/history/:invoiceId", auth_middleware_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const invoiceId = req.params.invoiceId;
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const history = yield (0, eway_service_1.getEWayBillHistory)(invoiceId, organizationId);
        return res.status(200).json({
            success: true,
            data: history,
        });
    }
    catch (error) {
        console.error("Error fetching E-Way Bill history:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
/**
 * POST /gst/eway-bill/cancel/:ewayBillId
 * Cancel an E-Way Bill
 */
router.post("/eway-bill/cancel/:ewayBillId", auth_middleware_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const ewayBillId = req.params.ewayBillId;
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const cancelledBill = yield (0, eway_service_1.cancelEWayBill)(ewayBillId, organizationId);
        return res.status(200).json({
            success: true,
            data: cancelledBill,
        });
    }
    catch (error) {
        console.error("Error cancelling E-Way Bill:", error);
        return res.status(400).json({ error: error.message || "Failed to cancel E-Way Bill" });
    }
}));
exports.default = router;
