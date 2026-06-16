import prisma from "../src/config/prisma";
import {
	calculateGST,
	createGSTConfig,
	generateGSTReport,
	generateGSTR1Data,
} from "../src/modules/gst/gst.service";
import { createManualInvoice } from "../src/modules/invoicing/invoicing.service";

const toMoney = (value: number) => Number(value.toFixed(2));

async function setup() {
	const timestamp = Date.now();

	const org = await prisma.organization.create({
		data: { name: `GST Smoke Org ${timestamp}` },
	});

	const user = await prisma.user.create({
		data: {
			email: `gst-smoke-${timestamp}@example.com`,
			passwordHash: "test-hash",
		},
	});

	const ownerRole = await prisma.role.findFirst();
	if (!ownerRole) {
		throw new Error("No role found. Seed roles first.");
	}

	await prisma.organizationUser.create({
		data: {
			organizationId: org.id,
			userId: user.id,
			roleId: ownerRole.id,
		},
	});

	const customerSameState = await prisma.contact.create({
		data: {
			organizationId: org.id,
			type: "CUSTOMER",
			firstName: "Same",
			lastName: "State",
			stateCode: "36", // Telangana
			gstNumber: "36ABCDE1234F1Z5",
		},
	});

	const customerDifferentState = await prisma.contact.create({
		data: {
			organizationId: org.id,
			type: "CUSTOMER",
			firstName: "Diff",
			lastName: "State",
			stateCode: "27", // Maharashtra
			gstNumber: "27ABCDE1234F1Z5",
		},
	});

	const vendor = await prisma.contact.create({
		data: {
			organizationId: org.id,
			type: "VENDOR",
			companyName: "Vendor Pvt Ltd",
			stateCode: "36",
			gstNumber: "36ABCDE1234F1Z6",
		},
	});

	const warehouse = await prisma.warehouse.create({
		data: {
			organizationId: org.id,
			name: `Main WH ${timestamp}`,
		},
	});

	const product = await prisma.product.create({
		data: {
			organizationId: org.id,
			name: "GST Test Product",
			sku: `GST-${timestamp}`,
			unitPrice: 100,
			taxRate: 18,
			isActive: true,
		},
	});

	await prisma.stockItem.create({
		data: {
			productId: product.id,
			warehouseId: warehouse.id,
			quantity: 100,
		},
	});

	await createGSTConfig(org.id, {
		gstNumber: "36ABCDE1234F1Z7",
		legalName: "Cambliss GST Test Pvt Ltd",
		tradeName: "Cambliss",
		stateCode: "36", // Telangana seller
		isComposition: false,
	});

	return {
		org,
		user,
		customerSameState,
		customerDifferentState,
		vendor,
		product,
	};
}

async function run() {
	console.log("🚀 GST smoke test started");
	const fx = await setup();

	try {
		console.log("\n1) Same-state GST split (CGST + SGST)");
		const same = calculateGST("36", "36", 1000, 18);
		if (same.cgstRate !== 9 || same.sgstRate !== 9 || same.igstRate !== 0) {
			throw new Error("Same-state GST split failed");
		}
		if (same.cgstAmount !== 90 || same.sgstAmount !== 90 || same.igstAmount !== 0) {
			throw new Error("Same-state GST amounts failed");
		}
		console.log("✅ Same-state split validated");

		console.log("\n2) Different-state GST (IGST)");
		const diff = calculateGST("36", "27", 1000, 18);
		if (diff.cgstRate !== 0 || diff.sgstRate !== 0 || diff.igstRate !== 18) {
			throw new Error("Different-state GST split failed");
		}
		if (diff.cgstAmount !== 0 || diff.sgstAmount !== 0 || diff.igstAmount !== 180) {
			throw new Error("Different-state GST amounts failed");
		}
		console.log("✅ Different-state split validated");

		console.log("\n3) Create invoices for output GST");
		const invoiceSame = await createManualInvoice(fx.org.id, {
			customerId: fx.customerSameState.id,
			items: [{ productId: fx.product.id, quantity: 10, price: 100, taxRate: 18 }],
			status: "PAID",
		});
		const invoiceDiff = await createManualInvoice(fx.org.id, {
			customerId: fx.customerDifferentState.id,
			items: [{ productId: fx.product.id, quantity: 10, price: 100, taxRate: 18 }],
			status: "PAID",
		});

		const sameRecord = await prisma.invoice.findUnique({ where: { id: invoiceSame.id } });
		const diffRecord = await prisma.invoice.findUnique({ where: { id: invoiceDiff.id } });
		if (!sameRecord || !diffRecord) throw new Error("Invoice fetch failed");

		if (Number(sameRecord.cgstAmount) !== 90 || Number(sameRecord.sgstAmount) !== 90 || Number(sameRecord.igstAmount) !== 0) {
			throw new Error("Same-state invoice GST mismatch");
		}
		if (Number(diffRecord.cgstAmount) !== 0 || Number(diffRecord.sgstAmount) !== 0 || Number(diffRecord.igstAmount) !== 180) {
			throw new Error("Different-state invoice GST mismatch");
		}
		console.log("✅ Invoice GST determination validated");

		console.log("\n4) Record purchase ITC and validate report math");
		await prisma.purchaseOrder.create({
			data: {
				organizationId: fx.org.id,
				vendorId: fx.vendor.id,
				status: "RECEIVED",
				totalAmount: 1180,
				items: {
					create: [
						{
							productId: fx.product.id,
							quantity: 10,
							unitPrice: 100,
							gstRate: 18,
							cgstAmount: 90,
							sgstAmount: 90,
							igstAmount: 0,
						},
					],
				},
			},
		});

		const now = new Date();
		const report = await generateGSTReport(fx.org.id, {
			month: now.getMonth() + 1,
			year: now.getFullYear(),
		});

		const expectedOutput = toMoney(180 + 180); // two invoices GST
		const expectedITC = 180;
		const expectedNet = toMoney(expectedOutput - expectedITC);

		if (report.output.totalGST !== expectedOutput) {
			throw new Error(`Output GST mismatch: expected ${expectedOutput}, got ${report.output.totalGST}`);
		}
		if (report.input.totalITC !== expectedITC) {
			throw new Error(`ITC mismatch: expected ${expectedITC}, got ${report.input.totalITC}`);
		}
		if (report.netGSTPayable !== expectedNet) {
			throw new Error(`Net GST payable mismatch: expected ${expectedNet}, got ${report.netGSTPayable}`);
		}
		console.log("✅ GST report totals validated");

		console.log("\n5) Validate GSTR-1 structure");
		const gstr1 = await generateGSTR1Data(fx.org.id, {
			month: now.getMonth() + 1,
			year: now.getFullYear(),
		});

		if (!gstr1.gstin || gstr1.invoices.length < 2) {
			throw new Error("GSTR-1 data incomplete");
		}
		const requiredFieldsOk = gstr1.invoices.every((inv) =>
			inv.invoiceNumber && inv.invoiceDate && inv.taxableValue >= 0,
		);
		if (!requiredFieldsOk) {
			throw new Error("GSTR-1 invoice fields missing");
		}
		console.log("✅ GSTR-1 payload validated");

		console.log("\n🎉 GST smoke test passed");
	} finally {
		await prisma.journalEntry.deleteMany({ where: { transaction: { organizationId: fx.org.id } } });
		await prisma.transaction.deleteMany({ where: { organizationId: fx.org.id } });
		await prisma.invoiceItem.deleteMany({ where: { invoice: { organizationId: fx.org.id } } });
		await prisma.invoice.deleteMany({ where: { organizationId: fx.org.id } });
		await prisma.purchaseItem.deleteMany({ where: { purchase: { organizationId: fx.org.id } } });
		await prisma.purchaseOrder.deleteMany({ where: { organizationId: fx.org.id } });
		await prisma.stockItem.deleteMany({ where: { warehouse: { organizationId: fx.org.id } } });
		await prisma.product.deleteMany({ where: { organizationId: fx.org.id } });
		await prisma.warehouse.deleteMany({ where: { organizationId: fx.org.id } });
		await prisma.contact.deleteMany({ where: { organizationId: fx.org.id } });
		await prisma.gSTConfig.deleteMany({ where: { organizationId: fx.org.id } });
		await prisma.organizationUser.deleteMany({ where: { organizationId: fx.org.id } });
		await prisma.user.deleteMany({ where: { id: fx.user.id } });
		await prisma.organization.delete({ where: { id: fx.org.id } });
		await prisma.$disconnect();
	}
}

run().catch((error) => {
	console.error("❌ GST smoke test failed:", error);
	process.exit(1);
});
