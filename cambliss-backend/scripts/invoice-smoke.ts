/**
 * INVOICE SMOKE TEST
 * 
 * Tests enterprise invoicing engine:
 * 1. Auto-invoice from POS order (INV-2026-00001)
 * 2. Invoice numbering sequence (year-based, unique)
 * 3. Prevent duplicate invoice for same order
 */

import prisma from "../src/config/prisma";

const toMoney = (value: number) => Number(value.toFixed(2));

async function setup() {
	console.log("🔧 Setting up organization, user, and test data...");

	// Create organization
	const org = await prisma.organization.create({
		data: {
			name: "Invoice Smoke Test Retailers Ltd.",
		},
	});

	// Create owner user
	const user = await prisma.user.create({
		data: {
			email: `test-${Date.now()}@example.com`,
			passwordHash: "dummy-hash",
		},
	});

	// Create role
	const role = await prisma.role.findFirst({
		where: { name: "ADMIN" },
	});

	if (!role) {
		throw new Error("OWNER role not found");
	}

	await prisma.organizationUser.create({
		data: {
			userId: user.id,
			organizationId: org.id,
			roleId: role.id,
		},
	});

	// Create subscription (active)
	const plan = await prisma.plan.create({
		data: {
			name: "Enterprise Plan",
			description: "Full access",
			price: 0,
			interval: "MONTHLY",
			isActive: true,
		},
	});

	await prisma.subscription.create({
		data: {
			organizationId: org.id,
			planId: plan.id,
			status: "ACTIVE",
			currentPeriodStart: new Date(),
			currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			cancelAtPeriodEnd: false,
		},
	});

	// Create ledger accounts
	const cashLedger = await prisma.ledgerAccount.create({
		data: {
			organizationId: org.id,
			name: "Cash",
			type: "ASSET",
		},
	});

	const revenueLedger = await prisma.ledgerAccount.create({
		data: {
			organizationId: org.id,
			name: "Revenue",
			type: "INCOME",
		},
	});

	const arLedger = await prisma.ledgerAccount.create({
		data: {
			organizationId: org.id,
			name: "Accounts Receivable",
			type: "ASSET",
		},
	});

	// Create warehouse
	const warehouse = await prisma.warehouse.create({
		data: {
			organizationId: org.id,
			name: "Main Warehouse",
		},
	});

	// Create products
	const product1 = await prisma.product.create({
		data: {
			organizationId: org.id,
			name: "Coffee Mug",
			sku: "MUG-001",
			unitPrice: 15.99,
			isActive: true,
			taxRate: 10.0,
		},
	});

	const product2 = await prisma.product.create({
		data: {
			organizationId: org.id,
			name: "Notebook",
			sku: "NOTE-001",
			unitPrice: 8.50,
			isActive: true,
			taxRate: 5.0,
		},
	});

	// Create stock using inventory module
	const { addStock } = await import("../src/modules/inventory/inventory.service");
	await addStock(org.id, product1.id, warehouse.id, 500, "Initial stock");
	await addStock(org.id, product2.id, warehouse.id, 500, "Initial stock");

	// Create POS terminal
	const terminal = await prisma.pOSTerminal.create({
		data: {
			organizationId: org.id,
			name: "Checkout Counter 1",
			isActive: true,
		},
	});

	// Create POS session
	const session = await prisma.pOSSession.create({
		data: {
			terminalId: terminal.id,
			openedBy: user.id,
			openingCash: 100.0,
		},
	});

	// Create customer
	const customer = await prisma.contact.create({
		data: {
			organizationId: org.id,
			firstName: "John",
			lastName: "Doe",
			email: `test-customer-${Date.now()}@example.com`,
			type: "CUSTOMER",
		},
	});

	console.log("✅ Setup complete");

	return {
		org,
		user,
		cashLedger,
		revenueLedger,
		arLedger,
		warehouse,
		product1,
		product2,
		terminal,
		session,
		customer,
	};
}

type SetupData = {
	org: { id: string };
	user: { id: string };
	cashLedger: { id: string };
	revenueLedger: { id: string };
	arLedger: { id: string };
	warehouse: { id: string };
	product1: { id: string };
	product2: { id: string };
	terminal: { id: string };
	session: { id: string };
	customer: { id: string };
};

async function test1_AutoInvoiceFromPOSOrder(setup: SetupData) {
	console.log("\n📋 TEST 1: Auto-invoice from POS order");

	const { org, session, customer, product1, product2 } = setup;

	// Import POS service
	const { createPOSOrder } =await import("../src/modules/pos/pos.service");

	const posOrder = await createPOSOrder(org.id, {
		sessionId: session.id,
		items: [
			{ productId: product1.id, quantity: 2 },
			{ productId: product2.id, quantity: 3 },
		],
		paymentMethod: "CASH",
		customerId: customer.id,
	});

	console.log(`  ✅ POS order created: ${posOrder.id}, totalAmount: ${posOrder.totalAmount}`);

	// Check invoice auto-created
	const invoice = await prisma.invoice.findUnique({
		where: {
			posOrderId: posOrder.id,
		},
		include: {
			items: {
				include: {
					product: {
						select: { name: true, sku: true },
					},
				},
			},
		},
	});

	if (!invoice) {
		throw new Error("❌ Invoice not auto-created for POS order");
	}

	console.log(`  ✅ Invoice auto-created: ${invoice.invoiceNumber}`);
	console.log(`     Issued at: ${invoice.issuedAt}`);
	console.log(`     Status: ${invoice.status}`);
	console.log(`     Subtotal: ${invoice.subtotal}`);
	const totalTax = Number(invoice.cgstAmount) + Number(invoice.sgstAmount) + Number(invoice.igstAmount);
	console.log(`     Tax: ${totalTax.toFixed(2)}`);
	console.log(`     Total: ${invoice.totalAmount}`);
	console.log(`     Items:`);
	invoice.items.forEach((item) => {
		const itemTax = Number(item.cgstAmount) + Number(item.sgstAmount) + Number(item.igstAmount);
		console.log(
			`       - ${item.product.name} (${item.product.sku}): ${item.quantity} × ${item.price}, tax: ${itemTax.toFixed(2)}`,
		);
	});

	// Verify invoice number format (INV-YYYY-#####)
	const invoiceNumberPattern = /^INV-\d{4}-\d{5}$/;
	if (!invoiceNumberPattern.test(invoice.invoiceNumber)) {
		throw new Error(`❌ Invoice number format invalid: ${invoice.invoiceNumber}`);
	}

	console.log(`  ✅ Invoice number format valid: ${invoice.invoiceNumber}`);

	return invoice;
}

async function test2_InvoiceNumberingSequence(setup: SetupData) {
	console.log("\n📋 TEST 2: Invoice numbering sequence");

	const { org, session, product1 } = setup;

	// Create multiple POS orders to test invoice numbering
	const { createPOSOrder } = await import("../src/modules/pos/pos.service");

	const order1 = await createPOSOrder(org.id, {
		sessionId: session.id,
		items: [{ productId: product1.id, quantity: 1 }],
		paymentMethod: "CASH",
	});

	const order2 = await createPOSOrder(org.id, {
		sessionId: session.id,
		items: [{ productId: product1.id, quantity: 1 }],
		paymentMethod: "CARD",
	});

	// Retrieve all invoices for this org
	const invoices = await prisma.invoice.findMany({
		where: { organizationId: org.id },
		orderBy: { invoiceNumber: "asc" },
		select: { invoiceNumber: true },
	});

	console.log(`  ✅ Total invoices: ${invoices.length}`);
	invoices.forEach((inv, idx) => {
		console.log(`     ${idx + 1}. ${inv.invoiceNumber}`);
	});

	// Verify sequential numbering
	const currentYear = new Date().getFullYear();
	for (let i = 0; i < invoices.length; i++) {
		const expectedNumber = `INV-${currentYear}-${String(i + 1).padStart(5, "0")}`;
		if (invoices[i].invoiceNumber !== expectedNumber) {
			throw new Error(
				`❌ Invoice numbering sequence broken: expected ${expectedNumber}, got ${invoices[i].invoiceNumber}`,
			);
		}
	}

	console.log(`  ✅ Invoice numbering sequence is correct (year-based, sequential)`);
}

async function test3_PreventDuplicateInvoice(setup: SetupData) {
	console.log("\n📋 TEST 3: Prevent duplicate invoice for same order");

	const { org, session, product1 } = setup;

	const { createPOSOrder } = await import("../src/modules/pos/pos.service");
	const { createInvoiceFromPOSOrder } = await import("../src/modules/invoicing/invoicing.service");

	// Create POS order (invoice auto-created)
	const posOrder = await createPOSOrder(org.id, {
		sessionId: session.id,
		items: [{ productId: product1.id, quantity: 1 }],
		paymentMethod: "CASH",
	});

	console.log(`  ✅ POS order created: ${posOrder.id}`);

	// Verify invoice already exists
	const existingInvoice = await prisma.invoice.findUnique({
		where: { posOrderId: posOrder.id },
	});

	if (!existingInvoice) {
		throw new Error("❌ Invoice not auto-created for POS order");
	}

	console.log(`  ✅ Invoice already exists: ${existingInvoice.invoiceNumber}`);

	// Try to create duplicate invoice (should fail or return existing)
	try {
		await createInvoiceFromPOSOrder(org.id, posOrder.id);
		throw new Error("❌ Duplicate invoice creation should have been prevented");
	} catch (error: any) {
		if (error.message.includes("Invoice already exists")) {
			console.log(`  ✅ Duplicate invoice creation prevented: ${error.message}`);
		} else {
			throw error;
		}
	}
}

async function cleanup(orgId: string) {
	console.log("\n🧹 Cleaning up test data...");

	await prisma.journalEntry.deleteMany({
		where: {
			transaction: {
				organizationId: orgId,
			},
		},
	});

	await prisma.transaction.deleteMany({
		where: { organizationId: orgId },
	});

	await prisma.invoiceItem.deleteMany({
		where: { invoice: { organizationId: orgId } },
	});

	await prisma.invoice.deleteMany({
		where: { organizationId: orgId },
	});

	await prisma.pOSOrderItem.deleteMany({
		where: { order: { organizationId: orgId } },
	});

	await prisma.pOSOrder.deleteMany({
		where: { organizationId: orgId },
	});

	await prisma.pOSSession.deleteMany({
		where: { terminal: { organizationId: orgId } },
	});

	await prisma.pOSTerminal.deleteMany({
		where: { organizationId: orgId },
	});

	await prisma.stockMovement.deleteMany({
		where: { organizationId: orgId },
	});

	await prisma.contact.deleteMany({
		where: { organizationId: orgId },
	});

	await prisma.product.deleteMany({
		where: { organizationId: orgId },
	});

	await prisma.warehouse.deleteMany({
		where: { organizationId: orgId },
	});

	await prisma.ledgerAccount.deleteMany({
		where: { organizationId: orgId },
	});

	await prisma.subscription.deleteMany({
		where: { organizationId: orgId },
	});

	await prisma.organizationUser.deleteMany({
		where: { organizationId: orgId },
	});

	const users = await prisma.organizationUser.findMany({
		where: { organizationId: orgId },
		select: { userId: true },
	});

	await prisma.user.deleteMany({
		where: { id: { in: users.map((u) => u.userId) } },
	});

	await prisma.plan.deleteMany({
		where: { subscriptions: { some: { organizationId: orgId } } },
	});

	await prisma.organization.delete({
		where: { id: orgId },
	});

	console.log("✅ Cleanup complete");
}

async function main() {
	console.log("🚀 Starting Invoice Smoke Test\n");

	const testSetup = await setup();

	try {
		await test1_AutoInvoiceFromPOSOrder(testSetup);
		await test2_InvoiceNumberingSequence(testSetup);
		await test3_PreventDuplicateInvoice(testSetup);

		console.log("\n✅ ALL TESTS PASSED\n");
	} catch (error) {
		console.error("\n❌ TEST FAILED:", error);
		throw error;
	} finally {
		await cleanup(testSetup.org.id);
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
