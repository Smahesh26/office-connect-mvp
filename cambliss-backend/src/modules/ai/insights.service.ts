import prisma from "../../config/prisma";

type InsightSeverity = "INFO" | "SUCCESS" | "WARNING" | "ALERT";

export interface Insight {
	severity: InsightSeverity;
	title: string;
	message: string;
	metric?: string;
}

export interface ExecutiveInsights {
	revenueInsights: Insight[];
	expenseInsights: Insight[];
	inventoryInsights: Insight[];
	cashFlowInsights: Insight[];
	hrInsights: Insight[];
	generatedAt: Date;
}

export interface CEOReport {
	summary: string;
	highlights: string[];
	risks: string[];
	recommendations: string[];
	predictiveSignals: {
		nextMonthRevenueForecast: number;
		customerChurnRisk: "LOW" | "MEDIUM" | "HIGH";
		creditRiskScore: number;
	};
	insights: ExecutiveInsights;
	generatedAt: Date;
}

const toMoney = (value: number): number => Number(value.toFixed(2));

const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);

const endOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);

const addMonths = (date: Date, delta: number): Date =>
	new Date(date.getFullYear(), date.getMonth() + delta, 1, 0, 0, 0, 0);

const percentageChange = (current: number, previous: number): number => {
	if (previous === 0) {
		return current > 0 ? 100 : 0;
	}

	return toMoney(((current - previous) / previous) * 100);
};

const getRevenueForRange = async (organizationId: string, from: Date, to: Date): Promise<number> => {
	const aggregate = await prisma.invoice.aggregate({
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

	return toMoney(Number(aggregate._sum.totalAmount ?? 0));
};

export const generateRevenueInsights = async (organizationId: string): Promise<Insight[]> => {
	const now = new Date();
	const thisMonthStart = startOfMonth(now);
	const thisMonthEnd = endOfMonth(now);
	const prevMonthStart = addMonths(thisMonthStart, -1);
	const prevMonthEnd = thisMonthStart;

	const [currentRevenue, previousRevenue] = await Promise.all([
		getRevenueForRange(organizationId, thisMonthStart, thisMonthEnd),
		getRevenueForRange(organizationId, prevMonthStart, prevMonthEnd),
	]);

	const growthPct = percentageChange(currentRevenue, previousRevenue);
	const insights: Insight[] = [
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

	const topProducts = await prisma.invoiceItem.groupBy({
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

	const lowProducts = await prisma.invoiceItem.groupBy({
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
		? await prisma.product.findMany({
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
			message: `${bestProduct?.name ?? "Unknown Product"} (${bestProduct?.sku ?? "N/A"}) has highest sales in last 3 months.`,
			metric: `${top._sum.quantity ?? 0} units`,
		});
	}

	if (lowProducts.length > 0) {
		const low = lowProducts[0];
		const lowProduct = productMap.get(low.productId);
		insights.push({
			severity: "WARNING",
			title: "Low-Performing Product",
			message: `${lowProduct?.name ?? "Unknown Product"} (${lowProduct?.sku ?? "N/A"}) has the lowest movement in last 3 months.`,
			metric: `${low._sum.quantity ?? 0} units`,
		});
	}

	const stores = await prisma.store.findMany({
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
};

const generateExpenseInsights = async (organizationId: string): Promise<Insight[]> => {
	const now = new Date();
	const thisMonthStart = startOfMonth(now);
	const thisMonthEnd = endOfMonth(now);
	const prevMonthStart = addMonths(thisMonthStart, -1);

	const [currentExpenseAgg, previousExpenseAgg] = await Promise.all([
		prisma.transaction.aggregate({
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
		prisma.transaction.aggregate({
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

	const currentExpense = Number(currentExpenseAgg._sum.totalAmount ?? 0);
	const previousExpense = Number(previousExpenseAgg._sum.totalAmount ?? 0);
	const expenseGrowthPct = percentageChange(currentExpense, previousExpense);

	const insights: Insight[] = [
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

	const categorySums = await prisma.journalEntry.groupBy({
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
		const topCategory = await prisma.ledgerAccount.findUnique({
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
			message: `${topCategory?.name ?? "Unknown Ledger"} has the largest expense outflow recently.`,
			metric: `₹${toMoney(Number(categorySums[0]._sum.debit ?? 0)).toFixed(2)}`,
		});
	}

	const vendorSpend = await prisma.transaction.groupBy({
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

	const totalVendorSpend = vendorSpend.reduce((sum, item) => sum + Number(item._sum.totalAmount ?? 0), 0);
	if (vendorSpend.length > 0 && totalVendorSpend > 0 && vendorSpend[0].contactId) {
		const topVendorShare = (Number(vendorSpend[0]._sum.totalAmount ?? 0) / totalVendorSpend) * 100;
		const topVendor = await prisma.contact.findUnique({
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
			const vendorName =
				topVendor?.companyName ||
				[topVendor?.firstName, topVendor?.lastName].filter(Boolean).join(" ") ||
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
};

const generateCashFlowInsights = async (organizationId: string): Promise<Insight[]> => {
	const now = new Date();
	const thisMonthStart = startOfMonth(now);
	const thisMonthEnd = endOfMonth(now);

	const [monthlyRevenue, unpaidInvoiceAgg, unpaidInvoices] = await Promise.all([
		getRevenueForRange(organizationId, thisMonthStart, thisMonthEnd),
		prisma.invoice.aggregate({
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
		prisma.invoice.findMany({
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

	const outstanding = Number(unpaidInvoiceAgg._sum.totalAmount ?? 0);
	const receivableRatio = monthlyRevenue > 0 ? (outstanding / monthlyRevenue) * 100 : outstanding > 0 ? 100 : 0;

	const insights: Insight[] = [
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

	const [unpaidByCustomer, delayedByCustomer] = await Promise.all([
		prisma.invoice.groupBy({
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
		prisma.invoice.groupBy({
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
		.filter((id): id is string => Boolean(id));

	if (riskyCustomerIds.length > 0 && outstanding > 0) {
		const customers = await prisma.contact.findMany({
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

		const customerMap = new Map(
			customers.map((customer) => [
				customer.id,
				customer.companyName || [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Customer",
			]),
		);

		const delayedMap = new Map(
			delayedByCustomer
				.filter((entry) => entry.customerId)
				.map((entry) => [entry.customerId as string, entry._count._all]),
		);

		const topRisk = unpaidByCustomer.find((entry) => {
			if (!entry.customerId) {
				return false;
			}

			const outstandingShare = (Number(entry._sum.totalAmount ?? 0) / outstanding) * 100;
			const delayedInvoices = delayedMap.get(entry.customerId) ?? 0;
			return outstandingShare >= 25 || delayedInvoices >= 2 || entry._count._all >= 3;
		});

		if (topRisk?.customerId) {
			const riskyName = customerMap.get(topRisk.customerId) ?? "Customer";
			const riskAmount = Number(topRisk._sum.totalAmount ?? 0);
			const riskShare = (riskAmount / outstanding) * 100;
			const delayedInvoices = delayedMap.get(topRisk.customerId) ?? 0;

			insights.push({
				severity: "WARNING",
				title: "High-Risk Customer",
				message: `${riskyName} has elevated receivable risk from unpaid and/or delayed invoices.`,
				metric: `₹${toMoney(riskAmount).toFixed(2)} (${toMoney(riskShare).toFixed(2)}%), delayed: ${delayedInvoices}`,
			});
		}
	}

	return insights;
};

const generateInventoryInsights = async (organizationId: string): Promise<Insight[]> => {
	const now = new Date();
	const sixtyDaysAgo = new Date(now);
	sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

	const thirtyDaysAgo = new Date(now);
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const [products, recentSales, stockItems] = await Promise.all([
		prisma.product.findMany({
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
		prisma.stockMovement.groupBy({
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
		prisma.stockItem.findMany({
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

	const insights: Insight[] = [];

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
			message: `${fastProduct?.name ?? "Unknown Product"} is the fastest-moving SKU in the last 30 days.`,
			metric: `${fast._sum.quantity ?? 0} units`,
		});
	}

	const stockByProduct = new Map<string, number>();
	for (const stock of stockItems) {
		stockByProduct.set(stock.productId, (stockByProduct.get(stock.productId) ?? 0) + stock.quantity);
	}

	const soldByProduct = new Map<string, number>();
	for (const sale of recentSales) {
		soldByProduct.set(sale.productId, Number(sale._sum.quantity ?? 0));
	}

	const overstockProducts = products.filter((product) => {
		const stock = stockByProduct.get(product.id) ?? 0;
		const sold = soldByProduct.get(product.id) ?? 0;
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
		const stock = stockByProduct.get(product.id) ?? 0;
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
};

const generateHRInsights = async (organizationId: string): Promise<Insight[]> => {
	const now = new Date();
	const thisMonthStart = startOfMonth(now);
	const thisMonthEnd = endOfMonth(now);
	const prevMonthStart = addMonths(thisMonthStart, -1);

	const [attendanceRecords, leaveCount, currentPayrollAgg, previousPayrollAgg, currentRevenue, previousRevenue] =
		await Promise.all([
			prisma.attendance.findMany({
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
			prisma.leaveRequest.count({
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
			prisma.payslip.aggregate({
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
			prisma.payslip.aggregate({
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

	const insights: Insight[] = [];

	const totalAttendance = attendanceRecords.length;
	const lateCount = attendanceRecords.filter((attendance) => attendance.isLate).length;
	const lateRate = totalAttendance > 0 ? (lateCount / totalAttendance) * 100 : 0;

	const totalOvertimeHours = attendanceRecords.reduce(
		(sum, attendance) => sum + Number(attendance.overtimeHours ?? 0),
		0,
	);
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

	const currentPayroll = Number(currentPayrollAgg._sum.grossSalary ?? 0);
	const previousPayroll = Number(previousPayrollAgg._sum.grossSalary ?? 0);
	const payrollGrowth = percentageChange(currentPayroll, previousPayroll);
	const revenueGrowth = percentageChange(currentRevenue, previousRevenue);

	if (payrollGrowth > revenueGrowth + 10) {
		insights.push({
			severity: "ALERT",
			title: "Payroll vs Revenue Mismatch",
			message: "Payroll is growing significantly faster than revenue.",
			metric: `Payroll ${payrollGrowth.toFixed(2)}% vs Revenue ${revenueGrowth.toFixed(2)}%`,
		});
	} else {
		insights.push({
			severity: "INFO",
			title: "Payroll Growth Alignment",
			message: "Payroll growth is within acceptable range compared to revenue growth.",
			metric: `Payroll ${payrollGrowth.toFixed(2)}% | Revenue ${revenueGrowth.toFixed(2)}%`,
		});
	}

	return insights;
};

export const generateExecutiveInsights = async (organizationId: string): Promise<ExecutiveInsights> => {
	if (!organizationId?.trim()) {
		throw new Error("organizationId is required");
	}

	const [revenueInsights, expenseInsights, inventoryInsights, cashFlowInsights, hrInsights] = await Promise.all([
		generateRevenueInsights(organizationId),
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
};

const severityRank: Record<InsightSeverity, number> = {
	ALERT: 4,
	WARNING: 3,
	INFO: 2,
	SUCCESS: 1,
};

const toNarrativeLine = (insight: Insight): string => {
	if (insight.metric) {
		return `${insight.title}: ${insight.message} (${insight.metric})`;
	}

	return `${insight.title}: ${insight.message}`;
};

const getRevenueProjection = async (organizationId: string): Promise<number> => {
	const now = new Date();
	const currentMonthStart = startOfMonth(now);
	const previousMonthStart = addMonths(currentMonthStart, -1);
	const twoMonthsAgoStart = addMonths(currentMonthStart, -2);
	const threeMonthsAgoStart = addMonths(currentMonthStart, -3);

	const [lastMonthRevenue, twoMonthsAgoRevenue, threeMonthsAgoRevenue] = await Promise.all([
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
};

const getChurnRisk = (insights: ExecutiveInsights): "LOW" | "MEDIUM" | "HIGH" => {
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

const getCreditRiskScore = (insights: ExecutiveInsights): number => {
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
		} else if (insight.severity === "WARNING") {
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

export const generateCEOReport = async (organizationId: string): Promise<CEOReport> => {
	if (!organizationId?.trim()) {
		throw new Error("organizationId is required");
	}

	const insights = await generateExecutiveInsights(organizationId);
	const forecast = await getRevenueProjection(organizationId);
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

	const recommendations: string[] = [];

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
};
