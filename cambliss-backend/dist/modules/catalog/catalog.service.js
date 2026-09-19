"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogService = exports.CatalogService = void 0;
class CatalogService {
    constructor() {
        // In-memory catalog repository for immediate high-performance serving
        this.brands = [];
        this.categories = [
            {
                id: "cat-electronics",
                name: "Electronics & Audio",
                slug: "electronics",
                level: 1,
                gstRate: 18,
                mandatoryAttributes: ["Brand", "Model Name", "Warranty Period"],
                children: [
                    {
                        id: "cat-audio-headphones",
                        name: "Over-Ear Headphones",
                        slug: "headphones",
                        parentId: "cat-electronics",
                        level: 2,
                        gstRate: 18,
                        mandatoryAttributes: ["Form Factor", "Battery Life", "Noise Cancellation"],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "cat-apparel",
                name: "Apparel & Fashion",
                slug: "apparel",
                level: 1,
                gstRate: 12,
                mandatoryAttributes: ["Fabric Composition", "Care Instructions"],
                children: [
                    {
                        id: "cat-men-tshirts",
                        name: "Men's T-Shirts",
                        slug: "tshirts",
                        parentId: "cat-apparel",
                        level: 2,
                        gstRate: 12,
                        mandatoryAttributes: ["GSM Weight", "Fabric Composition", "Fit", "Neck Style", "Sleeve"],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];
        this.canonicalProducts = [];
        this.sellerListings = [];
    }
    // 1. Categories
    getCategories() {
        return this.categories;
    }
    getCategoryBySlug(slug) {
        return this.categories.find((c) => c.slug === slug);
    }
    // 2. Brands
    getBrands() {
        return this.brands;
    }
    getBrandBySlug(slug) {
        return this.brands.find((b) => b.slug === slug);
    }
    // 3. Products
    getProducts(filters) {
        let result = [...this.canonicalProducts].filter((p) => p.status === "APPROVED");
        if (filters === null || filters === void 0 ? void 0 : filters.brand) {
            result = result.filter((p) => { var _a, _b; return ((_a = p.brandName) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === ((_b = filters.brand) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || p.brandId === filters.brand; });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter((p) => {
                var _a;
                return p.title.toLowerCase().includes(q) ||
                    ((_a = p.brandName) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(q)) ||
                    p.description.toLowerCase().includes(q);
            });
        }
        return result;
    }
    getProductBySlugOrId(identifier) {
        const product = this.canonicalProducts.find((p) => p.id === identifier || p.slug === identifier);
        if (!product)
            return null;
        const listings = this.sellerListings.filter((l) => l.productId === product.id && l.status === "ACTIVE");
        // Compute Buy Box winner (Lowest selling price with highest rating)
        const sorted = [...listings].sort((a, b) => {
            var _a, _b;
            const priceA = ((_a = a.variants[0]) === null || _a === void 0 ? void 0 : _a.sellingPrice) || 999999;
            const priceB = ((_b = b.variants[0]) === null || _b === void 0 ? void 0 : _b.sellingPrice) || 999999;
            return priceA - priceB;
        });
        const winner = sorted[0];
        const others = sorted.slice(1);
        const winnerVariant = winner === null || winner === void 0 ? void 0 : winner.variants[0];
        const sellingPrice = (winnerVariant === null || winnerVariant === void 0 ? void 0 : winnerVariant.sellingPrice) || 29990;
        const mrp = (winnerVariant === null || winnerVariant === void 0 ? void 0 : winnerVariant.mrp) || 34990;
        return {
            product,
            buyBoxOffer: {
                sellerId: (winner === null || winner === void 0 ? void 0 : winner.sellerId) || "sel-sony-direct",
                sellerName: (winner === null || winner === void 0 ? void 0 : winner.sellerName) || "Sony India Direct",
                sellerRating: (winner === null || winner === void 0 ? void 0 : winner.sellerRating) || 4.9,
                sellingPrice,
                mrp,
                discountPercent: Math.round(((mrp - sellingPrice) / mrp) * 100),
                stockAvailable: (winnerVariant === null || winnerVariant === void 0 ? void 0 : winnerVariant.stockAvailable) || 24,
                deliveryEstimate: "Tomorrow by 2:00 PM",
                dispatchSla: "Express 24-Hour Dispatch",
            },
            otherSellerOffers: others.map((o) => {
                var _a, _b, _c;
                return ({
                    sellerId: o.sellerId,
                    sellerName: o.sellerName,
                    sellerRating: o.sellerRating,
                    sellingPrice: ((_a = o.variants[0]) === null || _a === void 0 ? void 0 : _a.sellingPrice) || sellingPrice,
                    mrp: ((_b = o.variants[0]) === null || _b === void 0 ? void 0 : _b.mrp) || mrp,
                    warrantyMonths: o.warrantyMonths,
                    stockAvailable: ((_c = o.variants[0]) === null || _c === void 0 ? void 0 : _c.stockAvailable) || 5,
                });
            }),
            allListings: listings,
        };
    }
    // 4. Create Canonical Master Product
    createMasterProduct(dto) {
        const newProduct = {
            id: `prod-${Date.now()}`,
            title: dto.title || "Untitled Product",
            slug: (dto.title || "untitled-product").toLowerCase().replace(/\s+/g, "-"),
            brandId: dto.brandId || "brand-custom",
            brandName: dto.brandName || "Custom Brand",
            categoryId: dto.categoryId || "cat-electronics",
            categoryName: dto.categoryName || "General",
            description: dto.description || "",
            shortDescription: dto.shortDescription || "",
            hsnCode: dto.hsnCode || "85183000",
            countryOfOrigin: dto.countryOfOrigin || "India",
            primaryImage: dto.primaryImage || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
            galleryImages: dto.galleryImages || [],
            status: "APPROVED",
            attributes: dto.attributes || [],
            variants: dto.variants || [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.canonicalProducts.unshift(newProduct);
        return newProduct;
    }
    // 5. Create Seller Listing Offer
    createSellerListing(dto) {
        const newListing = {
            id: `list-${Date.now()}`,
            sellerId: dto.sellerId || "sel-merchant",
            sellerName: dto.sellerName || "Verified Merchant",
            sellerRating: 4.8,
            productId: dto.productId || "prod-1",
            status: "ACTIVE",
            warrantyMonths: dto.warrantyMonths || 12,
            returnPolicyDays: dto.returnPolicyDays || 7,
            isBuyBoxWinner: true,
            variants: dto.variants || [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.sellerListings.push(newListing);
        return newListing;
    }
    // 6. Update Canonical Master Product
    updateProduct(id, dto) {
        const index = this.canonicalProducts.findIndex((p) => p.id === id || p.slug === id);
        if (index === -1) {
            return null;
        }
        const current = this.canonicalProducts[index];
        const updated = Object.assign(Object.assign(Object.assign({}, current), dto), { id: current.id, updatedAt: new Date() });
        if (dto.title && !dto.slug) {
            updated.slug = dto.title.toLowerCase().replace(/\s+/g, "-");
        }
        this.canonicalProducts[index] = updated;
        if (dto.variants && dto.variants.length > 0) {
            const listing = this.sellerListings.find((l) => l.productId === current.id);
            if (listing) {
                listing.variants = dto.variants;
                listing.updatedAt = new Date();
            }
        }
        return updated;
    }
    // 7. Delete Canonical Master Product
    deleteProduct(id) {
        const index = this.canonicalProducts.findIndex((p) => p.id === id || p.slug === id);
        if (index === -1) {
            return false;
        }
        const targetId = this.canonicalProducts[index].id;
        this.canonicalProducts.splice(index, 1);
        // Also remove associated seller listings
        this.sellerListings = this.sellerListings.filter((l) => l.productId !== targetId);
        return true;
    }
}
exports.CatalogService = CatalogService;
exports.catalogService = new CatalogService();
