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
exports.generateGSTR1Data = exports.generateGSTReport = exports.deleteGSTConfig = exports.updateGSTConfig = exports.getGSTConfig = exports.createGSTConfig = exports.calculateGST = exports.GSTError = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
class GSTError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "GSTError";
    }
}
exports.GSTError = GSTError;
const toMoney = (value) => Number(value.toFixed(2));
/**
 * Calculate GST breakdown based on seller and buyer state codes
 */
const calculateGST = (sellerStateCode, buyerStateCode, taxableValue, gstRate) => {
    const normalizedSellerState = sellerStateCode === null || sellerStateCode === void 0 ? void 0 : sellerStateCode.trim();
    const normalizedBuyerState = buyerStateCode === null || buyerStateCode === void 0 ? void 0 : buyerStateCode.trim();
    if (!normalizedSellerState) {
        throw new GSTError(400, "Seller state code is required for GST calculation");
    }
    // If buyer state is not provided or same as seller → Intra-state (CGST + SGST)
    const isIntraState = !normalizedBuyerState || normalizedSellerState === normalizedBuyerState;
    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    if (isIntraState) {
        // Same state: split GST into CGST and SGST
        cgstRate = toMoney(gstRate / 2);
        sgstRate = toMoney(gstRate / 2);
        igstRate = 0;
    }
    else {
        // Different state: full GST as IGST
        cgstRate = 0;
        sgstRate = 0;
        igstRate = gstRate;
    }
    const cgstAmount = toMoney((taxableValue * cgstRate) / 100);
    const sgstAmount = toMoney((taxableValue * sgstRate) / 100);
    const igstAmount = toMoney((taxableValue * igstRate) / 100);
    const totalGSTAmount = toMoney(cgstAmount + sgstAmount + igstAmount);
    return {
        gstRate,
        cgstRate,
        sgstRate,
        igstRate,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalGSTAmount,
        isIntraState,
    };
};
exports.calculateGST = calculateGST;
const createGSTConfig = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    if (!((_a = input.gstNumber) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new GSTError(400, "GST number is required");
    }
    if (!((_b = input.legalName) === null || _b === void 0 ? void 0 : _b.trim())) {
        throw new GSTError(400, "Legal name is required");
    }
    if (!((_c = input.stateCode) === null || _c === void 0 ? void 0 : _c.trim())) {
        throw new GSTError(400, "State code is required");
    }
    // Validate GST number format (15 characters: 2 state code + 10 PAN + 1 entity + 1 zone + 1 check)
    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstPattern.test(input.gstNumber.trim())) {
        throw new GSTError(400, "Invalid GST number format");
    }
    // Check if GST config already exists
    const existing = yield prisma_1.default.gSTConfig.findUnique({
        where: { organizationId },
    });
    if (existing) {
        throw new GSTError(409, "GST configuration already exists for this organization");
    }
    const gstConfig = yield prisma_1.default.gSTConfig.create({
        data: {
            organizationId,
            gstNumber: input.gstNumber.trim(),
            legalName: input.legalName.trim(),
            tradeName: ((_d = input.tradeName) === null || _d === void 0 ? void 0 : _d.trim()) || null,
            stateCode: input.stateCode.trim(),
            isComposition: (_e = input.isComposition) !== null && _e !== void 0 ? _e : false,
        },
    });
    return gstConfig;
});
exports.createGSTConfig = createGSTConfig;
const getGSTConfig = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const gstConfig = yield prisma_1.default.gSTConfig.findUnique({
        where: { organizationId },
    });
    if (!gstConfig) {
        throw new GSTError(404, "GST configuration not found for this organization");
    }
    return gstConfig;
});
exports.getGSTConfig = getGSTConfig;
const updateGSTConfig = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const existing = yield prisma_1.default.gSTConfig.findUnique({
        where: { organizationId },
    });
    if (!existing) {
        throw new GSTError(404, "GST configuration not found");
    }
    // Validate GST number if provided
    if (input.gstNumber) {
        const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstPattern.test(input.gstNumber.trim())) {
            throw new GSTError(400, "Invalid GST number format");
        }
    }
    const updated = yield prisma_1.default.gSTConfig.update({
        where: { organizationId },
        data: {
            gstNumber: ((_a = input.gstNumber) === null || _a === void 0 ? void 0 : _a.trim()) || existing.gstNumber,
            legalName: ((_b = input.legalName) === null || _b === void 0 ? void 0 : _b.trim()) || existing.legalName,
            tradeName: input.tradeName !== undefined ? ((_c = input.tradeName) === null || _c === void 0 ? void 0 : _c.trim()) || null : existing.tradeName,
            stateCode: ((_d = input.stateCode) === null || _d === void 0 ? void 0 : _d.trim()) || existing.stateCode,
            isComposition: (_e = input.isComposition) !== null && _e !== void 0 ? _e : existing.isComposition,
        },
    });
    return updated;
});
exports.updateGSTConfig = updateGSTConfig;
const deleteGSTConfig = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_1.default.gSTConfig.findUnique({
        where: { organizationId },
        select: { id: true },
    });
    if (!existing) {
        throw new GSTError(404, "GST configuration not found");
    }
    yield prisma_1.default.gSTConfig.delete({
        where: { organizationId },
    });
    return { message: "GST configuration deleted" };
});
exports.deleteGSTConfig = deleteGSTConfig;
const generateGSTReport = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    const { month, year } = input;
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new GSTError(400, "Month must be between 1 and 12");
    }
    if (!Number.isInteger(year) || year < 2000) {
        throw new GSTError(400, "Invalid year");
    }
    // Date range for the month
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 1, 0, 0, 0, 0);
    // Output GST: Invoices (sales)
    const invoices = yield prisma_1.default.invoice.findMany({
        where: {
            organizationId,
            issuedAt: {
                gte: startDate,
                lt: endDate,
            },
            status: {
                not: "CANCELLED",
            },
        },
        select: {
            subtotal: true,
            cgstAmount: true,
            sgstAmount: true,
            igstAmount: true,
        },
    });
    const outputTaxableValue = toMoney(invoices.reduce((sum, inv) => sum + Number(inv.subtotal), 0));
    const outputCGST = toMoney(invoices.reduce((sum, inv) => sum + Number(inv.cgstAmount), 0));
    const outputSGST = toMoney(invoices.reduce((sum, inv) => sum + Number(inv.sgstAmount), 0));
    const outputIGST = toMoney(invoices.reduce((sum, inv) => sum + Number(inv.igstAmount), 0));
    const totalOutputGST = toMoney(outputCGST + outputSGST + outputIGST);
    // Input Tax Credit (ITC): Purchase orders
    const purchases = yield prisma_1.default.purchaseOrder.findMany({
        where: {
            organizationId,
            createdAt: {
                gte: startDate,
                lt: endDate,
            },
            status: "RECEIVED",
        },
        include: {
            items: {
                select: {
                    quantity: true,
                    unitPrice: true,
                    cgstAmount: true,
                    sgstAmount: true,
                    igstAmount: true,
                },
            },
        },
    });
    let inputTaxableValue = 0;
    let inputCGST = 0;
    let inputSGST = 0;
    let inputIGST = 0;
    purchases.forEach((po) => {
        po.items.forEach((item) => {
            const itemValue = Number(item.unitPrice) * item.quantity;
            inputTaxableValue += itemValue;
            inputCGST += Number(item.cgstAmount);
            inputSGST += Number(item.sgstAmount);
            inputIGST += Number(item.igstAmount);
        });
    });
    inputTaxableValue = toMoney(inputTaxableValue);
    inputCGST = toMoney(inputCGST);
    inputSGST = toMoney(inputSGST);
    inputIGST = toMoney(inputIGST);
    const totalITC = toMoney(inputCGST + inputSGST + inputIGST);
    // Net GST payable = Output GST - Input Tax Credit
    const netGSTPayable = toMoney(totalOutputGST - totalITC);
    return {
        period: {
            month,
            year,
            startDate,
            endDate,
        },
        output: {
            totalInvoices: invoices.length,
            totalTaxableValue: outputTaxableValue,
            totalCGST: outputCGST,
            totalSGST: outputSGST,
            totalIGST: outputIGST,
            totalGST: totalOutputGST,
        },
        input: {
            totalPurchases: purchases.length,
            totalTaxableValue: inputTaxableValue,
            totalCGST: inputCGST,
            totalSGST: inputSGST,
            totalIGST: inputIGST,
            totalITC: totalITC,
        },
        netGSTPayable,
    };
});
exports.generateGSTReport = generateGSTReport;
const generateGSTR1Data = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    const { month, year } = input;
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new GSTError(400, "Month must be between 1 and 12");
    }
    if (!Number.isInteger(year) || year < 2000) {
        throw new GSTError(400, "Invalid year");
    }
    // Get GST config
    const gstConfig = yield (0, exports.getGSTConfig)(organizationId);
    // Date range for the month
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 1, 0, 0, 0, 0);
    // Fetch all invoices for the period
    const invoices = yield prisma_1.default.invoice.findMany({
        where: {
            organizationId,
            issuedAt: {
                gte: startDate,
                lt: endDate,
            },
            status: {
                not: "CANCELLED",
            },
        },
        include: {
            customer: {
                select: {
                    gstNumber: true,
                    firstName: true,
                    lastName: true,
                    companyName: true,
                    stateCode: true,
                },
            },
        },
        orderBy: {
            issuedAt: "asc",
        },
    });
    const invoiceData = invoices.map((inv) => {
        var _a, _b;
        const customerName = inv.customer
            ? inv.customer.companyName || `${inv.customer.firstName || ""} ${inv.customer.lastName || ""}`.trim()
            : null;
        const cgst = Number(inv.cgstAmount);
        const sgst = Number(inv.sgstAmount);
        const igst = Number(inv.igstAmount);
        const totalGST = toMoney(cgst + sgst + igst);
        return {
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.issuedAt.toISOString().split("T")[0],
            customerGSTIN: ((_a = inv.customer) === null || _a === void 0 ? void 0 : _a.gstNumber) || null,
            customerName,
            placeOfSupply: inv.placeOfSupply || ((_b = inv.customer) === null || _b === void 0 ? void 0 : _b.stateCode) || null,
            invoiceValue: Number(inv.totalAmount),
            taxableValue: Number(inv.subtotal),
            cgstAmount: cgst,
            sgstAmount: sgst,
            igstAmount: igst,
            totalGST,
            isIntraState: igst === 0,
        };
    });
    // Calculate summary
    const summary = {
        totalInvoices: invoiceData.length,
        totalInvoiceValue: toMoney(invoiceData.reduce((sum, inv) => sum + inv.invoiceValue, 0)),
        totalTaxableValue: toMoney(invoiceData.reduce((sum, inv) => sum + inv.taxableValue, 0)),
        totalCGST: toMoney(invoiceData.reduce((sum, inv) => sum + inv.cgstAmount, 0)),
        totalSGST: toMoney(invoiceData.reduce((sum, inv) => sum + inv.sgstAmount, 0)),
        totalIGST: toMoney(invoiceData.reduce((sum, inv) => sum + inv.igstAmount, 0)),
        totalGST: toMoney(invoiceData.reduce((sum, inv) => sum + inv.totalGST, 0)),
    };
    return {
        gstin: gstConfig.gstNumber,
        legalName: gstConfig.legalName,
        tradeName: gstConfig.tradeName,
        period: {
            month,
            year,
        },
        generatedAt: new Date(),
        summary,
        invoices: invoiceData,
    };
});
exports.generateGSTR1Data = generateGSTR1Data;
