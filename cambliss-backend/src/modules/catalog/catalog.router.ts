import { Router } from "express";
import { catalogController } from "./catalog.controller";

const router = Router();

// Taxonomy & Brand registries
router.get("/categories", (req, res) => catalogController.getCategories(req, res));
router.get("/brands", (req, res) => catalogController.getBrands(req, res));

// Products & PDP
router.get("/products", (req, res) => catalogController.getProducts(req, res));
router.get("/products/:identifier", (req, res) => catalogController.getProductDetails(req, res));

// Admin & Seller creation, update & delete endpoints
router.post("/products", (req, res) => catalogController.createMasterProduct(req, res));
router.put("/products/:id", (req, res) => catalogController.updateProduct(req, res));
router.delete("/products/:id", (req, res) => catalogController.deleteProduct(req, res));
router.post("/listings", (req, res) => catalogController.createSellerListing(req, res));

export default router;
