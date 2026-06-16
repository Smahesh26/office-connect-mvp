import { Request, Response } from "express";
import {
	createOrganizationUser,
	deactivateOrganizationUser,
	getMyAccess,
	listOrganizationUsers,
	resetOrganizationUserManagementAndCrmData,
	updateOrganizationUserAccess,
	UserManagementError,
} from "./user-management.service";

const handleError = (res: Response, error: unknown): void => {
	if (error instanceof UserManagementError) {
		res.status(error.statusCode).json({ message: error.message });
		return;
	}

	if (error instanceof Error) {
		res.status(500).json({ message: error.message });
		return;
	}

	res.status(500).json({ message: "Internal server error" });
};

export const listOrganizationUsersController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId || !req.user?.id) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const users = await listOrganizationUsers(req.user.organizationId, req.user.id);
		res.status(200).json(users);
	} catch (error) {
		handleError(res, error);
	}
};

export const createOrganizationUserController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId || !req.user?.id) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const created = await createOrganizationUser(req.user.organizationId, req.user.id, req.body);
		res.status(201).json(created);
	} catch (error) {
		handleError(res, error);
	}
};

export const updateOrganizationUserAccessController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId || !req.user?.id) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const organizationId = Array.isArray(req.user.organizationId) ? req.user.organizationId[0] : req.user.organizationId;
		const requesterId = Array.isArray(req.user.id) ? req.user.id[0] : req.user.id;
		if (!organizationId || !requesterId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
		if (!userId) {
			res.status(400).json({ message: "userId is required" });
			return;
		}

		const result = await updateOrganizationUserAccess(organizationId, requesterId, userId, req.body || {});
		res.status(200).json(result);
	} catch (error) {
		handleError(res, error);
	}
};

export const getMyAccessController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId || !req.user?.id) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const access = await getMyAccess(req.user.organizationId, req.user.id);
		res.status(200).json(access);
	} catch (error) {
		handleError(res, error);
	}
};

export const deactivateOrganizationUserController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId || !req.user?.id) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const organizationId = Array.isArray(req.user.organizationId) ? req.user.organizationId[0] : req.user.organizationId;
		const requesterId = Array.isArray(req.user.id) ? req.user.id[0] : req.user.id;
		if (!organizationId || !requesterId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
		if (!userId) {
			res.status(400).json({ message: "userId is required" });
			return;
		}

		const result = await deactivateOrganizationUser(organizationId, requesterId, userId);
		res.status(200).json(result);
	} catch (error) {
		handleError(res, error);
	}
};

export const resetOrganizationUserManagementAndCrmDataController = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		if (!req.user?.organizationId || !req.user?.id) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const organizationId = Array.isArray(req.user.organizationId) ? req.user.organizationId[0] : req.user.organizationId;
		const requesterId = Array.isArray(req.user.id) ? req.user.id[0] : req.user.id;
		if (!organizationId || !requesterId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const result = await resetOrganizationUserManagementAndCrmData(organizationId, requesterId);
		res.status(200).json(result);
	} catch (error) {
		handleError(res, error);
	}
};
