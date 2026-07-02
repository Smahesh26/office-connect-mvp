"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryAuditController = exports.exportStockLedgerController = exports.getReorderSuggestionsController = exports.getStockMovementsController = exports.getStockSummaryController = exports.adjustStockController = exports.transferStockController = exports.reduceStockController = exports.addStockController = exports.updateProductSettingsController = exports.deleteVendorController = exports.updateVendorController = exports.createVendorController = exports.updateGatePassStatusController = exports.getGatePassesController = exports.createGatePassController = exports.getVendorsController = exports.getWarehousesController = exports.getProductsController = exports.createWarehouseController = exports.returnPurchaseOrderController = exports.receivePurchaseOrderController = exports.getPurchaseOrdersController = exports.updateDraftPurchaseOrderItemsController = exports.approvePurchaseOrderController = exports.createPurchaseOrderController = exports.createProductController = void 0;
const inventory_service_1 = require("./inventory.service");
const handleInventoryError = (res, error) => {
    if (error instanceof inventory_service_1.InventoryError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: "Internal server error" });
};
const createProductController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const product = yield (0, inventory_service_1.createProduct)(req.user.organizationId, req.body);
        res.status(201).json(product);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.createProductController = createProductController;
const createPurchaseOrderController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { vendorId, items } = req.body;
        const purchaseOrder = yield (0, inventory_service_1.createPurchaseOrder)(req.user.organizationId, vendorId, (items !== null && items !== void 0 ? items : []));
        res.status(201).json(purchaseOrder);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.createPurchaseOrderController = createPurchaseOrderController;
const approvePurchaseOrderController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const purchaseId = String(req.params.id);
        const organizationId = String(req.user.organizationId);
        if (!purchaseId) {
            throw new inventory_service_1.InventoryError(400, "purchase id is required");
        }
        const result = yield (0, inventory_service_1.approvePurchaseOrder)(purchaseId, organizationId);
        res.status(200).json(result);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.approvePurchaseOrderController = approvePurchaseOrderController;
const updateDraftPurchaseOrderItemsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const purchaseId = String(req.params.id);
        const { items } = req.body;
        const result = yield (0, inventory_service_1.updateDraftPurchaseOrderItems)(req.user.organizationId, purchaseId, (items !== null && items !== void 0 ? items : []));
        res.status(200).json(result);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.updateDraftPurchaseOrderItemsController = updateDraftPurchaseOrderItemsController;
const getPurchaseOrdersController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const purchaseOrders = yield (0, inventory_service_1.getPurchaseOrders)(req.user.organizationId);
        res.status(200).json(purchaseOrders);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.getPurchaseOrdersController = getPurchaseOrdersController;
const receivePurchaseOrderController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const purchaseId = String(req.params.id);
        const { warehouseId, items } = req.body;
        const result = yield (0, inventory_service_1.receivePurchaseOrder)(purchaseId, req.user.organizationId, warehouseId, items);
        res.status(200).json(result);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.receivePurchaseOrderController = receivePurchaseOrderController;
const returnPurchaseOrderController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const purchaseId = String(req.params.id);
        const { warehouseId, items } = req.body;
        const result = yield (0, inventory_service_1.returnPurchaseOrder)(purchaseId, req.user.organizationId, warehouseId, items);
        res.status(200).json(result);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.returnPurchaseOrderController = returnPurchaseOrderController;
const createWarehouseController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { name, location, latitude, longitude } = req.body;
        const warehouse = yield (0, inventory_service_1.createWarehouse)(req.user.organizationId, name, location, latitude, longitude);
        res.status(201).json(warehouse);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.createWarehouseController = createWarehouseController;
const getProductsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const products = yield (0, inventory_service_1.getProducts)(req.user.organizationId);
        res.status(200).json(products);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.getProductsController = getProductsController;
const getWarehousesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const warehouses = yield (0, inventory_service_1.getWarehouses)(req.user.organizationId);
        res.status(200).json(warehouses);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.getWarehousesController = getWarehousesController;
const getVendorsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const vendors = yield (0, inventory_service_1.getVendors)(req.user.organizationId);
        res.status(200).json(vendors);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.getVendorsController = getVendorsController;
const createGatePassController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const gatePass = yield (0, inventory_service_1.createGatePass)(req.user.organizationId, req.body);
        res.status(201).json(gatePass);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.createGatePassController = createGatePassController;
const getGatePassesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const gatePasses = yield (0, inventory_service_1.getGatePasses)(req.user.organizationId);
        res.status(200).json(gatePasses);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.getGatePassesController = getGatePassesController;
const updateGatePassStatusController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const gatePassId = String(req.params.id);
        const { status } = req.body;
        const gatePass = yield (0, inventory_service_1.updateGatePassStatus)(req.user.organizationId, gatePassId, status);
        res.status(200).json(gatePass);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.updateGatePassStatusController = updateGatePassStatusController;
const createVendorController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const vendor = yield (0, inventory_service_1.createVendor)(req.user.organizationId, req.body);
        res.status(201).json(vendor);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.createVendorController = createVendorController;
const updateVendorController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const vendorId = String(req.params.id);
        const vendor = yield (0, inventory_service_1.updateVendor)(req.user.organizationId, vendorId, req.body);
        res.status(200).json(vendor);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.updateVendorController = updateVendorController;
const deleteVendorController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const vendorId = String(req.params.id);
        const vendor = yield (0, inventory_service_1.deleteVendor)(req.user.organizationId, vendorId);
        res.status(200).json(vendor);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.deleteVendorController = deleteVendorController;
const updateProductSettingsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const productId = String(req.params.id);
        const updated = yield (0, inventory_service_1.updateProductSettings)(req.user.organizationId, productId, req.body);
        res.status(200).json(updated);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.updateProductSettingsController = updateProductSettingsController;
const addStockController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { productId, warehouseId, quantity, referenceId, notes } = req.body;
        const result = yield (0, inventory_service_1.addStock)(req.user.organizationId, productId, warehouseId, Number(quantity), referenceId, notes);
        res.status(200).json(result);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.addStockController = addStockController;
const reduceStockController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { productId, warehouseId, quantity, referenceId, notes } = req.body;
        const result = yield (0, inventory_service_1.reduceStock)(req.user.organizationId, productId, warehouseId, Number(quantity), referenceId, notes);
        res.status(200).json(result);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.reduceStockController = reduceStockController;
const transferStockController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { productId, fromWarehouseId, toWarehouseId, quantity, referenceId, notes } = req.body;
        const result = yield (0, inventory_service_1.transferStock)(req.user.organizationId, productId, fromWarehouseId, toWarehouseId, Number(quantity), referenceId, notes);
        res.status(200).json(result);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.transferStockController = transferStockController;
const adjustStockController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { productId, warehouseId, newQuantity, reason, referenceId } = req.body;
        const result = yield (0, inventory_service_1.adjustStock)(req.user.organizationId, productId, warehouseId, Number(newQuantity), reason, referenceId);
        res.status(200).json(result);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.adjustStockController = adjustStockController;
const getStockSummaryController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const summary = yield (0, inventory_service_1.getInventorySummary)(req.user.organizationId);
        res.status(200).json(summary);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.getStockSummaryController = getStockSummaryController;
const getStockMovementsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const productId = typeof req.query.productId === "string" ? req.query.productId : undefined;
        const warehouseId = typeof req.query.warehouseId === "string" ? req.query.warehouseId : undefined;
        const type = typeof req.query.type === "string"
            ? req.query.type
            : undefined;
        const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
        const fromDate = typeof req.query.fromDate === "string" ? req.query.fromDate : undefined;
        const toDate = typeof req.query.toDate === "string" ? req.query.toDate : undefined;
        const movements = productId && !warehouseId && !type && !limit
            ? yield (0, inventory_service_1.getStockMovements)(productId, req.user.organizationId)
            : yield (0, inventory_service_1.getStockMovementsByOrganization)(req.user.organizationId, {
                productId,
                warehouseId,
                type,
                fromDate,
                toDate,
                limit,
            });
        res.status(200).json(movements);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.getStockMovementsController = getStockMovementsController;
const getReorderSuggestionsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const suggestions = yield (0, inventory_service_1.getReorderSuggestions)(req.user.organizationId);
        res.status(200).json(suggestions);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.getReorderSuggestionsController = getReorderSuggestionsController;
const exportStockLedgerController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const productId = typeof req.query.productId === "string" ? req.query.productId : undefined;
        const warehouseId = typeof req.query.warehouseId === "string" ? req.query.warehouseId : undefined;
        const type = typeof req.query.type === "string"
            ? req.query.type
            : undefined;
        const fromDate = typeof req.query.fromDate === "string" ? req.query.fromDate : undefined;
        const toDate = typeof req.query.toDate === "string" ? req.query.toDate : undefined;
        const csv = yield (0, inventory_service_1.exportStockLedgerCsv)(req.user.organizationId, {
            productId,
            warehouseId,
            type,
            fromDate,
            toDate,
        });
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=inventory-stock-ledger-${Date.now()}.csv`);
        res.status(200).send(csv);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.exportStockLedgerController = exportStockLedgerController;
const getInventoryAuditController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
        const audit = yield (0, inventory_service_1.getInventoryAuditFeed)(req.user.organizationId, limit);
        res.status(200).json(audit);
    }
    catch (error) {
        handleInventoryError(res, error);
    }
});
exports.getInventoryAuditController = getInventoryAuditController;
