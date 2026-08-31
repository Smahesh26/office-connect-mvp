import { Router } from "express";
import {
  getListings,
  getListingById,
  getCategories,
  getStores,
  getFeaturedListings,
} from "./ecommerce.controller";

const router = Router();

// Public storefront APIs — no auth required
router.get("/listings", getListings);
router.get("/listings/featured", getFeaturedListings);
router.get("/listings/:id", getListingById);
router.get("/categories", getCategories);
router.get("/stores", getStores);

export default router;
