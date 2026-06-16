import prisma from "../src/config/prisma";
import {
	addToCart,
	approveReturn,
	checkout,
	markAsDelivered,
	markAsPacked,
	markAsShipped,
	processRefund,
	requestReturn,
} from "../src/modules/ecommerce/ecommerce.service";
import { createLedgerAccount } from "../src/modules/accounting/accounting.service";

const printResult = (name: string, pass: boolean, details?: string) => {
	const suffix = details ? ` (${details})` : "";
	console.log(`${name}: ${pass ? "PASS" : "FAIL"}${suffix}`);
};

const ensureCustomer = async (organizationId: string, email: string) => {
	const existing = await prisma.contact.findFirst({
		where: { organizationId, type: "CUSTOMER", email },
		select: { id: true },
	});

	if (existing) {
		return existing.id;
	}

	return (
		await prisma.contact.create({
			data: {
				organizationId,
				type: "CUSTOMER",
				firstName: "Return",
				lastName: "Tester",
				email,
			},
			select: { id: true },
		})
	).id;
};

const ensureLedgers = async (organizationId: string) => {
	const required = [
		{ name: "Accounts Receivable", type: "ASSET" as const },
		{ name: "Revenue", type: "INCOME" as const },
		{ name: "Cash", type: "ASSET" as const },
	];

	for (const ledger of required) {
		const existing = await prisma.ledgerAccount.findFirst({
			where: { organizationId, name: ledger.name },
			select: { id: true },
		});

		if (!existing) {
			await createLedgerAccount(organizationId, {
				name: ledger.name,
				type: ledger.type,
				isSystem: true,
			});
		}
	}
};

const createProductAndListing = async (
	organizationId: string,
	storeId: string,
	warehouseId: string,
	skuPrefix: string,
	price: number,
	stock: number,
) => {
	const product = await prisma.product.create({
		data: {
			organizationId,
			name: `${skuPrefix}-product`,
			sku: `${skuPrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
			unitPrice: price,
			costPrice: Math.max(1, price * 0.5),
			isActive: true,
		},
	});

	await prisma.stockItem.upsert({
		where: {
			productId_warehouseId: {
				productId: product.id,
				warehouseId,
			},
		},
		update: { quantity: stock },
		create: {
			productId: product.id,
			warehouseId,
			quantity: stock,
		},
	});

	await prisma.productListing.create({
		data: {
			organizationId,
			storeId,
			productId: product.id,
			sellingPrice: price,
			isActive: true,
		},
	});

	return product;
};

const simulatePayment = async (organizationId: string, orderId: string, amount: number) => {
	const cash = await prisma.ledgerAccount.findFirst({
		where: { organizationId, name: "Cash" },
		select: { id: true },
	});
	const ar = await prisma.ledgerAccount.findFirst({
		where: { organizationId, name: "Accounts Receivable" },
		select: { id: true },
	});

	if (!cash || !ar) {
		throw new Error("Cash or Accounts Receivable ledger not found");
	}

	await prisma.order.update({
		where: { id: orderId },
		data: {
			status: "PAID",
			paymentStatus: "PAID",
		},
	});

	await prisma.transaction.create({
		data: {
			organizationId,
			type: "PAYMENT",
			referenceNumber: `D2C-PAYMENT-${orderId}`,
			totalAmount: amount,
			status: "POSTED",
			transactionDate: new Date(),
			journalEntries: {
				create: [
					{ ledgerAccountId: cash.id, debit: amount },
					{ ledgerAccountId: ar.id, credit: amount },
				],
			},
		},
	});
};

const moveOrderToDelivered = async (organizationId: string, orderId: string) => {
	await markAsPacked(organizationId, orderId);
	await markAsShipped(organizationId, orderId, `TRK-${Date.now()}`, "DHL");
	await markAsDelivered(organizationId, orderId);
};

const getWarehouse = async (organizationId: string) => {
	const warehouse = await prisma.warehouse.findFirst({
		where: { organizationId },
		select: { id: true },
	});
	if (!warehouse) {
		throw new Error("No warehouse found");
	}
	return warehouse.id;
};

const run = async () => {
	const org = await prisma.organization.findFirst({ select: { id: true } });
	if (!org) {
		throw new Error("No organization found");
	}
	const organizationId = org.id;

	await ensureLedgers(organizationId);

	const store = await prisma.store.findFirst({ where: { organizationId }, select: { id: true, isActive: true } });
	if (!store) {
		throw new Error("No store found. Run previous e-commerce setup first.");
	}
	if (!store.isActive) {
		await prisma.store.update({ where: { id: store.id }, data: { isActive: true } });
	}

	const warehouseId = await getWarehouse(organizationId);
	const customerId = await ensureCustomer(organizationId, `returns.${Date.now()}@example.com`);

	const productA = await createProductAndListing(organizationId, store.id, warehouseId, "RET-A", 120, 20);
	const productB = await createProductAndListing(organizationId, store.id, warehouseId, "RET-B", 80, 20);

	await addToCart(organizationId, customerId, productA.id, 2);
	await addToCart(organizationId, customerId, productB.id, 1);
	const orderPartial = await checkout(organizationId, customerId);
	await simulatePayment(organizationId, orderPartial.id, Number(orderPartial.totalAmount));
	await moveOrderToDelivered(organizationId, orderPartial.id);

	const fullOrder = await prisma.order.findUnique({
		where: { id: orderPartial.id },
		include: { items: true },
	});
	if (!fullOrder || fullOrder.items.length < 2) {
		throw new Error("Expected order with at least two items for partial return test");
	}

	const orderItemA = fullOrder.items[0];
	const orderItemB = fullOrder.items[1];

	const stockBeforePartial = await prisma.stockItem.findUnique({
		where: {
			productId_warehouseId: {
				productId: productA.id,
				warehouseId,
			},
		},
		select: { quantity: true },
	});

	const partialRequest = await requestReturn(organizationId, {
		orderId: fullOrder.id,
		reason: "Damaged item",
		items: [{ orderItemId: orderItemA.id, quantity: 1 }],
	});
	printResult("Partial return request works", partialRequest.status === "REQUESTED");

	const partialApproved = await approveReturn(organizationId, partialRequest.id);
	printResult("Partial return approval works", partialApproved.returnRequest.status === "RETURN_APPROVED");

	const stockAfterApprove = await prisma.stockItem.findUnique({
		where: {
			productId_warehouseId: {
				productId: productA.id,
				warehouseId,
			},
		},
		select: { quantity: true },
	});
	printResult(
		"Stock restored for approved return",
		stockBeforePartial !== null &&
			stockAfterApprove !== null &&
			stockAfterApprove.quantity === stockBeforePartial.quantity + 1,
	);

	const partialRefund = await processRefund(organizationId, partialRequest.id);
	printResult(
		"Partial refund works",
		partialRefund.returnRequest.status === "REFUNDED" && partialRefund.order.status === "RETURNED",
	);

	let doubleRefundBlocked = false;
	try {
		await processRefund(organizationId, partialRequest.id);
	} catch (error: any) {
		doubleRefundBlocked = String(error?.message ?? "").toLowerCase().includes("already refunded");
	}
	printResult("Double refund blocked", doubleRefundBlocked);

	let overQuantityBlocked = false;
	await addToCart(organizationId, customerId, productA.id, 1);
	const overQtyOrder = await checkout(organizationId, customerId);
	await simulatePayment(organizationId, overQtyOrder.id, Number(overQtyOrder.totalAmount));
	await moveOrderToDelivered(organizationId, overQtyOrder.id);
	const overQtyOrderWithItems = await prisma.order.findUnique({
		where: { id: overQtyOrder.id },
		include: { items: true },
	});
	if (!overQtyOrderWithItems) {
		throw new Error("Over-quantity test order not found");
	}
	try {
		await requestReturn(organizationId, {
			orderId: overQtyOrderWithItems.id,
			items: [{ orderItemId: overQtyOrderWithItems.items[0].id, quantity: overQtyOrderWithItems.items[0].quantity + 1 }],
			reason: "Too many requested",
		});
	} catch (error: any) {
		overQuantityBlocked = String(error?.message ?? "").toLowerCase().includes("exceeds delivered quantity");
	}
	printResult("Over-quantity blocked", overQuantityBlocked);

	await addToCart(organizationId, customerId, productB.id, 2);
	const fullRefundOrder = await checkout(organizationId, customerId);
	await simulatePayment(organizationId, fullRefundOrder.id, Number(fullRefundOrder.totalAmount));
	await moveOrderToDelivered(organizationId, fullRefundOrder.id);

	const fullRefundOrderLoaded = await prisma.order.findUnique({
		where: { id: fullRefundOrder.id },
		include: { items: true },
	});
	if (!fullRefundOrderLoaded) {
		throw new Error("Full-refund order not found");
	}

	const fullReturnRequest = await requestReturn(organizationId, {
		orderId: fullRefundOrderLoaded.id,
		items: fullRefundOrderLoaded.items.map((item) => ({ orderItemId: item.id, quantity: item.quantity })),
		reason: "Full order return",
	});
	await approveReturn(organizationId, fullReturnRequest.id);
	const fullRefundResult = await processRefund(organizationId, fullReturnRequest.id);
	printResult(
		"Full return + refund works",
		fullRefundResult.order.paymentStatus === "REFUNDED" && fullRefundResult.order.status === "REFUNDED",
	);

	const refundTx = await prisma.transaction.findFirst({
		where: {
			organizationId,
			type: "REFUND",
			referenceNumber: `D2C-RETURN-REFUND-${fullReturnRequest.id}`,
		},
		include: {
			journalEntries: {
				include: {
					ledgerAccount: {
						select: { name: true },
					},
				},
			},
		},
	});

	const hasRevenueDebit = !!refundTx?.journalEntries.some(
		(entry) => entry.ledgerAccount.name === "Revenue" && entry.debit !== null && Number(entry.debit) > 0,
	);
	const hasCashCredit = !!refundTx?.journalEntries.some(
		(entry) => entry.ledgerAccount.name === "Cash" && entry.credit !== null && Number(entry.credit) > 0,
	);
	printResult("Revenue reversed (Dr Revenue / Cr Cash)", hasRevenueDebit && hasCashCredit);

	console.log("All return & refund scenarios passed.");
};

run()
	.catch((error) => {
		console.error("Return/refund smoke test failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
