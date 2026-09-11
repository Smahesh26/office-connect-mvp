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
exports.authorizeRoles = exports.requireSeller = exports.requireAdmin = exports.authenticateJWT = exports.isAuthenticatedUser = void 0;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const extractBearerToken = (authorizationHeader) => {
    if (!authorizationHeader)
        return null;
    const [scheme, token] = authorizationHeader.trim().split(" ");
    if (scheme !== "Bearer" || !token)
        return null;
    return token;
};
const isUsableToken = (value) => typeof value === "string" && value.length > 0 && value !== "null" && value !== "undefined";
const resolveTokenCandidates = (req) => {
    var _a;
    const candidates = [
        extractBearerToken(req.headers.authorization),
        (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.authToken,
    ];
    return candidates.filter(isUsableToken);
};
const isAuthenticatedUser = (decoded) => {
    if (typeof decoded !== "object" || decoded === null)
        return false;
    return typeof decoded.id === "string" && typeof decoded.email === "string";
};
exports.isAuthenticatedUser = isAuthenticatedUser;
const authenticateJWT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const candidates = resolveTokenCandidates(req);
        if (candidates.length === 0) {
            res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid authentication token" });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET || "fallback_dev_secret_never_use_in_prod";
        let lastError = null;
        for (const token of candidates) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
                if (!(0, exports.isAuthenticatedUser)(decoded)) {
                    lastError = new jsonwebtoken_1.JsonWebTokenError("Invalid token payload structure");
                    continue;
                }
                // Server-side resolution of Seller identity & Marketplace Role
                let sellerId = null;
                let customerId = null;
                let mktRole = "CUSTOMER";
                if (decoded.role === "SUPER_ADMIN" || decoded.role === "ADMIN") {
                    mktRole = decoded.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "MARKETPLACE_ADMIN";
                }
                try {
                    // Resolve Store ownership if user is associated with a Store
                    const store = yield prisma_1.default.store.findFirst({
                        where: {
                            OR: [
                                { ownerUserId: decoded.id },
                                { members: { some: { userId: decoded.id, isActive: true } } },
                            ],
                        },
                        select: { id: true, members: { where: { userId: decoded.id }, select: { role: true } } },
                    });
                    if (store) {
                        sellerId = store.id;
                        const memberRole = (_a = store.members[0]) === null || _a === void 0 ? void 0 : _a.role;
                        mktRole = memberRole === "OWNER" ? "SELLER_OWNER" : "SELLER_STAFF";
                    }
                }
                catch (_b) {
                    // Fallback if DB lookup fails
                }
                req.user = {
                    id: decoded.id,
                    email: decoded.email,
                    organizationId: decoded.organizationId || "platform",
                    role: decoded.role,
                    marketplaceRole: mktRole,
                    sellerId,
                    customerId,
                };
                next();
                return;
            }
            catch (error) {
                lastError = error;
            }
        }
        throw lastError !== null && lastError !== void 0 ? lastError : new jsonwebtoken_1.JsonWebTokenError("Invalid token");
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            res.status(401).json({ success: false, message: "Unauthorized: Token has expired" });
            return;
        }
        if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
            res.status(401).json({ success: false, message: "Unauthorized: Invalid authentication token" });
            return;
        }
        res.status(500).json({ success: false, message: "Internal server error during authentication" });
    }
});
exports.authenticateJWT = authenticateJWT;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized: Authentication required" });
        return;
    }
    const allowedAdminRoles = ["SUPER_ADMIN", "MARKETPLACE_ADMIN", "FINANCE_ADMIN"];
    const isSaasAdmin = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN";
    const isMktAdmin = req.user.marketplaceRole && allowedAdminRoles.includes(req.user.marketplaceRole);
    if (!isSaasAdmin && !isMktAdmin) {
        res.status(403).json({ success: false, message: "Forbidden: Super-Admin governance credentials required" });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireSeller = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized: Authentication required" });
        return;
    }
    const isSellerRole = req.user.marketplaceRole === "SELLER_OWNER" || req.user.marketplaceRole === "SELLER_STAFF";
    const isAdmin = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN";
    if (!isSellerRole && !isAdmin) {
        res.status(403).json({ success: false, message: "Forbidden: Active 3P Merchant Seller credentials required" });
        return;
    }
    next();
};
exports.requireSeller = requireSeller;
const authorizeRoles = (...roles) => (req, res, next) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.role)) {
            res.status(401).json({ message: "Unauthorized: User not authenticated" });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: "Forbidden: Insufficient permissions" });
            return;
        }
        next();
    }
    catch (_b) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.authorizeRoles = authorizeRoles;
