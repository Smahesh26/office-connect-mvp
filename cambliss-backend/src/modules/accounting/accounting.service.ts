import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma";
import { generateExecutiveInsights } from "../ai/insights.service";
import { generateExecutiveNarrativeDetailed } from "../ai/llm.service";

export class AccountingError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "AccountingError";
	}
}

export interface JournalEntryInput {
	ledgerAccountId: string;
	debit?: number;
	credit?: number;
}

interface CreateTransactionOptions {
	contactId?: string;
	totalAmount?: number;
	status?: "DRAFT" | "POSTED" | "PAID" | "REVERSED";
	transactionDate?: Date;
	tx?: Prisma.TransactionClient;
}

interface CreateAccountingPeriodInput {
	name: string;
	startDate: string;
	endDate: string;
}

type InvoicePdfTemplate = "classic" | "minimal" | "detailed";

const TRANSACTION_STATUSES = new Set(["DRAFT", "POSTED", "PAID", "REVERSED"]);
const INVOICE_PDF_TEMPLATES = new Set<InvoicePdfTemplate>(["classic", "minimal", "detailed"]);

const toMoney = (value: number): number => Number(value.toFixed(2));

const toDate = (value?: string): Date | undefined => {
	if (!value) {
		return undefined;
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw new AccountingError(400, `Invalid date: ${value}`);
	}

	return parsed;
};

const ensureOrganization = async (organizationId: string): Promise<void> => {
	const organization = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!organization) {
		throw new AccountingError(404, "Organization not found");
	}
};

const normalizeTransactionStatus = (status?: string): "DRAFT" | "POSTED" | "PAID" | "REVERSED" => {
	const normalized = (status ?? "POSTED").toUpperCase();
	if (!TRANSACTION_STATUSES.has(normalized)) {
		throw new AccountingError(400, "status must be one of DRAFT, POSTED, PAID, REVERSED");
	}

	return normalized as "DRAFT" | "POSTED" | "PAID" | "REVERSED";
};

const assertDateInUnlockedPeriod = async (
	db: Prisma.TransactionClient,
	organizationId: string,
	transactionDate: Date,
): Promise<void> => {
	const period = await db.accountingPeriod.findFirst({
		where: {
			organizationId,
			startDate: { lte: transactionDate },
			endDate: { gte: transactionDate },
		},
		select: { id: true, name: true, isLocked: true },
	});

	if (period?.isLocked) {
		throw new AccountingError(400, `Accounting period '${period.name}' is locked`);
	}
};

const ensureLedgerBelongsToOrg = async (ledgerId: string, organizationId: string) => {
	const ledger = await prisma.ledgerAccount.findUnique({
		where: { id: ledgerId },
		select: { id: true, organizationId: true, name: true, type: true },
	});

	if (!ledger) {
		throw new AccountingError(404, "Ledger account not found");
	}

	if (ledger.organizationId !== organizationId) {
		throw new AccountingError(403, "Ledger account does not belong to this organization");
	}

	return ledger;
};

const validateJournalEntries = (entries: JournalEntryInput[]): { totalDebit: number; totalCredit: number } => {
	if (!Array.isArray(entries) || entries.length < 2) {
		throw new AccountingError(400, "At least two journal entries are required");
	}

	let totalDebit = 0;
	let totalCredit = 0;

	for (const entry of entries) {
		if (!entry.ledgerAccountId?.trim()) {
			throw new AccountingError(400, "ledgerAccountId is required for each journal entry");
		}

		const debit = entry.debit ?? 0;
		const credit = entry.credit ?? 0;

		if (!Number.isFinite(debit) || !Number.isFinite(credit) || debit < 0 || credit < 0) {
			throw new AccountingError(400, "Journal debit/credit must be non-negative numbers");
		}

		if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
			throw new AccountingError(400, "Each journal line must have either debit or credit");
		}

		totalDebit += debit;
		totalCredit += credit;
	}

	const normalizedDebit = toMoney(totalDebit);
	const normalizedCredit = toMoney(totalCredit);

	if (normalizedDebit !== normalizedCredit) {
		throw new AccountingError(400, "Unbalanced journal entry");
	}

	return { totalDebit: normalizedDebit, totalCredit: normalizedCredit };
};

const createJournalEntriesEnforced = async (
	db: Prisma.TransactionClient,
	transactionId: string,
	entries: JournalEntryInput[],
): Promise<void> => {
	validateJournalEntries(entries);

	await db.journalEntry.createMany({
		data: entries.map((entry) => ({
			transactionId,
			ledgerAccountId: entry.ledgerAccountId,
			debit: entry.debit !== undefined ? toMoney(entry.debit) : undefined,
			credit: entry.credit !== undefined ? toMoney(entry.credit) : undefined,
		})),
	});
};

export const createTransactionWithEntries = async (
	organizationId: string,
	type: "SALE" | "PURCHASE" | "EXPENSE" | "PAYMENT" | "REFUND",
	referenceNumber: string | null,
	entries: JournalEntryInput[],
	options?: CreateTransactionOptions,
) => {
	await ensureOrganization(organizationId);
	const status = normalizeTransactionStatus(options?.status);
	const transactionDate = options?.transactionDate ?? new Date();

	const { totalDebit } = validateJournalEntries(entries);
	const transactionTotal =
		typeof options?.totalAmount === "number" ? toMoney(options.totalAmount) : toMoney(totalDebit);

	for (const entry of entries) {
		await ensureLedgerBelongsToOrg(entry.ledgerAccountId, organizationId);
	}

	const persist = async (tx: Prisma.TransactionClient) => {
		if (status !== "DRAFT") {
			await assertDateInUnlockedPeriod(tx, organizationId, transactionDate);
		}

		const transaction = await tx.transaction.create({
			data: {
				organizationId,
				type,
				referenceNumber: referenceNumber ?? undefined,
				contactId: options?.contactId,
				totalAmount: transactionTotal,
				status,
				transactionDate,
				postedAt: status === "DRAFT" ? null : new Date(),
			},
		});

		await createJournalEntriesEnforced(tx, transaction.id, entries);

		return transaction;
	};

	if (options?.tx) {
		return persist(options.tx);
	}

	return prisma.$transaction(async (tx) => persist(tx));
};

export interface CreateExpenseInput {
	referenceNumber?: string;
	contactId?: string;
	entries: JournalEntryInput[];
	totalAmount?: number;
}

export const createExpenseTransaction = async (organizationId: string, input: CreateExpenseInput) => {
	if (!Array.isArray(input.entries) || input.entries.length < 2) {
		throw new AccountingError(400, "entries must be a non-empty array");
	}

	return createTransactionWithEntries(
		organizationId,
		"EXPENSE",
		input.referenceNumber ?? null,
		input.entries,
		{
			contactId: input.contactId,
			totalAmount: input.totalAmount,
			status: "POSTED",
		},
	);
};

export const createAccountingPeriod = async (
	organizationId: string,
	input: CreateAccountingPeriodInput,
) => {
	await ensureOrganization(organizationId);

	if (!input.name?.trim()) {
		throw new AccountingError(400, "name is required");
	}

	const startDate = toDate(input.startDate);
	const endDate = toDate(input.endDate);
	if (!startDate || !endDate) {
		throw new AccountingError(400, "startDate and endDate are required");
	}

	if (startDate > endDate) {
		throw new AccountingError(400, "startDate cannot be after endDate");
	}

	const overlapping = await prisma.accountingPeriod.findFirst({
		where: {
			organizationId,
			startDate: { lte: endDate },
			endDate: { gte: startDate },
		},
		select: { id: true },
	});

	if (overlapping) {
		throw new AccountingError(409, "Accounting period overlaps with an existing period");
	}

	return prisma.accountingPeriod.create({
		data: {
			organizationId,
			name: input.name.trim(),
			startDate,
			endDate,
		},
	});
};

export const getAccountingPeriods = async (organizationId: string) => {
	await ensureOrganization(organizationId);

	return prisma.accountingPeriod.findMany({
		where: { organizationId },
		orderBy: [{ startDate: "desc" }, { endDate: "desc" }],
	});
};

export const setAccountingPeriodLock = async (
	organizationId: string,
	periodId: string,
	isLocked: boolean,
) => {
	await ensureOrganization(organizationId);

	const period = await prisma.accountingPeriod.findUnique({
		where: { id: periodId },
		select: { id: true, organizationId: true, isLocked: true },
	});

	if (!period) {
		throw new AccountingError(404, "Accounting period not found");
	}

	if (period.organizationId !== organizationId) {
		throw new AccountingError(403, "Accounting period does not belong to this organization");
	}

	if (period.isLocked === isLocked) {
		return prisma.accountingPeriod.findUnique({ where: { id: periodId } });
	}

	return prisma.accountingPeriod.update({
		where: { id: periodId },
		data: {
			isLocked,
			lockedAt: isLocked ? new Date() : null,
		},
	});
};

export const postTransaction = async (organizationId: string, transactionId: string) => {
	await ensureOrganization(organizationId);

	return prisma.$transaction(async (tx) => {
		const transaction = await tx.transaction.findUnique({
			where: { id: transactionId },
			include: { journalEntries: true },
		});

		if (!transaction) {
			throw new AccountingError(404, "Transaction not found");
		}

		if (transaction.organizationId !== organizationId) {
			throw new AccountingError(403, "Transaction does not belong to this organization");
		}

		if (transaction.status === "POSTED" || transaction.status === "PAID") {
			return transaction;
		}

		if (transaction.status === "REVERSED") {
			throw new AccountingError(400, "Reversed transactions cannot be posted");
		}

		if (!transaction.journalEntries.length) {
			throw new AccountingError(400, "Transaction has no journal entries");
		}

		const entries: JournalEntryInput[] = transaction.journalEntries.map((entry) => ({
			ledgerAccountId: entry.ledgerAccountId,
			debit: entry.debit ? Number(entry.debit) : 0,
			credit: entry.credit ? Number(entry.credit) : 0,
		}));
		validateJournalEntries(entries);

		await assertDateInUnlockedPeriod(tx, organizationId, transaction.transactionDate);

		return tx.transaction.update({
			where: { id: transaction.id },
			data: {
				status: "POSTED",
				postedAt: new Date(),
			},
		});
	});
};

export const createPaymentAllocation = async (
	organizationId: string,
	input: { transactionId: string; invoiceId: string; amount: number },
) => {
	await ensureOrganization(organizationId);

	if (!input.transactionId?.trim() || !input.invoiceId?.trim()) {
		throw new AccountingError(400, "transactionId and invoiceId are required");
	}

	const amount = toMoney(input.amount);
	if (!Number.isFinite(amount) || amount <= 0) {
		throw new AccountingError(400, "amount must be a positive number");
	}

	return prisma.$transaction(async (tx) => {
		const transaction = await tx.transaction.findUnique({
			where: { id: input.transactionId },
			select: { id: true, organizationId: true, type: true, status: true, totalAmount: true },
		});

		if (!transaction) {
			throw new AccountingError(404, "Transaction not found");
		}

		if (transaction.organizationId !== organizationId) {
			throw new AccountingError(403, "Transaction does not belong to this organization");
		}

		if (transaction.type !== "PAYMENT") {
			throw new AccountingError(400, "Only PAYMENT transactions can be allocated");
		}

		if (transaction.status !== "POSTED" && transaction.status !== "PAID") {
			throw new AccountingError(400, "Only posted payments can be allocated");
		}

		const invoice = await tx.invoice.findUnique({
			where: { id: input.invoiceId },
			select: { id: true, organizationId: true, totalAmount: true },
		});

		if (!invoice) {
			throw new AccountingError(404, "Invoice not found");
		}

		if (invoice.organizationId !== organizationId) {
			throw new AccountingError(403, "Invoice does not belong to this organization");
		}

		const existingAllocation = await tx.paymentAllocation.findUnique({
			where: {
				transactionId_invoiceId: {
					transactionId: transaction.id,
					invoiceId: invoice.id,
				},
			},
			select: { id: true },
		});

		if (existingAllocation) {
			throw new AccountingError(409, "Payment is already allocated to this invoice");
		}

		const [transactionAllocSum, invoiceAllocSum] = await Promise.all([
			tx.paymentAllocation.aggregate({
				where: { transactionId: transaction.id },
				_sum: { amount: true },
			}),
			tx.paymentAllocation.aggregate({
				where: { invoiceId: invoice.id },
				_sum: { amount: true },
			}),
		]);

		const transactionAllocated = Number(transactionAllocSum._sum.amount ?? 0);
		const invoiceAllocated = Number(invoiceAllocSum._sum.amount ?? 0);
		const transactionRemaining = toMoney(Number(transaction.totalAmount) - transactionAllocated);
		const invoiceRemaining = toMoney(Number(invoice.totalAmount) - invoiceAllocated);

		if (amount > transactionRemaining) {
			throw new AccountingError(400, "Allocation exceeds payment remaining amount");
		}

		if (amount > invoiceRemaining) {
			throw new AccountingError(400, "Allocation exceeds invoice outstanding amount");
		}

		const allocation = await tx.paymentAllocation.create({
			data: {
				organizationId,
				transactionId: transaction.id,
				invoiceId: invoice.id,
				amount,
			},
		});

		const newTransactionRemaining = toMoney(transactionRemaining - amount);
		if (newTransactionRemaining === 0 && transaction.status === "POSTED") {
			await tx.transaction.update({
				where: { id: transaction.id },
				data: { status: "PAID" },
			});
		}

		return allocation;
	});
};

export interface CreateLedgerAccountInput {
	name: string;
	type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
	code?: string;
	parentId?: string;
	isSystem?: boolean;
}

export const createLedgerAccount = async (organizationId: string, input: CreateLedgerAccountInput) => {
	await ensureOrganization(organizationId);

	if (!input.name?.trim()) {
		throw new AccountingError(400, "name is required");
	}

	if (input.code !== undefined && !input.code.trim()) {
		throw new AccountingError(400, "code cannot be empty");
	}

	if (input.parentId) {
		await ensureLedgerBelongsToOrg(input.parentId, organizationId);
	}

	return prisma.ledgerAccount.create({
		data: {
			organizationId,
			name: input.name.trim(),
			type: input.type,
			code: input.code?.trim(),
			parentId: input.parentId,
			isSystem: input.isSystem ?? false,
		},
		include: {
			parent: {
				select: {
					id: true,
					name: true,
					code: true,
				},
			},
			children: {
				select: {
					id: true,
					name: true,
					code: true,
					type: true,
				},
			},
		},
	});
};

export const getChartOfAccounts = async (organizationId: string) => {
	await ensureOrganization(organizationId);

	return prisma.ledgerAccount.findMany({
		where: { organizationId },
		include: {
			parent: {
				select: {
					id: true,
					name: true,
					code: true,
				},
			},
			children: {
				select: {
					id: true,
					name: true,
					code: true,
					type: true,
				},
			},
		},
		orderBy: [{ type: "asc" }, { code: "asc" }, { name: "asc" }],
	});
};

export const getTrialBalance = async (organizationId: string) => {
	await ensureOrganization(organizationId);

	const grouped = await prisma.journalEntry.groupBy({
		by: ["ledgerAccountId"],
		where: {
			transaction: {
				organizationId,
			},
		},
		_sum: {
			debit: true,
			credit: true,
		},
	});

	const ledgerIds = grouped.map((entry) => entry.ledgerAccountId);
	const ledgerAccounts = ledgerIds.length
		? await prisma.ledgerAccount.findMany({
				where: { id: { in: ledgerIds }, organizationId },
				select: { id: true, name: true, code: true, type: true },
			})
		: [];

	const ledgerMap = new Map(ledgerAccounts.map((ledger) => [ledger.id, ledger]));

	const ledgers = grouped
		.map((entry) => {
			const ledger = ledgerMap.get(entry.ledgerAccountId);
			if (!ledger) {
				return null;
			}

			const totalDebit = toMoney(Number(entry._sum.debit ?? 0));
			const totalCredit = toMoney(Number(entry._sum.credit ?? 0));
			const balance = toMoney(totalDebit - totalCredit);

			return {
				ledgerId: ledger.id,
				ledgerName: ledger.name,
				ledgerCode: ledger.code,
				ledgerType: ledger.type,
				totalDebit,
				totalCredit,
				balance,
			};
		})
		.filter((row): row is NonNullable<typeof row> => Boolean(row))
		.sort((a, b) => a.ledgerName.localeCompare(b.ledgerName));

	const totals = ledgers.reduce(
		(acc, row) => ({
			totalDebit: acc.totalDebit + row.totalDebit,
			totalCredit: acc.totalCredit + row.totalCredit,
		}),
		{ totalDebit: 0, totalCredit: 0 },
	);

	const grandTotalDebit = toMoney(totals.totalDebit);
	const grandTotalCredit = toMoney(totals.totalCredit);

	if (grandTotalDebit !== grandTotalCredit) {
		throw new AccountingError(500, "Trial balance mismatch: total debit does not equal total credit");
	}

	return {
		ledgers,
		grandTotalDebit,
		grandTotalCredit,
	};
};

export const getProfitAndLoss = async (organizationId: string, startDate?: string, endDate?: string) => {
	await ensureOrganization(organizationId);

	const start = toDate(startDate);
	const end = toDate(endDate);

	const entries = await prisma.journalEntry.findMany({
		where: {
			transaction: {
				organizationId,
				transactionDate: {
					gte: start,
					lte: end,
				},
			},
			ledgerAccount: {
				type: {
					in: ["INCOME", "EXPENSE"],
				},
			},
		},
		select: {
			debit: true,
			credit: true,
			ledgerAccount: {
				select: {
					id: true,
					name: true,
					code: true,
					type: true,
				},
			},
		},
	});

	const incomeMap = new Map<string, { name: string; code: string | null; amount: number }>();
	const expenseMap = new Map<string, { name: string; code: string | null; amount: number }>();

	for (const entry of entries) {
		const ledger = entry.ledgerAccount;
		const debit = Number(entry.debit ?? 0);
		const credit = Number(entry.credit ?? 0);

		if (ledger.type === "INCOME") {
			const amount = credit - debit;
			const current = incomeMap.get(ledger.id) ?? { name: ledger.name, code: ledger.code, amount: 0 };
			current.amount += amount;
			incomeMap.set(ledger.id, current);
		}

		if (ledger.type === "EXPENSE") {
			const amount = debit - credit;
			const current = expenseMap.get(ledger.id) ?? { name: ledger.name, code: ledger.code, amount: 0 };
			current.amount += amount;
			expenseMap.set(ledger.id, current);
		}
	}

	const incomeRows = Array.from(incomeMap.entries()).map(([ledgerId, value]) => ({
		ledgerId,
		ledgerName: value.name,
		ledgerCode: value.code,
		amount: toMoney(value.amount),
	})).sort((a, b) => b.amount - a.amount);

	const expenseRows = Array.from(expenseMap.entries()).map(([ledgerId, value]) => ({
		ledgerId,
		ledgerName: value.name,
		ledgerCode: value.code,
		amount: toMoney(value.amount),
	})).sort((a, b) => b.amount - a.amount);

	const totalIncome = toMoney(incomeRows.reduce((sum, row) => sum + row.amount, 0));
	const totalExpense = toMoney(expenseRows.reduce((sum, row) => sum + row.amount, 0));
	const netProfit = toMoney(totalIncome - totalExpense);

	return {
		period: {
			startDate: start ?? null,
			endDate: end ?? null,
		},
		incomeBreakdown: incomeRows,
		expenseBreakdown: expenseRows,
		income: incomeRows,
		expenses: expenseRows,
		totalIncome,
		totalExpense,
		netProfit,
	};
};

export const getBalanceSheet = async (organizationId: string, asOfDate?: string) => {
	await ensureOrganization(organizationId);

	const asOf = toDate(asOfDate) ?? new Date();

	const grouped = await prisma.journalEntry.groupBy({
		by: ["ledgerAccountId"],
		where: {
			transaction: {
				organizationId,
				transactionDate: {
					lte: asOf,
				},
			},
		},
		_sum: {
			debit: true,
			credit: true,
		},
	});

	const ledgerIds = grouped.map((entry) => entry.ledgerAccountId);
	const ledgers = ledgerIds.length
		? await prisma.ledgerAccount.findMany({
				where: { id: { in: ledgerIds }, organizationId },
				select: { id: true, name: true, code: true, type: true },
			})
		: [];

	const ledgerMap = new Map(ledgers.map((ledger) => [ledger.id, ledger]));

	const assets: Array<{ ledgerId: string; ledgerName: string; ledgerCode: string | null; balance: number }> = [];
	const liabilities: Array<{ ledgerId: string; ledgerName: string; ledgerCode: string | null; balance: number }> = [];
	const equity: Array<{ ledgerId: string; ledgerName: string; ledgerCode: string | null; balance: number }> = [];

	for (const row of grouped) {
		const ledger = ledgerMap.get(row.ledgerAccountId);
		if (!ledger) {
			continue;
		}

		const debit = Number(row._sum.debit ?? 0);
		const credit = Number(row._sum.credit ?? 0);
		let balance = 0;

		if (ledger.type === "ASSET") {
			balance = toMoney(debit - credit);
			assets.push({ ledgerId: ledger.id, ledgerName: ledger.name, ledgerCode: ledger.code, balance });
		} else if (ledger.type === "LIABILITY") {
			balance = toMoney(credit - debit);
			liabilities.push({ ledgerId: ledger.id, ledgerName: ledger.name, ledgerCode: ledger.code, balance });
		} else if (ledger.type === "EQUITY") {
			balance = toMoney(credit - debit);
			equity.push({ ledgerId: ledger.id, ledgerName: ledger.name, ledgerCode: ledger.code, balance });
		}
	}

	const incomeAndExpense = await prisma.journalEntry.findMany({
		where: {
			transaction: {
				organizationId,
				transactionDate: {
					lte: asOf,
				},
			},
			ledgerAccount: {
				type: {
					in: ["INCOME", "EXPENSE"],
				},
			},
		},
		select: {
			debit: true,
			credit: true,
			ledgerAccount: {
				select: {
					type: true,
				},
			},
		},
	});

	let totalIncome = 0;
	let totalExpense = 0;

	for (const entry of incomeAndExpense) {
		const debit = Number(entry.debit ?? 0);
		const credit = Number(entry.credit ?? 0);

		if (entry.ledgerAccount.type === "INCOME") {
			totalIncome += credit - debit;
		}

		if (entry.ledgerAccount.type === "EXPENSE") {
			totalExpense += debit - credit;
		}
	}

	const currentEarnings = toMoney(totalIncome - totalExpense);

	if (currentEarnings !== 0) {
		equity.push({
			ledgerId: "CURRENT_EARNINGS",
			ledgerName: "Current Earnings",
			ledgerCode: null,
			balance: currentEarnings,
		});
	}

	const totalAssets = toMoney(assets.reduce((sum, row) => sum + row.balance, 0));
	const totalLiabilities = toMoney(liabilities.reduce((sum, row) => sum + row.balance, 0));
	const totalEquity = toMoney(equity.reduce((sum, row) => sum + row.balance, 0));
	const isBalanced = totalAssets === toMoney(totalLiabilities + totalEquity);

	if (!isBalanced) {
		throw new Error(
			`Balance Sheet does not balance. Assets: ${totalAssets}, Liabilities: ${totalLiabilities}, Equity: ${totalEquity}. Expected Assets = Liabilities + Equity.`
		);
	}

	return {
		asOfDate: asOf,
		assets,
		liabilities,
		equity,
		totalAssets,
		totalLiabilities,
		totalEquity,
		isBalanced,
	};
};

export const getGeneralLedger = async (
	organizationId: string,
	ledgerAccountId: string,
	startDate?: string,
	endDate?: string,
) => {
	await ensureOrganization(organizationId);
	const ledger = await ensureLedgerBelongsToOrg(ledgerAccountId, organizationId);

	const start = toDate(startDate);
	const end = toDate(endDate);

	if (start && end && start > end) {
		throw new AccountingError(400, "startDate cannot be after endDate");
	}

	const balanceDelta = (debit: number, credit: number): number => {
		if (ledger.type === "ASSET" || ledger.type === "EXPENSE") {
			return toMoney(debit - credit);
		}

		return toMoney(credit - debit);
	};

	const openingSums = await prisma.journalEntry.aggregate({
		where: {
			ledgerAccountId,
			transaction: {
				organizationId,
				...(start
					? {
						transactionDate: {
							lt: start,
						},
					}
					: {}),
			},
		},
		_sum: {
			debit: true,
			credit: true,
		},
	});

	const openingBalance = balanceDelta(
		Number(openingSums._sum.debit ?? 0),
		Number(openingSums._sum.credit ?? 0),
	);

	const entries = await prisma.journalEntry.findMany({
		where: {
			ledgerAccountId,
			transaction: {
				organizationId,
				...(start || end
					? {
						transactionDate: {
							...(start ? { gte: start } : {}),
							...(end ? { lte: end } : {}),
						},
					}
					: {}),
			},
		},
		select: {
			debit: true,
			credit: true,
			transaction: {
				select: {
					transactionDate: true,
				},
			},
		},
		orderBy: [
			{
				transaction: {
					transactionDate: "asc",
				},
			},
			{ id: "asc" },
		],
	});

	let runningBalance = openingBalance;
	const mappedEntries = entries.map((entry) => {
		const debit = toMoney(Number(entry.debit ?? 0));
		const credit = toMoney(Number(entry.credit ?? 0));
		runningBalance = toMoney(runningBalance + balanceDelta(debit, credit));

		return {
			date: entry.transaction.transactionDate,
			debit,
			credit,
			runningBalance,
		};
	});

	return {
		ledgerName: ledger.name,
		openingBalance,
		period: {
			startDate: start ?? null,
			endDate: end ?? null,
		},
		entries: mappedEntries,
	};
};

const SYSTEM_LEDGERS = {
	AR: { name: "Accounts Receivable", type: "ASSET" as const },
	AP: { name: "Accounts Payable", type: "LIABILITY" as const },
	CASH: { name: "Cash / Bank", type: "ASSET" as const },
	REVENUE: { name: "Revenue", type: "INCOME" as const },
	EXPENSE: { name: "Expense", type: "EXPENSE" as const },
	INVENTORY: { name: "Inventory", type: "ASSET" as const },
};

const ensureSystemAccounts = async (organizationId: string) => {
	const systemAccounts = await prisma.ledgerAccount.findMany({
		where: {
			organizationId,
			isSystem: true,
		},
		select: { name: true },
	});

	const existingNames = new Set(systemAccounts.map((a) => a.name));

	for (const [, { name, type }] of Object.entries(SYSTEM_LEDGERS)) {
		if (!existingNames.has(name)) {
			await prisma.ledgerAccount.create({
				data: {
					organizationId,
					name,
					type,
					isSystem: true,
				},
			});
		}
	}
};

const getSystemLedger = async (organizationId: string, ledgerName: string) => {
	const ledger = await prisma.ledgerAccount.findFirst({
		where: {
			organizationId,
			name: ledgerName,
			isSystem: true,
		},
		select: { id: true, name: true, type: true },
	});

	if (!ledger) {
		throw new AccountingError(500, `System ledger account '${ledgerName}' not found`);
	}

	return ledger;
};

export const getAccountsReceivable = async (organizationId: string) => {
	await ensureOrganization(organizationId);
	await ensureSystemAccounts(organizationId);

	const arLedger = await getSystemLedger(organizationId, SYSTEM_LEDGERS.AR.name);

	const entries = await prisma.journalEntry.aggregate({
		where: {
			ledgerAccountId: arLedger.id,
			transaction: {
				organizationId,
			},
		},
		_sum: {
			debit: true,
			credit: true,
		},
	});

	const totalDebit = Number(entries._sum.debit ?? 0);
	const totalCredit = Number(entries._sum.credit ?? 0);
	const outstandingAmount = toMoney(totalDebit - totalCredit);

	return {
		ledgerName: arLedger.name,
		totalDebits: toMoney(totalDebit),
		totalCredits: toMoney(totalCredit),
		outstandingAmount: Math.max(0, outstandingAmount),
	};
};

export const getAccountsPayable = async (organizationId: string) => {
	await ensureOrganization(organizationId);
	await ensureSystemAccounts(organizationId);

	const apLedger = await getSystemLedger(organizationId, SYSTEM_LEDGERS.AP.name);

	const entries = await prisma.journalEntry.aggregate({
		where: {
			ledgerAccountId: apLedger.id,
			transaction: {
				organizationId,
			},
		},
		_sum: {
			debit: true,
			credit: true,
		},
	});

	const totalDebit = Number(entries._sum.debit ?? 0);
	const totalCredit = Number(entries._sum.credit ?? 0);
	const outstandingAmount = toMoney(totalCredit - totalDebit);

	return {
		ledgerName: apLedger.name,
		totalDebits: toMoney(totalDebit),
		totalCredits: toMoney(totalCredit),
		outstandingAmount: Math.max(0, outstandingAmount),
	};
};

export const recordCustomerPayment = async (
	organizationId: string,
	customerId: string,
	amount: number,
	referenceNumber?: string,
) => {
	await ensureOrganization(organizationId);
	const normalizedAmount = toMoney(amount);

	if (normalizedAmount <= 0) {
		throw new AccountingError(400, "Payment amount must be positive");
	}

	const arLedger = await getSystemLedger(organizationId, SYSTEM_LEDGERS.AR.name);
	const cashLedger = await getSystemLedger(organizationId, SYSTEM_LEDGERS.CASH.name);

	return createTransactionWithEntries(
		organizationId,
		"PAYMENT",
		referenceNumber ?? `CUST-PAY-${Date.now()}`,
		[
			{ ledgerAccountId: cashLedger.id, debit: normalizedAmount },
			{ ledgerAccountId: arLedger.id, credit: normalizedAmount },
		],
		{ contactId: customerId, totalAmount: normalizedAmount },
	);
};

export const recordVendorPayment = async (
	organizationId: string,
	vendorId: string,
	amount: number,
	referenceNumber?: string,
) => {
	await ensureOrganization(organizationId);
	const normalizedAmount = toMoney(amount);

	if (normalizedAmount <= 0) {
		throw new AccountingError(400, "Payment amount must be positive");
	}

	const apLedger = await getSystemLedger(organizationId, SYSTEM_LEDGERS.AP.name);
	const cashLedger = await getSystemLedger(organizationId, SYSTEM_LEDGERS.CASH.name);

	return createTransactionWithEntries(
		organizationId,
		"PAYMENT",
		referenceNumber ?? `VEND-PAY-${Date.now()}`,
		[
			{ ledgerAccountId: apLedger.id, debit: normalizedAmount },
			{ ledgerAccountId: cashLedger.id, credit: normalizedAmount },
		],
		{ contactId: vendorId, totalAmount: normalizedAmount },
	);
};

export const getFinanceDashboard = async (
	organizationId: string,
	month?: number,
	year?: number,
) => {
	await ensureOrganization(organizationId);
	await ensureSystemAccounts(organizationId);

	const now = new Date();
	const targetMonth = month ?? now.getMonth() + 1;
	const targetYear = year ?? now.getFullYear();

	const monthStart = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
	const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

	const lastMonthStart = new Date(targetYear, targetMonth - 2, 1, 0, 0, 0, 0);
	const lastMonthEnd = new Date(targetYear, targetMonth - 1, 0, 23, 59, 59, 999);

	const [pnl, lastMonthPnl, ar, ap, cashLedger, expenseLedger] = await Promise.all([
		getProfitAndLoss(organizationId, monthStart.toISOString(), monthEnd.toISOString()),
		getProfitAndLoss(organizationId, lastMonthStart.toISOString(), lastMonthEnd.toISOString()),
		getAccountsReceivable(organizationId),
		getAccountsPayable(organizationId),
		getSystemLedger(organizationId, SYSTEM_LEDGERS.CASH.name),
		getSystemLedger(organizationId, SYSTEM_LEDGERS.EXPENSE.name),
	]);

	const cashEntries = await prisma.journalEntry.aggregate({
		where: {
			ledgerAccountId: cashLedger.id,
			transaction: {
				organizationId,
			},
		},
		_sum: {
			debit: true,
			credit: true,
		},
	});

	const payrollEntries = await prisma.journalEntry.aggregate({
		where: {
			ledgerAccountId: expenseLedger.id,
			transaction: {
				organizationId,
				transactionDate: {
					gte: monthStart,
					lte: monthEnd,
				},
			},
		},
		_sum: {
			debit: true,
			credit: true,
		},
	});

	const cashBalance = toMoney(
		Number(cashEntries._sum.debit ?? 0) - Number(cashEntries._sum.credit ?? 0),
	);

	const payrollCost = toMoney(Number(payrollEntries._sum.debit ?? 0));

	const inventoryRows = await prisma.stockItem.findMany({
		where: {
			warehouse: {
				organizationId,
			},
		},
		select: {
			quantity: true,
			product: {
				select: {
					costPrice: true,
				},
			},
		},
	});

	const inventoryValue = toMoney(
		inventoryRows.reduce((sum, item) => sum + item.quantity * Number(item.product.costPrice ?? 0), 0),
	);

	const lastMonthRevenue = lastMonthPnl.totalIncome;
	const monthlyGrowthPercent =
		lastMonthRevenue === 0
			? 0
			: toMoney((((pnl.totalIncome - lastMonthRevenue) / lastMonthRevenue) * 100));

	const executiveInsights = await generateExecutiveInsights(organizationId);

	const toRiskLines = (entries: Array<{ title: string; message: string; severity: string }>) =>
		entries
			.filter((entry) => entry.severity === "ALERT" || entry.severity === "WARNING")
			.slice(0, 5)
			.map((entry) => `${entry.title}: ${entry.message}`);

	const executiveNarrativeResult = await generateExecutiveNarrativeDetailed({
		revenueGrowthPercent: monthlyGrowthPercent,
		netProfit: pnl.netProfit,
		outstandingReceivables: ar.outstandingAmount,
		cashBalance,
		inventoryAlerts: toRiskLines(executiveInsights.inventoryInsights),
		hrAlerts: toRiskLines(executiveInsights.hrInsights),
		cashFlowRisks: toRiskLines(executiveInsights.cashFlowInsights),
		expenseAlerts: toRiskLines(executiveInsights.expenseInsights),
		revenueHighlights: executiveInsights.revenueInsights
			.filter((entry) => entry.severity === "SUCCESS" || entry.severity === "INFO")
			.slice(0, 5)
			.map((entry) => `${entry.title}: ${entry.message}`),
	});

	return {
		// Period
		month: targetMonth,
		year: targetYear,
		// P&L
		revenue: pnl.totalIncome,
		expenses: pnl.totalExpense,
		netProfit: pnl.netProfit,
		// Payroll
		payrollCost,
		// Cash Flow
		cashBalance,
		outstandingReceivables: ar.outstandingAmount,
		outstandingPayables: ap.outstandingAmount,
		// Assets
		inventoryValue,
		// Metrics
		monthlyGrowthPercent,
		// Working Capital
		workingCapital: toMoney(cashBalance + ar.outstandingAmount - ap.outstandingAmount),
		// Executive AI Layer
		executiveInsights,
		executiveNarrative: executiveNarrativeResult.content,
		llmStatus: executiveNarrativeResult.mode,
		llmModel: executiveNarrativeResult.model,
	};
};

export const getAccountingPreferences = async (organizationId: string) => {
	await ensureOrganization(organizationId);

	const rows = await prisma.$queryRaw<Array<{ defaultInvoicePdfTemplate: string | null }>>`
		SELECT "defaultInvoicePdfTemplate"
		FROM "Organization"
		WHERE "id" = ${organizationId}
		LIMIT 1
	`;

	if (!rows.length) {
		throw new AccountingError(404, "Organization not found");
	}

	const template = (rows[0].defaultInvoicePdfTemplate ?? "classic") as InvoicePdfTemplate;
	return {
		defaultInvoicePdfTemplate: INVOICE_PDF_TEMPLATES.has(template) ? template : "classic",
	};
};

export const setAccountingPreferences = async (
	organizationId: string,
	input: { defaultInvoicePdfTemplate?: string },
) => {
	await ensureOrganization(organizationId);

	if (!input.defaultInvoicePdfTemplate) {
		throw new AccountingError(400, "defaultInvoicePdfTemplate is required");
	}

	const normalized = input.defaultInvoicePdfTemplate.toLowerCase();
	if (!INVOICE_PDF_TEMPLATES.has(normalized as InvoicePdfTemplate)) {
		throw new AccountingError(400, "defaultInvoicePdfTemplate must be one of classic, minimal, detailed");
	}

	await prisma.$executeRaw`
		UPDATE "Organization"
		SET "defaultInvoicePdfTemplate" = ${normalized}
		WHERE "id" = ${organizationId}
	`;

	return {
		defaultInvoicePdfTemplate: normalized as InvoicePdfTemplate,
	};
};
