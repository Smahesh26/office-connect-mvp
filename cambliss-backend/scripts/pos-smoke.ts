import prisma from "../src/config/prisma";
import { createLedgerAccount } from "../src/modules/accounting/accounting.service";
import {
	closePOSSession,
	createPOSOrder,
	createPOSTerminal,
	generateZReport,
	startPOSSession,
} from "../src/modules/pos/pos.service";

const printResult = (name: string, pass: boolean, details?: string) => {
	const suffix = details ? ` (${details})` : "";
	console.log(`${name}: ${pass ? "PASS" : "FAIL"}${suffix}`);
};

const ensureLedgers = async (organizationId: string) => {
	const required = [
		{ name: "Cash", type: "ASSET" as const },
		{ name: "Revenue", type: "INCOME" as const },
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

const run = async () => {
	const org = await prisma.organization.findFirst({ select: { id: true } });
	if (!org) {
		throw new Error("No organization found");
	}
	const organizationId = org.id;

	await ensureLedgers(organizationId);

	const warehouse = await prisma.warehouse.findFirst({
		where: { organizationId },
		select: { id: true },
	});
	if (!warehouse) {
		throw new Error("No warehouse found");
	}

	const terminalName = `Counter-${Date.now()}`;
	const terminal = await createPOSTerminal(organizationId, {
		name: terminalName,
		location: "Main floor",
	});

	const session = await startPOSSession(organizationId, {
		terminalId: terminal.id,
		openedBy: "POS_SMOKE",
		openingCash: 1000,
	});
	printResult("Open session", !!session.id && Number(session.openingCash) === 1000);

	const product = await prisma.product.create({
		data: {
			organizationId,
			name: `POS Product ${Date.now()}`,
			sku: `POS-${Date.now()}`,
			unitPrice: 250,
			costPrice: 150,
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

	const stockBefore = await prisma.stockItem.findUnique({
		where: {
			productId_warehouseId: {
				productId: product.id,
				warehouseId: warehouse.id,
			},
		},
		select: { quantity: true },
	});

	const posOrder = await createPOSOrder(organizationId, {
		sessionId: session.id,
		paymentMethod: "CASH",
		items: [{ productId: product.id, quantity: 2 }],
	});

	const stockAfter = await prisma.stockItem.findUnique({
		where: {
			productId_warehouseId: {
				productId: product.id,
				warehouseId: warehouse.id,
			},
		},
		select: { quantity: true },
	});

	printResult(
		"Sell product -> stock reduced",
		stockBefore !== null && stockAfter !== null && stockAfter.quantity === stockBefore.quantity - 2,
		`before=${stockBefore?.quantity} after=${stockAfter?.quantity}`,
	);

	const saleTx = await prisma.transaction.findFirst({
		where: {
			organizationId,
			type: "SALE",
			referenceNumber: `POS-ORDER-${posOrder.id}`,
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

	const hasCashDebit = !!saleTx?.journalEntries.some(
		(entry) => entry.ledgerAccount.name === "Cash" && entry.debit !== null && Number(entry.debit) > 0,
	);
	printResult("Cash increases", hasCashDebit);

	const expectedCash = 1000 + Number(posOrder.totalAmount);
	const closeResult = await closePOSSession(organizationId, session.id, expectedCash);
	printResult(
		"Close session -> no mismatch",
		closeResult.variance === 0,
		`expected=${closeResult.expectedCash} variance=${closeResult.variance}`,
	);

	let blockedWithoutSession = false;
	try {
		await createPOSOrder(organizationId, {
			sessionId: session.id,
			paymentMethod: "UPI",
			items: [{ productId: product.id, quantity: 1 }],
		});
	} catch (error: any) {
		blockedWithoutSession = String(error?.message ?? "").toLowerCase().includes("closed session");
	}
	printResult("Cannot sell without session", blockedWithoutSession);

	const report = await generateZReport(organizationId, session.id);
	printResult(
		"Z-report generated",
		report.totalOrders === 1 && report.totalSales === Number(posOrder.totalAmount) && report.totalCash > 0,
		`orders=${report.totalOrders} sales=${report.totalSales}`,
	);

	console.log("POS smoke scenarios passed.");
};

run()
	.catch((error) => {
		console.error("POS smoke test failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
