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
exports.requireActiveSubscription = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("@prisma/client");
const forbiddenResponse = (res) => {
    res.status(403).json({ message: "No active subscription. Please subscribe to continue." });
};
const requireActiveSubscription = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === client_1.RoleName.SUPER_ADMIN || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === client_1.RoleName.ADMIN) {
            next();
            return;
        }
        const organizationId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.organizationId;
        if (!organizationId) {
            forbiddenResponse(res);
            return;
        }
        const organization = yield prisma_1.default.organization.findUnique({
            where: { id: organizationId },
            select: { id: true, isActive: true },
        });
        if (!(organization === null || organization === void 0 ? void 0 : organization.isActive)) {
            forbiddenResponse(res);
            return;
        }
        const activeSubscription = yield prisma_1.default.subscription.findFirst({
            where: {
                organizationId,
                status: {
                    in: ["ACTIVE", "TRIALING", "PAST_DUE"],
                },
            },
            select: { id: true },
        });
        if (!activeSubscription) {
            forbiddenResponse(res);
            return;
        }
        next();
    }
    catch (_d) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.requireActiveSubscription = requireActiveSubscription;
