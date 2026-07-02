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
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supertest_1 = __importDefault(require("supertest"));
const auth_routes_1 = __importDefault(require("../auth/auth.routes"));
const subscription_routes_1 = __importDefault(require("../subscription/subscription.routes"));
const crm_routes_1 = __importDefault(require("../crm/crm.routes"));
const hrm_routes_1 = __importDefault(require("../hrm/hrm.routes"));
const inventory_routes_1 = __importDefault(require("../inventory/inventory.routes"));
const rate_limit_middleware_1 = require("../../middleware/rate-limit.middleware");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/api/auth", auth_routes_1.default);
app.use("/api/subscription", subscription_routes_1.default);
app.use("/api/crm", crm_routes_1.default);
app.use("/api/hrm", hrm_routes_1.default);
app.use("/api/inventory", inventory_routes_1.default);
const signToken = (payload) => {
    const secret = process.env.JWT_SECRET || "auth-test-secret";
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: "10m" });
};
(0, globals_1.describe)("Security checks", () => {
    (0, globals_1.beforeAll)(() => {
        var _a;
        process.env.JWT_SECRET = (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "auth-test-secret";
        process.env.AUTH_RATE_LIMIT_MAX = "2";
        process.env.AUTH_RATE_LIMIT_WINDOW_MS = "60000";
    });
    (0, globals_1.beforeEach)(() => {
        (0, rate_limit_middleware_1.clearRateLimitBuckets)();
    });
    (0, globals_1.afterAll)(() => {
        delete process.env.AUTH_RATE_LIMIT_MAX;
        delete process.env.AUTH_RATE_LIMIT_WINDOW_MS;
    });
    (0, globals_1.it)("blocks unauthorized access to protected auth endpoint", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).get("/api/auth/me");
        (0, globals_1.expect)(response.status).toBe(401);
    }));
    (0, globals_1.it)("rejects malformed bearer token", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .get("/api/subscription/my-subscription")
            .set("Authorization", "Bearer malformed.token.value");
        (0, globals_1.expect)(response.status).toBe(401);
    }));
    (0, globals_1.it)("enforces role-based authorization on subscription create", () => __awaiter(void 0, void 0, void 0, function* () {
        const employeeToken = signToken({
            id: "user-1",
            email: "employee@test.com",
            organizationId: "org-1",
            role: "EMPLOYEE",
        });
        const response = yield (0, supertest_1.default)(app)
            .post("/api/subscription/subscribe")
            .set("Authorization", `Bearer ${employeeToken}`)
            .send({ planId: "plan-x" });
        (0, globals_1.expect)(response.status).toBe(403);
    }));
    (0, globals_1.it)("applies rate limiting on repeated auth attempts", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.default)(app).post("/api/auth/login").send({ email: "a@test.com", password: "x" });
        yield (0, supertest_1.default)(app).post("/api/auth/login").send({ email: "a@test.com", password: "x" });
        const third = yield (0, supertest_1.default)(app).post("/api/auth/login").send({ email: "a@test.com", password: "x" });
        (0, globals_1.expect)(third.status).toBe(429);
        (0, globals_1.expect)(third.body.message).toContain("Too many requests");
    }));
    (0, globals_1.it)("handles SQL injection-like login input safely", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app)
            .post("/api/auth/login")
            .send({ email: "' OR 1=1 --", password: "' OR '1'='1" });
        (0, globals_1.expect)([400, 401]).toContain(response.status);
    }));
    (0, globals_1.it)("keeps CRM, HRM, Inventory behind JWT auth", () => __awaiter(void 0, void 0, void 0, function* () {
        const [crmRes, hrmRes, invRes] = yield Promise.all([
            (0, supertest_1.default)(app).get("/api/crm/leads"),
            (0, supertest_1.default)(app).get("/api/hrm/employees"),
            (0, supertest_1.default)(app).get("/api/inventory/products"),
        ]);
        (0, globals_1.expect)(crmRes.status).toBe(401);
        (0, globals_1.expect)(hrmRes.status).toBe(401);
        (0, globals_1.expect)(invRes.status).toBe(401);
    }));
});
