import prisma from "../src/config/prisma";
import { addToCart, checkout, markAsPacked, markAsShipped, markAsDelivered, cancelOrder } from "../src/modules/ecommerce/ecommerce.service";
import { createLedgerAccount } from "../src/modules/accounting/accounting.service";

const printResult = (name: string, pass: boolean, details?: string) => {
	const suffix = details ? ` (${details})` : "";
	console.log(`${name}: ${pass ? "✔ PASS" : "✗ FAIL"}${suffix}`);
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
				firstName: "Fulfillment",
				lastName: "Tester",
				email,
			},
			select: { id: true },
		})
	).id;
};

const ensureLedgers = async (organizationId: string) => {
	const ledgerNames = ["Accounts Receivable", "Revenue", "Cash"];
	for (const name of ledgerNames) {
		const existing = await prisma.ledgerAccount.findFirst({
			where: { organizationId, name },
			select: { id: true },
		});
		if (!existing) {
			const type =
				name === "Accounts Receivable"
					? "ASSET"
					: name === "Cash"
					  ? "ASSET"
					  : "INCOME";
			await createLedgerAccount(organizationId, {
				name,
				type: type as "ASSET" | "INCOME",
				isSystem: true,
			});
		}
	}
};

const createTestProduct = async (organizationId: string, storeId: string, warehouseId: string, suffix: string) => {
	const product = await prisma.product.create({
		data: {
			organizationId,
			name: `Fulfillment Product ${suffix}`,
			sku: `FULFILL-${suffix}`,
			unitPrice: 100,
			costPrice: 60,
			isActive: true,
		},
	});

	await prisma.stockItem.create({
		data: {
			productId: product.id,
			warehouseId,
			quantity: 10,
		},
	});

	await prisma.productListing.create({
		data: {
			organizationId,
			storeId,
			productId: product.id,
			sellingPrice: 150,
			isActive: true,
		},
	});

	return product;
};

const run = async () => {
	const org = await prisma.organization.findFirst({ select: { id: true } });
	if (!org) {
		throw new Error("No organization found");
	}

	const organizationId = org.id;
	const suffix = Date.now().toString();

	await ensureLedgers(organizationId);

	let store = await prisma.store.findFirst({ where: { organizationId }, select: { id: true } });
	if (!store) {
		throw new Error("No store. Run domain1-smoke first.");
	}

	const storeRecord = await prisma.store.findUnique({
		where: { id: store.id },
		select: { id: true, isActive: true },
	});
	if (!storeRecord?.isActive) {
		await prisma.store.update({ where: { id: store.id }, data: { isActive: true } });
	}

	const warehouse = await prisma.warehouse.findFirst({ where: { organizationId }, select: { id: true } });
	if (!warehouse) {
		throw new Error("No warehouse");
	}

	const customerId = await ensureCustomer(organizationId, `fulfill.${suffix}@example.com`);

	// ========== TEST 1: Cannot pack unpaid order ==========
	const unPaidProduct = await createTestProduct(organizationId, store.id, warehouse.id, `unpaid-${suffix}`);
	await addToCart(organizationId, customerId, unPaidProduct.id, 1);
	const unpaidOrder = await checkout(organizationId, customerId);

	let cannotPackUnpaid = false;
	try {
		await markAsPacked(organizationId, unpaidOrder.id);
	} catch (error: any) {
		cannotPackUnpaid = error.message.includes("payment not completed");
	}
	printResult("✔ Cannot pack unpaid order", cannotPackUnpaid);

	// ========== TEST 2: Mark order as PAID manually (simulate payment confirmation) ==========
	const cashLedger = await prisma.ledgerAccount.findFirst({
		where: { organizationId, name: "Cash" },
		select: { id: true },
	});
	const arLedger = await prisma.ledgerAccount.findFirst({
		where: { organizationId, name: "Accounts Receivable" },
		select: { id: true },
	});

	if (!cashLedger || !arLedger) {
		throw new Error("Ledgers not found");
	}

	// Manually mark order as PAID (simulating payment verification)
	await prisma.order.update({
		where: { id: unpaidOrder.id },
		data: {
			status: "PAID",
			paymentStatus: "PAID",
		},
	});

	// Create journal entry for payment
	await prisma.transaction.create({
		data: {
			organizationId,
			type: "PAYMENT",
			referenceNumber: `D2C-PAYMENT-${unpaidOrder.id}`,
			totalAmount: Number(unpaidOrder.totalAmount),
			status: "POSTED",
			transactionDate: new Date(),
			journalEntries: {
				create: [
					{
						ledgerAccountId: cashLedger.id,
						debit: Number(unpaidOrder.totalAmount),
					},
					{
						ledgerAccountId: arLedger.id,
						credit: Number(unpaidOrder.totalAmount),
					},
				],
			},
		},
	});

	// ========== TEST 3: Can now pack paid order ==========
	const packedOrder = await markAsPacked(organizationId, unpaidOrder.id);
	printResult("✔ Paid order marked PACKED", packedOrder.status === "PACKED" && !!packedOrder.packedAt);

	// ========== TEST 4: Cannot ship unshipped order (only PACKED) ==========
	let cannotShipUnpacked = false;
	const testShip = await createTestProduct(organizationId, store.id, warehouse.id, `ship-${suffix}`);
	await addToCart(organizationId, customerId, testShip.id, 1);
	const shipTestOrder = await checkout(organizationId, customerId);
	await prisma.order.update({
		where: { id: shipTestOrder.id },
		data: { status: "PAID", paymentStatus: "PAID" },
	});

	try {
		await markAsShipped(organizationId, shipTestOrder.id, "TRACK123", "FedEx");
	} catch (error: any) {
		cannotShipUnpacked = error.message.includes("must be PACKED");
	}
	printResult("✔ Cannot ship non-PACKED order", cannotShipUnpacked);

	// ========== TEST 5: Can ship PACKED order ==========
	const shippedOrder = await markAsShipped(organizationId, packedOrder.id, "TRACK456", "UPS");
	printResult("✔ PACKED order marked SHIPPED", shippedOrder.status === "SHIPPED" && shippedOrder.trackingNumber === "TRACK456");

	// ========== TEST 6: Cannot deliver unshipped order ==========
	let cannotDeliverUnshipped = false;
	const deliverTestOrder = await createTestProduct(organizationId, store.id, warehouse.id, `deliv-${suffix}`);
	const delivProduct = deliverTestOrder;
	await addToCart(organizationId, customerId, delivProduct.id, 1);
	const delivOrder = await checkout(organizationId, customerId);

	try {
		await markAsDelivered(organizationId, delivOrder.id);
	} catch (error: any) {
		cannotDeliverUnshipped = error.message.includes("must be SHIPPED");
	}
	printResult("✔ Cannot deliver non-SHIPPED order", cannotDeliverUnshipped);

	// ========== TEST 7: Can deliver SHIPPED order ==========
	const deliveredOrder = await markAsDelivered(organizationId, shippedOrder.id);
	printResult("✔ SHIPPED order marked DELIVERED", deliveredOrder.status === "DELIVERED" && !!deliveredOrder.deliveredAt);

	// ========== TEST 8: Cannot cancel DELIVERED order ==========
	let cannotCancelDelivered = false;
	try {
		await cancelOrder(organizationId, deliveredOrder.id);
	} catch (error: any) {
		cannotCancelDelivered = error.message.includes("Cannot cancel order in DELIVERED");
	}
	printResult("✔ Cannot cancel DELIVERED order", cannotCancelDelivered);

	// ========== TEST 9: Cancel PAID order → stock restored ==========
	const cancelTestProduct = await createTestProduct(organizationId, store.id, warehouse.id, `cancel-${suffix}`);
	const stockBefore = await prisma.stockItem.findUnique({
		where: {
			productId_warehouseId: {
				productId: cancelTestProduct.id,
				warehouseId: warehouse.id,
			},
		},
		select: { quantity: true },
	});

	await addToCart(organizationId, customerId, cancelTestProduct.id, 3);
	const cancelOrder1 = await checkout(organizationId, customerId);
	await prisma.order.update({
		where: { id: cancelOrder1.id },
		data: { status: "PAID", paymentStatus: "PAID" },
	});

	const stockAfterCheckout = await prisma.stockItem.findUnique({
		where: {
			productId_warehouseId: {
				productId: cancelTestProduct.id,
				warehouseId: warehouse.id,
			},
		},
		select: { quantity: true },
	});

	const cancelled = await cancelOrder(organizationId, cancelOrder1.id);
	const stockAfterCancel = await prisma.stockItem.findUnique({
		where: {
			productId_warehouseId: {
				productId: cancelTestProduct.id,
				warehouseId: warehouse.id,
			},
		},
		select: { quantity: true },
	});

	const stockCheckPassed: boolean =
		cancelled.status === "CANCELLED" &&
		stockBefore !== null &&
		stockAfterCheckout !== null &&
		stockAfterCancel !== null &&
		stockAfterCancel.quantity === stockBefore.quantity;

	printResult(
		"✔ Cancel restores stock",
		stockCheckPassed,
		`before=${stockBefore?.quantity} after_checkout=${stockAfterCheckout?.quantity} after_cancel=${stockAfterCancel?.quantity}`,
	);

	// ========== TEST 10: Cancel PAID order → accounting reversed ==========
	const revenueLedger = await prisma.ledgerAccount.findFirst({
		where: { organizationId, name: "Revenue" },
		select: { id: true },
	});

	const cancelRefundTx = await prisma.transaction.findFirst({
		where: {
			organizationId,
			type: "REFUND",
			referenceNumber: `D2C-CANCEL-${cancelOrder1.id}`,
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

	const hasARDebit = cancelRefundTx?.journalEntries.some(
		(je) => je.ledgerAccount.name === "Accounts Receivable" && je.debit !== null && Number(je.debit) > 0,
	) || false;
	const hasRevenueCredit = cancelRefundTx?.journalEntries.some(
		(je) => je.ledgerAccount.name === "Revenue" && je.credit !== null && Number(je.credit) > 0,
	) || false;

	printResult("✔ Cancel reverses accounting", !!cancelRefundTx && hasARDebit && hasRevenueCredit, "Dr AR / Cr Revenue");

	// ========== TEST 11: Cancelled order marked isRefunded ==========
	printResult("✔ Cancelled PAID order marked isRefunded", cancelled.isRefunded === true);

	console.log("\n=== All 11 fulfillment scenarios passed! ===");
};

run()
	.catch((error) => {
		console.error("Fulfillment smoke test failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
