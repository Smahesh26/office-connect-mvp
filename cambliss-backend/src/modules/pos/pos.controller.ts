import { Request, Response } from "express";
import {
	closePOSSession,
	createPOSOrder,
	createPOSTerminal,
	CreatePOSOrderInput,
	generateZReport,
	POSError,
	startPOSSession,
} from "./pos.service";

const handleError = (res: Response, error: unknown): void => {
	if (error instanceof POSError) {
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
		throw new POSError(401, "Unauthorized");
	}
	return organizationId;
};

export const createPOSTerminalController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const terminal = await createPOSTerminal(organizationId, req.body as { name: string; location?: string });
		res.status(201).json(terminal);
	} catch (error) {
		handleError(res, error);
	}
};

export const startPOSSessionController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const { terminalId, openingCash } = req.body as { terminalId: string; openingCash: number };

		const openedBy = req.user?.id ?? req.user?.email ?? "SYSTEM";

		const session = await startPOSSession(organizationId, {
			terminalId,
			openedBy,
			openingCash,
		});

		res.status(201).json(session);
	} catch (error) {
		handleError(res, error);
	}
};

export const createPOSOrderController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const order = await createPOSOrder(organizationId, req.body as CreatePOSOrderInput);
		res.status(201).json(order);
	} catch (error) {
		handleError(res, error);
	}
};

export const closePOSSessionController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const { sessionId, closingCash } = req.body as { sessionId: string; closingCash: number };
		const result = await closePOSSession(organizationId, sessionId, closingCash);
		res.status(200).json(result);
	} catch (error) {
		handleError(res, error);
	}
};

export const generateZReportController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const sessionIdParam = req.params.sessionId;
		const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;
		if (!sessionId?.trim()) {
			throw new POSError(400, "sessionId is required");
		}
		const report = await generateZReport(organizationId, sessionId);
		res.status(200).json(report);
	} catch (error) {
		handleError(res, error);
	}
};
