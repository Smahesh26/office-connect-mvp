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
exports.generateCEOReport = exports.generateExecutiveInsights = exports.generateRevenueInsights = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const toMoney = (value) => Number(value.toFixed(2));
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
const addMonths = (date, delta) => new Date(date.getFullYear(), date.getMonth() + delta, 1, 0, 0, 0, 0);
const percentageChange = (current, previous) => {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return toMoney(((current - previous) / previous) * 100);
};
const getRevenueForRange = (organizationId, from, to) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const aggregate = yield prisma_1.default.invoice.aggregate({
        where: {
            organizationId,
            status: {
                not: "CANCELLED",
            },
            issuedAt: {
                gte: from,
                lt: to,
            },
        },
        _sum: {
            totalAmount: true,
        },
    });
    return toMoney(Number((_a = aggregate._sum.totalAmount) !== null && _a !== void 0 ? _a : 0));
});
const generateRevenueInsights = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const prevMonthStart = addMonths(thisMonthStart, -1);
    const prevMonthEnd = thisMonthStart;
    const [currentRevenue, previousRevenue] = yield Promise.all([
        getRevenueForRange(organizationId, thisMonthStart, thisMonthEnd),
        getRevenueForRange(organizationId, prevMonthStart, prevMonthEnd),
    ]);
    const growthPct = percentageChange(currentRevenue, previousRevenue);
    const insights = [
        {
            severity: growthPct >= 0 ? "SUCCESS" : "WARNING",
            title: "Revenue Growth",
            message: `Month-over-month revenue change is ${growthPct.toFixed(2)}%.`,
            metric: `${growthPct.toFixed(2)}%`,
        },
    ];
    if (growthPct < -20) {
        insights.push({
            severity: "ALERT",
            title: "Sudden Revenue Drop",
            message: "Revenue has dropped by more than 20% compared to last month.",
            metric: `${growthPct.toFixed(2)}%`,
        });
    }
    const topProducts = yield prisma_1.default.invoiceItem.groupBy({
        by: ["productId"],
        where: {
            invoice: {
                organizationId,
                status: {
                    not: "CANCELLED",
                },
                issuedAt: {
                    gte: addMonths(thisMonthStart, -3),
                    lt: thisMonthEnd,
                },
            },
        },
        _sum: {
            quantity: true,
        },
        orderBy: {
            _sum: {
                quantity: "desc",
            },
        },
        take: 5,
    });
    const lowProducts = yield prisma_1.default.invoiceItem.groupBy({
        by: ["productId"],
        where: {
            invoice: {
                organizationId,
                status: {
                    not: "CANCELLED",
                },
                issuedAt: {
                    gte: addMonths(thisMonthStart, -3),
                    lt: thisMonthEnd,
                },
            },
        },
        _sum: {
            quantity: true,
        },
        orderBy: {
            _sum: {
                quantity: "asc",
            },
        },
        take: 3,
    });
    const productIds = Array.from(new Set([...topProducts, ...lowProducts].map((item) => item.productId)));
    const products = productIds.length
        ? yield prisma_1.default.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
            },
            select: {
                id: true,
                name: true,
                sku: true,
            },
        })
        : [];
    const productMap = new Map(products.map((product) => [product.id, product]));
    if (topProducts.length > 0) {
        const top = topProducts[0];
        const bestProduct = productMap.get(top.productId);
        insights.push({
            severity: "SUCCESS",
            title: "Best-Selling Product",
            message: `${(_a = bestProduct === null || bestProduct === void 0 ? void 0 : bestProduct.name) !== null && _a !== void 0 ? _a : "Unknown Product"} (${(_b = bestProduct === null || bestProduct === void 0 ? void 0 : bestProduct.sku) !== null && _b !== void 0 ? _b : "N/A"}) has highest sales in last 3 months.`,
            metric: `${(_c = top._sum.quantity) !== null && _c !== void 0 ? _c : 0} units`,
        });
    }
    if (lowProducts.length > 0) {
        const low = lowProducts[0];
        const lowProduct = productMap.get(low.productId);
        insights.push({
            severity: "WARNING",
            title: "Low-Performing Product",
            message: `${(_d = lowProduct === null || lowProduct === void 0 ? void 0 : lowProduct.name) !== null && _d !== void 0 ? _d : "Unknown Product"} (${(_e = lowProduct === null || lowProduct === void 0 ? void 0 : lowProduct.sku) !== null && _e !== void 0 ? _e : "N/A"}) has the lowest movement in last 3 months.`,
            metric: `${(_f = low._sum.quantity) !== null && _f !== void 0 ? _f : 0} units`,
        });
    }
    const stores = yield prisma_1.default.store.findMany({
        where: {
            organizationId,
            isActive: true,
        },
        select: {
            id: true,
            name: true,
            orders: {
                where: {
                    status: {
                        not: "CANCELLED",
                    },
                    createdAt: {
                        gte: thisMonthStart,
                        lt: thisMonthEnd,
                    },
                },
                select: {
                    totalAmount: true,
                },
            },
        },
    });
    const branchRevenue = stores
        .map((store) => ({
        name: store.name,
        revenue: toMoney(store.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)),
    }))
        .filter((store) => store.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue);
    if (branchRevenue.length > 0) {
        const topBranch = branchRevenue[0];
        insights.push({
            severity: "SUCCESS",
            title: "Most Profitable Branch",
            message: `${topBranch.name} has the highest order revenue this month.`,
            metric: `₹${topBranch.revenue.toFixed(2)}`,
        });
    }
    if (branchRevenue.length > 1) {
        const topBranch = branchRevenue[0];
        const lowBranch = branchRevenue[branchRevenue.length - 1];
        if (topBranch.revenue > 0 && lowBranch.revenue / topBranch.revenue < 0.5) {
            insights.push({
                severity: "WARNING",
                title: "Underperforming Branch",
                message: `${lowBranch.name} is generating significantly lower revenue than the leading branch.`,
                metric: `₹${lowBranch.revenue.toFixed(2)}`,
            });
        }
    }
    return insights;
});
exports.generateRevenueInsights = generateRevenueInsights;
const generateExpenseInsights = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const prevMonthStart = addMonths(thisMonthStart, -1);
    const [currentExpenseAgg, previousExpenseAgg] = yield Promise.all([
        prisma_1.default.transaction.aggregate({
            where: {
                organizationId,
                type: "EXPENSE",
                transactionDate: {
                    gte: thisMonthStart,
                    lt: thisMonthEnd,
                },
            },
            _sum: {
                totalAmount: true,
            },
        }),
        prisma_1.default.transaction.aggregate({
            where: {
                organizationId,
                type: "EXPENSE",
                transactionDate: {
                    gte: prevMonthStart,
                    lt: thisMonthStart,
                },
            },
            _sum: {
                totalAmount: true,
            },
        }),
    ]);
    const currentExpense = Number((_a = currentExpenseAgg._sum.totalAmount) !== null && _a !== void 0 ? _a : 0);
    const previousExpense = Number((_b = previousExpenseAgg._sum.totalAmount) !== null && _b !== void 0 ? _b : 0);
    const expenseGrowthPct = percentageChange(currentExpense, previousExpense);
    const insights = [
        {
            severity: expenseGrowthPct > 0 ? "WARNING" : "SUCCESS",
            title: "Expense Growth",
            message: `Month-over-month expense change is ${expenseGrowthPct.toFixed(2)}%.`,
            metric: `${expenseGrowthPct.toFixed(2)}%`,
        },
    ];
    if (expenseGrowthPct > 30) {
        insights.push({
            severity: "ALERT",
            title: "Expense Spike Detected",
            message: "Expenses increased by more than 30% compared to last month.",
            metric: `${expenseGrowthPct.toFixed(2)}%`,
        });
    }
    const categorySums = yield prisma_1.default.journalEntry.groupBy({
        by: ["ledgerAccountId"],
        where: {
            transaction: {
                organizationId,
                type: "EXPENSE",
                transactionDate: {
                    gte: prevMonthStart,
                    lt: thisMonthEnd,
                },
            },
            debit: {
                not: null,
            },
        },
        _sum: {
            debit: true,
        },
        orderBy: {
            _sum: {
                debit: "desc",
            },
        },
        take: 5,
    });
    if (categorySums.length > 0) {
        const topCategory = yield prisma_1.default.ledgerAccount.findUnique({
            where: {
                id: categorySums[0].ledgerAccountId,
            },
            select: {
                name: true,
            },
        });
        insights.push({
            severity: "INFO",
            title: "Highest Expense Category",
            message: `${(_c = topCategory === null || topCategory === void 0 ? void 0 : topCategory.name) !== null && _c !== void 0 ? _c : "Unknown Ledger"} has the largest expense outflow recently.`,
            metric: `₹${toMoney(Number((_d = categorySums[0]._sum.debit) !== null && _d !== void 0 ? _d : 0)).toFixed(2)}`,
        });
    }
    const vendorSpend = yield prisma_1.default.transaction.groupBy({
        by: ["contactId"],
        where: {
            organizationId,
            type: "EXPENSE",
            contactId: {
                not: null,
            },
            transactionDate: {
                gte: thisMonthStart,
                lt: thisMonthEnd,
            },
        },
        _sum: {
            totalAmount: true,
        },
        orderBy: {
            _sum: {
                totalAmount: "desc",
            },
        },
        take: 5,
    });
    const totalVendorSpend = vendorSpend.reduce((sum, item) => { var _a; return sum + Number((_a = item._sum.totalAmount) !== null && _a !== void 0 ? _a : 0); }, 0);
    if (vendorSpend.length > 0 && totalVendorSpend > 0 && vendorSpend[0].contactId) {
        const topVendorShare = (Number((_e = vendorSpend[0]._sum.totalAmount) !== null && _e !== void 0 ? _e : 0) / totalVendorSpend) * 100;
        const topVendor = yield prisma_1.default.contact.findUnique({
            where: {
                id: vendorSpend[0].contactId,
            },
            select: {
                companyName: true,
                firstName: true,
                lastName: true,
            },
        });
        if (topVendorShare > 40) {
            const vendorName = (topVendor === null || topVendor === void 0 ? void 0 : topVendor.companyName) ||
                [topVendor === null || topVendor === void 0 ? void 0 : topVendor.firstName, topVendor === null || topVendor === void 0 ? void 0 : topVendor.lastName].filter(Boolean).join(" ") ||
                "Top Vendor";
            insights.push({
                severity: "WARNING",
                title: "Vendor Over-Dependence",
                message: `${vendorName} accounts for a high share of expense outflow this month.`,
                metric: `${toMoney(topVendorShare).toFixed(2)}%`,
            });
        }
    }
    return insights;
});
const generateCashFlowInsights = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const [monthlyRevenue, unpaidInvoiceAgg, unpaidInvoices] = yield Promise.all([
        getRevenueForRange(organizationId, thisMonthStart, thisMonthEnd),
        prisma_1.default.invoice.aggregate({
            where: {
                organizationId,
                status: {
                    notIn: ["PAID", "CANCELLED"],
                },
            },
            _sum: {
                totalAmount: true,
            },
        }),
        prisma_1.default.invoice.findMany({
            where: {
                organizationId,
                status: {
                    notIn: ["PAID", "CANCELLED"],
                },
            },
            select: {
                id: true,
                issuedAt: true,
            },
        }),
    ]);
    const outstanding = Number((_a = unpaidInvoiceAgg._sum.totalAmount) !== null && _a !== void 0 ? _a : 0);
    const receivableRatio = monthlyRevenue > 0 ? (outstanding / monthlyRevenue) * 100 : outstanding > 0 ? 100 : 0;
    const insights = [
        {
            severity: receivableRatio > 40 ? "ALERT" : "INFO",
            title: "Outstanding Receivables Ratio",
            message: "Outstanding receivables as a percentage of this month's revenue.",
            metric: `${toMoney(receivableRatio).toFixed(2)}%`,
        },
    ];
    if (receivableRatio > 40) {
        insights.push({
            severity: "ALERT",
            title: "Cash Flow Risk",
            message: "Outstanding receivables exceed 40% of revenue. Cash flow risk is elevated.",
            metric: `${toMoney(receivableRatio).toFixed(2)}%`,
        });
    }
    const fortyFiveDaysAgo = new Date(now);
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);
    const delayedCount = unpaidInvoices.filter((invoice) => invoice.issuedAt < fortyFiveDaysAgo).length;
    if (delayedCount > 0) {
        insights.push({
            severity: "WARNING",
            title: "Payment Delays Detected",
            message: `${delayedCount} unpaid invoices are older than 45 days.`,
            metric: `${delayedCount} delayed invoices`,
        });
    }
    if (unpaidInvoices.length > 10) {
        insights.push({
            severity: "WARNING",
            title: "High Unpaid Invoice Volume",
            message: `There are ${unpaidInvoices.length} unpaid invoices requiring follow-up.`,
            metric: `${unpaidInvoices.length} unpaid`,
        });
    }
    const [unpaidByCustomer, delayedByCustomer] = yield Promise.all([
        prisma_1.default.invoice.groupBy({
            by: ["customerId"],
            where: {
                organizationId,
                customerId: {
                    not: null,
                },
                status: {
                    notIn: ["PAID", "CANCELLED"],
                },
            },
            _sum: {
                totalAmount: true,
            },
            _count: {
                _all: true,
            },
            orderBy: {
                _sum: {
                    totalAmount: "desc",
                },
            },
            take: 5,
        }),
        prisma_1.default.invoice.groupBy({
            by: ["customerId"],
            where: {
                organizationId,
                customerId: {
                    not: null,
                },
                status: {
                    notIn: ["PAID", "CANCELLED"],
                },
                issuedAt: {
                    lt: fortyFiveDaysAgo,
                },
            },
            _count: {
                _all: true,
            },
        }),
    ]);
    const riskyCustomerIds = unpaidByCustomer
        .map((entry) => entry.customerId)
        .filter((id) => Boolean(id));
    if (riskyCustomerIds.length > 0 && outstanding > 0) {
        const customers = yield prisma_1.default.contact.findMany({
            where: {
                id: {
                    in: riskyCustomerIds,
                },
            },
            select: {
                id: true,
                companyName: true,
                firstName: true,
                lastName: true,
            },
        });
        const customerMap = new Map(customers.map((customer) => [
            customer.id,
            customer.companyName || [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Customer",
        ]));
        const delayedMap = new Map(delayedByCustomer
            .filter((entry) => entry.customerId)
            .map((entry) => [entry.customerId, entry._count._all]));
        const topRisk = unpaidByCustomer.find((entry) => {
            var _a, _b;
            if (!entry.customerId) {
                return false;
            }
            const outstandingShare = (Number((_a = entry._sum.totalAmount) !== null && _a !== void 0 ? _a : 0) / outstanding) * 100;
            const delayedInvoices = (_b = delayedMap.get(entry.customerId)) !== null && _b !== void 0 ? _b : 0;
            return outstandingShare >= 25 || delayedInvoices >= 2 || entry._count._all >= 3;
        });
        if (topRisk === null || topRisk === void 0 ? void 0 : topRisk.customerId) {
            const riskyName = (_b = customerMap.get(topRisk.customerId)) !== null && _b !== void 0 ? _b : "Customer";
            const riskAmount = Number((_c = topRisk._sum.totalAmount) !== null && _c !== void 0 ? _c : 0);
            const riskShare = (riskAmount / outstanding) * 100;
            const delayedInvoices = (_d = delayedMap.get(topRisk.customerId)) !== null && _d !== void 0 ? _d : 0;
            insights.push({
                severity: "WARNING",
                title: "High-Risk Customer",
                message: `${riskyName} has elevated receivable risk from unpaid and/or delayed invoices.`,
                metric: `₹${toMoney(riskAmount).toFixed(2)} (${toMoney(riskShare).toFixed(2)}%), delayed: ${delayedInvoices}`,
            });
        }
    }
    return insights;
});
const generateInventoryInsights = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const now = new Date();
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [products, recentSales, stockItems] = yield Promise.all([
        prisma_1.default.product.findMany({
            where: {
                organizationId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                sku: true,
                stockItems: {
                    select: {
                        quantity: true,
                    },
                },
                stockMovements: {
                    where: {
                        type: "SALE",
                        createdAt: {
                            gte: sixtyDaysAgo,
                        },
                    },
                    select: {
                        id: true,
                    },
                    take: 1,
                },
            },
        }),
        prisma_1.default.stockMovement.groupBy({
            by: ["productId"],
            where: {
                organizationId,
                type: "SALE",
                createdAt: {
                    gte: thirtyDaysAgo,
                    lt: now,
                },
            },
            _sum: {
                quantity: true,
            },
            orderBy: {
                _sum: {
                    quantity: "desc",
                },
            },
            take: 5,
        }),
        prisma_1.default.stockItem.findMany({
            where: {
                product: {
                    organizationId,
                    isActive: true,
                },
            },
            select: {
                productId: true,
                quantity: true,
            },
        }),
    ]);
    const insights = [];
    const deadStock = products.filter((product) => {
        const totalStock = product.stockItems.reduce((sum, stock) => sum + stock.quantity, 0);
        return totalStock > 0 && product.stockMovements.length === 0;
    });
    if (deadStock.length > 0) {
        insights.push({
            severity: "WARNING",
            title: "Dead Stock",
            message: `${deadStock.length} products have stock but no sales movement for 60+ days.`,
            metric: `${deadStock.length} products`,
        });
    }
    if (recentSales.length > 0) {
        const fast = recentSales[0];
        const fastProduct = products.find((product) => product.id === fast.productId);
        insights.push({
            severity: "SUCCESS",
            title: "Fast-Moving Product",
            message: `${(_a = fastProduct === null || fastProduct === void 0 ? void 0 : fastProduct.name) !== null && _a !== void 0 ? _a : "Unknown Product"} is the fastest-moving SKU in the last 30 days.`,
            metric: `${(_b = fast._sum.quantity) !== null && _b !== void 0 ? _b : 0} units`,
        });
    }
    const stockByProduct = new Map();
    for (const stock of stockItems) {
        stockByProduct.set(stock.productId, ((_c = stockByProduct.get(stock.productId)) !== null && _c !== void 0 ? _c : 0) + stock.quantity);
    }
    const soldByProduct = new Map();
    for (const sale of recentSales) {
        soldByProduct.set(sale.productId, Number((_d = sale._sum.quantity) !== null && _d !== void 0 ? _d : 0));
    }
    const overstockProducts = products.filter((product) => {
        var _a, _b;
        const stock = (_a = stockByProduct.get(product.id)) !== null && _a !== void 0 ? _a : 0;
        const sold = (_b = soldByProduct.get(product.id)) !== null && _b !== void 0 ? _b : 0;
        if (stock <= 0) {
            return false;
        }
        if (sold === 0 && stock >= 20) {
            return true;
        }
        return sold > 0 && stock / sold > 3;
    });
    if (overstockProducts.length > 0) {
        insights.push({
            severity: "WARNING",
            title: "Overstock Risk",
            message: `${overstockProducts.length} products appear overstocked relative to recent sales pace.`,
            metric: `${overstockProducts.length} products`,
        });
    }
    const lowStockProducts = products.filter((product) => {
        var _a;
        const stock = (_a = stockByProduct.get(product.id)) !== null && _a !== void 0 ? _a : 0;
        return stock > 0 && stock <= 5;
    });
    if (lowStockProducts.length > 0) {
        insights.push({
            severity: "ALERT",
            title: "Low Stock Alert",
            message: `${lowStockProducts.length} products are at low stock levels and may stock out soon.`,
            metric: `${lowStockProducts.length} products`,
        });
    }
    if (insights.length === 0) {
        insights.push({
            severity: "INFO",
            title: "Inventory Stable",
            message: "No major inventory risks detected from current rules.",
        });
    }
    return insights;
});
const generateHRInsights = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const prevMonthStart = addMonths(thisMonthStart, -1);
    const [attendanceRecords, leaveCount, currentPayrollAgg, previousPayrollAgg, currentRevenue, previousRevenue] = yield Promise.all([
        prisma_1.default.attendance.findMany({
            where: {
                organizationId,
                date: {
                    gte: thisMonthStart,
                    lt: thisMonthEnd,
                },
            },
            select: {
                employeeId: true,
                totalHours: true,
                overtimeHours: true,
                isLate: true,
            },
        }),
        prisma_1.default.leaveRequest.count({
            where: {
                employee: {
                    organizationId,
                },
                startDate: {
                    gte: thisMonthStart,
                    lt: thisMonthEnd,
                },
            },
        }),
        prisma_1.default.payslip.aggregate({
            where: {
                employee: {
                    organizationId,
                },
                month: thisMonthStart.getMonth() + 1,
                year: thisMonthStart.getFullYear(),
            },
            _sum: {
                grossSalary: true,
            },
        }),
        prisma_1.default.payslip.aggregate({
            where: {
                employee: {
                    organizationId,
                },
                month: prevMonthStart.getMonth() + 1,
                year: prevMonthStart.getFullYear(),
            },
            _sum: {
                grossSalary: true,
            },
        }),
        getRevenueForRange(organizationId, thisMonthStart, thisMonthEnd),
        getRevenueForRange(organizationId, prevMonthStart, thisMonthStart),
    ]);
    const insights = [];
    const totalAttendance = attendanceRecords.length;
    const lateCount = attendanceRecords.filter((attendance) => attendance.isLate).length;
    const lateRate = totalAttendance > 0 ? (lateCount / totalAttendance) * 100 : 0;
    const totalOvertimeHours = attendanceRecords.reduce((sum, attendance) => { var _a; return sum + Number((_a = attendance.overtimeHours) !== null && _a !== void 0 ? _a : 0); }, 0);
    const avgOvertime = totalAttendance > 0 ? totalOvertimeHours / totalAttendance : 0;
    insights.push({
        severity: lateRate > 20 ? "WARNING" : "SUCCESS",
        title: "Attendance Punctuality",
        message: `Late attendance rate this month is ${toMoney(lateRate).toFixed(2)}%.`,
        metric: `${toMoney(lateRate).toFixed(2)}%`,
    });
    if (avgOvertime > 1.5) {
        insights.push({
            severity: "WARNING",
            title: "Overtime Dependency",
            message: "Average overtime per attendance record is high and may indicate capacity stress.",
            metric: `${toMoney(avgOvertime).toFixed(2)} hrs/day`,
        });
    }
    if (leaveCount > 20) {
        insights.push({
            severity: "INFO",
            title: "Leave Frequency",
            message: `Leave requests are elevated this month (${leaveCount} requests).`,
            metric: `${leaveCount} requests`,
        });
    }
    const currentPayroll = Number((_a = currentPayrollAgg._sum.grossSalary) !== null && _a !== void 0 ? _a : 0);
    const previousPayroll = Number((_b = previousPayrollAgg._sum.grossSalary) !== null && _b !== void 0 ? _b : 0);
    const payrollGrowth = percentageChange(currentPayroll, previousPayroll);
    const revenueGrowth = percentageChange(currentRevenue, previousRevenue);
    if (payrollGrowth > revenueGrowth + 10) {
        insights.push({
            severity: "ALERT",
            title: "Payroll vs Revenue Mismatch",
            message: "Payroll is growing significantly faster than revenue.",
            metric: `Payroll ${payrollGrowth.toFixed(2)}% vs Revenue ${revenueGrowth.toFixed(2)}%`,
        });
    }
    else {
        insights.push({
            severity: "INFO",
            title: "Payroll Growth Alignment",
            message: "Payroll growth is within acceptable range compared to revenue growth.",
            metric: `Payroll ${payrollGrowth.toFixed(2)}% | Revenue ${revenueGrowth.toFixed(2)}%`,
        });
    }
    return insights;
});
const generateExecutiveInsights = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(organizationId === null || organizationId === void 0 ? void 0 : organizationId.trim())) {
        throw new Error("organizationId is required");
    }
    const [revenueInsights, expenseInsights, inventoryInsights, cashFlowInsights, hrInsights] = yield Promise.all([
        (0, exports.generateRevenueInsights)(organizationId),
        generateExpenseInsights(organizationId),
        generateInventoryInsights(organizationId),
        generateCashFlowInsights(organizationId),
        generateHRInsights(organizationId),
    ]);
    return {
        revenueInsights,
        expenseInsights,
        inventoryInsights,
        cashFlowInsights,
        hrInsights,
        generatedAt: new Date(),
    };
});
exports.generateExecutiveInsights = generateExecutiveInsights;
const severityRank = {
    ALERT: 4,
    WARNING: 3,
    INFO: 2,
    SUCCESS: 1,
};
const toNarrativeLine = (insight) => {
    if (insight.metric) {
        return `${insight.title}: ${insight.message} (${insight.metric})`;
    }
    return `${insight.title}: ${insight.message}`;
};
const getRevenueProjection = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = addMonths(currentMonthStart, -1);
    const twoMonthsAgoStart = addMonths(currentMonthStart, -2);
    const threeMonthsAgoStart = addMonths(currentMonthStart, -3);
    const [lastMonthRevenue, twoMonthsAgoRevenue, threeMonthsAgoRevenue] = yield Promise.all([
        getRevenueForRange(organizationId, previousMonthStart, currentMonthStart),
        getRevenueForRange(organizationId, twoMonthsAgoStart, previousMonthStart),
        getRevenueForRange(organizationId, threeMonthsAgoStart, twoMonthsAgoStart),
    ]);
    const momentumBase = (lastMonthRevenue + twoMonthsAgoRevenue + threeMonthsAgoRevenue) / 3;
    const latestGrowth = percentageChange(lastMonthRevenue, twoMonthsAgoRevenue);
    const growthFactor = 1 + latestGrowth / 100;
    const projected = momentumBase * (Number.isFinite(growthFactor) ? growthFactor : 1);
    if (!Number.isFinite(projected) || projected < 0) {
        return 0;
    }
    return toMoney(projected);
});
const getChurnRisk = (insights) => {
    const warningCount = [
        ...insights.revenueInsights,
        ...insights.cashFlowInsights,
        ...insights.expenseInsights,
    ].filter((insight) => insight.severity === "WARNING" || insight.severity === "ALERT").length;
    if (warningCount >= 5) {
        return "HIGH";
    }
    if (warningCount >= 2) {
        return "MEDIUM";
    }
    return "LOW";
};
const getCreditRiskScore = (insights) => {
    let score = 100;
    const allInsights = [
        ...insights.revenueInsights,
        ...insights.expenseInsights,
        ...insights.cashFlowInsights,
        ...insights.inventoryInsights,
        ...insights.hrInsights,
    ];
    for (const insight of allInsights) {
        if (insight.severity === "ALERT") {
            score -= 12;
        }
        else if (insight.severity === "WARNING") {
            score -= 6;
        }
    }
    if (score < 0) {
        return 0;
    }
    if (score > 100) {
        return 100;
    }
    return score;
};
const generateCEOReport = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(organizationId === null || organizationId === void 0 ? void 0 : organizationId.trim())) {
        throw new Error("organizationId is required");
    }
    const insights = yield (0, exports.generateExecutiveInsights)(organizationId);
    const forecast = yield getRevenueProjection(organizationId);
    const churnRisk = getChurnRisk(insights);
    const creditRiskScore = getCreditRiskScore(insights);
    const allInsights = [
        ...insights.revenueInsights,
        ...insights.expenseInsights,
        ...insights.cashFlowInsights,
        ...insights.inventoryInsights,
        ...insights.hrInsights,
    ];
    const prioritized = [...allInsights].sort((left, right) => severityRank[right.severity] - severityRank[left.severity]);
    const highlights = prioritized
        .filter((insight) => insight.severity === "SUCCESS" || insight.severity === "INFO")
        .slice(0, 4)
        .map(toNarrativeLine);
    const risks = prioritized
        .filter((insight) => insight.severity === "ALERT" || insight.severity === "WARNING")
        .slice(0, 5)
        .map(toNarrativeLine);
    const recommendations = [];
    if (risks.some((risk) => risk.includes("Cash Flow") || risk.includes("Receivables") || risk.includes("High-Risk Customer"))) {
        recommendations.push("Launch focused receivables recovery for delayed invoices and high-risk customers this week.");
    }
    if (risks.some((risk) => risk.includes("Revenue Drop") || risk.includes("Low-Performing Product"))) {
        recommendations.push("Run a product-level pricing and demand campaign for underperforming SKUs in the next cycle.");
    }
    if (risks.some((risk) => risk.includes("Expense") || risk.includes("Vendor Over-Dependence"))) {
        recommendations.push("Enforce expense approvals for high-growth categories and diversify top vendor exposure.");
    }
    if (risks.some((risk) => risk.includes("Dead Stock") || risk.includes("Overstock"))) {
        recommendations.push("Convert dead/overstock inventory through promotions or inter-warehouse rebalancing.");
    }
    if (risks.some((risk) => risk.includes("Overtime") || risk.includes("Payroll"))) {
        recommendations.push("Optimize staffing schedules to reduce overtime pressure and align payroll growth with revenue.");
    }
    if (recommendations.length === 0) {
        recommendations.push("Maintain current operating controls and monitor weekly KPI movement for early anomalies.");
    }
    const summary = [
        `Cambliss executive AI report generated for the latest cycle with ${risks.length} risk signal(s) and ${highlights.length} positive signal(s).`,
        `Forecasted next-month revenue is ₹${forecast.toFixed(2)}, customer churn risk is ${churnRisk}, and credit risk score is ${creditRiskScore}/100.`,
    ].join(" ");
    return {
        summary,
        highlights,
        risks,
        recommendations,
        predictiveSignals: {
            nextMonthRevenueForecast: forecast,
            customerChurnRisk: churnRisk,
            creditRiskScore,
        },
        insights,
        generatedAt: new Date(),
    };
});
exports.generateCEOReport = generateCEOReport;
