import { Request, Response } from "express";
import {
	AccountingError,
	createAccountingPeriod,
	createExpenseTransaction,
	createLedgerAccount,
	createPaymentAllocation,
	createTransactionWithEntries,
	getAccountingPeriods,
	getAccountsPayable,
	getAccountsReceivable,
	getBalanceSheet,
	getChartOfAccounts,
	getFinanceDashboard,
	getGeneralLedger,
	getAccountingPreferences,
	getProfitAndLoss,
	getTrialBalance,
	postTransaction,
	recordCustomerPayment,
	recordVendorPayment,
	setAccountingPreferences,
	setAccountingPeriodLock,
} from "./accounting.service";

const handleAccountingError = (res: Response, error: unknown): void => {
	if (error instanceof AccountingError) {
		res.status(error.statusCode).json({ message: error.message });
		return;
	}

	if (error instanceof Error) {
		res.status(500).json({ message: error.message });
		return;
	}

	res.status(500).json({ message: "Internal server error" });
};

const getOrganizationId = (req: Request): string => {
	const organizationId = req.user?.organizationId;
	if (!organizationId) {
		throw new AccountingError(401, "Unauthorized");
	}

	return organizationId;
};

const getRequiredParam = (value: string | string[] | undefined, label: string): string => {
	const normalized = Array.isArray(value) ? value[0] : value;
	if (!normalized || !normalized.trim()) {
		throw new AccountingError(400, `${label} is required`);
	}
	return normalized;
};

export const createLedgerAccountController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const account = await createLedgerAccount(organizationId, req.body);
		res.status(201).json(account);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const getChartOfAccountsController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const chart = await getChartOfAccounts(organizationId);
		res.status(200).json(chart);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const getTrialBalanceController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const trial = await getTrialBalance(organizationId);
		res.status(200).json(trial);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const getProfitAndLossController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const startDate = Array.isArray(req.query.startDate) ? req.query.startDate[0] : req.query.startDate;
		const endDate = Array.isArray(req.query.endDate) ? req.query.endDate[0] : req.query.endDate;
		const pnl = await getProfitAndLoss(
			organizationId,
			typeof startDate === "string" ? startDate : undefined,
			typeof endDate === "string" ? endDate : undefined,
		);
		res.status(200).json(pnl);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const getBalanceSheetController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const asOfDate = Array.isArray(req.query.asOfDate) ? req.query.asOfDate[0] : req.query.asOfDate;
		const balanceSheet = await getBalanceSheet(
			organizationId,
			typeof asOfDate === "string" ? asOfDate : undefined,
		);
		res.status(200).json(balanceSheet);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const getGeneralLedgerController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const ledgerId = getRequiredParam(req.params.ledgerId, "ledgerId");
		const startDate = Array.isArray(req.query.startDate) ? req.query.startDate[0] : req.query.startDate;
		const endDate = Array.isArray(req.query.endDate) ? req.query.endDate[0] : req.query.endDate;
		const ledger = await getGeneralLedger(
			organizationId,
			ledgerId,
			typeof startDate === "string" ? startDate : undefined,
			typeof endDate === "string" ? endDate : undefined,
		);
		res.status(200).json(ledger);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const getAccountsReceivableController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const data = await getAccountsReceivable(organizationId);
		res.status(200).json(data);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const getAccountsPayableController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const data = await getAccountsPayable(organizationId);
		res.status(200).json(data);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const getFinanceDashboardController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const monthRaw = Array.isArray(req.query.month) ? req.query.month[0] : req.query.month;
		const yearRaw = Array.isArray(req.query.year) ? req.query.year[0] : req.query.year;

		const month = monthRaw && typeof monthRaw === "string" ? parseInt(monthRaw, 10) : undefined;
		const year = yearRaw && typeof yearRaw === "string" ? parseInt(yearRaw, 10) : undefined;

		if ((month && (isNaN(month) || month < 1 || month > 12)) || (year && isNaN(year))) {
			throw new AccountingError(400, "month must be 1-12, year must be a valid number");
		}

		const data = await getFinanceDashboard(organizationId, month, year);
		res.status(200).json(data);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const createTransactionWithEntriesController = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const { type, referenceNumber, entries, contactId, totalAmount, status, transactionDate } = req.body as {
			type: "SALE" | "PURCHASE" | "EXPENSE" | "PAYMENT" | "REFUND";
			referenceNumber?: string;
			entries: Array<{ ledgerAccountId: string; debit?: number; credit?: number }>;
			contactId?: string;
			totalAmount?: number;
			status?: string;
			transactionDate?: string;
		};

		if (!type) {
			throw new AccountingError(400, "type is required");
		}

		const transaction = await createTransactionWithEntries(
			organizationId,
			type,
			referenceNumber ?? null,
			entries,
			{
				contactId,
				totalAmount,
				status: status as "DRAFT" | "POSTED" | "PAID" | "REVERSED" | undefined,
				transactionDate: transactionDate ? new Date(transactionDate) : undefined,
			},
		);

		res.status(201).json(transaction);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const createAccountingPeriodController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const period = await createAccountingPeriod(organizationId, req.body);
		res.status(201).json(period);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const getAccountingPeriodsController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const periods = await getAccountingPeriods(organizationId);
		res.status(200).json(periods);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const setAccountingPeriodLockController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const periodId = getRequiredParam(req.params.id, "id");
		const { isLocked } = req.body as { isLocked: boolean };

		if (typeof isLocked !== "boolean") {
			throw new AccountingError(400, "isLocked must be a boolean");
		}

		const period = await setAccountingPeriodLock(organizationId, periodId, isLocked);
		res.status(200).json(period);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const postTransactionController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const transactionId = getRequiredParam(req.params.id, "id");
		const transaction = await postTransaction(organizationId, transactionId);
		res.status(200).json(transaction);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const createPaymentAllocationController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const { transactionId, invoiceId, amount } = req.body as {
			transactionId: string;
			invoiceId: string;
			amount: number;
		};

		const allocation = await createPaymentAllocation(organizationId, { transactionId, invoiceId, amount });
		res.status(201).json(allocation);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const createExpenseController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const transaction = await createExpenseTransaction(organizationId, req.body);
		res.status(201).json(transaction);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const recordCustomerPaymentController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const { customerId, amount, referenceNumber } = req.body as {
			customerId: string;
			amount: number;
			referenceNumber?: string;
		};

		if (!customerId) {
			throw new AccountingError(400, "customerId is required");
		}

		if (!amount || amount <= 0) {
			throw new AccountingError(400, "amount must be a positive number");
		}

		const transaction = await recordCustomerPayment(organizationId, customerId, amount, referenceNumber);
		res.status(201).json(transaction);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const recordVendorPaymentController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const { vendorId, amount, referenceNumber } = req.body as {
			vendorId: string;
			amount: number;
			referenceNumber?: string;
		};

		if (!vendorId) {
			throw new AccountingError(400, "vendorId is required");
		}

		if (!amount || amount <= 0) {
			throw new AccountingError(400, "amount must be a positive number");
		}

		const transaction = await recordVendorPayment(organizationId, vendorId, amount, referenceNumber);
		res.status(201).json(transaction);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const getAccountingPreferencesController = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const preferences = await getAccountingPreferences(organizationId);
		res.status(200).json(preferences);
	} catch (error) {
		handleAccountingError(res, error);
	}
};

export const setAccountingPreferencesController = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const { defaultInvoicePdfTemplate } = req.body as { defaultInvoicePdfTemplate?: string };
		const preferences = await setAccountingPreferences(organizationId, { defaultInvoicePdfTemplate });
		res.status(200).json(preferences);
	} catch (error) {
		handleAccountingError(res, error);
	}
};
