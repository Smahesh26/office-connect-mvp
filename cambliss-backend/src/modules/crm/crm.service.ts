import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";
import { createTransactionWithEntries } from "../accounting/accounting.service";
import { reduceStockWithDb } from "../inventory/inventory.service";

export class HttpError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "HttpError";
	}
}

// ============================================
// STEP 1: Sales Dashboard with Aggregations
// ============================================

export interface SalesDashboard {
	totalLeads: number;
	totalActiveDeals: number;
	totalOpenDeals: number;
	totalWonDeals: number;
	openDealsValue: number;
	wonDealsValue: number;
	lostDealsCount: number;
	expectedRevenue: number;
	conversionRate: number;
	winRate: number;
	dealsGroupedByStage: Array<{
		stageName: string;
		count: number;
		totalValue: number;
	}>;
	monthlyForecast: Array<{
		month: string; // YYYY-MM format
		projectedRevenue: number;
		dealCount: number;
	}>;
	revenueThisMonth: number;
	unitsSold: number;
	topSellingProducts: Array<{
		productId: string;
		name: string;
		sku: string;
		unitsSold: number;
	}>;
	inventoryTurnover: number;
}

export interface NoCostCrmProfile {
	mode: "NO_COST";
	requiresThirdPartyApis: false;
	coreCapabilities: {
		customerData: boolean;
		leadManagement: boolean;
		salesPipeline: boolean;
		communicationTracking: boolean;
		automationReady: boolean;
		reportsAndInsights: boolean;
		supportWorkflow: boolean;
	};
	stats: {
		contacts: number;
		leads: number;
		deals: number;
		pipelines: number;
		stages: number;
		activities: number;
	};
	optionalPaidIntegrations: Array<{
		name: string;
		required: false;
		useCase: string;
	}>;
}

export const getNoCostCrmProfile = async (organizationId: string): Promise<NoCostCrmProfile> => {
	const [contacts, leads, deals, pipelines, stages, activities] = await Promise.all([
		prisma.contact.count({ where: { organizationId } }),
		prisma.lead.count({ where: { organizationId } }),
		prisma.deal.count({ where: { organizationId } }),
		prisma.pipeline.count({ where: { organizationId } }),
		prisma.stage.count({ where: { pipeline: { organizationId } } }),
		prisma.activity.count({
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
};

export interface CrmSetupContactOption {
	id: string;
	label: string;
	email: string | null;
	phone: string | null;
}

export interface CrmSetupStageOption {
	id: string;
	name: string;
	order: number;
}

export interface CrmSetupPipelineOption {
	id: string;
	name: string;
	stages: CrmSetupStageOption[];
}

export interface CrmSetupOptions {
	contacts: CrmSetupContactOption[];
	pipelines: CrmSetupPipelineOption[];
}

export const getCrmSetupOptions = async (organizationId: string): Promise<CrmSetupOptions> => {
	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!org) {
		throw new HttpError(404, "Organization not found");
	}

	const contacts = await prisma.contact.findMany({
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

	let pipelines = await prisma.pipeline.findMany({
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
		await prisma.pipeline.create({
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

		pipelines = await prisma.pipeline.findMany({
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
};

export const getSalesDashboard = async (organizationId: string): Promise<SalesDashboard> => {
	// Validate org exists
	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!org) {
		throw new HttpError(404, "Organization not found");
	}

	// Count total leads (active only)
	const totalLeads = await prisma.lead.count({
		where: {
			organizationId,
			isArchived: false,
		},
	});

	// Count total deals (active only)
	const totalDeals = await prisma.deal.count({
		where: {
			organizationId,
			isArchived: false,
		},
	});

	// Count OPEN deals
	const totalOpenDeals = await prisma.deal.count({
		where: {
			organizationId,
			status: "OPEN",
			isArchived: false,
		},
	});

	// Count WON deals
	const totalWonDeals = await prisma.deal.count({
		where: {
			organizationId,
			status: "WON",
			isArchived: false,
		},
	});

	// Sum OPEN deals value
	const openDealsAgg = await prisma.deal.aggregate({
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
	const wonDealsAgg = await prisma.deal.aggregate({
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
	const allOpenDeals = await prisma.deal.findMany({
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
	const lostDealsCount = await prisma.deal.count({
		where: {
			organizationId,
			status: "LOST",
			isArchived: false,
		},
	});

	// Calculate conversion rate: WON / (WON + LOST)
	const conversionRate =
		totalWonDeals + lostDealsCount > 0 ? (totalWonDeals / (totalWonDeals + lostDealsCount)) * 100 : 0;

	// Group deals by stage
	const dealsGroupedByStage = await prisma.stage.findMany({
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
	const openDealsWithDates = await prisma.deal.findMany({
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
	const monthlyMap = new Map<string, { projectedRevenue: number; dealCount: number }>();

	openDealsWithDates.forEach((deal) => {
		if (deal.expectedClose) {
			const monthKey = deal.expectedClose.toISOString().slice(0, 7); // YYYY-MM
			const expectedValue = Number(deal.value) * (deal.probability / 100);

			if (monthlyMap.has(monthKey)) {
				const existing = monthlyMap.get(monthKey)!;
				existing.projectedRevenue += expectedValue;
				existing.dealCount += 1;
			} else {
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

	const revenueThisMonthAgg = await prisma.transaction.aggregate({
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

	const unitsSoldAgg = await prisma.stockMovement.aggregate({
		where: {
			organizationId,
			type: "SALE",
		},
		_sum: {
			quantity: true,
		},
	});

	const unitsSold = Math.abs(Number(unitsSoldAgg._sum.quantity ?? 0));

	const salesByProduct = await prisma.stockMovement.groupBy({
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
		? await prisma.product.findMany({
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
			const product = productMap.get(entry.productId);
			if (!product) {
				return null;
			}

			return {
				productId: entry.productId,
				name: product.name,
				sku: product.sku,
				unitsSold: Math.abs(entry._sum.quantity ?? 0),
			};
		})
		.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

	const stockItems = await prisma.stockItem.findMany({
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
		const costPrice = Number(item.product.costPrice ?? 0);
		return sum + item.quantity * costPrice;
	}, 0);

	const soldMovements = await prisma.stockMovement.findMany({
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
		const costPrice = Number(movement.product.costPrice ?? 0);
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
};

export interface DealSaleItemInput {
	productId: string;
	warehouseId: string;
	quantity: number;
	unitPrice: number;
}

const validateDealSaleItems = (items: DealSaleItemInput[]): void => {
	if (!Array.isArray(items) || items.length === 0) {
		throw new HttpError(400, "items must be a non-empty array");
	}

	for (const item of items) {
		if (!item.productId?.trim()) {
			throw new HttpError(400, "productId is required for each item");
		}

		if (!item.warehouseId?.trim()) {
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

const getOrCreateLedgerAccount = async (
	db: Prisma.TransactionClient,
	organizationId: string,
	name: string,
	type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE",
) => {
	const existing = await db.ledgerAccount.findFirst({
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
};

export const markDealAsWon = async (
	dealId: string,
	organizationId: string,
	items: DealSaleItemInput[],
) => {
	validateDealSaleItems(items);

	const deal = await prisma.deal.findUnique({
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

	const products = await prisma.product.findMany({
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

	const warehouses = await prisma.warehouse.findMany({
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

	const stockRows = await prisma.stockItem.findMany({
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
		const available = stockMap.get(`${item.productId}:${item.warehouseId}`) ?? 0;
		if (available < item.quantity) {
			throw new HttpError(400, "Insufficient stock for one or more items");
		}
	}

	const saleAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
	const cogsAmount = items.reduce((sum, item) => {
		const product = productMap.get(item.productId);
		const costPrice = Number(product?.costPrice ?? 0);
		return sum + item.quantity * costPrice;
	}, 0);

	return prisma.$transaction(async (tx) => {
		const accountsReceivable = await getOrCreateLedgerAccount(tx, organizationId, "Accounts Receivable", "ASSET");
		const revenue = await getOrCreateLedgerAccount(tx, organizationId, "Revenue", "INCOME");
		const costOfGoodsSold = await getOrCreateLedgerAccount(tx, organizationId, "Cost of Goods Sold", "EXPENSE");
		const inventory = await getOrCreateLedgerAccount(tx, organizationId, "Inventory", "ASSET");

		const journalEntries: Array<{
			ledgerAccountId: string;
			debit?: number;
			credit?: number;
		}> = [
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
			journalEntries.push(
				{
					ledgerAccountId: costOfGoodsSold.id,
					debit: Number(cogsAmount.toFixed(2)),
				},
				{
					ledgerAccountId: inventory.id,
					credit: Number(cogsAmount.toFixed(2)),
				},
			);
		}

		const transaction = await createTransactionWithEntries(
			organizationId,
			"SALE",
			deal.id,
			journalEntries,
			{
				contactId: deal.contactId,
				totalAmount: Number(saleAmount.toFixed(2)),
				status: "POSTED",
				transactionDate: new Date(),
				tx,
			},
		);

		for (const item of items) {
			await reduceStockWithDb(
				tx,
				organizationId,
				item.productId,
				item.warehouseId,
				item.quantity,
				transaction.id,
				`Deal ${deal.id} marked WON`,
			);
		}

		const updatedDeal = await tx.deal.update({
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
	});
};

// ============================================
// STEP 2: Lead Creation with Auto Contact
// ============================================

export interface CreateLeadInput {
	contactId?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	companyName?: string;
	source?: string;
	status?: string;
	assignedTo?: string;
}

// Helper: Calculate lead score based on data quality
// Scoring formula:
// - +20 if email exists
// - +20 if phone exists
// - +10 if firstName exists
// - +10 if companyName exists
// Max score: 60
const calculateLeadScore = (input: CreateLeadInput): number => {
	let score = 0;

	if (input.email) score += 20;
	if (input.phone) score += 20;
	if (input.firstName) score += 10;
	if (input.companyName) score += 10;

	return score;
};

export const createLead = async (organizationId: string, input: CreateLeadInput) => {
	// Validate org exists
	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!org) {
		throw new HttpError(404, "Organization not found");
	}

	// STEP 3: Validate assignedTo user belongs to organization (if provided)
	if (input.assignedTo) {
		const assigneeCheck = await prisma.organizationUser.findUnique({
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
		const contact = await prisma.contact.create({
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
	const contact = await prisma.contact.findUnique({
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
	return prisma.lead.create({
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
};

// ============================================
// STEP 3: Soft Delete (Archive) Operations
// ============================================

export const archiveLead = async (leadId: string, organizationId: string) => {
	const lead = await prisma.lead.findUnique({
		where: { id: leadId },
		select: { organizationId: true },
	});

	if (!lead) {
		throw new HttpError(404, "Lead not found");
	}

	if (lead.organizationId !== organizationId) {
		throw new HttpError(403, "Lead does not belong to this organization");
	}

	return prisma.lead.update({
		where: { id: leadId },
		data: { 
			isArchived: true,
			archivedAt: new Date(),
		},
	});
};

export const restoreLead = async (leadId: string, organizationId: string) => {
	const lead = await prisma.lead.findUnique({
		where: { id: leadId },
		select: { organizationId: true },
	});

	if (!lead) {
		throw new HttpError(404, "Lead not found");
	}

	if (lead.organizationId !== organizationId) {
		throw new HttpError(403, "Lead does not belong to this organization");
	}

	return prisma.lead.update({
		where: { id: leadId },
		data: { 
			isArchived: false,
			archivedAt: null,
		},
	});
};

export const archiveDeal = async (dealId: string, organizationId: string) => {
	const deal = await prisma.deal.findUnique({
		where: { id: dealId },
		select: { organizationId: true },
	});

	if (!deal) {
		throw new HttpError(404, "Deal not found");
	}

	if (deal.organizationId !== organizationId) {
		throw new HttpError(403, "Deal does not belong to this organization");
	}

	return prisma.deal.update({
		where: { id: dealId },
		data: { 
			isArchived: true,
			archivedAt: new Date(),
		},
	});
};

export const restoreDeal = async (dealId: string, organizationId: string) => {
	const deal = await prisma.deal.findUnique({
		where: { id: dealId },
		select: { organizationId: true },
	});

	if (!deal) {
		throw new HttpError(404, "Deal not found");
	}

	if (deal.organizationId !== organizationId) {
		throw new HttpError(403, "Deal does not belong to this organization");
	}

	return prisma.deal.update({
		where: { id: dealId },
		data: { 
			isArchived: false,
			archivedAt: null,
		},
	});
};

	export const deleteLead = async (leadId: string, organizationId: string) => {
		const lead = await prisma.lead.findUnique({
			where: { id: leadId },
			select: { organizationId: true },
		});

		if (!lead) {
			throw new HttpError(404, "Lead not found");
		}

		if (lead.organizationId !== organizationId) {
			throw new HttpError(403, "Lead does not belong to this organization");
		}

		await prisma.$transaction(async (tx) => {
			await tx.activity.deleteMany({ where: { leadId } });
			await tx.lead.delete({ where: { id: leadId } });
		});

		return { success: true };
	};

	export const deleteDeal = async (dealId: string, organizationId: string) => {
		const deal = await prisma.deal.findUnique({
			where: { id: dealId },
			select: { organizationId: true },
		});

		if (!deal) {
			throw new HttpError(404, "Deal not found");
		}

		if (deal.organizationId !== organizationId) {
			throw new HttpError(403, "Deal does not belong to this organization");
		}

		await prisma.$transaction(async (tx) => {
			await tx.activity.deleteMany({ where: { dealId } });
			await tx.dealStageHistory.deleteMany({ where: { dealId } });
			await tx.deal.delete({ where: { id: dealId } });
		});

		return { success: true };
	};

// ============================================
// QUERY HELPERS (Auto-filter archived)
// ============================================

export const getLeads = async (organizationId: string) => {
	return prisma.lead.findMany({
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
};

export const getLeadById = async (leadId: string, organizationId: string) => {
	const lead = await prisma.lead.findUnique({
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
};

export const getDeals = async (organizationId: string) => {
	return prisma.deal.findMany({
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
};

export const getDealById = async (dealId: string, organizationId: string) => {
	const deal = await prisma.deal.findUnique({
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
};

export const updateLead = async (leadId: string, organizationId: string, input: Partial<CreateLeadInput>) => {
	const lead = await prisma.lead.findUnique({
		where: { id: leadId },
		select: { organizationId: true },
	});

	if (!lead) {
		throw new HttpError(404, "Lead not found");
	}

	if (lead.organizationId !== organizationId) {
		throw new HttpError(403, "Lead does not belong to this organization");
	}

	const data: Prisma.LeadUpdateInput = {};

	if (input.firstName !== undefined) data.firstName = input.firstName;
	if (input.email !== undefined) data.email = input.email;
	if (input.phone !== undefined) data.phone = input.phone;
	if (input.source !== undefined) data.source = input.source;
	if (input.status !== undefined) data.status = input.status;
	if (input.assignedTo !== undefined) {
		data.assignee = {
			connect: { id: input.assignedTo },
		};
	}

	return prisma.lead.update({
		where: { id: leadId },
		data,
		include: {
			contact: true,
			assignee: true,
		},
	});
};

export const createDeal = async (organizationId: string, input: {
	contactId: string;
	pipelineId: string;
	stageId: string;
	value: number;
	probability?: number;
	status?: string;
}) => {
	// Validate org exists
	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!org) {
		throw new HttpError(404, "Organization not found");
	}

	// Verify contact belongs to org
	const contact = await prisma.contact.findUnique({
		where: { id: input.contactId },
		select: { organizationId: true },
	});

	if (!contact || contact.organizationId !== organizationId) {
		throw new HttpError(403, "Contact does not belong to this organization");
	}

	return prisma.deal.create({
		data: {
			organizationId,
			contactId: input.contactId,
			pipelineId: input.pipelineId,
			stageId: input.stageId,
			value: new Prisma.Decimal(input.value),
			probability: input.probability || 0,
			status: input.status || "OPEN",
		},
		include: {
			contact: true,
			pipeline: true,
			stage: true,
		},
	});
};

// ============================================
// STEP 5: Deal Timeline (Activity History + Stage Changes)
// ============================================

export interface DealTimeline {
	deal: {
		id: string;
		contactId: string;
		value: number;
		probability: number;
		status: string;
		pipelineId: string;
		stageId: string;
		createdAt: Date;
		updatedAt: Date;
	};
	activities: Array<{
		id: string;
		type: string;
		note: string | null;
		dueDate: Date | null;
		completed: boolean;
		createdAt: Date;
	}>;
	stageChanges: Array<{
		from: string | null;
		to: string;
		changedBy: string;
		changedAt: Date;
	}>;
}

export const getDealTimeline = async (dealId: string, organizationId: string): Promise<DealTimeline> => {
	// Get deal with validation
	const deal = await prisma.deal.findUnique({
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
	const activities = await prisma.activity.findMany({
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
	const stageHistory = await prisma.dealStageHistory.findMany({
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
	const stageChanges = stageHistory.map((history) => ({
		from: history.fromStage?.name || null,
		to: history.toStage.name,
		changedBy: history.user.firstName && history.user.lastName 
			? `${history.user.firstName} ${history.user.lastName}` 
			: history.user.email,
		changedAt: history.changedAt,
	}));

	return {
		deal: {
			...deal,
			value: Number(deal.value),
		},
		activities,
		stageChanges,
	};
};

// ============================================
// STEP 6: Deal Stage Validation + History Tracking
// ============================================

export const updateDealStage = async (
	dealId: string,
	organizationId: string,
	newStageId: string,
	changedByUserId: string,
) => {
	// Get deal with pipeline info
	const deal = await prisma.deal.findUnique({
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
	const newStage = await prisma.stage.findUnique({
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
	const updatedDeal = await prisma.deal.update({
		where: { id: dealId },
		data: { stageId: newStageId },
		include: {
			contact: true,
			pipeline: true,
			stage: true,
		},
	});

	// Create deal stage transition history (audit log)
	await prisma.dealStageHistory.create({
		data: {
			dealId,
			fromStageId: deal.stageId,
			toStageId: newStageId,
			changedBy: changedByUserId,
		},
	});

	return updatedDeal;
};

// ============================================
// STEP 7: Get Deal Stage Transition History
// ============================================

export const getStageHistory = async (dealId: string, organizationId: string) => {
	// Verify deal belongs to organization
	const deal = await prisma.deal.findUnique({
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
	return prisma.dealStageHistory.findMany({
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
};

type ServiceCasePriority = "LOW" | "MEDIUM" | "HIGH";
type ServiceCaseStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

interface ServiceCaseNote {
	subject: string;
	priority: ServiceCasePriority;
	status: ServiceCaseStatus;
}

export interface ServiceCaseDto {
	id: string;
	subject: string;
	priority: ServiceCasePriority;
	status: ServiceCaseStatus;
	leadId: string | null;
	dealId: string | null;
	createdAt: Date;
}

export interface CreateServiceCaseInput {
	subject: string;
	priority?: ServiceCasePriority;
	leadId?: string;
	dealId?: string;
	dueDate?: string;
}

export interface UpdateServiceCaseInput {
	subject?: string;
	priority?: ServiceCasePriority;
	status?: ServiceCaseStatus;
}

const parseServiceCaseNote = (note: string | null): ServiceCaseNote | null => {
	if (!note) {
		return null;
	}

	try {
		const parsed = JSON.parse(note) as Partial<ServiceCaseNote>;
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
	} catch {
		return null;
	}
};

const assertLeadBelongsToOrg = async (leadId: string, organizationId: string): Promise<void> => {
	const lead = await prisma.lead.findUnique({
		where: { id: leadId },
		select: { organizationId: true },
	});

	if (!lead || lead.organizationId !== organizationId) {
		throw new HttpError(403, "Lead does not belong to this organization");
	}
};

const assertDealBelongsToOrg = async (dealId: string, organizationId: string): Promise<void> => {
	const deal = await prisma.deal.findUnique({
		where: { id: dealId },
		select: { organizationId: true },
	});

	if (!deal || deal.organizationId !== organizationId) {
		throw new HttpError(403, "Deal does not belong to this organization");
	}
};

export const listServiceCases = async (organizationId: string): Promise<ServiceCaseDto[]> => {
	const activities = await prisma.activity.findMany({
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
		.filter((item): item is ServiceCaseDto => Boolean(item));
};

export const createServiceCase = async (
	organizationId: string,
	userId: string,
	input: CreateServiceCaseInput,
): Promise<ServiceCaseDto> => {
	if (!input.subject?.trim()) {
		throw new HttpError(400, "subject is required");
	}

	const priority: ServiceCasePriority = input.priority ?? "MEDIUM";
	if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) {
		throw new HttpError(400, "priority must be LOW, MEDIUM, or HIGH");
	}

	if (input.leadId) {
		await assertLeadBelongsToOrg(input.leadId, organizationId);
	}

	if (input.dealId) {
		await assertDealBelongsToOrg(input.dealId, organizationId);
	}

	const note: ServiceCaseNote = {
		subject: input.subject.trim(),
		priority,
		status: "OPEN",
	};

	const activity = await prisma.activity.create({
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
};

export const updateServiceCaseStatus = async (
	caseId: string,
	organizationId: string,
	status: ServiceCaseStatus,
): Promise<ServiceCaseDto> => {
	if (!["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) {
		throw new HttpError(400, "status must be OPEN, IN_PROGRESS, or RESOLVED");
	}

	const activity = await prisma.activity.findUnique({
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

	const belongsToOrg =
		activity.lead?.organizationId === organizationId ||
		activity.deal?.organizationId === organizationId ||
		activity.creator?.organizationId === organizationId ||
		Boolean(activity.creator?.memberships.some((membership) => membership.organizationId === organizationId));

	if (!belongsToOrg) {
		throw new HttpError(403, "Service case does not belong to this organization");
	}

	const parsed = parseServiceCaseNote(activity.note);
	if (!parsed) {
		throw new HttpError(400, "Service case data is invalid");
	}

	const updatedNote: ServiceCaseNote = {
		...parsed,
		status,
	};

	await prisma.activity.update({
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
};

export const updateServiceCase = async (
	caseId: string,
	organizationId: string,
	input: UpdateServiceCaseInput,
): Promise<ServiceCaseDto> => {
	const activity = await prisma.activity.findUnique({
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

	const belongsToOrg =
		activity.lead?.organizationId === organizationId ||
		activity.deal?.organizationId === organizationId ||
		activity.creator?.organizationId === organizationId ||
		Boolean(activity.creator?.memberships.some((membership) => membership.organizationId === organizationId));

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

	const updatedNote: ServiceCaseNote = {
		subject: input.subject !== undefined ? input.subject.trim() : parsed.subject,
		priority: input.priority ?? parsed.priority,
		status: input.status ?? parsed.status,
	};

	await prisma.activity.update({
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
};

export const deleteServiceCase = async (caseId: string, organizationId: string) => {
	const activity = await prisma.activity.findUnique({
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

	const belongsToOrg =
		activity.lead?.organizationId === organizationId ||
		activity.deal?.organizationId === organizationId ||
		activity.creator?.organizationId === organizationId ||
		Boolean(activity.creator?.memberships.some((membership) => membership.organizationId === organizationId));

	if (!belongsToOrg) {
		throw new HttpError(403, "Service case does not belong to this organization");
	}

	await prisma.activity.delete({ where: { id: caseId } });
	return { success: true };
};

type CampaignStatus = "DRAFT" | "RUNNING" | "PAUSED";

interface CampaignNote {
	name: string;
	segment: string;
	status: CampaignStatus;
}

export interface CampaignDto {
	id: string;
	name: string;
	segment: string;
	status: CampaignStatus;
	createdAt: Date;
}

export interface CreateCampaignInput {
	name: string;
	segment: string;
	status?: CampaignStatus;
}

export interface UpdateCampaignInput {
	name?: string;
	segment?: string;
	status?: CampaignStatus;
}

const parseCampaignNote = (note: string | null): CampaignNote | null => {
	if (!note) {
		return null;
	}

	try {
		const parsed = JSON.parse(note) as Partial<CampaignNote>;
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
	} catch {
		return null;
	}
};

export const listCampaigns = async (organizationId: string): Promise<CampaignDto[]> => {
	const activities = await prisma.activity.findMany({
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
		.filter((item): item is CampaignDto => Boolean(item));
};

export const createCampaign = async (
	organizationId: string,
	userId: string,
	input: CreateCampaignInput,
): Promise<CampaignDto> => {
	if (!input.name?.trim()) {
		throw new HttpError(400, "name is required");
	}
	if (!input.segment?.trim()) {
		throw new HttpError(400, "segment is required");
	}

	const status: CampaignStatus = input.status ?? "DRAFT";
	if (!["DRAFT", "RUNNING", "PAUSED"].includes(status)) {
		throw new HttpError(400, "status must be DRAFT, RUNNING, or PAUSED");
	}

	const note: CampaignNote = {
		name: input.name.trim(),
		segment: input.segment.trim(),
		status,
	};

	const activity = await prisma.activity.create({
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
};

export const updateCampaignStatus = async (
	campaignId: string,
	organizationId: string,
	status: CampaignStatus,
): Promise<CampaignDto> => {
	if (!["DRAFT", "RUNNING", "PAUSED"].includes(status)) {
		throw new HttpError(400, "status must be DRAFT, RUNNING, or PAUSED");
	}

	const activity = await prisma.activity.findUnique({
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

	const belongsToOrg =
		activity.creator?.organizationId === organizationId ||
		Boolean(activity.creator?.memberships.some((membership) => membership.organizationId === organizationId));

	if (!belongsToOrg) {
		throw new HttpError(403, "Campaign does not belong to this organization");
	}

	const parsed = parseCampaignNote(activity.note);
	if (!parsed) {
		throw new HttpError(400, "Campaign data is invalid");
	}

	const updatedNote: CampaignNote = {
		...parsed,
		status,
	};

	await prisma.activity.update({
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
};

export const updateCampaign = async (
	campaignId: string,
	organizationId: string,
	input: UpdateCampaignInput,
): Promise<CampaignDto> => {
	const activity = await prisma.activity.findUnique({
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

	const belongsToOrg =
		activity.creator?.organizationId === organizationId ||
		Boolean(activity.creator?.memberships.some((membership) => membership.organizationId === organizationId));

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

	const updatedNote: CampaignNote = {
		name: input.name !== undefined ? input.name.trim() : parsed.name,
		segment: input.segment !== undefined ? input.segment.trim() : parsed.segment,
		status: input.status ?? parsed.status,
	};

	await prisma.activity.update({
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
};

export const deleteCampaign = async (campaignId: string, organizationId: string) => {
	const activity = await prisma.activity.findUnique({
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

	const belongsToOrg =
		activity.creator?.organizationId === organizationId ||
		Boolean(activity.creator?.memberships.some((membership) => membership.organizationId === organizationId));

	if (!belongsToOrg) {
		throw new HttpError(403, "Campaign does not belong to this organization");
	}

	await prisma.activity.delete({ where: { id: campaignId } });
	return { success: true };
};

export interface PipelineDto {
	id: string;
	name: string;
	stages: Array<{ id: string; name: string; order: number }>;
}

export const createPipeline = async (organizationId: string, input: { name: string }): Promise<PipelineDto> => {
	const name = input.name?.trim();
	if (!name) {
		throw new HttpError(400, "name is required");
	}

	const pipeline = await prisma.pipeline.create({
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
};

export const updatePipeline = async (
	pipelineId: string,
	organizationId: string,
	input: { name?: string },
): Promise<PipelineDto> => {
	if (input.name !== undefined && !input.name.trim()) {
		throw new HttpError(400, "name cannot be empty");
	}

	const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId }, select: { organizationId: true } });
	if (!pipeline) {
		throw new HttpError(404, "Pipeline not found");
	}

	if (pipeline.organizationId !== organizationId) {
		throw new HttpError(403, "Pipeline does not belong to this organization");
	}

	const updated = await prisma.pipeline.update({
		where: { id: pipelineId },
		data: {
			name: input.name?.trim(),
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
};

export const deletePipeline = async (pipelineId: string, organizationId: string) => {
	const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId }, select: { organizationId: true } });
	if (!pipeline) {
		throw new HttpError(404, "Pipeline not found");
	}

	if (pipeline.organizationId !== organizationId) {
		throw new HttpError(403, "Pipeline does not belong to this organization");
	}

	const dealsCount = await prisma.deal.count({ where: { pipelineId } });
	if (dealsCount > 0) {
		throw new HttpError(400, "Cannot delete pipeline with existing deals");
	}

	await prisma.pipeline.delete({ where: { id: pipelineId } });
	return { success: true };
};

export const createStage = async (
	pipelineId: string,
	organizationId: string,
	input: { name: string; order?: number },
) => {
	const name = input.name?.trim();
	if (!name) {
		throw new HttpError(400, "name is required");
	}

	const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId }, select: { organizationId: true } });
	if (!pipeline) {
		throw new HttpError(404, "Pipeline not found");
	}

	if (pipeline.organizationId !== organizationId) {
		throw new HttpError(403, "Pipeline does not belong to this organization");
	}

	let order = input.order;
	if (order === undefined || order === null) {
		const maxStage = await prisma.stage.findFirst({
			where: { pipelineId },
			orderBy: { order: "desc" },
			select: { order: true },
		});
		order = (maxStage?.order ?? 0) + 1;
	}

	const existingOrder = await prisma.stage.findFirst({ where: { pipelineId, order } });
	if (existingOrder) {
		throw new HttpError(400, "Stage order already exists in this pipeline");
	}

	return prisma.stage.create({
		data: {
			pipelineId,
			name,
			order,
		},
		select: { id: true, name: true, order: true, pipelineId: true },
	});
};

export const updateStage = async (
	stageId: string,
	organizationId: string,
	input: { name?: string; order?: number },
) => {
	if (input.name !== undefined && !input.name.trim()) {
		throw new HttpError(400, "name cannot be empty");
	}

	const stage = await prisma.stage.findUnique({
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
		const existingOrder = await prisma.stage.findFirst({
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

	return prisma.stage.update({
		where: { id: stageId },
		data: {
			name: input.name?.trim(),
			order: input.order,
		},
		select: { id: true, name: true, order: true, pipelineId: true },
	});
};

export const deleteStage = async (stageId: string, organizationId: string) => {
	const stage = await prisma.stage.findUnique({
		where: { id: stageId },
		select: { id: true, pipeline: { select: { organizationId: true } } },
	});

	if (!stage) {
		throw new HttpError(404, "Stage not found");
	}

	if (stage.pipeline.organizationId !== organizationId) {
		throw new HttpError(403, "Stage does not belong to this organization");
	}

	const dealsCount = await prisma.deal.count({ where: { stageId } });
	if (dealsCount > 0) {
		throw new HttpError(400, "Cannot delete stage with existing deals");
	}

	await prisma.stage.delete({ where: { id: stageId } });
	return { success: true };
};

export interface IntegrationDto {
	moduleId: string;
	moduleName: string;
	description: string | null;
	isConnected: boolean;
	updatedAt: Date | null;
}

export const listIntegrationModules = async (organizationId: string): Promise<IntegrationDto[]> => {
	const modules = await prisma.module.findMany({
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
		? await prisma.organizationModule.findMany({
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
		return {
			moduleId: moduleItem.id,
			moduleName: moduleItem.name,
			description: moduleItem.description ?? null,
			isConnected: orgModuleMap.get(moduleItem.id) ?? false,
			updatedAt: moduleItem.updatedAt,
		};
	});
};

export const setIntegrationConnection = async (
	organizationId: string,
	moduleId: string,
	isConnected: boolean,
): Promise<IntegrationDto> => {
	const moduleItem = await prisma.module.findUnique({
		where: { id: moduleId },
		select: { id: true, name: true, description: true, isActive: true, updatedAt: true },
	});

	if (!moduleItem || !moduleItem.isActive) {
		throw new HttpError(404, "Module not found");
	}

	if (moduleItem.name === "CRM") {
		throw new HttpError(400, "CRM module connection cannot be changed here");
	}

	const organizationModule = await prisma.organizationModule.upsert({
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
		description: moduleItem.description ?? null,
		isConnected: organizationModule.isEnabled,
		updatedAt: moduleItem.updatedAt,
	};
};

export const resetCrmData = async (organizationId: string) => {
	const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } });
	if (!org) {
		throw new HttpError(404, "Organization not found");
	}

	const organizationUsers = await prisma.organizationUser.findMany({
		where: { organizationId },
		select: { userId: true },
	});

	const userIds = [...new Set(organizationUsers.map((item) => item.userId))];

	const result = await prisma.$transaction(async (tx) => {
		const activityWhere: Prisma.ActivityWhereInput = userIds.length
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

		const deletedActivities = await tx.activity.deleteMany({ where: activityWhere });
		const deletedStageHistory = await tx.dealStageHistory.deleteMany({ where: { deal: { organizationId } } });
		const deletedDeals = await tx.deal.deleteMany({ where: { organizationId } });
		const deletedLeads = await tx.lead.deleteMany({ where: { organizationId } });
		const deletedStages = await tx.stage.deleteMany({ where: { pipeline: { organizationId } } });
		const deletedPipelines = await tx.pipeline.deleteMany({ where: { organizationId } });

		return {
			deletedActivities: deletedActivities.count,
			deletedStageHistory: deletedStageHistory.count,
			deletedDeals: deletedDeals.count,
			deletedLeads: deletedLeads.count,
			deletedStages: deletedStages.count,
			deletedPipelines: deletedPipelines.count,
		};
	});

	return {
		message: "CRM data deleted successfully",
		...result,
	};
};

