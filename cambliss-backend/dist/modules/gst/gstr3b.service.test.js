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
const gstr3b_service_1 = require("./gstr3b.service");
(0, globals_1.describe)("GSTR-3B Summary Generation", () => {
    let testOrgId;
    (0, globals_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Create test organization
        const org = yield prisma_1.default.organization.create({
            data: {
                name: "GSTR3B Test Org",
            },
        });
        testOrgId = org.id;
        yield prisma_1.default.contact.createMany({
            data: [
                { id: "cust-0", organizationId: testOrgId, type: "CUSTOMER", firstName: "Cust", lastName: "Zero", email: "cust0@test.com" },
                { id: "cust-1", organizationId: testOrgId, type: "CUSTOMER", firstName: "Cust", lastName: "One", email: "cust1@test.com" },
                { id: "cust-2", organizationId: testOrgId, type: "CUSTOMER", firstName: "Cust", lastName: "Two", email: "cust2@test.com" },
            ],
            skipDuplicates: true,
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
    (0, globals_1.describe)("generateGSTR3BSummary", () => {
        (0, globals_1.it)("should calculate output GST from sales invoices", () => __awaiter(void 0, void 0, void 0, function* () {
            // Create sales invoices
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: "cust-1",
                    invoiceNumber: "INV-001",
                    issuedAt: new Date(2026, 0, 15), // Jan 15, 2026
                    status: "ISSUED",
                    subtotal: 10000,
                    cgstAmount: 900,
                    sgstAmount: 900,
                    igstAmount: 0,
                    totalAmount: 11800,
                    placeOfSupply: "27",
                },
            });
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: "cust-2",
                    invoiceNumber: "INV-002",
                    issuedAt: new Date(2026, 0, 20), // Jan 20, 2026
                    status: "ISSUED",
                    subtotal: 5000,
                    cgstAmount: 0,
                    sgstAmount: 0,
                    igstAmount: 900,
                    totalAmount: 5900,
                    placeOfSupply: "06",
                },
            });
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 1, 2026);
            (0, globals_1.expect)(summary.outputGST.cgst).toBe(900);
            (0, globals_1.expect)(summary.outputGST.sgst).toBe(900);
            (0, globals_1.expect)(summary.outputGST.igst).toBe(900);
            (0, globals_1.expect)(summary.outputGST.total).toBe(2700);
        }));
        (0, globals_1.it)("should calculate net payable when no input GST", () => __awaiter(void 0, void 0, void 0, function* () {
            // Only sales, no purchases
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: "cust-1",
                    invoiceNumber: "INV-001",
                    issuedAt: new Date(2026, 1, 15),
                    status: "ISSUED",
                    subtotal: 10000,
                    cgstAmount: 900,
                    sgstAmount: 900,
                    igstAmount: 0,
                    totalAmount: 11800,
                    placeOfSupply: "27",
                },
            });
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 2, 2026);
            // Net payable should equal output GST (no input GST to subtract)
            (0, globals_1.expect)(summary.netPayable.cgst).toBe(900);
            (0, globals_1.expect)(summary.netPayable.sgst).toBe(900);
            (0, globals_1.expect)(summary.netPayable.igst).toBe(0);
            (0, globals_1.expect)(summary.netPayable.total).toBe(1800);
        }));
        (0, globals_1.it)("should handle month with no invoices", () => __awaiter(void 0, void 0, void 0, function* () {
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 12, 2026);
            (0, globals_1.expect)(summary.outputGST.total).toBe(0);
            (0, globals_1.expect)(summary.inputGST.total).toBe(0);
            (0, globals_1.expect)(summary.netPayable.total).toBe(0);
            (0, globals_1.expect)(summary.metadata.totalSalesInvoices).toBe(0);
        }));
        (0, globals_1.it)("should exclude DRAFT and CANCELLED invoices", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: "cust-1",
                    invoiceNumber: "INV-ISSUED",
                    issuedAt: new Date(2026, 2, 15),
                    status: "ISSUED",
                    subtotal: 10000,
                    cgstAmount: 900,
                    sgstAmount: 900,
                    igstAmount: 0,
                    totalAmount: 11800,
                    placeOfSupply: "27",
                },
            });
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: "cust-2",
                    invoiceNumber: "INV-DRAFT",
                    issuedAt: new Date(2026, 2, 16),
                    status: "DRAFT",
                    subtotal: 10000,
                    cgstAmount: 900,
                    sgstAmount: 900,
                    igstAmount: 0,
                    totalAmount: 11800,
                    placeOfSupply: "27",
                },
            });
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 3, 2026);
            // Should only count ISSUED invoice
            (0, globals_1.expect)(summary.metadata.totalSalesInvoices).toBe(1);
            (0, globals_1.expect)(summary.outputGST.cgst).toBe(900);
        }));
        (0, globals_1.it)("should calculate correct totals for multiple invoices", () => __awaiter(void 0, void 0, void 0, function* () {
            // Create 3 invoices
            const invoices = [
                { subtotal: 10000, cgst: 900, sgst: 900, igst: 0 },
                { subtotal: 15000, cgst: 1350, sgst: 1350, igst: 0 },
                { subtotal: 8000, cgst: 0, sgst: 0, igst: 1440 },
            ];
            for (let i = 0; i < invoices.length; i++) {
                const inv = invoices[i];
                yield prisma_1.default.invoice.create({
                    data: {
                        organizationId: testOrgId,
                        customerId: `cust-${i}`,
                        invoiceNumber: `INV-${i + 1}`,
                        issuedAt: new Date(2026, 3, 5 + i),
                        status: "ISSUED",
                        subtotal: inv.subtotal,
                        cgstAmount: inv.cgst,
                        sgstAmount: inv.sgst,
                        igstAmount: inv.igst,
                        totalAmount: inv.subtotal + inv.cgst + inv.sgst + inv.igst,
                        placeOfSupply: inv.igst > 0 ? "06" : "27",
                    },
                });
            }
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 4, 2026);
            (0, globals_1.expect)(summary.outputGST.cgst).toBe(2250); // 900 + 1350
            (0, globals_1.expect)(summary.outputGST.sgst).toBe(2250); // 900 + 1350
            (0, globals_1.expect)(summary.outputGST.igst).toBe(1440);
            (0, globals_1.expect)(summary.outputGST.total).toBe(5940);
        }));
        (0, globals_1.it)("should respect month boundaries", () => __awaiter(void 0, void 0, void 0, function* () {
            // Invoice on last day of Jan
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: "cust-1",
                    invoiceNumber: "INV-JAN",
                    issuedAt: new Date(2026, 0, 31), // Jan 31
                    status: "ISSUED",
                    subtotal: 10000,
                    cgstAmount: 900,
                    sgstAmount: 900,
                    igstAmount: 0,
                    totalAmount: 11800,
                    placeOfSupply: "27",
                },
            });
            // Invoice on first day of Feb
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: "cust-2",
                    invoiceNumber: "INV-FEB",
                    issuedAt: new Date(2026, 1, 1), // Feb 1
                    status: "ISSUED",
                    subtotal: 5000,
                    cgstAmount: 450,
                    sgstAmount: 450,
                    igstAmount: 0,
                    totalAmount: 5900,
                    placeOfSupply: "27",
                },
            });
            const janSummary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 1, 2026);
            const febSummary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 2, 2026);
            (0, globals_1.expect)(janSummary.metadata.totalSalesInvoices).toBe(1);
            (0, globals_1.expect)(janSummary.outputGST.cgst).toBe(900);
            (0, globals_1.expect)(febSummary.metadata.totalSalesInvoices).toBe(1);
            (0, globals_1.expect)(febSummary.outputGST.cgst).toBe(450);
        }));
        (0, globals_1.it)("should throw error for invalid month", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, globals_1.expect)((0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 13, 2026)).rejects.toThrow("Month must be between 1 and 12");
        }));
        (0, globals_1.it)("should throw error for invalid year", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, globals_1.expect)((0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 1, 1999)).rejects.toThrow("Invalid year");
        }));
        (0, globals_1.it)("should include correct metadata", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: "cust-1",
                    invoiceNumber: "INV-001",
                    issuedAt: new Date(2026, 4, 15),
                    status: "ISSUED",
                    subtotal: 10000,
                    cgstAmount: 900,
                    sgstAmount: 900,
                    igstAmount: 0,
                    totalAmount: 11800,
                    placeOfSupply: "27",
                },
            });
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 5, 2026);
            (0, globals_1.expect)(summary.metadata.totalSalesInvoices).toBe(1);
            (0, globals_1.expect)(summary.metadata.totalOutputValue).toBe(11800);
            (0, globals_1.expect)(summary.metadata.totalInputValue).toBe(0);
            (0, globals_1.expect)(summary.metadata.totalPurchaseInvoices).toBe(0);
        }));
        (0, globals_1.it)("should have correct period information", () => __awaiter(void 0, void 0, void 0, function* () {
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 6, 2026);
            (0, globals_1.expect)(summary.period.month).toBe(6);
            (0, globals_1.expect)(summary.period.year).toBe(2026);
            (0, globals_1.expect)(summary.period.startDate).toEqual(new Date(2026, 5, 1, 0, 0, 0, 0));
            (0, globals_1.expect)(summary.period.endDate).toEqual(new Date(2026, 6, 1, 0, 0, 0, 0));
        }));
    });
    (0, globals_1.describe)("generateGSTR3BJSON", () => {
        (0, globals_1.it)("should generate valid filing JSON", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: "cust-1",
                    invoiceNumber: "INV-001",
                    issuedAt: new Date(2026, 5, 15),
                    status: "ISSUED",
                    subtotal: 10000,
                    cgstAmount: 900,
                    sgstAmount: 900,
                    igstAmount: 0,
                    totalAmount: 11800,
                    placeOfSupply: "27",
                },
            });
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 6, 2026);
            const json = (0, gstr3b_service_1.generateGSTR3BJSON)(summary);
            (0, globals_1.expect)(json.ret_period).toBe("062026");
            (0, globals_1.expect)(json.sup_details.osup_det.camt).toBe(900);
            (0, globals_1.expect)(json.sup_details.osup_det.samt).toBe(900);
            (0, globals_1.expect)(json.intr_details.intr_det.camt).toBe(900);
            (0, globals_1.expect)(json.intr_details.intr_det.samt).toBe(900);
        }));
        (0, globals_1.it)("should have correct structure for portal upload", () => __awaiter(void 0, void 0, void 0, function* () {
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 7, 2026);
            const json = (0, gstr3b_service_1.generateGSTR3BJSON)(summary);
            (0, globals_1.expect)(json).toHaveProperty("ret_period");
            (0, globals_1.expect)(json).toHaveProperty("sup_details");
            (0, globals_1.expect)(json).toHaveProperty("itc_elg");
            (0, globals_1.expect)(json).toHaveProperty("intr_details");
        }));
    });
    (0, globals_1.describe)("generateGSTR3BReport", () => {
        (0, globals_1.it)("should generate human-readable report", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: "cust-1",
                    invoiceNumber: "INV-001",
                    issuedAt: new Date(2026, 6, 15),
                    status: "ISSUED",
                    subtotal: 10000,
                    cgstAmount: 900,
                    sgstAmount: 900,
                    igstAmount: 0,
                    totalAmount: 11800,
                    placeOfSupply: "27",
                },
            });
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 7, 2026);
            const report = (0, gstr3b_service_1.generateGSTR3BReport)(summary);
            (0, globals_1.expect)(report).toContain("GSTR-3B MONTHLY SUMMARY");
            (0, globals_1.expect)(report).toContain("OUTPUT GST");
            (0, globals_1.expect)(report).toContain("INPUT GST");
            (0, globals_1.expect)(report).toContain("NET GST PAYABLE");
            (0, globals_1.expect)(report).toContain("₹900.00");
        }));
        (0, globals_1.it)("should show ITC carry forward when applicable", () => __awaiter(void 0, void 0, void 0, function* () {
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 8, 2026);
            const report = (0, gstr3b_service_1.generateGSTR3BReport)(summary);
            // Empty month - should not show ITC section
            (0, globals_1.expect)(report).not.toContain("ITC CARRY FORWARD");
        }));
    });
    (0, globals_1.describe)("Tax calculations edge cases", () => {
        (0, globals_1.it)("should handle decimal precision correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: "cust-1",
                    invoiceNumber: "INV-001",
                    issuedAt: new Date(2026, 7, 15),
                    status: "ISSUED",
                    subtotal: 12345.67,
                    cgstAmount: 1111.11,
                    sgstAmount: 1111.11,
                    igstAmount: 0,
                    totalAmount: 14567.89,
                    placeOfSupply: "27",
                },
            });
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 8, 2026);
            (0, globals_1.expect)(summary.outputGST.cgst).toBe(1111.11);
            (0, globals_1.expect)(summary.outputGST.sgst).toBe(1111.11);
        }));
        (0, globals_1.it)("should round summary totals to 2 decimal places", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: "cust-1",
                    invoiceNumber: "INV-001",
                    issuedAt: new Date(2026, 8, 15),
                    status: "ISSUED",
                    subtotal: 10000.33,
                    cgstAmount: 900.03,
                    sgstAmount: 900.03,
                    igstAmount: 0,
                    totalAmount: 11800.39,
                    placeOfSupply: "27",
                },
            });
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 9, 2026);
            // Check monetary values are rounded to <= 2 decimal places.
            const monetaryValues = [
                summary.outputGST.cgst,
                summary.outputGST.sgst,
                summary.outputGST.igst,
                summary.outputGST.total,
                summary.inputGST.cgst,
                summary.inputGST.sgst,
                summary.inputGST.igst,
                summary.inputGST.total,
                summary.netPayable.cgst,
                summary.netPayable.sgst,
                summary.netPayable.igst,
                summary.netPayable.total,
                summary.itcCarryForward.cgst,
                summary.itcCarryForward.sgst,
                summary.itcCarryForward.igst,
                summary.itcCarryForward.total,
                summary.metadata.totalOutputValue,
                summary.metadata.totalInputValue,
            ];
            for (const value of monetaryValues) {
                const decimalPart = (_a = String(value).split(".")[1]) !== null && _a !== void 0 ? _a : "";
                (0, globals_1.expect)(decimalPart.length).toBeLessThanOrEqual(2);
            }
        }));
        (0, globals_1.it)("should handle zero tax amounts", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: "cust-1",
                    invoiceNumber: "INV-001",
                    issuedAt: new Date(2026, 9, 15),
                    status: "ISSUED",
                    subtotal: 10000,
                    cgstAmount: 0,
                    sgstAmount: 0,
                    igstAmount: 0,
                    totalAmount: 10000,
                    placeOfSupply: "27",
                },
            });
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 10, 2026);
            (0, globals_1.expect)(summary.outputGST.total).toBe(0);
            (0, globals_1.expect)(summary.netPayable.total).toBe(0);
        }));
    });
    (0, globals_1.describe)("Net payable calculations", () => {
        (0, globals_1.it)("should calculate positive net payable correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            // Sales with tax
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: "cust-1",
                    invoiceNumber: "INV-001",
                    issuedAt: new Date(2026, 10, 15),
                    status: "ISSUED",
                    subtotal: 100000,
                    cgstAmount: 9000,
                    sgstAmount: 9000,
                    igstAmount: 0,
                    totalAmount: 118000,
                    placeOfSupply: "27",
                },
            });
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 11, 2026);
            // No input GST, so net payable = output GST
            (0, globals_1.expect)(summary.netPayable.cgst).toBe(9000);
            (0, globals_1.expect)(summary.netPayable.sgst).toBe(9000);
            (0, globals_1.expect)(summary.netPayable.total).toBe(18000);
        }));
        (0, globals_1.it)("should not have negative net payable", () => __awaiter(void 0, void 0, void 0, function* () {
            const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(testOrgId, 12, 2025);
            // Net payable should never be negative
            (0, globals_1.expect)(summary.netPayable.cgst).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(summary.netPayable.sgst).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(summary.netPayable.igst).toBeGreaterThanOrEqual(0);
        }));
    });
});
