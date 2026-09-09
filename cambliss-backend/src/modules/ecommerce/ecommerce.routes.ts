import { Router } from "express";
import {
  getListings,
  getListingById,
  getCategories,
  getStores,
  getFeaturedListings,
} from "./ecommerce.controller";

import sellerOnboardingRoutes from "./seller-onboarding.routes";

const router = Router();

// Public storefront APIs — no auth required
router.get("/listings", getListings);
router.get("/listings/featured", getFeaturedListings);
router.get("/listings/:id", getListingById);
router.get("/categories", getCategories);
router.get("/stores", getStores);

// Merchant KYB & Seller Onboarding
router.use("/seller-onboarding", sellerOnboardingRoutes);

export default router;
