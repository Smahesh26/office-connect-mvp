import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { moduleGuard } from "../../middleware/module.middleware";
import { requireActiveSubscription } from "../../middleware/subscription.middleware";
import {
	createAccountingPeriodController,
	createExpenseController,
	createLedgerAccountController,
	createPaymentAllocationController,
	createTransactionWithEntriesController,
	getAccountingPreferencesController,
	getAccountingPeriodsController,
	getAccountsPayableController,
	getAccountsReceivableController,
	getBalanceSheetController,
	getChartOfAccountsController,
	getFinanceDashboardController,
	getGeneralLedgerController,
	getProfitAndLossController,
	getTrialBalanceController,
	postTransactionController,
	recordCustomerPaymentController,
	recordVendorPaymentController,
	setAccountingPreferencesController,
	setAccountingPeriodLockController,
} from "./accounting.controller";

const accountingRouter = Router();

accountingRouter.use(authenticateJWT, requireActiveSubscription, moduleGuard("ACCOUNTING"));

accountingRouter.post("/chart-of-accounts", createLedgerAccountController);
accountingRouter.get("/chart-of-accounts", getChartOfAccountsController);

accountingRouter.post("/transactions", createTransactionWithEntriesController);
accountingRouter.post("/transactions/:id/post", postTransactionController);
accountingRouter.post("/expenses", createExpenseController);
accountingRouter.post("/payment-allocations", createPaymentAllocationController);

accountingRouter.post("/periods", createAccountingPeriodController);
accountingRouter.get("/periods", getAccountingPeriodsController);
accountingRouter.patch("/periods/:id/lock", setAccountingPeriodLockController);

accountingRouter.post("/customer-payment", recordCustomerPaymentController);
accountingRouter.post("/vendor-payment", recordVendorPaymentController);

accountingRouter.get("/trial-balance", getTrialBalanceController);
accountingRouter.get("/profit-loss", getProfitAndLossController);
accountingRouter.get("/balance-sheet", getBalanceSheetController);
accountingRouter.get("/general-ledger/:ledgerId", getGeneralLedgerController);
accountingRouter.get("/accounts-receivable", getAccountsReceivableController);
accountingRouter.get("/accounts-payable", getAccountsPayableController);
accountingRouter.get("/dashboard", getFinanceDashboardController);
accountingRouter.get("/preferences", getAccountingPreferencesController);
accountingRouter.patch("/preferences", setAccountingPreferencesController);

export default accountingRouter;
