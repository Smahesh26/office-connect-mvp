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
exports.exportEInvoiceJSONController = exports.calculateGSTController = exports.generateGSTR1Controller = exports.generateGSTReportController = exports.deleteGSTConfigController = exports.updateGSTConfigController = exports.getGSTConfigController = exports.createGSTConfigController = void 0;
const gst_service_1 = require("./gst.service");
const einvoice_service_1 = require("./einvoice.service");
const createGSTConfigController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = typeof req.params.organizationId === "string"
            ? req.params.organizationId
            : (_a = req.params.organizationId) === null || _a === void 0 ? void 0 : _a[0];
        if (!organizationId) {
            res.status(400).json({ error: "organizationId is required" });
            return;
        }
        const gstConfig = yield (0, gst_service_1.createGSTConfig)(organizationId, req.body);
        res.status(201).json(gstConfig);
    }
    catch (error) {
        if (error instanceof gst_service_1.GSTError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            console.error("Create GST config error:", error);
            res.status(500).json({ error: "Failed to create GST configuration" });
        }
    }
});
exports.createGSTConfigController = createGSTConfigController;
const getGSTConfigController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = typeof req.params.organizationId === "string"
            ? req.params.organizationId
            : (_a = req.params.organizationId) === null || _a === void 0 ? void 0 : _a[0];
        if (!organizationId) {
            res.status(400).json({ error: "organizationId is required" });
            return;
        }
        const gstConfig = yield (0, gst_service_1.getGSTConfig)(organizationId);
        res.json(gstConfig);
    }
    catch (error) {
        if (error instanceof gst_service_1.GSTError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            console.error("Get GST config error:", error);
            res.status(500).json({ error: "Failed to fetch GST configuration" });
        }
    }
});
exports.getGSTConfigController = getGSTConfigController;
const updateGSTConfigController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = typeof req.params.organizationId === "string"
            ? req.params.organizationId
            : (_a = req.params.organizationId) === null || _a === void 0 ? void 0 : _a[0];
        if (!organizationId) {
            res.status(400).json({ error: "organizationId is required" });
            return;
        }
        const gstConfig = yield (0, gst_service_1.updateGSTConfig)(organizationId, req.body);
        res.json(gstConfig);
    }
    catch (error) {
        if (error instanceof gst_service_1.GSTError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            console.error("Update GST config error:", error);
            res.status(500).json({ error: "Failed to update GST configuration" });
        }
    }
});
exports.updateGSTConfigController = updateGSTConfigController;
const deleteGSTConfigController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = typeof req.params.organizationId === "string"
            ? req.params.organizationId
            : (_a = req.params.organizationId) === null || _a === void 0 ? void 0 : _a[0];
        if (!organizationId) {
            res.status(400).json({ error: "organizationId is required" });
            return;
        }
        const result = yield (0, gst_service_1.deleteGSTConfig)(organizationId);
        res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof gst_service_1.GSTError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            console.error("Delete GST config error:", error);
            res.status(500).json({ error: "Failed to delete GST configuration" });
        }
    }
});
exports.deleteGSTConfigController = deleteGSTConfigController;
const generateGSTReportController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = typeof req.params.organizationId === "string"
            ? req.params.organizationId
            : (_a = req.params.organizationId) === null || _a === void 0 ? void 0 : _a[0];
        if (!organizationId) {
            res.status(400).json({ error: "organizationId is required" });
            return;
        }
        const { month, year } = req.body;
        if (!Number.isInteger(month) || !Number.isInteger(year)) {
            res.status(400).json({ error: "Month and year are required as integers" });
            return;
        }
        const report = yield (0, gst_service_1.generateGSTReport)(organizationId, { month, year });
        res.json(report);
    }
    catch (error) {
        if (error instanceof gst_service_1.GSTError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            console.error("Generate GST report error:", error);
            res.status(500).json({ error: "Failed to generate GST report" });
        }
    }
});
exports.generateGSTReportController = generateGSTReportController;
const generateGSTR1Controller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = typeof req.params.organizationId === "string"
            ? req.params.organizationId
            : (_a = req.params.organizationId) === null || _a === void 0 ? void 0 : _a[0];
        if (!organizationId) {
            res.status(400).json({ error: "organizationId is required" });
            return;
        }
        const { month, year } = req.body;
        if (!Number.isInteger(month) || !Number.isInteger(year)) {
            res.status(400).json({ error: "Month and year are required as integers" });
            return;
        }
        const gstr1Data = yield (0, gst_service_1.generateGSTR1Data)(organizationId, { month, year });
        res.json(gstr1Data);
    }
    catch (error) {
        if (error instanceof gst_service_1.GSTError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            console.error("Generate GSTR-1 error:", error);
            res.status(500).json({ error: "Failed to generate GSTR-1 data" });
        }
    }
});
exports.generateGSTR1Controller = generateGSTR1Controller;
const calculateGSTController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sellerStateCode, buyerStateCode, taxableValue, gstRate } = req.body;
        if (!sellerStateCode || typeof taxableValue !== "number" || typeof gstRate !== "number") {
            res.status(400).json({
                error: "sellerStateCode, taxableValue, and gstRate are required",
            });
            return;
        }
        const breakdown = (0, gst_service_1.calculateGST)(sellerStateCode, buyerStateCode, taxableValue, gstRate);
        res.json(breakdown);
    }
    catch (error) {
        if (error instanceof gst_service_1.GSTError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            console.error("Calculate GST error:", error);
            res.status(500).json({ error: "Failed to calculate GST" });
        }
    }
});
exports.calculateGSTController = calculateGSTController;
const exportEInvoiceJSONController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const invoiceId = typeof req.params.invoiceId === "string" ? req.params.invoiceId : (_a = req.params.invoiceId) === null || _a === void 0 ? void 0 : _a[0];
        if (!invoiceId) {
            res.status(400).json({ error: "invoiceId is required" });
            return;
        }
        const organizationId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.organizationId;
        if (!organizationId) {
            res.status(401).json({ error: "Unauthorized: organization context missing" });
            return;
        }
        const payload = yield (0, einvoice_service_1.generateEInvoiceJSON)(invoiceId, organizationId);
        const fileName = `einvoice-${payload.DocDtls.No}.json`;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
        res.status(200).send(JSON.stringify(payload, null, 2));
    }
    catch (error) {
        if (error instanceof gst_service_1.GSTError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            console.error("Export e-invoice JSON error:", error);
            res.status(500).json({ error: "Failed to export e-invoice JSON" });
        }
    }
});
exports.exportEInvoiceJSONController = exportEInvoiceJSONController;
