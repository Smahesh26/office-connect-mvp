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
exports.generateGSTR1JSON = exports.generateGSTR1CSV = exports.generateGSTR1Report = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const toMoney = (value) => Number(value.toFixed(2));
const formatDateDDMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};
/**
 * Generate GSTR-1 report for a given month/year
 */
const generateGSTR1Report = (organizationId, month, year) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error("Month must be between 1 and 12");
    }
    if (!Number.isInteger(year) || year < 2000) {
        throw new Error("Invalid year");
    }
    // Date range for the month
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 1, 0, 0, 0, 0);
    // Fetch all ISSUED invoices for this period
    const invoices = yield prisma_1.default.invoice.findMany({
        where: {
            organizationId,
            status: "ISSUED",
            issuedAt: {
                gte: startDate,
                lt: endDate,
            },
        },
        include: {
            customer: {
                select: {
                    gstNumber: true,
                    stateCode: true,
                },
            },
        },
        orderBy: {
            issuedAt: "asc",
        },
    });
    const b2b = [];
    const b2c = [];
    let totalTaxableValue = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalInvoiceValue = 0;
    for (const invoice of invoices) {
        const invoiceValue = toMoney(Number(invoice.totalAmount));
        const taxableValue = toMoney(Number(invoice.subtotal));
        const cgst = toMoney(Number(invoice.cgstAmount));
        const sgst = toMoney(Number(invoice.sgstAmount));
        const igst = toMoney(Number(invoice.igstAmount));
        const totalTax = toMoney(cgst + sgst + igst);
        totalTaxableValue += taxableValue;
        totalCGST += cgst;
        totalSGST += sgst;
        totalIGST += igst;
        totalInvoiceValue += invoiceValue;
        const baseRecord = {
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: formatDateDDMMYYYY(invoice.issuedAt),
            invoiceValue,
            placeOfSupply: invoice.placeOfSupply || ((_a = invoice.customer) === null || _a === void 0 ? void 0 : _a.stateCode) || "00",
            taxableValue,
            cgstAmount: cgst,
            sgstAmount: sgst,
            igstAmount: igst,
            totalTax,
        };
        if ((_c = (_b = invoice.customer) === null || _b === void 0 ? void 0 : _b.gstNumber) === null || _c === void 0 ? void 0 : _c.trim()) {
            b2b.push(Object.assign({ gstin: invoice.customer.gstNumber }, baseRecord));
        }
        else {
            b2c.push(baseRecord);
        }
    }
    const summary = {
        totalB2BInvoices: b2b.length,
        totalB2CInvoices: b2c.length,
        totalTaxableValue: toMoney(totalTaxableValue),
        totalCGST: toMoney(totalCGST),
        totalSGST: toMoney(totalSGST),
        totalIGST: toMoney(totalIGST),
        totalTax: toMoney(totalCGST + totalSGST + totalIGST),
        totalInvoiceValue: toMoney(totalInvoiceValue),
    };
    return {
        period: {
            month,
            year,
            startDate,
            endDate,
        },
        b2b,
        b2c,
        summary,
        generatedAt: new Date(),
    };
});
exports.generateGSTR1Report = generateGSTR1Report;
/**
 * Generate CSV content from GSTR-1 report data
 */
const generateGSTR1CSV = (report) => {
    const lines = [];
    // Header and metadata
    lines.push("GSTR-1 RETURN");
    lines.push(`Month: ${String(report.period.month).padStart(2, "0")}, Year: ${report.period.year}`);
    lines.push(`Generated: ${report.generatedAt.toISOString()}`);
    lines.push("");
    // B2B Section
    lines.push("B2B INVOICES - SUPPLIES TO REGISTERED CUSTOMERS");
    lines.push("GSTIN,Invoice Number,Invoice Date,Invoice Value,Place of Supply,Taxable Value,CGST (%),SGST (%),IGST (%),Total Tax,Invoice Total");
    for (const record of report.b2b) {
        const taxableValue = record.taxableValue;
        const cgstRate = taxableValue > 0 ? ((record.cgstAmount / taxableValue) * 100).toFixed(2) : "0.00";
        const sgstRate = taxableValue > 0 ? ((record.sgstAmount / taxableValue) * 100).toFixed(2) : "0.00";
        const igstRate = taxableValue > 0 ? ((record.igstAmount / taxableValue) * 100).toFixed(2) : "0.00";
        lines.push(`"${record.gstin}","${record.invoiceNumber}","${record.invoiceDate}","${record.invoiceValue.toFixed(2)}","${record.placeOfSupply}","${record.taxableValue.toFixed(2)}","${cgstRate}%","${sgstRate}%","${igstRate}%","${record.totalTax.toFixed(2)}","${record.invoiceValue.toFixed(2)}"`);
    }
    lines.push("");
    lines.push(`B2B Summary: ${report.summary.totalB2BInvoices} invoices`);
    lines.push("");
    // B2C Section
    if (report.b2c.length > 0) {
        lines.push("B2C INVOICES - SUPPLIES TO UNREGISTERED CUSTOMERS");
        lines.push("Invoice Number,Invoice Date,Invoice Value,Place of Supply,Taxable Value,CGST (%),SGST (%),IGST (%),Total Tax,Invoice Total");
        for (const record of report.b2c) {
            const taxableValue = record.taxableValue;
            const cgstRate = taxableValue > 0 ? ((record.cgstAmount / taxableValue) * 100).toFixed(2) : "0.00";
            const sgstRate = taxableValue > 0 ? ((record.sgstAmount / taxableValue) * 100).toFixed(2) : "0.00";
            const igstRate = taxableValue > 0 ? ((record.igstAmount / taxableValue) * 100).toFixed(2) : "0.00";
            lines.push(`"${record.invoiceNumber}","${record.invoiceDate}","${record.invoiceValue.toFixed(2)}","${record.placeOfSupply}","${record.taxableValue.toFixed(2)}","${cgstRate}%","${sgstRate}%","${igstRate}%","${record.totalTax.toFixed(2)}","${record.invoiceValue.toFixed(2)}"`);
        }
        lines.push("");
        lines.push(`B2C Summary: ${report.summary.totalB2CInvoices} invoices`);
        lines.push("");
    }
    // Combined Summary
    lines.push("GSTR-1 SUMMARY");
    lines.push(`Total Invoices,${report.summary.totalB2BInvoices + report.summary.totalB2CInvoices}`);
    lines.push(`Total Taxable Value,"${report.summary.totalTaxableValue.toFixed(2)}"`);
    lines.push(`Total CGST,"${report.summary.totalCGST.toFixed(2)}"`);
    lines.push(`Total SGST,"${report.summary.totalSGST.toFixed(2)}"`);
    lines.push(`Total IGST,"${report.summary.totalIGST.toFixed(2)}"`);
    lines.push(`Total Tax,"${report.summary.totalTax.toFixed(2)}"`);
    lines.push(`Total Invoice Value,"${report.summary.totalInvoiceValue.toFixed(2)}"`);
    return lines.join("\n");
};
exports.generateGSTR1CSV = generateGSTR1CSV;
/**
 * Generate standardized JSON for GSTR-1 submission
 */
const generateGSTR1JSON = (report) => {
    return {
        period: {
            month: report.period.month,
            year: report.period.year,
        },
        b2b: report.b2b.map((r) => ({
            gstin: r.gstin,
            invoiceNo: r.invoiceNumber,
            invoiceDate: r.invoiceDate,
            invoiceValue: r.invoiceValue,
            placeOfSupply: r.placeOfSupply,
            taxableValue: r.taxableValue,
            cgst: r.cgstAmount,
            sgst: r.sgstAmount,
            igst: r.igstAmount,
        })),
        b2c: report.b2c.map((r) => ({
            invoiceNo: r.invoiceNumber,
            invoiceDate: r.invoiceDate,
            invoiceValue: r.invoiceValue,
            placeOfSupply: r.placeOfSupply,
            taxableValue: r.taxableValue,
            cgst: r.cgstAmount,
            sgst: r.sgstAmount,
            igst: r.igstAmount,
        })),
        summary: {
            totalB2BInvoices: report.summary.totalB2BInvoices,
            totalB2CInvoices: report.summary.totalB2CInvoices,
            totalTaxableValue: report.summary.totalTaxableValue,
            totalCGST: report.summary.totalCGST,
            totalSGST: report.summary.totalSGST,
            totalIGST: report.summary.totalIGST,
            totalTax: report.summary.totalTax,
            totalInvoiceValue: report.summary.totalInvoiceValue,
        },
    };
};
exports.generateGSTR1JSON = generateGSTR1JSON;
