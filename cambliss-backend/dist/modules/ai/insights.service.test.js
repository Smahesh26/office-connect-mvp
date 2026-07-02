"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const prisma_1 = __importDefault(require("../../config/prisma"));
const prisma_2 = require("../../config/prisma");
const insights_service_1 = require("./insights.service");
(0, globals_1.describe)("AI Insights Service", () => {
    let testOrgId;
    let customerId;
    let vendorId;
    let productTopId;
    let productLowId;
    let employeeId;
    let leavePolicyId;
    let warehouseId;
    let storeId;
    (0, globals_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        const org = yield prisma_1.default.organization.create({
            data: {
                name: "AI Insights Test Org",
            },
        });
        testOrgId = org.id;
        const customer = yield prisma_1.default.contact.create({
            data: {
                organizationId: testOrgId,
                type: "CUSTOMER",
                firstName: "Insight",
                lastName: "Customer",
                email: "insight-customer@test.com",
            },
        });
        customerId = customer.id;
        const vendor = yield prisma_1.default.contact.create({
            data: {
                organizationId: testOrgId,
                type: "VENDOR",
                companyName: "Insight Vendor Pvt Ltd",
                email: "vendor@test.com",
            },
        });
        vendorId = vendor.id;
        const [top, low] = yield Promise.all([
            prisma_1.default.product.create({
                data: {
                    organizationId: testOrgId,
                    name: "Top Product",
                    sku: "AI-TOP-001",
                    unitPrice: 1000,
                },
            }),
            prisma_1.default.product.create({
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
        const warehouse = yield prisma_1.default.warehouse.create({
            data: {
                organizationId: testOrgId,
                name: "Main Warehouse",
            },
        });
        warehouseId = warehouse.id;
        const store = yield prisma_1.default.store.create({
            data: {
                organizationId: testOrgId,
                name: "Main Branch",
                isActive: true,
            },
        });
        storeId = store.id;
        yield prisma_1.default.stockItem.createMany({
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
        const employee = yield prisma_1.default.employee.create({
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
        const leavePolicy = yield prisma_1.default.leavePolicy.create({
            data: {
                organizationId: testOrgId,
                name: "General Leave",
                annualQuota: 12,
            },
        });
        leavePolicyId = leavePolicy.id;
    }));
    (0, globals_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.default.journalEntry.deleteMany({
            where: {
                transaction: {
                    organizationId: testOrgId,
                },
            },
        });
        yield prisma_1.default.transaction.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.invoiceItem.deleteMany({
            where: {
                invoice: {
                    organizationId: testOrgId,
                },
            },
        });
        yield prisma_1.default.invoice.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.stockMovement.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.orderItem.deleteMany({ where: { order: { organizationId: testOrgId } } });
        yield prisma_1.default.order.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.stockItem.deleteMany({ where: { warehouseId } });
        yield prisma_1.default.warehouse.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.store.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.leaveRequest.deleteMany({ where: { employeeId } });
        yield prisma_1.default.leaveBalance.deleteMany({ where: { employeeId } });
        yield prisma_1.default.attendance.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.payslip.deleteMany({ where: { employeeId } });
        yield prisma_1.default.employee.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.leavePolicy.deleteMany({ where: { id: leavePolicyId } });
        yield prisma_1.default.product.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.contact.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.ledgerAccount.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.organization.deleteMany({ where: { id: testOrgId } });
        yield (0, prisma_2.closePrisma)();
    }));
    (0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.default.journalEntry.deleteMany({
            where: {
                transaction: {
                    organizationId: testOrgId,
                },
            },
        });
        yield prisma_1.default.transaction.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.invoiceItem.deleteMany({
            where: {
                invoice: {
                    organizationId: testOrgId,
                },
            },
        });
        yield prisma_1.default.invoice.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.stockMovement.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.orderItem.deleteMany({ where: { order: { organizationId: testOrgId } } });
        yield prisma_1.default.order.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.attendance.deleteMany({ where: { organizationId: testOrgId } });
        yield prisma_1.default.leaveRequest.deleteMany({ where: { employeeId } });
        yield prisma_1.default.payslip.deleteMany({ where: { employeeId } });
        yield prisma_1.default.ledgerAccount.deleteMany({ where: { organizationId: testOrgId } });
    }));
    (0, globals_1.it)("should generate revenue insights and detect >20% drop", () => __awaiter(void 0, void 0, void 0, function* () {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 10);
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 10);
        const previousInvoice = yield prisma_1.default.invoice.create({
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
        const currentInvoice = yield prisma_1.default.invoice.create({
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
        yield prisma_1.default.invoiceItem.createMany({
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
        yield prisma_1.default.order.createMany({
            data: [
                {
                    organizationId: testOrgId,
                    storeId,
                    customerId,
                    status: "DELIVERED",
                    paymentStatus: "PAID",
                    totalAmount: 125000,
                    currency: "INR",
                    exchangeRate: 1,
                    baseCurrencyAmount: 125000,
                    createdAt: currentMonth,
                },
                {
                    organizationId: testOrgId,
                    storeId,
                    customerId,
                    status: "DELIVERED",
                    paymentStatus: "PAID",
                    totalAmount: 18000,
                    currency: "INR",
                    exchangeRate: 1,
                    baseCurrencyAmount: 18000,
                    createdAt: currentMonth,
                },
            ],
        });
        const insights = yield (0, insights_service_1.generateRevenueInsights)(testOrgId);
        (0, globals_1.expect)(insights.some((i) => i.title === "Revenue Growth")).toBe(true);
        (0, globals_1.expect)(insights.some((i) => i.title === "Sudden Revenue Drop")).toBe(true);
        (0, globals_1.expect)(insights.some((i) => i.title === "Most Profitable Branch")).toBe(true);
    }));
    (0, globals_1.it)("should generate executive insights with section arrays", () => __awaiter(void 0, void 0, void 0, function* () {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 12);
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 12);
        const invoiceIssued = yield prisma_1.default.invoice.create({
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
        yield prisma_1.default.invoice.create({
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
        yield prisma_1.default.invoiceItem.create({
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
        const expenseLedger = yield prisma_1.default.ledgerAccount.create({
            data: {
                organizationId: testOrgId,
                name: "Office Expenses",
                type: "EXPENSE",
                code: `EXP-${Date.now()}`,
            },
        });
        const tx = yield prisma_1.default.transaction.create({
            data: {
                organizationId: testOrgId,
                type: "EXPENSE",
                totalAmount: 25000,
                status: "POSTED",
                contactId: vendorId,
                transactionDate: currentMonth,
            },
        });
        yield prisma_1.default.journalEntry.create({
            data: {
                transactionId: tx.id,
                ledgerAccountId: expenseLedger.id,
                debit: 25000,
                credit: null,
            },
        });
        yield prisma_1.default.stockMovement.create({
            data: {
                organizationId: testOrgId,
                productId: productTopId,
                warehouseId,
                type: "SALE",
                quantity: 20,
                createdAt: currentMonth,
            },
        });
        yield prisma_1.default.attendance.createMany({
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
            yield prisma_1.default.leaveRequest.create({
                data: {
                    employeeId,
                    leavePolicyId,
                    startDate: new Date(now.getFullYear(), now.getMonth(), day),
                    endDate: new Date(now.getFullYear(), now.getMonth(), day),
                    status: "APPROVED",
                },
            });
        }
        yield prisma_1.default.payslip.createMany({
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
        const insights = yield (0, insights_service_1.generateExecutiveInsights)(testOrgId);
        (0, globals_1.expect)(Array.isArray(insights.revenueInsights)).toBe(true);
        (0, globals_1.expect)(Array.isArray(insights.expenseInsights)).toBe(true);
        (0, globals_1.expect)(Array.isArray(insights.inventoryInsights)).toBe(true);
        (0, globals_1.expect)(Array.isArray(insights.cashFlowInsights)).toBe(true);
        (0, globals_1.expect)(Array.isArray(insights.hrInsights)).toBe(true);
        (0, globals_1.expect)(insights.cashFlowInsights.some((i) => i.title === "Cash Flow Risk")).toBe(true);
        (0, globals_1.expect)(insights.cashFlowInsights.some((i) => i.title === "High-Risk Customer")).toBe(true);
        (0, globals_1.expect)(insights.inventoryInsights.some((i) => i.title === "Dead Stock")).toBe(true);
        (0, globals_1.expect)(insights.hrInsights.some((i) => i.title === "Overtime Dependency")).toBe(true);
    }));
    (0, globals_1.it)("should generate CEO report with narrative and predictive signals", () => __awaiter(void 0, void 0, void 0, function* () {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 10);
        yield prisma_1.default.invoice.create({
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
        const report = yield (0, insights_service_1.generateCEOReport)(testOrgId);
        (0, globals_1.expect)(report.summary.length).toBeGreaterThan(20);
        (0, globals_1.expect)(Array.isArray(report.highlights)).toBe(true);
        (0, globals_1.expect)(Array.isArray(report.risks)).toBe(true);
        (0, globals_1.expect)(Array.isArray(report.recommendations)).toBe(true);
        (0, globals_1.expect)(report.predictiveSignals).toHaveProperty("nextMonthRevenueForecast");
        (0, globals_1.expect)(report.predictiveSignals).toHaveProperty("customerChurnRisk");
        (0, globals_1.expect)(report.predictiveSignals).toHaveProperty("creditRiskScore");
    }));
});
