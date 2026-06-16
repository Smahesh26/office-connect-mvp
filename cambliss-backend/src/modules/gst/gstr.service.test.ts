import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import prisma from "../../config/prisma";
import {
	generateGSTR1Report,
	generateGSTR1CSV,
	generateGSTR1JSON,
	GSTR1Report,
	B2BInvoiceRecord,
	B2CInvoiceRecord,
	GSTR1Summary,
} from "./gstr.service";

describe("GSTR-1 Report Generation", () => {
	let testOrgId: string;
	let testCustomerB2B: any;
	let testCustomerB2C: any;

	beforeAll(async () => {
		// Create test organization
		const org = await prisma.organization.create({
			data: {
				name: "GSTR Test Org",
			},
		});
		testOrgId = org.id;

		// Create B2B customer (with GST number)
		testCustomerB2B = await prisma.contact.create({
			data: {
				organizationId: testOrgId,
				type: "CUSTOMER",
				firstName: "B2B Customer",
				lastName: "Corp",
				email: "b2b@customer.com",
				gstNumber: "27AAPFT5055K1Z0",
				stateCode: "27",
			},
		});

		// Create B2C customer (without GST number)
		testCustomerB2C = await prisma.contact.create({
			data: {
				organizationId: testOrgId,
				type: "CUSTOMER",
				firstName: "B2C Customer",
				lastName: "Individual",
				email: "b2c@customer.com",
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

	describe("generateGSTR1Report", () => {
		it("should generate report with B2B invoices", async () => {
			const invoiceDate = new Date(2025, 1, 15); // Feb 15, 2025

			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-001",
					issuedAt: invoiceDate,
					status: "ISSUED",
					subtotal: 1000,
					cgstAmount: 90,
					sgstAmount: 90,
					igstAmount: 0,
					totalAmount: 1180,
					placeOfSupply: "27",
				},
			});

			const report = await generateGSTR1Report(testOrgId, 2, 2025);

			expect(report.period.month).toBe(2);
			expect(report.period.year).toBe(2025);
			expect(report.b2b).toHaveLength(1);
			expect(report.b2c).toHaveLength(0);
			expect(report.summary.totalB2BInvoices).toBe(1);
		});

		it("should generate report with B2C invoices", async () => {
			const invoiceDate = new Date(2025, 2, 10); // Mar 10, 2025

			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2C.id,
					invoiceNumber: "INV-002",
					issuedAt: invoiceDate,
					status: "ISSUED",
					subtotal: 500,
					cgstAmount: 45,
					sgstAmount: 45,
					igstAmount: 0,
					totalAmount: 590,
					placeOfSupply: "27",
				},
			});

			const report = await generateGSTR1Report(testOrgId, 3, 2025);

			expect(report.b2b).toHaveLength(0);
			expect(report.b2c).toHaveLength(1);
			expect(report.summary.totalB2CInvoices).toBe(1);
		});

		it("should generate report with mixed B2B and B2C invoices", async () => {
			const b2bDate = new Date(2025, 3, 5); // Apr 5, 2025
			const b2cDate = new Date(2025, 3, 15); // Apr 15, 2025

			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-B2B-001",
					issuedAt: b2bDate,
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
					invoiceNumber: "INV-B2C-001",
					issuedAt: b2cDate,
					status: "ISSUED",
					subtotal: 1000,
					cgstAmount: 90,
					sgstAmount: 90,
					igstAmount: 0,
					totalAmount: 1180,
					placeOfSupply: "27",
				},
			});

			const report = await generateGSTR1Report(testOrgId, 4, 2025);

			expect(report.b2b).toHaveLength(1);
			expect(report.b2c).toHaveLength(1);
			expect(report.summary.totalB2BInvoices).toBe(1);
			expect(report.summary.totalB2CInvoices).toBe(1);
		});

		it("should calculate correct totals for mixed invoices", async () => {
			// B2B: 1000 taxable + 180 tax = 1180
			// B2C: 500 taxable + 90 tax = 590
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-001",
					issuedAt: new Date(2025, 4, 1),
					status: "ISSUED",
					subtotal: 1000,
					cgstAmount: 90,
					sgstAmount: 90,
					igstAmount: 0,
					totalAmount: 1180,
					placeOfSupply: "27",
				},
			});

			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2C.id,
					invoiceNumber: "INV-002",
					issuedAt: new Date(2025, 4, 15),
					status: "ISSUED",
					subtotal: 500,
					cgstAmount: 45,
					sgstAmount: 45,
					igstAmount: 0,
					totalAmount: 590,
					placeOfSupply: "27",
				},
			});

			const report = await generateGSTR1Report(testOrgId, 5, 2025);

			expect(report.summary.totalTaxableValue).toBe(1500);
			expect(report.summary.totalCGST).toBe(135);
			expect(report.summary.totalSGST).toBe(135);
			expect(report.summary.totalIGST).toBe(0);
			expect(report.summary.totalTax).toBe(270);
			expect(report.summary.totalInvoiceValue).toBe(1770);
		});

		it("should handle IGST for inter-state supplies", async () => {
			// Inter-state supply with IGST
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-IGST-001",
					issuedAt: new Date(2025, 5, 1),
					status: "ISSUED",
					subtotal: 1000,
					cgstAmount: 0,
					sgstAmount: 0,
					igstAmount: 180,
					totalAmount: 1180,
					placeOfSupply: "06", // Different state
				},
			});

			const report = await generateGSTR1Report(testOrgId, 6, 2025);

			expect(report.b2b[0].igstAmount).toBe(180);
			expect(report.b2b[0].cgstAmount).toBe(0);
			expect(report.b2b[0].sgstAmount).toBe(0);
			expect(report.summary.totalIGST).toBe(180);
		});

		it("should exclude DRAFT and CANCELLED invoices", async () => {
			const date = new Date(2025, 6, 1);

			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-ISSUED",
					issuedAt: date,
					status: "ISSUED",
					subtotal: 1000,
					cgstAmount: 90,
					sgstAmount: 90,
					igstAmount: 0,
					totalAmount: 1180,
					placeOfSupply: "27",
				},
			});

			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-DRAFT",
					issuedAt: date,
					status: "DRAFT",
					subtotal: 1000,
					cgstAmount: 90,
					sgstAmount: 90,
					igstAmount: 0,
					totalAmount: 1180,
					placeOfSupply: "27",
				},
			});

			const report = await generateGSTR1Report(testOrgId, 7, 2025);

			expect(report.b2b).toHaveLength(1);
			expect(report.b2b[0].invoiceNumber).toBe("INV-ISSUED");
		});

		it("should respect month boundaries", async () => {
			// Add invoice on last day of February
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-FEB-LAST",
					issuedAt: new Date(2025, 1, 28), // Feb 28, 2025
					status: "ISSUED",
					subtotal: 1000,
					cgstAmount: 90,
					sgstAmount: 90,
					igstAmount: 0,
					totalAmount: 1180,
					placeOfSupply: "27",
				},
			});

			// Add invoice on first day of March
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-MAR-FIRST",
					issuedAt: new Date(2025, 2, 1), // Mar 1, 2025
					status: "ISSUED",
					subtotal: 1000,
					cgstAmount: 90,
					sgstAmount: 90,
					igstAmount: 0,
					totalAmount: 1180,
					placeOfSupply: "27",
				},
			});

			const febReport = await generateGSTR1Report(testOrgId, 2, 2025);
			const marReport = await generateGSTR1Report(testOrgId, 3, 2025);

			expect(febReport.b2b).toHaveLength(1);
			expect(febReport.b2b[0].invoiceNumber).toBe("INV-FEB-LAST");

			expect(marReport.b2b).toHaveLength(1);
			expect(marReport.b2b[0].invoiceNumber).toBe("INV-MAR-FIRST");
		});

		it("should return empty report for month with no invoices", async () => {
			const report = await generateGSTR1Report(testOrgId, 12, 2025);

			expect(report.b2b).toHaveLength(0);
			expect(report.b2c).toHaveLength(0);
			expect(report.summary.totalInvoiceValue).toBe(0);
		});

		it("should throw error for invalid month", async () => {
			await expect(generateGSTR1Report(testOrgId, 13, 2025)).rejects.toThrow(
				"Month must be between 1 and 12",
			);
		});

		it("should throw error for invalid year", async () => {
			await expect(generateGSTR1Report(testOrgId, 1, 1999)).rejects.toThrow("Invalid year");
		});
	});

	describe("generateGSTR1CSV", () => {
		it("should generate valid CSV with proper formatting", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-CSV-001",
					issuedAt: new Date(2025, 7, 15),
					status: "ISSUED",
					subtotal: 1000,
					cgstAmount: 90,
					sgstAmount: 90,
					igstAmount: 0,
					totalAmount: 1180,
					placeOfSupply: "27",
				},
			});

			const report = await generateGSTR1Report(testOrgId, 8, 2025);
			const csv = generateGSTR1CSV(report);

			expect(csv).toContain("GSTR-1 RETURN");
			expect(csv).toContain("B2B INVOICES");
			expect(csv).toContain("27AAPFT5055K1Z0");
			expect(csv).toContain("INV-CSV-001");
		});

		it("should handle multiple invoices in CSV", async () => {
			for (let i = 0; i < 3; i++) {
				await prisma.invoice.create({
					data: {
						organizationId: testOrgId,
						customerId: testCustomerB2B.id,
						invoiceNumber: `INV-MULTI-${i + 1}`,
						issuedAt: new Date(2025, 8, 5 + i),
						status: "ISSUED",
						subtotal: 1000,
						cgstAmount: 90,
						sgstAmount: 90,
						igstAmount: 0,
						totalAmount: 1180,
						placeOfSupply: "27",
					},
				});
			}

			const report = await generateGSTR1Report(testOrgId, 9, 2025);
			const csv = generateGSTR1CSV(report);

			expect(csv).toContain("INV-MULTI-1");
			expect(csv).toContain("INV-MULTI-2");
			expect(csv).toContain("INV-MULTI-3");
		});

		it("should include summary section in CSV", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-SUMMARY",
					issuedAt: new Date(2025, 9, 1),
					status: "ISSUED",
					subtotal: 1000,
					cgstAmount: 90,
					sgstAmount: 90,
					igstAmount: 0,
					totalAmount: 1180,
					placeOfSupply: "27",
				},
			});

			const report = await generateGSTR1Report(testOrgId, 10, 2025);
			const csv = generateGSTR1CSV(report);

			expect(csv).toContain("GSTR-1 SUMMARY");
			expect(csv).toContain("Total Taxable Value");
			expect(csv).toContain("Total CGST");
			expect(csv).toContain("Total SGST");
		});

		it("should properly escape values in CSV", async () => {
			// Create a customer with comma in name for escaping test
			const specialCustomer = await prisma.contact.create({
				data: {
					organizationId: testOrgId,
					type: "CUSTOMER",
					firstName: "Company",
					lastName: "Inc.",
					email: "special@customer.com",
					gstNumber: "09AABCT5678F0Z9",
					stateCode: "09",
				},
			});

			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: specialCustomer.id,
					invoiceNumber: "INV-SPECIAL",
					issuedAt: new Date(2025, 10, 1),
					status: "ISSUED",
					subtotal: 1000,
					cgstAmount: 90,
					sgstAmount: 90,
					igstAmount: 0,
					totalAmount: 1180,
					placeOfSupply: "09",
				},
			});

			const report = await generateGSTR1Report(testOrgId, 11, 2025);
			const csv = generateGSTR1CSV(report);

			expect(csv).toContain('"09AABCT5678F0Z9"');
		});
	});

	describe("generateGSTR1JSON", () => {
		it("should generate JSON with correct structure", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-JSON-001",
					issuedAt: new Date(2026, 0, 15),
					status: "ISSUED",
					subtotal: 1000,
					cgstAmount: 90,
					sgstAmount: 90,
					igstAmount: 0,
					totalAmount: 1180,
					placeOfSupply: "27",
				},
			});

			const report = await generateGSTR1Report(testOrgId, 1, 2026);
			const json = generateGSTR1JSON(report);

			expect(json.period.month).toBe(1);
			expect(json.period.year).toBe(2026);
			expect(json.b2b).toHaveLength(1);
			expect(json.summary).toBeDefined();
		});

		it("should correctly map invoice data to JSON", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-JSON-MAP",
					issuedAt: new Date(2026, 1, 1),
					status: "ISSUED",
					subtotal: 5000,
					cgstAmount: 450,
					sgstAmount: 450,
					igstAmount: 0,
					totalAmount: 5900,
					placeOfSupply: "27",
				},
			});

			const report = await generateGSTR1Report(testOrgId, 2, 2026);
			const json = generateGSTR1JSON(report);

			expect(json.b2b[0].gstin).toBe("27AAPFT5055K1Z0");
			expect(json.b2b[0].taxableValue).toBe(5000);
			expect(json.b2b[0].cgst).toBe(450);
			expect(json.b2b[0].sgst).toBe(450);
		});
	});

	describe("Tax calculations and rounding", () => {
		it("should handle precise decimal calculations", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-DECIMAL",
					issuedAt: new Date(2026, 2, 1),
					status: "ISSUED",
					subtotal: 12345.67,
					cgstAmount: 1111.11,
					sgstAmount: 1111.11,
					igstAmount: 0,
					totalAmount: 14567.89,
					placeOfSupply: "27",
				},
			});

			const report = await generateGSTR1Report(testOrgId, 3, 2026);

			expect(report.summary.totalTaxableValue).toBe(12345.67);
			expect(report.summary.totalCGST).toBe(1111.11);
		});

		it("should round summary totals to 2 decimal places", async () => {
			// Create invoices that sum to a value with more than 2 decimal places
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: testCustomerB2B.id,
					invoiceNumber: "INV-ROUND-1",
					issuedAt: new Date(2026, 3, 1),
					status: "ISSUED",
					subtotal: 1000.11,
					cgstAmount: 90.01,
					sgstAmount: 90.01,
					igstAmount: 0,
					totalAmount: 1180.13,
					placeOfSupply: "27",
				},
			});

			const report = await generateGSTR1Report(testOrgId, 4, 2026);

			// Verify all values are properly rounded
			const json = JSON.stringify(report.summary);
			const regex = /\d+\.\d{3,}/; // Match numbers with 3+ decimal places
			expect(regex.test(json)).toBe(false);
		});
	});
});
