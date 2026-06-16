import prisma from "../src/config/prisma";
import { createLedgerAccount } from "../src/modules/accounting/accounting.service";
import {
	addToCart,
	checkout,
	clearCart,
	createProductListing,
	createStore,
	getStoreByOrganization,
	getStoreProducts,
	updateOrderStatus,
} from "../src/modules/ecommerce/ecommerce.service";

const printResult = (name: string, pass: boolean, details?: string) => {
	const suffix = details ? ` (${details})` : "";
	console.log(`${name}: ${pass ? "PASS" : "FAIL"}${suffix}`);
};

const ensureCustomer = async (organizationId: string, suffix: string) => {
	const existing = await prisma.contact.findFirst({
		where: {
			organizationId,
			type: "CUSTOMER",
			email: `domain2.${suffix}@example.com`,
		},
		select: { id: true },
	});

	if (existing) {
		return existing.id;
	}

	const created = await prisma.contact.create({
		data: {
			organizationId,
			type: "CUSTOMER",
			firstName: "Domain2",
			lastName: "Customer",
			email: `domain2.${suffix}@example.com`,
		},
		select: { id: true },
	});

	return created.id;
};

const ensureLedgers = async (organizationId: string) => {
	const ar = await prisma.ledgerAccount.findFirst({
		where: { organizationId, name: "Accounts Receivable" },
		select: { id: true },
	});
	if (!ar) {
		await createLedgerAccount(organizationId, {
			name: "Accounts Receivable",
			type: "ASSET",
			isSystem: true,
		});
	}

	const revenue = await prisma.ledgerAccount.findFirst({
		where: { organizationId, name: "Revenue" },
		select: { id: true },
	});
	if (!revenue) {
		await createLedgerAccount(organizationId, {
			name: "Revenue",
			type: "INCOME",
			isSystem: true,
		});
	}
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
		const created = await createStore(organizationId, `Domain2 Store ${suffix}`, `d2-${suffix}.test`);
		store = { id: created.id };
	}

	const storeRecord = await getStoreByOrganization(organizationId);
	if (!storeRecord.isActive) {
		await prisma.store.update({ where: { id: storeRecord.id }, data: { isActive: true } });
	}

	const customerId = await ensureCustomer(organizationId, suffix);

	const warehouse = await prisma.warehouse.findFirst({ where: { organizationId }, select: { id: true } });
	if (!warehouse) {
		throw new Error("No warehouse found. Create warehouse first.");
	}

	const product = await prisma.product.create({
		data: {
			organizationId,
			name: `D2 Product ${suffix}`,
			sku: `D2-${suffix}`,
			unitPrice: 65,
			costPrice: 40,
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
		update: { quantity: 10 },
		create: {
			productId: product.id,
			warehouseId: warehouse.id,
			quantity: 10,
		},
	});

	const listing = await createProductListing(organizationId, product.id, undefined, 80);

	await clearCart(organizationId, storeRecord.id, customerId);

	// ✔ Add product to cart
	const cart = await addToCart(organizationId, customerId, product.id, 2);
	printResult("✔ Add product to cart", cart.items.length === 1 && cart.items[0].quantity === 2);

	const stockBeforeCheckout = await prisma.stockItem.findUnique({
		where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
		select: { quantity: true },
	});

	// ✔ Checkout → order created
	const order = await checkout(organizationId, customerId);
	printResult("✔ Checkout → order created", !!order.id && order.items.length === 1 && order.status === "PENDING");

	// ✔ Stock reduced
	const stockAfterCheckout = await prisma.stockItem.findUnique({
		where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
		select: { quantity: true },
	});
	const reducedByTwo = (stockBeforeCheckout?.quantity ?? 0) - (stockAfterCheckout?.quantity ?? 0) === 2;
	printResult("✔ Stock reduced", reducedByTwo, `before=${stockBeforeCheckout?.quantity} after=${stockAfterCheckout?.quantity}`);

	// ✔ Revenue recorded
	const saleTx = await prisma.transaction.findFirst({
		where: {
			organizationId,
			type: "SALE",
			referenceNumber: `D2C-ORDER-${order.id}`,
		},
		select: { id: true },
	});
	printResult("✔ Revenue recorded", !!saleTx?.id);

	// ✔ Double checkout prevented
	let doubleCheckoutPrevented = false;
	try {
		await checkout(organizationId, customerId);
	} catch (error: any) {
		doubleCheckoutPrevented = error.message.includes("Cart is empty");
	}
	printResult("✔ Double checkout prevented", doubleCheckoutPrevented);

	// ✔ Cancel order → stock restored
	await updateOrderStatus(organizationId, order.id, "CANCELLED");

	const stockAfterCancel = await prisma.stockItem.findUnique({
		where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
		select: { quantity: true },
	});
	const restored = stockAfterCancel?.quantity === stockBeforeCheckout?.quantity;
	printResult("✔ Cancel order → stock restored", restored, `restored=${stockAfterCancel?.quantity}`);

	const refundTx = await prisma.transaction.findFirst({
		where: {
			organizationId,
			type: "REFUND",
			referenceNumber: `D2C-ORDER-CANCEL-${order.id}`,
		},
		select: { id: true },
	});
	printResult("✔ Cancel order → accounting reversed", !!refundTx?.id);

	const visibleProducts = await getStoreProducts(organizationId);
	printResult("✔ Listing remains queryable post-cycle", visibleProducts.some((p) => p.id === listing.id));
};

run()
	.catch((error) => {
		console.error("Domain 2 smoke test failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
