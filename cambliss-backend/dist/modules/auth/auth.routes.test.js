"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const supertest_1 = __importDefault(require("supertest"));
const prisma_1 = __importStar(require("../../config/prisma"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/api/auth", auth_routes_1.default);
(0, globals_1.describe)("Auth Routes", () => {
    const testRunId = `auth-test-${Date.now()}`;
    (0, globals_1.beforeAll)(() => {
        var _a;
        process.env.JWT_SECRET = (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "auth-test-secret";
    });
    (0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        const users = yield prisma_1.default.user.findMany({
            where: {
                email: {
                    startsWith: `${testRunId}-`,
                },
            },
            select: {
                id: true,
                organizationId: true,
            },
        });
        const userIds = users.map((user) => user.id);
        const organizationIds = users
            .map((user) => user.organizationId)
            .filter((organizationId) => Boolean(organizationId));
        if (userIds.length > 0) {
            yield prisma_1.default.organizationUser.deleteMany({
                where: {
                    userId: {
                        in: userIds,
                    },
                },
            });
            yield prisma_1.default.user.deleteMany({
                where: {
                    id: {
                        in: userIds,
                    },
                },
            });
        }
        if (organizationIds.length > 0) {
            yield prisma_1.default.organization.deleteMany({
                where: {
                    id: {
                        in: organizationIds,
                    },
                },
            });
        }
        yield (0, prisma_1.closePrisma)();
    }));
    (0, globals_1.it)("registers a new user and organization", () => __awaiter(void 0, void 0, void 0, function* () {
        const email = `${testRunId}-register@example.com`;
        const response = yield (0, supertest_1.default)(app).post("/api/auth/register").send({
            email,
            password: "password123",
            firstName: "Auth",
            lastName: "Tester",
            organizationName: `${testRunId}-org`,
        });
        (0, globals_1.expect)(response.status).toBe(201);
        (0, globals_1.expect)(response.body).toHaveProperty("token");
        (0, globals_1.expect)(response.body).toHaveProperty("user");
        (0, globals_1.expect)(response.body.user.email).toBe(email);
        (0, globals_1.expect)(response.body.user.role).toBe("ADMIN");
        (0, globals_1.expect)(response.body.user.organizationId).toBeTruthy();
        const createdUser = yield prisma_1.default.user.findUnique({
            where: { email },
            include: {
                memberships: true,
            },
        });
        (0, globals_1.expect)(createdUser).not.toBeNull();
        (0, globals_1.expect)(createdUser === null || createdUser === void 0 ? void 0 : createdUser.memberships.length).toBeGreaterThan(0);
    }));
    (0, globals_1.it)("rejects duplicate registration for same email", () => __awaiter(void 0, void 0, void 0, function* () {
        const email = `${testRunId}-duplicate@example.com`;
        yield (0, supertest_1.default)(app).post("/api/auth/register").send({
            email,
            password: "password123",
            organizationName: `${testRunId}-dup-org-a`,
        });
        const secondResponse = yield (0, supertest_1.default)(app).post("/api/auth/register").send({
            email,
            password: "password123",
            organizationName: `${testRunId}-dup-org-b`,
        });
        (0, globals_1.expect)(secondResponse.status).toBe(409);
        (0, globals_1.expect)(secondResponse.body.message).toContain("already exists");
    }));
    (0, globals_1.it)("rejects registration when organizationName is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/api/auth/register").send({
            email: `${testRunId}-missing-org@example.com`,
            password: "password123",
        });
        (0, globals_1.expect)(response.status).toBe(400);
        (0, globals_1.expect)(response.body.message).toContain("organizationName is required");
    }));
    (0, globals_1.it)("rejects registration when password is too short", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post("/api/auth/register").send({
            email: `${testRunId}-short-pass@example.com`,
            password: "12345",
            organizationName: `${testRunId}-short-pass-org`,
        });
        (0, globals_1.expect)(response.status).toBe(400);
        (0, globals_1.expect)(response.body.message).toContain("at least 6 characters");
    }));
    (0, globals_1.it)("logs in an existing user", () => __awaiter(void 0, void 0, void 0, function* () {
        const email = `${testRunId}-login@example.com`;
        const password = "password123";
        yield (0, supertest_1.default)(app).post("/api/auth/register").send({
            email,
            password,
            organizationName: `${testRunId}-login-org`,
        });
        const loginResponse = yield (0, supertest_1.default)(app).post("/api/auth/login").send({
            email,
            password,
        });
        (0, globals_1.expect)(loginResponse.status).toBe(200);
        (0, globals_1.expect)(loginResponse.body).toHaveProperty("token");
        (0, globals_1.expect)(loginResponse.body.user.email).toBe(email);
        (0, globals_1.expect)(loginResponse.body.user.role).toBe("ADMIN");
    }));
    (0, globals_1.it)("rejects login with invalid password", () => __awaiter(void 0, void 0, void 0, function* () {
        const email = `${testRunId}-invalid-password@example.com`;
        yield (0, supertest_1.default)(app).post("/api/auth/register").send({
            email,
            password: "password123",
            organizationName: `${testRunId}-invalid-org`,
        });
        const loginResponse = yield (0, supertest_1.default)(app).post("/api/auth/login").send({
            email,
            password: "wrong-password",
        });
        (0, globals_1.expect)(loginResponse.status).toBe(401);
        (0, globals_1.expect)(loginResponse.body.message).toContain("Invalid email or password");
    }));
});
