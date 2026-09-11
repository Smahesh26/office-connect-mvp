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
exports.EcommerceService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../config/prisma"));
class EcommerceService {
    /**
     * Get active product listings for the storefront.
     * Joins Product + Store + Category for display.
     */
    getListings(organizationId, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, pageSize = 24, categoryId, storeId, search, minPrice, maxPrice, sortBy = "newest", } = params;
            const where = {
                organizationId,
                isActive: true,
                product: { isActive: true },
                store: { isActive: true },
            };
            if (categoryId) {
                where.categoryId = categoryId;
            }
            if (storeId) {
                where.storeId = storeId;
            }
            if (search) {
                where.OR = [
                    { product: { name: { contains: search, mode: "insensitive" } } },
                    { description: { contains: search, mode: "insensitive" } },
                    { product: { sku: { contains: search, mode: "insensitive" } } },
                ];
            }
            if (minPrice !== undefined || maxPrice !== undefined) {
                where.sellingPrice = {};
                if (minPrice !== undefined) {
                    where.sellingPrice.gte = new client_1.Prisma.Decimal(minPrice);
                }
                if (maxPrice !== undefined) {
                    where.sellingPrice.lte = new client_1.Prisma.Decimal(maxPrice);
                }
            }
            let orderBy;
            switch (sortBy) {
                case "price_asc":
                    orderBy = { sellingPrice: "asc" };
                    break;
                case "price_desc":
                    orderBy = { sellingPrice: "desc" };
                    break;
                case "name":
                    orderBy = { product: { name: "asc" } };
                    break;
                case "newest":
                default:
                    orderBy = { createdAt: "desc" };
                    break;
            }
            const skip = (page - 1) * pageSize;
            const [listings, total] = yield Promise.all([
                prisma_1.default.productListing.findMany({
                    where,
                    orderBy,
                    skip,
                    take: pageSize,
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                hsnCode: true,
                                description: true,
                                isActive: true,
                            },
                        },
                        store: {
                            select: {
                                id: true,
                                name: true,
                                domain: true,
                                description: true,
                                sellerTier: true,
                                isFeatured: true,
                                isActive: true,
                            },
                        },
                        category: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                image: true,
                                parentId: true,
                            },
                        },
                    },
                }),
                prisma_1.default.productListing.count({ where }),
            ]);
            return {
                data: listings,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        });
    }
    /**
     * Get a single product listing by ID.
     */
    getListingById(organizationId, listingId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.productListing.findFirst({
                where: {
                    id: listingId,
                    organizationId,
                    isActive: true,
                },
                include: {
                    product: true,
                    store: {
                        select: {
                            id: true,
                            name: true,
                            domain: true,
                            description: true,
                            sellerTier: true,
                            isFeatured: true,
                        },
                    },
                    category: true,
                },
            });
        });
    }
    /**
     * Get all categories for a given organization, with product counts.
     */
    getCategories(organizationId, storeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {
                organizationId,
            };
            if (storeId) {
                where.storeId = storeId;
            }
            const categories = yield prisma_1.default.category.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            productListings: {
                                where: { isActive: true },
                            },
                        },
                    },
                    children: {
                        include: {
                            _count: {
                                select: {
                                    productListings: {
                                        where: { isActive: true },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { name: "asc" },
            });
            return categories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                description: cat.description,
                image: cat.image,
                parentId: cat.parentId,
                productCount: cat._count.productListings,
                children: cat.children.map((child) => ({
                    id: child.id,
                    name: child.name,
                    description: child.description,
                    image: child.image,
                    parentId: child.parentId,
                    productCount: child._count.productListings,
                })),
            }));
        });
    }
    /**
     * Get all active stores.
     */
    getStores(organizationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.store.findMany({
                where: {
                    organizationId,
                    isActive: true,
                },
                select: {
                    id: true,
                    name: true,
                    domain: true,
                    description: true,
                    sellerTier: true,
                    isFeatured: true,
                    isActive: true,
                    createdAt: true,
                    _count: {
                        select: {
                            productListings: {
                                where: { isActive: true },
                            },
                        },
                    },
                },
                orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
            });
        });
    }
    /**
     * Get featured/promoted listings for the homepage.
     */
    getFeaturedListings(organizationId_1) {
        return __awaiter(this, arguments, void 0, function* (organizationId, limit = 8) {
            return prisma_1.default.productListing.findMany({
                where: {
                    organizationId,
                    isActive: true,
                    product: { isActive: true },
                    store: { isActive: true, isFeatured: true },
                },
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                            description: true,
                        },
                    },
                    store: {
                        select: {
                            id: true,
                            name: true,
                            sellerTier: true,
                        },
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
        });
    }
}
exports.EcommerceService = EcommerceService;
