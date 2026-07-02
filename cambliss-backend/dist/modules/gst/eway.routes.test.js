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
const eway_routes_1 = __importDefault(require("./eway.routes"));
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
app.use("/gst", eway_routes_1.default);
(0, globals_1.describe)("E-Way Bill API Routes", () => {
    let testOrgId;
    let testCustomer;
    let testProduct;
    let testInvoiceValid;
    let testInvoiceBelowThreshold;
    (0, globals_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Create test organization
        const org = yield prisma_1.default.organization.create({
            data: {
                name: "E-Way API Test Org",
            },
        });
        testOrgId = org.id;
        activeOrgId = testOrgId;
        // Create GST Config
        yield prisma_1.default.gSTConfig.create({
            data: {
                organizationId: testOrgId,
                gstNumber: "27AABCT1234F0Z5",
                legalName: "Test Company Pvt Ltd",
                tradeName: "Test Company",
                stateCode: "27",
            },
        });
        // Create customer with GSTIN
        testCustomer = yield prisma_1.default.contact.create({
            data: {
                organizationId: testOrgId,
                type: "CUSTOMER",
                firstName: "API",
                lastName: "Customer",
                companyName: "API Customer Corp",
                email: "api@customer.com",
                gstNumber: "29AAPFT5055K1Z0",
                stateCode: "29",
                state: "Karnataka",
                billingAddress: "456 API Street",
                shippingAddress: "456 API Street",
            },
        });
        // Create test product with HSN
        testProduct = yield prisma_1.default.product.create({
            data: {
                organizationId: testOrgId,
                name: "API Test Product",
                sku: "API-TEST-001",
                hsnCode: "87654321",
                unitPrice: 10000,
            },
        });
        // Create valid invoice
        testInvoiceValid = yield prisma_1.default.invoice.create({
            data: {
                organizationId: testOrgId,
                invoiceNumber: "INV-API-EWAY-001",
                customerId: testCustomer.id,
                status: "ISSUED",
                subtotal: 100000,
                cgstAmount: 9000,
                sgstAmount: 9000,
                igstAmount: 0,
                totalAmount: 118000,
                placeOfSupply: "29",
                issuedAt: new Date(),
            },
        });
        yield prisma_1.default.invoiceItem.create({
            data: {
                invoiceId: testInvoiceValid.id,
                productId: testProduct.id,
                quantity: 10,
                price: 10000,
                gstRate: 18,
                cgstRate: 9,
                sgstRate: 9,
                cgstAmount: 9000,
                sgstAmount: 9000,
            },
        });
        // Create invoice below threshold
        testInvoiceBelowThreshold = yield prisma_1.default.invoice.create({
            data: {
                organizationId: testOrgId,
                invoiceNumber: "INV-API-EWAY-002",
                customerId: testCustomer.id,
                status: "ISSUED",
                subtotal: 30000,
                cgstAmount: 2700,
                sgstAmount: 2700,
                igstAmount: 0,
                totalAmount: 35400,
                placeOfSupply: "29",
                issuedAt: new Date(),
            },
        });
        yield prisma_1.default.invoiceItem.create({
            data: {
                invoiceId: testInvoiceBelowThreshold.id,
                productId: testProduct.id,
                quantity: 3,
                price: 10000,
                gstRate: 18,
                cgstRate: 9,
                sgstRate: 9,
                cgstAmount: 2700,
                sgstAmount: 2700,
            },
        });
    }));
    (0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Cleanup
        yield prisma_1.default.eWayBill.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.invoiceItem.deleteMany({
            where: { invoice: { organizationId: testOrgId } },
        });
        yield prisma_1.default.invoice.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.product.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.contact.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.gSTConfig.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.organization.delete({ where: { id: testOrgId } });
    }));
    (0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clear E-Way Bills before each test
        yield prisma_1.default.eWayBill.deleteMany({ where: { organizationId: testOrgId } });
    }));
    (0, globals_1.describe)("POST /gst/eway-bill/validate", () => {
        (0, globals_1.it)("should validate eligible invoice", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/gst/eway-bill/validate")
                .send({ invoiceId: testInvoiceValid.id });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.valid).toBe(true);
            (0, globals_1.expect)(response.body.errors).toHaveLength(0);
        }));
        (0, globals_1.it)("should return validation errors for invoice below threshold", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/gst/eway-bill/validate")
                .send({ invoiceId: testInvoiceBelowThreshold.id });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.valid).toBe(false);
            (0, globals_1.expect)(response.body.errors.length).toBeGreaterThan(0);
        }));
        (0, globals_1.it)("should return 400 when invoiceId is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post("/gst/eway-bill/validate").send({});
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.error).toBe("invoiceId is required");
        }));
    });
    (0, globals_1.describe)("POST /gst/eway-bill/generate", () => {
        (0, globals_1.it)("should generate E-Way Bill JSON successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/gst/eway-bill/generate")
                .send({
                invoiceId: testInvoiceValid.id,
                transportDetails: {
                    transporterName: "Test Transport",
                    transporterGSTIN: "27AABCT9999A1Z5",
                    vehicleNumber: "KA01AB1234",
                    transportMode: "ROAD",
                    distance: 350,
                },
            });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data).toBeDefined();
            (0, globals_1.expect)(response.body.data.docNo).toBe("INV-API-EWAY-001");
            (0, globals_1.expect)(response.body.data.supplyType).toBe("Outward");
            (0, globals_1.expect)(response.body.data.vehicleNo).toBe("KA01AB1234");
        }));
        (0, globals_1.it)("should generate E-Way Bill with minimal transport details", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/gst/eway-bill/generate")
                .send({
                invoiceId: testInvoiceValid.id,
                transportDetails: {
                    transportMode: "ROAD",
                },
            });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data.transMode).toBe("1");
        }));
        (0, globals_1.it)("should fail generation for invoice below threshold", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/gst/eway-bill/generate")
                .send({
                invoiceId: testInvoiceBelowThreshold.id,
                transportDetails: {
                    transportMode: "ROAD",
                },
            });
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.error).toBe("E-Way Bill generation failed");
            (0, globals_1.expect)(response.body.errors).toBeDefined();
        }));
        (0, globals_1.it)("should return 400 when invoiceId is missing", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post("/gst/eway-bill/generate").send({
                transportDetails: { transportMode: "ROAD" },
            });
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.error).toBe("invoiceId is required");
        }));
        (0, globals_1.it)("should default to ROAD transport mode if not specified", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/gst/eway-bill/generate")
                .send({
                invoiceId: testInvoiceValid.id,
                transportDetails: {},
            });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.data.transMode).toBe("1"); // ROAD = 1
        }));
    });
    (0, globals_1.describe)("GET /gst/eway-bill/download/:invoiceId", () => {
        (0, globals_1.it)("should download E-Way Bill JSON file", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get(`/gst/eway-bill/download/${testInvoiceValid.id}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.headers["content-type"]).toContain("application/json");
            (0, globals_1.expect)(response.headers["content-disposition"]).toContain("attachment");
            (0, globals_1.expect)(response.headers["content-disposition"]).toContain("EWAY_INV-API-EWAY-001");
            (0, globals_1.expect)(response.body.docNo).toBe("INV-API-EWAY-001");
        }));
        (0, globals_1.it)("should download with transport details in query params", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get(`/gst/eway-bill/download/${testInvoiceValid.id}`)
                .query({
                transporterName: "Query Transport",
                vehicleNumber: "MH12CD5678",
                transportMode: "RAIL",
                distance: 500,
            });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.vehicleNo).toBe("MH12CD5678");
            (0, globals_1.expect)(response.body.transMode).toBe("2"); // RAIL = 2
        }));
        (0, globals_1.it)("should fail download for invoice below threshold", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get(`/gst/eway-bill/download/${testInvoiceBelowThreshold.id}`);
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.error).toBe("E-Way Bill generation failed");
        }));
    });
    (0, globals_1.describe)("GET /gst/eway-bill/history/:invoiceId", () => {
        (0, globals_1.it)("should return empty history for invoice without E-Way Bills", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get(`/gst/eway-bill/history/${testInvoiceValid.id}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data).toHaveLength(0);
        }));
        (0, globals_1.it)("should return E-Way Bill history", () => __awaiter(void 0, void 0, void 0, function* () {
            // Generate E-Way Bills
            yield (0, supertest_1.default)(app)
                .post("/gst/eway-bill/generate")
                .send({
                invoiceId: testInvoiceValid.id,
                transportDetails: { transportMode: "ROAD" },
            });
            yield (0, supertest_1.default)(app)
                .post("/gst/eway-bill/generate")
                .send({
                invoiceId: testInvoiceValid.id,
                transportDetails: { transportMode: "RAIL" },
            });
            const response = yield (0, supertest_1.default)(app).get(`/gst/eway-bill/history/${testInvoiceValid.id}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data.length).toBeGreaterThanOrEqual(2);
        }));
    });
    (0, globals_1.describe)("POST /gst/eway-bill/cancel/:ewayBillId", () => {
        (0, globals_1.it)("should cancel E-Way Bill successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            // Generate E-Way Bill
            yield (0, supertest_1.default)(app)
                .post("/gst/eway-bill/generate")
                .send({
                invoiceId: testInvoiceValid.id,
                transportDetails: { transportMode: "ROAD" },
            });
            // Get the E-Way Bill ID
            const historyResponse = yield (0, supertest_1.default)(app).get(`/gst/eway-bill/history/${testInvoiceValid.id}`);
            const ewayBillId = historyResponse.body.data[0].id;
            // Cancel it
            const response = yield (0, supertest_1.default)(app).post(`/gst/eway-bill/cancel/${ewayBillId}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data.status).toBe("CANCELLED");
        }));
        (0, globals_1.it)("should return 400 for non-existent E-Way Bill", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post("/gst/eway-bill/cancel/non-existent-id");
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.error).toBeDefined();
        }));
        (0, globals_1.it)("should fail to cancel already cancelled E-Way Bill", () => __awaiter(void 0, void 0, void 0, function* () {
            // Generate and cancel E-Way Bill
            yield (0, supertest_1.default)(app)
                .post("/gst/eway-bill/generate")
                .send({
                invoiceId: testInvoiceValid.id,
                transportDetails: { transportMode: "ROAD" },
            });
            const historyResponse = yield (0, supertest_1.default)(app).get(`/gst/eway-bill/history/${testInvoiceValid.id}`);
            const ewayBillId = historyResponse.body.data[0].id;
            yield (0, supertest_1.default)(app).post(`/gst/eway-bill/cancel/${ewayBillId}`);
            // Try to cancel again
            const response = yield (0, supertest_1.default)(app).post(`/gst/eway-bill/cancel/${ewayBillId}`);
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body.error).toContain("already cancelled");
        }));
    });
    (0, globals_1.describe)("Edge cases and error handling", () => {
        (0, globals_1.it)("should handle multiple E-Way Bill generations for same invoice", () => __awaiter(void 0, void 0, void 0, function* () {
            const response1 = yield (0, supertest_1.default)(app)
                .post("/gst/eway-bill/generate")
                .send({
                invoiceId: testInvoiceValid.id,
                transportDetails: { transportMode: "ROAD", vehicleNumber: "KA01AB1234" },
            });
            const response2 = yield (0, supertest_1.default)(app)
                .post("/gst/eway-bill/generate")
                .send({
                invoiceId: testInvoiceValid.id,
                transportDetails: { transportMode: "RAIL", vehicleNumber: "UPDATED" },
            });
            (0, globals_1.expect)(response1.status).toBe(200);
            (0, globals_1.expect)(response2.status).toBe(200);
            const historyResponse = yield (0, supertest_1.default)(app).get(`/gst/eway-bill/history/${testInvoiceValid.id}`);
            (0, globals_1.expect)(historyResponse.body.data.length).toBeGreaterThanOrEqual(2);
        }));
        (0, globals_1.it)("should preserve item details in JSON output", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/gst/eway-bill/generate")
                .send({
                invoiceId: testInvoiceValid.id,
                transportDetails: { transportMode: "ROAD" },
            });
            (0, globals_1.expect)(response.body.data.itemList).toHaveLength(1);
            (0, globals_1.expect)(response.body.data.itemList[0]).toHaveProperty("itemNo");
            (0, globals_1.expect)(response.body.data.itemList[0]).toHaveProperty("productName");
            (0, globals_1.expect)(response.body.data.itemList[0]).toHaveProperty("hsnCode");
            (0, globals_1.expect)(response.body.data.itemList[0]).toHaveProperty("quantity");
            (0, globals_1.expect)(response.body.data.itemList[0]).toHaveProperty("taxableAmount");
        }));
    });
});
