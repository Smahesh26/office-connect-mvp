import { Request, Response } from "express";
import {
	createSubscription,
	createRazorpayOrder,
	generateOrganizationOrderInvoice,
	getOrganizationOrderHistory,
	getOrganizationSubscription,
	HttpError,
	TECH_STACK_ADDONS,
	TECH_STACK_CATEGORIES,
	verifyPayment,
} from "./subscription.service";

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

export const createSubscriptionController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			res.status(400).json({ message: "Organization ID is required" });
			return;
		}

		const planId = req.body?.planId as string | undefined;
		if (!planId) {
			res.status(400).json({ message: "planId is required" });
			return;
		}

		const subscription = await createSubscription(organizationId, planId);
		res.status(201).json(subscription);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getTechStackAddonsController = async (_req: Request, res: Response): Promise<void> => {
	res.status(200).json({ addOns: TECH_STACK_ADDONS, categories: TECH_STACK_CATEGORIES });
};

export const getMySubscriptionController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			res.status(400).json({ message: "Organization ID is required" });
			return;
		}

		const subscription = await getOrganizationSubscription(organizationId);
		res.status(200).json(subscription);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const createOrderController = async (req: Request, res: Response): Promise<void> => {
	try {
		const subscriptionId = req.body?.subscriptionId as string | undefined;
		if (!subscriptionId) {
			res.status(400).json({ message: "subscriptionId is required" });
			return;
		}

		const addOns = Array.isArray(req.body?.addOns)
			? req.body.addOns.filter((item: unknown): item is string => typeof item === "string")
			: [];
		const techStack = typeof req.body?.techStack === "string" ? req.body.techStack : undefined;
		const rawStackSelections = req.body?.stackSelections;
		const stackSelections =
			rawStackSelections && typeof rawStackSelections === "object" && !Array.isArray(rawStackSelections)
				? Object.fromEntries(
					Object.entries(rawStackSelections).filter(
						(entry): entry is [string, string] =>
							typeof entry[0] === "string" && typeof entry[1] === "string",
					),
				)
				: undefined;

		const order = await createRazorpayOrder(subscriptionId, { addOns, techStack, stackSelections });
		res.status(201).json(order);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const verifyPaymentController = async (req: Request, res: Response): Promise<void> => {
	try {
		const orderId = req.body?.razorpay_order_id as string | undefined;
		const paymentId = req.body?.razorpay_payment_id as string | undefined;
		const signature = req.body?.razorpay_signature as string | undefined;

		if (!orderId || !paymentId || !signature) {
			res.status(400).json({ message: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required" });
			return;
		}

		const result = await verifyPayment(orderId, paymentId, signature);
		res.status(200).json(result);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getOrderHistoryController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			res.status(400).json({ message: "Organization ID is required" });
			return;
		}

		const payments = await getOrganizationOrderHistory(organizationId);
		res.status(200).json(payments);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const downloadOrderInvoiceController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			res.status(400).json({ message: "Organization ID is required" });
			return;
		}

		const rawPaymentId = req.params?.paymentId;
		const paymentId = Array.isArray(rawPaymentId) ? rawPaymentId[0] : rawPaymentId;
		if (!paymentId) {
			res.status(400).json({ message: "paymentId is required" });
			return;
		}

		const invoice = await generateOrganizationOrderInvoice(organizationId, paymentId);
		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `attachment; filename=\"${invoice.fileName}\"`);
		res.status(200).send(invoice.buffer);
	} catch (error) {
		handleControllerError(res, error);
	}
};
