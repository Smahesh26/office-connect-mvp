"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const catalog_controller_1 = require("./catalog.controller");
const router = (0, express_1.Router)();
// Taxonomy & Brand registries
router.get("/categories", (req, res) => catalog_controller_1.catalogController.getCategories(req, res));
router.get("/brands", (req, res) => catalog_controller_1.catalogController.getBrands(req, res));
// Products & PDP
router.get("/products", (req, res) => catalog_controller_1.catalogController.getProducts(req, res));
router.get("/products/:identifier", (req, res) => catalog_controller_1.catalogController.getProductDetails(req, res));
// Admin & Seller creation endpoints
router.post("/products", (req, res) => catalog_controller_1.catalogController.createMasterProduct(req, res));
router.post("/listings", (req, res) => catalog_controller_1.catalogController.createSellerListing(req, res));
exports.default = router;
