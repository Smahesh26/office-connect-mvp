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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryAuditFeed = exports.exportStockLedgerCsv = exports.getReorderSuggestions = exports.getStockMovementsByOrganization = exports.getStockMovements = exports.getStockSummary = exports.getInventorySummary = exports.adjustStock = exports.transferStock = exports.reduceStockWithDb = exports.reduceStock = exports.addStock = exports.getPurchaseOrders = exports.returnPurchaseOrder = exports.receivePurchaseOrder = exports.approvePurchaseOrder = exports.updateDraftPurchaseOrderItems = exports.createPurchaseOrder = exports.updateGatePassStatus = exports.getGatePasses = exports.createGatePass = exports.deleteVendor = exports.updateVendor = exports.createVendor = exports.getVendors = exports.getWarehouses = exports.getProducts = exports.createWarehouse = exports.updateProductSettings = exports.createProduct = exports.InventoryError = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const client_1 = require("@prisma/client");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const accounting_service_1 = require("../accounting/accounting.service");
class InventoryError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "InventoryError";
    }
}
exports.InventoryError = InventoryError;
const INVENTORY_META_FILE_PATH = node_path_1.default.join(process.cwd(), "data", "inventory-meta.json");
const ensureInventoryMetaStoreExists = () => __awaiter(void 0, void 0, void 0, function* () {
    const directory = node_path_1.default.dirname(INVENTORY_META_FILE_PATH);
    yield promises_1.default.mkdir(directory, { recursive: true });
    try {
        yield promises_1.default.access(INVENTORY_META_FILE_PATH);
    }
    catch (_a) {
        const initial = { productSettings: {} };
        yield promises_1.default.writeFile(INVENTORY_META_FILE_PATH, JSON.stringify(initial, null, 2), "utf-8");
    }
});
const loadInventoryMetaStore = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield ensureInventoryMetaStoreExists();
    try {
        const raw = yield promises_1.default.readFile(INVENTORY_META_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        return {
            productSettings: (_a = parsed.productSettings) !== null && _a !== void 0 ? _a : {},
        };
    }
    catch (_b) {
        return { productSettings: {} };
    }
});
const saveInventoryMetaStore = (store) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureInventoryMetaStoreExists();
    yield promises_1.default.writeFile(INVENTORY_META_FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
});
const normalizeProductInventorySettings = (input) => {
    var _a, _b;
    if (!input) {
        return undefined;
    }
    const category = ((_a = input.category) === null || _a === void 0 ? void 0 : _a.trim()) || undefined;
    const unit = ((_b = input.unit) === null || _b === void 0 ? void 0 : _b.trim()) || undefined;
    const reorderLevel = typeof input.reorderLevel === "number" && Number.isInteger(input.reorderLevel) && input.reorderLevel >= 0
        ? input.reorderLevel
        : undefined;
    if (!category && !unit && reorderLevel === undefined) {
        return undefined;
    }
    return { category, unit, reorderLevel };
};
const ensurePositiveQuantity = (quantity) => {
    if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new InventoryError(400, "quantity must be a positive integer");
    }
};
const validateLatitudeLongitude = (latitude, longitude) => {
    if (latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
        throw new InventoryError(400, "latitude must be between -90 and 90");
    }
    if (longitude !== undefined && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
        throw new InventoryError(400, "longitude must be between -180 and 180");
    }
    if ((latitude === undefined) !== (longitude === undefined)) {
        throw new InventoryError(400, "Provide both latitude and longitude together");
    }
};
const validateOrganization = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const organization = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!organization) {
        throw new InventoryError(404, "Organization not found");
    }
});
const validateProductInOrg = (productId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield prisma_1.default.product.findUnique({
        where: { id: productId },
        select: {
            id: true,
            organizationId: true,
            name: true,
            sku: true,
            isActive: true,
        },
    });
    if (!product) {
        throw new InventoryError(404, "Product not found");
    }
    if (product.organizationId !== organizationId) {
        throw new InventoryError(403, "Product does not belong to this organization");
    }
    if (!product.isActive) {
        throw new InventoryError(400, "Product is inactive");
    }
    return product;
});
const validateProduct = validateProductInOrg;
const validateWarehouseInOrg = (warehouseId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const warehouse = yield prisma_1.default.warehouse.findUnique({
        where: { id: warehouseId },
        select: {
            id: true,
            organizationId: true,
            name: true,
        },
    });
    if (!warehouse) {
        throw new InventoryError(404, "Warehouse not found");
    }
    if (warehouse.organizationId !== organizationId) {
        throw new InventoryError(403, "Warehouse does not belong to this organization");
    }
    return warehouse;
});
const validateWarehouse = validateWarehouseInOrg;
const getOrCreateStockItem = (productId_1, warehouseId_1, ...args_1) => __awaiter(void 0, [productId_1, warehouseId_1, ...args_1], void 0, function* (productId, warehouseId, db = prisma_1.default) {
    const existing = yield db.stockItem.findUnique({
        where: {
            productId_warehouseId: {
                productId,
                warehouseId,
            },
        },
    });
    if (existing) {
        return existing;
    }
    return db.stockItem.create({
        data: {
            productId,
            warehouseId,
            quantity: 0,
        },
    });
});
const createMovement = (organizationId, productId, warehouseId, type, quantity, referenceId, notes) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.stockMovement.create({
        data: {
            organizationId,
            productId,
            warehouseId,
            type,
            quantity,
            referenceId,
            notes,
        },
    });
});
const createProduct = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield validateOrganization(organizationId);
    if (!((_a = input.name) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new InventoryError(400, "name is required");
    }
    if (!((_b = input.sku) === null || _b === void 0 ? void 0 : _b.trim())) {
        throw new InventoryError(400, "sku is required");
    }
    if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
        throw new InventoryError(400, "unitPrice must be a non-negative number");
    }
    if (input.costPrice !== undefined && (!Number.isFinite(input.costPrice) || input.costPrice < 0)) {
        throw new InventoryError(400, "costPrice must be a non-negative number");
    }
    if (input.taxRate !== undefined && (!Number.isFinite(input.taxRate) || input.taxRate < 0)) {
        throw new InventoryError(400, "taxRate must be a non-negative number");
    }
    if (input.reorderLevel !== undefined && (!Number.isInteger(input.reorderLevel) || input.reorderLevel < 0)) {
        throw new InventoryError(400, "reorderLevel must be a non-negative integer");
    }
    const createdProduct = yield prisma_1.default.product.create({
        data: {
            organizationId,
            name: input.name.trim(),
            sku: input.sku.trim(),
            description: input.description,
            unitPrice: input.unitPrice,
            costPrice: input.costPrice,
            taxRate: input.taxRate,
        },
    });
    const normalizedSettings = normalizeProductInventorySettings({
        category: input.category,
        unit: input.unit,
        reorderLevel: input.reorderLevel,
    });
    if (normalizedSettings) {
        const store = yield loadInventoryMetaStore();
        store.productSettings[createdProduct.id] = normalizedSettings;
        yield saveInventoryMetaStore(store);
    }
    return Object.assign(Object.assign({}, createdProduct), (normalizedSettings !== null && normalizedSettings !== void 0 ? normalizedSettings : {}));
});
exports.createProduct = createProduct;
const updateProductSettings = (organizationId, productId, settings) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield validateOrganization(organizationId);
    yield validateProduct(productId, organizationId);
    if (settings.reorderLevel !== undefined &&
        (!Number.isInteger(settings.reorderLevel) || settings.reorderLevel < 0)) {
        throw new InventoryError(400, "reorderLevel must be a non-negative integer");
    }
    const store = yield loadInventoryMetaStore();
    const normalized = normalizeProductInventorySettings(settings);
    if (normalized) {
        store.productSettings[productId] = normalized;
    }
    else {
        delete store.productSettings[productId];
    }
    yield saveInventoryMetaStore(store);
    const product = yield prisma_1.default.product.findUnique({ where: { id: productId } });
    if (!product) {
        throw new InventoryError(404, "Product not found");
    }
    return Object.assign(Object.assign({}, product), ((_a = store.productSettings[productId]) !== null && _a !== void 0 ? _a : {}));
});
exports.updateProductSettings = updateProductSettings;
const createWarehouse = (organizationId, name, location, latitude, longitude) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    if (!(name === null || name === void 0 ? void 0 : name.trim())) {
        throw new InventoryError(400, "name is required");
    }
    validateLatitudeLongitude(latitude, longitude);
    return prisma_1.default.warehouse.create({
        data: {
            organizationId,
            name: name.trim(),
            location,
            latitude,
            longitude,
        },
    });
});
exports.createWarehouse = createWarehouse;
const getProducts = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    const store = yield loadInventoryMetaStore();
    const products = yield prisma_1.default.product.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
    });
    return products.map((product) => {
        var _a;
        return (Object.assign(Object.assign({}, product), ((_a = store.productSettings[product.id]) !== null && _a !== void 0 ? _a : {})));
    });
});
exports.getProducts = getProducts;
const getWarehouses = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    return prisma_1.default.warehouse.findMany({
        where: { organizationId },
        orderBy: { name: "asc" },
    });
});
exports.getWarehouses = getWarehouses;
const getVendors = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    return prisma_1.default.contact.findMany({
        where: {
            organizationId,
            type: "VENDOR",
            isActive: true,
        },
        select: {
            id: true,
            companyName: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
        },
        orderBy: { createdAt: "desc" },
    });
});
exports.getVendors = getVendors;
const createVendor = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    yield validateOrganization(organizationId);
    if (!((_a = input.companyName) === null || _a === void 0 ? void 0 : _a.trim()) && !((_b = input.firstName) === null || _b === void 0 ? void 0 : _b.trim()) && !((_c = input.lastName) === null || _c === void 0 ? void 0 : _c.trim())) {
        throw new InventoryError(400, "Provide companyName or vendor name");
    }
    return prisma_1.default.contact.create({
        data: {
            organizationId,
            type: client_1.ContactType.VENDOR,
            companyName: ((_d = input.companyName) === null || _d === void 0 ? void 0 : _d.trim()) || undefined,
            firstName: ((_e = input.firstName) === null || _e === void 0 ? void 0 : _e.trim()) || undefined,
            lastName: ((_f = input.lastName) === null || _f === void 0 ? void 0 : _f.trim()) || undefined,
            email: ((_g = input.email) === null || _g === void 0 ? void 0 : _g.trim()) || undefined,
            phone: ((_h = input.phone) === null || _h === void 0 ? void 0 : _h.trim()) || undefined,
            gstNumber: ((_j = input.gstNumber) === null || _j === void 0 ? void 0 : _j.trim()) || undefined,
            panNumber: ((_k = input.panNumber) === null || _k === void 0 ? void 0 : _k.trim()) || undefined,
            state: ((_l = input.state) === null || _l === void 0 ? void 0 : _l.trim()) || undefined,
            stateCode: ((_m = input.stateCode) === null || _m === void 0 ? void 0 : _m.trim()) || undefined,
            billingAddress: ((_o = input.billingAddress) === null || _o === void 0 ? void 0 : _o.trim()) || undefined,
            shippingAddress: ((_p = input.shippingAddress) === null || _p === void 0 ? void 0 : _p.trim()) || undefined,
        },
    });
});
exports.createVendor = createVendor;
const updateVendor = (organizationId, vendorId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    yield validateOrganization(organizationId);
    const vendor = yield prisma_1.default.contact.findUnique({
        where: { id: vendorId },
        select: { id: true, organizationId: true, type: true },
    });
    if (!vendor) {
        throw new InventoryError(404, "Vendor not found");
    }
    if (vendor.organizationId !== organizationId) {
        throw new InventoryError(403, "Vendor does not belong to this organization");
    }
    if (vendor.type !== client_1.ContactType.VENDOR) {
        throw new InventoryError(400, "Contact is not a vendor");
    }
    return prisma_1.default.contact.update({
        where: { id: vendorId },
        data: Object.assign({ companyName: ((_a = input.companyName) === null || _a === void 0 ? void 0 : _a.trim()) || undefined, firstName: ((_b = input.firstName) === null || _b === void 0 ? void 0 : _b.trim()) || undefined, lastName: ((_c = input.lastName) === null || _c === void 0 ? void 0 : _c.trim()) || undefined, email: ((_d = input.email) === null || _d === void 0 ? void 0 : _d.trim()) || undefined, phone: ((_e = input.phone) === null || _e === void 0 ? void 0 : _e.trim()) || undefined, gstNumber: ((_f = input.gstNumber) === null || _f === void 0 ? void 0 : _f.trim()) || undefined, panNumber: ((_g = input.panNumber) === null || _g === void 0 ? void 0 : _g.trim()) || undefined, state: ((_h = input.state) === null || _h === void 0 ? void 0 : _h.trim()) || undefined, stateCode: ((_j = input.stateCode) === null || _j === void 0 ? void 0 : _j.trim()) || undefined, billingAddress: ((_k = input.billingAddress) === null || _k === void 0 ? void 0 : _k.trim()) || undefined, shippingAddress: ((_l = input.shippingAddress) === null || _l === void 0 ? void 0 : _l.trim()) || undefined }, (typeof input.isActive === "boolean" ? { isActive: input.isActive } : {})),
    });
});
exports.updateVendor = updateVendor;
const deleteVendor = (organizationId, vendorId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    const vendor = yield prisma_1.default.contact.findUnique({
        where: { id: vendorId },
        select: { id: true, organizationId: true, type: true },
    });
    if (!vendor) {
        throw new InventoryError(404, "Vendor not found");
    }
    if (vendor.organizationId !== organizationId) {
        throw new InventoryError(403, "Vendor does not belong to this organization");
    }
    if (vendor.type !== client_1.ContactType.VENDOR) {
        throw new InventoryError(400, "Contact is not a vendor");
    }
    return prisma_1.default.contact.update({
        where: { id: vendorId },
        data: { isActive: false },
    });
});
exports.deleteVendor = deleteVendor;
const generateGatePassNumber = () => {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    const d = String(now.getUTCDate()).padStart(2, "0");
    const suffix = Math.floor(Math.random() * 9000 + 1000);
    return `GP-${y}${m}${d}-${suffix}`;
};
const createGatePass = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    yield validateOrganization(organizationId);
    if (!["INWARD", "OUTWARD"].includes(input.type)) {
        throw new InventoryError(400, "type must be INWARD or OUTWARD");
    }
    if (!((_a = input.warehouseId) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new InventoryError(400, "warehouseId is required");
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
        throw new InventoryError(400, "items must be a non-empty array");
    }
    yield validateWarehouse(input.warehouseId, organizationId);
    for (const item of input.items) {
        if (!((_b = item.productId) === null || _b === void 0 ? void 0 : _b.trim())) {
            throw new InventoryError(400, "productId is required for each gate pass item");
        }
        ensurePositiveQuantity(item.quantity);
        yield validateProduct(item.productId, organizationId);
    }
    let passNumber = generateGatePassNumber();
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const existing = yield prisma_1.default.gatePass.findFirst({
            where: { organizationId, passNumber },
            select: { id: true },
        });
        if (!existing) {
            break;
        }
        passNumber = generateGatePassNumber();
    }
    return prisma_1.default.gatePass.create({
        data: {
            organizationId,
            passNumber,
            type: input.type,
            status: "OPEN",
            warehouseId: input.warehouseId,
            vehicleNumber: ((_c = input.vehicleNumber) === null || _c === void 0 ? void 0 : _c.trim()) || undefined,
            driverName: ((_d = input.driverName) === null || _d === void 0 ? void 0 : _d.trim()) || undefined,
            referenceType: ((_e = input.referenceType) === null || _e === void 0 ? void 0 : _e.trim()) || undefined,
            referenceId: ((_f = input.referenceId) === null || _f === void 0 ? void 0 : _f.trim()) || undefined,
            notes: ((_g = input.notes) === null || _g === void 0 ? void 0 : _g.trim()) || undefined,
            items: {
                create: input.items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),
            },
        },
        include: {
            warehouse: { select: { id: true, name: true } },
            items: {
                include: {
                    product: {
                        select: { id: true, name: true, sku: true },
                    },
                },
            },
        },
    });
});
exports.createGatePass = createGatePass;
const getGatePasses = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    return prisma_1.default.gatePass.findMany({
        where: { organizationId },
        include: {
            warehouse: { select: { id: true, name: true } },
            items: {
                include: {
                    product: {
                        select: { id: true, name: true, sku: true },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
});
exports.getGatePasses = getGatePasses;
const updateGatePassStatus = (organizationId, gatePassId, status) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    if (!["OPEN", "CLOSED", "CANCELLED"].includes(status)) {
        throw new InventoryError(400, "status must be OPEN, CLOSED, or CANCELLED");
    }
    const gatePass = yield prisma_1.default.gatePass.findUnique({
        where: { id: gatePassId },
        select: { id: true, organizationId: true, status: true },
    });
    if (!gatePass) {
        throw new InventoryError(404, "Gate pass not found");
    }
    if (gatePass.organizationId !== organizationId) {
        throw new InventoryError(403, "Gate pass does not belong to this organization");
    }
    if (gatePass.status === "CANCELLED") {
        throw new InventoryError(400, "Cancelled gate pass cannot be updated");
    }
    return prisma_1.default.gatePass.update({
        where: { id: gatePassId },
        data: {
            status,
            closedAt: status === "CLOSED" ? new Date() : null,
        },
        include: {
            warehouse: { select: { id: true, name: true } },
            items: {
                include: {
                    product: { select: { id: true, name: true, sku: true } },
                },
            },
        },
    });
});
exports.updateGatePassStatus = updateGatePassStatus;
const mergeDuplicatePurchaseItems = (items) => {
    const merged = new Map();
    for (const item of items) {
        const existing = merged.get(item.productId);
        if (!existing) {
            merged.set(item.productId, Object.assign({}, item));
            continue;
        }
        const mergedQty = existing.quantity + item.quantity;
        const mergedUnitPrice = Number(((existing.unitPrice * existing.quantity + item.unitPrice * item.quantity) / mergedQty).toFixed(2));
        merged.set(item.productId, {
            productId: item.productId,
            quantity: mergedQty,
            unitPrice: mergedUnitPrice,
        });
    }
    return Array.from(merged.values());
};
const createPurchaseOrder = (organizationId, vendorId, items) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    if (!(vendorId === null || vendorId === void 0 ? void 0 : vendorId.trim())) {
        throw new InventoryError(400, "vendorId is required");
    }
    if (!Array.isArray(items) || items.length === 0) {
        throw new InventoryError(400, "items must be a non-empty array");
    }
    const vendor = yield prisma_1.default.contact.findUnique({
        where: { id: vendorId },
        select: {
            id: true,
            organizationId: true,
            type: true,
            companyName: true,
            firstName: true,
            lastName: true,
        },
    });
    if (!vendor) {
        throw new InventoryError(404, "Vendor not found");
    }
    if (vendor.organizationId !== organizationId) {
        throw new InventoryError(403, "Vendor does not belong to this organization");
    }
    if (vendor.type !== "VENDOR") {
        throw new InventoryError(400, "Selected contact is not a vendor");
    }
    const normalizedItems = mergeDuplicatePurchaseItems(items);
    for (const item of normalizedItems) {
        ensurePositiveQuantity(item.quantity);
        if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
            throw new InventoryError(400, "unitPrice must be a non-negative number");
        }
        yield validateProduct(item.productId, organizationId);
    }
    const totalAmount = Number(normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2));
    return prisma_1.default.purchaseOrder.create({
        data: {
            organizationId,
            vendorId,
            status: "DRAFT",
            totalAmount,
            items: {
                create: normalizedItems.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
            },
        },
        include: {
            vendor: {
                select: {
                    id: true,
                    companyName: true,
                    firstName: true,
                    lastName: true,
                },
            },
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                        },
                    },
                },
            },
        },
    });
});
exports.createPurchaseOrder = createPurchaseOrder;
const updateDraftPurchaseOrderItems = (organizationId, purchaseId, items) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    if (!Array.isArray(items) || items.length === 0) {
        throw new InventoryError(400, "items must be a non-empty array");
    }
    const purchaseOrder = yield prisma_1.default.purchaseOrder.findUnique({
        where: { id: purchaseId },
        select: {
            id: true,
            organizationId: true,
            status: true,
        },
    });
    if (!purchaseOrder) {
        throw new InventoryError(404, "Purchase order not found");
    }
    if (purchaseOrder.organizationId !== organizationId) {
        throw new InventoryError(403, "Purchase order does not belong to this organization");
    }
    if (purchaseOrder.status !== "DRAFT") {
        throw new InventoryError(400, "Only DRAFT purchase orders can be edited");
    }
    const normalizedItems = mergeDuplicatePurchaseItems(items);
    for (const item of normalizedItems) {
        ensurePositiveQuantity(item.quantity);
        if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
            throw new InventoryError(400, "unitPrice must be a non-negative number");
        }
        yield validateProduct(item.productId, organizationId);
    }
    const totalAmount = Number(normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2));
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.purchaseItem.deleteMany({ where: { purchaseId: purchaseOrder.id } });
        yield tx.purchaseOrder.update({
            where: { id: purchaseOrder.id },
            data: {
                totalAmount,
                items: {
                    create: normalizedItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                    })),
                },
            },
        });
    }));
    return prisma_1.default.purchaseOrder.findUnique({
        where: { id: purchaseOrder.id },
        include: {
            vendor: {
                select: {
                    id: true,
                    companyName: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                },
            },
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                        },
                    },
                },
            },
        },
    });
});
exports.updateDraftPurchaseOrderItems = updateDraftPurchaseOrderItems;
const getOrCreateLedgerAccount = (organizationId, name, type) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_1.default.ledgerAccount.findFirst({
        where: {
            organizationId,
            name,
            type,
        },
        select: {
            id: true,
        },
    });
    if (existing) {
        return existing;
    }
    return prisma_1.default.ledgerAccount.create({
        data: {
            organizationId,
            name,
            type,
        },
        select: {
            id: true,
        },
    });
});
const approvePurchaseOrder = (purchaseId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    const purchaseOrder = yield prisma_1.default.purchaseOrder.findUnique({
        where: { id: purchaseId },
        select: {
            id: true,
            organizationId: true,
            status: true,
        },
    });
    if (!purchaseOrder) {
        throw new InventoryError(404, "Purchase order not found");
    }
    if (purchaseOrder.organizationId !== organizationId) {
        throw new InventoryError(403, "Purchase order does not belong to this organization");
    }
    if (purchaseOrder.status !== "DRAFT") {
        throw new InventoryError(400, "Only DRAFT purchase orders can be approved");
    }
    return prisma_1.default.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: { status: "APPROVED" },
    });
});
exports.approvePurchaseOrder = approvePurchaseOrder;
const getPurchaseOrderReceiptsByProduct = (purchaseId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const grouped = yield prisma_1.default.stockMovement.groupBy({
        by: ["productId"],
        where: {
            referenceId: purchaseId,
            type: "PURCHASE",
        },
        _sum: {
            quantity: true,
        },
    });
    const map = new Map();
    for (const row of grouped) {
        map.set(row.productId, (_a = row._sum.quantity) !== null && _a !== void 0 ? _a : 0);
    }
    return map;
});
const receivePurchaseOrder = (purchaseId, organizationId, warehouseId, items) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    const purchaseOrder = yield prisma_1.default.purchaseOrder.findUnique({
        where: { id: purchaseId },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            organizationId: true,
                        },
                    },
                },
            },
            vendor: {
                select: {
                    id: true,
                    organizationId: true,
                    type: true,
                },
            },
        },
    });
    if (!purchaseOrder) {
        throw new InventoryError(404, "Purchase order not found");
    }
    if (purchaseOrder.organizationId !== organizationId) {
        throw new InventoryError(403, "Purchase order does not belong to this organization");
    }
    if (!["APPROVED", "PARTIAL_RECEIVED"].includes(purchaseOrder.status)) {
        throw new InventoryError(400, "Only APPROVED or PARTIAL_RECEIVED purchase orders can be received");
    }
    if (purchaseOrder.items.length === 0) {
        throw new InventoryError(400, "Cannot receive purchase order without items");
    }
    if (purchaseOrder.vendor.organizationId !== organizationId || purchaseOrder.vendor.type !== "VENDOR") {
        throw new InventoryError(400, "Purchase order vendor is invalid for this organization");
    }
    const targetWarehouse = warehouseId
        ? yield validateWarehouse(warehouseId, organizationId)
        : yield prisma_1.default.warehouse.findFirst({
            where: { organizationId },
            orderBy: { name: "asc" },
            select: { id: true, organizationId: true, name: true },
        });
    if (!targetWarehouse) {
        throw new InventoryError(400, "No warehouse found for stock receipt. Create a warehouse first.");
    }
    const previouslyReceived = yield getPurchaseOrderReceiptsByProduct(purchaseOrder.id);
    const itemByProductId = new Map(purchaseOrder.items.map((item) => [item.productId, item]));
    let requestedItems = [];
    if (Array.isArray(items) && items.length > 0) {
        requestedItems = items;
    }
    else {
        requestedItems = purchaseOrder.items
            .map((item) => {
            var _a;
            const received = (_a = previouslyReceived.get(item.productId)) !== null && _a !== void 0 ? _a : 0;
            const remaining = item.quantity - received;
            return {
                productId: item.productId,
                quantity: remaining,
            };
        })
            .filter((entry) => entry.quantity > 0);
    }
    if (requestedItems.length === 0) {
        throw new InventoryError(400, "No receivable quantity left for this purchase order");
    }
    const receiptPlan = requestedItems.map((entry) => {
        var _a;
        ensurePositiveQuantity(entry.quantity);
        const purchaseItem = itemByProductId.get(entry.productId);
        if (!purchaseItem) {
            throw new InventoryError(400, `productId ${entry.productId} does not belong to this purchase order`);
        }
        if (purchaseItem.product.organizationId !== organizationId) {
            throw new InventoryError(400, "Purchase item product does not belong to this organization");
        }
        const alreadyReceived = (_a = previouslyReceived.get(entry.productId)) !== null && _a !== void 0 ? _a : 0;
        const remaining = purchaseItem.quantity - alreadyReceived;
        if (remaining <= 0) {
            throw new InventoryError(400, `Product ${entry.productId} is already fully received`);
        }
        if (entry.quantity > remaining) {
            throw new InventoryError(400, `Requested quantity exceeds remaining quantity for product ${entry.productId}`);
        }
        return {
            productId: entry.productId,
            quantity: entry.quantity,
            unitPrice: Number(purchaseItem.unitPrice),
        };
    });
    const receivedValue = Number(receiptPlan.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0).toFixed(2));
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        for (const line of receiptPlan) {
            yield tx.stockItem.upsert({
                where: {
                    productId_warehouseId: {
                        productId: line.productId,
                        warehouseId: targetWarehouse.id,
                    },
                },
                update: {
                    quantity: { increment: line.quantity },
                },
                create: {
                    productId: line.productId,
                    warehouseId: targetWarehouse.id,
                    quantity: line.quantity,
                },
            });
            yield tx.stockMovement.create({
                data: {
                    organizationId,
                    productId: line.productId,
                    warehouseId: targetWarehouse.id,
                    type: "PURCHASE",
                    quantity: line.quantity,
                    referenceId: purchaseOrder.id,
                    notes: `Stock receipt for PO ${purchaseOrder.id}`,
                },
            });
        }
        const totalReceivedByProduct = new Map(previouslyReceived);
        for (const line of receiptPlan) {
            totalReceivedByProduct.set(line.productId, ((_a = totalReceivedByProduct.get(line.productId)) !== null && _a !== void 0 ? _a : 0) + line.quantity);
        }
        const allItemsReceived = purchaseOrder.items.every((item) => {
            var _a;
            const received = (_a = totalReceivedByProduct.get(item.productId)) !== null && _a !== void 0 ? _a : 0;
            return received >= item.quantity;
        });
        const updatedPurchase = yield tx.purchaseOrder.update({
            where: { id: purchaseOrder.id },
            data: { status: allItemsReceived ? "RECEIVED" : "PARTIAL_RECEIVED" },
        });
        const inventoryAccount = yield getOrCreateLedgerAccount(organizationId, "Inventory", "ASSET");
        const accountsPayableAccount = yield getOrCreateLedgerAccount(organizationId, "Accounts Payable", "LIABILITY");
        const transaction = yield (0, accounting_service_1.createTransactionWithEntries)(organizationId, "PURCHASE", `${purchaseOrder.id}:RCV:${Date.now()}`, [
            {
                ledgerAccountId: inventoryAccount.id,
                debit: receivedValue,
            },
            {
                ledgerAccountId: accountsPayableAccount.id,
                credit: receivedValue,
            },
        ], {
            contactId: purchaseOrder.vendorId,
            totalAmount: receivedValue,
            status: "POSTED",
            transactionDate: new Date(),
            tx,
        });
        return {
            purchaseOrder: updatedPurchase,
            transaction,
            receivingWarehouse: targetWarehouse,
            receivedValue,
        };
    }));
});
exports.receivePurchaseOrder = receivePurchaseOrder;
const getPurchaseOrderReturnsByProduct = (purchaseId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const grouped = yield prisma_1.default.stockMovement.groupBy({
        by: ["productId"],
        where: {
            referenceId: purchaseId,
            type: "PURCHASE_RETURN",
        },
        _sum: {
            quantity: true,
        },
    });
    const map = new Map();
    for (const row of grouped) {
        const raw = (_a = row._sum.quantity) !== null && _a !== void 0 ? _a : 0;
        map.set(row.productId, Math.abs(raw));
    }
    return map;
});
const returnPurchaseOrder = (purchaseId, organizationId, warehouseId, items) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    const purchaseOrder = yield prisma_1.default.purchaseOrder.findUnique({
        where: { id: purchaseId },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            organizationId: true,
                        },
                    },
                },
            },
            vendor: {
                select: {
                    id: true,
                    organizationId: true,
                    type: true,
                },
            },
        },
    });
    if (!purchaseOrder) {
        throw new InventoryError(404, "Purchase order not found");
    }
    if (purchaseOrder.organizationId !== organizationId) {
        throw new InventoryError(403, "Purchase order does not belong to this organization");
    }
    if (!["RECEIVED", "PARTIAL_RECEIVED"].includes(purchaseOrder.status)) {
        throw new InventoryError(400, "Only RECEIVED or PARTIAL_RECEIVED purchase orders can be returned");
    }
    if (purchaseOrder.vendor.organizationId !== organizationId || purchaseOrder.vendor.type !== "VENDOR") {
        throw new InventoryError(400, "Purchase order vendor is invalid for this organization");
    }
    const targetWarehouse = warehouseId
        ? yield validateWarehouse(warehouseId, organizationId)
        : yield prisma_1.default.warehouse.findFirst({
            where: { organizationId },
            orderBy: { name: "asc" },
            select: { id: true, organizationId: true, name: true },
        });
    if (!targetWarehouse) {
        throw new InventoryError(400, "No warehouse found for purchase return. Create a warehouse first.");
    }
    const receivedByProduct = yield getPurchaseOrderReceiptsByProduct(purchaseOrder.id);
    const returnedByProduct = yield getPurchaseOrderReturnsByProduct(purchaseOrder.id);
    const itemByProductId = new Map(purchaseOrder.items.map((item) => [item.productId, item]));
    let requestedItems = [];
    if (Array.isArray(items) && items.length > 0) {
        requestedItems = items;
    }
    else {
        requestedItems = purchaseOrder.items
            .map((item) => {
            var _a, _b;
            const received = (_a = receivedByProduct.get(item.productId)) !== null && _a !== void 0 ? _a : 0;
            const alreadyReturned = (_b = returnedByProduct.get(item.productId)) !== null && _b !== void 0 ? _b : 0;
            const returnable = received - alreadyReturned;
            return {
                productId: item.productId,
                quantity: returnable,
            };
        })
            .filter((entry) => entry.quantity > 0);
    }
    if (requestedItems.length === 0) {
        throw new InventoryError(400, "No returnable quantity left for this purchase order");
    }
    const returnPlan = requestedItems.map((entry) => {
        var _a, _b;
        ensurePositiveQuantity(entry.quantity);
        const purchaseItem = itemByProductId.get(entry.productId);
        if (!purchaseItem) {
            throw new InventoryError(400, `productId ${entry.productId} does not belong to this purchase order`);
        }
        if (purchaseItem.product.organizationId !== organizationId) {
            throw new InventoryError(400, "Purchase item product does not belong to this organization");
        }
        const received = (_a = receivedByProduct.get(entry.productId)) !== null && _a !== void 0 ? _a : 0;
        const alreadyReturned = (_b = returnedByProduct.get(entry.productId)) !== null && _b !== void 0 ? _b : 0;
        const returnable = received - alreadyReturned;
        if (returnable <= 0) {
            throw new InventoryError(400, `Product ${entry.productId} has no returnable quantity`);
        }
        if (entry.quantity > returnable) {
            throw new InventoryError(400, `Requested return quantity exceeds returnable quantity for product ${entry.productId}`);
        }
        return {
            productId: entry.productId,
            quantity: entry.quantity,
            unitPrice: Number(purchaseItem.unitPrice),
        };
    });
    const returnedValue = Number(returnPlan.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0).toFixed(2));
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        for (const line of returnPlan) {
            const stockItem = yield tx.stockItem.findUnique({
                where: {
                    productId_warehouseId: {
                        productId: line.productId,
                        warehouseId: targetWarehouse.id,
                    },
                },
            });
            if (!stockItem || stockItem.quantity < line.quantity) {
                throw new InventoryError(400, `Insufficient stock in ${targetWarehouse.name} for return product ${line.productId}`);
            }
            yield tx.stockItem.update({
                where: { id: stockItem.id },
                data: { quantity: { decrement: line.quantity } },
            });
            yield tx.stockMovement.create({
                data: {
                    organizationId,
                    productId: line.productId,
                    warehouseId: targetWarehouse.id,
                    type: "PURCHASE_RETURN",
                    quantity: -line.quantity,
                    referenceId: purchaseOrder.id,
                    notes: `Purchase return for PO ${purchaseOrder.id}`,
                },
            });
        }
        const inventoryAccount = yield getOrCreateLedgerAccount(organizationId, "Inventory", "ASSET");
        const accountsPayableAccount = yield getOrCreateLedgerAccount(organizationId, "Accounts Payable", "LIABILITY");
        const transaction = yield (0, accounting_service_1.createTransactionWithEntries)(organizationId, "PURCHASE", `${purchaseOrder.id}:RET:${Date.now()}`, [
            {
                ledgerAccountId: accountsPayableAccount.id,
                debit: returnedValue,
            },
            {
                ledgerAccountId: inventoryAccount.id,
                credit: returnedValue,
            },
        ], {
            contactId: purchaseOrder.vendorId,
            totalAmount: returnedValue,
            status: "POSTED",
            transactionDate: new Date(),
            tx,
        });
        return {
            purchaseOrderId: purchaseOrder.id,
            transaction,
            returningWarehouse: targetWarehouse,
            returnedValue,
        };
    }));
});
exports.returnPurchaseOrder = returnPurchaseOrder;
const getPurchaseOrders = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield validateOrganization(organizationId);
    const purchaseOrders = yield prisma_1.default.purchaseOrder.findMany({
        where: {
            organizationId,
        },
        include: {
            vendor: {
                select: {
                    id: true,
                    companyName: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                },
            },
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    const purchaseIds = purchaseOrders.map((order) => order.id);
    const receiptRows = purchaseIds.length
        ? yield prisma_1.default.stockMovement.groupBy({
            by: ["referenceId", "productId"],
            where: {
                referenceId: { in: purchaseIds },
                type: "PURCHASE",
            },
            _sum: {
                quantity: true,
            },
        })
        : [];
    const returnRows = purchaseIds.length
        ? yield prisma_1.default.stockMovement.groupBy({
            by: ["referenceId", "productId"],
            where: {
                referenceId: { in: purchaseIds },
                type: "PURCHASE_RETURN",
            },
            _sum: {
                quantity: true,
            },
        })
        : [];
    const receiptMap = new Map();
    for (const row of receiptRows) {
        if (!row.referenceId)
            continue;
        receiptMap.set(`${row.referenceId}:${row.productId}`, (_a = row._sum.quantity) !== null && _a !== void 0 ? _a : 0);
    }
    const returnMap = new Map();
    for (const row of returnRows) {
        if (!row.referenceId)
            continue;
        returnMap.set(`${row.referenceId}:${row.productId}`, Math.abs((_b = row._sum.quantity) !== null && _b !== void 0 ? _b : 0));
    }
    return purchaseOrders.map((order) => {
        const items = order.items.map((item) => {
            var _a, _b;
            const receivedQuantity = (_a = receiptMap.get(`${order.id}:${item.productId}`)) !== null && _a !== void 0 ? _a : 0;
            const returnedQuantity = (_b = returnMap.get(`${order.id}:${item.productId}`)) !== null && _b !== void 0 ? _b : 0;
            const returnableQuantity = Math.max(receivedQuantity - returnedQuantity, 0);
            const pendingQuantity = Math.max(item.quantity - receivedQuantity, 0);
            return Object.assign(Object.assign({}, item), { receivedQuantity,
                returnedQuantity,
                returnableQuantity,
                pendingQuantity });
        });
        const totalOrderedQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalReceivedQuantity = items.reduce((sum, item) => sum + item.receivedQuantity, 0);
        const totalReturnedQuantity = items.reduce((sum, item) => sum + item.returnedQuantity, 0);
        const totalReturnableQuantity = items.reduce((sum, item) => sum + item.returnableQuantity, 0);
        const totalPendingQuantity = Math.max(totalOrderedQuantity - totalReceivedQuantity, 0);
        return Object.assign(Object.assign({}, order), { items,
            totalOrderedQuantity,
            totalReceivedQuantity,
            totalReturnedQuantity,
            totalReturnableQuantity,
            totalPendingQuantity });
    });
});
exports.getPurchaseOrders = getPurchaseOrders;
const addStock = (organizationId, productId, warehouseId, quantity, referenceId, notes) => __awaiter(void 0, void 0, void 0, function* () {
    ensurePositiveQuantity(quantity);
    yield validateProduct(productId, organizationId);
    yield validateWarehouse(warehouseId, organizationId);
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const baseStockItem = yield getOrCreateStockItem(productId, warehouseId, tx);
        const stockItem = yield tx.stockItem.update({
            where: { id: baseStockItem.id },
            data: {
                quantity: { increment: quantity },
            },
        });
        const movement = yield tx.stockMovement.create({
            data: {
                organizationId,
                productId,
                warehouseId,
                type: "PURCHASE",
                quantity,
                referenceId,
                notes,
            },
        });
        return { stockItem, movement };
    }));
});
exports.addStock = addStock;
const reduceStock = (organizationId, productId, warehouseId, quantity, referenceId, notes) => __awaiter(void 0, void 0, void 0, function* () {
    ensurePositiveQuantity(quantity);
    yield validateProduct(productId, organizationId);
    yield validateWarehouse(warehouseId, organizationId);
    return (0, exports.reduceStockWithDb)(prisma_1.default, organizationId, productId, warehouseId, quantity, referenceId, notes);
});
exports.reduceStock = reduceStock;
const reduceStockWithDb = (db, organizationId, productId, warehouseId, quantity, referenceId, notes) => __awaiter(void 0, void 0, void 0, function* () {
    ensurePositiveQuantity(quantity);
    const stockItem = yield db.stockItem.findUnique({
        where: {
            productId_warehouseId: { productId, warehouseId },
        },
    });
    if (!stockItem || stockItem.quantity < quantity) {
        throw new InventoryError(400, "Insufficient stock for this warehouse");
    }
    const updated = yield db.stockItem.update({
        where: { id: stockItem.id },
        data: { quantity: { decrement: quantity } },
    });
    const movement = yield db.stockMovement.create({
        data: {
            organizationId,
            productId,
            warehouseId,
            type: "SALE",
            quantity: -quantity,
            referenceId,
            notes,
        },
    });
    return { stockItem: updated, movement };
});
exports.reduceStockWithDb = reduceStockWithDb;
const transferStock = (organizationId, productId, fromWarehouseId, toWarehouseId, quantity, referenceId, notes) => __awaiter(void 0, void 0, void 0, function* () {
    ensurePositiveQuantity(quantity);
    if (fromWarehouseId === toWarehouseId) {
        throw new InventoryError(400, "Source and destination warehouse must be different");
    }
    yield validateProduct(productId, organizationId);
    yield validateWarehouse(fromWarehouseId, organizationId);
    yield validateWarehouse(toWarehouseId, organizationId);
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const source = yield tx.stockItem.findUnique({
            where: {
                productId_warehouseId: { productId, warehouseId: fromWarehouseId },
            },
        });
        if (!source || source.quantity < quantity) {
            throw new InventoryError(400, "Insufficient stock in source warehouse");
        }
        yield tx.stockItem.update({
            where: { id: source.id },
            data: { quantity: { decrement: quantity } },
        });
        const destination = yield tx.stockItem.upsert({
            where: {
                productId_warehouseId: { productId, warehouseId: toWarehouseId },
            },
            update: { quantity: { increment: quantity } },
            create: {
                productId,
                warehouseId: toWarehouseId,
                quantity,
            },
        });
        const [outMovement, inMovement] = yield Promise.all([
            tx.stockMovement.create({
                data: {
                    organizationId,
                    productId,
                    warehouseId: fromWarehouseId,
                    type: "TRANSFER_OUT",
                    quantity: -quantity,
                    referenceId,
                    notes,
                },
            }),
            tx.stockMovement.create({
                data: {
                    organizationId,
                    productId,
                    warehouseId: toWarehouseId,
                    type: "TRANSFER_IN",
                    quantity,
                    referenceId,
                    notes,
                },
            }),
        ]);
        return {
            destination,
            movements: {
                outMovement,
                inMovement,
            },
        };
    }));
});
exports.transferStock = transferStock;
const adjustStock = (organizationId, productId, warehouseId, newQuantity, reason, referenceId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!Number.isInteger(newQuantity) || newQuantity < 0) {
        throw new InventoryError(400, "newQuantity must be a non-negative integer");
    }
    if (!(reason === null || reason === void 0 ? void 0 : reason.trim())) {
        throw new InventoryError(400, "reason is required for stock adjustment");
    }
    yield validateProduct(productId, organizationId);
    yield validateWarehouse(warehouseId, organizationId);
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const stockItem = yield tx.stockItem.upsert({
            where: {
                productId_warehouseId: { productId, warehouseId },
            },
            update: {},
            create: {
                productId,
                warehouseId,
                quantity: 0,
            },
        });
        const quantityDelta = newQuantity - stockItem.quantity;
        if (quantityDelta === 0) {
            throw new InventoryError(400, "No adjustment needed. Stock quantity is unchanged");
        }
        const updated = yield tx.stockItem.update({
            where: { id: stockItem.id },
            data: { quantity: newQuantity },
        });
        const movement = yield tx.stockMovement.create({
            data: {
                organizationId,
                productId,
                warehouseId,
                type: "ADJUSTMENT",
                quantity: quantityDelta,
                referenceId,
                notes: reason.trim(),
            },
        });
        return { stockItem: updated, movement };
    }));
});
exports.adjustStock = adjustStock;
const getInventorySummary = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield validateOrganization(organizationId);
    const store = yield loadInventoryMetaStore();
    const [productsCount, warehousesCount, stockItems, movementAgg] = yield Promise.all([
        prisma_1.default.product.count({
            where: { organizationId, isActive: true },
        }),
        prisma_1.default.warehouse.count({
            where: { organizationId },
        }),
        prisma_1.default.stockItem.findMany({
            where: {
                product: {
                    organizationId,
                },
                warehouse: {
                    organizationId,
                },
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        unitPrice: true,
                        costPrice: true,
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        }),
        prisma_1.default.stockMovement.groupBy({
            by: ["productId"],
            where: { organizationId },
            _count: { productId: true },
        }),
    ]);
    const totalStockValue = Number(stockItems
        .reduce((sum, item) => {
        var _a;
        const unitCost = Number((_a = item.product.costPrice) !== null && _a !== void 0 ? _a : item.product.unitPrice);
        return sum + unitCost * item.quantity;
    }, 0)
        .toFixed(2));
    const lowStockProducts = stockItems
        .filter((item) => {
        var _a, _b;
        const reorderLevel = (_b = (_a = store.productSettings[item.product.id]) === null || _a === void 0 ? void 0 : _a.reorderLevel) !== null && _b !== void 0 ? _b : 10;
        return item.quantity <= reorderLevel;
    })
        .map((item) => {
        var _a, _b;
        return ({
            productId: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            warehouseId: item.warehouse.id,
            warehouseName: item.warehouse.name,
            quantity: item.quantity,
            reorderLevel: (_b = (_a = store.productSettings[item.product.id]) === null || _a === void 0 ? void 0 : _a.reorderLevel) !== null && _b !== void 0 ? _b : 10,
        });
    })
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 20);
    const movementCountMap = new Map();
    for (const row of movementAgg) {
        movementCountMap.set(row.productId, row._count.productId);
    }
    const productStats = new Map();
    for (const item of stockItems) {
        if (!productStats.has(item.product.id)) {
            productStats.set(item.product.id, {
                productId: item.product.id,
                name: item.product.name,
                sku: item.product.sku,
                movementCount: (_a = movementCountMap.get(item.product.id)) !== null && _a !== void 0 ? _a : 0,
            });
        }
    }
    const topMovingProducts = Array.from(productStats.values())
        .sort((a, b) => b.movementCount - a.movementCount)
        .slice(0, 5);
    return {
        totalProducts: productsCount,
        totalStockValue,
        totalWarehouses: warehousesCount,
        lowStockProducts,
        topMovingProducts,
    };
});
exports.getInventorySummary = getInventorySummary;
exports.getStockSummary = exports.getInventorySummary;
const getStockMovements = (productId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    yield validateProduct(productId, organizationId);
    return prisma_1.default.stockMovement.findMany({
        where: {
            organizationId,
            productId,
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    sku: true,
                },
            },
            warehouse: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
});
exports.getStockMovements = getStockMovements;
const getStockMovementsByOrganization = (organizationId, options) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    if (options === null || options === void 0 ? void 0 : options.productId) {
        yield validateProduct(options.productId, organizationId);
    }
    if (options === null || options === void 0 ? void 0 : options.warehouseId) {
        yield validateWarehouse(options.warehouseId, organizationId);
    }
    const createdAtFilter = {};
    if (options === null || options === void 0 ? void 0 : options.fromDate) {
        const from = new Date(options.fromDate);
        if (Number.isNaN(from.getTime())) {
            throw new InventoryError(400, "Invalid fromDate");
        }
        createdAtFilter.gte = from;
    }
    if (options === null || options === void 0 ? void 0 : options.toDate) {
        const to = new Date(options.toDate);
        if (Number.isNaN(to.getTime())) {
            throw new InventoryError(400, "Invalid toDate");
        }
        createdAtFilter.lte = to;
    }
    if (createdAtFilter.gte && createdAtFilter.lte && createdAtFilter.gte > createdAtFilter.lte) {
        throw new InventoryError(400, "fromDate must be before or equal to toDate");
    }
    const limit = (options === null || options === void 0 ? void 0 : options.limit) && options.limit > 0 ? Math.min(options.limit, 500) : 100;
    return prisma_1.default.stockMovement.findMany({
        where: Object.assign(Object.assign(Object.assign(Object.assign({ organizationId }, ((options === null || options === void 0 ? void 0 : options.productId) ? { productId: options.productId } : {})), ((options === null || options === void 0 ? void 0 : options.warehouseId) ? { warehouseId: options.warehouseId } : {})), ((options === null || options === void 0 ? void 0 : options.type) ? { type: options.type } : {})), (Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {})),
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    sku: true,
                },
            },
            warehouse: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
});
exports.getStockMovementsByOrganization = getStockMovementsByOrganization;
const getReorderSuggestions = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield validateOrganization(organizationId);
    const store = yield loadInventoryMetaStore();
    const stockItems = yield prisma_1.default.stockItem.findMany({
        where: {
            product: {
                organizationId,
                isActive: true,
            },
            warehouse: {
                organizationId,
            },
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    sku: true,
                    costPrice: true,
                    unitPrice: true,
                },
            },
            warehouse: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            product: {
                name: "asc",
            },
        },
    });
    return stockItems
        .map((item) => {
        var _a, _b, _c, _d;
        const reorderLevel = (_b = (_a = store.productSettings[item.product.id]) === null || _a === void 0 ? void 0 : _a.reorderLevel) !== null && _b !== void 0 ? _b : 10;
        const shortfall = reorderLevel - item.quantity;
        const suggestedOrderQty = shortfall > 0 ? shortfall : 0;
        const unitCost = Number((_d = (_c = item.product.costPrice) !== null && _c !== void 0 ? _c : item.product.unitPrice) !== null && _d !== void 0 ? _d : 0);
        return {
            productId: item.product.id,
            productName: item.product.name,
            sku: item.product.sku,
            warehouseId: item.warehouse.id,
            warehouseName: item.warehouse.name,
            currentQuantity: item.quantity,
            reorderLevel,
            shortfall: shortfall > 0 ? shortfall : 0,
            suggestedOrderQty,
            estimatedCost: Number((suggestedOrderQty * unitCost).toFixed(2)),
        };
    })
        .filter((item) => item.shortfall > 0)
        .sort((a, b) => b.shortfall - a.shortfall);
});
exports.getReorderSuggestions = getReorderSuggestions;
const exportStockLedgerCsv = (organizationId, options) => __awaiter(void 0, void 0, void 0, function* () {
    const rows = yield (0, exports.getStockMovementsByOrganization)(organizationId, Object.assign(Object.assign({}, options), { limit: 5000 }));
    const escape = (value) => {
        const text = value === null || value === undefined ? "" : String(value);
        return `"${text.replace(/"/g, '""')}"`;
    };
    const header = [
        "Movement ID",
        "Created At",
        "Type",
        "Product",
        "SKU",
        "Warehouse",
        "Quantity",
        "Reference ID",
        "Notes",
    ];
    const lines = rows.map((row) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return [
            row.id,
            row.createdAt.toISOString(),
            row.type,
            (_b = (_a = row.product) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "",
            (_d = (_c = row.product) === null || _c === void 0 ? void 0 : _c.sku) !== null && _d !== void 0 ? _d : "",
            (_f = (_e = row.warehouse) === null || _e === void 0 ? void 0 : _e.name) !== null && _f !== void 0 ? _f : "",
            row.quantity,
            (_g = row.referenceId) !== null && _g !== void 0 ? _g : "",
            (_h = row.notes) !== null && _h !== void 0 ? _h : "",
        ];
    });
    return [header, ...lines].map((line) => line.map((cell) => escape(cell)).join(",")).join("\n");
});
exports.exportStockLedgerCsv = exportStockLedgerCsv;
const getInventoryAuditFeed = (organizationId_1, ...args_1) => __awaiter(void 0, [organizationId_1, ...args_1], void 0, function* (organizationId, limit = 200) {
    yield validateOrganization(organizationId);
    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 500) : 200;
    const [movements, purchaseOrders] = yield Promise.all([
        prisma_1.default.stockMovement.findMany({
            where: { organizationId },
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true,
                    },
                },
                warehouse: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: safeLimit,
        }),
        prisma_1.default.purchaseOrder.findMany({
            where: { organizationId },
            select: {
                id: true,
                status: true,
                totalAmount: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: safeLimit,
        }),
    ]);
    const movementEvents = movements.map((item) => {
        var _a, _b, _c;
        return ({
            id: `mv:${item.id}`,
            eventType: "STOCK_MOVEMENT",
            occurredAt: item.createdAt,
            title: `${item.type} ${item.quantity > 0 ? "+" : ""}${item.quantity}`,
            details: `${((_a = item.product) === null || _a === void 0 ? void 0 : _a.name) || "Product"} (${((_b = item.product) === null || _b === void 0 ? void 0 : _b.sku) || "-"}) @ ${((_c = item.warehouse) === null || _c === void 0 ? void 0 : _c.name) || "Warehouse"}`,
            referenceId: item.referenceId,
            notes: item.notes,
        });
    });
    const purchaseEvents = purchaseOrders.map((item) => ({
        id: `po:${item.id}:${item.createdAt.toISOString()}`,
        eventType: "PURCHASE_ORDER",
        occurredAt: item.createdAt,
        title: `PO ${item.id.slice(0, 10)} status ${item.status}`,
        details: `Total amount ${item.totalAmount}`,
        referenceId: item.id,
        notes: "Created",
    }));
    return [...movementEvents, ...purchaseEvents]
        .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
        .slice(0, safeLimit);
});
exports.getInventoryAuditFeed = getInventoryAuditFeed;
