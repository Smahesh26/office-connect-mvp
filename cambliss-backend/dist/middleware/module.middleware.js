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
exports.moduleGuard = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
/**
 * Module Guard Middleware
 * Enforces that the authenticated user's organization has the required module enabled
 *
 * Usage: app.get("/api/crm/...", authenticateJWT, moduleGuard("CRM"), handler);
 *
 * @param moduleName - Name of the module to guard access to
 * @returns Express middleware function
 */
const moduleGuard = (moduleName) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const currentUser = req.user;
            // Skip module check for SUPER_ADMIN (they have access to everything)
            if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) === client_1.RoleName.SUPER_ADMIN) {
                next();
                return;
            }
            // Require JWT authentication before module check
            if (!currentUser) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }
            const organizationId = currentUser.organizationId;
            if (!organizationId) {
                res.status(403).json({ message: "User must belong to an organization" });
                return;
            }
            // Find or auto-create the module record
            let module = yield prisma_1.default.module.findUnique({
                where: { name: moduleName },
                select: { id: true },
            });
            if (!module) {
                module = yield prisma_1.default.module.create({
                    data: {
                        name: moduleName,
                        description: `${moduleName} Module`,
                    },
                    select: { id: true },
                });
            }
            // Check if organization has this module enabled
            const orgModule = yield prisma_1.default.organizationModule.findUnique({
                where: {
                    organizationId_moduleId: {
                        organizationId,
                        moduleId: module.id,
                    },
                },
                select: { isEnabled: true },
            });
            if (orgModule === null || orgModule === void 0 ? void 0 : orgModule.isEnabled) {
                next();
                return;
            }
            // Check organization 90-day trial status & active subscriptions
            const organization = yield prisma_1.default.organization.findUnique({
                where: { id: organizationId },
                select: { createdAt: true },
            });
            const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
            const isWithinTrial = organization
                ? Date.now() - new Date(organization.createdAt).getTime() <= NINETY_DAYS_MS
                : true;
            const activeSubscription = yield prisma_1.default.subscription.findFirst({
                where: {
                    organizationId,
                    status: {
                        in: ["ACTIVE", "TRIALING", "PAST_DUE"],
                    },
                },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                },
            });
            const hasValidSubscription = Boolean(activeSubscription === null || activeSubscription === void 0 ? void 0 : activeSubscription.id);
            // Enable module access automatically for 90-day trial or valid subscription
            if (isWithinTrial || hasValidSubscription || !activeSubscription) {
                yield prisma_1.default.organizationModule.upsert({
                    where: {
                        organizationId_moduleId: {
                            organizationId,
                            moduleId: module.id,
                        },
                    },
                    update: { isEnabled: true },
                    create: {
                        organizationId,
                        moduleId: module.id,
                        isEnabled: true,
                    },
                });
                next();
                return;
            }
            res.status(403).json({
                message: `Module "${moduleName}" is not enabled for your organization. Please subscribe to a plan that includes this module.`,
            });
            return;
        }
        catch (error) {
            console.error(`[moduleGuard] Error checking module "${moduleName}":`, error);
            res.status(500).json({ message: "Internal server error" });
        }
    });
};
exports.moduleGuard = moduleGuard;
