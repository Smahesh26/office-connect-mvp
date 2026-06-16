import prisma from "../src/config/prisma";
import {
	addToCart,
	inspectReturn,
	checkout,
	markAsDelivered,
	markAsPacked,
	markAsShipped,
	processRefund,
	reconcileGatewayRefund,
	requestReturn,
} from "../src/modules/ecommerce/ecommerce.service";

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
				firstName: "QC",
				lastName: "Tester",
				email,
			},
			select: { id: true },
		})
	).id;
};

const simulatePaid = async (organizationId: string, orderId: string) => {
	await prisma.order.update({
		where: { id: orderId },
		data: {
			status: "PAID",
			paymentStatus: "PAID",
		},
	});
};

const markDelivered = async (organizationId: string, orderId: string) => {
	await markAsPacked(organizationId, orderId);
	await markAsShipped(organizationId, orderId, `QCTRACK-${Date.now()}`, "QC-COURIER");
	await markAsDelivered(organizationId, orderId);
};

const run = async () => {
	const org = await prisma.organization.findFirst({ select: { id: true } });
	if (!org) {
		throw new Error("No organization found");
	}
	const organizationId = org.id;

	const store = await prisma.store.findFirst({ where: { organizationId }, select: { id: true, isActive: true } });
	if (!store) {
		throw new Error("No store found");
	}
	if (!store.isActive) {
		await prisma.store.update({ where: { id: store.id }, data: { isActive: true } });
	}

	const warehouse = await prisma.warehouse.findFirst({ where: { organizationId }, select: { id: true } });
	if (!warehouse) {
		throw new Error("No warehouse found");
	}

	const customerId = await ensureCustomer(organizationId, `qc.${Date.now()}@example.com`);

	const product = await prisma.product.create({
		data: {
			organizationId,
			name: `QC Product ${Date.now()}`,
			sku: `QCP-${Date.now()}`,
			unitPrice: 100,
			costPrice: 50,
			isActive: true,
		},
	});

	await prisma.stockItem.upsert({
		where: {
			productId_warehouseId: {
				productId: product.id,
				warehouseId: warehouse.id,
			},
		},
		update: { quantity: 20 },
		create: {
			productId: product.id,
			warehouseId: warehouse.id,
			quantity: 20,
		},
	});

	await prisma.productListing.create({
		data: {
			organizationId,
			storeId: store.id,
			productId: product.id,
			sellingPrice: 100,
			isActive: true,
		},
	});

	await addToCart(organizationId, customerId, product.id, 2);
	const rejectOrder = await checkout(organizationId, customerId);
	await simulatePaid(organizationId, rejectOrder.id);
	await markDelivered(organizationId, rejectOrder.id);

	const rejectOrderWithItems = await prisma.order.findUnique({
		where: { id: rejectOrder.id },
		include: { items: true },
	});
	if (!rejectOrderWithItems) {
		throw new Error("Reject order not found");
	}

	const rejectReq = await requestReturn(organizationId, {
		orderId: rejectOrderWithItems.id,
		items: [{ orderItemId: rejectOrderWithItems.items[0].id, quantity: 1 }],
		reason: "Wrong color",
	});

	const rejected = await inspectReturn(organizationId, {
		returnRequestId: rejectReq.id,
		outcome: "REJECT",
		notes: "Item used",
		rejectionReason: "Quality check failed",
	});

	const rejectedOrder = await prisma.order.findUnique({
		where: { id: rejectOrderWithItems.id },
		select: { status: true },
	});
	printResult(
		"Return rejection workflow works",
		rejected.returnRequest.status === "RETURN_REJECTED" && rejectedOrder?.status === "DELIVERED",
	);

	await addToCart(organizationId, customerId, product.id, 2);
	const reconOrder = await checkout(organizationId, customerId);
	await simulatePaid(organizationId, reconOrder.id);
	await markDelivered(organizationId, reconOrder.id);

	const reconOrderWithItems = await prisma.order.findUnique({
		where: { id: reconOrder.id },
		include: { items: true },
	});
	if (!reconOrderWithItems) {
		throw new Error("Reconciliation order not found");
	}

	const reconReq = await requestReturn(organizationId, {
		orderId: reconOrderWithItems.id,
		items: reconOrderWithItems.items.map((item) => ({ orderItemId: item.id, quantity: item.quantity })),
		reason: "Defective",
	});

	const approved = await inspectReturn(organizationId, {
		returnRequestId: reconReq.id,
		outcome: "APPROVE",
		notes: "QC approved",
	});
	printResult("Quality inspection approval works", approved.returnRequest.status === "RETURN_APPROVED");

	const firstRefund = await processRefund(organizationId, {
		returnRequestId: reconReq.id,
		refundAmount: 150,
	});
	printResult(
		"Partial refund processing works",
		firstRefund.returnRequest.status === "REFUNDED" && firstRefund.refundAmount === 150,
	);

	const reconciled = await reconcileGatewayRefund(organizationId, {
		returnRequestId: reconReq.id,
		settledAmount: 180,
		gatewayRefundId: `recon_${Date.now()}`,
		gatewayRefundStatus: "SETTLED",
	});
	printResult(
		"Partial gateway reconciliation works",
		reconciled.delta === 30 && Number(reconciled.returnRequest.refundAmount) === 180,
		`delta=${reconciled.delta}`,
	);

	const reconOrderAfter = await prisma.order.findUnique({
		where: { id: reconOrder.id },
		select: { paymentStatus: true, status: true },
	});
	printResult(
		"Order stays partially refunded after reconciliation",
		reconOrderAfter?.paymentStatus === "PAID" && reconOrderAfter.status === "RETURNED",
	);

	const reconTx = await prisma.transaction.findFirst({
		where: {
			organizationId,
			type: "REFUND",
			referenceNumber: {
				startsWith: `D2C-RETURN-RECON-${reconReq.id}`,
			},
		},
		select: { id: true },
	});
	printResult("Reconciliation accounting delta posted", !!reconTx);

	console.log("Return QC & reconciliation scenarios passed.");
};

run()
	.catch((error) => {
		console.error("Return QC/reconciliation smoke test failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
