import { Request, Response } from "express";
import {
	activateOrganization,
	assignModulesToPlan,
	createPlan,
	deletePlan,
	generateAdminOrderInvoice,
	getAllOrderHistory,
	getAllOrganizations,
	getAllPlans,
	getAllSubscriptions,
	getOrganizationById,
	HttpError,
	suspendOrganization,
	updatePlan,
} from "./admin.service";

const handleControllerError = (res: Response, error: unknown): void => {
	if (error instanceof HttpError) {
		res.status(error.statusCode).json({ message: error.message });
		return;
	}

	if (error instanceof Error) {
		res.status(500).json({ message: error.message });
		return;
	}

	res.status(500).json({ message: "Internal server error" });
};

const getRequiredParam = (value: string | string[] | undefined, label: string): string => {
	const normalized = Array.isArray(value) ? value[0] : value;

	if (!normalized || !normalized.trim()) {
		throw new HttpError(400, `${label} is required`);
	}

	return normalized;
};

export const getAllOrganizationsController = async (_req: Request, res: Response): Promise<void> => {
	try {
		const organizations = await getAllOrganizations();
		res.status(200).json(organizations);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getOrganizationByIdController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getRequiredParam(req.params.organizationId, "organizationId");
		const organization = await getOrganizationById(organizationId);
		res.status(200).json(organization);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const suspendOrganizationController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getRequiredParam(req.params.organizationId, "organizationId");
		const result = await suspendOrganization(organizationId);
		res.status(200).json(result);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const activateOrganizationController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getRequiredParam(req.params.organizationId, "organizationId");
		const result = await activateOrganization(organizationId);
		res.status(200).json(result);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getAllSubscriptionsController = async (_req: Request, res: Response): Promise<void> => {
	try {
		const subscriptions = await getAllSubscriptions();
		res.status(200).json(subscriptions);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const createPlanController = async (req: Request, res: Response): Promise<void> => {
	try {
		const plan = await createPlan(req.body);
		res.status(201).json(plan);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updatePlanController = async (req: Request, res: Response): Promise<void> => {
	try {
		const planId = getRequiredParam(req.params.id, "id");
		const plan = await updatePlan(planId, req.body);
		res.status(200).json(plan);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const deletePlanController = async (req: Request, res: Response): Promise<void> => {
	try {
		const planId = getRequiredParam(req.params.id, "id");
		const plan = await deletePlan(planId);
		res.status(200).json(plan);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getAllPlansController = async (_req: Request, res: Response): Promise<void> => {
	try {
		const plans = await getAllPlans();
		res.status(200).json(plans);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const assignModulesToPlanController = async (req: Request, res: Response): Promise<void> => {
	try {
		const planId = getRequiredParam(req.params.planId, "planId");
		const { moduleIds } = req.body;

		if (!Array.isArray(moduleIds)) {
			throw new HttpError(400, "moduleIds must be an array of string IDs");
		}

		const plan = await assignModulesToPlan(planId, moduleIds);
		res.status(200).json(plan);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getAllOrderHistoryController = async (_req: Request, res: Response): Promise<void> => {
	try {
		const payments = await getAllOrderHistory();
		res.status(200).json(payments);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const downloadAdminOrderInvoiceController = async (req: Request, res: Response): Promise<void> => {
	try {
		const paymentId = getRequiredParam(req.params.paymentId, "paymentId");
		const invoice = await generateAdminOrderInvoice(paymentId);
		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `attachment; filename=\"${invoice.fileName}\"`);
		res.status(200).send(invoice.buffer);
	} catch (error) {
		handleControllerError(res, error);
	}
};
