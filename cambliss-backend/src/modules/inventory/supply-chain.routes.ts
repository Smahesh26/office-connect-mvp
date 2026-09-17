import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import {
	getSupplyChainOverviewController,
	syncCommerceOrderStockController,
	triggerAutoReorderController,
} from "./supply-chain.controller";

const router = Router();

// Cross-Module Supply Chain endpoints
router.get("/overview", authenticateJWT, getSupplyChainOverviewController);
router.post("/sync-order", authenticateJWT, syncCommerceOrderStockController);
router.post("/auto-reorder", authenticateJWT, triggerAutoReorderController);

export default router;
