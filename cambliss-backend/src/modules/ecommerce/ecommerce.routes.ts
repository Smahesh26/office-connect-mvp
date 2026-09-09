import { Router } from "express";
import {
  getListings,
  getListingById,
  getCategories,
  getStores,
  getFeaturedListings,
} from "./ecommerce.controller";

import sellerOnboardingRoutes from "./seller-onboarding.routes";
import marketplaceFinanceRoutes from "./marketplace-finance.routes";
import storefrontAuthRoutes from "./storefront-auth.routes";

const router = Router();

// Public storefront APIs — no auth required
router.get("/listings", getListings);
router.get("/listings/featured", getFeaturedListings);
router.get("/listings/:id", getListingById);
router.get("/categories", getCategories);
router.get("/stores", getStores);

// Storefront Auth (Dedicated Merchant & Customer Registration/Login)
router.use("/auth", storefrontAuthRoutes);

// Merchant KYB & Seller Onboarding
router.use("/seller-onboarding", sellerOnboardingRoutes);

// Marketplace Financial Ledger, Orders, Settlements, Refunds & KYC Desk
router.use("/finance", marketplaceFinanceRoutes);

export default router;
