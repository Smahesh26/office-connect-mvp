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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const prisma_2 = require("../../config/prisma");
const insights_routes_1 = __importDefault(require("./insights.routes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/api/ai/insights", insights_routes_1.default);
(0, globals_1.describe)("AI Insights Routes", () => {
    let testOrgId;
    let authToken;
    (0, globals_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        process.env.JWT_SECRET = "ai-insights-test-secret";
        const org = yield prisma_1.default.organization.create({
            data: {
                name: "AI Insights Route Org",
            },
        });
        testOrgId = org.id;
        authToken = jsonwebtoken_1.default.sign({
            id: "test-user-id",
            email: "ai-route@test.com",
            organizationId: testOrgId,
            role: "ADMIN",
        }, process.env.JWT_SECRET);
    }));
    (0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.default.invoiceItem.deleteMany({
            where: {
                invoice: {
                    organizationId: testOrgId,
                },
            },
        });
        yield prisma_1.default.invoice.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.transaction.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.stockMovement.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.attendance.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.employee.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.product.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.warehouse.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.contact.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.organization.deleteMany({ where: { id: testOrgId } });
        yield (0, prisma_2.closePrisma)();
    }));
    (0, globals_1.it)("should return 401 when token is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/api/ai/insights/executive");
        (0, globals_1.expect)(response.status).toBe(401);
    }));
    (0, globals_1.it)("should return executive insights for authenticated user", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .get("/api/ai/insights/executive")
            .set("Authorization", `Bearer ${authToken}`);
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(response.body).toHaveProperty("revenueInsights");
        (0, globals_1.expect)(response.body).toHaveProperty("expenseInsights");
        (0, globals_1.expect)(response.body).toHaveProperty("inventoryInsights");
        (0, globals_1.expect)(response.body).toHaveProperty("cashFlowInsights");
        (0, globals_1.expect)(response.body).toHaveProperty("hrInsights");
        (0, globals_1.expect)(response.body).toHaveProperty("generatedAt");
    }));
    (0, globals_1.it)("should return CEO report in JSON format", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .get("/api/ai/insights/ceo-report")
            .set("Authorization", `Bearer ${authToken}`);
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(response.body).toHaveProperty("summary");
        (0, globals_1.expect)(response.body).toHaveProperty("highlights");
        (0, globals_1.expect)(response.body).toHaveProperty("risks");
        (0, globals_1.expect)(response.body).toHaveProperty("recommendations");
        (0, globals_1.expect)(response.body).toHaveProperty("predictiveSignals");
    }));
    (0, globals_1.it)("should return CEO report in text format", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .get("/api/ai/insights/ceo-report")
            .query({ format: "text" })
            .set("Authorization", `Bearer ${authToken}`);
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(response.headers["content-type"]).toContain("text/plain");
        (0, globals_1.expect)(response.text).toContain("CAMBLISS CEO EXECUTIVE REPORT");
        (0, globals_1.expect)(response.text).toContain("SUMMARY");
    }));
    (0, globals_1.it)("should reject unsupported CEO report format", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .get("/api/ai/insights/ceo-report")
            .query({ format: "xml" })
            .set("Authorization", `Bearer ${authToken}`);
        (0, globals_1.expect)(response.status).toBe(400);
        (0, globals_1.expect)(response.body.error).toContain("Invalid format");
    }));
});
