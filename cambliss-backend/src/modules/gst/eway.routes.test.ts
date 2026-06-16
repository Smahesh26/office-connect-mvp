import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import express, { Express } from "express";
import prisma from "../../config/prisma";
import ewayRoutes from "./eway.routes";

const app: Express = express();
app.use(express.json());
app.use((req, res, next) => {
	(req as any).user = { organizationId: "test-org-id" };
	next();
});
app.use("/gst", ewayRoutes);

describe("E-Way Bill API Routes", () => {
	let testOrgId: string;
	let testCustomer: any;
	let testProduct: any;
	let testInvoiceValid: any;
	let testInvoiceBelowThreshold: any;

	beforeAll(async () => {
		// Create test organization
		const org = await prisma.organization.create({
			data: {
				name: "E-Way API Test Org",
			},
		});
		testOrgId = org.id;

		// Update middleware to use actual org ID
		app.use((req, res, next) => {
			(req as any).user = { organizationId: testOrgId };
			next();
		});

		// Create GST Config
		await prisma.gSTConfig.create({
			data: {
				organizationId: testOrgId,
				gstNumber: "27AABCT1234F0Z5",
				legalName: "Test Company Pvt Ltd",
				tradeName: "Test Company",
				stateCode: "27",
			},
		});

		// Create customer with GSTIN
		testCustomer = await prisma.contact.create({
			data: {
				organizationId: testOrgId,
				type: "CUSTOMER",
				firstName: "API",
				lastName: "Customer",
				companyName: "API Customer Corp",
				email: "api@customer.com",
				gstNumber: "29AAPFT5055K1Z0",
				stateCode: "29",
				state: "Karnataka",
				billingAddress: "456 API Street",
				shippingAddress: "456 API Street",
			},
		});

		// Create test product with HSN
		testProduct = await prisma.product.create({
			data: {
				organizationId: testOrgId,
				name: "API Test Product",
				sku: "API-TEST-001",
				hsnCode: "87654321",
				unitPrice: 10000,
			},
		});

		// Create valid invoice
		testInvoiceValid = await prisma.invoice.create({
			data: {
				organizationId: testOrgId,
				invoiceNumber: "INV-API-EWAY-001",
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
				invoiceNumber: "INV-API-EWAY-002",
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
		await prisma.gSTConfig.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.organization.delete({ where: { id: testOrgId } });
	});

	beforeEach(async () => {
		// Clear E-Way Bills before each test
		await prisma.eWayBill.deleteMany({ where: { organizationId: testOrgId } });
	});

	describe("POST /gst/eway-bill/validate", () => {
		it("should validate eligible invoice", async () => {
			const response = await request(app)
				.post("/gst/eway-bill/validate")
				.send({ invoiceId: testInvoiceValid.id });

			expect(response.status).toBe(200);
			expect(response.body.valid).toBe(true);
			expect(response.body.errors).toHaveLength(0);
		});

		it("should return validation errors for invoice below threshold", async () => {
			const response = await request(app)
				.post("/gst/eway-bill/validate")
				.send({ invoiceId: testInvoiceBelowThreshold.id });

			expect(response.status).toBe(200);
			expect(response.body.valid).toBe(false);
			expect(response.body.errors.length).toBeGreaterThan(0);
		});

		it("should return 400 when invoiceId is missing", async () => {
			const response = await request(app).post("/gst/eway-bill/validate").send({});

			expect(response.status).toBe(400);
			expect(response.body.error).toBe("invoiceId is required");
		});
	});

	describe("POST /gst/eway-bill/generate", () => {
		it("should generate E-Way Bill JSON successfully", async () => {
			const response = await request(app)
				.post("/gst/eway-bill/generate")
				.send({
					invoiceId: testInvoiceValid.id,
					transportDetails: {
						transporterName: "Test Transport",
						transporterGSTIN: "27AABCT9999A1Z5",
						vehicleNumber: "KA01AB1234",
						transportMode: "ROAD",
						distance: 350,
					},
				});

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeDefined();
			expect(response.body.data.docNo).toBe("INV-API-EWAY-001");
			expect(response.body.data.supplyType).toBe("Outward");
			expect(response.body.data.vehicleNo).toBe("KA01AB1234");
		});

		it("should generate E-Way Bill with minimal transport details", async () => {
			const response = await request(app)
				.post("/gst/eway-bill/generate")
				.send({
					invoiceId: testInvoiceValid.id,
					transportDetails: {
						transportMode: "ROAD",
					},
				});

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.transMode).toBe("1");
		});

		it("should fail generation for invoice below threshold", async () => {
			const response = await request(app)
				.post("/gst/eway-bill/generate")
				.send({
					invoiceId: testInvoiceBelowThreshold.id,
					transportDetails: {
						transportMode: "ROAD",
					},
				});

			expect(response.status).toBe(400);
			expect(response.body.error).toBe("E-Way Bill generation failed");
			expect(response.body.errors).toBeDefined();
		});

		it("should return 400 when invoiceId is missing", async () => {
			const response = await request(app).post("/gst/eway-bill/generate").send({
				transportDetails: { transportMode: "ROAD" },
			});

			expect(response.status).toBe(400);
			expect(response.body.error).toBe("invoiceId is required");
		});

		it("should default to ROAD transport mode if not specified", async () => {
			const response = await request(app)
				.post("/gst/eway-bill/generate")
				.send({
					invoiceId: testInvoiceValid.id,
					transportDetails: {},
				});

			expect(response.status).toBe(200);
			expect(response.body.data.transMode).toBe("1"); // ROAD = 1
		});
	});

	describe("GET /gst/eway-bill/download/:invoiceId", () => {
		it("should download E-Way Bill JSON file", async () => {
			const response = await request(app).get(`/gst/eway-bill/download/${testInvoiceValid.id}`);

			expect(response.status).toBe(200);
			expect(response.headers["content-type"]).toContain("application/json");
			expect(response.headers["content-disposition"]).toContain("attachment");
			expect(response.headers["content-disposition"]).toContain("EWAY_INV-API-EWAY-001");
			expect(response.body.docNo).toBe("INV-API-EWAY-001");
		});

		it("should download with transport details in query params", async () => {
			const response = await request(app)
				.get(`/gst/eway-bill/download/${testInvoiceValid.id}`)
				.query({
					transporterName: "Query Transport",
					vehicleNumber: "MH12CD5678",
					transportMode: "RAIL",
					distance: 500,
				});

			expect(response.status).toBe(200);
			expect(response.body.vehicleNo).toBe("MH12CD5678");
			expect(response.body.transMode).toBe("2"); // RAIL = 2
		});

		it("should fail download for invoice below threshold", async () => {
			const response = await request(app).get(
				`/gst/eway-bill/download/${testInvoiceBelowThreshold.id}`
			);

			expect(response.status).toBe(400);
			expect(response.body.error).toBe("E-Way Bill generation failed");
		});
	});

	describe("GET /gst/eway-bill/history/:invoiceId", () => {
		it("should return empty history for invoice without E-Way Bills", async () => {
			const response = await request(app).get(`/gst/eway-bill/history/${testInvoiceValid.id}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toHaveLength(0);
		});

		it("should return E-Way Bill history", async () => {
			// Generate E-Way Bills
			await request(app)
				.post("/gst/eway-bill/generate")
				.send({
					invoiceId: testInvoiceValid.id,
					transportDetails: { transportMode: "ROAD" },
				});

			await request(app)
				.post("/gst/eway-bill/generate")
				.send({
					invoiceId: testInvoiceValid.id,
					transportDetails: { transportMode: "RAIL" },
				});

			const response = await request(app).get(`/gst/eway-bill/history/${testInvoiceValid.id}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe("POST /gst/eway-bill/cancel/:ewayBillId", () => {
		it("should cancel E-Way Bill successfully", async () => {
			// Generate E-Way Bill
			await request(app)
				.post("/gst/eway-bill/generate")
				.send({
					invoiceId: testInvoiceValid.id,
					transportDetails: { transportMode: "ROAD" },
				});

			// Get the E-Way Bill ID
			const historyResponse = await request(app).get(
				`/gst/eway-bill/history/${testInvoiceValid.id}`
			);
			const ewayBillId = historyResponse.body.data[0].id;

			// Cancel it
			const response = await request(app).post(`/gst/eway-bill/cancel/${ewayBillId}`);

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.status).toBe("CANCELLED");
		});

		it("should return 400 for non-existent E-Way Bill", async () => {
			const response = await request(app).post("/gst/eway-bill/cancel/non-existent-id");

			expect(response.status).toBe(400);
			expect(response.body.error).toBeDefined();
		});

		it("should fail to cancel already cancelled E-Way Bill", async () => {
			// Generate and cancel E-Way Bill
			await request(app)
				.post("/gst/eway-bill/generate")
				.send({
					invoiceId: testInvoiceValid.id,
					transportDetails: { transportMode: "ROAD" },
				});

			const historyResponse = await request(app).get(
				`/gst/eway-bill/history/${testInvoiceValid.id}`
			);
			const ewayBillId = historyResponse.body.data[0].id;

			await request(app).post(`/gst/eway-bill/cancel/${ewayBillId}`);

			// Try to cancel again
			const response = await request(app).post(`/gst/eway-bill/cancel/${ewayBillId}`);

			expect(response.status).toBe(400);
			expect(response.body.error).toContain("already cancelled");
		});
	});

	describe("Edge cases and error handling", () => {
		it("should handle multiple E-Way Bill generations for same invoice", async () => {
			const response1 = await request(app)
				.post("/gst/eway-bill/generate")
				.send({
					invoiceId: testInvoiceValid.id,
					transportDetails: { transportMode: "ROAD", vehicleNumber: "KA01AB1234" },
				});

			const response2 = await request(app)
				.post("/gst/eway-bill/generate")
				.send({
					invoiceId: testInvoiceValid.id,
					transportDetails: { transportMode: "RAIL", vehicleNumber: "UPDATED" },
				});

			expect(response1.status).toBe(200);
			expect(response2.status).toBe(200);

			const historyResponse = await request(app).get(
				`/gst/eway-bill/history/${testInvoiceValid.id}`
			);
			expect(historyResponse.body.data.length).toBeGreaterThanOrEqual(2);
		});

		it("should preserve item details in JSON output", async () => {
			const response = await request(app)
				.post("/gst/eway-bill/generate")
				.send({
					invoiceId: testInvoiceValid.id,
					transportDetails: { transportMode: "ROAD" },
				});

			expect(response.body.data.itemList).toHaveLength(1);
			expect(response.body.data.itemList[0]).toHaveProperty("itemNo");
			expect(response.body.data.itemList[0]).toHaveProperty("productName");
			expect(response.body.data.itemList[0]).toHaveProperty("hsnCode");
			expect(response.body.data.itemList[0]).toHaveProperty("quantity");
			expect(response.body.data.itemList[0]).toHaveProperty("taxableAmount");
		});
	});
});
