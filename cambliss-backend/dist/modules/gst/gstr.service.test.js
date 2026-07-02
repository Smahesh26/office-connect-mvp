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
const globals_1 = require("@jest/globals");
const prisma_1 = __importDefault(require("../../config/prisma"));
const gstr_service_1 = require("./gstr.service");
(0, globals_1.describe)("GSTR-1 Report Generation", () => {
    let testOrgId;
    let testCustomerB2B;
    let testCustomerB2C;
    (0, globals_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Create test organization
        const org = yield prisma_1.default.organization.create({
            data: {
                name: "GSTR Test Org",
            },
        });
        testOrgId = org.id;
        // Create B2B customer (with GST number)
        testCustomerB2B = yield prisma_1.default.contact.create({
            data: {
                organizationId: testOrgId,
                type: "CUSTOMER",
                firstName: "B2B Customer",
                lastName: "Corp",
                email: "b2b@customer.com",
                gstNumber: "27AAPFT5055K1Z0",
                stateCode: "27",
            },
        });
        // Create B2C customer (without GST number)
        testCustomerB2C = yield prisma_1.default.contact.create({
            data: {
                organizationId: testOrgId,
                type: "CUSTOMER",
                firstName: "B2C Customer",
                lastName: "Individual",
                email: "b2c@customer.com",
                gstNumber: null,
                stateCode: "27",
            },
        });
    }));
    (0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Cleanup
        yield prisma_1.default.invoice.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.contact.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.organization.delete({ where: { id: testOrgId } });
    }));
    (0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clear invoices before each test
        yield prisma_1.default.invoice.deleteMany({ where: { organizationId: testOrgId } });
    }));
    (0, globals_1.describe)("generateGSTR1Report", () => {
        (0, globals_1.it)("should generate report with B2B invoices", () => __awaiter(void 0, void 0, void 0, function* () {
            const invoiceDate = new Date(2025, 1, 15); // Feb 15, 2025
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-001",
                    issuedAt: invoiceDate,
                    status: "ISSUED",
                    subtotal: 1000,
                    cgstAmount: 90,
                    sgstAmount: 90,
                    igstAmount: 0,
                    totalAmount: 1180,
                    placeOfSupply: "27",
                },
            });
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 2, 2025);
            (0, globals_1.expect)(report.period.month).toBe(2);
            (0, globals_1.expect)(report.period.year).toBe(2025);
            (0, globals_1.expect)(report.b2b).toHaveLength(1);
            (0, globals_1.expect)(report.b2c).toHaveLength(0);
            (0, globals_1.expect)(report.summary.totalB2BInvoices).toBe(1);
        }));
        (0, globals_1.it)("should generate report with B2C invoices", () => __awaiter(void 0, void 0, void 0, function* () {
            const invoiceDate = new Date(2025, 2, 10); // Mar 10, 2025
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2C.id,
                    invoiceNumber: "INV-002",
                    issuedAt: invoiceDate,
                    status: "ISSUED",
                    subtotal: 500,
                    cgstAmount: 45,
                    sgstAmount: 45,
                    igstAmount: 0,
                    totalAmount: 590,
                    placeOfSupply: "27",
                },
            });
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 3, 2025);
            (0, globals_1.expect)(report.b2b).toHaveLength(0);
            (0, globals_1.expect)(report.b2c).toHaveLength(1);
            (0, globals_1.expect)(report.summary.totalB2CInvoices).toBe(1);
        }));
        (0, globals_1.it)("should generate report with mixed B2B and B2C invoices", () => __awaiter(void 0, void 0, void 0, function* () {
            const b2bDate = new Date(2025, 3, 5); // Apr 5, 2025
            const b2cDate = new Date(2025, 3, 15); // Apr 15, 2025
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-B2B-001",
                    issuedAt: b2bDate,
                    status: "ISSUED",
                    subtotal: 2000,
                    cgstAmount: 180,
                    sgstAmount: 180,
                    igstAmount: 0,
                    totalAmount: 2360,
                    placeOfSupply: "27",
                },
            });
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2C.id,
                    invoiceNumber: "INV-B2C-001",
                    issuedAt: b2cDate,
                    status: "ISSUED",
                    subtotal: 1000,
                    cgstAmount: 90,
                    sgstAmount: 90,
                    igstAmount: 0,
                    totalAmount: 1180,
                    placeOfSupply: "27",
                },
            });
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 4, 2025);
            (0, globals_1.expect)(report.b2b).toHaveLength(1);
            (0, globals_1.expect)(report.b2c).toHaveLength(1);
            (0, globals_1.expect)(report.summary.totalB2BInvoices).toBe(1);
            (0, globals_1.expect)(report.summary.totalB2CInvoices).toBe(1);
        }));
        (0, globals_1.it)("should calculate correct totals for mixed invoices", () => __awaiter(void 0, void 0, void 0, function* () {
            // B2B: 1000 taxable + 180 tax = 1180
            // B2C: 500 taxable + 90 tax = 590
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-001",
                    issuedAt: new Date(2025, 4, 1),
                    status: "ISSUED",
                    subtotal: 1000,
                    cgstAmount: 90,
                    sgstAmount: 90,
                    igstAmount: 0,
                    totalAmount: 1180,
                    placeOfSupply: "27",
                },
            });
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2C.id,
                    invoiceNumber: "INV-002",
                    issuedAt: new Date(2025, 4, 15),
                    status: "ISSUED",
                    subtotal: 500,
                    cgstAmount: 45,
                    sgstAmount: 45,
                    igstAmount: 0,
                    totalAmount: 590,
                    placeOfSupply: "27",
                },
            });
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 5, 2025);
            (0, globals_1.expect)(report.summary.totalTaxableValue).toBe(1500);
            (0, globals_1.expect)(report.summary.totalCGST).toBe(135);
            (0, globals_1.expect)(report.summary.totalSGST).toBe(135);
            (0, globals_1.expect)(report.summary.totalIGST).toBe(0);
            (0, globals_1.expect)(report.summary.totalTax).toBe(270);
            (0, globals_1.expect)(report.summary.totalInvoiceValue).toBe(1770);
        }));
        (0, globals_1.it)("should handle IGST for inter-state supplies", () => __awaiter(void 0, void 0, void 0, function* () {
            // Inter-state supply with IGST
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-IGST-001",
                    issuedAt: new Date(2025, 5, 1),
                    status: "ISSUED",
                    subtotal: 1000,
                    cgstAmount: 0,
                    sgstAmount: 0,
                    igstAmount: 180,
                    totalAmount: 1180,
                    placeOfSupply: "06", // Different state
                },
            });
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 6, 2025);
            (0, globals_1.expect)(report.b2b[0].igstAmount).toBe(180);
            (0, globals_1.expect)(report.b2b[0].cgstAmount).toBe(0);
            (0, globals_1.expect)(report.b2b[0].sgstAmount).toBe(0);
            (0, globals_1.expect)(report.summary.totalIGST).toBe(180);
        }));
        (0, globals_1.it)("should exclude DRAFT and CANCELLED invoices", () => __awaiter(void 0, void 0, void 0, function* () {
            const date = new Date(2025, 6, 1);
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-ISSUED",
                    issuedAt: date,
                    status: "ISSUED",
                    subtotal: 1000,
                    cgstAmount: 90,
                    sgstAmount: 90,
                    igstAmount: 0,
                    totalAmount: 1180,
                    placeOfSupply: "27",
                },
            });
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-DRAFT",
                    issuedAt: date,
                    status: "DRAFT",
                    subtotal: 1000,
                    cgstAmount: 90,
                    sgstAmount: 90,
                    igstAmount: 0,
                    totalAmount: 1180,
                    placeOfSupply: "27",
                },
            });
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 7, 2025);
            (0, globals_1.expect)(report.b2b).toHaveLength(1);
            (0, globals_1.expect)(report.b2b[0].invoiceNumber).toBe("INV-ISSUED");
        }));
        (0, globals_1.it)("should respect month boundaries", () => __awaiter(void 0, void 0, void 0, function* () {
            // Add invoice on last day of February
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-FEB-LAST",
                    issuedAt: new Date(2025, 1, 28), // Feb 28, 2025
                    status: "ISSUED",
                    subtotal: 1000,
                    cgstAmount: 90,
                    sgstAmount: 90,
                    igstAmount: 0,
                    totalAmount: 1180,
                    placeOfSupply: "27",
                },
            });
            // Add invoice on first day of March
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-MAR-FIRST",
                    issuedAt: new Date(2025, 2, 1), // Mar 1, 2025
                    status: "ISSUED",
                    subtotal: 1000,
                    cgstAmount: 90,
                    sgstAmount: 90,
                    igstAmount: 0,
                    totalAmount: 1180,
                    placeOfSupply: "27",
                },
            });
            const febReport = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 2, 2025);
            const marReport = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 3, 2025);
            (0, globals_1.expect)(febReport.b2b).toHaveLength(1);
            (0, globals_1.expect)(febReport.b2b[0].invoiceNumber).toBe("INV-FEB-LAST");
            (0, globals_1.expect)(marReport.b2b).toHaveLength(1);
            (0, globals_1.expect)(marReport.b2b[0].invoiceNumber).toBe("INV-MAR-FIRST");
        }));
        (0, globals_1.it)("should return empty report for month with no invoices", () => __awaiter(void 0, void 0, void 0, function* () {
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 12, 2025);
            (0, globals_1.expect)(report.b2b).toHaveLength(0);
            (0, globals_1.expect)(report.b2c).toHaveLength(0);
            (0, globals_1.expect)(report.summary.totalInvoiceValue).toBe(0);
        }));
        (0, globals_1.it)("should throw error for invalid month", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, globals_1.expect)((0, gstr_service_1.generateGSTR1Report)(testOrgId, 13, 2025)).rejects.toThrow("Month must be between 1 and 12");
        }));
        (0, globals_1.it)("should throw error for invalid year", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, globals_1.expect)((0, gstr_service_1.generateGSTR1Report)(testOrgId, 1, 1999)).rejects.toThrow("Invalid year");
        }));
    });
    (0, globals_1.describe)("generateGSTR1CSV", () => {
        (0, globals_1.it)("should generate valid CSV with proper formatting", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-CSV-001",
                    issuedAt: new Date(2025, 7, 15),
                    status: "ISSUED",
                    subtotal: 1000,
                    cgstAmount: 90,
                    sgstAmount: 90,
                    igstAmount: 0,
                    totalAmount: 1180,
                    placeOfSupply: "27",
                },
            });
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 8, 2025);
            const csv = (0, gstr_service_1.generateGSTR1CSV)(report);
            (0, globals_1.expect)(csv).toContain("GSTR-1 RETURN");
            (0, globals_1.expect)(csv).toContain("B2B INVOICES");
            (0, globals_1.expect)(csv).toContain("27AAPFT5055K1Z0");
            (0, globals_1.expect)(csv).toContain("INV-CSV-001");
        }));
        (0, globals_1.it)("should handle multiple invoices in CSV", () => __awaiter(void 0, void 0, void 0, function* () {
            for (let i = 0; i < 3; i++) {
                yield prisma_1.default.invoice.create({
                    data: {
                        organizationId: testOrgId,
                        customerId: testCustomerB2B.id,
                        invoiceNumber: `INV-MULTI-${i + 1}`,
                        issuedAt: new Date(2025, 8, 5 + i),
                        status: "ISSUED",
                        subtotal: 1000,
                        cgstAmount: 90,
                        sgstAmount: 90,
                        igstAmount: 0,
                        totalAmount: 1180,
                        placeOfSupply: "27",
                    },
                });
            }
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 9, 2025);
            const csv = (0, gstr_service_1.generateGSTR1CSV)(report);
            (0, globals_1.expect)(csv).toContain("INV-MULTI-1");
            (0, globals_1.expect)(csv).toContain("INV-MULTI-2");
            (0, globals_1.expect)(csv).toContain("INV-MULTI-3");
        }));
        (0, globals_1.it)("should include summary section in CSV", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-SUMMARY",
                    issuedAt: new Date(2025, 9, 1),
                    status: "ISSUED",
                    subtotal: 1000,
                    cgstAmount: 90,
                    sgstAmount: 90,
                    igstAmount: 0,
                    totalAmount: 1180,
                    placeOfSupply: "27",
                },
            });
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 10, 2025);
            const csv = (0, gstr_service_1.generateGSTR1CSV)(report);
            (0, globals_1.expect)(csv).toContain("GSTR-1 SUMMARY");
            (0, globals_1.expect)(csv).toContain("Total Taxable Value");
            (0, globals_1.expect)(csv).toContain("Total CGST");
            (0, globals_1.expect)(csv).toContain("Total SGST");
        }));
        (0, globals_1.it)("should properly escape values in CSV", () => __awaiter(void 0, void 0, void 0, function* () {
            // Create a customer with comma in name for escaping test
            const specialCustomer = yield prisma_1.default.contact.create({
                data: {
                    organizationId: testOrgId,
                    type: "CUSTOMER",
                    firstName: "Company",
                    lastName: "Inc.",
                    email: "special@customer.com",
                    gstNumber: "09AABCT5678F0Z9",
                    stateCode: "09",
                },
            });
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: specialCustomer.id,
                    invoiceNumber: "INV-SPECIAL",
                    issuedAt: new Date(2025, 10, 1),
                    status: "ISSUED",
                    subtotal: 1000,
                    cgstAmount: 90,
                    sgstAmount: 90,
                    igstAmount: 0,
                    totalAmount: 1180,
                    placeOfSupply: "09",
                },
            });
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 11, 2025);
            const csv = (0, gstr_service_1.generateGSTR1CSV)(report);
            (0, globals_1.expect)(csv).toContain('"09AABCT5678F0Z9"');
        }));
    });
    (0, globals_1.describe)("generateGSTR1JSON", () => {
        (0, globals_1.it)("should generate JSON with correct structure", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-JSON-001",
                    issuedAt: new Date(2026, 0, 15),
                    status: "ISSUED",
                    subtotal: 1000,
                    cgstAmount: 90,
                    sgstAmount: 90,
                    igstAmount: 0,
                    totalAmount: 1180,
                    placeOfSupply: "27",
                },
            });
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 1, 2026);
            const json = (0, gstr_service_1.generateGSTR1JSON)(report);
            (0, globals_1.expect)(json.period.month).toBe(1);
            (0, globals_1.expect)(json.period.year).toBe(2026);
            (0, globals_1.expect)(json.b2b).toHaveLength(1);
            (0, globals_1.expect)(json.summary).toBeDefined();
        }));
        (0, globals_1.it)("should correctly map invoice data to JSON", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-JSON-MAP",
                    issuedAt: new Date(2026, 1, 1),
                    status: "ISSUED",
                    subtotal: 5000,
                    cgstAmount: 450,
                    sgstAmount: 450,
                    igstAmount: 0,
                    totalAmount: 5900,
                    placeOfSupply: "27",
                },
            });
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 2, 2026);
            const json = (0, gstr_service_1.generateGSTR1JSON)(report);
            (0, globals_1.expect)(json.b2b[0].gstin).toBe("27AAPFT5055K1Z0");
            (0, globals_1.expect)(json.b2b[0].taxableValue).toBe(5000);
            (0, globals_1.expect)(json.b2b[0].cgst).toBe(450);
            (0, globals_1.expect)(json.b2b[0].sgst).toBe(450);
        }));
    });
    (0, globals_1.describe)("Tax calculations and rounding", () => {
        (0, globals_1.it)("should handle precise decimal calculations", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-DECIMAL",
                    issuedAt: new Date(2026, 2, 1),
                    status: "ISSUED",
                    subtotal: 12345.67,
                    cgstAmount: 1111.11,
                    sgstAmount: 1111.11,
                    igstAmount: 0,
                    totalAmount: 14567.89,
                    placeOfSupply: "27",
                },
            });
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 3, 2026);
            (0, globals_1.expect)(report.summary.totalTaxableValue).toBe(12345.67);
            (0, globals_1.expect)(report.summary.totalCGST).toBe(1111.11);
        }));
        (0, globals_1.it)("should round summary totals to 2 decimal places", () => __awaiter(void 0, void 0, void 0, function* () {
            // Create invoices that sum to a value with more than 2 decimal places
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-ROUND-1",
                    issuedAt: new Date(2026, 3, 1),
                    status: "ISSUED",
                    subtotal: 1000.11,
                    cgstAmount: 90.01,
                    sgstAmount: 90.01,
                    igstAmount: 0,
                    totalAmount: 1180.13,
                    placeOfSupply: "27",
                },
            });
            const report = yield (0, gstr_service_1.generateGSTR1Report)(testOrgId, 4, 2026);
            // Verify all values are properly rounded
            const json = JSON.stringify(report.summary);
            const regex = /\d+\.\d{3,}/; // Match numbers with 3+ decimal places
            (0, globals_1.expect)(regex.test(json)).toBe(false);
        }));
    });
});
