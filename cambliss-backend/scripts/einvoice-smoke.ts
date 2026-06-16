import prisma from "../src/config/prisma";
import { createGSTConfig } from "../src/modules/gst/gst.service";
import { createManualInvoice } from "../src/modules/invoicing/invoicing.service";
import { generateEInvoiceJSON } from "../src/modules/gst/einvoice.service";

async function setup() {
	const stamp = Date.now();
	const org = await prisma.organization.create({ data: { name: `EInv Org ${stamp}` } });
	const user = await prisma.user.create({
		data: {
			email: `einv-${stamp}@example.com`,
			passwordHash: "hash",
		},
	});
	const role = await prisma.role.findFirst();
	if (!role) throw new Error("No role found");
	await prisma.organizationUser.create({
		data: {
			organizationId: org.id,
			userId: user.id,
			roleId: role.id,
		},
	});

	await createGSTConfig(org.id, {
		gstNumber: "36ABCDE1234F1Z7",
		legalName: "Cambliss EInvoice Pvt Ltd",
		tradeName: "Cambliss",
		stateCode: "36",
	});

	const product1 = await prisma.product.create({
		data: {
			organizationId: org.id,
			name: "Laptop",
			sku: `LAP-${stamp}`,
			hsnCode: "8471",
			unitPrice: 50000,
			taxRate: 18,
			isActive: true,
		},
	});

	const product2 = await prisma.product.create({
		data: {
			organizationId: org.id,
			name: "Mouse",
			sku: `MOU-${stamp}`,
			hsnCode: "8471",
			unitPrice: 1000,
			taxRate: 18,
			isActive: true,
		},
	});

	const buyerSame = await prisma.contact.create({
		data: {
			organizationId: org.id,
			type: "CUSTOMER",
			companyName: "Hyderabad Buyer LLP",
			gstNumber: "36ABCDE1234F1Z5",
			stateCode: "36",
		},
	});

	const buyerDiff = await prisma.contact.create({
		data: {
			organizationId: org.id,
			type: "CUSTOMER",
			companyName: "Mumbai Buyer LLP",
			gstNumber: "27ABCDE1234F1Z5",
			stateCode: "27",
		},
	});

	return { org, user, product1, product2, buyerSame, buyerDiff };
}

async function run() {
	console.log("🚀 E-invoice smoke test started");
	const fx = await setup();

	try {
		const sameInvoice = await createManualInvoice(fx.org.id, {
			customerId: fx.buyerSame.id,
			items: [
				{ productId: fx.product1.id, quantity: 1, price: 50000, taxRate: 18 },
				{ productId: fx.product2.id, quantity: 2, price: 1000, taxRate: 18 },
			],
			status: "PAID",
		});

		const diffInvoice = await createManualInvoice(fx.org.id, {
			customerId: fx.buyerDiff.id,
			items: [
				{ productId: fx.product1.id, quantity: 1, price: 50000, taxRate: 18 },
				{ productId: fx.product2.id, quantity: 2, price: 1000, taxRate: 18 },
			],
			status: "PAID",
		});

		const sameJson = await generateEInvoiceJSON(sameInvoice.id, fx.org.id);
		const diffJson = await generateEInvoiceJSON(diffInvoice.id, fx.org.id);

		if (sameJson.Version !== "1.1") throw new Error("NIC version missing");
		if (sameJson.ItemList.length !== 2) throw new Error("Multiple item mapping failed");
		if (!sameJson.ItemList.every((i) => i.HsnCd && i.Unit === "NOS")) {
			throw new Error("HSN/Unit mapping failed");
		}

		const sameVal = sameJson.ValDtls;
		if (!(sameVal.CgstVal > 0 && sameVal.SgstVal > 0 && sameVal.IgstVal === 0)) {
			throw new Error("Same-state tax breakup invalid");
		}

		const diffVal = diffJson.ValDtls;
		if (!(diffVal.IgstVal > 0 && diffVal.CgstVal === 0 && diffVal.SgstVal === 0)) {
			throw new Error("Inter-state tax breakup invalid");
		}

		console.log("✅ Same-state invoice JSON validated");
		console.log("✅ Inter-state invoice JSON validated");
		console.log("✅ Multiple items + tax breakup validated");
		console.log("🎉 E-invoice smoke test passed");
	} finally {
		await prisma.invoiceItem.deleteMany({ where: { invoice: { organizationId: fx.org.id } } });
		await prisma.invoice.deleteMany({ where: { organizationId: fx.org.id } });
		await prisma.product.deleteMany({ where: { organizationId: fx.org.id } });
		await prisma.contact.deleteMany({ where: { organizationId: fx.org.id } });
		await prisma.gSTConfig.deleteMany({ where: { organizationId: fx.org.id } });
		await prisma.organizationUser.deleteMany({ where: { organizationId: fx.org.id } });
		await prisma.user.deleteMany({ where: { id: fx.user.id } });
		await prisma.organization.delete({ where: { id: fx.org.id } });
		await prisma.$disconnect();
	}
}

run().catch((error) => {
	console.error("❌ E-invoice smoke test failed:", error);
	process.exit(1);
});
