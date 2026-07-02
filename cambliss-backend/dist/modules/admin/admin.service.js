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
exports.generateAdminOrderInvoice = exports.getAllOrderHistory = exports.assignModulesToPlan = exports.getAllPlans = exports.deletePlan = exports.updatePlan = exports.createPlan = exports.getAllSubscriptions = exports.activateOrganization = exports.suspendOrganization = exports.getOrganizationById = exports.getAllOrganizations = exports.HttpError = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const client_1 = require("@prisma/client");
const pdfkit_1 = __importDefault(require("pdfkit"));
const client_2 = require("@prisma/client");
class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "HttpError";
    }
}
exports.HttpError = HttpError;
const normalizePrice = (price) => {
    const parsed = typeof price === "number" ? price : Number(price);
    if (Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed <= 0) {
        throw new HttpError(400, "Invalid plan price");
    }
    return new client_1.Prisma.Decimal(parsed);
};
const normalizeCurrency = (currency) => {
    const normalized = (currency !== null && currency !== void 0 ? currency : "USD").trim().toUpperCase();
    if (normalized.length !== 3) {
        throw new HttpError(400, "Currency must be a 3-letter ISO code");
    }
    return normalized;
};
const normalizeLimit = (value, label) => {
    if (!Number.isInteger(value) || value <= 0) {
        throw new HttpError(400, `${label} must be a positive integer`);
    }
    return value;
};
const normalizeFeatures = (features) => {
    if (features === undefined) {
        return [];
    }
    if (!Array.isArray(features)) {
        throw new HttpError(400, "features must be an array of strings");
    }
    return features
        .map((feature) => feature.trim())
        .filter((feature) => feature.length > 0);
};
const ensurePlanIsActive = (planId) => __awaiter(void 0, void 0, void 0, function* () {
    const plan = yield prisma_1.default.plan.findUnique({
        where: { id: planId },
        select: { id: true, isActive: true },
    });
    if (!plan) {
        throw new HttpError(404, "Plan not found");
    }
    if (!plan.isActive) {
        throw new HttpError(403, "Plan is inactive and cannot be modified");
    }
});
const ensureOrganizationExists = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const organization = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!organization) {
        throw new HttpError(404, "Organization not found");
    }
});
const getAllOrganizations = () => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.organization.findMany({
        include: {
            subscriptions: {
                include: {
                    plan: true,
                },
            },
            _count: {
                select: {
                    users: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
});
exports.getAllOrganizations = getAllOrganizations;
const getOrganizationById = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const organization = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        include: {
            users: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    createdAt: true,
                },
            },
            subscriptions: {
                include: {
                    plan: true,
                    payments: true,
                },
            },
        },
    });
    if (!organization) {
        throw new HttpError(404, "Organization not found");
    }
    return organization;
});
exports.getOrganizationById = getOrganizationById;
const suspendOrganization = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureOrganizationExists(organizationId);
    const affectedRows = yield prisma_1.default.$executeRaw `
		UPDATE "Subscription"
		SET "status" = CAST('SUSPENDED' AS "SubscriptionStatus"),
				"updatedAt" = NOW()
		WHERE "organizationId" = ${organizationId}
	`;
    return {
        organizationId,
        suspendedSubscriptions: Number(affectedRows),
    };
});
exports.suspendOrganization = suspendOrganization;
const activateOrganization = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureOrganizationExists(organizationId);
    const updated = yield prisma_1.default.subscription.updateMany({
        where: {
            organizationId,
        },
        data: {
            status: "ACTIVE",
        },
    });
    return {
        organizationId,
        activatedSubscriptions: updated.count,
    };
});
exports.activateOrganization = activateOrganization;
const getAllSubscriptions = () => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.subscription.findMany({
        include: {
            organization: true,
            plan: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
});
exports.getAllSubscriptions = getAllSubscriptions;
const createPlan = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const name = (_a = input.name) === null || _a === void 0 ? void 0 : _a.trim();
    const interval = (_b = input.interval) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase();
    if (!name) {
        throw new HttpError(400, "Plan name is required");
    }
    if (!interval) {
        throw new HttpError(400, "Plan interval is required");
    }
    try {
        return yield prisma_1.default.plan.create({
            data: {
                name,
                description: ((_c = input.description) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                features: normalizeFeatures(input.features),
                price: normalizePrice(input.price),
                currency: normalizeCurrency(input.currency),
                interval,
                userLimit: normalizeLimit(input.userLimit, "User limit"),
                storageLimit: normalizeLimit(input.storageLimit, "Storage limit"),
            },
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new HttpError(409, "Plan with this name already exists");
        }
        throw error;
    }
});
exports.createPlan = createPlan;
const updatePlan = (planId, input) => __awaiter(void 0, void 0, void 0, function* () {
    if (!Object.keys(input).length) {
        throw new HttpError(400, "At least one field is required for update");
    }
    yield ensurePlanIsActive(planId);
    const data = {};
    if (input.name !== undefined) {
        const trimmed = input.name.trim();
        if (!trimmed) {
            throw new HttpError(400, "Plan name cannot be empty");
        }
        data.name = trimmed;
    }
    if (input.description !== undefined) {
        data.description = input.description.trim() || null;
    }
    if (input.features !== undefined) {
        data.features = normalizeFeatures(input.features);
    }
    if (input.price !== undefined) {
        data.price = normalizePrice(input.price);
    }
    if (input.currency !== undefined) {
        data.currency = normalizeCurrency(input.currency);
    }
    if (input.interval !== undefined) {
        const interval = input.interval.trim().toLowerCase();
        if (!interval) {
            throw new HttpError(400, "Plan interval cannot be empty");
        }
        data.interval = interval;
    }
    if (input.userLimit !== undefined) {
        data.userLimit = normalizeLimit(input.userLimit, "User limit");
    }
    if (input.storageLimit !== undefined) {
        data.storageLimit = normalizeLimit(input.storageLimit, "Storage limit");
    }
    try {
        return yield prisma_1.default.plan.update({
            where: { id: planId },
            data,
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new HttpError(404, "Plan not found");
        }
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new HttpError(409, "Plan with this name already exists");
        }
        throw error;
    }
});
exports.updatePlan = updatePlan;
const deletePlan = (planId) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensurePlanIsActive(planId);
    const subscriptionsUsingPlan = yield prisma_1.default.subscription.count({
        where: { planId },
    });
    if (subscriptionsUsingPlan > 0) {
        throw new HttpError(409, "Cannot delete plan with active subscriptions");
    }
    try {
        return yield prisma_1.default.plan.delete({
            where: { id: planId },
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new HttpError(404, "Plan not found");
        }
        throw error;
    }
});
exports.deletePlan = deletePlan;
const getAllPlans = () => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.plan.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
});
exports.getAllPlans = getAllPlans;
const assignModulesToPlan = (planId, moduleIds) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate plan exists
    const plan = yield prisma_1.default.plan.findUnique({
        where: { id: planId },
    });
    if (!plan) {
        throw new HttpError(404, "Plan not found");
    }
    // Validate all modules exist
    if (!moduleIds || moduleIds.length === 0) {
        throw new HttpError(400, "At least one module ID is required");
    }
    const modules = yield prisma_1.default.module.findMany({
        where: {
            id: { in: moduleIds },
        },
    });
    if (modules.length !== moduleIds.length) {
        throw new HttpError(404, "One or more modules not found");
    }
    // Delete existing PlanModule records for this plan
    yield prisma_1.default.planModule.deleteMany({
        where: { planId },
    });
    // Insert new PlanModule records
    const planModules = yield prisma_1.default.planModule.createMany({
        data: moduleIds.map((moduleId) => ({
            planId,
            moduleId,
        })),
    });
    // Return updated plan with modules included
    return prisma_1.default.plan.findUnique({
        where: { id: planId },
        include: {
            planModules: {
                include: {
                    module: true,
                },
            },
        },
    });
});
exports.assignModulesToPlan = assignModulesToPlan;
const buildCamblissInvoicePDF = (payment) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = payment.subscription;
    const plan = subscription.plan;
    const organization = subscription.organization;
    const contactUser = organization.users[0];
    const document = new pdfkit_1.default({ size: "A4", margin: 50 });
    const chunks = [];
    return new Promise((resolve, reject) => {
        var _a, _b;
        document.on("data", (chunk) => chunks.push(chunk));
        document.on("end", () => {
            resolve({
                fileName: `cambliss-invoice-${payment.id}.pdf`,
                buffer: Buffer.concat(chunks),
            });
        });
        document.on("error", reject);
        document.fontSize(22).text("Cambliss Invoice", { align: "left" });
        document.moveDown(0.8);
        document.fontSize(11).text(`Invoice ID: ${payment.id}`);
        document.text(`Payment ID: ${(_a = payment.externalPaymentId) !== null && _a !== void 0 ? _a : "N/A"}`);
        document.text(`Issued At: ${new Date(payment.paidAt).toLocaleString()}`);
        document.moveDown();
        document.fontSize(13).text("Client Details");
        document.fontSize(11).text(`Organization: ${organization.name}`);
        document.text(`Client Name: ${[contactUser === null || contactUser === void 0 ? void 0 : contactUser.firstName, contactUser === null || contactUser === void 0 ? void 0 : contactUser.lastName].filter(Boolean).join(" ") || "N/A"}`);
        document.text(`Client Email: ${(contactUser === null || contactUser === void 0 ? void 0 : contactUser.email) || organization.supportEmail || "N/A"}`);
        document.moveDown();
        document.fontSize(13).text("Subscription Details");
        document.fontSize(11).text(`Plan: ${plan.name}`);
        document.text(`Plan Interval: ${plan.interval}`);
        document.text(`Status: ${subscription.status}`);
        document.moveDown();
        document.fontSize(13).text("Amount");
        document.fontSize(11).text(`Total Paid: ${payment.currency} ${payment.amount}`);
        document.text(`Provider: ${(_b = payment.provider) !== null && _b !== void 0 ? _b : "razorpay"}`);
        document.moveDown(2);
        document.fontSize(10).fillColor("#666").text("Generated by Cambliss Billing", { align: "left" });
        document.end();
    });
});
const getAllOrderHistory = () => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.payment.findMany({
        include: {
            subscription: {
                include: {
                    plan: true,
                    organization: {
                        include: {
                            memberships: {
                                where: {
                                    role: {
                                        name: client_2.RoleName.CLIENT,
                                    },
                                },
                                select: {
                                    user: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                        },
                                    },
                                },
                            },
                            users: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                                take: 1,
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            paidAt: "desc",
        },
    });
});
exports.getAllOrderHistory = getAllOrderHistory;
const generateAdminOrderInvoice = (paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield prisma_1.default.payment.findFirst({
        where: {
            id: paymentId,
        },
        include: {
            subscription: {
                include: {
                    plan: true,
                    organization: {
                        include: {
                            users: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                                take: 1,
                            },
                        },
                    },
                },
            },
        },
    });
    if (!payment) {
        throw new HttpError(404, "Payment not found");
    }
    return buildCamblissInvoicePDF(payment);
});
exports.generateAdminOrderInvoice = generateAdminOrderInvoice;
