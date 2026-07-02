import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { moduleGuard } from "../../middleware/module.middleware";
import { requireActiveSubscription } from "../../middleware/subscription.middleware";
import {
	cancelInvoiceController,
	createCreditNoteController,
	createInvoiceFromPOSOrderController,
	createManualInvoiceController,
	generateInvoicePDFController,
	getInvoiceFollowUpsController,
	getInvoiceByIdController,
	listInvoicesController,
} from "./invoicing.controller";

const invoicingRouter = Router();

invoicingRouter.use(authenticateJWT, requireActiveSubscription, moduleGuard("ACCOUNTING"));

invoicingRouter.post("/manual", createManualInvoiceController);
invoicingRouter.post("/from-pos-order", createInvoiceFromPOSOrderController);
invoicingRouter.post("/credit-note", createCreditNoteController);
invoicingRouter.post("/cancel", cancelInvoiceController);
invoicingRouter.get("/list", listInvoicesController);
invoicingRouter.get("/follow-ups", getInvoiceFollowUpsController);
invoicingRouter.get("/:invoiceId", getInvoiceByIdController);
invoicingRouter.get("/:invoiceId/pdf", generateInvoicePDFController);

export default invoicingRouter;
