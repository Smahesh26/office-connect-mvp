import { Request, Response } from "express";
import { AuthError, clearOrganizationProfile, getMe, login, register, updateOrganizationProfile } from "./auth.service";

const handleAuthError = (res: Response, error: unknown): void => {
	if (error instanceof AuthError) {
		res.status(error.statusCode).json({ message: error.message });
		return;
	}

	if (error instanceof Error) {
		res.status(500).json({ message: error.message });
		return;
	}

	res.status(500).json({ message: "Internal server error" });
};

export const registerController = async (req: Request, res: Response): Promise<void> => {
	try {
		const result = await register(req.body);
		res.status(201).json(result);
	} catch (error) {
		handleAuthError(res, error);
	}
};

export const loginController = async (req: Request, res: Response): Promise<void> => {
	try {
		const result = await login(req.body);
		res.status(200).json(result);
	} catch (error) {
		handleAuthError(res, error);
	}
};

export const meController = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const result = await getMe(userId);
		res.status(200).json(result);
	} catch (error) {
		handleAuthError(res, error);
	}
};

export const updateMyOrganizationController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const organization = await updateOrganizationProfile(organizationId, req.body || {});
		res.status(200).json(organization);
	} catch (error) {
		handleAuthError(res, error);
	}
};

export const clearMyOrganizationController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const organization = await clearOrganizationProfile(organizationId);
		res.status(200).json(organization);
	} catch (error) {
		handleAuthError(res, error);
	}
};

