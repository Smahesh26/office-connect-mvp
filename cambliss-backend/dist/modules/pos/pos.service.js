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
exports.generateZReport = exports.createPOSOrder = exports.closePOSSession = exports.startPOSSession = exports.createPOSTerminal = exports.POSError = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const inventory_service_1 = require("../inventory/inventory.service");
const accounting_service_1 = require("../accounting/accounting.service");
const invoicing_service_1 = require("../invoicing/invoicing.service");
class POSError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "POSError";
    }
}
exports.POSError = POSError;
const toMoney = (value) => Number(value.toFixed(2));
const ensureOrganization = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const org = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!org) {
        throw new POSError(404, "Organization not found");
    }
});
const ensureCustomerInOrg = (organizationId, customerId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!customerId) {
        return null;
    }
    const customer = yield prisma_1.default.contact.findUnique({
        where: { id: customerId },
        select: { id: true, organizationId: true, type: true },
    });
    if (!customer) {
        throw new POSError(404, "Customer not found");
    }
    if (customer.organizationId !== organizationId) {
        throw new POSError(403, "Customer does not belong to this organization");
    }
    if (customer.type !== "CUSTOMER") {
        throw new POSError(400, "Contact is not a customer");
    }
    return customer;
});
const getRevenueAndCashLedgers = (organizationId, tx) => __awaiter(void 0, void 0, void 0, function* () {
    const db = tx !== null && tx !== void 0 ? tx : prisma_1.default;
    const ledgers = yield db.ledgerAccount.findMany({
        where: {
            organizationId,
            name: {
                in: ["Revenue", "Cash"],
            },
        },
        select: {
            id: true,
            name: true,
        },
    });
    const revenue = ledgers.find((ledger) => ledger.name === "Revenue");
    const cash = ledgers.find((ledger) => ledger.name === "Cash");
    if (!revenue || !cash) {
        throw new POSError(400, "Required ledger accounts 'Revenue' and 'Cash' are missing");
    }
    return {
        revenueLedgerId: revenue.id,
        cashLedgerId: cash.id,
    };
});
const getDefaultWarehouse = (organizationId, tx) => __awaiter(void 0, void 0, void 0, function* () {
    const db = tx !== null && tx !== void 0 ? tx : prisma_1.default;
    const warehouse = yield db.warehouse.findFirst({
        where: { organizationId },
        select: { id: true },
        orderBy: { id: "asc" },
    });
    if (!warehouse) {
        throw new POSError(400, "No warehouse configured for this organization");
    }
    return warehouse.id;
});
const createPOSTerminal = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield ensureOrganization(organizationId);
    if (!((_a = input.name) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new POSError(400, "name is required");
    }
    return prisma_1.default.pOSTerminal.create({
        data: {
            organizationId,
            name: input.name.trim(),
            location: (_b = input.location) === null || _b === void 0 ? void 0 : _b.trim(),
        },
    });
});
exports.createPOSTerminal = createPOSTerminal;
const startPOSSession = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!((_a = input.terminalId) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new POSError(400, "terminalId is required");
    }
    if (!((_b = input.openedBy) === null || _b === void 0 ? void 0 : _b.trim())) {
        throw new POSError(400, "openedBy is required");
    }
    if (typeof input.openingCash !== "number" || input.openingCash < 0) {
        throw new POSError(400, "openingCash must be a non-negative number");
    }
    const terminal = yield prisma_1.default.pOSTerminal.findUnique({
        where: { id: input.terminalId.trim() },
        select: { id: true, organizationId: true, isActive: true },
    });
    if (!terminal) {
        throw new POSError(404, "POS terminal not found");
    }
    if (terminal.organizationId !== organizationId) {
        throw new POSError(403, "Terminal does not belong to this organization");
    }
    if (!terminal.isActive) {
        throw new POSError(400, "Terminal is inactive");
    }
    const openSession = yield prisma_1.default.pOSSession.findFirst({
        where: {
            terminalId: terminal.id,
            closedAt: null,
        },
        select: { id: true },
    });
    if (openSession) {
        throw new POSError(409, "An open session already exists for this terminal");
    }
    return prisma_1.default.pOSSession.create({
        data: {
            terminalId: terminal.id,
            openedBy: input.openedBy.trim(),
            openingCash: toMoney(input.openingCash),
        },
        include: {
            terminal: true,
        },
    });
});
exports.startPOSSession = startPOSSession;
const closePOSSession = (organizationId, sessionId, closingCash) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(sessionId === null || sessionId === void 0 ? void 0 : sessionId.trim())) {
        throw new POSError(400, "sessionId is required");
    }
    if (typeof closingCash !== "number" || closingCash < 0) {
        throw new POSError(400, "closingCash must be a non-negative number");
    }
    const session = yield prisma_1.default.pOSSession.findUnique({
        where: { id: sessionId.trim() },
        include: {
            terminal: {
                select: {
                    organizationId: true,
                },
            },
            orders: {
                where: { status: "COMPLETED" },
                select: {
                    paymentMethod: true,
                    totalAmount: true,
                },
            },
        },
    });
    if (!session) {
        throw new POSError(404, "POS session not found");
    }
    if (session.terminal.organizationId !== organizationId) {
        throw new POSError(403, "Session does not belong to this organization");
    }
    if (session.closedAt) {
        throw new POSError(400, "Session is already closed");
    }
    const totalCashSales = toMoney(session.orders
        .filter((order) => order.paymentMethod === "CASH")
        .reduce((sum, order) => sum + Number(order.totalAmount), 0));
    const expectedCash = toMoney(Number(session.openingCash) + totalCashSales);
    const variance = toMoney(closingCash - expectedCash);
    const closedSession = yield prisma_1.default.pOSSession.update({
        where: { id: session.id },
        data: {
            closingCash: toMoney(closingCash),
            closedAt: new Date(),
        },
        include: {
            terminal: true,
        },
    });
    return {
        session: closedSession,
        expectedCash,
        totalCashSales,
        variance,
    };
});
exports.closePOSSession = closePOSSession;
const createPOSOrder = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!((_a = input.sessionId) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new POSError(400, "sessionId is required");
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
        throw new POSError(400, "items must contain at least one line");
    }
    if (!["CASH", "CARD", "UPI"].includes(input.paymentMethod)) {
        throw new POSError(400, "paymentMethod must be one of CASH, CARD, UPI");
    }
    yield ensureCustomerInOrg(organizationId, input.customerId);
    const session = yield prisma_1.default.pOSSession.findUnique({
        where: { id: input.sessionId.trim() },
        include: {
            terminal: {
                select: {
                    organizationId: true,
                    isActive: true,
                },
            },
        },
    });
    if (!session) {
        throw new POSError(404, "POS session not found");
    }
    if (session.terminal.organizationId !== organizationId) {
        throw new POSError(403, "Session does not belong to this organization");
    }
    if (!session.terminal.isActive) {
        throw new POSError(400, "Terminal is inactive");
    }
    if (session.closedAt) {
        throw new POSError(400, "Cannot create POS order on a closed session");
    }
    const normalizedItems = new Map();
    for (const item of input.items) {
        if (!((_b = item.productId) === null || _b === void 0 ? void 0 : _b.trim()) || !Number.isInteger(item.quantity) || item.quantity <= 0) {
            throw new POSError(400, "Each item must contain productId and quantity > 0");
        }
        normalizedItems.set(item.productId.trim(), ((_c = normalizedItems.get(item.productId.trim())) !== null && _c !== void 0 ? _c : 0) + item.quantity);
    }
    const productIds = Array.from(normalizedItems.keys());
    const products = yield prisma_1.default.product.findMany({
        where: {
            id: { in: productIds },
            organizationId,
            isActive: true,
        },
        select: {
            id: true,
            unitPrice: true,
        },
    });
    if (products.length !== productIds.length) {
        throw new POSError(400, "One or more products are invalid for this organization");
    }
    const priceByProduct = new Map(products.map((product) => [product.id, Number(product.unitPrice)]));
    const orderItems = Array.from(normalizedItems.entries()).map(([productId, quantity]) => {
        const price = priceByProduct.get(productId);
        if (price === undefined) {
            throw new POSError(400, `Invalid product ${productId}`);
        }
        return {
            productId,
            quantity,
            price,
        };
    });
    const totalAmount = toMoney(orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0));
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const warehouseId = yield getDefaultWarehouse(organizationId, tx);
        for (const item of orderItems) {
            yield (0, inventory_service_1.reduceStockWithDb)(tx, organizationId, item.productId, warehouseId, item.quantity, `POS-SESSION-${session.id}`, "POS sale");
        }
        const posOrder = yield tx.pOSOrder.create({
            data: {
                organizationId,
                sessionId: session.id,
                customerId: ((_a = input.customerId) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                totalAmount,
                paymentMethod: input.paymentMethod,
                status: "COMPLETED",
                items: {
                    create: orderItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, sku: true },
                        },
                    },
                },
            },
        });
        const { cashLedgerId, revenueLedgerId } = yield getRevenueAndCashLedgers(organizationId, tx);
        yield (0, accounting_service_1.createTransactionWithEntries)(organizationId, "SALE", `POS-ORDER-${posOrder.id}`, [
            { ledgerAccountId: cashLedgerId, debit: totalAmount },
            { ledgerAccountId: revenueLedgerId, credit: totalAmount },
        ], {
            contactId: (_b = posOrder.customerId) !== null && _b !== void 0 ? _b : undefined,
            totalAmount,
            status: "POSTED",
            tx,
        });
        // Auto-create invoice for POS order
        try {
            yield (0, invoicing_service_1.createInvoiceFromPOSOrder)(organizationId, posOrder.id, { tx });
        }
        catch (invoiceError) {
            // Log but don't fail the order if invoice creation fails
            console.error(`Failed to create invoice for POS order ${posOrder.id}:`, invoiceError.message);
        }
        return posOrder;
    }));
});
exports.createPOSOrder = createPOSOrder;
const generateZReport = (organizationId, sessionId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(sessionId === null || sessionId === void 0 ? void 0 : sessionId.trim())) {
        throw new POSError(400, "sessionId is required");
    }
    const session = yield prisma_1.default.pOSSession.findUnique({
        where: { id: sessionId.trim() },
        include: {
            terminal: {
                select: {
                    organizationId: true,
                    name: true,
                },
            },
        },
    });
    if (!session) {
        throw new POSError(404, "POS session not found");
    }
    if (session.terminal.organizationId !== organizationId) {
        throw new POSError(403, "Session does not belong to this organization");
    }
    const orders = yield prisma_1.default.pOSOrder.findMany({
        where: {
            sessionId: session.id,
            status: "COMPLETED",
        },
        select: {
            id: true,
            totalAmount: true,
            paymentMethod: true,
        },
    });
    const items = yield prisma_1.default.pOSOrderItem.findMany({
        where: {
            order: {
                sessionId: session.id,
                status: "COMPLETED",
            },
        },
        select: {
            productId: true,
            quantity: true,
            product: {
                select: {
                    name: true,
                    sku: true,
                },
            },
        },
    });
    const totalSales = toMoney(orders.reduce((sum, order) => sum + Number(order.totalAmount), 0));
    const totalCash = toMoney(orders
        .filter((order) => order.paymentMethod === "CASH")
        .reduce((sum, order) => sum + Number(order.totalAmount), 0));
    const totalUPI = toMoney(orders
        .filter((order) => order.paymentMethod === "UPI")
        .reduce((sum, order) => sum + Number(order.totalAmount), 0));
    const totalCard = toMoney(orders
        .filter((order) => order.paymentMethod === "CARD")
        .reduce((sum, order) => sum + Number(order.totalAmount), 0));
    const topMap = new Map();
    for (const item of items) {
        const existing = topMap.get(item.productId);
        if (!existing) {
            topMap.set(item.productId, {
                productId: item.productId,
                name: item.product.name,
                sku: item.product.sku,
                quantitySold: item.quantity,
            });
            continue;
        }
        existing.quantitySold += item.quantity;
    }
    const topSellingProducts = Array.from(topMap.values())
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 10);
    return {
        sessionId: session.id,
        terminalName: session.terminal.name,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        totalSales,
        totalCash,
        totalUPI,
        totalCard,
        totalOrders: orders.length,
        topSellingProducts,
    };
});
exports.generateZReport = generateZReport;
