import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";
import { reduceStockWithDb } from "../inventory/inventory.service";
import { createTransactionWithEntries } from "../accounting/accounting.service";
import { createInvoiceFromPOSOrder } from "../invoicing/invoicing.service";

export class POSError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "POSError";
	}
}

const toMoney = (value: number) => Number(value.toFixed(2));

const ensureOrganization = async (organizationId: string) => {
	const org = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!org) {
		throw new POSError(404, "Organization not found");
	}
};

const ensureCustomerInOrg = async (organizationId: string, customerId?: string | null) => {
	if (!customerId) {
		return null;
	}

	const customer = await prisma.contact.findUnique({
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
};

const getRevenueAndCashLedgers = async (
	organizationId: string,
	tx?: Prisma.TransactionClient,
) => {
	const db = tx ?? prisma;
	const ledgers = await db.ledgerAccount.findMany({
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
};

const getDefaultWarehouse = async (organizationId: string, tx?: Prisma.TransactionClient) => {
	const db = tx ?? prisma;
	const warehouse = await db.warehouse.findFirst({
		where: { organizationId },
		select: { id: true },
		orderBy: { id: "asc" },
	});

	if (!warehouse) {
		throw new POSError(400, "No warehouse configured for this organization");
	}

	return warehouse.id;
};

export interface CreatePOSTerminalInput {
	name: string;
	location?: string;
}

export const createPOSTerminal = async (organizationId: string, input: CreatePOSTerminalInput) => {
	await ensureOrganization(organizationId);

	if (!input.name?.trim()) {
		throw new POSError(400, "name is required");
	}

	return prisma.pOSTerminal.create({
		data: {
			organizationId,
			name: input.name.trim(),
			location: input.location?.trim(),
		},
	});
};

export interface StartPOSSessionInput {
	terminalId: string;
	openedBy: string;
	openingCash: number;
}

export const startPOSSession = async (organizationId: string, input: StartPOSSessionInput) => {
	if (!input.terminalId?.trim()) {
		throw new POSError(400, "terminalId is required");
	}

	if (!input.openedBy?.trim()) {
		throw new POSError(400, "openedBy is required");
	}

	if (typeof input.openingCash !== "number" || input.openingCash < 0) {
		throw new POSError(400, "openingCash must be a non-negative number");
	}

	const terminal = await prisma.pOSTerminal.findUnique({
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

	const openSession = await prisma.pOSSession.findFirst({
		where: {
			terminalId: terminal.id,
			closedAt: null,
		},
		select: { id: true },
	});

	if (openSession) {
		throw new POSError(409, "An open session already exists for this terminal");
	}

	return prisma.pOSSession.create({
		data: {
			terminalId: terminal.id,
			openedBy: input.openedBy.trim(),
			openingCash: toMoney(input.openingCash),
		},
		include: {
			terminal: true,
		},
	});
};

export const closePOSSession = async (
	organizationId: string,
	sessionId: string,
	closingCash: number,
) => {
	if (!sessionId?.trim()) {
		throw new POSError(400, "sessionId is required");
	}

	if (typeof closingCash !== "number" || closingCash < 0) {
		throw new POSError(400, "closingCash must be a non-negative number");
	}

	const session = await prisma.pOSSession.findUnique({
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

	const totalCashSales = toMoney(
		session.orders
			.filter((order) => order.paymentMethod === "CASH")
			.reduce((sum, order) => sum + Number(order.totalAmount), 0),
	);

	const expectedCash = toMoney(Number(session.openingCash) + totalCashSales);
	const variance = toMoney(closingCash - expectedCash);

	const closedSession = await prisma.pOSSession.update({
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
};

export interface POSOrderItemInput {
	productId: string;
	quantity: number;
}

export interface CreatePOSOrderInput {
	sessionId: string;
	items: POSOrderItemInput[];
	paymentMethod: "CASH" | "CARD" | "UPI";
	customerId?: string;
}

export const createPOSOrder = async (organizationId: string, input: CreatePOSOrderInput) => {
	if (!input.sessionId?.trim()) {
		throw new POSError(400, "sessionId is required");
	}

	if (!Array.isArray(input.items) || input.items.length === 0) {
		throw new POSError(400, "items must contain at least one line");
	}

	if (!["CASH", "CARD", "UPI"].includes(input.paymentMethod)) {
		throw new POSError(400, "paymentMethod must be one of CASH, CARD, UPI");
	}

	await ensureCustomerInOrg(organizationId, input.customerId);

	const session = await prisma.pOSSession.findUnique({
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

	const normalizedItems = new Map<string, number>();
	for (const item of input.items) {
		if (!item.productId?.trim() || !Number.isInteger(item.quantity) || item.quantity <= 0) {
			throw new POSError(400, "Each item must contain productId and quantity > 0");
		}
		normalizedItems.set(
			item.productId.trim(),
			(normalizedItems.get(item.productId.trim()) ?? 0) + item.quantity,
		);
	}

	const productIds = Array.from(normalizedItems.keys());
	const products = await prisma.product.findMany({
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

	const totalAmount = toMoney(
		orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0),
	);

	return prisma.$transaction(async (tx) => {
		const warehouseId = await getDefaultWarehouse(organizationId, tx);

		for (const item of orderItems) {
			await reduceStockWithDb(
				tx,
				organizationId,
				item.productId,
				warehouseId,
				item.quantity,
				`POS-SESSION-${session.id}`,
				"POS sale",
			);
		}

		const posOrder = await tx.pOSOrder.create({
			data: {
				organizationId,
				sessionId: session.id,
				customerId: input.customerId?.trim() || null,
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

		const { cashLedgerId, revenueLedgerId } = await getRevenueAndCashLedgers(organizationId, tx);

		await createTransactionWithEntries(
			organizationId,
			"SALE",
			`POS-ORDER-${posOrder.id}`,
			[
				{ ledgerAccountId: cashLedgerId, debit: totalAmount },
				{ ledgerAccountId: revenueLedgerId, credit: totalAmount },
			],
			{
				contactId: posOrder.customerId ?? undefined,
				totalAmount,
				status: "POSTED",
				tx,
			},
		);

		// Auto-create invoice for POS order
		try {
			await createInvoiceFromPOSOrder(organizationId, posOrder.id, { tx });
		} catch (invoiceError: any) {
			// Log but don't fail the order if invoice creation fails
			console.error(`Failed to create invoice for POS order ${posOrder.id}:`, invoiceError.message);
		}

		return posOrder;
	});
};

export const generateZReport = async (organizationId: string, sessionId: string) => {
	if (!sessionId?.trim()) {
		throw new POSError(400, "sessionId is required");
	}

	const session = await prisma.pOSSession.findUnique({
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

	const orders = await prisma.pOSOrder.findMany({
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

	const items = await prisma.pOSOrderItem.findMany({
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
	const totalCash = toMoney(
		orders
			.filter((order) => order.paymentMethod === "CASH")
			.reduce((sum, order) => sum + Number(order.totalAmount), 0),
	);
	const totalUPI = toMoney(
		orders
			.filter((order) => order.paymentMethod === "UPI")
			.reduce((sum, order) => sum + Number(order.totalAmount), 0),
	);
	const totalCard = toMoney(
		orders
			.filter((order) => order.paymentMethod === "CARD")
			.reduce((sum, order) => sum + Number(order.totalAmount), 0),
	);

	const topMap = new Map<string, { productId: string; name: string; sku: string; quantitySold: number }>();
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
};
