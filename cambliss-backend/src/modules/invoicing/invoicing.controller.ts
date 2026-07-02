import { Request, Response } from "express";
import {
	cancelInvoice,
	createCreditNoteFromInvoice,
	createInvoiceFromPOSOrder,
	createManualInvoice,
	CreateManualInvoiceInput,
	generateInvoicePDF,
	getInvoiceFollowUps,
	InvoiceError,
	getInvoiceById,
	listInvoices,
} from "./invoicing.service";

const handleError = (res: Response, error: unknown): void => {
	if (error instanceof InvoiceError) {
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
		throw new InvoiceError(401, "Unauthorized");
	}
	return organizationId;
};

export const createInvoiceFromPOSOrderController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const { posOrderId } = req.body as { posOrderId: string };
		const invoice = await createInvoiceFromPOSOrder(organizationId, posOrderId);
		res.status(201).json(invoice);
	} catch (error) {
		handleError(res, error);
	}
};

export const createManualInvoiceController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const invoice = await createManualInvoice(organizationId, req.body as CreateManualInvoiceInput);
		res.status(201).json(invoice);
	} catch (error) {
		handleError(res, error);
	}
};

export const getInvoiceByIdController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const { invoiceId } = req.params as { invoiceId: string };
		const invoice = await getInvoiceById(organizationId, invoiceId);
		res.status(200).json(invoice);
	} catch (error) {
		handleError(res, error);
	}
};

export const cancelInvoiceController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const { invoiceId } = req.body as { invoiceId: string };
		const invoice = await cancelInvoice(organizationId, invoiceId);
		res.status(200).json(invoice);
	} catch (error) {
		handleError(res, error);
	}
};

export const generateInvoicePDFController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const { invoiceId } = req.params as { invoiceId: string };
		const templateRaw = Array.isArray(req.query.template) ? req.query.template[0] : req.query.template;
		const template =
			templateRaw === "minimal" || templateRaw === "detailed" || templateRaw === "classic"
				? templateRaw
				: "classic";

		const result = await generateInvoicePDF(organizationId, invoiceId, { template });

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `inline; filename=\"${result.fileName}\"`);
		res.status(200).send(result.buffer);
	} catch (error) {
		handleError(res, error);
	}
};

export const listInvoicesController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const status = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
		const customerId = Array.isArray(req.query.customerId) ? req.query.customerId[0] : req.query.customerId;
		const overdueOnlyRaw = Array.isArray(req.query.overdueOnly) ? req.query.overdueOnly[0] : req.query.overdueOnly;

		const invoices = await listInvoices(organizationId, {
			status: typeof status === "string" ? status : undefined,
			customerId: typeof customerId === "string" ? customerId : undefined,
			overdueOnly: overdueOnlyRaw === "true",
		});

		res.status(200).json(invoices);
	} catch (error) {
		handleError(res, error);
	}
};

export const createCreditNoteController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const { invoiceId, amount, reason } = req.body as {
			invoiceId: string;
			amount?: number;
			reason?: string;
		};

		const result = await createCreditNoteFromInvoice(organizationId, {
			invoiceId,
			amount,
			reason,
		});

		res.status(201).json(result);
	} catch (error) {
		handleError(res, error);
	}
};

export const getInvoiceFollowUpsController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const daysRaw = Array.isArray(req.query.afterDays) ? req.query.afterDays[0] : req.query.afterDays;
		const parsed = typeof daysRaw === "string" ? parseInt(daysRaw, 10) : undefined;
		const afterDays = parsed && !Number.isNaN(parsed) ? parsed : 30;

		const followUps = await getInvoiceFollowUps(organizationId, afterDays);
		res.status(200).json(followUps);
	} catch (error) {
		handleError(res, error);
	}
};
