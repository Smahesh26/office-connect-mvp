import prisma from "../src/config/prisma";
import { createStore, createProductListing, addToCart, updateCartItem, removeFromCart, getCart, clearCart } from "../src/modules/ecommerce/ecommerce.service";

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

	const created = await prisma.contact.create({
		data: {
			organizationId,
			type: "CUSTOMER",
			firstName: "Cart",
			lastName: "Tester",
			email,
		},
		select: { id: true },
	});

	return created.id;
};

const run = async () => {
	const org = await prisma.organization.findFirst({ select: { id: true } });
	if (!org) {
		throw new Error("No organization found");
	}

	const organizationId = org.id;
	const suffix = Date.now().toString();

	let store = await prisma.store.findFirst({ where: { organizationId }, select: { id: true, isActive: true } });
	if (!store) {
		const created = await createStore(organizationId, `Cart Store ${suffix}`, `cart-${suffix}.test`);
		store = { id: created.id, isActive: created.isActive };
	}
	if (!store.isActive) {
		await prisma.store.update({ where: { id: store.id }, data: { isActive: true } });
	}

	const customerId = await ensureCustomer(organizationId, `cart.${suffix}@example.com`);
	await clearCart(organizationId, store.id, customerId);

	const warehouse = await prisma.warehouse.findFirst({ where: { organizationId }, select: { id: true } });
	if (!warehouse) {
		throw new Error("No warehouse found");
	}

	const activeProduct = await prisma.product.create({
		data: {
			organizationId,
			name: `Cart Active Product ${suffix}`,
			sku: `CART-ACT-${suffix}`,
			unitPrice: 100,
			costPrice: 60,
			isActive: true,
		},
		select: { id: true },
	});

	await prisma.stockItem.upsert({
		where: {
			productId_warehouseId: {
				productId: activeProduct.id,
				warehouseId: warehouse.id,
			},
		},
		update: { quantity: 5 },
		create: {
			productId: activeProduct.id,
			warehouseId: warehouse.id,
			quantity: 5,
		},
	});

	await createProductListing(organizationId, activeProduct.id, undefined, 120);

	const inactiveProduct = await prisma.product.create({
		data: {
			organizationId,
			name: `Cart Inactive Product ${suffix}`,
			sku: `CART-INACT-${suffix}`,
			unitPrice: 100,
			costPrice: 60,
			isActive: true,
		},
		select: { id: true },
	});

	const inactiveListing = await createProductListing(organizationId, inactiveProduct.id, undefined, 120);
	await prisma.productListing.update({ where: { id: inactiveListing.id }, data: { isActive: false } });

	// ✔ Add item
	const cartAfterAdd = await addToCart(organizationId, customerId, activeProduct.id, 1);
	printResult("✔ Add item", cartAfterAdd.items.length === 1 && cartAfterAdd.items[0].quantity === 1);

	// ✔ Increase quantity
	const cartAfterIncrease = await addToCart(organizationId, customerId, activeProduct.id, 1);
	printResult("✔ Increase quantity", cartAfterIncrease.items.length === 1 && cartAfterIncrease.items[0].quantity === 2);

	// ✔ Reduce quantity
	const cartItemId = cartAfterIncrease.items[0]?.id;
	if (!cartItemId) {
		throw new Error("Cart item not found after increase");
	}
	const cartAfterReduce = await updateCartItem(organizationId, { cartItemId, quantity: 1 });
	printResult("✔ Reduce quantity", cartAfterReduce.items.length === 1 && cartAfterReduce.items[0].quantity === 1);

	// ✔ Remove item
	const cartAfterRemove = await removeFromCart(organizationId, { cartItemId });
	printResult("✔ Remove item", cartAfterRemove.items.length === 0);

	// ✔ Add more than stock → blocked
	let overStockBlocked = false;
	try {
		await addToCart(organizationId, customerId, activeProduct.id, 10);
	} catch (error: any) {
		overStockBlocked = error.message.includes("Insufficient stock");
	}
	printResult("✔ Add more than stock → blocked", overStockBlocked);

	// ✔ Add inactive product → blocked
	let inactiveBlocked = false;
	try {
		await addToCart(organizationId, customerId, inactiveProduct.id, 1);
	} catch (error: any) {
		inactiveBlocked = error.message.toLowerCase().includes("active product listing not found");
	}
	printResult("✔ Add inactive product → blocked", inactiveBlocked);

	// ✔ getCart(customerId) shape checks
	const cart = await getCart(organizationId, customerId);
	const hasTotals = typeof (cart as any).subtotal === "number" && typeof (cart as any).total === "number";
	printResult("✔ getCart returns totals", hasTotals, `subtotal=${(cart as any).subtotal ?? 0} total=${(cart as any).total ?? 0}`);
};

run()
	.catch((error) => {
		console.error("Cart engine smoke test failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
