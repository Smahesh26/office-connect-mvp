import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import prisma from "../../config/prisma";
import {
	generateEWayBillJSON,
	validateEWayBillEligibility,
	getEWayBillHistory,
	cancelEWayBill,
} from "./eway.service";

describe("E-Way Bill Service", () => {
	let testOrgId: string;
	let testGSTConfigId: string;
	let testCustomer: any;
	let testProduct: any;
	let testInvoiceValid: any;
	let testInvoiceBelowThreshold: any;
	let testInvoiceNoGSTIN: any;

	beforeAll(async () => {
		// Create test organization
		const org = await prisma.organization.create({
			data: {
				name: "E-Way Test Org",
			},
		});
		testOrgId = org.id;

		// Create GST Config for organization
		const gstConfig = await prisma.gSTConfig.create({
			data: {
				organizationId: testOrgId,
				gstNumber: "27AABCT1234F0Z5",
				legalName: "Test Company Pvt Ltd",
				tradeName: "Test Company",
				stateCode: "27",
				isComposition: false,
			},
		});
		testGSTConfigId = gstConfig.id;

		// Create customer with GSTIN (B2B)
		testCustomer = await prisma.contact.create({
			data: {
				organizationId: testOrgId,
				type: "CUSTOMER",
				firstName: "Test",
				lastName: "Customer",
				companyName: "Customer Corp",
				email: "customer@test.com",
				gstNumber: "29AAPFT5055K1Z0",
				stateCode: "29",
				state: "Karnataka",
				billingAddress: "123 Test Street, Bangalore",
				shippingAddress: "123 Test Street, Bangalore",
			},
		});

		// Create customer without GSTIN (B2C)
		const customerNoGSTIN = await prisma.contact.create({
			data: {
				organizationId: testOrgId,
				type: "CUSTOMER",
				firstName: "B2C",
				lastName: "Customer",
				email: "b2c@test.com",
				stateCode: "27",
			},
		});

		// Create test product with HSN code
		testProduct = await prisma.product.create({
			data: {
				organizationId: testOrgId,
				name: "Test Product",
				sku: "TEST-PROD-001",
				description: "Test product description",
				hsnCode: "12345678",
				unitPrice: 10000,
			},
		});

		// Create product without HSN
		const productNoHSN = await prisma.product.create({
			data: {
				organizationId: testOrgId,
				name: "Product Without HSN",
				sku: "TEST-NO-HSN",
				unitPrice: 5000,
			},
		});

		// Create valid invoice (above threshold, with GSTIN, with HSN)
		testInvoiceValid = await prisma.invoice.create({
			data: {
				organizationId: testOrgId,
				invoiceNumber: "INV-EWAY-001",
				customerId: testCustomer.id,
				status: "ISSUED",
				subtotal: 100000,
				cgstAmount: 9000,
				sgstAmount: 9000,
				igstAmount: 0,
				totalAmount: 118000,
				placeOfSupply: "29",
				issuedAt: new Date(),
			},
		});

		await prisma.invoiceItem.create({
			data: {
				invoiceId: testInvoiceValid.id,
				productId: testProduct.id,
				quantity: 10,
				price: 10000,
				gstRate: 18,
				cgstRate: 9,
				sgstRate: 9,
				cgstAmount: 9000,
				sgstAmount: 9000,
			},
		});

		// Create invoice below threshold
		testInvoiceBelowThreshold = await prisma.invoice.create({
			data: {
				organizationId: testOrgId,
				invoiceNumber: "INV-EWAY-002",
				customerId: testCustomer.id,
				status: "ISSUED",
				subtotal: 30000,
				cgstAmount: 2700,
				sgstAmount: 2700,
				igstAmount: 0,
				totalAmount: 35400,
				placeOfSupply: "29",
				issuedAt: new Date(),
			},
		});

		await prisma.invoiceItem.create({
			data: {
				invoiceId: testInvoiceBelowThreshold.id,
				productId: testProduct.id,
				quantity: 3,
				price: 10000,
				gstRate: 18,
				cgstRate: 9,
				sgstRate: 9,
				cgstAmount: 2700,
				sgstAmount: 2700,
			},
		});

		// Create invoice without buyer GSTIN
		testInvoiceNoGSTIN = await prisma.invoice.create({
			data: {
				organizationId: testOrgId,
				invoiceNumber: "INV-EWAY-003",
				customerId: customerNoGSTIN.id,
				status: "ISSUED",
				subtotal: 100000,
				cgstAmount: 9000,
				sgstAmount: 9000,
				igstAmount: 0,
				totalAmount: 118000,
				placeOfSupply: "27",
				issuedAt: new Date(),
			},
		});

		await prisma.invoiceItem.create({
			data: {
				invoiceId: testInvoiceNoGSTIN.id,
				productId: testProduct.id,
				quantity: 10,
				price: 10000,
				gstRate: 18,
				cgstRate: 9,
				sgstRate: 9,
				cgstAmount: 9000,
				sgstAmount: 9000,
			},
		});
	});

	afterAll(async () => {
		// Cleanup
		await prisma.eWayBill.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.invoiceItem.deleteMany({
			where: { invoice: { organizationId: testOrgId } },
		});
		await prisma.invoice.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.product.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.contact.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.gSTConfig.delete({ where: { id: testGSTConfigId } });
		await prisma.organization.delete({ where: { id: testOrgId } });
	});

	beforeEach(async () => {
		// Clear E-Way Bills before each test
		await prisma.eWayBill.deleteMany({ where: { organizationId: testOrgId } });
	});

	describe("validateEWayBillEligibility", () => {
		it("should validate eligible invoice successfully", async () => {
			const result = await validateEWayBillEligibility(testInvoiceValid.id, testOrgId);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should fail validation for invoice below threshold", async () => {
			const result = await validateEWayBillEligibility(testInvoiceBelowThreshold.id, testOrgId);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors.some((e) => e.field === "totalAmount")).toBe(true);
		});

		it("should fail validation for invoice without buyer GSTIN", async () => {
			const result = await validateEWayBillEligibility(testInvoiceNoGSTIN.id, testOrgId);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "customer.gstNumber")).toBe(true);
		});

		it("should fail validation for non-existent invoice", async () => {
			const result = await validateEWayBillEligibility("non-existent-id", testOrgId);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "invoiceId")).toBe(true);
		});

		it("should fail validation for cancelled invoice", async () => {
			const cancelledInvoice = await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					invoiceNumber: "INV-CANCELLED",
					customerId: testCustomer.id,
					status: "CANCELLED",
					subtotal: 100000,
					cgstAmount: 9000,
					sgstAmount: 9000,
					igstAmount: 0,
					totalAmount: 118000,
					placeOfSupply: "29",
					issuedAt: new Date(),
				},
			});

			await prisma.invoiceItem.create({
				data: {
					invoiceId: cancelledInvoice.id,
					productId: testProduct.id,
					quantity: 10,
					price: 10000,
					gstRate: 18,
					cgstRate: 9,
					sgstRate: 9,
					cgstAmount: 9000,
					sgstAmount: 9000,
				},
			});

			const result = await validateEWayBillEligibility(cancelledInvoice.id, testOrgId);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === "status")).toBe(true);

			await prisma.invoiceItem.deleteMany({ where: { invoiceId: cancelledInvoice.id } });
			await prisma.invoice.delete({ where: { id: cancelledInvoice.id } });
		});
	});

	describe("generateEWayBillJSON", () => {
		it("should generate E-Way Bill JSON successfully", async () => {
			const transportDetails = {
				transporterName: "ABC Transport",
				transporterGSTIN: "27AABCT9999A1Z5",
				vehicleNumber: "KA01AB1234",
				transportMode: "ROAD" as const,
				distance: 350,
			};

			const result = await generateEWayBillJSON(testInvoiceValid.id, testOrgId, transportDetails);

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.docNo).toBe("INV-EWAY-001");
			expect(result.data?.supplyType).toBe("Outward");
			expect(result.data?.docType).toBe("INV");
			expect(result.data?.fromGstin).toBe("27AABCT1234F0Z5");
			expect(result.data?.toGstin).toBe("29AAPFT5055K1Z0");
			expect(result.data?.totalValue).toBe(118000);
			expect(result.data?.transMode).toBe("1"); // ROAD = 1
			expect(result.data?.vehicleNo).toBe("KA01AB1234");
			expect(result.data?.transporterId).toBe("27AABCT9999A1Z5");
			expect(result.data?.itemList).toHaveLength(1);
		});

		it("should generate E-Way Bill with minimal transport details", async () => {
			const transportDetails = {
				transportMode: "ROAD" as const,
			};

			const result = await generateEWayBillJSON(testInvoiceValid.id, testOrgId, transportDetails);

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.transMode).toBe("1");
			expect(result.data?.vehicleNo).toBeUndefined();
		});

		it("should fail generation for invoice below threshold", async () => {
			const transportDetails = {
				transportMode: "ROAD" as const,
			};

			const result = await generateEWayBillJSON(
				testInvoiceBelowThreshold.id,
				testOrgId,
				transportDetails
			);

			expect(result.success).toBe(false);
			expect(result.errors).toBeDefined();
			expect(result.errors!.length).toBeGreaterThan(0);
		});

		it("should map transport modes correctly", async () => {
			const modes = [
				{ mode: "ROAD" as const, expected: "1" },
				{ mode: "RAIL" as const, expected: "2" },
				{ mode: "AIR" as const, expected: "3" },
				{ mode: "SHIP" as const, expected: "4" },
			];

			for (const { mode, expected } of modes) {
				await prisma.eWayBill.deleteMany({ where: { organizationId: testOrgId } });

				const result = await generateEWayBillJSON(testInvoiceValid.id, testOrgId, {
					transportMode: mode,
				});

				expect(result.success).toBe(true);
				expect(result.data?.transMode).toBe(expected);
			}
		});

		it("should record E-Way Bill in database", async () => {
			const transportDetails = {
				transporterName: "XYZ Logistics",
				vehicleNumber: "MH12CD5678",
				transportMode: "ROAD" as const,
				distance: 200,
			};

			await generateEWayBillJSON(testInvoiceValid.id, testOrgId, transportDetails);

			const ewayBills = await prisma.eWayBill.findMany({
				where: {
					invoiceId: testInvoiceValid.id,
					organizationId: testOrgId,
				},
			});

			expect(ewayBills).toHaveLength(1);
			expect(ewayBills[0].transporterName).toBe("XYZ Logistics");
			expect(ewayBills[0].vehicleNumber).toBe("MH12CD5678");
			expect(ewayBills[0].status).toBe("GENERATED");
		});
	});

	describe("getEWayBillHistory", () => {
		it("should return empty history for invoice without E-Way Bills", async () => {
			const history = await getEWayBillHistory(testInvoiceValid.id, testOrgId);

			expect(history).toHaveLength(0);
		});

		it("should return E-Way Bill history", async () => {
			// Generate two E-Way Bills
			await generateEWayBillJSON(testInvoiceValid.id, testOrgId, { transportMode: "ROAD" });
			await generateEWayBillJSON(testInvoiceValid.id, testOrgId, { transportMode: "RAIL" });

			const history = await getEWayBillHistory(testInvoiceValid.id, testOrgId);

			expect(history.length).toBeGreaterThanOrEqual(2);
			expect(history[0].invoiceId).toBe(testInvoiceValid.id);
		});

		it("should return history in descending order by generation date", async () => {
			await generateEWayBillJSON(testInvoiceValid.id, testOrgId, { transportMode: "ROAD" });
			await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
			await generateEWayBillJSON(testInvoiceValid.id, testOrgId, { transportMode: "RAIL" });

			const history = await getEWayBillHistory(testInvoiceValid.id, testOrgId);

			expect(history.length).toBeGreaterThanOrEqual(2);
			expect(new Date(history[0].generatedAt).getTime()).toBeGreaterThanOrEqual(
				new Date(history[1].generatedAt).getTime()
			);
		});
	});

	describe("cancelEWayBill", () => {
		it("should cancel E-Way Bill successfully", async () => {
			// Generate E-Way Bill
			await generateEWayBillJSON(testInvoiceValid.id, testOrgId, { transportMode: "ROAD" });

			const history = await getEWayBillHistory(testInvoiceValid.id, testOrgId);
			const ewayBillId = history[0].id;

			const cancelled = await cancelEWayBill(ewayBillId, testOrgId);

			expect(cancelled.status).toBe("CANCELLED");
		});

		it("should fail to cancel non-existent E-Way Bill", async () => {
			await expect(cancelEWayBill("non-existent-id", testOrgId)).rejects.toThrow(
				"E-Way Bill not found"
			);
		});

		it("should fail to cancel already cancelled E-Way Bill", async () => {
			// Generate and cancel E-Way Bill
			await generateEWayBillJSON(testInvoiceValid.id, testOrgId, { transportMode: "ROAD" });

			const history = await getEWayBillHistory(testInvoiceValid.id, testOrgId);
			const ewayBillId = history[0].id;

			await cancelEWayBill(ewayBillId, testOrgId);

			await expect(cancelEWayBill(ewayBillId, testOrgId)).rejects.toThrow(
				"E-Way Bill is already cancelled"
			);
		});
	});
});
