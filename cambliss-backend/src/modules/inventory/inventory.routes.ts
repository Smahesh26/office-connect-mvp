import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { moduleGuard } from "../../middleware/module.middleware";
import { requireActiveSubscription } from "../../middleware/subscription.middleware";
import {
	addStockController,
	adjustStockController,
	approvePurchaseOrderController,
	createVendorController,
	createProductController,
	createPurchaseOrderController,
	createGatePassController,
	createWarehouseController,
	deleteVendorController,
	exportStockLedgerController,
	getGatePassesController,
	getInventoryAuditController,
	getProductsController,
	getPurchaseOrdersController,
	getReorderSuggestionsController,
	getStockMovementsController,
	getStockSummaryController,
	getVendorsController,
	getWarehousesController,
	receivePurchaseOrderController,
	returnPurchaseOrderController,
	reduceStockController,
	transferStockController,
	updateDraftPurchaseOrderItemsController,
	updateGatePassStatusController,
	updateProductSettingsController,
	updateVendorController,
} from "./inventory.controller";

const inventoryRouter = Router();

inventoryRouter.use(authenticateJWT, requireActiveSubscription, moduleGuard("INVENTORY"));

inventoryRouter.post("/products", createProductController);
inventoryRouter.get("/products", getProductsController);
inventoryRouter.put("/products/:id/settings", updateProductSettingsController);
inventoryRouter.post("/warehouses", createWarehouseController);
inventoryRouter.get("/warehouses", getWarehousesController);
inventoryRouter.post("/vendors", createVendorController);
inventoryRouter.get("/vendors", getVendorsController);
inventoryRouter.put("/vendors/:id", updateVendorController);
inventoryRouter.delete("/vendors/:id", deleteVendorController);
inventoryRouter.post("/gate-passes", createGatePassController);
inventoryRouter.get("/gate-passes", getGatePassesController);
inventoryRouter.patch("/gate-passes/:id/status", updateGatePassStatusController);
inventoryRouter.post("/purchase", createPurchaseOrderController);
inventoryRouter.put("/purchase/:id/items", updateDraftPurchaseOrderItemsController);
inventoryRouter.post("/purchase/:id/approve", approvePurchaseOrderController);
inventoryRouter.post("/purchase/:id/receive", receivePurchaseOrderController);
inventoryRouter.post("/purchase/:id/return", returnPurchaseOrderController);
inventoryRouter.get("/purchase", getPurchaseOrdersController);

inventoryRouter.post("/stock/add", addStockController);
inventoryRouter.post("/stock/reduce", reduceStockController);
inventoryRouter.post("/stock/transfer", transferStockController);
inventoryRouter.post("/stock/adjust", adjustStockController);

inventoryRouter.get("/stock/summary", getStockSummaryController);
inventoryRouter.get("/stock/reorder-suggestions", getReorderSuggestionsController);
inventoryRouter.get("/stock/movements", getStockMovementsController);
inventoryRouter.get("/stock/ledger/export", exportStockLedgerController);
inventoryRouter.get("/audit", getInventoryAuditController);

export default inventoryRouter;
