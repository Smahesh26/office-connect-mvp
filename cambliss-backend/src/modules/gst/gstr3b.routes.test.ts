import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import prisma from "../../config/prisma";
import gstr3bRoutes from "./gstr3b.routes";

const app = express();
app.use(express.json());
app.use("/api/gst", gstr3bRoutes);

describe("GSTR-3B API Routes", () => {
	let testOrgId: string;

	beforeAll(async () => {
		// Create test organization
		const org = await prisma.organization.create({
			data: {
				name: "GSTR3B Routes Test Org",
			},
		});
		testOrgId = org.id;
	});

	afterAll(async () => {
		// Cleanup
		await prisma.invoice.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.organization.delete({ where: { id: testOrgId } });
	});

	beforeEach(async () => {
		// Clear invoices before each test
		await prisma.invoice.deleteMany({ where: { organizationId: testOrgId } });
	});

	describe("GET /api/gst/gstr3b/summary", () => {
		it("should return GSTR-3B summary in JSON format", async () => {
			// Create test invoice
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-001",
					issuedAt: new Date(2026, 0, 15),
					status: "ISSUED",
					subtotal: 10000,
					cgstAmount: 900,
					sgstAmount: 900,
					igstAmount: 0,
					totalAmount: 11800,
					placeOfSupply: "27",
				},
			});

			const response = await request(app)
				.get("/api/gst/gstr3b/summary")
				.query({ organizationId: testOrgId, month: 1, year: 2026 });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toHaveProperty("outputGST");
			expect(response.body.data).toHaveProperty("inputGST");
			expect(response.body.data).toHaveProperty("netPayable");
			expect(response.body.data).toHaveProperty("period");
			expect(response.body.data.outputGST.cgst).toBe(900);
			expect(response.body.data.outputGST.sgst).toBe(900);
		});

		it("should return filing JSON format when specified", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-001",
					issuedAt: new Date(2026, 1, 15),
					status: "ISSUED",
					subtotal: 10000,
					cgstAmount: 900,
					sgstAmount: 900,
					igstAmount: 0,
					totalAmount: 11800,
					placeOfSupply: "27",
				},
			});

			const response = await request(app)
				.get("/api/gst/gstr3b/summary")
				.query({ organizationId: testOrgId, month: 2, year: 2026, format: "json-filing" });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toHaveProperty("ret_period");
			expect(response.body.data).toHaveProperty("sup_details");
			expect(response.body.data).toHaveProperty("itc_elg");
			expect(response.body.data.ret_period).toBe("022026");
		});

		it("should return text report when format is text", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-001",
					issuedAt: new Date(2026, 2, 15),
					status: "ISSUED",
					subtotal: 10000,
					cgstAmount: 900,
					sgstAmount: 900,
					igstAmount: 0,
					totalAmount: 11800,
					placeOfSupply: "27",
				},
			});

			const response = await request(app)
				.get("/api/gst/gstr3b/summary")
				.query({ organizationId: testOrgId, month: 3, year: 2026, format: "text" });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(typeof response.body.data).toBe("string");
			expect(response.body.data).toContain("GSTR-3B MONTHLY SUMMARY");
			expect(response.body.data).toContain("OUTPUT GST");
		});

		it("should return 400 for missing organizationId", async () => {
			const response = await request(app)
				.get("/api/gst/gstr3b/summary")
				.query({ month: 1, year: 2026 });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain("organizationId");
		});

		it("should return 400 for missing month", async () => {
			const response = await request(app)
				.get("/api/gst/gstr3b/summary")
				.query({ organizationId: testOrgId, year: 2026 });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain("month");
		});

		it("should return 400 for missing year", async () => {
			const response = await request(app)
				.get("/api/gst/gstr3b/summary")
				.query({ organizationId: testOrgId, month: 1 });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain("year");
		});

		it("should return 400 for invalid month", async () => {
			const response = await request(app)
				.get("/api/gst/gstr3b/summary")
				.query({ organizationId: testOrgId, month: 13, year: 2026 });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should return 400 for invalid format", async () => {
			const response = await request(app)
				.get("/api/gst/gstr3b/summary")
				.query({ organizationId: testOrgId, month: 1, year: 2026, format: "invalid" });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain("format");
		});

		it("should handle organization with no invoices", async () => {
			const response = await request(app)
				.get("/api/gst/gstr3b/summary")
				.query({ organizationId: testOrgId, month: 6, year: 2026 });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.outputGST.total).toBe(0);
			expect(response.body.data.netPayable.total).toBe(0);
		});
	});

	describe("GET /api/gst/gstr3b/payment-challan", () => {
		it("should return payment challan details", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-001",
					issuedAt: new Date(2026, 3, 15),
					status: "ISSUED",
					subtotal: 10000,
					cgstAmount: 900,
					sgstAmount: 900,
					igstAmount: 0,
					totalAmount: 11800,
					placeOfSupply: "27",
				},
			});

			const response = await request(app)
				.get("/api/gst/gstr3b/payment-challan")
				.query({ organizationId: testOrgId, month: 4, year: 2026 });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toHaveProperty("challan");
			expect(response.body.data).toHaveProperty("dueDate");
			expect(response.body.data).toHaveProperty("periodEnd");
		});

		it("should include correct tax head codes", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-001",
					issuedAt: new Date(2026, 4, 15),
					status: "ISSUED",
					subtotal: 10000,
					cgstAmount: 900,
					sgstAmount: 900,
					igstAmount: 500,
					totalAmount: 12300,
					placeOfSupply: "27",
				},
			});

			const response = await request(app)
				.get("/api/gst/gstr3b/payment-challan")
				.query({ organizationId: testOrgId, month: 5, year: 2026 });

			expect(response.status).toBe(200);
			const challan = response.body.data.challan;
			
			expect(challan.cgst).toHaveProperty("code", "0401");
			expect(challan.cgst).toHaveProperty("amount", 900);
			expect(challan.sgst).toHaveProperty("code", "0402");
			expect(challan.sgst).toHaveProperty("amount", 900);
			expect(challan.igst).toHaveProperty("code", "0403");
			expect(challan.igst).toHaveProperty("amount", 500);
		});

		it("should calculate correct due date (20th of next month)", async () => {
			const response = await request(app)
				.get("/api/gst/gstr3b/payment-challan")
				.query({ organizationId: testOrgId, month: 6, year: 2026 });

			expect(response.status).toBe(200);
			const dueDate = new Date(response.body.data.dueDate);
			
			// June 2026 due date should be July 20, 2026
			expect(dueDate.getMonth()).toBe(6); // July (0-indexed)
			expect(dueDate.getDate()).toBe(20);
			expect(dueDate.getFullYear()).toBe(2026);
		});

		it("should handle December correctly (due date in January next year)", async () => {
			const response = await request(app)
				.get("/api/gst/gstr3b/payment-challan")
				.query({ organizationId: testOrgId, month: 12, year: 2026 });

			expect(response.status).toBe(200);
			const dueDate = new Date(response.body.data.dueDate);
			
			// December 2026 due date should be January 20, 2027
			expect(dueDate.getMonth()).toBe(0); // January
			expect(dueDate.getDate()).toBe(20);
			expect(dueDate.getFullYear()).toBe(2027);
		});

		it("should return 400 for missing parameters", async () => {
			const response = await request(app)
				.get("/api/gst/gstr3b/payment-challan")
				.query({ organizationId: testOrgId });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should show zero amounts when no tax payable", async () => {
			const response = await request(app)
				.get("/api/gst/gstr3b/payment-challan")
				.query({ organizationId: testOrgId, month: 7, year: 2026 });

			expect(response.status).toBe(200);
			const challan = response.body.data.challan;
			
			expect(challan.cgst.amount).toBe(0);
			expect(challan.sgst.amount).toBe(0);
			expect(challan.igst.amount).toBe(0);
			expect(challan.total).toBe(0);
		});
	});

	describe("GET /api/gst/gstr3b/comparison", () => {
		it("should return comparison data for multiple months", async () => {
			// Create invoices for Jan and Feb
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-JAN",
					issuedAt: new Date(2026, 0, 15),
					status: "ISSUED",
					subtotal: 10000,
					cgstAmount: 900,
					sgstAmount: 900,
					igstAmount: 0,
					totalAmount: 11800,
					placeOfSupply: "27",
				},
			});

			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-2",
					invoiceNumber: "INV-FEB",
					issuedAt: new Date(2026, 1, 15),
					status: "ISSUED",
					subtotal: 15000,
					cgstAmount: 1350,
					sgstAmount: 1350,
					igstAmount: 0,
					totalAmount: 17700,
					placeOfSupply: "27",
				},
			});

			const response = await request(app)
				.get("/api/gst/gstr3b/comparison")
				.query({ organizationId: testOrgId, startMonth: 1, endMonth: 2, year: 2026 });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.months).toHaveLength(2);
			
			const janData = response.body.data.months.find((m: any) => m.month === 1);
			const febData = response.body.data.months.find((m: any) => m.month === 2);
			
			expect(janData.outputGST.total).toBe(1800);
			expect(febData.outputGST.total).toBe(2700);
		});

		it("should return 400 when startMonth > endMonth", async () => {
			const response = await request(app)
				.get("/api/gst/gstr3b/comparison")
				.query({ organizationId: testOrgId, startMonth: 5, endMonth: 3, year: 2026 });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain("startMonth");
		});

		it("should return 400 for missing organizationId", async () => {
			const response = await request(app)
				.get("/api/gst/gstr3b/comparison")
				.query({ startMonth: 1, endMonth: 3, year: 2026 });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should handle range with no invoices", async () => {
			const response = await request(app)
				.get("/api/gst/gstr3b/comparison")
				.query({ organizationId: testOrgId, startMonth: 8, endMonth: 10, year: 2026 });

			expect(response.status).toBe(200);
			expect(response.body.data.months).toHaveLength(3);
			
			// All months should have zero totals
			response.body.data.months.forEach((month: any) => {
				expect(month.outputGST.total).toBe(0);
				expect(month.netPayable.total).toBe(0);
			});
		});

		it("should calculate trends correctly", async () => {
			// Create invoices with increasing amounts
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-1",
					issuedAt: new Date(2026, 3, 15),
					status: "ISSUED",
					subtotal: 10000,
					cgstAmount: 900,
					sgstAmount: 900,
					igstAmount: 0,
					totalAmount: 11800,
					placeOfSupply: "27",
				},
			});

			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-2",
					invoiceNumber: "INV-2",
					issuedAt: new Date(2026, 4, 15),
					status: "ISSUED",
					subtotal: 20000,
					cgstAmount: 1800,
					sgstAmount: 1800,
					igstAmount: 0,
					totalAmount: 23600,
					placeOfSupply: "27",
				},
			});

			const response = await request(app)
				.get("/api/gst/gstr3b/comparison")
				.query({ organizationId: testOrgId, startMonth: 4, endMonth: 5, year: 2026 });

			expect(response.status).toBe(200);
			expect(response.body.data).toHaveProperty("trends");
			
			const trends = response.body.data.trends;
			expect(trends.outputGST.trend).toBe("up");
			expect(trends.outputGST.change).toBeGreaterThan(0);
		});

		it("should handle single month range", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-1",
					issuedAt: new Date(2026, 5, 15),
					status: "ISSUED",
					subtotal: 10000,
					cgstAmount: 900,
					sgstAmount: 900,
					igstAmount: 0,
					totalAmount: 11800,
					placeOfSupply: "27",
				},
			});

			const response = await request(app)
				.get("/api/gst/gstr3b/comparison")
				.query({ organizationId: testOrgId, startMonth: 6, endMonth: 6, year: 2026 });

			expect(response.status).toBe(200);
			expect(response.body.data.months).toHaveLength(1);
			expect(response.body.data.months[0].month).toBe(6);
		});
	});

	describe("Error handling", () => {
		it("should handle internal server errors gracefully", async () => {
			// Use invalid organization ID to trigger error
			const response = await request(app)
				.get("/api/gst/gstr3b/summary")
				.query({ organizationId: "invalid-id", month: 1, year: 2026 });

			expect(response.status).toBe(500);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBeDefined();
		});

		it("should validate numeric parameters", async () => {
			const response = await request(app)
				.get("/api/gst/gstr3b/summary")
				.query({ organizationId: testOrgId, month: "abc", year: 2026 });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});
	});
});
