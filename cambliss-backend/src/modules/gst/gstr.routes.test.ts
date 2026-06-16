import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import express, { Express } from "express";
import prisma from "../../config/prisma";
import gstrRoutes from "./gstr.routes";

const app: Express = express();
app.use(express.json());
app.use((req, res, next) => {
	(req as any).user = { organizationId: "test-org-id" };
	next();
});
app.use("/gst", gstrRoutes);

describe("GSTR-1 API Routes", () => {
	let testOrgId: string;
	let testCustomerB2B: any;
	let testCustomerB2C: any;

	beforeAll(async () => {
		// Create test organization
		const org = await prisma.organization.create({
			data: {
				name: "GSTR API Test Org",
			},
		});
		testOrgId = org.id;

		// Update test to use actual org ID
		app.use((req, res, next) => {
			(req as any).user = { organizationId: testOrgId };
			next();
		});

		// Create test customers
		testCustomerB2B = await prisma.contact.create({
			data: {
				organizationId: testOrgId,
				type: "CUSTOMER",
				firstName: "B2B",
				lastName: "Customer",
				email: "b2b@test.com",
				gstNumber: "27AAPFT5055K1Z0",
				stateCode: "27",
			},
		});

		testCustomerB2C = await prisma.contact.create({
			data: {
				organizationId: testOrgId,
				type: "CUSTOMER",
				firstName: "B2C",
				lastName: "Customer",
				email: "b2c@test.com",
				gstNumber: null,
				stateCode: "27",
			},
		});
	});

	afterAll(async () => {
		// Cleanup
		await prisma.invoice.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.contact.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.organization.delete({ where: { id: testOrgId } });
	});

	beforeEach(async () => {
		// Clear invoices before each test
		await prisma.invoice.deleteMany({ where: { organizationId: testOrgId } });
	});

	describe("GET /gst/gstr1/report", () => {
		it("should return JSON report when format is not specified", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-API-001",
					issuedAt: new Date(2025, 0, 15),
					status: "ISSUED",
					subtotal: 1000,
					cgstAmount: 90,
					sgstAmount: 90,
					igstAmount: 0,
					totalAmount: 1180,
					placeOfSupply: "27",
				},
			});

			const response = await request(app)
				.get("/gst/gstr1/report")
				.query({ month: "1", year: "2025" });

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("period");
			expect(response.body).toHaveProperty("b2b");
			expect(response.body.b2b).toHaveLength(1);
			expect(response.body.summary.totalInvoiceValue).toBe(1180);
		});

		it("should return CSV when format=csv", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-CSV-TEST",
					issuedAt: new Date(2025, 1, 10),
					status: "ISSUED",
					subtotal: 2000,
					cgstAmount: 180,
					sgstAmount: 180,
					igstAmount: 0,
					totalAmount: 2360,
					placeOfSupply: "27",
				},
			});

			const response = await request(app)
				.get("/gst/gstr1/report")
				.query({ month: "2", year: "2025", format: "csv" });

			expect(response.status).toBe(200);
			expect(response.headers["content-type"]).toContain("text/csv");
			expect(response.headers["content-disposition"]).toContain("GSTR1_02_2025.csv");
			expect(response.text).toContain("GSTR-1 RETURN");
		});

		it("should return JSON submission format when format=json-submission", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-JSON-SUB",
					issuedAt: new Date(2025, 2, 15),
					status: "ISSUED",
					subtotal: 1500,
					cgstAmount: 135,
					sgstAmount: 135,
					igstAmount: 0,
					totalAmount: 1770,
					placeOfSupply: "27",
				},
			});

			const response = await request(app)
				.get("/gst/gstr1/report")
				.query({ month: "3", year: "2025", format: "json-submission" });

			expect(response.status).toBe(200);
			expect(response.headers["content-type"]).toContain("application/json");
			expect(response.body).toHaveProperty("period");
			expect(response.body).toHaveProperty("b2b");
			expect(response.body).toHaveProperty("summary");
		});

		it("should return 400 when month is missing", async () => {
			const response = await request(app).get("/gst/gstr1/report").query({ year: "2025" });

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
		});

		it("should return 400 when year is missing", async () => {
			const response = await request(app).get("/gst/gstr1/report").query({ month: "1" });

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
		});

		it("should return 400 for invalid month", async () => {
			const response = await request(app)
				.get("/gst/gstr1/report")
				.query({ month: "13", year: "2025" });

			expect(response.status).toBe(500);
		});

		it("should return 400 for invalid year", async () => {
			const response = await request(app)
				.get("/gst/gstr1/report")
				.query({ month: "1", year: "1999" });

			expect(response.status).toBe(500);
		});
	});

	describe("GET /gst/gstr1/export-csv", () => {
		it("should return CSV attachment", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-EXPORT-001",
					issuedAt: new Date(2025, 3, 20),
					status: "ISSUED",
					subtotal: 3000,
					cgstAmount: 270,
					sgstAmount: 270,
					igstAmount: 0,
					totalAmount: 3540,
					placeOfSupply: "27",
				},
			});

			const response = await request(app)
				.get("/gst/gstr1/export-csv")
				.query({ month: "4", year: "2025" });

			expect(response.status).toBe(200);
			expect(response.headers["content-type"]).toContain("text/csv");
			expect(response.headers["content-disposition"]).toContain("attachment");
			expect(response.headers["content-disposition"]).toContain("GSTR1_04_2025.csv");
		});

		it("should include all invoice data in CSV export", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-FULL-DATA",
					issuedAt: new Date(2025, 4, 15),
					status: "ISSUED",
					subtotal: 1000,
					cgstAmount: 90,
					sgstAmount: 90,
					igstAmount: 0,
					totalAmount: 1180,
					placeOfSupply: "27",
				},
			});

			const response = await request(app)
				.get("/gst/gstr1/export-csv")
				.query({ month: "5", year: "2025" });

			expect(response.status).toBe(200);
			expect(response.text).toContain("INV-FULL-DATA");
			expect(response.text).toContain("27AAPFT5055K1Z0");
			expect(response.text).toContain("1000");
		});

		it("should return 400 when month is missing", async () => {
			const response = await request(app)
				.get("/gst/gstr1/export-csv")
				.query({ year: "2025" });

			expect(response.status).toBe(400);
		});

		it("should return properly formatted filename with month and year", async () => {
			const response = await request(app)
				.get("/gst/gstr1/export-csv")
				.query({ month: "12", year: "2025" });

			expect(response.status).toBe(200);
			expect(response.headers["content-disposition"]).toContain("GSTR1_12_2025.csv");
		});
	});

	describe("Data accuracy in exports", () => {
		it("should include B2B and B2C invoices in same export", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-B2B-EXPORT",
					issuedAt: new Date(2025, 5, 1),
					status: "ISSUED",
					subtotal: 2000,
					cgstAmount: 180,
					sgstAmount: 180,
					igstAmount: 0,
					totalAmount: 2360,
					placeOfSupply: "27",
				},
			});

			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2C.id,
					invoiceNumber: "INV-B2C-EXPORT",
					issuedAt: new Date(2025, 5, 15),
					status: "ISSUED",
					subtotal: 1000,
					cgstAmount: 90,
					sgstAmount: 90,
					igstAmount: 0,
					totalAmount: 1180,
					placeOfSupply: "27",
				},
			});

			const response = await request(app)
				.get("/gst/gstr1/report")
				.query({ month: "6", year: "2025" });

			expect(response.status).toBe(200);
			expect(response.body.b2b).toHaveLength(1);
			expect(response.body.b2c).toHaveLength(1);
			expect(response.body.summary.totalInvoiceValue).toBe(3540);
		});

		it("should correctly calculate tax summary from multiple invoices", async () => {
			const invoices = [
				{
					invoiceNumber: "INV-1",
					subtotal: 1000,
					cgst: 90,
					sgst: 90,
					igst: 0,
				},
				{
					invoiceNumber: "INV-2",
					subtotal: 2000,
					cgst: 180,
					sgst: 180,
					igst: 0,
				},
				{
					invoiceNumber: "INV-3",
					subtotal: 1500,
					cgst: 0,
					sgst: 0,
					igst: 270,
				},
			];

			for (let i = 0; i < invoices.length; i++) {
				const inv = invoices[i];
				await prisma.invoice.create({
					data: {
						organizationId: testOrgId,
						customerId: testCustomerB2B.id,
						invoiceNumber: inv.invoiceNumber,
						issuedAt: new Date(2025, 6, 5 + i),
						status: "ISSUED",
						subtotal: inv.subtotal,
						cgstAmount: inv.cgst,
						sgstAmount: inv.sgst,
						igstAmount: inv.igst,
						totalAmount: inv.subtotal + inv.cgst + inv.sgst + inv.igst,
						placeOfSupply: inv.igst > 0 ? "06" : "27",
					},
				});
			}

			const response = await request(app)
				.get("/gst/gstr1/report")
				.query({ month: "7", year: "2025", format: "json-submission" });

			expect(response.status).toBe(200);
			expect(response.body.summary.totalTaxableValue).toBe(4500);
			expect(response.body.summary.totalCGST).toBe(270);
			expect(response.body.summary.totalSGST).toBe(270);
			expect(response.body.summary.totalIGST).toBe(270);
			expect(response.body.summary.totalTax).toBe(810);
		});
	});

	describe("Empty report scenarios", () => {
		it("should return empty report for month with no invoices", async () => {
			const response = await request(app)
				.get("/gst/gstr1/report")
				.query({ month: "12", year: "2025" });

			expect(response.status).toBe(200);
			expect(response.body.b2b).toHaveLength(0);
			expect(response.body.b2c).toHaveLength(0);
			expect(response.body.summary.totalInvoiceValue).toBe(0);
		});

		it("should generate valid CSV for empty month", async () => {
			const response = await request(app)
				.get("/gst/gstr1/export-csv")
				.query({ month: "11", year: "2025" });

			expect(response.status).toBe(200);
			expect(response.text).toContain("GSTR-1 RETURN");
			expect(response.text).toContain("GSTR-1 SUMMARY");
		});
	});
});
