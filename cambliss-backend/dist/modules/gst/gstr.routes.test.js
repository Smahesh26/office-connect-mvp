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
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const gstr_routes_1 = __importDefault(require("./gstr.routes"));
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
let activeOrgId = "test-org-id";
app.use(express_1.default.json());
app.use((req, res, next) => {
    req.user = {
        id: "test-user-id",
        email: "tester@example.com",
        organizationId: activeOrgId,
        role: client_1.RoleName.ADMIN,
    };
    next();
});
app.use("/gst", gstr_routes_1.default);
(0, globals_1.describe)("GSTR-1 API Routes", () => {
    let testOrgId;
    let testCustomerB2B;
    let testCustomerB2C;
    (0, globals_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Create test organization
        const org = yield prisma_1.default.organization.create({
            data: {
                name: "GSTR API Test Org",
            },
        });
        testOrgId = org.id;
        activeOrgId = testOrgId;
        // Create test customers
        testCustomerB2B = yield prisma_1.default.contact.create({
            data: {
                organizationId: testOrgId,
                type: "CUSTOMER",
                firstName: "B2B",
                lastName: "Customer",
                email: "b2b@test.com",
                gstNumber: "27AAPFT5055K1Z0",
                stateCode: "27",
            },
        });
        testCustomerB2C = yield prisma_1.default.contact.create({
            data: {
                organizationId: testOrgId,
                type: "CUSTOMER",
                firstName: "B2C",
                lastName: "Customer",
                email: "b2c@test.com",
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
    (0, globals_1.describe)("GET /gst/gstr1/report", () => {
        (0, globals_1.it)("should return JSON report when format is not specified", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-API-001",
                    issuedAt: new Date(2025, 0, 15),
                    status: "ISSUED",
                    subtotal: 1000,
                    cgstAmount: 90,
                    sgstAmount: 90,
                    igstAmount: 0,
                    totalAmount: 1180,
                    placeOfSupply: "27",
                },
            });
            const response = yield (0, supertest_1.default)(app)
                .get("/gst/gstr1/report")
                .query({ month: "1", year: "2025" });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty("period");
            (0, globals_1.expect)(response.body).toHaveProperty("b2b");
            (0, globals_1.expect)(response.body.b2b).toHaveLength(1);
            (0, globals_1.expect)(response.body.summary.totalInvoiceValue).toBe(1180);
        }));
        (0, globals_1.it)("should return CSV when format=csv", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-CSV-TEST",
                    issuedAt: new Date(2025, 1, 10),
                    status: "ISSUED",
                    subtotal: 2000,
                    cgstAmount: 180,
                    sgstAmount: 180,
                    igstAmount: 0,
                    totalAmount: 2360,
                    placeOfSupply: "27",
                },
            });
            const response = yield (0, supertest_1.default)(app)
                .get("/gst/gstr1/report")
                .query({ month: "2", year: "2025", format: "csv" });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.headers["content-type"]).toContain("text/csv");
            (0, globals_1.expect)(response.headers["content-disposition"]).toContain("GSTR1_02_2025.csv");
            (0, globals_1.expect)(response.text).toContain("GSTR-1 RETURN");
        }));
        (0, globals_1.it)("should return JSON submission format when format=json-submission", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-JSON-SUB",
                    issuedAt: new Date(2025, 2, 15),
                    status: "ISSUED",
                    subtotal: 1500,
                    cgstAmount: 135,
                    sgstAmount: 135,
                    igstAmount: 0,
                    totalAmount: 1770,
                    placeOfSupply: "27",
                },
            });
            const response = yield (0, supertest_1.default)(app)
                .get("/gst/gstr1/report")
                .query({ month: "3", year: "2025", format: "json-submission" });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.headers["content-type"]).toContain("application/json");
            (0, globals_1.expect)(response.body).toHaveProperty("period");
            (0, globals_1.expect)(response.body).toHaveProperty("b2b");
            (0, globals_1.expect)(response.body).toHaveProperty("summary");
        }));
        (0, globals_1.it)("should return 400 when month is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get("/gst/gstr1/report").query({ year: "2025" });
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body).toHaveProperty("error");
        }));
        (0, globals_1.it)("should return 400 when year is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get("/gst/gstr1/report").query({ month: "1" });
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body).toHaveProperty("error");
        }));
        (0, globals_1.it)("should return 400 for invalid month", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/gst/gstr1/report")
                .query({ month: "13", year: "2025" });
            (0, globals_1.expect)(response.status).toBe(500);
        }));
        (0, globals_1.it)("should return 400 for invalid year", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/gst/gstr1/report")
                .query({ month: "1", year: "1999" });
            (0, globals_1.expect)(response.status).toBe(500);
        }));
    });
    (0, globals_1.describe)("GET /gst/gstr1/export-csv", () => {
        (0, globals_1.it)("should return CSV attachment", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-EXPORT-001",
                    issuedAt: new Date(2025, 3, 20),
                    status: "ISSUED",
                    subtotal: 3000,
                    cgstAmount: 270,
                    sgstAmount: 270,
                    igstAmount: 0,
                    totalAmount: 3540,
                    placeOfSupply: "27",
                },
            });
            const response = yield (0, supertest_1.default)(app)
                .get("/gst/gstr1/export-csv")
                .query({ month: "4", year: "2025" });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.headers["content-type"]).toContain("text/csv");
            (0, globals_1.expect)(response.headers["content-disposition"]).toContain("attachment");
            (0, globals_1.expect)(response.headers["content-disposition"]).toContain("GSTR1_04_2025.csv");
        }));
        (0, globals_1.it)("should include all invoice data in CSV export", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-FULL-DATA",
                    issuedAt: new Date(2025, 4, 15),
                    status: "ISSUED",
                    subtotal: 1000,
                    cgstAmount: 90,
                    sgstAmount: 90,
                    igstAmount: 0,
                    totalAmount: 1180,
                    placeOfSupply: "27",
                },
            });
            const response = yield (0, supertest_1.default)(app)
                .get("/gst/gstr1/export-csv")
                .query({ month: "5", year: "2025" });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.text).toContain("INV-FULL-DATA");
            (0, globals_1.expect)(response.text).toContain("27AAPFT5055K1Z0");
            (0, globals_1.expect)(response.text).toContain("1000");
        }));
        (0, globals_1.it)("should return 400 when month is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/gst/gstr1/export-csv")
                .query({ year: "2025" });
            (0, globals_1.expect)(response.status).toBe(400);
        }));
        (0, globals_1.it)("should return properly formatted filename with month and year", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/gst/gstr1/export-csv")
                .query({ month: "12", year: "2025" });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.headers["content-disposition"]).toContain("GSTR1_12_2025.csv");
        }));
    });
    (0, globals_1.describe)("Data accuracy in exports", () => {
        (0, globals_1.it)("should include B2B and B2C invoices in same export", () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    customerId: testCustomerB2B.id,
                    invoiceNumber: "INV-B2B-EXPORT",
                    issuedAt: new Date(2025, 5, 1),
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
                    invoiceNumber: "INV-B2C-EXPORT",
                    issuedAt: new Date(2025, 5, 15),
                    status: "ISSUED",
                    subtotal: 1000,
                    cgstAmount: 90,
                    sgstAmount: 90,
                    igstAmount: 0,
                    totalAmount: 1180,
                    placeOfSupply: "27",
                },
            });
            const response = yield (0, supertest_1.default)(app)
                .get("/gst/gstr1/report")
                .query({ month: "6", year: "2025" });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.b2b).toHaveLength(1);
            (0, globals_1.expect)(response.body.b2c).toHaveLength(1);
            (0, globals_1.expect)(response.body.summary.totalInvoiceValue).toBe(3540);
        }));
        (0, globals_1.it)("should correctly calculate tax summary from multiple invoices", () => __awaiter(void 0, void 0, void 0, function* () {
            const invoices = [
                {
                    invoiceNumber: "INV-1",
                    subtotal: 1000,
                    cgst: 90,
                    sgst: 90,
                    igst: 0,
                },
                {
                    invoiceNumber: "INV-2",
                    subtotal: 2000,
                    cgst: 180,
                    sgst: 180,
                    igst: 0,
                },
                {
                    invoiceNumber: "INV-3",
                    subtotal: 1500,
                    cgst: 0,
                    sgst: 0,
                    igst: 270,
                },
            ];
            for (let i = 0; i < invoices.length; i++) {
                const inv = invoices[i];
                yield prisma_1.default.invoice.create({
                    data: {
                        organizationId: testOrgId,
                        customerId: testCustomerB2B.id,
                        invoiceNumber: inv.invoiceNumber,
                        issuedAt: new Date(2025, 6, 5 + i),
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
            const response = yield (0, supertest_1.default)(app)
                .get("/gst/gstr1/report")
                .query({ month: "7", year: "2025", format: "json-submission" });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.summary.totalTaxableValue).toBe(4500);
            (0, globals_1.expect)(response.body.summary.totalCGST).toBe(270);
            (0, globals_1.expect)(response.body.summary.totalSGST).toBe(270);
            (0, globals_1.expect)(response.body.summary.totalIGST).toBe(270);
            (0, globals_1.expect)(response.body.summary.totalTax).toBe(810);
        }));
    });
    (0, globals_1.describe)("Empty report scenarios", () => {
        (0, globals_1.it)("should return empty report for month with no invoices", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/gst/gstr1/report")
                .query({ month: "12", year: "2025" });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.b2b).toHaveLength(0);
            (0, globals_1.expect)(response.body.b2c).toHaveLength(0);
            (0, globals_1.expect)(response.body.summary.totalInvoiceValue).toBe(0);
        }));
        (0, globals_1.it)("should generate valid CSV for empty month", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/gst/gstr1/export-csv")
                .query({ month: "11", year: "2025" });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.text).toContain("GSTR-1 RETURN");
            (0, globals_1.expect)(response.text).toContain("GSTR-1 SUMMARY");
        }));
    });
});
