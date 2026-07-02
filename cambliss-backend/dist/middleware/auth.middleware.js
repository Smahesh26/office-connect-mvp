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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticateJWT = exports.isAuthenticatedUser = void 0;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const extractBearerToken = (authorizationHeader) => {
    if (!authorizationHeader) {
        return null;
    }
    const [scheme, token] = authorizationHeader.trim().split(" ");
    if (scheme !== "Bearer" || !token) {
        return null;
    }
    return token;
};
const isAuthenticatedUser = (decoded) => {
    if (typeof decoded !== "object" || decoded === null) {
        return false;
    }
    return (typeof decoded.id === "string" &&
        typeof decoded.email === "string" &&
        typeof decoded.organizationId === "string" &&
        typeof decoded.role === "string");
};
exports.isAuthenticatedUser = isAuthenticatedUser;
const authenticateJWT = (req, res, next) => {
    try {
        if (req.user && isAuthenticatedUser(req.user)) {
            next();
            return;
        }
        const token = extractBearerToken(req.headers.authorization);
        if (!token) {
            res.status(401).json({ message: "Unauthorized: Invalid or missing token" });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (!isAuthenticatedUser(decoded)) {
            res.status(401).json({ message: "Unauthorized: Invalid token payload" });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            res.status(401).json({ message: "Unauthorized: Token expired" });
            return;
        }
        if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
            res.status(401).json({ message: "Unauthorized: Invalid token" });
            return;
        }
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.authenticateJWT = authenticateJWT;
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
