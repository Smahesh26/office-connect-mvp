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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getListings = getListings;
exports.getListingById = getListingById;
exports.getCategories = getCategories;
exports.getStores = getStores;
exports.getFeaturedListings = getFeaturedListings;
const ecommerce_service_1 = require("./ecommerce.service");
const service = new ecommerce_service_1.EcommerceService();
// Default organization ID — in production this would come from
// subdomain resolution or a config table. For now we use the first org.
const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || "";
function resolveOrgId(req) {
    return __awaiter(this, void 0, void 0, function* () {
        if (DEFAULT_ORG_ID)
            return DEFAULT_ORG_ID;
        // Fallback: look up the first organization in the database
        const { PrismaClient } = yield Promise.resolve().then(() => __importStar(require("@prisma/client")));
        const prisma = new PrismaClient();
        const org = yield prisma.organization.findFirst({
            select: { id: true },
            orderBy: { createdAt: "asc" },
        });
        return (org === null || org === void 0 ? void 0 : org.id) || "";
    });
}
function getListings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const orgId = yield resolveOrgId(req);
            if (!orgId) {
                res.status(404).json({ message: "No organization found" });
                return;
            }
            const { page, pageSize, categoryId, storeId, search, minPrice, maxPrice, sortBy, } = req.query;
            const result = yield service.getListings(orgId, {
                page: page ? parseInt(page, 10) : undefined,
                pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
                categoryId: categoryId,
                storeId: storeId,
                search: search,
                minPrice: minPrice ? parseFloat(minPrice) : undefined,
                maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                sortBy: sortBy,
            });
            res.json(result);
        }
        catch (error) {
            console.error("[ecommerce] getListings error:", error);
            res.status(500).json({ message: "Failed to fetch listings" });
        }
    });
}
function getListingById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const orgId = yield resolveOrgId(req);
            if (!orgId) {
                res.status(404).json({ message: "No organization found" });
                return;
            }
            const listingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const listing = yield service.getListingById(orgId, listingId);
            if (!listing) {
                res.status(404).json({ message: "Listing not found" });
                return;
            }
            res.json(listing);
        }
        catch (error) {
            console.error("[ecommerce] getListingById error:", error);
            res.status(500).json({ message: "Failed to fetch listing" });
        }
    });
}
function getCategories(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const orgId = yield resolveOrgId(req);
            if (!orgId) {
                res.status(404).json({ message: "No organization found" });
                return;
            }
            const storeId = req.query.storeId;
            const categories = yield service.getCategories(orgId, storeId);
            res.json(categories);
        }
        catch (error) {
            console.error("[ecommerce] getCategories error:", error);
            res.status(500).json({ message: "Failed to fetch categories" });
        }
    });
}
function getStores(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const orgId = yield resolveOrgId(req);
            if (!orgId) {
                res.status(404).json({ message: "No organization found" });
                return;
            }
            const stores = yield service.getStores(orgId);
            res.json(stores);
        }
        catch (error) {
            console.error("[ecommerce] getStores error:", error);
            res.status(500).json({ message: "Failed to fetch stores" });
        }
    });
}
function getFeaturedListings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const orgId = yield resolveOrgId(req);
            if (!orgId) {
                res.status(404).json({ message: "No organization found" });
                return;
            }
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 8;
            const listings = yield service.getFeaturedListings(orgId, limit);
            res.json(listings);
        }
        catch (error) {
            console.error("[ecommerce] getFeaturedListings error:", error);
            res.status(500).json({ message: "Failed to fetch featured listings" });
        }
    });
}
