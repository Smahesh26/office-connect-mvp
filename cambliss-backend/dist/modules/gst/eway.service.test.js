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
const eway_service_1 = require("./eway.service");
(0, globals_1.describe)("E-Way Bill Service", () => {
    let testOrgId;
    let testGSTConfigId;
    let testCustomer;
    let testProduct;
    let testInvoiceValid;
    let testInvoiceBelowThreshold;
    let testInvoiceNoGSTIN;
    (0, globals_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Create test organization
        const org = yield prisma_1.default.organization.create({
            data: {
                name: "E-Way Test Org",
            },
        });
        testOrgId = org.id;
        // Create GST Config for organization
        const gstConfig = yield prisma_1.default.gSTConfig.create({
            data: {
                organizationId: testOrgId,
                gstNumber: "27AABCT1234F0Z5",
                legalName: "Test Company Pvt Ltd",
                tradeName: "Test Company",
                stateCode: "27",
                isComposition: false,
            },
        });
        testGSTConfigId = gstConfig.id;
        // Create customer with GSTIN (B2B)
        testCustomer = yield prisma_1.default.contact.create({
            data: {
                organizationId: testOrgId,
                type: "CUSTOMER",
                firstName: "Test",
                lastName: "Customer",
                companyName: "Customer Corp",
                email: "customer@test.com",
                gstNumber: "29AAPFT5055K1Z0",
                stateCode: "29",
                state: "Karnataka",
                billingAddress: "123 Test Street, Bangalore",
                shippingAddress: "123 Test Street, Bangalore",
            },
        });
        // Create customer without GSTIN (B2C)
        const customerNoGSTIN = yield prisma_1.default.contact.create({
            data: {
                organizationId: testOrgId,
                type: "CUSTOMER",
                firstName: "B2C",
                lastName: "Customer",
                email: "b2c@test.com",
                stateCode: "27",
            },
        });
        // Create test product with HSN code
        testProduct = yield prisma_1.default.product.create({
            data: {
                organizationId: testOrgId,
                name: "Test Product",
                sku: "TEST-PROD-001",
                description: "Test product description",
                hsnCode: "12345678",
                unitPrice: 10000,
            },
        });
        // Create product without HSN
        const productNoHSN = yield prisma_1.default.product.create({
            data: {
                organizationId: testOrgId,
                name: "Product Without HSN",
                sku: "TEST-NO-HSN",
                unitPrice: 5000,
            },
        });
        // Create valid invoice (above threshold, with GSTIN, with HSN)
        testInvoiceValid = yield prisma_1.default.invoice.create({
            data: {
                organizationId: testOrgId,
                invoiceNumber: "INV-EWAY-001",
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
                invoiceNumber: "INV-EWAY-002",
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
        // Create invoice without buyer GSTIN
        testInvoiceNoGSTIN = yield prisma_1.default.invoice.create({
            data: {
                organizationId: testOrgId,
                invoiceNumber: "INV-EWAY-003",
                customerId: customerNoGSTIN.id,
                status: "ISSUED",
                subtotal: 100000,
                cgstAmount: 9000,
                sgstAmount: 9000,
                igstAmount: 0,
                totalAmount: 118000,
                placeOfSupply: "27",
                issuedAt: new Date(),
            },
        });
        yield prisma_1.default.invoiceItem.create({
            data: {
                invoiceId: testInvoiceNoGSTIN.id,
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
        yield prisma_1.default.gSTConfig.delete({ where: { id: testGSTConfigId } });
        yield prisma_1.default.organization.delete({ where: { id: testOrgId } });
    }));
    (0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clear E-Way Bills before each test
        yield prisma_1.default.eWayBill.deleteMany({ where: { organizationId: testOrgId } });
    }));
    (0, globals_1.describe)("validateEWayBillEligibility", () => {
        (0, globals_1.it)("should validate eligible invoice successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, eway_service_1.validateEWayBillEligibility)(testInvoiceValid.id, testOrgId);
            (0, globals_1.expect)(result.valid).toBe(true);
            (0, globals_1.expect)(result.errors).toHaveLength(0);
        }));
        (0, globals_1.it)("should fail validation for invoice below threshold", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, eway_service_1.validateEWayBillEligibility)(testInvoiceBelowThreshold.id, testOrgId);
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.errors.length).toBeGreaterThan(0);
            (0, globals_1.expect)(result.errors.some((e) => e.field === "totalAmount")).toBe(true);
        }));
        (0, globals_1.it)("should fail validation for invoice without buyer GSTIN", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, eway_service_1.validateEWayBillEligibility)(testInvoiceNoGSTIN.id, testOrgId);
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.errors.some((e) => e.field === "customer.gstNumber")).toBe(true);
        }));
        (0, globals_1.it)("should fail validation for non-existent invoice", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, eway_service_1.validateEWayBillEligibility)("non-existent-id", testOrgId);
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.errors.some((e) => e.field === "invoiceId")).toBe(true);
        }));
        (0, globals_1.it)("should fail validation for cancelled invoice", () => __awaiter(void 0, void 0, void 0, function* () {
            const cancelledInvoice = yield prisma_1.default.invoice.create({
                data: {
                    organizationId: testOrgId,
                    invoiceNumber: "INV-CANCELLED",
                    customerId: testCustomer.id,
                    status: "CANCELLED",
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
                    invoiceId: cancelledInvoice.id,
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
            const result = yield (0, eway_service_1.validateEWayBillEligibility)(cancelledInvoice.id, testOrgId);
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.errors.some((e) => e.field === "status")).toBe(true);
            yield prisma_1.default.invoiceItem.deleteMany({ where: { invoiceId: cancelledInvoice.id } });
            yield prisma_1.default.invoice.delete({ where: { id: cancelledInvoice.id } });
        }));
    });
    (0, globals_1.describe)("generateEWayBillJSON", () => {
        (0, globals_1.it)("should generate E-Way Bill JSON successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            const transportDetails = {
                transporterName: "ABC Transport",
                transporterGSTIN: "27AABCT9999A1Z5",
                vehicleNumber: "KA01AB1234",
                transportMode: "ROAD",
                distance: 350,
            };
            const result = yield (0, eway_service_1.generateEWayBillJSON)(testInvoiceValid.id, testOrgId, transportDetails);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.data).toBeDefined();
            (0, globals_1.expect)((_a = result.data) === null || _a === void 0 ? void 0 : _a.docNo).toBe("INV-EWAY-001");
            (0, globals_1.expect)((_b = result.data) === null || _b === void 0 ? void 0 : _b.supplyType).toBe("Outward");
            (0, globals_1.expect)((_c = result.data) === null || _c === void 0 ? void 0 : _c.docType).toBe("INV");
            (0, globals_1.expect)((_d = result.data) === null || _d === void 0 ? void 0 : _d.fromGstin).toBe("27AABCT1234F0Z5");
            (0, globals_1.expect)((_e = result.data) === null || _e === void 0 ? void 0 : _e.toGstin).toBe("29AAPFT5055K1Z0");
            (0, globals_1.expect)((_f = result.data) === null || _f === void 0 ? void 0 : _f.totalValue).toBe(118000);
            (0, globals_1.expect)((_g = result.data) === null || _g === void 0 ? void 0 : _g.transMode).toBe("1"); // ROAD = 1
            (0, globals_1.expect)((_h = result.data) === null || _h === void 0 ? void 0 : _h.vehicleNo).toBe("KA01AB1234");
            (0, globals_1.expect)((_j = result.data) === null || _j === void 0 ? void 0 : _j.transporterId).toBe("27AABCT9999A1Z5");
            (0, globals_1.expect)((_k = result.data) === null || _k === void 0 ? void 0 : _k.itemList).toHaveLength(1);
        }));
        (0, globals_1.it)("should generate E-Way Bill with minimal transport details", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const transportDetails = {
                transportMode: "ROAD",
            };
            const result = yield (0, eway_service_1.generateEWayBillJSON)(testInvoiceValid.id, testOrgId, transportDetails);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.data).toBeDefined();
            (0, globals_1.expect)((_a = result.data) === null || _a === void 0 ? void 0 : _a.transMode).toBe("1");
            (0, globals_1.expect)((_b = result.data) === null || _b === void 0 ? void 0 : _b.vehicleNo).toBeUndefined();
        }));
        (0, globals_1.it)("should fail generation for invoice below threshold", () => __awaiter(void 0, void 0, void 0, function* () {
            const transportDetails = {
                transportMode: "ROAD",
            };
            const result = yield (0, eway_service_1.generateEWayBillJSON)(testInvoiceBelowThreshold.id, testOrgId, transportDetails);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.errors).toBeDefined();
            (0, globals_1.expect)(result.errors.length).toBeGreaterThan(0);
        }));
        (0, globals_1.it)("should map transport modes correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const modes = [
                { mode: "ROAD", expected: "1" },
                { mode: "RAIL", expected: "2" },
                { mode: "AIR", expected: "3" },
                { mode: "SHIP", expected: "4" },
            ];
            for (const { mode, expected } of modes) {
                yield prisma_1.default.eWayBill.deleteMany({ where: { organizationId: testOrgId } });
                const result = yield (0, eway_service_1.generateEWayBillJSON)(testInvoiceValid.id, testOrgId, {
                    transportMode: mode,
                });
                (0, globals_1.expect)(result.success).toBe(true);
                (0, globals_1.expect)((_a = result.data) === null || _a === void 0 ? void 0 : _a.transMode).toBe(expected);
            }
        }));
        (0, globals_1.it)("should record E-Way Bill in database", () => __awaiter(void 0, void 0, void 0, function* () {
            const transportDetails = {
                transporterName: "XYZ Logistics",
                vehicleNumber: "MH12CD5678",
                transportMode: "ROAD",
                distance: 200,
            };
            yield (0, eway_service_1.generateEWayBillJSON)(testInvoiceValid.id, testOrgId, transportDetails);
            const ewayBills = yield prisma_1.default.eWayBill.findMany({
                where: {
                    invoiceId: testInvoiceValid.id,
                    organizationId: testOrgId,
                },
            });
            (0, globals_1.expect)(ewayBills).toHaveLength(1);
            (0, globals_1.expect)(ewayBills[0].transporterName).toBe("XYZ Logistics");
            (0, globals_1.expect)(ewayBills[0].vehicleNumber).toBe("MH12CD5678");
            (0, globals_1.expect)(ewayBills[0].status).toBe("GENERATED");
        }));
    });
    (0, globals_1.describe)("getEWayBillHistory", () => {
        (0, globals_1.it)("should return empty history for invoice without E-Way Bills", () => __awaiter(void 0, void 0, void 0, function* () {
            const history = yield (0, eway_service_1.getEWayBillHistory)(testInvoiceValid.id, testOrgId);
            (0, globals_1.expect)(history).toHaveLength(0);
        }));
        (0, globals_1.it)("should return E-Way Bill history", () => __awaiter(void 0, void 0, void 0, function* () {
            // Generate two E-Way Bills
            yield (0, eway_service_1.generateEWayBillJSON)(testInvoiceValid.id, testOrgId, { transportMode: "ROAD" });
            yield (0, eway_service_1.generateEWayBillJSON)(testInvoiceValid.id, testOrgId, { transportMode: "RAIL" });
            const history = yield (0, eway_service_1.getEWayBillHistory)(testInvoiceValid.id, testOrgId);
            (0, globals_1.expect)(history.length).toBeGreaterThanOrEqual(2);
            (0, globals_1.expect)(history[0].invoiceId).toBe(testInvoiceValid.id);
        }));
        (0, globals_1.it)("should return history in descending order by generation date", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, eway_service_1.generateEWayBillJSON)(testInvoiceValid.id, testOrgId, { transportMode: "ROAD" });
            yield new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
            yield (0, eway_service_1.generateEWayBillJSON)(testInvoiceValid.id, testOrgId, { transportMode: "RAIL" });
            const history = yield (0, eway_service_1.getEWayBillHistory)(testInvoiceValid.id, testOrgId);
            (0, globals_1.expect)(history.length).toBeGreaterThanOrEqual(2);
            (0, globals_1.expect)(new Date(history[0].generatedAt).getTime()).toBeGreaterThanOrEqual(new Date(history[1].generatedAt).getTime());
        }));
    });
    (0, globals_1.describe)("cancelEWayBill", () => {
        (0, globals_1.it)("should cancel E-Way Bill successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            // Generate E-Way Bill
            yield (0, eway_service_1.generateEWayBillJSON)(testInvoiceValid.id, testOrgId, { transportMode: "ROAD" });
            const history = yield (0, eway_service_1.getEWayBillHistory)(testInvoiceValid.id, testOrgId);
            const ewayBillId = history[0].id;
            const cancelled = yield (0, eway_service_1.cancelEWayBill)(ewayBillId, testOrgId);
            (0, globals_1.expect)(cancelled.status).toBe("CANCELLED");
        }));
        (0, globals_1.it)("should fail to cancel non-existent E-Way Bill", () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, globals_1.expect)((0, eway_service_1.cancelEWayBill)("non-existent-id", testOrgId)).rejects.toThrow("E-Way Bill not found");
        }));
        (0, globals_1.it)("should fail to cancel already cancelled E-Way Bill", () => __awaiter(void 0, void 0, void 0, function* () {
            // Generate and cancel E-Way Bill
            yield (0, eway_service_1.generateEWayBillJSON)(testInvoiceValid.id, testOrgId, { transportMode: "ROAD" });
            const history = yield (0, eway_service_1.getEWayBillHistory)(testInvoiceValid.id, testOrgId);
            const ewayBillId = history[0].id;
            yield (0, eway_service_1.cancelEWayBill)(ewayBillId, testOrgId);
            yield (0, globals_1.expect)((0, eway_service_1.cancelEWayBill)(ewayBillId, testOrgId)).rejects.toThrow("E-Way Bill is already cancelled");
        }));
    });
});
