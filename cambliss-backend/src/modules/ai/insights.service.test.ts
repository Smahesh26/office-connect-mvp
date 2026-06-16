import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import prisma from "../../config/prisma";
import { closePrisma } from "../../config/prisma";
import { generateCEOReport, generateExecutiveInsights, generateRevenueInsights } from "./insights.service";

describe("AI Insights Service", () => {
	let testOrgId: string;
	let customerId: string;
	let vendorId: string;
	let productTopId: string;
	let productLowId: string;
	let employeeId: string;
	let leavePolicyId: string;
	let warehouseId: string;
	let storeId: string;

	beforeAll(async () => {
		const org = await prisma.organization.create({
			data: {
				name: "AI Insights Test Org",
			},
		});
		testOrgId = org.id;

		const customer = await prisma.contact.create({
			data: {
				organizationId: testOrgId,
				type: "CUSTOMER",
				firstName: "Insight",
				lastName: "Customer",
				email: "insight-customer@test.com",
			},
		});
		customerId = customer.id;

		const vendor = await prisma.contact.create({
			data: {
				organizationId: testOrgId,
				type: "VENDOR",
				companyName: "Insight Vendor Pvt Ltd",
				email: "vendor@test.com",
			},
		});
		vendorId = vendor.id;

		const [top, low] = await Promise.all([
			prisma.product.create({
				data: {
					organizationId: testOrgId,
					name: "Top Product",
					sku: "AI-TOP-001",
					unitPrice: 1000,
				},
			}),
			prisma.product.create({
				data: {
					organizationId: testOrgId,
					name: "Low Product",
					sku: "AI-LOW-001",
					unitPrice: 1000,
				},
			}),
		]);

		productTopId = top.id;
		productLowId = low.id;

		const warehouse = await prisma.warehouse.create({
			data: {
				organizationId: testOrgId,
				name: "Main Warehouse",
			},
		});
		warehouseId = warehouse.id;

		const store = await prisma.store.create({
			data: {
				organizationId: testOrgId,
				name: "Main Branch",
				isActive: true,
			},
		});
		storeId = store.id;

		await prisma.stockItem.createMany({
			data: [
				{
					productId: productTopId,
					warehouseId,
					quantity: 4,
				},
				{
					productId: productLowId,
					warehouseId,
					quantity: 30,
				},
			],
		});

		const employee = await prisma.employee.create({
			data: {
				organizationId: testOrgId,
				employeeCode: "EMP-AI-001",
				joinDate: new Date(),
				employmentType: "FULL_TIME",
				workMode: "HYBRID",
				salary: 60000,
			},
		});
		employeeId = employee.id;

		const leavePolicy = await prisma.leavePolicy.create({
			data: {
				organizationId: testOrgId,
				name: "General Leave",
				annualQuota: 12,
			},
		});
		leavePolicyId = leavePolicy.id;
	});

	afterAll(async () => {
		await prisma.journalEntry.deleteMany({
			where: {
				transaction: {
					organizationId: testOrgId,
				},
			},
		});
		await prisma.transaction.deleteMany({ where: { organizationId: testOrgId } });

		await prisma.invoiceItem.deleteMany({
			where: {
				invoice: {
					organizationId: testOrgId,
				},
			},
		});
		await prisma.invoice.deleteMany({ where: { organizationId: testOrgId } });

		await prisma.stockMovement.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.orderItem.deleteMany({ where: { order: { organizationId: testOrgId } } });
		await prisma.order.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.stockItem.deleteMany({ where: { warehouseId } });
		await prisma.warehouse.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.store.deleteMany({ where: { organizationId: testOrgId } });

		await prisma.leaveRequest.deleteMany({ where: { employeeId } });
		await prisma.leaveBalance.deleteMany({ where: { employeeId } });
		await prisma.attendance.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.payslip.deleteMany({ where: { employeeId } });
		await prisma.employee.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.leavePolicy.deleteMany({ where: { id: leavePolicyId } });

		await prisma.product.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.contact.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.ledgerAccount.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.organization.deleteMany({ where: { id: testOrgId } });
		await closePrisma();
	});

	beforeEach(async () => {
		await prisma.journalEntry.deleteMany({
			where: {
				transaction: {
					organizationId: testOrgId,
				},
			},
		});
		await prisma.transaction.deleteMany({ where: { organizationId: testOrgId } });

		await prisma.invoiceItem.deleteMany({
			where: {
				invoice: {
					organizationId: testOrgId,
				},
			},
		});
		await prisma.invoice.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.stockMovement.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.orderItem.deleteMany({ where: { order: { organizationId: testOrgId } } });
		await prisma.order.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.attendance.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.leaveRequest.deleteMany({ where: { employeeId } });
		await prisma.payslip.deleteMany({ where: { employeeId } });
		await prisma.ledgerAccount.deleteMany({ where: { organizationId: testOrgId } });
	});

	it("should generate revenue insights and detect >20% drop", async () => {
		const now = new Date();
		const currentMonth = new Date(now.getFullYear(), now.getMonth(), 10);
		const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 10);

		const previousInvoice = await prisma.invoice.create({
			data: {
				organizationId: testOrgId,
				invoiceNumber: `AI-REV-PREV-${Date.now()}`,
				customerId,
				status: "ISSUED",
				subtotal: 100000,
				cgstAmount: 9000,
				sgstAmount: 9000,
				igstAmount: 0,
				totalAmount: 118000,
				issuedAt: previousMonth,
			},
		});

		const currentInvoice = await prisma.invoice.create({
			data: {
				organizationId: testOrgId,
				invoiceNumber: `AI-REV-CURR-${Date.now()}`,
				customerId,
				status: "ISSUED",
				subtotal: 20000,
				cgstAmount: 1800,
				sgstAmount: 1800,
				igstAmount: 0,
				totalAmount: 23600,
				issuedAt: currentMonth,
			},
		});

		await prisma.invoiceItem.createMany({
			data: [
				{
					invoiceId: previousInvoice.id,
					productId: productTopId,
					quantity: 90,
					price: 1000,
					gstRate: 18,
					cgstAmount: 8100,
					sgstAmount: 8100,
					igstAmount: 0,
				},
				{
					invoiceId: currentInvoice.id,
					productId: productLowId,
					quantity: 2,
					price: 1000,
					gstRate: 18,
					cgstAmount: 180,
					sgstAmount: 180,
					igstAmount: 0,
				},
			],
		});

		await prisma.order.createMany({
			data: [
				{
					organizationId: testOrgId,
					storeId,
					customerId,
					status: "DELIVERED",
					paymentStatus: "PAID",
					totalAmount: 125000,
					createdAt: currentMonth,
				},
				{
					organizationId: testOrgId,
					storeId,
					customerId,
					status: "DELIVERED",
					paymentStatus: "PAID",
					totalAmount: 18000,
					createdAt: currentMonth,
				},
			],
		});

		const insights = await generateRevenueInsights(testOrgId);

		expect(insights.some((i) => i.title === "Revenue Growth")).toBe(true);
		expect(insights.some((i) => i.title === "Sudden Revenue Drop")).toBe(true);
		expect(insights.some((i) => i.title === "Most Profitable Branch")).toBe(true);
	});

	it("should generate executive insights with section arrays", async () => {
		const now = new Date();
		const currentMonth = new Date(now.getFullYear(), now.getMonth(), 12);
		const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 12);

		const invoiceIssued = await prisma.invoice.create({
			data: {
				organizationId: testOrgId,
				invoiceNumber: `AI-EXEC-ISS-${Date.now()}`,
				customerId,
				status: "ISSUED",
				subtotal: 30000,
				cgstAmount: 2700,
				sgstAmount: 2700,
				igstAmount: 0,
				totalAmount: 35400,
				issuedAt: currentMonth,
			},
		});

		await prisma.invoice.create({
			data: {
				organizationId: testOrgId,
				invoiceNumber: `AI-EXEC-UNP-${Date.now()}`,
				customerId,
				status: "ISSUED",
				subtotal: 40000,
				cgstAmount: 3600,
				sgstAmount: 3600,
				igstAmount: 0,
				totalAmount: 47200,
				issuedAt: new Date(now.getFullYear(), now.getMonth() - 2, 1),
			},
		});

		await prisma.invoiceItem.create({
			data: {
				invoiceId: invoiceIssued.id,
				productId: productTopId,
				quantity: 5,
				price: 1000,
				gstRate: 18,
				cgstAmount: 450,
				sgstAmount: 450,
				igstAmount: 0,
			},
		});

		const expenseLedger = await prisma.ledgerAccount.create({
			data: {
				organizationId: testOrgId,
				name: "Office Expenses",
				type: "EXPENSE",
				code: `EXP-${Date.now()}`,
			},
		});

		const tx = await prisma.transaction.create({
			data: {
				organizationId: testOrgId,
				type: "EXPENSE",
				totalAmount: 25000,
				status: "POSTED",
				contactId: vendorId,
				transactionDate: currentMonth,
			},
		});

		await prisma.journalEntry.create({
			data: {
				transactionId: tx.id,
				ledgerAccountId: expenseLedger.id,
				debit: 25000,
				credit: null,
			},
		});

		await prisma.stockMovement.create({
			data: {
				organizationId: testOrgId,
				productId: productTopId,
				warehouseId,
				type: "SALE",
				quantity: 20,
				createdAt: currentMonth,
			},
		});

		await prisma.attendance.createMany({
			data: [
				{
					organizationId: testOrgId,
					employeeId,
					date: new Date(now.getFullYear(), now.getMonth(), 1),
					totalHours: 10,
					overtimeHours: 2,
					isLate: true,
					status: "PRESENT",
				},
				{
					organizationId: testOrgId,
					employeeId,
					date: new Date(now.getFullYear(), now.getMonth(), 2),
					totalHours: 9,
					overtimeHours: 2,
					isLate: false,
					status: "PRESENT",
				},
			],
		});

		for (let day = 3; day <= 23; day++) {
			await prisma.leaveRequest.create({
				data: {
					employeeId,
					leavePolicyId,
					startDate: new Date(now.getFullYear(), now.getMonth(), day),
					endDate: new Date(now.getFullYear(), now.getMonth(), day),
					status: "APPROVED",
				},
			});
		}

		await prisma.payslip.createMany({
			data: [
				{
					employeeId,
					month: currentMonth.getMonth() + 1,
					year: currentMonth.getFullYear(),
					grossSalary: 70000,
					netSalary: 65000,
				},
				{
					employeeId,
					month: previousMonth.getMonth() + 1,
					year: previousMonth.getFullYear(),
					grossSalary: 50000,
					netSalary: 47000,
				},
			],
		});

		const insights = await generateExecutiveInsights(testOrgId);

		expect(Array.isArray(insights.revenueInsights)).toBe(true);
		expect(Array.isArray(insights.expenseInsights)).toBe(true);
		expect(Array.isArray(insights.inventoryInsights)).toBe(true);
		expect(Array.isArray(insights.cashFlowInsights)).toBe(true);
		expect(Array.isArray(insights.hrInsights)).toBe(true);

		expect(insights.cashFlowInsights.some((i) => i.title === "Cash Flow Risk")).toBe(true);
		expect(insights.cashFlowInsights.some((i) => i.title === "High-Risk Customer")).toBe(true);
		expect(insights.inventoryInsights.some((i) => i.title === "Dead Stock")).toBe(true);
		expect(insights.hrInsights.some((i) => i.title === "Overtime Dependency")).toBe(true);
	});

	it("should generate CEO report with narrative and predictive signals", async () => {
		const now = new Date();
		const currentMonth = new Date(now.getFullYear(), now.getMonth(), 10);

		await prisma.invoice.create({
			data: {
				organizationId: testOrgId,
				invoiceNumber: `AI-CEO-${Date.now()}`,
				customerId,
				status: "ISSUED",
				subtotal: 15000,
				cgstAmount: 1350,
				sgstAmount: 1350,
				igstAmount: 0,
				totalAmount: 17700,
				issuedAt: currentMonth,
			},
		});

		const report = await generateCEOReport(testOrgId);

		expect(report.summary.length).toBeGreaterThan(20);
		expect(Array.isArray(report.highlights)).toBe(true);
		expect(Array.isArray(report.risks)).toBe(true);
		expect(Array.isArray(report.recommendations)).toBe(true);
		expect(report.predictiveSignals).toHaveProperty("nextMonthRevenueForecast");
		expect(report.predictiveSignals).toHaveProperty("customerChurnRisk");
		expect(report.predictiveSignals).toHaveProperty("creditRiskScore");
	});
});
