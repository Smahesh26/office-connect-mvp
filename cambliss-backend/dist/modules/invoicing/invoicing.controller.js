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
exports.getInvoiceFollowUpsController = exports.createCreditNoteController = exports.listInvoicesController = exports.generateInvoicePDFController = exports.cancelInvoiceController = exports.getInvoiceByIdController = exports.createManualInvoiceController = exports.createInvoiceFromPOSOrderController = void 0;
const invoicing_service_1 = require("./invoicing.service");
const handleError = (res, error) => {
    if (error instanceof invoicing_service_1.InvoiceError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: "Internal server error" });
};
const getOrganizationId = (req) => {
    var _a;
    const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
    if (!organizationId) {
        throw new invoicing_service_1.InvoiceError(401, "Unauthorized");
    }
    return organizationId;
};
const createInvoiceFromPOSOrderController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const { posOrderId } = req.body;
        const invoice = yield (0, invoicing_service_1.createInvoiceFromPOSOrder)(organizationId, posOrderId);
        res.status(201).json(invoice);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.createInvoiceFromPOSOrderController = createInvoiceFromPOSOrderController;
const createManualInvoiceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const invoice = yield (0, invoicing_service_1.createManualInvoice)(organizationId, req.body);
        res.status(201).json(invoice);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.createManualInvoiceController = createManualInvoiceController;
const getInvoiceByIdController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const { invoiceId } = req.params;
        const invoice = yield (0, invoicing_service_1.getInvoiceById)(organizationId, invoiceId);
        res.status(200).json(invoice);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.getInvoiceByIdController = getInvoiceByIdController;
const cancelInvoiceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const { invoiceId } = req.body;
        const invoice = yield (0, invoicing_service_1.cancelInvoice)(organizationId, invoiceId);
        res.status(200).json(invoice);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.cancelInvoiceController = cancelInvoiceController;
const generateInvoicePDFController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const { invoiceId } = req.params;
        const templateRaw = Array.isArray(req.query.template) ? req.query.template[0] : req.query.template;
        const template = templateRaw === "minimal" || templateRaw === "detailed" || templateRaw === "classic"
            ? templateRaw
            : "classic";
        const result = yield (0, invoicing_service_1.generateInvoicePDF)(organizationId, invoiceId, { template });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=\"${result.fileName}\"`);
        res.status(200).send(result.buffer);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.generateInvoicePDFController = generateInvoicePDFController;
const listInvoicesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const status = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
        const customerId = Array.isArray(req.query.customerId) ? req.query.customerId[0] : req.query.customerId;
        const overdueOnlyRaw = Array.isArray(req.query.overdueOnly) ? req.query.overdueOnly[0] : req.query.overdueOnly;
        const invoices = yield (0, invoicing_service_1.listInvoices)(organizationId, {
            status: typeof status === "string" ? status : undefined,
            customerId: typeof customerId === "string" ? customerId : undefined,
            overdueOnly: overdueOnlyRaw === "true",
        });
        res.status(200).json(invoices);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.listInvoicesController = listInvoicesController;
const createCreditNoteController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const { invoiceId, amount, reason } = req.body;
        const result = yield (0, invoicing_service_1.createCreditNoteFromInvoice)(organizationId, {
            invoiceId,
            amount,
            reason,
        });
        res.status(201).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.createCreditNoteController = createCreditNoteController;
const getInvoiceFollowUpsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const daysRaw = Array.isArray(req.query.afterDays) ? req.query.afterDays[0] : req.query.afterDays;
        const parsed = typeof daysRaw === "string" ? parseInt(daysRaw, 10) : undefined;
        const afterDays = parsed && !Number.isNaN(parsed) ? parsed : 30;
        const followUps = yield (0, invoicing_service_1.getInvoiceFollowUps)(organizationId, afterDays);
        res.status(200).json(followUps);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.getInvoiceFollowUpsController = getInvoiceFollowUpsController;
