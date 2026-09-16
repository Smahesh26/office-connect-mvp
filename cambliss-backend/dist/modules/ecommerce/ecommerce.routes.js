"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ecommerce_controller_1 = require("./ecommerce.controller");
const seller_onboarding_routes_1 = __importDefault(require("./seller-onboarding.routes"));
const marketplace_finance_routes_1 = __importDefault(require("./marketplace-finance.routes"));
const storefront_auth_routes_1 = __importDefault(require("./storefront-auth.routes"));
const router = (0, express_1.Router)();
// Public storefront APIs — no auth required
router.get("/listings", ecommerce_controller_1.getListings);
router.get("/listings/featured", ecommerce_controller_1.getFeaturedListings);
router.get("/listings/:id", ecommerce_controller_1.getListingById);
router.get("/categories", ecommerce_controller_1.getCategories);
router.get("/stores", ecommerce_controller_1.getStores);
// Merchant Product / Listing Management
router.post("/listings", ecommerce_controller_1.createListing);
router.post("/products", ecommerce_controller_1.createListing);
router.put("/listings/:id", ecommerce_controller_1.updateListing);
router.delete("/listings/:id", ecommerce_controller_1.deleteListing);
router.put("/products/:id", ecommerce_controller_1.updateListing);
router.delete("/products/:id", ecommerce_controller_1.deleteListing);
// Storefront Auth (Dedicated Merchant & Customer Registration/Login)
router.use("/auth", storefront_auth_routes_1.default);
// Merchant KYB & Seller Onboarding
router.use("/seller-onboarding", seller_onboarding_routes_1.default);
// Marketplace Financial Ledger, Orders, Settlements, Refunds & KYC Desk
router.use("/finance", marketplace_finance_routes_1.default);
exports.default = router;
