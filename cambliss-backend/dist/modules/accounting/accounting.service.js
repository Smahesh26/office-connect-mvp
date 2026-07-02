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
exports.setAccountingPreferences = exports.getAccountingPreferences = exports.getFinanceDashboard = exports.recordVendorPayment = exports.recordCustomerPayment = exports.getAccountsPayable = exports.getAccountsReceivable = exports.getGeneralLedger = exports.getBalanceSheet = exports.getProfitAndLoss = exports.getTrialBalance = exports.getChartOfAccounts = exports.createLedgerAccount = exports.createPaymentAllocation = exports.postTransaction = exports.setAccountingPeriodLock = exports.getAccountingPeriods = exports.createAccountingPeriod = exports.createExpenseTransaction = exports.createTransactionWithEntries = exports.AccountingError = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const insights_service_1 = require("../ai/insights.service");
const llm_service_1 = require("../ai/llm.service");
class AccountingError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AccountingError";
    }
}
exports.AccountingError = AccountingError;
const TRANSACTION_STATUSES = new Set(["DRAFT", "POSTED", "PAID", "REVERSED"]);
const INVOICE_PDF_TEMPLATES = new Set(["classic", "minimal", "detailed"]);
const toMoney = (value) => Number(value.toFixed(2));
const toDate = (value) => {
    if (!value) {
        return undefined;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new AccountingError(400, `Invalid date: ${value}`);
    }
    return parsed;
};
const ensureOrganization = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const organization = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!organization) {
        throw new AccountingError(404, "Organization not found");
    }
});
const normalizeTransactionStatus = (status) => {
    const normalized = (status !== null && status !== void 0 ? status : "POSTED").toUpperCase();
    if (!TRANSACTION_STATUSES.has(normalized)) {
        throw new AccountingError(400, "status must be one of DRAFT, POSTED, PAID, REVERSED");
    }
    return normalized;
};
const assertDateInUnlockedPeriod = (db, organizationId, transactionDate) => __awaiter(void 0, void 0, void 0, function* () {
    const period = yield db.accountingPeriod.findFirst({
        where: {
            organizationId,
            startDate: { lte: transactionDate },
            endDate: { gte: transactionDate },
        },
        select: { id: true, name: true, isLocked: true },
    });
    if (period === null || period === void 0 ? void 0 : period.isLocked) {
        throw new AccountingError(400, `Accounting period '${period.name}' is locked`);
    }
});
const ensureLedgerBelongsToOrg = (ledgerId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const ledger = yield prisma_1.default.ledgerAccount.findUnique({
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
});
const validateJournalEntries = (entries) => {
    var _a, _b, _c;
    if (!Array.isArray(entries) || entries.length < 2) {
        throw new AccountingError(400, "At least two journal entries are required");
    }
    let totalDebit = 0;
    let totalCredit = 0;
    for (const entry of entries) {
        if (!((_a = entry.ledgerAccountId) === null || _a === void 0 ? void 0 : _a.trim())) {
            throw new AccountingError(400, "ledgerAccountId is required for each journal entry");
        }
        const debit = (_b = entry.debit) !== null && _b !== void 0 ? _b : 0;
        const credit = (_c = entry.credit) !== null && _c !== void 0 ? _c : 0;
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
const createJournalEntriesEnforced = (db, transactionId, entries) => __awaiter(void 0, void 0, void 0, function* () {
    validateJournalEntries(entries);
    yield db.journalEntry.createMany({
        data: entries.map((entry) => ({
            transactionId,
            ledgerAccountId: entry.ledgerAccountId,
            debit: entry.debit !== undefined ? toMoney(entry.debit) : undefined,
            credit: entry.credit !== undefined ? toMoney(entry.credit) : undefined,
        })),
    });
});
const createTransactionWithEntries = (organizationId, type, referenceNumber, entries, options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield ensureOrganization(organizationId);
    const status = normalizeTransactionStatus(options === null || options === void 0 ? void 0 : options.status);
    const transactionDate = (_a = options === null || options === void 0 ? void 0 : options.transactionDate) !== null && _a !== void 0 ? _a : new Date();
    const { totalDebit } = validateJournalEntries(entries);
    const transactionTotal = typeof (options === null || options === void 0 ? void 0 : options.totalAmount) === "number" ? toMoney(options.totalAmount) : toMoney(totalDebit);
    for (const entry of entries) {
        yield ensureLedgerBelongsToOrg(entry.ledgerAccountId, organizationId);
    }
    const persist = (tx) => __awaiter(void 0, void 0, void 0, function* () {
        if (status !== "DRAFT") {
            yield assertDateInUnlockedPeriod(tx, organizationId, transactionDate);
        }
        const transaction = yield tx.transaction.create({
            data: {
                organizationId,
                type,
                referenceNumber: referenceNumber !== null && referenceNumber !== void 0 ? referenceNumber : undefined,
                contactId: options === null || options === void 0 ? void 0 : options.contactId,
                totalAmount: transactionTotal,
                status,
                transactionDate,
                postedAt: status === "DRAFT" ? null : new Date(),
            },
        });
        yield createJournalEntriesEnforced(tx, transaction.id, entries);
        return transaction;
    });
    if (options === null || options === void 0 ? void 0 : options.tx) {
        return persist(options.tx);
    }
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () { return persist(tx); }));
});
exports.createTransactionWithEntries = createTransactionWithEntries;
const createExpenseTransaction = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!Array.isArray(input.entries) || input.entries.length < 2) {
        throw new AccountingError(400, "entries must be a non-empty array");
    }
    return (0, exports.createTransactionWithEntries)(organizationId, "EXPENSE", (_a = input.referenceNumber) !== null && _a !== void 0 ? _a : null, input.entries, {
        contactId: input.contactId,
        totalAmount: input.totalAmount,
        status: "POSTED",
    });
});
exports.createExpenseTransaction = createExpenseTransaction;
const createAccountingPeriod = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield ensureOrganization(organizationId);
    if (!((_a = input.name) === null || _a === void 0 ? void 0 : _a.trim())) {
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
    const overlapping = yield prisma_1.default.accountingPeriod.findFirst({
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
    return prisma_1.default.accountingPeriod.create({
        data: {
            organizationId,
            name: input.name.trim(),
            startDate,
            endDate,
        },
    });
});
exports.createAccountingPeriod = createAccountingPeriod;
const getAccountingPeriods = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureOrganization(organizationId);
    return prisma_1.default.accountingPeriod.findMany({
        where: { organizationId },
        orderBy: [{ startDate: "desc" }, { endDate: "desc" }],
    });
});
exports.getAccountingPeriods = getAccountingPeriods;
const setAccountingPeriodLock = (organizationId, periodId, isLocked) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureOrganization(organizationId);
    const period = yield prisma_1.default.accountingPeriod.findUnique({
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
        return prisma_1.default.accountingPeriod.findUnique({ where: { id: periodId } });
    }
    return prisma_1.default.accountingPeriod.update({
        where: { id: periodId },
        data: {
            isLocked,
            lockedAt: isLocked ? new Date() : null,
        },
    });
});
exports.setAccountingPeriodLock = setAccountingPeriodLock;
const postTransaction = (organizationId, transactionId) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureOrganization(organizationId);
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const transaction = yield tx.transaction.findUnique({
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
        const entries = transaction.journalEntries.map((entry) => ({
            ledgerAccountId: entry.ledgerAccountId,
            debit: entry.debit ? Number(entry.debit) : 0,
            credit: entry.credit ? Number(entry.credit) : 0,
        }));
        validateJournalEntries(entries);
        yield assertDateInUnlockedPeriod(tx, organizationId, transaction.transactionDate);
        return tx.transaction.update({
            where: { id: transaction.id },
            data: {
                status: "POSTED",
                postedAt: new Date(),
            },
        });
    }));
});
exports.postTransaction = postTransaction;
const createPaymentAllocation = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield ensureOrganization(organizationId);
    if (!((_a = input.transactionId) === null || _a === void 0 ? void 0 : _a.trim()) || !((_b = input.invoiceId) === null || _b === void 0 ? void 0 : _b.trim())) {
        throw new AccountingError(400, "transactionId and invoiceId are required");
    }
    const amount = toMoney(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new AccountingError(400, "amount must be a positive number");
    }
    return prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const transaction = yield tx.transaction.findUnique({
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
        const invoice = yield tx.invoice.findUnique({
            where: { id: input.invoiceId },
            select: { id: true, organizationId: true, totalAmount: true },
        });
        if (!invoice) {
            throw new AccountingError(404, "Invoice not found");
        }
        if (invoice.organizationId !== organizationId) {
            throw new AccountingError(403, "Invoice does not belong to this organization");
        }
        const existingAllocation = yield tx.paymentAllocation.findUnique({
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
        const [transactionAllocSum, invoiceAllocSum] = yield Promise.all([
            tx.paymentAllocation.aggregate({
                where: { transactionId: transaction.id },
                _sum: { amount: true },
            }),
            tx.paymentAllocation.aggregate({
                where: { invoiceId: invoice.id },
                _sum: { amount: true },
            }),
        ]);
        const transactionAllocated = Number((_a = transactionAllocSum._sum.amount) !== null && _a !== void 0 ? _a : 0);
        const invoiceAllocated = Number((_b = invoiceAllocSum._sum.amount) !== null && _b !== void 0 ? _b : 0);
        const transactionRemaining = toMoney(Number(transaction.totalAmount) - transactionAllocated);
        const invoiceRemaining = toMoney(Number(invoice.totalAmount) - invoiceAllocated);
        if (amount > transactionRemaining) {
            throw new AccountingError(400, "Allocation exceeds payment remaining amount");
        }
        if (amount > invoiceRemaining) {
            throw new AccountingError(400, "Allocation exceeds invoice outstanding amount");
        }
        const allocation = yield tx.paymentAllocation.create({
            data: {
                organizationId,
                transactionId: transaction.id,
                invoiceId: invoice.id,
                amount,
            },
        });
        const newTransactionRemaining = toMoney(transactionRemaining - amount);
        if (newTransactionRemaining === 0 && transaction.status === "POSTED") {
            yield tx.transaction.update({
                where: { id: transaction.id },
                data: { status: "PAID" },
            });
        }
        return allocation;
    }));
});
exports.createPaymentAllocation = createPaymentAllocation;
const createLedgerAccount = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    yield ensureOrganization(organizationId);
    if (!((_a = input.name) === null || _a === void 0 ? void 0 : _a.trim())) {
        throw new AccountingError(400, "name is required");
    }
    if (input.code !== undefined && !input.code.trim()) {
        throw new AccountingError(400, "code cannot be empty");
    }
    if (input.parentId) {
        yield ensureLedgerBelongsToOrg(input.parentId, organizationId);
    }
    return prisma_1.default.ledgerAccount.create({
        data: {
            organizationId,
            name: input.name.trim(),
            type: input.type,
            code: (_b = input.code) === null || _b === void 0 ? void 0 : _b.trim(),
            parentId: input.parentId,
            isSystem: (_c = input.isSystem) !== null && _c !== void 0 ? _c : false,
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
});
exports.createLedgerAccount = createLedgerAccount;
const getChartOfAccounts = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureOrganization(organizationId);
    return prisma_1.default.ledgerAccount.findMany({
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
});
exports.getChartOfAccounts = getChartOfAccounts;
const getTrialBalance = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureOrganization(organizationId);
    const grouped = yield prisma_1.default.journalEntry.groupBy({
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
        ? yield prisma_1.default.ledgerAccount.findMany({
            where: { id: { in: ledgerIds }, organizationId },
            select: { id: true, name: true, code: true, type: true },
        })
        : [];
    const ledgerMap = new Map(ledgerAccounts.map((ledger) => [ledger.id, ledger]));
    const ledgers = grouped
        .map((entry) => {
        var _a, _b;
        const ledger = ledgerMap.get(entry.ledgerAccountId);
        if (!ledger) {
            return null;
        }
        const totalDebit = toMoney(Number((_a = entry._sum.debit) !== null && _a !== void 0 ? _a : 0));
        const totalCredit = toMoney(Number((_b = entry._sum.credit) !== null && _b !== void 0 ? _b : 0));
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
        .filter((row) => Boolean(row))
        .sort((a, b) => a.ledgerName.localeCompare(b.ledgerName));
    const totals = ledgers.reduce((acc, row) => ({
        totalDebit: acc.totalDebit + row.totalDebit,
        totalCredit: acc.totalCredit + row.totalCredit,
    }), { totalDebit: 0, totalCredit: 0 });
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
});
exports.getTrialBalance = getTrialBalance;
const getProfitAndLoss = (organizationId, startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    yield ensureOrganization(organizationId);
    const start = toDate(startDate);
    const end = toDate(endDate);
    const entries = yield prisma_1.default.journalEntry.findMany({
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
    const incomeMap = new Map();
    const expenseMap = new Map();
    for (const entry of entries) {
        const ledger = entry.ledgerAccount;
        const debit = Number((_a = entry.debit) !== null && _a !== void 0 ? _a : 0);
        const credit = Number((_b = entry.credit) !== null && _b !== void 0 ? _b : 0);
        if (ledger.type === "INCOME") {
            const amount = credit - debit;
            const current = (_c = incomeMap.get(ledger.id)) !== null && _c !== void 0 ? _c : { name: ledger.name, code: ledger.code, amount: 0 };
            current.amount += amount;
            incomeMap.set(ledger.id, current);
        }
        if (ledger.type === "EXPENSE") {
            const amount = debit - credit;
            const current = (_d = expenseMap.get(ledger.id)) !== null && _d !== void 0 ? _d : { name: ledger.name, code: ledger.code, amount: 0 };
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
            startDate: start !== null && start !== void 0 ? start : null,
            endDate: end !== null && end !== void 0 ? end : null,
        },
        incomeBreakdown: incomeRows,
        expenseBreakdown: expenseRows,
        income: incomeRows,
        expenses: expenseRows,
        totalIncome,
        totalExpense,
        netProfit,
    };
});
exports.getProfitAndLoss = getProfitAndLoss;
const getBalanceSheet = (organizationId, asOfDate) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    yield ensureOrganization(organizationId);
    const asOf = (_a = toDate(asOfDate)) !== null && _a !== void 0 ? _a : new Date();
    const grouped = yield prisma_1.default.journalEntry.groupBy({
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
        ? yield prisma_1.default.ledgerAccount.findMany({
            where: { id: { in: ledgerIds }, organizationId },
            select: { id: true, name: true, code: true, type: true },
        })
        : [];
    const ledgerMap = new Map(ledgers.map((ledger) => [ledger.id, ledger]));
    const assets = [];
    const liabilities = [];
    const equity = [];
    for (const row of grouped) {
        const ledger = ledgerMap.get(row.ledgerAccountId);
        if (!ledger) {
            continue;
        }
        const debit = Number((_b = row._sum.debit) !== null && _b !== void 0 ? _b : 0);
        const credit = Number((_c = row._sum.credit) !== null && _c !== void 0 ? _c : 0);
        let balance = 0;
        if (ledger.type === "ASSET") {
            balance = toMoney(debit - credit);
            assets.push({ ledgerId: ledger.id, ledgerName: ledger.name, ledgerCode: ledger.code, balance });
        }
        else if (ledger.type === "LIABILITY") {
            balance = toMoney(credit - debit);
            liabilities.push({ ledgerId: ledger.id, ledgerName: ledger.name, ledgerCode: ledger.code, balance });
        }
        else if (ledger.type === "EQUITY") {
            balance = toMoney(credit - debit);
            equity.push({ ledgerId: ledger.id, ledgerName: ledger.name, ledgerCode: ledger.code, balance });
        }
    }
    const incomeAndExpense = yield prisma_1.default.journalEntry.findMany({
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
        const debit = Number((_d = entry.debit) !== null && _d !== void 0 ? _d : 0);
        const credit = Number((_e = entry.credit) !== null && _e !== void 0 ? _e : 0);
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
        throw new Error(`Balance Sheet does not balance. Assets: ${totalAssets}, Liabilities: ${totalLiabilities}, Equity: ${totalEquity}. Expected Assets = Liabilities + Equity.`);
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
});
exports.getBalanceSheet = getBalanceSheet;
const getGeneralLedger = (organizationId, ledgerAccountId, startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield ensureOrganization(organizationId);
    const ledger = yield ensureLedgerBelongsToOrg(ledgerAccountId, organizationId);
    const start = toDate(startDate);
    const end = toDate(endDate);
    if (start && end && start > end) {
        throw new AccountingError(400, "startDate cannot be after endDate");
    }
    const balanceDelta = (debit, credit) => {
        if (ledger.type === "ASSET" || ledger.type === "EXPENSE") {
            return toMoney(debit - credit);
        }
        return toMoney(credit - debit);
    };
    const openingSums = yield prisma_1.default.journalEntry.aggregate({
        where: {
            ledgerAccountId,
            transaction: Object.assign({ organizationId }, (start
                ? {
                    transactionDate: {
                        lt: start,
                    },
                }
                : {})),
        },
        _sum: {
            debit: true,
            credit: true,
        },
    });
    const openingBalance = balanceDelta(Number((_a = openingSums._sum.debit) !== null && _a !== void 0 ? _a : 0), Number((_b = openingSums._sum.credit) !== null && _b !== void 0 ? _b : 0));
    const entries = yield prisma_1.default.journalEntry.findMany({
        where: {
            ledgerAccountId,
            transaction: Object.assign({ organizationId }, (start || end
                ? {
                    transactionDate: Object.assign(Object.assign({}, (start ? { gte: start } : {})), (end ? { lte: end } : {})),
                }
                : {})),
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
        var _a, _b;
        const debit = toMoney(Number((_a = entry.debit) !== null && _a !== void 0 ? _a : 0));
        const credit = toMoney(Number((_b = entry.credit) !== null && _b !== void 0 ? _b : 0));
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
            startDate: start !== null && start !== void 0 ? start : null,
            endDate: end !== null && end !== void 0 ? end : null,
        },
        entries: mappedEntries,
    };
});
exports.getGeneralLedger = getGeneralLedger;
const SYSTEM_LEDGERS = {
    AR: { name: "Accounts Receivable", type: "ASSET" },
    AP: { name: "Accounts Payable", type: "LIABILITY" },
    CASH: { name: "Cash / Bank", type: "ASSET" },
    REVENUE: { name: "Revenue", type: "INCOME" },
    EXPENSE: { name: "Expense", type: "EXPENSE" },
    INVENTORY: { name: "Inventory", type: "ASSET" },
};
const ensureSystemAccounts = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const systemAccounts = yield prisma_1.default.ledgerAccount.findMany({
        where: {
            organizationId,
            isSystem: true,
        },
        select: { name: true },
    });
    const existingNames = new Set(systemAccounts.map((a) => a.name));
    for (const [, { name, type }] of Object.entries(SYSTEM_LEDGERS)) {
        if (!existingNames.has(name)) {
            yield prisma_1.default.ledgerAccount.create({
                data: {
                    organizationId,
                    name,
                    type,
                    isSystem: true,
                },
            });
        }
    }
});
const getSystemLedger = (organizationId, ledgerName) => __awaiter(void 0, void 0, void 0, function* () {
    const ledger = yield prisma_1.default.ledgerAccount.findFirst({
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
});
const getAccountsReceivable = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield ensureOrganization(organizationId);
    yield ensureSystemAccounts(organizationId);
    const arLedger = yield getSystemLedger(organizationId, SYSTEM_LEDGERS.AR.name);
    const entries = yield prisma_1.default.journalEntry.aggregate({
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
    const totalDebit = Number((_a = entries._sum.debit) !== null && _a !== void 0 ? _a : 0);
    const totalCredit = Number((_b = entries._sum.credit) !== null && _b !== void 0 ? _b : 0);
    const outstandingAmount = toMoney(totalDebit - totalCredit);
    return {
        ledgerName: arLedger.name,
        totalDebits: toMoney(totalDebit),
        totalCredits: toMoney(totalCredit),
        outstandingAmount: Math.max(0, outstandingAmount),
    };
});
exports.getAccountsReceivable = getAccountsReceivable;
const getAccountsPayable = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield ensureOrganization(organizationId);
    yield ensureSystemAccounts(organizationId);
    const apLedger = yield getSystemLedger(organizationId, SYSTEM_LEDGERS.AP.name);
    const entries = yield prisma_1.default.journalEntry.aggregate({
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
    const totalDebit = Number((_a = entries._sum.debit) !== null && _a !== void 0 ? _a : 0);
    const totalCredit = Number((_b = entries._sum.credit) !== null && _b !== void 0 ? _b : 0);
    const outstandingAmount = toMoney(totalCredit - totalDebit);
    return {
        ledgerName: apLedger.name,
        totalDebits: toMoney(totalDebit),
        totalCredits: toMoney(totalCredit),
        outstandingAmount: Math.max(0, outstandingAmount),
    };
});
exports.getAccountsPayable = getAccountsPayable;
const recordCustomerPayment = (organizationId, customerId, amount, referenceNumber) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureOrganization(organizationId);
    const normalizedAmount = toMoney(amount);
    if (normalizedAmount <= 0) {
        throw new AccountingError(400, "Payment amount must be positive");
    }
    const arLedger = yield getSystemLedger(organizationId, SYSTEM_LEDGERS.AR.name);
    const cashLedger = yield getSystemLedger(organizationId, SYSTEM_LEDGERS.CASH.name);
    return (0, exports.createTransactionWithEntries)(organizationId, "PAYMENT", referenceNumber !== null && referenceNumber !== void 0 ? referenceNumber : `CUST-PAY-${Date.now()}`, [
        { ledgerAccountId: cashLedger.id, debit: normalizedAmount },
        { ledgerAccountId: arLedger.id, credit: normalizedAmount },
    ], { contactId: customerId, totalAmount: normalizedAmount });
});
exports.recordCustomerPayment = recordCustomerPayment;
const recordVendorPayment = (organizationId, vendorId, amount, referenceNumber) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureOrganization(organizationId);
    const normalizedAmount = toMoney(amount);
    if (normalizedAmount <= 0) {
        throw new AccountingError(400, "Payment amount must be positive");
    }
    const apLedger = yield getSystemLedger(organizationId, SYSTEM_LEDGERS.AP.name);
    const cashLedger = yield getSystemLedger(organizationId, SYSTEM_LEDGERS.CASH.name);
    return (0, exports.createTransactionWithEntries)(organizationId, "PAYMENT", referenceNumber !== null && referenceNumber !== void 0 ? referenceNumber : `VEND-PAY-${Date.now()}`, [
        { ledgerAccountId: apLedger.id, debit: normalizedAmount },
        { ledgerAccountId: cashLedger.id, credit: normalizedAmount },
    ], { contactId: vendorId, totalAmount: normalizedAmount });
});
exports.recordVendorPayment = recordVendorPayment;
const getFinanceDashboard = (organizationId, month, year) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    yield ensureOrganization(organizationId);
    yield ensureSystemAccounts(organizationId);
    const now = new Date();
    const targetMonth = month !== null && month !== void 0 ? month : now.getMonth() + 1;
    const targetYear = year !== null && year !== void 0 ? year : now.getFullYear();
    const monthStart = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    const lastMonthStart = new Date(targetYear, targetMonth - 2, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(targetYear, targetMonth - 1, 0, 23, 59, 59, 999);
    const [pnl, lastMonthPnl, ar, ap, cashLedger, expenseLedger] = yield Promise.all([
        (0, exports.getProfitAndLoss)(organizationId, monthStart.toISOString(), monthEnd.toISOString()),
        (0, exports.getProfitAndLoss)(organizationId, lastMonthStart.toISOString(), lastMonthEnd.toISOString()),
        (0, exports.getAccountsReceivable)(organizationId),
        (0, exports.getAccountsPayable)(organizationId),
        getSystemLedger(organizationId, SYSTEM_LEDGERS.CASH.name),
        getSystemLedger(organizationId, SYSTEM_LEDGERS.EXPENSE.name),
    ]);
    const cashEntries = yield prisma_1.default.journalEntry.aggregate({
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
    const payrollEntries = yield prisma_1.default.journalEntry.aggregate({
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
    const cashBalance = toMoney(Number((_a = cashEntries._sum.debit) !== null && _a !== void 0 ? _a : 0) - Number((_b = cashEntries._sum.credit) !== null && _b !== void 0 ? _b : 0));
    const payrollCost = toMoney(Number((_c = payrollEntries._sum.debit) !== null && _c !== void 0 ? _c : 0));
    const inventoryRows = yield prisma_1.default.stockItem.findMany({
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
    const inventoryValue = toMoney(inventoryRows.reduce((sum, item) => { var _a; return sum + item.quantity * Number((_a = item.product.costPrice) !== null && _a !== void 0 ? _a : 0); }, 0));
    const lastMonthRevenue = lastMonthPnl.totalIncome;
    const monthlyGrowthPercent = lastMonthRevenue === 0
        ? 0
        : toMoney((((pnl.totalIncome - lastMonthRevenue) / lastMonthRevenue) * 100));
    const executiveInsights = yield (0, insights_service_1.generateExecutiveInsights)(organizationId);
    const toRiskLines = (entries) => entries
        .filter((entry) => entry.severity === "ALERT" || entry.severity === "WARNING")
        .slice(0, 5)
        .map((entry) => `${entry.title}: ${entry.message}`);
    const executiveNarrativeResult = yield (0, llm_service_1.generateExecutiveNarrativeDetailed)({
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
});
exports.getFinanceDashboard = getFinanceDashboard;
const getAccountingPreferences = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield ensureOrganization(organizationId);
    const rows = yield prisma_1.default.$queryRaw `
		SELECT "defaultInvoicePdfTemplate"
		FROM "Organization"
		WHERE "id" = ${organizationId}
		LIMIT 1
	`;
    if (!rows.length) {
        throw new AccountingError(404, "Organization not found");
    }
    const template = ((_a = rows[0].defaultInvoicePdfTemplate) !== null && _a !== void 0 ? _a : "classic");
    return {
        defaultInvoicePdfTemplate: INVOICE_PDF_TEMPLATES.has(template) ? template : "classic",
    };
});
exports.getAccountingPreferences = getAccountingPreferences;
const setAccountingPreferences = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureOrganization(organizationId);
    if (!input.defaultInvoicePdfTemplate) {
        throw new AccountingError(400, "defaultInvoicePdfTemplate is required");
    }
    const normalized = input.defaultInvoicePdfTemplate.toLowerCase();
    if (!INVOICE_PDF_TEMPLATES.has(normalized)) {
        throw new AccountingError(400, "defaultInvoicePdfTemplate must be one of classic, minimal, detailed");
    }
    yield prisma_1.default.$executeRaw `
		UPDATE "Organization"
		SET "defaultInvoicePdfTemplate" = ${normalized}
		WHERE "id" = ${organizationId}
	`;
    return {
        defaultInvoicePdfTemplate: normalized,
    };
});
exports.setAccountingPreferences = setAccountingPreferences;
