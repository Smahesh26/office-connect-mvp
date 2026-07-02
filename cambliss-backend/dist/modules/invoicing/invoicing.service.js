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
exports.generateInvoicePDF = exports.getInvoiceById = exports.cancelInvoice = exports.createCreditNoteFromInvoice = exports.getInvoiceFollowUps = exports.listInvoices = exports.createManualInvoice = exports.createInvoiceFromPOSOrder = exports.generateInvoiceNumber = exports.InvoiceError = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const client_1 = require("@prisma/client");
const pdfkit_1 = __importDefault(require("pdfkit"));
const accounting_service_1 = require("../accounting/accounting.service");
const gst_service_1 = require("../gst/gst.service");
class InvoiceError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "InvoiceError";
    }
}
exports.InvoiceError = InvoiceError;
const toMoney = (value) => Number(value.toFixed(2));
const getYearRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year + 1, 0, 1, 0, 0, 0, 0);
    return { year, start, end };
};
const buildInvoiceNumber = (year, serial) => {
    return `INV-${year}-${serial.toString().padStart(5, "0")}`;
};
const isUniqueConstraintError = (error) => {
    return (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002");
};
const getRevenueAndReceivableLedgers = (organizationId, tx) => __awaiter(void 0, void 0, void 0, function* () {
    const db = tx !== null && tx !== void 0 ? tx : prisma_1.default;
    const ledgers = yield db.ledgerAccount.findMany({
        where: {
            organizationId,
            name: {
                in: ["Revenue", "Accounts Receivable", "Cash"],
            },
        },
        select: {
            id: true,
            name: true,
        },
    });
    const revenue = ledgers.find((ledger) => ledger.name === "Revenue");
    const receivable = ledgers.find((ledger) => ledger.name === "Accounts Receivable");
    const cash = ledgers.find((ledger) => ledger.name === "Cash");
    if (!revenue || !receivable || !cash) {
        throw new InvoiceError(400, "Required ledgers Revenue, Accounts Receivable, and Cash must exist");
    }
    return {
        revenueLedgerId: revenue.id,
        receivableLedgerId: receivable.id,
        cashLedgerId: cash.id,
    };
});
const computeLineTax = (lineAmount, taxRate) => toMoney((lineAmount * taxRate) / 100);
const generateInvoiceNumber = (organizationId, tx) => __awaiter(void 0, void 0, void 0, function* () {
    const db = tx !== null && tx !== void 0 ? tx : prisma_1.default;
    const { year, start, end } = getYearRange();
    const count = yield db.invoice.count({
        where: {
            organizationId,
            issuedAt: {
                gte: start,
                lt: end,
            },
        },
    });
    return buildInvoiceNumber(year, count + 1);
});
exports.generateInvoiceNumber = generateInvoiceNumber;
const createInvoiceRecord = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const createOnce = (db) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const invoiceNumber = yield (0, exports.generateInvoiceNumber)(input.organizationId, db);
        // Get seller's GST config for state code
        let sellerStateCode;
        try {
            const gstConfig = yield (0, gst_service_1.getGSTConfig)(input.organizationId);
            sellerStateCode = gstConfig.stateCode;
        }
        catch (_e) {
            // If no GST config, use default calculation without state-specific GST
            sellerStateCode = "";
        }
        const itemPayload = input.items.map((item) => {
            const lineSubtotal = toMoney(item.price * item.quantity);
            // Calculate GST breakdown using state codes
            const gstBreakdown = (0, gst_service_1.calculateGST)(sellerStateCode, input.customerStateCode, lineSubtotal, item.gstRate);
            return {
                productId: item.productId,
                quantity: item.quantity,
                price: toMoney(item.price),
                gstRate: toMoney(item.gstRate),
                cgstRate: gstBreakdown.cgstRate > 0 ? toMoney(gstBreakdown.cgstRate) : null,
                sgstRate: gstBreakdown.sgstRate > 0 ? toMoney(gstBreakdown.sgstRate) : null,
                igstRate: gstBreakdown.igstRate > 0 ? toMoney(gstBreakdown.igstRate) : null,
                cgstAmount: gstBreakdown.cgstAmount,
                sgstAmount: gstBreakdown.sgstAmount,
                igstAmount: gstBreakdown.igstAmount,
                lineSubtotal,
            };
        });
        const subtotal = toMoney(itemPayload.reduce((sum, item) => sum + item.lineSubtotal, 0));
        const cgstAmount = toMoney(itemPayload.reduce((sum, item) => sum + item.cgstAmount, 0));
        const sgstAmount = toMoney(itemPayload.reduce((sum, item) => sum + item.sgstAmount, 0));
        const igstAmount = toMoney(itemPayload.reduce((sum, item) => sum + item.igstAmount, 0));
        const totalAmount = toMoney(subtotal + cgstAmount + sgstAmount + igstAmount);
        return db.invoice.create({
            data: {
                organizationId: input.organizationId,
                invoiceNumber,
                orderId: (_a = input.orderId) !== null && _a !== void 0 ? _a : null,
                posOrderId: (_b = input.posOrderId) !== null && _b !== void 0 ? _b : null,
                customerId: (_c = input.customerId) !== null && _c !== void 0 ? _c : null,
                placeOfSupply: input.customerStateCode || null,
                subtotal,
                cgstAmount,
                sgstAmount,
                igstAmount,
                totalAmount,
                status: (_d = input.status) !== null && _d !== void 0 ? _d : "ISSUED",
                items: {
                    create: itemPayload.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        gstRate: item.gstRate,
                        cgstRate: item.cgstRate,
                        sgstRate: item.sgstRate,
                        igstRate: item.igstRate,
                        cgstAmount: item.cgstAmount,
                        sgstAmount: item.sgstAmount,
                        igstAmount: item.igstAmount,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                            },
                        },
                    },
                },
            },
        });
    });
    if (input.tx) {
        return createOnce(input.tx);
    }
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () { return createOnce(tx); }));
        }
        catch (error) {
            if (isUniqueConstraintError(error) && attempt < 2) {
                continue;
            }
            throw error;
        }
    }
    throw new InvoiceError(500, "Unable to generate unique invoice number");
});
const createInvoiceFromPOSOrder = (organizationId, posOrderId, options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!(posOrderId === null || posOrderId === void 0 ? void 0 : posOrderId.trim())) {
        throw new InvoiceError(400, "posOrderId is required");
    }
    const existing = yield ((_a = options === null || options === void 0 ? void 0 : options.tx) !== null && _a !== void 0 ? _a : prisma_1.default).invoice.findFirst({
        where: { posOrderId: posOrderId.trim() },
        include: { items: true },
    });
    if (existing) {
        throw new InvoiceError(409, "Invoice already exists for this POS order");
    }
    const posOrder = yield ((_b = options === null || options === void 0 ? void 0 : options.tx) !== null && _b !== void 0 ? _b : prisma_1.default).pOSOrder.findUnique({
        where: { id: posOrderId.trim() },
        include: {
            customer: {
                select: {
                    stateCode: true,
                },
            },
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            taxRate: true,
                        },
                    },
                },
            },
        },
    });
    if (!posOrder) {
        throw new InvoiceError(404, "POS order not found");
    }
    if (posOrder.organizationId !== organizationId) {
        throw new InvoiceError(403, "POS order does not belong to this organization");
    }
    if (posOrder.status !== "COMPLETED") {
        throw new InvoiceError(400, "Invoice can only be generated for completed POS orders");
    }
    const items = posOrder.items.map((item) => {
        var _a;
        return ({
            productId: item.product.id,
            quantity: item.quantity,
            price: Number(item.price),
            gstRate: Number((_a = item.product.taxRate) !== null && _a !== void 0 ? _a : 0),
        });
    });
    return createInvoiceRecord({
        organizationId,
        posOrderId: posOrder.id,
        customerId: posOrder.customerId,
        customerStateCode: ((_c = posOrder.customer) === null || _c === void 0 ? void 0 : _c.stateCode) || null,
        status: "PAID",
        items,
        tx: options === null || options === void 0 ? void 0 : options.tx,
    });
});
exports.createInvoiceFromPOSOrder = createInvoiceFromPOSOrder;
const createManualInvoice = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!Array.isArray(input.items) || input.items.length === 0) {
        throw new InvoiceError(400, "items are required");
    }
    // Get customer state if customerId provided
    let customerStateCode = null;
    if (input.customerId) {
        const customer = yield prisma_1.default.contact.findUnique({
            where: { id: input.customerId },
            select: { stateCode: true },
        });
        customerStateCode = (customer === null || customer === void 0 ? void 0 : customer.stateCode) || null;
    }
    const productIds = input.items.map((item) => item.productId);
    const products = yield prisma_1.default.product.findMany({
        where: {
            id: { in: productIds },
            organizationId,
            isActive: true,
        },
        select: {
            id: true,
            unitPrice: true,
            taxRate: true,
        },
    });
    if (products.length !== productIds.length) {
        throw new InvoiceError(400, "One or more products are invalid");
    }
    const productMap = new Map(products.map((product) => [product.id, product]));
    const normalized = input.items.map((item) => {
        var _a, _b, _c;
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            throw new InvoiceError(400, "Item quantity must be an integer > 0");
        }
        const product = productMap.get(item.productId);
        if (!product) {
            throw new InvoiceError(400, `Invalid product ${item.productId}`);
        }
        return {
            productId: item.productId,
            quantity: item.quantity,
            price: toMoney((_a = item.price) !== null && _a !== void 0 ? _a : Number(product.unitPrice)),
            gstRate: toMoney((_b = item.taxRate) !== null && _b !== void 0 ? _b : Number((_c = product.taxRate) !== null && _c !== void 0 ? _c : 0)),
        };
    });
    return createInvoiceRecord({
        organizationId,
        customerId: (_a = input.customerId) !== null && _a !== void 0 ? _a : null,
        customerStateCode,
        status: (_b = input.status) !== null && _b !== void 0 ? _b : "DRAFT",
        items: normalized,
    });
});
exports.createManualInvoice = createManualInvoice;
const getTotalCreditsForInvoice = (organizationId, invoiceId, tx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const db = tx !== null && tx !== void 0 ? tx : prisma_1.default;
    const credits = yield db.transaction.aggregate({
        where: {
            organizationId,
            type: "REFUND",
            referenceNumber: {
                startsWith: `CREDIT-NOTE-${invoiceId}`,
            },
        },
        _sum: {
            totalAmount: true,
        },
    });
    return toMoney(Number((_a = credits._sum.totalAmount) !== null && _a !== void 0 ? _a : 0));
});
const listInvoices = (organizationId, filters) => __awaiter(void 0, void 0, void 0, function* () {
    const invoices = yield prisma_1.default.invoice.findMany({
        where: Object.assign(Object.assign({ organizationId }, ((filters === null || filters === void 0 ? void 0 : filters.status) ? { status: filters.status } : {})), ((filters === null || filters === void 0 ? void 0 : filters.customerId) ? { customerId: filters.customerId } : {})),
        include: {
            customer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    companyName: true,
                    email: true,
                },
            },
            paymentAllocations: {
                select: {
                    amount: true,
                },
            },
        },
        orderBy: [{ issuedAt: "desc" }],
    });
    const normalized = invoices.map((invoice) => {
        const allocatedAmount = toMoney(invoice.paymentAllocations.reduce((sum, allocation) => sum + Number(allocation.amount), 0));
        const outstandingAmount = toMoney(Number(invoice.totalAmount) - allocatedAmount);
        const daysSinceIssue = Math.floor((Date.now() - new Date(invoice.issuedAt).getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = outstandingAmount > 0 && daysSinceIssue > 30 && invoice.status !== "CANCELLED";
        return {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            issuedAt: invoice.issuedAt,
            totalAmount: Number(invoice.totalAmount),
            allocatedAmount,
            outstandingAmount,
            daysSinceIssue,
            isOverdue,
            customer: invoice.customer,
        };
    });
    if (filters === null || filters === void 0 ? void 0 : filters.overdueOnly) {
        return normalized.filter((invoice) => invoice.isOverdue);
    }
    return normalized;
});
exports.listInvoices = listInvoices;
const getInvoiceFollowUps = (organizationId_1, ...args_1) => __awaiter(void 0, [organizationId_1, ...args_1], void 0, function* (organizationId, followUpAfterDays = 30) {
    const invoices = yield (0, exports.listInvoices)(organizationId, { overdueOnly: false });
    return invoices
        .filter((invoice) => invoice.outstandingAmount > 0 && invoice.daysSinceIssue >= followUpAfterDays)
        .map((invoice) => ({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer,
        outstandingAmount: invoice.outstandingAmount,
        daysSinceIssue: invoice.daysSinceIssue,
        recommendedAction: invoice.daysSinceIssue >= 60
            ? "Send final reminder and assign collections task"
            : "Send payment reminder email",
    }));
});
exports.getInvoiceFollowUps = getInvoiceFollowUps;
const createCreditNoteFromInvoice = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!((_a = input.invoiceId) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new InvoiceError(400, "invoiceId is required");
    }
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const invoice = yield tx.invoice.findUnique({
            where: { id: input.invoiceId.trim() },
            include: {
                paymentAllocations: {
                    select: { amount: true },
                },
            },
        });
        if (!invoice) {
            throw new InvoiceError(404, "Invoice not found");
        }
        if (invoice.organizationId !== organizationId) {
            throw new InvoiceError(403, "Invoice does not belong to this organization");
        }
        if (invoice.status === "CANCELLED") {
            throw new InvoiceError(409, "Cancelled invoice cannot be credited");
        }
        const previouslyCredited = yield getTotalCreditsForInvoice(organizationId, invoice.id, tx);
        const availableToCredit = toMoney(Number(invoice.totalAmount) - previouslyCredited);
        if (availableToCredit <= 0) {
            throw new InvoiceError(409, "Invoice is already fully credited");
        }
        const creditAmount = toMoney((_a = input.amount) !== null && _a !== void 0 ? _a : availableToCredit);
        if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
            throw new InvoiceError(400, "amount must be a positive number");
        }
        if (creditAmount > availableToCredit) {
            throw new InvoiceError(400, "Credit amount exceeds remaining invoice amount");
        }
        const allocatedAmount = toMoney(invoice.paymentAllocations.reduce((sum, allocation) => sum + Number(allocation.amount), 0));
        const isPaidFlow = allocatedAmount > 0 || invoice.status === "PAID";
        const { revenueLedgerId, receivableLedgerId, cashLedgerId } = yield getRevenueAndReceivableLedgers(organizationId, tx);
        const transaction = yield (0, accounting_service_1.createTransactionWithEntries)(organizationId, "REFUND", `CREDIT-NOTE-${invoice.id}-${Date.now()}`, [
            { ledgerAccountId: revenueLedgerId, debit: creditAmount },
            {
                ledgerAccountId: isPaidFlow ? cashLedgerId : receivableLedgerId,
                credit: creditAmount,
            },
        ], {
            contactId: (_b = invoice.customerId) !== null && _b !== void 0 ? _b : undefined,
            totalAmount: creditAmount,
            status: "POSTED",
            tx,
        });
        const newCredited = toMoney(previouslyCredited + creditAmount);
        const newStatus = newCredited >= Number(invoice.totalAmount) ? "CREDIT_NOTED" : "PARTIALLY_CREDITED";
        const updatedInvoice = yield tx.invoice.update({
            where: { id: invoice.id },
            data: {
                status: newStatus,
            },
            include: {
                items: true,
                customer: true,
            },
        });
        return {
            message: "Credit note posted successfully",
            reason: (_c = input.reason) !== null && _c !== void 0 ? _c : null,
            creditAmount,
            creditedTotal: newCredited,
            invoice: updatedInvoice,
            refundTransactionId: transaction.id,
        };
    }));
});
exports.createCreditNoteFromInvoice = createCreditNoteFromInvoice;
const cancelInvoice = (organizationId, invoiceId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(invoiceId === null || invoiceId === void 0 ? void 0 : invoiceId.trim())) {
        throw new InvoiceError(400, "invoiceId is required");
    }
    const invoice = yield prisma_1.default.invoice.findUnique({
        where: { id: invoiceId.trim() },
        select: {
            id: true,
            organizationId: true,
            status: true,
            totalAmount: true,
            customerId: true,
            orderId: true,
            posOrderId: true,
        },
    });
    if (!invoice) {
        throw new InvoiceError(404, "Invoice not found");
    }
    if (invoice.organizationId !== organizationId) {
        throw new InvoiceError(403, "Invoice does not belong to this organization");
    }
    if (invoice.status === "CANCELLED") {
        throw new InvoiceError(409, "Invoice already cancelled");
    }
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const { revenueLedgerId, receivableLedgerId, cashLedgerId } = yield getRevenueAndReceivableLedgers(organizationId, tx);
        if (invoice.posOrderId) {
            yield (0, accounting_service_1.createTransactionWithEntries)(organizationId, "REFUND", `INVOICE-CANCEL-${invoice.id}`, [
                { ledgerAccountId: revenueLedgerId, debit: Number(invoice.totalAmount) },
                { ledgerAccountId: cashLedgerId, credit: Number(invoice.totalAmount) },
            ], {
                contactId: (_a = invoice.customerId) !== null && _a !== void 0 ? _a : undefined,
                totalAmount: Number(invoice.totalAmount),
                status: "POSTED",
                tx,
            });
        }
        else {
            yield (0, accounting_service_1.createTransactionWithEntries)(organizationId, "REFUND", `INVOICE-CANCEL-${invoice.id}`, [
                { ledgerAccountId: revenueLedgerId, debit: Number(invoice.totalAmount) },
                { ledgerAccountId: receivableLedgerId, credit: Number(invoice.totalAmount) },
            ], {
                contactId: (_b = invoice.customerId) !== null && _b !== void 0 ? _b : undefined,
                totalAmount: Number(invoice.totalAmount),
                status: "POSTED",
                tx,
            });
        }
        return tx.invoice.update({
            where: { id: invoice.id },
            data: {
                status: "CANCELLED",
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, sku: true },
                        },
                    },
                },
            },
        });
    }));
});
exports.cancelInvoice = cancelInvoice;
const getInvoiceById = (organizationId, invoiceId) => __awaiter(void 0, void 0, void 0, function* () {
    const invoice = yield prisma_1.default.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            customer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    companyName: true,
                    email: true,
                    phone: true,
                    gstNumber: true,
                    billingAddress: true,
                },
            },
            organization: {
                select: {
                    id: true,
                    name: true,
                },
            },
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                        },
                    },
                },
            },
        },
    });
    if (!invoice) {
        throw new InvoiceError(404, "Invoice not found");
    }
    if (invoice.organizationId !== organizationId) {
        throw new InvoiceError(403, "Invoice does not belong to this organization");
    }
    return invoice;
});
exports.getInvoiceById = getInvoiceById;
const drawInvoiceHeader = (doc, invoice, template) => {
    if (template === "minimal") {
        doc.fontSize(20).text(invoice.invoiceNumber, { align: "left" });
        doc.fontSize(10).text(`Date ${invoice.issuedAt.toISOString().slice(0, 10)}`);
        doc.moveDown(0.8);
        return;
    }
    if (template === "detailed") {
        doc.fontSize(18).text("TAX INVOICE", { align: "center" });
        doc.moveDown(0.7);
        doc.fontSize(11).text(`Invoice Number: ${invoice.invoiceNumber}`);
        doc.text(`Issued At: ${invoice.issuedAt.toISOString()}`);
        doc.text(`Status: ${invoice.status}`);
        doc.text(`Template: Detailed`);
        doc.text(`Source: ${invoice.orderId ? "Order" : invoice.posOrderId ? "POS" : "Manual"}`);
        doc.moveDown(1);
        return;
    }
    doc.fontSize(18).text("TAX INVOICE", { align: "center" });
    doc.moveDown(1);
    doc.fontSize(11).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Issued At: ${invoice.issuedAt.toISOString()}`);
    doc.text(`Status: ${invoice.status}`);
    doc.text(`Source: ${invoice.orderId ? "Order" : invoice.posOrderId ? "POS" : "Manual"}`);
    doc.moveDown(1);
};
const generateInvoicePDF = (organizationId, invoiceId, options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const invoice = yield (0, exports.getInvoiceById)(organizationId, invoiceId);
    const template = (_a = options === null || options === void 0 ? void 0 : options.template) !== null && _a !== void 0 ? _a : "classic";
    const doc = new pdfkit_1.default({ size: "A4", margin: 40 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const done = new Promise((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
    });
    drawInvoiceHeader(doc, invoice, template);
    doc.fontSize(12).text(`Company: ${invoice.organization.name}`);
    doc.fontSize(10).text(template === "minimal" ? "GST: -" : "GST Number: N/A");
    doc.moveDown(1);
    const customerName = ((_b = invoice.customer) === null || _b === void 0 ? void 0 : _b.companyName) ||
        `${(_d = (_c = invoice.customer) === null || _c === void 0 ? void 0 : _c.firstName) !== null && _d !== void 0 ? _d : ""} ${(_f = (_e = invoice.customer) === null || _e === void 0 ? void 0 : _e.lastName) !== null && _f !== void 0 ? _f : ""}`.trim() ||
        "Walk-in Customer";
    doc.fontSize(12).text(`Customer: ${customerName}`);
    doc.fontSize(10).text(`Customer GST: ${(_h = (_g = invoice.customer) === null || _g === void 0 ? void 0 : _g.gstNumber) !== null && _h !== void 0 ? _h : "N/A"}`);
    doc.text(`Customer Email: ${(_k = (_j = invoice.customer) === null || _j === void 0 ? void 0 : _j.email) !== null && _k !== void 0 ? _k : "N/A"}`);
    doc.text(`Billing Address: ${(_m = (_l = invoice.customer) === null || _l === void 0 ? void 0 : _l.billingAddress) !== null && _m !== void 0 ? _m : "N/A"}`);
    doc.moveDown(1);
    doc.fontSize(10).text("Items", { underline: true });
    doc.moveDown(0.5);
    for (const item of invoice.items) {
        const lineSubtotal = toMoney(Number(item.price) * item.quantity);
        const lineGST = toMoney(Number(item.cgstAmount) + Number(item.sgstAmount) + Number(item.igstAmount));
        if (template === "minimal") {
            doc.text(`${item.product.name}  Qty ${item.quantity}  Rate ${Number(item.price).toFixed(2)}  Line ${lineSubtotal.toFixed(2)}`);
        }
        else {
            doc.text(`${item.product.name} (${item.product.sku})  Qty: ${item.quantity}  Price: ${Number(item.price).toFixed(2)}  GST%: ${Number(item.gstRate).toFixed(2)}  CGST: ${Number(item.cgstAmount).toFixed(2)}  SGST: ${Number(item.sgstAmount).toFixed(2)}  IGST: ${Number(item.igstAmount).toFixed(2)}  GST: ${lineGST.toFixed(2)}  Line: ${lineSubtotal.toFixed(2)}`);
        }
    }
    doc.moveDown(1);
    doc.fontSize(11).text(`Subtotal: ${Number(invoice.subtotal).toFixed(2)}`, { align: "right" });
    doc.text(`CGST: ${Number(invoice.cgstAmount).toFixed(2)}`, { align: "right" });
    doc.text(`SGST: ${Number(invoice.sgstAmount).toFixed(2)}`, { align: "right" });
    doc.text(`IGST: ${Number(invoice.igstAmount).toFixed(2)}`, { align: "right" });
    doc.text(`Total Amount: ${Number(invoice.totalAmount).toFixed(2)}`, { align: "right" });
    if (template === "detailed") {
        doc.moveDown(0.8);
        doc.fontSize(9).text("Notes: This invoice is system generated and valid without physical signature.");
    }
    doc.moveDown(2);
    doc.text("Authorized Signature", { align: "right" });
    doc.end();
    const buffer = yield done;
    return {
        invoice,
        buffer,
        fileName: `${invoice.invoiceNumber}-${template}.pdf`,
    };
});
exports.generateInvoicePDF = generateInvoicePDF;
