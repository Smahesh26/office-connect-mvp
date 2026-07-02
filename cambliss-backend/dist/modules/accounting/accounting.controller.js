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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAccountingPreferencesController = exports.getAccountingPreferencesController = exports.recordVendorPaymentController = exports.recordCustomerPaymentController = exports.createExpenseController = exports.createPaymentAllocationController = exports.postTransactionController = exports.setAccountingPeriodLockController = exports.getAccountingPeriodsController = exports.createAccountingPeriodController = exports.createTransactionWithEntriesController = exports.getFinanceDashboardController = exports.getAccountsPayableController = exports.getAccountsReceivableController = exports.getGeneralLedgerController = exports.getBalanceSheetController = exports.getProfitAndLossController = exports.getTrialBalanceController = exports.getChartOfAccountsController = exports.createLedgerAccountController = void 0;
const accounting_service_1 = require("./accounting.service");
const handleAccountingError = (res, error) => {
    if (error instanceof accounting_service_1.AccountingError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: "Internal server error" });
};
const getOrganizationId = (req) => {
    var _a;
    const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
    if (!organizationId) {
        throw new accounting_service_1.AccountingError(401, "Unauthorized");
    }
    return organizationId;
};
const getRequiredParam = (value, label) => {
    const normalized = Array.isArray(value) ? value[0] : value;
    if (!normalized || !normalized.trim()) {
        throw new accounting_service_1.AccountingError(400, `${label} is required`);
    }
    return normalized;
};
const createLedgerAccountController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const account = yield (0, accounting_service_1.createLedgerAccount)(organizationId, req.body);
        res.status(201).json(account);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.createLedgerAccountController = createLedgerAccountController;
const getChartOfAccountsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const chart = yield (0, accounting_service_1.getChartOfAccounts)(organizationId);
        res.status(200).json(chart);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.getChartOfAccountsController = getChartOfAccountsController;
const getTrialBalanceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const trial = yield (0, accounting_service_1.getTrialBalance)(organizationId);
        res.status(200).json(trial);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.getTrialBalanceController = getTrialBalanceController;
const getProfitAndLossController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const startDate = Array.isArray(req.query.startDate) ? req.query.startDate[0] : req.query.startDate;
        const endDate = Array.isArray(req.query.endDate) ? req.query.endDate[0] : req.query.endDate;
        const pnl = yield (0, accounting_service_1.getProfitAndLoss)(organizationId, typeof startDate === "string" ? startDate : undefined, typeof endDate === "string" ? endDate : undefined);
        res.status(200).json(pnl);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.getProfitAndLossController = getProfitAndLossController;
const getBalanceSheetController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const asOfDate = Array.isArray(req.query.asOfDate) ? req.query.asOfDate[0] : req.query.asOfDate;
        const balanceSheet = yield (0, accounting_service_1.getBalanceSheet)(organizationId, typeof asOfDate === "string" ? asOfDate : undefined);
        res.status(200).json(balanceSheet);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.getBalanceSheetController = getBalanceSheetController;
const getGeneralLedgerController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const ledgerId = getRequiredParam(req.params.ledgerId, "ledgerId");
        const startDate = Array.isArray(req.query.startDate) ? req.query.startDate[0] : req.query.startDate;
        const endDate = Array.isArray(req.query.endDate) ? req.query.endDate[0] : req.query.endDate;
        const ledger = yield (0, accounting_service_1.getGeneralLedger)(organizationId, ledgerId, typeof startDate === "string" ? startDate : undefined, typeof endDate === "string" ? endDate : undefined);
        res.status(200).json(ledger);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.getGeneralLedgerController = getGeneralLedgerController;
const getAccountsReceivableController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const data = yield (0, accounting_service_1.getAccountsReceivable)(organizationId);
        res.status(200).json(data);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.getAccountsReceivableController = getAccountsReceivableController;
const getAccountsPayableController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const data = yield (0, accounting_service_1.getAccountsPayable)(organizationId);
        res.status(200).json(data);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.getAccountsPayableController = getAccountsPayableController;
const getFinanceDashboardController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const monthRaw = Array.isArray(req.query.month) ? req.query.month[0] : req.query.month;
        const yearRaw = Array.isArray(req.query.year) ? req.query.year[0] : req.query.year;
        const month = monthRaw && typeof monthRaw === "string" ? parseInt(monthRaw, 10) : undefined;
        const year = yearRaw && typeof yearRaw === "string" ? parseInt(yearRaw, 10) : undefined;
        if ((month && (isNaN(month) || month < 1 || month > 12)) || (year && isNaN(year))) {
            throw new accounting_service_1.AccountingError(400, "month must be 1-12, year must be a valid number");
        }
        const data = yield (0, accounting_service_1.getFinanceDashboard)(organizationId, month, year);
        res.status(200).json(data);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.getFinanceDashboardController = getFinanceDashboardController;
const createTransactionWithEntriesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const { type, referenceNumber, entries, contactId, totalAmount, status, transactionDate } = req.body;
        if (!type) {
            throw new accounting_service_1.AccountingError(400, "type is required");
        }
        const transaction = yield (0, accounting_service_1.createTransactionWithEntries)(organizationId, type, referenceNumber !== null && referenceNumber !== void 0 ? referenceNumber : null, entries, {
            contactId,
            totalAmount,
            status: status,
            transactionDate: transactionDate ? new Date(transactionDate) : undefined,
        });
        res.status(201).json(transaction);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.createTransactionWithEntriesController = createTransactionWithEntriesController;
const createAccountingPeriodController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const period = yield (0, accounting_service_1.createAccountingPeriod)(organizationId, req.body);
        res.status(201).json(period);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.createAccountingPeriodController = createAccountingPeriodController;
const getAccountingPeriodsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const periods = yield (0, accounting_service_1.getAccountingPeriods)(organizationId);
        res.status(200).json(periods);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.getAccountingPeriodsController = getAccountingPeriodsController;
const setAccountingPeriodLockController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const periodId = getRequiredParam(req.params.id, "id");
        const { isLocked } = req.body;
        if (typeof isLocked !== "boolean") {
            throw new accounting_service_1.AccountingError(400, "isLocked must be a boolean");
        }
        const period = yield (0, accounting_service_1.setAccountingPeriodLock)(organizationId, periodId, isLocked);
        res.status(200).json(period);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.setAccountingPeriodLockController = setAccountingPeriodLockController;
const postTransactionController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const transactionId = getRequiredParam(req.params.id, "id");
        const transaction = yield (0, accounting_service_1.postTransaction)(organizationId, transactionId);
        res.status(200).json(transaction);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.postTransactionController = postTransactionController;
const createPaymentAllocationController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const { transactionId, invoiceId, amount } = req.body;
        const allocation = yield (0, accounting_service_1.createPaymentAllocation)(organizationId, { transactionId, invoiceId, amount });
        res.status(201).json(allocation);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.createPaymentAllocationController = createPaymentAllocationController;
const createExpenseController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const transaction = yield (0, accounting_service_1.createExpenseTransaction)(organizationId, req.body);
        res.status(201).json(transaction);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.createExpenseController = createExpenseController;
const recordCustomerPaymentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const { customerId, amount, referenceNumber } = req.body;
        if (!customerId) {
            throw new accounting_service_1.AccountingError(400, "customerId is required");
        }
        if (!amount || amount <= 0) {
            throw new accounting_service_1.AccountingError(400, "amount must be a positive number");
        }
        const transaction = yield (0, accounting_service_1.recordCustomerPayment)(organizationId, customerId, amount, referenceNumber);
        res.status(201).json(transaction);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.recordCustomerPaymentController = recordCustomerPaymentController;
const recordVendorPaymentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const { vendorId, amount, referenceNumber } = req.body;
        if (!vendorId) {
            throw new accounting_service_1.AccountingError(400, "vendorId is required");
        }
        if (!amount || amount <= 0) {
            throw new accounting_service_1.AccountingError(400, "amount must be a positive number");
        }
        const transaction = yield (0, accounting_service_1.recordVendorPayment)(organizationId, vendorId, amount, referenceNumber);
        res.status(201).json(transaction);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.recordVendorPaymentController = recordVendorPaymentController;
const getAccountingPreferencesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const preferences = yield (0, accounting_service_1.getAccountingPreferences)(organizationId);
        res.status(200).json(preferences);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.getAccountingPreferencesController = getAccountingPreferencesController;
const setAccountingPreferencesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const { defaultInvoicePdfTemplate } = req.body;
        const preferences = yield (0, accounting_service_1.setAccountingPreferences)(organizationId, { defaultInvoicePdfTemplate });
        res.status(200).json(preferences);
    }
    catch (error) {
        handleAccountingError(res, error);
    }
});
exports.setAccountingPreferencesController = setAccountingPreferencesController;
