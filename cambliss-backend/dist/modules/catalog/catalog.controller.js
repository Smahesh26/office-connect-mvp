"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogController = exports.CatalogController = void 0;
const catalog_service_1 = require("./catalog.service");
class CatalogController {
    // GET /api/catalog/categories
    getCategories(_req, res) {
        try {
            const categories = catalog_service_1.catalogService.getCategories();
            res.json({ success: true, data: categories });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // GET /api/catalog/brands
    getBrands(_req, res) {
        try {
            const brands = catalog_service_1.catalogService.getBrands();
            res.json({ success: true, data: brands });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // GET /api/catalog/products
    getProducts(req, res) {
        try {
            const { category, brand, search } = req.query;
            const products = catalog_service_1.catalogService.getProducts({
                category: category,
                brand: brand,
                search: search,
            });
            res.json({ success: true, count: products.length, data: products });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // GET /api/catalog/products/:identifier
    getProductDetails(req, res) {
        try {
            const identifier = Array.isArray(req.params.identifier)
                ? req.params.identifier[0]
                : req.params.identifier;
            const pdp = catalog_service_1.catalogService.getProductBySlugOrId(identifier);
            if (!pdp) {
                res.status(404).json({ success: false, message: "Product not found in master catalog" });
                return;
            }
            res.json({ success: true, data: pdp });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // POST /api/catalog/products
    createMasterProduct(req, res) {
        try {
            const product = catalog_service_1.catalogService.createMasterProduct(req.body);
            res.status(201).json({ success: true, data: product });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    // POST /api/catalog/listings
    createSellerListing(req, res) {
        try {
            const listing = catalog_service_1.catalogService.createSellerListing(req.body);
            res.status(201).json({ success: true, data: listing });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
exports.CatalogController = CatalogController;
exports.catalogController = new CatalogController();
