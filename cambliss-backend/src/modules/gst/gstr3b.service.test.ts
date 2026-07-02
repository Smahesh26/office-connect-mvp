import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import prisma from "../../config/prisma";
import {
	generateGSTR3BSummary,
	generateGSTR3BJSON,
	generateGSTR3BReport,
} from "./gstr3b.service";

describe("GSTR-3B Summary Generation", () => {
	let testOrgId: string;

	beforeAll(async () => {
		// Create test organization
		const org = await prisma.organization.create({
			data: {
				name: "GSTR3B Test Org",
			},
		});
		testOrgId = org.id;

		await prisma.contact.createMany({
			data: [
				{ id: "cust-0", organizationId: testOrgId, type: "CUSTOMER", firstName: "Cust", lastName: "Zero", email: "cust0@test.com" },
				{ id: "cust-1", organizationId: testOrgId, type: "CUSTOMER", firstName: "Cust", lastName: "One", email: "cust1@test.com" },
				{ id: "cust-2", organizationId: testOrgId, type: "CUSTOMER", firstName: "Cust", lastName: "Two", email: "cust2@test.com" },
			],
			skipDuplicates: true,
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

	describe("generateGSTR3BSummary", () => {
		it("should calculate output GST from sales invoices", async () => {
			// Create sales invoices
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-001",
					issuedAt: new Date(2026, 0, 15), // Jan 15, 2026
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
					invoiceNumber: "INV-002",
					issuedAt: new Date(2026, 0, 20), // Jan 20, 2026
					status: "ISSUED",
					subtotal: 5000,
					cgstAmount: 0,
					sgstAmount: 0,
					igstAmount: 900,
					totalAmount: 5900,
					placeOfSupply: "06",
				},
			});

			const summary = await generateGSTR3BSummary(testOrgId, 1, 2026);

			expect(summary.outputGST.cgst).toBe(900);
			expect(summary.outputGST.sgst).toBe(900);
			expect(summary.outputGST.igst).toBe(900);
			expect(summary.outputGST.total).toBe(2700);
		});

		it("should calculate net payable when no input GST", async () => {
			// Only sales, no purchases
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

			const summary = await generateGSTR3BSummary(testOrgId, 2, 2026);

			// Net payable should equal output GST (no input GST to subtract)
			expect(summary.netPayable.cgst).toBe(900);
			expect(summary.netPayable.sgst).toBe(900);
			expect(summary.netPayable.igst).toBe(0);
			expect(summary.netPayable.total).toBe(1800);
		});

		it("should handle month with no invoices", async () => {
			const summary = await generateGSTR3BSummary(testOrgId, 12, 2026);

			expect(summary.outputGST.total).toBe(0);
			expect(summary.inputGST.total).toBe(0);
			expect(summary.netPayable.total).toBe(0);
			expect(summary.metadata.totalSalesInvoices).toBe(0);
		});

		it("should exclude DRAFT and CANCELLED invoices", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-ISSUED",
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

			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-2",
					invoiceNumber: "INV-DRAFT",
					issuedAt: new Date(2026, 2, 16),
					status: "DRAFT",
					subtotal: 10000,
					cgstAmount: 900,
					sgstAmount: 900,
					igstAmount: 0,
					totalAmount: 11800,
					placeOfSupply: "27",
				},
			});

			const summary = await generateGSTR3BSummary(testOrgId, 3, 2026);

			// Should only count ISSUED invoice
			expect(summary.metadata.totalSalesInvoices).toBe(1);
			expect(summary.outputGST.cgst).toBe(900);
		});

		it("should calculate correct totals for multiple invoices", async () => {
			// Create 3 invoices
			const invoices = [
				{ subtotal: 10000, cgst: 900, sgst: 900, igst: 0 },
				{ subtotal: 15000, cgst: 1350, sgst: 1350, igst: 0 },
				{ subtotal: 8000, cgst: 0, sgst: 0, igst: 1440 },
			];

			for (let i = 0; i < invoices.length; i++) {
				const inv = invoices[i];
				await prisma.invoice.create({
					data: {
						organizationId: testOrgId,
						customerId: `cust-${i}`,
						invoiceNumber: `INV-${i + 1}`,
						issuedAt: new Date(2026, 3, 5 + i),
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

			const summary = await generateGSTR3BSummary(testOrgId, 4, 2026);

			expect(summary.outputGST.cgst).toBe(2250); // 900 + 1350
			expect(summary.outputGST.sgst).toBe(2250); // 900 + 1350
			expect(summary.outputGST.igst).toBe(1440);
			expect(summary.outputGST.total).toBe(5940);
		});

		it("should respect month boundaries", async () => {
			// Invoice on last day of Jan
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-JAN",
					issuedAt: new Date(2026, 0, 31), // Jan 31
					status: "ISSUED",
					subtotal: 10000,
					cgstAmount: 900,
					sgstAmount: 900,
					igstAmount: 0,
					totalAmount: 11800,
					placeOfSupply: "27",
				},
			});

			// Invoice on first day of Feb
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-2",
					invoiceNumber: "INV-FEB",
					issuedAt: new Date(2026, 1, 1), // Feb 1
					status: "ISSUED",
					subtotal: 5000,
					cgstAmount: 450,
					sgstAmount: 450,
					igstAmount: 0,
					totalAmount: 5900,
					placeOfSupply: "27",
				},
			});

			const janSummary = await generateGSTR3BSummary(testOrgId, 1, 2026);
			const febSummary = await generateGSTR3BSummary(testOrgId, 2, 2026);

			expect(janSummary.metadata.totalSalesInvoices).toBe(1);
			expect(janSummary.outputGST.cgst).toBe(900);

			expect(febSummary.metadata.totalSalesInvoices).toBe(1);
			expect(febSummary.outputGST.cgst).toBe(450);
		});

		it("should throw error for invalid month", async () => {
			await expect(generateGSTR3BSummary(testOrgId, 13, 2026)).rejects.toThrow(
				"Month must be between 1 and 12",
			);
		});

		it("should throw error for invalid year", async () => {
			await expect(generateGSTR3BSummary(testOrgId, 1, 1999)).rejects.toThrow("Invalid year");
		});

		it("should include correct metadata", async () => {
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
					igstAmount: 0,
					totalAmount: 11800,
					placeOfSupply: "27",
				},
			});

			const summary = await generateGSTR3BSummary(testOrgId, 5, 2026);

			expect(summary.metadata.totalSalesInvoices).toBe(1);
			expect(summary.metadata.totalOutputValue).toBe(11800);
			expect(summary.metadata.totalInputValue).toBe(0);
			expect(summary.metadata.totalPurchaseInvoices).toBe(0);
		});

		it("should have correct period information", async () => {
			const summary = await generateGSTR3BSummary(testOrgId, 6, 2026);

			expect(summary.period.month).toBe(6);
			expect(summary.period.year).toBe(2026);
			expect(summary.period.startDate).toEqual(new Date(2026, 5, 1, 0, 0, 0, 0));
			expect(summary.period.endDate).toEqual(new Date(2026, 6, 1, 0, 0, 0, 0));
		});
	});

	describe("generateGSTR3BJSON", () => {
		it("should generate valid filing JSON", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-001",
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

			const summary = await generateGSTR3BSummary(testOrgId, 6, 2026);
			const json = generateGSTR3BJSON(summary);

			expect(json.ret_period).toBe("062026");
			expect(json.sup_details.osup_det.camt).toBe(900);
			expect(json.sup_details.osup_det.samt).toBe(900);
			expect(json.intr_details.intr_det.camt).toBe(900);
			expect(json.intr_details.intr_det.samt).toBe(900);
		});

		it("should have correct structure for portal upload", async () => {
			const summary = await generateGSTR3BSummary(testOrgId, 7, 2026);
			const json = generateGSTR3BJSON(summary);

			expect(json).toHaveProperty("ret_period");
			expect(json).toHaveProperty("sup_details");
			expect(json).toHaveProperty("itc_elg");
			expect(json).toHaveProperty("intr_details");
		});
	});

	describe("generateGSTR3BReport", () => {
		it("should generate human-readable report", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-001",
					issuedAt: new Date(2026, 6, 15),
					status: "ISSUED",
					subtotal: 10000,
					cgstAmount: 900,
					sgstAmount: 900,
					igstAmount: 0,
					totalAmount: 11800,
					placeOfSupply: "27",
				},
			});

			const summary = await generateGSTR3BSummary(testOrgId, 7, 2026);
			const report = generateGSTR3BReport(summary);

			expect(report).toContain("GSTR-3B MONTHLY SUMMARY");
			expect(report).toContain("OUTPUT GST");
			expect(report).toContain("INPUT GST");
			expect(report).toContain("NET GST PAYABLE");
			expect(report).toContain("₹900.00");
		});

		it("should show ITC carry forward when applicable", async () => {
			const summary = await generateGSTR3BSummary(testOrgId, 8, 2026);
			const report = generateGSTR3BReport(summary);

			// Empty month - should not show ITC section
			expect(report).not.toContain("ITC CARRY FORWARD");
		});
	});

	describe("Tax calculations edge cases", () => {
		it("should handle decimal precision correctly", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-001",
					issuedAt: new Date(2026, 7, 15),
					status: "ISSUED",
					subtotal: 12345.67,
					cgstAmount: 1111.11,
					sgstAmount: 1111.11,
					igstAmount: 0,
					totalAmount: 14567.89,
					placeOfSupply: "27",
				},
			});

			const summary = await generateGSTR3BSummary(testOrgId, 8, 2026);

			expect(summary.outputGST.cgst).toBe(1111.11);
			expect(summary.outputGST.sgst).toBe(1111.11);
		});

		it("should round summary totals to 2 decimal places", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-001",
					issuedAt: new Date(2026, 8, 15),
					status: "ISSUED",
					subtotal: 10000.33,
					cgstAmount: 900.03,
					sgstAmount: 900.03,
					igstAmount: 0,
					totalAmount: 11800.39,
					placeOfSupply: "27",
				},
			});

			const summary = await generateGSTR3BSummary(testOrgId, 9, 2026);

			// Check monetary values are rounded to <= 2 decimal places.
			const monetaryValues = [
				summary.outputGST.cgst,
				summary.outputGST.sgst,
				summary.outputGST.igst,
				summary.outputGST.total,
				summary.inputGST.cgst,
				summary.inputGST.sgst,
				summary.inputGST.igst,
				summary.inputGST.total,
				summary.netPayable.cgst,
				summary.netPayable.sgst,
				summary.netPayable.igst,
				summary.netPayable.total,
				summary.itcCarryForward.cgst,
				summary.itcCarryForward.sgst,
				summary.itcCarryForward.igst,
				summary.itcCarryForward.total,
				summary.metadata.totalOutputValue,
				summary.metadata.totalInputValue,
			];

			for (const value of monetaryValues) {
				const decimalPart = String(value).split(".")[1] ?? "";
				expect(decimalPart.length).toBeLessThanOrEqual(2);
			}
		});

		it("should handle zero tax amounts", async () => {
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-001",
					issuedAt: new Date(2026, 9, 15),
					status: "ISSUED",
					subtotal: 10000,
					cgstAmount: 0,
					sgstAmount: 0,
					igstAmount: 0,
					totalAmount: 10000,
					placeOfSupply: "27",
				},
			});

			const summary = await generateGSTR3BSummary(testOrgId, 10, 2026);

			expect(summary.outputGST.total).toBe(0);
			expect(summary.netPayable.total).toBe(0);
		});
	});

	describe("Net payable calculations", () => {
		it("should calculate positive net payable correctly", async () => {
			// Sales with tax
			await prisma.invoice.create({
				data: {
					organizationId: testOrgId,
					customerId: "cust-1",
					invoiceNumber: "INV-001",
					issuedAt: new Date(2026, 10, 15),
					status: "ISSUED",
					subtotal: 100000,
					cgstAmount: 9000,
					sgstAmount: 9000,
					igstAmount: 0,
					totalAmount: 118000,
					placeOfSupply: "27",
				},
			});

			const summary = await generateGSTR3BSummary(testOrgId, 11, 2026);

			// No input GST, so net payable = output GST
			expect(summary.netPayable.cgst).toBe(9000);
			expect(summary.netPayable.sgst).toBe(9000);
			expect(summary.netPayable.total).toBe(18000);
		});

		it("should not have negative net payable", async () => {
			const summary = await generateGSTR3BSummary(testOrgId, 12, 2025);

			// Net payable should never be negative
			expect(summary.netPayable.cgst).toBeGreaterThanOrEqual(0);
			expect(summary.netPayable.sgst).toBeGreaterThanOrEqual(0);
			expect(summary.netPayable.igst).toBeGreaterThanOrEqual(0);
		});
	});
});
