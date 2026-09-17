"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const supply_chain_controller_1 = require("./supply-chain.controller");
const router = (0, express_1.Router)();
// Cross-Module Supply Chain endpoints
router.get("/overview", auth_middleware_1.authenticateJWT, supply_chain_controller_1.getSupplyChainOverviewController);
router.post("/sync-order", auth_middleware_1.authenticateJWT, supply_chain_controller_1.syncCommerceOrderStockController);
router.post("/auto-reorder", auth_middleware_1.authenticateJWT, supply_chain_controller_1.triggerAutoReorderController);
exports.default = router;
