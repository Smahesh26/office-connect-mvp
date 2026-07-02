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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEWayBillEligibility = validateEWayBillEligibility;
exports.generateEWayBillJSON = generateEWayBillJSON;
exports.getEWayBillHistory = getEWayBillHistory;
exports.cancelEWayBill = cancelEWayBill;
const prisma_1 = __importDefault(require("../../config/prisma"));
// E-Way Bill threshold in INR
const EWAY_BILL_THRESHOLD = 50000;
// Transport mode mapping
const TRANSPORT_MODE_MAP = {
    ROAD: "1",
    RAIL: "2",
    AIR: "3",
    SHIP: "4",
};
/**
 * Validate if invoice is eligible for E-Way Bill generation
 */
function validateEWayBillEligibility(invoiceId, organizationId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const errors = [];
        // Fetch invoice with all related data
        const invoice = yield prisma_1.default.invoice.findFirst({
            where: {
                id: invoiceId,
                organizationId,
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true,
                    },
                },
                organization: {
                    include: {
                        gstConfig: true,
                    },
                },
            },
        });
        if (!invoice) {
            errors.push({ field: "invoiceId", message: "Invoice not found" });
            return { valid: false, errors };
        }
        // Check if invoice is cancelled
        if (invoice.status === "CANCELLED") {
            errors.push({ field: "status", message: "Cannot generate E-Way Bill for cancelled invoice" });
        }
        // Check if total value exceeds threshold
        const totalValue = Number(invoice.totalAmount);
        if (totalValue < EWAY_BILL_THRESHOLD) {
            errors.push({
                field: "totalAmount",
                message: `Invoice value (₹${totalValue}) is below E-Way Bill threshold (₹${EWAY_BILL_THRESHOLD})`,
            });
        }
        // Check if buyer GSTIN exists
        if (!((_a = invoice.customer) === null || _a === void 0 ? void 0 : _a.gstNumber)) {
            errors.push({ field: "customer.gstNumber", message: "Buyer GSTIN is required for E-Way Bill" });
        }
        // Check if seller GSTIN exists
        if (!((_b = invoice.organization.gstConfig) === null || _b === void 0 ? void 0 : _b.gstNumber)) {
            errors.push({
                field: "organization.gstNumber",
                message: "Seller GSTIN is required. Please configure GST settings.",
            });
        }
        // Check if all products have HSN codes
        const itemsWithoutHSN = invoice.items.filter((item) => !item.product.hsnCode || item.product.hsnCode.trim() === "");
        if (itemsWithoutHSN.length > 0) {
            errors.push({
                field: "items.hsnCode",
                message: `${itemsWithoutHSN.length} product(s) missing HSN codes. HSN is required for E-Way Bill.`,
            });
        }
        return { valid: errors.length === 0, errors };
    });
}
/**
 * Format date for E-Way Bill JSON (DD/MM/YYYY)
 */
function formatDateForEWay(date) {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
/**
 * Generate E-Way Bill JSON for an invoice
 */
function generateEWayBillJSON(invoiceId, organizationId, transportDetails) {
    return __awaiter(this, void 0, void 0, function* () {
        // Validate eligibility
        const validation = yield validateEWayBillEligibility(invoiceId, organizationId);
        if (!validation.valid) {
            return { success: false, errors: validation.errors };
        }
        // Fetch full invoice data
        const invoice = yield prisma_1.default.invoice.findFirst({
            where: {
                id: invoiceId,
                organizationId,
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true,
                    },
                },
                organization: {
                    include: {
                        gstConfig: true,
                    },
                },
            },
        });
        if (!invoice) {
            return { success: false, errors: [{ field: "invoiceId", message: "Invoice not found" }] };
        }
        const gstConfig = invoice.organization.gstConfig;
        const customer = invoice.customer;
        // Determine supply type (intra-state vs inter-state)
        const isInterState = gstConfig.stateCode !== customer.stateCode;
        const supplyType = "Outward"; // For sales invoices
        // Build item list
        const itemList = invoice.items.map((item, index) => ({
            itemNo: index + 1,
            productName: item.product.name,
            productDesc: item.product.description || item.product.name,
            hsnCode: item.product.hsnCode || "",
            quantity: item.quantity,
            qtyUnit: "PCS", // Default unit
            cgstRate: Number(item.cgstRate || 0),
            sgstRate: Number(item.sgstRate || 0),
            igstRate: Number(item.igstRate || 0),
            cessRate: 0, // Cess not implemented yet
            taxableAmount: Number(item.price) * item.quantity,
        }));
        // Calculate totals
        const totalValue = Number(invoice.totalAmount);
        const cgstValue = Number(invoice.cgstAmount);
        const sgstValue = Number(invoice.sgstAmount);
        const igstValue = Number(invoice.igstAmount);
        // Build E-Way Bill JSON
        const ewayBillJSON = {
            supplyType,
            docType: "INV", // Invoice
            docNo: invoice.invoiceNumber,
            docDate: formatDateForEWay(invoice.issuedAt),
            fromGstin: gstConfig.gstNumber,
            fromTrdName: gstConfig.tradeName || gstConfig.legalName,
            fromAddr1: customer.billingAddress || "Not Provided",
            fromPlace: customer.state || "Not Provided",
            fromStateCode: gstConfig.stateCode,
            toGstin: customer.gstNumber,
            toTrdName: customer.companyName || `${customer.firstName} ${customer.lastName}`.trim(),
            toAddr1: customer.shippingAddress || customer.billingAddress || "Not Provided",
            toPlace: customer.state || "Not Provided",
            toStateCode: customer.stateCode || "00",
            totalValue,
            cgstValue,
            sgstValue,
            igstValue,
            cessValue: 0,
            transMode: TRANSPORT_MODE_MAP[transportDetails.transportMode || "ROAD"],
            itemList,
        };
        // Add optional transport details
        if (transportDetails.transporterGSTIN) {
            ewayBillJSON.transporterId = transportDetails.transporterGSTIN;
        }
        if (transportDetails.transporterName) {
            ewayBillJSON.transporterName = transportDetails.transporterName;
        }
        if (transportDetails.vehicleNumber) {
            ewayBillJSON.vehicleNo = transportDetails.vehicleNumber;
        }
        if (transportDetails.distance) {
            ewayBillJSON.transDistance = transportDetails.distance.toString();
        }
        // Save E-Way Bill record
        yield prisma_1.default.eWayBill.create({
            data: {
                organizationId,
                invoiceId,
                transporterName: transportDetails.transporterName,
                transporterGSTIN: transportDetails.transporterGSTIN,
                vehicleNumber: transportDetails.vehicleNumber,
                transportMode: transportDetails.transportMode,
                distance: transportDetails.distance,
                status: "GENERATED",
            },
        });
        return { success: true, data: ewayBillJSON };
    });
}
/**
 * Get E-Way Bill history for an invoice
 */
function getEWayBillHistory(invoiceId, organizationId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.eWayBill.findMany({
            where: {
                invoiceId,
                organizationId,
            },
            orderBy: {
                generatedAt: "desc",
            },
        });
    });
}
/**
 * Cancel E-Way Bill
 */
function cancelEWayBill(ewayBillId, organizationId) {
    return __awaiter(this, void 0, void 0, function* () {
        const ewayBill = yield prisma_1.default.eWayBill.findFirst({
            where: {
                id: ewayBillId,
                organizationId,
            },
        });
        if (!ewayBill) {
            throw new Error("E-Way Bill not found");
        }
        if (ewayBill.status === "CANCELLED") {
            throw new Error("E-Way Bill is already cancelled");
        }
        return yield prisma_1.default.eWayBill.update({
            where: { id: ewayBillId },
            data: { status: "CANCELLED" },
        });
    });
}
