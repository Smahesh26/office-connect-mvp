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
exports.resetCrmData = exports.setIntegrationConnection = exports.listIntegrationModules = exports.deleteStage = exports.updateStage = exports.createStage = exports.deletePipeline = exports.updatePipeline = exports.createPipeline = exports.deleteCampaign = exports.updateCampaign = exports.updateCampaignStatus = exports.createCampaign = exports.listCampaigns = exports.deleteServiceCase = exports.updateServiceCase = exports.updateServiceCaseStatus = exports.createServiceCase = exports.listServiceCases = exports.getStageHistory = exports.updateDealStage = exports.getDealTimeline = exports.createDeal = exports.updateLead = exports.getDealById = exports.getDeals = exports.getLeadById = exports.getLeads = exports.deleteDeal = exports.deleteLead = exports.restoreDeal = exports.archiveDeal = exports.restoreLead = exports.archiveLead = exports.createLead = exports.markDealAsWon = exports.getSalesDashboard = exports.getCrmSetupOptions = exports.getNoCostCrmProfile = exports.HttpError = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const client_1 = require("@prisma/client");
const accounting_service_1 = require("../accounting/accounting.service");
const inventory_service_1 = require("../inventory/inventory.service");
class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "HttpError";
    }
}
exports.HttpError = HttpError;
const getNoCostCrmProfile = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const [contacts, leads, deals, pipelines, stages, activities] = yield Promise.all([
        prisma_1.default.contact.count({ where: { organizationId } }),
        prisma_1.default.lead.count({ where: { organizationId } }),
        prisma_1.default.deal.count({ where: { organizationId } }),
        prisma_1.default.pipeline.count({ where: { organizationId } }),
        prisma_1.default.stage.count({ where: { pipeline: { organizationId } } }),
        prisma_1.default.activity.count({
            where: {
                OR: [{ lead: { organizationId } }, { deal: { organizationId } }],
            },
        }),
    ]);
    return {
        mode: "NO_COST",
        requiresThirdPartyApis: false,
        coreCapabilities: {
            customerData: true,
            leadManagement: true,
            salesPipeline: true,
            communicationTracking: true,
            automationReady: true,
            reportsAndInsights: true,
            supportWorkflow: true,
        },
        stats: {
            contacts,
            leads,
            deals,
            pipelines,
            stages,
            activities,
        },
        optionalPaidIntegrations: [
            { name: "WhatsApp Business API", required: false, useCase: "Outbound/inbound customer messaging" },
            { name: "SMS Gateway", required: false, useCase: "OTP and campaign SMS" },
            { name: "Email Delivery Provider", required: false, useCase: "High-volume email delivery" },
            { name: "Telephony/Call Center", required: false, useCase: "Click-to-call and call recordings" },
        ],
    };
});
exports.getNoCostCrmProfile = getNoCostCrmProfile;
const getCrmSetupOptions = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const org = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!org) {
        throw new HttpError(404, "Organization not found");
    }
    const contacts = yield prisma_1.default.contact.findMany({
        where: {
            organizationId,
            isActive: true,
        },
        orderBy: { updatedAt: "desc" },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
        },
        take: 200,
    });
    let pipelines = yield prisma_1.default.pipeline.findMany({
        where: { organizationId },
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            stages: {
                orderBy: { order: "asc" },
                select: {
                    id: true,
                    name: true,
                    order: true,
                },
            },
        },
    });
    if (pipelines.length === 0) {
        yield prisma_1.default.pipeline.create({
            data: {
                organizationId,
                name: "Default Sales Pipeline",
                stages: {
                    create: [
                        { name: "New Lead", order: 1 },
                        { name: "Qualified", order: 2 },
                        { name: "Proposal", order: 3 },
                        { name: "Negotiation", order: 4 },
                        { name: "Closed Won", order: 5 },
                    ],
                },
            },
        });
        pipelines = yield prisma_1.default.pipeline.findMany({
            where: { organizationId },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                stages: {
                    orderBy: { order: "asc" },
                    select: {
                        id: true,
                        name: true,
                        order: true,
                    },
                },
            },
        });
    }
    return {
        contacts: contacts.map((contact) => {
            const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();
            const label = fullName || contact.companyName || contact.email || contact.phone || contact.id;
            return {
                id: contact.id,
                label,
                email: contact.email,
                phone: contact.phone,
            };
        }),
        pipelines: pipelines.map((pipeline) => ({
            id: pipeline.id,
            name: pipeline.name,
            stages: pipeline.stages.map((stage) => ({
                id: stage.id,
                name: stage.name,
                order: stage.order,
            })),
        })),
    };
});
exports.getCrmSetupOptions = getCrmSetupOptions;
const getSalesDashboard = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Validate org exists
    const org = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!org) {
        throw new HttpError(404, "Organization not found");
    }
    // Count total leads (active only)
    const totalLeads = yield prisma_1.default.lead.count({
        where: {
            organizationId,
            isArchived: false,
        },
    });
    // Count total deals (active only)
    const totalDeals = yield prisma_1.default.deal.count({
        where: {
            organizationId,
            isArchived: false,
        },
    });
    // Count OPEN deals
    const totalOpenDeals = yield prisma_1.default.deal.count({
        where: {
            organizationId,
            status: "OPEN",
            isArchived: false,
        },
    });
    // Count WON deals
    const totalWonDeals = yield prisma_1.default.deal.count({
        where: {
            organizationId,
            status: "WON",
            isArchived: false,
        },
    });
    // Sum OPEN deals value
    const openDealsAgg = yield prisma_1.default.deal.aggregate({
        where: {
            organizationId,
            status: "OPEN",
            isArchived: false,
        },
        _sum: {
            value: true,
        },
    });
    const openDealsValue = openDealsAgg._sum.value ? Number(openDealsAgg._sum.value) : 0;
    // Sum WON deals value
    const wonDealsAgg = yield prisma_1.default.deal.aggregate({
        where: {
            organizationId,
            status: "WON",
            isArchived: false,
        },
        _sum: {
            value: true,
        },
    });
    const wonDealsValue = wonDealsAgg._sum.value ? Number(wonDealsAgg._sum.value) : 0;
    // Calculate expected revenue: sum(deal.value * probability/100)
    const allOpenDeals = yield prisma_1.default.deal.findMany({
        where: {
            organizationId,
            status: "OPEN",
            isArchived: false,
        },
        select: {
            value: true,
            probability: true,
        },
    });
    const expectedRevenue = allOpenDeals.reduce((sum, deal) => {
        const expectedValue = Number(deal.value) * (deal.probability / 100);
        return sum + expectedValue;
    }, 0);
    // Count LOST deals
    const lostDealsCount = yield prisma_1.default.deal.count({
        where: {
            organizationId,
            status: "LOST",
            isArchived: false,
        },
    });
    // Calculate conversion rate: WON / (WON + LOST)
    const conversionRate = totalWonDeals + lostDealsCount > 0 ? (totalWonDeals / (totalWonDeals + lostDealsCount)) * 100 : 0;
    // Group deals by stage
    const dealsGroupedByStage = yield prisma_1.default.stage.findMany({
        where: {
            pipeline: {
                organizationId,
            },
        },
        include: {
            _count: {
                select: {
                    deals: {
                        where: {
                            isArchived: false,
                        },
                    },
                },
            },
            deals: {
                where: {
                    isArchived: false,
                },
                select: {
                    value: true,
                },
            },
        },
    });
    const stageData = dealsGroupedByStage.map((stage) => ({
        stageName: stage.name,
        count: stage._count.deals,
        totalValue: stage.deals.reduce((sum, deal) => sum + Number(deal.value), 0),
    }));
    // Calculate win rate: (WON / Total) * 100
    const winRate = totalDeals > 0 ? (totalWonDeals / totalDeals) * 100 : 0;
    // Calculate monthly forecast: group OPEN deals by expectedClose month
    const openDealsWithDates = yield prisma_1.default.deal.findMany({
        where: {
            organizationId,
            status: "OPEN",
            isArchived: false,
            expectedClose: {
                not: null,
            },
        },
        select: {
            value: true,
            probability: true,
            expectedClose: true,
        },
    });
    // Group by month (YYYY-MM) and calculate projected revenue
    const monthlyMap = new Map();
    openDealsWithDates.forEach((deal) => {
        if (deal.expectedClose) {
            const monthKey = deal.expectedClose.toISOString().slice(0, 7); // YYYY-MM
            const expectedValue = Number(deal.value) * (deal.probability / 100);
            if (monthlyMap.has(monthKey)) {
                const existing = monthlyMap.get(monthKey);
                existing.projectedRevenue += expectedValue;
                existing.dealCount += 1;
            }
            else {
                monthlyMap.set(monthKey, {
                    projectedRevenue: expectedValue,
                    dealCount: 1,
                });
            }
        }
    });
    // Convert map to sorted array
    const monthlyForecast = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
        month,
        projectedRevenue: Math.round(data.projectedRevenue * 100) / 100,
        dealCount: data.dealCount,
    }))
        .sort((a, b) => a.month.localeCompare(b.month));
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const revenueThisMonthAgg = yield prisma_1.default.transaction.aggregate({
        where: {
            organizationId,
            type: "SALE",
            status: "POSTED",
            transactionDate: {
                gte: monthStart,
            },
        },
        _sum: {
            totalAmount: true,
        },
    });
    const revenueThisMonth = revenueThisMonthAgg._sum.totalAmount
        ? Number(revenueThisMonthAgg._sum.totalAmount)
        : 0;
    const unitsSoldAgg = yield prisma_1.default.stockMovement.aggregate({
        where: {
            organizationId,
            type: "SALE",
        },
        _sum: {
            quantity: true,
        },
    });
    const unitsSold = Math.abs(Number((_a = unitsSoldAgg._sum.quantity) !== null && _a !== void 0 ? _a : 0));
    const salesByProduct = yield prisma_1.default.stockMovement.groupBy({
        by: ["productId"],
        where: {
            organizationId,
            type: "SALE",
        },
        _sum: {
            quantity: true,
        },
        orderBy: {
            _sum: {
                quantity: "asc",
            },
        },
        take: 5,
    });
    const topProductIds = salesByProduct.map((entry) => entry.productId);
    const topProducts = topProductIds.length
        ? yield prisma_1.default.product.findMany({
            where: {
                organizationId,
                id: { in: topProductIds },
            },
            select: {
                id: true,
                name: true,
                sku: true,
            },
        })
        : [];
    const productMap = new Map(topProducts.map((product) => [product.id, product]));
    const topSellingProducts = salesByProduct
        .map((entry) => {
        var _a;
        const product = productMap.get(entry.productId);
        if (!product) {
            return null;
        }
        return {
            productId: entry.productId,
            name: product.name,
            sku: product.sku,
            unitsSold: Math.abs((_a = entry._sum.quantity) !== null && _a !== void 0 ? _a : 0),
        };
    })
        .filter((entry) => Boolean(entry));
    const stockItems = yield prisma_1.default.stockItem.findMany({
        where: {
            warehouse: {
                organizationId,
            },
        },
        select: {
            quantity: true,
            product: {
                select: {
                    costPrice: true,
                },
            },
        },
    });
    const currentInventoryValue = stockItems.reduce((sum, item) => {
        var _a;
        const costPrice = Number((_a = item.product.costPrice) !== null && _a !== void 0 ? _a : 0);
        return sum + item.quantity * costPrice;
    }, 0);
    const soldMovements = yield prisma_1.default.stockMovement.findMany({
        where: {
            organizationId,
            type: "SALE",
        },
        select: {
            quantity: true,
            product: {
                select: {
                    costPrice: true,
                },
            },
        },
    });
    const cogsValue = soldMovements.reduce((sum, movement) => {
        var _a;
        const costPrice = Number((_a = movement.product.costPrice) !== null && _a !== void 0 ? _a : 0);
        return sum + Math.abs(movement.quantity) * costPrice;
    }, 0);
    const inventoryTurnover = currentInventoryValue > 0 ? cogsValue / currentInventoryValue : 0;
    return {
        totalLeads,
        totalActiveDeals: totalDeals,
        totalOpenDeals,
        totalWonDeals,
        openDealsValue,
        wonDealsValue,
        expectedRevenue: Math.round(expectedRevenue * 100) / 100,
        lostDealsCount,
        conversionRate: Math.round(conversionRate * 100) / 100,
        winRate: Math.round(winRate * 100) / 100,
        dealsGroupedByStage: stageData,
        monthlyForecast,
        revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
        unitsSold,
        topSellingProducts,
        inventoryTurnover: Math.round(inventoryTurnover * 10000) / 10000,
    };
});
exports.getSalesDashboard = getSalesDashboard;
const validateDealSaleItems = (items) => {
    var _a, _b;
    if (!Array.isArray(items) || items.length === 0) {
        throw new HttpError(400, "items must be a non-empty array");
    }
    for (const item of items) {
        if (!((_a = item.productId) === null || _a === void 0 ? void 0 : _a.trim())) {
            throw new HttpError(400, "productId is required for each item");
        }
        if (!((_b = item.warehouseId) === null || _b === void 0 ? void 0 : _b.trim())) {
            throw new HttpError(400, "warehouseId is required for each item");
        }
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            throw new HttpError(400, "quantity must be a positive integer for each item");
        }
        if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
            throw new HttpError(400, "unitPrice must be a non-negative number for each item");
        }
    }
};
const getOrCreateLedgerAccount = (db, organizationId, name, type) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db.ledgerAccount.findFirst({
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
    return db.ledgerAccount.create({
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
const markDealAsWon = (dealId, organizationId, items) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    validateDealSaleItems(items);
    const deal = yield prisma_1.default.deal.findUnique({
        where: { id: dealId },
        select: {
            id: true,
            organizationId: true,
            contactId: true,
            status: true,
            isProcessed: true,
            isArchived: true,
        },
    });
    if (!deal) {
        throw new HttpError(404, "Deal not found");
    }
    if (deal.organizationId !== organizationId) {
        throw new HttpError(403, "Deal does not belong to this organization");
    }
    if (deal.isArchived) {
        throw new HttpError(400, "Archived deals cannot be processed");
    }
    if (deal.isProcessed) {
        throw new HttpError(400, "Deal sale is already processed");
    }
    const productIds = [...new Set(items.map((item) => item.productId))];
    const warehouseIds = [...new Set(items.map((item) => item.warehouseId))];
    const products = yield prisma_1.default.product.findMany({
        where: {
            id: { in: productIds },
            organizationId,
        },
        select: {
            id: true,
            name: true,
            sku: true,
            costPrice: true,
            isActive: true,
        },
    });
    if (products.length !== productIds.length) {
        throw new HttpError(400, "One or more products are invalid for this organization");
    }
    const productMap = new Map(products.map((product) => [product.id, product]));
    for (const product of products) {
        if (!product.isActive) {
            throw new HttpError(400, `Product ${product.sku} is inactive`);
        }
    }
    const warehouses = yield prisma_1.default.warehouse.findMany({
        where: {
            id: { in: warehouseIds },
            organizationId,
        },
        select: {
            id: true,
        },
    });
    if (warehouses.length !== warehouseIds.length) {
        throw new HttpError(400, "One or more warehouses are invalid for this organization");
    }
    const stockRows = yield prisma_1.default.stockItem.findMany({
        where: {
            OR: items.map((item) => ({
                productId: item.productId,
                warehouseId: item.warehouseId,
            })),
        },
        select: {
            productId: true,
            warehouseId: true,
            quantity: true,
        },
    });
    const stockMap = new Map(stockRows.map((row) => [`${row.productId}:${row.warehouseId}`, row.quantity]));
    for (const item of items) {
        const available = (_a = stockMap.get(`${item.productId}:${item.warehouseId}`)) !== null && _a !== void 0 ? _a : 0;
        if (available < item.quantity) {
            throw new HttpError(400, "Insufficient stock for one or more items");
        }
    }
    const saleAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const cogsAmount = items.reduce((sum, item) => {
        var _a;
        const product = productMap.get(item.productId);
        const costPrice = Number((_a = product === null || product === void 0 ? void 0 : product.costPrice) !== null && _a !== void 0 ? _a : 0);
        return sum + item.quantity * costPrice;
    }, 0);
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const accountsReceivable = yield getOrCreateLedgerAccount(tx, organizationId, "Accounts Receivable", "ASSET");
        const revenue = yield getOrCreateLedgerAccount(tx, organizationId, "Revenue", "INCOME");
        const costOfGoodsSold = yield getOrCreateLedgerAccount(tx, organizationId, "Cost of Goods Sold", "EXPENSE");
        const inventory = yield getOrCreateLedgerAccount(tx, organizationId, "Inventory", "ASSET");
        const journalEntries = [
            {
                ledgerAccountId: accountsReceivable.id,
                debit: Number(saleAmount.toFixed(2)),
            },
            {
                ledgerAccountId: revenue.id,
                credit: Number(saleAmount.toFixed(2)),
            },
        ];
        if (cogsAmount > 0) {
            journalEntries.push({
                ledgerAccountId: costOfGoodsSold.id,
                debit: Number(cogsAmount.toFixed(2)),
            }, {
                ledgerAccountId: inventory.id,
                credit: Number(cogsAmount.toFixed(2)),
            });
        }
        const transaction = yield (0, accounting_service_1.createTransactionWithEntries)(organizationId, "SALE", deal.id, journalEntries, {
            contactId: deal.contactId,
            totalAmount: Number(saleAmount.toFixed(2)),
            status: "POSTED",
            transactionDate: new Date(),
            tx,
        });
        for (const item of items) {
            yield (0, inventory_service_1.reduceStockWithDb)(tx, organizationId, item.productId, item.warehouseId, item.quantity, transaction.id, `Deal ${deal.id} marked WON`);
        }
        const updatedDeal = yield tx.deal.update({
            where: { id: deal.id },
            data: {
                status: "WON",
                probability: 100,
                isProcessed: true,
            },
            include: {
                contact: true,
                pipeline: true,
                stage: true,
            },
        });
        return {
            deal: updatedDeal,
            transaction,
            metrics: {
                saleAmount: Number(saleAmount.toFixed(2)),
                cogsAmount: Number(cogsAmount.toFixed(2)),
            },
        };
    }));
});
exports.markDealAsWon = markDealAsWon;
// Helper: Calculate lead score based on data quality
// Scoring formula:
// - +20 if email exists
// - +20 if phone exists
// - +10 if firstName exists
// - +10 if companyName exists
// Max score: 60
const calculateLeadScore = (input) => {
    let score = 0;
    if (input.email)
        score += 20;
    if (input.phone)
        score += 20;
    if (input.firstName)
        score += 10;
    if (input.companyName)
        score += 10;
    return score;
};
const createLead = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate org exists
    const org = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!org) {
        throw new HttpError(404, "Organization not found");
    }
    // STEP 3: Validate assignedTo user belongs to organization (if provided)
    if (input.assignedTo) {
        const assigneeCheck = yield prisma_1.default.organizationUser.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: input.assignedTo,
                },
            },
            select: { userId: true },
        });
        if (!assigneeCheck) {
            throw new HttpError(403, "Assigned user does not belong to this organization");
        }
    }
    let contactId = input.contactId;
    // If contactId not provided, create Contact automatically
    if (!contactId && (input.firstName || input.email || input.phone || input.companyName)) {
        const contact = yield prisma_1.default.contact.create({
            data: {
                organizationId,
                type: "CUSTOMER",
                firstName: input.firstName,
                lastName: input.lastName,
                email: input.email,
                phone: input.phone,
                companyName: input.companyName,
                isActive: true,
            },
        });
        contactId = contact.id;
    }
    // contactId is now either provided or auto-created
    if (!contactId) {
        throw new HttpError(400, "Either contactId or (firstName/email/phone/companyName) must be provided");
    }
    // STEP 3: Verify contact belongs to same org
    const contact = yield prisma_1.default.contact.findUnique({
        where: { id: contactId },
        select: { organizationId: true },
    });
    if (!contact) {
        throw new HttpError(404, "Contact not found");
    }
    if (contact.organizationId !== organizationId) {
        throw new HttpError(403, "Contact does not belong to this organization");
    }
    // Calculate lead score based on data quality
    const score = calculateLeadScore(input);
    // Create lead
    return prisma_1.default.lead.create({
        data: {
            organizationId,
            contactId,
            firstName: input.firstName,
            email: input.email,
            phone: input.phone,
            source: input.source,
            status: input.status || "NEW",
            score,
            assignedTo: input.assignedTo,
        },
        include: {
            contact: true,
            assignee: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });
});
exports.createLead = createLead;
// ============================================
// STEP 3: Soft Delete (Archive) Operations
// ============================================
const archiveLead = (leadId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const lead = yield prisma_1.default.lead.findUnique({
        where: { id: leadId },
        select: { organizationId: true },
    });
    if (!lead) {
        throw new HttpError(404, "Lead not found");
    }
    if (lead.organizationId !== organizationId) {
        throw new HttpError(403, "Lead does not belong to this organization");
    }
    return prisma_1.default.lead.update({
        where: { id: leadId },
        data: {
            isArchived: true,
            archivedAt: new Date(),
        },
    });
});
exports.archiveLead = archiveLead;
const restoreLead = (leadId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const lead = yield prisma_1.default.lead.findUnique({
        where: { id: leadId },
        select: { organizationId: true },
    });
    if (!lead) {
        throw new HttpError(404, "Lead not found");
    }
    if (lead.organizationId !== organizationId) {
        throw new HttpError(403, "Lead does not belong to this organization");
    }
    return prisma_1.default.lead.update({
        where: { id: leadId },
        data: {
            isArchived: false,
            archivedAt: null,
        },
    });
});
exports.restoreLead = restoreLead;
const archiveDeal = (dealId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const deal = yield prisma_1.default.deal.findUnique({
        where: { id: dealId },
        select: { organizationId: true },
    });
    if (!deal) {
        throw new HttpError(404, "Deal not found");
    }
    if (deal.organizationId !== organizationId) {
        throw new HttpError(403, "Deal does not belong to this organization");
    }
    return prisma_1.default.deal.update({
        where: { id: dealId },
        data: {
            isArchived: true,
            archivedAt: new Date(),
        },
    });
});
exports.archiveDeal = archiveDeal;
const restoreDeal = (dealId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const deal = yield prisma_1.default.deal.findUnique({
        where: { id: dealId },
        select: { organizationId: true },
    });
    if (!deal) {
        throw new HttpError(404, "Deal not found");
    }
    if (deal.organizationId !== organizationId) {
        throw new HttpError(403, "Deal does not belong to this organization");
    }
    return prisma_1.default.deal.update({
        where: { id: dealId },
        data: {
            isArchived: false,
            archivedAt: null,
        },
    });
});
exports.restoreDeal = restoreDeal;
const deleteLead = (leadId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const lead = yield prisma_1.default.lead.findUnique({
        where: { id: leadId },
        select: { organizationId: true },
    });
    if (!lead) {
        throw new HttpError(404, "Lead not found");
    }
    if (lead.organizationId !== organizationId) {
        throw new HttpError(403, "Lead does not belong to this organization");
    }
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.activity.deleteMany({ where: { leadId } });
        yield tx.lead.delete({ where: { id: leadId } });
    }));
    return { success: true };
});
exports.deleteLead = deleteLead;
const deleteDeal = (dealId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const deal = yield prisma_1.default.deal.findUnique({
        where: { id: dealId },
        select: { organizationId: true },
    });
    if (!deal) {
        throw new HttpError(404, "Deal not found");
    }
    if (deal.organizationId !== organizationId) {
        throw new HttpError(403, "Deal does not belong to this organization");
    }
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.activity.deleteMany({ where: { dealId } });
        yield tx.dealStageHistory.deleteMany({ where: { dealId } });
        yield tx.deal.delete({ where: { id: dealId } });
    }));
    return { success: true };
});
exports.deleteDeal = deleteDeal;
// ============================================
// QUERY HELPERS (Auto-filter archived)
// ============================================
const getLeads = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.lead.findMany({
        where: {
            organizationId,
            isArchived: false,
        },
        include: {
            contact: true,
            assignee: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
});
exports.getLeads = getLeads;
const getLeadById = (leadId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const lead = yield prisma_1.default.lead.findUnique({
        where: { id: leadId },
        include: {
            contact: true,
            assignee: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });
    if (!lead) {
        throw new HttpError(404, "Lead not found");
    }
    if (lead.organizationId !== organizationId) {
        throw new HttpError(403, "Lead does not belong to this organization");
    }
    if (lead.isArchived) {
        throw new HttpError(404, "Lead not found (archived)");
    }
    return lead;
});
exports.getLeadById = getLeadById;
const getDeals = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.deal.findMany({
        where: {
            organizationId,
            isArchived: false,
        },
        include: {
            contact: true,
            pipeline: true,
            stage: true,
        },
        orderBy: { createdAt: "desc" },
    });
});
exports.getDeals = getDeals;
const getDealById = (dealId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const deal = yield prisma_1.default.deal.findUnique({
        where: { id: dealId },
        include: {
            contact: true,
            pipeline: true,
            stage: true,
        },
    });
    if (!deal) {
        throw new HttpError(404, "Deal not found");
    }
    if (deal.organizationId !== organizationId) {
        throw new HttpError(403, "Deal does not belong to this organization");
    }
    if (deal.isArchived) {
        throw new HttpError(404, "Deal not found (archived)");
    }
    return deal;
});
exports.getDealById = getDealById;
const updateLead = (leadId, organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    const lead = yield prisma_1.default.lead.findUnique({
        where: { id: leadId },
        select: { organizationId: true },
    });
    if (!lead) {
        throw new HttpError(404, "Lead not found");
    }
    if (lead.organizationId !== organizationId) {
        throw new HttpError(403, "Lead does not belong to this organization");
    }
    const data = {};
    if (input.firstName !== undefined)
        data.firstName = input.firstName;
    if (input.email !== undefined)
        data.email = input.email;
    if (input.phone !== undefined)
        data.phone = input.phone;
    if (input.source !== undefined)
        data.source = input.source;
    if (input.status !== undefined)
        data.status = input.status;
    if (input.assignedTo !== undefined) {
        data.assignee = {
            connect: { id: input.assignedTo },
        };
    }
    return prisma_1.default.lead.update({
        where: { id: leadId },
        data,
        include: {
            contact: true,
            assignee: true,
        },
    });
});
exports.updateLead = updateLead;
const createDeal = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate org exists
    const org = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!org) {
        throw new HttpError(404, "Organization not found");
    }
    // Verify contact belongs to org
    const contact = yield prisma_1.default.contact.findUnique({
        where: { id: input.contactId },
        select: { organizationId: true },
    });
    if (!contact || contact.organizationId !== organizationId) {
        throw new HttpError(403, "Contact does not belong to this organization");
    }
    return prisma_1.default.deal.create({
        data: {
            organizationId,
            contactId: input.contactId,
            pipelineId: input.pipelineId,
            stageId: input.stageId,
            value: new client_1.Prisma.Decimal(input.value),
            probability: input.probability || 0,
            status: input.status || "OPEN",
        },
        include: {
            contact: true,
            pipeline: true,
            stage: true,
        },
    });
});
exports.createDeal = createDeal;
const getDealTimeline = (dealId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    // Get deal with validation
    const deal = yield prisma_1.default.deal.findUnique({
        where: { id: dealId },
        select: {
            id: true,
            organizationId: true,
            contactId: true,
            value: true,
            probability: true,
            status: true,
            pipelineId: true,
            stageId: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!deal) {
        throw new HttpError(404, "Deal not found");
    }
    if (deal.organizationId !== organizationId) {
        throw new HttpError(403, "Deal does not belong to this organization");
    }
    // Get activities for this deal, sorted by date
    const activities = yield prisma_1.default.activity.findMany({
        where: { dealId },
        select: {
            id: true,
            type: true,
            note: true,
            dueDate: true,
            completed: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
    // Get stage transition history
    const stageHistory = yield prisma_1.default.dealStageHistory.findMany({
        where: { dealId },
        include: {
            fromStage: {
                select: { name: true },
            },
            toStage: {
                select: { name: true },
            },
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
        orderBy: { changedAt: "desc" },
    });
    // Format stage changes for response
    const stageChanges = stageHistory.map((history) => {
        var _a;
        return ({
            from: ((_a = history.fromStage) === null || _a === void 0 ? void 0 : _a.name) || null,
            to: history.toStage.name,
            changedBy: history.user.firstName && history.user.lastName
                ? `${history.user.firstName} ${history.user.lastName}`
                : history.user.email,
            changedAt: history.changedAt,
        });
    });
    return {
        deal: Object.assign(Object.assign({}, deal), { value: Number(deal.value) }),
        activities,
        stageChanges,
    };
});
exports.getDealTimeline = getDealTimeline;
// ============================================
// STEP 6: Deal Stage Validation + History Tracking
// ============================================
const updateDealStage = (dealId, organizationId, newStageId, changedByUserId) => __awaiter(void 0, void 0, void 0, function* () {
    // Get deal with pipeline info
    const deal = yield prisma_1.default.deal.findUnique({
        where: { id: dealId },
        select: {
            id: true,
            organizationId: true,
            pipelineId: true,
            stageId: true,
        },
    });
    if (!deal) {
        throw new HttpError(404, "Deal not found");
    }
    if (deal.organizationId !== organizationId) {
        throw new HttpError(403, "Deal does not belong to this organization");
    }
    // Validate new stage belongs to SAME pipeline
    const newStage = yield prisma_1.default.stage.findUnique({
        where: { id: newStageId },
        select: {
            id: true,
            pipelineId: true,
            name: true,
        },
    });
    if (!newStage) {
        throw new HttpError(404, "Stage not found");
    }
    if (newStage.pipelineId !== deal.pipelineId) {
        throw new HttpError(400, `Stage "${newStage.name}" does not belong to this deal's pipeline. Invalid stage transition.`);
    }
    // Update deal stage AND create history record
    const updatedDeal = yield prisma_1.default.deal.update({
        where: { id: dealId },
        data: { stageId: newStageId },
        include: {
            contact: true,
            pipeline: true,
            stage: true,
        },
    });
    // Create deal stage transition history (audit log)
    yield prisma_1.default.dealStageHistory.create({
        data: {
            dealId,
            fromStageId: deal.stageId,
            toStageId: newStageId,
            changedBy: changedByUserId,
        },
    });
    return updatedDeal;
});
exports.updateDealStage = updateDealStage;
// ============================================
// STEP 7: Get Deal Stage Transition History
// ============================================
const getStageHistory = (dealId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify deal belongs to organization
    const deal = yield prisma_1.default.deal.findUnique({
        where: { id: dealId },
        select: { organizationId: true },
    });
    if (!deal) {
        throw new HttpError(404, "Deal not found");
    }
    if (deal.organizationId !== organizationId) {
        throw new HttpError(403, "Deal does not belong to this organization");
    }
    // Get stage history sorted by date (most recent first)
    return prisma_1.default.dealStageHistory.findMany({
        where: { dealId },
        include: {
            fromStage: {
                select: {
                    id: true,
                    name: true,
                },
            },
            toStage: {
                select: {
                    id: true,
                    name: true,
                },
            },
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: { changedAt: "desc" },
    });
});
exports.getStageHistory = getStageHistory;
const parseServiceCaseNote = (note) => {
    if (!note) {
        return null;
    }
    try {
        const parsed = JSON.parse(note);
        if (!parsed.subject || !parsed.priority || !parsed.status) {
            return null;
        }
        if (!["LOW", "MEDIUM", "HIGH"].includes(parsed.priority)) {
            return null;
        }
        if (!["OPEN", "IN_PROGRESS", "RESOLVED"].includes(parsed.status)) {
            return null;
        }
        return {
            subject: parsed.subject,
            priority: parsed.priority,
            status: parsed.status,
        };
    }
    catch (_a) {
        return null;
    }
};
const assertLeadBelongsToOrg = (leadId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const lead = yield prisma_1.default.lead.findUnique({
        where: { id: leadId },
        select: { organizationId: true },
    });
    if (!lead || lead.organizationId !== organizationId) {
        throw new HttpError(403, "Lead does not belong to this organization");
    }
});
const assertDealBelongsToOrg = (dealId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const deal = yield prisma_1.default.deal.findUnique({
        where: { id: dealId },
        select: { organizationId: true },
    });
    if (!deal || deal.organizationId !== organizationId) {
        throw new HttpError(403, "Deal does not belong to this organization");
    }
});
const listServiceCases = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const activities = yield prisma_1.default.activity.findMany({
        where: {
            type: "SERVICE_CASE",
            OR: [
                { lead: { organizationId } },
                { deal: { organizationId } },
                { creator: { organizationId } },
                { creator: { memberships: { some: { organizationId } } } },
            ],
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            note: true,
            completed: true,
            leadId: true,
            dealId: true,
            createdAt: true,
        },
    });
    return activities
        .map((activity) => {
        const parsed = parseServiceCaseNote(activity.note);
        if (!parsed) {
            return null;
        }
        return {
            id: activity.id,
            subject: parsed.subject,
            priority: parsed.priority,
            status: activity.completed ? "RESOLVED" : parsed.status,
            leadId: activity.leadId,
            dealId: activity.dealId,
            createdAt: activity.createdAt,
        };
    })
        .filter((item) => Boolean(item));
});
exports.listServiceCases = listServiceCases;
const createServiceCase = (organizationId, userId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!((_a = input.subject) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new HttpError(400, "subject is required");
    }
    const priority = (_b = input.priority) !== null && _b !== void 0 ? _b : "MEDIUM";
    if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) {
        throw new HttpError(400, "priority must be LOW, MEDIUM, or HIGH");
    }
    if (input.leadId) {
        yield assertLeadBelongsToOrg(input.leadId, organizationId);
    }
    if (input.dealId) {
        yield assertDealBelongsToOrg(input.dealId, organizationId);
    }
    const note = {
        subject: input.subject.trim(),
        priority,
        status: "OPEN",
    };
    const activity = yield prisma_1.default.activity.create({
        data: {
            type: "SERVICE_CASE",
            note: JSON.stringify(note),
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
            createdBy: userId,
            leadId: input.leadId,
            dealId: input.dealId,
            completed: false,
        },
        select: {
            id: true,
            createdAt: true,
            leadId: true,
            dealId: true,
        },
    });
    return {
        id: activity.id,
        subject: note.subject,
        priority: note.priority,
        status: note.status,
        leadId: activity.leadId,
        dealId: activity.dealId,
        createdAt: activity.createdAt,
    };
});
exports.createServiceCase = createServiceCase;
const updateServiceCaseStatus = (caseId, organizationId, status) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (!["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) {
        throw new HttpError(400, "status must be OPEN, IN_PROGRESS, or RESOLVED");
    }
    const activity = yield prisma_1.default.activity.findUnique({
        where: { id: caseId },
        select: {
            id: true,
            type: true,
            note: true,
            leadId: true,
            dealId: true,
            createdAt: true,
            lead: { select: { organizationId: true } },
            deal: { select: { organizationId: true } },
            creator: {
                select: {
                    organizationId: true,
                    memberships: { select: { organizationId: true } },
                },
            },
        },
    });
    if (!activity || activity.type !== "SERVICE_CASE") {
        throw new HttpError(404, "Service case not found");
    }
    const belongsToOrg = ((_a = activity.lead) === null || _a === void 0 ? void 0 : _a.organizationId) === organizationId ||
        ((_b = activity.deal) === null || _b === void 0 ? void 0 : _b.organizationId) === organizationId ||
        ((_c = activity.creator) === null || _c === void 0 ? void 0 : _c.organizationId) === organizationId ||
        Boolean((_d = activity.creator) === null || _d === void 0 ? void 0 : _d.memberships.some((membership) => membership.organizationId === organizationId));
    if (!belongsToOrg) {
        throw new HttpError(403, "Service case does not belong to this organization");
    }
    const parsed = parseServiceCaseNote(activity.note);
    if (!parsed) {
        throw new HttpError(400, "Service case data is invalid");
    }
    const updatedNote = Object.assign(Object.assign({}, parsed), { status });
    yield prisma_1.default.activity.update({
        where: { id: caseId },
        data: {
            note: JSON.stringify(updatedNote),
            completed: status === "RESOLVED",
        },
    });
    return {
        id: activity.id,
        subject: updatedNote.subject,
        priority: updatedNote.priority,
        status: updatedNote.status,
        leadId: activity.leadId,
        dealId: activity.dealId,
        createdAt: activity.createdAt,
    };
});
exports.updateServiceCaseStatus = updateServiceCaseStatus;
const updateServiceCase = (caseId, organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const activity = yield prisma_1.default.activity.findUnique({
        where: { id: caseId },
        select: {
            id: true,
            type: true,
            note: true,
            leadId: true,
            dealId: true,
            createdAt: true,
            lead: { select: { organizationId: true } },
            deal: { select: { organizationId: true } },
            creator: {
                select: {
                    organizationId: true,
                    memberships: { select: { organizationId: true } },
                },
            },
        },
    });
    if (!activity || activity.type !== "SERVICE_CASE") {
        throw new HttpError(404, "Service case not found");
    }
    const belongsToOrg = ((_a = activity.lead) === null || _a === void 0 ? void 0 : _a.organizationId) === organizationId ||
        ((_b = activity.deal) === null || _b === void 0 ? void 0 : _b.organizationId) === organizationId ||
        ((_c = activity.creator) === null || _c === void 0 ? void 0 : _c.organizationId) === organizationId ||
        Boolean((_d = activity.creator) === null || _d === void 0 ? void 0 : _d.memberships.some((membership) => membership.organizationId === organizationId));
    if (!belongsToOrg) {
        throw new HttpError(403, "Service case does not belong to this organization");
    }
    const parsed = parseServiceCaseNote(activity.note);
    if (!parsed) {
        throw new HttpError(400, "Service case data is invalid");
    }
    if (input.subject !== undefined && !input.subject.trim()) {
        throw new HttpError(400, "subject cannot be empty");
    }
    if (input.priority !== undefined && !["LOW", "MEDIUM", "HIGH"].includes(input.priority)) {
        throw new HttpError(400, "priority must be LOW, MEDIUM, or HIGH");
    }
    if (input.status !== undefined && !["OPEN", "IN_PROGRESS", "RESOLVED"].includes(input.status)) {
        throw new HttpError(400, "status must be OPEN, IN_PROGRESS, or RESOLVED");
    }
    const updatedNote = {
        subject: input.subject !== undefined ? input.subject.trim() : parsed.subject,
        priority: (_e = input.priority) !== null && _e !== void 0 ? _e : parsed.priority,
        status: (_f = input.status) !== null && _f !== void 0 ? _f : parsed.status,
    };
    yield prisma_1.default.activity.update({
        where: { id: caseId },
        data: {
            note: JSON.stringify(updatedNote),
            completed: updatedNote.status === "RESOLVED",
        },
    });
    return {
        id: activity.id,
        subject: updatedNote.subject,
        priority: updatedNote.priority,
        status: updatedNote.status,
        leadId: activity.leadId,
        dealId: activity.dealId,
        createdAt: activity.createdAt,
    };
});
exports.updateServiceCase = updateServiceCase;
const deleteServiceCase = (caseId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const activity = yield prisma_1.default.activity.findUnique({
        where: { id: caseId },
        select: {
            id: true,
            type: true,
            lead: { select: { organizationId: true } },
            deal: { select: { organizationId: true } },
            creator: {
                select: {
                    organizationId: true,
                    memberships: { select: { organizationId: true } },
                },
            },
        },
    });
    if (!activity || activity.type !== "SERVICE_CASE") {
        throw new HttpError(404, "Service case not found");
    }
    const belongsToOrg = ((_a = activity.lead) === null || _a === void 0 ? void 0 : _a.organizationId) === organizationId ||
        ((_b = activity.deal) === null || _b === void 0 ? void 0 : _b.organizationId) === organizationId ||
        ((_c = activity.creator) === null || _c === void 0 ? void 0 : _c.organizationId) === organizationId ||
        Boolean((_d = activity.creator) === null || _d === void 0 ? void 0 : _d.memberships.some((membership) => membership.organizationId === organizationId));
    if (!belongsToOrg) {
        throw new HttpError(403, "Service case does not belong to this organization");
    }
    yield prisma_1.default.activity.delete({ where: { id: caseId } });
    return { success: true };
});
exports.deleteServiceCase = deleteServiceCase;
const parseCampaignNote = (note) => {
    if (!note) {
        return null;
    }
    try {
        const parsed = JSON.parse(note);
        if (!parsed.name || !parsed.segment || !parsed.status) {
            return null;
        }
        if (!["DRAFT", "RUNNING", "PAUSED"].includes(parsed.status)) {
            return null;
        }
        return {
            name: parsed.name,
            segment: parsed.segment,
            status: parsed.status,
        };
    }
    catch (_a) {
        return null;
    }
};
const listCampaigns = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const activities = yield prisma_1.default.activity.findMany({
        where: {
            type: "MARKETING_CAMPAIGN",
            OR: [{ creator: { organizationId } }, { creator: { memberships: { some: { organizationId } } } }],
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            note: true,
            createdAt: true,
        },
    });
    return activities
        .map((activity) => {
        const parsed = parseCampaignNote(activity.note);
        if (!parsed) {
            return null;
        }
        return {
            id: activity.id,
            name: parsed.name,
            segment: parsed.segment,
            status: parsed.status,
            createdAt: activity.createdAt,
        };
    })
        .filter((item) => Boolean(item));
});
exports.listCampaigns = listCampaigns;
const createCampaign = (organizationId, userId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!((_a = input.name) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new HttpError(400, "name is required");
    }
    if (!((_b = input.segment) === null || _b === void 0 ? void 0 : _b.trim())) {
        throw new HttpError(400, "segment is required");
    }
    const status = (_c = input.status) !== null && _c !== void 0 ? _c : "DRAFT";
    if (!["DRAFT", "RUNNING", "PAUSED"].includes(status)) {
        throw new HttpError(400, "status must be DRAFT, RUNNING, or PAUSED");
    }
    const note = {
        name: input.name.trim(),
        segment: input.segment.trim(),
        status,
    };
    const activity = yield prisma_1.default.activity.create({
        data: {
            type: "MARKETING_CAMPAIGN",
            note: JSON.stringify(note),
            createdBy: userId,
            completed: status !== "RUNNING",
        },
        select: {
            id: true,
            createdAt: true,
        },
    });
    return {
        id: activity.id,
        name: note.name,
        segment: note.segment,
        status: note.status,
        createdAt: activity.createdAt,
    };
});
exports.createCampaign = createCampaign;
const updateCampaignStatus = (campaignId, organizationId, status) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!["DRAFT", "RUNNING", "PAUSED"].includes(status)) {
        throw new HttpError(400, "status must be DRAFT, RUNNING, or PAUSED");
    }
    const activity = yield prisma_1.default.activity.findUnique({
        where: { id: campaignId },
        select: {
            id: true,
            type: true,
            note: true,
            createdAt: true,
            creator: {
                select: {
                    organizationId: true,
                    memberships: { select: { organizationId: true } },
                },
            },
        },
    });
    if (!activity || activity.type !== "MARKETING_CAMPAIGN") {
        throw new HttpError(404, "Campaign not found");
    }
    const belongsToOrg = ((_a = activity.creator) === null || _a === void 0 ? void 0 : _a.organizationId) === organizationId ||
        Boolean((_b = activity.creator) === null || _b === void 0 ? void 0 : _b.memberships.some((membership) => membership.organizationId === organizationId));
    if (!belongsToOrg) {
        throw new HttpError(403, "Campaign does not belong to this organization");
    }
    const parsed = parseCampaignNote(activity.note);
    if (!parsed) {
        throw new HttpError(400, "Campaign data is invalid");
    }
    const updatedNote = Object.assign(Object.assign({}, parsed), { status });
    yield prisma_1.default.activity.update({
        where: { id: campaignId },
        data: {
            note: JSON.stringify(updatedNote),
            completed: status !== "RUNNING",
        },
    });
    return {
        id: activity.id,
        name: updatedNote.name,
        segment: updatedNote.segment,
        status: updatedNote.status,
        createdAt: activity.createdAt,
    };
});
exports.updateCampaignStatus = updateCampaignStatus;
const updateCampaign = (campaignId, organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const activity = yield prisma_1.default.activity.findUnique({
        where: { id: campaignId },
        select: {
            id: true,
            type: true,
            note: true,
            createdAt: true,
            creator: {
                select: {
                    organizationId: true,
                    memberships: { select: { organizationId: true } },
                },
            },
        },
    });
    if (!activity || activity.type !== "MARKETING_CAMPAIGN") {
        throw new HttpError(404, "Campaign not found");
    }
    const belongsToOrg = ((_a = activity.creator) === null || _a === void 0 ? void 0 : _a.organizationId) === organizationId ||
        Boolean((_b = activity.creator) === null || _b === void 0 ? void 0 : _b.memberships.some((membership) => membership.organizationId === organizationId));
    if (!belongsToOrg) {
        throw new HttpError(403, "Campaign does not belong to this organization");
    }
    const parsed = parseCampaignNote(activity.note);
    if (!parsed) {
        throw new HttpError(400, "Campaign data is invalid");
    }
    if (input.name !== undefined && !input.name.trim()) {
        throw new HttpError(400, "name cannot be empty");
    }
    if (input.segment !== undefined && !input.segment.trim()) {
        throw new HttpError(400, "segment cannot be empty");
    }
    if (input.status !== undefined && !["DRAFT", "RUNNING", "PAUSED"].includes(input.status)) {
        throw new HttpError(400, "status must be DRAFT, RUNNING, or PAUSED");
    }
    const updatedNote = {
        name: input.name !== undefined ? input.name.trim() : parsed.name,
        segment: input.segment !== undefined ? input.segment.trim() : parsed.segment,
        status: (_c = input.status) !== null && _c !== void 0 ? _c : parsed.status,
    };
    yield prisma_1.default.activity.update({
        where: { id: campaignId },
        data: {
            note: JSON.stringify(updatedNote),
            completed: updatedNote.status !== "RUNNING",
        },
    });
    return {
        id: activity.id,
        name: updatedNote.name,
        segment: updatedNote.segment,
        status: updatedNote.status,
        createdAt: activity.createdAt,
    };
});
exports.updateCampaign = updateCampaign;
const deleteCampaign = (campaignId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const activity = yield prisma_1.default.activity.findUnique({
        where: { id: campaignId },
        select: {
            id: true,
            type: true,
            creator: {
                select: {
                    organizationId: true,
                    memberships: { select: { organizationId: true } },
                },
            },
        },
    });
    if (!activity || activity.type !== "MARKETING_CAMPAIGN") {
        throw new HttpError(404, "Campaign not found");
    }
    const belongsToOrg = ((_a = activity.creator) === null || _a === void 0 ? void 0 : _a.organizationId) === organizationId ||
        Boolean((_b = activity.creator) === null || _b === void 0 ? void 0 : _b.memberships.some((membership) => membership.organizationId === organizationId));
    if (!belongsToOrg) {
        throw new HttpError(403, "Campaign does not belong to this organization");
    }
    yield prisma_1.default.activity.delete({ where: { id: campaignId } });
    return { success: true };
});
exports.deleteCampaign = deleteCampaign;
const createPipeline = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const name = (_a = input.name) === null || _a === void 0 ? void 0 : _a.trim();
    if (!name) {
        throw new HttpError(400, "name is required");
    }
    const pipeline = yield prisma_1.default.pipeline.create({
        data: {
            organizationId,
            name,
        },
        select: {
            id: true,
            name: true,
            stages: {
                orderBy: { order: "asc" },
                select: { id: true, name: true, order: true },
            },
        },
    });
    return pipeline;
});
exports.createPipeline = createPipeline;
const updatePipeline = (pipelineId, organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (input.name !== undefined && !input.name.trim()) {
        throw new HttpError(400, "name cannot be empty");
    }
    const pipeline = yield prisma_1.default.pipeline.findUnique({ where: { id: pipelineId }, select: { organizationId: true } });
    if (!pipeline) {
        throw new HttpError(404, "Pipeline not found");
    }
    if (pipeline.organizationId !== organizationId) {
        throw new HttpError(403, "Pipeline does not belong to this organization");
    }
    const updated = yield prisma_1.default.pipeline.update({
        where: { id: pipelineId },
        data: {
            name: (_a = input.name) === null || _a === void 0 ? void 0 : _a.trim(),
        },
        select: {
            id: true,
            name: true,
            stages: {
                orderBy: { order: "asc" },
                select: { id: true, name: true, order: true },
            },
        },
    });
    return updated;
});
exports.updatePipeline = updatePipeline;
const deletePipeline = (pipelineId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const pipeline = yield prisma_1.default.pipeline.findUnique({ where: { id: pipelineId }, select: { organizationId: true } });
    if (!pipeline) {
        throw new HttpError(404, "Pipeline not found");
    }
    if (pipeline.organizationId !== organizationId) {
        throw new HttpError(403, "Pipeline does not belong to this organization");
    }
    const dealsCount = yield prisma_1.default.deal.count({ where: { pipelineId } });
    if (dealsCount > 0) {
        throw new HttpError(400, "Cannot delete pipeline with existing deals");
    }
    yield prisma_1.default.pipeline.delete({ where: { id: pipelineId } });
    return { success: true };
});
exports.deletePipeline = deletePipeline;
const createStage = (pipelineId, organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const name = (_a = input.name) === null || _a === void 0 ? void 0 : _a.trim();
    if (!name) {
        throw new HttpError(400, "name is required");
    }
    const pipeline = yield prisma_1.default.pipeline.findUnique({ where: { id: pipelineId }, select: { organizationId: true } });
    if (!pipeline) {
        throw new HttpError(404, "Pipeline not found");
    }
    if (pipeline.organizationId !== organizationId) {
        throw new HttpError(403, "Pipeline does not belong to this organization");
    }
    let order = input.order;
    if (order === undefined || order === null) {
        const maxStage = yield prisma_1.default.stage.findFirst({
            where: { pipelineId },
            orderBy: { order: "desc" },
            select: { order: true },
        });
        order = ((_b = maxStage === null || maxStage === void 0 ? void 0 : maxStage.order) !== null && _b !== void 0 ? _b : 0) + 1;
    }
    const existingOrder = yield prisma_1.default.stage.findFirst({ where: { pipelineId, order } });
    if (existingOrder) {
        throw new HttpError(400, "Stage order already exists in this pipeline");
    }
    return prisma_1.default.stage.create({
        data: {
            pipelineId,
            name,
            order,
        },
        select: { id: true, name: true, order: true, pipelineId: true },
    });
});
exports.createStage = createStage;
const updateStage = (stageId, organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (input.name !== undefined && !input.name.trim()) {
        throw new HttpError(400, "name cannot be empty");
    }
    const stage = yield prisma_1.default.stage.findUnique({
        where: { id: stageId },
        select: { id: true, pipelineId: true, pipeline: { select: { organizationId: true } } },
    });
    if (!stage) {
        throw new HttpError(404, "Stage not found");
    }
    if (stage.pipeline.organizationId !== organizationId) {
        throw new HttpError(403, "Stage does not belong to this organization");
    }
    if (input.order !== undefined) {
        const existingOrder = yield prisma_1.default.stage.findFirst({
            where: {
                pipelineId: stage.pipelineId,
                order: input.order,
                id: { not: stageId },
            },
            select: { id: true },
        });
        if (existingOrder) {
            throw new HttpError(400, "Stage order already exists in this pipeline");
        }
    }
    return prisma_1.default.stage.update({
        where: { id: stageId },
        data: {
            name: (_a = input.name) === null || _a === void 0 ? void 0 : _a.trim(),
            order: input.order,
        },
        select: { id: true, name: true, order: true, pipelineId: true },
    });
});
exports.updateStage = updateStage;
const deleteStage = (stageId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const stage = yield prisma_1.default.stage.findUnique({
        where: { id: stageId },
        select: { id: true, pipeline: { select: { organizationId: true } } },
    });
    if (!stage) {
        throw new HttpError(404, "Stage not found");
    }
    if (stage.pipeline.organizationId !== organizationId) {
        throw new HttpError(403, "Stage does not belong to this organization");
    }
    const dealsCount = yield prisma_1.default.deal.count({ where: { stageId } });
    if (dealsCount > 0) {
        throw new HttpError(400, "Cannot delete stage with existing deals");
    }
    yield prisma_1.default.stage.delete({ where: { id: stageId } });
    return { success: true };
});
exports.deleteStage = deleteStage;
const listIntegrationModules = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const modules = yield prisma_1.default.module.findMany({
        where: {
            isActive: true,
            name: {
                not: "CRM",
            },
        },
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            description: true,
            updatedAt: true,
        },
    });
    const moduleIds = modules.map((moduleItem) => moduleItem.id);
    const orgModuleRows = moduleIds.length
        ? yield prisma_1.default.organizationModule.findMany({
            where: {
                organizationId,
                moduleId: { in: moduleIds },
            },
            select: {
                moduleId: true,
                isEnabled: true,
            },
        })
        : [];
    const orgModuleMap = new Map(orgModuleRows.map((row) => [row.moduleId, row.isEnabled]));
    return modules.map((moduleItem) => {
        var _a, _b;
        return {
            moduleId: moduleItem.id,
            moduleName: moduleItem.name,
            description: (_a = moduleItem.description) !== null && _a !== void 0 ? _a : null,
            isConnected: (_b = orgModuleMap.get(moduleItem.id)) !== null && _b !== void 0 ? _b : false,
            updatedAt: moduleItem.updatedAt,
        };
    });
});
exports.listIntegrationModules = listIntegrationModules;
const setIntegrationConnection = (organizationId, moduleId, isConnected) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const moduleItem = yield prisma_1.default.module.findUnique({
        where: { id: moduleId },
        select: { id: true, name: true, description: true, isActive: true, updatedAt: true },
    });
    if (!moduleItem || !moduleItem.isActive) {
        throw new HttpError(404, "Module not found");
    }
    if (moduleItem.name === "CRM") {
        throw new HttpError(400, "CRM module connection cannot be changed here");
    }
    const organizationModule = yield prisma_1.default.organizationModule.upsert({
        where: {
            organizationId_moduleId: {
                organizationId,
                moduleId,
            },
        },
        update: {
            isEnabled: isConnected,
        },
        create: {
            organizationId,
            moduleId,
            isEnabled: isConnected,
        },
        select: {
            isEnabled: true,
        },
    });
    return {
        moduleId: moduleItem.id,
        moduleName: moduleItem.name,
        description: (_a = moduleItem.description) !== null && _a !== void 0 ? _a : null,
        isConnected: organizationModule.isEnabled,
        updatedAt: moduleItem.updatedAt,
    };
});
exports.setIntegrationConnection = setIntegrationConnection;
const resetCrmData = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const org = yield prisma_1.default.organization.findUnique({ where: { id: organizationId }, select: { id: true } });
    if (!org) {
        throw new HttpError(404, "Organization not found");
    }
    const organizationUsers = yield prisma_1.default.organizationUser.findMany({
        where: { organizationId },
        select: { userId: true },
    });
    const userIds = [...new Set(organizationUsers.map((item) => item.userId))];
    const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const activityWhere = userIds.length
            ? {
                OR: [
                    { lead: { organizationId } },
                    { deal: { organizationId } },
                    { createdBy: { in: userIds }, type: { in: ["SERVICE_CASE", "MARKETING_CAMPAIGN"] } },
                ],
            }
            : {
                OR: [{ lead: { organizationId } }, { deal: { organizationId } }],
            };
        const deletedActivities = yield tx.activity.deleteMany({ where: activityWhere });
        const deletedStageHistory = yield tx.dealStageHistory.deleteMany({ where: { deal: { organizationId } } });
        const deletedDeals = yield tx.deal.deleteMany({ where: { organizationId } });
        const deletedLeads = yield tx.lead.deleteMany({ where: { organizationId } });
        const deletedStages = yield tx.stage.deleteMany({ where: { pipeline: { organizationId } } });
        const deletedPipelines = yield tx.pipeline.deleteMany({ where: { organizationId } });
        return {
            deletedActivities: deletedActivities.count,
            deletedStageHistory: deletedStageHistory.count,
            deletedDeals: deletedDeals.count,
            deletedLeads: deletedLeads.count,
            deletedStages: deletedStages.count,
            deletedPipelines: deletedPipelines.count,
        };
    }));
    return Object.assign({ message: "CRM data deleted successfully" }, result);
});
exports.resetCrmData = resetCrmData;
