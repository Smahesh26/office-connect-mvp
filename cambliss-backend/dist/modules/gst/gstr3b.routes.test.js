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
const gstr3b_routes_1 = __importDefault(require("./gstr3b.routes"));
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
let activeOrgId = "test-org-id";
app.use(express_1.default.json());
app.use((req, _res, next) => {
    req.user = {
        id: "test-user-id",
        email: "tester@example.com",
        organizationId: activeOrgId,
        role: client_1.RoleName.ADMIN,
    };
    next();
});
app.use("/api/gst", gstr3b_routes_1.default);
(0, globals_1.describe)("GSTR-3B API Routes", () => {
    let testOrgId;
    let contactId = "";
    (0, globals_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        const org = yield prisma_1.default.organization.create({ data: { name: "GSTR3B Routes Test Org" } });
        testOrgId = org.id;
        activeOrgId = org.id;
        const contact = yield prisma_1.default.contact.create({
            data: {
                organizationId: testOrgId,
                type: "CUSTOMER",
                firstName: "Route",
                lastName: "Customer",
                email: "gstr3b-route@test.com",
            },
        });
        contactId = contact.id;
    }));
    (0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.default.invoice.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.contact.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.organization.delete({ where: { id: testOrgId } });
    }));
    (0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.default.invoice.deleteMany({ where: { organizationId: testOrgId } });
    }));
    (0, globals_1.it)("returns summary json by default", () => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.default.invoice.create({
            data: {
                organizationId: testOrgId,
                customerId: contactId,
                invoiceNumber: "INV-GSTR3B-001",
                issuedAt: new Date(2026, 0, 15),
                status: "ISSUED",
                subtotal: 10000,
                cgstAmount: 900,
                sgstAmount: 900,
                igstAmount: 0,
                totalAmount: 11800,
                placeOfSupply: "27",
            },
        });
        const response = yield (0, supertest_1.default)(app)
            .get("/api/gst/gstr3b/summary")
            .query({ month: 1, year: 2026 });
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(response.body).toHaveProperty("outputGST");
        (0, globals_1.expect)(response.body.outputGST.cgst).toBe(900);
        (0, globals_1.expect)(response.body).toHaveProperty("period");
    }));
    (0, globals_1.it)("returns filing json when format=json-filing", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .get("/api/gst/gstr3b/summary")
            .query({ month: 1, year: 2026, format: "json-filing" });
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(response.body).toHaveProperty("ret_period");
        (0, globals_1.expect)(response.body).toHaveProperty("sup_details");
    }));
    (0, globals_1.it)("returns text report when format=text", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .get("/api/gst/gstr3b/summary")
            .query({ month: 1, year: 2026, format: "text" });
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(response.text).toContain("GSTR-3B MONTHLY SUMMARY");
    }));
    (0, globals_1.it)("returns 400 when month or year is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/api/gst/gstr3b/summary").query({ month: 1 });
        (0, globals_1.expect)(response.status).toBe(400);
    }));
    (0, globals_1.it)("returns payment challan payload", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .get("/api/gst/gstr3b/payment-challan")
            .query({ month: 1, year: 2026 });
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(response.body).toHaveProperty("paymentDetails");
        (0, globals_1.expect)(Array.isArray(response.body.paymentDetails)).toBe(true);
        (0, globals_1.expect)(response.body).toHaveProperty("totalPayable");
    }));
    (0, globals_1.it)("returns comparison payload", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .get("/api/gst/gstr3b/comparison")
            .query({ year: 2026, months: 2 });
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(response.body).toHaveProperty("comparison");
        (0, globals_1.expect)(Array.isArray(response.body.comparison)).toBe(true);
    }));
});
